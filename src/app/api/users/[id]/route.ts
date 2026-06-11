import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";

// ─── PATCH /api/users/[id] (Ativar / Desativar membro) ────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role !== "psicologo_admin") {
      return errorResponse("Apenas o psicólogo administrador pode alterar membros da equipe.", 403);
    }

    const { id } = await params;
    const body = await parseSafeBody(req);
    if (!body) return errorResponse("Payload muito grande", 413);
    const { ativo } = body;

    if (typeof ativo !== "boolean") {
      return errorResponse("Campo 'ativo' é obrigatório e deve ser booleano.", 400);
    }

    // Garante que o usuário pertence ao mesmo tenant
    const target = await prisma.user.findFirst({
      where: { id, tenantId: ctx.tenantId },
    });

    if (!target) {
      return errorResponse("Usuário não encontrado.", 404);
    }

    // Não permite desativar a si mesmo
    if (target.id === ctx.userId) {
      return errorResponse("Você não pode desativar sua própria conta.", 400);
    }

    // Não permite alterar outro psicologo_admin
    if (target.role === "psicologo_admin") {
      return errorResponse("Não é possível alterar o status de outro administrador.", 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { ativo },
      select: { id: true, nome: true, role: true, ativo: true },
    });

    return successResponse(updated, `Usuário ${ativo ? "ativado" : "desativado"} com sucesso.`);
  });
}
