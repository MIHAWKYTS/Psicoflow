import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestContext } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(_req: NextRequest) {
  const ctx = await getRequestContext();
  if (!ctx) return errorResponse("Não autorizado", 401);

  const transactions = await prisma.financialTransaction.findMany({
    where: { tenantId: ctx.tenantId },
    orderBy: { dataVencimento: "desc" },
    take: 50,
    include: {
      patient: { select: { id: true, nome: true } },
    },
  });

  return successResponse({ transactions });
}
