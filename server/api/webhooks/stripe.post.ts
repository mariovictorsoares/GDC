/**
 * POST /api/stripe/webhook
 *
 * Recebe webhooks do Stripe e atualiza o status das assinaturas.
 * Eventos tratados:
 * - checkout.session.completed → ativa assinatura
 * - invoice.paid → confirma pagamento
 * - invoice.payment_failed → marca como past_due
 * - customer.subscription.updated → atualiza plano/status
 * - customer.subscription.deleted → cancela assinatura
 */
import { serverSupabaseServiceRole } from '#supabase/server'
import type Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  if (!isStripeConfigured()) {
    throw createError({ statusCode: 503, statusMessage: 'Stripe não configurado' })
  }

  const config = useRuntimeConfig()
  const stripe = getStripe()

  // Ler raw body para verificação de assinatura
  const rawBody = await readRawBody(event)
  const sig = getHeader(event, 'stripe-signature')

  if (!rawBody || !sig) {
    throw createError({ statusCode: 400, statusMessage: 'Payload ou assinatura ausente' })
  }

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, config.stripeWebhookSecret)
  } catch (err: any) {
    console.error('[Stripe Webhook] Erro de verificação:', err.message)
    throw createError({ statusCode: 400, statusMessage: `Webhook signature inválida: ${err.message}` })
  }

  const supabase = serverSupabaseServiceRole(event)

  console.log(`[Stripe Webhook] Evento: ${stripeEvent.type}`)

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      const empresaId = session.metadata?.empresa_id
      const planoSlug = session.metadata?.plano_slug

      if (!empresaId) {
        console.error('[Stripe Webhook] checkout.session.completed sem empresa_id no metadata')
        break
      }

      // Buscar plano pelo slug
      const { data: plano } = await supabase
        .from('planos')
        .select('id')
        .eq('slug', planoSlug)
        .single()

      // Atualizar assinatura
      const updateData: Record<string, any> = {
        status: 'active',
        stripe_subscription_id: session.subscription as string,
        stripe_customer_id: session.customer as string,
        data_ativacao: new Date().toISOString(),
      }

      if (plano) {
        updateData.plano_id = plano.id
      }

      // Verificar se a taxa de implantação foi incluída no checkout
      const taxaPriceId = config.stripeTaxaImplPriceId
      if (taxaPriceId) {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
        if (lineItems.data.some(item => item.price?.id === taxaPriceId)) {
          updateData.taxa_implementacao_paga = true
        }
      }

      await supabase
        .from('assinaturas')
        .update(updateData)
        .eq('empresa_id', empresaId)

      console.log(`[Stripe Webhook] Empresa ${empresaId} ativada com plano ${planoSlug}`)
      break
    }

    case 'invoice.paid': {
      const invoice = stripeEvent.data.object as Stripe.Invoice
      const subscriptionId = (invoice as any).subscription as string

      if (subscriptionId) {
        await supabase
          .from('assinaturas')
          .update({ status: 'active' })
          .eq('stripe_subscription_id', subscriptionId)

        console.log(`[Stripe Webhook] Invoice paga para subscription ${subscriptionId}`)
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = stripeEvent.data.object as Stripe.Invoice
      const subscriptionId = (invoice as any).subscription as string

      if (subscriptionId) {
        await supabase
          .from('assinaturas')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subscriptionId)

        console.log(`[Stripe Webhook] Pagamento falhou para subscription ${subscriptionId}`)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = stripeEvent.data.object as Stripe.Subscription
      const empresaId = subscription.metadata?.empresa_id

      if (!empresaId) break

      // Mapear status do Stripe para nosso status
      let status = 'active'
      if (subscription.status === 'past_due') status = 'past_due'
      else if (subscription.status === 'canceled' || subscription.status === 'unpaid') status = 'cancelled'
      else if (subscription.status === 'active' || subscription.status === 'trialing') status = 'active'

      // Buscar novo plano pelo price_id
      const priceId = subscription.items.data[0]?.price?.id
      let planoId = null

      if (priceId) {
        const { data: plano } = await supabase
          .from('planos')
          .select('id')
          .eq('stripe_price_id', priceId)
          .single()
        planoId = plano?.id
      }

      const updateData: Record<string, any> = { status }
      if (planoId) updateData.plano_id = planoId

      await supabase
        .from('assinaturas')
        .update(updateData)
        .eq('empresa_id', empresaId)

      console.log(`[Stripe Webhook] Subscription atualizada para empresa ${empresaId}: ${status}`)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = stripeEvent.data.object as Stripe.Subscription
      const empresaId = subscription.metadata?.empresa_id

      if (empresaId) {
        await supabase
          .from('assinaturas')
          .update({
            status: 'cancelled',
            data_cancelamento: new Date().toISOString()
          })
          .eq('empresa_id', empresaId)

        console.log(`[Stripe Webhook] Subscription cancelada para empresa ${empresaId}`)
      }
      break
    }
  }

  return { received: true }
})
