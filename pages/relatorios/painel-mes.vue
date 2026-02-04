<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Painel do Mês</h1>
        <p class="text-sm text-gray-500">Visão consolidada do estoque por produto com CMV</p>
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
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <p class="text-sm text-gray-500">Estoque Final</p>
          <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(resumo.estoqueFinal) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">CMV (Saídas)</p>
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
              <th colspan="7" class="px-3 py-2 text-center text-xs font-medium text-green-600 uppercase tracking-wider border-r bg-green-50">Entradas</th>
              <th colspan="7" class="px-3 py-2 text-center text-xs font-medium text-red-600 uppercase tracking-wider border-r bg-red-50">Saídas</th>
              <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">E.F.</th>
              <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">C.Unit</th>
              <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">C.Total</th>
              <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-orange-600 uppercase tracking-wider bg-orange-50">CMV</th>
            </tr>
            <tr>
              <!-- Entradas por semana -->
              <th class="px-2 py-1 text-center text-xs font-medium text-green-500 bg-green-50">
                <UTooltip :text="semanas[0]"><span>S1</span></UTooltip>
              </th>
              <th class="px-2 py-1 text-center text-xs font-medium text-green-500 bg-green-50">
                <UTooltip :text="semanas[1]"><span>S2</span></UTooltip>
              </th>
              <th class="px-2 py-1 text-center text-xs font-medium text-green-500 bg-green-50">
                <UTooltip :text="semanas[2]"><span>S3</span></UTooltip>
              </th>
              <th class="px-2 py-1 text-center text-xs font-medium text-green-500 bg-green-50">
                <UTooltip :text="semanas[3]"><span>S4</span></UTooltip>
              </th>
              <th class="px-2 py-1 text-center text-xs font-medium text-green-500 bg-green-50">
                <UTooltip :text="semanas[4]"><span>S5</span></UTooltip>
              </th>
              <th class="px-2 py-1 text-center text-xs font-medium text-green-500 bg-green-50">
                <UTooltip :text="semanas[5]"><span>S6</span></UTooltip>
              </th>
              <th class="px-2 py-1 text-center text-xs font-medium text-green-600 bg-green-50 border-r">Tot</th>
              <!-- Saídas por semana -->
              <th class="px-2 py-1 text-center text-xs font-medium text-red-500 bg-red-50">
                <UTooltip :text="semanas[0]"><span>S1</span></UTooltip>
              </th>
              <th class="px-2 py-1 text-center text-xs font-medium text-red-500 bg-red-50">
                <UTooltip :text="semanas[1]"><span>S2</span></UTooltip>
              </th>
              <th class="px-2 py-1 text-center text-xs font-medium text-red-500 bg-red-50">
                <UTooltip :text="semanas[2]"><span>S3</span></UTooltip>
              </th>
              <th class="px-2 py-1 text-center text-xs font-medium text-red-500 bg-red-50">
                <UTooltip :text="semanas[3]"><span>S4</span></UTooltip>
              </th>
              <th class="px-2 py-1 text-center text-xs font-medium text-red-500 bg-red-50">
                <UTooltip :text="semanas[4]"><span>S5</span></UTooltip>
              </th>
              <th class="px-2 py-1 text-center text-xs font-medium text-red-500 bg-red-50">
                <UTooltip :text="semanas[5]"><span>S6</span></UTooltip>
              </th>
              <th class="px-2 py-1 text-center text-xs font-medium text-red-600 bg-red-50 border-r">Tot</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="18" class="px-3 py-8 text-center text-gray-500">
                <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin mx-auto mb-2" />
                Carregando...
              </td>
            </tr>
            <tr v-else-if="filteredPainel.length === 0">
              <td colspan="18" class="px-3 py-8 text-center text-gray-500">
                Nenhum dado encontrado para o período selecionado
              </td>
            </tr>
            <tr v-for="item in paginatedItems" :key="item.produto_id" class="hover:bg-gray-50">
              <td class="px-2 py-2 text-xs text-gray-600 border-r truncate max-w-[80px]" :title="item.categoria">{{ item.categoria }}</td>
              <td class="px-2 py-2 text-xs font-medium text-gray-900 border-r truncate max-w-[120px]" :title="item.produto">{{ item.produto }}</td>
              <td class="px-2 py-2 text-xs text-center text-gray-600 border-r">{{ formatQtd(item.estoque_inicial) }}</td>
              <!-- Entradas -->
              <td class="px-1 py-2 text-xs text-center text-green-600 bg-green-50/50">{{ formatQtd(item.entradas_semana1) }}</td>
              <td class="px-1 py-2 text-xs text-center text-green-600 bg-green-50/50">{{ formatQtd(item.entradas_semana2) }}</td>
              <td class="px-1 py-2 text-xs text-center text-green-600 bg-green-50/50">{{ formatQtd(item.entradas_semana3) }}</td>
              <td class="px-1 py-2 text-xs text-center text-green-600 bg-green-50/50">{{ formatQtd(item.entradas_semana4) }}</td>
              <td class="px-1 py-2 text-xs text-center text-green-600 bg-green-50/50">{{ formatQtd(item.entradas_semana5) }}</td>
              <td class="px-1 py-2 text-xs text-center text-green-600 bg-green-50/50">{{ formatQtd(item.entradas_semana6) }}</td>
              <td class="px-1 py-2 text-xs text-center font-medium text-green-700 bg-green-100 border-r">{{ formatQtd(item.total_entradas) }}</td>
              <!-- Saídas -->
              <td class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ formatQtd(item.saidas_semana1) }}</td>
              <td class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ formatQtd(item.saidas_semana2) }}</td>
              <td class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ formatQtd(item.saidas_semana3) }}</td>
              <td class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ formatQtd(item.saidas_semana4) }}</td>
              <td class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ formatQtd(item.saidas_semana5) }}</td>
              <td class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ formatQtd(item.saidas_semana6) }}</td>
              <td class="px-1 py-2 text-xs text-center font-medium text-red-700 bg-red-100 border-r">{{ formatQtd(item.total_saidas) }}</td>
              <!-- Totais -->
              <td class="px-2 py-2 text-xs text-center font-medium text-blue-600 border-r">{{ formatQtd(item.estoque_final) }}</td>
              <td class="px-2 py-2 text-xs text-center text-gray-600 border-r">{{ formatCurrencyShort(item.custo) }}</td>
              <td class="px-2 py-2 text-xs text-center font-medium text-gray-900 border-r">{{ formatCurrencyShort(item.valor_total) }}</td>
              <!-- CMV -->
              <td class="px-2 py-2 text-xs text-center font-medium text-orange-600 bg-orange-50/50">{{ formatCurrencyShort(item.cmv || 0) }}</td>
            </tr>
          </tbody>
          <tfoot class="bg-gray-100">
            <tr class="font-semibold">
              <td colspan="2" class="px-3 py-2 text-xs text-gray-700 border-r">TOTAL</td>
              <td class="px-3 py-2 text-xs text-center text-gray-700 border-r">-</td>
              <td colspan="7" class="px-3 py-2 text-xs text-center text-green-700 border-r bg-green-100">{{ formatQtd(totais.entradas) }}</td>
              <td colspan="7" class="px-3 py-2 text-xs text-center text-red-700 border-r bg-red-100">{{ formatQtd(totais.saidas) }}</td>
              <td class="px-3 py-2 text-xs text-center text-blue-700 border-r">-</td>
              <td class="px-3 py-2 text-xs text-center text-gray-700 border-r">-</td>
              <td class="px-3 py-2 text-xs text-center text-gray-900 border-r">{{ formatCurrencyShort(totais.valor) }}</td>
              <td class="px-3 py-2 text-xs text-center text-orange-700 bg-orange-100">{{ formatCurrencyShort(totais.cmv) }}</td>
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

const semanas = computed(() => {
  const ano = selectedAno.value
  const mes = selectedMes.value - 1
  const resultado: string[] = []

  for (let i = 0; i < 6; i++) {
    const inicio = new Date(ano, mes, i * 5 + 1)
    const fim = new Date(ano, mes, Math.min((i + 1) * 5, new Date(ano, mes + 1, 0).getDate()))

    if (inicio.getMonth() !== mes) {
      resultado.push('')
      continue
    }

    const formatDay = (d: Date) => d.getDate().toString().padStart(2, '0')
    resultado.push(`${formatDay(inicio)} a ${formatDay(fim)}/${mes + 1}`)
  }

  return resultado
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
