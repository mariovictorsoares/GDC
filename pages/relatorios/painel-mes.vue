<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Painel do Mês</h1>
        <p class="text-sm text-gray-500">Visão consolidada do estoque por produto com CMV e Giro</p>
      </div>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="flex flex-wrap gap-4 items-end">
        <UFormGroup label="Mês">
          <USelect
            v-model="selectedMes"
            :options="mesesOptions"
            class="w-40"
          />
        </UFormGroup>
        <UFormGroup label="Ano">
          <USelect
            v-model="selectedAno"
            :options="anosOptions"
            class="w-32"
          />
        </UFormGroup>
        <UButton color="primary" @click="loadPainel" :loading="loading">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
          Atualizar
        </UButton>
      </div>
    </UCard>

    <!-- Resumo Geral -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Estoque Inicial</p>
          <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(resumo.estoqueInicial) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Total Entradas</p>
          <p class="text-2xl font-bold text-green-600">{{ formatCurrency(resumo.totalEntradas) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Total Saídas</p>
          <p class="text-2xl font-bold text-red-600">{{ formatCurrency(resumo.totalSaidas) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Estoque Final</p>
          <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(resumo.estoqueFinal) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">CMV Total</p>
          <p class="text-2xl font-bold text-orange-600">{{ formatCurrency(resumo.cmvTotal) }}</p>
        </div>
      </UCard>
    </div>

    <!-- Tabela do Painel -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Movimentação por Produto</h3>
          <UInput
            v-model="search"
            placeholder="Buscar produto..."
            icon="i-heroicons-magnifying-glass"
            class="w-64"
          />
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th rowspan="2" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Cat.</th>
              <th rowspan="2" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Produto</th>
              <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">E.I.</th>
              <th colspan="7" class="px-3 py-2 text-center text-xs font-medium text-red-600 uppercase tracking-wider border-r bg-red-50">Saídas</th>
              <th colspan="7" class="px-3 py-2 text-center text-xs font-medium text-green-600 uppercase tracking-wider border-r bg-green-50">Entradas</th>
              <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">E.F.</th>
              <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Custo</th>
              <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Valor</th>
              <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-orange-600 uppercase tracking-wider border-r bg-orange-50">CMV</th>
              <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-purple-600 uppercase tracking-wider border-r bg-purple-50">Giro</th>
              <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-purple-600 uppercase tracking-wider bg-purple-50">Vz/Mês</th>
            </tr>
            <tr>
              <!-- Saídas por semana -->
              <th class="px-2 py-1 text-center text-xs font-medium text-red-500 bg-red-50">S1</th>
              <th class="px-2 py-1 text-center text-xs font-medium text-red-500 bg-red-50">S2</th>
              <th class="px-2 py-1 text-center text-xs font-medium text-red-500 bg-red-50">S3</th>
              <th class="px-2 py-1 text-center text-xs font-medium text-red-500 bg-red-50">S4</th>
              <th class="px-2 py-1 text-center text-xs font-medium text-red-500 bg-red-50">S5</th>
              <th class="px-2 py-1 text-center text-xs font-medium text-red-500 bg-red-50">S6</th>
              <th class="px-2 py-1 text-center text-xs font-medium text-red-600 bg-red-50 border-r">Tot</th>
              <!-- Entradas por semana -->
              <th class="px-2 py-1 text-center text-xs font-medium text-green-500 bg-green-50">S1</th>
              <th class="px-2 py-1 text-center text-xs font-medium text-green-500 bg-green-50">S2</th>
              <th class="px-2 py-1 text-center text-xs font-medium text-green-500 bg-green-50">S3</th>
              <th class="px-2 py-1 text-center text-xs font-medium text-green-500 bg-green-50">S4</th>
              <th class="px-2 py-1 text-center text-xs font-medium text-green-500 bg-green-50">S5</th>
              <th class="px-2 py-1 text-center text-xs font-medium text-green-500 bg-green-50">S6</th>
              <th class="px-2 py-1 text-center text-xs font-medium text-green-600 bg-green-50 border-r">Tot</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="22" class="px-3 py-8 text-center text-gray-500">
                <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin mx-auto mb-2" />
                Carregando...
              </td>
            </tr>
            <tr v-else-if="filteredPainel.length === 0">
              <td colspan="22" class="px-3 py-8 text-center text-gray-500">
                Nenhum dado encontrado para o período selecionado
              </td>
            </tr>
            <tr v-for="item in paginatedItems" :key="item.produto_id" class="hover:bg-gray-50">
              <td class="px-2 py-2 text-xs text-gray-600 border-r truncate max-w-[80px]" :title="item.categoria">{{ item.categoria }}</td>
              <td class="px-2 py-2 text-xs font-medium text-gray-900 border-r truncate max-w-[120px]" :title="item.produto">{{ item.produto }}</td>
              <td class="px-2 py-2 text-xs text-center text-gray-600 border-r">{{ formatQtd(item.estoque_inicial) }}</td>
              <!-- Saídas -->
              <td class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ formatQtd(item.saidas_semana1) }}</td>
              <td class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ formatQtd(item.saidas_semana2) }}</td>
              <td class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ formatQtd(item.saidas_semana3) }}</td>
              <td class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ formatQtd(item.saidas_semana4) }}</td>
              <td class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ formatQtd(item.saidas_semana5) }}</td>
              <td class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ formatQtd(item.saidas_semana6) }}</td>
              <td class="px-1 py-2 text-xs text-center font-medium text-red-700 bg-red-100 border-r">{{ formatQtd(item.total_saidas) }}</td>
              <!-- Entradas -->
              <td class="px-1 py-2 text-xs text-center text-green-600 bg-green-50/50">{{ formatQtd(item.entradas_semana1) }}</td>
              <td class="px-1 py-2 text-xs text-center text-green-600 bg-green-50/50">{{ formatQtd(item.entradas_semana2) }}</td>
              <td class="px-1 py-2 text-xs text-center text-green-600 bg-green-50/50">{{ formatQtd(item.entradas_semana3) }}</td>
              <td class="px-1 py-2 text-xs text-center text-green-600 bg-green-50/50">{{ formatQtd(item.entradas_semana4) }}</td>
              <td class="px-1 py-2 text-xs text-center text-green-600 bg-green-50/50">{{ formatQtd(item.entradas_semana5) }}</td>
              <td class="px-1 py-2 text-xs text-center text-green-600 bg-green-50/50">{{ formatQtd(item.entradas_semana6) }}</td>
              <td class="px-1 py-2 text-xs text-center font-medium text-green-700 bg-green-100 border-r">{{ formatQtd(item.total_entradas) }}</td>
              <!-- Totais -->
              <td class="px-2 py-2 text-xs text-center font-medium text-blue-600 border-r">{{ formatQtd(item.estoque_final) }}</td>
              <td class="px-2 py-2 text-xs text-center text-gray-600 border-r">{{ formatCurrencyShort(item.custo) }}</td>
              <td class="px-2 py-2 text-xs text-center font-medium text-gray-900 border-r">{{ formatCurrencyShort(item.valor_total) }}</td>
              <!-- CMV e Giro -->
              <td class="px-2 py-2 text-xs text-center font-medium text-orange-600 bg-orange-50/50 border-r">{{ formatCurrencyShort(item.cmv || 0) }}</td>
              <td class="px-2 py-2 text-xs text-center text-purple-600 bg-purple-50/50 border-r">
                <span v-if="item.giro_dias !== null && item.giro_dias !== undefined">{{ formatQtd(item.giro_dias) }}d</span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-2 py-2 text-xs text-center text-purple-600 bg-purple-50/50">
                <span v-if="item.vezes_mes !== null && item.vezes_mes !== undefined">{{ formatQtd(item.vezes_mes) }}x</span>
                <span v-else class="text-gray-400">-</span>
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-gray-100">
            <tr class="font-semibold">
              <td colspan="2" class="px-3 py-2 text-xs text-gray-700 border-r">TOTAL</td>
              <td class="px-3 py-2 text-xs text-center text-gray-700 border-r">-</td>
              <td colspan="7" class="px-3 py-2 text-xs text-center text-red-700 border-r bg-red-100">{{ formatQtd(totais.saidas) }}</td>
              <td colspan="7" class="px-3 py-2 text-xs text-center text-green-700 border-r bg-green-100">{{ formatQtd(totais.entradas) }}</td>
              <td class="px-3 py-2 text-xs text-center text-blue-700 border-r">-</td>
              <td class="px-3 py-2 text-xs text-center text-gray-700 border-r">-</td>
              <td class="px-3 py-2 text-xs text-center text-gray-900 border-r">{{ formatCurrencyShort(totais.valor) }}</td>
              <td class="px-3 py-2 text-xs text-center text-orange-700 bg-orange-100 border-r">{{ formatCurrencyShort(totais.cmv) }}</td>
              <td class="px-3 py-2 text-xs text-center text-purple-700 bg-purple-100 border-r">-</td>
              <td class="px-3 py-2 text-xs text-center text-purple-700 bg-purple-100">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <TablePagination
        v-model="page"
        :page-size="pageSize"
        :total-items="filteredPainel.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>

    <!-- Legenda -->
    <UCard>
      <h4 class="font-semibold mb-3">Legenda das colunas:</h4>
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
        <div>
          <p class="font-medium text-gray-900">E.I. / E.F.</p>
          <p class="text-gray-600">Estoque Inicial / Final</p>
        </div>
        <div>
          <p class="font-medium text-gray-900">S1 a S6</p>
          <p class="text-gray-600">Semanas 1 a 6 do mês</p>
        </div>
        <div>
          <p class="font-medium text-orange-600">CMV</p>
          <p class="text-gray-600">Custo da Mercadoria Vendida (excluindo MTP)</p>
        </div>
        <div>
          <p class="font-medium text-purple-600">Giro (dias)</p>
          <p class="text-gray-600">Quantos dias o estoque dura: (Est.Final / CMV) * 30</p>
        </div>
        <div>
          <p class="font-medium text-purple-600">Vz/Mês</p>
          <p class="text-gray-600">Vezes que o estoque gira no mês: CMV / Est.Final</p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { PainelMes } from '~/types'

const { getPainelMes } = useRelatorios()
const toast = useToast()

const painelData = ref<PainelMes[]>([])
const loading = ref(false)
const search = ref('')

const hoje = new Date()
const selectedMes = ref(hoje.getMonth() + 1)
const selectedAno = ref(hoje.getFullYear())

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

const anosOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    label: String(currentYear - 2 + i),
    value: currentYear - 2 + i
  }))
})

const filteredPainel = computed(() => {
  if (!search.value) return painelData.value
  const term = search.value.toLowerCase()
  return painelData.value.filter(p =>
    p.produto.toLowerCase().includes(term) ||
    p.categoria.toLowerCase().includes(term)
  )
})

const { page, pageSize, paginatedItems } = usePagination(filteredPainel)

const resumo = computed(() => {
  const data = filteredPainel.value
  return {
    estoqueInicial: data.reduce((sum, p) => sum + (p.estoque_inicial * p.custo), 0),
    totalEntradas: data.reduce((sum, p) => sum + (p.total_entradas * p.custo), 0),
    totalSaidas: data.reduce((sum, p) => sum + (p.total_saidas * p.custo), 0),
    estoqueFinal: data.reduce((sum, p) => sum + p.valor_total, 0),
    cmvTotal: data.reduce((sum, p) => sum + (p.cmv || 0), 0)
  }
})

const totais = computed(() => {
  const data = filteredPainel.value
  return {
    saidas: data.reduce((sum, p) => sum + p.total_saidas, 0),
    entradas: data.reduce((sum, p) => sum + p.total_entradas, 0),
    valor: data.reduce((sum, p) => sum + p.valor_total, 0),
    cmv: data.reduce((sum, p) => sum + (p.cmv || 0), 0)
  }
})

const formatQtd = (value: number | null | undefined) => {
  if (value === null || value === undefined || value === 0) return '-'
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const formatCurrencyShort = (value: number) => {
  if (!value || value === 0) return '-'
  if (value >= 1000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value)
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

const loadPainel = async () => {
  try {
    loading.value = true
    painelData.value = await getPainelMes(selectedAno.value, selectedMes.value)
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar painel',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPainel()
})
</script>
