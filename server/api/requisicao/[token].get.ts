/**
 * GET /api/requisicao/[token]
 * Retorna dados do setor para a página pública de requisição (sem autenticação).
 * Usa service_role para bypassar RLS.
 */
import { getSupabaseAdmin } from '~/server/utils/supabase-admin'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, message: 'Token obrigatório' })
  }

  const supabase = getSupabaseAdmin()

  // 1. Buscar setor pelo token_requisicao
  const { data: setor, error: errSetor } = await supabase
    .from('setores')
    .select('id, nome, tipo, empresa_id')
    .eq('token_requisicao', token)
    .single()

  if (errSetor || !setor) {
    throw createError({ statusCode: 404, message: 'Setor não encontrado' })
  }

  // 2. Buscar nome da empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('nome')
    .eq('id', setor.empresa_id)
    .single()

  // 3. Buscar produtos do setor
  const { data: setorProdutos, error: errProdutos } = await supabase
    .from('setor_produtos')
    .select(`
      produto:produtos ( id, nome, unidade:unidades ( sigla ) )
    `)
    .eq('setor_id', setor.id)

  if (errProdutos) {
    throw createError({ statusCode: 500, message: errProdutos.message })
  }

  const produtos = (setorProdutos || [])
    .map((sp: any) => ({
      id: sp.produto?.id,
      nome: sp.produto?.nome,
      unidade: sp.produto?.unidade?.sigla || ''
    }))
    .filter((p: any) => p.id)
    .sort((a: any, b: any) => a.nome.localeCompare(b.nome))

  return {
    empresa_nome: empresa?.nome || '',
    setor: {
      id: setor.id,
      nome: setor.nome,
      tipo: setor.tipo
    },
    produtos
  }
})
