<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Faturamento {{ isSemanal ? 'Semanal' : 'Mensal' }}</h1>
      <p class="text-sm text-gray-500">{{ isSemanal ? 'Registre o faturamento semanal da empresa' : 'Registre o faturamento mensal da empresa' }}</p>
    </div>

    <!-- Tab Mensal -->
    <template v-if="!isSemanal">
      <div class="space-y-4">
        <!-- Filtro Ano -->
        <UCard>
          <div class="flex flex-wrap items-end gap-4">
            <UFormGroup label="Ano">
              <USelect v-model="anoMensal" :options="anosOptions" class="w-32" />
            </UFormGroup>
            <UButton color="primary" variant="soft" @click="loadMensal" :loading="loadingMensal">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
              Atualizar
            </UButton>
          </div>
        </UCard>

        <!-- Skeleton -->
        <UCard v-if="loadingMensal" :ui="{ body: { padding: '' } }">
          <div class="p-5 space-y-4">
            <div v-for="i in 12" :key="i" class="flex items-center gap-4">
              <USkeleton class="h-4 w-24" />
              <USkeleton class="h-8 w-48" />
              <USkeleton class="h-4 w-16" />
            </div>
          </div>
        </UCard>

        <!-- Tabela Mensal -->
        <UCard v-else :ui="{ body: { padding: '' } }">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="px-4 py-3 text-left font-semibold text-gray-700">Mês</th>
                  <th class="px-4 py-3 text-right font-semibold text-gray-700">Faturamento (R$)</th>
                  <th class="px-4 py-3 text-center font-semibold text-gray-700 w-20">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="item in mesesDoAno" :key="item.mes" class="hover:bg-gray-50/50 transition-colors">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ item.label }}</td>
                  <td class="px-4 py-2">
                    <div class="flex justify-end">
                      <UInput
                        :model-value="mensalInputs[item.mes]"
                        @update:model-value="mensalInputs[item.mes] = $event"
                        @blur="salvarMensal(item.mes)"
                        @keydown.enter="($event.target as HTMLInputElement)?.blur()"
                        type="number"
                        size="sm"
                        placeholder="0,00"
                        :ui="{ base: 'text-right w-48' }"
                        icon="i-heroicons-currency-dollar"
                      />
                    </div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UIcon
                      v-if="Number(mensalInputs[item.mes]) > 0"
                      name="i-heroicons-check-circle"
                      class="w-5 h-5 text-green-500"
                    />
                    <UIcon
                      v-else
                      name="i-heroicons-minus-circle"
                      class="w-5 h-5 text-gray-300"
                    />
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-gray-50 border-t-2 border-gray-200">
                  <td class="px-4 py-3 font-bold text-gray-900">Total do Ano</td>
                  <td class="px-4 py-3 text-right font-bold text-blue-600 text-base">
                    {{ formatCurrency(totalMensal) }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="text-xs text-gray-500">{{ mesesPreenchidos }}/12</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </UCard>
      </div>
    </template>

    <!-- Tab Semanal -->
    <template v-else>
      <div class="space-y-4">
        <!-- Filtros -->
        <UCard>
          <div class="flex flex-wrap items-end gap-4">
            <UFormGroup label="Mês/Ano">
              <div class="flex gap-2">
                <USelect v-model="mesSemanal" :options="mesesOptions" class="w-40" />
                <USelect v-model="anoSemanal" :options="anosOptions" class="w-32" />
              </div>
            </UFormGroup>
            <UButton color="primary" variant="soft" @click="loadSemanal" :loading="loadingSemanal">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
              Atualizar
            </UButton>
          </div>
        </UCard>

        <!-- Skeleton -->
        <UCard v-if="loadingSemanal" :ui="{ body: { padding: '' } }">
          <div class="p-5 space-y-4">
            <div v-for="i in 5" :key="i" class="flex items-center gap-4">
              <USkeleton class="h-4 w-32" />
              <USkeleton class="h-8 w-48" />
              <USkeleton class="h-4 w-16" />
            </div>
          </div>
        </UCard>

        <!-- Tabela Semanal -->
        <UCard v-else :ui="{ body: { padding: '' } }">
          <div v-if="semanasDoMes.length === 0" class="flex flex-col items-center justify-center py-10 text-gray-500">
            <UIcon name="i-heroicons-calendar" class="w-8 h-8 mb-2" />
            <p class="text-sm">Selecione um mês e clique em Atualizar</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="px-4 py-3 text-left font-semibold text-gray-700">Semana</th>
                  <th class="px-4 py-3 text-left font-semibold text-gray-700">Período</th>
                  <th class="px-4 py-3 text-right font-semibold text-gray-700">Faturamento (R$)</th>
                  <th class="px-4 py-3 text-center font-semibold text-gray-700 w-20">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="(sem, idx) in semanasDoMes" :key="idx" class="hover:bg-gray-50/50 transition-colors">
                  <td class="px-4 py-3 font-medium text-gray-900">Semana {{ idx + 1 }}</td>
                  <td class="px-4 py-3 text-gray-600">
                    {{ formatDateBR(sem.inicio) }} a {{ formatDateBR(sem.fim) }}
                  </td>
                  <td class="px-4 py-2">
                    <div class="flex justify-end">
                      <UInput
                        :model-value="semanalInputs[idx]"
                        @update:model-value="semanalInputs[idx] = $event"
                        @blur="salvarSemanal(idx)"
                        @keydown.enter="($event.target as HTMLInputElement)?.blur()"
                        type="number"
                        size="sm"
                        placeholder="0,00"
                        :ui="{ base: 'text-right w-48' }"
                        icon="i-heroicons-currency-dollar"
                      />
                    </div>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <UIcon
                      v-if="Number(semanalInputs[idx]) > 0"
                      name="i-heroicons-check-circle"
                      class="w-5 h-5 text-green-500"
                    />
                    <UIcon
                      v-else
                      name="i-heroicons-minus-circle"
                      class="w-5 h-5 text-gray-300"
                    />
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-gray-50 border-t-2 border-gray-200">
                  <td class="px-4 py-3 font-bold text-gray-900" colspan="2">Total do Mês</td>
                  <td class="px-4 py-3 text-right font-bold text-blue-600 text-base">
                    {{ formatCurrency(totalSemanal) }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="text-xs text-gray-500">{{ semanasPreenchidas }}/{{ semanasDoMes.length }}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </UCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Faturamento, FaturamentoSemanal } from '~/types'

const { getFaturamentos, upsertFaturamento } = useEstoque()
const { getFaturamentosSemanais, upsertFaturamentoSemanal } = useRelatorios()
const { empresaId } = useEmpresa()
const toast = useToast()
const route = useRoute()

const isSemanal = computed(() => route.query.tab === '1')

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const anosOptions = Array.from({ length: 5 }, (_, i) => ({
  label: String(currentYear - i),
  value: currentYear - i
}))

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

const mesesDoAno = [
  { mes: 1, label: 'Janeiro' },
  { mes: 2, label: 'Fevereiro' },
  { mes: 3, label: 'Março' },
  { mes: 4, label: 'Abril' },
  { mes: 5, label: 'Maio' },
  { mes: 6, label: 'Junho' },
  { mes: 7, label: 'Julho' },
  { mes: 8, label: 'Agosto' },
  { mes: 9, label: 'Setembro' },
  { mes: 10, label: 'Outubro' },
  { mes: 11, label: 'Novembro' },
  { mes: 12, label: 'Dezembro' }
]

// ==========================================
// MENSAL
// ==========================================
const anoMensal = ref(currentYear)
const loadingMensal = ref(false)
const mensalInputs = ref<Record<number, number | string>>({})

const totalMensal = computed(() => {
  return Object.values(mensalInputs.value).reduce((sum, v) => sum + (Number(v) || 0), 0)
})

const mesesPreenchidos = computed(() => {
  return Object.values(mensalInputs.value).filter(v => Number(v) > 0).length
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const loadMensal = async () => {
  try {
    loadingMensal.value = true
    const data = await getFaturamentos(anoMensal.value)
    const inputs: Record<number, number | string> = {}
    for (let m = 1; m <= 12; m++) {
      const fat = data.find((f: Faturamento) => f.mes === m)
      inputs[m] = fat ? Number(fat.valor) : ''
    }
    mensalInputs.value = inputs
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar faturamentos',
      color: 'red'
    })
  } finally {
    loadingMensal.value = false
  }
}

const salvarMensal = async (mes: number) => {
  const valor = Number(mensalInputs.value[mes]) || 0
  try {
    await upsertFaturamento({
      ano: anoMensal.value,
      mes,
      valor
    })
    toast.add({ title: 'Salvo', description: `Faturamento de ${mesesDoAno[mes - 1].label} atualizado`, color: 'green', timeout: 2000 })
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar faturamento',
      color: 'red'
    })
  }
}

// ==========================================
// SEMANAL
// ==========================================
const anoSemanal = ref(currentYear)
const mesSemanal = ref(currentMonth)
const loadingSemanal = ref(false)
const semanalInputs = ref<(number | string)[]>([])

interface SemanaCalc {
  inicio: string
  fim: string
}

const semanasDoMes = ref<SemanaCalc[]>([])

const totalSemanal = computed(() => {
  return semanalInputs.value.reduce((sum, v) => sum + (Number(v) || 0), 0)
})

const semanasPreenchidas = computed(() => {
  return semanalInputs.value.filter(v => Number(v) > 0).length
})

const calcularSemanasDoMes = (ano: number, mes: number): SemanaCalc[] => {
  const primeiroDia = new Date(ano, mes - 1, 1)
  const ultimoDiaMes = new Date(ano, mes, 0)

  const seg = new Date(primeiroDia)
  const dow = seg.getDay()
  seg.setDate(seg.getDate() - ((dow + 6) % 7))

  const semanas: SemanaCalc[] = []

  while (seg <= ultimoDiaMes) {
    const dom = new Date(seg)
    dom.setDate(seg.getDate() + 6)

    let diasNoMes = 0
    for (let d = new Date(seg); d <= dom; d.setDate(d.getDate() + 1)) {
      if (d.getMonth() === mes - 1 && d.getFullYear() === ano) diasNoMes++
    }

    if (diasNoMes >= 4) {
      const formatISO = (d: Date) => d.toISOString().split('T')[0]
      semanas.push({
        inicio: formatISO(seg),
        fim: formatISO(dom)
      })
    }

    seg.setDate(seg.getDate() + 7)
  }

  return semanas
}

const formatDateBR = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

const loadSemanal = async () => {
  try {
    loadingSemanal.value = true
    const semanas = calcularSemanasDoMes(anoSemanal.value, mesSemanal.value)
    semanasDoMes.value = semanas

    if (semanas.length === 0) {
      semanalInputs.value = []
      return
    }

    const semanasInicioList = semanas.map(s => s.inicio)
    const faturamentos = await getFaturamentosSemanais(semanasInicioList)
    const fatMap = new Map<string, number>()
    faturamentos.forEach((f: FaturamentoSemanal) => {
      fatMap.set(f.semana_inicio, Number(f.valor || 0))
    })

    semanalInputs.value = semanas.map(s => fatMap.get(s.inicio) || '')
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar faturamentos semanais',
      color: 'red'
    })
  } finally {
    loadingSemanal.value = false
  }
}

const salvarSemanal = async (idx: number) => {
  const semana = semanasDoMes.value[idx]
  if (!semana) return
  const valor = Number(semanalInputs.value[idx]) || 0

  try {
    await upsertFaturamentoSemanal(semana.inicio, semana.fim, valor)
    toast.add({ title: 'Salvo', description: `Faturamento da semana ${idx + 1} atualizado`, color: 'green', timeout: 2000 })
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar faturamento semanal',
      color: 'red'
    })
  }
}

// Carregar ao trocar empresa
watch(empresaId, () => {
  if (empresaId.value) {
    loadMensal()
    if (semanasDoMes.value.length > 0) loadSemanal()
  }
}, { immediate: true })

// Carregar semanal automaticamente na primeira vez
onMounted(() => {
  loadSemanal()
})
</script>
