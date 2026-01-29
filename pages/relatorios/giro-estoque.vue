<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Giro de Estoque</h1>
        <p class="text-sm text-gray-500">Análise de velocidade de rotação do estoque</p>
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
        <UButton color="primary" @click="loadGiro" :loading="loading">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
          Atualizar
        </UButton>
      </div>
    </UCard>

    <!-- Resumo Anual -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Estoque Médio Anual</p>
          <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(resumoAnual.estoqueMedio) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">CMV Total</p>
          <p class="text-2xl font-bold text-red-600">{{ formatCurrency(resumoAnual.cmvTotal) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Giro Médio (dias)</p>
          <p class="text-2xl font-bold text-blue-600">{{ formatNumber(resumoAnual.giroMedioDias) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Giro Médio (vezes/mês)</p>
          <p class="text-2xl font-bold text-green-600">{{ formatNumber(resumoAnual.giroMedioVezes) }}</p>
        </div>
      </UCard>
    </div>

    <!-- Tabela Mensal -->
    <UCard :ui="{ body: { padding: '' } }">
      <template #header>
        <h3 class="font-semibold">Evolução Mensal</h3>
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
          <span class="font-medium">{{ row.mes }}</span>
        </template>
        <template #estoque_real-data="{ row }">
          {{ formatCurrency(row.estoque_real) }}
        </template>
        <template #estoque_medio-data="{ row }">
          {{ formatCurrency(row.estoque_medio) }}
        </template>
        <template #cmv-data="{ row }">
          <span class="text-red-600">{{ formatCurrency(row.cmv) }}</span>
        </template>
        <template #giro_dias_real-data="{ row }">
          <span :class="getGiroClass(row.giro_dias_real)">
            {{ formatNumber(row.giro_dias_real) }} dias
          </span>
        </template>
        <template #vezes_mes_real-data="{ row }">
          {{ formatNumber(row.vezes_mes_real) }}x
        </template>
        <template #giro_dias_medio-data="{ row }">
          {{ formatNumber(row.giro_dias_medio) }} dias
        </template>
        <template #vezes_mes_medio-data="{ row }">
          {{ formatNumber(row.vezes_mes_medio) }}x
        </template>
      </UTable>
      <TablePagination
        v-model="page"
        :page-size="pageSize"
        :total-items="giroData.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>

    <!-- Explicação -->
    <UCard>
      <h4 class="font-semibold mb-3">Como interpretar o Giro de Estoque:</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          <p class="font-medium text-gray-900">Giro em Dias</p>
          <p>Indica quantos dias o estoque demora para ser totalmente renovado. Quanto menor, melhor a eficiência.</p>
          <ul class="mt-2 list-disc list-inside">
            <li class="text-green-600">Até 30 dias: Excelente</li>
            <li class="text-yellow-600">30-60 dias: Bom</li>
            <li class="text-red-600">Acima de 60 dias: Atenção</li>
          </ul>
        </div>
        <div>
          <p class="font-medium text-gray-900">Vezes por Mês</p>
          <p>Indica quantas vezes o estoque é renovado por mês. Quanto maior, mais eficiente.</p>
          <p class="mt-2"><strong>Fórmula:</strong> CMV / Estoque Médio</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { GiroEstoque } from '~/types'

const { getGiroEstoque } = useRelatorios()
const toast = useToast()

const giroData = ref<GiroEstoque[]>([])
const loading = ref(false)
const selectedAno = ref(new Date().getFullYear())

const { page, pageSize, paginatedItems } = usePagination(giroData)

const columns = [
  { key: 'mes', label: 'Mês' },
  { key: 'estoque_real', label: 'Estoque Real' },
  { key: 'estoque_medio', label: 'Estoque Médio' },
  { key: 'cmv', label: 'CMV' },
  { key: 'giro_dias_real', label: 'Giro (dias)' },
  { key: 'vezes_mes_real', label: 'Vezes/Mês' },
  { key: 'giro_dias_medio', label: 'Giro Médio (dias)' },
  { key: 'vezes_mes_medio', label: 'Vezes/Mês Médio' }
]

const anosOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    label: String(currentYear - 2 + i),
    value: currentYear - 2 + i
  }))
})

const resumoAnual = computed(() => {
  if (giroData.value.length === 0) {
    return { estoqueMedio: 0, cmvTotal: 0, giroMedioDias: 0, giroMedioVezes: 0 }
  }

  const mesesComDados = giroData.value.filter(g => g.cmv > 0)

  const estoqueMedio = giroData.value.reduce((sum, g) => sum + g.estoque_medio, 0) / giroData.value.length
  const cmvTotal = giroData.value.reduce((sum, g) => sum + g.cmv, 0)

  const giroMedioDias = mesesComDados.length > 0
    ? mesesComDados.reduce((sum, g) => sum + g.giro_dias_real, 0) / mesesComDados.length
    : 0

  const giroMedioVezes = mesesComDados.length > 0
    ? mesesComDados.reduce((sum, g) => sum + g.vezes_mes_real, 0) / mesesComDados.length
    : 0

  return { estoqueMedio, cmvTotal, giroMedioDias, giroMedioVezes }
})

const getGiroClass = (dias: number) => {
  if (dias <= 30) return 'text-green-600 font-medium'
  if (dias <= 60) return 'text-yellow-600'
  return 'text-red-600'
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value || 0)
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const loadGiro = async () => {
  try {
    loading.value = true
    giroData.value = await getGiroEstoque(selectedAno.value)
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar giro de estoque',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

watch(selectedAno, () => {
  loadGiro()
})

onMounted(() => {
  loadGiro()
})
</script>
