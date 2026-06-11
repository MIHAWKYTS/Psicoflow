import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generateToken, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { limited, retryAfter } = checkRateLimit(getClientIp(req));
  if (limited) {
    return errorResponse(`Muitas tentativas. Tente novamente em ${retryAfter} segundos.`, 429);
  }

  try {
    const body = await parseSafeBody(req);
    if (!body) return errorResponse("Payload muito grande", 413);

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

    // Verificar se o trial expirou e atualizar o status no banco
    let statusAssinatura = user.tenant.statusAssinatura;
    if (statusAssinatura === "trial" && user.tenant.dataFimTrial) {
      if (new Date(user.tenant.dataFimTrial) < new Date()) {
        await prisma.tenant.update({
          where: { id: user.tenantId },
          data: { statusAssinatura: "inadimplente" },
        });
        statusAssinatura = "inadimplente";
      }
    }

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      nome: user.nome,
      email: user.email,
      role: user.role,
      statusAssinatura,
      isActive: user.tenant.isActive,
      dataFimTrial: user.tenant.dataFimTrial?.toISOString(),
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
