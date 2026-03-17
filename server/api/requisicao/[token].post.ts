/**
 * POST /api/requisicao/[token]
 * Cria uma nova requisição a partir da página pública (sem autenticação).
 * Valida que os produtos pertencem ao setor.
 * Usa service_role para bypassar RLS.
 */
import { getSupabaseAdmin } from '~/server/utils/supabase-admin'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, message: 'Token obrigatório' })
  }

  const body = await readBody(event)
  if (!Array.isArray(body?.itens) || body.itens.length === 0) {
    throw createError({ statusCode: 400, message: 'itens[] é obrigatório e não pode ser vazio' })
  }

  const supabase = getSupabaseAdmin()

  // 1. Buscar setor pelo token_requisicao
  const { data: setor, error: errSetor } = await supabase
    .from('setores')
    .select('id, nome, empresa_id')
    .eq('token_requisicao', token)
    .single()

  if (errSetor || !setor) {
    throw createError({ statusCode: 404, message: 'Setor não encontrado' })
  }

  // 2. Validar que todos os produtos pertencem ao setor
  const produtoIds = body.itens.map((i: any) => i.produto_id)

  const { data: produtosValidos } = await supabase
    .from('setor_produtos')
    .select('produto_id')
    .eq('setor_id', setor.id)
    .in('produto_id', produtoIds)

  const idsValidos = new Set((produtosValidos || []).map((p: any) => p.produto_id))
  const idsInvalidos = produtoIds.filter((id: string) => !idsValidos.has(id))

  if (idsInvalidos.length > 0) {
    throw createError({ statusCode: 400, message: `Produtos não pertencem ao setor: ${idsInvalidos.join(', ')}` })
  }

  // 3. Criar requisição
  const { data: requisicao, error: errReq } = await supabase
    .from('requisicoes')
    .insert({
      empresa_id: setor.empresa_id,
      setor_id: setor.id,
      status: 'pendente',
      data: new Date().toISOString().split('T')[0],
      solicitante_nome: body.solicitante_nome || null,
      observacao: body.observacao || null
    })
    .select('id')
    .single()

  if (errReq || !requisicao) {
    throw createError({ statusCode: 500, message: errReq?.message || 'Erro ao criar requisição' })
  }

  // 4. Criar itens da requisição
  const itensInsert = body.itens
    .filter((i: any) => i.quantidade > 0)
    .map((i: any) => ({
      requisicao_id: requisicao.id,
      produto_id: i.produto_id,
      quantidade_solicitada: i.quantidade
    }))

  if (itensInsert.length === 0) {
    // Limpar a requisição vazia
    await supabase.from('requisicoes').delete().eq('id', requisicao.id)
    throw createError({ statusCode: 400, message: 'Nenhum item com quantidade maior que zero' })
  }

  const { error: errItens } = await supabase
    .from('requisicao_itens')
    .insert(itensInsert)

  if (errItens) {
    // Limpar a requisição em caso de erro
    await supabase.from('requisicoes').delete().eq('id', requisicao.id)
    throw createError({ statusCode: 500, message: errItens.message })
  }

  return { success: true, requisicao_id: requisicao.id }
})
