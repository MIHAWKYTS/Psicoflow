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

    if (instance.statusConexao === "conectado") {
      return errorResponse("Instância já está conectada.", 400);
    }

    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;

    if (!evolutionUrl || !evolutionKey) {
      return errorResponse("Configuração da Evolution API ausente.", 500);
    }

    const res = await fetch(
      `${evolutionUrl}/instance/connect/${instance.instanceName}`,
      { headers: { apikey: evolutionKey } }
    );

    if (!res.ok) {
      return errorResponse("Erro ao obter QR Code da Evolution API.", 500);
    }

    const data = await res.json();
    const base64 = data?.base64 ?? data?.qrcode?.base64 ?? null;

    if (!base64) {
      return errorResponse("QR Code não disponível.", 404);
    }

    return successResponse({ base64 });
  });
}
