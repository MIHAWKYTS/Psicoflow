export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { createJob, updateJob } from "@/lib/reminder-jobs";
import { v4 as uuidv4 } from "uuid";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  return delay(1000 + Math.random() * 1000); // 1–2 s
}

// BRT = UTC-3
function getBRTBounds(dateStr?: string) {
  const now = new Date();
  const brtOffset = -3 * 60 * 60 * 1000;

  let targetDate: Date;
  if (dateStr) {
    // Parse the provided YYYY-MM-DD as a BRT calendar date
    const [y, m, d] = dateStr.split("-").map(Number);
    targetDate = new Date(Date.UTC(y, m - 1, d));
  } else {
    const brtNow = new Date(now.getTime() + brtOffset);
    targetDate = new Date(
      Date.UTC(brtNow.getUTCFullYear(), brtNow.getUTCMonth(), brtNow.getUTCDate())
    );
  }

  const startUTC = new Date(targetDate.getTime() - brtOffset); // 03:00 UTC = 00:00 BRT
  const endUTC = new Date(startUTC.getTime() + 86399999);       // 02:59:59 UTC next day

  // If the target date is today (BRT), use now as lower bound to skip past sessions
  const brtNow = new Date(now.getTime() + brtOffset);
  const todayUTC = new Date(
    Date.UTC(brtNow.getUTCFullYear(), brtNow.getUTCMonth(), brtNow.getUTCDate())
  );
  const isToday = targetDate.getTime() === todayUTC.getTime();

  return {
    start: isToday ? now : startUTC,
    end: endUTC,
  };
}

async function processReminders(jobId: string, tenantId: string, dateStr?: string) {
  try {
    const { start, end } = getBRTBounds(dateStr);

    const sessions = await prisma.session.findMany({
      where: {
        tenantId,
        status: "agendada",
        lembreteEnviado: false,
        dataHoraInicio: { gte: start, lte: end },
      },
      include: {
        patient: { select: { id: true, nome: true, telefoneWhatsapp: true } },
      },
    });

    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;

    if (!evolutionUrl || !evolutionKey) {
      updateJob(jobId, { status: "error", error: "Configuração da Evolution API ausente" });
      return;
    }

    const instance = await prisma.whatsAppInstance.findFirst({
      where: { tenantId, statusConexao: "conectado" },
      select: { instanceName: true },
    });

    if (!instance) {
      updateJob(jobId, { status: "error", error: "Nenhuma instância WhatsApp conectada para este tenant" });
      return;
    }

    let sent = 0;
    let skipped = 0;

    for (const session of sessions) {
      const phone = session.patient?.telefoneWhatsapp;

      if (!phone) {
        skipped++;
        updateJob(jobId, { sent, skipped });
        continue;
      }

      try {
        const digits = phone.replace(/\D/g, "");
        await fetch(`${evolutionUrl}/message/sendText/${instance.instanceName}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: evolutionKey,
          },
          body: JSON.stringify({
            number: `55${digits}`,
            text: `Olá, ${session.patient?.nome ?? "paciente"}! Gostaria de confirmar a sessão que está marcada para ${new Date(session.dataHoraInicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}. Podemos confirmar?`,
          }),
        });

        await prisma.session.update({
          where: { id: session.id },
          data: { lembreteEnviado: true },
        });

        sent++;
      } catch {
        skipped++;
      }

      updateJob(jobId, { sent, skipped });
      await randomDelay();
    }

    updateJob(jobId, { sent, skipped, status: "done" });
  } catch (err) {
    updateJob(jobId, { status: "error", error: String(err) });
  }
}

// ─── POST /api/whatsapp/send-reminders ───────────────────────
export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    const body = await req.json().catch(() => ({}));
    const dateStr: string | undefined = body?.date;

    const { start, end } = getBRTBounds(dateStr);

    const eligible = await prisma.session.count({
      where: {
        tenantId: ctx.tenantId,
        status: "agendada",
        lembreteEnviado: false,
        dataHoraInicio: { gte: start, lte: end },
      },
    });

    if (eligible === 0) {
      return errorResponse("Nenhuma sessão elegível para lembrete.", 422);
    }

    const jobId = uuidv4();
    createJob(jobId, eligible);

    processReminders(jobId, ctx.tenantId, dateStr).catch(console.error);

    return successResponse({ jobId, total: eligible });
  });
}
