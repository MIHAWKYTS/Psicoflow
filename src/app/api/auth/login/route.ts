import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generateToken, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validação de entrada
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return errorResponse(errorMsg, 400);
    }

    const { email, senha } = parsed.data;

    // Buscar usuário e tenant associado
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      return errorResponse("Credenciais inválidas", 401);
    }

    // Verificar senha
    const senhaValida = await verifyPassword(senha, user.senhaHash);
    if (!senhaValida) {
      return errorResponse("Credenciais inválidas", 401);
    }

    // Bloquear usuário desativado pelo psicologo_admin
    if (!user.ativo) {
      return errorResponse("Sua conta foi desativada. Entre em contato com o responsável da clínica.", 403);
    }

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      nome: user.nome,
      email: user.email,
      role: user.role,
      statusAssinatura: user.tenant.statusAssinatura,
      isActive: user.tenant.isActive,
    });

    await setAuthCookie(token);

    return successResponse(
      {
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
      },
      "Login realizado com sucesso"
    );
  } catch (error: any) {
    console.error("Erro no login:", error);
    return errorResponse("Erro interno no servidor ao realizar login", 500);
  }
}
