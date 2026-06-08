import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-helpers";

const schema = z.object({
  token: z.string().min(1, "Token obrigatório"),
  novaSenha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(", ");
      return errorResponse(msg, 400);
    }

    const { token, novaSenha } = parsed.data;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return errorResponse("Link inválido.", 400);
    }

    if (resetToken.usedAt) {
      return errorResponse("Link já utilizado. Solicite um novo.", 400);
    }

    if (resetToken.expiresAt < new Date()) {
      return errorResponse("Link expirado. Solicite um novo.", 400);
    }

    const senhaHash = await hashPassword(novaSenha);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { senhaHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return successResponse(null, "Senha redefinida com sucesso.");
  } catch (err) {
    console.error("Erro no reset-password:", err);
    return errorResponse("Erro interno no servidor", 500);
  }
}
