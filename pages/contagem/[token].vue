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
              {{ dados?.contagem?.nome || 'Contagem' }}
            </h1>
            <p class="text-[11px] sm:text-xs text-operacao-400">
              {{ formatarData(dados?.contagem?.data) }}
              <span v-if="dados?.contagem?.responsaveis_data?.length > 0" class="ml-1">
                &middot; {{ dados.contagem.responsaveis_data.map((r: any) => r.nome).join(', ') }}
              </span>
              <span v-else-if="dados?.contagem?.responsavel_nome" class="ml-1">
                &middot; {{ dados.contagem.responsavel_nome }}
              </span>
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-24">
      <div class="animate-spin rounded-full h-10 w-10 border-[3px] border-operacao-200 border-t-guardian-500" />
      <p class="text-sm text-operacao-400 mt-4">Carregando contagem...</p>
    </div>

    <!-- Error -->
    <div v-else-if="erro" class="flex flex-col items-center justify-center py-24 px-6 text-center max-w-sm mx-auto">
      <div
        class="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        :class="erro === 'finalizada' ? 'bg-controle-50' : 'bg-red-50'"
      >
        <UIcon
          :name="erro === 'finalizada' ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-triangle'"
          class="w-8 h-8"
          :class="erro === 'finalizada' ? 'text-controle-500' : 'text-red-400'"
        />
      </div>
      <h2 class="text-lg font-bold text-operacao-800 mb-1">
        {{ erro === 'finalizada' ? 'Contagem finalizada' : 'Link inválido' }}
      </h2>
      <p class="text-sm text-operacao-400">
        {{ erro === 'finalizada' ? 'Esta contagem já foi concluída. Obrigado!' : 'Este link de contagem não é válido ou não existe.' }}
      </p>
    </div>

    <!-- Success -->
    <div v-else-if="contagemCompleta" class="flex flex-col items-center justify-center py-24 px-6 text-center max-w-sm mx-auto">
      <div class="w-20 h-20 rounded-full bg-controle-50 flex items-center justify-center mb-5">
        <UIcon name="i-heroicons-check-circle" class="w-10 h-10 text-controle-500" />
      </div>
      <h2 class="text-lg font-bold text-operacao-800 mb-1">Contagem concluída!</h2>
      <p class="text-sm text-operacao-400">Todos os setores foram contados com sucesso. Obrigado!</p>
    </div>

    <!-- Active counting -->
    <div v-else-if="dados" class="max-w-3xl mx-auto pb-36">
      <!-- Setor selector + Search (sticky together) -->
      <div class="sticky top-[53px] sm:top-[57px] z-20 bg-operacao-50 pt-3 pb-3 px-4 sm:px-6 space-y-2">
        <!-- Stepper horizontal -->
        <div v-if="dados.setores.length > 1" class="bg-white rounded-xl ring-1 ring-operacao-200 px-4 py-3">
          <div class="flex items-center justify-center overflow-x-auto py-1 px-1">
            <template v-for="(s, i) in dados.setores" :key="s.id">
              <!-- Connector line -->
              <div
                v-if="i > 0"
                class="h-0.5 flex-1 min-w-4 max-w-10 mx-0.5 rounded-full transition-colors"
                :class="s.status === 'finalizado' || dados.setores[i - 1]?.status === 'finalizado' ? 'bg-controle-300' : 'bg-operacao-200'"
              />
              <!-- Step dot -->
              <button
                @click="setorAtivo = s.id"
                class="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-150 focus:outline-none"
                :class="[
                  s.status === 'finalizado'
                    ? 'bg-controle-500 text-white'
                    : s.id === setorAtivo
                      ? 'bg-guardian-500 text-white ring-4 ring-guardian-100'
                      : 'bg-operacao-100 text-operacao-400 hover:bg-operacao-200'
                ]"
                :title="s.nome"
              >
                <UIcon v-if="s.status === 'finalizado'" name="i-heroicons-check-20-solid" class="w-4.5 h-4.5" />
                <span v-else>{{ i + 1 }}</span>
              </button>
            </template>
          </div>
          <!-- Active sector label -->
          <p class="text-center text-xs text-operacao-500 mt-2">
            <span class="font-semibold text-operacao-700">{{ setorAtual?.nome }}</span>
            <span class="text-operacao-300 mx-1">&middot;</span>
            Setor {{ setorAtivoIndex + 1 }} de {{ dados.setores.length }}
          </p>
        </div>

        <!-- Single sector: just show name -->
        <div v-else class="bg-white rounded-xl ring-1 ring-operacao-200 px-4 py-3">
          <p class="text-sm font-medium text-operacao-800 text-center">{{ setorAtual?.nome }}</p>
        </div>

        <!-- Finalized sector banner -->
        <div v-if="setorFinalizado" class="flex items-center gap-2 px-4 py-3 rounded-xl bg-controle-50 text-controle-700 text-sm font-medium">
          <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5 text-controle-500 flex-shrink-0" />
          Este setor já foi salvo
        </div>

        <!-- Search + count (editing mode only) -->
        <template v-if="!setorFinalizado">
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
              <span class="font-semibold text-guardian-600">{{ preenchidosSetorAtual }}</span> / {{ totalSetorAtual }} contados
            </p>
          </div>
        </template>
      </div>

      <!-- Product cards: read-only (finalized sector) -->
      <div v-if="setorFinalizado" class="px-4 sm:px-6 space-y-1.5">
        <div
          v-for="produto in setorAtual?.produtos || []"
          :key="produto.id"
          class="flex items-center justify-between bg-white rounded-xl px-4 py-3 ring-1 ring-operacao-100"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-operacao-800 leading-tight">{{ produto.nome }}</p>
            <p class="text-[11px] text-operacao-400 mt-0.5">{{ produto.unidade }}</p>
          </div>
          <span class="text-sm font-bold text-operacao-800 tabular-nums ml-3">
            {{ formatQuantidade(quantidades[setorAtivo]?.[produto.id], produto.unidade) }}
          </span>
        </div>
      </div>

      <!-- Product cards: editable (normal mode) -->
      <div v-else class="px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div
          v-for="produto in produtosFiltrados"
          :key="produto.id"
          class="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 ring-1 transition-all duration-150"
          :class="quantidades[setorAtivo]?.[produto.id] != null && quantidades[setorAtivo]?.[produto.id] !== ''
            ? 'ring-controle-200 bg-controle-50/30'
            : 'ring-operacao-100'"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-operacao-800 leading-tight">{{ produto.nome }}</p>
            <p class="text-[11px] text-operacao-400 mt-0.5">{{ produto.unidade }}</p>
          </div>
          <div class="relative flex-shrink-0">
            <input
              :value="formatInputDisplay(quantidades[setorAtivo]?.[produto.id])"
              type="text"
              inputmode="decimal"
              :placeholder="isUnidade(produto.unidade) ? '0' : '0,000'"
              class="w-24 h-10 text-right pr-9 pl-3 rounded-xl bg-operacao-50 text-sm font-bold text-operacao-800 placeholder-operacao-300 ring-1 ring-operacao-200 focus:ring-2 focus:ring-guardian-500 focus:bg-white focus:outline-none transition-all"
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

    <!-- Fixed footer (hidden for finalized sectors) -->
    <div
      v-if="dados && !contagemCompleta && !erro && !setorFinalizado"
      class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-operacao-100 safe-area-bottom"
    >
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-3">
        <!-- Progress bar -->
        <div class="flex items-center gap-3 mb-3">
          <div class="flex-1 bg-operacao-100 rounded-full h-2 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500 ease-out"
              :class="progressoAtual >= 100 ? 'bg-controle-500' : 'bg-guardian-500'"
              :style="{ width: `${progressoAtual}%` }"
            />
          </div>
          <span
            class="text-xs font-bold w-10 text-right"
            :class="progressoAtual >= 100 ? 'text-controle-600' : 'text-guardian-600'"
          >{{ progressoAtual }}%</span>
        </div>

        <!-- Normal mode: Revisar e Salvar -->
        <button
          :disabled="!todosPreenchidos"
          class="w-full sm:w-auto sm:min-w-[200px] sm:float-right py-3 sm:py-2.5 px-6 rounded-xl text-sm font-bold text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          :class="todosPreenchidos
            ? 'bg-controle-500 hover:bg-controle-600 shadow-sm shadow-controle-500/20'
            : 'bg-guardian-500'"
          @click="abrirRevisao"
        >
          <span v-if="todosPreenchidos">
            Revisar e Salvar
          </span>
          <span v-else>
            {{ preenchidosSetorAtual }} de {{ totalSetorAtual }} contados
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
                <h3 class="text-base font-bold text-operacao-800">Revisão — {{ setorAtual?.nome }}</h3>
                <p class="text-xs text-operacao-400 mt-0.5">{{ totalSetorAtual }} produtos</p>
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
                v-for="produto in setorAtual?.produtos || []"
                :key="produto.id"
                class="flex items-center justify-between py-2.5 px-3 rounded-lg"
                :class="quantidades[setorAtivo]?.[produto.id] != null ? 'bg-operacao-50' : 'opacity-40'"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-operacao-800 leading-tight">{{ produto.nome }}</p>
                  <p class="text-[11px] text-operacao-400">{{ produto.unidade }}</p>
                </div>
                <span class="text-sm font-bold text-operacao-800 tabular-nums ml-3">
                  {{ formatQuantidade(quantidades[setorAtivo]?.[produto.id], produto.unidade) }}
                </span>
              </div>
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
                class="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-controle-500 hover:bg-controle-600 shadow-sm shadow-controle-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                @click="confirmarSetor"
              >
                <span v-if="salvando" class="flex items-center justify-center gap-2">
                  <span class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  Salvando...
                </span>
                <span v-else>Confirmar</span>
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
const erro = ref<string | null>(null)
const dados = ref<any>(null)
const setorAtivo = ref<string>('')
const busca = ref('')
const quantidades = ref<Record<string, Record<string, number | null>>>({})
const salvando = ref(false)
const contagemCompleta = ref(false)
const modoRevisao = ref(false)

// Load data
const carregarDados = async () => {
  loading.value = true
  erro.value = null
  try {
    const res = await $fetch(`/api/contagem/${token.value}`)
    dados.value = res
    if (res.setores?.length > 0) {
      // Check if all sectors are already 100% (counting done but pending admin review)
      const todosCompletos = res.setores.every((s: any) => (s.progresso || 0) >= 100)
      if (todosCompletos) {
        contagemCompleta.value = true
        return
      }
      // Select first incomplete setor, or first one
      const incompleto = res.setores.find((s: any) => (s.progresso || 0) < 100)
      setorAtivo.value = incompleto?.id || res.setores[0].id
      // Load existing quantities (keyed by setor → produto)
      for (const setor of res.setores) {
        quantidades.value[setor.id] = {}
        for (const p of setor.produtos) {
          if (p.quantidade_contada !== null && p.quantidade_contada !== undefined) {
            quantidades.value[setor.id][p.id] = p.quantidade_contada
          }
        }
      }
    }
  } catch (e: any) {
    if (e?.statusCode === 410) {
      erro.value = 'finalizada'
    } else {
      erro.value = 'invalido'
    }
  } finally {
    loading.value = false
  }
}

onMounted(carregarDados)

// Current setor
const setorAtual = computed(() => {
  return dados.value?.setores?.find((s: any) => s.id === setorAtivo.value)
})

const setorAtivoIndex = computed(() => {
  return dados.value?.setores?.findIndex((s: any) => s.id === setorAtivo.value) ?? 0
})

const produtosFiltrados = computed(() => {
  if (!setorAtual.value) return []
  const term = busca.value.toLowerCase()
  return setorAtual.value.produtos.filter((p: any) =>
    !term || p.nome.toLowerCase().includes(term)
  )
})

// Progress of current setor
const totalSetorAtual = computed(() => setorAtual.value?.produtos?.length || 0)

const preenchidosSetorAtual = computed(() => {
  if (!setorAtual.value) return 0
  const setorQtds = quantidades.value[setorAtivo.value] || {}
  return setorAtual.value.produtos.filter(
    (p: any) => setorQtds[p.id] != null && setorQtds[p.id] !== ''
  ).length
})

const progressoAtual = computed(() => {
  if (!totalSetorAtual.value) return 0
  return Math.round((preenchidosSetorAtual.value / totalSetorAtual.value) * 100)
})

// Unit helpers
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
  // Return first 3 chars
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

// Input handler — accepts comma and dot as decimal separator
const onQuantidadeInput = (produtoId: string, event: Event) => {
  const input = event.target as HTMLInputElement
  let val = input.value.replace(',', '.')
  // Allow only numbers, dots, and empty
  val = val.replace(/[^0-9.]/g, '')
  // Prevent multiple dots
  const parts = val.split('.')
  if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')

  if (!quantidades.value[setorAtivo.value]) quantidades.value[setorAtivo.value] = {}
  if (val === '' || val === null) {
    quantidades.value[setorAtivo.value][produtoId] = null
  } else {
    quantidades.value[setorAtivo.value][produtoId] = Number(val)
  }
}

const setorFinalizado = computed(() => {
  return setorAtual.value?.status === 'finalizado'
})

const todosPreenchidos = computed(() => {
  return totalSetorAtual.value > 0 && preenchidosSetorAtual.value === totalSetorAtual.value
})

// Reset state when switching sectors
watch(setorAtivo, () => {
  modoRevisao.value = false
  busca.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

const formatarData = (data?: string) => {
  if (!data) return ''
  const d = data.includes('T') ? new Date(data) : new Date(data + 'T00:00:00')
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

// Open review modal
const abrirRevisao = () => {
  modoRevisao.value = true
}

// Confirm and save sector (called from review modal)
const confirmarSetor = async () => {
  if (!setorAtual.value) return
  salvando.value = true

  const setorQtds = quantidades.value[setorAtivo.value] || {}
  const itens = setorAtual.value.produtos
    .filter((p: any) => setorQtds[p.id] != null && setorQtds[p.id] !== '')
    .map((p: any) => ({
      produto_id: p.id,
      quantidade_contada: setorQtds[p.id]
    }))

  try {
    const res = await $fetch(`/api/contagem/${token.value}`, {
      method: 'POST',
      body: {
        setor_id: setorAtivo.value,
        itens
      }
    })

    if (res.saved === 0) {
      toast.add({ title: 'Erro', description: 'Nenhum item foi salvo. Verifique as quantidades.', color: 'red' })
      return
    }

    if (res.contagemCompleta) {
      modoRevisao.value = false
      contagemCompleta.value = true
    } else {
      toast.add({ title: 'Setor salvo!', color: 'green', icon: 'i-heroicons-check-circle' })
      // Update local state
      if (setorAtual.value) {
        setorAtual.value.progresso = res.progresso
        setorAtual.value.status = res.setorFinalizado ? 'finalizado' : 'em_andamento'
      }
      modoRevisao.value = false
      // Auto-switch to next incomplete setor
      if (res.setorFinalizado) {
        const proximo = dados.value.setores.find(
          (s: any) => s.id !== setorAtivo.value && s.status !== 'finalizado'
        )
        if (proximo) {
          setorAtivo.value = proximo.id
        }
      }
    }
  } catch (e: any) {
    toast.add({ title: 'Erro ao salvar', description: e?.data?.message || e?.message, color: 'red' })
  } finally {
    salvando.value = false
  }
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
