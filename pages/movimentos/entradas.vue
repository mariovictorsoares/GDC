<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Entradas</h1>
        <p class="text-sm text-gray-500">Registre as compras e entradas de produtos</p>
      </div>
      <UButton color="primary" class="w-full sm:w-auto" @click="openModal()">
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
        Nova Entrada
      </UButton>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <UFormGroup label="Data Início">
          <UInput v-model="filtroDataInicio" type="date" />
        </UFormGroup>
        <UFormGroup label="Data Fim">
          <UInput v-model="filtroDataFim" type="date" />
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
          <div class="p-3 bg-green-100 rounded-lg">
            <UIcon name="i-heroicons-arrow-down-tray" class="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Total de Entradas</p>
            <p class="text-2xl font-bold text-gray-900">{{ filteredEntradas.length }}</p>
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
            <p class="text-sm text-gray-500">Valor Total</p>
            <p class="text-2xl font-bold text-gray-900">{{ formatCurrency(totalValor) }}</p>
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

        <template #quantidade-data="{ row }">
          {{ formatNumber(row.quantidade) }} {{ row.produto?.unidade?.sigla || '' }}
        </template>

        <template #custo_unitario-data="{ row }">
          {{ formatCurrency(row.custo_unitario) }}
        </template>

        <template #valor_total-data="{ row }">
          <span class="font-medium text-green-600">{{ formatCurrency(row.valor_total) }}</span>
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
        :total-items="filteredEntradas.length"
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
              {{ editingEntrada ? 'Editar Entrada' : 'Nova Entrada' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="modalOpen = false"
            />
          </div>
        </template>

        <form @submit.prevent="saveEntrada" class="space-y-4">
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

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Data" required>
              <UInput v-model="form.data" type="date" />
            </UFormGroup>

            <UFormGroup label="Semana">
              <USelect
                v-model="form.semana"
                :options="semanaOptions"
                placeholder="Automático"
              />
            </UFormGroup>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Quantidade" required>
              <UInput
                v-model.number="form.quantidade"
                type="number"
                step="0.0001"
                min="0.0001"
                placeholder="0"
              />
            </UFormGroup>

            <UFormGroup label="Custo Unitário" required>
              <UInput
                v-model.number="form.custo_unitario"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
              />
            </UFormGroup>
          </div>

          <div class="p-3 bg-green-50 rounded-lg">
            <div class="flex justify-between items-center">
              <span class="text-sm text-gray-600">Valor Total:</span>
              <span class="text-lg font-bold text-green-600">
                {{ formatCurrency(valorTotalCalc) }}
              </span>
            </div>
          </div>

          <UFormGroup label="Número da NF">
            <UInput v-model="form.numero_nf" placeholder="Número da nota fiscal" />
          </UFormGroup>

          <UFormGroup label="Observação">
            <UTextarea v-model="form.observacao" placeholder="Observações..." rows="2" />
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalOpen = false">
              Cancelar
            </UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="saving" @click="saveEntrada">
              {{ editingEntrada ? 'Salvar' : 'Criar' }}
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

        <p>Tem certeza que deseja excluir esta entrada?</p>
        <div class="mt-2 p-3 bg-gray-50 rounded-lg">
          <p><strong>Produto:</strong> {{ deletingEntrada?.produto?.nome }}</p>
          <p><strong>Data:</strong> {{ formatDate(deletingEntrada?.data) }}</p>
          <p><strong>Quantidade:</strong> {{ formatNumber(deletingEntrada?.quantidade) }}</p>
        </div>
        <p class="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deleting" @click="deleteEntrada">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Entrada, Produto, Categoria } from '~/types'

const { getEntradas, createEntrada, updateEntrada, deleteEntrada: removeEntrada, getProdutos, getCategorias } = useEstoque()
const toast = useToast()

const entradas = ref<Entrada[]>([])
const produtos = ref<Produto[]>([])
const categorias = ref<Categoria[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const filtroDataInicio = ref('')
const filtroDataFim = ref('')
const modalOpen = ref(false)
const deleteModalOpen = ref(false)
const editingEntrada = ref<Entrada | null>(null)
const deletingEntrada = ref<Entrada | null>(null)

const form = ref({
  categoria_id: '',
  produto_id: '',
  data: new Date().toISOString().split('T')[0],
  semana: '',
  quantidade: 0,
  custo_unitario: 0,
  numero_nf: '',
  observacao: ''
})

const columns = [
  { key: 'data', label: 'Data', sortable: true },
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'semana', label: 'Semana' },
  { key: 'quantidade', label: 'Quantidade' },
  { key: 'custo_unitario', label: 'Custo Unit.' },
  { key: 'valor_total', label: 'Valor Total' },
  { key: 'numero_nf', label: 'NF' },
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

const filteredEntradas = computed(() => {
  let result = entradas.value

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(e =>
      e.produto?.nome?.toLowerCase().includes(term) ||
      e.produto?.categoria?.nome?.toLowerCase().includes(term)
    )
  }

  return result
})

const clearFilters = () => {
  search.value = ''
  filtroDataInicio.value = ''
  filtroDataFim.value = ''
  loadEntradas()
}

const { page, pageSize, paginatedItems } = usePagination(filteredEntradas)

const totalQuantidade = computed(() =>
  filteredEntradas.value.reduce((sum, e) => sum + Number(e.quantidade), 0)
)

const totalValor = computed(() =>
  filteredEntradas.value.reduce((sum, e) => sum + Number(e.valor_total), 0)
)

const valorTotalCalc = computed(() =>
  (form.value.quantidade || 0) * (form.value.custo_unitario || 0)
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

const loadEntradas = async () => {
  try {
    loading.value = true
    entradas.value = await getEntradas({
      dataInicio: filtroDataInicio.value || undefined,
      dataFim: filtroDataFim.value || undefined
    })
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar entradas',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const loadProdutos = async () => {
  try {
    produtos.value = await getProdutos()
  } catch (error) {
    console.error('Erro ao carregar produtos:', error)
  }
}

const loadCategorias = async () => {
  try {
    categorias.value = await getCategorias()
  } catch (error) {
    console.error('Erro ao carregar categorias:', error)
  }
}

const openModal = (entrada?: Entrada) => {
  if (entrada) {
    editingEntrada.value = entrada
    // Buscar categoria do produto para preencher o filtro cascata
    const produto = produtos.value.find(p => p.id === entrada.produto_id)
    form.value = {
      categoria_id: produto?.categoria_id || '',
      produto_id: entrada.produto_id,
      data: entrada.data,
      semana: entrada.semana || '',
      quantidade: entrada.quantidade,
      custo_unitario: entrada.custo_unitario,
      numero_nf: entrada.numero_nf || '',
      observacao: entrada.observacao || ''
    }
  } else {
    editingEntrada.value = null
    form.value = {
      categoria_id: '',
      produto_id: '',
      data: new Date().toISOString().split('T')[0],
      semana: '',
      quantidade: 0,
      custo_unitario: 0,
      numero_nf: '',
      observacao: ''
    }
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
    }
  }
})

const saveEntrada = async () => {
  if (!form.value.produto_id || !form.value.data || !form.value.quantidade || form.value.custo_unitario === undefined) {
    toast.add({
      title: 'Erro',
      description: 'Produto, data, quantidade e custo são obrigatórios',
      color: 'red'
    })
    return
  }

  try {
    saving.value = true
    const data = {
      produto_id: form.value.produto_id,
      data: form.value.data,
      semana: form.value.semana || null,
      quantidade: form.value.quantidade,
      custo_unitario: form.value.custo_unitario,
      numero_nf: form.value.numero_nf || null,
      observacao: form.value.observacao || null
    }

    if (editingEntrada.value) {
      await updateEntrada(editingEntrada.value.id, data)
      toast.add({
        title: 'Sucesso',
        description: 'Entrada atualizada com sucesso',
        color: 'green'
      })
    } else {
      await createEntrada(data)
      toast.add({
        title: 'Sucesso',
        description: 'Entrada registrada com sucesso',
        color: 'green'
      })
    }
    modalOpen.value = false
    await loadEntradas()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar entrada',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (entrada: Entrada) => {
  deletingEntrada.value = entrada
  deleteModalOpen.value = true
}

const deleteEntrada = async () => {
  if (!deletingEntrada.value) return

  try {
    deleting.value = true
    await removeEntrada(deletingEntrada.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Entrada excluída com sucesso',
      color: 'green'
    })
    deleteModalOpen.value = false
    await loadEntradas()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir entrada',
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}

watch([filtroDataInicio, filtroDataFim], () => {
  loadEntradas()
})

onMounted(() => {
  loadEntradas()
  loadProdutos()
  loadCategorias()
})
</script>
