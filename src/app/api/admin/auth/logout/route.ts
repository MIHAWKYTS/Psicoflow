import { NextResponse } from "next/server";
import { removeAdminCookie } from "@/lib/admin-auth";

export async function POST() {
  await removeAdminCookie();
  return NextResponse.json({ success: true });
}
