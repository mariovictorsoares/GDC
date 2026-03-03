/**
 * POST /api/stripe/checkout
 *
 * Cria uma Stripe Checkout Session para assinatura de plano.
 * Inclui a taxa de implantação (R$497) como item avulso se ainda não foi paga.
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  // Verificar se Stripe está configurado
  if (!isStripeConfigured()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Stripe ainda não configurado. Configure STRIPE_SECRET_KEY nas variáveis de ambiente.'
    })
  }

  const body = await readBody(event)
  const { plano_slug, empresa_id } = body

  if (!plano_slug || !empresa_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'plano_slug e empresa_id são obrigatórios'
    })
  }

  const config = useRuntimeConfig()
  const stripe = getStripe()
  const appUrl = config.public.appUrl || 'http://localhost:3000'

  // Supabase admin client
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Buscar plano
  const { data: plano, error: planoError } = await supabase
    .from('planos')
    .select('*')
    .eq('slug', plano_slug)
    .eq('ativo', true)
    .single()

  if (planoError || !plano) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Plano não encontrado'
    })
  }

  if (!plano.stripe_price_id) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Plano ainda não possui stripe_price_id configurado. Configure no Stripe Dashboard.'
    })
  }

  // Buscar assinatura da empresa
  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('*')
    .eq('empresa_id', empresa_id)
    .single()

  // Buscar dados da empresa para o nome do customer
  const { data: empresa } = await supabase
    .from('empresas')
    .select('nome')
    .eq('id', empresa_id)
    .single()

  // Criar ou reutilizar Stripe Customer
  let customerId = assinatura?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: empresa?.nome || 'Empresa',
      metadata: { empresa_id }
    })
    customerId = customer.id

    // Salvar customer_id na assinatura
    await supabase
      .from('assinaturas')
      .update({ stripe_customer_id: customerId })
      .eq('empresa_id', empresa_id)
  }

  // Montar line items
  const lineItems: any[] = [
    {
      price: plano.stripe_price_id,
      quantity: 1,
    }
  ]

  // Adicionar taxa de implantação se não foi paga
  if (!assinatura?.taxa_implementacao_paga && config.stripeTaxaImplPriceId) {
    lineItems.push({
      price: config.stripeTaxaImplPriceId,
      quantity: 1,
    })
  }

  // Criar Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: lineItems,
    success_url: `${appUrl}/assinatura/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/assinatura/cancelado`,
    metadata: {
      empresa_id,
      plano_slug,
    },
    subscription_data: {
      metadata: {
        empresa_id,
        plano_slug,
      }
    },
    payment_method_types: ['card'],
    locale: 'pt-BR',
  })

  return { url: session.url }
})
