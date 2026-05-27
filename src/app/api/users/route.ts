import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import bcrypt from "bcryptjs";

// ─── GET /api/users (Listar equipe) ───────────────────────────
export async function GET(req: NextRequest) {
  return withAuth(async (ctx) => {
    // Apenas psicologo e admin podem ver a equipe e gerenciar
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado", 403);
    }

    const users = await prisma.user.findMany({
      where: { tenantId: ctx.tenantId },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        statusAssinatura: true,
        createdAt: true,
      },
    });

    return successResponse(users);
  });
}

// ─── POST /api/users (Criar novo membro da equipe) ────────────
export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado", 403);
    }

    try {
      const body = await req.json();
      const { nome, email, senha, role } = body;

      if (!nome || !email || !senha || !role) {
        return errorResponse("Todos os campos são obrigatórios", 400);
      }

      // Validar role (não pode criar outro admin global daqui)
      if (role !== "secretaria" && role !== "psicologo") {
        return errorResponse("Role inválida", 400);
      }

      // Verifica se email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return errorResponse("E-mail já está em uso", 400);
      }

      // Hash da senha
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash(senha, salt);

      const newUser = await prisma.user.create({
        data: {
          nome,
          email,
          senhaHash,
          role,
          tenantId: ctx.tenantId, // Vincula ao mesmo tenant do Psicólogo logado
        },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
        },
      });

      return successResponse(newUser, "Usuário criado com sucesso", 201);
    } catch (err) {
      console.error("Erro ao criar usuário:", err);
      return errorResponse("Erro interno no servidor", 500);
    }
  });
}
