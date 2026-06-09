import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    const body = await req.json().catch(() => ({}));
    const { patientId, mensagem, files } = body as {
      patientId?: string;
      mensagem?: string;
      files?: { url: string; name: string }[];
    };

    if (!patientId || !mensagem || !Array.isArray(files) || files.length === 0) {
      return errorResponse("patientId, mensagem e files são obrigatórios.", 400);
    }

    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId: ctx.tenantId },
    });
    if (!patient) return errorResponse("Paciente não encontrado.", 404);

    const phone = patient.telefoneWhatsapp;
    if (!phone) return errorResponse("Paciente sem WhatsApp cadastrado.", 422);

    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;
    if (!evolutionUrl || !evolutionKey) {
      return errorResponse("Configuração da Evolution API ausente.", 500);
    }

    const instance = await prisma.whatsAppInstance.findFirst({
      where: { tenantId: ctx.tenantId, statusConexao: "conectado" },
      select: { instanceName: true },
    });
    if (!instance) return errorResponse("Nenhuma instância WhatsApp conectada.", 422);

    const digits = phone.replace(/\D/g, "");
    let sent = 0;

    for (let i = 0; i < files.length; i++) {
      const { url, name } = files[i];
      const fileName = name || "material";
      const mediatype = /\.(jpe?g|png|gif|webp)$/i.test(fileName) ? "image" : "document";

      const res = await fetch(`${evolutionUrl}/message/sendMedia/${instance.instanceName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evolutionKey },
        body: JSON.stringify({
          number: `55${digits}`,
          mediatype,
          media: url,
          fileName,
          caption: i === 0 ? mensagem : undefined,
        }),
      });

      if (res.ok) sent++;
    }

    if (sent === 0) return errorResponse("Falha ao enviar os arquivos via WhatsApp.", 502);

    return successResponse(
      { sent, total: files.length },
      `${sent} arquivo(s) enviado(s) via WhatsApp.`
    );
  });
}
