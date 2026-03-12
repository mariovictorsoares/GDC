/**
 * GET /api/contagem/[token]
 * Retorna dados da contagem para a página pública (sem autenticação).
 * Usa service_role para bypassar RLS.
 */
import { getSupabaseAdmin } from '~/server/utils/supabase-admin'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, message: 'Token obrigatório' })
  }

  const supabase = getSupabaseAdmin()

  // 1. Buscar contagem pelo token
  const { data: contagem, error: errContagem } = await supabase
    .from('contagens')
    .select(`
      id, nome, data, status, empresa_id,
      contagem_setores (
        id, setor_id, status, progresso,
        setor:setores ( id, nome, tipo )
      )
    `)
    .eq('token', token)
    .single()

  if (errContagem || !contagem) {
    throw createError({ statusCode: 404, message: 'Contagem não encontrada' })
  }

  if (contagem.status === 'finalizada') {
    throw createError({ statusCode: 410, message: 'Esta contagem já foi finalizada' })
  }

  // 2. Buscar produtos de cada setor
  const setorIds = (contagem.contagem_setores || []).map((cs: any) => cs.setor_id)

  const { data: setorProdutos, error: errProdutos } = await supabase
    .from('setor_produtos')
    .select(`
      setor_id,
      produto:produtos ( id, nome, unidade:unidades ( sigla ) )
    `)
    .in('setor_id', setorIds)

  if (errProdutos) {
    throw createError({ statusCode: 500, message: errProdutos.message })
  }

  // 3. Buscar itens já contados
  const { data: itensContados, error: errItens } = await supabase
    .from('contagem_itens')
    .select('setor_id, produto_id, quantidade_contada')
    .eq('contagem_id', contagem.id)

  if (errItens) {
    throw createError({ statusCode: 500, message: errItens.message })
  }

  // 4. Montar resposta agrupada por setor
  const itensMap = new Map<string, Map<string, number | null>>()
  for (const item of (itensContados || [])) {
    if (!itensMap.has(item.setor_id)) itensMap.set(item.setor_id, new Map())
    itensMap.get(item.setor_id)!.set(item.produto_id, item.quantidade_contada)
  }

  const produtosMap = new Map<string, any[]>()
  for (const sp of (setorProdutos || [])) {
    if (!produtosMap.has(sp.setor_id)) produtosMap.set(sp.setor_id, [])
    produtosMap.get(sp.setor_id)!.push(sp.produto)
  }

  const setores = (contagem.contagem_setores || []).map((cs: any) => ({
    id: cs.setor_id,
    nome: cs.setor?.nome || '',
    tipo: cs.setor?.tipo || 'principal',
    status: cs.status || 'pendente',
    progresso: cs.progresso || 0,
    produtos: (produtosMap.get(cs.setor_id) || []).map((p: any) => ({
      id: p.id,
      nome: p.nome,
      unidade: p.unidade?.sigla || '',
      quantidade_contada: itensMap.get(cs.setor_id)?.get(p.id) ?? null
    }))
  }))

  return {
    contagem: {
      id: contagem.id,
      nome: contagem.nome,
      data: contagem.data,
      status: contagem.status
    },
    setores
  }
})
