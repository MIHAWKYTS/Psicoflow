import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";

const addDocumentSchema = z.object({
  documentUrl: z.string().min(1, "URL do documento é obrigatória"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      const existingCase = await prisma.clinicalCase.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });

      if (!existingCase) {
        return errorResponse("Caso clínico não encontrado", 404);
      }

      const body = await parseSafeBody(req);
      if (!body) return errorResponse("Payload muito grande", 413);
      const parsed = addDocumentSchema.safeParse(body);
      if (!parsed.success) {
        const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
        return errorResponse(errorMsg, 400);
      }

      const updated = await prisma.clinicalCase.update({
        where: { id },
        data: {
          documentosUrls: [...existingCase.documentosUrls, parsed.data.documentUrl],
        },
      });

      return successResponse(updated, "Documento anexado com sucesso");
    } catch (err) {
      console.error("Erro ao anexar documento ao caso clínico:", err);
      return errorResponse("Erro interno no servidor ao anexar documento", 500);
    }
  });
}
