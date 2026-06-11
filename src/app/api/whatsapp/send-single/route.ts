export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    const body = (await parseSafeBody(req)) ?? {};
    const { sessionId } = body;

    if (!sessionId) {
      return errorResponse("sessionId é obrigatório.", 400);
    }

    // 2.2 — Buscar sessão garantindo tenantId
    const session = await prisma.session.findFirst({
      where: { id: sessionId, tenantId: ctx.tenantId },
      include: {
        patient: { select: { id: true, nome: true, telefoneWhatsapp: true } },
      },
    });

    if (!session) {
      return errorResponse("Sessão não encontrada.", 404);
    }

    // 2.3 — Validar telefone
    const phone = session.patient?.telefoneWhatsapp;
    if (!phone) {
      return errorResponse("O paciente não possui WhatsApp cadastrado.", 422);
    }

    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;

    if (!evolutionUrl || !evolutionKey) {
      return errorResponse("Configuração da Evolution API ausente.", 500);
    }

    // 2.4 — Buscar instância conectada
    const instance = await prisma.whatsAppInstance.findFirst({
      where: { tenantId: ctx.tenantId, statusConexao: "conectado" },
      select: { instanceName: true },
    });

    if (!instance) {
      return errorResponse("Nenhuma instância WhatsApp conectada.", 422);
    }

    // 2.5 — Enviar mensagem com o mesmo template do disparo em massa
    const digits = phone.replace(/\D/g, "");
    const hora = new Date(session.dataHoraInicio).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const text = `Olá, ${session.patient?.nome ?? "paciente"}! Gostaria de confirmar a sessão que está marcada para ${hora}. Podemos confirmar?`;

    const res = await fetch(`${evolutionUrl}/message/sendText/${instance.instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: evolutionKey },
      body: JSON.stringify({ number: `55${digits}`, text }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return errorResponse(errData?.message ?? "Erro ao enviar mensagem.", 502);
    }

    // 2.6 — Marcar lembrete enviado
    await prisma.session.update({
      where: { id: sessionId },
      data: { lembreteEnviado: true },
    });

    return successResponse({ sent: true }, "Mensagem enviada com sucesso.");
  });
}
