import { NextRequest } from "next/server";
import { parseISO, isValid } from "date-fns";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { taskSchema } from "@/lib/validations";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  return withAuth(async (ctx) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");

    const where: any = { tenantId: ctx.tenantId };
    if (status && ["pendente", "em_andamento", "concluida"].includes(status)) {
      where.status = status;
    }
    if (patientId) {
      where.patientId = patientId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        patient: { select: { id: true, nome: true } },
      },
      orderBy: [{ status: "asc" }, { dataVencimento: "asc" }, { createdAt: "desc" }],
    });

    return successResponse(tasks);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    try {
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

      const task = await prisma.task.create({
        data: {
          tenantId: ctx.tenantId,
          usuarioId: ctx.userId,
          patientId: patientId || null,
          dataVencimento: dueDate,
          ...rest,
        },
      });

      return successResponse(task, "Tarefa criada com sucesso", 201);
    } catch (err) {
      console.error("Erro ao criar tarefa:", err);
      return errorResponse("Erro interno no servidor ao criar tarefa", 500);
    }
  });
}
