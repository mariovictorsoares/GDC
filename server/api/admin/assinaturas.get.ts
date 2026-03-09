/**
 * GET /api/admin/assinaturas
 *
 * Lista todas as assinaturas com dados da empresa e plano.
 * Apenas super-admins podem acessar.
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Verificar autenticação
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autenticado' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // Verificar se é super-admin
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!admin) {
    throw createError({ statusCode: 403, statusMessage: 'Acesso restrito a administradores' })
  }

  // Listar todas as assinaturas com empresa e plano
  const { data, error } = await supabase
    .from('assinaturas')
    .select(`
      *,
      empresa:empresas(id, nome, cnpj, ativo),
      plano:planos(id, nome, slug, preco_mensal)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data || []
})
