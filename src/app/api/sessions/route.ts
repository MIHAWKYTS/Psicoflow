import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { sessionSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { parseISO, isValid } from "date-fns";

// ─── GET /api/sessions (Listar Sessões / Agenda por Período) ───
export async function GET(req: NextRequest) {
  return withAuth(async (ctx) => {
    const { searchParams } = new URL(req.url);
    const inicioStr = searchParams.get("inicio");
    const fimStr = searchParams.get("fim");

    const where: any = {
      tenantId: ctx.tenantId,
    };

    // Filtro opcional por intervalo de data (agenda semanal/mensal)
    if (inicioStr && fimStr) {
      const dataInicio = parseISO(inicioStr);
      const dataFim = parseISO(fimStr);

      if (isValid(dataInicio) && isValid(dataFim)) {
        where.dataHoraInicio = {
          gte: dataInicio,
          lte: dataFim,
        };
      }
    }

    // Filtro opcional por paciente
    const patientId = searchParams.get("patientId");
    if (patientId) {
      where.patientId = patientId;
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            nome: true,
            telefoneWhatsapp: true,
            valorSessaoPadrao: true,
          },
        },
      },
      orderBy: { dataHoraInicio: "asc" },
    });

    return successResponse(sessions);
  });
}

// ─── POST /api/sessions (Agendar Sessão) ────────────────────
export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    try {
      const body = await req.json();
      const parsed = sessionSchema.safeParse(body);

      if (!parsed.success) {
        const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
        return errorResponse(errorMsg, 400);
      }

      const { patientId, dataHoraInicio, dataHoraFim, status } = parsed.data;

      // Verificar se o paciente pertence ao mesmo tenant
      const patient = await prisma.patient.findFirst({
        where: { id: patientId, tenantId: ctx.tenantId },
      });

      if (!patient) {
        return errorResponse("Paciente não encontrado ou inválido", 404);
      }

      const session = await prisma.session.create({
        data: {
          tenantId: ctx.tenantId,
          patientId,
          dataHoraInicio: parseISO(dataHoraInicio),
          dataHoraFim: parseISO(dataHoraFim),
          status,
          lembreteEnviado: false,
        },
        include: {
          patient: true,
        },
      });

      return successResponse(session, "Sessão agendada com sucesso", 201);
    } catch (err) {
      console.error("Erro ao agendar sessão:", err);
      return errorResponse("Erro interno no servidor ao agendar sessão", 500);
    }
  });
}
