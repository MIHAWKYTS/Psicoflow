import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { createCustomer, createSubscription, getSubscriptionPayments, type AsaasBillingType } from "@/lib/asaas";
import { format, addDays } from "date-fns";

const ALLOWED_BILLING_TYPES: AsaasBillingType[] = ["CREDIT_CARD", "PIX"];
const SUBSCRIPTION_PRICE = 100;

export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    let body: any;
    try { body = await req.json(); } catch { body = {}; }

    const billingType: AsaasBillingType = body?.billingType;
    if (!ALLOWED_BILLING_TYPES.includes(billingType)) {
      return errorResponse(`billingType inválido. Use: ${ALLOWED_BILLING_TYPES.join(", ")}`, 400);
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: ctx.tenantId } });
    if (!tenant) return errorResponse("Tenant não encontrado", 404);

    try {
      let customerId = tenant.asaasCustomerId;
      if (!customerId) {
        const adminUser = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { email: true } });
        const customer = await createCustomer({
          name: tenant.nomeClinica,
          cpfCnpj: tenant.documento,
          email: adminUser?.email ?? ctx.email,
        });
        customerId = customer.id;
        await prisma.tenant.update({ where: { id: tenant.id }, data: { asaasCustomerId: customerId } });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const subscription = await createSubscription({
        customer: customerId,
        billingType,
        value: SUBSCRIPTION_PRICE,
        nextDueDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
        cycle: "MONTHLY",
        description: "Assinatura PsiGen — Plano Clínica",
        externalReference: `sub_tenant_${tenant.id}`,
        successUrl: `${appUrl}/api/billing/callback`,
      } as any);

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { asaasSubscriptionId: subscription.id, dataFimAcesso: null },
      });

      const payments = await getSubscriptionPayments(subscription.id);
      const paymentUrl = payments.data[0]?.invoiceUrl ?? null;
      if (!paymentUrl) return errorResponse("URL de pagamento não gerada pelo Asaas", 502);

      return successResponse({ paymentUrl }, "Checkout criado");
    } catch (err: any) {
      console.error("[billing/checkout] Erro:", err?.message);
      return errorResponse(err?.message ?? "Erro ao criar checkout", 502);
    }
  });
}
