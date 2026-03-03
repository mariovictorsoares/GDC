/**
 * PATCH /api/admin/assinaturas
 *
 * Atualiza uma assinatura (estender trial, alterar status, etc).
 * Apenas super-admins podem acessar.
 */
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Verificar se é super-admin
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!admin) {
    throw createError({ statusCode: 403, statusMessage: 'Acesso restrito a administradores' })
  }

  const body = await readBody(event)
  const { assinatura_id, acao, dados } = body

  if (!assinatura_id || !acao) {
    throw createError({ statusCode: 400, statusMessage: 'assinatura_id e acao são obrigatórios' })
  }

  switch (acao) {
    case 'estender_trial': {
      const dias = dados?.dias || 14
      const { error } = await supabase
        .from('assinaturas')
        .update({
          trial_fim: new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString(),
          status: 'trial',
          grace_fim: null,
          trial_estendido_por: user.id,
          observacao_admin: dados?.observacao || `Trial estendido por ${dias} dias`
        })
        .eq('id', assinatura_id)

      if (error) throw createError({ statusCode: 500, statusMessage: error.message })
      break
    }

    case 'alterar_status': {
      const { status, observacao } = dados || {}
      if (!status) {
        throw createError({ statusCode: 400, statusMessage: 'status é obrigatório para esta ação' })
      }

      const updateData: Record<string, any> = {
        status,
        observacao_admin: observacao || null
      }

      if (status === 'active') {
        updateData.data_ativacao = new Date().toISOString()
      } else if (status === 'cancelled') {
        updateData.data_cancelamento = new Date().toISOString()
      }

      const { error } = await supabase
        .from('assinaturas')
        .update(updateData)
        .eq('id', assinatura_id)

      if (error) throw createError({ statusCode: 500, statusMessage: error.message })
      break
    }

    case 'conceder_free': {
      const { error } = await supabase
        .from('assinaturas')
        .update({
          status: 'free',
          grace_fim: null,
          observacao_admin: dados?.observacao || 'Acesso gratuito concedido pelo admin'
        })
        .eq('id', assinatura_id)

      if (error) throw createError({ statusCode: 500, statusMessage: error.message })
      break
    }

    case 'revogar_free': {
      const { error } = await supabase
        .from('assinaturas')
        .update({
          status: 'blocked',
          observacao_admin: dados?.observacao || 'Acesso gratuito revogado pelo admin'
        })
        .eq('id', assinatura_id)

      if (error) throw createError({ statusCode: 500, statusMessage: error.message })
      break
    }

    default:
      throw createError({ statusCode: 400, statusMessage: `Ação desconhecida: ${acao}` })
  }

  return { success: true }
})
