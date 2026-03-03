<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold text-[#5a5a66] mb-2">CMV</h1>

    <!-- Toolbar: Year Picker -->
    <div class="flex items-center gap-3">
      <div class="inline-flex items-center gap-1 ring-1 ring-[#EBEBED] rounded-lg bg-white shadow-sm">
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

    <!-- Tabela Mensal Transposta -->
    <UCard :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
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
              <th class="text-left px-4 py-3 font-semibold text-[#5a5a66] whitespace-nowrap sticky left-0 bg-operacao-50 z-10"></th>
              <th
                v-for="row in cmvDataFiltrado"
                :key="row.mes"
                class="text-center px-4 py-3 font-semibold text-[#5a5a66] whitespace-nowrap"
              >
                {{ mesesAbrev[row.mes - 1] }}
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Faturamento (click-to-edit) -->
            <tr class="border-b border-operacao-100 hover:bg-operacao-50">
              <td class="px-4 py-2.5 font-medium text-operacao-500 whitespace-nowrap sticky left-0 bg-white z-10">
                <div class="flex items-center gap-1">
                  Faturamento
                  <UIcon name="i-heroicons-pencil-square" class="w-3 h-3 text-operacao-300" />
                </div>
              </td>
              <td v-for="row in cmvDataFiltrado" :key="'fat-' + row.mes" class="text-center px-2 py-1 whitespace-nowrap">
                <!-- Mês futuro -->
                <span v-if="isMesFuturo(row.mes)" class="text-operacao-400 px-2 py-1.5 inline-block">-</span>
                <!-- Editando -->
                <CurrencyInput
                  v-else-if="editingFatMes === row.mes"
                  :model-value="Number(mensalInputs[row.mes]) || 0"
                  @update:model-value="mensalInputs[row.mes] = $event"
                  @blur="finishEditFat(row.mes)"
                  @keydown.enter="($event.target as HTMLInputElement)?.blur()"
                  size="xs"
                  placeholder="0,00"
                  :ui="{ base: 'text-center w-24' }"
                  :ref="(el: any) => { if (el) fatInputRef = el }"
                />
                <!-- Display (click to edit) -->
                <button
                  v-else
                  class="group px-2 py-1.5 rounded hover:bg-guardian-50 transition-colors cursor-pointer text-guardian-600"
                  @click="startEditFat(row.mes)"
                >
                  <span>{{ formatCurrency(row.faturamento) }}</span>
                  <UIcon name="i-heroicons-pencil-square" class="w-3 h-3 ml-1 opacity-0 group-hover:opacity-60 text-operacao-400 inline-block align-middle transition-opacity" />
                </button>
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

// Year picker limits
const currentYear = new Date().getFullYear()
const minAno = currentYear - 2
const maxAno = currentYear + 2

// Click-to-edit faturamento
const editingFatMes = ref<number | null>(null)
const fatInputRef = ref<any>(null)

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

const startEditFat = (mes: number) => {
  editingFatMes.value = mes
  nextTick(() => {
    const input = fatInputRef.value?.$el?.querySelector('input') as HTMLInputElement | null
    input?.focus()
  })
}

const finishEditFat = async (mes: number) => {
  editingFatMes.value = null
  await salvarFaturamentoMensal(mes)
}

const { page, pageSize, paginatedItems } = usePagination(cmvData)

const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']


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
