/**
 * POST /api/contagem/[token]
 * Salva itens contados da página pública (sem autenticação).
 * Valida que setor pertence à contagem e produtos pertencem ao setor.
 * Usa service_role para bypassar RLS.
 */
import { getSupabaseAdmin } from '~/server/utils/supabase-admin'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, message: 'Token obrigatório' })
  }

  const body = await readBody(event)
  if (!body?.setor_id || !Array.isArray(body?.itens)) {
    throw createError({ statusCode: 400, message: 'setor_id e itens[] são obrigatórios' })
  }

  const supabase = getSupabaseAdmin()

  // 1. Buscar contagem pelo token
  const { data: contagem, error: errContagem } = await supabase
    .from('contagens')
    .select('id, empresa_id, status')
    .eq('token', token)
    .single()

  if (errContagem || !contagem) {
    throw createError({ statusCode: 404, message: 'Contagem não encontrada' })
  }

  if (contagem.status === 'finalizada') {
    throw createError({ statusCode: 410, message: 'Esta contagem já foi finalizada' })
  }

  // 2. Validar que setor pertence a esta contagem
  const { data: contagemSetor, error: errSetor } = await supabase
    .from('contagem_setores')
    .select('id, setor_id')
    .eq('contagem_id', contagem.id)
    .eq('setor_id', body.setor_id)
    .single()

  if (errSetor || !contagemSetor) {
    throw createError({ statusCode: 400, message: 'Setor não pertence a esta contagem' })
  }

  // 3. Validar que produtos pertencem ao setor
  const { data: setorProdutos } = await supabase
    .from('setor_produtos')
    .select('produto_id')
    .eq('setor_id', body.setor_id)

  const produtosValidos = new Set((setorProdutos || []).map((sp: any) => sp.produto_id))
  const itensValidos = body.itens.filter((i: any) =>
    produtosValidos.has(i.produto_id) &&
    i.quantidade_contada !== null &&
    i.quantidade_contada !== undefined
  )

  if (!itensValidos.length) {
    return { success: true, saved: 0 }
  }

  // 4. Upsert itens contados
  const payload = itensValidos.map((i: any) => ({
    contagem_id: contagem.id,
    setor_id: body.setor_id,
    produto_id: i.produto_id,
    quantidade_contada: Number(i.quantidade_contada),
    empresa_id: contagem.empresa_id,
    updated_at: new Date().toISOString()
  }))

  const { error: errUpsert } = await supabase
    .from('contagem_itens')
    .upsert(payload, { onConflict: 'contagem_id,setor_id,produto_id' })

  if (errUpsert) {
    throw createError({ statusCode: 500, message: errUpsert.message })
  }

  // 5. Atualizar progresso do setor
  const totalProdutos = produtosValidos.size
  const { count: contados } = await supabase
    .from('contagem_itens')
    .select('*', { count: 'exact', head: true })
    .eq('contagem_id', contagem.id)
    .eq('setor_id', body.setor_id)
    .not('quantidade_contada', 'is', null)

  const progresso = totalProdutos > 0 ? Math.round(((contados || 0) / totalProdutos) * 100) : 0
  const setorStatus = progresso >= 100 ? 'finalizado' : 'em_andamento'

  await supabase
    .from('contagem_setores')
    .update({
      status: setorStatus,
      progresso,
      ...(setorStatus === 'finalizado' ? { finalizado_em: new Date().toISOString() } : {})
    })
    .eq('contagem_id', contagem.id)
    .eq('setor_id', body.setor_id)

  // 6. Atualizar status da contagem para em_andamento se ainda não está
  if (contagem.status === 'aguardando' || contagem.status === 'pendente' || contagem.status === 'atrasada') {
    await supabase
      .from('contagens')
      .update({ status: 'em_andamento', updated_at: new Date().toISOString() })
      .eq('id', contagem.id)
  }

  // 7. Checar se todos os setores estão finalizados → auto-finalizar contagem
  const { data: todosSetores } = await supabase
    .from('contagem_setores')
    .select('status')
    .eq('contagem_id', contagem.id)

  const todosFinalizados = (todosSetores || []).every((s: any) => s.status === 'finalizado')

  if (todosFinalizados) {
    // NÃO auto-finalizar — manter em_andamento para que o admin
    // passe pela etapa de revisão (que cria os ajustes no histórico).
    // Apenas fazer o snapshot dos saldos atuais.

    // Snapshot dos saldos atuais para cada item contado
    const { data: itensContagem } = await supabase
      .from('contagem_itens')
      .select('produto_id, setor_id')
      .eq('contagem_id', contagem.id)

    if (itensContagem && itensContagem.length > 0) {
      // Buscar setores com tipo para saber qual saldo usar
      const { data: setoresInfo } = await supabase
        .from('contagem_setores')
        .select('setor_id, setor:setores(tipo)')
        .eq('contagem_id', contagem.id)

      const setorTipoMap = new Map((setoresInfo || []).map((s: any) => [s.setor_id, s.setor?.tipo || 'principal']))

      // Buscar saldos da view
      const produtoIds = [...new Set(itensContagem.map(i => i.produto_id))]
      const { data: saldoData } = await supabase
        .from('v_saldo_estoque')
        .select('produto_id, saldo_principal, saldo_apoio')
        .eq('empresa_id', contagem.empresa_id)
        .in('produto_id', produtoIds)

      const saldoMap = new Map((saldoData || []).map((s: any) => [s.produto_id, s]))

      // Atualizar saldo_no_momento para cada item
      await Promise.all(itensContagem.map(item => {
        const saldo = saldoMap.get(item.produto_id)
        const tipo = setorTipoMap.get(item.setor_id) || 'principal'
        const saldoValor = tipo === 'apoio' ? (saldo?.saldo_apoio || 0) : (saldo?.saldo_principal || 0)

        return supabase
          .from('contagem_itens')
          .update({ saldo_no_momento: saldoValor })
          .eq('contagem_id', contagem.id)
          .eq('produto_id', item.produto_id)
          .eq('setor_id', item.setor_id)
      }))
    }
  }

  return {
    success: true,
    saved: itensValidos.length,
    progresso,
    setorFinalizado: setorStatus === 'finalizado',
    contagemCompleta: todosFinalizados
  }
})
