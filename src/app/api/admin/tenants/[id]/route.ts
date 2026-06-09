import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("psigen_admin_token")?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { isActive } = await req.json();

  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Tenant não encontrado." }, { status: 404 });
  }

  const updated = await prisma.tenant.update({
    where: { id },
    data: { isActive },
  });

  return NextResponse.json({ success: true, data: updated });
}
