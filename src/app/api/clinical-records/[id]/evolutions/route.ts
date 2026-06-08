import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { clinicalEvolutionSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { parseISO } from "date-fns";

async function findRecord(id: string, tenantId: string) {
  return prisma.clinicalRecord.findFirst({ where: { id, tenantId } });
}

// ─── GET /api/clinical-records/[id]/evolutions ───────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role === "secretaria") return errorResponse("Acesso negado", 403);

    const { id } = await params;
    const record = await findRecord(id, ctx.tenantId);
    if (!record) return errorResponse("Prontuário não encontrado", 404);

    const evolutions = await prisma.clinicalEvolution.findMany({
      where: { clinicalRecordId: id, tenantId: ctx.tenantId },
      include: {
        autor: { select: { id: true, nome: true } },
        session: { select: { id: true, dataHoraInicio: true } },
      },
      orderBy: { dataHora: "desc" },
    });

    return successResponse(evolutions);
  });
}

// ─── POST /api/clinical-records/[id]/evolutions ──────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    if (ctx.role === "secretaria") return errorResponse("Acesso negado", 403);

    const { id } = await params;
    const record = await findRecord(id, ctx.tenantId);
    if (!record) return errorResponse("Prontuário não encontrado", 404);

    try {
      const body = await req.json();
      const parsed = clinicalEvolutionSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(parsed.error.issues.map((i) => i.message).join(", "), 400);
      }

      const { temas, intervencoes, respostaPaciente, encaminhamentos, sessionId, dataHora } = parsed.data;

      if (sessionId) {
        const session = await prisma.session.findFirst({
          where: { id: sessionId, tenantId: ctx.tenantId },
        });
        if (!session) return errorResponse("Sessão inválida", 400);
      }

      const evolution = await prisma.clinicalEvolution.create({
        data: {
          tenantId: ctx.tenantId,
          clinicalRecordId: id,
          autorId: ctx.userId,
          sessionId: sessionId ?? null,
          dataHora: parseISO(dataHora),
          temas,
          intervencoes,
          respostaPaciente: respostaPaciente ?? null,
          encaminhamentos: encaminhamentos ?? null,
        },
        include: {
          autor: { select: { id: true, nome: true } },
        },
      });

      return successResponse(evolution, "Evolução registrada com sucesso", 201);
    } catch (err) {
      console.error("Erro ao registrar evolução:", err);
      return errorResponse("Erro interno ao registrar evolução", 500);
    }
  });
}
