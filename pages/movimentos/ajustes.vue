<template>
  <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Ajustes de Estoque</h1>
          <p class="text-sm text-gray-500">Registre ajustes de inventário (diferenças de contagem física)</p>
        </div>
        <UButton color="primary" class="w-full sm:w-auto" @click="openModal()">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
          Novo Ajuste
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
          <UFormGroup label="Categoria">
            <USelect
              v-model="filtroCategoria"
              :options="categoriaOptions"
              placeholder="Todas"
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
            <div class="p-3 bg-yellow-100 rounded-lg">
              <UIcon name="i-heroicons-adjustments-horizontal" class="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Total de Ajustes</p>
              <p class="text-2xl font-bold text-gray-900">{{ filteredAjustes.length }}</p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-green-100 rounded-lg">
              <UIcon name="i-heroicons-arrow-trending-up" class="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Ajustes Positivos (Sobras)</p>
              <p class="text-2xl font-bold text-green-600">+{{ formatNumber(totalPositivo) }}</p>
            </div>
          </div>
        </UCard>
        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-red-100 rounded-lg">
              <UIcon name="i-heroicons-arrow-trending-down" class="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Ajustes Negativos (Faltas)</p>
              <p class="text-2xl font-bold text-red-600">{{ formatNumber(totalNegativo) }}</p>
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
            <span
              class="font-medium"
              :class="row.quantidade >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ row.quantidade >= 0 ? '+' : '' }}{{ formatNumber(row.quantidade) }}
              {{ row.produto?.unidade?.sigla || '' }}
            </span>
          </template>

          <template #motivo-data="{ row }">
            <span class="text-sm text-gray-600">{{ row.motivo || '-' }}</span>
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
          :total-items="filteredAjustes.length"
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
              {{ editingAjuste ? 'Editar Ajuste' : 'Novo Ajuste' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="modalOpen = false"
            />
          </div>
        </template>

        <form @submit.prevent="saveAjuste" class="space-y-4">
          <!-- Filtro Cascata: Categoria -->
          <UFormGroup label="Categoria" required>
            <USelect
              v-model="formCategoriaId"
              :options="categoriasSelect"
              placeholder="Selecione a categoria"
            />
          </UFormGroup>

          <!-- Filtro Cascata: Produto (filtrado por categoria) -->
          <UFormGroup label="Produto" required>
            <USelectMenu
              v-model="form.produto_id"
              :options="produtosFiltrados"
              placeholder="Selecione o produto"
              searchable
              searchable-placeholder="Buscar produto..."
              value-attribute="value"
              option-attribute="label"
              :disabled="!formCategoriaId"
            />
            <p v-if="!formCategoriaId" class="text-xs text-gray-500 mt-1">
              Selecione uma categoria primeiro
            </p>
          </UFormGroup>

          <UFormGroup label="Data" required>
            <UInput v-model="form.data" type="date" />
          </UFormGroup>

          <!-- Estoque do Sistema -->
          <div v-if="form.produto_id" class="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex items-center gap-2 mb-2">
              <UIcon name="i-heroicons-calculator" class="w-5 h-5 text-blue-600" />
              <span class="font-medium text-blue-800">Estoque do Sistema</span>
            </div>
            <p class="text-2xl font-bold text-blue-600">
              {{ formatNumber(saldoProdutoSelecionado) }} {{ produtoSelecionado?.unidade?.sigla || '' }}
            </p>
            <p class="text-xs text-blue-600 mt-1">
              Quantidade registrada no sistema atualmente
            </p>
          </div>

          <!-- Quantidade Contada (o que o usuário digita) -->
          <UFormGroup label="Quantidade Física Contada" required>
            <UInput
              v-model.number="form.quantidade_contada"
              type="number"
              step="0.0001"
              min="0"
              placeholder="Digite a quantidade contada fisicamente"
              :disabled="!form.produto_id"
            />
            <p class="text-xs text-gray-500 mt-1">
              Digite a quantidade que foi contada na verificação física
            </p>
          </UFormGroup>

          <!-- Cálculo Automático do Ajuste -->
          <div
            v-if="form.produto_id && form.quantidade_contada !== null && form.quantidade_contada !== undefined"
            class="p-4 rounded-lg border-2"
            :class="ajusteCalculado >= 0 ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium" :class="ajusteCalculado >= 0 ? 'text-green-800' : 'text-red-800'">
                  {{ ajusteCalculado >= 0 ? 'SOBRA' : 'FALTA' }} (Ajuste Calculado)
                </p>
                <p class="text-xs" :class="ajusteCalculado >= 0 ? 'text-green-600' : 'text-red-600'">
                  Contagem ({{ formatNumber(form.quantidade_contada) }}) - Sistema ({{ formatNumber(saldoProdutoSelecionado) }})
                </p>
              </div>
              <p
                class="text-2xl font-bold"
                :class="ajusteCalculado >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                {{ ajusteCalculado >= 0 ? '+' : '' }}{{ formatNumber(ajusteCalculado) }}
              </p>
            </div>
          </div>

          <UFormGroup label="Motivo do Ajuste" required>
            <UTextarea
              v-model="form.motivo"
              placeholder="Descreva o motivo do ajuste (ex: Quebra, Perda, Diferença de contagem)..."
              rows="3"
            />
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalOpen = false">
              Cancelar
            </UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="saving" @click="saveAjuste">
              {{ editingAjuste ? 'Salvar' : 'Registrar Ajuste' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal de Continuação -->
    <UModal
      v-model="continuarModalOpen"
      :ui="{
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-green-100 rounded-lg">
              <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-green-600" />
            </div>
            <h3 class="text-lg font-semibold">Ajuste Registrado!</h3>
          </div>
        </template>

        <p>Deseja registrar outro ajuste de estoque?</p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="fecharEVoltar">
              Não, Finalizar
            </UButton>
            <UButton color="primary" @click="continuarAjustes">
              Sim, Continuar
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

        <p>Tem certeza que deseja excluir este ajuste?</p>
        <div class="mt-2 p-3 bg-gray-50 rounded-lg">
          <p><strong>Produto:</strong> {{ deletingAjuste?.produto?.nome }}</p>
          <p><strong>Data:</strong> {{ formatDate(deletingAjuste?.data) }}</p>
          <p><strong>Quantidade:</strong> {{ formatNumber(deletingAjuste?.quantidade) }}</p>
          <p><strong>Motivo:</strong> {{ deletingAjuste?.motivo || '-' }}</p>
        </div>
        <p class="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deleting" @click="deleteAjuste">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Ajuste, Produto, Categoria } from '~/types'

const router = useRouter()
const { getAjustes, createAjuste, updateAjuste, deleteAjuste: removeAjuste, getProdutos, getCategorias, getSaldoProduto } = useEstoque()
const toast = useToast()

// Dados
const ajustes = ref<Ajuste[]>([])
const produtos = ref<Produto[]>([])
const categorias = ref<Categoria[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const filtroDataInicio = ref('')
const filtroDataFim = ref('')
const filtroCategoria = ref('')
const modalOpen = ref(false)
const deleteModalOpen = ref(false)
const continuarModalOpen = ref(false)
const editingAjuste = ref<Ajuste | null>(null)
const deletingAjuste = ref<Ajuste | null>(null)
const saldoProdutoSelecionado = ref<number>(0)
const formCategoriaId = ref('')

const form = ref({
  produto_id: '',
  data: new Date().toISOString().split('T')[0],
  semana: '',
  quantidade_contada: null as number | null,
  motivo: ''
})

const columns = [
  { key: 'data', label: 'Data', sortable: true },
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'semana', label: 'Semana' },
  { key: 'quantidade', label: 'Ajuste' },
  { key: 'motivo', label: 'Motivo' },
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

const categoriasSelect = computed(() => [
  { label: 'Selecione...', value: '' },
  ...categorias.value.map(c => ({
    label: c.nome,
    value: c.id
  }))
])

const categoriaOptions = computed(() => [
  { label: 'Todas', value: '' },
  ...categorias.value.map(c => ({ label: c.nome, value: c.id }))
])

// Filtro cascata: produtos filtrados por categoria
const produtosFiltrados = computed(() => {
  if (!formCategoriaId.value) return []
  return produtos.value
    .filter(p => p.categoria_id === formCategoriaId.value)
    .map(p => ({
      label: p.nome,
      value: p.id
    }))
})

const produtoSelecionado = computed(() => {
  return produtos.value.find(p => p.id === form.value.produto_id)
})

// Cálculo automático: Ajuste = Contagem - Sistema
const ajusteCalculado = computed(() => {
  if (form.value.quantidade_contada === null || form.value.quantidade_contada === undefined) return 0
  return form.value.quantidade_contada - saldoProdutoSelecionado.value
})

const filteredAjustes = computed(() => {
  let result = ajustes.value

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(a =>
      a.produto?.nome?.toLowerCase().includes(term) ||
      a.produto?.categoria?.nome?.toLowerCase().includes(term) ||
      a.motivo?.toLowerCase().includes(term)
    )
  }

  if (filtroCategoria.value) {
    result = result.filter(a => a.produto?.categoria_id === filtroCategoria.value)
  }

  return result
})

const clearFilters = () => {
  search.value = ''
  filtroDataInicio.value = ''
  filtroDataFim.value = ''
  filtroCategoria.value = ''
  loadAjustes()
}

const { page, pageSize, paginatedItems } = usePagination(filteredAjustes)

const totalPositivo = computed(() =>
  filteredAjustes.value
    .filter(a => Number(a.quantidade) > 0)
    .reduce((sum, a) => sum + Number(a.quantidade), 0)
)

const totalNegativo = computed(() =>
  filteredAjustes.value
    .filter(a => Number(a.quantidade) < 0)
    .reduce((sum, a) => sum + Number(a.quantidade), 0)
)

const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

const formatNumber = (value: number | undefined | null) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  }).format(value || 0)
}

const loadAjustes = async () => {
  try {
    loading.value = true
    ajustes.value = await getAjustes({
      dataInicio: filtroDataInicio.value || undefined,
      dataFim: filtroDataFim.value || undefined
    })
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar ajustes',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const loadData = async () => {
  try {
    const [prods, cats] = await Promise.all([
      getProdutos(),
      getCategorias()
    ])
    produtos.value = prods
    categorias.value = cats
    await loadAjustes()
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
    saldoProdutoSelecionado.value = await getSaldoProduto(produtoId)
  } catch (error) {
    console.error('Erro ao carregar saldo:', error)
    saldoProdutoSelecionado.value = 0
  }
}

const openModal = async (ajuste?: Ajuste) => {
  if (ajuste) {
    editingAjuste.value = ajuste
    formCategoriaId.value = ajuste.produto?.categoria_id || ''

    // Carregar saldo e calcular quantidade contada original
    await carregarSaldoProduto(ajuste.produto_id)
    const quantidadeContadaOriginal = saldoProdutoSelecionado.value + ajuste.quantidade

    form.value = {
      produto_id: ajuste.produto_id,
      data: ajuste.data,
      semana: ajuste.semana || '',
      quantidade_contada: quantidadeContadaOriginal,
      motivo: ajuste.motivo || ''
    }
  } else {
    editingAjuste.value = null
    formCategoriaId.value = ''
    form.value = {
      produto_id: '',
      data: new Date().toISOString().split('T')[0],
      semana: '',
      quantidade_contada: null,
      motivo: ''
    }
    saldoProdutoSelecionado.value = 0
  }
  modalOpen.value = true
}

const saveAjuste = async () => {
  if (!form.value.produto_id || !form.value.data || form.value.quantidade_contada === null || !form.value.motivo) {
    toast.add({
      title: 'Erro',
      description: 'Produto, data, quantidade contada e motivo são obrigatórios',
      color: 'red'
    })
    return
  }

  try {
    saving.value = true

    // Ajuste = Contagem - Sistema
    const quantidade = ajusteCalculado.value

    const data = {
      produto_id: form.value.produto_id,
      data: form.value.data,
      semana: form.value.semana || null,
      quantidade,
      motivo: form.value.motivo
    }

    if (editingAjuste.value) {
      await updateAjuste(editingAjuste.value.id, data)
      toast.add({
        title: 'Sucesso',
        description: 'Ajuste atualizado com sucesso',
        color: 'green'
      })
      modalOpen.value = false
    } else {
      await createAjuste(data)
      toast.add({
        title: 'Sucesso',
        description: 'Ajuste registrado com sucesso',
        color: 'green'
      })
      modalOpen.value = false
      // Perguntar se deseja continuar
      continuarModalOpen.value = true
    }
    await loadAjustes()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar ajuste',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

const continuarAjustes = () => {
  continuarModalOpen.value = false
  openModal()
}

const fecharEVoltar = () => {
  continuarModalOpen.value = false
}

const confirmDelete = (ajuste: Ajuste) => {
  deletingAjuste.value = ajuste
  deleteModalOpen.value = true
}

const deleteAjuste = async () => {
  if (!deletingAjuste.value) return

  try {
    deleting.value = true
    await removeAjuste(deletingAjuste.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Ajuste excluído com sucesso',
      color: 'green'
    })
    deleteModalOpen.value = false
    await loadAjustes()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir ajuste',
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}

// Limpar produto quando categoria mudar
watch(formCategoriaId, () => {
  form.value.produto_id = ''
  saldoProdutoSelecionado.value = 0
  form.value.quantidade_contada = null
})

// Atualizar saldo quando mudar o produto selecionado
watch(() => form.value.produto_id, async (novoProdutoId) => {
  if (novoProdutoId) {
    await carregarSaldoProduto(novoProdutoId)
  } else {
    saldoProdutoSelecionado.value = 0
  }
})

watch([filtroDataInicio, filtroDataFim], () => {
  loadAjustes()
})

onMounted(() => {
  loadData()
})
</script>
