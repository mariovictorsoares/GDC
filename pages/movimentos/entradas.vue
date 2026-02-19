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

    <!-- Banner de Produções Pendentes -->
    <div
      v-if="pendentesCount > 0"
      class="p-4 bg-purple-50 border border-purple-200 rounded-xl cursor-pointer hover:bg-purple-100 transition-colors"
      @click="showPendentes = !showPendentes"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-purple-100 rounded-lg">
            <UIcon name="i-heroicons-beaker" class="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p class="text-sm font-medium text-purple-700">
              {{ pendentesCount }} {{ pendentesCount === 1 ? 'saída de produção pendente' : 'saídas de produção pendentes' }}
            </p>
            <p class="text-xs text-purple-500">Clique para ver e informar os rendimentos</p>
          </div>
        </div>
        <UIcon
          :name="showPendentes ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          class="w-5 h-5 text-purple-500"
        />
      </div>
    </div>

    <!-- Lista de Produções Pendentes -->
    <UCard v-if="showPendentes && pendentes.length > 0" class="border-purple-200">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-beaker" class="w-4 h-4 text-purple-600" />
          <span class="text-sm font-medium text-purple-700">Produções Pendentes</span>
        </div>
      </template>
      <div class="space-y-3">
        <div
          v-for="benef in pendentes"
          :key="benef.id"
          class="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900">{{ benef.saida?.produto?.nome }}</p>
              <p class="text-sm text-gray-500">
                Saída em {{ formatDate(benef.saida?.data) }} —
                {{ formatNumber(benef.saida?.quantidade) }} {{ benef.saida?.produto?.unidade?.sigla }}
              </p>
              <p class="text-xs text-gray-400 mt-0.5">
                Custo total da saída: {{ formatCurrency(benef.saida?.custo_saida) }}
              </p>
            </div>
            <UButton color="purple" size="sm" @click.stop="openResolucao(benef)">
              <UIcon name="i-heroicons-check-circle" class="w-4 h-4 mr-1" />
              Informar Rendimento
            </UButton>
          </div>
        </div>
      </div>
    </UCard>

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

    <!-- Resumo Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="rounded-xl bg-white ring-1 ring-gray-100 shadow-sm p-5">
        <div class="flex items-center gap-4">
          <USkeleton class="h-12 w-12 rounded-lg" />
          <div class="space-y-2">
            <USkeleton class="h-4 w-24" />
            <USkeleton class="h-7 w-20" />
          </div>
        </div>
      </div>
    </div>

    <!-- Resumo -->
    <div v-if="!loading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
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

    <!-- Tabela Skeleton -->
    <UCard v-if="loading" :ui="{ body: { padding: '' } }">
      <div class="p-5 space-y-4">
        <div v-for="i in 8" :key="i" class="flex items-center gap-4">
          <USkeleton class="h-4 w-20" />
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-4 w-28" />
          <USkeleton class="h-4 w-16" />
          <USkeleton class="h-4 w-20" />
          <USkeleton class="h-4 w-20" />
          <USkeleton class="h-4 w-24" />
          <USkeleton class="h-4 w-12" />
          <USkeleton class="h-4 w-16" />
        </div>
      </div>
    </UCard>

    <!-- Tabela -->
    <UCard v-if="!loading" :ui="{ body: { padding: '' } }">
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

    <!-- Modal de Nova Entrada (Multi-item) -->
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
              <div class="p-2 bg-green-100 rounded-lg">
                <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ editingEntrada ? 'Editar Entrada' : 'Nova Entrada' }}
                </h3>
                <p class="text-xs text-gray-500" v-if="!editingEntrada">
                  Adicione um ou mais produtos à entrada
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
            <UFormGroup label="Data" required>
              <UInput v-model="formData" type="date" />
            </UFormGroup>
            <UFormGroup label="Número da NF">
              <UInput v-model="formNf" placeholder="Ex: 001234" />
            </UFormGroup>
          </div>

          <!-- Divider -->
          <div class="border-t border-gray-200 dark:border-gray-700" />

          <!-- Lista de itens -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">
                Itens da entrada
              </span>
              <UBadge color="green" variant="subtle" size="xs" v-if="itens.length > 0">
                {{ itens.length }} {{ itens.length === 1 ? 'item' : 'itens' }}
              </UBadge>
            </div>

            <!-- Item rows -->
            <div class="space-y-3">
              <div
                v-for="(item, index) in itens"
                :key="index"
                class="relative group rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 p-4 transition-all hover:border-green-300 hover:shadow-sm"
              >
                <!-- Botão remover (só se multi-item e não editando) -->
                <button
                  v-if="itens.length > 1 && !editingEntrada"
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
                    @change="onProdutoChange(index)"
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

                <!-- Linha 2: Quantidade + UN | Valor Total | Custo Unitário -->
                <div class="grid grid-cols-3 gap-3">
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

                  <!-- Valor Total -->
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">Valor Total (R$)</label>
                    <UInput
                      v-model.number="item.valor_total"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      size="md"
                    />
                  </div>

                  <!-- Custo Unitário (calculado) -->
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">Custo Unit.</label>
                    <div class="h-[38px] flex items-center px-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <span class="text-sm font-semibold text-green-700 dark:text-green-400">
                        {{ formatCurrency(calcCustoUnitario(item)) }}
                      </span>
                    </div>
                  </div>
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
              v-if="!editingEntrada"
              @click="addItem"
              class="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 hover:border-green-400 hover:text-green-600 hover:bg-green-50/50 transition-all flex items-center justify-center gap-2"
            >
              <UIcon name="i-heroicons-plus-circle" class="w-5 h-5" />
              Adicionar outro produto
            </button>
          </div>

          <!-- Resumo do total (quando multi-item) -->
          <div
            v-if="itens.length > 1"
            class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
          >
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Total da entrada</span>
            <span class="text-lg font-bold text-green-700 dark:text-green-400">
              {{ formatCurrency(totalItens) }}
            </span>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalOpen = false">
              Cancelar
            </UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="saving" @click="saveEntrada">
              <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
              {{ editingEntrada ? 'Salvar Alterações' : `Registrar ${itens.length > 1 ? itens.length + ' Entradas' : 'Entrada'}` }}
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

    <!-- Modal de Resolução de Produção -->
    <UModal
      v-model="resolucaoModalOpen"
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
            <div class="flex items-center gap-3">
              <div class="p-2 bg-purple-100 rounded-lg">
                <UIcon name="i-heroicons-beaker" class="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Informar Rendimento</h3>
                <p class="text-sm text-gray-500">
                  {{ resolvingBeneficiamento?.saida?.produto?.nome }} —
                  {{ formatNumber(resolvingBeneficiamento?.saida?.quantidade) }}
                  {{ resolvingBeneficiamento?.saida?.produto?.unidade?.sigla }}
                </p>
              </div>
            </div>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="resolucaoModalOpen = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Info de custo -->
          <div class="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div class="flex items-center justify-between text-sm">
              <span class="text-purple-700">Custo total da saída:</span>
              <span class="font-semibold text-purple-900">{{ formatCurrency(resolvingBeneficiamento?.saida?.custo_saida) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm mt-1">
              <span class="text-purple-700">Custo unitário resultante:</span>
              <span class="font-semibold text-purple-900">{{ formatCurrency(custoUnitarioResolucao) }}</span>
            </div>
            <p class="text-xs text-purple-500 mt-1">O custo é distribuído proporcionalmente pela quantidade total</p>
          </div>

          <!-- Lista de produtos finais -->
          <div class="space-y-3">
            <span class="text-sm font-medium text-gray-700">Produtos finais obtidos:</span>
            <div
              v-for="(item, index) in itensResolucao"
              :key="index"
              class="p-4 border border-gray-200 rounded-lg bg-gray-50/50"
            >
              <div class="flex items-center gap-4">
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ item.produto_nome }}</p>
                  <p class="text-xs text-gray-500">Unidade: {{ item.unidade_sigla }}</p>
                </div>
                <div class="w-48">
                  <label class="block text-xs font-medium text-gray-500 mb-1">Quantidade obtida</label>
                  <UInput
                    v-model.number="item.quantidade"
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder="0"
                    size="md"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-if="itensResolucao.length === 0" class="text-center py-4 text-gray-500">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 mx-auto mb-2" />
            <p class="text-sm">Nenhum produto final vinculado a este produto.</p>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="resolucaoModalOpen = false">
              Cancelar
            </UButton>
            <UButton
              color="purple"
              class="w-full sm:w-auto"
              :loading="resolvendo"
              :disabled="itensResolucao.length === 0"
              @click="confirmarResolucao"
            >
              <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
              Confirmar Rendimento
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Entrada, Produto, Beneficiamento } from '~/types'

interface ItemEntrada {
  produto_id: string
  quantidade: number
  valor_total: number
  observacao: string
  showObs: boolean
}

const {
  getEntradas,
  createEntrada,
  updateEntrada,
  deleteEntrada: removeEntrada,
  getProdutos,
  getBeneficiamentosPendentes,
  countBeneficiamentosPendentes,
  resolverBeneficiamento,
  getProdutosBeneficiamento
} = useEstoque()
const { empresaId } = useEmpresa()
const toast = useToast()

const entradas = ref<Entrada[]>([])
const produtos = ref<Produto[]>([])
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

// Beneficiamento
const showPendentes = ref(false)
const pendentes = ref<Beneficiamento[]>([])
const pendentesCount = ref(0)
const resolucaoModalOpen = ref(false)
const resolvingBeneficiamento = ref<Beneficiamento | null>(null)
const itensResolucao = ref<Array<{
  produto_final_id: string
  produto_nome: string
  unidade_sigla: string
  quantidade: number
}>>([])
const resolvendo = ref(false)

// Campos compartilhados do modal
const formData = ref(new Date().toISOString().split('T')[0])
const formNf = ref('')

// Lista de itens da entrada
const itens = ref<ItemEntrada[]>([])

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

// Opções de produtos para o select
const produtosSelect = computed(() =>
  produtos.value.map(p => ({
    label: `${p.nome} ${p.unidade?.sigla ? `(${p.unidade.sigla})` : ''}`,
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

// Total dos itens no modal
const totalItens = computed(() =>
  itens.value.reduce((sum, item) => sum + (Number(item.valor_total) || 0), 0)
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

const onProdutoChange = (_index: number) => {
  // Hook para futuras ações ao mudar produto
}

const calcCustoUnitario = (item: ItemEntrada) => {
  if (!item.quantidade || item.quantidade === 0) return 0
  return (item.valor_total || 0) / item.quantidade
}

const createEmptyItem = (): ItemEntrada => ({
  produto_id: '',
  quantidade: 0,
  valor_total: 0,
  observacao: '',
  showObs: false
})

const addItem = () => {
  itens.value.push(createEmptyItem())
}

const removeItem = (index: number) => {
  itens.value.splice(index, 1)
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

const openModal = (entrada?: Entrada) => {
  if (entrada) {
    editingEntrada.value = entrada
    formData.value = entrada.data
    formNf.value = entrada.numero_nf || ''
    itens.value = [{
      produto_id: entrada.produto_id,
      quantidade: entrada.quantidade,
      valor_total: entrada.valor_total,
      observacao: entrada.observacao || '',
      showObs: !!entrada.observacao
    }]
  } else {
    editingEntrada.value = null
    formData.value = new Date().toISOString().split('T')[0]
    formNf.value = ''
    itens.value = [createEmptyItem()]
  }
  modalOpen.value = true
}

const saveEntrada = async () => {
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
    if (!item.valor_total || item.valor_total <= 0) {
      const nome = getProdutoNome(item.produto_id)
      toast.add({
        title: 'Atenção',
        description: `Informe o valor total para "${nome}"`,
        color: 'amber'
      })
      return
    }
  }

  if (!formData.value) {
    toast.add({
      title: 'Atenção',
      description: 'Informe a data da entrada',
      color: 'amber'
    })
    return
  }

  try {
    saving.value = true

    if (editingEntrada.value) {
      // Edição: salva apenas o primeiro item
      const item = itensValidos[0]
      await updateEntrada(editingEntrada.value.id, {
        produto_id: item.produto_id,
        data: formData.value,
        quantidade: item.quantidade,
        custo_unitario: calcCustoUnitario(item),
        valor_total: item.valor_total,
        numero_nf: formNf.value || undefined,
        observacao: item.observacao || undefined
      })
      toast.add({
        title: 'Sucesso',
        description: 'Entrada atualizada com sucesso',
        color: 'green'
      })
    } else {
      // Criação: salva todos os itens
      for (const item of itensValidos) {
        await createEntrada({
          produto_id: item.produto_id,
          data: formData.value,
          quantidade: item.quantidade,
          custo_unitario: calcCustoUnitario(item),
          valor_total: item.valor_total,
          numero_nf: formNf.value || undefined,
          observacao: item.observacao || undefined
        })
      }
      toast.add({
        title: 'Sucesso',
        description: itensValidos.length > 1
          ? `${itensValidos.length} entradas registradas com sucesso`
          : 'Entrada registrada com sucesso',
        color: 'green'
      })
    }

    modalOpen.value = false
    await loadEntradas()
    page.value = 1
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

// ==========================================
// Beneficiamento - Resolução
// ==========================================

const custoUnitarioResolucao = computed(() => {
  const totalQtd = itensResolucao.value.reduce((sum, i) => sum + (i.quantidade || 0), 0)
  if (totalQtd <= 0 || !resolvingBeneficiamento.value?.saida?.custo_saida) return 0
  return Number(resolvingBeneficiamento.value.saida.custo_saida) / totalQtd
})

const loadPendentes = async () => {
  try {
    pendentesCount.value = await countBeneficiamentosPendentes()
    if (pendentesCount.value > 0) {
      pendentes.value = await getBeneficiamentosPendentes()
    } else {
      pendentes.value = []
    }
  } catch (error) {
    console.error('Erro ao carregar beneficiamentos pendentes:', error)
  }
}

const openResolucao = async (benef: Beneficiamento) => {
  resolvingBeneficiamento.value = benef

  // Buscar produtos finais vinculados ao produto de origem
  try {
    const produtoOrigemId = benef.saida?.produto_id
    if (!produtoOrigemId) return

    const vinculos = await getProdutosBeneficiamento(produtoOrigemId)
    itensResolucao.value = vinculos.map((v: any) => ({
      produto_final_id: v.produto_final?.id || v.produto_final_id,
      produto_nome: v.produto_final?.nome || 'Produto',
      unidade_sigla: v.produto_final?.unidade?.sigla || '',
      quantidade: 0
    }))
  } catch (error) {
    console.error('Erro ao carregar produtos finais:', error)
    itensResolucao.value = []
  }

  resolucaoModalOpen.value = true
}

const confirmarResolucao = async () => {
  if (!resolvingBeneficiamento.value) return

  const itensValidos = itensResolucao.value.filter(i => i.quantidade > 0)
  if (itensValidos.length === 0) {
    toast.add({
      title: 'Atenção',
      description: 'Informe a quantidade de pelo menos um produto final',
      color: 'amber'
    })
    return
  }

  try {
    resolvendo.value = true
    await resolverBeneficiamento(
      resolvingBeneficiamento.value.id,
      resolvingBeneficiamento.value.saida!,
      itensValidos.map(i => ({
        produto_final_id: i.produto_final_id,
        quantidade: i.quantidade
      }))
    )
    toast.add({
      title: 'Sucesso',
      description: 'Produção resolvida! Entradas dos produtos finais criadas com sucesso.',
      color: 'green'
    })
    resolucaoModalOpen.value = false
    await loadPendentes()
    await loadEntradas()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao resolver produção',
      color: 'red'
    })
  } finally {
    resolvendo.value = false
  }
}

watch([filtroDataInicio, filtroDataFim], () => {
  loadEntradas()
})

watch(empresaId, () => {
  if (empresaId.value) {
    loadEntradas()
    loadProdutos()
    loadPendentes()
  }
}, { immediate: true })
</script>
