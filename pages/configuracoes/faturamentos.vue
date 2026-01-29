<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Faturamentos</h1>
        <p class="text-sm text-gray-500">Registre os faturamentos mensais para cálculo do CMV</p>
      </div>
    </div>

    <!-- Seletor de Ano -->
    <UCard>
      <div class="flex flex-wrap gap-4 items-end">
        <UFormGroup label="Ano">
          <USelect
            v-model="selectedAno"
            :options="anosOptions"
            class="w-32"
          />
        </UFormGroup>
        <UButton color="primary" @click="loadFaturamentos" :loading="loading">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
          Atualizar
        </UButton>
      </div>
    </UCard>

    <!-- Resumo -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Faturamento Total</p>
          <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(totalFaturamento) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Média Mensal</p>
          <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(mediaFaturamento) }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Meses com Dados</p>
          <p class="text-2xl font-bold text-green-600">{{ mesesComDados }} / 12</p>
        </div>
      </UCard>
    </div>

    <!-- Formulário de Faturamentos -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">Faturamentos de {{ selectedAno }}</h3>
      </template>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <UFormGroup
          v-for="mes in 12"
          :key="mes"
          :label="mesesNomes[mes - 1]"
        >
          <UInput
            v-model.number="faturamentosForm[mes]"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            @blur="saveFaturamento(mes)"
          />
        </UFormGroup>
      </div>

      <template #footer>
        <div class="flex justify-between items-center">
          <p class="text-sm text-gray-500">
            Os valores são salvos automaticamente ao sair do campo
          </p>
          <UButton color="primary" @click="saveAllFaturamentos" :loading="savingAll">
            <UIcon name="i-heroicons-check" class="w-4 h-4 mr-2" />
            Salvar Todos
          </UButton>
        </div>
      </template>
    </UCard>

    <!-- Gráfico de Evolução -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">Evolução Mensal</h3>
      </template>

      <div class="space-y-2">
        <div
          v-for="mes in 12"
          :key="mes"
          class="flex items-center gap-4"
        >
          <span class="w-20 text-sm text-gray-600">{{ mesesAbrev[mes - 1] }}</span>
          <div class="flex-1 bg-gray-200 rounded-full h-6">
            <div
              class="bg-blue-500 h-6 rounded-full flex items-center justify-end px-2 text-xs text-white font-medium transition-all duration-300"
              :style="{ width: `${getBarWidth(mes)}%` }"
            >
              <span v-if="faturamentosForm[mes] > 0">{{ formatCurrencyShort(faturamentosForm[mes]) }}</span>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { Faturamento } from '~/types'

const { getFaturamentos, upsertFaturamento } = useEstoque()
const toast = useToast()

const faturamentos = ref<Faturamento[]>([])
const loading = ref(false)
const savingAll = ref(false)
const selectedAno = ref(new Date().getFullYear())
const faturamentosForm = ref<Record<number, number>>({})

const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const anosOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    label: String(currentYear - 2 + i),
    value: currentYear - 2 + i
  }))
})

const totalFaturamento = computed(() =>
  Object.values(faturamentosForm.value).reduce((sum, val) => sum + (val || 0), 0)
)

const mesesComDados = computed(() =>
  Object.values(faturamentosForm.value).filter(val => val > 0).length
)

const mediaFaturamento = computed(() =>
  mesesComDados.value > 0 ? totalFaturamento.value / mesesComDados.value : 0
)

const maxFaturamento = computed(() =>
  Math.max(...Object.values(faturamentosForm.value), 1)
)

const getBarWidth = (mes: number) => {
  const valor = faturamentosForm.value[mes] || 0
  return (valor / maxFaturamento.value) * 100
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const formatCurrencyShort = (value: number) => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`
  }
  return formatCurrency(value)
}

const loadFaturamentos = async () => {
  try {
    loading.value = true
    faturamentosForm.value = {}
    faturamentos.value = await getFaturamentos(selectedAno.value)
    faturamentos.value.forEach(f => {
      faturamentosForm.value[f.mes] = f.valor
    })
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar faturamentos',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const saveFaturamento = async (mes: number) => {
  const valor = faturamentosForm.value[mes] || 0
  try {
    await upsertFaturamento({
      ano: selectedAno.value,
      mes,
      valor
    })
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar faturamento',
      color: 'red'
    })
  }
}

const saveAllFaturamentos = async () => {
  try {
    savingAll.value = true
    const promises = []
    for (let mes = 1; mes <= 12; mes++) {
      promises.push(upsertFaturamento({
        ano: selectedAno.value,
        mes,
        valor: faturamentosForm.value[mes] || 0
      }))
    }
    await Promise.all(promises)
    toast.add({
      title: 'Sucesso',
      description: 'Faturamentos salvos com sucesso',
      color: 'green'
    })
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar faturamentos',
      color: 'red'
    })
  } finally {
    savingAll.value = false
  }
}

watch(selectedAno, () => {
  loadFaturamentos()
})

onMounted(() => {
  loadFaturamentos()
})
</script>
