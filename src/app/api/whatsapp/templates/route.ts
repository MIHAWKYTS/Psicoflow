import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";

export async function GET() {
  return withAuth(async (ctx) => {
    const templates = await prisma.whatsAppMessageTemplate.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
    });
    return successResponse(templates);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    try {
      const body = await parseSafeBody(req);
      if (!body) return errorResponse("Payload muito grande", 413);

      const { nome, mensagem } = body as { nome?: string; mensagem?: string };
      if (!nome?.trim() || !mensagem?.trim()) {
        return errorResponse("nome e mensagem são obrigatórios", 400);
      }

      const template = await prisma.whatsAppMessageTemplate.create({
        data: { tenantId: ctx.tenantId, nome: nome.trim(), mensagem: mensagem.trim() },
      });

      return successResponse(template, "Template criado", 201);
    } catch (err) {
      console.error("Erro ao criar template:", err);
      return errorResponse("Erro interno no servidor", 500);
    }
  });
}
