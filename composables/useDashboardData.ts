import type { CMV, CurvaABC, GiroEstoque, EstoqueMinimo } from '~/types'

export const useDashboardData = () => {
  const { getDashboardResumo, getCMV, getCurvaABCEstoque, getGiroEstoque, getEstoqueMinimo } = useRelatorios()
  const { empresaId } = useEmpresa()

  const loading = ref(true)

  const resumo = ref({
    totalProdutos: 0,
    valorEstoque: 0,
    produtosAbaixoMinimo: 0,
    totalEntradasMes: 0,
    totalSaidasMes: 0
  })

  const cmvData = ref<CMV[]>([])
  const abcData = ref<CurvaABC[]>([])
  const giroData = ref<GiroEstoque[]>([])
  const estoqueMinData = ref<EstoqueMinimo[]>([])

  const loadAll = async () => {
    loading.value = true
    try {
      const ano = new Date().getFullYear()

      // Buscar estoque mínimo primeiro (será reusado no getDashboardResumo)
      const estMin = await getEstoqueMinimo()
      estoqueMinData.value = estMin

      // Agora rodar tudo em paralelo, passando estMin para evitar query duplicada
      const [res, cmv, abc, giro] = await Promise.all([
        getDashboardResumo(estMin),
        getCMV(ano),
        getCurvaABCEstoque(),
        getGiroEstoque(ano)
      ])
      resumo.value = res
      cmvData.value = cmv
      abcData.value = abc
      giroData.value = giro
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      loading.value = false
    }
  }

  // Mês atual (1-indexed)
  const mesAtual = new Date().getMonth() + 1

  // CMV do mês atual
  const currentMonthCMV = computed(() => {
    return cmvData.value.find(c => c.mes === mesAtual)
  })

  // CMV do mês anterior
  const previousMonthCMV = computed(() => {
    const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1
    return cmvData.value.find(c => c.mes === mesAnterior)
  })

  // Meses do CMV que têm dados (faturamento ou compras)
  const cmvMesesComDados = computed(() => {
    return cmvData.value.filter(c => c.faturamento > 0 || c.compras > 0)
  })

  // Giro do mês atual
  const currentGiro = computed(() => {
    const meses = [
      'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
      'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ]
    return giroData.value.find(g => g.mes === meses[mesAtual - 1])
  })

  // Giro do mês anterior
  const previousGiro = computed(() => {
    const meses = [
      'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
      'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ]
    const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1
    return giroData.value.find(g => g.mes === meses[mesAnterior - 1])
  })

  // Resumo ABC por classe
  const abcSummary = computed(() => {
    const summary = { A: { count: 0, valor: 0 }, B: { count: 0, valor: 0 }, C: { count: 0, valor: 0 } }
    abcData.value.forEach(item => {
      summary[item.classe].count++
      summary[item.classe].valor += item.valor
    })
    return summary
  })

  // Total ABC
  const abcTotal = computed(() => {
    return abcData.value.reduce((sum, item) => sum + item.valor, 0)
  })

  // Produtos abaixo do mínimo com dias até ruptura
  const lowStockWithDays = computed(() => {
    return estoqueMinData.value
      .map(p => {
        const pontoReposicao = p.media_semanas * 1.2
        const consumoDiario = p.media_semanas / 7
        const diasRuptura = consumoDiario > 0
          ? Math.floor(p.quantidade_estoque / consumoDiario)
          : 999
        const previsaoCompras = Math.max(0, pontoReposicao - p.quantidade_estoque)
        return { ...p, pontoReposicao, diasRuptura, previsaoCompras }
      })
      .filter(p => p.previsaoCompras > 0)
      .sort((a, b) => a.diasRuptura - b.diasRuptura)
      .slice(0, 10)
  })

  // Sparkline data: últimos 6 meses de estoque_real do giro
  const estoqueSparkline = computed(() => {
    return giroData.value
      .filter(g => g.estoque_real > 0)
      .slice(-6)
      .map(g => g.estoque_real)
  })

  // Saldo do mês
  const saldoMes = computed(() => {
    return resumo.value.totalEntradasMes - resumo.value.totalSaidasMes
  })

  // Watch empresa change
  watch(empresaId, () => {
    if (empresaId.value) loadAll()
  }, { immediate: true })

  return {
    loading,
    resumo,
    cmvData,
    abcData,
    giroData,
    estoqueMinData,
    currentMonthCMV,
    previousMonthCMV,
    cmvMesesComDados,
    currentGiro,
    previousGiro,
    abcSummary,
    abcTotal,
    lowStockWithDays,
    estoqueSparkline,
    saldoMes,
    loadAll
  }
}
