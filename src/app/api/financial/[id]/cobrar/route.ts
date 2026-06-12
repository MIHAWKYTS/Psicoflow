import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import {
  findOrCreateCustomer,
  createCharge,
  cancelCharge,
  cancelSubscription,
  createSubscription,
  resolvePaymentLink,
  type AsaasBillingType,
  type AsaasCycle,
  type AsaasModalidade,
} from "@/lib/asaas";
import { format } from "date-fns";

const ALLOWED_BILLING_TYPES: AsaasBillingType[] = ["PIX", "BOLETO", "CREDIT_CARD", "UNDEFINED"];
const ALLOWED_CYCLES: AsaasCycle[] = ["WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "SEMIANNUALLY", "YEARLY"];
const ALLOWED_MODALIDADES: AsaasModalidade[] = ["avulso", "parcelado", "recorrente"];

// ─── POST /api/financial/:id/cobrar ────────────────────────────────────────
// Body:
//   avulso:    { billingType, modalidade: "avulso" }
//   parcelado: { billingType, modalidade: "parcelado", parcelas: number }
//   recorrente:{ billingType, modalidade: "recorrente", ciclo: AsaasCycle }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado. Restrito a psicólogos.", 403);
    }

    const { id } = await params;

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
    if (transaction.statusPagamento === "pago") return errorResponse("Esta transação já está paga", 409);
    if (transaction.statusPagamento === "cancelado") return errorResponse("Transação cancelada não pode ser cobrada", 409);
    if (transaction.tipo !== "receita") return errorResponse("Só é possível gerar cobrança para receitas", 422);
    if (!transaction.patient) return errorResponse("Associe um paciente para gerar cobrança.", 422);

    let body: any;
    try { body = await req.json(); } catch { body = {}; }

    const billingType: AsaasBillingType = body?.billingType ?? "PIX";
    const modalidade: AsaasModalidade = body?.modalidade ?? "avulso";

    if (!ALLOWED_BILLING_TYPES.includes(billingType)) {
      return errorResponse(`billingType inválido. Use: ${ALLOWED_BILLING_TYPES.join(", ")}`, 400);
    }
    if (!ALLOWED_MODALIDADES.includes(modalidade)) {
      return errorResponse(`modalidade inválida. Use: ${ALLOWED_MODALIDADES.join(", ")}`, 400);
    }

    try {
      // Cancela cobrança/assinatura anterior antes de recriar
      await cleanupExisting(transaction);

      // Garante cliente no Asaas
      const asaasCustomer = await findOrCreateCustomer({
        name: transaction.patient.nome,
        cpfCnpj: transaction.patient.cpf ?? undefined,
        email: transaction.patient.email ?? undefined,
        mobilePhone: transaction.patient.telefoneWhatsapp ?? undefined,
      });

      if (!transaction.patient.asaasCustomerId) {
        await prisma.patient.update({
          where: { id: transaction.patient.id },
          data: { asaasCustomerId: asaasCustomer.id },
        });
      }

      const valor = Number(transaction.valor);
      const dueDate = format(transaction.dataVencimento, "yyyy-MM-dd");
      const description = transaction.descricao || "Consulta psicológica";

      // ── Avulso ──────────────────────────────────────────
      if (modalidade === "avulso") {
        const charge = await createCharge({
          customer: asaasCustomer.id,
          billingType,
          value: valor,
          dueDate,
          description,
          externalReference: transaction.id,
        });

        const linkPagamento = resolvePaymentLink(charge);

        await prisma.financialTransaction.update({
          where: { id: transaction.id },
          data: { asaasChargeId: charge.id, asaasLinkPagamento: linkPagamento, asaasSubscriptionId: null },
        });

        return successResponse(
          { modalidade, asaasChargeId: charge.id, billingType, status: charge.status, linkPagamento, pixCopiaECola: charge.pixCopiaECola ?? null, vencimento: dueDate },
          "Cobrança avulsa gerada com sucesso",
          201
        );
      }

      // ── Parcelado ────────────────────────────────────────
      if (modalidade === "parcelado") {
        const parcelas = Number(body?.parcelas ?? transaction.parcelas ?? 1);
        if (!Number.isInteger(parcelas) || parcelas < 2 || parcelas > 120) {
          return errorResponse("parcelas deve ser um inteiro entre 2 e 120", 400);
        }

        const installmentValue = parseFloat((valor / parcelas).toFixed(2));

        const charge = await createCharge({
          customer: asaasCustomer.id,
          billingType,
          value: valor,
          dueDate,
          description,
          externalReference: transaction.id,
          installmentCount: parcelas,
          installmentValue,
        });

        const linkPagamento = resolvePaymentLink(charge);

        await prisma.financialTransaction.update({
          where: { id: transaction.id },
          data: {
            asaasChargeId: charge.id,
            asaasLinkPagamento: linkPagamento,
            asaasSubscriptionId: null,
            parcelas,
          },
        });

        return successResponse(
          { modalidade, asaasChargeId: charge.id, installmentGroupId: charge.installment, billingType, status: charge.status, linkPagamento, parcelas, valorParcela: installmentValue, vencimento: dueDate },
          `Cobrança parcelada em ${parcelas}x gerada com sucesso`,
          201
        );
      }

      // ── Recorrente ───────────────────────────────────────
      if (modalidade === "recorrente") {
        const ciclo: AsaasCycle = body?.ciclo ?? "MONTHLY";
        if (!ALLOWED_CYCLES.includes(ciclo)) {
          return errorResponse(`ciclo inválido. Use: ${ALLOWED_CYCLES.join(", ")}`, 400);
        }

        const subscription = await createSubscription({
          customer: asaasCustomer.id,
          billingType,
          value: valor,
          nextDueDate: dueDate,
          cycle: ciclo,
          description,
          externalReference: transaction.id,
        });

        await prisma.financialTransaction.update({
          where: { id: transaction.id },
          data: {
            asaasSubscriptionId: subscription.id,
            asaasChargeId: null,
            asaasLinkPagamento: null,
          },
        });

        return successResponse(
          { modalidade, asaasSubscriptionId: subscription.id, billingType, ciclo, status: subscription.status, proximoVencimento: subscription.nextDueDate },
          "Assinatura recorrente criada com sucesso",
          201
        );
      }
    } catch (err: any) {
      console.error("[Asaas] Erro ao gerar cobrança:", err?.message);
      return errorResponse(err?.message ?? "Erro ao gerar cobrança no Asaas", 502);
    }
  });
}

// ─── DELETE /api/financial/:id/cobrar ──────────────────────────────────────
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
      select: { id: true, asaasChargeId: true, asaasSubscriptionId: true, statusPagamento: true },
    });

    if (!transaction) return errorResponse("Transação não encontrada", 404);
    if (!transaction.asaasChargeId && !transaction.asaasSubscriptionId) {
      return errorResponse("Nenhuma cobrança Asaas vinculada a esta transação", 404);
    }
    if (transaction.statusPagamento === "pago") {
      return errorResponse("Cobrança já paga não pode ser cancelada", 409);
    }

    try {
      await cleanupExisting(transaction);

      await prisma.financialTransaction.update({
        where: { id: transaction.id },
        data: { asaasChargeId: null, asaasLinkPagamento: null, asaasSubscriptionId: null, statusPagamento: "cancelado" },
      });

      return successResponse(null, "Cobrança cancelada com sucesso");
    } catch (err: any) {
      console.error("[Asaas] Erro ao cancelar cobrança:", err?.message);
      return errorResponse(err?.message ?? "Erro ao cancelar cobrança no Asaas", 502);
    }
  });
}

// Cancela cobrança ou assinatura existente antes de recriar
async function cleanupExisting(transaction: {
  asaasChargeId: string | null;
  asaasSubscriptionId: string | null;
}) {
  if (transaction.asaasSubscriptionId) {
    await cancelSubscription(transaction.asaasSubscriptionId).catch(() => {});
  } else if (transaction.asaasChargeId) {
    await cancelCharge(transaction.asaasChargeId).catch(() => {});
  }
}
