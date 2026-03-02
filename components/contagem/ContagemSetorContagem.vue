<template>
  <div class="space-y-4">
    <!-- Header with back button -->
    <div class="flex items-center gap-3">
      <UButton
        color="gray"
        variant="ghost"
        icon="i-heroicons-arrow-left"
        size="sm"
        @click="emit('voltar')"
      />
      <h2 class="text-lg font-bold text-operacao-800">{{ setor.nome }}</h2>
    </div>

    <!-- Progress bar (top) -->
    <div class="bg-white rounded-lg border border-operacao-200 p-4">
      <div class="flex items-center justify-between">
        <UButton color="primary" :loading="salvando" @click="salvar">
          <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1" />
          Salvar
        </UButton>
        <span class="text-sm font-bold text-operacao-700">
          Progresso: {{ itensContados }} de {{ itens.length }} insumos
        </span>
      </div>
      <div class="w-full bg-operacao-200 rounded-full h-1.5 mt-3">
        <div
          class="h-1.5 rounded-full transition-all duration-500"
          :class="[
            progressoPercent >= 100
              ? 'bg-green-500'
              : progressoPercent > 0
                ? 'bg-amber-500'
                : 'bg-operacao-300'
          ]"
          :style="{ width: progressoPercent + '%' }"
        />
      </div>
    </div>

    <!-- Search -->
    <UInput
      v-model="buscaContagem"
      placeholder="Buscar produto..."
      icon="i-heroicons-magnifying-glass"
    />

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <div
        v-for="n in 8"
        :key="n"
        class="bg-white rounded-lg border border-operacao-100 p-4 animate-pulse"
      >
        <div class="flex items-center gap-4">
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-operacao-200 rounded w-3/4" />
            <div class="h-3 bg-operacao-100 rounded w-1/4" />
          </div>
          <div class="w-36 h-8 bg-operacao-200 rounded" />
        </div>
      </div>
    </div>

    <!-- Product list -->
    <UCard v-else :ui="{ body: { padding: '' } }">
      <div class="divide-y divide-operacao-100">
        <div
          v-for="(item, i) in itensFiltrados"
          :key="item.produto_id"
          class="px-4 sm:px-6 py-3"
        >
          <div class="flex items-center gap-4">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-operacao-800 truncate">{{ item.nome }}</p>
              <p class="text-xs text-operacao-400">{{ item.unidade_sigla }}</p>
            </div>
            <div class="w-36 sm:w-44">
              <UInput
                :model-value="item.quantidade_contada ?? undefined"
                type="number"
                step="0.0001"
                min="0"
                placeholder="Qtd."
                size="sm"
                :ui="{ base: 'text-center font-mono text-base' }"
                @update:model-value="atualizarQuantidade(item.produto_id, $event)"
                @keydown.enter="focarProximo(i)"
                :ref="(el: any) => setInputRef(i, el)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty states -->
      <div
        v-if="!loading && itens.length === 0"
        class="p-8 text-center text-operacao-400"
      >
        <UIcon name="i-heroicons-cube-transparent" class="w-10 h-10 mx-auto mb-2" />
        <p class="text-sm">Nenhum produto vinculado a este setor.</p>
      </div>
      <div
        v-else-if="!loading && itensFiltrados.length === 0 && buscaContagem"
        class="p-8 text-center text-operacao-400"
      >
        <UIcon name="i-heroicons-magnifying-glass" class="w-10 h-10 mx-auto mb-2" />
        <p class="text-sm">Nenhum produto encontrado para "{{ buscaContagem }}".</p>
      </div>
    </UCard>

    <!-- Progress bar (bottom) -->
    <div class="bg-white rounded-lg border border-operacao-200 p-4">
      <div class="flex items-center justify-between">
        <UButton color="primary" :loading="salvando" @click="salvar">
          <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1" />
          Salvar
        </UButton>
        <span class="text-sm font-bold text-operacao-700">
          Progresso: {{ itensContados }} de {{ itens.length }} insumos
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SetorProduto, ContagemItemDB } from '~/types'

const props = defineProps<{
  contagemId: string
  setor: { id: string; nome: string }
}>()

const emit = defineEmits<{
  'salvo': [progresso: number]
  'voltar': []
}>()

const toast = useToast()
const { getSetorProdutos, getContagemItens, upsertContagemItens, updateContagemSetor } = useEstoque()

// State
const loading = ref(true)
const salvando = ref(false)
const produtosSetor = ref<SetorProduto[]>([])
const itens = ref<{ produto_id: string; nome: string; unidade_sigla: string; quantidade_contada: number | null }[]>([])
const buscaContagem = ref('')
const inputRefs = ref<Record<number, any>>({})

// Load data on mount
onMounted(async () => {
  try {
    loading.value = true

    // Load sector products and existing saved items in parallel
    const [prods, savedItems] = await Promise.all([
      getSetorProdutos(props.setor.id),
      getContagemItens(props.contagemId, props.setor.id)
    ])
    produtosSetor.value = prods

    // Build items list merging products with saved quantities
    const savedMap = new Map<string, number | null>()
    for (const item of savedItems) {
      savedMap.set(item.produto_id, item.quantidade_contada)
    }

    itens.value = prods
      .map(sp => ({
        produto_id: sp.produto_id,
        nome: sp.produto?.nome || '',
        unidade_sigla: sp.produto?.unidade?.sigla || '',
        quantidade_contada: savedMap.get(sp.produto_id) ?? null
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message, color: 'red' })
  } finally {
    loading.value = false
  }
})

// Computed
const itensFiltrados = computed(() => {
  if (!buscaContagem.value) return itens.value
  const termo = buscaContagem.value.toLowerCase().trim()
  return itens.value.filter(item =>
    item.nome.toLowerCase().includes(termo) ||
    item.unidade_sigla.toLowerCase().includes(termo)
  )
})

const itensContados = computed(() => {
  return itens.value.filter(i => i.quantidade_contada !== null && i.quantidade_contada !== undefined).length
})

const progressoPercent = computed(() => {
  if (itens.value.length === 0) return 100
  return Math.round((itensContados.value / itens.value.length) * 100)
})

// Methods
const atualizarQuantidade = (produtoId: string, valor: any) => {
  const item = itens.value.find(i => i.produto_id === produtoId)
  if (item) {
    item.quantidade_contada = valor === '' || valor === null || valor === undefined ? null : Number(valor)
  }
}

const salvar = async () => {
  try {
    salvando.value = true

    await upsertContagemItens(
      props.contagemId,
      props.setor.id,
      itens.value.map(i => ({
        produto_id: i.produto_id,
        quantidade_contada: i.quantidade_contada
      }))
    )

    // Update sector progress
    const prog = itens.value.length > 0
      ? Math.round((itensContados.value / itens.value.length) * 100)
      : 100

    await updateContagemSetor(props.contagemId, props.setor.id, {
      progresso: prog,
      status: prog >= 100 ? 'finalizado' : 'em_andamento',
      finalizado_em: prog >= 100 ? new Date().toISOString() : null
    })

    toast.add({
      title: 'Salvo!',
      description: `${itensContados.value} de ${itens.value.length} produtos salvos`,
      color: 'green'
    })

    emit('salvo', prog)
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message, color: 'red' })
  } finally {
    salvando.value = false
  }
}

const focarProximo = (currentIndex: number) => {
  const nextEl = inputRefs.value[currentIndex + 1]
  if (nextEl?.$el) {
    const input = nextEl.$el.querySelector('input')
    if (input) input.focus()
  }
}

const setInputRef = (index: number, el: any) => {
  if (el) inputRefs.value[index] = el
}
</script>
