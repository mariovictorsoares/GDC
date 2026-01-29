<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Unidades de Medida</h1>
        <p class="text-sm text-gray-500">Gerencie as unidades de medida dos produtos</p>
      </div>
      <UButton color="primary" class="w-full sm:w-auto" @click="openModal()">
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
        Nova Unidade
      </UButton>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="flex flex-col sm:flex-row gap-4">
        <UInput
          v-model="search"
          placeholder="Buscar unidade..."
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

        <template #sigla-data="{ row }">
          <span class="font-semibold text-gray-900 dark:text-white">{{ row.sigla }}</span>
        </template>

        <template #descricao-data="{ row }">
          <span class="text-gray-700 dark:text-gray-200">{{ row.descricao || '—' }}</span>
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
        :total-items="filteredUnidades.length"
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
              {{ editingUnidade ? 'Editar Unidade' : 'Nova Unidade' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="modalOpen = false"
            />
          </div>
        </template>

        <form @submit.prevent="saveUnidade" class="space-y-4">
          <UFormGroup label="Sigla" required>
            <UInput v-model="form.sigla" placeholder="Ex: KG, UN, PC" maxlength="10" />
          </UFormGroup>

          <UFormGroup label="Descrição">
            <UInput v-model="form.descricao" placeholder="Descrição da unidade" />
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalOpen = false">
              Cancelar
            </UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="saving" @click="saveUnidade">
              {{ editingUnidade ? 'Salvar' : 'Criar' }}
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

        <p>Tem certeza que deseja excluir a unidade <strong>{{ deletingUnidade?.sigla }}</strong>?</p>
        <p class="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deleting" @click="deleteUnidade">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Unidade } from '~/types'

const { getUnidades, createUnidade, updateUnidade, deleteUnidade: removeUnidade } = useEstoque()
const toast = useToast()

const unidades = ref<Unidade[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const modalOpen = ref(false)
const deleteModalOpen = ref(false)
const editingUnidade = ref<Unidade | null>(null)
const deletingUnidade = ref<Unidade | null>(null)

const form = ref({
  sigla: '',
  descricao: ''
})

const columns = [
  { key: 'sigla', label: 'Sigla', sortable: true },
  { key: 'descricao', label: 'Descrição', sortable: true },
  { key: 'actions', label: 'Ações', class: 'text-right', rowClass: 'text-right' }
]

const filteredUnidades = computed(() => {
  if (!search.value) return unidades.value
  const term = search.value.toLowerCase()
  return unidades.value.filter(u =>
    u.sigla.toLowerCase().includes(term) ||
    u.descricao?.toLowerCase().includes(term)
  )
})

const { page, pageSize, paginatedItems } = usePagination(filteredUnidades)

const loadUnidades = async () => {
  try {
    loading.value = true
    unidades.value = await getUnidades()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar unidades',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const openModal = (unidade?: Unidade) => {
  if (unidade) {
    editingUnidade.value = unidade
    form.value = {
      sigla: unidade.sigla,
      descricao: unidade.descricao || ''
    }
  } else {
    editingUnidade.value = null
    form.value = { sigla: '', descricao: '' }
  }
  modalOpen.value = true
}

const saveUnidade = async () => {
  if (!form.value.sigla) {
    toast.add({
      title: 'Erro',
      description: 'A sigla é obrigatória',
      color: 'red'
    })
    return
  }

  try {
    saving.value = true
    if (editingUnidade.value) {
      await updateUnidade(editingUnidade.value.id, form.value)
      toast.add({
        title: 'Sucesso',
        description: 'Unidade atualizada com sucesso',
        color: 'green'
      })
    } else {
      await createUnidade(form.value)
      toast.add({
        title: 'Sucesso',
        description: 'Unidade criada com sucesso',
        color: 'green'
      })
    }
    modalOpen.value = false
    await loadUnidades()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar unidade',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (unidade: Unidade) => {
  deletingUnidade.value = unidade
  deleteModalOpen.value = true
}

const deleteUnidade = async () => {
  if (!deletingUnidade.value) return

  try {
    deleting.value = true
    await removeUnidade(deletingUnidade.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Unidade excluída com sucesso',
      color: 'green'
    })
    deleteModalOpen.value = false
    await loadUnidades()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir unidade',
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadUnidades()
})
</script>
