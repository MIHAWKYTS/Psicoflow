import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { materialSendSchema } from "@/lib/validations";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";
import { sendEmail, buildMaterialFollowUpEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    try {
      const body = await parseSafeBody(req);
      if (!body) return errorResponse("Payload muito grande", 413);
      const parsed = materialSendSchema.safeParse(body);
      if (!parsed.success) {
        const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
        return errorResponse(errorMsg, 400);
      }

      const patient = await prisma.patient.findFirst({
        where: { id: parsed.data.patientId, tenantId: ctx.tenantId },
      });

      if (!patient) {
        return errorResponse("Paciente não encontrado", 404);
      }

      if (!patient.email) {
        return errorResponse(
          "Paciente sem e-mail cadastrado. Atualize o cadastro para enviar materiais.",
          400
        );
      }

      await sendEmail({
        to: patient.email,
        subject: parsed.data.assunto,
        html: buildMaterialFollowUpEmail(
          patient.nome,
          parsed.data.mensagem,
          parsed.data.links,
          parsed.data.pdfUrls
        ),
      });

      return successResponse(
        {
          patientId: patient.id,
          sentTo: patient.email,
          automatic: parsed.data.enviarAutomaticamente,
        },
        "Material enviado com sucesso"
      );
    } catch (err) {
      console.error("Erro ao enviar materiais pós-sessão:", err);
      return errorResponse("Erro interno no servidor ao enviar materiais", 500);
    }
  });
}
