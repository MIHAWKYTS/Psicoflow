import { addHours, isAfter } from "date-fns";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { sendEmail, buildSessionReminderEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const incomingSecret = req.headers.get("x-cron-secret");

    if (cronSecret && incomingSecret !== cronSecret) {
      return errorResponse("Não autorizado para executar rotina", 401);
    }

    const now = new Date();
    const next24h = addHours(now, 24);

    const upcomingSessions = await prisma.session.findMany({
      where: {
        status: "agendada",
        lembreteEnviado: false,
        dataHoraInicio: {
          gte: now,
          lte: next24h,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    let sentCount = 0;

    for (const session of upcomingSessions) {
      if (!session.patient.email) {
        continue;
      }

      if (isAfter(now, session.dataHoraInicio)) {
        continue;
      }

      await sendEmail({
        to: session.patient.email,
        subject: "Lembrete da sua consulta - PsiGen",
        html: buildSessionReminderEmail(
          session.patient.nome,
          session.dataHoraInicio.toLocaleString("pt-BR")
        ),
      });

      await prisma.session.update({
        where: { id: session.id },
        data: { lembreteEnviado: true },
      });

      sentCount += 1;
    }

    return successResponse({
      totalConsultasElegiveis: upcomingSessions.length,
      lembretesEnviados: sentCount,
    });
  } catch (err) {
    console.error("Erro ao processar lembretes automáticos:", err);
    return errorResponse("Erro interno no servidor ao processar lembretes", 500);
  }
}
