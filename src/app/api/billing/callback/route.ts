import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, generateToken } from "@/lib/auth";
import { getPayment } from "@/lib/asaas";

const PAYMENT_OK_STATUSES = new Set(["RECEIVED", "CONFIRMED"]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const paymentId = searchParams.get("paymentId");

  if (!paymentId) {
    return NextResponse.redirect(new URL("/dashboard/pagamento", req.url));
  }

  const token = req.cookies.get("psigen_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const payment = await getPayment(paymentId);

    if (!PAYMENT_OK_STATUSES.has(payment.status)) {
      return NextResponse.redirect(new URL("/dashboard/pagamento?status=pending", req.url));
    }

    await prisma.tenant.update({
      where: { id: payload.tenantId },
      data: { statusAssinatura: "ativo" },
    });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { tenant: true },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    const newToken = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      nome: user.nome,
      email: user.email,
      role: user.role,
      statusAssinatura: "ativo",
      isActive: user.ativo,
      dataFimTrial: user.tenant.dataFimTrial?.toISOString(),
    });

    const response = NextResponse.redirect(new URL("/dashboard", req.url));
    response.cookies.set("psigen_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (err: any) {
    console.error("[billing/callback] Erro:", err?.message);
    return NextResponse.redirect(new URL("/dashboard/pagamento?status=pending", req.url));
  }
}
