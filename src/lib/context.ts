import { headers } from "next/headers";
import { errorResponse } from "./api-helpers";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";

export interface RequestContext {
  userId: string;
  tenantId: string;
  role: UserRole;
  subscriptionStatus: string;
  email: string;
  nome?: string;
  jti: string;
}

export async function getRequestContext(): Promise<RequestContext | null> {
  const reqHeaders = await headers();
  const userId = reqHeaders.get("x-user-id");
  const tenantId = reqHeaders.get("x-tenant-id");
  const role = reqHeaders.get("x-user-role");
  const subscriptionStatus = reqHeaders.get("x-subscription-status");
  const email = reqHeaders.get("x-user-email");
  const jti = reqHeaders.get("x-token-jti");
  const encodedNome = reqHeaders.get("x-user-nome");
  const nome = encodedNome ? decodeURIComponent(encodedNome) : undefined;

  if (!userId || !tenantId || !role || !subscriptionStatus || !email || !jti) {
    return null;
  }

  return {
    userId,
    tenantId,
    role: role as UserRole,
    subscriptionStatus,
    email,
    nome,
    jti,
  };
}

export async function withAuth(
  callback: (context: RequestContext) => Promise<any>
) {
  const context = await getRequestContext();
  if (!context) {
    return errorResponse("Não autorizado", 401);
  }

  // Verifica se o token está na blacklist (invalidado por logout ou troca de senha)
  const invalidated = await prisma.invalidatedToken.findUnique({
    where: { jti: context.jti },
  });
  if (invalidated) {
    return errorResponse("Sessão inválida. Faça login novamente.", 401);
  }

  return callback(context);
}
