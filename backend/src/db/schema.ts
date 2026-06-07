import { sqliteTable, integer, text, customType, primaryKey } from 'drizzle-orm/sqlite-core'

export const blob = customType<{ data: Buffer }>({
  dataType() {
    return 'blob'
  },
})

export const tenants = sqliteTable('tenants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  uuid: text('uuid').notNull().unique().$default(() => crypto.randomUUID()),
  tipo: text('tipo', { length: 2 }).notNull().default('pj'),
  documento: text('documento', { length: 20 }).notNull().default('').unique(),
  nome: text('nome', { length: 255 }).notNull(),
  nome_fantasia: text('nome_fantasia', { length: 255 }),
  inscricao_estadual: text('inscricao_estadual', { length: 20 }),
  email_contato: text('email_contato', { length: 255 }).notNull().default(''),
  telefone_celular: text('telefone_celular', { length: 20 }),
  whatsapp: integer('whatsapp', { mode: 'boolean' }).notNull().default(false),
  telefone_fixo: text('telefone_fixo', { length: 20 }),
  cep: text('cep', { length: 8 }),
  logradouro: text('logradouro', { length: 255 }),
  numero: text('numero', { length: 20 }),
  complemento: text('complemento', { length: 100 }),
  bairro: text('bairro', { length: 100 }),
  cidade: text('cidade', { length: 100 }),
  uf: text('uf', { length: 2 }),
  created_at: text('created_at').$default(() => new Date().toISOString()).notNull(),
  updated_at: text('updated_at').$default(() => new Date().toISOString()).notNull(),
  updated_by: integer('updated_by'),
})

export const tenantUsuarios = sqliteTable('tenant_usuarios', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenant_id: integer('tenant_id').notNull().references(() => tenants.id),
  email: text('email', { length: 255 }).notNull().unique(),
  senha_hash: text('senha_hash', { length: 255 }).notNull(),
  nome: text('nome', { length: 255 }),
  papel: text('papel', { length: 20 }).notNull().default('operador'),
  created_at: text('created_at').$default(() => new Date().toISOString()).notNull(),
})

export const prestadores = sqliteTable('prestadores', {
  cnpj: text('cnpj', { length: 14 }).notNull(),
  tenant_id: integer('tenant_id').notNull().references(() => tenants.id),
  razao_social: text('razao_social', { length: 255 }).notNull(),
  ambiente: text('ambiente', { length: 20 }).notNull().default('Homologacao'),
  certificado_pfx: blob('certificado_pfx'),
  certificado_senha: text('certificado_senha', { length: 255 }).notNull(),
  certificado_validade: text('certificado_validade', { length: 20 }).default(''),
  certificado_nome: text('certificado_nome', { length: 255 }).default(''),
  created_at: text('created_at').$default(() => new Date().toISOString()).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.tenant_id, table.cnpj] }),
}))

export const documentos = sqliteTable('documentos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenant_id: integer('tenant_id').notNull().references(() => tenants.id),
  chave_acesso: text('chave_acesso', { length: 50 }).notNull().unique(),
  prestador_cnpj: text('prestador_cnpj', { length: 14 }).notNull(),
  operacao_id: integer('operacao_id'),
  nsu: text('nsu', { length: 20 }).default(''),
  xml_nfse: text('xml_nfse').default(''),
  data_emissao: text('data_emissao', { length: 20 }),
  emissao_dh: text('emissao_dh', { length: 30 }),
  pdf_blob: blob('pdf_blob'),
  created_at: text('created_at').$default(() => new Date().toISOString()).notNull(),
})

export const configuracoes = sqliteTable('configuracoes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenant_id: integer('tenant_id').notNull().references(() => tenants.id).unique(),
  ambiente: text('ambiente', { length: 20 }).default('Homologacao'),
  codigo_municipio: integer('codigo_municipio').default(1001058),
  lgpd_ativo: integer('lgpd_ativo', { mode: 'boolean' }).default(false),
  cnpj: text('cnpj', { length: 14 }).default(''),
  razao_social: text('razao_social', { length: 255 }).default(''),
  atualizada_em: text('atualizada_em').$default(() => new Date().toISOString()),
})

export const operacoes = sqliteTable('operacoes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenant_id: integer('tenant_id').notNull().references(() => tenants.id),
  prestador_cnpj: text('prestador_cnpj', { length: 14 }).notNull(),
  tipo: text('tipo', { length: 20 }).default(''),
  nsu_consultado: text('nsu_consultado', { length: 20 }),
  ultimo_nsu: text('ultimo_nsu', { length: 20 }).default(''),
  status: text('status', { length: 30 }).default(''),
  qtd_documentos: integer('qtd_documentos').default(0),
  xml_request: text('xml_request'),
  xml_response: text('xml_response'),
  xml_erro: text('xml_erro'),
  created_at: text('created_at').$default(() => new Date().toISOString()).notNull(),
})

export const backgroundTasks = sqliteTable('background_tasks', {
  id: text('id', { length: 36 }).primaryKey(),
  tenant_id: integer('tenant_id').notNull().references(() => tenants.id),
  tipo: text('tipo', { length: 50 }).default(''),
  chave_acesso: text('chave_acesso', { length: 50 }),
  cnpj: text('cnpj', { length: 14 }),
  status: text('status', { length: 20 }).default('pending'),
  progresso: integer('progresso').default(0),
  mensagem: text('mensagem').default(''),
  resultado_json: text('resultado_json'),
  erro_texto: text('erro_texto'),
  criado_em: text('criado_em').$default(() => new Date().toISOString()).notNull(),
  atualizado_em: text('atualizado_em').$default(() => new Date().toISOString()).notNull(),
})

export const agendamentos = sqliteTable('agendamentos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenant_id: integer('tenant_id').notNull().references(() => tenants.id),
  prestador_cnpj: text('prestador_cnpj', { length: 14 }),
  tipo: text('tipo', { length: 30 }).default('consulta_distribuicao'),
  intervalo_minutos: integer('intervalo_minutos').default(60),
  ativo: integer('ativo', { mode: 'boolean' }).default(true),
  ultima_execucao: text('ultima_execucao'),
  proxima_execucao: text('proxima_execucao'),
  created_at: text('created_at').$default(() => new Date().toISOString()).notNull(),
})

export const subscriptions = sqliteTable('subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenant_id: integer('tenant_id').notNull().references(() => tenants.id).unique(),
  uuid: text('uuid').notNull().unique().$default(() => crypto.randomUUID()),
  plano: text('plano', { length: 50 }).notNull().default('trial'),
  status: text('status', { length: 50 }).notNull().default('trialing'),
  trial_fim: text('trial_fim').notNull(),
  periodo_fim: text('periodo_fim').notNull(),
  gateway_customer_id: text('gateway_customer_id', { length: 100 }),
  gateway_subscription_id: text('gateway_subscription_id', { length: 100 }),
  cancelado_em: text('cancelado_em'),
  created_at: text('created_at').$default(() => new Date().toISOString()).notNull(),
  updated_at: text('updated_at').$default(() => new Date().toISOString()).notNull(),
  asaas_customer_id: text('asaas_customer_id', { length: 100 }),
  asaas_subscription_id: text('asaas_subscription_id', { length: 100 }),
  documentos_este_mes: integer('documentos_este_mes').notNull().default(0),
  documentos_mes_ref: text('documentos_mes_ref', { length: 7 }),
})

export const automacaoLogs = sqliteTable('automacao_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenant_id: integer('tenant_id').notNull().references(() => tenants.id),
  prestador_cnpj: text('prestador_cnpj', { length: 14 }),
  tipo: text('tipo', { length: 30 }).default(''),
  mensagem: text('mensagem').default(''),
  created_at: text('created_at').$default(() => new Date().toISOString()).notNull(),
})

export const planLimits = sqliteTable('plan_limits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  plano: text('plano', { length: 50 }).notNull().unique(),
  prestadores_max: integer('prestadores_max').notNull().default(1),
  documentos_mes_max: integer('documentos_mes_max').notNull().default(50),
  usuarios_max: integer('usuarios_max').notNull().default(2),
  lote_zip: integer('lote_zip', { mode: 'boolean' }).notNull().default(false),
  created_at: text('created_at').$default(() => new Date().toISOString()).notNull(),
})

export const tenantOverrides = sqliteTable('tenant_overrides', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenant_id: integer('tenant_id').notNull().unique().references(() => tenants.id),
  prestadores_max: integer('prestadores_max'),
  documentos_mes_max: integer('documentos_mes_max'),
  usuarios_max: integer('usuarios_max'),
  lote_zip: integer('lote_zip', { mode: 'boolean' }),
  updated_at: text('updated_at').$default(() => new Date().toISOString()).notNull(),
  updated_by: integer('updated_by').references(() => tenantUsuarios.id),
})

export const asaasWebhooks = sqliteTable('asaas_webhooks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  event: text('event', { length: 100 }).notNull(),
  asaas_id: text('asaas_id', { length: 100 }),
  subscription_id: integer('subscription_id').references(() => subscriptions.id),
  raw_body: text('raw_body'),
  processed_at: text('processed_at').$default(() => new Date().toISOString()).notNull(),
})
