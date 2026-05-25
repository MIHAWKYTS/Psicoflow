import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  PUBLIC_ROUTES,
  INADIMPLENTE_ALLOWED_ROUTES,
  SECRETARIA_BLOCKED_ROUTES,
} from "./lib/constants";

// Usando `jose` ao invés de `jsonwebtoken` pois o middleware Next.js roda no Edge Runtime,
// que não suporta APIs nativas do Node.js usadas pelo jsonwebtoken.
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "TROCAR_POR_UM_SEGREDO_FORTE_EM_PRODUCAO"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Isolar totalmente requisições de API e arquivos estáticos/internos do Next
  if (
    pathname.startsWith("/api") || 
    pathname === "/" || 
    pathname.startsWith("/_next") || 
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Verificar se é uma rota pública de tela (login, registro, etc.)
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Obter token do cookie
  const token = request.cookies.get("psicoflow_token")?.value;

  // Se não estiver autenticado
  if (!token) {
    if (isPublicRoute) {
      return NextResponse.next();
    }
    // Redireciona para login se tentar acessar rota protegida
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verificar e decodificar JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    const role = payload.role as string;
    const statusAssinatura = payload.statusAssinatura as string;

    // Se estiver logado e tentar ir para telas de login/registro, manda pro dashboard
    if (isPublicRoute) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // 2. Bloqueio por Inadimplência
    // Se inadimplente, só pode acessar rotas permitidas (como tela de pagamento)
    if (statusAssinatura === "inadimplente") {
      const isAllowedRoute = INADIMPLENTE_ALLOWED_ROUTES.some((route) =>
        pathname.startsWith(route)
      );

      // Bloqueia rotas de API também para inadimplentes
      if (!isAllowedRoute && pathname.startsWith("/dashboard")) {
        const pagamentoUrl = new URL("/dashboard/pagamento", request.url);
        return NextResponse.redirect(pagamentoUrl);
      }

      if (!isAllowedRoute && pathname.startsWith("/api") && !pathname.startsWith("/api/auth") && !pathname.startsWith("/api/webhooks")) {
        return NextResponse.json(
          { success: false, error: "Assinatura inadimplente. Por favor, regularize seu pagamento para continuar usando as APIs." },
          { status: 402 }
        );
      }
    }

    // 3. Controle de Acesso Baseado em Role (RBAC) - Secretária
    if (role === "secretaria") {
      const isBlockedRoute = SECRETARIA_BLOCKED_ROUTES.some((route) =>
        pathname.startsWith(route)
      );

      if (isBlockedRoute) {
        if (pathname.startsWith("/api")) {
          return NextResponse.json(
            { success: false, error: "Acesso negado. Esta funcionalidade é restrita para Psicólogos administradores." },
            { status: 403 }
          );
        }
        
        // Redireciona tela restrita para a Home do Dashboard
        const dashboardUrl = new URL("/dashboard", request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }

    // Anexar informações no header para uso fácil nas API Routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId as string);
    requestHeaders.set("x-tenant-id", payload.tenantId as string);
    requestHeaders.set("x-user-role", role);
    requestHeaders.set("x-subscription-status", statusAssinatura);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err) {
    console.error("Erro ao validar token no middleware:", err);
    // Token inválido/expirado: limpa cookie e manda pra login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("psicoflow_token");
    return response;
  }
}

export const config = {
  matcher: [
    "/login",
    "/registro",
    "/esqueci-senha",
    "/dashboard/:path*",
    "/api/:path*",
  ],
};

