import { z } from "zod";

// ===========================
// PsiGen - Schemas de Validação (Zod)
// ===========================

// ─── CPF ────────────────────────────────────────────────

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += parseInt(digits[i]) * (len + 1 - i);
    }
    const rem = (sum * 10) % 11;
    return rem === 10 || rem === 11 ? 0 : rem;
  };

  return calc(9) === parseInt(digits[9]) && calc(10) === parseInt(digits[10]);
}

// ─── E-mail blacklist ────────────────────────────────────

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

export const emailSchema = z
  .string()
  .email("E-mail inválido")
  .refine((email) => {
    const domain = email.split("@")[1]?.toLowerCase();
    return domain ? !BLOCKED_EMAIL_DOMAINS.includes(domain) : false;
  }, "Este domínio de e-mail não é permitido");

// ─── Auth ───────────────────────────────────────────────

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
  cpf: z.string().refine((val) => !val || validateCPF(val), { message: "CPF inválido" }).optional(),
  dataNascimento: z.string().datetime().optional(),
  responsavelLegal: z.string().optional(),
  genero: z.string().optional(),
  profissao: z.string().optional(),
  estadoCivil: z.string().optional(),
  endereco: z.string().optional(),
  email: z.string().email("E-mail inválido").optional(),
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
  contratoTerapeutico: z.string().optional(),
  anamnese: z.string().optional(),
  avaliacaoHipotese: z.string().optional(),
  planoTrabalho: z.string().optional(),
  encerramento: z.string().optional(),
  dataEncerramento: z.string().datetime().optional(),
});

// ─── Financeiro ─────────────────────────────────────────────

export const financialTransactionSchema = z.object({
  patientId: z.string().uuid().optional(),
  tipo: z.enum(["receita", "despesa"]),
  categoria: z.enum(["consultorio", "pessoal"]),
  descricao: z.string().optional(),
  valor: z.number().positive("Valor deve ser positivo"),
  statusPagamento: z.enum(["pendente", "pago", "cancelado"]).default("pendente"),
  dataVencimento: z.string().date("Data de vencimento inválida").optional(),
  formaPagamento: z.enum(["dinheiro", "pix", "cartao"]).optional(),
  parcelas: z.number().int().min(1).max(48).optional(),
});

// ─── Rotina: Tarefas e Casos ───────────────────────────────

export const taskSchema = z.object({
  titulo: z.string().min(2, "Título é obrigatório"),
  descricao: z.string().optional(),
  status: z.enum(["pendente", "em_andamento", "concluida"]).default("pendente"),
  patientId: z.string().uuid("Paciente inválido").optional(),
  dataVencimento: z.string().datetime("Data de vencimento inválida").optional(),
});

export const clinicalCaseSchema = z.object({
  titulo: z.string().min(2, "Título é obrigatório"),
  descricao: z.string().optional(),
  hipoteses: z.string().optional(),
  documentosUrls: z.array(z.string().url("URL de documento inválida")).default([]),
});

// ─── Engajamento: Materiais e lembretes ────────────────────

export const materialSendSchema = z.object({
  patientId: z.string().uuid("Paciente inválido"),
  assunto: z.string().min(3, "Assunto é obrigatório"),
  mensagem: z.string().min(5, "Mensagem é obrigatória"),
  links: z.array(z.string().url("Link inválido")).default([]),
  pdfUrls: z.array(z.string().url("URL de PDF inválida")).default([]),
  enviarAutomaticamente: z.boolean().default(false),
});

// ─── Evolução Clínica ──────────────────────────────────

export const clinicalEvolutionSchema = z.object({
  temas: z.string().min(2, "Temas são obrigatórios"),
  intervencoes: z.string().min(2, "Intervenções são obrigatórias"),
  respostaPaciente: z.string().optional(),
  encaminhamentos: z.string().optional(),
  sessionId: z.string().uuid("Sessão inválida").optional(),
  dataHora: z.string().datetime("Data/hora inválida"),
});

// ─── Paciente Status Toggle (PATCH parcial) ──────────────────

export const patientStatusSchema = z.object({
  status: z.enum(["ativo", "inativo"], {
    error: "Status deve ser 'ativo' ou 'inativo'",
  }),
});

// ─── Types inferidos ────────────────────────────────────────

export type ClinicalEvolutionInput = z.infer<typeof clinicalEvolutionSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type PatientInput = z.infer<typeof patientSchema>;
export type PatientStatusInput = z.infer<typeof patientStatusSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type ClinicalRecordInput = z.infer<typeof clinicalRecordSchema>;
export type FinancialTransactionInput = z.infer<typeof financialTransactionSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type ClinicalCaseInput = z.infer<typeof clinicalCaseSchema>;
export type MaterialSendInput = z.infer<typeof materialSendSchema>;
