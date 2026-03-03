/**
 * POST /api/stripe/portal
 *
 * Cria uma sessão do Stripe Customer Portal para o cliente gerenciar sua assinatura.
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  if (!isStripeConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Stripe ainda não configurado.'
    })
  }

  const body = await readBody(event)
  const { empresa_id } = body

  if (!empresa_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'empresa_id é obrigatório'
    })
  }

  const config = useRuntimeConfig()
  const stripe = getStripe()
  const appUrl = config.public.appUrl || 'http://localhost:3000'

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Buscar assinatura
  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('stripe_customer_id')
    .eq('empresa_id', empresa_id)
    .single()

  if (!assinatura?.stripe_customer_id) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Nenhuma assinatura Stripe encontrada para esta empresa'
    })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: assinatura.stripe_customer_id,
    return_url: `${appUrl}/configuracoes/assinatura`,
  })

  return { url: session.url }
})
