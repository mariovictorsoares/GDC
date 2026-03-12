<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-4 py-4">
      <div class="flex items-center gap-3">
        <img src="/logo.png" alt="CMV360" class="h-8 w-8" />
        <div>
          <h1 class="text-lg font-semibold text-gray-900">{{ dados?.contagem?.nome || 'Contagem' }}</h1>
          <p class="text-sm text-gray-500">{{ formatarData(dados?.contagem?.data) }}</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-guardian-500" />
    </div>

    <!-- Error: Token inválido -->
    <div v-else-if="erro" class="flex flex-col items-center justify-center py-20 px-6 text-center">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 text-red-400 mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ erro === 'finalizada' ? 'Contagem finalizada' : 'Link inválido' }}</h2>
      <p class="text-gray-500">
        {{ erro === 'finalizada' ? 'Esta contagem já foi concluída.' : 'Este link de contagem não é válido ou não existe.' }}
      </p>
    </div>

    <!-- Sucesso -->
    <div v-else-if="contagemCompleta" class="flex flex-col items-center justify-center py-20 px-6 text-center">
      <UIcon name="i-heroicons-check-circle" class="w-16 h-16 text-green-500 mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Contagem concluída!</h2>
      <p class="text-gray-500">Todos os setores foram contados. Obrigado!</p>
    </div>

    <!-- Contagem ativa -->
    <div v-else-if="dados" class="pb-32">
      <!-- Seletor de setor -->
      <div class="px-4 py-3 bg-white border-b">
        <label class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Setor</label>
        <select
          v-model="setorAtivo"
          class="w-full rounded-lg border-gray-300 text-sm focus:ring-guardian-500 focus:border-guardian-500"
        >
          <option v-for="s in dados.setores" :key="s.id" :value="s.id">
            {{ s.nome }} ({{ s.tipo === 'apoio' ? 'Apoio' : 'Principal' }})
            {{ s.progresso > 0 ? `— ${s.progresso}%` : '' }}
          </option>
        </select>
      </div>

      <!-- Busca -->
      <div class="px-4 py-2 bg-white border-b">
        <UInput
          v-model="busca"
          icon="i-heroicons-magnifying-glass"
          placeholder="Buscar produto..."
          size="sm"
        />
      </div>

      <!-- Lista de produtos -->
      <div class="divide-y divide-gray-100">
        <div
          v-for="produto in produtosFiltrados"
          :key="produto.id"
          class="flex items-center justify-between px-4 py-3 bg-white"
        >
          <div class="flex-1 min-w-0 mr-3">
            <p class="text-sm font-medium text-gray-900 truncate">{{ produto.nome }}</p>
            <p class="text-xs text-gray-400">{{ produto.unidade }}</p>
          </div>
          <input
            v-model.number="quantidades[produto.id]"
            type="number"
            inputmode="decimal"
            min="0"
            step="any"
            placeholder="0"
            class="w-20 text-right rounded-lg border-gray-300 text-sm focus:ring-guardian-500 focus:border-guardian-500"
          />
        </div>

        <div v-if="produtosFiltrados.length === 0" class="py-8 text-center text-gray-400 text-sm">
          Nenhum produto encontrado
        </div>
      </div>
    </div>

    <!-- Footer fixo -->
    <div v-if="dados && !contagemCompleta && !erro" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-bottom">
      <!-- Barra de progresso -->
      <div class="flex items-center gap-2 mb-3">
        <div class="flex-1 bg-gray-200 rounded-full h-2">
          <div
            class="bg-guardian-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${progressoAtual}%` }"
          />
        </div>
        <span class="text-xs font-medium text-gray-500 w-10 text-right">{{ progressoAtual }}%</span>
      </div>

      <UButton
        block
        :loading="salvando"
        :disabled="salvando"
        color="primary"
        size="lg"
        @click="salvarSetor"
      >
        Salvar Setor
      </UButton>
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

// Carregar dados
const carregarDados = async () => {
  loading.value = true
  erro.value = null
  try {
    const res = await $fetch(`/api/contagem/${token.value}`)
    dados.value = res
    if (res.setores?.length > 0) {
      setorAtivo.value = res.setores[0].id
      // Carregar quantidades já contadas
      for (const setor of res.setores) {
        for (const p of setor.produtos) {
          if (p.quantidade_contada !== null) {
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

// Setor ativo
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

// Progresso do setor atual
const progressoAtual = computed(() => {
  if (!setorAtual.value) return 0
  const total = setorAtual.value.produtos.length
  if (!total) return 0
  const preenchidos = setorAtual.value.produtos.filter(
    (p: any) => quantidades.value[p.id] !== null && quantidades.value[p.id] !== undefined
  ).length
  return Math.round((preenchidos / total) * 100)
})

const formatarData = (data?: string) => {
  if (!data) return ''
  const d = new Date(data + 'T00:00:00')
  return d.toLocaleDateString('pt-BR')
}

// Salvar
const salvarSetor = async () => {
  if (!setorAtual.value) return
  salvando.value = true

  const itens = setorAtual.value.produtos
    .filter((p: any) => quantidades.value[p.id] !== null && quantidades.value[p.id] !== undefined)
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
      // Atualizar progresso local
      if (setorAtual.value) {
        setorAtual.value.progresso = res.progresso
        setorAtual.value.status = res.setorFinalizado ? 'finalizado' : 'em_andamento'
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
</style>
