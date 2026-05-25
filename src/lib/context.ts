import { headers } from "next/headers";
import { errorResponse } from "./api-helpers";
import { UserRole } from "@prisma/client";

export interface RequestContext {
  userId: string;
  tenantId: string;
  role: UserRole;
  subscriptionStatus: string;
}

/**
 * Obtém os dados contextuais da requisição vindos do Middleware.
 * Retorna null se a requisição não estiver autenticada.
 */
export async function getRequestContext(): Promise<RequestContext | null> {
  const reqHeaders = await headers();
  const userId = reqHeaders.get("x-user-id");
  const tenantId = reqHeaders.get("x-tenant-id");
  const role = reqHeaders.get("x-user-role");
  const subscriptionStatus = reqHeaders.get("x-subscription-status");

  if (!userId || !tenantId || !role || !subscriptionStatus) {
    return null;
  }

  return {
    userId,
    tenantId,
    role: role as UserRole,
    subscriptionStatus,
  };
}

/**
 * Helper para validar autenticação e multi-tenant nas API Routes.
 * Caso falhe, retorna a resposta de erro apropriada.
 * Caso passe, executa a callback com os dados contextuais.
 */
export async function withAuth(
  callback: (context: RequestContext) => Promise<any>
) {
  const context = await getRequestContext();
  if (!context) {
    return errorResponse("Não autorizado", 401);
  }
  return callback(context);
}
