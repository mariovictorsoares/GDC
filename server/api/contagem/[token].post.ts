/**
 * POST /api/contagem/[token]
 * Salva itens contados da página pública (sem autenticação).
 * Valida que setor pertence à contagem e produtos pertencem ao setor.
 * Quando todos os setores ficam 100%, auto-finaliza e cria resultado no histórico.
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
    .select('id, empresa_id, status, nome, tipo, data, recorrencia, resultados')
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
    .select('status, setor_id, setor:setores(tipo)')
    .eq('contagem_id', contagem.id)

  const todosFinalizados = (todosSetores || []).every((s: any) => s.status === 'finalizado')

  if (todosFinalizados) {
    // Buscar todos os itens contados com info do produto
    const { data: itensContagem } = await supabase
      .from('contagem_itens')
      .select('produto_id, setor_id, quantidade_contada, produto:produtos(nome, unidade:unidades(sigla)), saldo_no_momento')
      .eq('contagem_id', contagem.id)

    // Buscar nomes dos setores separadamente (evita ambiguidade de FK no join)
    const setorIds = [...new Set((itensContagem || []).map((i: any) => i.setor_id))]
    const { data: setoresData } = await supabase
      .from('setores')
      .select('id, nome')
      .in('id', setorIds)
    const setorNomeMap = new Map((setoresData || []).map((s: any) => [s.id, s.nome]))

    // Buscar saldos atuais
    const produtoIds = [...new Set((itensContagem || []).map((i: any) => i.produto_id))]
    // Nota: v_saldo_estoque nao possui coluna empresa_id, mas produto_id ja pertence a empresa correta
    const { data: saldoData } = await supabase
      .from('v_saldo_estoque')
      .select('produto_id, saldo_principal, saldo_apoio, saldo_atual, custo_medio')
      .in('produto_id', produtoIds)

    const saldoMap = new Map((saldoData || []).map((s: any) => [s.produto_id, s]))

    // Determinar qual saldo usar baseado no tipo da contagem
    const contagemTipo = (contagem as any).tipo || 'principal'
    const getSaldoParaTipo = (saldo: any) => {
      if (contagemTipo === 'apoio') return Number(saldo?.saldo_apoio || 0)
      if (contagemTipo === 'inventario') return Number(saldo?.saldo_atual || 0)
      return Number(saldo?.saldo_principal || 0) // 'principal' e legacy 'estoque'
    }

    // Atualizar saldo_no_momento para cada item
    if (itensContagem && itensContagem.length > 0) {
      await Promise.all(itensContagem.map((item: any) => {
        const saldo = saldoMap.get(item.produto_id)
        const saldoValor = getSaldoParaTipo(saldo)

        return supabase
          .from('contagem_itens')
          .update({ saldo_no_momento: saldoValor })
          .eq('contagem_id', contagem.id)
          .eq('produto_id', item.produto_id)
          .eq('setor_id', item.setor_id)
      }))
    }

    // Construir itens do resultado (agrupar por produto_id, somando se houver em múltiplos setores, preservando breakdown)
    const produtoMap = new Map<string, {
      produto_id: string
      nome: string
      unidade_sigla: string
      saldo_sistema: number
      quantidade_contada: number
      custo_medio: number
      setores_breakdown: Array<{ setor_id: string; setor_nome: string; quantidade: number }>
    }>()

    for (const item of (itensContagem || [])) {
      const pid = item.produto_id
      const saldo = saldoMap.get(pid)
      const saldoSistema = getSaldoParaTipo(saldo)
      const qtd = Number(item.quantidade_contada || 0)
      const setorNome = setorNomeMap.get(item.setor_id) || ''

      if (!produtoMap.has(pid)) {
        produtoMap.set(pid, {
          produto_id: pid,
          nome: (item as any).produto?.nome || '',
          unidade_sigla: (item as any).produto?.unidade?.sigla || '',
          saldo_sistema: saldoSistema,
          quantidade_contada: qtd,
          custo_medio: Number(saldo?.custo_medio || 0),
          setores_breakdown: [{ setor_id: item.setor_id, setor_nome: setorNome, quantidade: qtd }]
        })
      } else {
        const existing = produtoMap.get(pid)!
        existing.quantidade_contada += qtd
        existing.setores_breakdown.push({ setor_id: item.setor_id, setor_nome: setorNome, quantidade: qtd })
      }
    }

    const itensResultado = Array.from(produtoMap.values()).map(item => {
      const diferenca = item.quantidade_contada - item.saldo_sistema
      return {
        produto_id: item.produto_id,
        nome: item.nome,
        unidade_sigla: item.unidade_sigla,
        saldo_sistema: item.saldo_sistema,
        quantidade_contada: item.quantidade_contada,
        diferenca,
        custo_medio: item.custo_medio,
        valor_divergencia: diferenca * item.custo_medio,
        setores_breakdown: item.setores_breakdown
      }
    }).sort((a, b) => a.nome.localeCompare(b.nome))

    const totalContados = itensResultado.length
    const totalSobras = itensResultado.filter(i => i.diferenca > 0).length
    const totalFaltas = itensResultado.filter(i => i.diferenca < 0).length
    const valorTotal = itensResultado.reduce((sum, i) => sum + i.valor_divergencia, 0)

    // Montar resultado
    const existentes = ((contagem as any).resultados || []) as any[]
    const cicloAtual = existentes.length + 1

    const resultado = {
      ciclo: cicloAtual,
      data: contagem.data || new Date().toISOString().split('T')[0],
      finalizado_em: new Date().toISOString(),
      motivo: contagem.nome || 'Contagem',
      resumo: {
        total_contados: totalContados,
        total_nao_contados: 0,
        total_sobras: totalSobras,
        total_faltas: totalFaltas,
        valor_total_divergencia: valorTotal
      },
      itens: itensResultado
    }

    existentes.push(resultado)

    // Criar ajustes para itens com divergência
    const ajustesPayload = itensResultado
      .filter(i => i.diferenca !== 0)
      .map(i => ({
        empresa_id: contagem.empresa_id,
        produto_id: i.produto_id,
        data: new Date().toISOString().split('T')[0],
        quantidade: i.diferenca,
        motivo: contagem.nome || 'Contagem',
        contagem_id: contagem.id,
        tipo: contagemTipo === 'apoio' ? 'apoio' : 'principal'
      }))

    if (ajustesPayload.length > 0) {
      await supabase
        .from('ajustes')
        .insert(ajustesPayload)
    }

    // Atualizar contagem: salvar resultados, finalizar, e limpar itens
    await supabase
      .from('contagens')
      .update({
        resultados: existentes,
        status: 'finalizada',
        ultima_contagem: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', contagem.id)

    // Limpar contagem_itens
    await supabase
      .from('contagem_itens')
      .delete()
      .eq('contagem_id', contagem.id)

    // Re-sincronizar setores para próximo ciclo (captura novos setores criados)
    // IMPORTANTE: filtrar por empresa_id pois este handler usa service_role (bypassa RLS)
    const setorQuery = supabase
      .from('setores')
      .select('id')
      .eq('empresa_id', contagem.empresa_id)

    if ((contagem as any).tipo !== 'inventario') {
      setorQuery.eq('tipo', (contagem as any).tipo)
    }

    const { data: setoresAtuais } = await setorQuery

    await supabase
      .from('contagem_setores')
      .delete()
      .eq('contagem_id', contagem.id)

    if (setoresAtuais && setoresAtuais.length > 0) {
      await supabase.from('contagem_setores').insert(
        setoresAtuais.map((s: any) => ({ contagem_id: contagem.id, setor_id: s.id }))
      )
    }

    // Se tem recorrência, preparar para próximo ciclo (status aguardando)
    if (contagem.recorrencia && contagem.recorrencia !== 'nenhuma') {
      await supabase
        .from('contagens')
        .update({
          status: 'aguardando',
          ultimo_lembrete_enviado: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', contagem.id)
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
