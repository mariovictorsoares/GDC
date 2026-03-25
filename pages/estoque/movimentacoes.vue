<template>
  <div class="space-y-6">

    <!-- Header -->
    <h1 class="text-2xl font-semibold text-[#5a5a66] pb-4">Movimentações</h1>

    <!-- Toolbar -->
    <div class="flex items-center gap-3">
      <div class="flex flex-wrap items-center gap-3 flex-1 min-w-0">
        <UInput v-model="search" placeholder="Buscar produto..." icon="i-heroicons-magnifying-glass" class="w-full sm:w-44" :ui="toolbarInputUi" />
        <!-- Date Range Picker -->
        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton color="white" class="w-full sm:w-auto justify-between" :ui="toolbarButtonUi">
            <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-operacao-400 mr-2" />
            <span class="text-sm font-normal" :class="dateRange.start ? 'text-gray-900' : 'text-operacao-400'">
              {{ dateRangeLabel }}
            </span>
          </UButton>
          <template #panel="{ close }">
            <div class="p-2">
              <ClientOnly>
                <VDatePicker
                  v-model.range="dateRange"
                  :columns="1"
                  locale="pt-BR"
                  :first-day-of-week="1"
                  color="blue"
                  @dayclick="onDayClick(close)"
                />
              </ClientOnly>
            </div>
          </template>
        </UPopover>
        <!-- Filtro Tipo -->
        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton color="white" class="w-full sm:w-auto justify-between" trailing-icon="i-heroicons-chevron-down-20-solid" :ui="toolbarButtonUi">
            <span class="truncate text-left font-normal"><span class="text-operacao-400">Tipo:</span> <span class="text-gray-900">{{ tipoFilterLabel }}</span></span>
          </UButton>
          <template #panel="{ close }">
            <div class="w-48 py-1">
              <button
                v-for="opt in tipoFilterOptions"
                :key="opt.value"
                class="w-full text-left px-3 py-1.5 text-sm rounded transition-colors"
                :class="filtroTipo === opt.value ? 'text-guardian-600 font-medium bg-guardian-50' : 'text-operacao-600 hover:bg-operacao-50'"
                @click="filtroTipo = opt.value; close()"
              >
                {{ opt.label }}
              </button>
            </div>
          </template>
        </UPopover>
        <UButton
          v-if="hasActiveFilters"
          color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" size="xs"
          class="rounded-full" :ui="{ rounded: 'rounded-full' }" @click="clearFilters"
        />
      </div>
      <button @click="loadAll()" class="flex items-center justify-center w-8 h-8 rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm text-operacao-500 hover:text-guardian-600 hover:ring-guardian-200 hover:bg-guardian-50 transition-all flex-shrink-0" :disabled="loading">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" :class="{ 'animate-spin': loading }" />
      </button>
    </div>

    <!-- Table -->
    <UCard :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
      <UTable
        :columns="columns"
        :rows="paginatedItems"
        :loading="loading"
        :ui="{
          divide: 'divide-y divide-operacao-50 dark:divide-operacao-700',
          thead: '',
          th: { base: 'bg-operacao-100/70 dark:bg-operacao-800 border-b border-operacao-200/60 [&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66] [&_button>span+span]:text-operacao-300 [&_button>span+span]:!w-3.5 [&_button>span+span]:!h-3.5', color: 'text-[#5a5a66] dark:text-operacao-400', font: 'font-medium', size: 'text-xs uppercase tracking-wider', padding: 'px-4 py-2' },
          td: { color: 'text-operacao-600 dark:text-operacao-200', size: 'text-sm', padding: 'px-4 py-2.5' },
          tr: { base: 'hover:bg-operacao-50/50 transition-colors' }
        }"
      >
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-operacao-400">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhum registro encontrado</p>
          </div>
        </template>

        <template #data-data="{ row }">
          {{ formatDate(row.data) }}
        </template>

        <template #tipoDisplay-data="{ row }">
          <UBadge :color="getTipoBadgeColor(row)" variant="soft" size="sm">
            {{ getTipoLabel(row) }}
          </UBadge>
        </template>

        <template #produto-data="{ row }">
          <div>
            <p class="font-semibold text-operacao-800 dark:text-white">{{ row.produto?.nome || '-' }}</p>
            <p class="text-xs text-operacao-400">{{ row.produto?.categoria?.nome || '' }}</p>
          </div>
        </template>

        <template #quantidade-data="{ row }">
          <span v-if="row._tipoMov === 'ajuste'" class="font-semibold" :class="row.quantidade > 0 ? 'text-controle-600' : 'text-red-500'">
            {{ row.quantidade > 0 ? '+' : '' }}{{ formatNumber(row.quantidade) }} {{ row.produto?.unidade?.sigla || '' }}
          </span>
          <span v-else>{{ formatNumber(row.quantidade) }} {{ row.produto?.unidade?.sigla || '' }}</span>
        </template>

        <template #valor-data="{ row }">
          <span v-if="row._tipoMov === 'ajuste' && row.valor" class="font-medium" :class="row.quantidade > 0 ? 'text-controle-600' : 'text-red-600'">
            {{ formatCurrency(row.valor) }}
          </span>
          <span v-else-if="row._tipoMov === 'ajuste'" class="text-operacao-300">—</span>
          <span v-else class="font-medium" :class="row._tipoMov === 'entrada' ? 'text-controle-600' : 'text-red-600'">
            {{ formatCurrency(row.valor) }}
          </span>
        </template>

        <template #observacao-data="{ row }">
          <span class="text-xs text-operacao-400 truncate max-w-[200px] block">
            {{ getObservacao(row) || '-' }}
          </span>
        </template>

      </UTable>
      <TablePagination
        v-model="page"
        :page-size="pageSize"
        :total-items="filteredMovimentos.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>

  </div>
</template>

<script setup lang="ts">
import type { Entrada, Saida, Ajuste, Produto, TipoSaida } from '~/types'
import { DatePicker as VDatePicker } from 'v-calendar'

// ======================== TOOLBAR UI ========================
const toolbarInputUi = { color: { white: { outline: 'shadow-sm bg-white text-gray-900 ring-1 ring-inset ring-[#EBEBED] focus:ring-1 focus:ring-operacao-200 dark:ring-operacao-700' } } }
const toolbarButtonUi = { color: { white: { solid: 'shadow-sm ring-1 ring-inset ring-[#EBEBED] text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-guardian-500 dark:ring-operacao-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800/50' } } }

// ======================== COMPOSABLES ========================

const {
  getEntradas,
  getSaidas,
  getAjustes,
  getProdutos,
  getSaldoEstoque
} = useEstoque()
const { empresaId } = useEmpresa()
const { formatCurrency, formatNumber } = useFormatters()
const toast = useToast()

// ======================== STATE ========================

const entradas = ref<Entrada[]>([])
const saidas = ref<Saida[]>([])
const ajustes = ref<Ajuste[]>([])
const produtos = ref<Produto[]>([])
const custoMedioMap = ref<Record<string, number>>({})
const loading = ref(true)
const search = ref('')

// Date range
const hoje = new Date()
const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
const dateRange = ref<{ start: Date | null; end: Date | null }>({ start: primeiroDiaMes, end: ultimoDiaMes })
const dateRangeClickCount = ref(0)
const filtroTipo = ref('')

// Computed: date filters as YYYY-MM-DD strings
const filtroDataInicio = computed(() => {
  if (!dateRange.value.start) return ''
  const d = new Date(dateRange.value.start)
  return d.toISOString().slice(0, 10)
})
const filtroDataFim = computed(() => {
  if (!dateRange.value.end) return ''
  const d = new Date(dateRange.value.end)
  return d.toISOString().slice(0, 10)
})

const dateRangeLabel = computed(() => {
  if (!dateRange.value.start) return 'Selecionar período'
  const fmt = (d: Date) => {
    const dt = new Date(d)
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }
  if (!dateRange.value.end || dateRange.value.start.getTime() === dateRange.value.end.getTime()) {
    return fmt(dateRange.value.start)
  }
  return `${fmt(dateRange.value.start)} — ${fmt(dateRange.value.end)}`
})

const hasActiveFilters = computed(() => {
  return !!dateRange.value.start || !!filtroTipo.value || !!search.value
})

const onDayClick = (closeFn: () => void) => {
  dateRangeClickCount.value++
  if (dateRangeClickCount.value >= 2) {
    dateRangeClickCount.value = 0
    setTimeout(() => closeFn(), 200)
  }
}

// ======================== TABLE COLUMNS ========================

const columns = [
  { key: 'data', label: 'Data', sortable: true },
  { key: 'tipoDisplay', label: 'Tipo' },
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'quantidade', label: 'Quantidade' },
  { key: 'valor', label: 'Valor' },
  { key: 'observacao', label: 'Observação' }
]

const tipoFilterOptions = [
  { label: 'Todos', value: '' },
  { label: 'Entrada', value: 'entrada' },
  { label: 'Transferência', value: 'transferencia' },
  { label: 'Definitiva', value: 'definitiva' },
  { label: 'Produção', value: 'producao' },
  { label: 'Ajuste', value: 'ajuste' }
]

const tipoFilterLabel = computed(() => {
  const opt = tipoFilterOptions.find(o => o.value === filtroTipo.value)
  return opt?.label || 'Todos'
})

// ======================== COMPUTED: UNIFIED DATA ========================

const movimentos = computed(() => {
  const entradasMapped = entradas.value.map(e => ({
    id: e.id,
    _tipoMov: 'entrada' as const,
    data: e.data,
    produto: e.produto,
    produto_id: e.produto_id,
    quantidade: e.quantidade,
    valor: e.valor_total,
    custo_unitario: e.custo_unitario,
    numero_nf: e.numero_nf,
    tipo: null as TipoSaida | null,
    _entradaOriginal: e,
    _saidaOriginal: null as Saida | null,
    _ajusteOriginal: null as Ajuste | null
  }))

  const saidasMapped = saidas.value.map(s => ({
    id: s.id,
    _tipoMov: 'saida' as const,
    data: s.data,
    produto: s.produto,
    produto_id: s.produto_id,
    quantidade: s.quantidade,
    valor: Number(s.custo_saida) || 0,
    custo_unitario: null as number | null,
    numero_nf: null as string | null,
    tipo: s.tipo,
    empresa_destino: s.empresa_destino || null,
    _entradaOriginal: null as Entrada | null,
    _saidaOriginal: s,
    _ajusteOriginal: null as Ajuste | null
  }))

  const ajustesMapped = ajustes.value.map(a => {
    const custoMedio = custoMedioMap.value[a.produto_id] || 0
    const valorCalculado = custoMedio ? Math.abs(a.quantidade) * custoMedio : null
    return {
      id: a.id,
      _tipoMov: 'ajuste' as const,
      data: a.data,
      produto: a.produto,
      produto_id: a.produto_id,
      quantidade: a.quantidade,
      valor: valorCalculado,
      custo_unitario: custoMedio || (null as number | null),
      numero_nf: null as string | null,
      tipo: null as TipoSaida | null,
      empresa_destino: null,
      _entradaOriginal: null as Entrada | null,
      _saidaOriginal: null as Saida | null,
      _ajusteOriginal: a
    }
  })

  return [...entradasMapped, ...saidasMapped, ...ajustesMapped].sort((a, b) => {
    const dateDiff = new Date(b.data).getTime() - new Date(a.data).getTime()
    if (dateDiff !== 0) return dateDiff
    const ca = a._entradaOriginal?.created_at || a._saidaOriginal?.created_at || a._ajusteOriginal?.created_at || ''
    const cb = b._entradaOriginal?.created_at || b._saidaOriginal?.created_at || b._ajusteOriginal?.created_at || ''
    return cb.localeCompare(ca)
  })
})

const filteredMovimentos = computed(() => {
  let result = movimentos.value

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(m =>
      m.produto?.nome?.toLowerCase().includes(term) ||
      m.produto?.categoria?.nome?.toLowerCase().includes(term)
    )
  }

  if (filtroTipo.value) {
    if (filtroTipo.value === 'entrada') {
      result = result.filter(m => m._tipoMov === 'entrada')
    } else if (filtroTipo.value === 'ajuste') {
      result = result.filter(m => m._tipoMov === 'ajuste')
    } else {
      result = result.filter(m => m._tipoMov === 'saida' && m.tipo === filtroTipo.value)
    }
  }

  return result
})

const { page, pageSize, paginatedItems } = usePagination(filteredMovimentos)

// ======================== COMPUTED: KPIs ========================

const totalEntradas = computed(() =>
  filteredMovimentos.value
    .filter(m => m._tipoMov === 'entrada')
    .reduce((sum, m) => sum + Number(m.valor), 0)
)

const totalSaidas = computed(() =>
  filteredMovimentos.value
    .filter(m => m._tipoMov === 'saida')
    .reduce((sum, m) => sum + Number(m.valor), 0)
)

// ======================== HELPERS ========================

const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

const getTipoBadgeColor = (row: any) => {
  if (row._tipoMov === 'entrada') return 'green' as const
  if (row._tipoMov === 'ajuste') return 'amber' as const
  if (row.tipo === 'transferencia') return 'blue' as const
  if (row.tipo === 'producao') return 'purple' as const
  return 'red' as const
}

const getTipoLabel = (row: any): string => {
  if (row._tipoMov === 'entrada') return 'Entrada'
  if (row._tipoMov === 'ajuste') {
    const aj = row._ajusteOriginal as Ajuste | null
    if (aj?.tipo === 'apoio') return 'Ajuste (Apoio)'
    return 'Ajuste (Principal)'
  }
  if (row.tipo === 'transferencia') {
    if (row.empresa_destino) return `→ ${row.empresa_destino.nome}`
    return 'Transferência'
  }
  if (row.tipo === 'producao') return 'Produção'
  return 'Definitiva'
}

const getObservacao = (row: any): string => {
  if (row._entradaOriginal) return row._entradaOriginal.observacao || ''
  if (row._saidaOriginal) return row._saidaOriginal.observacao || ''
  if (row._ajusteOriginal) return row._ajusteOriginal.observacao || ''
  return ''
}

// ======================== LOAD FUNCTIONS ========================

const loadEntradas = async () => {
  try {
    entradas.value = await getEntradas({
      dataInicio: filtroDataInicio.value || undefined,
      dataFim: filtroDataFim.value || undefined
    })
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar entradas', color: 'red' })
  }
}

const loadSaidas = async () => {
  try {
    saidas.value = await getSaidas({
      dataInicio: filtroDataInicio.value || undefined,
      dataFim: filtroDataFim.value || undefined
    })
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar saídas', color: 'red' })
  }
}

const loadAjustes = async () => {
  try {
    ajustes.value = await getAjustes({
      dataInicio: filtroDataInicio.value || undefined,
      dataFim: filtroDataFim.value || undefined
    })
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar ajustes', color: 'red' })
  }
}

const loadProdutos = async () => {
  try {
    produtos.value = await getProdutos()
  } catch (error) {
  }
}

const loadCustosMedios = async () => {
  try {
    const saldos = await getSaldoEstoque()
    const map: Record<string, number> = {}
    for (const s of saldos) {
      map[s.produto_id] = Number(s.custo_medio) || 0
    }
    custoMedioMap.value = map
  } catch {}
}

const loadAll = async () => {
  loading.value = true
  await Promise.all([loadEntradas(), loadSaidas(), loadAjustes(), loadProdutos(), loadCustosMedios()])
  loading.value = false
}

const clearFilters = () => {
  search.value = ''
  dateRange.value = { start: null, end: null }
  dateRangeClickCount.value = 0
  filtroTipo.value = ''
  loadEntradas()
  loadSaidas()
  loadAjustes()
}

// ======================== WATCHERS ========================

watch([filtroDataInicio, filtroDataFim], () => {
  loadEntradas()
  loadSaidas()
  loadAjustes()
})

// Realtime
const { onTableChange } = useRealtime()
onTableChange(['entradas', 'saidas', 'ajustes', 'produtos'], () => loadAll())

watch(empresaId, () => {
  if (empresaId.value) {
    loadAll()
  }
}, { immediate: true })
</script>
