<template>
  <USlideover
    :model-value="modelValue"
    :ui="{
      width: 'max-w-2xl',
      overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
      background: 'bg-white dark:bg-operacao-800'
    }"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="voltarListaSetores"
  >
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between px-6 py-4 border-b border-operacao-200">
        <div class="flex items-center gap-3">
          <template v-if="setorSelecionado">
            <UButton color="gray" variant="ghost" icon="i-heroicons-arrow-left" size="xs" @click="voltarListaSetores" />
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">{{ setorSelecionado.nome }}</h3>
              <p class="text-xs text-operacao-400">Gerencie os produtos deste setor</p>
            </div>
          </template>
          <template v-else>
            <div class="flex items-center justify-center w-10 h-10 bg-guardian-100 rounded-lg shrink-0">
              <UIcon name="i-heroicons-map-pin" class="w-5 h-5 text-guardian-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">Setores</h3>
              <p class="text-xs text-operacao-400">Organize suas contagens por área/setor</p>
            </div>
          </template>
        </div>
        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="$emit('update:modelValue', false)" />
      </div>

      <!-- TELA 1: Lista de Setores -->
      <div v-if="!setorSelecionado" class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div class="flex gap-2">
          <UInput
            v-model="novoSetorNome"
            placeholder="Nome do novo setor..."
            class="flex-1"
            @keydown.enter="adicionarSetor"
          />
          <USelect
            v-model="novoSetorTipo"
            :options="[{ label: 'Principal', value: 'principal' }, { label: 'Apoio', value: 'apoio' }]"
            size="sm"
            class="w-32"
          />
          <UButton color="primary" :loading="salvandoSetor" :disabled="!novoSetorNome.trim()" @click="adicionarSetor">
            <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          </UButton>
        </div>

        <div v-if="setores.length === 0" class="text-center py-12 text-operacao-400">
          <UIcon name="i-heroicons-map-pin" class="w-10 h-10 mb-3 mx-auto text-operacao-300" />
          <p class="text-sm font-medium">Nenhum setor cadastrado</p>
          <p class="text-xs text-operacao-400 mt-1">Ex: Camara Fria, Estoque Seco, Bar, Cozinha</p>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="setor in setores"
            :key="setor.id"
            class="flex items-center justify-between p-4 rounded-xl border border-operacao-200 hover:border-guardian-300 bg-white hover:bg-guardian-50/30 transition-all cursor-pointer group"
            @click="selecionarSetor(setor)"
          >
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 bg-operacao-100 group-hover:bg-guardian-100 rounded-lg transition-colors shrink-0">
                <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-operacao-400 group-hover:text-guardian-600 transition-colors" />
              </div>
              <div>
                <span class="font-medium text-operacao-800">{{ setor.nome }}</span>
                <span
                  class="ml-2 inline-flex items-center gap-1 px-1.5 rounded-full text-[9px] font-semibold uppercase tracking-wide align-middle relative -top-px"
                  :class="setor.tipo === 'apoio'
                    ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200/60'
                    : 'bg-blue-50 text-blue-600 ring-1 ring-blue-200/60'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="setor.tipo === 'apoio' ? 'bg-amber-400' : 'bg-blue-400'" />
                  {{ setor.tipo === 'apoio' ? 'Apoio' : 'Principal' }}
                </span>
                <p class="text-xs text-operacao-400">{{ setorProdutosCount[setor.id] || 0 }} {{ (setorProdutosCount[setor.id] || 0) === 1 ? 'produto' : 'produtos' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                color="red"
                variant="ghost"
                icon="i-heroicons-trash"
                size="xs"
                :loading="deletandoSetorId === setor.id"
                @click.stop="confirmarRemoverSetor(setor)"
              />
              <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-operacao-300 group-hover:text-guardian-500 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      <!-- TELA 2: Produtos do Setor (duas colunas) -->
      <div v-else class="flex-1 overflow-hidden flex flex-col">
        <div v-if="loadingSetorProdutos" class="flex-1 flex items-center justify-center">
          <div class="text-center space-y-3">
            <USkeleton class="h-6 w-40 mx-auto" />
            <USkeleton class="h-4 w-28 mx-auto" />
          </div>
        </div>

        <div v-else class="flex-1 flex flex-col sm:flex-row overflow-hidden">
          <!-- Coluna ESQUERDA: Produtos disponiveis -->
          <div class="sm:w-1/2 flex flex-col border-b sm:border-b-0 sm:border-r border-operacao-200 overflow-hidden">
            <div class="px-4 py-3 border-b border-operacao-100 bg-operacao-50 space-y-2">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-operacao-400 uppercase tracking-wider">Adicionar Produtos</p>
                <UButton
                  v-if="produtosDisponiveis.length > 0"
                  color="primary"
                  variant="soft"
                  size="xs"
                  :loading="adicionandoProdutos"
                  @click="adicionarTodosVisiveis"
                >
                  <UIcon name="i-heroicons-plus" class="w-3 h-3 mr-1" />
                  Todos ({{ produtosDisponiveis.length }})
                </UButton>
              </div>
              <USelect
                v-model="filtroGrupoSetor"
                :options="[{ label: 'Todos os grupos', value: '' }, ...grupos.map(g => ({ label: g.nome, value: g.id }))]"
                size="xs"
              />
              <USelect
                v-if="filtroGrupoSetor"
                v-model="filtroSubgrupoSetor"
                :options="[{ label: 'Todos os subgrupos', value: '' }, ...subgruposFiltro.map(s => ({ label: s.nome, value: s.id }))]"
                size="xs"
              />
              <UInput
                v-model="buscaProdutoSetor"
                placeholder="Buscar produto..."
                icon="i-heroicons-magnifying-glass"
                size="xs"
              />
            </div>

            <div class="flex-1 overflow-y-auto">
              <div v-if="produtosDisponiveis.length === 0" class="flex flex-col items-center justify-center py-8 text-operacao-400">
                <UIcon name="i-heroicons-check-circle" class="w-8 h-8 mb-2 text-controle-400" />
                <p class="text-sm">{{ buscaProdutoSetor || filtroGrupoSetor ? 'Nenhum produto encontrado' : 'Todos vinculados' }}</p>
              </div>

              <div v-else class="divide-y divide-operacao-50">
                <div
                  v-for="prod in produtosDisponiveis.slice(0, 100)"
                  :key="prod.id"
                  class="flex items-center justify-between px-4 py-2 hover:bg-controle-50 transition-colors cursor-pointer group"
                  @click="adicionarProdutoAoSetor(prod.id)"
                >
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-operacao-600 truncate">{{ prod.nome }}</p>
                    <p class="text-xs text-operacao-400 truncate">{{ prod.subgrupo?.grupo?.nome }} / {{ prod.subgrupo?.nome }}</p>
                  </div>
                  <UIcon name="i-heroicons-plus-circle" class="w-5 h-5 text-operacao-300 group-hover:text-controle-500 transition-colors flex-shrink-0 ml-2" />
                </div>
                <p v-if="produtosDisponiveis.length > 100" class="text-xs text-operacao-400 text-center py-3">
                  Mostrando 100 de {{ produtosDisponiveis.length }} — filtre para ver mais
                </p>
              </div>
            </div>
          </div>

          <!-- Coluna DIREITA: Produtos vinculados -->
          <div class="sm:w-1/2 flex flex-col overflow-hidden">
            <div class="px-4 py-3 border-b border-operacao-100 bg-operacao-50">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-operacao-400 uppercase tracking-wider">
                  Vinculados ({{ setorProdutosLista.length }})
                </p>
                <UButton
                  v-if="setorProdutosLista.length > 0"
                  color="red"
                  variant="ghost"
                  size="xs"
                  :loading="adicionandoProdutos"
                  @click="removerTodosProdutosDoSetor"
                >
                  Remover todos
                </UButton>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto">
              <div v-if="setorProdutosLista.length === 0" class="flex flex-col items-center justify-center py-8 text-operacao-400">
                <UIcon name="i-heroicons-cube" class="w-8 h-8 mb-2" />
                <p class="text-sm">Nenhum produto vinculado</p>
                <p class="text-xs mt-1">Clique nos produtos ao lado para adicionar</p>
              </div>

              <div v-else class="divide-y divide-operacao-50">
                <div
                  v-for="sp in setorProdutosLista"
                  :key="sp.id"
                  class="flex items-center justify-between px-4 py-2 hover:bg-red-50 transition-colors group"
                >
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-operacao-800 truncate">{{ sp.produto?.nome }}</p>
                    <p class="text-xs text-operacao-400 truncate">{{ sp.produto?.subgrupo?.grupo?.nome }} / {{ sp.produto?.subgrupo?.nome }}</p>
                  </div>
                  <UButton
                    color="red"
                    variant="ghost"
                    icon="i-heroicons-x-mark"
                    size="xs"
                    class="opacity-0 group-hover:opacity-100 transition-opacity"
                    @click="removerProdutoDoSetor(sp.id)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Confirmar Exclusao -->
    <UModal v-model="modalConfirmarExclusaoOpen" :ui="{ overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' } }">
      <UCard :ui="{ ring: 'ring-0', shadow: '', divide: 'divide-operacao-100' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Excluir Setor</h3>
        </template>
        <p>Tem certeza que deseja excluir o setor <strong>{{ setorParaExcluir?.nome }}</strong>?</p>
        <p v-if="setorParaExcluir && (setorProdutosCount[setorParaExcluir.id] || 0) > 0" class="text-sm text-red-500 mt-2">
          Este setor possui {{ setorProdutosCount[setorParaExcluir.id] }} {{ (setorProdutosCount[setorParaExcluir.id] || 0) === 1 ? 'produto vinculado' : 'produtos vinculados' }} que também serão removidos.
        </p>
        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalConfirmarExclusaoOpen = false">Cancelar</UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deletandoSetorId === setorParaExcluir?.id" @click="removerSetorConfirmado">Excluir</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </USlideover>
</template>

<script setup lang="ts">
import type { Setor, SetorProduto, Produto, Grupo, Subgrupo } from '~/types'

const props = defineProps<{
  modelValue: boolean
  setores: Setor[]
  produtos: Produto[]
  grupos: Grupo[]
  subgrupos: Subgrupo[]
  setorProdutosCount: Record<string, number>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'atualizado': []
}>()

const toast = useToast()
const { createSetor, deleteSetor, getSetorProdutos, addProdutosToSetor, removeProdutoFromSetor } = useEstoque()

// State
const novoSetorNome = ref('')
const novoSetorTipo = ref<'principal' | 'apoio'>('principal')
const salvandoSetor = ref(false)
const deletandoSetorId = ref<string | null>(null)
const modalConfirmarExclusaoOpen = ref(false)
const setorParaExcluir = ref<Setor | null>(null)

const setorSelecionado = ref<Setor | null>(null)
const setorProdutosLista = ref<SetorProduto[]>([])
const loadingSetorProdutos = ref(false)
const buscaProdutoSetor = ref('')
const adicionandoProdutos = ref(false)
const filtroGrupoSetor = ref('')
const filtroSubgrupoSetor = ref('')

const subgruposFiltro = computed(() => {
  if (!filtroGrupoSetor.value) return []
  return props.subgrupos.filter(s => s.grupo_id === filtroGrupoSetor.value)
})

watch(filtroGrupoSetor, () => {
  filtroSubgrupoSetor.value = ''
})

const produtosDisponiveis = computed(() => {
  const idsVinculados = new Set(setorProdutosLista.value.map(sp => sp.produto_id))
  let lista = props.produtos.filter(p => !idsVinculados.has(p.id))

  if (filtroGrupoSetor.value) {
    lista = lista.filter(p => {
      const sub = props.subgrupos.find(s => s.id === p.subgrupo_id)
      return sub?.grupo_id === filtroGrupoSetor.value
    })
  }

  if (filtroSubgrupoSetor.value) {
    lista = lista.filter(p => p.subgrupo_id === filtroSubgrupoSetor.value)
  }

  if (buscaProdutoSetor.value) {
    const term = buscaProdutoSetor.value.toLowerCase()
    lista = lista.filter(p =>
      p.nome.toLowerCase().includes(term) ||
      p.subgrupo?.nome?.toLowerCase().includes(term) ||
      p.subgrupo?.grupo?.nome?.toLowerCase().includes(term)
    )
  }
  return lista
})

// Methods
const selecionarSetor = async (setor: Setor) => {
  setorSelecionado.value = setor
  buscaProdutoSetor.value = ''
  filtroGrupoSetor.value = ''
  filtroSubgrupoSetor.value = ''
  try {
    loadingSetorProdutos.value = true
    setorProdutosLista.value = await getSetorProdutos(setor.id)
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar produtos do setor', color: 'red' })
  } finally {
    loadingSetorProdutos.value = false
  }
}

const voltarListaSetores = () => {
  setorSelecionado.value = null
  setorProdutosLista.value = []
  buscaProdutoSetor.value = ''
  filtroGrupoSetor.value = ''
  filtroSubgrupoSetor.value = ''
  emit('atualizado')
}

const adicionarSetor = async () => {
  if (!novoSetorNome.value.trim()) return
  try {
    salvandoSetor.value = true
    await createSetor({ nome: novoSetorNome.value.trim(), tipo: novoSetorTipo.value })
    novoSetorNome.value = ''
    novoSetorTipo.value = 'principal'
    toast.add({ title: 'Sucesso', description: 'Setor criado', color: 'green' })
    emit('atualizado')
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao criar setor', color: 'red' })
  } finally {
    salvandoSetor.value = false
  }
}

const confirmarRemoverSetor = (setor: Setor) => {
  setorParaExcluir.value = setor
  modalConfirmarExclusaoOpen.value = true
}

const removerSetorConfirmado = async () => {
  if (!setorParaExcluir.value) return
  const id = setorParaExcluir.value.id
  try {
    deletandoSetorId.value = id
    await deleteSetor(id)
    if (setorSelecionado.value?.id === id) {
      setorSelecionado.value = null
      setorProdutosLista.value = []
    }
    modalConfirmarExclusaoOpen.value = false
    toast.add({ title: 'Sucesso', description: 'Setor excluído', color: 'green' })
    emit('atualizado')
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao excluir setor', color: 'red' })
  } finally {
    deletandoSetorId.value = null
  }
}

const adicionarProdutoAoSetor = async (produtoId: string) => {
  if (!setorSelecionado.value) return
  try {
    adicionandoProdutos.value = true
    const novos = await addProdutosToSetor(setorSelecionado.value.id, [produtoId])
    setorProdutosLista.value.push(...novos)
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao vincular produto', color: 'red' })
  } finally {
    adicionandoProdutos.value = false
  }
}

const adicionarTodosVisiveis = async () => {
  if (!setorSelecionado.value || produtosDisponiveis.value.length === 0) return
  try {
    adicionandoProdutos.value = true
    const ids = produtosDisponiveis.value.map(p => p.id)
    const novos = await addProdutosToSetor(setorSelecionado.value.id, ids)
    setorProdutosLista.value.push(...novos)
    toast.add({ title: 'Sucesso', description: `${novos.length} produtos adicionados`, color: 'green' })
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao vincular produtos', color: 'red' })
  } finally {
    adicionandoProdutos.value = false
  }
}

const removerProdutoDoSetor = async (setorProdutoId: string) => {
  try {
    await removeProdutoFromSetor(setorProdutoId)
    setorProdutosLista.value = setorProdutosLista.value.filter(sp => sp.id !== setorProdutoId)
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao desvincular produto', color: 'red' })
  }
}

const removerTodosProdutosDoSetor = async () => {
  if (setorProdutosLista.value.length === 0) return
  try {
    adicionandoProdutos.value = true
    for (const sp of setorProdutosLista.value) {
      await removeProdutoFromSetor(sp.id)
    }
    setorProdutosLista.value = []
    toast.add({ title: 'Sucesso', description: 'Todos os produtos removidos', color: 'green' })
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao remover produtos', color: 'red' })
  } finally {
    adicionandoProdutos.value = false
  }
}
</script>
