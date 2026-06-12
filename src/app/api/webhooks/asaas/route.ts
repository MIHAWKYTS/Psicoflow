import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Eventos do Asaas que nos interessam
const PAYMENT_PAID_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const PAYMENT_CANCELLED_EVENTS = new Set(["PAYMENT_DELETED", "PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE"]);
const PAYMENT_OVERDUE_EVENTS = new Set(["PAYMENT_OVERDUE"]);

function validateToken(req: NextRequest): boolean {
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  // Se não houver token configurado, bloqueia por segurança
  if (!webhookToken) return false;
  const receivedToken = req.headers.get("asaas-access-token");
  return receivedToken === webhookToken;
}

export async function POST(req: NextRequest) {
  // ── Autenticação do webhook ─────────────────────────────────
  if (!validateToken(req)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const { event, payment } = body ?? {};

  if (!event || !payment) {
    return NextResponse.json({ error: "Payload incompleto" }, { status: 400 });
  }

  // externalReference deve conter o ID da FinancialTransaction no nosso banco
  const transactionId = payment.externalReference as string | undefined;

  if (!transactionId) {
    // Evento sem referência interna — confirmamos recebimento e ignoramos
    return NextResponse.json({ received: true });
  }

  try {
    if (PAYMENT_PAID_EVENTS.has(event)) {
      await prisma.financialTransaction.updateMany({
        where: { id: transactionId },
        data: {
          statusPagamento: "pago",
          dataPagamento: new Date(),
        },
      });
    } else if (PAYMENT_CANCELLED_EVENTS.has(event)) {
      await prisma.financialTransaction.updateMany({
        where: { id: transactionId },
        data: { statusPagamento: "cancelado" },
      });
    } else if (PAYMENT_OVERDUE_EVENTS.has(event)) {
      await prisma.financialTransaction.updateMany({
        where: { id: transactionId, statusPagamento: "pendente" },
        data: { statusPagamento: "pendente" },
      });
    }
    // Demais eventos (PAYMENT_CREATED, etc.) são ignorados silenciosamente
  } catch (err: any) {
    console.error("[Asaas Webhook] Erro ao processar evento:", event, err?.message);
    // Retorna 500 para o Asaas retentar o envio
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// Bloqueia qualquer outro método
export async function GET() {
  return NextResponse.json({ error: "Método não permitido" }, { status: 405 });
}
