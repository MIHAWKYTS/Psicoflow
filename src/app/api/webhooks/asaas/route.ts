import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAYMENT_PAID_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const PAYMENT_OVERDUE_EVENTS = new Set(["PAYMENT_OVERDUE"]);
const PAYMENT_CANCELLED_EVENTS = new Set(["PAYMENT_DELETED", "PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE"]);
const SUBSCRIPTION_CANCELLED_EVENTS = new Set(["SUBSCRIPTION_DELETED", "SUBSCRIPTION_INACTIVATED"]);

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

  const { event, payment, subscription: subscriptionPayload } = body ?? {};
  if (!event) {
    return NextResponse.json({ error: "Payload incompleto" }, { status: 400 });
  }

  try {
    // ── Eventos de cancelamento de assinatura ───────────────
    if (SUBSCRIPTION_CANCELLED_EVENTS.has(event)) {
      const subscriptionId = subscriptionPayload?.id as string | undefined;
      if (subscriptionId) {
        const tenant = await prisma.tenant.findFirst({ where: { asaasSubscriptionId: subscriptionId } });
        if (tenant) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { statusAssinatura: "cancelado" },
          });
        }
      }
      return NextResponse.json({ received: true });
    }

    if (!payment) {
      return NextResponse.json({ received: true });
    }

    const subscriptionId = payment.subscription as string | undefined;
    const externalReference = payment.externalReference as string | undefined;

    // ── Assinatura do tenant: lookup por asaasSubscriptionId ─
    if (subscriptionId) {
      const tenant = await prisma.tenant.findFirst({ where: { asaasSubscriptionId: subscriptionId } });
      if (tenant) {
        if (PAYMENT_PAID_EVENTS.has(event)) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { statusAssinatura: "ativo", dataFimAcesso: null },
          });
        } else if (PAYMENT_OVERDUE_EVENTS.has(event)) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { statusAssinatura: "inadimplente" },
          });
        } else if (PAYMENT_CANCELLED_EVENTS.has(event)) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { statusAssinatura: "inadimplente" },
          });
        }
        return NextResponse.json({ received: true });
      }
    }

    // ── Cobrança de paciente (fluxo de caixa da clínica) ────
    let originalTx = externalReference
      ? await prisma.financialTransaction.findUnique({ where: { id: externalReference } })
      : null;

    if (!originalTx && subscriptionId) {
      originalTx = await prisma.financialTransaction.findFirst({
        where: { asaasSubscriptionId: subscriptionId },
      });
    }

    if (!originalTx) {
      return NextResponse.json({ received: true });
    }

    if (PAYMENT_PAID_EVENTS.has(event)) {
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
