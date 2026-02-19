<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Grupos e Subgrupos</h1>
        <p class="text-sm text-gray-500">Gerencie a hierarquia de categorização dos produtos</p>
      </div>
      <UButton color="primary" class="w-full sm:w-auto" @click="openGrupoModal()">
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
        Novo Grupo
      </UButton>
    </div>

    <!-- Tabela estilo planilha -->
    <UCard :ui="{ body: { padding: '' } }">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white w-48">Grupo</th>
              <th class="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Subgrupo</th>
              <th class="px-4 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(grupo, grupoIndex) in grupos" :key="grupo.id">
              <!-- Linha do grupo com primeiro subgrupo ou vazia -->
              <tr
                class="border-b border-gray-100"
                :class="grupoIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
              >
                <!-- Célula do Grupo (rowspan) -->
                <td
                  class="px-4 py-2 font-semibold text-gray-900 align-top border-r border-gray-200"
                  :class="grupoIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
                  :rowspan="Math.max(getSubgruposDoGrupo(grupo.id).length, 1)"
                >
                  <div class="flex items-center justify-between">
                    <span>{{ grupo.nome }}</span>
                    <div class="flex gap-1">
                      <UButton
                        color="gray"
                        variant="ghost"
                        icon="i-heroicons-plus"
                        size="xs"
                        title="Adicionar subgrupo"
                        @click="openSubgrupoModal(undefined, grupo.id)"
                      />
                      <UButton
                        color="gray"
                        variant="ghost"
                        icon="i-heroicons-pencil-square"
                        size="xs"
                        @click="openGrupoModal(grupo)"
                      />
                      <UButton
                        color="red"
                        variant="ghost"
                        icon="i-heroicons-trash"
                        size="xs"
                        @click="confirmDeleteGrupo(grupo)"
                      />
                    </div>
                  </div>
                </td>
                <!-- Primeiro subgrupo ou célula vazia -->
                <td class="px-4 py-2 text-gray-700">
                  <template v-if="getSubgruposDoGrupo(grupo.id).length > 0">
                    {{ getSubgruposDoGrupo(grupo.id)[0].nome }}
                  </template>
                  <template v-else>
                    <span class="text-gray-400 italic text-sm">Nenhum subgrupo</span>
                  </template>
                </td>
                <td class="px-4 py-2 text-right">
                  <template v-if="getSubgruposDoGrupo(grupo.id).length > 0">
                    <div class="flex gap-1 justify-end">
                      <UButton
                        color="gray"
                        variant="ghost"
                        icon="i-heroicons-pencil-square"
                        size="xs"
                        @click="openSubgrupoModal(getSubgruposDoGrupo(grupo.id)[0])"
                      />
                      <UButton
                        color="red"
                        variant="ghost"
                        icon="i-heroicons-trash"
                        size="xs"
                        @click="confirmDeleteSubgrupo(getSubgruposDoGrupo(grupo.id)[0])"
                      />
                    </div>
                  </template>
                </td>
              </tr>
              <!-- Demais subgrupos (a partir do segundo) -->
              <tr
                v-for="(subgrupo, index) in getSubgruposDoGrupo(grupo.id).slice(1)"
                :key="subgrupo.id"
                class="border-b border-gray-100"
                :class="grupoIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
              >
                <td class="px-4 py-2 text-gray-700">{{ subgrupo.nome }}</td>
                <td class="px-4 py-2 text-right">
                  <div class="flex gap-1 justify-end">
                    <UButton
                      color="gray"
                      variant="ghost"
                      icon="i-heroicons-pencil-square"
                      size="xs"
                      @click="openSubgrupoModal(subgrupo)"
                    />
                    <UButton
                      color="red"
                      variant="ghost"
                      icon="i-heroicons-trash"
                      size="xs"
                      @click="confirmDeleteSubgrupo(subgrupo)"
                    />
                  </div>
                </td>
              </tr>
            </template>
            <!-- Estado vazio -->
            <tr v-if="grupos.length === 0 && !loading">
              <td colspan="3" class="px-4 py-12 text-center text-gray-500">
                <UIcon name="i-heroicons-folder-open" class="w-12 h-12 mx-auto mb-4" />
                <p class="text-lg font-medium">Nenhum grupo cadastrado</p>
                <p class="text-sm mt-1">Comece criando um novo grupo</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="loading" class="p-5 space-y-3">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4 py-2">
          <USkeleton class="h-5 w-36" />
          <USkeleton class="h-4 w-28" />
          <USkeleton class="h-4 w-16 ml-auto" />
        </div>
      </div>
    </UCard>

    <!-- Modal de Grupo -->
    <UModal
      v-model="grupoModalOpen"
      :ui="{
        width: 'sm:max-w-md',
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
              {{ editingGrupo ? 'Editar Grupo' : 'Novo Grupo' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="grupoModalOpen = false"
            />
          </div>
        </template>

        <form @submit.prevent="saveGrupo" class="space-y-4">
          <UFormGroup label="Nome do Grupo" required>
            <UInput v-model="grupoForm.nome" placeholder="Ex: Alimentos" />
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="grupoModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="savingGrupo" @click="saveGrupo">
              {{ editingGrupo ? 'Salvar' : 'Criar' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal de Subgrupo -->
    <UModal
      v-model="subgrupoModalOpen"
      :ui="{
        width: 'sm:max-w-md',
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
              {{ editingSubgrupo ? 'Editar Subgrupo' : 'Novo Subgrupo' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="subgrupoModalOpen = false"
            />
          </div>
        </template>

        <form @submit.prevent="saveSubgrupo" class="space-y-4">
          <UFormGroup label="Grupo" required>
            <USelect
              v-model="subgrupoForm.grupo_id"
              :options="gruposSelect"
              placeholder="Selecione o grupo"
              :disabled="!!editingSubgrupo || !!preSelectedGrupoId"
              :ui="(editingSubgrupo || preSelectedGrupoId) ? { color: { white: { outline: 'bg-gray-100 text-gray-500 cursor-not-allowed' } } } : {}"
            />
          </UFormGroup>

          <UFormGroup label="Nome do Subgrupo" required>
            <UInput v-model="subgrupoForm.nome" placeholder="Ex: Mercearia" />
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="subgrupoModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="savingSubgrupo" @click="saveSubgrupo">
              {{ editingSubgrupo ? 'Salvar' : 'Criar' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal de Confirmação de Exclusão de Grupo -->
    <UModal
      v-model="deleteGrupoModalOpen"
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

        <p>Tem certeza que deseja excluir o grupo <strong>{{ deletingGrupo?.nome }}</strong>?</p>
        <p class="text-sm text-gray-500 mt-2">Todos os subgrupos vinculados também serão excluídos.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteGrupoModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deletingGrupoLoading" @click="deleteGrupo">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal de Confirmação de Exclusão de Subgrupo -->
    <UModal
      v-model="deleteSubgrupoModalOpen"
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

        <p>Tem certeza que deseja excluir o subgrupo <strong>{{ deletingSubgrupo?.nome }}</strong>?</p>
        <p class="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteSubgrupoModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deletingSubgrupoLoading" @click="deleteSubgrupo">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Grupo, Subgrupo } from '~/types'

const {
  getGrupos,
  createGrupo: createGrupoApi,
  updateGrupo: updateGrupoApi,
  deleteGrupo: removeGrupo,
  getSubgrupos,
  createSubgrupo: createSubgrupoApi,
  updateSubgrupo: updateSubgrupoApi,
  deleteSubgrupo: removeSubgrupo
} = useEstoque()
const { empresaId } = useEmpresa()
const toast = useToast()

const grupos = ref<Grupo[]>([])
const subgrupos = ref<Subgrupo[]>([])
const loading = ref(true)

// Grupo
const grupoModalOpen = ref(false)
const deleteGrupoModalOpen = ref(false)
const editingGrupo = ref<Grupo | null>(null)
const deletingGrupo = ref<Grupo | null>(null)
const savingGrupo = ref(false)
const deletingGrupoLoading = ref(false)
const grupoForm = ref({ nome: '' })

// Subgrupo
const subgrupoModalOpen = ref(false)
const deleteSubgrupoModalOpen = ref(false)
const editingSubgrupo = ref<Subgrupo | null>(null)
const deletingSubgrupo = ref<Subgrupo | null>(null)
const savingSubgrupo = ref(false)
const deletingSubgrupoLoading = ref(false)
const subgrupoForm = ref({ grupo_id: '', nome: '' })
const preSelectedGrupoId = ref<string | null>(null)

const gruposSelect = computed(() =>
  grupos.value.map(g => ({ label: g.nome, value: g.id }))
)

const getSubgruposDoGrupo = (grupoId: string) => {
  return subgrupos.value.filter(s => s.grupo_id === grupoId)
}

// Formata texto com primeira letra maiúscula
const formatarNome = (texto: string) => {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
}

const loadData = async () => {
  try {
    loading.value = true
    const [gruposData, subgruposData] = await Promise.all([
      getGrupos(),
      getSubgrupos()
    ])
    grupos.value = gruposData
    subgrupos.value = subgruposData
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar dados',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

// ==========================================
// Funções de Grupo
// ==========================================

const openGrupoModal = (grupo?: Grupo) => {
  if (grupo) {
    editingGrupo.value = grupo
    grupoForm.value = { nome: grupo.nome }
  } else {
    editingGrupo.value = null
    grupoForm.value = { nome: '' }
  }
  grupoModalOpen.value = true
}

const saveGrupo = async () => {
  if (!grupoForm.value.nome) {
    toast.add({
      title: 'Erro',
      description: 'O nome é obrigatório',
      color: 'red'
    })
    return
  }

  grupoForm.value.nome = formatarNome(grupoForm.value.nome)

  try {
    savingGrupo.value = true
    if (editingGrupo.value) {
      await updateGrupoApi(editingGrupo.value.id, grupoForm.value)
      toast.add({
        title: 'Sucesso',
        description: 'Grupo atualizado com sucesso',
        color: 'green'
      })
    } else {
      await createGrupoApi(grupoForm.value)
      toast.add({
        title: 'Sucesso',
        description: 'Grupo criado com sucesso',
        color: 'green'
      })
    }
    grupoModalOpen.value = false
    await loadData()
  } catch (error: any) {
    let mensagem = 'Erro ao salvar grupo'
    if (error.message?.includes('grupos_nome_key') || error.code === '23505') {
      mensagem = 'Já existe um grupo com esse nome'
    }
    toast.add({
      title: 'Erro',
      description: mensagem,
      color: 'red'
    })
  } finally {
    savingGrupo.value = false
  }
}

const confirmDeleteGrupo = (grupo: Grupo) => {
  deletingGrupo.value = grupo
  deleteGrupoModalOpen.value = true
}

const deleteGrupo = async () => {
  if (!deletingGrupo.value) return

  try {
    deletingGrupoLoading.value = true
    await removeGrupo(deletingGrupo.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Grupo excluído com sucesso',
      color: 'green'
    })
    deleteGrupoModalOpen.value = false
    await loadData()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir grupo',
      color: 'red'
    })
  } finally {
    deletingGrupoLoading.value = false
  }
}

// ==========================================
// Funções de Subgrupo
// ==========================================

const openSubgrupoModal = (subgrupo?: Subgrupo, grupoId?: string) => {
  preSelectedGrupoId.value = null

  if (subgrupo) {
    editingSubgrupo.value = subgrupo
    subgrupoForm.value = {
      grupo_id: subgrupo.grupo_id,
      nome: subgrupo.nome
    }
  } else {
    editingSubgrupo.value = null
    subgrupoForm.value = {
      grupo_id: grupoId || '',
      nome: ''
    }
    if (grupoId) {
      preSelectedGrupoId.value = grupoId
    }
  }
  subgrupoModalOpen.value = true
}

const saveSubgrupo = async () => {
  if (!subgrupoForm.value.grupo_id || !subgrupoForm.value.nome) {
    toast.add({
      title: 'Erro',
      description: 'Grupo e nome são obrigatórios',
      color: 'red'
    })
    return
  }

  subgrupoForm.value.nome = formatarNome(subgrupoForm.value.nome)

  try {
    savingSubgrupo.value = true
    if (editingSubgrupo.value) {
      await updateSubgrupoApi(editingSubgrupo.value.id, { nome: subgrupoForm.value.nome })
      toast.add({
        title: 'Sucesso',
        description: 'Subgrupo atualizado com sucesso',
        color: 'green'
      })
    } else {
      await createSubgrupoApi(subgrupoForm.value)
      toast.add({
        title: 'Sucesso',
        description: 'Subgrupo criado com sucesso',
        color: 'green'
      })
    }
    subgrupoModalOpen.value = false
    await loadData()
  } catch (error: any) {
    let mensagem = 'Erro ao salvar subgrupo'
    if (error.code === '23505') {
      mensagem = 'Já existe um subgrupo com esse nome neste grupo'
    }
    toast.add({
      title: 'Erro',
      description: mensagem,
      color: 'red'
    })
  } finally {
    savingSubgrupo.value = false
  }
}

const confirmDeleteSubgrupo = (subgrupo: Subgrupo) => {
  deletingSubgrupo.value = subgrupo
  deleteSubgrupoModalOpen.value = true
}

const deleteSubgrupo = async () => {
  if (!deletingSubgrupo.value) return

  try {
    deletingSubgrupoLoading.value = true
    await removeSubgrupo(deletingSubgrupo.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Subgrupo excluído com sucesso',
      color: 'green'
    })
    deleteSubgrupoModalOpen.value = false
    await loadData()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir subgrupo',
      color: 'red'
    })
  } finally {
    deletingSubgrupoLoading.value = false
  }
}

// Recarregar dados quando a empresa ativa mudar
watch(empresaId, () => {
  if (empresaId.value) {
    loadData()
  }
}, { immediate: true })
</script>
