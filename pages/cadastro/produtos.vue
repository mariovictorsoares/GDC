<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Produtos</h1>
        <p class="text-sm text-gray-500">Gerencie o cadastro de produtos</p>
      </div>
      <UButton color="primary" class="w-full sm:w-auto" @click="openModal()">
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
        Novo Produto
      </UButton>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="flex flex-col sm:flex-row flex-wrap gap-4">
        <UInput
          v-model="search"
          placeholder="Buscar produto..."
          icon="i-heroicons-magnifying-glass"
          class="flex-1 min-w-0 sm:min-w-64"
        />
        <USelect
          v-model="filterCategoria"
          :options="categoriaOptions"
          placeholder="Categoria"
          class="w-full sm:w-48"
        />
        <USelect
          v-model="filterStatus"
          :options="statusOptions"
          placeholder="Status"
          class="w-full sm:w-32"
        />
      </div>
    </UCard>

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

        <template #nome-data="{ row }">
          <span class="font-semibold text-gray-900 dark:text-white">{{ row.nome }}</span>
        </template>

        <template #categoria-data="{ row }">
          <UBadge color="gray" variant="soft">
            {{ row.categoria?.nome || '-' }}
          </UBadge>
        </template>

        <template #unidade-data="{ row }">
          {{ row.unidade?.sigla || '-' }}
        </template>

        <template #estoque_inicial-data="{ row }">
          {{ formatNumber(row.estoque_inicial) }}
        </template>

        <template #preco_inicial-data="{ row }">
          {{ formatCurrency(row.preco_inicial) }}
        </template>

        <template #ativo-data="{ row }">
          <UBadge :color="row.ativo ? 'green' : 'gray'">
            {{ row.ativo ? 'Ativo' : 'Inativo' }}
          </UBadge>
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
              color="blue"
              variant="ghost"
              icon="i-heroicons-currency-dollar"
              size="xs"
              title="Custos Mensais"
              @click="openCustosModal(row)"
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
        :total-items="filteredProdutos.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>

    <!-- Modal de Cadastro/Edição -->
    <UModal
      v-model="modalOpen"
      :ui="{
        width: 'sm:max-w-2xl',
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
              {{ editingProduto ? 'Editar Produto' : 'Novo Produto' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="modalOpen = false"
            />
          </div>
        </template>

        <form @submit.prevent="saveProduto" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Nome" required class="md:col-span-2">
              <UInput v-model="form.nome" placeholder="Nome do produto" />
            </UFormGroup>

            <UFormGroup label="Categoria" required>
              <USelect
                v-model="form.categoria_id"
                :options="categoriasSelect"
                placeholder="Selecione a categoria"
              />
            </UFormGroup>

            <UFormGroup label="Unidade" required>
              <USelect
                v-model="form.unidade_id"
                :options="unidadesSelect"
                placeholder="Selecione a unidade"
              />
            </UFormGroup>

            <UFormGroup label="Estoque Inicial">
              <UInput
                v-model.number="form.estoque_inicial"
                type="number"
                step="0.0001"
                placeholder="0"
              />
            </UFormGroup>

            <UFormGroup label="Preço Inicial">
              <UInput
                v-model.number="form.preco_inicial"
                type="number"
                step="0.01"
                placeholder="0,00"
              />
            </UFormGroup>

            <UFormGroup label="Estoque Mínimo">
              <UInput
                v-model.number="form.estoque_minimo"
                type="number"
                step="0.0001"
                placeholder="0"
              />
            </UFormGroup>

            <UFormGroup label="Margem de Segurança (%)">
              <UInput
                v-model.number="form.margem_seguranca"
                type="number"
                step="0.01"
                placeholder="0"
              />
            </UFormGroup>

            <UFormGroup label="Tempo de Reposição (dias)">
              <UInput
                v-model.number="form.tempo_reposicao"
                type="number"
                placeholder="0"
              />
            </UFormGroup>

            <UFormGroup label="Status">
              <div class="flex items-center gap-2">
                <UToggle v-model="form.ativo" />
                <span class="text-sm text-gray-600">{{ form.ativo ? 'Ativo' : 'Inativo' }}</span>
              </div>
            </UFormGroup>
          </div>
        </form>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalOpen = false">
              Cancelar
            </UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="saving" @click="saveProduto">
              {{ editingProduto ? 'Salvar' : 'Criar' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal de Custos Mensais -->
    <UModal
      v-model="custosModalOpen"
      :ui="{
        width: 'sm:max-w-4xl',
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">Custos Mensais</h3>
              <p class="text-sm text-gray-500">{{ selectedProduto?.nome }}</p>
            </div>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="custosModalOpen = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex gap-4 items-center">
            <UFormGroup label="Ano">
              <USelect
                v-model="custoAno"
                :options="anosOptions"
                class="w-32"
              />
            </UFormGroup>
          </div>

          <div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <UFormGroup
              v-for="mes in 12"
              :key="mes"
              :label="mesesNomes[mes - 1]"
            >
              <UInput
                v-model.number="custosForm[mes]"
                type="number"
                step="0.01"
                placeholder="0,00"
                @blur="saveCustoMensal(mes)"
              />
            </UFormGroup>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton color="gray" class="w-full sm:w-auto" @click="custosModalOpen = false">
              Fechar
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

        <p>Tem certeza que deseja desativar o produto <strong>{{ deletingProduto?.nome }}</strong>?</p>
        <p class="text-sm text-gray-500 mt-2">O produto será marcado como inativo.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deleting" @click="deleteProduto">
              Desativar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Produto, Categoria, Unidade } from '~/types'

const {
  getProdutos,
  createProduto,
  updateProduto,
  deleteProduto: removeProduto,
  getCategorias,
  getUnidades,
  getCustosMensais,
  upsertCustoMensal
} = useEstoque()
const toast = useToast()

const produtos = ref<Produto[]>([])
const categorias = ref<Categoria[]>([])
const unidades = ref<Unidade[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const filterCategoria = ref('')
const filterStatus = ref('true')
const modalOpen = ref(false)
const custosModalOpen = ref(false)
const deleteModalOpen = ref(false)
const editingProduto = ref<Produto | null>(null)
const selectedProduto = ref<Produto | null>(null)
const deletingProduto = ref<Produto | null>(null)
const custoAno = ref(new Date().getFullYear())
const custosForm = ref<Record<number, number>>({})

const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const form = ref({
  nome: '',
  categoria_id: '',
  unidade_id: '',
  estoque_inicial: 0,
  preco_inicial: 0,
  estoque_minimo: 0,
  margem_seguranca: 0,
  tempo_reposicao: 0,
  ativo: true
})

const columns = [
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'categoria', label: 'Categoria', sortable: true },
  { key: 'unidade', label: 'Unid.', sortable: true },
  { key: 'estoque_inicial', label: 'Est. Inicial' },
  { key: 'preco_inicial', label: 'Preço Inicial' },
  { key: 'ativo', label: 'Status' },
  { key: 'actions', label: 'Ações', class: 'text-right', rowClass: 'text-right' }
]

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Ativos', value: 'true' },
  { label: 'Inativos', value: 'false' }
]

const categoriaOptions = computed(() => [
  { label: 'Todas', value: '' },
  ...categorias.value.map(c => ({ label: c.nome, value: c.id }))
])

const categoriasSelect = computed(() =>
  categorias.value.map(c => ({ label: c.nome, value: c.id }))
)

const unidadesSelect = computed(() =>
  unidades.value.map(u => ({ label: `${u.sigla} - ${u.descricao || u.sigla}`, value: u.id }))
)

const anosOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    label: String(currentYear - 2 + i),
    value: currentYear - 2 + i
  }))
})

const filteredProdutos = computed(() => {
  let result = produtos.value

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(p =>
      p.nome.toLowerCase().includes(term) ||
      p.categoria?.nome?.toLowerCase().includes(term)
    )
  }

  if (filterCategoria.value) {
    result = result.filter(p => p.categoria_id === filterCategoria.value)
  }

  if (filterStatus.value) {
    const isActive = filterStatus.value === 'true'
    result = result.filter(p => p.ativo === isActive)
  }

  return result
})

const { page, pageSize, paginatedItems } = usePagination(filteredProdutos)

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4
  }).format(value || 0)
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

const loadData = async () => {
  try {
    loading.value = true
    const [prods, cats, unids] = await Promise.all([
      getProdutos(false),
      getCategorias(),
      getUnidades()
    ])
    produtos.value = prods
    categorias.value = cats
    unidades.value = unids
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar dados',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const openModal = (produto?: Produto) => {
  if (produto) {
    editingProduto.value = produto
    form.value = {
      nome: produto.nome,
      categoria_id: produto.categoria_id,
      unidade_id: produto.unidade_id,
      estoque_inicial: produto.estoque_inicial,
      preco_inicial: produto.preco_inicial,
      estoque_minimo: produto.estoque_minimo,
      margem_seguranca: produto.margem_seguranca,
      tempo_reposicao: produto.tempo_reposicao,
      ativo: produto.ativo
    }
  } else {
    editingProduto.value = null
    form.value = {
      nome: '',
      categoria_id: '',
      unidade_id: '',
      estoque_inicial: 0,
      preco_inicial: 0,
      estoque_minimo: 0,
      margem_seguranca: 0,
      tempo_reposicao: 0,
      ativo: true
    }
  }
  modalOpen.value = true
}

const openCustosModal = async (produto: Produto) => {
  selectedProduto.value = produto
  custosForm.value = {}

  try {
    const custos = await getCustosMensais(produto.id, custoAno.value)
    custos.forEach(c => {
      custosForm.value[c.mes] = c.custo
    })
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar custos',
      color: 'red'
    })
  }

  custosModalOpen.value = true
}

const saveCustoMensal = async (mes: number) => {
  if (!selectedProduto.value) return

  const custo = custosForm.value[mes] || 0
  try {
    await upsertCustoMensal({
      produto_id: selectedProduto.value.id,
      ano: custoAno.value,
      mes,
      custo
    })
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar custo',
      color: 'red'
    })
  }
}

watch(custoAno, async () => {
  if (selectedProduto.value) {
    custosForm.value = {}
    try {
      const custos = await getCustosMensais(selectedProduto.value.id, custoAno.value)
      custos.forEach(c => {
        custosForm.value[c.mes] = c.custo
      })
    } catch (error) {
      console.error('Erro ao carregar custos:', error)
    }
  }
})

const saveProduto = async () => {
  if (!form.value.nome || !form.value.categoria_id || !form.value.unidade_id) {
    toast.add({
      title: 'Erro',
      description: 'Nome, categoria e unidade são obrigatórios',
      color: 'red'
    })
    return
  }

  try {
    saving.value = true
    if (editingProduto.value) {
      await updateProduto(editingProduto.value.id, form.value)
      toast.add({
        title: 'Sucesso',
        description: 'Produto atualizado com sucesso',
        color: 'green'
      })
    } else {
      await createProduto(form.value)
      toast.add({
        title: 'Sucesso',
        description: 'Produto criado com sucesso',
        color: 'green'
      })
    }
    modalOpen.value = false
    await loadData()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar produto',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (produto: Produto) => {
  deletingProduto.value = produto
  deleteModalOpen.value = true
}

const deleteProduto = async () => {
  if (!deletingProduto.value) return

  try {
    deleting.value = true
    await removeProduto(deletingProduto.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Produto desativado com sucesso',
      color: 'green'
    })
    deleteModalOpen.value = false
    await loadData()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao desativar produto',
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
