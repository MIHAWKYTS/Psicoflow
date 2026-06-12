// Cliente para a API do Asaas (PIX, boleto, cartão)
// Documentação: https://docs.asaas.com/reference

const BASE_URL =
  process.env.ASAAS_ENVIRONMENT === "production"
    ? "https://www.asaas.com/api/v3"
    : "https://sandbox.asaas.com/api/v3";

export type AsaasBillingType = "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED";
export type AsaasCycle = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY";
export type AsaasModalidade = "avulso" | "parcelado" | "recorrente";

export interface AsaasCustomerInput {
  name: string;
  cpfCnpj?: string;
  email?: string;
  mobilePhone?: string;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  cpfCnpj?: string;
  email?: string;
}

export interface AsaasChargeInput {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  dueDate: string;           // YYYY-MM-DD
  description?: string;
  externalReference?: string;
  // parcelado
  installmentCount?: number;
  installmentValue?: number;
}

export interface AsaasCharge {
  id: string;
  status: string;
  billingType: AsaasBillingType;
  value: number;
  dueDate: string;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  pixQrCodeUrl: string | null;
  pixCopiaECola: string | null;
  externalReference: string | null;
  installment: string | null; // ID do grupo de parcelas
}

export interface AsaasSubscriptionInput {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string;       // YYYY-MM-DD (vencimento da 1ª cobrança)
  cycle: AsaasCycle;
  description?: string;
  externalReference?: string;
}

export interface AsaasSubscription {
  id: string;
  status: string;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string;
  cycle: AsaasCycle;
  externalReference: string | null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY não configurado");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "access_token": apiKey,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error(`[Asaas] ${options.method ?? "GET"} ${path} → ${res.status}`, JSON.stringify(body));
    const msg =
      (body as any)?.errors?.[0]?.description ??
      (body as any)?.description ??
      (body as any)?.message ??
      res.statusText;
    throw new Error(`Asaas ${res.status}: ${msg}`);
  }

  return res.json() as Promise<T>;
}

// ─── Clientes ───────────────────────────────────────────────

export async function findOrCreateCustomer(
  input: AsaasCustomerInput
): Promise<AsaasCustomer> {
  if (input.cpfCnpj) {
    const cpfCnpj = input.cpfCnpj.replace(/\D/g, "");
    const list = await request<{ data: AsaasCustomer[] }>(
      `/customers?cpfCnpj=${cpfCnpj}`
    );
    if (list.data.length > 0) return list.data[0];
  }

  return request<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      cpfCnpj: input.cpfCnpj?.replace(/\D/g, "") || undefined,
      email: input.email || undefined,
      mobilePhone: input.mobilePhone?.replace(/\D/g, "") || undefined,
    }),
  });
}

export interface AsaasPixQrCode {
  encodedImage: string; // base64 da imagem do QR code
  payload: string;      // copia-e-cola
  expirationDate: string;
}

// ─── Cobranças avulsas e parceladas ─────────────────────────

export async function createCharge(input: AsaasChargeInput): Promise<AsaasCharge> {
  return request<AsaasCharge>("/payments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function cancelCharge(asaasChargeId: string): Promise<void> {
  await request(`/payments/${asaasChargeId}`, { method: "DELETE" });
}

export async function getCharge(asaasChargeId: string): Promise<AsaasCharge> {
  return request<AsaasCharge>(`/payments/${asaasChargeId}`);
}

// QR code PIX não vem na criação da cobrança — precisa de chamada separada.
// O Asaas pode demorar alguns segundos para gerar o QR junto ao Banco Central,
// por isso tentamos até 5 vezes com backoff antes de desistir.
export async function getPixQrCode(chargeId: string): Promise<AsaasPixQrCode> {
  const MAX_ATTEMPTS = 5;
  const DELAY_MS = 1500;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await request<AsaasPixQrCode>(`/payments/${chargeId}/pixQrCode`);
    } catch (err: any) {
      if (attempt === MAX_ATTEMPTS) throw err;
      await new Promise((r) => setTimeout(r, DELAY_MS * attempt));
    }
  }

  throw new Error("QR code PIX não disponível após múltiplas tentativas");
}

// ─── Assinaturas (recorrente/sequencial) ────────────────────

export async function createSubscription(
  input: AsaasSubscriptionInput
): Promise<AsaasSubscription> {
  return request<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await request(`/subscriptions/${subscriptionId}`, { method: "DELETE" });
}

export async function getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
  return request<AsaasSubscription>(`/subscriptions/${subscriptionId}`);
}

// Busca a primeira cobrança gerada pela assinatura para obter o invoiceUrl
export async function getSubscriptionPayments(subscriptionId: string): Promise<{ data: AsaasCharge[] }> {
  return request<{ data: AsaasCharge[] }>(`/payments?subscription=${subscriptionId}&limit=1`);
}

// ─── Helpers ────────────────────────────────────────────────

export function resolvePaymentLink(charge: AsaasCharge): string | null {
  return charge.invoiceUrl ?? charge.bankSlipUrl ?? null;
}
