// ===========================
// PsicoFlow - Constantes do Sistema
// ===========================

/** Duração do período de trial em dias */
export const TRIAL_DURATION_DAYS = 30;

/** Roles disponíveis no sistema */
export const ROLES = {
  PSICOLOGO_ADMIN: "psicologo_admin",
  SECRETARIA: "secretaria",
} as const;

/** Status de assinatura do tenant */
export const SUBSCRIPTION_STATUS = {
  TRIAL: "trial",
  ATIVO: "ativo",
  INADIMPLENTE: "inadimplente",
  CANCELADO: "cancelado",
} as const;

/** Status de sessão */
export const SESSION_STATUS = {
  AGENDADA: "agendada",
  REALIZADA: "realizada",
  CANCELADA: "cancelada",
  FALTA: "falta",
} as const;

/** Status de pagamento */
export const PAYMENT_STATUS = {
  PENDENTE: "pendente",
  PAGO: "pago",
  CANCELADO: "cancelado",
} as const;

/** Rotas públicas que não exigem autenticação */
export const PUBLIC_ROUTES = [
  "/login",
  "/registro",
  "/esqueci-senha",
] as const;

/** Rotas que NÃO são bloqueadas por inadimplência */
export const INADIMPLENTE_ALLOWED_ROUTES = [
  "/dashboard/pagamento",
  "/dashboard/configuracoes",
] as const;

/** Rotas bloqueadas para secretária */
export const SECRETARIA_BLOCKED_ROUTES = [
  "/dashboard/financeiro",
  "/dashboard/prontuarios",
] as const;
