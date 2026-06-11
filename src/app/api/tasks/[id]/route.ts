import { NextRequest } from "next/server";
import { parseISO, isValid } from "date-fns";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { taskSchema } from "@/lib/validations";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";

async function findTask(id: string, tenantId: string) {
  return prisma.task.findFirst({ where: { id, tenantId } });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    const { id } = await params;
    const task = await prisma.task.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { patient: { select: { id: true, nome: true } } },
    });
    if (!task) {
      return errorResponse("Tarefa não encontrada", 404);
    }
    return successResponse(task);
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      const existingTask = await findTask(id, ctx.tenantId);
      if (!existingTask) {
        return errorResponse("Tarefa não encontrada", 404);
      }

      const body = await parseSafeBody(req);
      if (!body) return errorResponse("Payload muito grande", 413);
      const parsed = taskSchema.safeParse(body);
      if (!parsed.success) {
        const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
        return errorResponse(errorMsg, 400);
      }

      const { patientId, dataVencimento, ...rest } = parsed.data;

      if (patientId) {
        const patient = await prisma.patient.findFirst({
          where: { id: patientId, tenantId: ctx.tenantId },
        });
        if (!patient) {
          return errorResponse("Paciente não encontrado ou inválido", 404);
        }
      }

      const dueDate = dataVencimento ? parseISO(dataVencimento) : null;
      if (dataVencimento && !isValid(dueDate)) {
        return errorResponse("Data de vencimento inválida", 400);
      }

      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          patientId: patientId || null,
          dataVencimento: dueDate,
          ...rest,
        },
      });

      return successResponse(updatedTask, "Tarefa atualizada com sucesso");
    } catch (err) {
      console.error("Erro ao atualizar tarefa:", err);
      return errorResponse("Erro interno no servidor ao atualizar tarefa", 500);
    }
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      const existingTask = await findTask(id, ctx.tenantId);
      if (!existingTask) {
        return errorResponse("Tarefa não encontrada", 404);
      }

      await prisma.task.delete({ where: { id } });
      return successResponse(null, "Tarefa removida com sucesso");
    } catch (err) {
      console.error("Erro ao remover tarefa:", err);
      return errorResponse("Erro interno no servidor ao remover tarefa", 500);
    }
  });
}
