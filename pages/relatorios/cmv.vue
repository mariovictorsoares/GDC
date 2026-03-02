<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-operacao-800">CMV - Custo da Mercadoria Vendida</h1>
        <p class="text-sm text-operacao-400">Análise do custo das mercadorias vendidas por período</p>
      </div>
    </div>

    <!-- Cadastro de Faturamento Mensal -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="p-1.5 bg-guardian-100 rounded-lg">
              <UIcon name="i-heroicons-currency-dollar" class="w-4 h-4 text-guardian-600" />
            </div>
            <div>
              <h3 class="font-semibold text-operacao-800 text-sm">Faturamento Mensal</h3>
              <p class="text-[11px] text-operacao-400">Preencha o faturamento de cada mês para calcular o CMV%</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-operacao-400">{{ mesesPreenchidos }}/12 meses</span>
            <UIcon
              v-if="mesesPreenchidos === 12"
              name="i-heroicons-check-circle"
              class="w-4 h-4 text-controle-500"
            />
          </div>
        </div>
      </template>

      <div v-if="loadingFaturamento" class="flex justify-center py-4">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-operacao-400" />
      </div>
      <div v-else class="overflow-x-auto -mx-4 sm:mx-0">
        <table class="w-full text-sm" style="min-width: 700px">
          <thead>
            <tr class="border-b border-operacao-200 bg-operacao-50">
              <th
                v-for="(mes, idx) in mesesAbrev"
                :key="idx"
                class="text-center px-2 py-2 font-semibold text-operacao-500 text-xs"
              >
                {{ mes }}
              </th>
              <th class="text-center px-2 py-2 font-semibold text-guardian-600 text-xs">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td v-for="(mes, idx) in mesesAbrev" :key="idx" class="px-1 py-1.5 text-center">
                <template v-if="isMesFuturo(idx + 1)">
                  <span class="text-operacao-300 text-xs">-</span>
                </template>
                <template v-else>
                  <CurrencyInput
                    :model-value="Number(mensalInputs[idx + 1]) || 0"
                    @update:model-value="mensalInputs[idx + 1] = $event"
                    @blur="salvarFaturamentoMensal(idx + 1)"
                    size="xs"
                    placeholder="0,00"
                    :ui="{ base: 'text-center' }"
                  />
                </template>
              </td>
              <td class="px-2 py-1.5 text-center font-bold text-guardian-600 whitespace-nowrap text-sm">
                {{ formatCurrency(totalFaturamento) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Tabela Mensal Transposta -->
    <UCard :ui="{ body: { padding: '' } }">
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <h3 class="font-semibold">Evolução Mensal</h3>
          <div class="flex items-center gap-2">
            <UBadge color="yellow">≤25% Atenção</UBadge>
            <UBadge color="green">25-32% Aceitável</UBadge>
            <UBadge color="red">>32% Perigo</UBadge>
            <USelect v-model="selectedAno" :options="anosOptions" class="w-28" />
            <UButton color="primary" @click="loadCMV" :loading="loading" size="sm">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
            </UButton>
          </div>
        </div>
      </template>

      <!-- Loading -->
      <div v-if="loading" class="p-6 flex justify-center">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-operacao-400" />
      </div>

      <!-- Empty -->
      <div v-else-if="cmvDataFiltrado.length === 0" class="flex flex-col items-center justify-center py-6 text-operacao-400">
        <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
        <p class="text-sm">Nenhum registro encontrado</p>
      </div>

      <!-- Tabela transposta: meses nas colunas, métricas nas linhas -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm" style="min-width: 700px">
          <thead>
            <tr class="border-b border-operacao-200 bg-operacao-50">
              <th class="text-left px-4 py-3 font-semibold text-operacao-500 whitespace-nowrap sticky left-0 bg-operacao-50 z-10"></th>
              <th
                v-for="row in cmvDataFiltrado"
                :key="row.mes"
                class="text-center px-4 py-3 font-semibold text-operacao-600 whitespace-nowrap"
              >
                {{ mesesAbrev[row.mes - 1] }}
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Faturamento -->
            <tr class="border-b border-operacao-100 hover:bg-operacao-50">
              <td class="px-4 py-2.5 font-medium text-operacao-500 whitespace-nowrap sticky left-0 bg-white z-10">Faturamento</td>
              <td v-for="row in cmvDataFiltrado" :key="'fat-' + row.mes" class="text-center px-4 py-2.5 whitespace-nowrap" :class="isMesFuturo(row.mes) ? 'text-operacao-400' : 'text-guardian-600'">
                {{ isMesFuturo(row.mes) ? '-' : formatCurrency(row.faturamento) }}
              </td>
            </tr>
            <!-- Est. Inicial -->
            <tr class="border-b border-operacao-100 hover:bg-operacao-50">
              <td class="px-4 py-2.5 font-medium text-operacao-500 whitespace-nowrap sticky left-0 bg-white z-10">Est. Inicial</td>
              <td v-for="row in cmvDataFiltrado" :key="'ei-' + row.mes" class="text-center px-4 py-2.5 whitespace-nowrap" :class="isMesFuturo(row.mes) ? 'text-operacao-400' : 'text-operacao-600'">
                {{ isMesFuturo(row.mes) ? '-' : formatCurrency(row.estoque_inicial) }}
              </td>
            </tr>
            <!-- Compras -->
            <tr class="border-b border-operacao-100 hover:bg-operacao-50">
              <td class="px-4 py-2.5 font-medium text-operacao-500 whitespace-nowrap sticky left-0 bg-white z-10">Compras</td>
              <td v-for="row in cmvDataFiltrado" :key="'co-' + row.mes" class="text-center px-4 py-2.5 whitespace-nowrap" :class="isMesFuturo(row.mes) ? 'text-operacao-400' : 'text-controle-600'">
                {{ isMesFuturo(row.mes) ? '-' : formatCurrency(row.compras) }}
              </td>
            </tr>
            <!-- Est. Final -->
            <tr class="border-b border-operacao-100 hover:bg-operacao-50">
              <td class="px-4 py-2.5 font-medium text-operacao-500 whitespace-nowrap sticky left-0 bg-white z-10">Est. Final</td>
              <td v-for="row in cmvDataFiltrado" :key="'ef-' + row.mes" class="text-center px-4 py-2.5 whitespace-nowrap" :class="isMesFuturo(row.mes) ? 'text-operacao-400' : 'text-operacao-600'">
                {{ isMesFuturo(row.mes) ? '-' : formatCurrency(row.estoque_final) }}
              </td>
            </tr>
            <!-- CMV Real (R$) -->
            <tr class="border-b border-operacao-100 hover:bg-operacao-50">
              <td class="px-4 py-2.5 font-medium text-operacao-500 whitespace-nowrap sticky left-0 bg-white z-10">CMV Real</td>
              <td v-for="row in cmvDataFiltrado" :key="'cmvrs-' + row.mes" class="text-center px-4 py-2.5 whitespace-nowrap" :class="isMesFuturo(row.mes) ? 'text-operacao-400' : 'text-red-600'">
                {{ isMesFuturo(row.mes) ? '-' : formatCurrency(row.cmv) }}
              </td>
            </tr>
            <!-- CMV % -->
            <tr class="border-b border-operacao-100 hover:bg-operacao-50 bg-red-50/30">
              <td class="px-4 py-2.5 font-semibold text-red-700 whitespace-nowrap sticky left-0 bg-red-50/30 z-10">CMV %</td>
              <td v-for="row in cmvDataFiltrado" :key="'cmv-' + row.mes" class="text-center px-4 py-2.5 font-medium whitespace-nowrap">
                <span v-if="isMesFuturo(row.mes)" class="text-operacao-400">-</span>
                <span v-else :class="getPercentualTextClass(row.percentual_cmv)">
                  {{ formatNumber(row.percentual_cmv) }}%
                </span>
              </td>
            </tr>
            <!-- CMC % -->
            <tr class="border-b border-operacao-100 hover:bg-operacao-50">
              <td class="px-4 py-2.5 font-medium text-operacao-500 whitespace-nowrap sticky left-0 bg-white z-10">CMC %</td>
              <td v-for="row in cmvDataFiltrado" :key="'cmc-' + row.mes" class="text-center px-4 py-2.5 whitespace-nowrap" :class="isMesFuturo(row.mes) ? 'text-operacao-400' : 'text-purple-600 font-medium'">
                {{ isMesFuturo(row.mes) ? '-' : (row.faturamento > 0 ? formatNumber((row.compras / row.faturamento) * 100) : '0') + '%' }}
              </td>
            </tr>
            <!-- Divergência -->
            <tr class="border-b border-operacao-100 hover:bg-operacao-50">
              <td class="px-4 py-2.5 font-medium text-operacao-500 whitespace-nowrap sticky left-0 bg-white z-10">Divergência</td>
              <td v-for="row in cmvDataFiltrado" :key="'div-' + row.mes" class="text-center px-4 py-2.5 whitespace-nowrap text-xs">
                <template v-if="isMesFuturo(row.mes)">
                  <span class="text-operacao-400">-</span>
                </template>
                <template v-else-if="row.faturamento === 0">
                  <span class="text-operacao-400">-</span>
                </template>
                <template v-else>
                  <span
                    v-if="row.percentual_cmv > getCmcPercent(row)"
                    class="text-red-600 font-medium"
                  >
                    Estoque diminuindo / Desperdício
                  </span>
                  <span
                    v-else-if="row.percentual_cmv < getCmcPercent(row)"
                    class="text-guardian-600 font-medium"
                  >
                    Estoque aumentando
                  </span>
                  <span v-else class="text-controle-600 font-medium">
                    Equilibrado
                  </span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { CMV, Faturamento } from '~/types'

const { getCMV } = useRelatorios()
const { getFaturamentos, upsertFaturamento } = useEstoque()
const { empresaId } = useEmpresa()
const toast = useToast()

const cmvData = ref<CMV[]>([])
const loading = ref(false)
const loadingFaturamento = ref(false)
const selectedAno = ref(new Date().getFullYear())

// ==========================================
// FATURAMENTO MENSAL INLINE
// ==========================================
const mensalInputs = ref<Record<number, number | string>>({})

const totalFaturamento = computed(() => {
  return Object.values(mensalInputs.value).reduce((sum, v) => sum + (Number(v) || 0), 0)
})

const mesesPreenchidos = computed(() => {
  return Object.values(mensalInputs.value).filter(v => Number(v) > 0).length
})

const loadFaturamentoMensal = async () => {
  try {
    loadingFaturamento.value = true
    const data = await getFaturamentos(selectedAno.value)
    const inputs: Record<number, number | string> = {}
    for (let m = 1; m <= 12; m++) {
      const fat = data.find((f: Faturamento) => f.mes === m)
      inputs[m] = fat ? Number(fat.valor) : ''
    }
    mensalInputs.value = inputs
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar faturamentos', color: 'red' })
  } finally {
    loadingFaturamento.value = false
  }
}

const salvarFaturamentoMensal = async (mes: number) => {
  const valor = Number(mensalInputs.value[mes]) || 0
  try {
    await upsertFaturamento({ ano: selectedAno.value, mes, valor })
    toast.add({ title: 'Salvo', description: `Faturamento de ${mesesNomes[mes - 1]} atualizado`, color: 'green', timeout: 2000 })
    // Reload CMV to recalculate percentages
    await loadCMV()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar faturamento', color: 'red' })
  }
}

const { page, pageSize, paginatedItems } = usePagination(cmvData)

const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

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

const cmvDataFiltrado = computed(() => cmvData.value)

const isMesFuturo = (mes: number) => {
  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth() + 1
  if (selectedAno.value > anoAtual) return true
  if (selectedAno.value === anoAtual) return mes > mesAtual
  return false
}

const resumoAnual = computed(() => {
  if (cmvDataFiltrado.value.length === 0) {
    return { compras: 0, cmv: 0, faturamento: 0 }
  }

  const compras = cmvDataFiltrado.value.reduce((sum, c) => sum + c.compras, 0)
  const cmv = cmvDataFiltrado.value.reduce((sum, c) => sum + c.cmv, 0)
  const faturamento = cmvDataFiltrado.value.reduce((sum, c) => sum + c.faturamento, 0)

  return { compras, cmv, faturamento }
})


const getPercentualClass = (percentual: number) => {
  if (percentual <= 25) return 'bg-alerta-500'
  if (percentual <= 32) return 'bg-green-500'
  return 'bg-red-500'
}

const getPercentualTextClass = (percentual: number) => {
  if (percentual <= 25) return 'text-alerta-600'
  if (percentual <= 32) return 'text-controle-600'
  return 'text-red-600'
}

const getCmcPercent = (row: CMV) => {
  if (row.faturamento <= 0) return 0
  return (row.compras / row.faturamento) * 100
}

const { formatCurrency, formatNumber } = useFormatters()

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
  loadFaturamentoMensal()
})

watch(empresaId, () => {
  if (empresaId.value) {
    loadCMV()
    loadFaturamentoMensal()
  }
}, { immediate: true })
</script>
