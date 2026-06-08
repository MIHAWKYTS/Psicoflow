export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { createJob, updateJob } from "@/lib/reminder-jobs";
import { v4 as uuidv4 } from "uuid";
import { startOfDay, endOfDay, subHours } from "date-fns";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  return delay(3000 + Math.random() * 2000);
}

// BRT = UTC-3
function getBRTBounds() {
  const now = new Date();
  const brtOffset = -3 * 60 * 60 * 1000;
  const brtNow = new Date(now.getTime() + brtOffset);
  const brtMidnight = new Date(
    Date.UTC(brtNow.getUTCFullYear(), brtNow.getUTCMonth(), brtNow.getUTCDate())
  );
  return {
    start: new Date(brtMidnight.getTime() - brtOffset),        // 03:00 UTC
    end: new Date(brtMidnight.getTime() - brtOffset + 86399999), // next 02:59:59 UTC
  };
}

async function processReminders(jobId: string, tenantId: string) {
  try {
    const { start, end } = getBRTBounds();

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
            text: `Olá, ${session.patient?.nome ?? "paciente"}! Este é um lembrete da sua consulta agendada para hoje. Até breve! 🌿`,
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
export async function POST(_req: NextRequest) {
  return withAuth(async (ctx) => {
    const { start, end } = getBRTBounds();

    const eligible = await prisma.session.count({
      where: {
        tenantId: ctx.tenantId,
        status: "agendada",
        lembreteEnviado: false,
        dataHoraInicio: { gte: start, lte: end },
      },
    });

    if (eligible === 0) {
      return errorResponse("Nenhuma sessão elegível para lembrete hoje.", 422);
    }

    const jobId = uuidv4();
    createJob(jobId, eligible);

    // fire-and-forget
    processReminders(jobId, ctx.tenantId).catch(console.error);

    return successResponse({ jobId, total: eligible });
  });
}
