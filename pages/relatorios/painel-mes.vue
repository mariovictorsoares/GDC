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
        <UFormGroup>
          <template #label>
            <div class="flex items-center gap-1">
              <span>Visualização</span>
              <UPopover :popper="{ placement: 'top', offsetDistance: 8 }" mode="hover" :open-delay="200" :close-delay="100">
                <UIcon
                  name="i-heroicons-question-mark-circle"
                  class="w-3.5 h-3.5 text-gray-400 hover:text-primary-500 cursor-help transition-colors"
                />
                <template #panel>
                  <div class="p-3 text-xs space-y-2 max-w-[280px]">
                    <p class="font-semibold text-gray-900 border-b border-gray-200 pb-1.5">Modos de Visualização</p>
                    <div class="flex gap-2">
                      <span class="inline-block w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                      <div><span class="font-medium text-gray-800">CMV Consumo:</span> <span class="text-gray-500">Transf. + Definitiva — custo total das saídas (exceto produção)</span></div>
                    </div>
                    <div class="flex gap-2">
                      <span class="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div><span class="font-medium text-gray-800">Transferência:</span> <span class="text-gray-500">Apenas movimentações para o estoque de apoio</span></div>
                    </div>
                    <div class="flex gap-2">
                      <span class="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <div><span class="font-medium text-gray-800">Definitiva:</span> <span class="text-gray-500">Apenas saídas finais (consumo, venda, perda)</span></div>
                    </div>
                    <div class="flex gap-2">
                      <span class="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      <div><span class="font-medium text-gray-800">Produção:</span> <span class="text-gray-500">Saídas para beneficiamento / industrialização</span></div>
                    </div>
                  </div>
                </template>
              </UPopover>
            </div>
          </template>
          <USelect
            v-model="tipoVisualizacao"
            :options="visualizacaoOptions"
            class="w-48"
          />
        </UFormGroup>
        <UButton color="primary" @click="loadPainel" :loading="loading">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
          Atualizar
        </UButton>
      </div>
    </UCard>

    <!-- Resumo Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 gap-4" :class="showCmv ? 'md:grid-cols-4' : 'md:grid-cols-3'">
      <div v-for="i in (showCmv ? 4 : 3)" :key="i" class="rounded-xl bg-white ring-1 ring-gray-100 shadow-sm p-5">
        <div class="text-center space-y-2">
          <USkeleton class="h-4 w-24 mx-auto" />
          <USkeleton class="h-8 w-32 mx-auto" />
        </div>
      </div>
    </div>

    <!-- Resumo Geral -->
    <div v-if="!loading" class="grid grid-cols-1 gap-4" :class="showCmv ? 'md:grid-cols-4' : 'md:grid-cols-3'">
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
          <p class="text-sm text-gray-500">Estoque Total</p>
          <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(resumo.estoqueFinal) }}</p>
        </div>
      </UCard>
      <UCard v-if="showCmv">
        <div class="text-center">
          <p class="text-sm text-gray-500">{{ labelCmv }}</p>
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

      <div class="relative overflow-x-auto">
        <!-- Loading overlay -->
        <Transition
          enter-active-class="transition-opacity duration-200"
          leave-active-class="transition-opacity duration-200"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-lg">
            <div class="flex flex-col items-center gap-2">
              <div class="w-8 h-8 border-[3px] border-gray-200 border-t-primary-500 rounded-full animate-spin" />
              <span class="text-sm text-gray-500 font-medium">Carregando dados...</span>
            </div>
          </div>
        </Transition>

        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th rowspan="2" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Cat.</th>
              <th rowspan="2" class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Produto</th>
              <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">E.I.</th>
              <th :colspan="semanas.length + 1" class="px-3 py-2 text-center text-xs font-medium text-green-600 uppercase tracking-wider border-r bg-green-50">Entradas</th>
              <th :colspan="semanas.length + 1" class="px-3 py-2 text-center text-xs font-medium text-red-600 uppercase tracking-wider border-r bg-red-50">Saídas</th>
              <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">E.F.</th>
              <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">C.Unit</th>
              <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Est. Total</th>
              <th v-if="showCmv" rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-orange-600 uppercase tracking-wider bg-orange-50">{{ labelCmv }}</th>
            </tr>
            <tr>
              <!-- Entradas por semana (dinâmico) -->
              <th v-for="sem in semanas" :key="'ent-' + sem.label" class="px-2 py-1 text-center text-xs font-medium text-green-500 bg-green-50">
                <MiniCalendar :mes="selectedMes" :ano="selectedAno" :data-inicio="sem.inicio" :data-fim="sem.fim">
                  {{ sem.label }}
                </MiniCalendar>
              </th>
              <th class="px-2 py-1 text-center text-xs font-medium text-green-600 bg-green-50 border-r">Tot</th>
              <!-- Saídas por semana (dinâmico) -->
              <th v-for="sem in semanas" :key="'sai-' + sem.label" class="px-2 py-1 text-center text-xs font-medium text-red-500 bg-red-50">
                <MiniCalendar :mes="selectedMes" :ano="selectedAno" :data-inicio="sem.inicio" :data-fim="sem.fim">
                  {{ sem.label }}
                </MiniCalendar>
              </th>
              <th class="px-2 py-1 text-center text-xs font-medium text-red-600 bg-red-50 border-r">Tot</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="!loading && filteredPainel.length === 0">
              <td :colspan="totalColunas" class="px-3 py-8 text-center text-gray-500">
                Nenhum dado encontrado para o período selecionado
              </td>
            </tr>
            <tr v-for="item in paginatedItems" :key="item.produto_id" class="hover:bg-gray-50">
              <td class="px-2 py-2 text-xs text-gray-600 border-r truncate max-w-[80px]" :title="item.categoria">{{ item.categoria }}</td>
              <td class="px-2 py-2 text-xs font-medium text-gray-900 border-r truncate max-w-[120px]" :title="item.produto">{{ item.produto }}</td>
              <td class="px-2 py-2 text-xs text-center text-gray-600 border-r">{{ formatQtd(item.estoque_inicial) }}</td>
              <!-- Entradas por semana (dinâmico) -->
              <td v-for="(_, idx) in semanas" :key="'ent-' + idx" class="px-1 py-2 text-xs text-center text-green-600 bg-green-50/50">{{ formatQtd(item.entradas_por_semana[idx]) }}</td>
              <td class="px-1 py-2 text-xs text-center font-medium text-green-700 bg-green-100 border-r">{{ formatQtd(item.total_entradas) }}</td>
              <!-- Saídas por semana (dinâmico) -->
              <td v-for="(_, idx) in semanas" :key="'sai-' + idx" class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ formatQtd(item.saidas_por_semana[idx]) }}</td>
              <td class="px-1 py-2 text-xs text-center font-medium text-red-700 bg-red-100 border-r">{{ formatQtd(item.total_saidas) }}</td>
              <!-- Totais -->
              <td class="px-2 py-2 text-xs text-center font-medium text-blue-600 border-r">{{ formatQtd(item.estoque_final) }}</td>
              <td class="px-2 py-2 text-xs text-center text-gray-600 border-r">{{ formatCurrencyShort(item.custo) }}</td>
              <td class="px-2 py-2 text-xs text-center font-medium text-gray-900 border-r">{{ formatCurrencyShort(item.valor_total) }}</td>
              <!-- CMV -->
              <td v-if="showCmv" class="px-2 py-2 text-xs text-center font-medium text-orange-600 bg-orange-50/50">{{ formatCurrencyShort(item.cmv || 0) }}</td>
            </tr>
          </tbody>
          <tfoot class="bg-gray-100">
            <tr class="font-semibold">
              <td colspan="2" class="px-3 py-2 text-xs text-gray-700 border-r">TOTAL</td>
              <td class="px-3 py-2 text-xs text-center text-gray-700 border-r">-</td>
              <td :colspan="semanas.length + 1" class="px-3 py-2 text-xs text-center text-green-700 border-r bg-green-100">{{ formatQtd(totais.entradas) }}</td>
              <td :colspan="semanas.length + 1" class="px-3 py-2 text-xs text-center text-red-700 border-r bg-red-100">{{ formatQtd(totais.saidas) }}</td>
              <td class="px-3 py-2 text-xs text-center text-blue-700 border-r">-</td>
              <td class="px-3 py-2 text-xs text-center text-gray-700 border-r">-</td>
              <td class="px-3 py-2 text-xs text-center text-gray-900 border-r">{{ formatCurrencyShort(totais.valor) }}</td>
              <td v-if="showCmv" class="px-3 py-2 text-xs text-center text-orange-700 bg-orange-100">{{ formatCurrencyShort(totais.cmv) }}</td>
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
import type { PainelMes, SemanaInfo } from '~/types'

const { getPainelMes } = useRelatorios()
const { empresaId } = useEmpresa()
const toast = useToast()

const painelData = ref<PainelMes[]>([])
const semanas = ref<SemanaInfo[]>([])
const loading = ref(false)
const search = ref('')
const tipoVisualizacao = ref<'todos' | 'transferencia' | 'definitiva' | 'beneficiamento'>('todos')

const hoje = new Date()
const selectedMes = ref(hoje.getMonth() + 1)
const selectedAno = ref(hoje.getFullYear())

const visualizacaoOptions = [
  { label: 'CMV Consumo', value: 'todos' },
  { label: 'Transferência', value: 'transferencia' },
  { label: 'Definitiva', value: 'definitiva' },
  { label: 'Produção', value: 'beneficiamento' }
]

const showCmv = computed(() => tipoVisualizacao.value !== 'beneficiamento')

const labelCmv = computed(() => {
  switch (tipoVisualizacao.value) {
    case 'transferencia': return 'Valor Transferência'
    case 'definitiva': return 'Valor Definitiva'
    default: return 'CMV Consumo'
  }
})

// Total de colunas: Cat + Produto + EI + (semanas * 2 entradas/saídas) + 2 totais + EF + CUnit + CTotal + (CMV se não for produção)
const totalColunas = computed(() => 3 + (semanas.value.length + 1) * 2 + 3 + (showCmv.value ? 1 : 0))

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

const truncate2 = (v: number) => Math.trunc((v || 0) * 100) / 100

const formatQtd = (value: number | null | undefined) => {
  if (value === null || value === undefined || value === 0) return '-'
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

const formatCurrencyShort = (value: number) => {
  if (!value || value === 0) return '-'
  return formatCurrency(value)
}

const loadPainel = async () => {
  try {
    loading.value = true
    const resultado = await getPainelMes(selectedAno.value, selectedMes.value, tipoVisualizacao.value)
    semanas.value = resultado.semanas
    painelData.value = resultado.itens
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

watch(tipoVisualizacao, () => {
  loadPainel()
})

watch(empresaId, () => {
  if (empresaId.value) {
    loadPainel()
  }
}, { immediate: true })
</script>
