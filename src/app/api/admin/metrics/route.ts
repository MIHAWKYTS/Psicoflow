import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("psigen_admin_token")?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
  }

  const [totalTenants, totalUsers, totalPatients] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.patient.count(),
  ]);

  const transacoesPagas = await prisma.financialTransaction.aggregate({
    _sum: { valor: true },
    where: { statusPagamento: "pago" },
  });

  const faturamentoTotal = Number(transacoesPagas._sum.valor || 0);

  const clinicas = await prisma.tenant.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, patients: true } },
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      totalTenants,
      totalUsers,
      totalPatients,
      faturamentoTotal,
      clinicasResumo: clinicas.map((c) => ({
        id: c.id,
        nome: c.nomeClinica,
        status: c.statusAssinatura,
        dataCriacao: c.createdAt,
        qtdUsuarios: c._count.users,
        qtdPacientes: c._count.patients,
      })),
    },
  });
}
