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
        <USelect v-model="selectedAno" :options="anosOptions" class="w-full sm:w-32" :ui="toolbarInputUi" />
        <USelect v-model="selectedMes" :options="mesesOptions" class="w-full sm:w-40" :ui="toolbarInputUi" />

        <!-- Filtro ABC Estoque -->
        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton color="white" class="w-full sm:w-auto justify-between" trailing-icon="i-heroicons-chevron-down-20-solid" :ui="toolbarButtonUi">
            <span class="truncate text-left font-normal"><span class="text-operacao-400">ABC Est.:</span> <span class="text-gray-900">{{ filterClasseEstoqueLabel }}</span></span>
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
            <span class="truncate text-left font-normal"><span class="text-operacao-400">ABC Cons.:</span> <span class="text-gray-900">{{ filterClasseCMVLabel }}</span></span>
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

        <UInput v-model="search" placeholder="Buscar produto..." icon="i-heroicons-magnifying-glass" class="w-full sm:w-44" :ui="toolbarInputUi" />
      </div>

      <UButton variant="ghost" color="gray" size="sm" :icon="showLegend ? 'i-heroicons-information-circle-solid' : 'i-heroicons-information-circle'" @click="showLegend = !showLegend" />
    </div>

    <!-- Legenda colapsável -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <UCard v-if="showLegend" :ui="{ ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm', body: { padding: 'px-5 py-4' } }">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div class="flex items-start gap-2.5 p-2.5 bg-controle-50 rounded-lg">
            <UBadge color="green" class="mt-0.5 shrink-0">Equilibrado</UBadge>
            <p class="text-xs text-controle-700">Mesma classe em estoque e consumo. Estoque alinhado.</p>
          </div>
          <div class="flex items-start gap-2.5 p-2.5 bg-red-50 rounded-lg">
            <UBadge color="red" class="mt-0.5 shrink-0">Excessivo</UBadge>
            <p class="text-xs text-red-700">Classe A em estoque + C em consumo. Capital parado.</p>
          </div>
          <div class="flex items-start gap-2.5 p-2.5 bg-orange-50 rounded-lg">
            <UBadge color="orange" class="mt-0.5 shrink-0">Ruptura</UBadge>
            <p class="text-xs text-orange-700">Classe C em estoque + A em consumo. Risco de falta.</p>
          </div>
          <div class="flex items-start gap-2.5 p-2.5 bg-alerta-50 rounded-lg">
            <UBadge color="yellow" class="mt-0.5 shrink-0">Atenção</UBadge>
            <p class="text-xs text-yellow-700">Diferença de 1 classe. Merece monitoramento.</p>
          </div>
        </div>
      </UCard>
    </Transition>

    <!-- Tabela Unificada -->
    <UCard :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
      <UTable :columns="columns" :rows="paginated" :loading="loading" :ui="{
        divide: 'divide-y divide-operacao-50 dark:divide-operacao-700',
        thead: '',
        th: { base: 'bg-operacao-100/70 dark:bg-operacao-800 border-b border-operacao-200/60 [&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66]', color: 'text-[#5a5a66] dark:text-operacao-400', font: 'font-medium', size: 'text-xs uppercase tracking-wider', padding: 'px-4 py-2' },
        td: { color: 'text-operacao-600 dark:text-operacao-200', size: 'text-sm', padding: 'px-4 py-2.5' }
      }">
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-operacao-400">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhum registro encontrado</p>
          </div>
        </template>

        <template #produto-data="{ row }">
          <span class="font-medium">{{ row.produto }}</span>
        </template>
        <template #categoria-data="{ row }">
          <UBadge color="blue" variant="soft">{{ row.categoria || '-' }}</UBadge>
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
const showLegend = ref(false)

// Colunas
const columns = [
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'categoria', label: 'Categoria' },
  { key: 'valor_estoque', label: 'Vlr Estoque (mês)', sortable: true },
  { key: 'classe_estoque', label: 'ABC Est.', sortable: true },
  { key: 'valor_cmv', label: 'Vlr Consumo (3m)', sortable: true },
  { key: 'classe_cmv', label: 'ABC Cons.', sortable: true },
  { key: 'status', label: 'Status', sortable: true }
]

// Opções de filtro
const classeOptions = [
  { label: 'Todas', value: '' },
  { label: 'Classe A', value: 'A' },
  { label: 'Classe B', value: 'B' },
  { label: 'Classe C', value: 'C' }
]

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Equilibrado', value: 'EQUILIBRADO' },
  { label: 'Estoque Excessivo', value: 'ESTOQUE_EXCESSIVO' },
  { label: 'Risco de Ruptura', value: 'RISCO_RUPTURA' },
  { label: 'Atenção', value: 'ATENÇÃO' }
]

const anosOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    label: String(currentYear - 2 + i),
    value: currentYear - 2 + i
  }))
})

const mesesOptions = [
  { label: 'Janeiro', value: 1 },
  { label: 'Fevereiro', value: 2 },
  { label: 'Março', value: 3 },
  { label: 'Abril', value: 4 },
  { label: 'Maio', value: 5 },
  { label: 'Junho', value: 6 },
  { label: 'Julho', value: 7 },
  { label: 'Agosto', value: 8 },
  { label: 'Setembro', value: 9 },
  { label: 'Outubro', value: 10 },
  { label: 'Novembro', value: 11 },
  { label: 'Dezembro', value: 12 }
]

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
    result = result.filter(r => r.produto.toLowerCase().includes(term) || r.categoria.toLowerCase().includes(term))
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

watch(empresaId, () => {
  if (empresaId.value) {
    loadData()
  }
}, { immediate: true })
</script>
