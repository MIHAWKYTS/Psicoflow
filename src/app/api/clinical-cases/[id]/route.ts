import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { clinicalCaseSchema } from "@/lib/validations";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";

async function findCase(id: string, tenantId: string) {
  return prisma.clinicalCase.findFirst({
    where: { id, tenantId },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    const { id } = await params;
    const clinicalCase = await findCase(id, ctx.tenantId);

    if (!clinicalCase) {
      return errorResponse("Caso clínico não encontrado", 404);
    }

    return successResponse(clinicalCase);
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role !== "psicologo_admin") return errorResponse("Acesso negado.", 403);
    try {
      const { id } = await params;
      const existingCase = await findCase(id, ctx.tenantId);
      if (!existingCase) {
        return errorResponse("Caso clínico não encontrado", 404);
      }

      const body = await parseSafeBody(req);
      if (!body) return errorResponse("Payload muito grande", 413);
      const parsed = clinicalCaseSchema.safeParse(body);
      if (!parsed.success) {
        const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
        return errorResponse(errorMsg, 400);
      }

      const updated = await prisma.clinicalCase.update({
        where: { id },
        data: parsed.data,
      });

      return successResponse(updated, "Caso clínico atualizado com sucesso");
    } catch (err) {
      console.error("Erro ao atualizar caso clínico:", err);
      return errorResponse("Erro interno no servidor ao atualizar caso clínico", 500);
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role !== "psicologo_admin") return errorResponse("Acesso negado.", 403);
    try {
      const { id } = await params;
      const existingCase = await findCase(id, ctx.tenantId);
      if (!existingCase) {
        return errorResponse("Caso clínico não encontrado", 404);
      }

      await prisma.clinicalCase.delete({ where: { id } });
      return successResponse(null, "Caso clínico removido com sucesso");
    } catch (err) {
      console.error("Erro ao remover caso clínico:", err);
      return errorResponse("Erro interno no servidor ao remover caso clínico", 500);
    }
  });
}
