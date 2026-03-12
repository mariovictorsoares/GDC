<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
      <h1 class="text-2xl font-semibold text-[#5a5a66] mb-2">Saídas</h1>
      <UButton color="primary" class="w-full sm:w-auto" @click="openModal()">
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
        Nova Saída
      </UButton>
    </div>

    <!-- Filtros -->
    <div class="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
      <div class="flex flex-col sm:flex-row flex-wrap gap-3 flex-1 min-w-0">
        <UInput v-model="filtroDataInicio" type="date" class="w-full sm:w-40" :ui="toolbarInputUi" />
        <UInput v-model="filtroDataFim" type="date" class="w-full sm:w-40" :ui="toolbarInputUi" />
        <!-- Filtro Tipo -->
        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton
            color="white"
            class="w-full sm:w-auto justify-between"
            trailing-icon="i-heroicons-chevron-down-20-solid"
            :ui="toolbarButtonUi"
          >
            <span class="truncate text-left font-normal"><span class="text-operacao-400">Tipo:</span> <span class="text-gray-900">{{ tipoFilterLabel }}</span></span>
          </UButton>
          <template #panel="{ close }">
            <div class="w-48 py-1">
              <button
                v-for="opt in tipoFilterOptions"
                :key="opt.value"
                class="w-full text-left px-3 py-1.5 text-sm rounded transition-colors"
                :class="filtroTipo === opt.value ? 'text-guardian-600 font-medium bg-guardian-50' : 'text-operacao-600 hover:bg-operacao-50'"
                @click="filtroTipo = opt.value; close()"
              >
                {{ opt.label }}
              </button>
            </div>
          </template>
        </UPopover>
        <UInput v-model="search" placeholder="Buscar produto..." icon="i-heroicons-magnifying-glass" class="w-full sm:w-44" :ui="toolbarInputUi" />
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <UButton color="white" :ui="toolbarButtonUi" @click="clearFilters">
          Limpar Filtros
        </UButton>
      </div>
    </div>

    <!-- Resumo -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard :ui="{ ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm', body: { padding: 'px-5 py-4' } }">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span class="text-xs font-medium text-operacao-400">Total de Saídas</span>
        </div>
        <p class="text-xl font-bold text-operacao-800">{{ filteredSaidas.length }}</p>
      </UCard>
      <UCard :ui="{ ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm', body: { padding: 'px-5 py-4' } }">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-guardian-400" />
          <span class="text-xs font-medium text-operacao-400">Total Quantidade</span>
        </div>
        <p class="text-xl font-bold text-operacao-800">{{ formatNumber(totalQuantidade) }}</p>
      </UCard>
      <UCard :ui="{ ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm', body: { padding: 'px-5 py-4' } }">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span class="text-xs font-medium text-operacao-400">Custo Total</span>
        </div>
        <p class="text-xl font-bold text-operacao-800">{{ formatCurrency(totalCusto) }}</p>
      </UCard>
    </div>

    <!-- Tabela -->
    <UCard :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
      <UTable
        :columns="columns"
        :rows="paginatedItems"
        :loading="loading"
        :ui="{
          divide: 'divide-y divide-operacao-50 dark:divide-operacao-700',
          thead: '',
          th: { base: 'bg-operacao-100/70 dark:bg-operacao-800 border-b border-operacao-200/60 [&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66] [&_button>span+span]:text-operacao-300 [&_button>span+span]:!w-3.5 [&_button>span+span]:!h-3.5', color: 'text-[#5a5a66] dark:text-operacao-400', font: 'font-medium', size: 'text-xs uppercase tracking-wider', padding: 'px-4 py-2' },
          td: { color: 'text-operacao-600 dark:text-operacao-200', size: 'text-sm', padding: 'px-4 py-2.5' }
        }"
      >
        <!-- Empty State -->
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-operacao-400">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhum registro encontrado</p>
          </div>
        </template>

        <template #data-data="{ row }">
          {{ formatDate(row.data) }}
        </template>

        <template #produto-data="{ row }">
          <div>
            <p class="font-semibold text-operacao-800 dark:text-white">{{ row.produto?.nome || '-' }}</p>
            <p class="text-xs text-operacao-400">{{ row.produto?.categoria?.nome || '' }}</p>
          </div>
        </template>

        <template #tipo-data="{ row }">
          <UBadge :color="row.tipo === 'transferencia' ? 'blue' : 'red'" variant="soft">
            {{ row.tipo === 'transferencia' ? 'Transferência' : 'Definitiva' }}
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
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg flex items-center justify-center" :class="tipoSaida === 'transferencia' ? 'bg-guardian-100' : 'bg-red-100'">
                <UIcon
                  :name="tipoSaida === 'transferencia' ? 'i-heroicons-arrows-right-left' : 'i-heroicons-arrow-up-tray'"
                  class="w-5 h-5"
                  :class="tipoSaida === 'transferencia' ? 'text-guardian-600' : 'text-red-600'"
                />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-operacao-800">
                  {{ editingSaida ? 'Editar Saída' : 'Nova Saída' }}
                </h3>
                <p class="text-xs text-operacao-400" v-if="!editingSaida">
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
          <div class="space-y-4">
            <!-- Tipo de Saída -->
            <UFormGroup label="Tipo de Saída" required>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  @click="tipoSaida = 'transferencia'"
                  class="px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2"
                  :class="tipoSaida === 'transferencia'
                    ? 'border-guardian-500 bg-guardian-50 text-guardian-700'
                    : 'border-operacao-200 bg-white text-operacao-400 hover:border-operacao-300'"
                >
                  <UIcon name="i-heroicons-arrows-right-left" class="w-4 h-4 flex-shrink-0" />
                  <span class="truncate">Transferência</span>
                </button>
                <button
                  type="button"
                  @click="tipoSaida = 'definitiva'"
                  class="px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2"
                  :class="tipoSaida === 'definitiva'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-operacao-200 bg-white text-operacao-400 hover:border-operacao-300'"
                >
                  <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4 flex-shrink-0" />
                  <span class="truncate">Definitiva</span>
                </button>
              </div>
              <p class="text-xs text-operacao-400 mt-1">
                {{ tipoSaida === 'transferencia'
                  ? 'Move do Estoque Principal para o Estoque de Apoio'
                  : 'Saída definitiva do sistema (consumo/venda)' }}
              </p>
            </UFormGroup>

            <UFormGroup label="Data" required>
              <UInput v-model="formData" type="date" class="max-w-xs" />
            </UFormGroup>
          </div>

          <!-- Divider -->
          <div class="border-t border-operacao-200 dark:border-operacao-700" />

          <!-- Lista de itens -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-operacao-600">
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
                class="relative group rounded-xl border border-operacao-200 dark:border-operacao-700 bg-operacao-50/50 dark:bg-operacao-900/30 p-4 transition-all"
                :class="tipoSaida === 'transferencia' ? 'hover:border-guardian-300 hover:shadow-sm' : 'hover:border-red-300 hover:shadow-sm'"
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
                    :options="produtosSelectAtual"
                    placeholder="Buscar produto..."
                    searchable
                    searchable-placeholder="Digite para buscar..."
                    value-attribute="value"
                    option-attribute="label"
                    size="md"
                    :ui="{ trigger: { base: 'w-full' } }"
                  >
                    <template #leading>
                      <UIcon name="i-heroicons-cube" class="w-4 h-4 text-operacao-400" />
                    </template>
                    <template #label>
                      <span v-if="item.produto_id" class="truncate">
                        {{ getProdutoNome(item.produto_id) }}
                      </span>
                      <span v-else class="text-operacao-400">Buscar produto...</span>
                    </template>
                  </USelectMenu>
                </div>

                <!-- Linha 2: Quantidade + UN -->
                <div class="grid grid-cols-2 gap-3">
                  <!-- Quantidade com UN -->
                  <div>
                    <label class="block text-xs font-medium text-operacao-400 mb-1">Quantidade</label>
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
                        class="inline-flex items-center px-3 border border-l-0 border-operacao-300 dark:border-operacao-600 bg-operacao-100 dark:bg-operacao-700 rounded-r-md text-sm font-medium text-operacao-500 dark:text-operacao-300 whitespace-nowrap"
                      >
                        {{ getProdutoUnidade(item.produto_id) }}
                      </div>
                    </div>
                  </div>

                  <!-- Estoque disponível -->
                  <div>
                    <label class="block text-xs font-medium text-operacao-400 mb-1">Estoque Principal</label>
                    <div
                      v-if="item.produto_id"
                      class="h-[38px] flex items-center px-3 rounded-md border"
                      :class="isEstoqueInsuficiente(item)
                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        : 'bg-guardian-50 border-guardian-200 dark:bg-guardian-900/20 dark:border-guardian-800'"
                    >
                      <UIcon
                        :name="isEstoqueInsuficiente(item) ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-check-circle'"
                        class="w-4 h-4 mr-2"
                        :class="isEstoqueInsuficiente(item) ? 'text-red-500' : 'text-guardian-500'"
                      />
                      <span
                        class="text-sm font-medium"
                        :class="isEstoqueInsuficiente(item) ? 'text-red-700' : 'text-guardian-700'"
                      >
                        {{ formatNumber(getSaldoItem(item)) }} {{ getProdutoUnidade(item.produto_id) }}
                      </span>
                    </div>
                    <div v-else class="h-[38px] flex items-center px-3 bg-operacao-50 border border-operacao-200 rounded-md">
                      <span class="text-sm text-operacao-400">Selecione um produto</span>
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
                  class="mt-2 text-xs text-operacao-400 hover:text-operacao-500 transition-colors flex items-center gap-1"
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
                ? 'border-operacao-300 text-operacao-400 hover:border-guardian-400 hover:text-guardian-600 hover:bg-guardian-50/50'
                : 'border-operacao-300 text-operacao-400 hover:border-red-400 hover:text-red-600 hover:bg-red-50/50'"
            >
              <UIcon name="i-heroicons-plus-circle" class="w-5 h-5" />
              Adicionar outro produto
            </button>
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

    <!-- Modal de Confirmação de Saída Definitiva -->
    <UModal
      v-model="confirmDefinitivaOpen"
      prevent-close
      :ui="{
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-red-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-red-600">Confirmar Saída Definitiva</h3>
          </div>
        </template>

        <div class="space-y-3">
          <p class="text-operacao-600">Você está registrando uma <strong>saída definitiva</strong>. Os produtos abaixo serão removidos permanentemente do estoque:</p>
          <div class="space-y-2">
            <div
              v-for="(item, index) in itensValidosConfirmacao"
              :key="index"
              class="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between"
            >
              <div>
                <p class="font-medium text-operacao-800">{{ getProdutoNome(item.produto_id) }}</p>
                <p class="text-xs text-operacao-400">{{ formatDate(formData) }}</p>
              </div>
              <span class="font-semibold text-red-700">
                {{ formatNumber(item.quantidade) }} {{ getProdutoUnidade(item.produto_id) }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p class="text-sm text-amber-800 font-medium">Esta ação não pode ser desfeita.</p>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="cancelarConfirmacao">
              Voltar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="saving" @click="executeSaveSaida">
              <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4 mr-1.5" />
              Confirmar Saída Definitiva
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal de Confirmação de Exclusão -->
    <UModal
      v-model="deleteModalOpen"
      :ui="{
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
        </template>

        <p>Tem certeza que deseja excluir esta saída?</p>
        <div class="mt-2 p-3 bg-operacao-50 rounded-lg">
          <p><strong>Produto:</strong> {{ deletingSaida?.produto?.nome }}</p>
          <p><strong>Tipo:</strong> {{ deletingSaida?.tipo === 'transferencia' ? 'Transferência' : 'Definitiva' }}</p>
          <p><strong>Data:</strong> {{ formatDate(deletingSaida?.data) }}</p>
          <p><strong>Quantidade:</strong> {{ formatNumber(deletingSaida?.quantidade) }}</p>
        </div>
        <p class="text-sm text-operacao-400 mt-2">Esta ação não pode ser desfeita.</p>

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

const toolbarInputUi = { color: { white: { outline: 'shadow-sm bg-white text-gray-900 ring-1 ring-inset ring-[#EBEBED] focus:ring-1 focus:ring-operacao-200 dark:ring-operacao-700' } } }
const toolbarButtonUi = { color: { white: { solid: 'shadow-sm ring-1 ring-inset ring-[#EBEBED] text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-guardian-500 dark:ring-operacao-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800/50' } } }

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
const confirmDefinitivaOpen = ref(false)
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
  { label: 'Definitiva', value: 'definitiva' }
]

const tipoFilterLabel = computed(() => {
  const opt = tipoFilterOptions.find(o => o.value === filtroTipo.value)
  return opt?.label || 'Todos'
})

// Opções de produtos para o select
const produtosSelect = computed(() =>
  produtos.value.map(p => ({
    label: `${p.nome} ${p.unidade?.sigla ? `(${p.unidade.sigla})` : ''}`,
    value: p.id
  }))
)

// Opções do select baseadas no tipo de saída
const produtosSelectAtual = computed(() => produtosSelect.value)

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
    saldosCache.value.set(produtoId, 0)
  }
}

const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

const truncate2 = (v: number) => Math.trunc((v || 0) * 100) / 100

const formatNumber = (value: number | undefined) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(truncate2(value || 0))
}

const { formatCurrency } = useFormatters()

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

// Computed para itens válidos (usado no modal de confirmação)
const itensValidosConfirmacao = computed(() =>
  itens.value.filter(item => item.produto_id)
)

const validarItens = (): boolean => {
  const itensValidos = itensValidosConfirmacao.value

  if (itensValidos.length === 0) {
    toast.add({
      title: 'Atenção',
      description: 'Selecione pelo menos um produto',
      color: 'amber'
    })
    return false
  }

  for (const item of itensValidos) {
    if (!item.quantidade || item.quantidade <= 0) {
      const nome = getProdutoNome(item.produto_id)
      toast.add({
        title: 'Atenção',
        description: `Informe a quantidade para "${nome}"`,
        color: 'amber'
      })
      return false
    }
    if (isEstoqueInsuficiente(item)) {
      const nome = getProdutoNome(item.produto_id)
      const saldo = getSaldoItem(item)
      toast.add({
        title: 'Estoque Insuficiente',
        description: `"${nome}" - Estoque disponível: ${formatNumber(saldo)}. Solicitado: ${formatNumber(item.quantidade)}.`,
        color: 'red'
      })
      return false
    }
  }

  if (!formData.value) {
    toast.add({
      title: 'Atenção',
      description: 'Informe a data da saída',
      color: 'amber'
    })
    return false
  }

  return true
}

const saveSaida = async () => {
  if (!validarItens()) return

  // Se for saída definitiva, fechar modal principal e mostrar confirmação
  if (tipoSaida.value === 'definitiva') {
    modalOpen.value = false
    confirmDefinitivaOpen.value = true
    return
  }

  await executeSaveSaida()
}

const cancelarConfirmacao = () => {
  confirmDefinitivaOpen.value = false
  modalOpen.value = true
}

const executeSaveSaida = async () => {
  const itensValidos = itensValidosConfirmacao.value

  try {
    saving.value = true

    if (editingSaida.value) {
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

    confirmDefinitivaOpen.value = false
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

// Realtime
const { onTableChange } = useRealtime()
onTableChange('saidas', () => loadSaidas())
onTableChange('produtos', () => loadProdutos())

watch(empresaId, () => {
  if (empresaId.value) {
    loadSaidas()
    loadProdutos()
  }
}, { immediate: true })
</script>
