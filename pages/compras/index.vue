<template>
  <div class="space-y-6">

    <!-- ======================== HEADER ======================== -->
    <h1 class="text-2xl font-semibold text-[#5a5a66] pb-4">Compras</h1>

    <!-- ======================== TOOLBAR ======================== -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
      <!-- Filtros (esquerda) -->
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <UInput
          v-model="search"
          placeholder="Buscar..."
          icon="i-heroicons-magnifying-glass"
          class="w-full sm:w-44"
          :ui="toolbarInputUi"
        />
        <!-- Date Range Picker -->
        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton color="white" class="w-full sm:w-auto justify-between" :ui="toolbarButtonUi">
            <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-operacao-400 mr-2" />
            <span class="text-sm font-normal" :class="dateRange.start ? 'text-gray-900' : 'text-operacao-400'">
              {{ dateRangeLabel }}
            </span>
          </UButton>
          <template #panel="{ close }">
            <div class="p-2">
              <ClientOnly>
                <VDatePicker
                  v-model.range="dateRange"
                  :columns="1"
                  locale="pt-BR"
                  :first-day-of-week="1"
                  color="blue"
                  @dayclick="onDayClick(close)"
                />
              </ClientOnly>
            </div>
          </template>
        </UPopover>
        <!-- Limpar filtros -->
        <UButton
          v-if="hasActiveFilters"
          icon="i-heroicons-x-mark"
          color="gray"
          variant="ghost"
          size="xs"
          class="text-operacao-400 hover:text-operacao-600"
          @click="clearFilters"
        />
      </div>
      <!-- Ações (direita) -->
      <div class="flex gap-2 flex-shrink-0">
        <button class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg bg-white text-[#5a5a66] border border-gray-300 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-all duration-150" @click="analisesSlideover = true">
          <UIcon name="i-heroicons-chart-bar-square" class="w-4 h-4" />
          Análises
        </button>
        <button class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg bg-blue-500 text-white shadow-sm hover:bg-blue-600 hover:shadow-md active:bg-blue-700 transition-all duration-150" @click="openNovaLista()">
          <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          Nova Lista
        </button>
      </div>
    </div>

    <!-- ======================== TABLE ======================== -->
    <UCard :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
      <UTable
        :columns="columns"
        :rows="paginatedItems"
        :loading="loading"
        :ui="{
          divide: 'divide-y divide-operacao-50 dark:divide-operacao-700',
          thead: '',
          th: { base: 'bg-operacao-100/70 dark:bg-operacao-800 border-b border-operacao-200/60 [&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66] [&_button>span+span]:text-operacao-300 [&_button>span+span]:!w-3.5 [&_button>span+span]:!h-3.5', color: 'text-[#5a5a66] dark:text-operacao-400', font: 'font-medium', size: 'text-xs uppercase tracking-wider', padding: 'px-4 py-2' },
          td: { color: 'text-operacao-600 dark:text-operacao-200', size: 'text-sm', padding: 'px-4 py-2.5' },
          tr: { base: 'cursor-pointer hover:bg-operacao-50 transition-colors' }
        }"
        @select="handleRowClick"
      >
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-operacao-400">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhuma lista encontrada</p>
          </div>
        </template>

        <template #nome-data="{ row }">
          <span class="font-semibold text-operacao-800">{{ row.nome || `Pedido ${formatDate(row.data)}` }}</span>
        </template>

        <template #data-data="{ row }">
          {{ formatDate(row.data) }}
        </template>

        <template #itens-data="{ row }">
          {{ row.itens?.length || 0 }}
        </template>

        <template #previsao-data="{ row }">
          {{ row.previsao_recebimento ? formatDate(row.previsao_recebimento) : '-' }}
        </template>

      </UTable>
      <TablePagination
        v-if="!loading && pedidos.length > 0"
        v-model="page"
        :page-size="pageSize"
        :total-items="filteredPedidos.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>

    <!-- ======================== DETAIL SLIDEOVER ======================== -->
    <USlideover
      v-model="slideoverOpen"
      :ui="{
        width: 'max-w-lg',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' }
      }"
    >
      <div v-if="selectedPedido" class="flex flex-col h-full">
        <!-- Slideover Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-operacao-100">
          <div class="flex-1 min-w-0">
            <UInput
              v-if="isEditable"
              v-model="editNome"
              placeholder="Nome da lista"
              :ui="{ base: 'text-lg font-semibold' }"
              variant="none"
              class="w-full"
            />
            <h3 v-else class="text-lg font-semibold text-operacao-800 truncate">
              {{ selectedPedido.nome || `Pedido ${formatDate(selectedPedido.data)}` }}
            </h3>
            <div class="flex items-center gap-2 mt-1">
              <UBadge color="gray" variant="soft" size="xs">
                {{ selectedPedido.itens?.length || 0 }} itens
              </UBadge>
            </div>
          </div>
          <UButton
            icon="i-heroicons-x-mark"
            color="gray"
            variant="ghost"
            size="sm"
            @click="slideoverOpen = false"
          />
        </div>

        <!-- Items List -->
        <div class="flex-1 overflow-y-auto px-6 py-4">
          <h4 class="text-sm font-semibold text-operacao-600 mb-3">Itens da lista</h4>
          <div v-if="!selectedPedido.itens?.length" class="text-center py-6 text-operacao-400">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2 mx-auto" />
            <p class="text-sm">Nenhum item na lista</p>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(item, idx) in editItens"
              :key="item.id || idx"
              class="flex items-center gap-3 p-3 rounded-lg border border-operacao-100 hover:bg-operacao-50/50 transition-colors"
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-operacao-800 truncate">
                  {{ item.produto?.nome || 'Produto' }}
                </p>
                <p class="text-xs text-operacao-400">
                  {{ item.produto?.unidade?.sigla || '' }}
                  <span v-if="item.preco_estimado">
                    &middot; {{ formatCurrency(item.preco_estimado) }}/un
                  </span>
                </p>
              </div>

              <div v-if="isEditable" class="flex items-center gap-2">
                <UInput
                  v-model.number="item.quantidade"
                  type="number"
                  size="xs"
                  class="w-20"
                  :ui="{ base: 'text-center' }"
                  :min="0"
                  step="0.01"
                />
                <UButton
                  icon="i-heroicons-trash"
                  color="red"
                  variant="ghost"
                  size="xs"
                  @click="removeItem(idx)"
                />
              </div>
              <div v-else class="text-right">
                <span class="text-sm font-semibold text-operacao-800">
                  {{ formatNumber(item.quantidade) }}
                </span>
                <span class="text-xs text-operacao-400 ml-1">
                  {{ item.produto?.unidade?.sigla || '' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="border-t border-operacao-100 px-6 py-4 space-y-3">
          <UButton
            v-if="isEditable"
            color="primary"
            block
            :loading="savingChanges"
            @click="saveChanges"
          >
            <UIcon name="i-heroicons-check" class="w-4 h-4 mr-2" />
            Salvar Alterações
          </UButton>

          <div class="flex gap-2">
            <UButton
              variant="outline"
              class="flex-1"
              @click="exportWhatsApp"
            >
              <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-4 h-4 mr-1" />
              WhatsApp
            </UButton>
            <UButton
              variant="outline"
              class="flex-1"
              @click="printList"
            >
              <UIcon name="i-heroicons-printer" class="w-4 h-4 mr-1" />
              Imprimir
            </UButton>
            <UButton
              v-if="isEditable"
              color="red"
              variant="outline"
              @click="confirmDelete"
            >
              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
            </UButton>
          </div>
        </div>
      </div>
    </USlideover>

    <!-- ======================== MODAL CONFIRMAR EXCLUSAO ======================== -->
    <UModal v-model="deleteModalOpen" :ui="{ width: 'sm:max-w-md' }">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-red-100 rounded-lg">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">Excluir Lista</h3>
              <p class="text-xs text-operacao-400">Esta ação não pode ser desfeita</p>
            </div>
          </div>
        </template>
        <p class="text-sm text-operacao-600">
          Tem certeza que deseja excluir a lista
          <strong>{{ selectedPedido?.nome || 'este pedido' }}</strong>?
          Todos os itens serão removidos permanentemente.
        </p>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="deleteModalOpen = false" :disabled="deleting">
              Cancelar
            </UButton>
            <UButton color="red" :loading="deleting" @click="handleDelete">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Análises Slideover -->
    <ComprasAnalisesPanel
      v-model="analisesSlideover"
      @compra-criada="loadData"
    />

    <!-- Nova Lista Slideover -->
    <ComprasNovaListaSlideover
      v-model="novaListaOpen"
      :list-id="editListId"
      @saved="handleListaSaved"
    />

  </div>
</template>

<script setup lang="ts">
import type { Pedido, PedidoItem } from '~/types'
import { DatePicker as VDatePicker } from 'v-calendar'

// UI
const toolbarInputUi = { color: { white: { outline: 'shadow-sm bg-white text-gray-900 ring-1 ring-inset ring-[#EBEBED] focus:ring-1 focus:ring-operacao-200 dark:ring-operacao-700' } } }
const toolbarButtonUi = { color: { white: { solid: 'shadow-sm ring-1 ring-inset ring-[#EBEBED] text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-guardian-500 dark:ring-operacao-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800/50' } } }

const { getPedidos, deletePedido, updatePedido, updatePedidoItens } = useEstoque()
const { empresaId, empresaAtiva } = useEmpresa()
const { formatCurrency, formatNumber } = useFormatters()
const toast = useToast()

// ==========================================
// STATE
// ==========================================
const loading = ref(false)
const pedidos = ref<Pedido[]>([])
const search = ref('')
const dateRange = ref<{ start: Date | null; end: Date | null }>({ start: null, end: null })
const dateRangeClickCount = ref(0)
const selectedPedido = ref<Pedido | null>(null)
const slideoverOpen = ref(false)
const isReadonly = ref(false)
const deleteModalOpen = ref(false)
const deleting = ref(false)
const savingChanges = ref(false)
const analisesSlideover = ref(false)
const novaListaOpen = ref(false)
const editListId = ref<string | null>(null)

// Editable fields for slideover
const editNome = ref('')
const editItens = ref<PedidoItem[]>([])

// ==========================================
// TABLE
// ==========================================
const columns = [
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'data', label: 'Data', sortable: true },
  { key: 'itens', label: 'Itens' },
  { key: 'previsao', label: 'Previsão' }
]

// ==========================================
// COMPUTED
// ==========================================
const dateRangeLabel = computed(() => {
  if (!dateRange.value.start) return 'Selecionar período'
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  if (!dateRange.value.end || dateRange.value.start.getTime() === dateRange.value.end.getTime()) {
    return fmt(dateRange.value.start)
  }
  return `${fmt(dateRange.value.start)} — ${fmt(dateRange.value.end)}`
})

const onDayClick = (close: () => void) => {
  dateRangeClickCount.value++
  if (dateRangeClickCount.value >= 2) {
    dateRangeClickCount.value = 0
    close()
  }
}

const filteredPedidos = computed(() => {
  let result = pedidos.value

  if (dateRange.value.start) {
    const start = new Date(dateRange.value.start)
    start.setHours(0, 0, 0, 0)
    result = result.filter(p => {
      const d = new Date(p.data)
      return d >= start
    })
  }
  if (dateRange.value.end) {
    const end = new Date(dateRange.value.end)
    end.setHours(23, 59, 59, 999)
    result = result.filter(p => {
      const d = new Date(p.data)
      return d <= end
    })
  }

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(p => (p.nome || '').toLowerCase().includes(term))
  }

  return result
})

const { page, pageSize, paginatedItems } = usePagination(filteredPedidos)

const hasActiveFilters = computed(() => !!search.value || !!dateRange.value.start)

const clearFilters = () => {
  search.value = ''
  dateRange.value = { start: null, end: null }
  dateRangeClickCount.value = 0
}

const isEditable = computed(() =>
  !isReadonly.value && selectedPedido.value &&
  ['rascunho', 'enviado', 'em_andamento'].includes(selectedPedido.value.status)
)

// ==========================================
// DATA LOADING
// ==========================================
const loadData = async () => {
  try {
    loading.value = true
    pedidos.value = await getPedidos()
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

// Realtime
const { onTableChange } = useRealtime()
onTableChange(['produtos', 'entradas', 'saidas', 'ajustes', 'pedidos', 'pedido_itens', 'faturamentos', 'faturamentos_semanais'], () => loadData())

watch(empresaId, (id) => {
  if (id) loadData()
}, { immediate: true })

// ==========================================
// HELPERS
// ==========================================
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const calcValorEstimado = (pedido: Pedido): number => {
  if (pedido.valor_estimado && pedido.valor_estimado > 0) {
    return pedido.valor_estimado
  }
  if (!pedido.itens?.length) return 0
  return pedido.itens.reduce((sum, item) => {
    return sum + ((item.preco_estimado || 0) * item.quantidade)
  }, 0)
}

// ==========================================
// ROW CLICK
// ==========================================
const handleRowClick = (row: Pedido) => {
  if (['concluido', 'finalizada'].includes(row.status)) {
    openSlideoverReadonly(row)
  } else {
    openSlideover(row)
  }
}

// ==========================================
// NOVA LISTA
// ==========================================
const openNovaLista = () => {
  editListId.value = null
  novaListaOpen.value = true
}

const handleListaSaved = () => {
  loadData()
}

// ==========================================
// SLIDEOVER
// ==========================================
const openSlideover = (pedido: Pedido) => {
  selectedPedido.value = pedido
  isReadonly.value = false
  editNome.value = pedido.nome || ''
  editItens.value = pedido.itens
    ? pedido.itens.map(item => ({ ...item }))
    : []
  slideoverOpen.value = true
}

const openSlideoverReadonly = (pedido: Pedido) => {
  selectedPedido.value = pedido
  isReadonly.value = true
  editNome.value = pedido.nome || ''
  editItens.value = pedido.itens
    ? pedido.itens.map(item => ({ ...item }))
    : []
  slideoverOpen.value = true
}

const removeItem = (idx: number) => {
  editItens.value.splice(idx, 1)
}

// ==========================================
// SAVE CHANGES
// ==========================================
const saveChanges = async () => {
  if (!selectedPedido.value) return
  savingChanges.value = true
  try {
    const pedidoId = selectedPedido.value.id

    const newNome = editNome.value.trim()
    if (newNome !== (selectedPedido.value.nome || '')) {
      await updatePedido(pedidoId, { nome: newNome || undefined })
    }

    const itensPayload = editItens.value.map(item => ({
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      fornecedor_id: item.fornecedor_id || undefined,
      observacao: item.observacao || undefined,
      preco_estimado: item.preco_estimado || undefined
    }))
    await updatePedidoItens(pedidoId, itensPayload)

    toast.add({
      title: 'Salvo',
      description: 'Alterações salvas com sucesso',
      color: 'green'
    })

    await loadData()

    const updated = pedidos.value.find(p => p.id === pedidoId)
    if (updated) {
      selectedPedido.value = updated
      editItens.value = updated.itens ? updated.itens.map(item => ({ ...item })) : []
    }
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar alterações',
      color: 'red'
    })
  } finally {
    savingChanges.value = false
  }
}

// ==========================================
// DELETE
// ==========================================
const confirmDelete = () => {
  deleteModalOpen.value = true
}

const handleDelete = async () => {
  if (!selectedPedido.value) return
  deleting.value = true
  try {
    await deletePedido(selectedPedido.value.id)
    toast.add({
      title: 'Excluído',
      description: 'Lista excluída com sucesso',
      color: 'green'
    })
    deleteModalOpen.value = false
    slideoverOpen.value = false
    selectedPedido.value = null
    await loadData()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir lista',
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}

// ==========================================
// EXPORT WHATSAPP
// ==========================================
const exportWhatsApp = () => {
  if (!selectedPedido.value) return
  const pedido = selectedPedido.value
  const empresa = empresaAtiva?.value?.nome || ''
  const hojeStr = new Date().toLocaleDateString('pt-BR')
  const nome = pedido.nome || `Pedido ${formatDate(pedido.data)}`

  const items = editItens.value
  const itensTexto = items.map((item, idx) => {
    const nomeProduto = item.produto?.nome || 'Produto'
    const unidade = item.produto?.unidade?.sigla || ''
    return `${idx + 1}. ${nomeProduto} - ${formatNumber(item.quantidade)} ${unidade}`
  })

  let texto = `*LISTA DE COMPRAS*\n`
  texto += `${nome}\n`
  texto += `Empresa: ${empresa}\n`
  texto += `Data: ${hojeStr}\n\n`
  texto += `*ITENS:*\n`
  texto += itensTexto.join('\n')
  texto += `\n\nTotal: ${items.length} ${items.length === 1 ? 'item' : 'itens'}`

  const valorTotal = calcValorEstimado(pedido)
  if (valorTotal > 0) {
    texto += `\nValor estimado: ${formatCurrency(valorTotal)}`
  }

  if (pedido.observacao) {
    texto += `\nObs: ${pedido.observacao}`
  }

  const encoded = encodeURIComponent(texto)
  window.open(`https://wa.me/?text=${encoded}`, '_blank')
}

// ==========================================
// PRINT
// ==========================================
const printList = () => {
  if (!selectedPedido.value) return
  const pedido = selectedPedido.value
  const empresa = empresaAtiva?.value?.nome || ''
  const hojeStr = new Date().toLocaleDateString('pt-BR')
  const nome = pedido.nome || `Pedido ${formatDate(pedido.data)}`

  const linhas = editItens.value.map((item, idx) => {
    const nomeProduto = item.produto?.nome || 'Produto'
    const unidade = item.produto?.unidade?.sigla || ''
    const preco = item.preco_estimado ? formatCurrency(item.preco_estimado) : '-'
    const subtotal = item.preco_estimado ? formatCurrency(item.preco_estimado * item.quantidade) : '-'
    return `
      <tr>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${idx + 1}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb;">${nomeProduto}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${unidade}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatNumber(item.quantidade)}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${preco}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${subtotal}</td>
      </tr>
    `
  }).join('')

  const valorTotal = calcValorEstimado(pedido)

  const html = `
    <html>
    <head>
      <title>Lista de Compras - ${nome}</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
        }
        body { font-family: Arial, sans-serif; color: #111827; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #d1d5db; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: center; }
        .total-row { font-weight: 700; background-color: #f9fafb; }
      </style>
    </head>
    <body>
      <h1>${nome}</h1>
      <div class="subtitle">${empresa} &middot; Gerado em ${hojeStr} &middot; ${editItens.value.length} item(s)</div>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 40px;">#</th>
            <th>Produto</th>
            <th class="text-center" style="width: 50px;">Un.</th>
            <th class="text-right" style="width: 90px;">Qtd.</th>
            <th class="text-right" style="width: 100px;">Preço Un.</th>
            <th class="text-right" style="width: 100px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
          <tr class="total-row">
            <td colspan="5" style="padding: 8px 10px; text-align: right; border-top: 2px solid #d1d5db;">Total Estimado:</td>
            <td style="padding: 8px 10px; text-align: right; border-top: 2px solid #d1d5db;">${formatCurrency(valorTotal)}</td>
          </tr>
        </tbody>
      </table>
      ${pedido.observacao ? `<p style="margin-top: 16px; font-size: 12px; color: #6b7280;">Obs: ${pedido.observacao}</p>` : ''}
      <div class="footer">Guardião do CMV - Lista de Compras</div>
      <script>window.onload = function() { window.print(); }<\/script>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}
</script>
