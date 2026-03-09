import type {
  PainelMes,
  SemanaInfo,
  DiaInfo,
  PainelMesApoio,
  CurvaABC,
  GiroEstoque,
  CMV,
  EstoqueMinimo,
  SaldoEstoque,
  ComparativoABC,
  CmcSemanalResumo,
  CmcSemanalGrupo,
  CmcSemanalSubgrupo,
  FaturamentoSemanal,
  GestaoInventario
} from '~/types'

export const useRelatorios = () => {
  const client = useSupabaseClient()
  const { empresaId } = useEmpresa()

  // Helper para aplicar filtro empresa_id em queries
  // NOTA: sempre exige empresaId — chamadores devem verificar antes de invocar
  const comEmpresa = (query: any) => {
    return query.eq('empresa_id', empresaId.value)
  }

  // ==========================================
  // PAINEL MÊS (COM CMV E GIRO POR PRODUTO)
  // ==========================================

  /**
   * Calcula as semanas Seg-Dom que cobrem um mês.
   * Sempre Seg-Dom completas, podendo cruzar para o mês anterior/próximo.
   * Cada semana pertence ao mês que contém a maioria dos seus dias (4+),
   * evitando que a mesma semana apareça em dois meses.
   * Ex: Fev/2026 (dia 1 = dom) → S1 (26/01 - 01/02) fica em Janeiro (6 dias de jan, 1 de fev)
   */
  const calcularSemanasDoMes = (_ano: number, _mes: number): SemanaInfo[] => {
    // Garantir que são números (USelect pode enviar strings)
    const ano = Number(_ano)
    const mes = Number(_mes)

    const formatDiaMes = (d: Date) =>
      `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    const formatISO = (d: Date) => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    const primeiroDia = new Date(ano, mes - 1, 1)
    const ultimoDia = new Date(ano, mes, 0)

    // Encontrar a segunda-feira da semana que contém o dia 1
    const diaSem1 = primeiroDia.getDay() // 0=dom, 1=seg...
    const offsetParaSeg = diaSem1 === 0 ? 6 : diaSem1 - 1
    const primeiraSegunda = new Date(primeiroDia)
    primeiraSegunda.setDate(primeiroDia.getDate() - offsetParaSeg)

    // Encontrar o domingo da semana que contém o último dia do mês
    const diaSemUlt = ultimoDia.getDay()
    const offsetParaDom = diaSemUlt === 0 ? 0 : 7 - diaSemUlt
    const ultimoDomingo = new Date(ultimoDia)
    ultimoDomingo.setDate(ultimoDia.getDate() + offsetParaDom)

    // Contar quantos dias de uma semana (seg-dom) pertencem ao mês
    const diasNoMes = (seg: Date, dom: Date): number => {
      let count = 0
      const d = new Date(seg)
      while (d <= dom) {
        if (d.getMonth() + 1 === mes && d.getFullYear() === ano) count++
        d.setDate(d.getDate() + 1)
      }
      return count
    }

    const semanas: SemanaInfo[] = []
    let semanaNum = 1
    const seg = new Date(primeiraSegunda)

    while (seg <= ultimoDomingo) {
      const dom = new Date(seg)
      dom.setDate(seg.getDate() + 6)

      // Só incluir a semana se a maioria dos dias (4+) pertence a este mês
      if (diasNoMes(seg, dom) >= 4) {
        semanas.push({
          label: `S${semanaNum}`,
          tooltip: `${formatDiaMes(seg)} - ${formatDiaMes(dom)}`,
          inicio: formatISO(seg),
          fim: formatISO(dom)
        })
        semanaNum++
      }

      seg.setDate(seg.getDate() + 7)
    }

    return semanas
  }

  const getPainelMes = async (ano: number, mes: number, tipoSaida: 'todos' | 'transferencia' | 'definitiva' | 'beneficiamento' = 'todos'): Promise<{ semanas: SemanaInfo[], itens: PainelMes[] }> => {
    if (!empresaId.value) return { semanas: [], itens: [] }

    // Calcular semanas Seg-Dom reais do mês
    const semanasDoMes = calcularSemanasDoMes(ano, mes)
    const qtdSemanas = semanasDoMes.length

    if (qtdSemanas === 0) return { semanas: [], itens: [] }

    // Range real das semanas (pode cruzar meses)
    const dataInicio = semanasDoMes[0].inicio
    const dataFim = semanasDoMes[semanasDoMes.length - 1].fim
    // Datas do mês em si (para cálculo de estoque inicial)
    const dataInicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`
    const ultimoDia = new Date(ano, mes, 0).getDate()
    const dataFimMes = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`

    // Buscar produtos ativos com categoria
    const { data: produtos, error: prodError } = await comEmpresa(client
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
      .order('nome'))

    if (prodError) throw prodError

    // Buscar entradas do range das semanas (pode incluir dias fora do mês)
    const { data: entradas, error: entError } = await comEmpresa(client
      .from('entradas')
      .select('produto_id, quantidade, data, valor_total')
      .gte('data', dataInicio)
      .lte('data', dataFim))

    if (entError) throw entError

    // Buscar saídas do range das semanas com custo, tipo e empresa_destino_id (com data)
    const { data: saidas, error: saiError } = await comEmpresa(client
      .from('saidas')
      .select('produto_id, quantidade, data, custo_saida, tipo, empresa_destino_id')
      .gte('data', dataInicio)
      .lte('data', dataFim))

    if (saiError) throw saiError

    // Buscar ajustes do range das semanas (com data)
    const { data: ajustes, error: ajuError } = await comEmpresa(client
      .from('ajustes')
      .select('produto_id, quantidade, data')
      .gte('data', dataInicio)
      .lte('data', dataFim))

    if (ajuError) throw ajuError

    // Buscar última entrada de cada produto para pegar o custo unitário mais recente
    const { data: ultimasEntradas, error: ultEntError } = await comEmpresa(client
      .from('entradas')
      .select('produto_id, quantidade, valor_total, data')
      .order('data', { ascending: false }))

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

    // Calcular estoque inicial do mês (movimentos até o dia anterior ao 1º dia do mês)
    const mesAnterior = mes === 1 ? 12 : mes - 1
    const anoAnterior = mes === 1 ? ano - 1 : ano
    const dataFimAnterior = `${anoAnterior}-${String(mesAnterior).padStart(2, '0')}-${new Date(anoAnterior, mesAnterior, 0).getDate()}`

    const { data: entradasAnt } = await comEmpresa(client
      .from('entradas')
      .select('produto_id, quantidade')
      .lte('data', dataFimAnterior))

    const { data: saidasAnt } = await comEmpresa(client
      .from('saidas')
      .select('produto_id, quantidade, tipo')
      .lte('data', dataFimAnterior))

    const { data: ajustesAnt } = await comEmpresa(client
      .from('ajustes')
      .select('produto_id, quantidade')
      .lte('data', dataFimAnterior))

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

    // Helper: encontrar índice da semana pela data
    const getIndiceSemana = (data: string): number => {
      return semanasDoMes.findIndex(s => data >= s.inicio && data <= s.fim)
    }

    // Montar painel
    const painel: PainelMes[] = produtos?.map(p => {
      const prodEntradas = entradas?.filter(e => e.produto_id === p.id) || []
      const prodSaidasAll = saidas?.filter(s => s.produto_id === p.id) || []
      const prodAjustes = ajustes?.filter(a => a.produto_id === p.id) || []

      // Breakdown de saídas por tipo (sempre calculado)
      const saidas_definitiva = prodSaidasAll
        .filter(s => s.tipo === 'definitiva')
        .reduce((sum, s) => sum + Number(s.quantidade), 0)
      const saidas_transf_loja = prodSaidasAll
        .filter(s => s.tipo === 'transferencia' && s.empresa_destino_id)
        .reduce((sum, s) => sum + Number(s.quantidade), 0)
      const saidas_transf_apoio = prodSaidasAll
        .filter(s => s.tipo === 'transferencia' && !s.empresa_destino_id)
        .reduce((sum, s) => sum + Number(s.quantidade), 0)
      const saidas_beneficiamento = prodSaidasAll
        .filter(s => s.tipo === 'beneficiamento')
        .reduce((sum, s) => sum + Number(s.quantidade), 0)
      const prodCusto = ultimaEntradaPorProduto.get(p.id) || p.preco_inicial || 0
      const categoriaNome = (p.categoria as any)?.nome || ''

      const estoqueInicial = movimentosAnteriores.get(p.id) || 0

      // Agrupar por semana real usando a data — TODAS as saídas (incl. beneficiamento)
      const entradas_por_semana = new Array(qtdSemanas).fill(0)
      prodEntradas.forEach(e => {
        const idx = getIndiceSemana(e.data)
        if (idx >= 0) entradas_por_semana[idx] += Number(e.quantidade)
      })

      const saidas_por_semana = new Array(qtdSemanas).fill(0)
      const saidas_definitiva_por_semana = new Array(qtdSemanas).fill(0)
      const saidas_transf_loja_por_semana = new Array(qtdSemanas).fill(0)
      const saidas_transf_apoio_por_semana = new Array(qtdSemanas).fill(0)
      const saidas_beneficiamento_por_semana = new Array(qtdSemanas).fill(0)

      prodSaidasAll.forEach(s => {
        const idx = getIndiceSemana(s.data)
        if (idx < 0) return
        const qty = Number(s.quantidade)
        saidas_por_semana[idx] += qty
        if (s.tipo === 'definitiva') saidas_definitiva_por_semana[idx] += qty
        else if (s.tipo === 'transferencia' && s.empresa_destino_id) saidas_transf_loja_por_semana[idx] += qty
        else if (s.tipo === 'transferencia' && !s.empresa_destino_id) saidas_transf_apoio_por_semana[idx] += qty
        else if (s.tipo === 'beneficiamento') saidas_beneficiamento_por_semana[idx] += qty
      })

      const total_entradas = entradas_por_semana.reduce((sum, v) => sum + v, 0)
      const total_saidas = saidas_por_semana.reduce((sum, v) => sum + v, 0)
      const total_ajustes = prodAjustes.reduce((sum, a) => sum + Number(a.quantidade), 0)

      // E.F. = E.I. + Entradas - Saídas + Ajustes (tudo consistente)
      const estoque_final = estoqueInicial + total_entradas - total_saidas + total_ajustes
      const valor_total = estoque_final * Number(prodCusto)

      // CMV: saídas sem beneficiamento × custo unitário (MTP excluído)
      const saidas_cmv = total_saidas - saidas_beneficiamento
      const cmvProduto = categoriaNome.toUpperCase() === 'MTP'
        ? 0
        : saidas_cmv * Number(prodCusto)

      // Giro em dias
      let giro_dias = 0
      let vezes_mes = 0

      if (categoriaNome.toUpperCase() === 'MTP') {
        const custoSaidasMTP = saidas_cmv * Number(prodCusto)
        giro_dias = custoSaidasMTP > 0 ? (valor_total / custoSaidasMTP) * 30 : 0
      } else {
        giro_dias = cmvProduto > 0 ? (valor_total / cmvProduto) * 30 : 0
      }
      vezes_mes = giro_dias > 0 ? 30 / giro_dias : 0

      return {
        produto_id: p.id,
        categoria: categoriaNome,
        produto: p.nome,
        unidade: (p.unidade as any)?.sigla || '',
        estoque_inicial: estoqueInicial,
        entradas_por_semana,
        saidas_por_semana,
        saidas_definitiva_por_semana,
        saidas_transf_loja_por_semana,
        saidas_transf_apoio_por_semana,
        saidas_beneficiamento_por_semana,
        total_saidas,
        total_entradas,
        estoque_final,
        custo: Number(prodCusto),
        valor_total,
        cmv: cmvProduto,
        giro_dias,
        vezes_mes,
        saidas_definitiva,
        saidas_transf_loja,
        saidas_transf_apoio,
        saidas_beneficiamento
      }
    }) || []

    const itens = painel

    return { semanas: semanasDoMes, itens }
  }

  // ==========================================
  // CURVA ABC DE ESTOQUE
  // ==========================================

  const getCurvaABCEstoque = async (ano?: number, mes?: number): Promise<CurvaABC[]> => {
    if (!empresaId.value) return [] as CurvaABC[]
    // Se não passou período, usa o mês atual
    const hoje = new Date()
    const anoRef = ano || hoje.getFullYear()
    const mesRef = mes || hoje.getMonth() + 1

    // Data início e fim do mês selecionado
    const dataInicio = `${anoRef}-${String(mesRef).padStart(2, '0')}-01`
    const ultimoDia = new Date(anoRef, mesRef, 0).getDate()
    const dataFim = `${anoRef}-${String(mesRef).padStart(2, '0')}-${ultimoDia}`

    // Buscar produtos ativos com categoria
    const { data: produtos, error: prodError } = await comEmpresa(client
      .from('produtos')
      .select(`
        id,
        nome,
        estoque_inicial,
        preco_inicial,
        categoria:categorias(nome)
      `)
      .eq('ativo', true))

    if (prodError) throw prodError
    if (!produtos || produtos.length === 0) return []

    // Buscar saídas definitivas do período com custo (para CMV)
    const { data: saidas } = await comEmpresa(client
      .from('saidas')
      .select('produto_id, quantidade, custo_saida')
      .eq('tipo', 'definitiva')
      .gte('data', dataInicio)
      .lte('data', dataFim))

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
  // CURVA ABC DE CONSUMO
  // ==========================================

  const getCurvaABCCMV = async (ano?: number, mes?: number): Promise<CurvaABC[]> => {
    if (!empresaId.value) return [] as CurvaABC[]
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

    // Buscar saídas definitivas com produto e categoria (EXCLUINDO MTP)
    const { data: saidas, error } = await comEmpresa(client
      .from('saidas')
      .select(`
        produto_id,
        quantidade,
        custo_saida,
        produto:produtos(id, nome, categoria:categorias(nome))
      `)
      .eq('tipo', 'definitiva')
      .gte('data', dataInicio)
      .lte('data', dataFim))

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
      if (acumulado <= 50) {
        classe = 'A'
      } else if (acumulado <= 80) {
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
  // COMPARATIVO ABC (ESTOQUE vs CONSUMO)
  // ==========================================

  const getComparativoABC = async (ano?: number, mes?: number): Promise<ComparativoABC[]> => {
    if (!empresaId.value) return [] as ComparativoABC[]

    const hoje = new Date()
    const anoRef = ano || hoje.getFullYear()
    const mesRef = mes || hoje.getMonth() + 1

    const dataInicio = `${anoRef}-${String(mesRef).padStart(2, '0')}-01`
    const ultimoDia = new Date(anoRef, mesRef, 0).getDate()
    const dataFim = `${anoRef}-${String(mesRef).padStart(2, '0')}-${ultimoDia}`

    // Buscar todos os produtos ativos
    const { data: produtos, error: prodError } = await comEmpresa(client
      .from('produtos')
      .select('id, nome, estoque_inicial, preco_inicial')
      .eq('ativo', true)
      .order('nome'))

    if (prodError) throw prodError
    if (!produtos || produtos.length === 0) return []

    // Buscar entradas, saídas e ajustes até o fim do mês (para calcular estoque final)
    const [{ data: entradas }, { data: saidas }, { data: ajustes }, { data: todasEntradas }] = await Promise.all([
      comEmpresa(client.from('entradas').select('produto_id, quantidade').lte('data', dataFim)),
      comEmpresa(client.from('saidas').select('produto_id, quantidade, custo_saida, data, tipo').lte('data', dataFim)),
      comEmpresa(client.from('ajustes').select('produto_id, quantidade').lte('data', dataFim)),
      comEmpresa(client.from('entradas').select('produto_id, quantidade, valor_total, data').order('data', { ascending: false }))
    ])

    // Mapa custo última entrada por produto
    const ultimaEntradaPorProduto = new Map<string, number>()
    todasEntradas?.forEach(e => {
      if (!ultimaEntradaPorProduto.has(e.produto_id)) {
        const custo = Number(e.quantidade) > 0 ? Number(e.valor_total || 0) / Number(e.quantidade) : 0
        ultimaEntradaPorProduto.set(e.produto_id, custo)
      }
    })

    // Calcular estoque final e consumo do mês para cada produto
    const produtosDados = produtos.map(p => {
      // Estoque final = estoque_inicial + entradas - saídas + ajustes (até fim do mês)
      const estoqueInicial = Number(p.estoque_inicial || 0)
      let efQtd = estoqueInicial
      entradas?.filter(e => e.produto_id === p.id).forEach(e => { efQtd += Number(e.quantidade) })
      saidas?.filter(s => s.produto_id === p.id).forEach(s => { efQtd -= Number(s.quantidade) })
      ajustes?.filter(a => a.produto_id === p.id).forEach(a => { efQtd += Number(a.quantidade) })

      const custoUnitario = ultimaEntradaPorProduto.get(p.id) || Number(p.preco_inicial || 0)
      const valorEstoque = Math.max(0, efQtd) * custoUnitario

      // Consumo = todas as saídas do mês selecionado (todos os tipos)
      const saidasNoMes = saidas?.filter(s => s.produto_id === p.id && s.data >= dataInicio && s.data <= dataFim) || []
      const valorConsumo = saidasNoMes.reduce((sum, s) => sum + Number(s.custo_saida || 0), 0)

      return {
        produto_id: p.id,
        produto: p.nome,
        valorEstoque,
        valorConsumo
      }
    })

    // --- Classificação ABC Estoque (por valor de estoque) ---
    const produtosComEstoque = produtosDados.filter(p => p.valorEstoque > 0)
    const totalEstoque = produtosComEstoque.reduce((sum, p) => sum + p.valorEstoque, 0)
    const ordenadosEstoque = [...produtosComEstoque].sort((a, b) => b.valorEstoque - a.valorEstoque)

    const classeEstoqueMap = new Map<string, 'A' | 'B' | 'C'>()
    let acumEstoque = 0
    ordenadosEstoque.forEach(item => {
      acumEstoque += totalEstoque > 0 ? (item.valorEstoque / totalEstoque) * 100 : 0
      classeEstoqueMap.set(item.produto_id, acumEstoque <= 50 ? 'A' : acumEstoque <= 80 ? 'B' : 'C')
    })

    // --- Classificação ABC Consumo (por valor de consumo do mês) ---
    const produtosComConsumo = produtosDados.filter(p => p.valorConsumo > 0)
    const totalConsumo = produtosComConsumo.reduce((sum, p) => sum + p.valorConsumo, 0)
    const ordenadosConsumo = [...produtosComConsumo].sort((a, b) => b.valorConsumo - a.valorConsumo)

    const classeConsumoMap = new Map<string, 'A' | 'B' | 'C'>()
    let acumConsumo = 0
    ordenadosConsumo.forEach(item => {
      acumConsumo += totalConsumo > 0 ? (item.valorConsumo / totalConsumo) * 100 : 0
      classeConsumoMap.set(item.produto_id, acumConsumo <= 50 ? 'A' : acumConsumo <= 80 ? 'B' : 'C')
    })

    // --- Montar resultado com todos os produtos ---
    const resultado: ComparativoABC[] = produtosDados.map(item => {
      const classeEst = classeEstoqueMap.get(item.produto_id) || 'C'
      const classeCons = classeConsumoMap.get(item.produto_id) || 'C'

      let status: ComparativoABC['status'] = 'EQUILIBRADO'
      let recomendacao = ''

      if (classeEst === classeCons) {
        // Mesma curva = equilibrado
        recomendacao = 'Estoque adequado ao consumo'
      } else if (classeEst === 'A' && classeCons === 'C') {
        status = 'ESTOQUE_EXCESSIVO'
        recomendacao = 'Reduzir estoque - Alto valor parado com baixo giro'
      } else if (classeEst === 'C' && classeCons === 'A') {
        status = 'RISCO_RUPTURA'
        recomendacao = 'Aumentar estoque - Produto com alto giro e baixo estoque'
      } else {
        // Diferença de 1 classe (A/B, B/A, B/C, C/B)
        status = 'ATENÇÃO'
        recomendacao = classeEst < classeCons ? 'Avaliar redução de estoque' : 'Avaliar aumento de estoque'
      }

      return {
        produto_id: item.produto_id,
        produto: item.produto,
        categoria: '',
        classe_estoque: classeEst,
        classe_cmv: classeCons,
        valor_estoque: item.valorEstoque,
        valor_cmv: item.valorConsumo,
        status,
        recomendacao
      }
    })

    const ordemStatus = { 'RISCO_RUPTURA': 0, 'ESTOQUE_EXCESSIVO': 1, 'ATENÇÃO': 2, 'EQUILIBRADO': 3 }
    return resultado.sort((a, b) => ordemStatus[a.status] - ordemStatus[b.status])
  }

  // Manter compatibilidade com função antiga
  const getCurvaABC = async (tipo: 'estoque' | 'cmv' = 'estoque', ano?: number, mes?: number): Promise<CurvaABC[]> => {
    if (!empresaId.value) return [] as CurvaABC[]
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
    if (!empresaId.value) return 0
    // Buscar produtos ativos com categoria
    const { data: produtos } = await comEmpresa(client
      .from('produtos')
      .select('id, estoque_inicial, preco_inicial, categoria:categorias(nome)')
      .eq('ativo', true))

    if (!produtos || produtos.length === 0) return 0

    // Buscar entradas até a data
    const { data: entradas } = await comEmpresa(client
      .from('entradas')
      .select('produto_id, quantidade, valor_total')
      .lte('data', dataLimite))

    // Buscar saídas que reduzem estoque (definitiva + beneficiamento) até a data
    const { data: saidas } = await comEmpresa(client
      .from('saidas')
      .select('produto_id, quantidade')
      .neq('tipo', 'transferencia')
      .lte('data', dataLimite))

    // Buscar ajustes até a data
    const { data: ajustes } = await comEmpresa(client
      .from('ajustes')
      .select('produto_id, quantidade')
      .lte('data', dataLimite))

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
    if (!empresaId.value) return [] as GiroEstoque[]
    const mesesNomes = [
      'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
      'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ]

    // Buscar TODOS os dados necessários de uma vez (em paralelo)
    const dataFimTotal = `${ano}-12-31`

    const [
      { data: produtos },
      { data: todasEntradas },
      { data: todasSaidas },
      { data: todosAjustes },
      { data: saidasComCusto }
    ] = await Promise.all([
      comEmpresa(client
        .from('produtos')
        .select('id, estoque_inicial, preco_inicial, categoria:categorias(nome)')
        .eq('ativo', true)),
      comEmpresa(client
        .from('entradas')
        .select('produto_id, quantidade, valor_total, data')
        .lte('data', dataFimTotal)),
      comEmpresa(client
        .from('saidas')
        .select('produto_id, quantidade, data, tipo')
        .lte('data', dataFimTotal)),
      comEmpresa(client
        .from('ajustes')
        .select('produto_id, quantidade, data')
        .lte('data', dataFimTotal)),
      comEmpresa(client
        .from('saidas')
        .select('produto_id, custo_saida, data, tipo, produto:produtos(categoria:categorias(nome))')
        .eq('tipo', 'definitiva')
        .gte('data', `${ano}-01-01`)
        .lte('data', dataFimTotal))
    ])

    if (!produtos || produtos.length === 0) return []

    // IDs de produtos MTP
    const idsMTP = new Set(
      produtos.filter(p => ((p.categoria as any)?.nome || '').toUpperCase() === 'MTP').map(p => p.id)
    )

    // Helper: calcular valor do estoque em uma data (INCLUINDO MTP para giro)
    const calcularEstoqueEmData = (dataLimite: string): number => {
      let valorTotal = 0

      for (const produto of produtos) {
        let quantidade = Number(produto.estoque_inicial || 0)
        let valorEntradas = Number(produto.estoque_inicial || 0) * Number(produto.preco_inicial || 0)
        let qtdEntradas = Number(produto.estoque_inicial || 0)

        todasEntradas?.filter(e => e.produto_id === produto.id && e.data <= dataLimite).forEach(e => {
          quantidade += Number(e.quantidade)
          valorEntradas += Number(e.valor_total || 0)
          qtdEntradas += Number(e.quantidade)
        })

        todasSaidas?.filter(s => s.produto_id === produto.id && s.tipo !== 'transferencia' && s.data <= dataLimite).forEach(s => {
          quantidade -= Number(s.quantidade)
        })

        todosAjustes?.filter(a => a.produto_id === produto.id && a.data <= dataLimite).forEach(a => {
          quantidade += Number(a.quantidade)
        })

        const custoMedio = qtdEntradas > 0 ? valorEntradas / qtdEntradas : 0
        valorTotal += Math.max(0, quantidade) * custoMedio
      }

      return valorTotal
    }

    const resultado: GiroEstoque[] = []

    for (let mes = 1; mes <= 12; mes++) {
      const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`
      const ultimoDia = new Date(ano, mes, 0).getDate()
      const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`

      const mesAnterior = mes === 1 ? 12 : mes - 1
      const anoAnterior = mes === 1 ? ano - 1 : ano
      const ultimoDiaAnterior = new Date(anoAnterior, mesAnterior, 0).getDate()
      const dataFimAnterior = `${anoAnterior}-${String(mesAnterior).padStart(2, '0')}-${ultimoDiaAnterior}`

      // CMV do mês (excluindo MTP) - filtrado em memória
      const cmv = saidasComCusto
        ?.filter(s => s.data >= dataInicio && s.data <= dataFim && !idsMTP.has(s.produto_id))
        .reduce((sum, s) => sum + Number(s.custo_saida || 0), 0) || 0

      // Estoques calculados em memória
      const estoque_inicial = calcularEstoqueEmData(dataFimAnterior)
      const estoque_final = calcularEstoqueEmData(dataFim)
      const estoque_medio = (estoque_inicial + estoque_final) / 2
      const estoque_real = estoque_final

      const giro_dias_real = cmv > 0 ? (estoque_real / cmv) * 30 : 0
      const vezes_mes_real = estoque_real > 0 ? cmv / estoque_real : 0
      const giro_dias_medio = cmv > 0 ? (estoque_medio / cmv) * 30 : 0
      const vezes_mes_medio = estoque_medio > 0 ? cmv / estoque_medio : 0

      resultado.push({
        ano,
        mes: mesesNomes[mes - 1],
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
    if (!empresaId.value) return [] as CMV[]

    // Buscar TODOS os dados necessários de uma vez (em paralelo)
    const fatQuery = client
      .from('faturamentos')
      .select('*')
      .eq('ano', ano)
      .eq('empresa_id', empresaId.value)

    // Data range: do início do ano anterior (para estoque inicial de jan) até fim do ano
    const dataInicioTotal = `${ano - 1}-01-01`
    const dataFimTotal = `${ano}-12-31`

    const [
      { data: faturamentos },
      { data: produtos },
      { data: todasEntradas },
      { data: todasSaidas },
      { data: todosAjustes }
    ] = await Promise.all([
      fatQuery,
      comEmpresa(client
        .from('produtos')
        .select('id, estoque_inicial, preco_inicial, categoria:categorias(nome)')
        .eq('ativo', true)),
      comEmpresa(client
        .from('entradas')
        .select('produto_id, quantidade, valor_total, data, origem_beneficiamento')
        .gte('data', dataInicioTotal)
        .lte('data', dataFimTotal)),
      comEmpresa(client
        .from('saidas')
        .select('produto_id, quantidade, data, tipo')
        .gte('data', dataInicioTotal)
        .lte('data', dataFimTotal)),
      comEmpresa(client
        .from('ajustes')
        .select('produto_id, quantidade, data')
        .gte('data', dataInicioTotal)
        .lte('data', dataFimTotal))
    ])

    if (!produtos || produtos.length === 0) return []

    // Se não há nenhuma movimentação no ano consultado, retornar tudo zerado
    const temMovimentacaoNoAno = [
      ...(todasEntradas || []),
      ...(todasSaidas || []),
      ...(todosAjustes || [])
    ].some(m => m.data >= `${ano}-01-01` && m.data <= `${ano}-12-31`)

    if (!temMovimentacaoNoAno && !(faturamentos && faturamentos.length > 0)) {
      return Array.from({ length: 12 }, (_, i) => ({
        ano,
        mes: i + 1,
        estoque_inicial: 0,
        compras: 0,
        estoque_final: 0,
        cmv: 0,
        faturamento: 0,
        percentual_cmv: 0
      }))
    }

    // Filtrar produtos não-MTP
    const produtosNaoMTP = produtos.filter(p => {
      const cat = (p.categoria as any)?.nome || ''
      return cat.toUpperCase() !== 'MTP'
    })
    const idsNaoMTP = new Set(produtosNaoMTP.map(p => p.id))

    // Helper: calcular valor do estoque em uma data (excluindo MTP) - tudo em memória
    const calcularEstoqueEmData = (dataLimite: string): number => {
      let valorTotal = 0

      for (const produto of produtosNaoMTP) {
        let quantidade = Number(produto.estoque_inicial || 0)
        let valorEntradas = Number(produto.estoque_inicial || 0) * Number(produto.preco_inicial || 0)
        let qtdEntradas = Number(produto.estoque_inicial || 0)

        todasEntradas?.filter(e => e.produto_id === produto.id && e.data <= dataLimite).forEach(e => {
          quantidade += Number(e.quantidade)
          valorEntradas += Number(e.valor_total || 0)
          qtdEntradas += Number(e.quantidade)
        })

        todasSaidas?.filter(s => s.produto_id === produto.id && s.tipo !== 'transferencia' && s.data <= dataLimite).forEach(s => {
          quantidade -= Number(s.quantidade)
        })

        todosAjustes?.filter(a => a.produto_id === produto.id && a.data <= dataLimite).forEach(a => {
          quantidade += Number(a.quantidade)
        })

        const custoMedio = qtdEntradas > 0 ? valorEntradas / qtdEntradas : 0
        valorTotal += Math.max(0, quantidade) * custoMedio
      }

      return valorTotal
    }

    const resultado: CMV[] = []

    for (let mes = 1; mes <= 12; mes++) {
      const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`
      const ultimoDia = new Date(ano, mes, 0).getDate()
      const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`

      const mesAnterior = mes === 1 ? 12 : mes - 1
      const anoAnterior = mes === 1 ? ano - 1 : ano
      const ultimoDiaAnterior = new Date(anoAnterior, mesAnterior, 0).getDate()
      const dataFimAnterior = `${anoAnterior}-${String(mesAnterior).padStart(2, '0')}-${ultimoDiaAnterior}`

      // Compras do mês (excluindo MTP e entradas de beneficiamento) - filtrado em memória
      const compras = todasEntradas
        ?.filter(e => e.data >= dataInicio && e.data <= dataFim && idsNaoMTP.has(e.produto_id) && !(e as any).origem_beneficiamento)
        .reduce((sum, e) => sum + Number(e.valor_total || 0), 0) || 0

      // Estoques calculados em memória (sem queries adicionais)
      const estoque_inicial = calcularEstoqueEmData(dataFimAnterior)
      const estoque_final = calcularEstoqueEmData(dataFim)

      const cmv = estoque_inicial + compras - estoque_final
      const faturamento = faturamentos?.find(f => f.mes === mes)?.valor || 0
      const percentual_cmv = faturamento > 0 ? (cmv / Number(faturamento)) * 100 : 0

      resultado.push({
        ano,
        mes,
        estoque_inicial,
        compras,
        estoque_final,
        cmv: Math.max(0, cmv),
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
    if (!empresaId.value) return [] as EstoqueMinimo[]
    const { data: produtos, error } = await comEmpresa(client
      .from('produtos')
      .select(`
        id,
        nome,
        subgrupo:subgrupos(nome),
        unidade:unidades(sigla)
      `)
      .eq('ativo', true))

    if (error) throw error

    // Buscar saldos atuais
    const { data: saldos } = await client
      .from('v_saldo_estoque')
      .select('produto_id, saldo_principal')
      .eq('empresa_id', empresaId.value)

    // Calcular limites das 3 últimas semanas (seg-dom)
    const hoje = new Date()
    const diaSemana = hoje.getDay() // 0=dom, 1=seg...
    // Ir até a segunda-feira desta semana
    const segAtual = new Date(hoje)
    segAtual.setDate(hoje.getDate() - ((diaSemana + 6) % 7))
    segAtual.setHours(0, 0, 0, 0)

    // Semana 1 = mais recente (semana passada), Semana 3 = mais antiga
    const sem1Inicio = new Date(segAtual)
    sem1Inicio.setDate(segAtual.getDate() - 7)
    const sem1Fim = new Date(segAtual)
    sem1Fim.setDate(segAtual.getDate() - 1)

    const sem2Inicio = new Date(segAtual)
    sem2Inicio.setDate(segAtual.getDate() - 14)
    const sem2Fim = new Date(segAtual)
    sem2Fim.setDate(segAtual.getDate() - 8)

    const sem3Inicio = new Date(segAtual)
    sem3Inicio.setDate(segAtual.getDate() - 21)
    const sem3Fim = new Date(segAtual)
    sem3Fim.setDate(segAtual.getDate() - 15)

    const formatData = (d: Date) => d.toISOString().split('T')[0]
    const formatDataBR = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`

    const sem1Periodo = `${formatDataBR(sem1Inicio)} - ${formatDataBR(sem1Fim)}`
    const sem2Periodo = `${formatDataBR(sem2Inicio)} - ${formatDataBR(sem2Fim)}`
    const sem3Periodo = `${formatDataBR(sem3Inicio)} - ${formatDataBR(sem3Fim)}`

    // Buscar saídas definitivas das últimas 3 semanas
    const { data: saidas } = await comEmpresa(client
      .from('saidas')
      .select('produto_id, quantidade, data')
      .eq('tipo', 'definitiva')
      .gte('data', formatData(sem3Inicio))
      .lte('data', formatData(sem1Fim)))

    const resultado: EstoqueMinimo[] = produtos?.map(p => {
      const saldo = saldos?.find(s => s.produto_id === p.id)
      const quantidade_estoque = Number(saldo?.saldo_principal || 0)

      const prodSaidas = saidas?.filter(s => s.produto_id === p.id) || []

      const somarSemana = (inicio: Date, fim: Date) =>
        prodSaidas
          .filter(s => s.data >= formatData(inicio) && s.data <= formatData(fim))
          .reduce((sum, s) => sum + Number(s.quantidade), 0)

      const semana1 = somarSemana(sem1Inicio, sem1Fim)
      const semana2 = somarSemana(sem2Inicio, sem2Fim)
      const semana3 = somarSemana(sem3Inicio, sem3Fim)
      const media_semanas = (semana1 + semana2 + semana3) / 3

      return {
        produto_id: p.id,
        subgrupo: (p.subgrupo as any)?.nome || '',
        nome: p.nome,
        unidade: (p.unidade as any)?.sigla || '',
        quantidade_estoque,
        semana1,
        semana1_periodo: sem1Periodo,
        semana2,
        semana2_periodo: sem2Periodo,
        semana3,
        semana3_periodo: sem3Periodo,
        media_semanas
      }
    }) || []

    return resultado
  }

  // ==========================================
  // VARIAÇÃO DE CUSTO
  // ==========================================

  const getVariacaoCusto = async (ano: number) => {
    if (!empresaId.value) return []
    const { data: custos, error } = await comEmpresa(client
      .from('custos_mensais')
      .select(`
        *,
        produto:produtos(id, nome, categoria:categorias(nome))
      `)
      .eq('ano', ano)
      .order('mes'))

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
  // CMC SEMANAL
  // ==========================================

  /**
   * Calcula as últimas N semanas (seg-dom) a partir da semana atual
   */
  const calcularSemanas = (qtdSemanas: number = 4) => {
    const hoje = new Date()
    const diaSemana = hoje.getDay() // 0=dom, 1=seg...
    const segAtual = new Date(hoje)
    segAtual.setDate(hoje.getDate() - ((diaSemana + 6) % 7))
    segAtual.setHours(0, 0, 0, 0)

    const semanas: { inicio: Date; fim: Date }[] = []
    for (let i = 1; i <= qtdSemanas; i++) {
      const inicio = new Date(segAtual)
      inicio.setDate(segAtual.getDate() - (i * 7))
      const fim = new Date(inicio)
      fim.setDate(inicio.getDate() + 6)
      semanas.push({ inicio, fim })
    }
    // Reverter para ficar da mais antiga para a mais recente
    return semanas.reverse()
  }

  const formatDateISO = (d: Date) => d.toISOString().split('T')[0]
  const formatDateBR = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`

  /**
   * Busca faturamentos semanais para as semanas informadas
   */
  const getFaturamentosSemanais = async (semanasInicio: string[]): Promise<FaturamentoSemanal[]> => {
    if (!empresaId.value || semanasInicio.length === 0) return []

    const { data, error } = await client
      .from('faturamentos_semanais')
      .select('*')
      .eq('empresa_id', empresaId.value)
      .in('semana_inicio', semanasInicio)

    if (error) throw error
    return (data || []) as FaturamentoSemanal[]
  }

  /**
   * Salva (upsert) faturamento de uma semana
   */
  const upsertFaturamentoSemanal = async (semanaInicio: string, semanaFim: string, valor: number): Promise<void> => {
    if (!empresaId.value) throw new Error('Empresa não selecionada')

    const ano = new Date(semanaInicio).getFullYear()

    const { error } = await client
      .from('faturamentos_semanais')
      .upsert({
        empresa_id: empresaId.value,
        ano,
        semana_inicio: semanaInicio,
        semana_fim: semanaFim,
        valor
      }, { onConflict: 'empresa_id,semana_inicio' })

    if (error) throw error
  }

  /**
   * CMC Semanal: entradas (compras) agrupadas por grupo/subgrupo,
   * divididas por faturamento semanal
   */
  const getCmcSemanal = async (ano?: number, mes?: number): Promise<CmcSemanalResumo> => {
    if (!empresaId.value) return { semanas: [], grupos: [], faturamentos: [], cmc_percentuais: [] } as CmcSemanalResumo

    let semanasFormatadas: { label: string; tooltip: string; inicio: string; fim: string; inicio_date: string; fim_date: string }[]

    if (ano && mes) {
      // Semanas do mês selecionado
      const semanasDoMes = calcularSemanasDoMes(ano, mes)
      semanasFormatadas = semanasDoMes.map(s => {
        const ini = new Date(s.inicio + 'T00:00:00')
        const fi = new Date(s.fim + 'T00:00:00')
        return {
          label: s.label,
          tooltip: s.tooltip,
          inicio: formatDateBR(ini),
          fim: formatDateBR(fi),
          inicio_date: s.inicio,
          fim_date: s.fim
        }
      })
    } else {
      // Fallback: últimas 4 semanas
      const semanas = calcularSemanas(4)
      semanasFormatadas = semanas.map((s, i) => ({
        label: `S${i + 1}`,
        tooltip: `${formatDateBR(s.inicio)} - ${formatDateBR(s.fim)}`,
        inicio: formatDateBR(s.inicio),
        fim: formatDateBR(s.fim),
        inicio_date: formatDateISO(s.inicio),
        fim_date: formatDateISO(s.fim)
      }))
    }

    if (semanasFormatadas.length === 0) return { semanas: [], grupos: [], faturamentos: [], cmc_percentuais: [] } as CmcSemanalResumo

    // Data range total
    const dataInicio = semanasFormatadas[0].inicio_date
    const dataFim = semanasFormatadas[semanasFormatadas.length - 1].fim_date

    // Buscar entradas no período com produto → subgrupo → grupo (excluindo beneficiamento)
    const { data: entradas, error } = await comEmpresa(client
      .from('entradas')
      .select(`
        data,
        valor_total,
        produto:produtos(
          id,
          subgrupo:subgrupos(
            id,
            nome,
            grupo:grupos(id, nome)
          )
        )
      `)
      .eq('origem_beneficiamento', false)
      .gte('data', dataInicio)
      .lte('data', dataFim))

    if (error) throw error

    // Buscar faturamentos semanais
    const semanasInicioList = semanasFormatadas.map(s => s.inicio_date)
    const faturamentosData = await getFaturamentosSemanais(semanasInicioList)
    const faturamentosMap = new Map<string, number>()
    faturamentosData.forEach(f => {
      faturamentosMap.set(f.semana_inicio, Number(f.valor || 0))
    })

    // Montar faturamentos na ordem das semanas
    const faturamentos = semanasFormatadas.map(s => faturamentosMap.get(s.inicio_date) || 0)

    // Buscar todos os grupos e subgrupos da empresa
    const { data: todosSubgrupos } = await comEmpresa(client
      .from('subgrupos')
      .select('id, nome, grupo:grupos(id, nome)')
      .order('nome'))

    // Agrupar entradas por grupo/subgrupo/semana
    const gruposMap = new Map<string, {
      grupo_id: string
      grupo_nome: string
      subgrupos: Map<string, {
        subgrupo_id: string
        subgrupo_nome: string
        totais_semanas: number[]
      }>
      totais_semanas: number[]
    }>()

    // Pre-popular com todos os grupos/subgrupos
    todosSubgrupos?.forEach((sub: any) => {
      const grupo = sub.grupo
      if (!grupo) return
      if (!gruposMap.has(grupo.id)) {
        gruposMap.set(grupo.id, {
          grupo_id: grupo.id,
          grupo_nome: grupo.nome,
          subgrupos: new Map(),
          totais_semanas: new Array(semanasFormatadas.length).fill(0)
        })
      }
      const grupoData = gruposMap.get(grupo.id)!
      if (!grupoData.subgrupos.has(sub.id)) {
        grupoData.subgrupos.set(sub.id, {
          subgrupo_id: sub.id,
          subgrupo_nome: sub.nome,
          totais_semanas: new Array(semanasFormatadas.length).fill(0)
        })
      }
    })

    entradas?.forEach(e => {
      const produto = e.produto as any
      const subgrupo = produto?.subgrupo
      const grupo = subgrupo?.grupo

      if (!grupo || !subgrupo) return

      const grupoId = grupo.id
      const subgrupoId = subgrupo.id
      const dataEntrada = e.data

      // Descobrir em qual semana cai essa entrada
      const semanaIdx = semanasFormatadas.findIndex(s =>
        dataEntrada >= s.inicio_date && dataEntrada <= s.fim_date
      )
      if (semanaIdx === -1) return

      // Inicializar grupo se não existir
      if (!gruposMap.has(grupoId)) {
        gruposMap.set(grupoId, {
          grupo_id: grupoId,
          grupo_nome: grupo.nome,
          subgrupos: new Map(),
          totais_semanas: new Array(semanasFormatadas.length).fill(0)
        })
      }
      const grupoData = gruposMap.get(grupoId)!

      // Inicializar subgrupo se não existir
      if (!grupoData.subgrupos.has(subgrupoId)) {
        grupoData.subgrupos.set(subgrupoId, {
          subgrupo_id: subgrupoId,
          subgrupo_nome: subgrupo.nome,
          totais_semanas: new Array(semanasFormatadas.length).fill(0)
        })
      }
      const subgrupoData = grupoData.subgrupos.get(subgrupoId)!

      const valorTotal = Number(e.valor_total || 0)
      subgrupoData.totais_semanas[semanaIdx] += valorTotal
      grupoData.totais_semanas[semanaIdx] += valorTotal
    })

    // Converter Maps para arrays — ordenar por maior volume de compras
    const sumArr = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
    const grupos: CmcSemanalGrupo[] = Array.from(gruposMap.values())
      .map(g => ({
        grupo_id: g.grupo_id,
        grupo_nome: g.grupo_nome,
        totais_semanas: g.totais_semanas,
        subgrupos: Array.from(g.subgrupos.values())
          .sort((a, b) => sumArr(b.totais_semanas) - sumArr(a.totais_semanas)) as CmcSemanalSubgrupo[]
      }))
      .sort((a, b) => sumArr(b.totais_semanas) - sumArr(a.totais_semanas))

    // Calcular CMC % por semana
    const cmc_percentuais = semanasFormatadas.map((_, idx) => {
      const totalEntradas = grupos.reduce((sum, g) => sum + g.totais_semanas[idx], 0)
      const fat = faturamentos[idx]
      return fat > 0 ? (totalEntradas / fat) * 100 : 0
    })

    return {
      semanas: semanasFormatadas,
      grupos,
      faturamentos,
      cmc_percentuais
    }
  }

  // ==========================================
  // VARIAÇÃO DE CUSTO DIÁRIA (por mês)
  // ==========================================

  const getVariacaoCustoDiaria = async (ano: number, mes: number) => {
    if (!empresaId.value) return { dias: [] as { data: string; label: string }[], produtos: [] as any[] }
    const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`
    const ultimoDia = new Date(ano, mes, 0).getDate()
    const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`

    // Buscar entradas do mês com produto, subgrupo e unidade
    const { data: entradas, error } = await comEmpresa(client
      .from('entradas')
      .select(`
        data,
        quantidade,
        custo_unitario,
        valor_total,
        produto:produtos(
          id,
          nome,
          subgrupo:subgrupos(nome),
          unidade:unidades(sigla)
        )
      `)
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .order('data'))

    if (error) throw error

    // Gerar todos os dias do mês (para exibir período completo)
    const dias: string[] = []
    for (let d = 1; d <= ultimoDia; d++) {
      dias.push(`${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }

    // Agrupar por produto
    const produtosMap = new Map<string, {
      produto_id: string
      produto: string
      subgrupo: string
      unidade: string
      custos_por_dia: Map<string, number>
    }>()

    entradas?.forEach(e => {
      const produto = e.produto as any
      if (!produto) return

      const prodId = produto.id
      if (!produtosMap.has(prodId)) {
        produtosMap.set(prodId, {
          produto_id: prodId,
          produto: produto.nome,
          subgrupo: produto.subgrupo?.nome || '',
          unidade: produto.unidade?.sigla || '',
          custos_por_dia: new Map()
        })
      }

      const prod = produtosMap.get(prodId)!
      prod.custos_por_dia.set(e.data, Number(e.custo_unitario))
    })

    // Converter para array
    const produtos = Array.from(produtosMap.values()).map(p => {
      const custos = dias.map(d => p.custos_por_dia.get(d) || 0)

      // Calcular variações entre dias consecutivos com custo
      const variacoes = custos.map((custo, idx) => {
        if (idx === 0 || custo === 0) return null
        let custoAnterior = 0
        for (let i = idx - 1; i >= 0; i--) {
          if (custos[i] > 0) {
            custoAnterior = custos[i]
            break
          }
        }
        if (custoAnterior === 0) return null
        return ((custo - custoAnterior) / custoAnterior) * 100
      })

      // Calcular menor e maior valor comprado no mês (ignorando zeros)
      const custosValidos = custos.filter(c => c > 0)
      const menor_valor = custosValidos.length > 0 ? Math.min(...custosValidos) : 0
      const maior_valor = custosValidos.length > 0 ? Math.max(...custosValidos) : 0
      // Variação do mês: diferença percentual entre primeiro e último custo registrado
      let variacao_mes: number | null = null
      if (custosValidos.length >= 2) {
        const primeiro = custosValidos[0]
        const ultimo = custosValidos[custosValidos.length - 1]
        variacao_mes = ((ultimo - primeiro) / primeiro) * 100
      }

      return {
        produto_id: p.produto_id,
        produto: p.produto,
        subgrupo: p.subgrupo,
        unidade: p.unidade,
        custos,
        variacoes,
        menor_valor,
        maior_valor,
        variacao_mes
      }
    }).sort((a, b) => a.produto.localeCompare(b.produto))

    return {
      dias: dias.map(d => {
        const date = new Date(d + 'T00:00:00')
        return {
          data: d,
          label: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
        }
      }),
      produtos
    }
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  const getDashboardResumo = async (estoqueMinData?: EstoqueMinimo[]) => {
    if (!empresaId.value) return { totalProdutos: 0, valorEstoque: 0, produtosAbaixoMinimo: 0, totalEntradasMes: 0, totalSaidasMes: 0 }

    const hoje = new Date()
    const primeiroDia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`

    // Total de produtos ativos
    const prodQuery = client
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true)
      .eq('empresa_id', empresaId.value)

    // Fazer todas as queries em paralelo
    const [
      { count: totalProdutos },
      { data: saldos },
      { data: entradasMes },
      { data: saidasMes }
    ] = await Promise.all([
      prodQuery,
      client.from('v_saldo_estoque').select('valor_estoque').eq('empresa_id', empresaId.value),
      comEmpresa(client.from('entradas').select('valor_total').gte('data', primeiroDia)),
      comEmpresa(client.from('saidas').select('custo_saida').gte('data', primeiroDia))
    ])

    const valorEstoque = saldos?.reduce((sum, s) => sum + Number(s.valor_estoque || 0), 0) || 0

    // Reusar dados de estoque mínimo se fornecidos, senão buscar
    const estoqueMinimo = estoqueMinData ?? await getEstoqueMinimo()
    const produtosAbaixoMinimo = estoqueMinimo.filter(e => {
      const pontoReposicao = e.media_semanas * 1.2
      return e.quantidade_estoque < pontoReposicao && pontoReposicao > 0
    }).length

    const totalEntradasMes = entradasMes?.reduce((sum, e) => sum + Number(e.valor_total || 0), 0) || 0
    const totalSaidasMes = saidasMes?.reduce((sum, s) => sum + Number(s.custo_saida || 0), 0) || 0

    return {
      totalProdutos: totalProdutos || 0,
      valorEstoque,
      produtosAbaixoMinimo,
      totalEntradasMes,
      totalSaidasMes
    }
  }

  // ==========================================
  // GESTÃO DE INVENTÁRIO (EI e EF por produto)
  // ==========================================

  const getGestaoInventario = async (ano: number, mes: number): Promise<GestaoInventario[]> => {
    if (!empresaId.value) return [] as GestaoInventario[]
    const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`
    const ultimoDia = new Date(ano, mes, 0).getDate()
    const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`

    // Data fim do mês anterior
    const mesAnterior = mes === 1 ? 12 : mes - 1
    const anoAnterior = mes === 1 ? ano - 1 : ano
    const ultimoDiaAnterior = new Date(anoAnterior, mesAnterior, 0).getDate()
    const dataFimAnterior = `${anoAnterior}-${String(mesAnterior).padStart(2, '0')}-${ultimoDiaAnterior}`

    // Buscar produtos ativos com grupo/subgrupo
    const { data: produtos, error: prodError } = await comEmpresa(client
      .from('produtos')
      .select(`
        id,
        nome,
        estoque_inicial,
        preco_inicial,
        categoria:categorias(nome),
        subgrupo:subgrupos(nome, grupo:grupos(nome)),
        unidade:unidades(sigla)
      `)
      .eq('ativo', true)
      .order('nome'))

    if (prodError) throw prodError
    if (!produtos || produtos.length === 0) return []

    // Buscar todas as entradas até o fim do mês
    const { data: entradasAte } = await comEmpresa(client
      .from('entradas')
      .select('produto_id, quantidade, valor_total, custo_unitario, data')
      .lte('data', dataFim))

    // Buscar todas as saídas até o fim do mês (com tipo para split principal/apoio)
    const { data: saidasAte } = await comEmpresa(client
      .from('saidas')
      .select('produto_id, quantidade, data, tipo')
      .lte('data', dataFim))

    // Buscar todos os ajustes até o fim do mês
    const { data: ajustesAte } = await comEmpresa(client
      .from('ajustes')
      .select('produto_id, quantidade, data')
      .lte('data', dataFim))

    // Buscar última entrada de cada produto (para custo da última entrada)
    const { data: todasEntradas } = await comEmpresa(client
      .from('entradas')
      .select('produto_id, quantidade, valor_total, data')
      .order('data', { ascending: false }))

    // Mapa com custo unitário da última entrada por produto
    const ultimaEntradaPorProduto = new Map<string, number>()
    todasEntradas?.forEach(e => {
      if (!ultimaEntradaPorProduto.has(e.produto_id)) {
        const custoUnitario = Number(e.quantidade) > 0
          ? Number(e.valor_total || 0) / Number(e.quantidade)
          : 0
        ultimaEntradaPorProduto.set(e.produto_id, custoUnitario)
      }
    })

    const resultado: GestaoInventario[] = produtos.map(p => {
      const prodEntradas = entradasAte?.filter(e => e.produto_id === p.id) || []
      const prodSaidas = saidasAte?.filter(s => s.produto_id === p.id) || []
      const prodAjustes = ajustesAte?.filter(a => a.produto_id === p.id) || []

      // Separar saídas por tipo (transferências vão para apoio)
      const prodTransferencias = prodSaidas.filter(s => s.tipo === 'transferencia')
      const prodSaidasDefinitivas = prodSaidas.filter(s => s.tipo !== 'transferencia')

      // --- EI (movimentos até fim do mês anterior) ---
      const estoqueInicial = Number(p.estoque_inicial || 0)

      // Principal EI: estoque_inicial + entradas - TODAS saídas + ajustes
      let ei_quantidade_principal = estoqueInicial
      prodEntradas.filter(e => e.data <= dataFimAnterior).forEach(e => { ei_quantidade_principal += Number(e.quantidade) })
      prodSaidas.filter(s => s.data <= dataFimAnterior).forEach(s => { ei_quantidade_principal -= Number(s.quantidade) })
      prodAjustes.filter(a => a.data <= dataFimAnterior).forEach(a => { ei_quantidade_principal += Number(a.quantidade) })

      // Apoio EI: acumula transferências recebidas
      let ei_quantidade_apoio = 0
      prodTransferencias.filter(s => s.data <= dataFimAnterior).forEach(s => { ei_quantidade_apoio += Number(s.quantidade) })

      // Total EI
      const ei_quantidade = ei_quantidade_principal + ei_quantidade_apoio

      // --- EF (movimentos até fim do mês selecionado) ---
      // Principal EF
      let ef_quantidade_principal = estoqueInicial
      prodEntradas.filter(e => e.data <= dataFim).forEach(e => { ef_quantidade_principal += Number(e.quantidade) })
      prodSaidas.filter(s => s.data <= dataFim).forEach(s => { ef_quantidade_principal -= Number(s.quantidade) })
      prodAjustes.filter(a => a.data <= dataFim).forEach(a => { ef_quantidade_principal += Number(a.quantidade) })

      // Apoio EF
      let ef_quantidade_apoio = 0
      prodTransferencias.filter(s => s.data <= dataFim).forEach(s => { ef_quantidade_apoio += Number(s.quantidade) })

      // Total EF
      const ef_quantidade = ef_quantidade_principal + ef_quantidade_apoio

      // Custo da última entrada (para valorizar)
      const custoUltimaEntrada = ultimaEntradaPorProduto.get(p.id) || Number(p.preco_inicial || 0)

      const ei_valor = Math.max(0, ei_quantidade) * custoUltimaEntrada
      const ef_valor = Math.max(0, ef_quantidade) * custoUltimaEntrada
      const ei_valor_principal = Math.max(0, ei_quantidade_principal) * custoUltimaEntrada
      const ef_valor_principal = Math.max(0, ef_quantidade_principal) * custoUltimaEntrada
      const ei_valor_apoio = Math.max(0, ei_quantidade_apoio) * custoUltimaEntrada
      const ef_valor_apoio = Math.max(0, ef_quantidade_apoio) * custoUltimaEntrada

      // Verificar se houve movimentação no mês
      const entradasNoMes = prodEntradas.filter(e => e.data >= dataInicio && e.data <= dataFim)
      const saidasNoMes = prodSaidas.filter(s => s.data >= dataInicio && s.data <= dataFim)
      const ajustesNoMes = prodAjustes.filter(a => a.data >= dataInicio && a.data <= dataFim)
      const semMovimentacao = entradasNoMes.length === 0 && saidasNoMes.length === 0 && ajustesNoMes.length === 0

      return {
        produto_id: p.id,
        produto: p.nome,
        categoria: (p.categoria as any)?.nome || '',
        grupo: (p.subgrupo as any)?.grupo?.nome || '',
        subgrupo: (p.subgrupo as any)?.nome || '',
        unidade: (p.unidade as any)?.sigla || '',
        ei_quantidade,
        ei_valor,
        ef_quantidade,
        ef_valor,
        ei_quantidade_principal,
        ei_valor_principal,
        ef_quantidade_principal,
        ef_valor_principal,
        ei_quantidade_apoio,
        ei_valor_apoio,
        ef_quantidade_apoio,
        ef_valor_apoio,
        custo_ultima_entrada: custoUltimaEntrada,
        variacao_quantidade: ef_quantidade - ei_quantidade,
        variacao_valor: ef_valor - ei_valor,
        sem_movimentacao: semMovimentacao
      }
    })

    // Retornar todos os produtos que têm estoque (EI ou EF)
    return resultado.filter(r =>
      r.ei_quantidade !== 0 || r.ef_quantidade !== 0 ||
      r.ei_valor !== 0 || r.ef_valor !== 0
    )
  }

  // ==========================================
  // PAINEL MÊS — ESTOQUE DE APOIO (DIÁRIO)
  // ==========================================

  const getPainelMesApoio = async (ano: number, mes: number): Promise<{ dias: DiaInfo[], itens: PainelMesApoio[] }> => {
    if (!empresaId.value) return { dias: [], itens: [] }

    const ultimoDia = new Date(ano, mes, 0).getDate()
    const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`
    const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`

    // Gerar info de dias do mês
    const dias: DiaInfo[] = []
    for (let d = 1; d <= ultimoDia; d++) {
      dias.push({
        label: String(d),
        data: `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      })
    }

    // Buscar produtos ativos
    const { data: produtos, error: prodError } = await comEmpresa(client
      .from('produtos')
      .select('id, nome, estoque_inicial, unidade:unidades(sigla)')
      .eq('ativo', true)
      .order('nome'))
    if (prodError) throw prodError

    // Entradas no apoio = transferências para apoio (tipo='transferencia', sem empresa_destino_id)
    const { data: entradasApoio } = await comEmpresa(client
      .from('saidas')
      .select('produto_id, quantidade, data')
      .eq('tipo', 'transferencia')
      .is('empresa_destino_id', null)
      .gte('data', dataInicio)
      .lte('data', dataFim))

    // Calcular E.I. do apoio: soma de todas transf. apoio anteriores ao mês
    const mesAnterior = mes === 1 ? 12 : mes - 1
    const anoAnterior = mes === 1 ? ano - 1 : ano
    const dataFimAnterior = `${anoAnterior}-${String(mesAnterior).padStart(2, '0')}-${new Date(anoAnterior, mesAnterior, 0).getDate()}`

    const { data: entradasApoioAnt } = await comEmpresa(client
      .from('saidas')
      .select('produto_id, quantidade')
      .eq('tipo', 'transferencia')
      .is('empresa_destino_id', null)
      .lte('data', dataFimAnterior))

    // Mapa de E.I. do apoio por produto
    const eiApoio = new Map<string, number>()
    entradasApoioAnt?.forEach(s => {
      eiApoio.set(s.produto_id, (eiApoio.get(s.produto_id) || 0) + Number(s.quantidade))
    })

    // Montar painel
    const itens: PainelMesApoio[] = (produtos || []).map(p => {
      const ei = eiApoio.get(p.id) || 0
      const entradas_por_dia = new Array(ultimoDia).fill(0)
      const saidas_por_dia = new Array(ultimoDia).fill(0)

      // Entradas no apoio = transferências para apoio
      entradasApoio?.filter(e => e.produto_id === p.id).forEach(e => {
        const day = parseInt(e.data.split('-')[2], 10)
        if (day >= 1 && day <= ultimoDia) entradas_por_dia[day - 1] += Number(e.quantidade)
      })

      // Saídas do apoio (futuro — contagens)

      const total_entradas = entradas_por_dia.reduce((sum, v) => sum + v, 0)
      const total_saidas = saidas_por_dia.reduce((sum, v) => sum + v, 0)

      return {
        produto_id: p.id,
        produto: p.nome,
        unidade: (p.unidade as any)?.sigla || '',
        estoque_inicial: ei,
        entradas_por_dia,
        saidas_por_dia,
        total_entradas,
        total_saidas,
        estoque_final: ei + total_entradas - total_saidas
      }
    })

    return { dias, itens }
  }

  return {
    getPainelMes,
    getPainelMesApoio,
    getCurvaABC,
    getCurvaABCEstoque,
    getCurvaABCCMV,
    getComparativoABC,
    getGiroEstoque,
    getCMV,
    getEstoqueMinimo,
    getCmcSemanal,
    getFaturamentosSemanais,
    upsertFaturamentoSemanal,
    getVariacaoCusto,
    getVariacaoCustoDiaria,
    getDashboardResumo,
    getGestaoInventario
  }
}
