<template>
  <div class="space-y-6">
    <!-- Header -->
    <h1 class="text-2xl font-semibold text-[#5a5a66] mb-2">Fichas Técnicas</h1>

    <!-- Toolbar -->
    <div class="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
      <div class="flex flex-col sm:flex-row flex-wrap gap-3 flex-1 min-w-0">
        <UInput
          v-model="search"
          placeholder="Buscar..."
          icon="i-heroicons-magnifying-glass"
          class="w-full sm:w-56"
          :ui="toolbarInputUi"
        />
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <UButton color="primary" @click="abrirForm()">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1.5" />
          Nova Ficha
        </UButton>
      </div>
    </div>

    <!-- Tabela -->
    <UCard :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
      <UTable
        :columns="columns"
        :rows="fichasFiltradas"
        :loading="loading"
        :ui="{
          divide: 'divide-y divide-operacao-50 dark:divide-operacao-700',
          thead: '',
          th: { base: 'bg-operacao-100/70 dark:bg-operacao-800 border-b border-operacao-200/60 [&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66] [&_button>span+span]:text-operacao-300 [&_button>span+span]:!w-3.5 [&_button>span+span]:!h-3.5', color: 'text-[#5a5a66] dark:text-operacao-400', font: 'font-medium', size: 'text-xs uppercase tracking-wider', padding: 'px-4 py-2' },
          td: { color: 'text-operacao-600 dark:text-operacao-200', size: 'text-sm', padding: 'px-4 py-2.5' }
        }"
      >
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-operacao-400">
            <UIcon name="i-heroicons-beaker" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhuma ficha técnica cadastrada</p>
          </div>
        </template>

        <template #nome-data="{ row }">
          <span class="font-semibold text-operacao-800">{{ row.nome }}</span>
        </template>

        <template #produto-data="{ row }">
          {{ row.produto?.nome || '-' }}
        </template>

        <template #unidade-data="{ row }">
          {{ row.produto?.unidade?.sigla || '-' }}
        </template>

        <template #rendimento-data="{ row }">
          {{ row.rendimento }} {{ row.produto?.unidade?.sigla || '' }}
        </template>

        <template #ingredientes-data="{ row }">
          <UBadge color="gray" variant="subtle" size="xs">
            {{ row.ingredientes?.length || 0 }} itens
          </UBadge>
        </template>

        <template #versao-data="{ row }">
          <span class="text-operacao-400">v{{ row.versao }}</span>
        </template>

        <template #actions-data="{ row }">
          <div class="flex gap-2 justify-end">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              size="xs"
              @click="abrirForm(row)"
            />
            <UButton
              color="red"
              variant="ghost"
              icon="i-heroicons-trash"
              size="xs"
              @click="confirmarExclusao(row)"
            />
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Slideover Criar/Editar -->
    <ProducaoFichaTecnicaForm
      v-model="formOpen"
      :ficha="fichaEditando"
      :produtos="produtos"
      @salvo="carregarDados"
    />

    <!-- Modal de confirmação de exclusão -->
    <UModal v-model="deleteModalOpen">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-operacao-800 mb-2">Excluir Ficha Técnica</h3>
        <p class="text-sm text-operacao-600 mb-4">
          Tem certeza que deseja excluir a ficha <strong>{{ fichaParaDeletar?.nome }}</strong>?
          Esta ação não pode ser desfeita.
        </p>
        <div class="flex justify-end gap-3">
          <UButton color="white" @click="deleteModalOpen = false">Cancelar</UButton>
          <UButton color="red" :loading="deletando" @click="excluir">Excluir</UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Produto, FichaTecnica } from '~/types'

definePageMeta({ layout: 'default' })

const { getFichasTecnicas, deleteFichaTecnica } = useProducao()
const { getProdutos } = useEstoque()
const toast = useToast()

const toolbarInputUi = { color: { white: { outline: 'shadow-sm bg-white text-gray-900 ring-1 ring-inset ring-[#EBEBED] focus:ring-1 focus:ring-operacao-200 dark:ring-operacao-700' } } }

const loading = ref(false)
const fichas = ref<FichaTecnica[]>([])
const produtos = ref<Produto[]>([])
const search = ref('')

// Form
const formOpen = ref(false)
const fichaEditando = ref<FichaTecnica | null>(null)

// Delete
const deleteModalOpen = ref(false)
const fichaParaDeletar = ref<FichaTecnica | null>(null)
const deletando = ref(false)

const columns = [
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'produto', label: 'Produto' },
  { key: 'rendimento', label: 'Rendimento', sortable: true },
  { key: 'ingredientes', label: 'Ingredientes' },
  { key: 'versao', label: 'Versão' },
  { key: 'actions', label: '' }
]

const fichasFiltradas = computed(() => {
  if (!search.value) return fichas.value
  const q = search.value.toLowerCase()
  return fichas.value.filter(f =>
    f.nome.toLowerCase().includes(q) ||
    f.produto?.nome?.toLowerCase().includes(q)
  )
})

const carregarDados = async () => {
  loading.value = true
  try {
    const [fichasData, produtosData] = await Promise.all([
      getFichasTecnicas(false),
      getProdutos()
    ])
    fichas.value = fichasData
    produtos.value = produtosData
  } catch (e: any) {
    toast.add({ title: 'Erro ao carregar dados', description: e.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

const abrirForm = (ficha?: FichaTecnica) => {
  fichaEditando.value = ficha || null
  formOpen.value = true
}

const confirmarExclusao = (ficha: FichaTecnica) => {
  fichaParaDeletar.value = ficha
  deleteModalOpen.value = true
}

const excluir = async () => {
  if (!fichaParaDeletar.value) return
  deletando.value = true
  try {
    await deleteFichaTecnica(fichaParaDeletar.value.id)
    toast.add({ title: 'Ficha excluída', color: 'green' })
    deleteModalOpen.value = false
    await carregarDados()
  } catch (e: any) {
    toast.add({ title: 'Erro ao excluir', description: e.message, color: 'red' })
  } finally {
    deletando.value = false
  }
}

onMounted(carregarDados)
</script>
