<template>
  <div class="space-y-6">
    <!-- Header -->
    <h1 class="text-2xl font-semibold text-[#5a5a66] mb-2">Giro de Estoque</h1>

    <!-- Resumo Anual + Year Picker -->
    <div class="flex items-center gap-3">
      <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span class="text-[11px] font-medium text-operacao-400">CMV Total</span>
        </div>
        <p class="text-base font-bold text-red-600">{{ formatCurrency(resumoAnual.cmvTotal) }}</p>
      </div>
      <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full bg-guardian-400" />
          <span class="text-[11px] font-medium text-operacao-400">Giro Médio (dias)</span>
        </div>
        <p class="text-base font-bold" :class="getGiroClass(resumoAnual.giroMedioDias)">{{ resumoAnual.giroMedioDias.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
      </div>
      <div class="ml-auto inline-flex items-center gap-1 ring-1 ring-[#EBEBED] rounded-lg bg-white shadow-sm">
        <button
          class="p-1.5 rounded-l-lg hover:bg-operacao-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          :disabled="selectedAno <= minAno"
          @click="selectedAno--"
        >
          <UIcon name="i-heroicons-chevron-left-20-solid" class="w-4 h-4 text-operacao-500" />
        </button>
        <span class="px-3 py-1 text-sm font-semibold text-[#5a5a66] tabular-nums select-none min-w-[3.5rem] text-center">{{ selectedAno }}</span>
        <button
          class="p-1.5 rounded-r-lg hover:bg-operacao-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          :disabled="selectedAno >= maxAno"
          @click="selectedAno++"
        >
          <UIcon name="i-heroicons-chevron-right-20-solid" class="w-4 h-4 text-operacao-500" />
        </button>
      </div>
    </div>

    <!-- Tabela Mensal -->
    <UCard :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
      <UTable
        :columns="columns"
        :rows="giroData"
        :loading="loading"
        :ui="{
          divide: 'divide-y divide-operacao-50 dark:divide-operacao-700',
          thead: '',
          th: { base: 'bg-operacao-100/70 dark:bg-operacao-800 border-b border-operacao-200/60 [&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66] [&_button>span+span]:text-operacao-300 [&_button>span+span]:!w-3.5 [&_button>span+span]:!h-3.5', color: 'text-[#5a5a66] dark:text-operacao-400', font: 'font-medium', size: 'text-xs uppercase tracking-wider', padding: 'px-4 py-2' },
          td: { color: 'text-operacao-600 dark:text-operacao-200', size: 'text-sm', padding: 'px-4 py-2.5' }
        }"
      >
        <!-- Empty State -->
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-operacao-400">
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
            {{ row.giro_dias_real.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} dias
          </span>
        </template>
      </UTable>
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

// Year picker limits
const currentYear = new Date().getFullYear()
const minAno = currentYear - 2
const maxAno = currentYear + 2

const columns = [
  { key: 'mes', label: 'Mês' },
  { key: 'estoque_real', label: 'Estoque Final (R$)' },
  { key: 'cmv', label: 'CMV (R$)' },
  { key: 'giro_dias_real', label: 'Giro (dias)' }
]

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
  if (dias <= 6.99) return 'text-controle-600 font-medium'  // Excelente
  if (dias <= 9.99) return 'text-alerta-600 font-medium'  // Aceitável
  return 'text-red-600 font-medium'                        // Atenção
}

const { formatCurrency, formatNumber } = useFormatters()

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

// Realtime
const { onTableChange } = useRealtime()
onTableChange(['entradas', 'saidas', 'ajustes', 'produtos', 'faturamentos'], () => loadGiro())

watch(empresaId, () => {
  if (empresaId.value) {
    loadGiro()
  }
}, { immediate: true })
</script>
