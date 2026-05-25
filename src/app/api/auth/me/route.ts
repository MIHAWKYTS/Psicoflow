import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    const session = await getAuthUser();
    if (!session) {
      return errorResponse("Não autorizado", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    return successResponse({
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      tenant: {
        id: user.tenant.id,
        nomeClinica: user.tenant.nomeClinica,
        statusAssinatura: user.tenant.statusAssinatura,
        dataFimTrial: user.tenant.dataFimTrial,
      },
    });
  } catch (error: any) {
    console.error("Erro ao obter me:", error);
    return errorResponse("Erro interno no servidor", 500);
  }
}
