<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Empresas</h1>
        <p class="text-sm text-gray-500">Gerencie suas empresas e alterne entre elas</p>
      </div>
      <UButton
        color="primary"
        size="lg"
        @click="abrirModalNova"
      >
        <UIcon name="i-heroicons-plus" class="w-5 h-5 mr-1" />
        Nova Empresa
      </UButton>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="flex flex-col sm:flex-row flex-wrap gap-4">
        <UInput
          v-model="busca"
          placeholder="Buscar por nome ou CNPJ..."
          icon="i-heroicons-magnifying-glass"
          class="flex-1 min-w-0 sm:min-w-64"
        />
      </div>
    </UCard>

    <!-- Tabela -->
    <UCard :ui="{ body: { padding: '' } }">
      <UTable
        :columns="columns"
        :rows="paginatedItems"
        :loading="false"
        :ui="{
          td: { color: 'text-gray-700 dark:text-gray-200' },
          th: { color: 'text-gray-900 dark:text-white' }
        }"
      >
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-gray-500">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhuma empresa encontrada</p>
          </div>
        </template>

        <template #empresa-data="{ row }">
          <div class="flex items-center gap-3">
            <div v-if="row.logo_url" class="flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden">
              <img :src="row.logo_url" class="w-8 h-8 object-cover" />
            </div>
            <div v-else class="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <UIcon name="i-heroicons-building-storefront" class="w-4 h-4 text-gray-400" />
            </div>
            <span class="font-semibold text-gray-900 dark:text-white">{{ row.nome }}</span>
          </div>
        </template>

        <template #cnpj-data="{ row }">
          {{ formatarCnpjExibicao(row.cnpj) || '—' }}
        </template>

        <template #status-data="{ row }">
          <UBadge
            v-if="row.id === empresaAtiva?.id"
            color="green"
            variant="subtle"
          >
            Ativa
          </UBadge>
          <UButton
            v-else
            color="gray"
            variant="ghost"
            size="xs"
            @click="selecionarEmpresa(row)"
          >
            Selecionar
          </UButton>
        </template>

        <template #actions-data="{ row }">
          <div class="flex gap-2 justify-end">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              size="xs"
              @click="abrirModalEditar(row)"
            />
            <UButton
              color="red"
              variant="ghost"
              icon="i-heroicons-trash"
              size="xs"
              :disabled="row.id === empresaAtiva?.id"
              @click="confirmarDeletar(row)"
            />
          </div>
        </template>
      </UTable>
      <TablePagination
        v-model="page"
        :page-size="pageSize"
        :total-items="totalItems"
        @update:page-size="pageSize = $event"
      />
    </UCard>

    <!-- Modal: Nova / Editar Empresa -->
    <UModal
      v-model="showModal"
      :ui="{
        width: 'sm:max-w-lg',
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-guardian-100 rounded-lg">
                <UIcon name="i-heroicons-building-storefront" class="w-5 h-5 text-guardian-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">
                  {{ editando ? 'Editar Empresa' : 'Nova Empresa' }}
                </h3>
                <p class="text-xs text-gray-500">
                  {{ editando ? 'Atualize os dados da empresa' : 'Preencha os dados para criar uma empresa' }}
                </p>
              </div>
            </div>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showModal = false"
            />
          </div>
        </template>

        <form @submit.prevent="salvarEmpresa" class="space-y-4">
          <UFormGroup label="Nome da Empresa" required>
            <UInput
              v-model="form.nome"
              placeholder="Nome da empresa"
              size="lg"
              autofocus
            />
          </UFormGroup>

          <UFormGroup label="CNPJ">
            <UInput
              v-model="cnpjFormatado"
              placeholder="00.000.000/0000-00"
              size="lg"
              maxlength="18"
            />
          </UFormGroup>

          <!-- Upload de Logo -->
          <UFormGroup label="Logo da Empresa">
            <div class="flex items-center gap-4">
              <!-- Preview -->
              <div
                class="relative w-16 h-16 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-guardian-300 hover:bg-guardian-50/30 transition-colors group"
                @click="triggerFileInput"
              >
                <img v-if="logoPreview" :src="logoPreview" class="w-16 h-16 object-cover rounded-xl" />
                <UIcon v-else name="i-heroicons-photo" class="w-6 h-6 text-gray-300 group-hover:text-guardian-400 transition-colors" />
                <!-- Overlay de editar quando tem imagem -->
                <div v-if="logoPreview" class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                  <UIcon name="i-heroicons-pencil" class="w-4 h-4 text-white" />
                </div>
              </div>
              <!-- Ações -->
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <UButton
                    color="gray"
                    variant="soft"
                    size="xs"
                    @click="triggerFileInput"
                    :loading="uploadingLogo"
                  >
                    <UIcon name="i-heroicons-arrow-up-tray" class="w-3.5 h-3.5 mr-1" />
                    {{ logoPreview ? 'Trocar' : 'Enviar' }}
                  </UButton>
                  <UButton
                    v-if="logoPreview"
                    color="red"
                    variant="ghost"
                    size="xs"
                    @click="removerLogo"
                  >
                    Remover
                  </UButton>
                </div>
                <p class="text-[11px] text-gray-400 mt-1.5">PNG, JPG ou WebP até 2MB</p>
              </div>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="hidden"
                @change="handleFileUpload"
              />
            </div>
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="showModal = false">
              Cancelar
            </UButton>
            <UButton
              color="primary"
              class="w-full sm:w-auto"
              :loading="salvando"
              :disabled="!form.nome.trim()"
              @click="salvarEmpresa"
            >
              <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
              {{ editando ? 'Salvar Alterações' : 'Criar Empresa' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Confirmar exclusão -->
    <UModal
      v-model="showConfirmDelete"
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
            <div class="flex items-center gap-3">
              <div class="p-2 bg-red-100 rounded-lg">
                <UIcon name="i-heroicons-trash" class="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
                <p class="text-xs text-gray-500">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="showConfirmDelete = false"
            />
          </div>
        </template>

        <p class="text-gray-600">
          Tem certeza que deseja excluir a empresa <strong>{{ empresaParaDeletar?.nome }}</strong>?
        </p>
        <div class="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <p class="text-sm text-red-600">
            Todos os dados vinculados a esta empresa (produtos, entradas, saídas, etc.) serão removidos permanentemente.
          </p>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="showConfirmDelete = false">
              Cancelar
            </UButton>
            <UButton
              color="red"
              class="w-full sm:w-auto"
              :loading="deletando"
              @click="executarDeletar"
            >
              Excluir Empresa
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Empresa } from '~/types'

const toast = useToast()
const client = useSupabaseClient()
const {
  empresaAtiva,
  empresas: listaEmpresas,
  getEmpresas,
  criarEmpresa,
  atualizarEmpresa,
  deletarEmpresa,
  setEmpresaAtiva,
  carregarEmpresaAtiva
} = useEmpresa()

// Estado
const busca = ref('')
const showModal = ref(false)
const showConfirmDelete = ref(false)
const editando = ref(false)
const salvando = ref(false)
const deletando = ref(false)
const empresaEditandoId = ref<string | null>(null)
const empresaParaDeletar = ref<Empresa | null>(null)
const uploadingLogo = ref(false)
const logoPreview = ref<string>('')
const logoFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const form = ref({
  nome: '',
  cnpj: '',
  logo_url: ''
})

// Colunas da tabela
const columns = [
  { key: 'empresa', label: 'Empresa', sortable: true },
  { key: 'cnpj', label: 'CNPJ' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: '' }
]

// Filtro de busca
const empresasFiltradas = computed(() => {
  if (!busca.value.trim()) return listaEmpresas.value as Empresa[]
  const termo = busca.value.toLowerCase()
  return (listaEmpresas.value as Empresa[]).filter(emp =>
    emp.nome.toLowerCase().includes(termo) ||
    (emp.cnpj && emp.cnpj.includes(busca.value.replace(/\D/g, '')))
  )
})

// Paginação com composable
const { page, pageSize, paginatedItems, totalPages, totalItems } = usePagination(empresasFiltradas, 10)

// Formatação CNPJ
const formatarCnpj = (valor: string): string => {
  let v = valor.replace(/\D/g, '')
  if (v.length > 14) v = v.slice(0, 14)
  if (v.length > 12) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5')
  else if (v.length > 8) v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4')
  else if (v.length > 5) v = v.replace(/^(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3')
  else if (v.length > 2) v = v.replace(/^(\d{2})(\d{1,3})/, '$1.$2')
  return v
}

const cnpjFormatado = computed({
  get: () => form.value.cnpj,
  set: (valor: string) => {
    form.value.cnpj = formatarCnpj(valor)
  }
})

const formatarCnpjExibicao = (cnpj?: string): string => {
  if (!cnpj) return ''
  const limpo = cnpj.replace(/\D/g, '')
  if (limpo.length !== 14) return cnpj
  return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

// Upload de Logo
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Validar tamanho (2MB)
  if (file.size > 2 * 1024 * 1024) {
    toast.add({
      title: 'Arquivo muito grande',
      description: 'O tamanho máximo permitido é 2MB',
      color: 'red'
    })
    return
  }

  // Validar tipo
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    toast.add({
      title: 'Formato inválido',
      description: 'Use PNG, JPG ou WebP',
      color: 'red'
    })
    return
  }

  logoFile.value = file

  // Preview local
  const reader = new FileReader()
  reader.onload = (e) => {
    logoPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // Limpar input para permitir re-upload do mesmo arquivo
  target.value = ''
}

const uploadLogo = async (empresaId: string): Promise<string | undefined> => {
  if (!logoFile.value) return undefined

  uploadingLogo.value = true
  try {
    const ext = logoFile.value.name.split('.').pop() || 'png'
    const fileName = `${empresaId}/logo_${Date.now()}.${ext}`

    const { error: uploadError } = await client.storage
      .from('logos')
      .upload(fileName, logoFile.value, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: urlData } = client.storage
      .from('logos')
      .getPublicUrl(fileName)

    return urlData.publicUrl
  } catch (error: any) {
    toast.add({
      title: 'Erro no upload',
      description: error.message || 'Não foi possível enviar a logo',
      color: 'red'
    })
    return undefined
  } finally {
    uploadingLogo.value = false
  }
}

const removerLogo = () => {
  logoPreview.value = ''
  logoFile.value = null
  form.value.logo_url = ''
}

// Ações
const abrirModalNova = () => {
  editando.value = false
  empresaEditandoId.value = null
  form.value = { nome: '', cnpj: '', logo_url: '' }
  logoPreview.value = ''
  logoFile.value = null
  showModal.value = true
}

const abrirModalEditar = (emp: Empresa) => {
  editando.value = true
  empresaEditandoId.value = emp.id
  form.value = {
    nome: emp.nome,
    cnpj: emp.cnpj ? formatarCnpjExibicao(emp.cnpj) : '',
    logo_url: emp.logo_url || ''
  }
  logoPreview.value = emp.logo_url || ''
  logoFile.value = null
  showModal.value = true
}

const salvarEmpresa = async () => {
  if (!form.value.nome.trim()) return
  salvando.value = true

  try {
    const cnpjLimpo = form.value.cnpj.replace(/\D/g, '') || undefined

    if (editando.value && empresaEditandoId.value) {
      // Upload de logo se houver novo arquivo
      let logoUrl = form.value.logo_url
      if (logoFile.value) {
        const url = await uploadLogo(empresaEditandoId.value)
        if (url) logoUrl = url
      }

      await atualizarEmpresa(empresaEditandoId.value, {
        nome: form.value.nome.trim(),
        cnpj: cnpjLimpo,
        logo_url: logoUrl || undefined
      } as Partial<Empresa>)
      toast.add({
        title: 'Empresa atualizada!',
        description: 'As alterações foram salvas com sucesso.',
        color: 'green'
      })
    } else {
      // Criar empresa primeiro, depois upload da logo
      const novaEmpresa = await criarEmpresa(form.value.nome.trim(), cnpjLimpo)

      if (logoFile.value && novaEmpresa?.id) {
        const logoUrl = await uploadLogo(novaEmpresa.id)
        if (logoUrl) {
          await atualizarEmpresa(novaEmpresa.id, { logo_url: logoUrl } as Partial<Empresa>)
        }
      }

      toast.add({
        title: 'Empresa criada!',
        description: 'Sua nova empresa foi criada com sucesso.',
        color: 'green'
      })
    }

    showModal.value = false
    await getEmpresas()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar empresa',
      color: 'red'
    })
  } finally {
    salvando.value = false
  }
}

const selecionarEmpresa = (emp: Empresa) => {
  setEmpresaAtiva(emp)
  toast.add({
    title: 'Empresa selecionada',
    description: `Agora você está usando "${emp.nome}"`,
    color: 'green'
  })
  // Recarregar para atualizar dados
  window.location.reload()
}

const confirmarDeletar = (emp: Empresa) => {
  empresaParaDeletar.value = emp
  showConfirmDelete.value = true
}

const executarDeletar = async () => {
  if (!empresaParaDeletar.value) return
  deletando.value = true

  try {
    await deletarEmpresa(empresaParaDeletar.value.id)
    showConfirmDelete.value = false
    empresaParaDeletar.value = null
    toast.add({
      title: 'Empresa excluída',
      description: 'A empresa foi removida com sucesso.',
      color: 'green'
    })
    await getEmpresas()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir empresa',
      color: 'red'
    })
  } finally {
    deletando.value = false
  }
}

// Carregar dados
onMounted(async () => {
  await carregarEmpresaAtiva()
})
</script>
