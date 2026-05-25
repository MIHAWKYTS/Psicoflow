-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('trial', 'ativo', 'inadimplente', 'cancelado');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('psicologo_admin', 'secretaria');

-- CreateEnum
CREATE TYPE "StatusConexaoWhatsApp" AS ENUM ('desconectado', 'qr_code_pendente', 'conectado');

-- CreateEnum
CREATE TYPE "StatusPaciente" AS ENUM ('ativo', 'inativo');

-- CreateEnum
CREATE TYPE "FrequenciaSessoes" AS ENUM ('semanal', 'quinzenal', 'mensal');

-- CreateEnum
CREATE TYPE "StatusSessao" AS ENUM ('agendada', 'realizada', 'cancelada', 'falta');

-- CreateEnum
CREATE TYPE "TipoTransacao" AS ENUM ('receita', 'despesa');

-- CreateEnum
CREATE TYPE "CategoriaTransacao" AS ENUM ('consultorio', 'pessoal');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('pendente', 'pago', 'cancelado');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "nome_clinica" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "status_assinatura" "StatusAssinatura" NOT NULL DEFAULT 'trial',
    "data_fim_trial" TIMESTAMP(3) NOT NULL,
    "mp_customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'psicologo_admin',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_instances" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "instance_name" TEXT NOT NULL,
    "token_conexao" TEXT,
    "status_conexao" "StatusConexaoWhatsApp" NOT NULL DEFAULT 'desconectado',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone_whatsapp" TEXT,
    "status" "StatusPaciente" NOT NULL DEFAULT 'ativo',
    "frequencia_sessoes" "FrequenciaSessoes",
    "valor_sessao_padrao" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "data_hora_inicio" TIMESTAMP(3) NOT NULL,
    "data_hora_fim" TIMESTAMP(3) NOT NULL,
    "status" "StatusSessao" NOT NULL DEFAULT 'agendada',
    "lembrete_enviado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "session_id" UUID,
    "conteudo" TEXT NOT NULL,
    "suporta_anexo" BOOLEAN NOT NULL DEFAULT false,
    "url_anexo" TEXT,
    "usuario_autor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transactions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "patient_id" UUID,
    "tipo" "TipoTransacao" NOT NULL,
    "categoria" "CategoriaTransacao" NOT NULL,
    "descricao" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "status_pagamento" "StatusPagamento" NOT NULL DEFAULT 'pendente',
    "data_vencimento" TIMESTAMP(3) NOT NULL,
    "data_pagamento" TIMESTAMP(3),
    "mp_payment_id" TEXT,
    "mp_link_pagamento" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "whatsapp_instances_tenant_id_idx" ON "whatsapp_instances"("tenant_id");

-- CreateIndex
CREATE INDEX "patients_tenant_id_idx" ON "patients"("tenant_id");

-- CreateIndex
CREATE INDEX "sessions_tenant_id_idx" ON "sessions"("tenant_id");

-- CreateIndex
CREATE INDEX "sessions_patient_id_idx" ON "sessions"("patient_id");

-- CreateIndex
CREATE INDEX "sessions_data_hora_inicio_idx" ON "sessions"("data_hora_inicio");

-- CreateIndex
CREATE INDEX "clinical_records_tenant_id_idx" ON "clinical_records"("tenant_id");

-- CreateIndex
CREATE INDEX "clinical_records_patient_id_idx" ON "clinical_records"("patient_id");

-- CreateIndex
CREATE INDEX "clinical_records_session_id_idx" ON "clinical_records"("session_id");

-- CreateIndex
CREATE INDEX "financial_transactions_tenant_id_idx" ON "financial_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "financial_transactions_patient_id_idx" ON "financial_transactions"("patient_id");

-- CreateIndex
CREATE INDEX "financial_transactions_data_vencimento_idx" ON "financial_transactions"("data_vencimento");

-- CreateIndex
CREATE INDEX "financial_transactions_status_pagamento_idx" ON "financial_transactions"("status_pagamento");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_instances" ADD CONSTRAINT "whatsapp_instances_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_records" ADD CONSTRAINT "clinical_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_records" ADD CONSTRAINT "clinical_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_records" ADD CONSTRAINT "clinical_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_records" ADD CONSTRAINT "clinical_records_usuario_autor_id_fkey" FOREIGN KEY ("usuario_autor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
