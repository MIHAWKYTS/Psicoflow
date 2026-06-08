import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { clinicalRecordSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-helpers";

async function findRecordOrError(id: string, tenantId: string) {
  return prisma.clinicalRecord.findFirst({
    where: { id, tenantId },
  });
}

// ─── GET /api/clinical-records/[id] (Detalhar Prontuário) ───
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado", 403);
    }

    const { id } = await params;
    const record = await prisma.clinicalRecord.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        patient: {
          select: {
            id: true,
            nome: true,
          },
        },
        autor: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!record) {
      return errorResponse("Prontuário não encontrado", 404);
    }

    return successResponse(record);
  });
}

// ─── PUT /api/clinical-records/[id] (Editar Evolução) ────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado", 403);
    }

    try {
      const { id } = await params;
      const record = await findRecordOrError(id, ctx.tenantId);

      if (!record) {
        return errorResponse("Prontuário não encontrado", 404);
      }

      const body = await req.json();
      const parsed = clinicalRecordSchema.safeParse(body);

      if (!parsed.success) {
        const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
        return errorResponse(errorMsg, 400);
      }

      const { patientId, sessionId, contratoTerapeutico, anamnese, avaliacaoHipotese, planoTrabalho, encerramento, dataEncerramento } = parsed.data;

      // Garantir integridade do patientId
      if (patientId !== record.patientId) {
        return errorResponse("Não é permitido alterar o paciente de um prontuário existente", 400);
      }

      const updated = await prisma.clinicalRecord.update({
        where: { id },
        data: {
          sessionId: sessionId || null,
          contratoTerapeutico: contratoTerapeutico ?? undefined,
          anamnese: anamnese ?? undefined,
          avaliacaoHipotese: avaliacaoHipotese ?? undefined,
          planoTrabalho: planoTrabalho ?? undefined,
          encerramento: encerramento ?? undefined,
          dataEncerramento: dataEncerramento ? new Date(dataEncerramento) : undefined,
        },
      });

      return successResponse(updated, "Prontuário atualizado com sucesso");
    } catch (err) {
      console.error("Erro ao atualizar prontuário:", err);
      return errorResponse("Erro interno no servidor ao atualizar prontuário", 500);
    }
  });
}

// ─── DELETE /api/clinical-records/[id] (Deletar Prontuário) ──
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado", 403);
    }

    try {
      const { id } = await params;
      const record = await findRecordOrError(id, ctx.tenantId);

      if (!record) {
        return errorResponse("Prontuário não encontrado", 404);
      }

      await prisma.clinicalRecord.delete({
        where: { id },
      });

      return successResponse(null, "Prontuário removido com sucesso");
    } catch (err) {
      console.error("Erro ao remover prontuário:", err);
      return errorResponse("Erro interno no servidor ao remover prontuário", 500);
    }
  });
}
