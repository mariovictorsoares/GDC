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
              <span v-if="dados?.contagem?.responsavel_nome" class="ml-1">
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
      <!-- Setor tabs -->
      <div class="sticky top-[53px] sm:top-[57px] z-20 bg-operacao-50 pt-3 pb-2 px-4 sm:px-6">
        <div class="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            v-for="s in dados.setores"
            :key="s.id"
            class="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150"
            :class="setorAtivo === s.id
              ? 'bg-guardian-500 text-white shadow-sm'
              : s.progresso >= 100
                ? 'bg-controle-50 text-controle-700 ring-1 ring-controle-200'
                : 'bg-white text-operacao-500 ring-1 ring-operacao-200 hover:ring-operacao-300'"
            @click="setorAtivo = s.id"
          >
            <UIcon
              v-if="s.progresso >= 100"
              name="i-heroicons-check-circle-solid"
              class="w-4 h-4"
              :class="setorAtivo === s.id ? 'text-white' : 'text-controle-500'"
            />
            <span class="truncate max-w-[120px]">{{ s.nome }}</span>
            <span
              v-if="s.progresso > 0 && s.progresso < 100"
              class="text-xs opacity-75"
            >{{ s.progresso }}%</span>
          </button>
        </div>
      </div>

      <!-- Search + count row -->
      <div class="px-4 sm:px-6 pb-3">
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <!-- Search -->
          <div class="relative flex-1">
            <UIcon
              name="i-heroicons-magnifying-glass"
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-operacao-300 pointer-events-none"
            />
            <input
              v-model="busca"
              type="text"
              placeholder="Buscar produto..."
              class="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white text-sm text-operacao-800 placeholder-operacao-300 ring-1 ring-operacao-200 focus:ring-2 focus:ring-guardian-500 focus:outline-none transition-shadow"
            />
            <button
              v-if="busca"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-operacao-300 hover:text-operacao-500"
              @click="busca = ''"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </div>

          <!-- Products count -->
          <div class="flex items-center justify-between sm:justify-end sm:gap-4 text-xs text-operacao-400">
            <p class="font-medium">
              {{ produtosFiltrados.length }} {{ produtosFiltrados.length === 1 ? 'produto' : 'produtos' }}
            </p>
            <p>
              <span class="font-semibold text-guardian-600">{{ preenchidosSetorAtual }}</span> / {{ totalSetorAtual }} contados
            </p>
          </div>
        </div>
      </div>

      <!-- Product cards -->
      <div class="px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div
          v-for="produto in produtosFiltrados"
          :key="produto.id"
          class="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 ring-1 transition-all duration-150"
          :class="quantidades[produto.id] != null && quantidades[produto.id] !== ''
            ? 'ring-controle-200 bg-controle-50/30'
            : 'ring-operacao-100'"
        >
          <!-- Product info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-operacao-800 leading-tight">{{ produto.nome }}</p>
            <p class="text-[11px] text-operacao-400 mt-0.5">{{ produto.unidade }}</p>
          </div>

          <!-- Quantity input -->
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button
              class="w-8 h-8 rounded-lg bg-operacao-50 text-operacao-400 hover:bg-operacao-100 flex items-center justify-center transition-colors active:scale-95"
              @click="decrementar(produto.id)"
            >
              <UIcon name="i-heroicons-minus" class="w-3.5 h-3.5" />
            </button>
            <input
              :value="quantidades[produto.id] ?? ''"
              type="number"
              inputmode="decimal"
              min="0"
              step="any"
              placeholder="—"
              class="w-16 h-10 text-center rounded-xl bg-operacao-50 text-sm font-bold text-operacao-800 placeholder-operacao-300 ring-1 ring-operacao-200 focus:ring-2 focus:ring-guardian-500 focus:bg-white focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              @input="onQuantidadeInput(produto.id, $event)"
              @focus="($event.target as HTMLInputElement).select()"
            />
            <button
              class="w-8 h-8 rounded-lg bg-operacao-50 text-operacao-400 hover:bg-operacao-100 flex items-center justify-center transition-colors active:scale-95"
              @click="incrementar(produto.id)"
            >
              <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Empty -->
        <div v-if="produtosFiltrados.length === 0" class="col-span-full py-12 text-center">
          <UIcon name="i-heroicons-magnifying-glass" class="w-8 h-8 text-operacao-200 mx-auto mb-2" />
          <p class="text-sm text-operacao-400">Nenhum produto encontrado</p>
        </div>
      </div>
    </div>

    <!-- Fixed footer -->
    <div
      v-if="dados && !contagemCompleta && !erro"
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

        <button
          :disabled="salvando || preenchidosSetorAtual === 0"
          class="w-full sm:w-auto sm:min-w-[200px] sm:float-right py-3 sm:py-2.5 px-6 rounded-xl text-sm font-bold text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          :class="progressoAtual >= 100
            ? 'bg-controle-500 hover:bg-controle-600 shadow-sm shadow-controle-500/20'
            : 'bg-guardian-500 hover:bg-guardian-600 shadow-sm shadow-guardian-500/20'"
          @click="salvarSetor"
        >
          <span v-if="salvando" class="flex items-center justify-center gap-2">
            <span class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
            Salvando...
          </span>
          <span v-else>
            Salvar {{ setorAtual?.nome || 'Setor' }}
          </span>
        </button>
      </div>
    </div>
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
const quantidades = ref<Record<string, number | null>>({})
const salvando = ref(false)
const contagemCompleta = ref(false)

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
      // Load existing quantities
      for (const setor of res.setores) {
        for (const p of setor.produtos) {
          if (p.quantidade_contada !== null && p.quantidade_contada !== undefined) {
            quantidades.value[p.id] = p.quantidade_contada
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
  return setorAtual.value.produtos.filter(
    (p: any) => quantidades.value[p.id] != null && quantidades.value[p.id] !== ''
  ).length
})

const progressoAtual = computed(() => {
  if (!totalSetorAtual.value) return 0
  return Math.round((preenchidosSetorAtual.value / totalSetorAtual.value) * 100)
})

// Input handlers
const onQuantidadeInput = (produtoId: string, event: Event) => {
  const input = event.target as HTMLInputElement
  const val = input.value
  if (val === '' || val === null) {
    quantidades.value[produtoId] = null
  } else {
    quantidades.value[produtoId] = Number(val)
  }
}

const incrementar = (produtoId: string) => {
  const current = quantidades.value[produtoId]
  quantidades.value[produtoId] = (current ?? 0) + 1
}

const decrementar = (produtoId: string) => {
  const current = quantidades.value[produtoId]
  if (current != null && current > 0) {
    quantidades.value[produtoId] = current - 1
  } else {
    quantidades.value[produtoId] = 0
  }
}

const formatarData = (data?: string) => {
  if (!data) return ''
  const d = new Date(data + 'T00:00:00')
  return d.toLocaleDateString('pt-BR')
}

// Save
const salvarSetor = async () => {
  if (!setorAtual.value) return
  salvando.value = true

  const itens = setorAtual.value.produtos
    .filter((p: any) => quantidades.value[p.id] != null && quantidades.value[p.id] !== '')
    .map((p: any) => ({
      produto_id: p.id,
      quantidade_contada: quantidades.value[p.id]
    }))

  try {
    const res = await $fetch(`/api/contagem/${token.value}`, {
      method: 'POST',
      body: {
        setor_id: setorAtivo.value,
        itens
      }
    })

    if (res.contagemCompleta) {
      contagemCompleta.value = true
    } else {
      toast.add({ title: 'Setor salvo!', color: 'green', icon: 'i-heroicons-check-circle' })
      // Update local progress
      if (setorAtual.value) {
        setorAtual.value.progresso = res.progresso
        setorAtual.value.status = res.setorFinalizado ? 'finalizado' : 'em_andamento'
      }
      // Auto-switch to next incomplete setor
      if (res.setorFinalizado) {
        const proximo = dados.value.setores.find((s: any) => s.id !== setorAtivo.value && (s.progresso || 0) < 100)
        if (proximo) {
          setorAtivo.value = proximo.id
          busca.value = ''
          window.scrollTo({ top: 0, behavior: 'smooth' })
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

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
