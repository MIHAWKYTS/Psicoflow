import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";

// ─── GET /api/stock/[id]/movements ───────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    const { id } = await params;
    const item = await prisma.stockItem.findFirst({ where: { id, tenantId: ctx.tenantId } });
    if (!item) return errorResponse("Item não encontrado", 404);

    const movements = await prisma.stockMovement.findMany({
      where: { stockItemId: id },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(movements);
  });
}

// ─── POST /api/stock/[id]/movements ──────────────────────────
// Secretária pode registrar entrada/saída, mas não criar/editar/deletar itens
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      const item = await prisma.stockItem.findFirst({ where: { id, tenantId: ctx.tenantId } });
      if (!item) return errorResponse("Item não encontrado", 404);

      const body = await parseSafeBody(req);
      if (!body) return errorResponse("Payload muito grande", 413);
      const { tipo, quantidade, motivo } = body;

      if (!["entrada", "saida", "ajuste"].includes(tipo)) {
        return errorResponse("Tipo de movimentação inválido", 400);
      }
      if (!quantidade || quantidade <= 0) {
        return errorResponse("Quantidade deve ser positiva", 400);
      }

      const qtdAtual = Number(item.quantidadeAtual);
      let novaQtd: number;

      if (tipo === "entrada") {
        novaQtd = qtdAtual + Number(quantidade);
      } else if (tipo === "saida") {
        if (Number(quantidade) > qtdAtual) {
          return errorResponse("Quantidade insuficiente em estoque", 400);
        }
        novaQtd = qtdAtual - Number(quantidade);
      } else {
        novaQtd = Number(quantidade);
      }

      const [movement] = await prisma.$transaction([
        prisma.stockMovement.create({
          data: {
            stockItemId: id,
            tipo,
            quantidade,
            motivo: motivo || null,
            usuarioId: ctx.userId,
          },
        }),
        prisma.stockItem.update({
          where: { id },
          data: { quantidadeAtual: novaQtd },
        }),
      ]);

      return successResponse(movement, "Movimentação registrada", 201);
    } catch (err) {
      console.error("Erro ao registrar movimentação:", err);
      return errorResponse("Erro interno ao registrar movimentação", 500);
    }
  });
}
