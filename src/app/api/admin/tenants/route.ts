import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("psicoflow_admin_token")?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, patients: true } },
    },
  });

  return NextResponse.json({ success: true, data: tenants });
}
