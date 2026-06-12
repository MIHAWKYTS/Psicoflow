import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAYMENT_PAID_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const PAYMENT_CANCELLED_EVENTS = new Set(["PAYMENT_DELETED", "PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE"]);
const PAYMENT_OVERDUE_EVENTS = new Set(["PAYMENT_OVERDUE"]);

function validateToken(req: NextRequest): boolean {
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!webhookToken) return false;
  return req.headers.get("asaas-access-token") === webhookToken;
}

export async function POST(req: NextRequest) {
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

  const externalReference = payment.externalReference as string | undefined;
  const subscriptionId = payment.subscription as string | undefined;

  // Tenta encontrar a transação original pelo externalReference ou pelo subscriptionId
  let originalTx = externalReference
    ? await prisma.financialTransaction.findUnique({ where: { id: externalReference } })
    : null;

  if (!originalTx && subscriptionId) {
    originalTx = await prisma.financialTransaction.findFirst({
      where: { asaasSubscriptionId: subscriptionId },
    });
  }

  if (!originalTx) {
    // Evento desconhecido — confirma recebimento para o Asaas não retentar
    return NextResponse.json({ received: true });
  }

  try {
    if (PAYMENT_PAID_EVENTS.has(event)) {
      // Pagamento de assinatura com transação original já paga → cria nova entrada no fluxo de caixa
      if (subscriptionId && originalTx.statusPagamento === "pago") {
        await prisma.financialTransaction.create({
          data: {
            tenantId: originalTx.tenantId,
            patientId: originalTx.patientId,
            tipo: originalTx.tipo,
            categoria: originalTx.categoria,
            descricao: originalTx.descricao,
            valor: originalTx.valor,
            statusPagamento: "pago",
            dataVencimento: payment.dueDate ? new Date(payment.dueDate) : new Date(),
            dataPagamento: new Date(),
            formaPagamento: originalTx.formaPagamento,
            asaasChargeId: payment.id as string,
            asaasSubscriptionId: subscriptionId,
          },
        });
      } else {
        await prisma.financialTransaction.update({
          where: { id: originalTx.id },
          data: { statusPagamento: "pago", dataPagamento: new Date() },
        });
      }
    } else if (PAYMENT_CANCELLED_EVENTS.has(event)) {
      await prisma.financialTransaction.update({
        where: { id: originalTx.id },
        data: { statusPagamento: "cancelado" },
      });
    } else if (PAYMENT_OVERDUE_EVENTS.has(event)) {
      // Mantém pendente — sem status separado para vencido no schema atual
    }
  } catch (err: any) {
    console.error("[Asaas Webhook] Erro ao processar evento:", event, err?.message);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ error: "Método não permitido" }, { status: 405 });
}
