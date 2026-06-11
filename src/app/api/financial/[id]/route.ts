import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { financialTransactionSchema } from "@/lib/validations";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";
import { parseISO } from "date-fns";

async function findTransactionOrError(id: string, tenantId: string) {
  return prisma.financialTransaction.findFirst({
    where: { id, tenantId },
  });
}

// ─── GET /api/financial/[id] (Detalhar Lançamento) ──────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado", 403);
    }

    const { id } = await params;
    const transaction = await prisma.financialTransaction.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        patient: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!transaction) {
      return errorResponse("Transação não encontrada", 404);
    }

    return successResponse(transaction);
  });
}

// ─── PUT /api/financial/[id] (Atualizar Lançamento / Conciliar) ──
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado", 403);
    }

    try {
      const { id } = await params;
      const transaction = await findTransactionOrError(id, ctx.tenantId);

      if (!transaction) {
        return errorResponse("Transação não encontrada", 404);
      }

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
      } = parsed.data;

      // Validar patientId se for alterado
      if (patientId && patientId !== transaction.patientId) {
        const patient = await prisma.patient.findFirst({
          where: { id: patientId, tenantId: ctx.tenantId },
        });
        if (!patient) {
          return errorResponse("Paciente inválido", 400);
        }
      }

      // Definir data de pagamento com base no novo status
      let dataPagamento = transaction.dataPagamento;
      if (statusPagamento === "pago" && transaction.statusPagamento !== "pago") {
        dataPagamento = new Date();
      } else if (statusPagamento !== "pago") {
        dataPagamento = null;
      }

      const updated = await prisma.financialTransaction.update({
        where: { id },
        data: {
          patientId: patientId || null,
          tipo,
          categoria,
          descricao: descricao || "",
          valor,
          statusPagamento,
          dataVencimento: dataVencimento ? parseISO(dataVencimento) : transaction.dataVencimento,
          dataPagamento,
        },
      });

      return successResponse(updated, "Transação atualizada com sucesso");
    } catch (err) {
      console.error("Erro ao atualizar transação:", err);
      return errorResponse("Erro interno no servidor ao atualizar transação", 500);
    }
  });
}

// ─── PATCH /api/financial/[id] (Marcar como Pago) ──────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role !== "psicologo_admin") {
      return errorResponse("Acesso negado. Apenas o administrador pode alterar o status do pagamento.", 403);
    }

    try {
      const { id } = await params;
      const transaction = await findTransactionOrError(id, ctx.tenantId);

      if (!transaction) {
        return errorResponse("Transação não encontrada", 404);
      }

      const body = await parseSafeBody(req);
      if (!body) return errorResponse("Payload muito grande", 413);
      const { statusPagamento, dataPagamento } = body;

      if (!["pago", "pendente", "cancelado"].includes(statusPagamento)) {
        return errorResponse("Status de pagamento inválido", 400);
      }

      const updated = await prisma.financialTransaction.update({
        where: { id },
        data: {
          statusPagamento,
          dataPagamento: statusPagamento === "pago"
            ? (dataPagamento ? new Date(dataPagamento) : new Date())
            : null,
        },
      });

      return successResponse(updated, "Status atualizado com sucesso");
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
      return errorResponse("Erro interno ao atualizar status", 500);
    }
  });
}

// ─── DELETE /api/financial/[id] (Remover Lançamento) ────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado", 403);
    }

    try {
      const { id } = await params;
      const transaction = await findTransactionOrError(id, ctx.tenantId);

      if (!transaction) {
        return errorResponse("Transação não encontrada", 404);
      }

      await prisma.financialTransaction.delete({
        where: { id },
      });

      return successResponse(null, "Lançamento removido com sucesso");
    } catch (err) {
      console.error("Erro ao deletar transação:", err);
      return errorResponse("Erro interno no servidor ao deletar transação", 500);
    }
  });
}
