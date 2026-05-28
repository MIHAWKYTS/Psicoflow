import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// ─── In-Memory Job Store ─────────────────────────────────────────────────────
// Armazena o estado dos jobs de disparo em memória (por processo Node.js).
// Aceitável para o volume de um consultório (< 20 pacientes/dia por tenant).

export interface ReminderJob {
  total: number;
  sent: number;
  skipped: number;
  status: "running" | "done" | "error";
  errorMessage?: string;
}

// Map global compartilhado entre requisições na mesma instância Node.js
export const reminderJobs = new Map<string, ReminderJob>();

// ─── Helper: delay aleatório anti-banimento ───────────────────────────────────
function randomDelay(minMs = 3000, maxMs = 5000): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((r) => setTimeout(r, ms));
}

// ─── POST /api/whatsapp/send-reminders ───────────────────────────────────────
export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    // 5.2 — Verificar variáveis de ambiente obrigatórias
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;

    if (!evolutionUrl || !evolutionKey) {
      return errorResponse(
        "Configuração da Evolution API ausente. Defina EVOLUTION_API_URL e EVOLUTION_API_KEY no ambiente.",
        500
      );
    }

    // 5.3 — Buscar instância WhatsApp conectada do tenant
    const instance = await prisma.whatsAppInstance.findFirst({
      where: {
        tenantId: ctx.tenantId,
        statusConexao: "conectado",
      },
    });

    if (!instance) {
      return errorResponse(
        "Nenhuma instância WhatsApp conectada encontrada. Conecte o WhatsApp antes de disparar lembretes.",
        422
      );
    }

    // 5.4 — Buscar sessões do dia com lembrete pendente
    const hoje = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
    const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

    const sessoesDoDia = await prisma.session.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: "agendada",
        lembreteEnviado: false,
        dataHoraInicio: {
          gte: inicioDia,
          lte: fimDia,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            nome: true,
            telefoneWhatsapp: true,
          },
        },
      },
      orderBy: { dataHoraInicio: "asc" },
    });

    const total = sessoesDoDia.length;

    // 5.5 — Gerar jobId e registrar no Map
    const jobId = `${ctx.tenantId}-${Date.now()}`;
    const job: ReminderJob = {
      total,
      sent: 0,
      skipped: 0,
      status: "running",
    };
    reminderJobs.set(jobId, job);

    // Responde imediatamente com o jobId para o cliente iniciar polling
    // O loop assíncrono roda em background (sem await na resposta)
    dispatchReminders({
      sessions: sessoesDoDia,
      instance,
      evolutionUrl,
      evolutionKey,
      jobId,
      job,
    }).catch((err) => {
      console.error("[send-reminders] Erro inesperado no loop:", err);
      const j = reminderJobs.get(jobId);
      if (j) {
        j.status = "error";
        j.errorMessage = "Erro inesperado durante o disparo.";
      }
    });

    return successResponse(
      { jobId, total },
      `Disparo iniciado: ${total} sessão(ões) agendada(s) para hoje.`
    );
  });
}

// ─── Loop assíncrono de disparo (roda sem bloquear a resposta HTTP) ───────────
type SessionWithPatient = Awaited<
  ReturnType<typeof prisma.session.findMany<{ include: { patient: { select: { id: true; nome: true; telefoneWhatsapp: true } } } }>>
>[number];

interface DispatchOptions {
  sessions: SessionWithPatient[];
  instance: { instanceName: string };
  evolutionUrl: string;
  evolutionKey: string;
  jobId: string;
  job: ReminderJob;
}

async function dispatchReminders({
  sessions,
  instance,
  evolutionUrl,
  evolutionKey,
  jobId,
  job,
}: DispatchOptions) {
  for (const sessao of sessions) {
    const patient = sessao.patient;

    // 5.8 — Pular pacientes sem telefone WhatsApp
    if (!patient?.telefoneWhatsapp) {
      job.skipped += 1;
      continue;
    }

    // Formatar hora da sessão para exibição no lembrete
    const horaFormatada = sessao.dataHoraInicio.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });

    const mensagem =
      `Olá, ${patient.nome}! 👋\n\n` +
      `Este é um lembrete da sua sessão de psicologia hoje às *${horaFormatada}*.\n\n` +
      `Aguardamos você! Qualquer dúvida, responda essa mensagem.`;

    try {
      // 5.6 — Chamar Evolution API
      const url = `${evolutionUrl}/message/sendText/${instance.instanceName}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: evolutionKey,
        },
        body: JSON.stringify({
          number: patient.telefoneWhatsapp,
          options: { delay: 1200, presence: "composing" },
          textMessage: { text: mensagem },
        }),
      });

      if (res.ok) {
        // 5.7 — Marcar lembrete como enviado no banco
        await prisma.session.update({
          where: { id: sessao.id },
          data: { lembreteEnviado: true },
        });
        job.sent += 1;
      } else {
        console.warn(
          `[send-reminders] Falha ao enviar para ${patient.nome}: HTTP ${res.status}`
        );
        job.skipped += 1;
      }
    } catch (fetchErr) {
      console.error(`[send-reminders] Erro na chamada à API para sessão ${sessao.id}:`, fetchErr);
      job.skipped += 1;
    }

    // 5.6 — Delay anti-banimento: 3–5 segundos entre cada envio
    await randomDelay(3000, 5000);
  }

  // 5.9 — Marcar job como concluído
  job.status = "done";
  reminderJobs.set(jobId, job);

  console.log(
    `[send-reminders] Job ${jobId} concluído: ${job.sent} enviados, ${job.skipped} ignorados.`
  );
}
