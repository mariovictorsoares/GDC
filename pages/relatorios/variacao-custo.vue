<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Variação de Custo</h1>
        <p class="text-sm text-gray-500">Acompanhe a evolução dos custos dos produtos ao longo do ano</p>
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
        <UFormGroup label="Buscar">
          <UInput
            v-model="search"
            placeholder="Buscar produto..."
            icon="i-heroicons-magnifying-glass"
            class="w-64"
          />
        </UFormGroup>
        <UButton color="primary" @click="loadVariacao" :loading="loading">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
          Atualizar
        </UButton>
      </div>
    </UCard>

    <!-- Resumo -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-100 rounded-lg">
            <UIcon name="i-heroicons-cube" class="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Produtos Analisados</p>
            <p class="text-2xl font-bold text-gray-900">{{ filteredData.length }}</p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-red-100 rounded-lg">
            <UIcon name="i-heroicons-arrow-trending-up" class="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Com Aumento</p>
            <p class="text-2xl font-bold text-red-600">{{ resumo.comAumento }}</p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-green-100 rounded-lg">
            <UIcon name="i-heroicons-arrow-trending-down" class="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Com Redução</p>
            <p class="text-2xl font-bold text-green-600">{{ resumo.comReducao }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Tabela -->
    <UCard>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">Categoria</th>
              <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-24 bg-gray-50">Produto</th>
              <th v-for="mes in mesesAbrev" :key="mes" class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ mes }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading">
              <td :colspan="14" class="px-3 py-8 text-center text-gray-500">
                <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin mx-auto mb-2" />
                Carregando...
              </td>
            </tr>
            <tr v-else-if="filteredData.length === 0">
              <td :colspan="14" class="px-3 py-8 text-center text-gray-500">
                Nenhum dado encontrado
              </td>
            </tr>
            <template v-for="item in filteredData" :key="item.produto_id">
              <!-- Linha de Custo -->
              <tr class="hover:bg-gray-50">
                <td class="px-3 py-2 text-sm text-gray-600 sticky left-0 bg-white">{{ item.categoria }}</td>
                <td class="px-3 py-2 text-sm font-medium text-gray-900 sticky left-24 bg-white">{{ item.produto }}</td>
                <td v-for="(custo, index) in item.custos" :key="index" class="px-3 py-2 text-sm text-center">
                  <span v-if="custo > 0" class="font-medium">{{ formatCurrency(custo) }}</span>
                  <span v-else class="text-gray-300">-</span>
                </td>
              </tr>
              <!-- Linha de Variação -->
              <tr class="bg-gray-50/50">
                <td class="px-3 py-1 sticky left-0 bg-gray-50/50"></td>
                <td class="px-3 py-1 text-xs text-gray-400 sticky left-24 bg-gray-50/50">variação</td>
                <td v-for="(variacao, index) in item.variacoes" :key="index" class="px-3 py-1 text-xs text-center">
                  <span v-if="variacao !== null" :class="getVariacaoClass(variacao)">
                    {{ variacao > 0 ? '+' : '' }}{{ formatNumber(variacao) }}%
                  </span>
                  <span v-else class="text-gray-300">-</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Legenda -->
    <UCard>
      <h4 class="font-semibold mb-3">Legenda:</h4>
      <div class="flex flex-wrap gap-4 text-sm">
        <div class="flex items-center gap-2">
          <span class="text-red-600 font-medium">+10%</span>
          <span class="text-gray-600">Aumento de custo</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-green-600 font-medium">-10%</span>
          <span class="text-gray-600">Redução de custo</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-gray-400">-</span>
          <span class="text-gray-600">Sem dados no período</span>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">

const { getVariacaoCusto } = useRelatorios()
const toast = useToast()

interface VariacaoItem {
  produto_id: string
  produto: string
  categoria: string
  custos: number[]
  variacoes: (number | null)[]
}

const variacaoData = ref<VariacaoItem[]>([])
const loading = ref(false)
const search = ref('')
const selectedAno = ref(new Date().getFullYear())

const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const anosOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    label: String(currentYear - 2 + i),
    value: currentYear - 2 + i
  }))
})

const filteredData = computed(() => {
  if (!search.value) return variacaoData.value
  const term = search.value.toLowerCase()
  return variacaoData.value.filter(v =>
    v.produto.toLowerCase().includes(term) ||
    v.categoria.toLowerCase().includes(term)
  )
})

const resumo = computed(() => {
  let comAumento = 0
  let comReducao = 0

  variacaoData.value.forEach(item => {
    const variacoesValidas = item.variacoes.filter(v => v !== null)
    if (variacoesValidas.length > 0) {
      const ultimaVariacao = variacoesValidas[variacoesValidas.length - 1]
      if (ultimaVariacao && ultimaVariacao > 0) comAumento++
      else if (ultimaVariacao && ultimaVariacao < 0) comReducao++
    }
  })

  return { comAumento, comReducao }
})

const getVariacaoClass = (variacao: number) => {
  if (variacao > 10) return 'text-red-600 font-medium'
  if (variacao > 0) return 'text-red-500'
  if (variacao < -10) return 'text-green-600 font-medium'
  if (variacao < 0) return 'text-green-500'
  return 'text-gray-500'
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value || 0)
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const loadVariacao = async () => {
  try {
    loading.value = true
    variacaoData.value = await getVariacaoCusto(selectedAno.value)
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar variação de custo',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

watch(selectedAno, () => {
  loadVariacao()
})

onMounted(() => {
  loadVariacao()
})
</script>
