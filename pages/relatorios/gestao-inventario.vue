<template>
  <div class="space-y-6">
    <!-- Header -->
    <h1 class="text-2xl font-semibold text-[#5a5a66] pb-4">Inventário</h1>

    <!-- Cards Resumo -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span class="text-[11px] font-medium text-operacao-400">Estoque Inicial</span>
        </div>
        <p class="text-base font-bold text-guardian-600">{{ formatCurrency(totais.ei_valor) }}</p>
        <p class="text-[11px] text-operacao-400 mt-0.5">{{ formatNumber(totais.ei_quantidade) }} itens</p>
      </div>
      <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full bg-controle-400" />
          <span class="text-[11px] font-medium text-operacao-400">Estoque Final</span>
        </div>
        <p class="text-base font-bold text-controle-600">{{ formatCurrency(totais.ef_valor) }}</p>
        <p class="text-[11px] text-operacao-400 mt-0.5">{{ formatNumber(totais.ef_quantidade) }} itens</p>
      </div>
      <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full" :class="totais.variacao_valor >= 0 ? 'bg-emerald-400' : 'bg-red-400'" />
          <span class="text-[11px] font-medium text-operacao-400">Variação (Valor)</span>
        </div>
        <p class="text-base font-bold" :class="totais.variacao_valor >= 0 ? 'text-emerald-600' : 'text-red-600'">
          {{ totais.variacao_valor >= 0 ? '+' : '' }}{{ formatCurrency(totais.variacao_valor) }}
        </p>
        <p class="text-[11px] text-operacao-400 mt-0.5">EF - EI</p>
      </div>
      <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span class="text-[11px] font-medium text-operacao-400">Total Produtos</span>
        </div>
        <p class="text-base font-bold text-purple-600">{{ dados.length }}</p>
        <p class="text-[11px] text-operacao-400 mt-0.5">com estoque</p>
      </div>
      <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span class="text-[11px] font-medium text-operacao-400">Sem Movimentação</span>
        </div>
        <p class="text-base font-bold text-amber-600">{{ totalSemMovimentacao }}</p>
        <p class="text-[11px] text-operacao-400 mt-0.5">produtos parados</p>
      </div>
    </div>

    <!-- Filtros -->
    <div class="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
      <div class="flex flex-col sm:flex-row flex-wrap items-center gap-3 flex-1 min-w-0">
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

        <!-- Filtro Grupo/Subgrupo expansível -->
        <UPopover v-model:open="categoriaPopoverOpen" :popper="{ placement: 'bottom-start' }">
          <UButton
            color="white"
            class="w-full sm:w-52 justify-between"
            trailing-icon="i-heroicons-chevron-down-20-solid"
            :ui="toolbarButtonUi"
          >
            <span class="truncate text-left font-normal"><span class="text-operacao-400">Grupo:</span> <span class="text-gray-900">{{ filterCategoriaLabel }}</span></span>
          </UButton>

          <template #panel>
            <div class="w-64 max-h-72 overflow-y-auto py-1">
              <!-- Todos -->
              <button
                class="w-full text-left px-3 py-1.5 text-sm rounded transition-colors"
                :class="!filterCategoria ? 'text-guardian-600 font-medium bg-guardian-50' : 'text-operacao-600 hover:bg-operacao-50'"
                @click="selectCategoria('')"
              >
                Todos
              </button>

              <!-- Grupos expansíveis -->
              <div v-for="grupo in grupos" :key="grupo.id">
                <div class="flex items-center">
                  <button
                    class="p-1 rounded hover:bg-operacao-100 transition-colors"
                    @click.stop="toggleGrupoExpand(grupo.id)"
                  >
                    <UIcon
                      :name="expandedGrupos.has(grupo.id) ? 'i-heroicons-chevron-down-20-solid' : 'i-heroicons-chevron-right-20-solid'"
                      class="w-3.5 h-3.5 text-operacao-400"
                    />
                  </button>
                  <button
                    class="flex-1 text-left px-2 py-1.5 text-sm rounded transition-colors"
                    :class="filterCategoria === `g:${grupo.id}` ? 'text-guardian-600 font-medium bg-guardian-50' : 'text-operacao-700 hover:bg-operacao-50'"
                    @click="selectCategoria(`g:${grupo.id}`)"
                  >
                    {{ grupo.nome }}
                  </button>
                </div>

                <!-- Subgrupos -->
                <div v-if="expandedGrupos.has(grupo.id)" class="ml-2">
                  <button
                    v-for="sub in subgruposDe(grupo.id)"
                    :key="sub.id"
                    class="w-full text-left pl-7 pr-3 py-1.5 text-sm rounded transition-colors"
                    :class="filterCategoria === `s:${sub.id}` ? 'text-guardian-600 font-medium bg-guardian-50' : 'text-operacao-500 hover:bg-operacao-50'"
                    @click="selectCategoria(`s:${sub.id}`)"
                  >
                    {{ sub.nome }}
                  </button>
                </div>
              </div>
            </div>
          </template>
        </UPopover>

        <!-- Filtro Movimentação -->
        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton
            color="white"
            class="w-full sm:w-auto justify-between"
            trailing-icon="i-heroicons-chevron-down-20-solid"
            :ui="toolbarButtonUi"
          >
            <span class="truncate text-left font-normal"><span class="text-operacao-400">Mov.:</span> <span class="text-gray-900">{{ filterMovimentacaoLabel }}</span></span>
          </UButton>
          <template #panel="{ close }">
            <div class="w-48 py-1">
              <button
                v-for="opt in movimentacaoOptions"
                :key="opt.value"
                class="w-full text-left px-3 py-1.5 text-sm rounded transition-colors"
                :class="filterMovimentacao === opt.value ? 'text-guardian-600 font-medium bg-guardian-50' : 'text-operacao-600 hover:bg-operacao-50'"
                @click="filterMovimentacao = opt.value; close()"
              >
                {{ opt.label }}
              </button>
            </div>
          </template>
        </UPopover>

        <!-- Limpar Filtros (X) -->
        <UButton
          v-if="hasActiveFilters"
          color="gray"
          variant="ghost"
          icon="i-heroicons-x-mark-20-solid"
          size="xs"
          class="rounded-full"
          :ui="{ rounded: 'rounded-full' }"
          @click="clearFilters"
        />
      </div>
    </div>

    <!-- Tabela -->
    <UCard :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
      <UTable :columns="columns" :rows="paginatedData" :loading="loading" :sort="{ column: 'ef_valor', direction: 'desc' }" :ui="{
          divide: 'divide-y divide-operacao-50 dark:divide-operacao-700',
          thead: '',
          th: { base: 'bg-operacao-100/70 dark:bg-operacao-800 border-b border-operacao-200/60 [&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66] [&_button>span+span]:text-operacao-300 [&_button>span+span]:!w-3.5 [&_button>span+span]:!h-3.5', color: 'text-[#5a5a66] dark:text-operacao-400', font: 'font-medium', size: 'text-xs uppercase tracking-wider', padding: 'px-4 py-2' },
          td: { color: 'text-operacao-600 dark:text-operacao-200', size: 'text-sm', padding: 'px-4 py-2.5' }
        }">
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-operacao-400">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhum registro encontrado</p>
          </div>
        </template>

        <template #produto-data="{ row }">
          <div>
            <span class="font-medium">{{ row.produto }}</span>
            <span class="text-xs text-operacao-400 ml-1">({{ row.unidade }})</span>
          </div>
        </template>
        <template #ei-data="{ row }">
          <div>
            <span class="text-guardian-600 font-medium">{{ formatCurrency(viewEi(row).valor) }}</span>
            <p class="text-[11px] text-operacao-400 mt-0.5">{{ formatNumber(viewEi(row).qtd) }} {{ row.unidade }}</p>
          </div>
        </template>
        <template #ef-data="{ row }">
          <div>
            <span class="text-controle-600 font-medium">{{ formatCurrency(viewEf(row).valor) }}</span>
            <p class="text-[11px] text-operacao-400 mt-0.5">{{ formatNumber(viewEf(row).qtd) }} {{ row.unidade }}</p>
          </div>
        </template>
        <template #custo_ultima_entrada-data="{ row }">
          {{ formatCurrency(row.custo_ultima_entrada) }}
        </template>
        <template #variacao-data="{ row }">
          <div>
            <span :class="viewVar(row).valor > 0 ? 'text-emerald-600' : viewVar(row).valor < 0 ? 'text-red-600' : 'text-operacao-400'" class="font-medium">
              {{ viewVar(row).valor > 0 ? '+' : '' }}{{ formatCurrency(viewVar(row).valor) }}
            </span>
            <p class="text-[11px] mt-0.5" :class="viewVar(row).qtd > 0 ? 'text-emerald-400' : viewVar(row).qtd < 0 ? 'text-red-400' : 'text-operacao-400'">
              {{ viewVar(row).qtd > 0 ? '+' : '' }}{{ formatNumber(viewVar(row).qtd) }} {{ row.unidade }}
            </p>
          </div>
        </template>
        <template #cmv-data="{ row }">
          <span class="text-red-600 font-medium">{{ formatCurrency(viewCmv(row)) }}</span>
        </template>
        <template #giro-data="{ row }">
          <span v-if="viewCmv(row) <= 0" class="text-operacao-400">-</span>
          <span v-else :class="getGiroClass(viewGiro(row))">
            {{ viewGiro(row).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} dias
          </span>
        </template>
      </UTable>
      <TablePagination
        v-model="page"
        :page-size="pageSize"
        :total-items="filteredData.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { GestaoInventario, Grupo, Subgrupo } from '~/types'

const toolbarInputUi = { color: { white: { outline: 'shadow-sm bg-white text-gray-900 ring-1 ring-inset ring-[#EBEBED] focus:ring-1 focus:ring-operacao-200 dark:ring-operacao-700' } } }
const toolbarButtonUi = { color: { white: { solid: 'shadow-sm ring-1 ring-inset ring-[#EBEBED] text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-guardian-500 dark:ring-operacao-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800/50' } } }

const { getGestaoInventario } = useRelatorios()
const { getGrupos, getSubgrupos } = useEstoque()
const { empresaId } = useEmpresa()
const toast = useToast()

// Estado
const loading = ref(false)
const dados = ref<GestaoInventario[]>([])
const grupos = ref<Grupo[]>([])
const subgrupos = ref<Subgrupo[]>([])

// Filtros
const search = ref('')
const filterCategoria = ref('')
const categoriaPopoverOpen = ref(false)
const expandedGrupos = ref<Set<string>>(new Set())
const filterMovimentacao = ref('')

// Mês/Ano
const hoje = new Date()
const selectedAno = ref(hoje.getFullYear())
const selectedMes = ref(hoje.getMonth() + 1)
const pickerAno = ref(hoje.getFullYear())

const mesesNomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const mesAnoLabel = computed(() => {
  return `${mesesNomes[selectedMes.value - 1]} ${selectedAno.value}`
})

const selectMesAno = (mes: number, ano: number) => {
  selectedMes.value = mes
  selectedAno.value = ano
}

// Paginacao
const page = ref(1)
const pageSize = ref(20)

// Colunas
const columns = [
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'ei', label: 'Estoque Inicial', sortable: true },
  { key: 'ef', label: 'Estoque Final', sortable: true },
  { key: 'custo_ultima_entrada', label: 'Ult. Entrada', sortable: true },
  { key: 'variacao', label: 'Variação', sortable: true },
  { key: 'cmv', label: 'CMV (R$)', sortable: true },
  { key: 'giro', label: 'Giro (dias)', sortable: true }
]

// Filtro expansível Grupo/Subgrupo
const filterCategoriaLabel = computed(() => {
  if (!filterCategoria.value) return 'Todos'
  if (filterCategoria.value.startsWith('g:')) {
    const id = filterCategoria.value.slice(2)
    return grupos.value.find(g => g.id === id)?.nome || 'Grupo'
  }
  if (filterCategoria.value.startsWith('s:')) {
    const id = filterCategoria.value.slice(2)
    const sub = subgrupos.value.find(s => s.id === id)
    return sub?.nome || 'Subgrupo'
  }
  return 'Grupo / Subgrupo'
})

const subgruposDe = (grupoId: string) => {
  return subgrupos.value.filter(s => s.grupo_id === grupoId)
}

const toggleGrupoExpand = (grupoId: string) => {
  const newSet = new Set(expandedGrupos.value)
  if (newSet.has(grupoId)) {
    newSet.delete(grupoId)
  } else {
    newSet.add(grupoId)
  }
  expandedGrupos.value = newSet
}

const selectCategoria = (value: string) => {
  filterCategoria.value = value
  categoriaPopoverOpen.value = false
}

// Label movimentacao
const filterMovimentacaoLabel = computed(() => {
  const opt = movimentacaoOptions.find(o => o.value === filterMovimentacao.value)
  return opt?.label || 'Movimentação'
})

// Total sem movimentacao
const totalSemMovimentacao = computed(() => {
  return dados.value.filter(d => d.sem_movimentacao).length
})

// Opcoes de movimentacao
const movimentacaoOptions = [
  { label: 'Todos', value: '' },
  { label: 'Sem movimentação', value: 'sem' },
  { label: 'Com movimentação', value: 'com' }
]

// Helpers
const viewEi = (row: GestaoInventario) => ({ valor: row.ei_valor, qtd: row.ei_quantidade })
const viewEf = (row: GestaoInventario) => ({ valor: row.ef_valor, qtd: row.ef_quantidade })
const viewVar = (row: GestaoInventario) => ({ valor: row.ef_valor - row.ei_valor, qtd: row.ef_quantidade - row.ei_quantidade })

// CMV = EI + Entradas - EF
const viewCmv = (row: GestaoInventario) => {
  return Math.max(0, row.ei_valor + row.entradas_valor - row.ef_valor)
}

// Giro = EF(R$) / CMV(R$) * 30
const viewGiro = (row: GestaoInventario) => {
  const cmv = viewCmv(row)
  if (cmv <= 0) return 0
  return (row.ef_valor / cmv) * 30
}

const getGiroClass = (dias: number) => {
  if (dias <= 6.99) return 'text-controle-600 font-medium'
  if (dias <= 9.99) return 'text-alerta-600 font-medium'
  return 'text-red-600 font-medium'
}

const hasActiveFilters = computed(() => {
  return !!filterCategoria.value || !!filterMovimentacao.value || !!search.value
})

const clearFilters = () => {
  search.value = ''
  filterCategoria.value = ''
  filterMovimentacao.value = ''
}

// Computed - Filtros + ordenacao por EF valor descendente
const filteredData = computed(() => {
  let result = [...dados.value]

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(d => d.produto.toLowerCase().includes(term))
  }

  if (filterCategoria.value) {
    if (filterCategoria.value.startsWith('g:')) {
      const grupoId = filterCategoria.value.slice(2)
      const grupoNome = grupos.value.find(g => g.id === grupoId)?.nome
      if (grupoNome) {
        result = result.filter(d => d.grupo === grupoNome)
      }
    } else if (filterCategoria.value.startsWith('s:')) {
      const subgrupoId = filterCategoria.value.slice(2)
      const subgrupoNome = subgrupos.value.find(s => s.id === subgrupoId)?.nome
      if (subgrupoNome) {
        result = result.filter(d => d.subgrupo === subgrupoNome)
      }
    }
  }

  if (filterMovimentacao.value === 'sem') {
    result = result.filter(d => d.sem_movimentacao)
  } else if (filterMovimentacao.value === 'com') {
    result = result.filter(d => !d.sem_movimentacao)
  }

  // Ordenar por EF valor descendente
  result.sort((a, b) => b.ef_valor - a.ef_valor)

  return result
})

// Paginacao computed
const paginatedData = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

// Totais
const totais = computed(() => {
  const ei_quantidade = dados.value.reduce((sum, d) => sum + d.ei_quantidade, 0)
  const ei_valor = dados.value.reduce((sum, d) => sum + d.ei_valor, 0)
  const ef_quantidade = dados.value.reduce((sum, d) => sum + d.ef_quantidade, 0)
  const ef_valor = dados.value.reduce((sum, d) => sum + d.ef_valor, 0)
  return {
    ei_quantidade,
    ei_valor,
    ef_quantidade,
    ef_valor,
    variacao_quantidade: ef_quantidade - ei_quantidade,
    variacao_valor: ef_valor - ei_valor
  }
})

// Helpers
const { formatCurrency, formatNumber } = useFormatters()

// Carregamento
const loadData = async () => {
  try {
    loading.value = true
    dados.value = await getGestaoInventario(selectedAno.value, selectedMes.value)
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar dados do inventário',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const loadGruposSubgrupos = async () => {
  try {
    const [grps, subgrps] = await Promise.all([getGrupos(), getSubgrupos()])
    grupos.value = grps
    subgrupos.value = subgrps
  } catch {
    // silently fail - filters just won't show groups
  }
}

// Watchers
watch([selectedAno, selectedMes], () => {
  page.value = 1
  loadData()
})

watch([search, filterCategoria, filterMovimentacao], () => {
  page.value = 1
})

// Realtime
const { onTableChange } = useRealtime()
onTableChange(['produtos', 'entradas', 'saidas', 'ajustes'], () => loadData())
onTableChange(['grupos', 'subgrupos'], () => loadGruposSubgrupos())

watch(empresaId, () => {
  if (empresaId.value) {
    loadData()
    loadGruposSubgrupos()
  }
}, { immediate: true })
</script>
