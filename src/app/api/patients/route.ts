import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { patientSchema } from "@/lib/validations";
import {
  successResponse,
  errorResponse,
  getPaginationParams,
  paginatedResponse,
  parseSafeBody,
} from "@/lib/api-helpers";

// ─── GET /api/patients (Listar Pacientes) ───────────────────
export async function GET(req: NextRequest) {
  return withAuth(async (ctx) => {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    
    const busca = searchParams.get("busca") || "";
    const status = searchParams.get("status") || undefined;

    // Filtros com isolamento multi-tenant obrigatório
    const where: any = {
      tenantId: ctx.tenantId,
    };

    if (busca) {
      where.nome = {
        contains: busca,
        mode: "insensitive",
      };
    }

    if (status === "ativo" || status === "inativo") {
      where.status = status;
    }

    const [total, patients] = await Promise.all([
      prisma.patient.count({ where }),
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: "asc" },
      }),
    ]);

    return paginatedResponse(patients, total, page, limit);
  });
}

// ─── POST /api/patients (Criar Paciente) ────────────────────
export async function POST(req: NextRequest) {
  return withAuth(async (ctx) => {
    try {
      const body = await parseSafeBody(req);
      if (!body) return errorResponse("Payload muito grande", 413);
      
      const parsed = patientSchema.safeParse(body);
      if (!parsed.success) {
        const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
        return errorResponse(errorMsg, 400);
      }

      const patient = await prisma.patient.create({
        data: {
          ...parsed.data,
          dataNascimento: parsed.data.dataNascimento
            ? new Date(parsed.data.dataNascimento)
            : undefined,
          tenantId: ctx.tenantId,
        },
      });

      return successResponse(patient, "Paciente cadastrado com sucesso", 201);
    } catch (err) {
      console.error("Erro ao criar paciente:", err);
      return errorResponse("Erro interno no servidor ao criar paciente", 500);
    }
  });
}
