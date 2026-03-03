<template>
  <USlideover
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :ui="{
      width: 'max-w-3xl',
      overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' }
    }"
  >
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-operacao-100">
        <h3 class="text-lg font-semibold text-operacao-800 truncate">
          {{ listId && pedidoExistente ? pedidoExistente.nome || 'Editar lista' : 'Nova lista de compras' }}
        </h3>
        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-1.5 cursor-pointer"
            @click="cartModalOpen = true"
          >
            <UBadge
              v-if="cart.size === 0"
              color="gray"
              variant="solid"
              size="sm"
            >
              Lista vazia
            </UBadge>
            <UBadge
              v-else
              variant="solid"
              size="sm"
              :ui="{ rounded: 'rounded-full' }"
              class="bg-guardian-600 text-white"
            >
              {{ cart.size }} produto{{ cart.size !== 1 ? 's' : '' }}
            </UBadge>
          </button>
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

      <!-- Main content (scrollable) -->
      <div class="flex-1 overflow-y-auto">
        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-operacao-400">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin mb-2" />
          <p class="text-sm">Carregando...</p>
        </div>

        <template v-else>
          <!-- Filters -->
          <div class="p-6 pb-0 space-y-4">
            <div class="flex flex-wrap gap-4 items-end">
              <UFormGroup label="Filtrar grupo">
                <USelect
                  v-model="grupoFilter"
                  :options="grupoOptions"
                  placeholder="Todos os grupos"
                  class="w-56"
                />
              </UFormGroup>
              <UFormGroup label="Buscar produto">
                <UInput
                  v-model="search"
                  placeholder="Buscar produto..."
                  icon="i-heroicons-magnifying-glass"
                  class="w-64"
                />
              </UFormGroup>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <UToggle v-model="apenasAbaixoMinimo" />
                <span class="text-sm text-operacao-600">
                  Apenas produtos abaixo do estoque mínimo
                </span>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-sm text-operacao-400">
                  Exibindo {{ filteredProducts.length }} produto{{ filteredProducts.length !== 1 ? 's' : '' }}
                </span>
                <UButton
                  color="primary"
                  variant="outline"
                  size="sm"
                  :disabled="filteredProducts.length === 0"
                  @click="adicionarTodosVisiveis"
                >
                  <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
                  Adicionar todos a lista
                </UButton>
              </div>
            </div>
          </div>

          <!-- Product Grid -->
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UCard
              v-for="product in filteredProducts"
              :key="product.produto_id"
              :class="cart.has(product.produto_id) ? 'border-l-4 border-guardian-500' : ''"
            >
              <div class="space-y-3">
                <div>
                  <p class="font-medium text-operacao-800">{{ product.nome }}</p>
                  <UBadge
                    v-if="product.subgrupo_nome"
                    variant="subtle"
                    size="xs"
                    class="bg-operacao-100 text-operacao-600 mt-1"
                  >
                    {{ product.subgrupo_nome }}
                  </UBadge>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-sm text-operacao-600 whitespace-nowrap">Comprar:</span>
                  <UInput
                    :model-value="getQuantidade(product.produto_id, product.sugestao_compra)"
                    @update:model-value="setQuantidade(product.produto_id, $event)"
                    type="number"
                    step="0.01"
                    min="0"
                    size="sm"
                    class="w-24"
                  />
                  <span class="text-xs text-operacao-400">{{ product.unidade_sigla }}</span>
                </div>

                <div class="space-y-1">
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-operacao-400">Estoque atual:</span>
                    <span class="text-operacao-600">
                      {{ formatNumber(product.estoque_atual) }} {{ product.unidade_sigla }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-operacao-400">Sugestão:</span>
                    <span :class="product.sugestao_compra > 0 ? 'text-red-600 font-medium' : 'text-controle-600'">
                      {{ product.sugestao_compra > 0 ? formatNumber(product.sugestao_compra) + ' ' + product.unidade_sigla : 'OK' }}
                    </span>
                  </div>
                </div>

                <UButton
                  v-if="!cart.has(product.produto_id)"
                  color="primary"
                  variant="outline"
                  size="sm"
                  block
                  @click="addToCart(product)"
                >
                  <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
                  Adicionar a lista
                </UButton>
                <UButton
                  v-else
                  color="red"
                  variant="outline"
                  size="sm"
                  block
                  @click="removeFromCart(product.produto_id)"
                >
                  <UIcon name="i-heroicons-trash" class="w-4 h-4 mr-1" />
                  Remover
                </UButton>
              </div>
            </UCard>
          </div>

          <!-- Empty state -->
          <div
            v-if="filteredProducts.length === 0"
            class="flex flex-col items-center justify-center py-12 text-operacao-400"
          >
            <UIcon name="i-heroicons-inbox" class="w-12 h-12 mb-3" />
            <p class="text-lg font-medium">Nenhum produto encontrado</p>
            <p class="text-sm mt-1">Tente ajustar os filtros ou desativar o filtro de estoque mínimo</p>
          </div>
        </template>
      </div>
    </div>

    <!-- Cart Summary Modal -->
    <UModal
      v-model="cartModalOpen"
      :ui="{
        width: 'sm:max-w-2xl',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">Sua lista de compras</h3>
              <p class="text-sm text-operacao-400 mt-0.5">
                {{ cart.size }} produto{{ cart.size !== 1 ? 's' : '' }}
                - Valor estimado: {{ formatCurrency(valorEstimadoTotal) }}
              </p>
            </div>
            <UButton
              icon="i-heroicons-x-mark"
              color="gray"
              variant="ghost"
              size="sm"
              @click="cartModalOpen = false"
            />
          </div>
        </template>

        <div class="max-h-[60vh] overflow-y-auto divide-y divide-operacao-100 -mx-4 sm:-mx-6">
          <div v-if="cart.size === 0" class="flex flex-col items-center justify-center py-8 text-operacao-400">
            <UIcon name="i-heroicons-shopping-cart" class="w-10 h-10 mb-2" />
            <p class="text-sm">Sua lista está vazia</p>
          </div>

          <div
            v-for="[id, item] in cartEntries"
            :key="id"
            class="px-4 sm:px-6 py-4 space-y-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-operacao-800">{{ item.nome }}</p>
                <UBadge
                  v-if="item.subgrupo_nome"
                  variant="subtle"
                  size="xs"
                  class="bg-operacao-100 text-operacao-600 mt-0.5"
                >
                  {{ item.subgrupo_nome }}
                </UBadge>
              </div>
              <UButton
                icon="i-heroicons-trash"
                color="red"
                variant="ghost"
                size="xs"
                @click="removeFromCart(id)"
              />
            </div>

            <div class="flex flex-wrap items-center gap-4">
              <div class="flex items-center gap-2">
                <span class="text-sm text-operacao-500">Qtd:</span>
                <UInput
                  :model-value="item.quantidade"
                  @update:model-value="updateCartQuantidade(id, $event)"
                  type="number"
                  step="0.01"
                  min="0"
                  size="sm"
                  class="w-24"
                />
                <span class="text-xs text-operacao-400">{{ item.unidade_sigla }}</span>
              </div>
              <div class="text-sm text-operacao-400">
                Último preço: <span class="font-medium text-operacao-600">{{ formatCurrency(item.preco_estimado || 0) }}</span>
              </div>
            </div>

            <UTextarea
              :model-value="item.observacao"
              @update:model-value="updateCartObservacao(id, $event)"
              placeholder="Observação do item (opcional)..."
              :rows="1"
              size="sm"
              autoresize
            />
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-between gap-3">
            <UButton
              color="gray"
              variant="ghost"
              @click="cartModalOpen = false"
            >
              Fechar
            </UButton>
            <div class="flex gap-2">
              <UButton
                color="gray"
                variant="outline"
                :disabled="cart.size === 0"
                @click="exportarLista"
              >
                <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 mr-1" />
                Exportar
              </UButton>
              <UButton
                color="primary"
                :disabled="cart.size === 0"
                @click="cartModalOpen = false; saveModalOpen = true"
              >
                <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1" />
                Salvar Lista
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </UModal>

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
const apenasAbaixoMinimo = ref(true)
const cartModalOpen = ref(false)
const saveModalOpen = ref(false)
const pedidoExistente = ref<Pedido | null>(null)

// Save form
const nomeLista = ref('')
const previsaoRecebimento = ref('')
const observacao = ref('')
const salvando = ref(false)

// Local quantity overrides
const quantidadeOverrides = ref<Record<string, number>>({})

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

const buildProductMap = computed((): DisplayProduct[] => {
  const estoqueMap = new Map<string, EstoqueMinimo>()
  for (const e of estoqueData.value) {
    estoqueMap.set(e.produto_id, e)
  }

  if (apenasAbaixoMinimo.value) {
    return estoqueData.value
      .map(e => {
        const prod = produtos.value.find(p => p.id === e.produto_id)
        const pontoReposicao = e.media_semanas * 1.2
        const sugestao = Math.max(0, pontoReposicao - e.quantidade_estoque)
        return {
          produto_id: e.produto_id,
          nome: e.nome,
          unidade_sigla: e.unidade || (prod?.unidade?.sigla ?? ''),
          subgrupo_nome: e.subgrupo || (prod?.subgrupo?.nome ?? ''),
          grupo_id: prod?.subgrupo?.grupo_id || (prod?.subgrupo as any)?.grupo?.id || '',
          estoque_atual: e.quantidade_estoque,
          sugestao_compra: Math.round(sugestao * 100) / 100,
          media_semanas: e.media_semanas
        }
      })
      .filter(p => p.sugestao_compra > 0)
  }

  return produtos.value.map(p => {
    const est = estoqueMap.get(p.id)
    const mediaSemanas = est?.media_semanas ?? 0
    const estoqueAtual = est?.quantidade_estoque ?? 0
    const pontoReposicao = mediaSemanas * 1.2
    const sugestao = Math.max(0, pontoReposicao - estoqueAtual)
    return {
      produto_id: p.id,
      nome: p.nome,
      unidade_sigla: p.unidade?.sigla ?? '',
      subgrupo_nome: p.subgrupo?.nome ?? '',
      grupo_id: p.subgrupo?.grupo_id || (p.subgrupo as any)?.grupo?.id || '',
      estoque_atual: estoqueAtual,
      sugestao_compra: Math.round(sugestao * 100) / 100,
      media_semanas: mediaSemanas
    }
  })
})

const filteredProducts = computed(() => {
  let result = buildProductMap.value

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

  result = [...result].sort((a, b) => {
    const aInCart = cart.value.has(a.produto_id) ? 0 : 1
    const bInCart = cart.value.has(b.produto_id) ? 0 : 1
    if (aInCart !== bInCart) return aInCart - bInCart
    return a.nome.localeCompare(b.nome)
  })

  return result
})

// Methods
const getQuantidade = (produtoId: string, sugestao: number) => {
  const cartItem = cart.value.get(produtoId)
  if (cartItem) return cartItem.quantidade
  if (quantidadeOverrides.value[produtoId] !== undefined) return quantidadeOverrides.value[produtoId]
  return sugestao > 0 ? Math.ceil(sugestao * 100) / 100 : 0
}

const setQuantidade = (produtoId: string, value: any) => {
  const num = Number(value) || 0
  const cartItem = cart.value.get(produtoId)
  if (cartItem) {
    cartItem.quantidade = num
    cart.value.set(produtoId, { ...cartItem })
  } else {
    quantidadeOverrides.value[produtoId] = num
  }
}

const addToCart = (product: DisplayProduct) => {
  const qty = quantidadeOverrides.value[product.produto_id] ?? (product.sugestao_compra > 0 ? Math.ceil(product.sugestao_compra * 100) / 100 : 1)
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
  delete quantidadeOverrides.value[product.produto_id]
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

const updateCartObservacao = (produtoId: string, value: any) => {
  const item = cart.value.get(produtoId)
  if (!item) return
  item.observacao = String(value || '')
  cart.value.set(produtoId, { ...item })
  cart.value = new Map(cart.value)
}

const adicionarTodosVisiveis = () => {
  for (const product of filteredProducts.value) {
    if (!cart.value.has(product.produto_id)) {
      addToCart(product)
    }
  }
  toast.add({
    title: 'Produtos adicionados',
    description: `${filteredProducts.value.length} produto(s) adicionados à lista`,
    color: 'green',
    timeout: 2000
  })
}

const exportarLista = () => {
  if (cart.value.size === 0) return

  const empresa = empresaAtiva?.value?.nome || ''
  const hojeStr = new Date().toLocaleDateString('pt-BR')

  let idx = 0
  const linhas: string[] = []
  for (const [, item] of cart.value) {
    idx++
    let linha = `${idx}. ${item.nome} - ${formatNumber(item.quantidade)} ${item.unidade_sigla}`
    if (item.observacao) linha += ` (${item.observacao})`
    linhas.push(linha)
  }

  let texto = `*LISTA DE COMPRAS*\n`
  texto += `Empresa: ${empresa}\n`
  texto += `Data: ${hojeStr}\n\n`
  texto += `*ITENS (${cart.value.size}):*\n`
  texto += linhas.join('\n')
  texto += `\n\nValor estimado: ${formatCurrency(valorEstimadoTotal.value)}`

  const encoded = encodeURIComponent(texto)
  window.open(`https://wa.me/?text=${encoded}`, '_blank')
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
          status: 'em_andamento',
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
  apenasAbaixoMinimo.value = true
  cartModalOpen.value = false
  saveModalOpen.value = false
  pedidoExistente.value = null
  nomeLista.value = ''
  previsaoRecebimento.value = ''
  observacao.value = ''
  quantidadeOverrides.value = {}
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
