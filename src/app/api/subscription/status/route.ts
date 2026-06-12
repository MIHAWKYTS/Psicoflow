import { withAuth } from "@/lib/context";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// GET /api/subscription/status — usado pelo frontend para polling após PIX/Boleto
export async function GET() {
  return withAuth(async (ctx) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { statusAssinatura: true },
    });

    if (!tenant) return errorResponse("Tenant não encontrado", 404);

    return successResponse({ statusAssinatura: tenant.statusAssinatura });
  });
}
