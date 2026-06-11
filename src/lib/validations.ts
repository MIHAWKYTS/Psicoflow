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

export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calc = (len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(digits[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  return calc(12) === parseInt(digits[12]) && calc(13) === parseInt(digits[13]);
}

export function validateDocument(doc: string): boolean {
  const digits = doc.replace(/\D/g, "");
  if (digits.length === 11) return validateCPF(digits);
  if (digits.length === 14) return validateCNPJ(digits);
  return false;
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
  "teste.com",
  "exemplo.com",
  "test.com",
  "example.com",
];

// ─── Auth ───────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido").max(254, "E-mail deve ter no máximo 254 caracteres"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(128, "Senha deve ter no máximo 128 caracteres"),
});

export const registroSchema = z.object({
  nomeClinica: z.string().min(2, "Nome da clínica é obrigatório").max(200, "Nome da clínica deve ter no máximo 200 caracteres"),
  documento: z.string().refine((val) => validateDocument(val), { message: "CPF ou CNPJ inválido" }),
  nome: z.string().min(2, "Nome é obrigatório").max(200, "Nome deve ter no máximo 200 caracteres"),
  email: z
    .string()
    .email("E-mail inválido")
    .max(254, "E-mail deve ter no máximo 254 caracteres")
    .refine(
      (val) => !BLOCKED_EMAIL_DOMAINS.includes(val.split("@")[1]?.toLowerCase()),
      { message: "Este domínio de e-mail não é permitido" }
    ),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(128, "Senha deve ter no máximo 128 caracteres"),
});

// ─── Pacientes ──────────────────────────────────────────

export const patientSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório").max(200, "Nome deve ter no máximo 200 caracteres"),
  cpf: z.string().refine((val) => !val || validateCPF(val), { message: "CPF inválido" }).optional(),
  dataNascimento: z.string().datetime().optional(),
  responsavelLegal: z.string().max(200, "Responsável legal deve ter no máximo 200 caracteres").optional(),
  genero: z.string().max(100, "Gênero deve ter no máximo 100 caracteres").optional(),
  profissao: z.string().max(100, "Profissão deve ter no máximo 100 caracteres").optional(),
  estadoCivil: z.string().max(100, "Estado civil deve ter no máximo 100 caracteres").optional(),
  endereco: z.string().max(500, "Endereço deve ter no máximo 500 caracteres").optional(),
  email: z.string().email("E-mail inválido").max(254, "E-mail deve ter no máximo 254 caracteres").optional(),
  telefoneWhatsapp: z.string().max(100, "Telefone deve ter no máximo 100 caracteres").optional(),
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
  contratoTerapeutico: z.string().max(50000, "Contrato terapêutico deve ter no máximo 50000 caracteres").optional(),
  anamnese: z.string().max(50000, "Anamnese deve ter no máximo 50000 caracteres").optional(),
  avaliacaoHipotese: z.string().max(50000, "Avaliação/hipótese deve ter no máximo 50000 caracteres").optional(),
  planoTrabalho: z.string().max(50000, "Plano de trabalho deve ter no máximo 50000 caracteres").optional(),
  encerramento: z.string().max(50000, "Encerramento deve ter no máximo 50000 caracteres").optional(),
  dataEncerramento: z.string().datetime().optional(),
});

// ─── Financeiro ─────────────────────────────────────────

export const financialTransactionSchema = z.object({
  patientId: z.string().uuid().optional(),
  tipo: z.enum(["receita", "despesa"]),
  categoria: z.enum(["consultorio", "pessoal"]),
  descricao: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
  valor: z.number().positive("Valor deve ser positivo"),
  statusPagamento: z.enum(["pendente", "pago", "cancelado"]).default("pendente"),
  dataVencimento: z.string().date("Data de vencimento inválida").optional(),
  formaPagamento: z.enum(["dinheiro", "pix", "cartao"]).optional(),
  parcelas: z.number().int().min(1).max(48).optional(),
});

// ─── Rotina: Tarefas e Casos ───────────────────────────────

export const taskSchema = z.object({
  titulo: z.string().min(2, "Título é obrigatório").max(200, "Título deve ter no máximo 200 caracteres"),
  descricao: z.string().max(2000, "Descrição deve ter no máximo 2000 caracteres").optional(),
  status: z.enum(["pendente", "em_andamento", "concluida"]).default("pendente"),
  patientId: z.string().uuid("Paciente inválido").optional(),
  dataVencimento: z.string().datetime("Data de vencimento inválida").optional(),
});

export const clinicalCaseSchema = z.object({
  titulo: z.string().min(2, "Título é obrigatório").max(200, "Título deve ter no máximo 200 caracteres"),
  descricao: z.string().max(2000, "Descrição deve ter no máximo 2000 caracteres").optional(),
  hipoteses: z.string().max(10000, "Hipóteses deve ter no máximo 10000 caracteres").optional(),
  documentosUrls: z.array(z.string().url("URL de documento inválida")).default([]),
});

// ─── Engajamento: Materiais e lembretes ────────────────────

export const materialSendSchema = z.object({
  patientId: z.string().uuid("Paciente inválido"),
  assunto: z.string().min(3, "Assunto é obrigatório").max(200, "Assunto deve ter no máximo 200 caracteres"),
  mensagem: z.string().min(5, "Mensagem é obrigatória").max(5000, "Mensagem deve ter no máximo 5000 caracteres"),
  links: z.array(z.string().url("Link inválido")).default([]),
  pdfUrls: z.array(z.string().url("URL de PDF inválida")).default([]),
  enviarAutomaticamente: z.boolean().default(false),
});

// ─── Evolução Clínica ──────────────────────────────────

export const clinicalEvolutionSchema = z.object({
  temas: z.string().min(2, "Temas são obrigatórios").max(50000, "Temas deve ter no máximo 50000 caracteres"),
  intervencoes: z.string().min(2, "Intervenções são obrigatórias").max(50000, "Intervenções deve ter no máximo 50000 caracteres"),
  respostaPaciente: z.string().max(50000, "Resposta do paciente deve ter no máximo 50000 caracteres").optional(),
  encaminhamentos: z.string().max(50000, "Encaminhamentos deve ter no máximo 50000 caracteres").optional(),
  sessionId: z.string().uuid("Sessão inválida").optional(),
  dataHora: z.string().datetime("Data/hora inválida"),
});

// ─── Types inferidos ────────────────────────────────────

export type ClinicalEvolutionInput = z.infer<typeof clinicalEvolutionSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type PatientInput = z.infer<typeof patientSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type ClinicalRecordInput = z.infer<typeof clinicalRecordSchema>;
export type FinancialTransactionInput = z.infer<typeof financialTransactionSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type ClinicalCaseInput = z.infer<typeof clinicalCaseSchema>;
export type MaterialSendInput = z.infer<typeof materialSendSchema>;
