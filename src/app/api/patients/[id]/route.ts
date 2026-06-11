import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/context";
import { patientSchema } from "@/lib/validations";
import { successResponse, errorResponse, parseSafeBody } from "@/lib/api-helpers";

// Helper para validar e buscar paciente garantindo isolamento por tenant
async function findPatientOrError(id: string, tenantId: string) {
  const patient = await prisma.patient.findFirst({
    where: { id, tenantId },
  });
  return patient;
}

// ─── GET /api/patients/[id] (Buscar Detalhes) ───────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    const { id } = await params;
    const patient = await findPatientOrError(id, ctx.tenantId);
    
    if (!patient) {
      return errorResponse("Paciente não encontrado", 404);
    }

    return successResponse(patient);
  });
}

// ─── PUT /api/patients/[id] (Atualizar Paciente) ────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      const patient = await findPatientOrError(id, ctx.tenantId);
      
      if (!patient) {
        return errorResponse("Paciente não encontrado", 404);
      }

      const body = await parseSafeBody(req);
      if (!body) return errorResponse("Payload muito grande", 413);
      const parsed = patientSchema.safeParse(body);
      
      if (!parsed.success) {
        const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
        return errorResponse(errorMsg, 400);
      }

      const updated = await prisma.patient.update({
        where: { id },
        data: parsed.data,
      });

      return successResponse(updated, "Paciente atualizado com sucesso");
    } catch (err) {
      console.error("Erro ao atualizar paciente:", err);
      return errorResponse("Erro interno no servidor ao atualizar paciente", 500);
    }
  });
}

// ─── DELETE /api/patients/[id] (Remover Paciente) ───────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (ctx) => {
    try {
      const { id } = await params;
      const patient = await findPatientOrError(id, ctx.tenantId);
      
      if (!patient) {
        return errorResponse("Paciente não encontrado", 404);
      }

      // Devido às constraints cascade definidas no schema prisma,
      // a exclusão do paciente vai deletar também suas sessões, prontuários e transações vinculadas.
      await prisma.patient.delete({
        where: { id },
      });

      return successResponse(null, "Paciente removido com sucesso");
    } catch (err) {
      console.error("Erro ao deletar paciente:", err);
      return errorResponse("Erro interno no servidor ao deletar paciente", 500);
    }
  });
}
