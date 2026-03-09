/**
 * GET /api/admin/stripe/invoices?customer_id=cus_xxx
 *
 * Lista invoices de um customer no Stripe.
 * Apenas super-admins podem acessar.
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verificar super-admin
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!admin) {
    throw createError({ statusCode: 403, statusMessage: 'Acesso restrito a administradores' })
  }

  const query = getQuery(event)
  const customerId = query.customer_id as string

  if (!customerId) {
    throw createError({ statusCode: 400, statusMessage: 'customer_id é obrigatório' })
  }

  if (!isStripeConfigured()) {
    return []
  }

  const stripe = getStripe()

  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 20,
    })

    return invoices.data.map(inv => ({
      id: inv.id,
      status: inv.status,
      amount: inv.amount_due / 100,
      currency: inv.currency,
      created: inv.created,
      paid_at: inv.status_transitions?.paid_at || null,
      invoice_url: inv.hosted_invoice_url,
      description: inv.lines?.data?.[0]?.description || '',
    }))
  } catch (error: any) {
    console.error('[admin/stripe/invoices] Erro:', error.message)
    return []
  }
})
