<template>
  <USlideover
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :ui="{
      width: 'max-w-5xl',
      overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' }
    }"
  >
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-operacao-200">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-guardian-100 rounded-lg">
            <UIcon name="i-heroicons-shopping-cart" class="w-5 h-5 text-guardian-600" />
          </div>
          <h2 class="text-lg font-bold text-operacao-800">
            {{ listId && pedidoExistente ? pedidoExistente.nome || 'Editar lista' : 'Nova lista de compras' }}
          </h2>
        </div>
        <div class="flex items-center gap-3">
          <UButton
            color="primary"
            size="sm"
            :disabled="cart.size === 0"
            @click="saveModalOpen = true"
          >
            <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1" />
            Salvar
          </UButton>
          <UButton
            icon="i-heroicons-x-mark"
            color="gray"
            variant="ghost"
            size="sm"
            @click="$emit('update:modelValue', false)"
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex-1 flex flex-col items-center justify-center text-operacao-400">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin mb-2" />
        <p class="text-sm">Carregando...</p>
      </div>

      <!-- Two-Panel Layout -->
      <div v-else class="flex-1 flex min-h-0">

        <!-- LEFT PANEL: Available Products -->
        <div class="w-1/2 border-r border-operacao-200 flex flex-col min-h-0">
          <div class="px-4 pt-4 pb-3 space-y-3 border-b border-operacao-100">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium uppercase tracking-wider text-[#5a5a66]">Adicionar Produtos</span>
              <button
                v-if="produtosComSugestao > 0"
                class="flex items-center gap-1 text-xs font-medium text-guardian-600 hover:text-guardian-700 transition-colors"
                @click="adicionarTodosComSugestao"
              >
                <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
                Todos ({{ produtosComSugestao }})
              </button>
            </div>
            <USelect
              v-model="grupoFilter"
              :options="grupoOptions"
              placeholder="Todos os grupos"
              size="sm"
            />
            <UInput
              v-model="search"
              placeholder="Buscar produto..."
              icon="i-heroicons-magnifying-glass"
              size="sm"
              :ui="{ color: { white: { outline: 'shadow-sm bg-white text-gray-900 ring-1 ring-inset ring-[#EBEBED] focus:ring-1 focus:ring-operacao-200' } } }"
            />
          </div>

          <div class="flex-1 overflow-y-auto">
            <div v-if="availableProducts.length === 0" class="flex flex-col items-center justify-center py-12 text-operacao-400">
              <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
              <p class="text-sm">Nenhum produto encontrado</p>
            </div>

            <div class="divide-y divide-operacao-100">
              <button
                v-for="product in availableProducts"
                :key="product.produto_id"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-operacao-50 transition-colors group"
                @click="addToCart(product)"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-operacao-800 truncate">{{ product.nome }}</p>
                  <p class="text-xs text-operacao-400 truncate">{{ product.subgrupo_nome }}</p>
                </div>
                <span
                  v-if="product.sugestao_compra > 0"
                  class="shrink-0 text-[11px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded"
                >
                  Pedir: {{ formatNumber(product.sugestao_compra) }} {{ product.unidade_sigla }}
                </span>
                <UIcon name="i-heroicons-plus-circle" class="w-5 h-5 text-operacao-300 group-hover:text-guardian-500 shrink-0 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        <!-- RIGHT PANEL: Cart (Selected Products) -->
        <div class="w-1/2 flex flex-col min-h-0">
          <div class="px-4 pt-4 pb-3 border-b border-operacao-100">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium uppercase tracking-wider text-[#5a5a66]">
                Lista de Compras ({{ cart.size }})
              </span>
              <button
                v-if="cart.size > 0"
                class="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                @click="cart = new Map()"
              >
                Limpar todos
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
            <div v-if="cart.size === 0" class="flex flex-col items-center justify-center py-12 text-operacao-400">
              <UIcon name="i-heroicons-shopping-cart" class="w-8 h-8 mb-2" />
              <p class="text-sm">Lista vazia</p>
              <p class="text-xs mt-1">Clique nos produtos à esquerda para adicionar</p>
            </div>

            <div class="divide-y divide-operacao-100">
              <div
                v-for="[id, item] in cartEntries"
                :key="id"
                class="px-4 py-2.5 group"
              >
                <div class="flex items-start gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-operacao-800 truncate">
                      {{ item.nome }}
                      <span class="text-xs text-operacao-400 font-normal">({{ item.unidade_sigla }})</span>
                    </p>
                    <p class="text-xs text-operacao-400 truncate">{{ item.subgrupo_nome }}</p>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <UInput
                      :model-value="item.quantidade"
                      @update:model-value="updateCartQuantidade(id, $event)"
                      type="number"
                      step="0.01"
                      min="0"
                      size="xs"
                      class="w-20"
                      :ui="{ base: 'text-center' }"
                    />
                    <button
                      class="p-1 text-operacao-300 hover:text-red-500 transition-colors"
                      @click="removeFromCart(id)"
                    >
                      <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer with total -->
          <div v-if="cart.size > 0" class="px-4 py-3 border-t border-operacao-200 bg-operacao-50/50">
            <div class="flex items-center justify-between text-sm">
              <span class="text-operacao-500">Valor estimado:</span>
              <span class="font-semibold text-operacao-800">{{ formatCurrency(valorEstimadoTotal) }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Save Modal -->
    <UModal
      v-model="saveModalOpen"
      :ui="{
        width: 'sm:max-w-lg',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-guardian-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-clipboard-document-list" class="w-5 h-5 text-guardian-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">Salvar lista de compras</h3>
              <p class="text-xs text-operacao-400">{{ cart.size }} produto{{ cart.size !== 1 ? 's' : '' }} na lista</p>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Nome da lista" required>
            <UInput
              v-model="nomeLista"
              placeholder="Ex: Compras da semana, Reposição urgente..."
            />
          </UFormGroup>

          <UFormGroup label="Previsão de recebimento">
            <UInput
              v-model="previsaoRecebimento"
              type="date"
            />
          </UFormGroup>

          <UFormGroup label="Observação">
            <UTextarea
              v-model="observacao"
              placeholder="Informações adicionais sobre a lista..."
              :rows="3"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="gray"
              variant="ghost"
              @click="saveModalOpen = false"
              :disabled="salvando"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              :disabled="!nomeLista.trim() || cart.size === 0"
              :loading="salvando"
              @click="salvarLista"
            >
              <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1" />
              Salvar lista
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </USlideover>
</template>

<script setup lang="ts">
import type { Produto, EstoqueMinimo, Pedido, Grupo } from '~/types'

interface CartItem {
  produto_id: string
  nome: string
  unidade_sigla: string
  subgrupo_nome: string
  quantidade: number
  preco_estimado: number
  observacao: string
  estoque_atual: number
  sugestao_compra: number
}

interface DisplayProduct {
  produto_id: string
  nome: string
  unidade_sigla: string
  subgrupo_nome: string
  grupo_id: string
  estoque_atual: number
  sugestao_compra: number
  media_semanas: number
  dias_ruptura: number
}

const props = defineProps<{
  modelValue: boolean
  listId?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

// Composables
const { getProdutos, getGrupos, createPedido, updatePedido, updatePedidoItens, getPedidos, getUltimosPrecos } = useEstoque()
const { getEstoqueMinimo } = useRelatorios()
const { empresaId, empresaAtiva } = useEmpresa()
const { formatCurrency, formatNumber } = useFormatters()
const toast = useToast()

// State
const cart = ref<Map<string, CartItem>>(new Map())
const produtos = ref<Produto[]>([])
const estoqueData = ref<EstoqueMinimo[]>([])
const grupos = ref<Grupo[]>([])
const precos = ref<Record<string, number>>({})
const loading = ref(false)
const search = ref('')
const grupoFilter = ref('')
const saveModalOpen = ref(false)
const pedidoExistente = ref<Pedido | null>(null)

// Save form
const nomeLista = ref('')
const previsaoRecebimento = ref('')
const observacao = ref('')
const salvando = ref(false)

// Computed
const grupoOptions = computed(() => {
  const opts = [{ label: 'Todos os grupos', value: '' }]
  for (const g of grupos.value) {
    opts.push({ label: g.nome, value: g.id })
  }
  return opts
})

const cartEntries = computed(() => Array.from(cart.value.entries()))

const valorEstimadoTotal = computed(() => {
  let total = 0
  for (const [, item] of cart.value) {
    total += item.quantidade * (item.preco_estimado || 0)
  }
  return total
})

const allProducts = computed((): DisplayProduct[] => {
  const estoqueMap = new Map<string, EstoqueMinimo>()
  for (const e of estoqueData.value) {
    estoqueMap.set(e.produto_id, e)
  }

  return produtos.value.map(p => {
    const est = estoqueMap.get(p.id)
    const mediaSemanas = est?.media_semanas ?? 0
    const estoqueAtual = est?.quantidade_estoque ?? 0
    const pontoReposicao = mediaSemanas * 1.2
    const sugestao = Math.max(0, pontoReposicao - estoqueAtual)
    const consumoDiario = mediaSemanas / 7
    const diasRuptura = consumoDiario > 0 ? Math.floor(estoqueAtual / consumoDiario) : 999
    return {
      produto_id: p.id,
      nome: p.nome,
      unidade_sigla: p.unidade?.sigla ?? '',
      subgrupo_nome: p.subgrupo?.nome ?? '',
      grupo_id: p.subgrupo?.grupo_id || (p.subgrupo as any)?.grupo?.id || '',
      estoque_atual: estoqueAtual,
      sugestao_compra: Math.round(sugestao * 100) / 100,
      media_semanas: mediaSemanas,
      dias_ruptura: diasRuptura
    }
  })
})

const availableProducts = computed(() => {
  let result = allProducts.value.filter(p => !cart.value.has(p.produto_id))

  if (grupoFilter.value) {
    result = result.filter(p => p.grupo_id === grupoFilter.value)
  }

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(p =>
      p.nome.toLowerCase().includes(term) ||
      p.subgrupo_nome.toLowerCase().includes(term)
    )
  }

  // Sort: products with suggestion first (by urgency), then alphabetical
  return [...result].sort((a, b) => {
    const aHas = a.sugestao_compra > 0 ? 0 : 1
    const bHas = b.sugestao_compra > 0 ? 0 : 1
    if (aHas !== bHas) return aHas - bHas
    if (aHas === 0 && bHas === 0) return a.dias_ruptura - b.dias_ruptura
    return a.nome.localeCompare(b.nome)
  })
})

const produtosComSugestao = computed(() => {
  return availableProducts.value.filter(p => p.sugestao_compra > 0).length
})

// Methods
const addToCart = (product: DisplayProduct) => {
  const qty = product.sugestao_compra > 0 ? Math.ceil(product.sugestao_compra * 100) / 100 : 1
  const item: CartItem = {
    produto_id: product.produto_id,
    nome: product.nome,
    unidade_sigla: product.unidade_sigla,
    subgrupo_nome: product.subgrupo_nome,
    quantidade: qty,
    preco_estimado: precos.value[product.produto_id] || 0,
    observacao: '',
    estoque_atual: product.estoque_atual,
    sugestao_compra: product.sugestao_compra
  }
  cart.value.set(product.produto_id, item)
  cart.value = new Map(cart.value)
}

const removeFromCart = (produtoId: string) => {
  cart.value.delete(produtoId)
  cart.value = new Map(cart.value)
}

const updateCartQuantidade = (produtoId: string, value: any) => {
  const item = cart.value.get(produtoId)
  if (!item) return
  item.quantidade = Number(value) || 0
  cart.value.set(produtoId, { ...item })
  cart.value = new Map(cart.value)
}

const adicionarTodosComSugestao = () => {
  const comSugestao = availableProducts.value.filter(p => p.sugestao_compra > 0)
  for (const product of comSugestao) {
    addToCart(product)
  }
  toast.add({
    title: 'Produtos adicionados',
    description: `${comSugestao.length} produto(s) adicionados à lista`,
    color: 'green',
    timeout: 2000
  })
}

const salvarLista = async () => {
  if (!nomeLista.value.trim() || cart.value.size === 0) return

  salvando.value = true
  try {
    const dataHoje = new Date().toISOString().split('T')[0]

    const itens = Array.from(cart.value.values()).map(item => ({
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_estimado: item.preco_estimado || undefined,
      observacao: item.observacao || undefined
    }))

    const valorEstimado = valorEstimadoTotal.value > 0 ? valorEstimadoTotal.value : undefined

    if (props.listId && pedidoExistente.value) {
      await updatePedido(props.listId, {
        nome: nomeLista.value.trim(),
        observacao: observacao.value.trim() || undefined,
        previsao_recebimento: previsaoRecebimento.value || undefined,
        valor_estimado: valorEstimado
      } as any)
      await updatePedidoItens(props.listId, itens)
      toast.add({
        title: 'Lista atualizada',
        description: `Lista "${nomeLista.value}" atualizada com ${itens.length} itens`,
        color: 'green'
      })
    } else {
      await createPedido(
        {
          data: dataHoje,
          nome: nomeLista.value.trim(),
          observacao: observacao.value.trim() || undefined,
          status: 'rascunho',
          previsao_recebimento: previsaoRecebimento.value || undefined,
          valor_estimado: valorEstimado,
          origem: 'manual'
        },
        itens
      )
      toast.add({
        title: 'Lista salva',
        description: `Lista "${nomeLista.value}" criada com ${itens.length} itens`,
        color: 'green'
      })
    }

    saveModalOpen.value = false
    emit('update:modelValue', false)
    emit('saved')
  } catch (error: any) {
    toast.add({
      title: 'Erro ao salvar',
      description: error.message || 'Erro inesperado ao salvar a lista',
      color: 'red'
    })
  } finally {
    salvando.value = false
  }
}

const loadExistingList = async () => {
  if (!props.listId) return
  try {
    const pedidos = await getPedidos()
    const pedido = pedidos.find(p => p.id === props.listId)
    if (!pedido) {
      toast.add({ title: 'Erro', description: 'Lista não encontrada', color: 'red' })
      return
    }
    pedidoExistente.value = pedido
    nomeLista.value = pedido.nome || ''
    previsaoRecebimento.value = pedido.previsao_recebimento || ''
    observacao.value = pedido.observacao || ''

    if (pedido.itens && pedido.itens.length > 0) {
      const newCart = new Map<string, CartItem>()
      for (const item of pedido.itens) {
        const prod = produtos.value.find(p => p.id === item.produto_id)
        const est = estoqueData.value.find(e => e.produto_id === item.produto_id)
        const mediaSemanas = est?.media_semanas ?? 0
        const estoqueAtual = est?.quantidade_estoque ?? 0
        const pontoReposicao = mediaSemanas * 1.2
        const sugestao = Math.max(0, pontoReposicao - estoqueAtual)

        newCart.set(item.produto_id, {
          produto_id: item.produto_id,
          nome: item.produto?.nome || prod?.nome || 'Produto',
          unidade_sigla: item.produto?.unidade?.sigla || prod?.unidade?.sigla || '',
          subgrupo_nome: item.produto?.subgrupo?.nome || prod?.subgrupo?.nome || '',
          quantidade: item.quantidade,
          preco_estimado: item.preco_estimado || precos.value[item.produto_id] || 0,
          observacao: item.observacao || '',
          estoque_atual: estoqueAtual,
          sugestao_compra: Math.round(sugestao * 100) / 100
        })
      }
      cart.value = newCart
    }
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar lista', color: 'red' })
  }
}

const resetState = () => {
  cart.value = new Map()
  produtos.value = []
  estoqueData.value = []
  grupos.value = []
  precos.value = {}
  search.value = ''
  grupoFilter.value = ''
  saveModalOpen.value = false
  pedidoExistente.value = null
  nomeLista.value = ''
  previsaoRecebimento.value = ''
  observacao.value = ''
}

const loadData = async () => {
  loading.value = true
  try {
    const [prodData, estData, grupoData] = await Promise.all([
      getProdutos(),
      getEstoqueMinimo(),
      getGrupos()
    ])
    produtos.value = prodData
    estoqueData.value = estData
    grupos.value = grupoData

    const ids = prodData.map(p => p.id)
    if (ids.length > 0) {
      precos.value = await getUltimosPrecos(ids)
    }

    if (props.listId) {
      await loadExistingList()
    }
  } catch (error: any) {
    toast.add({
      title: 'Erro ao carregar dados',
      description: error.message || 'Erro inesperado',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

// Load data when slideover opens, reset when it closes
watch(() => props.modelValue, (open) => {
  if (open && empresaId.value) {
    loadData()
  }
  if (!open) {
    resetState()
  }
})
</script>
