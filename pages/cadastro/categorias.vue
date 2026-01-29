<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Categorias</h1>
        <p class="text-sm text-gray-500">Gerencie as categorias de produtos</p>
      </div>
      <UButton color="primary" class="w-full sm:w-auto" @click="openModal()">
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
        Nova Categoria
      </UButton>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="flex flex-col sm:flex-row gap-4">
        <UInput
          v-model="search"
          placeholder="Buscar categoria..."
          icon="i-heroicons-magnifying-glass"
          class="flex-1"
        />
      </div>
    </UCard>

    <!-- Tabela -->
    <UCard :ui="{ body: { padding: '' } }">
      <UTable
        :columns="columns"
        :rows="paginatedItems"
        :loading="loading"
        :ui="{
          td: { color: 'text-gray-700 dark:text-gray-200' },
          th: { color: 'text-gray-900 dark:text-white' }
        }"
      >
        <!-- Empty State -->
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-gray-500">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhum registro encontrado</p>
          </div>
        </template>

        <template #nome-data="{ row }">
          <span class="font-semibold text-gray-900 dark:text-white">{{ row.nome }}</span>
        </template>

        <template #codigo-data="{ row }">
          <span class="text-gray-700 dark:text-gray-200">{{ row.codigo || '—' }}</span>
        </template>

        <template #actions-data="{ row }">
          <div class="flex gap-2 justify-end">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              size="xs"
              @click="openModal(row)"
            />
            <UButton
              color="red"
              variant="ghost"
              icon="i-heroicons-trash"
              size="xs"
              @click="confirmDelete(row)"
            />
          </div>
        </template>
      </UTable>
      <TablePagination
        v-model="page"
        :page-size="pageSize"
        :total-items="filteredCategorias.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>

    <!-- Modal de Cadastro/Edição -->
    <UModal
      v-model="modalOpen"
      :ui="{
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ editingCategoria ? 'Editar Categoria' : 'Nova Categoria' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="modalOpen = false"
            />
          </div>
        </template>

        <form @submit.prevent="saveCategoria" class="space-y-4">
          <UFormGroup label="Nome" required>
            <UInput v-model="form.nome" placeholder="Nome da categoria" />
          </UFormGroup>

          <UFormGroup label="Código">
            <UInput v-model="form.codigo" placeholder="Código (opcional)" />
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalOpen = false">
              Cancelar
            </UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="saving" @click="saveCategoria">
              {{ editingCategoria ? 'Salvar' : 'Criar' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal de Confirmação de Exclusão -->
    <UModal
      v-model="deleteModalOpen"
      :ui="{
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
        </template>

        <p>Tem certeza que deseja excluir a categoria <strong>{{ deletingCategoria?.nome }}</strong>?</p>
        <p class="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deleting" @click="deleteCategoria">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Categoria } from '~/types'

const { getCategorias, createCategoria, updateCategoria, deleteCategoria: removeCategoria } = useEstoque()
const toast = useToast()

const categorias = ref<Categoria[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const modalOpen = ref(false)
const deleteModalOpen = ref(false)
const editingCategoria = ref<Categoria | null>(null)
const deletingCategoria = ref<Categoria | null>(null)

const form = ref({
  nome: '',
  codigo: ''
})

const columns = [
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'codigo', label: 'Código', sortable: true },
  { key: 'actions', label: 'Ações', class: 'text-right', rowClass: 'text-right' }
]

const filteredCategorias = computed(() => {
  if (!search.value) return categorias.value
  const term = search.value.toLowerCase()
  return categorias.value.filter(c =>
    c.nome.toLowerCase().includes(term) ||
    c.codigo?.toLowerCase().includes(term)
  )
})

const { page, pageSize, paginatedItems } = usePagination(filteredCategorias)

const loadCategorias = async () => {
  try {
    loading.value = true
    categorias.value = await getCategorias()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar categorias',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const openModal = (categoria?: Categoria) => {
  if (categoria) {
    editingCategoria.value = categoria
    form.value = {
      nome: categoria.nome,
      codigo: categoria.codigo || ''
    }
  } else {
    editingCategoria.value = null
    form.value = { nome: '', codigo: '' }
  }
  modalOpen.value = true
}

const saveCategoria = async () => {
  if (!form.value.nome) {
    toast.add({
      title: 'Erro',
      description: 'O nome é obrigatório',
      color: 'red'
    })
    return
  }

  try {
    saving.value = true
    if (editingCategoria.value) {
      await updateCategoria(editingCategoria.value.id, form.value)
      toast.add({
        title: 'Sucesso',
        description: 'Categoria atualizada com sucesso',
        color: 'green'
      })
    } else {
      await createCategoria(form.value)
      toast.add({
        title: 'Sucesso',
        description: 'Categoria criada com sucesso',
        color: 'green'
      })
    }
    modalOpen.value = false
    await loadCategorias()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar categoria',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (categoria: Categoria) => {
  deletingCategoria.value = categoria
  deleteModalOpen.value = true
}

const deleteCategoria = async () => {
  if (!deletingCategoria.value) return

  try {
    deleting.value = true
    await removeCategoria(deletingCategoria.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Categoria excluída com sucesso',
      color: 'green'
    })
    deleteModalOpen.value = false
    await loadCategorias()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir categoria',
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadCategorias()
})
</script>
