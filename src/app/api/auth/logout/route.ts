import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-helpers";
import { removeAuthCookie, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("psigen_token")?.value;

  if (token) {
    const payload = verifyToken(token);
    if (payload?.jti) {
      const exp = payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      try {
        await prisma.invalidatedToken.create({
          data: { jti: payload.jti, userId: payload.userId, expiresAt: exp },
        });
      } catch {
        // Ignora erro se o token já estiver na blacklist
      }
    }
  }

  await removeAuthCookie();
  return successResponse(null, "Logout realizado com sucesso");
}
