// ===========================
// PsicoFlow - Tipos Globais
// ===========================

import type { UserRole, StatusAssinatura } from "@prisma/client";

/**
 * Payload do token JWT decodificado.
 * Presente em todas as requisições autenticadas.
 */
export interface JWTPayload {
  userId: string;
  tenantId: string;
  nome: string;
  email: string;
  role: UserRole;
  statusAssinatura: StatusAssinatura;
  iat?: number;
  exp?: number;
}

/**
 * Resposta padrão da API.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Parâmetros de paginação.
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Resposta paginada.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Dados do usuário autenticado (sem senha).
 */
export interface AuthUser {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  role: UserRole;
  tenant: {
    id: string;
    nomeClinica: string;
    statusAssinatura: StatusAssinatura;
    dataFimTrial: Date;
  };
}
