import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { sessionSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { parseISO } from "date-fns";

async function findSessionOrError(id: string, tenantId: string) {
  return prisma.session.findFirst({
    where: { id, tenantId },
  });
}

// ─── GET /api/sessions/[id] (Detalhar Sessão) ───────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    const { id } = await params;
    const session = await prisma.session.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        patient: true,
      },
    });

    if (!session) {
      return errorResponse("Sessão não encontrada", 404);
    }

    return successResponse(session);
  });
}

// ─── PUT /api/sessions/[id] (Atualizar Agenda/Sessão) ────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      const session = await findSessionOrError(id, ctx.tenantId);

      if (!session) {
        return errorResponse("Sessão não encontrada", 404);
      }

      const body = await req.json();
      const parsed = sessionSchema.safeParse(body);

      if (!parsed.success) {
        const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
        return errorResponse(errorMsg, 400);
      }

      const { patientId, dataHoraInicio, dataHoraFim, status } = parsed.data;

      // Se mudar de paciente, validar se pertence ao mesmo tenant
      if (patientId !== session.patientId) {
        const patient = await prisma.patient.findFirst({
          where: { id: patientId, tenantId: ctx.tenantId },
        });
        if (!patient) {
          return errorResponse("Paciente inválido", 400);
        }
      }

      const updated = await prisma.session.update({
        where: { id },
        data: {
          patientId,
          dataHoraInicio: parseISO(dataHoraInicio),
          dataHoraFim: parseISO(dataHoraFim),
          status,
        },
        include: {
          patient: true,
        },
      });

      return successResponse(updated, "Sessão atualizada com sucesso");
    } catch (err) {
      console.error("Erro ao atualizar sessão:", err);
      return errorResponse("Erro interno no servidor ao atualizar sessão", 500);
    }
  });
}

// ─── DELETE /api/sessions/[id] (Desmarcar/Remover) ──────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      const session = await findSessionOrError(id, ctx.tenantId);

      if (!session) {
        return errorResponse("Sessão não encontrada", 404);
      }

      await prisma.session.delete({
        where: { id },
      });

      return successResponse(null, "Sessão desmarcada com sucesso");
    } catch (err) {
      console.error("Erro ao remover sessão:", err);
      return errorResponse("Erro interno no servidor ao remover sessão", 500);
    }
  });
}
