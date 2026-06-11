import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { clinicalCaseSchema } from "@/lib/validations";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";

export async function GET() {
  return withAuth(async (ctx) => {
    const cases = await prisma.clinicalCase.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { updatedAt: "desc" },
    });

    return successResponse(cases);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    try {
      const body = await parseSafeBody(req);
      if (!body) return errorResponse("Payload muito grande", 413);
      const parsed = clinicalCaseSchema.safeParse(body);
      if (!parsed.success) {
        const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
        return errorResponse(errorMsg, 400);
      }

      const clinicalCase = await prisma.clinicalCase.create({
        data: {
          tenantId: ctx.tenantId,
          usuarioId: ctx.userId,
          ...parsed.data,
        },
      });

      return successResponse(clinicalCase, "Caso clínico criado com sucesso", 201);
    } catch (err) {
      console.error("Erro ao criar caso clínico:", err);
      return errorResponse("Erro interno no servidor ao criar caso clínico", 500);
    }
  });
}
