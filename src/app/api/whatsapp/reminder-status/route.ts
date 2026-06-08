import { NextRequest } from "next/server";
import { withAuth } from "@/lib/context";
import { successResponse } from "@/lib/api-helpers";
import { getJob } from "@/lib/reminder-jobs";

// ─── GET /api/whatsapp/reminder-status?jobId=<id> ────────────
export async function GET(req: NextRequest) {
  return withAuth(async () => {
    const jobId = new URL(req.url).searchParams.get("jobId") ?? "";
    const job = getJob(jobId);

    if (!job) {
      return successResponse({ total: 0, sent: 0, skipped: 0, status: "error", error: "Job não encontrado ou expirado." });
    }

    return successResponse(job);
  });
}
