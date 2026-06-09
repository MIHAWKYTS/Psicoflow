import { prisma } from "./prisma";
import { AuditAcao } from "@prisma/client";

export async function logAudit(
  tenantId: string,
  userId: string,
  acao: AuditAcao,
  recurso: string,
  recursoId: string,
  ip?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { tenantId, userId, acao, recurso, recursoId, ip },
    });
  } catch (err) {
    console.error("[AuditLog] Falha ao registrar:", err);
  }
}

export function extractIp(request: Request): string | undefined {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    undefined
  );
}
