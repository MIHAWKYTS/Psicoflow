-- Schema Foundation Migration
-- PRODUCTION NOTE: This migration was applied via `prisma db push` in development.
-- For production deployment, run this SQL manually against your database.

-- ─── Tenant: isActive ───────────────────────────────────────────────────────
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT TRUE;

-- ─── User: cpf ──────────────────────────────────────────────────────────────
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cpf" TEXT;

-- ─── UserRole: add psicologo_admin ──────────────────────────────────────────
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'psicologo_admin';

-- ─── Patient: demographic fields ────────────────────────────────────────────
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "cpf" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "data_nascimento" TIMESTAMP(3);
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "responsavel_legal" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "genero" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "profissao" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "estado_civil" TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "endereco" TEXT;

-- ─── ClinicalRecord: refactor (IMPORTANT: migrate data before dropping) ─────
ALTER TABLE "clinical_records" ADD COLUMN IF NOT EXISTS "contrato_terapeutico" TEXT;
ALTER TABLE "clinical_records" ADD COLUMN IF NOT EXISTS "anamnese" TEXT;
ALTER TABLE "clinical_records" ADD COLUMN IF NOT EXISTS "avaliacao_hipotese" TEXT;
ALTER TABLE "clinical_records" ADD COLUMN IF NOT EXISTS "plano_trabalho" TEXT;
ALTER TABLE "clinical_records" ADD COLUMN IF NOT EXISTS "encerramento" TEXT;
ALTER TABLE "clinical_records" ADD COLUMN IF NOT EXISTS "data_encerramento" TIMESTAMP(3);

-- DATA MIGRATION: copy existing conteudo to anamnese before dropping
UPDATE "clinical_records" SET "anamnese" = "conteudo" WHERE "conteudo" IS NOT NULL AND "anamnese" IS NULL;

-- Drop old columns (only after data migration above)
ALTER TABLE "clinical_records" DROP COLUMN IF EXISTS "conteudo";
ALTER TABLE "clinical_records" DROP COLUMN IF EXISTS "suporta_anexo";
ALTER TABLE "clinical_records" DROP COLUMN IF EXISTS "url_anexo";

-- ─── ClinicalEvolution: new table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "clinical_evolutions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "clinical_record_id" UUID NOT NULL,
    "session_id" UUID,
    "autor_id" UUID NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL,
    "temas" TEXT NOT NULL,
    "intervencoes" TEXT NOT NULL,
    "resposta_paciente" TEXT,
    "encaminhamentos" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_evolutions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "clinical_evolutions_tenant_id_idx" ON "clinical_evolutions"("tenant_id");
CREATE INDEX IF NOT EXISTS "clinical_evolutions_clinical_record_id_idx" ON "clinical_evolutions"("clinical_record_id");
CREATE INDEX IF NOT EXISTS "clinical_evolutions_session_id_idx" ON "clinical_evolutions"("session_id");

ALTER TABLE "clinical_evolutions"
    ADD CONSTRAINT "clinical_evolutions_clinical_record_id_fkey"
    FOREIGN KEY ("clinical_record_id") REFERENCES "clinical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clinical_evolutions"
    ADD CONSTRAINT "clinical_evolutions_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "clinical_evolutions"
    ADD CONSTRAINT "clinical_evolutions_autor_id_fkey"
    FOREIGN KEY ("autor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clinical_evolutions"
    ADD CONSTRAINT "clinical_evolutions_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── PasswordResetToken: new table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key" ON "password_reset_tokens"("token");
CREATE INDEX IF NOT EXISTS "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

ALTER TABLE "password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
