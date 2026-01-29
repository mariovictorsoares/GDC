<template>
  <div class="space-y-6">
    <!-- Cards de Resumo -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Total de Produtos -->
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-100 rounded-lg">
            <UIcon name="i-heroicons-cube" class="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Total de Produtos</p>
            <p class="text-2xl font-bold text-gray-900">{{ resumo.totalProdutos }}</p>
          </div>
        </div>
      </UCard>

      <!-- Valor do Estoque -->
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-green-100 rounded-lg">
            <UIcon name="i-heroicons-currency-dollar" class="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Valor do Estoque</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(resumo.valorEstoque) }}</p>
          </div>
        </div>
      </UCard>

      <!-- Produtos Abaixo do Mínimo -->
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-yellow-100 rounded-lg">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Abaixo do Mínimo</p>
            <p class="text-2xl font-bold" :class="resumo.produtosAbaixoMinimo > 0 ? 'text-yellow-600' : 'text-gray-900'">
              {{ resumo.produtosAbaixoMinimo }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- CMV do Mês -->
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-purple-100 rounded-lg">
            <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Saídas do Mês</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(resumo.totalSaidasMes) }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Segunda linha de cards -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Movimentação do Mês -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Movimentação do Mês</h3>
            <span class="text-sm text-gray-500">{{ mesAtual }}</span>
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 text-green-600" />
              <span class="font-medium text-gray-700">Entradas</span>
            </div>
            <span class="text-lg font-bold text-green-600">{{ formatCurrency(resumo.totalEntradasMes) }}</span>
          </div>

          <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-arrow-up-tray" class="w-5 h-5 text-red-600" />
              <span class="font-medium text-gray-700">Saídas</span>
            </div>
            <span class="text-lg font-bold text-red-600">{{ formatCurrency(resumo.totalSaidasMes) }}</span>
          </div>

          <div class="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
            <div class="flex items-center gap-3">
              <UIcon name="i-heroicons-equals" class="w-5 h-5 text-gray-600" />
              <span class="font-medium text-gray-700">Saldo</span>
            </div>
            <span
              class="text-lg font-bold"
              :class="saldoMes >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ formatCurrency(saldoMes) }}
            </span>
          </div>
        </div>
      </UCard>

      <!-- Atalhos Rápidos -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900">Atalhos Rápidos</h3>
        </template>

        <div class="grid grid-cols-2 gap-3">
          <NuxtLink to="/movimentos/entradas">
            <UButton color="green" variant="soft" block size="lg" class="justify-start">
              <UIcon name="i-heroicons-plus-circle" class="w-5 h-5 mr-2" />
              Nova Entrada
            </UButton>
          </NuxtLink>

          <NuxtLink to="/movimentos/saidas">
            <UButton color="red" variant="soft" block size="lg" class="justify-start">
              <UIcon name="i-heroicons-minus-circle" class="w-5 h-5 mr-2" />
              Nova Saída
            </UButton>
          </NuxtLink>

          <NuxtLink to="/cadastro/produtos">
            <UButton color="blue" variant="soft" block size="lg" class="justify-start">
              <UIcon name="i-heroicons-cube" class="w-5 h-5 mr-2" />
              Produtos
            </UButton>
          </NuxtLink>

          <NuxtLink to="/relatorios/painel-mes">
            <UButton color="purple" variant="soft" block size="lg" class="justify-start">
              <UIcon name="i-heroicons-document-chart-bar" class="w-5 h-5 mr-2" />
              Painel Mês
            </UButton>
          </NuxtLink>

          <NuxtLink to="/relatorios/curva-abc">
            <UButton color="orange" variant="soft" block size="lg" class="justify-start">
              <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 mr-2" />
              Curva ABC
            </UButton>
          </NuxtLink>

          <NuxtLink to="/relatorios/estoque-minimo">
            <UButton color="yellow" variant="soft" block size="lg" class="justify-start">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 mr-2" />
              Est. Mínimo
            </UButton>
          </NuxtLink>
        </div>
      </UCard>
    </div>

    <!-- Produtos com Estoque Baixo -->
    <UCard v-if="produtosEstoqueBaixo.length > 0">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-500" />
          <h3 class="text-lg font-semibold text-gray-900">Produtos Abaixo do Estoque Mínimo</h3>
        </div>
      </template>

      <UTable
        :columns="colunasEstoqueBaixo"
        :rows="produtosEstoqueBaixo"
      >
        <template #quantidade_estoque-data="{ row }">
          <span class="font-medium" :class="row.repor_estoque ? 'text-red-600' : 'text-gray-900'">
            {{ formatNumber(row.quantidade_estoque) }} {{ row.unidade }}
          </span>
        </template>
        <template #estoque_minimo-data="{ row }">
          {{ formatNumber(row.estoque_minimo) }} {{ row.unidade }}
        </template>
        <template #sugestao_pedido-data="{ row }">
          <UBadge v-if="row.sugestao_pedido > 0" color="yellow">
            Pedir: {{ formatNumber(row.sugestao_pedido) }} {{ row.unidade }}
          </UBadge>
          <span v-else class="text-gray-400">-</span>
        </template>
      </UTable>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { getDashboardResumo, getEstoqueMinimo } = useRelatorios()

const resumo = ref({
  totalProdutos: 0,
  valorEstoque: 0,
  produtosAbaixoMinimo: 0,
  totalEntradasMes: 0,
  totalSaidasMes: 0
})

const produtosEstoqueBaixo = ref<any[]>([])

const saldoMes = computed(() => {
  return resumo.value.totalEntradasMes - resumo.value.totalSaidasMes
})

const mesAtual = computed(() => {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

const colunasEstoqueBaixo = [
  { key: 'categoria', label: 'Categoria' },
  { key: 'nome', label: 'Produto' },
  { key: 'quantidade_estoque', label: 'Estoque Atual' },
  { key: 'estoque_minimo', label: 'Estoque Mínimo' },
  { key: 'sugestao_pedido', label: 'Sugestão' }
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value || 0)
}

onMounted(async () => {
  try {
    resumo.value = await getDashboardResumo()

    const estoqueMinimo = await getEstoqueMinimo()
    produtosEstoqueBaixo.value = estoqueMinimo
      .filter(e => e.repor_estoque)
      .slice(0, 10)
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error)
  }
})
</script>
