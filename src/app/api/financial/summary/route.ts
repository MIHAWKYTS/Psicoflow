import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── GET /api/financial/summary (Receita vs Despesa — últimos 6 meses) ──
export async function GET(_req: NextRequest) {
  return withAuth(async (ctx) => {
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado.", 403);
    }

    const now = new Date();

    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i);
      return {
        label: format(date, "MMM", { locale: ptBR }),
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
    });

    const results = await Promise.all(
      months.map(async ({ label, start, end }) => {
        const [receitas, despesas] = await Promise.all([
          prisma.financialTransaction.aggregate({
            where: {
              tenantId: ctx.tenantId,
              tipo: "receita",
              statusPagamento: "pago",
              dataVencimento: { gte: start, lte: end },
            },
            _sum: { valor: true },
          }),
          prisma.financialTransaction.aggregate({
            where: {
              tenantId: ctx.tenantId,
              tipo: "despesa",
              dataVencimento: { gte: start, lte: end },
            },
            _sum: { valor: true },
          }),
        ]);

        return {
          mes: label.charAt(0).toUpperCase() + label.slice(1),
          receita: Number(receitas._sum.valor ?? 0),
          despesa: Number(despesas._sum.valor ?? 0),
        };
      })
    );

    return successResponse(results);
  });
}
