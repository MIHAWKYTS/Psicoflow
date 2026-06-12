import { withAuth } from "@/lib/context";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// GET /api/subscription/info — retorna status de assinatura do tenant
export async function GET() {
  return withAuth(async (ctx) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { statusAssinatura: true, dataFimAcesso: true, asaasSubscriptionId: true },
    });

    if (!tenant) return errorResponse("Tenant não encontrado", 404);

    return successResponse({
      statusAssinatura: tenant.statusAssinatura,
      dataFimAcesso: tenant.dataFimAcesso?.toISOString() ?? null,
      temAssinaturaRecorrente: !!tenant.asaasSubscriptionId,
    });
  });
}
