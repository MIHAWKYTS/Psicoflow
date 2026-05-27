import { z } from "zod";

// ===========================
// PsicoFlow - Schemas de Validação (Zod)
// ===========================

// ─── Auth ───────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export const registroSchema = z.object({
  nomeClinica: z.string().min(2, "Nome da clínica é obrigatório"),
  documento: z.string().min(11, "CPF ou CNPJ inválido"),
  nome: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

// ─── Pacientes ──────────────────────────────────────────

export const patientSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido").optional(),
  telefoneWhatsapp: z.string().optional(),
  status: z.enum(["ativo", "inativo"]).default("ativo"),
  frequenciaSessoes: z.enum(["semanal", "quinzenal", "mensal"]).optional(),
  valorSessaoPadrao: z.number().positive("Valor deve ser positivo").optional(),
});

// ─── Sessões ────────────────────────────────────────────

export const sessionSchema = z.object({
  patientId: z.string().uuid("Paciente inválido"),
  dataHoraInicio: z.string().datetime("Data/hora de início inválida"),
  dataHoraFim: z.string().datetime("Data/hora de fim inválida"),
  status: z.enum(["agendada", "realizada", "cancelada", "falta"]).default("agendada"),
});

// ─── Prontuários ────────────────────────────────────────

export const clinicalRecordSchema = z.object({
  patientId: z.string().uuid("Paciente inválido"),
  sessionId: z.string().uuid("Sessão inválida").optional(),
  conteudo: z.string().min(1, "Conteúdo é obrigatório"),
});

// ─── Financeiro ─────────────────────────────────────────

export const financialTransactionSchema = z.object({
  patientId: z.string().uuid().optional(),
  tipo: z.enum(["receita", "despesa"]),
  categoria: z.enum(["consultorio", "pessoal"]),
  descricao: z.string().optional(),
  valor: z.number().positive("Valor deve ser positivo"),
  statusPagamento: z.enum(["pendente", "pago", "cancelado"]).default("pendente"),
  dataVencimento: z.string().datetime("Data de vencimento inválida"),
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

// ─── Types inferidos ────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type PatientInput = z.infer<typeof patientSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type ClinicalRecordInput = z.infer<typeof clinicalRecordSchema>;
export type FinancialTransactionInput = z.infer<typeof financialTransactionSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type ClinicalCaseInput = z.infer<typeof clinicalCaseSchema>;
export type MaterialSendInput = z.infer<typeof materialSendSchema>;
