import { z } from "zod";

// ===========================
// PsicoFlow - Schemas de Validação (Zod)
// ===========================


export function validateCPF(cpf: string): boolean {
  // Remove formatação
  const digits = cpf.replace(/\D/g, "");

  if (digits.length !== 11) return false;

  // Rejeita sequências repetidas
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Calcula primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  // Calcula segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;

  return true;
}

// ─── Blacklist de E-mail ──────────────────────────────────────

export const BLOCKED_EMAIL_DOMAINS = [
  "mailinator.com",
  "yopmail.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "trashmail.com",
  "throwaway.email",
  "fakeinbox.com",
  "sharklasers.com",
  "guerrillamailblock.com",
  "grr.la",
  "spam4.me",
  "teste.com",
  "exemplo.com",
  "test.com",
  "example.com",
  "naoexiste.com",
  "invalid.com",
];

/**
 * Schema Zod reutilizável para e-mail com blacklist de domínios.
 * Validação é case-insensitive no domínio.
 */
export const emailSchema = z
  .string()
  .email("E-mail inválido")
  .refine((email) => {
    const domain = email.split("@")[1]?.toLowerCase();
    return domain ? !BLOCKED_EMAIL_DOMAINS.includes(domain) : false;
  }, "Este domínio de e-mail não é permitido");

// ─── Auth ───────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export const registroSchema = z.object({
  nomeClinica: z.string().min(2, "Nome da clínica é obrigatório"),
  documento: z.string().min(11, "CPF ou CNPJ inválido"),
  nome: z.string().min(2, "Nome é obrigatório"),
  email: emailSchema,
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

// ─── Pacientes ──────────────────────────────────────────────

export const patientSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  cpf: z
    .string()
    .optional()
    .refine((val) => !val || validateCPF(val), "CPF inválido"),
  telefoneWhatsapp: z.string().optional(),
  status: z.enum(["ativo", "inativo"]).default("ativo"),
  frequenciaSessoes: z.enum(["semanal", "quinzenal", "mensal"]).optional(),
  valorSessaoPadrao: z.number().positive("Valor deve ser positivo").optional(),
});

// ─── Sessões ────────────────────────────────────────────────

export const sessionSchema = z.object({
  patientId: z.string().uuid("Paciente inválido"),
  dataHoraInicio: z.string().datetime("Data/hora de início inválida"),
  dataHoraFim: z.string().datetime("Data/hora de fim inválida"),
  status: z.enum(["agendada", "realizada", "cancelada", "falta"]).default("agendada"),
});

// ─── Prontuários ────────────────────────────────────────────

export const clinicalRecordSchema = z.object({
  patientId: z.string().uuid("Paciente inválido"),
  sessionId: z.string().uuid("Sessão inválida").optional(),
  conteudo: z.string().min(1, "Conteúdo é obrigatório"),
});

// ─── Financeiro ─────────────────────────────────────────────

export const financialTransactionSchema = z.object({
  patientId: z.string().uuid().optional(),
  tipo: z.enum(["receita", "despesa"]),
  categoria: z.enum(["consultorio", "pessoal"]),
  descricao: z.string().optional(),
  valor: z.number().positive("Valor deve ser positivo"),
  statusPagamento: z.enum(["pendente", "pago", "cancelado"]).default("pendente"),
  dataVencimento: z.string().datetime("Data de vencimento inválida"),
});

// ─── Paciente Status Toggle (PATCH parcial) ──────────────────

export const patientStatusSchema = z.object({
  status: z.enum(["ativo", "inativo"], {
    error: "Status deve ser 'ativo' ou 'inativo'",
  }),
});

// ─── Types inferidos ────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type PatientInput = z.infer<typeof patientSchema>;
export type PatientStatusInput = z.infer<typeof patientStatusSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type ClinicalRecordInput = z.infer<typeof clinicalRecordSchema>;
export type FinancialTransactionInput = z.infer<typeof financialTransactionSchema>;
