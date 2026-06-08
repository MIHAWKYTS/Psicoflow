export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(_req: NextRequest) {
  return withAuth(async (ctx) => {
    if (ctx.role !== "psicologo_admin") {
      return errorResponse("Acesso não autorizado.", 403);
    }

    const instance = await prisma.whatsAppInstance.findFirst({
      where: { tenantId: ctx.tenantId },
    });

    if (!instance) {
      return errorResponse("Nenhuma instância encontrada.", 404);
    }

    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;

    if (!evolutionUrl || !evolutionKey) {
      return errorResponse("Configuração da Evolution API ausente.", 500);
    }

    const res = await fetch(
      `${evolutionUrl}/instance/connectionState/${instance.instanceName}`,
      { headers: { apikey: evolutionKey } }
    );

    if (!res.ok) {
      return successResponse({ statusConexao: instance.statusConexao });
    }

    const data = await res.json();

    // Evolution API v2 pode retornar em diferentes estruturas
    const state: string = (
      data?.instance?.state ??
      data?.instance?.connectionStatus ??
      data?.state ??
      data?.connectionStatus ??
      ""
    ).toLowerCase();

    const isConnected = state === "open";

    if (isConnected && instance.statusConexao !== "conectado") {
      await prisma.whatsAppInstance.update({
        where: { id: instance.id },
        data: { statusConexao: "conectado" },
      });
      return successResponse({ statusConexao: "conectado", evolutionState: state });
    }

    return successResponse({
      statusConexao: instance.statusConexao,
      evolutionState: state,
    });
  });
}
