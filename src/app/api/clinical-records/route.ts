import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { clinicalRecordSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-helpers";

// ─── GET /api/clinical-records (Listar Prontuários de um Paciente) ───
export async function GET(req: NextRequest) {
  return withAuth(async (ctx) => {
    // Segurança Extra (Defense-in-depth): Bloquear secretária caso o middleware falhe por algum motivo
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado. Apenas psicólogos administradores têm acesso aos prontuários clínicos.", 403);
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return errorResponse("O parâmetro patientId é obrigatório", 400);
    }

    // Verificar se o paciente pertence ao tenant do usuário logado
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, tenantId: ctx.tenantId },
    });

    if (!patient) {
      return errorResponse("Paciente não encontrado ou inválido", 404);
    }

    const records = await prisma.clinicalRecord.findMany({
      where: {
        tenantId: ctx.tenantId,
        patientId,
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
          },
        },
        session: {
          select: {
            id: true,
            dataHoraInicio: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(records);
  });
}

// ─── POST /api/clinical-records (Criar Evolução Clínica) ──────
export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    if (ctx.role === "secretaria") {
      return errorResponse("Acesso negado. Apenas psicólogos administradores podem registrar evolução clínica.", 403);
    }

    try {
      const body = await req.json();
      const parsed = clinicalRecordSchema.safeParse(body);

      if (!parsed.success) {
        const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
        return errorResponse(errorMsg, 400);
      }

      const { patientId, sessionId, contratoTerapeutico, anamnese, avaliacaoHipotese, planoTrabalho, encerramento, dataEncerramento } = parsed.data;

      // Verificar se o paciente pertence ao tenant
      const patient = await prisma.patient.findFirst({
        where: { id: patientId, tenantId: ctx.tenantId },
      });

      if (!patient) {
        return errorResponse("Paciente não encontrado ou inválido", 404);
      }

      // Se houver ID de sessão, verificar se pertence a este paciente e tenant
      if (sessionId) {
        const session = await prisma.session.findFirst({
          where: { id: sessionId, patientId, tenantId: ctx.tenantId },
        });
        if (!session) {
          return errorResponse("Sessão não encontrada ou não vinculada a este paciente", 400);
        }
      }

      const record = await prisma.clinicalRecord.create({
        data: {
          tenantId: ctx.tenantId,
          patientId,
          sessionId: sessionId || null,
          contratoTerapeutico: contratoTerapeutico || null,
          anamnese: anamnese || null,
          avaliacaoHipotese: avaliacaoHipotese || null,
          planoTrabalho: planoTrabalho || null,
          encerramento: encerramento || null,
          dataEncerramento: dataEncerramento ? new Date(dataEncerramento) : null,
          usuarioAutorId: ctx.userId,
        },
      });

      return successResponse(record, "Prontuário salvo com sucesso", 201);
    } catch (err) {
      console.error("Erro ao registrar prontuário:", err);
      return errorResponse("Erro interno no servidor ao registrar prontuário", 500);
    }
  });
}
