import type {
  Grupo,
  Subgrupo,
  Categoria,
  Unidade,
  Destino,
  Produto,
  Entrada,
  Saida,
  Ajuste,
  Faturamento,
  CustoMensal,
  Configuracao,
  SaldoEstoque,
  FiltroData
} from '~/types'

export const useEstoque = () => {
  const client = useSupabaseClient()

  // ==========================================
  // GRUPOS
  // ==========================================

  const getGrupos = async () => {
    const { data, error } = await client
      .from('grupos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Grupo[]
  }

  const createGrupo = async (grupo: Partial<Grupo>) => {
    const { data, error } = await client
      .from('grupos')
      .insert(grupo)
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
      .insert(subgrupo)
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
    const { data, error } = await client
      .from('categorias')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Categoria[]
  }

  const createCategoria = async (categoria: Partial<Categoria>) => {
    const { data, error } = await client
      .from('categorias')
      .insert(categoria)
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
    const { data, error } = await client
      .from('unidades')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Unidade[]
  }

  const createUnidade = async (unidade: Partial<Unidade>) => {
    const { data, error } = await client
      .from('unidades')
      .insert(unidade)
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
  // DESTINOS
  // ==========================================

  const getDestinos = async (apenasAtivos = true) => {
    let query = client
      .from('destinos')
      .select('*')
      .order('created_at', { ascending: false })

    if (apenasAtivos) {
      query = query.eq('ativo', true)
    }

    const { data, error } = await query

    if (error) throw error
    return data as Destino[]
  }

  const createDestino = async (destino: Partial<Destino>) => {
    const { data, error } = await client
      .from('destinos')
      .insert(destino)
      .select()
      .single()

    if (error) throw error
    return data as Destino
  }

  const updateDestino = async (id: string, destino: Partial<Destino>) => {
    const { data, error } = await client
      .from('destinos')
      .update(destino)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Destino
  }

  const deleteDestino = async (id: string) => {
    const { error } = await client
      .from('destinos')
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
      .insert(produto)
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
      .upsert(custoMensal, {
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
        produto:produtos(*, categoria:categorias(*), unidade:unidades(*))
      `)
      .order('data', { ascending: false })

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
      .insert(entrada)
      .select(`
        *,
        produto:produtos(*, categoria:categorias(*), unidade:unidades(*))
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

  const getSaidas = async (filtro?: FiltroData) => {
    let query = client
      .from('saidas')
      .select(`
        *,
        produto:produtos(*, categoria:categorias(*), unidade:unidades(*)),
        destino:destinos(*)
      `)
      .order('data', { ascending: false })

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
      .insert(saida)
      .select(`
        *,
        produto:produtos(*, categoria:categorias(*), unidade:unidades(*)),
        destino:destinos(*)
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
      .insert(ajuste)
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

  // ==========================================
  // FATURAMENTOS
  // ==========================================

  const getFaturamentos = async (ano?: number) => {
    let query = client
      .from('faturamentos')
      .select('*')
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
      .upsert(faturamento, {
        onConflict: 'ano,mes'
      })
      .select()
      .single()

    if (error) throw error
    return data as Faturamento
  }

  // ==========================================
  // CONFIGURAÇÕES
  // ==========================================

  const getConfiguracoes = async () => {
    const { data, error } = await client
      .from('configuracoes')
      .select('*')

    if (error) throw error
    return data as Configuracao[]
  }

  const getConfiguracao = async (chave: string) => {
    const { data, error } = await client
      .from('configuracoes')
      .select('*')
      .eq('chave', chave)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as Configuracao | null
  }

  const setConfiguracao = async (chave: string, valor: string) => {
    const { data, error } = await client
      .from('configuracoes')
      .upsert({ chave, valor }, {
        onConflict: 'chave'
      })
      .select()
      .single()

    if (error) throw error
    return data as Configuracao
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
      .select('saldo_atual')
      .eq('produto_id', produtoId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return Number(data?.saldo_atual || 0)
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
    // Destinos
    getDestinos,
    createDestino,
    updateDestino,
    deleteDestino,
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
    // Faturamentos
    getFaturamentos,
    upsertFaturamento,
    // Configurações
    getConfiguracoes,
    getConfiguracao,
    setConfiguracao,
    // Relatórios
    getSaldoEstoque,
    getSaldoProduto
  }
}
