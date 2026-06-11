import { NextRequest, NextResponse } from "next/server";
import { generateAdminToken, setAdminCookie } from "@/lib/admin-auth";
import { parseSafeBody } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const body = await parseSafeBody<{ email?: string; senha?: string }>(req);
  if (!body) return NextResponse.json({ success: false, error: "Payload muito grande" }, { status: 413 });
  const { email, senha } = body;

  if (
    email !== process.env.ADMIN_EMAIL ||
    senha !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json(
      { success: false, error: "Credenciais inválidas." },
      { status: 401 }
    );
  }

  const token = generateAdminToken();
  await setAdminCookie(token);

  return NextResponse.json({ success: true });
}
