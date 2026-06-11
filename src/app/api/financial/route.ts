import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { financialTransactionSchema } from "@/lib/validations";
import {
  successResponse,
  errorResponse,
  getPaginationParams,
  paginatedResponse,
  parseSafeBody,
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

    const tipo = searchParams.get("tipo") || undefined;
    const status = searchParams.get("status") || undefined;
    const categoria = searchParams.get("categoria") || undefined;
    const patientIdFilter = searchParams.get("patientId") || undefined;
    const inicioStr = searchParams.get("inicio");
    const fimStr = searchParams.get("fim");

    const where: any = {
      tenantId: ctx.tenantId,
    };

    if (patientIdFilter) {
      where.patientId = patientIdFilter;
    }

    if (tipo === "receita" || tipo === "despesa") {
      where.tipo = tipo;
    }

    if (status === "pendente" || status === "pago" || status === "cancelado") {
      where.statusPagamento = status;
    }

    if (categoria === "consultorio" || categoria === "pessoal") {
      where.categoria = categoria;
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
    try {
      const body = await parseSafeBody(req);
      if (!body) return errorResponse("Payload muito grande", 413);
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
        formaPagamento,
        parcelas,
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
          dataVencimento: dataVencimento ? parseISO(dataVencimento) : new Date(),
          dataPagamento: statusPagamento === "pago" ? new Date() : null,
          formaPagamento: formaPagamento ?? null,
          parcelas: parcelas ?? 1,
        },
      });

      return successResponse(transaction, "Lançamento financeiro registrado", 201);
    } catch (err: any) {
      console.error("Erro ao registrar lançamento:", err?.message ?? err);
      return errorResponse(err?.message ?? "Erro interno no servidor ao registrar lançamento", 500);
    }
  });
}
