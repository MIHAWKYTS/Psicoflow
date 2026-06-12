import { withAuth } from "@/lib/context";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { cancelSubscription } from "@/lib/asaas";
import { addDays, format } from "date-fns";

// POST /api/subscription/cancel
// Define dataFimAcesso = hoje + 30 dias. statusAssinatura permanece "ativo".
// Se houver assinatura recorrente (cartão), cancela no Asaas.
export async function POST() {
  return withAuth(async (ctx) => {
    if (ctx.role !== "psicologo_admin") {
      return errorResponse("Apenas o administrador da clínica pode cancelar.", 403);
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { id: true, asaasSubscriptionId: true, statusAssinatura: true, dataFimAcesso: true },
    });

    if (!tenant) return errorResponse("Tenant não encontrado", 404);
    if (tenant.dataFimAcesso) {
      return errorResponse("Cancelamento já agendado para " + format(tenant.dataFimAcesso, "dd/MM/yyyy"), 409);
    }

    try {
      // Cancela assinatura recorrente no Asaas (cartão)
      if (tenant.asaasSubscriptionId) {
        await cancelSubscription(tenant.asaasSubscriptionId).catch(() => {});
      }

      const dataFimAcesso = addDays(new Date(), 30);

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          dataFimAcesso,
          asaasSubscriptionId: null,
        },
      });

      return successResponse(
        { dataFimAcesso: format(dataFimAcesso, "dd/MM/yyyy") },
        "Assinatura cancelada. Seu acesso continua até " + format(dataFimAcesso, "dd/MM/yyyy") + "."
      );
    } catch (err: any) {
      console.error("[Subscription] Erro ao cancelar:", err?.message);
      return errorResponse(err?.message ?? "Erro ao cancelar assinatura", 500);
    }
  });
}
