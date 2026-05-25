import { successResponse } from "@/lib/api-helpers";
import { removeAuthCookie } from "@/lib/auth";

export async function POST() {
  await removeAuthCookie();
  return successResponse(null, "Logout realizado com sucesso");
}
