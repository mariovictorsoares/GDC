/**
 * POST /api/stripe/portal
 *
 * Cria uma sessão do Stripe Customer Portal para o cliente gerenciar sua assinatura.
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Auth: apenas usuários autenticados
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })
  }

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

  const supabase = serverSupabaseServiceRole(event)

  // Verificar que o usuário pertence à empresa
  const { data: vinculo } = await supabase
    .from('usuarios_empresas')
    .select('id')
    .eq('user_id', user.id)
    .eq('empresa_id', empresa_id)
    .single()

  if (!vinculo) {
    throw createError({ statusCode: 403, statusMessage: 'Sem permissão para esta empresa' })
  }

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
    return_url: `${appUrl}/`,
  })

  return { url: session.url }
})
