<template>
  <div class="space-y-6">

    <!-- Header -->
    <h1 class="text-2xl font-semibold text-[#5a5a66] pb-4">Estoque Apoio</h1>

    <!-- Barra: Tabs + Filtros -->
    <div class="flex items-end justify-between">
      <!-- Tabs -->
      <div ref="tabsContainerRef" class="relative flex items-center gap-0.5">
        <button v-for="v in viewModeOptions" :key="v.key" :ref="el => { if (el) tabRefs[v.key] = el as HTMLElement }" @click="viewMode = v.key"
          class="relative flex items-center gap-1.5 px-3.5 pb-2.5 pt-1 text-sm font-medium transition-colors duration-200"
          :class="viewMode === v.key ? 'text-guardian-700' : 'text-operacao-400 hover:text-operacao-600'">
          <UIcon :name="v.icon" class="w-4 h-4" />
          <span>{{ v.label }}</span>
        </button>
        <!-- Sliding indicator -->
        <span class="absolute bottom-0 h-[2px] bg-guardian-600 rounded-full transition-all duration-300 ease-in-out" :style="tabIndicatorStyle" />
      </div>
      <!-- Direita: Filtros -->
      <div class="flex items-center gap-2.5 pb-2">
        <!-- Filtros do Mapa Visual (só aparecem nessa view) -->
        <template v-if="viewMode === 'mapa'">
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton color="white" class="justify-between" :ui="toolbarButtonUi">
              <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-operacao-400 mr-2" />
              <span class="text-sm font-normal text-gray-900 capitalize">{{ mesAnoLabel }}</span>
            </UButton>
            <template #panel="{ close }">
              <div class="w-64 p-3">
                <div class="flex items-center justify-between mb-3">
                  <button class="p-1 rounded hover:bg-operacao-100 transition-colors" @click="pickerAno--">
                    <UIcon name="i-heroicons-chevron-left-20-solid" class="w-4 h-4 text-operacao-500" />
                  </button>
                  <span class="text-sm font-semibold text-gray-700">{{ pickerAno }}</span>
                  <button class="p-1 rounded hover:bg-operacao-100 transition-colors" @click="pickerAno++">
                    <UIcon name="i-heroicons-chevron-right-20-solid" class="w-4 h-4 text-operacao-500" />
                  </button>
                </div>
                <div class="grid grid-cols-3 gap-1.5">
                  <button
                    v-for="(nome, idx) in mesesNomes" :key="idx"
                    class="px-2 py-1.5 text-sm rounded-md transition-colors capitalize"
                    :class="selectedMes === idx + 1 && selectedAno === pickerAno ? 'bg-guardian-600 text-white font-medium' : 'text-operacao-600 hover:bg-operacao-50'"
                    @click="selectMesAno(idx + 1, pickerAno); close()"
                  >{{ nome }}</button>
                </div>
              </div>
            </template>
          </UPopover>
          <!-- Week Navigator -->
          <div v-if="mapaData.length > 0 && mapaData[0].semanas.length > 0" class="flex items-center bg-white ring-1 ring-[#EBEBED] rounded-md shadow-sm h-8">
            <UButton color="gray" variant="ghost" icon="i-heroicons-chevron-left-20-solid" size="sm" class="h-full px-2" :disabled="semanaIndex === 0" @click="semanaIndex--" />
            <div class="flex items-center justify-center min-w-[70px] border-x border-[#EBEBED] h-full px-2">
              <span class="text-sm font-normal text-gray-900 capitalize">
                {{ mapaData[0].semanas[semanaIndex]?.label }}
              </span>
            </div>
            <UButton color="gray" variant="ghost" icon="i-heroicons-chevron-right-20-solid" size="sm" class="h-full px-2" :disabled="semanaIndex >= (mapaData[0].semanas.length - 1)" @click="semanaIndex++" />
          </div>
          <div v-else-if="mapaData.length === 0 && !loading" class="text-xs text-operacao-400 font-medium italic px-2">
            Nenhum dado disponível
          </div>
        </template>
        <UInput v-model="search" placeholder="Buscar produto..." icon="i-heroicons-magnifying-glass" class="w-44" :ui="toolbarInputUi" />
        <button @click="loadAll()" class="flex items-center justify-center w-8 h-8 rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm text-operacao-500 hover:text-guardian-600 hover:ring-guardian-200 hover:bg-guardian-50 transition-all" :disabled="loading">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- ======================== POSIÇÃO ATUAL ======================== -->
    <Transition name="view-fade" mode="out-in">
    <div v-if="viewMode === 'posicao'" key="posicao" class="space-y-6">
      <!-- Loading -->
      <div v-if="posicaoLoading" class="space-y-3">
        <USkeleton v-for="i in 5" :key="i" class="h-10 w-full rounded-lg" />
      </div>

      <UCard v-else :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-operacao-100/70 border-b border-operacao-200/60">
              <tr>
                <th class="px-4 py-2 text-left">
                  <button @click="togglePosicaoSort('produto')" class="flex items-center gap-1 font-medium uppercase tracking-wider text-xs text-[#5a5a66]">
                    Produto
                    <span v-if="posicaoSortKey === 'produto'" class="text-operacao-300 !w-3.5 !h-3.5"><UIcon :name="posicaoSortDir === 'asc' ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'" class="w-3.5 h-3.5" /></span>
                  </button>
                </th>
                <th class="px-4 py-2 text-right">
                  <button @click="togglePosicaoSort('saldo')" class="flex items-center gap-1 justify-end w-full font-medium uppercase tracking-wider text-xs text-[#5a5a66]">
                    Qtd Apoio
                    <span v-if="posicaoSortKey === 'saldo'" class="text-operacao-300 !w-3.5 !h-3.5"><UIcon :name="posicaoSortDir === 'asc' ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'" class="w-3.5 h-3.5" /></span>
                  </button>
                </th>
                <th class="px-4 py-2 text-right font-medium uppercase tracking-wider text-xs text-[#5a5a66]">Custo Médio</th>
                <th class="px-4 py-2 text-right">
                  <button @click="togglePosicaoSort('valor_estoque')" class="flex items-center gap-1 justify-end w-full font-medium uppercase tracking-wider text-xs text-[#5a5a66]">
                    Valor
                    <span v-if="posicaoSortKey === 'valor_estoque'" class="text-operacao-300 !w-3.5 !h-3.5"><UIcon :name="posicaoSortDir === 'asc' ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'" class="w-3.5 h-3.5" /></span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-operacao-100">
              <tr v-if="posicaoPaginated.length === 0">
                <td colspan="4" class="px-4 py-8 text-center text-sm text-operacao-400">Nenhum produto cadastrado</td>
              </tr>
              <tr v-for="item in posicaoPaginated" :key="item.produto_id" class="hover:bg-operacao-50/60 transition-colors">
                <td class="px-4 py-2.5">
                  <p class="text-sm font-medium text-operacao-800">{{ item.produto }}</p>
                  <p class="text-xs text-operacao-400">{{ item.categoria }}</p>
                </td>
                <td class="px-4 py-2.5 text-right font-semibold text-operacao-800 tabular-nums">
                  {{ formatQtd(item.saldo) }} <span class="text-xs font-normal text-operacao-400">{{ item.unidade }}</span>
                </td>
                <td class="px-4 py-2.5 text-right text-operacao-600 tabular-nums">
                  {{ item.custo_medio > 0 ? formatCurrency(item.custo_medio) : '-' }}
                </td>
                <td class="px-4 py-2.5 text-right font-medium text-operacao-800 tabular-nums">
                  {{ item.valor_estoque > 0 ? formatCurrency(item.valor_estoque) : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          v-model="posicaoPage"
          :page-size="posicaoPageSize"
          :total-items="posicaoFiltered.length"
          @update:page-size="posicaoPageSize = $event"
        >
          <template #extra>
            <span class="text-sm text-operacao-400">|</span>
            <span class="text-sm font-medium text-operacao-600">Valor total: {{ formatCurrency(posicaoData.reduce((sum, p) => sum + p.valor_estoque, 0)) }}</span>
          </template>
        </TablePagination>
      </UCard>
    </div>

    <!-- ======================== MAPA VISUAL APOIO ======================== -->
    <div v-else-if="viewMode === 'mapa'" key="mapa" class="space-y-6">
      <!-- Loading Skeleton -->
      <div v-if="loading" class="space-y-4">
        <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm overflow-hidden">
          <div class="p-4 space-y-3">
            <USkeleton class="h-8 w-full" />
            <USkeleton v-for="i in 6" :key="i" class="h-10 w-full" />
          </div>
        </div>
      </div>

      <div v-if="!loading" class="flex items-start gap-3">
        <!-- Tabela principal (semana) -->
        <UCard :ui="{ base: 'overflow-hidden flex-1 min-w-0', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-operacao-200 border-collapse">
              <thead class="bg-operacao-50">
                <tr>
                  <th rowspan="2" class="px-2 py-3 text-left text-xs font-bold text-operacao-900 uppercase tracking-wider border-r border-b w-[140px] max-w-[140px] sticky left-0 bg-operacao-50 z-10">
                    Produto
                  </th>
                  <template v-if="mapaData.length > 0 && mapaData[0].semanas[semanaIndex]">
                    <th v-for="dia in mapaData[0].semanas[semanaIndex].dias" :key="dia.data" colspan="2" class="px-1 py-2 text-center text-[10px] font-bold text-operacao-700 border-r border-b bg-operacao-100/50 uppercase">
                      {{ new Date(dia.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }) }}
                    </th>
                  </template>
                  <!-- Total Semana EN -->
                  <th rowspan="2" class="px-2 py-2 text-center border-b bg-emerald-50/50 w-16">
                    <span class="text-[10px] font-bold text-emerald-800 uppercase">Total EN</span>
                  </th>
                  <!-- Total Semana CMV (sortable) -->
                  <th rowspan="2" class="px-2 py-2 text-center border-b bg-rose-50/50 w-16 cursor-pointer select-none" @click="toggleSort('total')">
                    <div class="flex items-center justify-center gap-0.5">
                      <span class="text-[10px] font-bold text-rose-800 uppercase">Total CMV</span>
                      <UIcon v-if="sortKey === 'total'" :name="sortDir === 'asc' ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'" class="w-3.5 h-3.5 text-operacao-300" />
                    </div>
                  </th>
                </tr>
                <tr>
                  <template v-if="mapaData.length > 0 && mapaData[0].semanas[semanaIndex]">
                    <template v-for="dia in mapaData[0].semanas[semanaIndex].dias" :key="'cols-'+dia.data">
                      <th class="px-1 py-1.5 text-center text-[9px] font-bold text-emerald-600 border-r w-14 bg-emerald-50/40" title="Entradas">EN</th>
                      <th class="px-1 py-1.5 text-center text-[9px] font-bold text-rose-600 border-r w-14 bg-rose-50/40" title="CMV (Consumo)">CMV</th>
                    </template>
                  </template>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-operacao-200">
                <tr v-if="mapaFiltered.length === 0">
                  <td :colspan="100" class="px-3 py-8 text-center text-operacao-400">Nenhum dado encontrado</td>
                </tr>
                <tr v-for="item in mapaPaginatedItems" :key="item.produto_id" class="h-[38px] hover:bg-operacao-50/40 transition-colors">
                  <td class="px-2 py-2.5 text-xs font-medium text-operacao-800 border-r truncate w-[140px] max-w-[140px] sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]" :title="item.produto">
                    {{ item.produto }} <span class="text-[10px] text-operacao-400 font-normal">({{ item.unidade }})</span>
                  </td>
                  <template v-if="item.semanas[semanaIndex]">
                    <template v-for="dia in item.semanas[semanaIndex].dias" :key="dia.data">
                      <td class="px-1 py-2.5 text-[11px] text-center border-r text-emerald-700 tabular-nums">{{ formatQtd(dia.en) }}</td>
                      <td class="px-1 py-2.5 text-[11px] text-center border-r text-rose-700 font-semibold tabular-nums">{{ formatQtd(dia.cmv) }}</td>
                    </template>
                  </template>
                  <!-- Total Semana EN -->
                  <td class="px-1 py-2.5 text-[11px] text-center font-bold text-emerald-800 tabular-nums">{{ formatQtd(getMapaTotalEn(item)) }}</td>
                  <!-- Total Semana CMV -->
                  <td class="px-1 py-2.5 text-[11px] text-center font-bold text-rose-800 tabular-nums">{{ formatQtd(getMapaTotal(item)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <TablePagination
            v-model="page"
            :page-size="pageSize"
            :total-items="mapaFiltered.length"
            @update:page-size="pageSize = $event"
          />
        </UCard>

        <!-- Tabela acumulado mês -->
        <div v-if="mapaPaginatedItems.length > 0" class="shrink-0 rounded-lg ring-1 ring-[#EBEBED] shadow-sm overflow-hidden">
          <table class="divide-y divide-operacao-200 border-collapse">
            <thead class="bg-operacao-50">
              <tr>
                <th colspan="2" class="px-1 py-2 text-center text-[10px] font-bold text-operacao-700 border-b bg-operacao-100/50 uppercase">
                  Acumulado Mês
                </th>
              </tr>
              <tr>
                <th class="px-1 py-1.5 text-center text-[9px] font-bold text-emerald-600 border-r w-14 bg-emerald-50/40 cursor-pointer select-none" @click="toggleSort('acumEn')">
                  <div class="flex items-center justify-center gap-0.5">
                    EN
                    <UIcon v-if="sortKey === 'acumEn'" :name="sortDir === 'asc' ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'" class="w-3 h-3 text-operacao-300" />
                  </div>
                </th>
                <th class="px-1 py-1.5 text-center text-[9px] font-bold text-rose-600 w-14 bg-rose-50/40 cursor-pointer select-none" @click="toggleSort('acumCmv')">
                  <div class="flex items-center justify-center gap-0.5">
                    CMV
                    <UIcon v-if="sortKey === 'acumCmv'" :name="sortDir === 'asc' ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'" class="w-3 h-3 text-operacao-300" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-operacao-200">
              <tr v-for="item in mapaPaginatedItems" :key="'acum-'+item.produto_id" class="h-[38px] hover:bg-operacao-50/40 transition-colors">
                <td class="px-1 py-2.5 text-[11px] text-center font-bold text-emerald-700 border-r tabular-nums">{{ formatQtd(getAcumMesEn(item)) }}</td>
                <td class="px-1 py-2.5 text-[11px] text-center font-bold text-rose-700 tabular-nums">{{ formatQtd(getAcumMesCmv(item)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import type { MapaVisualApoioItem, PosicaoEstoqueItem } from '~/types'

// ======================== TOOLBAR UI ========================
const toolbarInputUi = { color: { white: { outline: 'shadow-sm bg-white text-gray-900 ring-1 ring-inset ring-[#EBEBED] focus:ring-1 focus:ring-operacao-200 dark:ring-operacao-700' } } }
const toolbarButtonUi = { color: { white: { solid: 'shadow-sm ring-1 ring-inset ring-[#EBEBED] text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-guardian-500 dark:ring-operacao-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800/50' } } }

// ======================== COMPOSABLES ========================
const { empresaId } = useEmpresa()
const { getMapaVisualApoio, getPosicaoApoio } = useRelatorios()
const { formatCurrency } = useFormatters()
const toast = useToast()
const { onTableChange } = useRealtime()

// ======================== VIEW MODE ========================
const viewMode = useState<'posicao' | 'mapa'>('estoque-apoio-viewMode', () => 'posicao')
const viewModeOptions = [
  { key: 'posicao' as const, icon: 'i-heroicons-squares-2x2', label: 'Posição Atual' },
  { key: 'mapa' as const, icon: 'i-heroicons-table-cells', label: 'Mapa Visual' }
]

// Tab sliding indicator
const tabsContainerRef = ref<HTMLElement>()
const tabRefs = reactive<Record<string, HTMLElement>>({})
const tabIndicatorStyle = computed(() => {
  const el = tabRefs[viewMode.value]
  if (!el || !tabsContainerRef.value) return { left: '0px', width: '0px' }
  const containerRect = tabsContainerRef.value.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  return {
    left: `${elRect.left - containerRect.left}px`,
    width: `${elRect.width}px`
  }
})

// ======================== SHARED STATE ========================
const search = useState('estoque-apoio-search', () => '')

// ======================== POSIÇÃO ATUAL ========================
const posicaoData = ref<PosicaoEstoqueItem[]>([])
const posicaoLoading = ref(false)
const posicaoSortKey = useState<'produto' | 'saldo' | 'valor_estoque'>('estoque-apoio-pos-sortKey', () => 'saldo')
const posicaoSortDir = useState<'asc' | 'desc'>('estoque-apoio-pos-sortDir', () => 'desc')
const posicaoPage = useState('estoque-apoio-pos-page', () => 1)
const posicaoPageSize = useState('estoque-apoio-pos-pageSize', () => 10)

const posicaoValorTotal = computed(() =>
  posicaoData.value.reduce((sum, i) => sum + i.valor_estoque, 0)
)

const posicaoFiltered = computed(() => {
  const term = search.value.toLowerCase()
  if (!term) return posicaoData.value
  return posicaoData.value.filter(p => p.produto.toLowerCase().includes(term))
})

const posicaoSorted = computed(() => {
  const data = [...posicaoFiltered.value]
  const key = posicaoSortKey.value
  const dir = posicaoSortDir.value === 'asc' ? 1 : -1
  return data.sort((a, b) => {
    if (key === 'produto') return dir * a.produto.localeCompare(b.produto, 'pt-BR')
    return dir * ((a[key] || 0) - (b[key] || 0))
  })
})

const posicaoPaginated = computed(() => {
  const start = (posicaoPage.value - 1) * posicaoPageSize.value
  return posicaoSorted.value.slice(start, start + posicaoPageSize.value)
})

const togglePosicaoSort = (key: typeof posicaoSortKey.value) => {
  if (posicaoSortKey.value === key) {
    posicaoSortDir.value = posicaoSortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    posicaoSortKey.value = key
    posicaoSortDir.value = key === 'produto' ? 'asc' : 'desc'
  }
  posicaoPage.value = 1
}

const loadPosicao = async () => {
  posicaoLoading.value = true
  try {
    posicaoData.value = await getPosicaoApoio()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar posição de apoio', color: 'red' })
  } finally {
    posicaoLoading.value = false
  }
}

const formatQtd = (value: number | null | undefined) => {
  if (value === null || value === undefined || value === 0) return '-'
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

// ======================== MAPA VISUAL ========================
const loading = ref(false)
const mapaData = ref<MapaVisualApoioItem[]>([])
const semanaIndex = useState('estoque-apoio-semanaIndex', () => 0)

// Month/Year picker
const hoje = new Date()
const selectedMes = useState('estoque-apoio-mes', () => hoje.getMonth() + 1)
const selectedAno = useState('estoque-apoio-ano', () => hoje.getFullYear())
const pickerAno = useState('estoque-apoio-pickerAno', () => hoje.getFullYear())
const mesesNomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const mesAnoLabel = computed(() => `${mesesNomes[selectedMes.value - 1]} ${selectedAno.value}`)
const selectMesAno = (mes: number, ano: number) => {
  selectedMes.value = mes
  selectedAno.value = ano
}

// Mapa pagination
const page = useState('estoque-apoio-mapa-page', () => 1)
const pageSize = useState('estoque-apoio-mapa-pageSize', () => 10)

// Mapa sort
const sortKey = useState<'produto' | 'total' | 'acumEn' | 'acumCmv'>('estoque-apoio-mapa-sortKey', () => 'total')
const sortDir = useState<'asc' | 'desc'>('estoque-apoio-mapa-sortDir', () => 'desc')
const toggleSort = (key: typeof sortKey.value) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'produto' ? 'asc' : 'desc'
  }
  page.value = 1
}

const mapaFiltered = computed(() => {
  const term = search.value.toLowerCase()
  if (!term) return mapaData.value
  return mapaData.value.filter(p => p.produto.toLowerCase().includes(term))
})

const getMapaTotal = (item: MapaVisualApoioItem) => {
  const semana = item.semanas[semanaIndex.value]
  if (!semana) return 0
  return semana.dias.reduce((sum, dia) => sum + (dia.cmv || 0), 0)
}

const getMapaTotalEn = (item: MapaVisualApoioItem) => {
  const semana = item.semanas[semanaIndex.value]
  if (!semana) return 0
  return semana.dias.reduce((sum, dia) => sum + (dia.en || 0), 0)
}

const getAcumMesEn = (item: MapaVisualApoioItem) => {
  return item.semanas.reduce((total, sem) => total + sem.dias.reduce((sum, dia) => sum + (dia.en || 0), 0), 0)
}

const getAcumMesCmv = (item: MapaVisualApoioItem) => {
  return item.semanas.reduce((total, sem) => total + sem.dias.reduce((sum, dia) => sum + (dia.cmv || 0), 0), 0)
}

// ======================== HEATMAP ========================
const heatmapMaxEn = computed(() => {
  const items = mapaPaginatedItems.value
  if (!items.length) return 0
  let max = 0
  for (const item of items) {
    const semana = item.semanas[semanaIndex.value]
    if (!semana) continue
    for (const dia of semana.dias) {
      if ((dia.en || 0) > max) max = dia.en
    }
  }
  return max
})

const heatmapMaxCmv = computed(() => {
  const items = mapaPaginatedItems.value
  if (!items.length) return 0
  let max = 0
  for (const item of items) {
    const semana = item.semanas[semanaIndex.value]
    if (!semana) continue
    for (const dia of semana.dias) {
      if ((dia.cmv || 0) > max) max = dia.cmv
    }
  }
  return max
})

const heatmapMaxTotalEn = computed(() => {
  const items = mapaPaginatedItems.value
  if (!items.length) return 0
  return Math.max(...items.map(i => getMapaTotalEn(i)), 0)
})

const heatmapMaxTotalCmv = computed(() => {
  const items = mapaPaginatedItems.value
  if (!items.length) return 0
  return Math.max(...items.map(i => getMapaTotal(i)), 0)
})

const heatmapStyle = (value: number | null | undefined, max: number, type: 'en' | 'cmv') => {
  const v = value || 0
  if (v === 0 || max === 0) return {}
  const opacity = (v / max) * 0.35
  const color = type === 'en' ? `rgba(16, 185, 129, ${opacity})` : `rgba(244, 63, 94, ${opacity})`
  return { backgroundColor: color }
}

const mapaSorted = computed(() => {
  const data = [...mapaFiltered.value]
  const key = sortKey.value
  const dir = sortDir.value === 'asc' ? 1 : -1
  return data.sort((a, b) => {
    if (key === 'produto') return dir * a.produto.localeCompare(b.produto, 'pt-BR')
    if (key === 'acumEn') return dir * (getAcumMesEn(a) - getAcumMesEn(b))
    if (key === 'acumCmv') return dir * (getAcumMesCmv(a) - getAcumMesCmv(b))
    return dir * (getMapaTotal(a) - getMapaTotal(b))
  })
})

const mapaPaginatedItems = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return mapaSorted.value.slice(start, start + pageSize.value)
})

const loadMapa = async () => {
  try {
    loading.value = true
    mapaData.value = await getMapaVisualApoio(selectedAno.value, selectedMes.value)
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar estoque apoio', color: 'red' })
  } finally {
    loading.value = false
  }
}

// ======================== WATCHERS ========================
watch(viewMode, (modo) => {
  if (modo === 'mapa' && mapaData.value.length === 0) loadMapa()
})

watch([selectedMes, selectedAno], () => {
  semanaIndex.value = 0
  loadMapa()
})

// Realtime
onTableChange(['entradas', 'saidas', 'ajustes', 'produtos'], () => {
  if (viewMode.value === 'posicao') loadPosicao()
  else loadMapa()
})

const loadAll = () => {
  if (viewMode.value === 'posicao') loadPosicao()
  else loadMapa()
}

watch(empresaId, () => {
  if (empresaId.value) {
    loadPosicao()
    if (viewMode.value === 'mapa') loadMapa()
  }
}, { immediate: true })
</script>

<style scoped>
.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.view-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.view-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
