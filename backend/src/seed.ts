import { db } from './db/db.js'
import { tenants, tenantUsuarios, subscriptions, planLimits, asaasWebhooks, automacaoLogs, agendamentos, backgroundTasks, documentos, operacoes, tenantOverrides, configuracoes, prestadores } from './db/schema.js'
import bcrypt from 'bcryptjs'

db.delete(asaasWebhooks).run()
db.delete(automacaoLogs).run()
db.delete(agendamentos).run()
db.delete(backgroundTasks).run()
db.delete(documentos).run()
db.delete(operacoes).run()
db.delete(tenantOverrides).run()
db.delete(configuracoes).run()
db.delete(planLimits).run()
db.delete(subscriptions).run()
db.delete(tenantUsuarios).run()
db.delete(prestadores).run()
db.delete(tenants).run()

const trialFim = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

const tenant = db.insert(tenants).values({
  nome: 'Administrador',
  documento: '00000000000000',
  email_contato: 'admin@gestornfse.com',
  tipo: 'pj',
}).returning().get()

db.insert(subscriptions).values({
  tenant_id: tenant.id,
  plano: 'trial',
  status: 'trialing',
  trial_fim: trialFim.toISOString(),
  periodo_fim: trialFim.toISOString(),
}).run()

const existingLimits = db.select().from(planLimits).all()
if (existingLimits.length === 0) {
  db.insert(planLimits).values([
    { plano: 'trial', prestadores_max: 5, documentos_mes_max: 100, usuarios_max: 10, lote_zip: true },
    { plano: 'basico', prestadores_max: 2, documentos_mes_max: 100, usuarios_max: 3, lote_zip: false },
    { plano: 'profissional', prestadores_max: 10, documentos_mes_max: 2000, usuarios_max: 10, lote_zip: true },
  ]).run()
}

const senhaHash = bcrypt.hashSync('admin123', 10)
db.insert(tenantUsuarios).values({
  tenant_id: tenant.id,
  email: 'admin@gestornfse.com',
  nome: 'Administrador',
  senha_hash: senhaHash,
  papel: 'admin',
}).run()

console.log('Seed concluido!')
console.log(`  Tenant: ${tenant.nome} (documento: ${tenant.documento})`)
console.log('  Email: admin@gestornfse.com')
console.log('  Senha: admin123')
