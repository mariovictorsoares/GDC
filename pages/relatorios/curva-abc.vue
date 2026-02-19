<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Curva ABC</h1>
        <p class="text-sm text-gray-500">Análise de classificação ABC do estoque e CMV</p>
      </div>
      <UButton color="primary" @click="loadAllData" :loading="loading">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
        Atualizar
      </UButton>
    </div>

    <!-- Tabs para alternar entre as visualizações -->
    <UCard>
      <UTabs v-model="activeTab" :items="tabItems" />
    </UCard>

    <!-- Tab: ABC de Estoque -->
    <template v-if="activeTab === 0">
      <!-- Resumo Skeleton -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="rounded-xl bg-white ring-1 ring-gray-100 shadow-sm border-l-4 border-gray-200 p-5">
          <div class="flex items-center justify-between">
            <div class="space-y-2">
              <USkeleton class="h-4 w-16" />
              <USkeleton class="h-8 w-12" />
              <USkeleton class="h-3 w-20" />
            </div>
            <div class="space-y-2">
              <USkeleton class="h-4 w-20" />
              <USkeleton class="h-3 w-16" />
            </div>
          </div>
        </div>
      </div>

      <!-- Resumo por Classe - Estoque -->
      <div v-if="!loading" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UCard class="border-l-4 border-green-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Curva A</p>
              <p class="text-2xl font-bold text-green-600">{{ resumoEstoque.A.quantidade }}</p>
              <p class="text-xs text-gray-500">{{ resumoEstoque.A.percentual.toFixed(1) }}% dos itens</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">{{ formatCurrency(resumoEstoque.A.valor) }}</p>
              <p class="text-xs text-gray-500">{{ resumoEstoque.A.percentualValor.toFixed(1) }}% do valor</p>
            </div>
          </div>
        </UCard>

        <UCard class="border-l-4 border-yellow-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Curva B</p>
              <p class="text-2xl font-bold text-yellow-600">{{ resumoEstoque.B.quantidade }}</p>
              <p class="text-xs text-gray-500">{{ resumoEstoque.B.percentual.toFixed(1) }}% dos itens</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">{{ formatCurrency(resumoEstoque.B.valor) }}</p>
              <p class="text-xs text-gray-500">{{ resumoEstoque.B.percentualValor.toFixed(1) }}% do valor</p>
            </div>
          </div>
        </UCard>

        <UCard class="border-l-4 border-gray-400">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Curva C</p>
              <p class="text-2xl font-bold text-gray-600">{{ resumoEstoque.C.quantidade }}</p>
              <p class="text-xs text-gray-500">{{ resumoEstoque.C.percentual.toFixed(1) }}% dos itens</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">{{ formatCurrency(resumoEstoque.C.valor) }}</p>
              <p class="text-xs text-gray-500">{{ resumoEstoque.C.percentualValor.toFixed(1) }}% do valor</p>
            </div>
          </div>
        </UCard>

        <UCard class="border-l-4 border-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Total</p>
              <p class="text-2xl font-bold text-blue-600">{{ curvaEstoque.length }}</p>
              <p class="text-xs text-gray-500">produtos</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">{{ formatCurrency(valorTotalEstoque) }}</p>
              <p class="text-xs text-gray-500">valor total</p>
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
          <UFormGroup label="Mês">
            <USelect v-model="selectedMes" :options="mesesOptions" class="w-40" />
          </UFormGroup>
          <UFormGroup label="Filtrar por Curva">
            <USelect v-model="filterClasseEstoque" :options="classeOptions" class="w-32" />
          </UFormGroup>
          <UFormGroup label="Buscar">
            <UInput v-model="searchEstoque" placeholder="Buscar produto..." icon="i-heroicons-magnifying-glass" class="w-64" />
          </UFormGroup>
        </div>
      </UCard>

      <!-- Tabela ABC Estoque -->
      <UCard :ui="{ body: { padding: '' } }">
        <template #header>
          <h3 class="font-semibold">Classificação ABC por Valor de Estoque</h3>
        </template>

        <UTable :columns="columnsEstoque" :rows="paginatedEstoque" :loading="loading">
          <template #empty-state>
            <div class="flex flex-col items-center justify-center py-6 text-gray-500">
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
          <template #quantidade-data="{ row }">
            {{ formatNumber(row.quantidade) }}
          </template>
          <template #valor-data="{ row }">
            {{ formatCurrency(row.valor) }}
          </template>
          <template #classe-data="{ row }">
            <UBadge :color="getClasseBadgeColor(row.classe)">{{ row.classe }}</UBadge>
          </template>
        </UTable>
        <TablePagination
          v-model="pageEstoque"
          :page-size="pageSizeEstoque"
          :total-items="filteredEstoque.length"
          @update:page-size="pageSizeEstoque = $event"
        />
      </UCard>
    </template>

    <!-- Tab: ABC de CMV -->
    <template v-if="activeTab === 1">
      <!-- Resumo Skeleton -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="rounded-xl bg-white ring-1 ring-gray-100 shadow-sm border-l-4 border-gray-200 p-5">
          <div class="flex items-center justify-between">
            <div class="space-y-2">
              <USkeleton class="h-4 w-16" />
              <USkeleton class="h-8 w-12" />
              <USkeleton class="h-3 w-20" />
            </div>
            <div class="space-y-2">
              <USkeleton class="h-4 w-20" />
              <USkeleton class="h-3 w-16" />
            </div>
          </div>
        </div>
      </div>

      <!-- Resumo por Classe - CMV -->
      <div v-if="!loading" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UCard class="border-l-4 border-green-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Curva A</p>
              <p class="text-2xl font-bold text-green-600">{{ resumoCMV.A.quantidade }}</p>
              <p class="text-xs text-gray-500">{{ resumoCMV.A.percentual.toFixed(1) }}% dos itens</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">{{ formatCurrency(resumoCMV.A.valor) }}</p>
              <p class="text-xs text-gray-500">{{ resumoCMV.A.percentualValor.toFixed(1) }}% do CMV</p>
            </div>
          </div>
        </UCard>

        <UCard class="border-l-4 border-yellow-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Curva B</p>
              <p class="text-2xl font-bold text-yellow-600">{{ resumoCMV.B.quantidade }}</p>
              <p class="text-xs text-gray-500">{{ resumoCMV.B.percentual.toFixed(1) }}% dos itens</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">{{ formatCurrency(resumoCMV.B.valor) }}</p>
              <p class="text-xs text-gray-500">{{ resumoCMV.B.percentualValor.toFixed(1) }}% do CMV</p>
            </div>
          </div>
        </UCard>

        <UCard class="border-l-4 border-gray-400">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Curva C</p>
              <p class="text-2xl font-bold text-gray-600">{{ resumoCMV.C.quantidade }}</p>
              <p class="text-xs text-gray-500">{{ resumoCMV.C.percentual.toFixed(1) }}% dos itens</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">{{ formatCurrency(resumoCMV.C.valor) }}</p>
              <p class="text-xs text-gray-500">{{ resumoCMV.C.percentualValor.toFixed(1) }}% do CMV</p>
            </div>
          </div>
        </UCard>

        <UCard class="border-l-4 border-red-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">CMV Total</p>
              <p class="text-2xl font-bold text-red-600">{{ curvaCMV.length }}</p>
              <p class="text-xs text-gray-500">produtos</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-medium text-gray-900">{{ formatCurrency(valorTotalCMV) }}</p>
              <p class="text-xs text-gray-500">valor consumido</p>
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
          <UFormGroup label="Mês">
            <USelect v-model="selectedMes" :options="mesesOptions" class="w-40" />
          </UFormGroup>
          <UFormGroup label="Filtrar por Classe">
            <USelect v-model="filterClasseCMV" :options="classeOptions" class="w-32" />
          </UFormGroup>
          <UFormGroup label="Buscar">
            <UInput v-model="searchCMV" placeholder="Buscar produto..." icon="i-heroicons-magnifying-glass" class="w-64" />
          </UFormGroup>
        </div>
      </UCard>

      <!-- Tabela ABC CMV -->
      <UCard :ui="{ body: { padding: '' } }">
        <template #header>
          <h3 class="font-semibold">Classificação ABC por Valor de CMV (Consumo)</h3>
        </template>

        <UTable :columns="columnsCMV" :rows="paginatedCMV" :loading="loading">
          <template #empty-state>
            <div class="flex flex-col items-center justify-center py-6 text-gray-500">
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
          <template #valor_cmv-data="{ row }">
            <span class="text-red-600 font-medium">{{ formatCurrency(row.valor_cmv) }}</span>
          </template>
          <template #classe-data="{ row }">
            <UBadge :color="getClasseBadgeColor(row.classe)">{{ row.classe }}</UBadge>
          </template>
        </UTable>
        <TablePagination
          v-model="pageCMV"
          :page-size="pageSizeCMV"
          :total-items="filteredCMV.length"
          @update:page-size="pageSizeCMV = $event"
        />
      </UCard>
    </template>

    <!-- Tab: Comparativo ABC -->
    <template v-if="activeTab === 2">
      <!-- Resumo Skeleton -->
      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="rounded-xl bg-white ring-1 ring-gray-100 shadow-sm border-l-4 border-gray-200 p-5">
          <div class="text-center space-y-2">
            <USkeleton class="h-4 w-24 mx-auto" />
            <USkeleton class="h-10 w-14 mx-auto" />
            <USkeleton class="h-3 w-32 mx-auto" />
          </div>
        </div>
      </div>

      <!-- Resumo do Comparativo -->
      <div v-if="!loading" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UCard class="border-l-4 border-green-500">
          <div class="text-center">
            <p class="text-sm text-gray-500">Equilibrado</p>
            <p class="text-3xl font-bold text-green-600">{{ statusCount.EQUILIBRADO }}</p>
            <p class="text-xs text-gray-500">Estoque alinhado ao consumo</p>
          </div>
        </UCard>

        <UCard class="border-l-4 border-red-500">
          <div class="text-center">
            <p class="text-sm text-gray-500">Estoque Excessivo</p>
            <p class="text-3xl font-bold text-red-600">{{ statusCount.ESTOQUE_EXCESSIVO }}</p>
            <p class="text-xs text-gray-500">A em estoque, C em CMV</p>
          </div>
        </UCard>

        <UCard class="border-l-4 border-orange-500">
          <div class="text-center">
            <p class="text-sm text-gray-500">Risco de Ruptura</p>
            <p class="text-3xl font-bold text-orange-600">{{ statusCount.RISCO_RUPTURA }}</p>
            <p class="text-xs text-gray-500">C em estoque, A em CMV</p>
          </div>
        </UCard>

        <UCard class="border-l-4 border-yellow-500">
          <div class="text-center">
            <p class="text-sm text-gray-500">Atenção</p>
            <p class="text-3xl font-bold text-yellow-600">{{ statusCount['ATENCAO'] }}</p>
            <p class="text-xs text-gray-500">Diferença de 1 classe</p>
          </div>
        </UCard>
      </div>

      <!-- Filtros -->
      <UCard>
        <div class="flex flex-wrap gap-4 items-end">
          <UFormGroup label="Ano">
            <USelect v-model="selectedAno" :options="anosOptions" class="w-32" />
          </UFormGroup>
          <UFormGroup label="Mês">
            <USelect v-model="selectedMes" :options="mesesOptions" class="w-40" />
          </UFormGroup>
          <UFormGroup label="Filtrar por Status">
            <USelect v-model="filterStatus" :options="statusOptions" class="w-48" />
          </UFormGroup>
          <UFormGroup label="Buscar">
            <UInput v-model="searchComparativo" placeholder="Buscar produto..." icon="i-heroicons-magnifying-glass" class="w-64" />
          </UFormGroup>
        </div>
      </UCard>

      <!-- Tabela Comparativo -->
      <UCard :ui="{ body: { padding: '' } }">
        <template #header>
          <h3 class="font-semibold">Comparativo ABC: Estoque vs CMV</h3>
        </template>

        <UTable :columns="columnsComparativo" :rows="paginatedComparativo" :loading="loading">
          <template #empty-state>
            <div class="flex flex-col items-center justify-center py-6 text-gray-500">
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
          <template #classe_estoque-data="{ row }">
            <UBadge :color="getClasseBadgeColor(row.classe_estoque)">{{ row.classe_estoque }}</UBadge>
          </template>
          <template #classe_cmv-data="{ row }">
            <UBadge :color="getClasseBadgeColor(row.classe_cmv)">{{ row.classe_cmv }}</UBadge>
          </template>
          <template #valor_estoque-data="{ row }">
            {{ formatCurrency(row.valor_estoque) }}
          </template>
          <template #valor_cmv-data="{ row }">
            <span class="text-red-600">{{ formatCurrency(row.valor_cmv) }}</span>
          </template>
        </UTable>
        <TablePagination
          v-model="pageComparativo"
          :page-size="pageSizeComparativo"
          :total-items="filteredComparativo.length"
          @update:page-size="pageSizeComparativo = $event"
        />
      </UCard>

      <!-- Legenda do Comparativo -->
      <UCard>
        <h4 class="font-semibold mb-4">Interpretação do Comparativo</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <UBadge color="red">Estoque Excessivo</UBadge>
            <div>
              <p class="text-sm font-medium text-red-800">Classe A em estoque + Classe C em CMV</p>
              <p class="text-xs text-red-600">Produto com alto valor em estoque mas baixo consumo. Risco de capital parado ou vencimento.</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
            <UBadge color="orange">Risco Ruptura</UBadge>
            <div>
              <p class="text-sm font-medium text-orange-800">Classe C em estoque + Classe A em CMV</p>
              <p class="text-xs text-orange-600">Produto com baixo estoque mas alto consumo. Risco de falta de produto.</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <UBadge color="green">Equilibrado</UBadge>
            <div>
              <p class="text-sm font-medium text-green-800">Mesma classe em estoque e CMV</p>
              <p class="text-xs text-green-600">Estoque está alinhado com o padrão de consumo.</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
            <UBadge color="yellow">Atenção</UBadge>
            <div>
              <p class="text-sm font-medium text-yellow-800">Diferença de 1 classe</p>
              <p class="text-xs text-yellow-600">Pequeno desalinhamento que merece monitoramento.</p>
            </div>
          </div>
        </div>
      </UCard>
    </template>

  </div>
</template>

<script setup lang="ts">
import type { CurvaABC, CurvaABCCMV, ComparativoABC } from '~/types'

const { getCurvaABC, getCurvaABCCMV, getComparativoABC } = useRelatorios()
const { empresaId } = useEmpresa()
const toast = useToast()

// Estado
const activeTab = ref(0)
const loading = ref(false)
const curvaEstoque = ref<CurvaABC[]>([])
const curvaCMV = ref<CurvaABCCMV[]>([])
const comparativoData = ref<ComparativoABC[]>([])

// Filtros
const searchEstoque = ref('')
const searchCMV = ref('')
const searchComparativo = ref('')
const filterClasseEstoque = ref('')
const filterClasseCMV = ref('')
const filterStatus = ref('')
const selectedAno = ref(new Date().getFullYear())
const selectedMes = ref(new Date().getMonth() + 1)

// Paginação
const pageEstoque = ref(1)
const pageSizeEstoque = ref(20)
const pageCMV = ref(1)
const pageSizeCMV = ref(20)
const pageComparativo = ref(1)
const pageSizeComparativo = ref(20)

// Tabs
const tabItems = [
  { label: 'ABC Estoque', icon: 'i-heroicons-cube' },
  { label: 'ABC CMV', icon: 'i-heroicons-arrow-trending-up' },
  { label: 'Comparativo', icon: 'i-heroicons-scale' }
]

// Colunas
const columnsEstoque = [
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'categoria', label: 'Categoria' },
  { key: 'quantidade', label: 'Quantidade', sortable: true },
  { key: 'valor', label: 'Valor Estoque', sortable: true },
  { key: 'classe', label: 'Curva', sortable: true }
]

const columnsCMV = [
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'categoria', label: 'Categoria' },
  { key: 'valor_cmv', label: 'Valor CMV', sortable: true },
  { key: 'classe', label: 'Curva', sortable: true }
]

const columnsComparativo = [
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'categoria', label: 'Categoria' },
  { key: 'classe_estoque', label: 'ABC Estoque' },
  { key: 'classe_cmv', label: 'ABC CMV' },
  { key: 'valor_estoque', label: 'Valor Estoque' },
  { key: 'valor_cmv', label: 'Valor CMV' }
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
  { label: 'Atenção', value: 'ATENCAO' }
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

// Computed - Filtros
const filteredEstoque = computed(() => {
  let result = curvaEstoque.value
  if (searchEstoque.value) {
    const term = searchEstoque.value.toLowerCase()
    result = result.filter(c => c.produto.toLowerCase().includes(term))
  }
  if (filterClasseEstoque.value) {
    result = result.filter(c => c.classe === filterClasseEstoque.value)
  }
  return result
})

const filteredCMV = computed(() => {
  let result = curvaCMV.value
  if (searchCMV.value) {
    const term = searchCMV.value.toLowerCase()
    result = result.filter(c => c.produto.toLowerCase().includes(term))
  }
  if (filterClasseCMV.value) {
    result = result.filter(c => c.classe === filterClasseCMV.value)
  }
  return result
})

const filteredComparativo = computed(() => {
  let result = comparativoData.value
  if (searchComparativo.value) {
    const term = searchComparativo.value.toLowerCase()
    result = result.filter(c => c.produto.toLowerCase().includes(term))
  }
  if (filterStatus.value) {
    result = result.filter(c => c.status === filterStatus.value)
  }
  return result
})

// Paginação computed
const paginatedEstoque = computed(() => {
  const start = (pageEstoque.value - 1) * pageSizeEstoque.value
  return filteredEstoque.value.slice(start, start + pageSizeEstoque.value)
})

const paginatedCMV = computed(() => {
  const start = (pageCMV.value - 1) * pageSizeCMV.value
  return filteredCMV.value.slice(start, start + pageSizeCMV.value)
})

const paginatedComparativo = computed(() => {
  const start = (pageComparativo.value - 1) * pageSizeComparativo.value
  return filteredComparativo.value.slice(start, start + pageSizeComparativo.value)
})

// Totais
const valorTotalEstoque = computed(() =>
  curvaEstoque.value.reduce((sum, c) => sum + c.valor, 0)
)

const valorTotalCMV = computed(() =>
  curvaCMV.value.reduce((sum, c) => sum + c.valor_cmv, 0)
)

// Resumos
const calcResumo = (data: any[], valorKey: string) => {
  const total = data.length
  const totalValor = data.reduce((sum, c) => sum + (c[valorKey] || 0), 0)

  const calcClasse = (classe: 'A' | 'B' | 'C') => {
    const itens = data.filter(c => c.classe === classe)
    const valor = itens.reduce((sum, c) => sum + (c[valorKey] || 0), 0)
    return {
      quantidade: itens.length,
      percentual: total > 0 ? (itens.length / total) * 100 : 0,
      valor,
      percentualValor: totalValor > 0 ? (valor / totalValor) * 100 : 0
    }
  }

  return {
    A: calcClasse('A'),
    B: calcClasse('B'),
    C: calcClasse('C')
  }
}

const resumoEstoque = computed(() => calcResumo(curvaEstoque.value, 'valor'))
const resumoCMV = computed(() => calcResumo(curvaCMV.value, 'valor_cmv'))

const statusCount = computed(() => {
  const counts: Record<string, number> = {
    EQUILIBRADO: 0,
    ESTOQUE_EXCESSIVO: 0,
    RISCO_RUPTURA: 0,
    'ATENCAO': 0
  }
  comparativoData.value.forEach(c => {
    if (counts[c.status] !== undefined) {
      counts[c.status]++
    }
  })
  return counts
})

// Helpers
const getClasseColor = (classe: string) => {
  if (classe === 'A') return 'bg-green-500'
  if (classe === 'B') return 'bg-yellow-500'
  return 'bg-gray-400'
}

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
    'ATENCAO': 'Atenção'
  }
  return map[status] || status
}

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
const loadAllData = async () => {
  try {
    loading.value = true
    const [estoque, cmv, comparativo] = await Promise.all([
      getCurvaABC(),
      getCurvaABCCMV(selectedAno.value, selectedMes.value),
      getComparativoABC(selectedAno.value, selectedMes.value)
    ])
    curvaEstoque.value = estoque
    curvaCMV.value = cmv
    comparativoData.value = comparativo
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

// Watchers
watch([selectedAno, selectedMes], () => {
  loadAllData()
})

watch(empresaId, () => {
  if (empresaId.value) {
    loadAllData()
  }
}, { immediate: true })
</script>
