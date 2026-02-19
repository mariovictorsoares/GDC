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

    <!-- Resumo Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="i in 2" :key="i" class="rounded-xl bg-white ring-1 ring-gray-100 shadow-sm p-5">
        <div class="text-center space-y-2">
          <USkeleton class="h-4 w-28 mx-auto" />
          <USkeleton class="h-8 w-32 mx-auto" />
        </div>
      </div>
    </div>

    <!-- Resumo Anual -->
    <div v-if="!loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">CMV Total</p>
          <p class="text-2xl font-bold text-red-600">{{ formatCurrency(resumoAnual.cmvTotal) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Giro Médio (dias)</p>
          <p class="text-2xl font-bold" :class="getGiroClass(resumoAnual.giroMedioDias)">{{ formatNumber(resumoAnual.giroMedioDias) }}</p>
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
        <template #cmv-data="{ row }">
          <span class="text-red-600">{{ formatCurrency(row.cmv) }}</span>
        </template>
        <template #giro_dias_real-data="{ row }">
          <span :class="getGiroClass(row.giro_dias_real)">
            {{ formatNumber(row.giro_dias_real) }} dias
          </span>
        </template>
      </UTable>
      <TablePagination
        v-model="page"
        :page-size="pageSize"
        :total-items="giroData.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { GiroEstoque } from '~/types'

const { getGiroEstoque } = useRelatorios()
const { empresaId } = useEmpresa()
const toast = useToast()

const giroData = ref<GiroEstoque[]>([])
const loading = ref(false)
const selectedAno = ref(new Date().getFullYear())

const { page, pageSize, paginatedItems } = usePagination(giroData)

const columns = [
  { key: 'mes', label: 'Mês' },
  { key: 'estoque_real', label: 'Estoque Final (R$)' },
  { key: 'cmv', label: 'CMV (R$)' },
  { key: 'giro_dias_real', label: 'Giro (dias)' }
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
    return { cmvTotal: 0, giroMedioDias: 0 }
  }

  const mesesComDados = giroData.value.filter(g => g.cmv > 0)

  const cmvTotal = giroData.value.reduce((sum, g) => sum + g.cmv, 0)

  const giroMedioDias = mesesComDados.length > 0
    ? mesesComDados.reduce((sum, g) => sum + g.giro_dias_real, 0) / mesesComDados.length
    : 0

  return { cmvTotal, giroMedioDias }
})

const getGiroClass = (dias: number) => {
  if (dias <= 6.99) return 'text-green-600 font-medium'  // Excelente
  if (dias <= 9.99) return 'text-yellow-600 font-medium'  // Aceitável
  return 'text-red-600 font-medium'                        // Atenção
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

watch(empresaId, () => {
  if (empresaId.value) {
    loadGiro()
  }
}, { immediate: true })
</script>
