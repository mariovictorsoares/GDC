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
  ProdutoBeneficiamento,
  Beneficiamento,

  SaldoEstoque,
  FiltroData,
  TipoSaida
} from '~/types'

export const useEstoque = () => {
  const client = useSupabaseClient()
  const { empresaId } = useEmpresa()

  // ==========================================
  // GRUPOS
  // ==========================================

  const getGrupos = async () => {
    let query = client
      .from('grupos')
      .select('*')
      .order('created_at', { ascending: false })

    if (empresaId.value) {
      query = query.eq('empresa_id', empresaId.value)
    }

    const { data, error } = await query

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
    let query = client
      .from('subgrupos')
      .select(`
        *,
        grupo:grupos(*)
      `)
      .order('created_at', { ascending: false })

    if (empresaId.value) {
      query = query.eq('empresa_id', empresaId.value)
    }

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
    let query = client
      .from('categorias')
      .select('*')
      .order('created_at', { ascending: false })

    if (empresaId.value) {
      query = query.eq('empresa_id', empresaId.value)
    }

    const { data, error } = await query

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
    let query = client
      .from('unidades')
      .select('*')
      .order('created_at', { ascending: false })

    if (empresaId.value) {
      query = query.eq('empresa_id', empresaId.value)
    }

    const { data, error } = await query

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
    let query = client
      .from('fornecedores')
      .select('*')
      .order('created_at', { ascending: false })

    if (empresaId.value) {
      query = query.eq('empresa_id', empresaId.value)
    }

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
    let query = client
      .from('produtos')
      .select(`
        *,
        categoria:categorias(*),
        subgrupo:subgrupos(*, grupo:grupos(*)),
        unidade:unidades(*)
      `)
      .order('created_at', { ascending: false })

    if (empresaId.value) {
      query = query.eq('empresa_id', empresaId.value)
    }

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
    let query = client
      .from('entradas')
      .select(`
        *,
        produto:produtos(*, categoria:categorias(*), unidade:unidades(*)),
        fornecedor:fornecedores(*)
      `)
      .order('data', { ascending: false })
      .order('created_at', { ascending: false })

    if (empresaId.value) {
      query = query.eq('empresa_id', empresaId.value)
    }

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
    let query = client
      .from('saidas')
      .select(`
        *,
        produto:produtos(*, categoria:categorias(*), unidade:unidades(*))
      `)
      .order('data', { ascending: false })

    if (empresaId.value) {
      query = query.eq('empresa_id', empresaId.value)
    }

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

  // ==========================================
  // AJUSTES
  // ==========================================

  const getAjustes = async (filtro?: FiltroData) => {
    let query = client
      .from('ajustes')
      .select(`
        *,
        produto:produtos(*, categoria:categorias(*), unidade:unidades(*))
      `)
      .order('data', { ascending: false })

    if (empresaId.value) {
      query = query.eq('empresa_id', empresaId.value)
    }

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

  const createAjustesEmLote = async (ajustes: Array<{ produto_id: string; data: string; quantidade: number; motivo: string }>) => {
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
    let query = client
      .from('faturamentos')
      .select('*')
      .order('ano', { ascending: false })
      .order('mes', { ascending: false })

    if (empresaId.value) {
      query = query.eq('empresa_id', empresaId.value)
    }

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
        onConflict: 'ano,mes'
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
  // BENEFICIAMENTO - Produtos Vinculados
  // ==========================================

  const getProdutosBeneficiamento = async (produtoOrigemId: string) => {
    const { data, error } = await client
      .from('produtos_beneficiamento')
      .select(`
        *,
        produto_final:produtos!produto_final_id(
          id, nome,
          unidade:unidades(sigla),
          subgrupo:subgrupos(nome, grupo:grupos(nome))
        )
      `)
      .eq('produto_origem_id', produtoOrigemId)

    if (error) throw error
    return data as ProdutoBeneficiamento[]
  }

  const createProdutoBeneficiamento = async (link: {
    produto_origem_id: string
    produto_final_id: string
  }) => {
    const { data, error } = await client
      .from('produtos_beneficiamento')
      .insert({ ...link, empresa_id: empresaId.value })
      .select()
      .single()

    if (error) throw error
    return data as ProdutoBeneficiamento
  }

  const deleteProdutoBeneficiamento = async (id: string) => {
    const { error } = await client
      .from('produtos_beneficiamento')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ==========================================
  // BENEFICIAMENTO - Controle de Pendentes
  // ==========================================

  const getBeneficiamentosPendentes = async () => {
    let query = client
      .from('beneficiamentos')
      .select(`
        *,
        saida:saidas(
          *,
          produto:produtos(
            *,
            unidade:unidades(*),
            subgrupo:subgrupos(nome, grupo:grupos(nome))
          )
        )
      `)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })

    if (empresaId.value) {
      query = query.eq('empresa_id', empresaId.value)
    }

    const { data, error } = await query
    if (error) throw error
    return data as Beneficiamento[]
  }

  const countBeneficiamentosPendentes = async (): Promise<number> => {
    let query = client
      .from('beneficiamentos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')

    if (empresaId.value) {
      query = query.eq('empresa_id', empresaId.value)
    }

    const { count, error } = await query
    if (error) throw error
    return count || 0
  }

  const createSaidaBeneficiamento = async (saida: Partial<Saida>) => {
    // 1. Criar a saída normalmente com tipo beneficiamento
    const saidaCriada = await createSaida({
      ...saida,
      tipo: 'beneficiamento'
    })

    // 2. Criar registro de beneficiamento pendente
    const { error } = await client
      .from('beneficiamentos')
      .insert({
        saida_id: saidaCriada.id,
        status: 'pendente',
        empresa_id: empresaId.value
      })

    if (error) throw error
    return saidaCriada
  }

  const resolverBeneficiamento = async (
    beneficiamentoId: string,
    saida: Saida,
    itens: Array<{ produto_final_id: string; quantidade: number; gramatura?: number; custo_unitario?: number }>
  ) => {
    // 1. Criar entradas para cada produto final
    const entradasCriadas: Entrada[] = []
    for (const item of itens) {
      if (item.quantidade <= 0) continue
      const custoUnit = item.custo_unitario || 0
      const entrada = await createEntrada({
        produto_id: item.produto_final_id,
        data: new Date().toISOString().split('T')[0],
        quantidade: item.quantidade,
        custo_unitario: custoUnit,
        valor_total: custoUnit * item.quantidade,
        observacao: `Produção - beneficiamento`,
        origem_beneficiamento: true,
        gramatura: item.gramatura || undefined
      })
      entradasCriadas.push(entrada)
    }

    // 2. Criar beneficiamento_itens vinculando cada entrada
    for (let i = 0; i < entradasCriadas.length; i++) {
      const itemOriginal = itens.filter(it => it.quantidade > 0)[i]
      const { error } = await client
        .from('beneficiamento_itens')
        .insert({
          beneficiamento_id: beneficiamentoId,
          entrada_id: entradasCriadas[i].id,
          produto_final_id: itemOriginal.produto_final_id,
          quantidade: itemOriginal.quantidade
        })
      if (error) throw error
    }

    // 3. Atualizar status para resolvido (com check de concorrência)
    const { data, error } = await client
      .from('beneficiamentos')
      .update({
        status: 'resolvido',
        data_resolucao: new Date().toISOString().split('T')[0]
      })
      .eq('id', beneficiamentoId)
      .eq('status', 'pendente')
      .select()
      .single()

    if (error || !data) {
      throw new Error('Este beneficiamento já foi resolvido por outro usuário')
    }
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
    updateSaida,
    deleteSaida,
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
    // Beneficiamento
    getProdutosBeneficiamento,
    createProdutoBeneficiamento,
    deleteProdutoBeneficiamento,
    getBeneficiamentosPendentes,
    countBeneficiamentosPendentes,
    createSaidaBeneficiamento,
    resolverBeneficiamento
  }
}
