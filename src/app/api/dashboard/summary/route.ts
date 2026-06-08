import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";

function getBRTBounds() {
  const now = new Date();
  // UTC-3: subtract 3h to get BRT, then work in BRT calendar
  const brtOffset = -3 * 60 * 60 * 1000;
  const brtNow = new Date(now.getTime() + brtOffset);

  const y = brtNow.getUTCFullYear();
  const m = brtNow.getUTCMonth();
  const d = brtNow.getUTCDate();

  // Today in BRT → back to UTC for DB queries
  const todayStart = new Date(Date.UTC(y, m, d, 3, 0, 0)); // 00:00 BRT = 03:00 UTC
  const todayEnd = new Date(Date.UTC(y, m, d + 1, 2, 59, 59, 999)); // 23:59 BRT = 02:59 UTC next day

  const monthStart = new Date(Date.UTC(y, m, 1, 3, 0, 0));
  const monthEnd = new Date(Date.UTC(y, m + 1, 1, 2, 59, 59, 999));

  return { todayStart, todayEnd, monthStart, monthEnd };
}

export async function GET(req: NextRequest) {
  return withAuth(async (ctx) => {
    try {
      const { todayStart, todayEnd, monthStart, monthEnd } = getBRTBounds();
      const tenantId = ctx.tenantId;

      const [
        sessoesHojeRaw,
        faturamentoMesRaw,
        despesasMesRaw,
        pacientesAtivos,
        sessoesMesAgendadas,
      ] = await Promise.all([
        // (a) Sessions de hoje agrupadas por status
        prisma.session.groupBy({
          by: ["status"],
          where: {
            tenantId,
            dataHoraInicio: { gte: todayStart, lte: todayEnd },
          },
          _count: { id: true },
        }),
        // (b) Receitas pagas no mês
        prisma.financialTransaction.aggregate({
          where: {
            tenantId,
            tipo: "receita",
            statusPagamento: "pago",
            dataVencimento: { gte: monthStart, lte: monthEnd },
          },
          _sum: { valor: true },
        }),
        // (c) Despesas do mês (qualquer status)
        prisma.financialTransaction.aggregate({
          where: {
            tenantId,
            tipo: "despesa",
            dataVencimento: { gte: monthStart, lte: monthEnd },
          },
          _sum: { valor: true },
        }),
        // (d) Pacientes ativos
        prisma.patient.count({ where: { tenantId, status: "ativo" } }),
        // (e) Pacientes com sessões agendadas no mês (para previsão)
        prisma.session.findMany({
          where: {
            tenantId,
            status: "agendada",
            dataHoraInicio: { gte: monthStart, lte: monthEnd },
          },
          select: {
            patient: { select: { valorSessaoPadrao: true } },
          },
        }),
      ]);

      const sessoesHojeTotal = sessoesHojeRaw.reduce((sum, g) => sum + g._count.id, 0);
      const sessoesRealizadas = sessoesHojeRaw.find((g) => g.status === "realizada")?._count.id ?? 0;
      const sessoesPendentes = sessoesHojeRaw.find((g) => g.status === "agendada")?._count.id ?? 0;

      const previsaoReceita = sessoesMesAgendadas.reduce((sum, s) => {
        return sum + Number(s.patient?.valorSessaoPadrao ?? 0);
      }, 0);

      return successResponse({
        sessoesHoje: {
          total: sessoesHojeTotal,
          realizadas: sessoesRealizadas,
          pendentes: sessoesPendentes,
        },
        faturamentoMes: Number(faturamentoMesRaw._sum.valor ?? 0),
        despesasMes: Number(despesasMesRaw._sum.valor ?? 0),
        pacientesAtivos,
        previsaoReceita,
      });
    } catch (error) {
      console.error("Erro ao calcular dashboard summary:", error);
      return errorResponse("Erro interno ao calcular métricas.", 500);
    }
  });
}
