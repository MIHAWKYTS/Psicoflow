# ========================================
# PsicoFlow - Dockerfile (Multi-stage)
# ========================================
# Stage 1: deps   → instala apenas prod deps
# Stage 2: builder → compila o Next.js
# Stage 3: runner  → imagem final enxuta
# ========================================

# ---------- 1. DEPS ----------
FROM node:22-alpine AS deps

# Dependências nativas do Prisma / bcryptjs
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copia apenas os manifestos para aproveitar o cache de layers
COPY package.json package-lock.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma

# Instala todas as deps (incluindo dev, pois o build precisa delas)
RUN npm ci

# Gera o Prisma Client após instalar
RUN npx prisma generate

# ---------- 2. BUILDER ----------
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copia node_modules e prisma client gerado
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copia o restante do código-fonte
COPY . .

# Variáveis de build necessárias para o Next.js compilar corretamente.
# Valores fictícios - o banco real é injetado em runtime via env do container.
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ARG JWT_SECRET="build_time_placeholder_secret_32chars"
ARG ADMIN_JWT_SECRET="build_time_placeholder_admin_secret"
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ARG NEXT_PUBLIC_APP_NAME="PsicoFlow"

ENV DATABASE_URL=$DATABASE_URL \
    JWT_SECRET=$JWT_SECRET \
    ADMIN_JWT_SECRET=$ADMIN_JWT_SECRET \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    # Desabilita telemetria do Next.js
    NEXT_TELEMETRY_DISABLED=1

# Cria a pasta public caso não exista (Next.js exige)
RUN mkdir -p public

RUN npm run build

# ---------- 3. RUNNER ----------
FROM node:22-alpine AS runner

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# Usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copia artefatos do build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static    ./.next/static
# Copia pasta public (pode estar vazia)
COPY --from=builder /app/public          ./public

# Copia o schema do Prisma (necessário em runtime para migrations)
COPY --from=builder /app/prisma         ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Ajusta permissões
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME="0.0.0.0"

# Ponto de entrada usa o servidor standalone do Next.js
CMD ["node", "server.js"]
