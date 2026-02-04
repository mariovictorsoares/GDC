import type {
  PainelMes,
  CurvaABC,
  GiroEstoque,
  CMV,
  EstoqueMinimo,
  SaldoEstoque,
  ComparativoABC
} from '~/types'

export const useRelatorios = () => {
  const client = useSupabaseClient()

  // ==========================================
  // PAINEL MÊS (COM CMV E GIRO POR PRODUTO)
  // ==========================================

  const getPainelMes = async (ano: number, mes: number): Promise<PainelMes[]> => {
    // Primeiro dia do mês
    const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`
    // Último dia do mês
    const ultimoDia = new Date(ano, mes, 0).getDate()
    const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`

    // Buscar produtos ativos com categoria
    const { data: produtos, error: prodError } = await client
      .from('produtos')
      .select(`
        id,
        nome,
        estoque_inicial,
        preco_inicial,
        categoria:categorias(id, nome),
        unidade:unidades(sigla)
      `)
      .eq('ativo', true)
      .order('nome')

    if (prodError) throw prodError

    // Buscar entradas do mês
    const { data: entradas, error: entError } = await client
      .from('entradas')
      .select('produto_id, quantidade, semana, valor_total')
      .gte('data', dataInicio)
      .lte('data', dataFim)

    if (entError) throw entError

    // Buscar saídas do mês com custo
    const { data: saidas, error: saiError } = await client
      .from('saidas')
      .select('produto_id, quantidade, semana, custo_saida')
      .gte('data', dataInicio)
      .lte('data', dataFim)

    if (saiError) throw saiError

    // Buscar ajustes do mês
    const { data: ajustes, error: ajuError } = await client
      .from('ajustes')
      .select('produto_id, quantidade, semana')
      .gte('data', dataInicio)
      .lte('data', dataFim)

    if (ajuError) throw ajuError

    // Buscar última entrada de cada produto para pegar o custo unitário mais recente
    const { data: ultimasEntradas, error: ultEntError } = await client
      .from('entradas')
      .select('produto_id, quantidade, valor_total, data')
      .order('data', { ascending: false })

    if (ultEntError) throw ultEntError

    // Criar mapa com última entrada por produto (custo unitário = valor_total / quantidade)
    const ultimaEntradaPorProduto = new Map<string, number>()
    ultimasEntradas?.forEach(e => {
      if (!ultimaEntradaPorProduto.has(e.produto_id)) {
        const custoUnitario = Number(e.quantidade) > 0
          ? Number(e.valor_total || 0) / Number(e.quantidade)
          : 0
        ultimaEntradaPorProduto.set(e.produto_id, custoUnitario)
      }
    })

    // Calcular estoque inicial do mês (movimentos até o mês anterior)
    const mesAnterior = mes === 1 ? 12 : mes - 1
    const anoAnterior = mes === 1 ? ano - 1 : ano
    const dataFimAnterior = `${anoAnterior}-${String(mesAnterior).padStart(2, '0')}-${new Date(anoAnterior, mesAnterior, 0).getDate()}`

    const { data: entradasAnt } = await client
      .from('entradas')
      .select('produto_id, quantidade')
      .lte('data', dataFimAnterior)

    const { data: saidasAnt } = await client
      .from('saidas')
      .select('produto_id, quantidade')
      .lte('data', dataFimAnterior)

    const { data: ajustesAnt } = await client
      .from('ajustes')
      .select('produto_id, quantidade')
      .lte('data', dataFimAnterior)

    // Montar mapa de movimentos anteriores
    const movimentosAnteriores = new Map<string, number>()

    produtos?.forEach(p => {
      movimentosAnteriores.set(p.id, p.estoque_inicial || 0)
    })

    entradasAnt?.forEach(e => {
      const atual = movimentosAnteriores.get(e.produto_id) || 0
      movimentosAnteriores.set(e.produto_id, atual + Number(e.quantidade))
    })

    saidasAnt?.forEach(s => {
      const atual = movimentosAnteriores.get(s.produto_id) || 0
      movimentosAnteriores.set(s.produto_id, atual - Number(s.quantidade))
    })

    ajustesAnt?.forEach(a => {
      const atual = movimentosAnteriores.get(a.produto_id) || 0
      movimentosAnteriores.set(a.produto_id, atual + Number(a.quantidade))
    })

    // Montar painel
    const painel: PainelMes[] = produtos?.map(p => {
      const prodEntradas = entradas?.filter(e => e.produto_id === p.id) || []
      const prodSaidas = saidas?.filter(s => s.produto_id === p.id) || []
      const prodAjustes = ajustes?.filter(a => a.produto_id === p.id) || []
      const prodCusto = ultimaEntradaPorProduto.get(p.id) || p.preco_inicial || 0
      const categoriaNome = (p.categoria as any)?.nome || ''

      const sumBySemana = (items: any[], semana: string) =>
        items.filter(i => i.semana === semana).reduce((sum, i) => sum + Number(i.quantidade), 0)

      const estoqueInicial = movimentosAnteriores.get(p.id) || 0

      const saidas_semana1 = sumBySemana(prodSaidas, 'SEMANA 1')
      const saidas_semana2 = sumBySemana(prodSaidas, 'SEMANA 2')
      const saidas_semana3 = sumBySemana(prodSaidas, 'SEMANA 3')
      const saidas_semana4 = sumBySemana(prodSaidas, 'SEMANA 4')
      const saidas_semana5 = sumBySemana(prodSaidas, 'SEMANA 5')
      const saidas_semana6 = sumBySemana(prodSaidas, 'SEMANA 6')
      const total_saidas = saidas_semana1 + saidas_semana2 + saidas_semana3 + saidas_semana4 + saidas_semana5 + saidas_semana6

      const entradas_semana1 = sumBySemana(prodEntradas, 'SEMANA 1')
      const entradas_semana2 = sumBySemana(prodEntradas, 'SEMANA 2')
      const entradas_semana3 = sumBySemana(prodEntradas, 'SEMANA 3')
      const entradas_semana4 = sumBySemana(prodEntradas, 'SEMANA 4')
      const entradas_semana5 = sumBySemana(prodEntradas, 'SEMANA 5')
      const entradas_semana6 = sumBySemana(prodEntradas, 'SEMANA 6')
      const total_entradas = entradas_semana1 + entradas_semana2 + entradas_semana3 + entradas_semana4 + entradas_semana5 + entradas_semana6

      const total_ajustes = prodAjustes.reduce((sum, a) => sum + Number(a.quantidade), 0)

      const estoque_final = estoqueInicial + total_entradas - total_saidas + total_ajustes
      const valor_total = estoque_final * Number(prodCusto)

      // CMV do produto (soma dos custo_saida) - EXCLUINDO MTP
      const cmvProduto = categoriaNome.toUpperCase() === 'MTP'
        ? 0
        : prodSaidas.reduce((sum, s) => sum + Number(s.custo_saida || 0), 0)

      // Giro em dias - Fórmula especial para MTP
      let giro_dias = 0
      let vezes_mes = 0

      if (categoriaNome.toUpperCase() === 'MTP') {
        // Para MTP: (VALOR_ESTOQUE / (QTD_SAIDAS * CUSTO_UNITARIO)) * 30
        const custoSaidasMTP = total_saidas * Number(prodCusto)
        giro_dias = custoSaidasMTP > 0 ? (valor_total / custoSaidasMTP) * 30 : 0
      } else {
        // Para outros: (VALOR_ESTOQUE / CMV) * 30
        giro_dias = cmvProduto > 0 ? (valor_total / cmvProduto) * 30 : 0
      }
      vezes_mes = giro_dias > 0 ? 30 / giro_dias : 0

      return {
        produto_id: p.id,
        categoria: categoriaNome,
        produto: p.nome,
        unidade: (p.unidade as any)?.sigla || '',
        estoque_inicial: estoqueInicial,
        saidas_semana1,
        saidas_semana2,
        saidas_semana3,
        saidas_semana4,
        saidas_semana5,
        saidas_semana6,
        total_saidas,
        entradas_semana1,
        entradas_semana2,
        entradas_semana3,
        entradas_semana4,
        entradas_semana5,
        entradas_semana6,
        total_entradas,
        estoque_final,
        custo: Number(prodCusto),
        valor_total,
        cmv: cmvProduto,
        giro_dias,
        vezes_mes
      }
    }) || []

    return painel.filter(p =>
      p.estoque_inicial !== 0 ||
      p.total_entradas !== 0 ||
      p.total_saidas !== 0 ||
      p.estoque_final !== 0
    )
  }

  // ==========================================
  // CURVA ABC DE ESTOQUE
  // ==========================================

  const getCurvaABCEstoque = async (ano?: number, mes?: number): Promise<CurvaABC[]> => {
    // Se não passou período, usa o mês atual
    const hoje = new Date()
    const anoRef = ano || hoje.getFullYear()
    const mesRef = mes || hoje.getMonth() + 1

    // Data início e fim do mês selecionado
    const dataInicio = `${anoRef}-${String(mesRef).padStart(2, '0')}-01`
    const ultimoDia = new Date(anoRef, mesRef, 0).getDate()
    const dataFim = `${anoRef}-${String(mesRef).padStart(2, '0')}-${ultimoDia}`

    // Buscar produtos ativos com categoria
    const { data: produtos, error: prodError } = await client
      .from('produtos')
      .select(`
        id,
        nome,
        estoque_inicial,
        preco_inicial,
        categoria:categorias(nome)
      `)
      .eq('ativo', true)

    if (prodError) throw prodError
    if (!produtos || produtos.length === 0) return []

    // Buscar saídas do período com custo (para CMV)
    const { data: saidas } = await client
      .from('saidas')
      .select('produto_id, quantidade, custo_saida')
      .gte('data', dataInicio)
      .lte('data', dataFim)

    // Calcular CMV (valor de saída) por produto
    const cmvPorProduto = new Map<string, { quantidade: number, cmv: number }>()

    saidas?.forEach(s => {
      const prodId = s.produto_id
      const atual = cmvPorProduto.get(prodId) || { quantidade: 0, cmv: 0 }
      atual.quantidade += Number(s.quantidade || 0)
      atual.cmv += Number(s.custo_saida || 0)
      cmvPorProduto.set(prodId, atual)
    })

    // Montar lista de produtos com CMV
    const produtosComCMV = produtos
      .map(p => {
        const cmvInfo = cmvPorProduto.get(p.id) || { quantidade: 0, cmv: 0 }
        return {
          produto_id: p.id,
          produto: p.nome,
          categoria: (p.categoria as any)?.nome || '',
          quantidade: cmvInfo.quantidade,
          valor_cmv: cmvInfo.cmv
        }
      })
      .filter(p => p.valor_cmv > 0) // Apenas produtos com saída no período

    if (produtosComCMV.length === 0) return []

    // Calcular valor total do CMV
    const valorTotal = produtosComCMV.reduce((sum, p) => sum + p.valor_cmv, 0)

    if (valorTotal === 0) return []

    // Ordenar por CMV decrescente
    const ordenados = [...produtosComCMV].sort((a, b) => b.valor_cmv - a.valor_cmv)

    // Calcular percentuais e classificar (A=50%, B=30%, C=20%)
    let acumulado = 0
    const resultado: CurvaABC[] = ordenados.map(item => {
      const percentual = (item.valor_cmv / valorTotal) * 100
      acumulado += percentual

      let classe: 'A' | 'B' | 'C'
      if (acumulado <= 50) {
        classe = 'A'
      } else if (acumulado <= 80) { // 50 + 30 = 80
        classe = 'B'
      } else {
        classe = 'C'
      }

      return {
        produto_id: item.produto_id,
        produto: item.produto,
        categoria: item.categoria,
        quantidade: item.quantidade,
        valor: item.valor_cmv,
        percentual_valor: percentual,
        percentual_acumulado: acumulado,
        classe
      }
    })

    return resultado
  }

  // ==========================================
  // CURVA ABC DE CMV (CONSUMO)
  // ==========================================

  const getCurvaABCCMV = async (ano?: number, mes?: number): Promise<CurvaABC[]> => {
    // Definir período - últimos 3 meses se não especificado
    const hoje = new Date()
    const anoRef = ano || hoje.getFullYear()
    const mesRef = mes || hoje.getMonth() + 1

    // Calcular data início (3 meses atrás)
    let mesInicio = mesRef - 2
    let anoInicio = anoRef
    if (mesInicio <= 0) {
      mesInicio += 12
      anoInicio -= 1
    }

    const dataInicio = `${anoInicio}-${String(mesInicio).padStart(2, '0')}-01`
    const ultimoDia = new Date(anoRef, mesRef, 0).getDate()
    const dataFim = `${anoRef}-${String(mesRef).padStart(2, '0')}-${ultimoDia}`

    // Buscar saídas com produto e categoria (EXCLUINDO MTP)
    const { data: saidas, error } = await client
      .from('saidas')
      .select(`
        produto_id,
        quantidade,
        custo_saida,
        produto:produtos(id, nome, categoria:categorias(nome))
      `)
      .gte('data', dataInicio)
      .lte('data', dataFim)

    if (error) throw error

    if (!saidas || saidas.length === 0) return []

    // Agrupar por produto e calcular CMV total (excluindo MTP)
    const cmvPorProduto = new Map<string, { produto: string, categoria: string, quantidade: number, cmv: number }>()

    saidas.forEach(s => {
      const categoriaNome = (s.produto as any)?.categoria?.nome || ''

      // EXCLUIR MTP do ABC de CMV
      if (categoriaNome.toUpperCase() === 'MTP') return

      const prodId = s.produto_id
      const atual = cmvPorProduto.get(prodId) || {
        produto: (s.produto as any)?.nome || '',
        categoria: categoriaNome,
        quantidade: 0,
        cmv: 0
      }
      atual.quantidade += Number(s.quantidade || 0)
      atual.cmv += Number(s.custo_saida || 0)
      cmvPorProduto.set(prodId, atual)
    })

    // Calcular valor total do CMV
    let valorTotal = 0
    cmvPorProduto.forEach(v => {
      valorTotal += v.cmv
    })

    if (valorTotal === 0) return []

    // Converter para array e ordenar por CMV decrescente
    const ordenados = Array.from(cmvPorProduto.entries())
      .map(([id, data]) => ({ produto_id: id, ...data }))
      .sort((a, b) => b.cmv - a.cmv)

    // Calcular percentuais e classificar
    let acumulado = 0
    const resultado: CurvaABC[] = ordenados.map(item => {
      const percentual = (item.cmv / valorTotal) * 100
      acumulado += percentual

      let classe: 'A' | 'B' | 'C'
      if (acumulado <= 80) {
        classe = 'A'
      } else if (acumulado <= 95) {
        classe = 'B'
      } else {
        classe = 'C'
      }

      return {
        produto_id: item.produto_id,
        produto: item.produto,
        categoria: item.categoria,
        quantidade: item.quantidade,
        valor: item.cmv,
        percentual_valor: percentual,
        percentual_acumulado: acumulado,
        classe
      }
    })

    return resultado
  }

  // ==========================================
  // COMPARATIVO ABC (ESTOQUE vs CMV)
  // ==========================================

  const getComparativoABC = async (): Promise<ComparativoABC[]> => {
    const [abcEstoque, abcCMV] = await Promise.all([
      getCurvaABCEstoque(),
      getCurvaABCCMV()
    ])

    // Criar mapa de classificação CMV
    const cmvMap = new Map<string, { classe: 'A' | 'B' | 'C', valor: number }>()
    abcCMV.forEach(item => {
      cmvMap.set(item.produto_id, { classe: item.classe, valor: item.valor })
    })

    // Gerar comparativo
    const resultado: ComparativoABC[] = abcEstoque.map(item => {
      const cmvInfo = cmvMap.get(item.produto_id) || { classe: 'C' as const, valor: 0 }

      let status: ComparativoABC['status'] = 'EQUILIBRADO'
      let recomendacao = ''

      // Analisar cruzamento
      if (item.classe === 'A' && cmvInfo.classe === 'C') {
        status = 'ESTOQUE_EXCESSIVO'
        recomendacao = 'Reduzir estoque - Alto valor parado com baixo giro'
      } else if (item.classe === 'C' && cmvInfo.classe === 'A') {
        status = 'RISCO_RUPTURA'
        recomendacao = 'Aumentar estoque - Produto com alto giro e baixo estoque'
      } else if (item.classe === 'A' && cmvInfo.classe === 'B') {
        status = 'ATENÇÃO'
        recomendacao = 'Avaliar redução de estoque'
      } else if (item.classe === 'B' && cmvInfo.classe === 'A') {
        status = 'ATENÇÃO'
        recomendacao = 'Avaliar aumento de estoque'
      } else {
        status = 'EQUILIBRADO'
        recomendacao = 'Estoque adequado ao consumo'
      }

      return {
        produto_id: item.produto_id,
        produto: item.produto,
        categoria: item.categoria,
        classe_estoque: item.classe,
        classe_cmv: cmvInfo.classe,
        valor_estoque: item.valor,
        valor_cmv: cmvInfo.valor,
        status,
        recomendacao
      }
    })

    // Ordenar por status de risco
    const ordemStatus = { 'RISCO_RUPTURA': 0, 'ESTOQUE_EXCESSIVO': 1, 'ATENÇÃO': 2, 'EQUILIBRADO': 3 }
    return resultado.sort((a, b) => ordemStatus[a.status] - ordemStatus[b.status])
  }

  // Manter compatibilidade com função antiga
  const getCurvaABC = async (tipo: 'estoque' | 'cmv' = 'estoque', ano?: number, mes?: number): Promise<CurvaABC[]> => {
    if (tipo === 'cmv') {
      return getCurvaABCCMV(ano, mes)
    }
    return getCurvaABCEstoque()
  }

  // ==========================================
  // GIRO DE ESTOQUE
  // ==========================================

  // Função auxiliar para calcular valor do estoque em uma data específica (EXCLUINDO MTP)
  const calcularValorEstoqueEmData = async (dataLimite: string, excluirMTP: boolean = false): Promise<number> => {
    // Buscar produtos ativos com categoria
    const { data: produtos } = await client
      .from('produtos')
      .select('id, estoque_inicial, preco_inicial, categoria:categorias(nome)')
      .eq('ativo', true)

    if (!produtos || produtos.length === 0) return 0

    // Buscar entradas até a data
    const { data: entradas } = await client
      .from('entradas')
      .select('produto_id, quantidade, valor_total')
      .lte('data', dataLimite)

    // Buscar saídas até a data
    const { data: saidas } = await client
      .from('saidas')
      .select('produto_id, quantidade')
      .lte('data', dataLimite)

    // Buscar ajustes até a data
    const { data: ajustes } = await client
      .from('ajustes')
      .select('produto_id, quantidade')
      .lte('data', dataLimite)

    let valorTotal = 0

    for (const produto of produtos) {
      const categoriaNome = (produto.categoria as any)?.nome || ''

      // Se excluirMTP e produto é MTP, pular
      if (excluirMTP && categoriaNome.toUpperCase() === 'MTP') continue

      // Estoque inicial
      let quantidade = Number(produto.estoque_inicial || 0)
      let valorEntradas = Number(produto.estoque_inicial || 0) * Number(produto.preco_inicial || 0)

      // Somar entradas
      const prodEntradas = entradas?.filter(e => e.produto_id === produto.id) || []
      prodEntradas.forEach(e => {
        quantidade += Number(e.quantidade)
        valorEntradas += Number(e.valor_total)
      })

      // Subtrair saídas
      const prodSaidas = saidas?.filter(s => s.produto_id === produto.id) || []
      prodSaidas.forEach(s => {
        quantidade -= Number(s.quantidade)
      })

      // Ajustes
      const prodAjustes = ajustes?.filter(a => a.produto_id === produto.id) || []
      prodAjustes.forEach(a => {
        quantidade += Number(a.quantidade)
      })

      // Calcular custo médio
      const qtdEntradas = Number(produto.estoque_inicial || 0) +
        prodEntradas.reduce((sum, e) => sum + Number(e.quantidade), 0)
      const custoMedio = qtdEntradas > 0 ? valorEntradas / qtdEntradas : 0

      // Valor do estoque = quantidade * custo médio
      valorTotal += Math.max(0, quantidade) * custoMedio
    }

    return valorTotal
  }

  const getGiroEstoque = async (ano: number): Promise<GiroEstoque[]> => {
    const meses = [
      'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
      'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ]

    const resultado: GiroEstoque[] = []

    for (let mes = 1; mes <= 12; mes++) {
      const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`
      const ultimoDia = new Date(ano, mes, 0).getDate()
      const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`

      // Calcular data do último dia do mês anterior
      const mesAnterior = mes === 1 ? 12 : mes - 1
      const anoAnterior = mes === 1 ? ano - 1 : ano
      const ultimoDiaAnterior = new Date(anoAnterior, mesAnterior, 0).getDate()
      const dataFimAnterior = `${anoAnterior}-${String(mesAnterior).padStart(2, '0')}-${ultimoDiaAnterior}`

      // CMV do mês (soma das saídas valoradas) - EXCLUINDO MTP
      const { data: saidas } = await client
        .from('saidas')
        .select(`
          custo_saida,
          produto:produtos(categoria:categorias(nome))
        `)
        .gte('data', dataInicio)
        .lte('data', dataFim)

      // Filtrar saídas excluindo MTP
      const cmv = saidas?.reduce((sum, s) => {
        const categoriaNome = (s.produto as any)?.categoria?.nome || ''
        if (categoriaNome.toUpperCase() === 'MTP') return sum
        return sum + Number(s.custo_saida || 0)
      }, 0) || 0

      // Estoque inicial do mês (valor do estoque no final do mês anterior)
      const estoque_inicial = await calcularValorEstoqueEmData(dataFimAnterior)

      // Estoque final do mês (valor do estoque no final do mês atual)
      const estoque_final = await calcularValorEstoqueEmData(dataFim)

      // Estoque médio = (estoque inicial + estoque final) / 2
      const estoque_medio = (estoque_inicial + estoque_final) / 2

      // Estoque real = estoque final (para compatibilidade)
      const estoque_real = estoque_final

      // Cálculos de giro
      const giro_dias_real = cmv > 0 ? (estoque_real / cmv) * 30 : 0
      const vezes_mes_real = estoque_real > 0 ? cmv / estoque_real : 0
      const giro_dias_medio = cmv > 0 ? (estoque_medio / cmv) * 30 : 0
      const vezes_mes_medio = estoque_medio > 0 ? cmv / estoque_medio : 0

      resultado.push({
        ano,
        mes: meses[mes - 1],
        estoque_real,
        estoque_medio,
        cmv,
        giro_dias_real,
        vezes_mes_real,
        giro_dias_medio,
        vezes_mes_medio
      })
    }

    return resultado
  }

  // ==========================================
  // CMV (EXCLUINDO MTP)
  // ==========================================

  const getCMV = async (ano: number): Promise<CMV[]> => {
    const resultado: CMV[] = []

    // Buscar faturamentos do ano
    const { data: faturamentos } = await client
      .from('faturamentos')
      .select('*')
      .eq('ano', ano)

    for (let mes = 1; mes <= 12; mes++) {
      const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`
      const ultimoDia = new Date(ano, mes, 0).getDate()
      const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`

      // Calcular data do último dia do mês anterior
      const mesAnterior = mes === 1 ? 12 : mes - 1
      const anoAnterior = mes === 1 ? ano - 1 : ano
      const ultimoDiaAnterior = new Date(anoAnterior, mesAnterior, 0).getDate()
      const dataFimAnterior = `${anoAnterior}-${String(mesAnterior).padStart(2, '0')}-${ultimoDiaAnterior}`

      // Compras do mês (EXCLUINDO MTP)
      const { data: entradas } = await client
        .from('entradas')
        .select(`
          valor_total,
          produto:produtos(categoria:categorias(nome))
        `)
        .gte('data', dataInicio)
        .lte('data', dataFim)

      // Filtrar entradas excluindo MTP
      const compras = entradas?.reduce((sum, e) => {
        const categoriaNome = (e.produto as any)?.categoria?.nome || ''
        if (categoriaNome.toUpperCase() === 'MTP') return sum
        return sum + Number(e.valor_total || 0)
      }, 0) || 0

      // Estoque inicial (valor do estoque no final do mês anterior) - EXCLUINDO MTP
      const estoque_inicial = await calcularValorEstoqueEmData(dataFimAnterior, true)

      // Estoque final (valor do estoque no final do mês atual) - EXCLUINDO MTP
      const estoque_final = await calcularValorEstoqueEmData(dataFim, true)

      // CMV = Estoque Inicial + Compras - Estoque Final (EXCLUINDO MTP)
      const cmv = estoque_inicial + compras - estoque_final

      const faturamento = faturamentos?.find(f => f.mes === mes)?.valor || 0
      const percentual_cmv = faturamento > 0 ? (cmv / Number(faturamento)) * 100 : 0

      resultado.push({
        ano,
        mes,
        estoque_inicial,
        compras,
        estoque_final,
        cmv: Math.max(0, cmv), // CMV não pode ser negativo
        faturamento: Number(faturamento),
        percentual_cmv
      })
    }

    return resultado
  }

  // ==========================================
  // ESTOQUE MÍNIMO (COM DIAS ATÉ RUPTURA E DATA PONTO DE PEDIDO)
  // ==========================================

  const getEstoqueMinimo = async (): Promise<EstoqueMinimo[]> => {
    const { data: produtos, error } = await client
      .from('produtos')
      .select(`
        id,
        nome,
        estoque_minimo,
        margem_seguranca,
        tempo_reposicao,
        categoria:categorias(nome),
        unidade:unidades(sigla)
      `)
      .eq('ativo', true)

    if (error) throw error

    // Buscar saldos atuais
    const { data: saldos } = await client
      .from('v_saldo_estoque')
      .select('produto_id, saldo_atual')

    // Calcular consumo médio semanal (últimas 4 semanas)
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - 28)

    const { data: saidas } = await client
      .from('saidas')
      .select('produto_id, quantidade')
      .gte('data', dataInicio.toISOString().split('T')[0])

    const hoje = new Date()

    const resultado: EstoqueMinimo[] = produtos?.map(p => {
      const saldo = saldos?.find(s => s.produto_id === p.id)
      const quantidade_estoque = Number(saldo?.saldo_atual || 0)

      const prodSaidas = saidas?.filter(s => s.produto_id === p.id) || []
      const totalSaidas = prodSaidas.reduce((sum, s) => sum + Number(s.quantidade), 0)
      const consumo_medio_semanal = totalSaidas / 4
      const consumo_medio_diario = consumo_medio_semanal / 7

      const estoque_minimo_base = Number(p.estoque_minimo || 0)
      const margem = Number(p.margem_seguranca || 0) / 100
      const tempo_reposicao = Number(p.tempo_reposicao || 0)

      // Estoque mínimo com margem de segurança
      const estoque_minimo_com_margem = estoque_minimo_base * (1 + margem)

      // Verificar se precisa repor
      const repor_estoque = quantidade_estoque <= estoque_minimo_com_margem

      // DIAS_ATE_RUPTURA = (estoque_atual / consumo_diario) - tempo_reposicao
      const dias_ate_ruptura = consumo_medio_diario > 0
        ? Math.floor((quantidade_estoque / consumo_medio_diario) - tempo_reposicao)
        : 999

      // DATA_PONTO_PEDIDO = HOJE() + DIAS_ATE_RUPTURA
      const dataPontoPedido = new Date(hoje)
      dataPontoPedido.setDate(dataPontoPedido.getDate() + Math.max(0, dias_ate_ruptura))
      const data_ponto_pedido = dataPontoPedido.toISOString().split('T')[0]

      // STATUS: ATRASADO se data_ponto_pedido < HOJE, EM TEMPO se próximo, OK se ok
      let status_prazo: 'ATRASADO' | 'EM TEMPO' | 'OK' = 'OK'
      if (dias_ate_ruptura < 0) {
        status_prazo = 'ATRASADO'
      } else if (dias_ate_ruptura <= tempo_reposicao) {
        status_prazo = 'EM TEMPO'
      }

      // Sugestão de pedido: SE(REPOR="SIM", (ESTOQUE_MINIMO - ESTOQUE_ATUAL) + ESTOQUE_MINIMO, 0)
      const sugestao_pedido = repor_estoque
        ? Math.max(0, (estoque_minimo_com_margem - quantidade_estoque) + estoque_minimo_com_margem)
        : 0

      return {
        produto_id: p.id,
        categoria: (p.categoria as any)?.nome || '',
        nome: p.nome,
        quantidade_estoque,
        unidade: (p.unidade as any)?.sigla || '',
        estoque_minimo: estoque_minimo_com_margem,
        estoque_minimo_base,
        margem_seguranca: Number(p.margem_seguranca || 0),
        consumo_medio_semanal,
        consumo_medio_diario,
        tempo_reposicao,
        repor_estoque,
        dias_ate_ruptura,
        data_ponto_pedido,
        status_prazo,
        dentro_prazo: status_prazo !== 'ATRASADO',
        sugestao_pedido
      }
    }) || []

    return resultado.filter(r => r.estoque_minimo_base > 0 || r.quantidade_estoque > 0)
  }

  // ==========================================
  // VARIAÇÃO DE CUSTO
  // ==========================================

  const getVariacaoCusto = async (ano: number) => {
    const { data: custos, error } = await client
      .from('custos_mensais')
      .select(`
        *,
        produto:produtos(id, nome, categoria:categorias(nome))
      `)
      .eq('ano', ano)
      .order('mes')

    if (error) throw error

    // Agrupar por produto
    const produtosMap = new Map<string, any>()

    custos?.forEach(c => {
      const prodId = c.produto_id
      if (!produtosMap.has(prodId)) {
        produtosMap.set(prodId, {
          produto_id: prodId,
          produto: (c.produto as any)?.nome || '',
          categoria: (c.produto as any)?.categoria?.nome || '',
          custos: Array(12).fill(0),
          variacoes: Array(12).fill(null)
        })
      }
      const prod = produtosMap.get(prodId)
      prod.custos[c.mes - 1] = Number(c.custo)
    })

    // Calcular variações
    produtosMap.forEach(prod => {
      for (let i = 1; i < 12; i++) {
        if (prod.custos[i] > 0 && prod.custos[i - 1] > 0) {
          prod.variacoes[i] = ((prod.custos[i] - prod.custos[i - 1]) / prod.custos[i - 1]) * 100
        }
      }
    })

    return Array.from(produtosMap.values())
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  const getDashboardResumo = async () => {
    // Total de produtos ativos
    const { count: totalProdutos } = await client
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)

    // Valor total do estoque
    const { data: saldos } = await client
      .from('v_saldo_estoque')
      .select('valor_estoque')

    const valorEstoque = saldos?.reduce((sum, s) => sum + Number(s.valor_estoque || 0), 0) || 0

    // Produtos abaixo do estoque mínimo
    const estoqueMinimo = await getEstoqueMinimo()
    const produtosAbaixoMinimo = estoqueMinimo.filter(e => e.repor_estoque).length

    // Entradas do mês atual
    const hoje = new Date()
    const primeiroDia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`

    const { data: entradasMes } = await client
      .from('entradas')
      .select('valor_total')
      .gte('data', primeiroDia)

    const totalEntradasMes = entradasMes?.reduce((sum, e) => sum + Number(e.valor_total || 0), 0) || 0

    // Saídas do mês atual
    const { data: saidasMes } = await client
      .from('saidas')
      .select('custo_saida')
      .gte('data', primeiroDia)

    const totalSaidasMes = saidasMes?.reduce((sum, s) => sum + Number(s.custo_saida || 0), 0) || 0

    return {
      totalProdutos: totalProdutos || 0,
      valorEstoque,
      produtosAbaixoMinimo,
      totalEntradasMes,
      totalSaidasMes
    }
  }

  return {
    getPainelMes,
    getCurvaABC,
    getCurvaABCEstoque,
    getCurvaABCCMV,
    getComparativoABC,
    getGiroEstoque,
    getCMV,
    getEstoqueMinimo,
    getVariacaoCusto,
    getDashboardResumo
  }
}
