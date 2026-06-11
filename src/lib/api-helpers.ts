// ===========================
// PsiGen - Helpers de API
// ===========================

import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export const BODY_SIZE_LIMIT_BYTES = 512 * 1024; // 512 KB

export async function parseSafeBody<T = any>(
  req: NextRequest,
  maxBytes: number = BODY_SIZE_LIMIT_BYTES
): Promise<T | null> {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > maxBytes) {
    return null;
  }
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Resposta de sucesso padronizada.
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data, message },
    { status }
  );
}

/**
 * Resposta de erro padronizada.
 */
export function errorResponse(
  error: string,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    { success: false, error },
    { status }
  );
}

/**
 * Extrai parâmetros de paginação da URL.
 */
export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Constrói resposta paginada.
 */
export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
) {
  return successResponse({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
