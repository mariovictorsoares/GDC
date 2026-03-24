import type {
  Grupo,
  Subgrupo,
  Categoria,
  Unidade,
  Fornecedor,
  Produto,
  Entrada,
  Saida,
  Ajuste,
  Faturamento,
  CustoMensal,
  Pedido,
  PedidoItem,

  SaldoEstoque,
  FiltroData,
  TipoSaida,
  TransferenciaPendente
} from '~/types'

export const useEstoque = () => {
  const client = useSupabaseClient()
  const { empresaId } = useEmpresa()

  // ==========================================
  // GRUPOS
  // ==========================================

  const getGrupos = async () => {
    if (!empresaId.value) return [] as Grupo[]

    const { data, error } = await client
      .from('grupos')
      .select('*')
      .eq('empresa_id', empresaId.value)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Grupo[]
  }

  const createGrupo = async (grupo: Partial<Grupo>) => {
    const { data, error } = await client
      .from('grupos')
      .insert({ ...grupo, empresa_id: empresaId.value })
      .select()
      .single()

    if (error) throw error
    return data as Grupo
  }

  const updateGrupo = async (id: string, grupo: Partial<Grupo>) => {
    const { data, error } = await client
      .from('grupos')
      .update(grupo)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Grupo
  }

  const deleteGrupo = async (id: string) => {
    const { error } = await client
      .from('grupos')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ==========================================
  // SUBGRUPOS
  // ==========================================

  const getSubgrupos = async (grupoId?: string) => {
    if (!empresaId.value) return [] as Subgrupo[]

    let query = client
      .from('subgrupos')
      .select(`
        *,
        grupo:grupos(*)
      `)
      .eq('empresa_id', empresaId.value)
      .order('created_at', { ascending: false })

    if (grupoId) {
      query = query.eq('grupo_id', grupoId)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Subgrupo[]
  }

  const createSubgrupo = async (subgrupo: Partial<Subgrupo>) => {
    const { data, error } = await client
      .from('subgrupos')
      .insert({ ...subgrupo, empresa_id: empresaId.value })
      .select(`
        *,
        grupo:grupos(*)
      `)
      .single()

    if (error) throw error
    return data as Subgrupo
  }

  const updateSubgrupo = async (id: string, subgrupo: Partial<Subgrupo>) => {
    const { data, error } = await client
      .from('subgrupos')
      .update(subgrupo)
      .eq('id', id)
      .select(`
        *,
        grupo:grupos(*)
      `)
      .single()

    if (error) throw error
    return data as Subgrupo
  }

  const deleteSubgrupo = async (id: string) => {
    const { error } = await client
      .from('subgrupos')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ==========================================
  // CATEGORIAS
  // ==========================================

  const getCategorias = async () => {
    if (!empresaId.value) return [] as Categoria[]

    const { data, error } = await client
      .from('categorias')
      .select('*')
      .eq('empresa_id', empresaId.value)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Categoria[]
  }

  const createCategoria = async (categoria: Partial<Categoria>) => {
    const { data, error } = await client
      .from('categorias')
      .insert({ ...categoria, empresa_id: empresaId.value })
      .select()
      .single()

    if (error) throw error
    return data as Categoria
  }

  const updateCategoria = async (id: string, categoria: Partial<Categoria>) => {
    const { data, error } = await client
      .from('categorias')
      .update(categoria)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Categoria
  }

  const deleteCategoria = async (id: string) => {
    const { error } = await client
      .from('categorias')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ==========================================
  // UNIDADES
  // ==========================================

  const getUnidades = async () => {
    if (!empresaId.value) return [] as Unidade[]

    const { data, error } = await client
      .from('unidades')
      .select('*')
      .eq('empresa_id', empresaId.value)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Unidade[]
  }

  const createUnidade = async (unidade: Partial<Unidade>) => {
    const { data, error } = await client
      .from('unidades')
      .insert({ ...unidade, empresa_id: empresaId.value })
      .select()
      .single()

    if (error) throw error
    return data as Unidade
  }

  const updateUnidade = async (id: string, unidade: Partial<Unidade>) => {
    const { data, error } = await client
      .from('unidades')
      .update(unidade)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Unidade
  }

  const deleteUnidade = async (id: string) => {
    const { error } = await client
      .from('unidades')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ==========================================
  // FORNECEDORES
  // ==========================================

  const getFornecedores = async (apenasAtivos = true) => {
    if (!empresaId.value) return [] as Fornecedor[]

    let query = client
      .from('fornecedores')
      .select('*')
      .eq('empresa_id', empresaId.value)
      .order('created_at', { ascending: false })

    if (apenasAtivos) {
      query = query.eq('ativo', true)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Fornecedor[]
  }

  const createFornecedor = async (fornecedor: Partial<Fornecedor>) => {
    const { data, error } = await client
      .from('fornecedores')
      .insert({ ...fornecedor, empresa_id: empresaId.value })
      .select()
      .single()

    if (error) throw error
    return data as Fornecedor
  }

  const updateFornecedor = async (id: string, fornecedor: Partial<Fornecedor>) => {
    const { data, error } = await client
      .from('fornecedores')
      .update(fornecedor)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Fornecedor
  }

  const deleteFornecedor = async (id: string) => {
    const { error } = await client
      .from('fornecedores')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ==========================================
  // PRODUTOS
  // ==========================================

  const getProdutos = async (apenasAtivos = true) => {
    if (!empresaId.value) return [] as Produto[]

    let query = client
      .from('produtos')
      .select(`
        *,
        categoria:categorias(*),
        subgrupo:subgrupos(*, grupo:grupos(*)),
        unidade:unidades(*)
      `)
      .eq('empresa_id', empresaId.value)
      .order('created_at', { ascending: false })

    if (apenasAtivos) {
      query = query.eq('ativo', true)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Produto[]
  }

  const getProduto = async (id: string) => {
    const { data, error } = await client
      .from('produtos')
      .select(`
        *,
        categoria:categorias(*),
        subgrupo:subgrupos(*, grupo:grupos(*)),
        unidade:unidades(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Produto
  }

  const createProduto = async (produto: Partial<Produto>) => {
    const { data, error } = await client
      .from('produtos')
      .insert({ ...produto, empresa_id: empresaId.value })
      .select()
      .single()

    if (error) throw error
    return data as Produto
  }

  const updateProduto = async (id: string, produto: Partial<Produto>) => {
    const { data, error } = await client
      .from('produtos')
      .update(produto)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Produto
  }

  const deleteProduto = async (id: string) => {
    // Soft delete - apenas desativa
    const { error } = await client
      .from('produtos')
      .update({ ativo: false })
      .eq('id', id)

    if (error) throw error
  }

  // ==========================================
  // CUSTOS MENSAIS
  // ==========================================

  const getCustosMensais = async (produtoId: string, ano?: number) => {
    let query = client
      .from('custos_mensais')
      .select('*')
      .eq('produto_id', produtoId)
      .order('ano', { ascending: false })
      .order('mes', { ascending: false })

    if (ano) {
      query = query.eq('ano', ano)
    }

    const { data, error } = await query

    if (error) throw error
    return data as CustoMensal[]
  }

  const upsertCustoMensal = async (custoMensal: Partial<CustoMensal>) => {
    const { data, error } = await client
      .from('custos_mensais')
      .upsert({ ...custoMensal, empresa_id: empresaId.value }, {
        onConflict: 'produto_id,ano,mes'
      })
      .select()
      .single()

    if (error) throw error
    return data as CustoMensal
  }

  // ==========================================
  // ENTRADAS
  // ==========================================

  const getEntradas = async (filtro?: FiltroData) => {
    if (!empresaId.value) return [] as Entrada[]

    let query = client
      .from('entradas')
      .select(`
        *,
        produto:produtos(*, categoria:categorias(*), unidade:unidades(*)),
        fornecedor:fornecedores(*)
      `)
      .eq('empresa_id', empresaId.value)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false })

    if (filtro?.dataInicio) {
      query = query.gte('data', filtro.dataInicio)
    }
    if (filtro?.dataFim) {
      query = query.lte('data', filtro.dataFim)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Entrada[]
  }

  const createEntrada = async (entrada: Partial<Entrada>) => {
    const { data, error } = await client
      .from('entradas')
      .insert({ ...entrada, empresa_id: empresaId.value })
      .select(`
        *,
        produto:produtos(*, categoria:categorias(*), unidade:unidades(*)),
        fornecedor:fornecedores(*)
      `)
      .single()

    if (error) throw error
    return data as Entrada
  }

  const updateEntrada = async (id: string, entrada: Partial<Entrada>) => {
    const { data, error } = await client
      .from('entradas')
      .update(entrada)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Entrada
  }

  const deleteEntrada = async (id: string) => {
    const { error } = await client
      .from('entradas')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ==========================================
  // SAÍDAS
  // ==========================================

  const getSaidas = async (filtro?: FiltroData & { tipo?: TipoSaida | 'todos' }) => {
    if (!empresaId.value) return [] as Saida[]

    let query = client
      .from('saidas')
      .select(`
        *,
        produto:produtos(*, categoria:categorias(*), unidade:unidades(*)),
        empresa_destino:empresas!saidas_empresa_destino_id_fkey(id, nome)
      `)
      .eq('empresa_id', empresaId.value)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false })

    if (filtro?.tipo && filtro.tipo !== 'todos') {
      query = query.eq('tipo', filtro.tipo)
    }

    if (filtro?.dataInicio) {
      query = query.gte('data', filtro.dataInicio)
    }
    if (filtro?.dataFim) {
      query = query.lte('data', filtro.dataFim)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Saida[]
  }

  const createSaida = async (saida: Partial<Saida>) => {
    const { data, error } = await client
      .from('saidas')
      .insert({ ...saida, empresa_id: empresaId.value })
      .select(`
        *,
        produto:produtos(*, categoria:categorias(*), unidade:unidades(*))
      `)
      .single()

    if (error) throw error
    return data as Saida
  }

  const updateSaida = async (id: string, saida: Partial<Saida>) => {
    const { data, error } = await client
      .from('saidas')
      .update(saida)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Saida
  }

  const deleteSaida = async (id: string) => {
    const { error } = await client
      .from('saidas')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Transferência entre lojas: cria saída na empresa atual + entrada na empresa destino
  const createSaidaTransferenciaLoja = async (
    saida: Partial<Saida>,
    empresaDestinoId: string,
    produtoDestinoId: string
  ) => {
    // 1. Criar a saída na empresa atual com empresa_destino_id
    const saidaCriada = await createSaida({
      ...saida,
      tipo: 'transferencia',
      empresa_destino_id: empresaDestinoId
    })

    // 2. Criar entrada na empresa destino com o produto escolhido pelo usuário
    const custoUnit = Number(saidaCriada.custo_saida) / saida.quantidade!
    const { error: entradaError } = await client
      .from('entradas')
      .insert({
        produto_id: produtoDestinoId,
        empresa_id: empresaDestinoId,
        data: saida.data,
        quantidade: saida.quantidade,
        custo_unitario: custoUnit,
        valor_total: Number(saidaCriada.custo_saida),
        observacao: `Transferência recebida`
      })

    if (entradaError) {
      // Reverter a saída criada para não deixar estoque inconsistente
      await client.from('saidas').delete().eq('id', saidaCriada.id)
      throw entradaError
    }

    return saidaCriada
  }

  // ==========================================
  // AJUSTES
  // ==========================================

  const getAjustes = async (filtro?: FiltroData) => {
    if (!empresaId.value) return [] as Ajuste[]

    let query = client
      .from('ajustes')
      .select(`
        *,
        produto:produtos(*, categoria:categorias(*), subgrupo:subgrupos(*, grupo:grupos(*)), unidade:unidades(*))
      `)
      .eq('empresa_id', empresaId.value)
      .order('data', { ascending: false })

    if (filtro?.dataInicio) {
      query = query.gte('data', filtro.dataInicio)
    }
    if (filtro?.dataFim) {
      query = query.lte('data', filtro.dataFim)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Ajuste[]
  }

  const createAjuste = async (ajuste: Partial<Ajuste>) => {
    const { data, error } = await client
      .from('ajustes')
      .insert({ ...ajuste, empresa_id: empresaId.value })
      .select(`
        *,
        produto:produtos(*, categoria:categorias(*), unidade:unidades(*))
      `)
      .single()

    if (error) throw error
    return data as Ajuste
  }

  const updateAjuste = async (id: string, ajuste: Partial<Ajuste>) => {
    const { data, error } = await client
      .from('ajustes')
      .update(ajuste)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Ajuste
  }

  const deleteAjuste = async (id: string) => {
    const { error } = await client
      .from('ajustes')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  const createAjustesEmLote = async (ajustes: Array<{ produto_id: string; data: string; semana?: string; quantidade: number; motivo: string; contagem_id?: string; tipo?: 'principal' | 'apoio' }>) => {
    if (!ajustes.length) return []

    const payload = ajustes.map(a => ({
      ...a,
      empresa_id: empresaId.value
    }))

    const { data, error } = await client
      .from('ajustes')
      .insert(payload)
      .select(`
        *,
        produto:produtos(*, categoria:categorias(*), subgrupo:subgrupos(*, grupo:grupos(*)), unidade:unidades(*))
      `)

    if (error) throw error
    return data as Ajuste[]
  }

  const deleteAjustesEmLote = async (ids: string[]) => {
    if (!ids.length) return

    const { error } = await client
      .from('ajustes')
      .delete()
      .in('id', ids)

    if (error) throw error
  }

  // ==========================================
  // FATURAMENTOS
  // ==========================================

  const getFaturamentos = async (ano?: number) => {
    if (!empresaId.value) return [] as Faturamento[]

    let query = client
      .from('faturamentos')
      .select('*')
      .eq('empresa_id', empresaId.value)
      .order('ano', { ascending: false })
      .order('mes', { ascending: false })

    if (ano) {
      query = query.eq('ano', ano)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Faturamento[]
  }

  const upsertFaturamento = async (faturamento: Partial<Faturamento>) => {
    const { data, error } = await client
      .from('faturamentos')
      .upsert({ ...faturamento, empresa_id: empresaId.value }, {
        onConflict: 'empresa_id,ano,mes'
      })
      .select()
      .single()

    if (error) throw error
    return data as Faturamento
  }

  // ==========================================
  // VIEWS E RELATÓRIOS
  // ==========================================

  const getSaldoEstoque = async () => {
    const { data, error } = await client
      .from('v_saldo_estoque')
      .select('*')
      .eq('empresa_id', empresaId.value)

    if (error) throw error
    return data as SaldoEstoque[]
  }

  // Buscar saldo de um produto específico
  const getSaldoProduto = async (produtoId: string): Promise<number> => {
    const { data, error } = await client
      .from('v_saldo_estoque')
      .select('saldo_principal')
      .eq('produto_id', produtoId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return Number(data?.saldo_principal || 0)
  }

  // Buscar saldo duplo (principal + apoio)
  const getSaldoDuplo = async (produtoId: string) => {
    const { data, error } = await client
      .from('v_saldo_estoque')
      .select('saldo_principal, saldo_apoio, saldo_atual')
      .eq('produto_id', produtoId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return {
      principal: Number(data?.saldo_principal || 0),
      apoio: Number(data?.saldo_apoio || 0),
      total: Number(data?.saldo_atual || 0)
    }
  }

  // ==========================================
  // TRANSFERÊNCIAS PENDENTES ENTRE LOJAS
  // ==========================================

  const getTransferenciasPendentes = async () => {
    if (!empresaId.value) return [] as TransferenciaPendente[]

    const { data, error } = await client
      .from('transferencias_pendentes')
      .select(`
        *,
        empresa_origem:empresas!transferencias_pendentes_empresa_origem_id_fkey(id, nome),
        produto_origem:produtos!transferencias_pendentes_produto_origem_id_fkey(
          id, nome,
          unidade:unidades(sigla)
        ),
        produto_destino:produtos!transferencias_pendentes_produto_destino_id_fkey(
          id, nome,
          unidade:unidades(sigla)
        )
      `)
      .eq('empresa_destino_id', empresaId.value)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as TransferenciaPendente[]
  }

  const countTransferenciasPendentes = async (): Promise<number> => {
    if (!empresaId.value) return 0

    const { count, error } = await client
      .from('transferencias_pendentes')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_destino_id', empresaId.value)
      .eq('status', 'pendente')

    if (error) throw error
    return count || 0
  }

  const createTransferenciaLoja = async (
    produtoOrigemId: string,
    produtoDestinoId: string,
    empresaDestinoId: string,
    quantidade: number,
    data: string,
    observacao?: string
  ) => {
    // Buscar custo médio do produto na view de saldo
    const { data: saldoData, error: saldoError } = await client
      .from('v_saldo_estoque')
      .select('custo_medio')
      .eq('produto_id', produtoOrigemId)
      .single()

    if (saldoError && saldoError.code !== 'PGRST116') throw saldoError
    const custoUnitario = Number(saldoData?.custo_medio || 0)
    const custoTotal = custoUnitario * quantidade

    const { data: transferencia, error } = await client
      .from('transferencias_pendentes')
      .insert({
        empresa_origem_id: empresaId.value,
        empresa_destino_id: empresaDestinoId,
        produto_origem_id: produtoOrigemId,
        produto_destino_id: produtoDestinoId,
        quantidade,
        custo_unitario: custoUnitario,
        custo_total: custoTotal,
        data,
        observacao: observacao || null,
        status: 'pendente'
      })
      .select()
      .single()

    if (error) throw error
    return transferencia as TransferenciaPendente
  }

  const confirmarTransferencia = async (transferenciaId: string) => {
    // 1. Buscar a transferência pendente
    const { data: transf, error: fetchError } = await client
      .from('transferencias_pendentes')
      .select('*')
      .eq('id', transferenciaId)
      .eq('status', 'pendente')
      .single()

    if (fetchError || !transf) throw new Error('Transferência não encontrada ou já processada')

    // 2. Criar saída na empresa de origem
    const { data: saidaCriada, error: saidaError } = await client
      .from('saidas')
      .insert({
        produto_id: transf.produto_origem_id,
        empresa_id: transf.empresa_origem_id,
        tipo: 'transferencia',
        empresa_destino_id: transf.empresa_destino_id,
        data: transf.data,
        quantidade: transf.quantidade,
        observacao: transf.observacao || 'Transferência entre lojas'
      })
      .select()
      .single()

    if (saidaError) throw saidaError

    // 3. Criar entrada na empresa de destino
    const { error: entradaError } = await client
      .from('entradas')
      .insert({
        produto_id: transf.produto_destino_id,
        empresa_id: transf.empresa_destino_id,
        data: transf.data,
        quantidade: transf.quantidade,
        custo_unitario: transf.custo_unitario,
        valor_total: transf.custo_total,
        observacao: `Transferência recebida`
      })

    if (entradaError) {
      // Reverter saída
      await client.from('saidas').delete().eq('id', saidaCriada.id)
      throw entradaError
    }

    // 4. Atualizar status
    const { error: updateError } = await client
      .from('transferencias_pendentes')
      .update({
        status: 'confirmada',
        data_resolucao: new Date().toISOString().split('T')[0]
      })
      .eq('id', transferenciaId)
      .eq('status', 'pendente')

    if (updateError) throw updateError
  }

  const rejeitarTransferencia = async (transferenciaId: string) => {
    const { data, error } = await client
      .from('transferencias_pendentes')
      .update({
        status: 'rejeitada',
        data_resolucao: new Date().toISOString().split('T')[0]
      })
      .eq('id', transferenciaId)
      .eq('status', 'pendente')
      .select()
      .single()

    if (error || !data) throw new Error('Transferência não encontrada ou já processada')
  }

  // ==========================================
  // REQUISIÇÕES (SETOR → ESTOQUISTA)
  // ==========================================

  const getRequisicoes = async (status?: import('~/types').StatusRequisicao) => {
    if (!empresaId.value) return [] as import('~/types').Requisicao[]

    let query = client
      .from('requisicoes')
      .select(`
        *,
        setor:setores(id, nome, tipo),
        itens:requisicao_itens(
          *,
          produto:produtos(id, nome, unidade:unidades(sigla))
        )
      `)
      .eq('empresa_id', empresaId.value)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return data as import('~/types').Requisicao[]
  }

  const countRequisicoesPendentes = async (): Promise<number> => {
    if (!empresaId.value) return 0

    const { count, error } = await client
      .from('requisicoes')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId.value)
      .eq('status', 'pendente')

    if (error) throw error
    return count || 0
  }

  const enviarRequisicao = async (
    requisicaoId: string,
    itensAprovados: Array<{ requisicao_item_id: string; produto_id: string; quantidade_enviada: number }>
  ) => {
    // 1. Buscar requisição (garantir que é pendente)
    const { data: req, error: fetchErr } = await client
      .from('requisicoes')
      .select('id, setor_id, setor:setores(nome)')
      .eq('id', requisicaoId)
      .eq('status', 'pendente')
      .single()

    if (fetchErr || !req) throw new Error('Requisição não encontrada ou já processada')

    const hoje = new Date().toISOString().split('T')[0]
    const nomeSetor = (req as any).setor?.nome || 'Setor'

    // 2. Para cada item com quantidade_enviada > 0, criar saída tipo transferência (principal → apoio)
    for (const item of itensAprovados) {
      if (item.quantidade_enviada <= 0) continue

      // Atualizar quantidade_enviada no item
      await client
        .from('requisicao_itens')
        .update({ quantidade_enviada: item.quantidade_enviada })
        .eq('id', item.requisicao_item_id)

      // Criar saída transferência (desconta do principal, credita no apoio)
      await client
        .from('saidas')
        .insert({
          produto_id: item.produto_id,
          empresa_id: empresaId.value,
          tipo: 'transferencia',
          data: hoje,
          quantidade: item.quantidade_enviada,
          observacao: `Requisição: ${nomeSetor}`,
          requisicao_id: requisicaoId
        })
    }

    // 3. Atualizar status da requisição
    const user = useSupabaseUser()
    const { error: updateErr } = await client
      .from('requisicoes')
      .update({
        status: 'enviado',
        data_envio: new Date().toISOString(),
        enviado_por: user.value?.id || null
      })
      .eq('id', requisicaoId)
      .eq('status', 'pendente')

    if (updateErr) throw updateErr
  }

  const cancelarRequisicao = async (requisicaoId: string) => {
    const { error } = await client
      .from('requisicoes')
      .update({ status: 'cancelado' })
      .eq('id', requisicaoId)
      .eq('status', 'pendente')

    if (error) throw error
  }

  // ==========================================
  // PEDIDOS DE COMPRA
  // ==========================================

  const getPedidos = async () => {
    const { data, error } = await client
      .from('pedidos')
      .select(`*, itens:pedido_itens(*, produto:produtos(*, unidade:unidades(*), subgrupo:subgrupos(*, grupo:grupos(*))), fornecedor:fornecedores(*))`)
      .eq('empresa_id', empresaId.value)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Pedido[]
  }

  const createPedido = async (
    pedido: {
      data: string
      nome?: string
      observacao?: string
      status?: string
      previsao_recebimento?: string
      responsavel_nome?: string
      responsavel_telefone?: string
      valor_estimado?: number
      origem?: string
    },
    itens: { produto_id: string; quantidade: number; fornecedor_id?: string; observacao?: string; preco_estimado?: number }[]
  ) => {
    // Criar pedido
    const { data: novoPedido, error: errPedido } = await client
      .from('pedidos')
      .insert({
        empresa_id: empresaId.value,
        data: pedido.data,
        nome: pedido.nome || null,
        observacao: pedido.observacao || null,
        status: pedido.status || 'rascunho',
        previsao_recebimento: pedido.previsao_recebimento || null,
        responsavel_nome: pedido.responsavel_nome || null,
        responsavel_telefone: pedido.responsavel_telefone || null,
        valor_estimado: pedido.valor_estimado || null,
        origem: pedido.origem || 'manual'
      })
      .select()
      .single()

    if (errPedido) throw errPedido

    // Criar itens
    const itensPayload = itens.map(item => ({
      pedido_id: novoPedido.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      fornecedor_id: item.fornecedor_id || null,
      observacao: item.observacao || null,
      preco_estimado: item.preco_estimado || null
    }))

    const { error: errItens } = await client
      .from('pedido_itens')
      .insert(itensPayload)

    if (errItens) throw errItens

    return novoPedido as Pedido
  }

  const updatePedidoStatus = async (id: string, status: string) => {
    const { error } = await client
      .from('pedidos')
      .update({ status })
      .eq('id', id)

    if (error) throw error
  }

  const deletePedido = async (id: string) => {
    const { error } = await client
      .from('pedidos')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  const updatePedido = async (id: string, updates: Partial<Pedido>) => {
    const { error } = await client
      .from('pedidos')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  }

  const updatePedidoItens = async (
    pedidoId: string,
    itens: { produto_id: string; quantidade: number; fornecedor_id?: string; observacao?: string; preco_estimado?: number }[]
  ) => {
    // Deletar itens existentes
    const { error: delError } = await client.from('pedido_itens').delete().eq('pedido_id', pedidoId)
    if (delError) throw delError
    // Inserir novos
    const payload = itens.map(item => ({
      pedido_id: pedidoId,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      fornecedor_id: item.fornecedor_id || null,
      observacao: item.observacao || null,
      preco_estimado: item.preco_estimado || null
    }))
    const { error } = await client.from('pedido_itens').insert(payload)
    if (error) throw error
  }

  const confirmarRecebimento = async (pedidoId: string, dataRecebimento: string) => {
    const { error } = await client
      .from('pedidos')
      .update({ status: 'finalizada', data_recebimento: dataRecebimento })
      .eq('id', pedidoId)

    if (error) throw error
  }

  const getUltimosPrecos = async (produtoIds: string[]): Promise<Record<string, number>> => {
    if (!produtoIds.length) return {}
    const { data, error } = await client
      .from('entradas')
      .select('produto_id, custo_unitario, data')
      .eq('empresa_id', empresaId.value)
      .in('produto_id', produtoIds)
      .order('data', { ascending: false })

    if (error) throw error
    const precos: Record<string, number> = {}
    data?.forEach((e: any) => {
      if (!precos[e.produto_id]) {
        precos[e.produto_id] = e.custo_unitario
      }
    })
    return precos
  }

  // ==========================================
  // PEDIDOS DA SEMANA ATUAL (para flag "pedido feito")
  // ==========================================

  const getPedidosSemanaAtual = async (): Promise<Map<string, string>> => {
    const hoje = new Date()
    const diaSemana = hoje.getDay() // 0=Dom, 1=Seg, ...
    const diffToMonday = diaSemana === 0 ? 6 : diaSemana - 1
    const segunda = new Date(hoje)
    segunda.setDate(hoje.getDate() - diffToMonday)
    const domingo = new Date(segunda)
    domingo.setDate(segunda.getDate() + 6)

    const segundaStr = segunda.toISOString().split('T')[0]
    const domingoStr = domingo.toISOString().split('T')[0]

    const { data, error } = await client
      .from('pedidos')
      .select('data, itens:pedido_itens(produto_id)')
      .eq('empresa_id', empresaId.value)
      .gte('data', segundaStr)
      .lte('data', domingoStr)

    if (error) throw error

    // Map<produto_id, data_pedido_mais_recente>
    const map = new Map<string, string>()
    for (const pedido of data || []) {
      for (const item of (pedido as any).itens || []) {
        const existing = map.get(item.produto_id)
        if (!existing || pedido.data > existing) {
          map.set(item.produto_id, pedido.data)
        }
      }
    }
    return map
  }

  // ==========================================
  // CONTAGENS
  // ==========================================

  const getContagens = async () => {
    if (!empresaId.value) return [] as import('~/types').Contagem[]

    const { data, error } = await client
      .from('contagens')
      .select('id, empresa_id, nome, tipo, data, status, recorrencia, horario_notificacao, dias_semana, mensal_posicao, mensal_dia, responsavel_nome, responsavel_telefone, responsavel_id, progresso, ultima_contagem, token, responsaveis_data, created_at, updated_at, contagem_setores(id, contagem_id, setor_id, status, progresso, finalizado_em, setor:setores(id, nome, tipo))')
      .eq('empresa_id', empresaId.value)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as import('~/types').Contagem[]
  }

  const createContagem = async (contagem: {
    nome: string
    tipo: string
    data: string
    recorrencia?: string
    horario_notificacao?: string
    dias_semana?: string[]
    mensal_posicao?: string
    mensal_dia?: string
    responsavel_nome?: string
    responsavel_telefone?: string
    responsavel_id?: string
  }) => {
    // 1. Auto-consultar setores pelo tipo
    const setorQuery = client
      .from('setores')
      .select('id')
      .eq('empresa_id', empresaId.value)

    if (contagem.tipo !== 'inventario') {
      setorQuery.eq('tipo', contagem.tipo)
    }

    const { data: setoresAuto } = await setorQuery
    const setorIds = (setoresAuto || []).map((s: any) => s.id)

    if (setorIds.length === 0) {
      const tipoLabel = contagem.tipo === 'apoio' ? 'Estoque de Apoio' : contagem.tipo === 'inventario' ? 'Inventário' : 'Estoque Principal'
      throw new Error(`Nenhum setor de ${tipoLabel} encontrado. Crie setores antes de criar uma contagem.`)
    }

    // 2. Criar a contagem
    const { data, error } = await client
      .from('contagens')
      .insert({ ...contagem, empresa_id: empresaId.value })
      .select()
      .single()

    if (error) throw error
    const nova = data as import('~/types').Contagem

    // 3. Vincular setores automaticamente
    const rows = setorIds.map((sid: string) => ({ contagem_id: nova.id, setor_id: sid }))
    const { error: errSetores } = await client
      .from('contagem_setores')
      .insert(rows)

    if (errSetores) throw errSetores

    return nova
  }

  // ==========================================
  // RESPONSÁVEIS
  // ==========================================

  const getResponsaveis = async () => {
    if (!empresaId.value) return [] as { id: string; nome: string; telefone: string }[]

    const { data, error } = await client
      .from('responsaveis')
      .select('*')
      .eq('empresa_id', empresaId.value)
      .order('nome')

    if (error) throw error
    return data as { id: string; nome: string; telefone: string }[]
  }

  const createResponsavel = async (resp: { nome: string; telefone: string }) => {
    const { data, error } = await client
      .from('responsaveis')
      .insert({ ...resp, empresa_id: empresaId.value })
      .select()
      .single()

    if (error) throw error
    return data as { id: string; nome: string; telefone: string }
  }

  const updateContagemStatus = async (id: string, status: string) => {
    const { error } = await client
      .from('contagens')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  }

  const prepararProximoCiclo = async (id: string) => {
    const { error } = await client
      .from('contagens')
      .update({
        status: 'aguardando',
        ultima_contagem: new Date().toISOString(),
        ultimo_lembrete_enviado: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
  }

  const deleteContagem = async (id: string) => {
    const { error } = await client
      .from('contagens')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  const updateContagem = async (
    id: string,
    contagem: {
      nome?: string
      recorrencia?: string
      horario_notificacao?: string
      dias_semana?: string[]
      mensal_posicao?: string
      mensal_dia?: string
      responsavel_nome?: string
      responsavel_telefone?: string
      responsavel_id?: string
      responsaveis_data?: Array<{ id?: string; nome: string; telefone: string }>
    }
  ) => {
    // Buscar status e tipo atual da contagem
    const { data: contagemAtual } = await client
      .from('contagens')
      .select('status, tipo, horario_notificacao')
      .eq('id', id)
      .single()

    // Se o horário de notificação mudou, resetar o ultimo_lembrete_enviado
    // para permitir reenvio no novo horário
    const horarioMudou = contagem.horario_notificacao !== undefined
      && contagem.horario_notificacao !== contagemAtual?.horario_notificacao

    const { error } = await client
      .from('contagens')
      .update({
        ...contagem,
        updated_at: new Date().toISOString(),
        ...(horarioMudou ? { ultimo_lembrete_enviado: null } : {})
      })
      .eq('id', id)

    if (error) throw error

    // Re-sincronizar setores apenas se a contagem não está em andamento
    if (contagemAtual?.status !== 'em_andamento') {
      const setorQuery = client
        .from('setores')
        .select('id')
        .eq('empresa_id', empresaId.value)

      if (contagemAtual?.tipo !== 'inventario') {
        setorQuery.eq('tipo', contagemAtual?.tipo)
      }

      const { data: setoresAuto } = await setorQuery
      const setorIds = (setoresAuto || []).map((s: any) => s.id)

      await client.from('contagem_setores').delete().eq('contagem_id', id)
      if (setorIds.length > 0) {
        const rows = setorIds.map((sid: string) => ({ contagem_id: id, setor_id: sid }))
        const { error: errSetores } = await client
          .from('contagem_setores')
          .insert(rows)
        if (errSetores) throw errSetores
      }
    }
  }

  // ==========================================
  // CONTAGEM ITENS (persistência de contagens parciais)
  // ==========================================

  const getContagemItens = async (contagemId: string, setorId?: string) => {
    let query = client
      .from('contagem_itens')
      .select('*')
      .eq('contagem_id', contagemId)

    if (setorId) {
      query = query.eq('setor_id', setorId)
    }

    const { data, error } = await query
    if (error) throw error
    return data as import('~/types').ContagemItemDB[]
  }

  const upsertContagemItens = async (
    contagemId: string,
    setorId: string,
    itens: { produto_id: string; quantidade_contada: number | null }[]
  ) => {
    const payload = itens
      .filter(i => i.quantidade_contada !== null && i.quantidade_contada !== undefined)
      .map(i => ({
        contagem_id: contagemId,
        setor_id: setorId,
        produto_id: i.produto_id,
        quantidade_contada: i.quantidade_contada,
        empresa_id: empresaId.value,
        updated_at: new Date().toISOString()
      }))

    if (!payload.length) return []

    const { data, error } = await client
      .from('contagem_itens')
      .upsert(payload, { onConflict: 'contagem_id,setor_id,produto_id' })
      .select()

    if (error) throw error
    return data as import('~/types').ContagemItemDB[]
  }

  const deleteContagemItens = async (contagemId: string) => {
    const { error } = await client
      .from('contagem_itens')
      .delete()
      .eq('contagem_id', contagemId)

    if (error) throw error
  }

  const updateContagemSetor = async (
    contagemId: string,
    setorId: string,
    updates: { status?: string; progresso?: number; finalizado_em?: string | null }
  ) => {
    const { error } = await client
      .from('contagem_setores')
      .update(updates)
      .eq('contagem_id', contagemId)
      .eq('setor_id', setorId)

    if (error) throw error
  }

  const resetContagemSetores = async (contagemId: string) => {
    // Re-sincronizar setores (captura novos setores criados desde a última contagem)
    const { data: contagemAtual } = await client
      .from('contagens')
      .select('tipo')
      .eq('id', contagemId)
      .single()

    if (contagemAtual) {
      const setorQuery = client
        .from('setores')
        .select('id')
        .eq('empresa_id', empresaId.value)

      if (contagemAtual.tipo !== 'inventario') {
        setorQuery.eq('tipo', contagemAtual.tipo)
      }

      const { data: setoresAuto } = await setorQuery
      const setorIds = (setoresAuto || []).map((s: any) => s.id)

      await client.from('contagem_setores').delete().eq('contagem_id', contagemId)
      if (setorIds.length > 0) {
        await client.from('contagem_setores').insert(
          setorIds.map((sid: string) => ({ contagem_id: contagemId, setor_id: sid }))
        )
      }
    } else {
      // Fallback: só resetar status se não conseguiu buscar o tipo
      const { error } = await client
        .from('contagem_setores')
        .update({ status: 'pendente', progresso: 0, finalizado_em: null })
        .eq('contagem_id', contagemId)

      if (error) throw error
    }
  }

  const ensureDefaultContagens = async () => {
    if (!empresaId.value) return

    // Checar se as 3 contagens padrão já existem (exatamente 3 tipos)
    const { data: existing } = await client
      .from('contagens')
      .select('id, tipo, recorrencia')
      .eq('empresa_id', empresaId.value)

    const tiposExistentes = new Set((existing || []).map((c: any) => c.tipo))
    const temTodos = tiposExistentes.has('principal') && tiposExistentes.has('apoio') && tiposExistentes.has('inventario')

    // Se já tem os 3 tipos, apenas garantir que setores estejam vinculados
    if (temTodos) {
      for (const contagem of (existing || [])) {
        const { count } = await client
          .from('contagem_setores')
          .select('*', { count: 'exact', head: true })
          .eq('contagem_id', contagem.id)

        if (!count || count === 0) {
          // Vincular setores disponíveis do tipo correspondente
          const q = client.from('setores').select('id').eq('empresa_id', empresaId.value)
          if (contagem.tipo !== 'inventario') q.eq('tipo', contagem.tipo)
          const { data: setoresDisp } = await q
          if (setoresDisp?.length) {
            await client.from('contagem_setores').insert(
              setoresDisp.map((s: any) => ({ contagem_id: contagem.id, setor_id: s.id }))
            )
          }
        }
      }
      return
    }

    // Limpar contagens antigas (usuário autorizou) e recriar do zero
    if (existing && existing.length > 0) {
      const ids = existing.map((c: any) => c.id)
      await client.from('contagem_itens').delete().in('contagem_id', ids)
      await client.from('contagem_setores').delete().in('contagem_id', ids)
      await client.from('contagens').delete().in('id', ids)
    }

    // Criar as 3 contagens padrão
    const defaults = [
      { tipo: 'principal', nome: 'Estoque Principal' },
      { tipo: 'apoio', nome: 'Estoque de Apoio' },
      { tipo: 'inventario', nome: 'Inventário' }
    ]

    for (const { tipo, nome } of defaults) {
      const { data: nova } = await client
        .from('contagens')
        .insert({
          empresa_id: empresaId.value,
          nome,
          tipo,
          data: new Date().toISOString().split('T')[0],
          recorrencia: 'nenhuma',
          status: 'aguardando'
        })
        .select('id')
        .single()

      if (nova) {
        // Best-effort: vincular setores disponíveis
        const q = client.from('setores').select('id').eq('empresa_id', empresaId.value)
        if (tipo !== 'inventario') q.eq('tipo', tipo)
        const { data: setoresDisp } = await q
        if (setoresDisp?.length) {
          await client.from('contagem_setores').insert(
            setoresDisp.map((s: any) => ({ contagem_id: (nova as any).id, setor_id: s.id }))
          )
        }
      }
    }
  }

  const markContagemItensAjustados = async (contagemId: string, produtoIds: string[]) => {
    if (!produtoIds.length) return
    const { error } = await client
      .from('contagem_itens')
      .update({ ajuste_registrado: true })
      .eq('contagem_id', contagemId)
      .in('produto_id', produtoIds)

    if (error) throw error
  }

  const snapshotSaldoContagem = async (contagemId: string, saldos: Array<{ produto_id: string; saldo: number }>) => {
    await Promise.all(saldos.map(s =>
      client
        .from('contagem_itens')
        .update({ saldo_no_momento: s.saldo })
        .eq('contagem_id', contagemId)
        .eq('produto_id', s.produto_id)
    ))
  }

  const appendContagemResultado = async (contagemId: string, resultado: import('~/types').ContagemResultado) => {
    // Insert header row
    const { data: inserted, error: errInsert } = await client
      .from('contagem_resultados')
      .insert({
        contagem_id: contagemId,
        empresa_id: empresaId.value,
        ciclo: resultado.ciclo,
        data: resultado.data,
        finalizado_em: resultado.finalizado_em,
        motivo: resultado.motivo,
        total_contados: resultado.resumo.total_contados,
        total_nao_contados: resultado.resumo.total_nao_contados,
        total_sobras: resultado.resumo.total_sobras,
        total_faltas: resultado.resumo.total_faltas,
        valor_total_divergencia: resultado.resumo.valor_total_divergencia,
        acuracidade_geral: resultado.resumo.acuracidade_geral ?? 100
      })
      .select('id')
      .single()

    if (errInsert) throw errInsert

    // Insert item rows
    if (resultado.itens.length > 0) {
      const { error: errItens } = await client
        .from('contagem_resultado_itens')
        .insert(resultado.itens.map(item => ({
          resultado_id: inserted.id,
          empresa_id: empresaId.value,
          produto_id: item.produto_id,
          nome: item.nome,
          unidade_sigla: item.unidade_sigla,
          saldo_sistema: item.saldo_sistema,
          quantidade_contada: item.quantidade_contada,
          diferenca: item.diferenca,
          custo_medio: item.custo_medio,
          valor_divergencia: item.valor_divergencia,
          acuracidade: item.acuracidade ?? 100,
          setores_breakdown: item.setores_breakdown || []
        })))

      if (errItens) throw errItens
    }
  }

  const getContagemResultados = async (contagemId: string): Promise<import('~/types').ContagemResultado[]> => {
    const { data: rows, error } = await client
      .from('contagem_resultados')
      .select('*, itens:contagem_resultado_itens(*)')
      .eq('contagem_id', contagemId)
      .order('finalizado_em', { ascending: false })

    if (error) throw error
    if (!rows) return []

    return rows.map((row: any) => ({
      id: row.id,
      contagem_id: row.contagem_id,
      ciclo: row.ciclo,
      data: row.data,
      finalizado_em: row.finalizado_em,
      motivo: row.motivo,
      resumo: {
        total_contados: row.total_contados,
        total_nao_contados: row.total_nao_contados,
        total_sobras: row.total_sobras,
        total_faltas: row.total_faltas,
        valor_total_divergencia: Number(row.valor_total_divergencia),
        acuracidade_geral: Number(row.acuracidade_geral ?? 100)
      },
      itens: (row.itens || []).map((item: any) => ({
        produto_id: item.produto_id,
        nome: item.nome,
        unidade_sigla: item.unidade_sigla,
        saldo_sistema: Number(item.saldo_sistema),
        quantidade_contada: Number(item.quantidade_contada),
        diferenca: Number(item.diferenca),
        custo_medio: Number(item.custo_medio),
        valor_divergencia: Number(item.valor_divergencia),
        acuracidade: Number(item.acuracidade ?? 100),
        setores_breakdown: item.setores_breakdown
      }))
    }))
  }

  // ==========================================
  // SETORES
  // ==========================================

  const getSetores = async () => {
    if (!empresaId.value) return [] as import('~/types').Setor[]

    const { data, error } = await client
      .from('setores')
      .select('*')
      .eq('empresa_id', empresaId.value)
      .order('nome', { ascending: true })

    if (error) throw error
    return data as import('~/types').Setor[]
  }

  const createSetor = async (setor: { nome: string; descricao?: string; tipo?: 'principal' | 'apoio' }) => {
    const { data, error } = await client
      .from('setores')
      .insert({ ...setor, empresa_id: empresaId.value })
      .select()
      .single()

    if (error) throw error
    return data as import('~/types').Setor
  }

  const deleteSetor = async (id: string) => {
    const { error } = await client
      .from('setores')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ==========================================
  // SETOR PRODUTOS (vínculo setor <-> produto)
  // ==========================================

  const getSetorProdutos = async (setorId: string) => {
    const { data, error } = await client
      .from('setor_produtos')
      .select('*, produto:produtos(id, nome, subgrupo:subgrupos(id, nome, grupo:grupos(id, nome)), unidade:unidades(id, sigla))')
      .eq('setor_id', setorId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as import('~/types').SetorProduto[]
  }

  const addProdutosToSetor = async (setorId: string, produtoIds: string[]) => {
    const rows = produtoIds.map(pid => ({
      setor_id: setorId,
      produto_id: pid,
      empresa_id: empresaId.value
    }))

    const { data, error } = await client
      .from('setor_produtos')
      .upsert(rows, { onConflict: 'setor_id,produto_id' })
      .select('*, produto:produtos(id, nome, subgrupo:subgrupos(id, nome, grupo:grupos(id, nome)), unidade:unidades(id, sigla))')

    if (error) throw error
    return data as import('~/types').SetorProduto[]
  }

  const removeProdutoFromSetor = async (setorProdutoId: string) => {
    const { error } = await client
      .from('setor_produtos')
      .delete()
      .eq('id', setorProdutoId)

    if (error) throw error
  }

  const getAllSetorProdutos = async () => {
    if (!empresaId.value) return [] as { id: string; setor_id: string; produto_id: string; produto: { id: string; nome: string } | null }[]

    const { data, error } = await client
      .from('setor_produtos')
      .select('id, setor_id, produto_id, produto:produtos(id, nome)')
      .eq('empresa_id', empresaId.value)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as { id: string; setor_id: string; produto_id: string; produto: { id: string; nome: string } | null }[]
  }

  const countSetorProdutos = async () => {
    const { data, error } = await client
      .from('setor_produtos')
      .select('setor_id')

    if (error) throw error

    const counts: Record<string, number> = {}
    for (const row of (data || [])) {
      counts[row.setor_id] = (counts[row.setor_id] || 0) + 1
    }
    return counts
  }

  return {
    // Grupos
    getGrupos,
    createGrupo,
    updateGrupo,
    deleteGrupo,
    // Subgrupos
    getSubgrupos,
    createSubgrupo,
    updateSubgrupo,
    deleteSubgrupo,
    // Categorias
    getCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria,
    // Unidades
    getUnidades,
    createUnidade,
    updateUnidade,
    deleteUnidade,
    // Fornecedores
    getFornecedores,
    createFornecedor,
    updateFornecedor,
    deleteFornecedor,
    // Produtos
    getProdutos,
    getProduto,
    createProduto,
    updateProduto,
    deleteProduto,
    // Custos
    getCustosMensais,
    upsertCustoMensal,
    // Entradas
    getEntradas,
    createEntrada,
    updateEntrada,
    deleteEntrada,
    // Saídas
    getSaidas,
    createSaida,
    createSaidaTransferenciaLoja,
    updateSaida,
    deleteSaida,
    // Transferências Pendentes
    getTransferenciasPendentes,
    countTransferenciasPendentes,
    createTransferenciaLoja,
    confirmarTransferencia,
    rejeitarTransferencia,
    // Requisições
    getRequisicoes,
    countRequisicoesPendentes,
    enviarRequisicao,
    cancelarRequisicao,
    // Ajustes
    getAjustes,
    createAjuste,
    updateAjuste,
    deleteAjuste,
    createAjustesEmLote,
    deleteAjustesEmLote,
    // Faturamentos
    getFaturamentos,
    upsertFaturamento,
    // Relatórios
    getSaldoEstoque,
    getSaldoProduto,
    getSaldoDuplo,
    // Pedidos de Compra
    getPedidos,
    createPedido,
    updatePedido,
    updatePedidoStatus,
    updatePedidoItens,
    confirmarRecebimento,
    getUltimosPrecos,
    getPedidosSemanaAtual,
    deletePedido,
    // Setores
    getSetores,
    createSetor,
    deleteSetor,
    // Setor Produtos
    getSetorProdutos,
    addProdutosToSetor,
    removeProdutoFromSetor,
    countSetorProdutos,
    getAllSetorProdutos,
    // Contagens
    getContagens,
    createContagem,
    updateContagem,
    updateContagemStatus,
    prepararProximoCiclo,
    ensureDefaultContagens,
    // Contagem Itens
    getContagemItens,
    upsertContagemItens,
    deleteContagemItens,
    updateContagemSetor,
    resetContagemSetores,
    markContagemItensAjustados,
    snapshotSaldoContagem,
    appendContagemResultado,
    getContagemResultados,
    // Responsáveis
    getResponsaveis,
    createResponsavel
  }
}
