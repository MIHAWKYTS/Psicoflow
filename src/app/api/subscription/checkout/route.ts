import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { findOrCreateCustomer, createCharge, type AsaasBillingType } from "@/lib/asaas";
import { format, addDays } from "date-fns";

export const SUBSCRIPTION_PRICE = 120;

const ALLOWED_BILLING_TYPES: AsaasBillingType[] = ["PIX", "BOLETO", "CREDIT_CARD"];

// ─── POST /api/subscription/checkout ───────────────────────────────────────
// Gera uma cobrança Asaas para a assinatura do tenant e retorna o invoiceUrl.
// Apenas psicologo_admin pode assinar.
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

    // Busca o tenant e o usuário admin
    const [tenant, adminUser] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: ctx.tenantId } }),
      prisma.user.findUnique({ where: { id: ctx.userId }, select: { email: true, cpf: true } }),
    ]);

    if (!tenant) return errorResponse("Tenant não encontrado", 404);

    try {
      // Garante que o tenant existe como cliente no Asaas
      const asaasCustomer = await findOrCreateCustomer({
        name: tenant.nomeClinica,
        cpfCnpj: tenant.documento,
        email: adminUser?.email ?? ctx.email,
      });

      // Persiste asaasCustomerId no tenant se ainda não tiver
      if (!tenant.asaasCustomerId) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { asaasCustomerId: asaasCustomer.id },
        });
      }

      const dueDate = format(addDays(new Date(), 1), "yyyy-MM-dd");

      const charge = await createCharge({
        customer: asaasCustomer.id,
        billingType,
        value: SUBSCRIPTION_PRICE,
        dueDate,
        description: "Assinatura PsiGen — Plano Clínica",
        externalReference: `sub_tenant_${tenant.id}`,
      });

      if (!charge.invoiceUrl) {
        return errorResponse("Não foi possível gerar o link de pagamento", 502);
      }

      return successResponse(
        { invoiceUrl: charge.invoiceUrl, billingType, valor: SUBSCRIPTION_PRICE },
        "Link de pagamento gerado com sucesso"
      );
    } catch (err: any) {
      console.error("[Asaas] Erro ao gerar cobrança de assinatura:", err?.message);
      return errorResponse(err?.message ?? "Erro ao gerar link de pagamento", 502);
    }
  });
}
