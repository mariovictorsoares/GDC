<template>
  <div class="space-y-6">

    <!-- ======================== HEADER ======================== -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-operacao-800">Compras</h1>
        <p class="text-sm text-operacao-400">Gerencie suas listas de compras e acompanhe pedidos</p>
      </div>
      <UButton color="primary" @click="loadData" :loading="loading">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
        Atualizar
      </UButton>
    </div>

    <!-- ======================== KPI CARDS ======================== -->
    <div v-if="loading" class="grid grid-cols-2 gap-4">
      <div v-for="i in 2" :key="i" class="rounded-xl bg-white ring-1 ring-operacao-100 shadow-sm p-5 space-y-3">
        <USkeleton class="h-4 w-24" />
        <USkeleton class="h-8 w-32" />
      </div>
    </div>

    <div v-else class="grid grid-cols-2 gap-4">
      <DashboardKpiCard
        label="Produtos em reposicao"
        :display-value="String(produtosReposicao)"
        icon="i-heroicons-exclamation-triangle"
        icon-bg-class="bg-guardian-50"
        icon-color-class="text-guardian-600"
        accent-gradient="bg-gradient-to-r from-guardian-400 to-guardian-600"
        :secondary-text="produtosReposicao > 0 ? `${produtosReposicao} produto(s) precisam de compra` : 'Estoque OK'"
      />
      <DashboardKpiCard
        label="Produtos com estoque zerado"
        :display-value="String(produtosZerados)"
        icon="i-heroicons-x-circle"
        icon-bg-class="bg-red-50"
        icon-color-class="text-red-600"
        accent-gradient="bg-gradient-to-r from-red-400 to-red-600"
        :value-color-class="produtosZerados > 0 ? 'text-red-600' : 'text-controle-600'"
        :secondary-text="produtosZerados > 0 ? 'Ruptura de estoque' : 'Nenhum zerado'"
      />
    </div>

    <!-- ======================== ACTION BUTTONS ======================== -->
    <div class="flex flex-wrap gap-3">
      <NuxtLink to="/compras/nova-lista">
        <UButton color="primary" class="bg-guardian-600 hover:bg-guardian-700">
          <UIcon name="i-heroicons-plus-circle" class="w-4 h-4 mr-2" />
          Criar Lista de Compras
        </UButton>
      </NuxtLink>
      <NuxtLink to="/compras/analises">
        <UButton variant="outline">
          <UIcon name="i-heroicons-chart-bar-square" class="w-4 h-4 mr-2" />
          Analises
        </UButton>
      </NuxtLink>
    </div>

    <!-- ======================== LISTAS EM ANDAMENTO ======================== -->
    <div class="space-y-4">
      <div>
        <h2 class="text-lg font-semibold text-operacao-800">Listas em andamento</h2>
        <p class="text-sm text-operacao-400">Acompanhe suas listas de compras em andamento</p>
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="i in 2" :key="i" class="rounded-xl bg-white ring-1 ring-operacao-100 shadow-sm p-5 space-y-3">
          <USkeleton class="h-5 w-48" />
          <USkeleton class="h-4 w-32" />
        </div>
      </div>

      <div v-else-if="pedidosEmAndamento.length === 0" class="rounded-xl bg-operacao-50 ring-1 ring-operacao-100 p-8 flex flex-col items-center justify-center text-center">
        <UIcon name="i-heroicons-inbox" class="w-10 h-10 text-operacao-300 mb-3" />
        <p class="text-sm text-operacao-400">Nenhuma lista em andamento. Crie sua primeira lista!</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <UCard
          v-for="pedido in pedidosEmAndamento"
          :key="pedido.id"
          class="cursor-pointer hover:shadow-md transition-shadow duration-200"
          :ui="{
            base: 'overflow-hidden',
            background: 'bg-white',
            shadow: 'shadow-sm',
            ring: 'ring-1 ring-operacao-100',
            rounded: 'rounded-xl',
            body: { padding: 'px-5 py-4 sm:p-5' }
          }"
          @click="openSlideover(pedido)"
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-operacao-800 truncate">
                {{ pedido.nome || `Pedido ${formatDate(pedido.data)}` }}
              </h3>
              <UBadge
                :color="getStatusColor(pedido.status)"
                variant="soft"
                size="xs"
              >
                {{ getStatusLabel(pedido.status) }}
              </UBadge>
            </div>

            <div class="flex items-center gap-2">
              <UBadge color="gray" variant="soft" size="xs">
                {{ pedido.itens?.length || 0 }} itens
              </UBadge>
            </div>

            <div class="space-y-1 text-xs text-operacao-400">
              <p>
                Valor estimado:
                <span class="font-medium text-operacao-600">
                  {{ formatCurrency(calcValorEstimado(pedido)) }}
                </span>
              </p>
              <p>
                Previsao:
                <span class="font-medium text-operacao-600">
                  {{ pedido.previsao_recebimento ? formatDate(pedido.previsao_recebimento) : '-' }}
                </span>
              </p>
              <p>
                Responsavel:
                <span class="font-medium text-operacao-600">
                  {{ pedido.responsavel_nome || '-' }}
                </span>
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- ======================== LISTAS FINALIZADAS (COLLAPSIBLE) ======================== -->
    <div class="space-y-4">
      <button
        class="flex items-center gap-2 w-full text-left"
        @click="finalizadasOpen = !finalizadasOpen"
      >
        <UIcon
          :name="finalizadasOpen ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
          class="w-5 h-5 text-operacao-400"
        />
        <h2 class="text-lg font-semibold text-operacao-800">Listas finalizadas</h2>
        <UBadge v-if="pedidosFinalizados.length > 0" color="gray" variant="soft" size="xs">
          {{ pedidosFinalizados.length }}
        </UBadge>
      </button>

      <div v-if="finalizadasOpen && !loading" class="space-y-3">
        <div v-if="pedidosFinalizados.length === 0" class="rounded-xl bg-operacao-50 ring-1 ring-operacao-100 p-6 text-center">
          <p class="text-sm text-operacao-400">Nenhuma lista finalizada</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UCard
            v-for="pedido in pedidosFinalizados"
            :key="pedido.id"
            class="cursor-pointer hover:shadow-md transition-shadow duration-200"
            :ui="{
              base: 'overflow-hidden',
              background: 'bg-white',
              shadow: 'shadow-sm',
              ring: 'ring-1 ring-operacao-100',
              rounded: 'rounded-xl',
              body: { padding: 'px-5 py-4 sm:p-5' }
            }"
            @click="openSlideoverReadonly(pedido)"
          >
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-operacao-800 truncate">
                  {{ pedido.nome || `Pedido ${formatDate(pedido.data)}` }}
                </h3>
                <UBadge color="green" variant="soft" size="xs">
                  Finalizada
                </UBadge>
              </div>
              <div class="flex items-center gap-2">
                <UBadge color="gray" variant="soft" size="xs">
                  {{ pedido.itens?.length || 0 }} itens
                </UBadge>
              </div>
              <div class="space-y-1 text-xs text-operacao-400">
                <p v-if="pedido.data_recebimento">
                  Recebido em:
                  <span class="font-medium text-operacao-600">{{ formatDate(pedido.data_recebimento) }}</span>
                </p>
                <p>
                  Responsavel:
                  <span class="font-medium text-operacao-600">{{ pedido.responsavel_nome || '-' }}</span>
                </p>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- ======================== SLIDEOVER ======================== -->
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
              <span class="text-xs text-operacao-400">
                Valor estimado: {{ formatCurrency(calcValorEstimado(selectedPedido)) }}
              </span>
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

        <!-- Slideover Status -->
        <div class="px-6 py-3 bg-operacao-50 border-b border-operacao-100">
          <div class="flex items-center gap-2">
            <span class="text-xs text-operacao-400">Status:</span>
            <UBadge
              :color="getStatusColor(selectedPedido.status)"
              variant="soft"
              size="sm"
            >
              {{ getStatusLabel(selectedPedido.status) }}
            </UBadge>
          </div>
          <div v-if="selectedPedido.previsao_recebimento" class="mt-1 text-xs text-operacao-400">
            Previsao recebimento: {{ formatDate(selectedPedido.previsao_recebimento) }}
          </div>
          <div v-if="isReadonly && selectedPedido.data_recebimento" class="mt-1 text-xs text-controle-600 font-medium">
            Recebido em: {{ formatDate(selectedPedido.data_recebimento) }}
          </div>
        </div>

        <!-- Slideover: Confirmar Recebimento -->
        <div v-if="isEditable && ['enviado', 'em_andamento'].includes(selectedPedido.status)" class="px-6 py-3 border-b border-operacao-100">
          <UButton
            color="green"
            block
            :loading="confirmingRecebimento"
            @click="handleConfirmarRecebimento"
          >
            <UIcon name="i-heroicons-check-circle" class="w-4 h-4 mr-2" />
            Confirmar Recebimento
          </UButton>
        </div>

        <!-- Slideover Items List -->
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

        <!-- Slideover Footer Actions -->
        <div class="border-t border-operacao-100 px-6 py-4 space-y-3">
          <!-- Save changes button (editable mode) -->
          <UButton
            v-if="isEditable"
            color="primary"
            block
            :loading="savingChanges"
            @click="saveChanges"
          >
            <UIcon name="i-heroicons-check" class="w-4 h-4 mr-2" />
            Salvar Alteracoes
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
              <p class="text-xs text-operacao-400">Esta acao nao pode ser desfeita</p>
            </div>
          </div>
        </template>
        <p class="text-sm text-operacao-600">
          Tem certeza que deseja excluir a lista
          <strong>{{ selectedPedido?.nome || 'este pedido' }}</strong>?
          Todos os itens serao removidos permanentemente.
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

  </div>
</template>

<script setup lang="ts">
import type { Pedido, PedidoItem, EstoqueMinimo } from '~/types'

const { getPedidos, deletePedido, confirmarRecebimento, updatePedido, updatePedidoItens } = useEstoque()
const { getEstoqueMinimo } = useRelatorios()
const { empresaId, empresaAtiva } = useEmpresa()
const { formatCurrency, formatNumber } = useFormatters()
const toast = useToast()

// ==========================================
// STATE
// ==========================================
const loading = ref(false)
const pedidos = ref<Pedido[]>([])
const estoqueData = ref<EstoqueMinimo[]>([])
const selectedPedido = ref<Pedido | null>(null)
const slideoverOpen = ref(false)
const finalizadasOpen = ref(false)
const isReadonly = ref(false)
const deleteModalOpen = ref(false)
const deleting = ref(false)
const savingChanges = ref(false)
const confirmingRecebimento = ref(false)

// Editable fields for slideover
const editNome = ref('')
const editItens = ref<PedidoItem[]>([])

// ==========================================
// COMPUTED
// ==========================================
const pedidosEmAndamento = computed(() =>
  pedidos.value.filter(p => ['rascunho', 'enviado', 'em_andamento'].includes(p.status))
)

const pedidosFinalizados = computed(() =>
  pedidos.value.filter(p => ['concluido', 'finalizada'].includes(p.status))
)

const produtosReposicao = computed(() => {
  const seguranca = 20
  return estoqueData.value.filter(item => {
    const pontoReposicao = item.media_semanas * (1 + seguranca / 100)
    const previsaoCompras = pontoReposicao - item.quantidade_estoque
    return previsaoCompras > 0
  }).length
})

const produtosZerados = computed(() =>
  estoqueData.value.filter(item => item.quantidade_estoque <= 0).length
)

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
    const [pedidosData, estoqueResult] = await Promise.all([
      getPedidos(),
      getEstoqueMinimo()
    ])
    pedidos.value = pedidosData
    estoqueData.value = estoqueResult
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

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'rascunho': return 'gray'
    case 'enviado': return 'blue'
    case 'em_andamento': return 'yellow'
    case 'concluido':
    case 'finalizada': return 'green'
    default: return 'gray'
  }
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'rascunho': return 'Rascunho'
    case 'enviado': return 'Enviado'
    case 'em_andamento': return 'Em andamento'
    case 'concluido': return 'Concluido'
    case 'finalizada': return 'Finalizada'
    default: return status
  }
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

    // Update pedido name if changed
    const newNome = editNome.value.trim()
    if (newNome !== (selectedPedido.value.nome || '')) {
      await updatePedido(pedidoId, { nome: newNome || undefined })
    }

    // Update items
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
      description: 'Alteracoes salvas com sucesso',
      color: 'green'
    })

    // Reload data
    await loadData()

    // Update selected pedido reference
    const updated = pedidos.value.find(p => p.id === pedidoId)
    if (updated) {
      selectedPedido.value = updated
      editItens.value = updated.itens ? updated.itens.map(item => ({ ...item })) : []
    }
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar alteracoes',
      color: 'red'
    })
  } finally {
    savingChanges.value = false
  }
}

// ==========================================
// CONFIRMAR RECEBIMENTO
// ==========================================
const handleConfirmarRecebimento = async () => {
  if (!selectedPedido.value) return
  confirmingRecebimento.value = true
  try {
    const dataHoje = new Date().toISOString().split('T')[0]
    await confirmarRecebimento(selectedPedido.value.id, dataHoje)
    toast.add({
      title: 'Recebimento confirmado',
      description: 'A lista foi marcada como finalizada',
      color: 'green'
    })
    slideoverOpen.value = false
    await loadData()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao confirmar recebimento',
      color: 'red'
    })
  } finally {
    confirmingRecebimento.value = false
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
      title: 'Excluido',
      description: 'Lista excluida com sucesso',
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
            <th class="text-right" style="width: 100px;">Preco Un.</th>
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
      <div class="footer">Guardiao do CMV - Lista de Compras</div>
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
