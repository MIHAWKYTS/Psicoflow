// ===========================
// PsiGen - Serviço de Autenticação
// ===========================

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import type { JWTPayload } from "@/types";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET não definido nas variáveis de ambiente");
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const COOKIE_NAME = "psigen_token";

// ─── Senha ──────────────────────────────────────────────

/**
 * Gera um hash bcrypt para a senha fornecida.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compara uma senha em texto plano com o hash armazenado.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT ────────────────────────────────────────────────

/**
 * Gera um token JWT com os dados do usuário.
 */
export function generateToken(payload: Omit<JWTPayload, "iat" | "exp" | "jti">): string {
  return jwt.sign({ ...payload, jti: randomUUID() }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Verifica e decodifica um token JWT.
 * Retorna null se o token for inválido ou expirado.
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// ─── Cookies ────────────────────────────────────────────

/**
 * Salva o token JWT em um cookie HttpOnly seguro.
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: "/",
  });
}

/**
 * Obtém o token JWT do cookie.
 */
export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/**
 * Remove o cookie de autenticação (logout).
 */
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Obtém o payload do usuário autenticado a partir do cookie.
 * Retorna null se não autenticado ou token inválido.
 */
export async function getAuthUser(): Promise<JWTPayload | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  return verifyToken(token);
}
