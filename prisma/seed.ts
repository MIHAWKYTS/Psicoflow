/**
 * PsicoFlow - Seed do Banco de Dados
 *
 * Cria o usuário administrador (desenvolvedor/dono da plataforma) com um Tenant
 * dedicado. Pode ser rodado múltiplas vezes com segurança (idempotente via upsert).
 *
 * Uso:
 *   npx tsx prisma/seed.ts
 *   ou
 *   npx prisma db seed  (se configurado no package.json)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminSenha = process.env.ADMIN_SENHA;

  if (!adminEmail || !adminSenha) {
    throw new Error(
      "❌  ADMIN_EMAIL e ADMIN_SENHA devem estar definidos no .env para rodar o seed."
    );
  }

  console.log("🌱  Iniciando seed do PsicoFlow...\n");

  // ── 1. Tenant Admin ────────────────────────────────────────────────────────
  // Procura ou cria um tenant exclusivo para o desenvolvedor.
  // O documento é uma string livre (CPF/CNPJ do desenvolvedor).
  let tenant = await prisma.tenant.findFirst({
    where: { documento: "00000000000" },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        nomeClinica: "PsicoFlow — Admin",
        documento: "00000000000",
        statusAssinatura: "ativo",          // Admin nunca fica em trial
        dataFimTrial: addDays(new Date(), 36500), // ~100 anos
      },
    });
    console.log(`✅  Tenant admin criado: ${tenant.id}`);
  } else {
    console.log(`ℹ️   Tenant admin já existe: ${tenant.id}`);
  }

  // ── 2. Usuário Admin ───────────────────────────────────────────────────────
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const senhaHash = await bcrypt.hash(adminSenha, 12);
    const admin = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        nome: "Alberto (Admin)",
        email: adminEmail,
        senhaHash,
        role: "psicologo_admin",
      },
    });
    console.log(`✅  Usuário admin criado: ${admin.email} (role: ${admin.role})`);
  } else {
    console.log(`ℹ️   Usuário admin já existe: ${existingAdmin.email} (role: ${existingAdmin.role})`);
  }

  console.log("\n🎉  Seed concluído! Use as credenciais do .env para fazer login.");
  console.log(`    E-mail: ${adminEmail}`);
  console.log(`    Senha:  ${adminSenha}`);
}

main()
  .catch((e) => {
    console.error("❌  Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
