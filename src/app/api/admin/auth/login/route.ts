import { NextRequest, NextResponse } from "next/server";
import { generateAdminToken, setAdminCookie } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json();

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
