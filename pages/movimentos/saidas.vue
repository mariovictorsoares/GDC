<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Saídas</h1>
        <p class="text-sm text-gray-500">Registre as saídas de produtos para os destinos</p>
      </div>
      <UButton color="primary" class="w-full sm:w-auto" @click="openModal()">
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
        Nova Saída
      </UButton>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <UFormGroup label="Data Início">
          <UInput v-model="filtroDataInicio" type="date" />
        </UFormGroup>
        <UFormGroup label="Data Fim">
          <UInput v-model="filtroDataFim" type="date" />
        </UFormGroup>
        <UFormGroup label="Destino">
          <USelect
            v-model="filtroDestino"
            :options="destinoOptions"
            placeholder="Todos"
          />
        </UFormGroup>
        <UFormGroup label="Produto">
          <UInput
            v-model="search"
            placeholder="Buscar produto..."
            icon="i-heroicons-magnifying-glass"
          />
        </UFormGroup>
        <div class="flex items-end">
          <UButton color="gray" variant="soft" class="w-full" @click="clearFilters">
            Limpar Filtros
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Resumo -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-red-100 rounded-lg">
            <UIcon name="i-heroicons-arrow-up-tray" class="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Total de Saídas</p>
            <p class="text-2xl font-bold text-gray-900">{{ filteredSaidas.length }}</p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-100 rounded-lg">
            <UIcon name="i-heroicons-cube" class="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Total Quantidade</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatNumber(totalQuantidade) }}</p>
          </div>
        </div>
      </UCard>
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-purple-100 rounded-lg">
            <UIcon name="i-heroicons-currency-dollar" class="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Custo Total</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(totalCusto) }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Tabela -->
    <UCard :ui="{ body: { padding: '' } }">
      <UTable
        :columns="columns"
        :rows="paginatedItems"
        :loading="loading"
        :ui="{
          td: { color: 'text-gray-700 dark:text-gray-200' },
          th: { color: 'text-gray-900 dark:text-white' }
        }"
      >
        <!-- Empty State -->
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-gray-500">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhum registro encontrado</p>
          </div>
        </template>

        <template #data-data="{ row }">
          {{ formatDate(row.data) }}
        </template>

        <template #produto-data="{ row }">
          <div>
            <p class="font-semibold text-gray-900 dark:text-white">{{ row.produto?.nome || '-' }}</p>
            <p class="text-xs text-gray-500">{{ row.produto?.categoria?.nome || '' }}</p>
          </div>
        </template>

        <template #destino-data="{ row }">
          <UBadge color="blue" variant="soft">
            {{ row.destino?.nome || '-' }}
          </UBadge>
        </template>

        <template #quantidade-data="{ row }">
          {{ formatNumber(row.quantidade) }} {{ row.produto?.unidade?.sigla || '' }}
        </template>

        <template #custo_saida-data="{ row }">
          <span class="font-medium text-red-600">{{ formatCurrency(row.custo_saida) }}</span>
        </template>

        <template #actions-data="{ row }">
          <div class="flex gap-2 justify-end">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              size="xs"
              @click="openModal(row)"
            />
            <UButton
              color="red"
              variant="ghost"
              icon="i-heroicons-trash"
              size="xs"
              @click="confirmDelete(row)"
            />
          </div>
        </template>
      </UTable>
      <TablePagination
        v-model="page"
        :page-size="pageSize"
        :total-items="filteredSaidas.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>

    <!-- Modal de Cadastro/Edição -->
    <UModal
      v-model="modalOpen"
      :ui="{
        width: 'sm:max-w-xl',
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ editingSaida ? 'Editar Saída' : 'Nova Saída' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="modalOpen = false"
            />
          </div>
        </template>

        <form @submit.prevent="saveSaida" class="space-y-4">
          <!-- Filtro Cascata: Categoria → Produto -->
          <UFormGroup label="Categoria">
            <USelectMenu
              v-model="form.categoria_id"
              :options="categoriasSelect"
              placeholder="Todas as categorias"
              searchable
              searchable-placeholder="Buscar categoria..."
              value-attribute="value"
              option-attribute="label"
              :ui="{ option: { container: 'truncate' } }"
            >
              <template #leading>
                <UIcon name="i-heroicons-tag" class="w-4 h-4 text-gray-400" />
              </template>
            </USelectMenu>
            <p class="text-xs text-gray-500 mt-1">Selecione uma categoria para filtrar os produtos</p>
          </UFormGroup>

          <UFormGroup label="Produto" required>
            <USelectMenu
              v-model="form.produto_id"
              :options="produtosSelect"
              :placeholder="form.categoria_id ? 'Selecione o produto' : 'Selecione uma categoria primeiro'"
              searchable
              searchable-placeholder="Buscar produto..."
              value-attribute="value"
              option-attribute="label"
            >
              <template #leading>
                <UIcon name="i-heroicons-cube" class="w-4 h-4 text-gray-400" />
              </template>
            </USelectMenu>
          </UFormGroup>

          <UFormGroup label="Destino" required>
            <USelect
              v-model="form.destino_id"
              :options="destinosSelect"
              placeholder="Selecione o destino"
            />
          </UFormGroup>

          <UFormGroup label="Data" required>
            <UInput v-model="form.data" type="date" />
          </UFormGroup>

          <UFormGroup label="Quantidade" required>
            <UInput
              v-model.number="form.quantidade"
              type="number"
              step="0.0001"
              min="0.0001"
              placeholder="0"
              :class="{ 'ring-2 ring-red-500': estoqueInsuficiente }"
            />
          </UFormGroup>

          <!-- Alerta de estoque -->
          <div v-if="form.produto_id" class="p-3 rounded-lg" :class="estoqueInsuficiente ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'">
            <div class="flex items-center gap-2">
              <UIcon
                :name="estoqueInsuficiente ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-information-circle'"
                :class="estoqueInsuficiente ? 'text-red-600' : 'text-blue-600'"
                class="w-5 h-5"
              />
              <div>
                <p class="text-sm font-medium" :class="estoqueInsuficiente ? 'text-red-800' : 'text-blue-800'">
                  Estoque disponível: {{ formatNumber(saldoProdutoSelecionado + (editingSaida?.quantidade || 0)) }} {{ produtoSelecionado?.unidade?.sigla || '' }}
                </p>
                <p v-if="estoqueInsuficiente" class="text-xs text-red-600 mt-1">
                  Quantidade solicitada excede o estoque disponível!
                </p>
              </div>
              <UIcon v-if="carregandoSaldo" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-gray-400 ml-auto" />
            </div>
          </div>

          <div class="p-3 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500 mb-1">O custo de saída será calculado automaticamente com base no custo médio do produto.</p>
          </div>

          <UFormGroup label="Observação">
            <UTextarea v-model="form.observacao" placeholder="Observações..." rows="2" />
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalOpen = false">
              Cancelar
            </UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="saving" @click="saveSaida">
              {{ editingSaida ? 'Salvar' : 'Criar' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal de Confirmação de Exclusão -->
    <UModal
      v-model="deleteModalOpen"
      :ui="{
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
        </template>

        <p>Tem certeza que deseja excluir esta saída?</p>
        <div class="mt-2 p-3 bg-gray-50 rounded-lg">
          <p><strong>Produto:</strong> {{ deletingSaida?.produto?.nome }}</p>
          <p><strong>Destino:</strong> {{ deletingSaida?.destino?.nome }}</p>
          <p><strong>Data:</strong> {{ formatDate(deletingSaida?.data) }}</p>
          <p><strong>Quantidade:</strong> {{ formatNumber(deletingSaida?.quantidade) }}</p>
        </div>
        <p class="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deleting" @click="deleteSaida">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Saida, Produto, Destino, Categoria } from '~/types'

const {
  getSaidas,
  createSaida,
  updateSaida,
  deleteSaida: removeSaida,
  getProdutos,
  getDestinos,
  getCategorias,
  getSaldoProduto
} = useEstoque()
const toast = useToast()

const saidas = ref<Saida[]>([])
const produtos = ref<Produto[]>([])
const destinos = ref<Destino[]>([])
const categorias = ref<Categoria[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const filtroDataInicio = ref('')
const filtroDataFim = ref('')
const filtroDestino = ref('')
const modalOpen = ref(false)
const deleteModalOpen = ref(false)
const editingSaida = ref<Saida | null>(null)
const deletingSaida = ref<Saida | null>(null)
const saldoProdutoSelecionado = ref<number>(0)
const carregandoSaldo = ref(false)

const form = ref({
  categoria_id: '',
  produto_id: '',
  destino_id: '',
  data: new Date().toISOString().split('T')[0],
  semana: '',
  quantidade: 0,
  observacao: ''
})

const columns = [
  { key: 'data', label: 'Data', sortable: true },
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'destino', label: 'Destino', sortable: true },
  { key: 'semana', label: 'Semana' },
  { key: 'quantidade', label: 'Quantidade' },
  { key: 'custo_saida', label: 'Custo Saída' },
  { key: 'actions', label: 'Ações', class: 'text-right', rowClass: 'text-right' }
]

const semanaOptions = [
  { label: 'Automático', value: '' },
  { label: 'SEMANA 1', value: 'SEMANA 1' },
  { label: 'SEMANA 2', value: 'SEMANA 2' },
  { label: 'SEMANA 3', value: 'SEMANA 3' },
  { label: 'SEMANA 4', value: 'SEMANA 4' },
  { label: 'SEMANA 5', value: 'SEMANA 5' },
  { label: 'SEMANA 6', value: 'SEMANA 6' }
]

const destinoOptions = computed(() => [
  { label: 'Todos', value: '' },
  ...destinos.value.map(d => ({ label: d.nome, value: d.id }))
])

// Opções de categorias para o select
const categoriasSelect = computed(() =>
  categorias.value.map(c => ({
    label: c.nome,
    value: c.id
  }))
)

// Produtos filtrados pela categoria selecionada (filtro cascata)
const produtosFiltrados = computed(() => {
  if (!form.value.categoria_id) {
    return produtos.value
  }
  return produtos.value.filter(p => p.categoria_id === form.value.categoria_id)
})

const produtosSelect = computed(() =>
  produtosFiltrados.value.map(p => ({
    label: `${p.nome} (${p.categoria?.nome || ''})`,
    value: p.id
  }))
)

const destinosSelect = computed(() =>
  destinos.value.map(d => ({ label: d.nome, value: d.id }))
)

// Verificar se estoque é suficiente para a saída
const estoqueInsuficiente = computed(() => {
  if (!form.value.produto_id || !form.value.quantidade) return false
  // Se estiver editando, considerar a quantidade original
  const qtdOriginal = editingSaida.value?.quantidade || 0
  const saldoDisponivel = saldoProdutoSelecionado.value + qtdOriginal
  return form.value.quantidade > saldoDisponivel
})

// Nome do produto selecionado
const produtoSelecionado = computed(() => {
  return produtos.value.find(p => p.id === form.value.produto_id)
})

const filteredSaidas = computed(() => {
  let result = saidas.value

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(s =>
      s.produto?.nome?.toLowerCase().includes(term) ||
      s.produto?.categoria?.nome?.toLowerCase().includes(term)
    )
  }

  if (filtroDestino.value) {
    result = result.filter(s => s.destino_id === filtroDestino.value)
  }

  return result
})

const clearFilters = () => {
  search.value = ''
  filtroDataInicio.value = ''
  filtroDataFim.value = ''
  filtroDestino.value = ''
  loadSaidas()
}

const { page, pageSize, paginatedItems } = usePagination(filteredSaidas)

const totalQuantidade = computed(() =>
  filteredSaidas.value.reduce((sum, s) => sum + Number(s.quantidade), 0)
)

const totalCusto = computed(() =>
  filteredSaidas.value.reduce((sum, s) => sum + Number(s.custo_saida || 0), 0)
)

const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

const formatNumber = (value: number | undefined) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  }).format(value || 0)
}

const formatCurrency = (value: number | undefined) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const loadSaidas = async () => {
  try {
    loading.value = true
    saidas.value = await getSaidas({
      dataInicio: filtroDataInicio.value || undefined,
      dataFim: filtroDataFim.value || undefined
    })
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar saídas',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const loadData = async () => {
  try {
    const [prods, dests, cats] = await Promise.all([
      getProdutos(),
      getDestinos(),
      getCategorias()
    ])
    produtos.value = prods
    destinos.value = dests
    categorias.value = cats
  } catch (error) {
    console.error('Erro ao carregar dados:', error)
  }
}

// Carregar saldo do produto selecionado
const carregarSaldoProduto = async (produtoId: string) => {
  if (!produtoId) {
    saldoProdutoSelecionado.value = 0
    return
  }
  try {
    carregandoSaldo.value = true
    saldoProdutoSelecionado.value = await getSaldoProduto(produtoId)
  } catch (error) {
    console.error('Erro ao carregar saldo:', error)
    saldoProdutoSelecionado.value = 0
  } finally {
    carregandoSaldo.value = false
  }
}

const openModal = async (saida?: Saida) => {
  if (saida) {
    editingSaida.value = saida
    // Buscar categoria do produto para preencher o filtro cascata
    const produto = produtos.value.find(p => p.id === saida.produto_id)
    form.value = {
      categoria_id: produto?.categoria_id || '',
      produto_id: saida.produto_id,
      destino_id: saida.destino_id,
      data: saida.data,
      semana: saida.semana || '',
      quantidade: saida.quantidade,
      observacao: saida.observacao || ''
    }
    // Carregar saldo do produto
    await carregarSaldoProduto(saida.produto_id)
  } else {
    editingSaida.value = null
    // Buscar o destino "Principal" para pré-selecionar
    const destinoPrincipal = destinos.value.find(d => d.nome === 'Principal')
    form.value = {
      categoria_id: '',
      produto_id: '',
      destino_id: destinoPrincipal?.id || '',
      data: new Date().toISOString().split('T')[0],
      semana: '',
      quantidade: 0,
      observacao: ''
    }
    saldoProdutoSelecionado.value = 0
  }
  modalOpen.value = true
}

// Limpar produto selecionado quando categoria mudar
watch(() => form.value.categoria_id, () => {
  // Se mudar a categoria, verificar se o produto atual pertence à nova categoria
  if (form.value.produto_id) {
    const produtoAtual = produtos.value.find(p => p.id === form.value.produto_id)
    if (produtoAtual && produtoAtual.categoria_id !== form.value.categoria_id) {
      form.value.produto_id = ''
      saldoProdutoSelecionado.value = 0
    }
  }
})

const saveSaida = async () => {
  if (!form.value.produto_id || !form.value.destino_id || !form.value.data || !form.value.quantidade) {
    toast.add({
      title: 'Erro',
      description: 'Produto, destino, data e quantidade são obrigatórios',
      color: 'red'
    })
    return
  }

  // Validar se há estoque suficiente
  if (estoqueInsuficiente.value) {
    const qtdOriginal = editingSaida.value?.quantidade || 0
    const saldoDisponivel = saldoProdutoSelecionado.value + qtdOriginal
    toast.add({
      title: 'Estoque Insuficiente',
      description: `Estoque disponível: ${formatNumber(saldoDisponivel)} ${produtoSelecionado.value?.unidade?.sigla || ''}. Não é possível registrar saída de ${formatNumber(form.value.quantidade)}.`,
      color: 'red'
    })
    return
  }

  try {
    saving.value = true
    const data = {
      produto_id: form.value.produto_id,
      destino_id: form.value.destino_id,
      data: form.value.data,
      semana: form.value.semana || null,
      quantidade: form.value.quantidade,
      observacao: form.value.observacao || null
    }

    if (editingSaida.value) {
      await updateSaida(editingSaida.value.id, data)
      toast.add({
        title: 'Sucesso',
        description: 'Saída atualizada com sucesso',
        color: 'green'
      })
    } else {
      await createSaida(data)
      toast.add({
        title: 'Sucesso',
        description: 'Saída registrada com sucesso',
        color: 'green'
      })
    }
    modalOpen.value = false
    await loadSaidas()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar saída',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (saida: Saida) => {
  deletingSaida.value = saida
  deleteModalOpen.value = true
}

const deleteSaida = async () => {
  if (!deletingSaida.value) return

  try {
    deleting.value = true
    await removeSaida(deletingSaida.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Saída excluída com sucesso',
      color: 'green'
    })
    deleteModalOpen.value = false
    await loadSaidas()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir saída',
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}

watch([filtroDataInicio, filtroDataFim], () => {
  loadSaidas()
})

// Atualizar saldo quando mudar o produto selecionado
watch(() => form.value.produto_id, (novoProdutoId) => {
  if (novoProdutoId) {
    carregarSaldoProduto(novoProdutoId)
  } else {
    saldoProdutoSelecionado.value = 0
  }
})

onMounted(() => {
  loadSaidas()
  loadData()
})
</script>
