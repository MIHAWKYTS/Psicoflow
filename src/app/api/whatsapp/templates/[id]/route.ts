import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      const existing = await prisma.whatsAppMessageTemplate.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });
      if (!existing) return errorResponse("Template não encontrado", 404);

      const body = await parseSafeBody(req);
      if (!body) return errorResponse("Payload muito grande", 413);

      const { nome, mensagem, isDefault } = body as {
        nome?: string;
        mensagem?: string;
        isDefault?: boolean;
      };

      if (isDefault === true) {
        await prisma.whatsAppMessageTemplate.updateMany({
          where: { tenantId: ctx.tenantId },
          data: { isDefault: false },
        });
      }

      const updated = await prisma.whatsAppMessageTemplate.update({
        where: { id },
        data: {
          ...(nome?.trim() && { nome: nome.trim() }),
          ...(mensagem?.trim() && { mensagem: mensagem.trim() }),
          ...(isDefault !== undefined && { isDefault }),
        },
      });

      return successResponse(updated);
    } catch (err) {
      console.error("Erro ao atualizar template:", err);
      return errorResponse("Erro interno no servidor", 500);
    }
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      const existing = await prisma.whatsAppMessageTemplate.findFirst({
        where: { id, tenantId: ctx.tenantId },
      });
      if (!existing) return errorResponse("Template não encontrado", 404);

      await prisma.whatsAppMessageTemplate.delete({ where: { id } });
      return successResponse(null, "Template removido");
    } catch (err) {
      console.error("Erro ao deletar template:", err);
      return errorResponse("Erro interno no servidor", 500);
    }
  });
}
