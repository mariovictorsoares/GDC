<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Estoque Mínimo</h1>
        <p class="text-sm text-gray-500">Análise de ponto de pedido, ruptura e sugestões de reposição</p>
      </div>
      <UButton color="primary" @click="loadEstoqueMinimo" :loading="loading">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
        Atualizar
      </UButton>
    </div>

    <!-- Resumo -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-100 rounded-lg">
            <UIcon name="i-heroicons-cube" class="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Total de Produtos</p>
            <p class="text-2xl font-bold text-gray-900">{{ estoqueData.length }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-green-100 rounded-lg">
            <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Estoque OK</p>
            <p class="text-2xl font-bold text-green-600">{{ resumo.estoqueOk }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-yellow-100 rounded-lg">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Atenção</p>
            <p class="text-2xl font-bold text-yellow-600">{{ resumo.atencao }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-red-100 rounded-lg">
            <UIcon name="i-heroicons-x-circle" class="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Repor Agora</p>
            <p class="text-2xl font-bold text-red-600">{{ resumo.reporAgora }}</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-orange-100 rounded-lg">
            <UIcon name="i-heroicons-clock" class="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Pedido Atrasado</p>
            <p class="text-2xl font-bold text-orange-600">{{ resumo.atrasados }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="flex flex-wrap gap-4 items-end">
        <UFormGroup label="Status">
          <USelect
            v-model="filterStatus"
            :options="statusOptions"
            class="w-40"
          />
        </UFormGroup>
        <UFormGroup label="Prazo Pedido">
          <USelect
            v-model="filterPrazo"
            :options="prazoOptions"
            class="w-40"
          />
        </UFormGroup>
        <UFormGroup label="Buscar">
          <UInput
            v-model="search"
            placeholder="Buscar produto..."
            icon="i-heroicons-magnifying-glass"
            class="w-64"
          />
        </UFormGroup>
      </div>
    </UCard>

    <!-- Tabela -->
    <UCard :ui="{ body: { padding: '' } }">
      <UTable
        :columns="columns"
        :rows="paginatedItems"
        :loading="loading"
      >
        <!-- Empty State -->
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-gray-500">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhum registro encontrado</p>
          </div>
        </template>

        <template #categoria-data="{ row }">
          <span class="text-sm text-gray-600">{{ row.categoria }}</span>
        </template>
        <template #nome-data="{ row }">
          <span class="font-medium">{{ row.nome }}</span>
        </template>
        <template #quantidade_estoque-data="{ row }">
          <span :class="getQuantidadeClass(row)">
            {{ formatNumber(row.quantidade_estoque) }} {{ row.unidade }}
          </span>
        </template>
        <template #estoque_minimo-data="{ row }">
          {{ formatNumber(row.estoque_minimo) }} {{ row.unidade }}
        </template>
        <template #consumo_medio_diario-data="{ row }">
          <span class="text-sm">{{ formatNumber(row.consumo_medio_diario || 0) }}/dia</span>
        </template>
        <template #dias_ate_ruptura-data="{ row }">
          <div class="flex items-center gap-1">
            <span :class="getDiasRupturaClass(row.dias_ate_ruptura)">
              {{ row.dias_ate_ruptura !== null && row.dias_ate_ruptura !== undefined ? formatNumber(row.dias_ate_ruptura) : '-' }}
            </span>
            <span v-if="row.dias_ate_ruptura !== null && row.dias_ate_ruptura !== undefined" class="text-xs text-gray-500">dias</span>
          </div>
        </template>
        <template #data_ponto_pedido-data="{ row }">
          <span v-if="row.data_ponto_pedido" :class="getDataPedidoClass(row.status_prazo)">
            {{ formatDate(row.data_ponto_pedido) }}
          </span>
          <span v-else class="text-gray-400">-</span>
        </template>
        <template #status_prazo-data="{ row }">
          <UBadge :color="getStatusPrazoColor(row.status_prazo)">
            {{ formatStatusPrazo(row.status_prazo) }}
          </UBadge>
        </template>
        <template #repor_estoque-data="{ row }">
          <UBadge :color="row.repor_estoque ? 'red' : 'green'">
            {{ row.repor_estoque ? 'REPOR' : 'OK' }}
          </UBadge>
        </template>
        <template #sugestao_pedido-data="{ row }">
          <span v-if="row.sugestao_pedido > 0" class="font-medium text-blue-600">
            {{ formatNumber(row.sugestao_pedido) }} {{ row.unidade }}
          </span>
          <span v-else class="text-gray-400">-</span>
        </template>
      </UTable>
      <TablePagination
        v-model="page"
        :page-size="pageSize"
        :total-items="filteredEstoque.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>

    <!-- Legenda -->
    <UCard>
      <h4 class="font-semibold mb-3">Como interpretar:</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div class="flex items-start gap-2">
          <UBadge color="green">OK</UBadge>
          <p class="text-gray-600">Estoque acima do mínimo, não precisa repor.</p>
        </div>
        <div class="flex items-start gap-2">
          <UBadge color="red">REPOR</UBadge>
          <p class="text-gray-600">Estoque abaixo do mínimo, fazer pedido de reposição.</p>
        </div>
        <div class="flex items-start gap-2">
          <UBadge color="green">Em Tempo</UBadge>
          <p class="text-gray-600">Ainda há tempo para fazer o pedido antes da ruptura.</p>
        </div>
        <div class="flex items-start gap-2">
          <UBadge color="orange">Atrasado</UBadge>
          <p class="text-gray-600">O pedido deveria ter sido feito - risco de ruptura!</p>
        </div>
        <div>
          <p class="text-gray-600"><strong>Dias até Ruptura:</strong> Quantos dias o estoque atual dura, descontando o tempo de reposição.</p>
        </div>
        <div>
          <p class="text-gray-600"><strong>Data Ponto Pedido:</strong> Data ideal para fazer o pedido e evitar ruptura.</p>
        </div>
      </div>
    </UCard>

    <!-- Formulas -->
    <UCard>
      <h4 class="font-semibold mb-3">Fórmulas utilizadas:</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div class="p-3 bg-gray-50 rounded-lg">
          <p class="font-medium text-gray-900">Dias até Ruptura</p>
          <p class="font-mono text-xs mt-1">(Estoque Atual / Consumo Diário) - Tempo Reposição</p>
        </div>
        <div class="p-3 bg-gray-50 rounded-lg">
          <p class="font-medium text-gray-900">Data Ponto de Pedido</p>
          <p class="font-mono text-xs mt-1">Hoje + Dias até Ruptura</p>
        </div>
        <div class="p-3 bg-gray-50 rounded-lg">
          <p class="font-medium text-gray-900">Sugestão de Pedido</p>
          <p class="font-mono text-xs mt-1">(Consumo Semanal * Semanas Cobertura) + Estoque Mínimo - Estoque Atual</p>
        </div>
        <div class="p-3 bg-gray-50 rounded-lg">
          <p class="font-medium text-gray-900">Estoque Mínimo c/ Margem</p>
          <p class="font-mono text-xs mt-1">Estoque Mínimo * (1 + Margem Segurança%)</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { EstoqueMinimo } from '~/types'

const { getEstoqueMinimo } = useRelatorios()
const toast = useToast()

const estoqueData = ref<EstoqueMinimo[]>([])
const loading = ref(false)
const search = ref('')
const filterStatus = ref('')
const filterPrazo = ref('')

const columns = [
  { key: 'categoria', label: 'Categoria', sortable: true },
  { key: 'nome', label: 'Produto', sortable: true },
  { key: 'quantidade_estoque', label: 'Estoque Atual', sortable: true },
  { key: 'estoque_minimo', label: 'Est. Mínimo', sortable: true },
  { key: 'consumo_medio_diario', label: 'Consumo/Dia' },
  { key: 'dias_ate_ruptura', label: 'Dias Ruptura', sortable: true },
  { key: 'data_ponto_pedido', label: 'Data Pedido', sortable: true },
  { key: 'status_prazo', label: 'Prazo', sortable: true },
  { key: 'repor_estoque', label: 'Status', sortable: true },
  { key: 'sugestao_pedido', label: 'Sugestão' }
]

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Repor Agora', value: 'repor' },
  { label: 'Estoque OK', value: 'ok' }
]

const prazoOptions = [
  { label: 'Todos', value: '' },
  { label: 'Atrasados', value: 'atrasado' },
  { label: 'Em Tempo', value: 'em_tempo' },
  { label: 'Sem Consumo', value: 'sem_consumo' }
]

const filteredEstoque = computed(() => {
  let result = estoqueData.value

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(e =>
      e.nome.toLowerCase().includes(term) ||
      e.categoria.toLowerCase().includes(term)
    )
  }

  if (filterStatus.value === 'repor') {
    result = result.filter(e => e.repor_estoque)
  } else if (filterStatus.value === 'ok') {
    result = result.filter(e => !e.repor_estoque)
  }

  if (filterPrazo.value === 'atrasado') {
    result = result.filter(e => e.status_prazo === 'ATRASADO')
  } else if (filterPrazo.value === 'em_tempo') {
    result = result.filter(e => e.status_prazo === 'EM_TEMPO')
  } else if (filterPrazo.value === 'sem_consumo') {
    result = result.filter(e => e.status_prazo === 'SEM_CONSUMO')
  }

  return result
})

const { page, pageSize, paginatedItems } = usePagination(filteredEstoque)

const resumo = computed(() => {
  const total = estoqueData.value.length
  const repor = estoqueData.value.filter(e => e.repor_estoque).length
  const ok = total - repor

  // Produtos com estoque entre minimo e minimo + 20%
  const atencao = estoqueData.value.filter(e => {
    if (e.estoque_minimo === 0) return false
    const ratio = e.quantidade_estoque / e.estoque_minimo
    return ratio > 1 && ratio < 1.2
  }).length

  // Produtos com pedido atrasado
  const atrasados = estoqueData.value.filter(e => e.status_prazo === 'ATRASADO').length

  return {
    total,
    estoqueOk: ok - atencao,
    atencao,
    reporAgora: repor,
    atrasados
  }
})

const getQuantidadeClass = (row: EstoqueMinimo) => {
  if (row.repor_estoque) return 'font-medium text-red-600'
  if (row.estoque_minimo > 0 && row.quantidade_estoque < row.estoque_minimo * 1.2) {
    return 'font-medium text-yellow-600'
  }
  return 'text-green-600'
}

const getDiasRupturaClass = (dias: number | null | undefined) => {
  if (dias === null || dias === undefined) return 'text-gray-400'
  if (dias <= 0) return 'font-bold text-red-600'
  if (dias <= 7) return 'font-medium text-orange-600'
  if (dias <= 14) return 'font-medium text-yellow-600'
  return 'text-green-600'
}

const getDataPedidoClass = (status: string | undefined) => {
  if (status === 'ATRASADO') return 'font-medium text-red-600'
  if (status === 'EM_TEMPO') return 'text-green-600'
  return 'text-gray-500'
}

const getStatusPrazoColor = (status: string | undefined) => {
  if (status === 'ATRASADO') return 'orange'
  if (status === 'EM_TEMPO') return 'green'
  return 'gray'
}

const formatStatusPrazo = (status: string | undefined) => {
  if (status === 'ATRASADO') return 'Atrasado'
  if (status === 'EM_TEMPO') return 'Em Tempo'
  if (status === 'SEM_CONSUMO') return 'S/ Consumo'
  return '-'
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value || 0)
}

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('pt-BR')
}

const loadEstoqueMinimo = async () => {
  try {
    loading.value = true
    estoqueData.value = await getEstoqueMinimo()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar estoque mínimo',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadEstoqueMinimo()
})
</script>
