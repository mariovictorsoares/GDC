<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-[#5a5a66] mb-2">Curva ABC</h1>

    <!-- Resumo por Status -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full bg-controle-400" />
          <span class="text-[11px] font-medium text-operacao-400">Equilibrado</span>
        </div>
        <p class="text-base font-bold text-controle-600">{{ statusCount.EQUILIBRADO }}</p>
        <p class="text-[11px] text-operacao-400 mt-0.5">Estoque alinhado ao consumo</p>
      </div>
      <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span class="text-[11px] font-medium text-operacao-400">Estoque Excessivo</span>
        </div>
        <p class="text-base font-bold text-red-600">{{ statusCount.ESTOQUE_EXCESSIVO }}</p>
        <p class="text-[11px] text-operacao-400 mt-0.5">A em estoque, C em consumo</p>
      </div>
      <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full bg-orange-400" />
          <span class="text-[11px] font-medium text-operacao-400">Risco de Ruptura</span>
        </div>
        <p class="text-base font-bold text-orange-600">{{ statusCount.RISCO_RUPTURA }}</p>
        <p class="text-[11px] text-operacao-400 mt-0.5">C em estoque, A em consumo</p>
      </div>
      <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full bg-alerta-400" />
          <span class="text-[11px] font-medium text-operacao-400">Atenção</span>
        </div>
        <p class="text-base font-bold text-alerta-600">{{ statusCount['ATENÇÃO'] }}</p>
        <p class="text-[11px] text-operacao-400 mt-0.5">Diferença de 1 classe</p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
      <div class="flex flex-col sm:flex-row flex-wrap gap-3 flex-1 min-w-0">
        <UInput v-model="search" placeholder="Buscar produto..." icon="i-heroicons-magnifying-glass" class="w-full sm:w-44" :ui="toolbarInputUi" />

        <!-- Seletor Mês/Ano -->
        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton
            color="white"
            class="w-full sm:w-auto justify-between"
            :ui="toolbarButtonUi"
          >
            <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-operacao-400 mr-2" />
            <span class="text-sm font-normal text-gray-900 capitalize">{{ mesAnoLabel }}</span>
          </UButton>
          <template #panel="{ close }">
            <div class="w-64 p-3">
              <!-- Header com navegação de ano -->
              <div class="flex items-center justify-between mb-3">
                <button class="p-1 rounded hover:bg-operacao-100 transition-colors" @click="pickerAno--">
                  <UIcon name="i-heroicons-chevron-left-20-solid" class="w-4 h-4 text-operacao-500" />
                </button>
                <span class="text-sm font-semibold text-gray-700">{{ pickerAno }}</span>
                <button class="p-1 rounded hover:bg-operacao-100 transition-colors" @click="pickerAno++">
                  <UIcon name="i-heroicons-chevron-right-20-solid" class="w-4 h-4 text-operacao-500" />
                </button>
              </div>
              <!-- Grid de meses -->
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="(nome, idx) in mesesNomes"
                  :key="idx"
                  class="px-2 py-1.5 text-sm rounded-md transition-colors capitalize"
                  :class="selectedMes === idx + 1 && selectedAno === pickerAno
                    ? 'bg-guardian-600 text-white font-medium'
                    : 'text-operacao-600 hover:bg-operacao-50'"
                  @click="selectMesAno(idx + 1, pickerAno); close()"
                >
                  {{ nome }}
                </button>
              </div>
            </div>
          </template>
        </UPopover>

        <!-- Filtro ABC Estoque -->
        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton color="white" class="w-full sm:w-auto justify-between" trailing-icon="i-heroicons-chevron-down-20-solid" :ui="toolbarButtonUi">
            <span class="truncate text-left font-normal"><span class="text-operacao-400">ABC Estoque:</span> <span class="text-gray-900">{{ filterClasseEstoqueLabel }}</span></span>
          </UButton>
          <template #panel="{ close }">
            <div class="w-44 py-1">
              <button v-for="opt in classeOptions" :key="opt.value" class="w-full text-left px-3 py-1.5 text-sm rounded transition-colors" :class="filterClasseEstoque === opt.value ? 'text-guardian-600 font-medium bg-guardian-50' : 'text-operacao-600 hover:bg-operacao-50'" @click="filterClasseEstoque = opt.value; close()">{{ opt.label }}</button>
            </div>
          </template>
        </UPopover>

        <!-- Filtro ABC Consumo -->
        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton color="white" class="w-full sm:w-auto justify-between" trailing-icon="i-heroicons-chevron-down-20-solid" :ui="toolbarButtonUi">
            <span class="truncate text-left font-normal"><span class="text-operacao-400">ABC Consumo:</span> <span class="text-gray-900">{{ filterClasseCMVLabel }}</span></span>
          </UButton>
          <template #panel="{ close }">
            <div class="w-44 py-1">
              <button v-for="opt in classeOptions" :key="opt.value" class="w-full text-left px-3 py-1.5 text-sm rounded transition-colors" :class="filterClasseCMV === opt.value ? 'text-guardian-600 font-medium bg-guardian-50' : 'text-operacao-600 hover:bg-operacao-50'" @click="filterClasseCMV = opt.value; close()">{{ opt.label }}</button>
            </div>
          </template>
        </UPopover>

        <!-- Filtro Status -->
        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton color="white" class="w-full sm:w-auto justify-between" trailing-icon="i-heroicons-chevron-down-20-solid" :ui="toolbarButtonUi">
            <span class="truncate text-left font-normal"><span class="text-operacao-400">Status:</span> <span class="text-gray-900">{{ filterStatusLabel }}</span></span>
          </UButton>
          <template #panel="{ close }">
            <div class="w-52 py-1">
              <button v-for="opt in statusOptions" :key="opt.value" class="w-full text-left px-3 py-1.5 text-sm rounded transition-colors" :class="filterStatus === opt.value ? 'text-guardian-600 font-medium bg-guardian-50' : 'text-operacao-600 hover:bg-operacao-50'" @click="filterStatus = opt.value; close()">{{ opt.label }}</button>
            </div>
          </template>
        </UPopover>

      </div>

      <UPopover :popper="{ placement: 'bottom-end' }">
        <UButton variant="ghost" color="gray" size="sm" icon="i-heroicons-information-circle" />
        <template #panel>
          <div class="w-56 p-3 space-y-2.5">
            <p class="text-[11px] font-semibold text-operacao-400 uppercase tracking-wider">Legenda de Status</p>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-controle-400 shrink-0" />
              <span class="text-xs text-gray-700"><span class="font-medium">Equilibrado</span> — mesma curva</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span class="text-xs text-gray-700"><span class="font-medium">Excessivo</span> — A est. + C cons.</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
              <span class="text-xs text-gray-700"><span class="font-medium">Ruptura</span> — C est. + A cons.</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-alerta-400 shrink-0" />
              <span class="text-xs text-gray-700"><span class="font-medium">Atenção</span> — diferença de 1 curva</span>
            </div>
          </div>
        </template>
      </UPopover>
    </div>

    <!-- Tabela Unificada -->
    <UCard :ui="{ base: 'overflow-x-auto', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
      <UTable :columns="columns" :rows="paginated" :loading="loading" :ui="{
        divide: 'divide-y divide-operacao-50 dark:divide-operacao-700',
        thead: '',
        th: { base: 'bg-operacao-100/70 dark:bg-operacao-800 border-b border-operacao-200/60 [&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66] [&_button>span+span]:text-operacao-300 [&_button>span+span]:!w-3.5 [&_button>span+span]:!h-3.5', color: 'text-[#5a5a66] dark:text-operacao-400', font: 'font-medium', size: 'text-xs uppercase tracking-wider', padding: 'px-4 py-2' },
        td: { color: 'text-operacao-600 dark:text-operacao-200', size: 'text-sm', padding: 'px-4 py-2.5' }
      }">
        <template #valor_estoque-header="{ column, sort, onSort }">
          <div class="group/tip relative">
            <button class="flex items-center gap-1" @click="onSort(column)">
              {{ column.label }}
              <UIcon :name="sort.column === column.key ? (sort.direction === 'asc' ? 'i-heroicons-bars-arrow-up-20-solid' : 'i-heroicons-bars-arrow-down-20-solid') : 'i-heroicons-arrows-up-down-20-solid'" class="w-3.5 h-3.5" :class="sort.column === column.key ? 'text-guardian-500' : 'text-operacao-300'" />
            </button>
            <div class="pointer-events-none invisible opacity-0 group-hover/tip:visible group-hover/tip:opacity-100 transition-all duration-150 absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-56 bg-white rounded-lg shadow-lg ring-1 ring-[#EBEBED] px-3 py-2.5">
              <p class="text-xs text-gray-600 font-normal normal-case tracking-normal">Valor em estoque no fim do mês (qtd × custo última entrada)</p>
            </div>
          </div>
        </template>
        <template #classe_estoque-header="{ column, sort, onSort }">
          <div class="group/tip relative">
            <button class="flex items-center gap-1" @click="onSort(column)">
              {{ column.label }}
              <UIcon :name="sort.column === column.key ? (sort.direction === 'asc' ? 'i-heroicons-bars-arrow-up-20-solid' : 'i-heroicons-bars-arrow-down-20-solid') : 'i-heroicons-arrows-up-down-20-solid'" class="w-3.5 h-3.5" :class="sort.column === column.key ? 'text-guardian-500' : 'text-operacao-300'" />
            </button>
            <div class="pointer-events-none invisible opacity-0 group-hover/tip:visible group-hover/tip:opacity-100 transition-all duration-150 absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-64 bg-white rounded-lg shadow-lg ring-1 ring-[#EBEBED] px-3 py-2.5">
              <p class="text-xs text-gray-600 font-normal normal-case tracking-normal">Classificação ABC por valor de estoque: A (50%), B (30%), C (20%)</p>
            </div>
          </div>
        </template>
        <template #valor_cmv-header="{ column, sort, onSort }">
          <div class="group/tip relative">
            <button class="flex items-center gap-1" @click="onSort(column)">
              {{ column.label }}
              <UIcon :name="sort.column === column.key ? (sort.direction === 'asc' ? 'i-heroicons-bars-arrow-up-20-solid' : 'i-heroicons-bars-arrow-down-20-solid') : 'i-heroicons-arrows-up-down-20-solid'" class="w-3.5 h-3.5" :class="sort.column === column.key ? 'text-guardian-500' : 'text-operacao-300'" />
            </button>
            <div class="pointer-events-none invisible opacity-0 group-hover/tip:visible group-hover/tip:opacity-100 transition-all duration-150 absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-60 bg-white rounded-lg shadow-lg ring-1 ring-[#EBEBED] px-3 py-2.5">
              <p class="text-xs text-gray-600 font-normal normal-case tracking-normal">Valor total das saídas no mês selecionado (todos os tipos)</p>
            </div>
          </div>
        </template>
        <template #classe_cmv-header="{ column, sort, onSort }">
          <div class="group/tip relative">
            <button class="flex items-center gap-1" @click="onSort(column)">
              {{ column.label }}
              <UIcon :name="sort.column === column.key ? (sort.direction === 'asc' ? 'i-heroicons-bars-arrow-up-20-solid' : 'i-heroicons-bars-arrow-down-20-solid') : 'i-heroicons-arrows-up-down-20-solid'" class="w-3.5 h-3.5" :class="sort.column === column.key ? 'text-guardian-500' : 'text-operacao-300'" />
            </button>
            <div class="pointer-events-none invisible opacity-0 group-hover/tip:visible group-hover/tip:opacity-100 transition-all duration-150 absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-64 bg-white rounded-lg shadow-lg ring-1 ring-[#EBEBED] px-3 py-2.5">
              <p class="text-xs text-gray-600 font-normal normal-case tracking-normal">Classificação ABC por valor de consumo: A (50%), B (30%), C (20%)</p>
            </div>
          </div>
        </template>
        <template #status-header="{ column, sort, onSort }">
          <div class="group/tip relative">
            <button class="flex items-center gap-1" @click="onSort(column)">
              {{ column.label }}
              <UIcon :name="sort.column === column.key ? (sort.direction === 'asc' ? 'i-heroicons-bars-arrow-up-20-solid' : 'i-heroicons-bars-arrow-down-20-solid') : 'i-heroicons-arrows-up-down-20-solid'" class="w-3.5 h-3.5" :class="sort.column === column.key ? 'text-guardian-500' : 'text-operacao-300'" />
            </button>
            <div class="pointer-events-none invisible opacity-0 group-hover/tip:visible group-hover/tip:opacity-100 transition-all duration-150 absolute top-full right-0 mt-2 z-50 w-56 bg-white rounded-lg shadow-lg ring-1 ring-[#EBEBED] px-3 py-2.5">
              <p class="text-xs text-gray-600 font-normal normal-case tracking-normal">Cruzamento entre curva de estoque e consumo</p>
            </div>
          </div>
        </template>

        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-operacao-400">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhum registro encontrado</p>
          </div>
        </template>

        <template #produto-data="{ row }">
          <span class="font-medium">{{ row.produto }}</span>
        </template>
        <template #valor_estoque-data="{ row }">
          {{ formatCurrency(row.valor_estoque) }}
        </template>
        <template #classe_estoque-data="{ row }">
          <UBadge :color="getClasseBadgeColor(row.classe_estoque)">{{ row.classe_estoque }}</UBadge>
        </template>
        <template #valor_cmv-data="{ row }">
          <span class="text-red-600 font-medium">{{ formatCurrency(row.valor_cmv) }}</span>
        </template>
        <template #classe_cmv-data="{ row }">
          <UBadge :color="getClasseBadgeColor(row.classe_cmv)">{{ row.classe_cmv }}</UBadge>
        </template>
        <template #status-data="{ row }">
          <UBadge :color="getStatusColor(row.status)">{{ formatStatus(row.status) }}</UBadge>
        </template>
      </UTable>
      <TablePagination
        v-model="page"
        :page-size="pageSize"
        :total-items="filtered.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { ComparativoABC } from '~/types'

const toolbarInputUi = { color: { white: { outline: 'shadow-sm bg-white text-gray-900 ring-1 ring-inset ring-[#EBEBED] focus:ring-1 focus:ring-operacao-200 dark:ring-operacao-700' } } }
const toolbarButtonUi = { color: { white: { solid: 'shadow-sm ring-1 ring-inset ring-[#EBEBED] text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-guardian-500 dark:ring-operacao-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800/50' } } }


const { getComparativoABC } = useRelatorios()
const { empresaId } = useEmpresa()
const toast = useToast()
const { formatCurrency } = useFormatters()

// Estado
const loading = ref(false)
const data = ref<ComparativoABC[]>([])
const search = ref('')
const filterClasseEstoque = ref('')
const filterClasseCMV = ref('')
const filterStatus = ref('')
const selectedAno = ref(new Date().getFullYear())
const selectedMes = ref(new Date().getMonth() + 1)
const page = ref(1)
const pageSize = ref(20)


// Colunas
const columns = [
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'valor_estoque', label: 'Vlr Estoque', sortable: true },
  { key: 'classe_estoque', label: 'ABC Estoque', sortable: true },
  { key: 'valor_cmv', label: 'Vlr Consumo', sortable: true },
  { key: 'classe_cmv', label: 'ABC Consumo', sortable: true },
  { key: 'status', label: 'Status', sortable: true }
]

// Opções de filtro
const classeOptions = [
  { label: 'Todas', value: '' },
  { label: 'Curva A', value: 'A' },
  { label: 'Curva B', value: 'B' },
  { label: 'Curva C', value: 'C' }
]

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Equilibrado', value: 'EQUILIBRADO' },
  { label: 'Estoque Excessivo', value: 'ESTOQUE_EXCESSIVO' },
  { label: 'Risco de Ruptura', value: 'RISCO_RUPTURA' },
  { label: 'Atenção', value: 'ATENÇÃO' }
]

// Picker Mês/Ano
const pickerAno = ref(new Date().getFullYear())
const mesesNomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const mesAnoLabel = computed(() => {
  return `${mesesNomes[selectedMes.value - 1]} ${selectedAno.value}`
})

const selectMesAno = (mes: number, ano: number) => {
  selectedMes.value = mes
  selectedAno.value = ano
}

// Labels dos filtros
const filterClasseEstoqueLabel = computed(() => {
  const opt = classeOptions.find(o => o.value === filterClasseEstoque.value)
  return opt?.label || 'Todas'
})

const filterClasseCMVLabel = computed(() => {
  const opt = classeOptions.find(o => o.value === filterClasseCMV.value)
  return opt?.label || 'Todas'
})

const filterStatusLabel = computed(() => {
  const opt = statusOptions.find(o => o.value === filterStatus.value)
  return opt?.label || 'Todos'
})

// Filtro unificado
const filtered = computed(() => {
  let result = data.value
  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(r => r.produto.toLowerCase().includes(term))
  }
  if (filterClasseEstoque.value) {
    result = result.filter(r => r.classe_estoque === filterClasseEstoque.value)
  }
  if (filterClasseCMV.value) {
    result = result.filter(r => r.classe_cmv === filterClasseCMV.value)
  }
  if (filterStatus.value) {
    result = result.filter(r => r.status === filterStatus.value)
  }
  return result
})

// Paginação
const paginated = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

// Contagem de status (dados não filtrados)
const statusCount = computed(() => {
  const counts: Record<string, number> = {
    EQUILIBRADO: 0,
    ESTOQUE_EXCESSIVO: 0,
    RISCO_RUPTURA: 0,
    'ATENÇÃO': 0
  }
  data.value.forEach(c => {
    if (counts[c.status] !== undefined) {
      counts[c.status]++
    }
  })
  return counts
})

// Reset página ao filtrar
watch([search, filterClasseEstoque, filterClasseCMV, filterStatus], () => {
  page.value = 1
})

// Helpers
const getClasseBadgeColor = (classe: string) => {
  if (classe === 'A') return 'green'
  if (classe === 'B') return 'yellow'
  return 'gray'
}

const getStatusColor = (status: string) => {
  if (status === 'EQUILIBRADO') return 'green'
  if (status === 'ESTOQUE_EXCESSIVO') return 'red'
  if (status === 'RISCO_RUPTURA') return 'orange'
  return 'yellow'
}

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    'EQUILIBRADO': 'Equilibrado',
    'ESTOQUE_EXCESSIVO': 'Estoque Excessivo',
    'RISCO_RUPTURA': 'Risco Ruptura',
    'ATENÇÃO': 'Atenção'
  }
  return map[status] || status
}

// Carregamento
const loadData = async () => {
  try {
    loading.value = true
    data.value = await getComparativoABC(selectedAno.value, selectedMes.value)
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar dados',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

watch([selectedAno, selectedMes], () => {
  loadData()
})

// Realtime - relatórios dependem de movimentos e produtos
const { onTableChange } = useRealtime()
onTableChange(['produtos', 'entradas', 'saidas', 'ajustes', 'custos_mensais'], () => loadData())

watch(empresaId, () => {
  if (empresaId.value) {
    loadData()
  }
}, { immediate: true })
</script>
