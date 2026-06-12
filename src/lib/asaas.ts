// Cliente para a API do Asaas (PIX, boleto, cartão)
// Documentação: https://docs.asaas.com/reference

const BASE_URL =
  process.env.ASAAS_ENVIRONMENT === "production"
    ? "https://www.asaas.com/api/v3"
    : "https://sandbox.asaas.com/api/v3";

export type AsaasBillingType = "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED";

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
  customer: string;          // Asaas customer ID
  billingType: AsaasBillingType;
  value: number;
  dueDate: string;           // YYYY-MM-DD
  description?: string;
  externalReference?: string; // ID interno da transação
  postalService?: boolean;
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
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
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
    const msg = (body as any)?.errors?.[0]?.description ?? res.statusText;
    throw new Error(`Asaas ${res.status}: ${msg}`);
  }

  return res.json() as Promise<T>;
}

// Cria um cliente no Asaas. Se já existir com mesmo CPF/CNPJ, retorna o existente.
export async function findOrCreateCustomer(
  input: AsaasCustomerInput
): Promise<AsaasCustomer> {
  // Tenta buscar por CPF/CNPJ primeiro para evitar duplicatas
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

// Cria uma cobrança (PIX, boleto ou cartão) no Asaas.
export async function createCharge(input: AsaasChargeInput): Promise<AsaasCharge> {
  return request<AsaasCharge>("/payments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Cancela uma cobrança no Asaas.
export async function cancelCharge(asaasChargeId: string): Promise<void> {
  await request(`/payments/${asaasChargeId}`, { method: "DELETE" });
}

// Busca detalhes de uma cobrança (útil para checar status manualmente).
export async function getCharge(asaasChargeId: string): Promise<AsaasCharge> {
  return request<AsaasCharge>(`/payments/${asaasChargeId}`);
}

// Retorna o link de pagamento mais adequado conforme o tipo de cobrança.
export function resolvePaymentLink(charge: AsaasCharge): string | null {
  return charge.invoiceUrl ?? charge.bankSlipUrl ?? null;
}
