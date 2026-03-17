<template>
  <div class="min-h-screen bg-operacao-50">
    <!-- Header -->
    <header class="bg-white border-b border-operacao-100 sticky top-0 z-30">
      <div class="max-w-3xl mx-auto px-4 py-3 sm:px-6">
        <div class="flex items-center gap-3">
          <img src="/logo-cmv360.png" alt="CMV360" class="h-7 w-auto" />
          <div class="h-5 w-px bg-operacao-200 hidden sm:block" />
          <div class="flex-1 min-w-0">
            <h1 class="text-sm sm:text-base font-bold text-operacao-800 truncate">
              Requisição — {{ dados?.setor?.nome || 'Setor' }}
            </h1>
            <p class="text-[11px] sm:text-xs text-operacao-400">
              {{ dados?.empresa_nome }}
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-24">
      <div class="animate-spin rounded-full h-10 w-10 border-[3px] border-operacao-200 border-t-guardian-500" />
      <p class="text-sm text-operacao-400 mt-4">Carregando...</p>
    </div>

    <!-- Error -->
    <div v-else-if="erro" class="flex flex-col items-center justify-center py-24 px-6 text-center max-w-sm mx-auto">
      <div class="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-8 h-8 text-red-400" />
      </div>
      <h2 class="text-lg font-bold text-operacao-800 mb-1">Link inválido</h2>
      <p class="text-sm text-operacao-400">Este link de requisição não é válido ou não existe.</p>
    </div>

    <!-- Success -->
    <div v-else-if="enviado" class="flex flex-col items-center justify-center py-24 px-6 text-center max-w-sm mx-auto">
      <div class="w-20 h-20 rounded-full bg-controle-50 flex items-center justify-center mb-5">
        <UIcon name="i-heroicons-check-circle" class="w-10 h-10 text-controle-500" />
      </div>
      <h2 class="text-lg font-bold text-operacao-800 mb-1">Requisição enviada!</h2>
      <p class="text-sm text-operacao-400">Sua requisição foi enviada ao estoquista. Você será notificado quando for atendida.</p>
      <button
        class="mt-6 py-2.5 px-6 rounded-xl text-sm font-bold text-guardian-600 bg-guardian-50 hover:bg-guardian-100 transition-all"
        @click="novaRequisicao"
      >
        Nova requisição
      </button>
    </div>

    <!-- Active form -->
    <div v-else-if="dados" class="max-w-3xl mx-auto pb-36">
      <!-- Sticky controls -->
      <div class="sticky top-[53px] sm:top-[57px] z-20 bg-operacao-50 pt-3 pb-3 px-4 sm:px-6 space-y-2">
        <!-- Nome do solicitante -->
        <input
          v-model="solicitanteNome"
          type="text"
          placeholder="Seu nome (opcional)"
          class="w-full py-2.5 px-4 rounded-xl bg-white text-sm text-operacao-800 placeholder-operacao-300 ring-1 ring-operacao-200 focus:ring-2 focus:ring-guardian-500 focus:outline-none transition-shadow"
        />

        <!-- Search -->
        <div class="relative">
          <UIcon
            name="i-heroicons-magnifying-glass"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-operacao-300 pointer-events-none"
          />
          <input
            v-model="busca"
            type="text"
            placeholder="Buscar produto..."
            class="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white text-sm text-operacao-800 placeholder-operacao-300 ring-1 ring-operacao-200 focus:ring-2 focus:ring-guardian-500 focus:outline-none transition-shadow"
          />
          <button
            v-if="busca"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-operacao-300 hover:text-operacao-500"
            @click="busca = ''"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
        </div>

        <div class="flex items-center justify-between text-xs text-operacao-400">
          <p class="font-medium">
            {{ produtosFiltrados.length }} {{ produtosFiltrados.length === 1 ? 'produto' : 'produtos' }}
          </p>
          <p>
            <span class="font-semibold text-amber-600">{{ itensComQuantidade }}</span> itens selecionados
          </p>
        </div>
      </div>

      <!-- Product cards -->
      <div class="px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 gap-2 py-px">
        <div
          v-for="produto in produtosFiltrados"
          :key="produto.id"
          class="flex items-center gap-3 bg-white rounded-xl px-4 py-4 ring-1 transition-all duration-150"
          :class="quantidades[produto.id] != null && quantidades[produto.id] !== ''
            ? 'ring-amber-200 bg-amber-50/30'
            : 'ring-operacao-100'"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-operacao-800 leading-tight">{{ produto.nome }}</p>
            <p class="text-[11px] text-operacao-400 mt-0.5">{{ produto.unidade }}</p>
          </div>
          <div class="relative flex-shrink-0">
            <input
              :value="formatInputDisplay(quantidades[produto.id])"
              type="text"
              inputmode="decimal"
              :placeholder="isUnidade(produto.unidade) ? '0' : '0,000'"
              class="w-24 h-10 text-right pr-9 pl-3 rounded-xl bg-operacao-50 text-sm font-bold text-operacao-800 placeholder-operacao-300 ring-1 ring-inset ring-operacao-200 focus:ring-2 focus:ring-inset focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
              @input="onQuantidadeInput(produto.id, $event)"
              @focus="($event.target as HTMLInputElement).select()"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-operacao-400 pointer-events-none">
              {{ abreviarUnidade(produto.unidade) }}
            </span>
          </div>
        </div>

        <div v-if="produtosFiltrados.length === 0" class="col-span-full py-12 text-center">
          <UIcon name="i-heroicons-magnifying-glass" class="w-8 h-8 text-operacao-200 mx-auto mb-2" />
          <p class="text-sm text-operacao-400">Nenhum produto encontrado</p>
        </div>
      </div>
    </div>

    <!-- Fixed footer -->
    <div
      v-if="dados && !enviado && !erro"
      class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-operacao-100 safe-area-bottom"
    >
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-3">
        <button
          :disabled="itensComQuantidade === 0"
          class="w-full sm:w-auto sm:min-w-[200px] sm:float-right py-3 sm:py-2.5 px-6 rounded-xl text-sm font-bold text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          :class="itensComQuantidade > 0
            ? 'bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-500/20'
            : 'bg-operacao-300'"
          @click="abrirRevisao"
        >
          <span v-if="itensComQuantidade > 0">
            Revisar ({{ itensComQuantidade }} {{ itensComQuantidade === 1 ? 'item' : 'itens' }})
          </span>
          <span v-else>
            Selecione os itens necessários
          </span>
        </button>
      </div>
    </div>

    <!-- Review Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="modoRevisao"
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          <!-- Backdrop -->
          <div
            class="absolute inset-0 bg-operacao-900/50 backdrop-blur-sm"
            @click="modoRevisao = false"
          />

          <!-- Modal content -->
          <div class="relative w-full sm:max-w-lg max-h-[85vh] bg-white rounded-t-2xl sm:rounded-2xl flex flex-col shadow-xl">
            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-operacao-100 flex-shrink-0">
              <div>
                <h3 class="text-base font-bold text-operacao-800">Revisão da Requisição</h3>
                <p class="text-xs text-operacao-400 mt-0.5">{{ dados?.setor?.nome }} &middot; {{ itensComQuantidade }} itens</p>
              </div>
              <button
                class="p-1.5 rounded-lg text-operacao-400 hover:text-operacao-600 hover:bg-operacao-100 transition-colors"
                @click="modoRevisao = false"
              >
                <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
              </button>
            </div>

            <!-- Items list -->
            <div class="flex-1 overflow-y-auto px-5 py-3 space-y-1.5">
              <div
                v-for="item in itensRevisao"
                :key="item.id"
                class="flex items-center justify-between py-2.5 px-3 rounded-lg bg-operacao-50"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-operacao-800 leading-tight">{{ item.nome }}</p>
                  <p class="text-[11px] text-operacao-400">{{ item.unidade }}</p>
                </div>
                <span class="text-sm font-bold text-amber-600 tabular-nums ml-3">
                  {{ formatQuantidade(quantidades[item.id], item.unidade) }}
                </span>
              </div>
            </div>

            <!-- Observação -->
            <div class="px-5 py-2 border-t border-operacao-100">
              <input
                v-model="observacao"
                type="text"
                placeholder="Observação (opcional)"
                class="w-full py-2 px-3 rounded-lg text-sm text-operacao-800 placeholder-operacao-300 ring-1 ring-operacao-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <!-- Footer buttons -->
            <div class="flex gap-3 px-5 py-4 border-t border-operacao-100 flex-shrink-0 safe-area-bottom">
              <button
                class="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-operacao-600 bg-operacao-100 hover:bg-operacao-200 transition-all active:scale-[0.98]"
                @click="modoRevisao = false"
              >
                Voltar
              </button>
              <button
                :disabled="salvando"
                class="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                @click="enviarRequisicao"
              >
                <span v-if="salvando" class="flex items-center justify-center gap-2">
                  <span class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  Enviando...
                </span>
                <span v-else>Enviar Requisição</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const token = computed(() => route.params.token as string)
const toast = useToast()

const loading = ref(true)
const erro = ref(false)
const dados = ref<any>(null)
const busca = ref('')
const quantidades = ref<Record<string, number | null>>({})
const solicitanteNome = ref('')
const observacao = ref('')
const salvando = ref(false)
const enviado = ref(false)
const modoRevisao = ref(false)

// Load data
const carregarDados = async () => {
  loading.value = true
  erro.value = false
  try {
    const res = await $fetch(`/api/requisicao/${token.value}`)
    dados.value = res
  } catch {
    erro.value = true
  } finally {
    loading.value = false
  }
}

onMounted(carregarDados)

// Filtered products
const produtosFiltrados = computed(() => {
  if (!dados.value?.produtos) return []
  const term = busca.value.toLowerCase()
  return dados.value.produtos.filter((p: any) =>
    !term || p.nome.toLowerCase().includes(term)
  )
})

// Items with quantity > 0
const itensComQuantidade = computed(() => {
  return Object.values(quantidades.value).filter(v => v != null && v !== '' && Number(v) > 0).length
})

// Items for review
const itensRevisao = computed(() => {
  if (!dados.value?.produtos) return []
  return dados.value.produtos.filter((p: any) => {
    const q = quantidades.value[p.id]
    return q != null && q !== '' && Number(q) > 0
  })
})

// Unit helpers (same as contagem)
const isUnidade = (unidade?: string): boolean => {
  if (!unidade) return true
  const u = unidade.toLowerCase()
  return u.includes('un') || u.includes('unidade') || u.includes('pc') || u.includes('pç') || u.includes('caixa') || u.includes('cx') || u.includes('garrafa') || u.includes('grf') || u.includes('lata') || u.includes('pacote') || u.includes('pct')
}

const abreviarUnidade = (unidade?: string): string => {
  if (!unidade) return 'un'
  const u = unidade.toLowerCase()
  if (u.includes('quilograma') || u === 'kg') return 'kg'
  if (u.includes('grama') || u === 'g') return 'g'
  if (u.includes('litro') || u === 'l' || u === 'lt') return 'L'
  if (u.includes('mililitro') || u === 'ml') return 'mL'
  if (u.includes('unidade') || u === 'un' || u === 'und') return 'un'
  if (u.includes('caixa') || u === 'cx') return 'cx'
  if (u.includes('pacote') || u === 'pct') return 'pct'
  if (u.includes('garrafa') || u === 'grf') return 'grf'
  if (u.includes('lata')) return 'lata'
  return unidade.length > 4 ? unidade.slice(0, 3) : unidade
}

const formatInputDisplay = (val: number | null | undefined): string => {
  if (val == null || val === '') return ''
  return String(val).replace('.', ',')
}

const formatQuantidade = (val: number | null | undefined, unidade?: string): string => {
  if (val == null) return '—'
  const num = Number(val)
  const abrev = abreviarUnidade(unidade)
  if (Number.isInteger(num)) return `${num} ${abrev}`
  return `${num.toFixed(3).replace('.', ',')} ${abrev}`
}

// Input handler
const onQuantidadeInput = (produtoId: string, event: Event) => {
  const input = event.target as HTMLInputElement
  let val = input.value.replace(',', '.')
  val = val.replace(/[^0-9.]/g, '')
  const parts = val.split('.')
  if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')

  if (val === '' || val === null) {
    quantidades.value[produtoId] = null
  } else {
    quantidades.value[produtoId] = Number(val)
  }
}

// Open review
const abrirRevisao = () => {
  modoRevisao.value = true
}

// Send requisition
const enviarRequisicao = async () => {
  salvando.value = true
  try {
    const itens = Object.entries(quantidades.value)
      .filter(([_, q]) => q != null && q !== '' && Number(q) > 0)
      .map(([produto_id, quantidade]) => ({ produto_id, quantidade: Number(quantidade) }))

    await $fetch(`/api/requisicao/${token.value}`, {
      method: 'POST',
      body: {
        solicitante_nome: solicitanteNome.value || undefined,
        observacao: observacao.value || undefined,
        itens
      }
    })

    modoRevisao.value = false
    enviado.value = true
  } catch (e: any) {
    toast.add({ title: 'Erro ao enviar', description: e?.data?.message || e?.message, color: 'red' })
  } finally {
    salvando.value = false
  }
}

// New requisition
const novaRequisicao = () => {
  enviado.value = false
  quantidades.value = {}
  solicitanteNome.value = ''
  observacao.value = ''
}
</script>

<style scoped>
.safe-area-bottom {
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}

.modal-enter-active {
  transition: all 0.25s ease-out;
}
.modal-leave-active {
  transition: all 0.2s ease-in;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: translateY(100%);
}
</style>
