<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between print:hidden">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Folha de Contagem</h1>
        <p class="text-sm text-gray-500">Lista de produtos para inventário físico</p>
      </div>
      <div class="flex gap-2">
        <UButton color="primary" @click="loadFolhaContagem" :loading="loading">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
          Atualizar
        </UButton>
        <UButton color="gray" @click="printPage">
          <UIcon name="i-heroicons-printer" class="w-4 h-4 mr-2" />
          Imprimir
        </UButton>
      </div>
    </div>

    <!-- Filtros (escondidos na impressão) -->
    <UCard class="print:hidden">
      <div class="flex flex-wrap gap-4 items-end">
        <UFormGroup label="Categoria">
          <USelect
            v-model="filterCategoria"
            :options="categoriaOptions"
            class="w-48"
          />
        </UFormGroup>
        <UFormGroup label="Ordenar por">
          <USelect
            v-model="sortBy"
            :options="sortOptions"
            class="w-48"
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
      </div>
    </UCard>

    <!-- Cabeçalho da Folha (visível na impressão) -->
    <div class="hidden print:block mb-4">
      <div class="text-center mb-4">
        <h1 class="text-xl font-bold">FOLHA DE CONTAGEM DE ESTOQUE</h1>
        <p class="text-sm">Data: {{ dataAtual }} | Responsável: _______________________</p>
      </div>
    </div>

    <!-- Tabela para Impressao -->
    <UCard :ui="{ body: { padding: 'p-0' } }">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 print:text-xs">
          <thead class="bg-gray-50 print:bg-gray-200">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border print:border-black">#</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border print:border-black">Categoria</th>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border print:border-black">Produto</th>
              <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border print:border-black">Un.</th>
              <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border print:border-black print:hidden">Sistema</th>
              <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border print:border-black bg-yellow-50">DOM</th>
              <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border print:border-black bg-yellow-50">SEG</th>
              <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border print:border-black bg-yellow-50">TER</th>
              <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border print:border-black bg-yellow-50">QUA</th>
              <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border print:border-black bg-yellow-50">QUI</th>
              <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border print:border-black bg-yellow-50">SEX</th>
              <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border print:border-black bg-yellow-50">SAB</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading" class="print:hidden">
              <td colspan="12" class="px-3 py-8 text-center text-gray-500">
                <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin mx-auto mb-2" />
                Carregando...
              </td>
            </tr>
            <tr v-else-if="filteredData.length === 0" class="print:hidden">
              <td colspan="12" class="px-3 py-8 text-center text-gray-500">
                Nenhum produto encontrado
              </td>
            </tr>
            <tr v-for="(item, index) in filteredData" :key="item.produto_id" class="hover:bg-gray-50 print:hover:bg-white">
              <td class="px-2 py-1 text-xs text-gray-500 border print:border-black">{{ index + 1 }}</td>
              <td class="px-2 py-1 text-xs text-gray-600 border print:border-black">{{ item.categoria }}</td>
              <td class="px-2 py-1 text-xs font-medium text-gray-900 border print:border-black">{{ item.produto }}</td>
              <td class="px-2 py-1 text-xs text-center text-gray-600 border print:border-black">{{ item.unidade }}</td>
              <td class="px-2 py-1 text-xs text-center text-blue-600 border print:border-black print:hidden">{{ formatNumber(item.estoque_sistema) }}</td>
              <!-- Colunas para preenchimento manual -->
              <td class="px-2 py-3 text-xs text-center border print:border-black bg-yellow-50/30 print:bg-white">&nbsp;</td>
              <td class="px-2 py-3 text-xs text-center border print:border-black bg-yellow-50/30 print:bg-white">&nbsp;</td>
              <td class="px-2 py-3 text-xs text-center border print:border-black bg-yellow-50/30 print:bg-white">&nbsp;</td>
              <td class="px-2 py-3 text-xs text-center border print:border-black bg-yellow-50/30 print:bg-white">&nbsp;</td>
              <td class="px-2 py-3 text-xs text-center border print:border-black bg-yellow-50/30 print:bg-white">&nbsp;</td>
              <td class="px-2 py-3 text-xs text-center border print:border-black bg-yellow-50/30 print:bg-white">&nbsp;</td>
              <td class="px-2 py-3 text-xs text-center border print:border-black bg-yellow-50/30 print:bg-white">&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Resumo (escondido na impressão) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Total de Produtos</p>
          <p class="text-2xl font-bold text-gray-900">{{ filteredData.length }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Categorias</p>
          <p class="text-2xl font-bold text-blue-600">{{ categoriasCount }}</p>
        </div>
      </UCard>
      <UCard>
        <div class="text-center">
          <p class="text-sm text-gray-500">Valor em Estoque</p>
          <p class="text-2xl font-bold text-green-600">{{ formatCurrency(valorTotalEstoque) }}</p>
        </div>
      </UCard>
    </div>

    <!-- Instruções (escondido na impressão) -->
    <UCard class="print:hidden">
      <h4 class="font-semibold mb-3">Instruções de Uso:</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          <p class="font-medium text-gray-900">1. Imprima a folha</p>
          <p>Clique no botão "Imprimir" para gerar a folha de contagem.</p>
        </div>
        <div>
          <p class="font-medium text-gray-900">2. Faça a contagem física</p>
          <p>Preencha as colunas DOM a SAB com a quantidade contada em cada dia.</p>
        </div>
        <div>
          <p class="font-medium text-gray-900">3. Registre os ajustes</p>
          <p>Acesse o módulo de Ajustes para registrar as diferenças encontradas.</p>
        </div>
        <div>
          <p class="font-medium text-gray-900">4. Coluna Sistema</p>
          <p>Mostra o saldo atual no sistema (não aparece na impressão para evitar influenciar a contagem).</p>
        </div>
      </div>
    </UCard>

    <!-- Rodapé para impressão -->
    <div class="hidden print:block mt-8 pt-4 border-t border-black">
      <div class="flex justify-between text-xs">
        <span>Assinatura do Contador: _______________________</span>
        <span>Assinatura do Supervisor: _______________________</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FolhaContagem } from '~/types'

const { getFolhaContagem } = useRelatorios()
const toast = useToast()

const folhaData = ref<FolhaContagem[]>([])
const loading = ref(false)
const search = ref('')
const filterCategoria = ref('')
const sortBy = ref('categoria')

const sortOptions = [
  { label: 'Categoria', value: 'categoria' },
  { label: 'Produto (A-Z)', value: 'produto' },
  { label: 'Estoque (Menor)', value: 'estoque_asc' },
  { label: 'Estoque (Maior)', value: 'estoque_desc' }
]

const dataAtual = computed(() => {
  return new Date().toLocaleDateString('pt-BR')
})

const categoriaOptions = computed(() => {
  const categorias = [...new Set(folhaData.value.map(f => f.categoria))]
  return [
    { label: 'Todas', value: '' },
    ...categorias.map(c => ({ label: c, value: c }))
  ]
})

const filteredData = computed(() => {
  let result = folhaData.value

  // Filtro por busca
  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(f =>
      f.produto.toLowerCase().includes(term) ||
      f.categoria.toLowerCase().includes(term)
    )
  }

  // Filtro por categoria
  if (filterCategoria.value) {
    result = result.filter(f => f.categoria === filterCategoria.value)
  }

  // Ordenação
  result = [...result].sort((a, b) => {
    switch (sortBy.value) {
      case 'produto':
        return a.produto.localeCompare(b.produto)
      case 'estoque_asc':
        return a.estoque_sistema - b.estoque_sistema
      case 'estoque_desc':
        return b.estoque_sistema - a.estoque_sistema
      default: // categoria
        const catCompare = a.categoria.localeCompare(b.categoria)
        if (catCompare !== 0) return catCompare
        return a.produto.localeCompare(b.produto)
    }
  })

  return result
})

const categoriasCount = computed(() => {
  return new Set(filteredData.value.map(f => f.categoria)).size
})

const valorTotalEstoque = computed(() => {
  return filteredData.value.reduce((sum, f) => sum + (f.valor_estoque || 0), 0)
})

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

const printPage = () => {
  window.print()
}

const loadFolhaContagem = async () => {
  try {
    loading.value = true
    folhaData.value = await getFolhaContagem()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar folha de contagem',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFolhaContagem()
})
</script>

<style>
@media print {
  @page {
    size: landscape;
    margin: 1cm;
  }

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .print\\:hidden {
    display: none !important;
  }

  .print\\:block {
    display: block !important;
  }
}
</style>
