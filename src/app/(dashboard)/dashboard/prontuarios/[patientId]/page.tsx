import { redirect, notFound } from "next/navigation";
import { getRequestContext } from "@/lib/context";
import { prisma } from "@/lib/prisma";
import ProntuarioForm from "@/components/dashboard/ProntuarioForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function ProntuarioPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const ctx = await getRequestContext();
  if (!ctx) redirect("/login");

  const { patientId } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId: ctx.tenantId },
    select: {
      id: true,
      nome: true,
      cpf: true,
      telefoneWhatsapp: true,
      dataNascimento: true,
      email: true,
    },
  });

  if (!patient) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/prontuarios"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Prontuário — {patient.nome}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Registro clínico estruturado
          </p>
        </div>
      </div>

      <ProntuarioForm patient={patient} />
    </div>
  );
}
