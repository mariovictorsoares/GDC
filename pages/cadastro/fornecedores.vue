<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Fornecedores</h1>
        <p class="text-sm text-gray-500">Gerencie os fornecedores cadastrados</p>
      </div>
      <UButton color="primary" class="w-full sm:w-auto" @click="openModal()">
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
        Novo Fornecedor
      </UButton>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="flex flex-col sm:flex-row gap-4">
        <UInput
          v-model="search"
          placeholder="Buscar por nome ou CNPJ..."
          icon="i-heroicons-magnifying-glass"
          class="flex-1"
        />
        <USelect
          v-model="filterStatus"
          :options="statusOptions"
          value-attribute="value"
          option-attribute="label"
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
            <p class="text-sm">Nenhum fornecedor encontrado</p>
          </div>
        </template>

        <template #nome_empresa-data="{ row }">
          <span class="font-semibold text-gray-900 dark:text-white">{{ row.nome_empresa }}</span>
        </template>

        <template #cnpj-data="{ row }">
          <span class="font-mono text-gray-700">{{ formatarCnpjExibicao(row.cnpj) }}</span>
        </template>

        <template #endereco-data="{ row }">
          <span class="text-gray-600 text-sm">{{ formatarEnderecoExibicao(row) }}</span>
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
        :total-items="filteredFornecedores.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>

    <!-- Modal de Cadastro/Edicao -->
    <UModal
      v-model="modalOpen"
      :ui="{
        width: 'sm:max-w-2xl',
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
              {{ editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="modalOpen = false"
            />
          </div>
        </template>

        <form @submit.prevent="saveFornecedor" class="space-y-4">
          <!-- Dados da empresa -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormGroup label="Nome da Empresa" required>
              <UInput v-model="form.nome_empresa" placeholder="Nome da empresa" />
            </UFormGroup>

            <UFormGroup label="CNPJ" required>
              <UInput v-model="form.cnpj" placeholder="00.000.000/0000-00" maxlength="18" />
            </UFormGroup>
          </div>

          <!-- Endereco -->
          <div class="border-t border-gray-200 pt-4">
            <p class="text-sm font-medium text-gray-700 mb-3">Endereco</p>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <UFormGroup label="CEP">
                <div class="flex gap-2">
                  <UInput
                    v-model="form.cep"
                    placeholder="00000-000"
                    maxlength="9"
                    class="flex-1"
                  />
                  <UButton
                    color="gray"
                    variant="soft"
                    icon="i-heroicons-magnifying-glass"
                    :loading="buscandoCep"
                    :disabled="form.cep.replace(/\D/g, '').length !== 8"
                    @click="buscarCep"
                  />
                </div>
              </UFormGroup>

              <UFormGroup label="Logradouro" class="sm:col-span-2">
                <UInput v-model="form.logradouro" placeholder="Rua, Avenida..." />
              </UFormGroup>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <UFormGroup label="Numero">
                <UInput v-model="form.numero" placeholder="Numero" />
              </UFormGroup>

              <UFormGroup label="Complemento" class="sm:col-span-2">
                <UInput v-model="form.complemento" placeholder="Apto, Sala, Bloco..." />
              </UFormGroup>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <UFormGroup label="Bairro">
                <UInput v-model="form.bairro" placeholder="Bairro" />
              </UFormGroup>

              <UFormGroup label="Cidade">
                <UInput v-model="form.cidade" placeholder="Cidade" />
              </UFormGroup>

              <UFormGroup label="Estado">
                <USelect v-model="form.estado" :options="estadosOptions" placeholder="UF" />
              </UFormGroup>
            </div>
          </div>

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
            <UButton color="primary" class="w-full sm:w-auto" :loading="saving" @click="saveFornecedor">
              {{ editingFornecedor ? 'Salvar' : 'Criar' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal de Confirmacao de Exclusao -->
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
          <h3 class="text-lg font-semibold text-red-600">Confirmar Exclusao</h3>
        </template>

        <p>Tem certeza que deseja excluir o fornecedor <strong>{{ deletingFornecedor?.nome_empresa }}</strong>?</p>
        <p class="text-sm text-gray-500 mt-2">Esta acao nao pode ser desfeita.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deleting" @click="deleteFornecedor">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Fornecedor } from '~/types'

const { getFornecedores, createFornecedor, updateFornecedor, deleteFornecedor: removeFornecedor } = useEstoque()
const { empresaId } = useEmpresa()
const toast = useToast()

const fornecedores = ref<Fornecedor[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const buscandoCep = ref(false)
const search = ref('')
const filterStatus = ref('true')
const modalOpen = ref(false)
const deleteModalOpen = ref(false)
const editingFornecedor = ref<Fornecedor | null>(null)
const deletingFornecedor = ref<Fornecedor | null>(null)

const form = ref({
  nome_empresa: '',
  cnpj: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  ativo: true
})

const columns = [
  { key: 'nome_empresa', label: 'Nome da Empresa', sortable: true },
  { key: 'cnpj', label: 'CNPJ', sortable: true },
  { key: 'endereco', label: 'Endereco' },
  { key: 'ativo', label: 'Status', sortable: true },
  { key: 'actions', label: 'Acoes', class: 'text-right', rowClass: 'text-right' }
]

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Ativos', value: 'true' },
  { label: 'Inativos', value: 'false' }
]

const estadosOptions = [
  { label: '', value: '' },
  { label: 'AC', value: 'AC' }, { label: 'AL', value: 'AL' }, { label: 'AP', value: 'AP' },
  { label: 'AM', value: 'AM' }, { label: 'BA', value: 'BA' }, { label: 'CE', value: 'CE' },
  { label: 'DF', value: 'DF' }, { label: 'ES', value: 'ES' }, { label: 'GO', value: 'GO' },
  { label: 'MA', value: 'MA' }, { label: 'MT', value: 'MT' }, { label: 'MS', value: 'MS' },
  { label: 'MG', value: 'MG' }, { label: 'PA', value: 'PA' }, { label: 'PB', value: 'PB' },
  { label: 'PR', value: 'PR' }, { label: 'PE', value: 'PE' }, { label: 'PI', value: 'PI' },
  { label: 'RJ', value: 'RJ' }, { label: 'RN', value: 'RN' }, { label: 'RS', value: 'RS' },
  { label: 'RO', value: 'RO' }, { label: 'RR', value: 'RR' }, { label: 'SC', value: 'SC' },
  { label: 'SP', value: 'SP' }, { label: 'SE', value: 'SE' }, { label: 'TO', value: 'TO' }
]

// Formata CNPJ para exibicao na tabela
const formatarCnpjExibicao = (cnpj: string) => {
  if (!cnpj) return '-'
  const numeros = cnpj.replace(/\D/g, '')
  if (numeros.length !== 14) return cnpj
  return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

// Formata endereco para exibicao na tabela
const formatarEnderecoExibicao = (row: Fornecedor) => {
  const partes = []
  if (row.logradouro) {
    let rua = row.logradouro
    if (row.numero) rua += `, ${row.numero}`
    partes.push(rua)
  }
  if (row.bairro) partes.push(row.bairro)
  if (row.cidade && row.estado) {
    partes.push(`${row.cidade}/${row.estado}`)
  } else if (row.cidade) {
    partes.push(row.cidade)
  }
  return partes.length > 0 ? partes.join(' - ') : '-'
}

const filteredFornecedores = computed(() => {
  let result = fornecedores.value

  if (search.value) {
    const term = search.value.toLowerCase()
    const termNumeros = term.replace(/\D/g, '')
    result = result.filter(f =>
      (f.nome_empresa || '').toLowerCase().includes(term) ||
      (f.cnpj || '').toLowerCase().includes(term) ||
      (termNumeros.length > 0 && (f.cnpj || '').replace(/\D/g, '').includes(termNumeros))
    )
  }

  if (filterStatus.value) {
    const isActive = filterStatus.value === 'true'
    result = result.filter(f => f.ativo === isActive)
  }

  return result
})

const { page, pageSize, paginatedItems } = usePagination(filteredFornecedores)

// Mascara CNPJ reativa
watch(() => form.value.cnpj, (novo, antigo) => {
  let numeros = novo.replace(/\D/g, '')
  if (numeros.length > 14) numeros = numeros.slice(0, 14)

  let formatado = numeros
  if (numeros.length > 12) {
    formatado = numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5')
  } else if (numeros.length > 8) {
    formatado = numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4')
  } else if (numeros.length > 5) {
    formatado = numeros.replace(/^(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3')
  } else if (numeros.length > 2) {
    formatado = numeros.replace(/^(\d{2})(\d{1,3})/, '$1.$2')
  }

  if (formatado !== novo) {
    form.value.cnpj = formatado
  }
})

// Mascara CEP reativa + busca automatica ao completar 8 digitos
watch(() => form.value.cep, (novo) => {
  let numeros = novo.replace(/\D/g, '')
  if (numeros.length > 8) numeros = numeros.slice(0, 8)

  let formatado = numeros
  if (numeros.length > 5) {
    formatado = numeros.replace(/^(\d{5})(\d{1,3})/, '$1-$2')
  }

  if (formatado !== novo) {
    form.value.cep = formatado
  } else if (numeros.length === 8) {
    buscarCep()
  }
})

// Busca endereco pelo CEP via ViaCEP
const buscarCep = async () => {
  const cepNumeros = form.value.cep.replace(/\D/g, '')
  if (cepNumeros.length !== 8) return

  try {
    buscandoCep.value = true
    const response = await $fetch<any>(`https://viacep.com.br/ws/${cepNumeros}/json/`)

    if (response.erro) {
      toast.add({
        title: 'CEP nao encontrado',
        description: 'Verifique o CEP informado e tente novamente',
        color: 'yellow'
      })
      return
    }

    form.value.logradouro = response.logradouro || ''
    form.value.bairro = response.bairro || ''
    form.value.cidade = response.localidade || ''
    form.value.estado = response.uf || ''
    form.value.complemento = response.complemento || form.value.complemento

    toast.add({
      title: 'Endereco encontrado',
      description: `${response.logradouro}, ${response.localidade}/${response.uf}`,
      color: 'green'
    })
  } catch {
    toast.add({
      title: 'Erro',
      description: 'Erro ao buscar CEP. Tente novamente.',
      color: 'red'
    })
  } finally {
    buscandoCep.value = false
  }
}

// Valida formato do CNPJ
const validarCnpj = (cnpj: string) => {
  const numeros = cnpj.replace(/\D/g, '')
  return numeros.length === 14
}

const loadFornecedores = async () => {
  try {
    loading.value = true
    fornecedores.value = await getFornecedores(false)
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar fornecedores',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const resetForm = () => ({
  nome_empresa: '',
  cnpj: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  ativo: true
})

const openModal = (fornecedor?: Fornecedor) => {
  if (fornecedor) {
    editingFornecedor.value = fornecedor
    form.value = {
      nome_empresa: fornecedor.nome_empresa,
      cnpj: fornecedor.cnpj,
      cep: fornecedor.cep || '',
      logradouro: fornecedor.logradouro || '',
      numero: fornecedor.numero || '',
      complemento: fornecedor.complemento || '',
      bairro: fornecedor.bairro || '',
      cidade: fornecedor.cidade || '',
      estado: fornecedor.estado || '',
      ativo: fornecedor.ativo
    }
  } else {
    editingFornecedor.value = null
    form.value = resetForm()
  }
  modalOpen.value = true
}

const saveFornecedor = async () => {
  if (!form.value.nome_empresa) {
    toast.add({
      title: 'Erro',
      description: 'O nome da empresa e obrigatorio',
      color: 'red'
    })
    return
  }

  if (!form.value.cnpj || !validarCnpj(form.value.cnpj)) {
    toast.add({
      title: 'Erro',
      description: 'Informe um CNPJ valido com 14 digitos',
      color: 'red'
    })
    return
  }

  try {
    saving.value = true
    const dados = {
      nome_empresa: form.value.nome_empresa,
      cnpj: form.value.cnpj,
      cep: form.value.cep || null,
      logradouro: form.value.logradouro || null,
      numero: form.value.numero || null,
      complemento: form.value.complemento || null,
      bairro: form.value.bairro || null,
      cidade: form.value.cidade || null,
      estado: form.value.estado || null,
      ativo: form.value.ativo
    }

    if (editingFornecedor.value) {
      await updateFornecedor(editingFornecedor.value.id, dados)
      toast.add({
        title: 'Sucesso',
        description: 'Fornecedor atualizado com sucesso',
        color: 'green'
      })
    } else {
      await createFornecedor(dados)
      toast.add({
        title: 'Sucesso',
        description: 'Fornecedor criado com sucesso',
        color: 'green'
      })
      page.value = 1
    }
    modalOpen.value = false
    await loadFornecedores()
  } catch (error: any) {
    let mensagem = 'Erro ao salvar fornecedor'

    if (error.message?.includes('fornecedores_cnpj_key') || error.code === '23505') {
      mensagem = 'Ja existe um fornecedor com esse CNPJ'
    }

    toast.add({
      title: 'Erro',
      description: mensagem,
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (fornecedor: Fornecedor) => {
  deletingFornecedor.value = fornecedor
  deleteModalOpen.value = true
}

const deleteFornecedor = async () => {
  if (!deletingFornecedor.value) return

  try {
    deleting.value = true
    await removeFornecedor(deletingFornecedor.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Fornecedor excluido com sucesso',
      color: 'green'
    })
    deleteModalOpen.value = false
    await loadFornecedores()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir fornecedor',
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}

watch(empresaId, () => {
  if (empresaId.value) {
    loadFornecedores()
  }
}, { immediate: true })
</script>
