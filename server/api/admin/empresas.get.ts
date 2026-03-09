/**
 * GET /api/admin/empresas
 *
 * Lista todas as empresas com assinatura, plano e usuarios.
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

  // Buscar empresas com assinatura e plano
  const { data: empresas, error } = await supabase
    .from('empresas')
    .select(`
      id, nome, cnpj, ativo, created_at,
      assinaturas(
        id, status, trial_inicio, trial_fim, grace_fim,
        stripe_customer_id, stripe_subscription_id,
        taxa_implementacao_paga, data_ativacao, data_cancelamento,
        trial_estendido_por, observacao_admin, created_at,
        plano:planos(id, nome, slug, preco_mensal)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Buscar usuarios de cada empresa
  const empresaIds = (empresas || []).map(e => e.id)

  const { data: usuarios } = await supabase
    .from('usuarios_empresas')
    .select('empresa_id, user_id, papel')
    .in('empresa_id', empresaIds.length > 0 ? empresaIds : ['__none__'])

  // Buscar emails via auth admin
  const userIds = [...new Set((usuarios || []).map(u => u.user_id))]
  const userEmails: Record<string, string> = {}

  if (userIds.length > 0) {
    const { data: authData } = await supabase.auth.admin.listUsers({
      perPage: 1000,
      page: 1,
    })
    if (authData?.users) {
      for (const u of authData.users) {
        userEmails[u.id] = u.email || ''
      }
    }
  }

  // Montar resposta
  const result = (empresas || []).map(empresa => {
    const assinatura = Array.isArray(empresa.assinaturas)
      ? empresa.assinaturas[0] || null
      : empresa.assinaturas

    const empresaUsuarios = (usuarios || [])
      .filter(u => u.empresa_id === empresa.id)
      .map(u => ({
        user_id: u.user_id,
        email: userEmails[u.user_id] || '',
        papel: u.papel,
      }))

    return {
      id: empresa.id,
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      ativo: empresa.ativo,
      created_at: empresa.created_at,
      assinatura,
      usuarios: empresaUsuarios,
    }
  })

  return result
})
