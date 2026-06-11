import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyToken } from "@/lib/auth";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";

const schema = z.object({
  token: z.string().min(1, "Token obrigatório"),
  novaSenha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await parseSafeBody(req);
    if (!body) return errorResponse("Payload muito grande", 413);
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

    // Invalida token ativo do usuário se houver (cookie de sessão)
    const activeToken = req.cookies.get("psigen_token")?.value;
    if (activeToken) {
      const payload = verifyToken(activeToken);
      if (payload?.jti) {
        const exp = payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        try {
          await prisma.invalidatedToken.create({
            data: { jti: payload.jti, userId: payload.userId, expiresAt: exp },
          });
        } catch {
          // Ignora se já estiver na blacklist
        }
      }
    }

    return successResponse(null, "Senha redefinida com sucesso.");
  } catch (err) {
    console.error("Erro no reset-password:", err);
    return errorResponse("Erro interno no servidor", 500);
  }
}
