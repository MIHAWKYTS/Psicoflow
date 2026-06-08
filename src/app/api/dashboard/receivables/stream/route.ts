export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestContext } from "@/lib/context";

async function fetchReceivables(tenantId: string) {
  return prisma.financialTransaction.findMany({
    where: { tenantId },
    orderBy: { dataVencimento: "desc" },
    take: 50,
    include: {
      patient: { select: { id: true, nome: true } },
    },
  });
}

export async function GET(req: NextRequest) {
  const ctx = await getRequestContext();
  if (!ctx) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { tenantId } = ctx;

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (data: object) =>
        new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);

      const send = async () => {
        try {
          const transactions = await fetchReceivables(tenantId);
          controller.enqueue(encode({ transactions }));
        } catch {
          // silently skip failed polls
        }
      };

      // Send immediately on connect
      await send();

      const interval = setInterval(send, 30_000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
