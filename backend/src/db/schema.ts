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

export const operacoes = pgTable('operacoes', {
  id: serial('id').primaryKey(),
  tenant_id: integer('tenant_id').notNull().references(() => tenants.id),
  prestador_cnpj: varchar('prestador_cnpj', { length: 14 }).notNull(),
  tipo: varchar('tipo', { length: 20 }).default(''),
  nsu_consultado: varchar('nsu_consultado', { length: 20 }),
  ultimo_nsu: varchar('ultimo_nsu', { length: 20 }).default(''),
  status: varchar('status', { length: 30 }).default(''),
  qtd_documentos: integer('qtd_documentos').default(0),
  xml_request: text('xml_request'),
  xml_response: text('xml_response'),
  xml_erro: text('xml_erro'),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const backgroundTasks = pgTable('background_tasks', {
  id: varchar('id', { length: 36 }).primaryKey(),
  tenant_id: integer('tenant_id').notNull().references(() => tenants.id),
  tipo: varchar('tipo', { length: 50 }).default(''),
  chave_acesso: varchar('chave_acesso', { length: 50 }),
  cnpj: varchar('cnpj', { length: 14 }),
  status: varchar('status', { length: 20 }).default('pending'),
  progresso: integer('progresso').default(0),
  mensagem: text('mensagem').default(''),
  resultado_json: text('resultado_json'),
  erro_texto: text('erro_texto'),
  criado_em: timestamp('criado_em').defaultNow().notNull(),
  atualizado_em: timestamp('atualizado_em').defaultNow().notNull(),
})

export const agendamentos = pgTable('agendamentos', {
  id: serial('id').primaryKey(),
  tenant_id: integer('tenant_id').notNull().references(() => tenants.id),
  prestador_cnpj: varchar('prestador_cnpj', { length: 14 }),
  tipo: varchar('tipo', { length: 30 }).default('consulta_distribuicao'),
  intervalo_minutos: integer('intervalo_minutos').default(60),
  ativo: boolean('ativo').default(true),
  ultima_execucao: timestamp('ultima_execucao'),
  proxima_execucao: timestamp('proxima_execucao'),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  tenant_id: integer('tenant_id').notNull().references(() => tenants.id).unique(),
  uuid: uuid('uuid').notNull().unique().defaultRandom(),
  plano: varchar('plano', { length: 50 }).notNull().default('trial'),
  status: varchar('status', { length: 50 }).notNull().default('trialing'),
  trial_fim: timestamp('trial_fim').notNull(),
  periodo_fim: timestamp('periodo_fim').notNull(),
  gateway_customer_id: varchar('gateway_customer_id', { length: 100 }),
  gateway_subscription_id: varchar('gateway_subscription_id', { length: 100 }),
  cancelado_em: timestamp('cancelado_em'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  asaas_customer_id: varchar('asaas_customer_id', { length: 100 }),
  asaas_subscription_id: varchar('asaas_subscription_id', { length: 100 }),
  documentos_este_mes: integer('documentos_este_mes').notNull().default(0),
  documentos_mes_ref: varchar('documentos_mes_ref', { length: 7 }),
})

export const automacaoLogs = pgTable('automacao_logs', {
  id: serial('id').primaryKey(),
  tenant_id: integer('tenant_id').notNull().references(() => tenants.id),
  prestador_cnpj: varchar('prestador_cnpj', { length: 14 }),
  tipo: varchar('tipo', { length: 30 }).default(''),
  mensagem: text('mensagem').default(''),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const planLimits = pgTable('plan_limits', {
  id: serial('id').primaryKey(),
  plano: varchar('plano', { length: 50 }).notNull().unique(),
  prestadores_max: integer('prestadores_max').notNull().default(1),
  documentos_mes_max: integer('documentos_mes_max').notNull().default(50),
  usuarios_max: integer('usuarios_max').notNull().default(2),
  lote_zip: boolean('lote_zip').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const tenantOverrides = pgTable('tenant_overrides', {
  id: serial('id').primaryKey(),
  tenant_id: integer('tenant_id').notNull().unique().references(() => tenants.id),
  prestadores_max: integer('prestadores_max'),
  documentos_mes_max: integer('documentos_mes_max'),
  usuarios_max: integer('usuarios_max'),
  lote_zip: boolean('lote_zip'),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  updated_by: integer('updated_by').references(() => tenantUsuarios.id),
})

export const asaasWebhooks = pgTable('asaas_webhooks', {
  id: serial('id').primaryKey(),
  event: varchar('event', { length: 100 }).notNull(),
  asaas_id: varchar('asaas_id', { length: 100 }),
  subscription_id: integer('subscription_id').references(() => subscriptions.id),
  raw_body: text('raw_body'),
  processed_at: timestamp('processed_at').defaultNow().notNull(),
})
