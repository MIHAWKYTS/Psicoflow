import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";

// ─── GET /api/stock ──────────────────────────────────────────
export async function GET(_req: NextRequest) {
  return withAuth(async (ctx) => {
    const items = await prisma.stockItem.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { nome: "asc" },
    });
    return successResponse(items);
  });
}

// ─── POST /api/stock ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    if (ctx.role !== "psicologo_admin") {
      return errorResponse("Acesso negado", 403);
    }

    try {
      const body = await parseSafeBody(req);
      if (!body) return errorResponse("Payload muito grande", 413);
      const { nome, categoria, unidade, quantidadeAtual, quantidadeMinima, custoUnitario, fornecedor } = body;

      if (!nome || !unidade) {
        return errorResponse("Nome e unidade são obrigatórios", 400);
      }

      const item = await prisma.stockItem.create({
        data: {
          tenantId: ctx.tenantId,
          nome,
          categoria: categoria || null,
          unidade,
          quantidadeAtual: quantidadeAtual ?? 0,
          quantidadeMinima: quantidadeMinima ?? 0,
          custoUnitario: custoUnitario ?? null,
          fornecedor: fornecedor || null,
        },
      });

      return successResponse(item, "Item de estoque criado", 201);
    } catch (err) {
      console.error("Erro ao criar item de estoque:", err);
      return errorResponse("Erro interno ao criar item", 500);
    }
  });
}
