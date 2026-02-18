<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Saídas</h1>
        <p class="text-sm text-gray-500">Registre transferências e saídas definitivas</p>
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
        <UFormGroup label="Tipo">
          <USelect
            v-model="filtroTipo"
            :options="tipoFilterOptions"
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

        <template #tipo-data="{ row }">
          <UBadge :color="row.tipo === 'transferencia' ? 'blue' : 'red'" variant="soft">
            {{ row.tipo === 'transferencia' ? 'Transferência' : 'Saída Definitiva' }}
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

    <!-- Modal de Nova Saída (Multi-item) -->
    <UModal
      v-model="modalOpen"
      :ui="{
        width: 'sm:max-w-3xl',
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg" :class="tipoSaida === 'transferencia' ? 'bg-blue-100' : 'bg-red-100'">
                <UIcon
                  :name="tipoSaida === 'transferencia' ? 'i-heroicons-arrows-right-left' : 'i-heroicons-arrow-up-tray'"
                  class="w-5 h-5"
                  :class="tipoSaida === 'transferencia' ? 'text-blue-600' : 'text-red-600'"
                />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ editingSaida ? 'Editar Saída' : 'Nova Saída' }}
                </h3>
                <p class="text-xs text-gray-500" v-if="!editingSaida">
                  Adicione um ou mais produtos à saída
                </p>
              </div>
            </div>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="modalOpen = false"
            />
          </div>
        </template>

        <div class="space-y-5">
          <!-- Campos compartilhados -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Tipo de Saída -->
            <UFormGroup label="Tipo de Saída" required>
              <div class="flex gap-2">
                <button
                  type="button"
                  @click="tipoSaida = 'transferencia'"
                  class="flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2"
                  :class="tipoSaida === 'transferencia'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'"
                >
                  <UIcon name="i-heroicons-arrows-right-left" class="w-4 h-4" />
                  Transferência
                </button>
                <button
                  type="button"
                  @click="tipoSaida = 'definitiva'"
                  class="flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2"
                  :class="tipoSaida === 'definitiva'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'"
                >
                  <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4" />
                  Definitiva
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                {{ tipoSaida === 'transferencia'
                  ? 'Move do Estoque Principal para o Estoque de Apoio'
                  : 'Saída definitiva do sistema (consumo/venda)' }}
              </p>
            </UFormGroup>

            <UFormGroup label="Data" required>
              <UInput v-model="formData" type="date" />
            </UFormGroup>
          </div>

          <!-- Divider -->
          <div class="border-t border-gray-200 dark:border-gray-700" />

          <!-- Lista de itens -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">
                Itens da saída
              </span>
              <UBadge :color="tipoSaida === 'transferencia' ? 'blue' : 'red'" variant="subtle" size="xs" v-if="itens.length > 0">
                {{ itens.length }} {{ itens.length === 1 ? 'item' : 'itens' }}
              </UBadge>
            </div>

            <!-- Item rows -->
            <div class="space-y-3">
              <div
                v-for="(item, index) in itens"
                :key="index"
                class="relative group rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 p-4 transition-all"
                :class="tipoSaida === 'transferencia' ? 'hover:border-blue-300 hover:shadow-sm' : 'hover:border-red-300 hover:shadow-sm'"
              >
                <!-- Botão remover (só se multi-item e não editando) -->
                <button
                  v-if="itens.length > 1 && !editingSaida"
                  @click="removeItem(index)"
                  class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
                </button>

                <!-- Linha 1: Produto -->
                <div class="mb-3">
                  <USelectMenu
                    v-model="item.produto_id"
                    :options="produtosSelect"
                    placeholder="Buscar produto..."
                    searchable
                    searchable-placeholder="Digite para buscar..."
                    value-attribute="value"
                    option-attribute="label"
                    size="md"
                    :ui="{ trigger: { base: 'w-full' } }"
                  >
                    <template #leading>
                      <UIcon name="i-heroicons-cube" class="w-4 h-4 text-gray-400" />
                    </template>
                    <template #label>
                      <span v-if="item.produto_id" class="truncate">
                        {{ getProdutoNome(item.produto_id) }}
                      </span>
                      <span v-else class="text-gray-400">Buscar produto...</span>
                    </template>
                  </USelectMenu>
                </div>

                <!-- Linha 2: Quantidade + UN -->
                <div class="grid grid-cols-2 gap-3">
                  <!-- Quantidade com UN -->
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">Quantidade</label>
                    <div class="flex">
                      <UInput
                        v-model.number="item.quantidade"
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        placeholder="0"
                        size="md"
                        :ui="item.produto_id && getProdutoUnidade(item.produto_id) ? { wrapper: 'w-full', base: 'rounded-r-none' } : { wrapper: 'w-full' }"
                      />
                      <div
                        v-if="item.produto_id && getProdutoUnidade(item.produto_id)"
                        class="inline-flex items-center px-3 border border-l-0 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 rounded-r-md text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap"
                      >
                        {{ getProdutoUnidade(item.produto_id) }}
                      </div>
                    </div>
                  </div>

                  <!-- Estoque disponível -->
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">Estoque Principal</label>
                    <div
                      v-if="item.produto_id"
                      class="h-[38px] flex items-center px-3 rounded-md border"
                      :class="isEstoqueInsuficiente(item)
                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'"
                    >
                      <UIcon
                        :name="isEstoqueInsuficiente(item) ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-check-circle'"
                        class="w-4 h-4 mr-2"
                        :class="isEstoqueInsuficiente(item) ? 'text-red-500' : 'text-blue-500'"
                      />
                      <span
                        class="text-sm font-medium"
                        :class="isEstoqueInsuficiente(item) ? 'text-red-700' : 'text-blue-700'"
                      >
                        {{ formatNumber(getSaldoItem(item)) }} {{ getProdutoUnidade(item.produto_id) }}
                      </span>
                    </div>
                    <div v-else class="h-[38px] flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md">
                      <span class="text-sm text-gray-400">Selecione um produto</span>
                    </div>
                  </div>
                </div>

                <!-- Alerta estoque insuficiente -->
                <div v-if="item.produto_id && isEstoqueInsuficiente(item)" class="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-3.5 h-3.5" />
                  Quantidade solicitada excede o estoque disponível
                </div>

                <!-- Observação (colapsável) -->
                <div class="mt-3" v-if="item.showObs">
                  <UTextarea
                    v-model="item.observacao"
                    placeholder="Observações deste item..."
                    :rows="2"
                    size="sm"
                  />
                </div>
                <button
                  v-if="!item.showObs"
                  @click="item.showObs = true"
                  class="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                >
                  <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="w-3.5 h-3.5" />
                  Adicionar observação
                </button>
              </div>
            </div>

            <!-- Botão adicionar item (só no modo criação) -->
            <button
              v-if="!editingSaida"
              @click="addItem"
              class="w-full py-3 border-2 border-dashed rounded-xl text-sm hover:bg-opacity-50 transition-all flex items-center justify-center gap-2"
              :class="tipoSaida === 'transferencia'
                ? 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50'
                : 'border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-600 hover:bg-red-50/50'"
            >
              <UIcon name="i-heroicons-plus-circle" class="w-5 h-5" />
              Adicionar outro produto
            </button>
          </div>

          <!-- Info custo automático -->
          <div class="p-3 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500">O custo de saída será calculado automaticamente com base no custo médio do produto.</p>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalOpen = false">
              Cancelar
            </UButton>
            <UButton
              :color="tipoSaida === 'transferencia' ? 'blue' : 'primary'"
              class="w-full sm:w-auto"
              :loading="saving"
              @click="saveSaida"
            >
              <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
              {{ editingSaida ? 'Salvar Alterações' : `Registrar ${itens.length > 1 ? itens.length + ' Saídas' : 'Saída'}` }}
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
          <p><strong>Tipo:</strong> {{ deletingSaida?.tipo === 'transferencia' ? 'Transferência' : 'Saída Definitiva' }}</p>
          <p><strong>Data:</strong> {{ formatDate(deletingSaida?.data) }}</p>
          <p><strong>Quantidade:</strong> {{ formatNumber(deletingSaida?.quantidade) }}</p>
        </div>
        <p class="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deleting" @click="deleteSaidaConfirm">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Saida, Produto, TipoSaida } from '~/types'

interface ItemSaida {
  produto_id: string
  quantidade: number
  observacao: string
  showObs: boolean
}

const {
  getSaidas,
  createSaida,
  updateSaida,
  deleteSaida: removeSaida,
  getProdutos,
  getSaldoProduto
} = useEstoque()
const { empresaId } = useEmpresa()
const toast = useToast()

const saidas = ref<Saida[]>([])
const produtos = ref<Produto[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const filtroDataInicio = ref('')
const filtroDataFim = ref('')
const filtroTipo = ref('')
const modalOpen = ref(false)
const deleteModalOpen = ref(false)
const editingSaida = ref<Saida | null>(null)
const deletingSaida = ref<Saida | null>(null)

// Campos compartilhados do modal
const formData = ref(new Date().toISOString().split('T')[0])
const tipoSaida = ref<TipoSaida>('definitiva')

// Lista de itens da saída
const itens = ref<ItemSaida[]>([])

// Cache de saldos por produto
const saldosCache = ref<Map<string, number>>(new Map())

const columns = [
  { key: 'data', label: 'Data', sortable: true },
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'tipo', label: 'Tipo', sortable: true },
  { key: 'semana', label: 'Semana' },
  { key: 'quantidade', label: 'Quantidade' },
  { key: 'custo_saida', label: 'Custo Saída' },
  { key: 'actions', label: 'Ações', class: 'text-right', rowClass: 'text-right' }
]

const tipoFilterOptions = [
  { label: 'Todos', value: '' },
  { label: 'Transferência', value: 'transferencia' },
  { label: 'Saída Definitiva', value: 'definitiva' }
]

// Opções de produtos para o select
const produtosSelect = computed(() =>
  produtos.value.map(p => ({
    label: `${p.nome} ${p.unidade?.sigla ? `(${p.unidade.sigla})` : ''}`,
    value: p.id
  }))
)

const filteredSaidas = computed(() => {
  let result = saidas.value

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(s =>
      s.produto?.nome?.toLowerCase().includes(term) ||
      s.produto?.categoria?.nome?.toLowerCase().includes(term)
    )
  }

  if (filtroTipo.value) {
    result = result.filter(s => s.tipo === filtroTipo.value)
  }

  return result
})

const clearFilters = () => {
  search.value = ''
  filtroDataInicio.value = ''
  filtroDataFim.value = ''
  filtroTipo.value = ''
  loadSaidas()
}

const { page, pageSize, paginatedItems } = usePagination(filteredSaidas)

const totalQuantidade = computed(() =>
  filteredSaidas.value.reduce((sum, s) => sum + Number(s.quantidade), 0)
)

const totalCusto = computed(() =>
  filteredSaidas.value.reduce((sum, s) => sum + Number(s.custo_saida || 0), 0)
)

// Helpers de produto
const getProdutoNome = (produtoId: string) => {
  const p = produtos.value.find(p => p.id === produtoId)
  return p ? p.nome : ''
}

const getProdutoUnidade = (produtoId: string) => {
  const p = produtos.value.find(p => p.id === produtoId)
  return p?.unidade?.sigla || ''
}

const getSaldoItem = (item: ItemSaida): number => {
  if (!item.produto_id) return 0
  const saldo = saldosCache.value.get(item.produto_id)
  return saldo ?? 0
}

const isEstoqueInsuficiente = (item: ItemSaida): boolean => {
  if (!item.produto_id || !item.quantidade) return false
  const saldo = getSaldoItem(item)
  // Se editando, considerar a quantidade original
  const qtdOriginal = editingSaida.value?.produto_id === item.produto_id ? editingSaida.value.quantidade : 0
  return item.quantidade > saldo + qtdOriginal
}

const createEmptyItem = (): ItemSaida => ({
  produto_id: '',
  quantidade: 0,
  observacao: '',
  showObs: false
})

const addItem = () => {
  itens.value.push(createEmptyItem())
}

const removeItem = (index: number) => {
  itens.value.splice(index, 1)
}

// Carregar saldo de um produto e guardar no cache
const carregarSaldoProduto = async (produtoId: string) => {
  if (!produtoId || saldosCache.value.has(produtoId)) return
  try {
    const saldo = await getSaldoProduto(produtoId)
    saldosCache.value.set(produtoId, saldo)
  } catch (error) {
    console.error('Erro ao carregar saldo:', error)
    saldosCache.value.set(produtoId, 0)
  }
}

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
      dataFim: filtroDataFim.value || undefined,
      tipo: (filtroTipo.value as TipoSaida) || undefined
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

const loadProdutos = async () => {
  try {
    produtos.value = await getProdutos()
  } catch (error) {
    console.error('Erro ao carregar produtos:', error)
  }
}

const openModal = async (saida?: Saida) => {
  saldosCache.value = new Map()

  if (saida) {
    editingSaida.value = saida
    tipoSaida.value = saida.tipo || 'definitiva'
    formData.value = saida.data
    itens.value = [{
      produto_id: saida.produto_id,
      quantidade: saida.quantidade,
      observacao: saida.observacao || '',
      showObs: !!saida.observacao
    }]
    await carregarSaldoProduto(saida.produto_id)
  } else {
    editingSaida.value = null
    tipoSaida.value = 'definitiva'
    formData.value = new Date().toISOString().split('T')[0]
    itens.value = [createEmptyItem()]
  }
  modalOpen.value = true
}

const saveSaida = async () => {
  // Validar itens
  const itensValidos = itens.value.filter(item => item.produto_id)

  if (itensValidos.length === 0) {
    toast.add({
      title: 'Atenção',
      description: 'Selecione pelo menos um produto',
      color: 'amber'
    })
    return
  }

  for (const item of itensValidos) {
    if (!item.quantidade || item.quantidade <= 0) {
      const nome = getProdutoNome(item.produto_id)
      toast.add({
        title: 'Atenção',
        description: `Informe a quantidade para "${nome}"`,
        color: 'amber'
      })
      return
    }
    // Validar estoque
    if (isEstoqueInsuficiente(item)) {
      const nome = getProdutoNome(item.produto_id)
      const saldo = getSaldoItem(item)
      toast.add({
        title: 'Estoque Insuficiente',
        description: `"${nome}" - Estoque disponível: ${formatNumber(saldo)}. Solicitado: ${formatNumber(item.quantidade)}.`,
        color: 'red'
      })
      return
    }
  }

  if (!formData.value) {
    toast.add({
      title: 'Atenção',
      description: 'Informe a data da saída',
      color: 'amber'
    })
    return
  }

  try {
    saving.value = true

    if (editingSaida.value) {
      // Edição: salva apenas o primeiro item
      const item = itensValidos[0]
      await updateSaida(editingSaida.value.id, {
        produto_id: item.produto_id,
        tipo: tipoSaida.value,
        data: formData.value,
        quantidade: item.quantidade,
        observacao: item.observacao || null
      })
      toast.add({
        title: 'Sucesso',
        description: 'Saída atualizada com sucesso',
        color: 'green'
      })
    } else {
      // Criação: salva todos os itens
      for (const item of itensValidos) {
        await createSaida({
          produto_id: item.produto_id,
          tipo: tipoSaida.value,
          data: formData.value,
          quantidade: item.quantidade,
          observacao: item.observacao || null
        })
      }
      toast.add({
        title: 'Sucesso',
        description: itensValidos.length > 1
          ? `${itensValidos.length} saídas registradas com sucesso`
          : 'Saída registrada com sucesso',
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

const deleteSaidaConfirm = async () => {
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

// Watchers
watch([filtroDataInicio, filtroDataFim], () => {
  loadSaidas()
})

// Carregar saldo quando produto mudar em qualquer item
watch(
  () => itens.value.map(i => i.produto_id),
  (novosProdutos) => {
    novosProdutos.forEach(produtoId => {
      if (produtoId) {
        carregarSaldoProduto(produtoId)
      }
    })
  },
  { deep: true }
)

watch(empresaId, () => {
  if (empresaId.value) {
    loadSaidas()
    loadProdutos()
  }
}, { immediate: true })
</script>
