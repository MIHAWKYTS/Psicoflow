export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";

function slugify(text: string, tenantId: string): string {
  const slug = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${slug}-${tenantId.slice(0, 8)}`;
}

// GET — busca instância do tenant
export async function GET(_req: NextRequest) {
  return withAuth(async (ctx) => {
    if (ctx.role !== "psicologo_admin") {
      return errorResponse("Acesso não autorizado.", 403);
    }

    const instance = await prisma.whatsAppInstance.findFirst({
      where: { tenantId: ctx.tenantId },
      select: {
        id: true,
        instanceName: true,
        statusConexao: true,
        createdAt: true,
      },
    });

    return successResponse(instance);
  });
}

// POST — cria instância na Evolution API e salva no banco
export async function POST(_req: NextRequest) {
  return withAuth(async (ctx) => {
    if (ctx.role !== "psicologo_admin") {
      return errorResponse("Acesso não autorizado.", 403);
    }

    const existing = await prisma.whatsAppInstance.findFirst({
      where: { tenantId: ctx.tenantId },
    });

    if (existing) {
      return successResponse(existing);
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { nomeClinica: true },
    });

    if (!tenant) {
      return errorResponse("Tenant não encontrado.", 404);
    }

    const instanceName = slugify(tenant.nomeClinica, ctx.tenantId);
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;

    if (!evolutionUrl || !evolutionKey) {
      return errorResponse("Configuração da Evolution API ausente.", 500);
    }

    const res = await fetch(`${evolutionUrl}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: evolutionKey,
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });

    if (!res.ok) {
      const body = await res.text();

      // Instância já existe na Evolution API mas não está no banco — recuperar
      const alreadyInUse =
        res.status === 403 && body.includes("already in use");

      if (!alreadyInUse) {
        return errorResponse(`Erro ao criar instância na Evolution API: ${body}`, 500);
      }
    }

    const instance = await prisma.whatsAppInstance.create({
      data: {
        tenantId: ctx.tenantId,
        instanceName,
        statusConexao: "qr_code_pendente",
      },
    });

    return successResponse(instance, "Instância criada com sucesso.", 201);
  });
}

// DELETE — desconecta e remove instância
export async function DELETE(_req: NextRequest) {
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

    if (evolutionUrl && evolutionKey) {
      await fetch(`${evolutionUrl}/instance/delete/${instance.instanceName}`, {
        method: "DELETE",
        headers: { apikey: evolutionKey },
      }).catch(() => {});
    }

    await prisma.whatsAppInstance.delete({ where: { id: instance.id } });

    return successResponse(null, "Instância desconectada com sucesso.");
  });
}
