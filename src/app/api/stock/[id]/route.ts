import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";

// ─── GET /api/stock/[id] ─────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    const { id } = await params;
    const item = await prisma.stockItem.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { movimentos: { orderBy: { createdAt: "desc" }, take: 50 } },
    });
    if (!item) return errorResponse("Item não encontrado", 404);
    return successResponse(item);
  });
}

// ─── PATCH /api/stock/[id] ───────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role !== "psicologo_admin") return errorResponse("Acesso negado", 403);

    try {
      const { id } = await params;
      const item = await prisma.stockItem.findFirst({ where: { id, tenantId: ctx.tenantId } });
      if (!item) return errorResponse("Item não encontrado", 404);

      const body = await parseSafeBody(req);
      if (!body) return errorResponse("Payload muito grande", 413);
      const { nome, categoria, unidade, quantidadeMinima, custoUnitario, fornecedor } = body;

      const updated = await prisma.stockItem.update({
        where: { id },
        data: {
          ...(nome !== undefined && { nome }),
          ...(categoria !== undefined && { categoria }),
          ...(unidade !== undefined && { unidade }),
          ...(quantidadeMinima !== undefined && { quantidadeMinima }),
          ...(custoUnitario !== undefined && { custoUnitario }),
          ...(fornecedor !== undefined && { fornecedor }),
        },
      });

      return successResponse(updated, "Item atualizado");
    } catch (err) {
      console.error("Erro ao atualizar item:", err);
      return errorResponse("Erro interno ao atualizar", 500);
    }
  });
}

// ─── DELETE /api/stock/[id] ──────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role !== "psicologo_admin") return errorResponse("Acesso negado", 403);

    try {
      const { id } = await params;
      const item = await prisma.stockItem.findFirst({ where: { id, tenantId: ctx.tenantId } });
      if (!item) return errorResponse("Item não encontrado", 404);

      await prisma.stockItem.delete({ where: { id } });
      return successResponse(null, "Item removido");
    } catch (err) {
      console.error("Erro ao deletar item:", err);
      return errorResponse("Erro interno ao deletar", 500);
    }
  });
}
