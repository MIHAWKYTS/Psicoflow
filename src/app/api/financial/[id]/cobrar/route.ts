import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import {
  findOrCreateCustomer,
  createCharge,
  cancelCharge,
  resolvePaymentLink,
  type AsaasBillingType,
} from "@/lib/asaas";
import { format } from "date-fns";

const ALLOWED_BILLING_TYPES: AsaasBillingType[] = ["PIX", "BOLETO", "CREDIT_CARD", "UNDEFINED"];

// ─── POST /api/financial/:id/cobrar ────────────────────────────────────────
// Gera (ou regenera) uma cobrança Asaas para a transação informada.
// Body: { billingType: "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED" }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado. Restrito a psicólogos.", 403);
    }

    const { id } = await params;

    // Busca a transação garantindo isolamento por tenant
    const transaction = await prisma.financialTransaction.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        patient: {
          select: {
            id: true,
            nome: true,
            cpf: true,
            email: true,
            telefoneWhatsapp: true,
            asaasCustomerId: true,
          },
        },
      },
    });

    if (!transaction) return errorResponse("Transação não encontrada", 404);
    if (transaction.statusPagamento === "pago") {
      return errorResponse("Esta transação já está paga", 409);
    }
    if (transaction.statusPagamento === "cancelado") {
      return errorResponse("Transação cancelada não pode ser cobrada", 409);
    }
    if (transaction.tipo !== "receita") {
      return errorResponse("Só é possível gerar cobrança para receitas", 422);
    }
    if (!transaction.patient) {
      return errorResponse("Transação sem paciente vinculado. Associe um paciente para gerar cobrança.", 422);
    }

    // Valida billingType
    let body: any;
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const billingType: AsaasBillingType = body?.billingType ?? "PIX";
    if (!ALLOWED_BILLING_TYPES.includes(billingType)) {
      return errorResponse(`billingType inválido. Use: ${ALLOWED_BILLING_TYPES.join(", ")}`, 400);
    }

    try {
      // Se já existe uma cobrança ativa, cancela antes de recriar
      if (transaction.asaasChargeId) {
        await cancelCharge(transaction.asaasChargeId).catch(() => {
          // ignora erro de cancelamento (pode já estar cancelada no Asaas)
        });
      }

      // Garante que o paciente existe como cliente no Asaas
      const asaasCustomer = await findOrCreateCustomer({
        name: transaction.patient.nome,
        cpfCnpj: transaction.patient.cpf ?? undefined,
        email: transaction.patient.email ?? undefined,
        mobilePhone: transaction.patient.telefoneWhatsapp ?? undefined,
      });

      // Persiste o asaasCustomerId no paciente se ainda não tiver
      if (!transaction.patient.asaasCustomerId) {
        await prisma.patient.update({
          where: { id: transaction.patient.id },
          data: { asaasCustomerId: asaasCustomer.id },
        });
      }

      // Cria a cobrança no Asaas
      const charge = await createCharge({
        customer: asaasCustomer.id,
        billingType,
        value: Number(transaction.valor),
        dueDate: format(transaction.dataVencimento, "yyyy-MM-dd"),
        description: transaction.descricao || "Consulta psicológica",
        externalReference: transaction.id,
      });

      const linkPagamento = resolvePaymentLink(charge);

      // Salva IDs e link na transação
      const updated = await prisma.financialTransaction.update({
        where: { id: transaction.id },
        data: {
          asaasChargeId: charge.id,
          asaasLinkPagamento: linkPagamento,
        },
      });

      return successResponse(
        {
          asaasChargeId: charge.id,
          billingType: charge.billingType,
          status: charge.status,
          linkPagamento,
          pixCopiaECola: charge.pixCopiaECola ?? null,
          valor: updated.valor,
          vencimento: format(transaction.dataVencimento, "yyyy-MM-dd"),
        },
        "Cobrança gerada com sucesso",
        201
      );
    } catch (err: any) {
      console.error("[Asaas] Erro ao gerar cobrança:", err?.message);
      return errorResponse(err?.message ?? "Erro ao gerar cobrança no Asaas", 502);
    }
  });
}

// ─── DELETE /api/financial/:id/cobrar ──────────────────────────────────────
// Cancela a cobrança Asaas vinculada à transação.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado. Restrito a psicólogos.", 403);
    }

    const { id } = await params;

    const transaction = await prisma.financialTransaction.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { id: true, asaasChargeId: true, statusPagamento: true },
    });

    if (!transaction) return errorResponse("Transação não encontrada", 404);
    if (!transaction.asaasChargeId) {
      return errorResponse("Nenhuma cobrança Asaas vinculada a esta transação", 404);
    }
    if (transaction.statusPagamento === "pago") {
      return errorResponse("Cobrança já paga não pode ser cancelada", 409);
    }

    try {
      await cancelCharge(transaction.asaasChargeId);

      await prisma.financialTransaction.update({
        where: { id: transaction.id },
        data: {
          asaasChargeId: null,
          asaasLinkPagamento: null,
          statusPagamento: "cancelado",
        },
      });

      return successResponse(null, "Cobrança cancelada com sucesso");
    } catch (err: any) {
      console.error("[Asaas] Erro ao cancelar cobrança:", err?.message);
      return errorResponse(err?.message ?? "Erro ao cancelar cobrança no Asaas", 502);
    }
  });
}
