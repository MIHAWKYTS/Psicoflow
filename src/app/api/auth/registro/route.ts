import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken, setAuthCookie } from "@/lib/auth";
import { registroSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { addDays } from "date-fns";
import { TRIAL_DURATION_DAYS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validação de entrada
    const parsed = registroSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return errorResponse(errorMsg, 400);
    }

    const { nomeClinica, documento, nome, email, senha } = parsed.data;

    // Verificar se e-mail já existe
    const emailExistente = await prisma.user.findUnique({
      where: { email },
    });
    if (emailExistente) {
      return errorResponse("E-mail já cadastrado", 409);
    }

    // Criar Tenant e Usuário Admin em transação para garantir integridade
    const hash = await hashPassword(senha);
    const dataFimTrial = addDays(new Date(), TRIAL_DURATION_DAYS);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          nomeClinica,
          documento,
          statusAssinatura: "trial",
          dataFimTrial,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          nome,
          email,
          senhaHash: hash,
          role: "psicologo_admin",
        },
        include: {
          tenant: true,
        },
      });

      return user;
    });

    // Gerar token de autenticação
    const token = generateToken({
      userId: result.id,
      tenantId: result.tenantId,
      email: result.email,
      role: result.role,
      statusAssinatura: result.tenant.statusAssinatura,
    });

    await setAuthCookie(token);

    return successResponse(
      {
        id: result.id,
        nome: result.nome,
        email: result.email,
        role: result.role,
        tenant: {
          id: result.tenant.id,
          nomeClinica: result.tenant.nomeClinica,
          statusAssinatura: result.tenant.statusAssinatura,
          dataFimTrial: result.tenant.dataFimTrial,
        },
      },
      "Cadastro realizado com sucesso",
      201
    );
  } catch (error: any) {
    console.error("Erro no registro:", error);
    return errorResponse("Erro interno no servidor ao realizar cadastro", 500);
  }
}
