import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildPasswordResetEmail } from "@/lib/email";
import { successResponse, errorResponse } from "@/lib/api-helpers";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});

const GENERIC_MESSAGE = "Se este e-mail estiver cadastrado, você receberá as instruções em breve.";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("E-mail inválido", 400);
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    // Resposta genérica independente de o e-mail existir
    if (!user) {
      return successResponse(null, GENERIC_MESSAGE);
    }

    // Deletar tokens anteriores do usuário
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/resetar-senha?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Redefinição de senha — PsicoFlow",
      html: buildPasswordResetEmail(user.nome, resetLink),
    });

    return successResponse(null, GENERIC_MESSAGE);
  } catch (err) {
    console.error("Erro no forgot-password:", err);
    return successResponse(null, GENERIC_MESSAGE);
  }
}
