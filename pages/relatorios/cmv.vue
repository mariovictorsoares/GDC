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
            <NuxtLink to="/configuracoes/faturamentos" class="underline font-medium">Cadastrar faturamentos</NuxtLink>
          </p>
        </div>
      </div>
    </UCard>

    <!-- Resumo Anual -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Total Compras</p>
          <p class="text-2xl font-bold text-green-600">{{ formatCurrency(resumoAnual.compras) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">CMV Total</p>
          <p class="text-2xl font-bold text-red-600">{{ formatCurrency(resumoAnual.cmv) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Faturamento Total</p>
          <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(resumoAnual.faturamento) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">% CMV Médio</p>
          <p
            class="text-2xl font-bold"
            :class="resumoAnual.percentualCmv <= 35 ? 'text-green-600' : resumoAnual.percentualCmv <= 40 ? 'text-yellow-600' : 'text-red-600'"
          >
            {{ formatNumber(resumoAnual.percentualCmv) }}%
          </p>
        </div>
      </UCard>
    </div>

    <!-- Tabela Mensal -->
    <UCard :ui="{ body: { padding: '' } }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Evolução Mensal</h3>
          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-500">Meta CMV:</span>
            <UBadge color="gray">{{ metaCMV }}%</UBadge>
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
          <UBadge :color="row.percentual_cmv <= metaCMV ? 'green' : 'red'">
            {{ row.percentual_cmv <= metaCMV ? 'OK' : 'ACIMA' }}
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

    <!-- Fórmula e Explicação -->
    <UCard>
      <h4 class="font-semibold mb-3">Fórmula do CMV:</h4>
      <div class="p-4 bg-gray-50 rounded-lg text-center">
        <p class="text-lg font-mono">
          CMV = Estoque Inicial + Compras - Estoque Final
        </p>
      </div>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          <p class="font-medium text-gray-900">O que é CMV?</p>
          <p>O Custo da Mercadoria Vendida representa o custo direto dos produtos que foram vendidos em um período.</p>
        </div>
        <div>
          <p class="font-medium text-gray-900">% CMV ideal</p>
          <p>Para restaurantes e food service, o CMV ideal geralmente fica entre 28% e 35% do faturamento.</p>
          <ul class="mt-2 list-disc list-inside">
            <li class="text-green-600">Até 35%: Excelente</li>
            <li class="text-yellow-600">35% - 40%: Atenção</li>
            <li class="text-red-600">Acima de 40%: Crítico</li>
          </ul>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { CMV } from '~/types'

const { getCMV } = useRelatorios()
const { getConfiguracao } = useEstoque()
const toast = useToast()

const cmvData = ref<CMV[]>([])
const loading = ref(false)
const selectedAno = ref(new Date().getFullYear())
const metaCMV = ref(35)

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
  { key: 'percentual_cmv', label: '% CMV' },
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
    return { compras: 0, cmv: 0, faturamento: 0, percentualCmv: 0 }
  }

  const compras = cmvData.value.reduce((sum, c) => sum + c.compras, 0)
  const cmv = cmvData.value.reduce((sum, c) => sum + c.cmv, 0)
  const faturamento = cmvData.value.reduce((sum, c) => sum + c.faturamento, 0)
  const percentualCmv = faturamento > 0 ? (cmv / faturamento) * 100 : 0

  return { compras, cmv, faturamento, percentualCmv }
})

// Verificar se há meses sem faturamento cadastrado
const mesesSemFaturamento = computed(() => {
  return cmvData.value.filter(c => c.faturamento === 0 && c.compras > 0).length
})

const temFaturamentoFaltando = computed(() => mesesSemFaturamento.value > 0)

const getPercentualClass = (percentual: number) => {
  if (percentual <= 35) return 'bg-green-500'
  if (percentual <= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getPercentualTextClass = (percentual: number) => {
  if (percentual <= 35) return 'text-green-600'
  if (percentual <= 40) return 'text-yellow-600'
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

const loadMeta = async () => {
  try {
    const config = await getConfiguracao('meta_cmv')
    if (config) {
      metaCMV.value = parseFloat(config.valor) * 100
    }
  } catch (error) {
    console.error('Erro ao carregar meta:', error)
  }
}

watch(selectedAno, () => {
  loadCMV()
})

onMounted(() => {
  loadMeta()
  loadCMV()
})
</script>
