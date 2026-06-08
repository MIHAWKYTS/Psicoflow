import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "ADMIN_SECRET_TROCAR_EM_PRODUCAO";
const COOKIE_NAME = "psicoflow_admin_token";

export function generateAdminToken(): string {
  return jwt.sign({ role: "super_admin" }, ADMIN_JWT_SECRET, { expiresIn: "24h" });
}

export function verifyAdminToken(token: string): jwt.JwtPayload | null {
  try {
    return jwt.verify(token, ADMIN_JWT_SECRET) as jwt.JwtPayload;
  } catch {
    return null;
  }
}

export async function setAdminCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
}

export async function removeAdminCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
