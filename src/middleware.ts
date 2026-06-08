import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  PUBLIC_ROUTES,
  INADIMPLENTE_ALLOWED_ROUTES,
  SECRETARIA_BLOCKED_ROUTES,
  ADMIN_ONLY_ROUTES,
} from "./lib/constants";

// Usando `jose` ao invés de `jsonwebtoken` pois o middleware Next.js roda no Edge Runtime,
// que não suporta APIs nativas do Node.js usadas pelo jsonwebtoken.
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "TROCAR_POR_UM_SEGREDO_FORTE_EM_PRODUCAO"
);
const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "ADMIN_SECRET_TROCAR_EM_PRODUCAO"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin portal (isolado, verificado antes do fluxo de usuário) ────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // Rotas de autenticação admin são sempre públicas
    if (pathname.startsWith("/api/admin/auth")) {
      return NextResponse.next();
    }

    const adminToken = request.cookies.get("psicoflow_admin_token")?.value;

    // Página de login: redireciona se já autenticado
    if (pathname === "/admin/login") {
      if (adminToken) {
        try {
          await jwtVerify(adminToken, ADMIN_JWT_SECRET);
          return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        } catch {
          return NextResponse.next();
        }
      }
      return NextResponse.next();
    }

    // Demais rotas admin exigem cookie válido
    if (!adminToken) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      await jwtVerify(adminToken, ADMIN_JWT_SECRET);
      return NextResponse.next();
    } catch {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
      }
      const res = NextResponse.redirect(new URL("/admin/login", request.url));
      res.cookies.delete("psicoflow_admin_token");
      return res;
    }
  }

  // 1. Isolar arquivos estáticos/internos do Next
  if (
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
  const isApiRoute = pathname.startsWith("/api");
  const isPublicApiRoute =
    pathname.startsWith("/api/auth") || pathname.startsWith("/api/webhooks");

  // Obter token do cookie
  const token = request.cookies.get("psicoflow_token")?.value;

  // Se não estiver autenticado
  if (!token) {
    if (isPublicRoute || isPublicApiRoute) {
      return NextResponse.next();
    }
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
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
    const isActive = payload.isActive as boolean;

    // Se estiver logado e tentar ir para telas de login/registro, manda pro dashboard
    if (isPublicRoute) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // 2. Bloqueio por tenant inativo (suspenso pelo admin global)
    if (isActive === false) {
      if (pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/suspensao", request.url));
      }
      if (isApiRoute && !isPublicApiRoute) {
        return NextResponse.json(
          { success: false, error: "Conta suspensa. Entre em contato com o suporte." },
          { status: 403 }
        );
      }
    }

    // 2.5. Bloqueio por trial expirado (checado via dataFimTrial no JWT, sem acesso ao banco)
    if (statusAssinatura === "trial") {
      const dataFimTrial = payload.dataFimTrial as string | undefined;
      if (dataFimTrial && new Date(dataFimTrial) < new Date()) {
        const isAllowedRoute = INADIMPLENTE_ALLOWED_ROUTES.some((route) =>
          pathname.startsWith(route)
        );
        if (!isAllowedRoute && pathname.startsWith("/dashboard")) {
          return NextResponse.redirect(new URL("/dashboard/pagamento", request.url));
        }
        if (!isAllowedRoute && isApiRoute && !isPublicApiRoute) {
          return NextResponse.json(
            { success: false, error: "Período de teste expirado. Assine para continuar usando o PsicoFlow." },
            { status: 402 }
          );
        }
      }
    }

    // 3. Bloqueio por Inadimplência
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

      if (!isAllowedRoute && isApiRoute && !isPublicApiRoute) {
        return NextResponse.json(
          { success: false, error: "Assinatura inadimplente. Por favor, regularize seu pagamento para continuar usando as APIs." },
          { status: 402 }
        );
      }
    }

    // 3. Controle de Acesso Baseado em Role (RBAC)
    // 3.1. Secretária: bloqueia acesso a faturamento total e prontuários
    if (role === "secretaria") {
      const isBlockedRoute = SECRETARIA_BLOCKED_ROUTES.some((route) =>
        pathname.startsWith(route)
      );

      if (isBlockedRoute) {
        if (isApiRoute) {
          return NextResponse.json(
            { success: false, error: "Acesso negado. Esta funcionalidade é restrita para Psicólogos." },
            { status: 403 }
          );
        }
        
        // Redireciona tela restrita para a Home do Dashboard
        const dashboardUrl = new URL("/dashboard", request.url);
        return NextResponse.redirect(dashboardUrl);
      }
    }

    // 3.2. Admin Global: Rotas exclusivas do Super Admin
    if (payload.email !== process.env.ADMIN_EMAIL) {
      const isAdminRoute = ADMIN_ONLY_ROUTES.some((route) =>
        pathname.startsWith(route)
      );

      if (isAdminRoute) {
        if (isApiRoute) {
          return NextResponse.json(
            { success: false, error: "Acesso negado. Apenas o administrador global pode acessar." },
            { status: 403 }
          );
        }
        
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
    requestHeaders.set("x-user-email", payload.email as string);
    if (payload.nome) requestHeaders.set("x-user-nome", encodeURIComponent(payload.nome as string));

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
    "/resetar-senha",
    "/suspensao",
    "/admin/:path*",
    "/dashboard/:path*",
    "/api/:path*",
  ],
};
