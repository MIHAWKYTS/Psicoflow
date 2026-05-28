import { NextRequest, NextResponse } from "next/server";
import { reminderJobs } from "@/app/api/whatsapp/send-reminders/route";

// ─── GET /api/whatsapp/reminder-status?jobId=<id> ────────────────────────────
export async function GET(req: NextRequest) {
  // 6.2 — Aceitar jobId como query param
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { error: "Parâmetro jobId é obrigatório." },
      { status: 400 }
    );
  }

  // 6.3 — Retornar 404 se o job não for encontrado
  const job = reminderJobs.get(jobId);
  if (!job) {
    return NextResponse.json(
      { error: "Job não encontrado. Pode ter expirado ou o servidor foi reiniciado." },
      { status: 404 }
    );
  }

  // 6.2 — Retornar o estado atual do job
  return NextResponse.json({
    jobId,
    total: job.total,
    sent: job.sent,
    skipped: job.skipped,
    status: job.status,
    ...(job.errorMessage ? { errorMessage: job.errorMessage } : {}),
  });
}
