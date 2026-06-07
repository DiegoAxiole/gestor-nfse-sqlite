import { db } from '../../db/db.js'
import { subscriptions, tenants } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import { NotFoundError } from '../../shared/errors.js'
import { billingService } from '../billing/billing.service.js'

export type SubscriptionData = {
  id: number
  tenant_id: number
  uuid: string
  plano: string
  status: string
  trial_fim: string
  periodo_fim: string
  gateway_customer_id: string | null
  gateway_subscription_id: string | null
  cancelado_em: string | null
  created_at: string
  updated_at: string
}

export const subscriptionService = {
  async buscar(tenantId: number) {
    const rows = await db.select().from(subscriptions)
      .where(eq(subscriptions.tenant_id, tenantId)).limit(1)
    if (!rows[0]) throw new NotFoundError('Subscription', String(tenantId))
    const s = rows[0]
    const now = new Date()
    const diffMs = new Date(s.periodo_fim).getTime() - now.getTime()
    const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    return { ...s, diasRestantes }
  },

  async cancelar(tenantId: number) {
    const [sub] = await db.select({ asaas_subscription_id: subscriptions.asaas_subscription_id })
      .from(subscriptions).where(eq(subscriptions.tenant_id, tenantId)).limit(1)

    if (sub?.asaas_subscription_id) {
      await billingService.cancelarAssinatura(sub.asaas_subscription_id).catch(() => {})
    }

    db.update(subscriptions)
      .set({ status: 'canceled', cancelado_em: new Date().toISOString(), updated_at: new Date().toISOString() })
      .where(eq(subscriptions.tenant_id, tenantId))
      .run()
    const [updated] = await db.select().from(subscriptions).where(eq(subscriptions.tenant_id, tenantId)).limit(1)
    if (!updated) throw new NotFoundError('Subscription', String(tenantId))
    return { ...updated, diasRestantes: 0 }
  },

  async upgrade(tenantId: number, data: { plano: string; periodo: string; payment_method: 'PIX' | 'BOLETO' | 'CREDIT_CARD' }) {
    const tenant = await db.select({ nome: tenants.nome, documento: tenants.documento, email_contato: tenants.email_contato })
      .from(tenants).where(eq(tenants.id, tenantId)).limit(1).then(r => r[0])
    if (!tenant) throw new NotFoundError('Tenant', String(tenantId))

    const [sub] = await db.select({ asaas_customer_id: subscriptions.asaas_customer_id })
      .from(subscriptions).where(eq(subscriptions.tenant_id, tenantId)).limit(1)

    let customerId = sub?.asaas_customer_id
    if (!customerId) {
      customerId = await billingService.criarCliente({
        nome: tenant.nome,
        documento: tenant.documento,
        email: tenant.email_contato,
      })
    }

    const result = await billingService.criarAssinatura({
      customerId,
      plano: data.plano,
      periodo: data.periodo,
      paymentMethod: data.payment_method,
    })

    const periodoFim = new Date()
    periodoFim.setDate(periodoFim.getDate() + 30)

    db.update(subscriptions)
      .set({
        plano: data.plano,
        status: 'pending',
        periodo_fim: periodoFim.toISOString(),
        asaas_customer_id: customerId,
        asaas_subscription_id: result.subscriptionId,
        cancelado_em: null,
        updated_at: new Date().toISOString(),
      })
      .where(eq(subscriptions.tenant_id, tenantId))
      .run()
    const [updated] = await db.select().from(subscriptions).where(eq(subscriptions.tenant_id, tenantId)).limit(1)
    if (!updated) throw new NotFoundError('Subscription', String(tenantId))
    return { ...updated, payment_link: result.paymentLink, payment_method: data.payment_method, diasRestantes: 0 }
  },
}
