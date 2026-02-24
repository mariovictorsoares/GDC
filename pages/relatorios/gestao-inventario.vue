<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Inventario</h1>
        <p class="text-sm text-gray-500">Estoque Inicial e Estoque Final por produto (quantidade e valor)</p>
      </div>
      <UButton color="primary" @click="loadData" :loading="loading">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
        Atualizar
      </UButton>
    </div>

    <!-- Cards Resumo Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div v-for="i in 5" :key="i" class="rounded-xl bg-white ring-1 ring-gray-100 shadow-sm border-l-4 border-gray-200 p-5">
        <div class="flex items-center justify-between">
          <div class="space-y-2">
            <USkeleton class="h-4 w-24" />
            <USkeleton class="h-8 w-28" />
            <USkeleton class="h-3 w-20" />
          </div>
          <USkeleton class="h-12 w-12 rounded-lg" />
        </div>
      </div>
    </div>

    <!-- Cards Resumo -->
    <div v-if="!loading" class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <UCard class="border-l-4 border-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Estoque Inicial</p>
            <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(totais.ei_valor) }}</p>
            <p class="text-xs text-gray-500">{{ formatNumber(totais.ei_quantidade) }} itens</p>
          </div>
          <div class="p-3 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <UIcon name="i-heroicons-arrow-left-on-rectangle" class="w-6 h-6 text-blue-500" />
          </div>
        </div>
      </UCard>

      <UCard class="border-l-4 border-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Estoque Final</p>
            <p class="text-2xl font-bold text-green-600">{{ formatCurrency(totais.ef_valor) }}</p>
            <p class="text-xs text-gray-500">{{ formatNumber(totais.ef_quantidade) }} itens</p>
          </div>
          <div class="p-3 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
            <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-6 h-6 text-green-500" />
          </div>
        </div>
      </UCard>

      <UCard class="border-l-4" :class="totais.variacao_valor >= 0 ? 'border-emerald-500' : 'border-red-500'">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Variacao (Valor)</p>
            <p class="text-2xl font-bold" :class="totais.variacao_valor >= 0 ? 'text-emerald-600' : 'text-red-600'">
              {{ totais.variacao_valor >= 0 ? '+' : '' }}{{ formatCurrency(totais.variacao_valor) }}
            </p>
            <p class="text-xs text-gray-500">EF - EI</p>
          </div>
          <div class="p-3 rounded-lg flex items-center justify-center shrink-0" :class="totais.variacao_valor >= 0 ? 'bg-emerald-50' : 'bg-red-50'">
            <UIcon
              :name="totais.variacao_valor >= 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
              class="w-6 h-6"
              :class="totais.variacao_valor >= 0 ? 'text-emerald-500' : 'text-red-500'"
            />
          </div>
        </div>
      </UCard>

      <UCard class="border-l-4 border-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Total Produtos</p>
            <p class="text-2xl font-bold text-purple-600">{{ dados.length }}</p>
            <p class="text-xs text-gray-500">com estoque</p>
          </div>
          <div class="p-3 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
            <UIcon name="i-heroicons-cube" class="w-6 h-6 text-purple-500" />
          </div>
        </div>
      </UCard>

      <UCard class="border-l-4 border-amber-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">Sem Movimentacao</p>
            <p class="text-2xl font-bold text-amber-600">{{ totalSemMovimentacao }}</p>
            <p class="text-xs text-gray-500">produtos parados</p>
          </div>
          <div class="p-3 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
            <UIcon name="i-heroicons-pause-circle" class="w-6 h-6 text-amber-500" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="flex flex-wrap gap-4 items-end">
        <UFormGroup label="Ano">
          <USelect v-model="selectedAno" :options="anosOptions" class="w-32" />
        </UFormGroup>
        <UFormGroup label="Mes">
          <USelect v-model="selectedMes" :options="mesesOptions" class="w-40" />
        </UFormGroup>
        <UFormGroup label="Grupo">
          <USelect v-model="filterGrupo" :options="grupoOptions" class="w-48" />
        </UFormGroup>
        <UFormGroup label="Subgrupo">
          <USelect v-model="filterSubgrupo" :options="subgrupoOptions" class="w-48" :disabled="!filterGrupo" />
        </UFormGroup>
        <UFormGroup label="Movimentacao">
          <USelect v-model="filterMovimentacao" :options="movimentacaoOptions" class="w-48" />
        </UFormGroup>
        <UFormGroup label="Buscar">
          <UInput v-model="search" placeholder="Buscar produto..." icon="i-heroicons-magnifying-glass" class="w-64" />
        </UFormGroup>
      </div>
    </UCard>

    <!-- Tabela -->
    <UCard :ui="{ body: { padding: '' } }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Inventario por Produto</h3>
          <p class="text-xs text-gray-400">Ordenado por EF Valor (maior p/ menor)</p>
        </div>
      </template>

      <UTable :columns="columns" :rows="paginatedData" :loading="loading" :sort="{ column: 'ef_valor', direction: 'desc' }">
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-gray-500">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhum registro encontrado</p>
          </div>
        </template>

        <template #produto-data="{ row }">
          <div>
            <span class="font-medium">{{ row.produto }}</span>
            <span class="text-xs text-gray-400 ml-1">({{ row.unidade }})</span>
          </div>
        </template>
        <template #grupo-data="{ row }">
          <div class="flex flex-col gap-0.5">
            <UBadge v-if="row.grupo" color="blue" variant="soft" size="xs">{{ row.grupo }}</UBadge>
            <span v-if="row.subgrupo" class="text-xs text-gray-500">{{ row.subgrupo }}</span>
            <span v-if="!row.grupo && !row.subgrupo" class="text-gray-400">-</span>
          </div>
        </template>
        <template #ei_quantidade-data="{ row }">
          <span class="font-medium">{{ formatNumber(row.ei_quantidade) }}</span>
        </template>
        <template #ei_valor-data="{ row }">
          <span class="text-blue-600 font-medium">{{ formatCurrency(row.ei_valor) }}</span>
        </template>
        <template #ef_quantidade-data="{ row }">
          <span class="font-medium">{{ formatNumber(row.ef_quantidade) }}</span>
        </template>
        <template #ef_valor-data="{ row }">
          <span class="text-green-600 font-medium">{{ formatCurrency(row.ef_valor) }}</span>
        </template>
        <template #custo_ultima_entrada-data="{ row }">
          {{ formatCurrency(row.custo_ultima_entrada) }}
        </template>
        <template #variacao_quantidade-data="{ row }">
          <span :class="row.variacao_quantidade > 0 ? 'text-emerald-600' : row.variacao_quantidade < 0 ? 'text-red-600' : 'text-gray-400'">
            {{ row.variacao_quantidade > 0 ? '+' : '' }}{{ formatNumber(row.variacao_quantidade) }}
          </span>
        </template>
        <template #variacao_valor-data="{ row }">
          <span :class="row.variacao_valor > 0 ? 'text-emerald-600' : row.variacao_valor < 0 ? 'text-red-600' : 'text-gray-400'" class="font-medium">
            {{ row.variacao_valor > 0 ? '+' : '' }}{{ formatCurrency(row.variacao_valor) }}
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
import type { GestaoInventario } from '~/types'

const { getGestaoInventario } = useRelatorios()
const { empresaId } = useEmpresa()
const toast = useToast()

// Estado
const loading = ref(false)
const dados = ref<GestaoInventario[]>([])

// Filtros
const search = ref('')
const filterGrupo = ref('')
const filterSubgrupo = ref('')
const filterMovimentacao = ref('')
const selectedAno = ref(new Date().getFullYear())
const selectedMes = ref(new Date().getMonth() + 1)

// Paginacao
const page = ref(1)
const pageSize = ref(20)

// Colunas
const columns = [
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'grupo', label: 'Grupo / Subgrupo' },
  { key: 'ei_quantidade', label: 'EI Qtd', sortable: true },
  { key: 'ei_valor', label: 'EI Valor', sortable: true },
  { key: 'ef_quantidade', label: 'EF Qtd', sortable: true },
  { key: 'ef_valor', label: 'EF Valor', sortable: true },
  { key: 'custo_ultima_entrada', label: 'Ultima Entrada', sortable: true },
  { key: 'variacao_quantidade', label: 'Var. Qtd', sortable: true },
  { key: 'variacao_valor', label: 'Var. Valor', sortable: true }
]

// Opcoes de filtro
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
  { label: 'Marco', value: 3 },
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

const grupoOptions = computed(() => {
  const grupos = [...new Set(dados.value.map(d => d.grupo).filter(Boolean))]
  return [
    { label: 'Todos', value: '' },
    ...grupos.sort().map(g => ({ label: g, value: g }))
  ]
})

const subgrupoOptions = computed(() => {
  if (!filterGrupo.value) {
    return [{ label: 'Todos', value: '' }]
  }
  const subgrupos = [...new Set(
    dados.value
      .filter(d => d.grupo === filterGrupo.value)
      .map(d => d.subgrupo)
      .filter(Boolean)
  )]
  return [
    { label: 'Todos', value: '' },
    ...subgrupos.sort().map(s => ({ label: s, value: s }))
  ]
})

// Total sem movimentacao
const totalSemMovimentacao = computed(() => {
  return dados.value.filter(d => d.sem_movimentacao).length
})

// Opcoes de movimentacao
const movimentacaoOptions = [
  { label: 'Todos', value: '' },
  { label: 'Sem movimentacao', value: 'sem' },
  { label: 'Com movimentacao', value: 'com' }
]

// Computed - Filtros + ordenacao por EF valor descendente
const filteredData = computed(() => {
  let result = [...dados.value]

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(d => d.produto.toLowerCase().includes(term))
  }
  if (filterGrupo.value) {
    result = result.filter(d => d.grupo === filterGrupo.value)
  }
  if (filterSubgrupo.value) {
    result = result.filter(d => d.subgrupo === filterSubgrupo.value)
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
const truncate2 = (v: number) => Math.trunc((v || 0) * 100) / 100

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(truncate2(value))
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(truncate2(value))
}

// Carregamento
const loadData = async () => {
  try {
    loading.value = true
    dados.value = await getGestaoInventario(selectedAno.value, selectedMes.value)
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar dados do inventario',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

// Watchers
watch([selectedAno, selectedMes], () => {
  page.value = 1
  loadData()
})

watch([search, filterGrupo, filterSubgrupo, filterMovimentacao], () => {
  page.value = 1
})

// Limpar subgrupo quando grupo muda
watch(filterGrupo, () => {
  filterSubgrupo.value = ''
})

watch(empresaId, () => {
  if (empresaId.value) {
    loadData()
  }
}, { immediate: true })
</script>
