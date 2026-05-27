import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  return withAuth(async (ctx) => {
    // Validação estrita de Super Admin
    if (ctx.role !== "admin") {
      return errorResponse("Acesso negado. Apenas super administradores.", 403);
    }

    try {
      // 1. Métricas Globais (Tenants Ativos, Total Users, Total Pacientes)
      const [totalTenants, totalUsers, totalPatients] = await Promise.all([
        prisma.tenant.count(),
        prisma.user.count(),
        prisma.patient.count(),
      ]);

      // 2. Faturamento Global Simplificado (Soma das transações "pagas" de todos os tenants)
      const transacoesPagas = await prisma.financialTransaction.aggregate({
        _sum: {
          valor: true,
        },
        where: {
          status: "pago",
        },
      });

      const faturamentoTotal = Number(transacoesPagas._sum.valor || 0);

      // 3. Listagem de Clínicas (Tenants) Recentes
      const clinicas = await prisma.tenant.findMany({
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: { users: true, patients: true },
          },
        },
      });

      const metrics = {
        totalTenants,
        totalUsers,
        totalPatients,
        faturamentoTotal,
        clinicasResumo: clinicas.map(c => ({
          id: c.id,
          nome: c.nome,
          plano: c.planoId || "Gratuito",
          status: c.statusAssinatura,
          dataCriacao: c.createdAt,
          qtdUsuarios: c._count.users,
          qtdPacientes: c._count.patients,
        })),
      };

      return successResponse(metrics);
    } catch (error) {
      console.error("Erro ao buscar métricas de admin:", error);
      return errorResponse("Erro interno", 500);
    }
  });
}
