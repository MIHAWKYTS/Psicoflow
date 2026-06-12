import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import {
  findOrCreateCustomer,
  createCharge,
  createSubscription,
  cancelSubscription,
  getSubscriptionPayments,
  getPixQrCode,
  type AsaasBillingType,
} from "@/lib/asaas";
import { format, addDays } from "date-fns";

export const SUBSCRIPTION_PRICE = 120;

const ALLOWED_BILLING_TYPES: AsaasBillingType[] = ["PIX", "BOLETO", "CREDIT_CARD"];

// ─── POST /api/subscription/checkout ───────────────────────────────────────
// PIX    → cobrança avulsa, retorna QR code embedded
// Boleto → cobrança avulsa, retorna link do PDF
// Cartão → assinatura recorrente mensal, retorna invoiceUrl para hosted checkout
export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    if (ctx.role !== "psicologo_admin") {
      return errorResponse("Apenas o administrador da clínica pode assinar.", 403);
    }

    let body: any;
    try { body = await req.json(); } catch { body = {}; }

    const billingType: AsaasBillingType = body?.billingType ?? "PIX";
    if (!ALLOWED_BILLING_TYPES.includes(billingType)) {
      return errorResponse(`billingType inválido. Use: ${ALLOWED_BILLING_TYPES.join(", ")}`, 400);
    }

    const [tenant, adminUser] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: ctx.tenantId } }),
      prisma.user.findUnique({ where: { id: ctx.userId }, select: { email: true } }),
    ]);

    if (!tenant) return errorResponse("Tenant não encontrado", 404);

    try {
      const asaasCustomer = await findOrCreateCustomer({
        name: tenant.nomeClinica,
        cpfCnpj: tenant.documento,
        email: adminUser?.email ?? ctx.email,
      });

      if (!tenant.asaasCustomerId) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { asaasCustomerId: asaasCustomer.id },
        });
      }

      const dueDate = format(addDays(new Date(), 1), "yyyy-MM-dd");

      // ── Cartão: assinatura recorrente mensal ────────────────
      if (billingType === "CREDIT_CARD") {
        // Cancela assinatura anterior se existir
        if (tenant.asaasSubscriptionId) {
          await cancelSubscription(tenant.asaasSubscriptionId).catch(() => {});
        }

        const subscription = await createSubscription({
          customer: asaasCustomer.id,
          billingType: "CREDIT_CARD",
          value: SUBSCRIPTION_PRICE,
          nextDueDate: dueDate,
          cycle: "MONTHLY",
          description: "Assinatura PsiGen — Plano Clínica",
          externalReference: `sub_tenant_${tenant.id}`,
        });

        // Salva subscriptionId e limpa dataFimAcesso (reativação)
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { asaasSubscriptionId: subscription.id, dataFimAcesso: null },
        });

        // Busca invoiceUrl da primeira cobrança gerada pela assinatura
        const payments = await getSubscriptionPayments(subscription.id);
        const invoiceUrl = payments.data[0]?.invoiceUrl ?? null;
        if (!invoiceUrl) return errorResponse("Link de pagamento não gerado", 502);

        return successResponse({ tipo: "cartao", invoiceUrl }, "Assinatura recorrente criada");
      }

      // ── PIX e Boleto: cobrança avulsa ───────────────────────
      console.log("[checkout] criando cobrança", { billingType, customer: asaasCustomer.id });
      const charge = await createCharge({
        customer: asaasCustomer.id,
        billingType,
        value: SUBSCRIPTION_PRICE,
        dueDate,
        description: "Assinatura PsiGen — Plano Clínica",
        externalReference: `sub_tenant_${tenant.id}`,
      });
      console.log("[checkout] cobrança criada", { chargeId: charge.id, status: charge.status });

      // ── PIX: busca QR code em endpoint separado ────────────
      if (billingType === "PIX") {
        console.log("[checkout] buscando pixQrCode para", charge.id);
        const pix = await getPixQrCode(charge.id);
        return successResponse(
          {
            tipo: "pix",
            chargeId: charge.id,
            pixQrCodeBase64: pix.encodedImage,
            pixCopiaECola: pix.payload,
            valor: SUBSCRIPTION_PRICE,
            vencimento: dueDate,
          },
          "QR code PIX gerado"
        );
      }

      // ── Boleto: retorna link do PDF ────────────────────────
      if (!charge.bankSlipUrl && !charge.invoiceUrl) {
        return errorResponse("Link do boleto não gerado", 502);
      }
      return successResponse(
        { tipo: "boleto", chargeId: charge.id, bankSlipUrl: charge.bankSlipUrl ?? charge.invoiceUrl, valor: SUBSCRIPTION_PRICE, vencimento: dueDate },
        "Boleto gerado"
      );
    } catch (err: any) {
      console.error("[Asaas] Erro ao gerar cobrança de assinatura:", err?.message);
      return errorResponse(err?.message ?? "Erro ao gerar link de pagamento", 502);
    }
  });
}
