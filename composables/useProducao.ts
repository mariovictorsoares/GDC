import type {
  FichaTecnica,
  FichaTecnicaIngrediente,
  OrdemProducao,
  OPIngrediente,
  StatusOP,
  SaldoEstoque
} from '~/types'

export const useProducao = () => {
  const client = useSupabaseClient()
  const { empresaId } = useEmpresa()

  // ==========================================
  // FICHAS TÉCNICAS
  // ==========================================

  const getFichasTecnicas = async (apenasAtivas = true) => {
    if (!empresaId.value) return [] as FichaTecnica[]

    let query = client
      .from('fichas_tecnicas')
      .select(`
        *,
        produto:produtos(*, unidade:unidades(*)),
        ingredientes:ficha_tecnica_ingredientes(
          *,
          produto:produtos(*, unidade:unidades(*))
        )
      `)
      .eq('empresa_id', empresaId.value)
      .order('created_at', { ascending: false })

    if (apenasAtivas) {
      query = query.eq('ativa', true)
    }

    const { data, error } = await query

    if (error) throw error
    return data as FichaTecnica[]
  }

  const getFichaTecnica = async (id: string) => {
    const { data, error } = await client
      .from('fichas_tecnicas')
      .select(`
        *,
        produto:produtos(*, unidade:unidades(*)),
        ingredientes:ficha_tecnica_ingredientes(
          *,
          produto:produtos(*, unidade:unidades(*))
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as FichaTecnica
  }

  const createFichaTecnica = async (
    ficha: Partial<FichaTecnica>,
    ingredientes: Array<{ produto_id: string; quantidade: number; fator_correcao?: number; observacao?: string }>
  ) => {
    // 1. Inserir cabeçalho
    const { data: fichaData, error: fichaError } = await client
      .from('fichas_tecnicas')
      .insert({
        empresa_id: empresaId.value,
        produto_id: ficha.produto_id,
        nome: ficha.nome,
        rendimento: ficha.rendimento || 1,
        versao: 1,
        ativa: true,
        observacao: ficha.observacao
      })
      .select(`
        *,
        produto:produtos(*, unidade:unidades(*))
      `)
      .single()

    if (fichaError) throw fichaError

    // 2. Inserir ingredientes
    if (ingredientes.length > 0) {
      const { error: ingError } = await client
        .from('ficha_tecnica_ingredientes')
        .insert(ingredientes.map(ing => ({
          ficha_tecnica_id: fichaData.id,
          produto_id: ing.produto_id,
          quantidade: ing.quantidade,
          fator_correcao: ing.fator_correcao || 1.0,
          observacao: ing.observacao
        })))

      if (ingError) throw ingError
    }

    // 3. Retornar ficha completa
    return await getFichaTecnica(fichaData.id)
  }

  const updateFichaTecnica = async (
    id: string,
    ficha: Partial<FichaTecnica>,
    ingredientes: Array<{ produto_id: string; quantidade: number; fator_correcao?: number; observacao?: string }>
  ) => {
    // 1. Atualizar cabeçalho (incrementar versão)
    const { data: fichaData, error: fichaError } = await client
      .from('fichas_tecnicas')
      .update({
        nome: ficha.nome,
        produto_id: ficha.produto_id,
        rendimento: ficha.rendimento,
        observacao: ficha.observacao,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (fichaError) throw fichaError

    // 2. Deletar ingredientes existentes e recriar
    const { error: delError } = await client
      .from('ficha_tecnica_ingredientes')
      .delete()
      .eq('ficha_tecnica_id', id)

    if (delError) throw delError

    if (ingredientes.length > 0) {
      const { error: ingError } = await client
        .from('ficha_tecnica_ingredientes')
        .insert(ingredientes.map(ing => ({
          ficha_tecnica_id: id,
          produto_id: ing.produto_id,
          quantidade: ing.quantidade,
          fator_correcao: ing.fator_correcao || 1.0,
          observacao: ing.observacao
        })))

      if (ingError) throw ingError
    }

    return await getFichaTecnica(id)
  }

  const deleteFichaTecnica = async (id: string) => {
    const { error } = await client
      .from('fichas_tecnicas')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ==========================================
  // ORDENS DE PRODUÇÃO
  // ==========================================

  const getOrdensProducao = async (filtro?: {
    status?: StatusOP | 'todos'
    dataInicio?: string
    dataFim?: string
    busca?: string
  }) => {
    if (!empresaId.value) return [] as OrdemProducao[]

    let query = client
      .from('ordens_producao')
      .select(`
        *,
        produto:produtos(*, unidade:unidades(*)),
        ingredientes:op_ingredientes(
          *,
          produto:produtos(*, unidade:unidades(*))
        )
      `)
      .eq('empresa_id', empresaId.value)
      .order('created_at', { ascending: false })

    if (filtro?.status && filtro.status !== 'todos') {
      query = query.eq('status', filtro.status)
    }
    if (filtro?.dataInicio) {
      query = query.gte('data_planejada', filtro.dataInicio)
    }
    if (filtro?.dataFim) {
      query = query.lte('data_planejada', filtro.dataFim)
    }

    const { data, error } = await query

    if (error) throw error
    return data as OrdemProducao[]
  }

  const getOrdemProducao = async (id: string) => {
    const { data, error } = await client
      .from('ordens_producao')
      .select(`
        *,
        produto:produtos(*, unidade:unidades(*)),
        ficha_tecnica:fichas_tecnicas(*, produto:produtos(*, unidade:unidades(*))),
        ingredientes:op_ingredientes(
          *,
          produto:produtos(*, unidade:unidades(*))
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as OrdemProducao
  }

  const getProximoCodigo = async (): Promise<string> => {
    const ano = new Date().getFullYear()
    const prefixo = `OP-${ano}-`

    const { data, error } = await client
      .from('ordens_producao')
      .select('codigo')
      .eq('empresa_id', empresaId.value)
      .like('codigo', `${prefixo}%`)
      .order('codigo', { ascending: false })
      .limit(1)

    if (error) throw error

    let seq = 1
    if (data && data.length > 0) {
      const ultimo = data[0].codigo
      const numStr = ultimo.replace(prefixo, '')
      seq = parseInt(numStr, 10) + 1
    }

    return `${prefixo}${String(seq).padStart(5, '0')}`
  }

  const createOrdemProducao = async (dados: {
    ficha_tecnica_id: string
    quantidade_planejada: number
    data_planejada: string
    responsavel_nome?: string
    observacao?: string
  }) => {
    // 1. Buscar ficha técnica com ingredientes
    const ficha = await getFichaTecnica(dados.ficha_tecnica_id)

    // 2. Buscar saldos para custo
    const { data: saldos, error: saldoError } = await client
      .from('v_saldo_estoque')
      .select('produto_id, custo_medio')
      .eq('empresa_id', empresaId.value)

    if (saldoError) throw saldoError
    const custoMap = new Map((saldos || []).map((s: any) => [s.produto_id, Number(s.custo_medio) || 0]))

    // 3. Gerar código
    const codigo = await getProximoCodigo()

    // 4. Calcular BOM e custo estimado
    const ingredientes = (ficha.ingredientes || []).map(ing => {
      const qtdPlanejada = ing.quantidade * dados.quantidade_planejada * ing.fator_correcao
      const custoUnit = custoMap.get(ing.produto_id) || 0
      return {
        produto_id: ing.produto_id,
        quantidade_planejada: Number(qtdPlanejada.toFixed(4)),
        custo_unitario: Number(custoUnit.toFixed(4)),
        fator_correcao: ing.fator_correcao
      }
    })

    const custoEstimado = ingredientes.reduce((acc, ing) => acc + (ing.custo_unitario * ing.quantidade_planejada), 0)

    // 5. Inserir OP
    const { data: opData, error: opError } = await client
      .from('ordens_producao')
      .insert({
        empresa_id: empresaId.value,
        codigo,
        ficha_tecnica_id: ficha.id,
        produto_id: ficha.produto_id,
        status: 'planejada' as StatusOP,
        quantidade_planejada: dados.quantidade_planejada,
        data_planejada: dados.data_planejada,
        responsavel_nome: dados.responsavel_nome,
        observacao: dados.observacao,
        ficha_versao: ficha.versao,
        custo_estimado: Number(custoEstimado.toFixed(4))
      })
      .select()
      .single()

    if (opError) throw opError

    // 6. Inserir ingredientes da OP
    if (ingredientes.length > 0) {
      const { error: ingError } = await client
        .from('op_ingredientes')
        .insert(ingredientes.map(ing => ({
          ordem_id: opData.id,
          produto_id: ing.produto_id,
          quantidade_planejada: ing.quantidade_planejada,
          custo_unitario: ing.custo_unitario,
          fator_correcao: ing.fator_correcao
        })))

      if (ingError) throw ingError
    }

    return await getOrdemProducao(opData.id)
  }

  const iniciarProducao = async (id: string) => {
    const { data, error } = await client
      .from('ordens_producao')
      .update({
        status: 'em_producao' as StatusOP,
        data_inicio: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', 'planejada')
      .select()
      .single()

    if (error) throw error
    return data as OrdemProducao
  }

  const cancelarProducao = async (id: string, motivo: string) => {
    const { data, error } = await client
      .from('ordens_producao')
      .update({
        status: 'cancelada' as StatusOP,
        motivo_cancelamento: motivo,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .in('status', ['planejada', 'em_producao'])
      .select()
      .single()

    if (error) throw error
    return data as OrdemProducao
  }

  // Concluir produção é feito via server API (backward flush atômico)
  // Ver: server/api/producao/concluir.post.ts

  const calcularDisponibilidade = async (ingredientes: Array<{ produto_id: string; quantidade_planejada: number }>) => {
    if (!empresaId.value) return []

    const { data: saldos, error } = await client
      .from('v_saldo_estoque')
      .select('produto_id, saldo_atual, custo_medio')
      .eq('empresa_id', empresaId.value)

    if (error) throw error

    const saldoMap = new Map((saldos || []).map((s: any) => [s.produto_id, {
      saldo: Number(s.saldo_atual) || 0,
      custo: Number(s.custo_medio) || 0
    }]))

    // Buscar estoque_minimo dos produtos
    const produtoIds = ingredientes.map(i => i.produto_id)
    const { data: produtos, error: prodError } = await client
      .from('produtos')
      .select('id, estoque_minimo')
      .in('id', produtoIds)

    if (prodError) throw prodError

    const minimoMap = new Map((produtos || []).map((p: any) => [p.id, Number(p.estoque_minimo) || 0]))

    return ingredientes.map(ing => {
      const info = saldoMap.get(ing.produto_id) || { saldo: 0, custo: 0 }
      const minimo = minimoMap.get(ing.produto_id) || 0
      const saldoApos = info.saldo - ing.quantidade_planejada

      let semaforo: 'verde' | 'amarelo' | 'vermelho'
      if (info.saldo < ing.quantidade_planejada) {
        semaforo = 'vermelho'
      } else if (saldoApos < minimo) {
        semaforo = 'amarelo'
      } else {
        semaforo = 'verde'
      }

      return {
        produto_id: ing.produto_id,
        quantidade_necessaria: ing.quantidade_planejada,
        saldo_atual: info.saldo,
        saldo_apos: saldoApos,
        custo_medio: info.custo,
        semaforo
      }
    })
  }

  return {
    // Fichas Técnicas
    getFichasTecnicas,
    getFichaTecnica,
    createFichaTecnica,
    updateFichaTecnica,
    deleteFichaTecnica,
    // Ordens de Produção
    getOrdensProducao,
    getOrdemProducao,
    getProximoCodigo,
    createOrdemProducao,
    iniciarProducao,
    cancelarProducao,
    // Helpers
    calcularDisponibilidade
  }
}
