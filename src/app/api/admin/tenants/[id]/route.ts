import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { parseSafeBody } from "@/lib/api-helpers";
import { addDays } from "date-fns";

const VALID_STATUS = ["trial", "ativo", "inadimplente", "cancelado"] as const;
type StatusAssinatura = (typeof VALID_STATUS)[number];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("psigen_admin_token")?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true, nome: true, email: true, role: true, ativo: true },
        orderBy: { nome: "asc" },
      },
      _count: { select: { patients: true } },
    },
  });

  if (!tenant) {
    return NextResponse.json({ success: false, error: "Clínica não encontrada." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: tenant });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("psigen_admin_token")?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await parseSafeBody<{
    isActive?: boolean;
    extendTrialDays?: number;
    statusAssinatura?: string;
  }>(req);
  if (!body) return NextResponse.json({ success: false, error: "Payload muito grande" }, { status: 413 });

  const { isActive, extendTrialDays, statusAssinatura } = body;

  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Tenant não encontrado." }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (isActive !== undefined) updateData.isActive = isActive;

  if (extendTrialDays !== undefined) {
    if (typeof extendTrialDays !== "number" || extendTrialDays <= 0) {
      return NextResponse.json({ success: false, error: "extendTrialDays deve ser > 0" }, { status: 400 });
    }
    const base = existing.dataFimTrial && existing.dataFimTrial > new Date() ? existing.dataFimTrial : new Date();
    updateData.dataFimTrial = addDays(base, extendTrialDays);
  }

  if (statusAssinatura !== undefined) {
    if (!VALID_STATUS.includes(statusAssinatura as StatusAssinatura)) {
      return NextResponse.json({ success: false, error: "statusAssinatura inválido" }, { status: 400 });
    }
    updateData.statusAssinatura = statusAssinatura;
  }

  const updated = await prisma.tenant.update({ where: { id }, data: updateData });

  return NextResponse.json({ success: true, data: updated });
}
