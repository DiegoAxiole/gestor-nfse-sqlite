import { db } from './db/db.js'
import { tenants, tenantUsuarios, subscriptions, planLimits } from './db/schema.js'
import { sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

async function seed() {
  db.run(sql`PRAGMA foreign_keys = OFF`)
  for (const table of [
    'automacao_logs', 'agendamentos', 'background_tasks', 'documentos',
    'prestadores', 'operacoes', 'configuracoes', 'plan_limits',
    'tenant_usuarios', 'subscriptions', 'tenants',
  ]) {
    db.run(sql`DELETE FROM ${sql.identifier(table)}`)
  }
  db.run(sql`PRAGMA foreign_keys = ON`)

  const trialFim = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const [tenant] = await db.insert(tenants).values({
    nome: 'Administrador',
    documento: '00000000000000',
    email_contato: 'admin@gestornfse.com',
    tipo: 'pj',
  }).returning()

  await db.insert(subscriptions).values({
    tenant_id: tenant.id,
    plano: 'trial',
    status: 'trialing',
    trial_fim: trialFim,
    periodo_fim: trialFim,
  })

  await db.insert(planLimits).values([
    { plano: 'trial', prestadores_max: 5, documentos_mes_max: 100, usuarios_max: 10, lote_zip: true },
    { plano: 'basico', prestadores_max: 2, documentos_mes_max: 100, usuarios_max: 3, lote_zip: false },
    { plano: 'profissional', prestadores_max: 10, documentos_mes_max: 2000, usuarios_max: 10, lote_zip: true },
  ])

  const senha_hash = await bcrypt.hash('admin123', 10)
  await db.insert(tenantUsuarios).values({
    tenant_id: tenant.id,
    email: 'admin@gestornfse.com',
    nome: 'Administrador',
    senha_hash,
    papel: 'admin',
  })

  console.log('Seed concluido!')
  console.log(`  Tenant: ${tenant.nome} (documento: ${tenant.documento})`)
  console.log('  Email: admin@gestornfse.com')
  console.log('  Senha: admin123')
}

seed().catch(console.error)
