import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { financialTransactionSchema } from "@/lib/validations";
import {
  successResponse,
  errorResponse,
  getPaginationParams,
  paginatedResponse,
} from "@/lib/api-helpers";
import { parseISO, isValid } from "date-fns";

// ─── GET /api/financial (Listar Transações / Fluxo de Caixa) ──
export async function GET(req: NextRequest) {
  return withAuth(async (ctx) => {
    // Segurança Extra (Defense-in-depth)
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado. Informações financeiras são restritas para administradores.", 403);
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    const tipo = searchParams.get("tipo") || undefined; // 'receita' ou 'despesa'
    const status = searchParams.get("status") || undefined; // 'pendente', 'pago', 'cancelado'
    const inicioStr = searchParams.get("inicio");
    const fimStr = searchParams.get("fim");

    const where: any = {
      tenantId: ctx.tenantId,
    };

    if (tipo === "receita" || tipo === "despesa") {
      where.tipo = tipo;
    }

    if (status === "pendente" || status === "pago" || status === "cancelado") {
      where.statusPagamento = status;
    }

    if (inicioStr && fimStr) {
      const dataInicio = parseISO(inicioStr);
      const dataFim = parseISO(fimStr);

      if (isValid(dataInicio) && isValid(dataFim)) {
        where.dataVencimento = {
          gte: dataInicio,
          lte: dataFim,
        };
      }
    }

    const [total, transactions] = await Promise.all([
      prisma.financialTransaction.count({ where }),
      prisma.financialTransaction.findMany({
        where,
        skip,
        take: limit,
        include: {
          patient: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: { dataVencimento: "desc" },
      }),
    ]);

    return paginatedResponse(transactions, total, page, limit);
  });
}

// ─── POST /api/financial (Lançar Transação) ─────────────────
export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado. Cadastro financeiro restrito.", 403);
    }

    try {
      const body = await req.json();
      const parsed = financialTransactionSchema.safeParse(body);

      if (!parsed.success) {
        const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
        return errorResponse(errorMsg, 400);
      }

      const {
        patientId,
        tipo,
        categoria,
        descricao,
        valor,
        statusPagamento,
        dataVencimento,
      } = parsed.data;

      // Se houver patientId, validar se pertence ao tenant
      if (patientId) {
        const patient = await prisma.patient.findFirst({
          where: { id: patientId, tenantId: ctx.tenantId },
        });
        if (!patient) {
          return errorResponse("Paciente inválido", 400);
        }
      }

      const transaction = await prisma.financialTransaction.create({
        data: {
          tenantId: ctx.tenantId,
          patientId: patientId || null,
          tipo,
          categoria,
          descricao: descricao || "",
          valor,
          statusPagamento,
          dataVencimento: parseISO(dataVencimento),
          dataPagamento: statusPagamento === "pago" ? new Date() : null,
        },
      });

      return successResponse(transaction, "Lançamento financeiro registrado", 201);
    } catch (err) {
      console.error("Erro ao registrar lançamento:", err);
      return errorResponse("Erro interno no servidor ao registrar lançamento", 500);
    }
  });
}
