<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Destinos</h1>
        <p class="text-sm text-gray-500">Gerencie os destinos de saída de produtos</p>
      </div>
      <UButton color="primary" class="w-full sm:w-auto" @click="openModal()">
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
        Novo Destino
      </UButton>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="flex flex-col sm:flex-row gap-4">
        <UInput
          v-model="search"
          placeholder="Buscar destino..."
          icon="i-heroicons-magnifying-glass"
          class="flex-1"
        />
        <USelect
          v-model="filterStatus"
          :options="statusOptions"
          placeholder="Status"
          class="w-full sm:w-40"
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

        <template #ativo-data="{ row }">
          <UBadge :color="row.ativo ? 'green' : 'gray'">
            {{ row.ativo ? 'Ativo' : 'Inativo' }}
          </UBadge>
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
        :total-items="filteredDestinos.length"
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
              {{ editingDestino ? 'Editar Destino' : 'Novo Destino' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="modalOpen = false"
            />
          </div>
        </template>

        <form @submit.prevent="saveDestino" class="space-y-4">
          <UFormGroup label="Nome" required>
            <UInput v-model="form.nome" placeholder="Nome do destino" />
          </UFormGroup>

          <UFormGroup label="Status">
            <UToggle v-model="form.ativo" />
            <span class="ml-2 text-sm text-gray-600">{{ form.ativo ? 'Ativo' : 'Inativo' }}</span>
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalOpen = false">
              Cancelar
            </UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="saving" @click="saveDestino">
              {{ editingDestino ? 'Salvar' : 'Criar' }}
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

        <p>Tem certeza que deseja excluir o destino <strong>{{ deletingDestino?.nome }}</strong>?</p>
        <p class="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deleting" @click="deleteDestino">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Destino } from '~/types'

const { getDestinos, createDestino, updateDestino, deleteDestino: removeDestino } = useEstoque()
const toast = useToast()

const destinos = ref<Destino[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const filterStatus = ref('')
const modalOpen = ref(false)
const deleteModalOpen = ref(false)
const editingDestino = ref<Destino | null>(null)
const deletingDestino = ref<Destino | null>(null)

const form = ref({
  nome: '',
  ativo: true
})

const columns = [
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'ativo', label: 'Status', sortable: true },
  { key: 'actions', label: 'Ações', class: 'text-right', rowClass: 'text-right' }
]

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Ativos', value: 'true' },
  { label: 'Inativos', value: 'false' }
]

const filteredDestinos = computed(() => {
  let result = destinos.value

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(d => d.nome.toLowerCase().includes(term))
  }

  if (filterStatus.value) {
    const isActive = filterStatus.value === 'true'
    result = result.filter(d => d.ativo === isActive)
  }

  return result
})

const { page, pageSize, paginatedItems } = usePagination(filteredDestinos)

const loadDestinos = async () => {
  try {
    loading.value = true
    destinos.value = await getDestinos(false) // Buscar todos, incluindo inativos
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar destinos',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const openModal = (destino?: Destino) => {
  if (destino) {
    editingDestino.value = destino
    form.value = {
      nome: destino.nome,
      ativo: destino.ativo
    }
  } else {
    editingDestino.value = null
    form.value = { nome: '', ativo: true }
  }
  modalOpen.value = true
}

const saveDestino = async () => {
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
    if (editingDestino.value) {
      await updateDestino(editingDestino.value.id, form.value)
      toast.add({
        title: 'Sucesso',
        description: 'Destino atualizado com sucesso',
        color: 'green'
      })
    } else {
      await createDestino(form.value)
      toast.add({
        title: 'Sucesso',
        description: 'Destino criado com sucesso',
        color: 'green'
      })
    }
    modalOpen.value = false
    await loadDestinos()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar destino',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (destino: Destino) => {
  deletingDestino.value = destino
  deleteModalOpen.value = true
}

const deleteDestino = async () => {
  if (!deletingDestino.value) return

  try {
    deleting.value = true
    await removeDestino(deletingDestino.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Destino excluído com sucesso',
      color: 'green'
    })
    deleteModalOpen.value = false
    await loadDestinos()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir destino',
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadDestinos()
})
</script>
