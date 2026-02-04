<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Produtos</h1>
        <p class="text-sm text-gray-500">Gerencie o cadastro de produtos</p>
      </div>
      <div class="flex gap-2">
        <UButton color="white" class="w-full sm:w-auto" @click="openUnidadesModal()">
          <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 mr-2" />
          Gerenciar Unidades
        </UButton>
        <UButton color="primary" class="w-full sm:w-auto" @click="openModal()">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
          Novo Produto
        </UButton>
      </div>
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
          v-model="filterGrupo"
          :options="grupoOptions"
          placeholder="Grupo"
          class="w-full sm:w-40"
          @change="filterSubgrupo = ''"
        />
        <USelect
          v-model="filterSubgrupo"
          :options="subgrupoFilterOptions"
          placeholder="Subgrupo"
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

        <template #subgrupo-data="{ row }">
          <div class="flex flex-col">
            <UBadge color="gray" variant="soft">
              {{ row.subgrupo?.nome || '-' }}
            </UBadge>
            <span class="text-xs text-gray-400 mt-1">{{ row.subgrupo?.grupo?.nome || '' }}</span>
          </div>
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
      :prevent-close="unidadesModalOpen"
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

            <UFormGroup label="Grupo" required>
              <USelect
                v-model="form.grupo_id"
                :options="gruposSelect"
                placeholder="Selecione o grupo"
                :disabled="!!editingProduto"
                :ui="editingProduto ? { color: { white: { outline: 'bg-gray-100 text-gray-500 cursor-not-allowed' } } } : {}"
                @change="form.subgrupo_id = ''"
              />
            </UFormGroup>

            <UFormGroup label="Subgrupo" required>
              <USelect
                v-model="form.subgrupo_id"
                :options="subgruposSelectFiltered"
                placeholder="Selecione o subgrupo"
                :disabled="!!editingProduto || !form.grupo_id"
                :ui="editingProduto || !form.grupo_id ? { color: { white: { outline: 'bg-gray-100 text-gray-500 cursor-not-allowed' } } } : {}"
              />
            </UFormGroup>

            <UFormGroup label="Unidade" required>
              <div class="flex gap-2">
                <USelect
                  v-model="form.unidade_id"
                  :options="unidadesSelect"
                  placeholder="Selecione a unidade"
                  class="flex-1"
                  :disabled="!!editingProduto"
                  :ui="editingProduto ? { color: { white: { outline: 'bg-gray-100 text-gray-500 cursor-not-allowed' } } } : {}"
                />
                <UButton
                  v-if="!editingProduto"
                  color="gray"
                  variant="soft"
                  icon="i-heroicons-cog-6-tooth"
                  @click="openUnidadesModal()"
                  title="Gerenciar Unidades"
                />
              </div>
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

    <!-- Modal de Gerenciamento de Unidades -->
    <UModal
      v-model="unidadesModalOpen"
      :prevent-close="deleteUnidadeModalOpen"
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
            <h3 class="text-lg font-semibold">Gerenciar Unidades</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="unidadesModalOpen = false"
            />
          </div>
        </template>

        <!-- Formulário de Nova Unidade -->
        <div class="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 class="text-sm font-medium text-gray-700 mb-3">{{ editingUnidade ? 'Editar Unidade' : 'Nova Unidade' }}</h4>
          <div class="flex gap-2">
            <UInput
              v-model="unidadeForm.sigla"
              placeholder="Sigla (ex: KG)"
              class="w-24"
              maxlength="10"
            />
            <UInput
              v-model="unidadeForm.descricao"
              placeholder="Descrição (ex: Quilograma)"
              class="flex-1"
            />
            <UButton
              color="primary"
              :loading="savingUnidade"
              @click="saveUnidade"
            >
              {{ editingUnidade ? 'Salvar' : 'Adicionar' }}
            </UButton>
            <UButton
              v-if="editingUnidade"
              color="gray"
              variant="ghost"
              @click="cancelEditUnidade"
            >
              Cancelar
            </UButton>
          </div>
        </div>

        <!-- Lista de Unidades -->
        <div class="max-h-80 overflow-y-auto border rounded-lg">
          <UTable
            :columns="unidadesColumns"
            :rows="unidades"
            :ui="{
              td: { color: 'text-gray-700 dark:text-gray-200' },
              th: { color: 'text-gray-900 dark:text-white' },
              thead: 'sticky top-0 bg-white dark:bg-gray-800 z-10'
            }"
          >
            <template #empty-state>
              <div class="flex flex-col items-center justify-center py-6 text-gray-500">
                <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
                <p class="text-sm">Nenhuma unidade cadastrada</p>
              </div>
            </template>

            <template #sigla-data="{ row }">
              <span class="font-semibold text-gray-900 dark:text-white">{{ row.sigla }}</span>
            </template>

            <template #descricao-data="{ row }">
              <span class="text-gray-600">{{ row.descricao || '—' }}</span>
            </template>

            <template #actions-data="{ row }">
              <div class="flex gap-1 justify-end">
                <UButton
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-pencil-square"
                  size="xs"
                  @click="editUnidade(row)"
                />
                <UButton
                  color="red"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  size="xs"
                  @click="confirmDeleteUnidade(row)"
                />
              </div>
            </template>
          </UTable>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton color="gray" @click="unidadesModalOpen = false">
              Fechar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal de Confirmação de Exclusão de Unidade -->
    <UModal
      v-model="deleteUnidadeModalOpen"
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

        <p>Tem certeza que deseja excluir a unidade <strong>{{ deletingUnidade?.sigla }}</strong>?</p>
        <p class="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteUnidadeModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deletingUnidadeLoading" @click="deleteUnidade">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Produto, Grupo, Subgrupo, Unidade } from '~/types'

const {
  getProdutos,
  createProduto,
  updateProduto,
  deleteProduto: removeProduto,
  getGrupos,
  getSubgrupos,
  getUnidades,
  createUnidade,
  updateUnidade,
  deleteUnidade: removeUnidade,
  getCustosMensais,
  upsertCustoMensal
} = useEstoque()
const toast = useToast()

const produtos = ref<Produto[]>([])
const grupos = ref<Grupo[]>([])
const subgrupos = ref<Subgrupo[]>([])
const unidades = ref<Unidade[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const filterGrupo = ref('')
const filterSubgrupo = ref('')
const filterStatus = ref('true')
const modalOpen = ref(false)
const custosModalOpen = ref(false)
const deleteModalOpen = ref(false)
const editingProduto = ref<Produto | null>(null)
const selectedProduto = ref<Produto | null>(null)
const deletingProduto = ref<Produto | null>(null)
const custoAno = ref(new Date().getFullYear())
const custosForm = ref<Record<number, number>>({})

// Unidades
const unidadesModalOpen = ref(false)
const deleteUnidadeModalOpen = ref(false)
const editingUnidade = ref<Unidade | null>(null)
const deletingUnidade = ref<Unidade | null>(null)
const savingUnidade = ref(false)
const deletingUnidadeLoading = ref(false)
const unidadeForm = ref({
  sigla: '',
  descricao: ''
})

const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const form = ref({
  nome: '',
  grupo_id: '',
  subgrupo_id: '',
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
  { key: 'subgrupo', label: 'Subgrupo', sortable: true },
  { key: 'unidade', label: 'Unid.', sortable: true },
  { key: 'estoque_inicial', label: 'Est. Inicial' },
  { key: 'preco_inicial', label: 'Preço Inicial' },
  { key: 'ativo', label: 'Status' },
  { key: 'actions', label: 'Ações', class: 'text-right', rowClass: 'text-right' }
]

const unidadesColumns = [
  { key: 'sigla', label: 'Sigla', sortable: true },
  { key: 'descricao', label: 'Descrição', sortable: true },
  { key: 'actions', label: 'Ações', class: 'text-right', rowClass: 'text-right' }
]

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Ativos', value: 'true' },
  { label: 'Inativos', value: 'false' }
]

const grupoOptions = computed(() => [
  { label: 'Todos', value: '' },
  ...grupos.value.map(g => ({ label: g.nome, value: g.id }))
])

const subgrupoFilterOptions = computed(() => {
  const options = [{ label: 'Todos', value: '' }]

  let filtered = subgrupos.value
  if (filterGrupo.value) {
    filtered = subgrupos.value.filter(s => s.grupo_id === filterGrupo.value)
  }

  return [...options, ...filtered.map(s => ({ label: s.nome, value: s.id }))]
})

const gruposSelect = computed(() =>
  grupos.value.map(g => ({ label: g.nome, value: g.id }))
)

const subgruposSelectFiltered = computed(() => {
  if (!form.value.grupo_id) return []
  return subgrupos.value
    .filter(s => s.grupo_id === form.value.grupo_id)
    .map(s => ({ label: s.nome, value: s.id }))
})

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
      p.subgrupo?.nome?.toLowerCase().includes(term) ||
      p.subgrupo?.grupo?.nome?.toLowerCase().includes(term)
    )
  }

  if (filterGrupo.value) {
    result = result.filter(p => p.subgrupo?.grupo_id === filterGrupo.value)
  }

  if (filterSubgrupo.value) {
    result = result.filter(p => p.subgrupo_id === filterSubgrupo.value)
  }

  if (filterStatus.value) {
    const isActive = filterStatus.value === 'true'
    result = result.filter(p => p.ativo === isActive)
  }

  return result
})

const { page, pageSize, paginatedItems } = usePagination(filteredProdutos)

// Formata texto com primeira letra maiúscula e resto minúsculo
const formatarNome = (texto: string) => {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
}

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
    const [prods, grps, subgrps, unids] = await Promise.all([
      getProdutos(false),
      getGrupos(),
      getSubgrupos(),
      getUnidades()
    ])
    produtos.value = prods
    grupos.value = grps
    subgrupos.value = subgrps
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
      grupo_id: produto.subgrupo?.grupo_id || '',
      subgrupo_id: produto.subgrupo_id || '',
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
      grupo_id: '',
      subgrupo_id: '',
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
  if (!form.value.nome || !form.value.subgrupo_id || !form.value.unidade_id) {
    toast.add({
      title: 'Erro',
      description: 'Nome, subgrupo e unidade são obrigatórios',
      color: 'red'
    })
    return
  }

  // Formata o nome antes de salvar
  form.value.nome = formatarNome(form.value.nome)

  // Prepara dados para enviar (sem grupo_id que é apenas para o formulário)
  const dadosProduto = {
    nome: form.value.nome,
    subgrupo_id: form.value.subgrupo_id,
    unidade_id: form.value.unidade_id,
    estoque_inicial: form.value.estoque_inicial,
    preco_inicial: form.value.preco_inicial,
    estoque_minimo: form.value.estoque_minimo,
    margem_seguranca: form.value.margem_seguranca,
    tempo_reposicao: form.value.tempo_reposicao,
    ativo: form.value.ativo
  }

  try {
    saving.value = true
    if (editingProduto.value) {
      await updateProduto(editingProduto.value.id, dadosProduto)
      toast.add({
        title: 'Sucesso',
        description: 'Produto atualizado com sucesso',
        color: 'green'
      })
    } else {
      await createProduto(dadosProduto)
      toast.add({
        title: 'Sucesso',
        description: 'Produto criado com sucesso',
        color: 'green'
      })
      // Volta para página 1 ao criar novo produto
      page.value = 1
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

// ==========================================
// Funções de Unidades
// ==========================================

const openUnidadesModal = () => {
  editingUnidade.value = null
  unidadeForm.value = { sigla: '', descricao: '' }
  unidadesModalOpen.value = true
}

const editUnidade = (unidade: Unidade) => {
  editingUnidade.value = unidade
  unidadeForm.value = {
    sigla: unidade.sigla,
    descricao: unidade.descricao || ''
  }
}

const cancelEditUnidade = () => {
  editingUnidade.value = null
  unidadeForm.value = { sigla: '', descricao: '' }
}

const saveUnidade = async () => {
  if (!unidadeForm.value.sigla) {
    toast.add({
      title: 'Erro',
      description: 'A sigla é obrigatória',
      color: 'red'
    })
    return
  }

  // Formata a sigla (maiúscula) e descrição
  unidadeForm.value.sigla = unidadeForm.value.sigla.toUpperCase()
  if (unidadeForm.value.descricao) {
    unidadeForm.value.descricao = formatarNome(unidadeForm.value.descricao)
  }

  try {
    savingUnidade.value = true
    if (editingUnidade.value) {
      await updateUnidade(editingUnidade.value.id, unidadeForm.value)
      toast.add({
        title: 'Sucesso',
        description: 'Unidade atualizada com sucesso',
        color: 'green'
      })
    } else {
      await createUnidade(unidadeForm.value)
      toast.add({
        title: 'Sucesso',
        description: 'Unidade criada com sucesso',
        color: 'green'
      })
    }
    editingUnidade.value = null
    unidadeForm.value = { sigla: '', descricao: '' }
    unidades.value = await getUnidades()
  } catch (error: any) {
    let mensagem = 'Erro ao salvar unidade'
    if (error.message?.includes('unidades_sigla_key') || error.code === '23505') {
      mensagem = 'Já existe uma unidade com essa sigla'
    }
    toast.add({
      title: 'Erro',
      description: mensagem,
      color: 'red'
    })
  } finally {
    savingUnidade.value = false
  }
}

const confirmDeleteUnidade = (unidade: Unidade) => {
  deletingUnidade.value = unidade
  deleteUnidadeModalOpen.value = true
}

const deleteUnidade = async () => {
  if (!deletingUnidade.value) return

  try {
    deletingUnidadeLoading.value = true
    await removeUnidade(deletingUnidade.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Unidade excluída com sucesso',
      color: 'green'
    })
    deleteUnidadeModalOpen.value = false
    unidades.value = await getUnidades()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir unidade',
      color: 'red'
    })
  } finally {
    deletingUnidadeLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
