<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">CMV - Custo da Mercadoria Vendida</h1>
        <p class="text-sm text-gray-500">Análise do custo das mercadorias vendidas por período</p>
      </div>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="flex flex-wrap gap-4 items-end">
        <UFormGroup label="Ano">
          <USelect
            v-model="selectedAno"
            :options="anosOptions"
            class="w-32"
          />
        </UFormGroup>
        <UButton color="primary" @click="loadCMV" :loading="loading">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
          Atualizar
        </UButton>
      </div>
    </UCard>

    <!-- Alerta de Faturamento Faltando -->
    <UCard v-if="temFaturamentoFaltando" class="border-yellow-300 bg-yellow-50">
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-yellow-600" />
        <div>
          <p class="font-medium text-yellow-800">Faturamento não cadastrado</p>
          <p class="text-sm text-yellow-700">
            {{ mesesSemFaturamento }} {{ mesesSemFaturamento === 1 ? 'mês' : 'meses' }} com compras mas sem faturamento registrado.
            O % CMV não pode ser calculado corretamente.
          </p>
        </div>
      </div>
    </UCard>

    <!-- Resumo Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="rounded-xl bg-white ring-1 ring-gray-100 shadow-sm p-5">
        <div class="text-center space-y-2">
          <USkeleton class="h-4 w-24 mx-auto" />
          <USkeleton class="h-8 w-32 mx-auto" />
        </div>
      </div>
    </div>

    <!-- Resumo Anual -->
    <div v-if="!loading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Total Compras</p>
          <p class="text-2xl font-bold text-green-600">{{ formatCurrency(resumoAnual.compras) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">CMV Real</p>
          <p class="text-2xl font-bold text-red-600">{{ formatCurrency(resumoAnual.cmv) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Faturamento Total</p>
          <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(resumoAnual.faturamento) }}</p>
        </div>
      </UCard>
    </div>

    <!-- Tabela Mensal -->
    <UCard :ui="{ body: { padding: '' } }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Evolução Mensal</h3>
          <div class="flex items-center gap-2 text-sm">
            <UBadge color="yellow">≤25% Atenção</UBadge>
            <UBadge color="green">25-32% Aceitável</UBadge>
            <UBadge color="red">>32% Perigo</UBadge>
          </div>
        </div>
      </template>

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

        <template #mes-data="{ row }">
          <span class="font-medium">{{ mesesNomes[row.mes - 1] }}</span>
        </template>
        <template #estoque_inicial-data="{ row }">
          {{ formatCurrency(row.estoque_inicial) }}
        </template>
        <template #compras-data="{ row }">
          <span class="text-green-600">{{ formatCurrency(row.compras) }}</span>
        </template>
        <template #estoque_final-data="{ row }">
          {{ formatCurrency(row.estoque_final) }}
        </template>
        <template #cmv-data="{ row }">
          <span class="font-medium text-red-600">{{ formatCurrency(row.cmv) }}</span>
        </template>
        <template #faturamento-data="{ row }">
          <span class="text-blue-600">{{ formatCurrency(row.faturamento) }}</span>
        </template>
        <template #cmc-data="{ row }">
          <span class="font-medium text-purple-600">
            {{ row.faturamento > 0 ? formatNumber((row.compras / row.faturamento) * 100) : '0' }}%
          </span>
        </template>
        <template #percentual_cmv-data="{ row }">
          <div class="flex items-center gap-2">
            <div class="flex-1 bg-gray-200 rounded-full h-2 w-20">
              <div
                class="h-2 rounded-full"
                :class="getPercentualClass(row.percentual_cmv)"
                :style="{ width: `${Math.min(row.percentual_cmv, 100)}%` }"
              />
            </div>
            <span
              class="text-sm font-medium"
              :class="getPercentualTextClass(row.percentual_cmv)"
            >
              {{ formatNumber(row.percentual_cmv) }}%
            </span>
          </div>
        </template>
        <template #status-data="{ row }">
          <UBadge :color="row.percentual_cmv <= 25 ? 'yellow' : row.percentual_cmv <= 32 ? 'green' : 'red'">
            {{ row.percentual_cmv <= 25 ? 'ATENÇÃO' : row.percentual_cmv <= 32 ? 'ACEITÁVEL' : 'PERIGO' }}
          </UBadge>
        </template>
      </UTable>
      <TablePagination
        v-model="page"
        :page-size="pageSize"
        :total-items="cmvData.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { CMV } from '~/types'

const { getCMV } = useRelatorios()
const { empresaId } = useEmpresa()
const toast = useToast()

const cmvData = ref<CMV[]>([])
const loading = ref(false)
const selectedAno = ref(new Date().getFullYear())

const { page, pageSize, paginatedItems } = usePagination(cmvData)

const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const columns = [
  { key: 'mes', label: 'Mês' },
  { key: 'estoque_inicial', label: 'Est. Inicial' },
  { key: 'compras', label: 'Compras' },
  { key: 'estoque_final', label: 'Est. Final' },
  { key: 'cmv', label: 'CMV' },
  { key: 'faturamento', label: 'Faturamento' },
  { key: 'cmc', label: '% CMC' },
  { key: 'percentual_cmv', label: '% CMV Real' },
  { key: 'status', label: 'Status' }
]

const anosOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    label: String(currentYear - 2 + i),
    value: currentYear - 2 + i
  }))
})

const resumoAnual = computed(() => {
  if (cmvData.value.length === 0) {
    return { compras: 0, cmv: 0, faturamento: 0 }
  }

  const compras = cmvData.value.reduce((sum, c) => sum + c.compras, 0)
  const cmv = cmvData.value.reduce((sum, c) => sum + c.cmv, 0)
  const faturamento = cmvData.value.reduce((sum, c) => sum + c.faturamento, 0)

  return { compras, cmv, faturamento }
})

// Verificar se há meses sem faturamento cadastrado
const mesesSemFaturamento = computed(() => {
  return cmvData.value.filter(c => c.faturamento === 0 && c.compras > 0).length
})

const temFaturamentoFaltando = computed(() => mesesSemFaturamento.value > 0)

const getPercentualClass = (percentual: number) => {
  if (percentual <= 25) return 'bg-yellow-500'
  if (percentual <= 32) return 'bg-green-500'
  return 'bg-red-500'
}

const getPercentualTextClass = (percentual: number) => {
  if (percentual <= 25) return 'text-yellow-600'
  if (percentual <= 32) return 'text-green-600'
  return 'text-red-600'
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

const loadCMV = async () => {
  try {
    loading.value = true
    cmvData.value = await getCMV(selectedAno.value)
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar CMV',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

watch(selectedAno, () => {
  loadCMV()
})

watch(empresaId, () => {
  if (empresaId.value) {
    loadCMV()
  }
}, { immediate: true })
</script>
