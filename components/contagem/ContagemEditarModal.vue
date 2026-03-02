<template>
  <UModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :ui="{
      width: 'sm:max-w-2xl',
      overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
      background: 'bg-white dark:bg-operacao-800',
      fullscreen: 'sm:not-fullscreen'
    }"
    fullscreen
  >
    <div class="flex flex-col h-full max-h-[90vh]">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-operacao-200">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-guardian-100 rounded-lg">
            <UIcon name="i-heroicons-pencil-square" class="w-5 h-5 text-guardian-600" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-operacao-800">Editar contagem recorrente</h3>
            <p class="text-xs text-operacao-400">Altere as configuracoes da contagem</p>
          </div>
        </div>
        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="close" />
      </div>

      <!-- Action buttons -->
      <div class="px-6 py-3 border-b border-operacao-200 flex gap-2">
        <UButton
          color="primary"
          :loading="salvando"
          :disabled="!formValido"
          @click="salvar"
        >
          <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
          Salvar
        </UButton>
        <UButton
          color="red"
          variant="soft"
          :loading="excluindo"
          @click="confirmarExcluir"
        >
          <UIcon name="i-heroicons-trash" class="w-4 h-4 mr-1.5" />
          Excluir
        </UButton>
      </div>

      <!-- Scrollable form -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        <!-- Nome -->
        <UFormGroup label="Nome da Contagem" required>
          <UInput v-model="nome" placeholder="Ex: Contagem semanal" />
        </UFormGroup>

        <!-- Recorrencia + Horario -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup label="Recorrencia" required>
            <USelect
              v-model="recorrencia"
              :options="opcoesRecorrencia"
              option-attribute="label"
              value-attribute="value"
            />
          </UFormGroup>
          <UFormGroup label="Horário da Notificação">
            <UInput v-model="horarioNotificacao" type="time" />
          </UFormGroup>
        </div>

        <!-- Dynamic recurrence fields -->
        <template v-if="recorrencia && recorrencia !== 'nenhuma'">

          <!-- Semanal / Quinzenal: dias da semana -->
          <div v-if="recorrencia === 'semanal' || recorrencia === 'quinzenal'">
            <UFormGroup label="Dias em que ocorre" required>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="dia in diasDaSemana"
                  :key="dia.value"
                  type="button"
                  class="px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all min-w-[52px] text-center"
                  :class="diasSemana.has(dia.value)
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-operacao-200 bg-white text-operacao-400 hover:border-operacao-300 hover:bg-operacao-50'"
                  @click="toggleDiaSemana(dia.value)"
                >
                  {{ dia.label }}
                </button>
              </div>
            </UFormGroup>
          </div>

          <!-- Mensal: posicao + dia -->
          <template v-if="recorrencia === 'mensal'">
            <UFormGroup label="Ocorre em" required>
              <div class="grid grid-cols-2 gap-3">
                <USelect
                  v-model="mensalPosicao"
                  :options="opcoesMensalPosicao"
                  option-attribute="label"
                  value-attribute="value"
                />
                <USelect
                  v-model="mensalDia"
                  :options="opcoesMensalDia"
                  option-attribute="label"
                  value-attribute="value"
                />
              </div>
            </UFormGroup>
          </template>

          <!-- Helper text -->
          <p class="text-xs text-operacao-400 -mt-2">
            Nos dias em que a contagem deve ser executada, e no horario definido,
            o responsavel recebera uma notificacao com um link para realizar a contagem.
          </p>
        </template>

        <!-- Responsavel -->
        <div>
          <h4 class="font-semibold text-operacao-800 mb-1">Responsavel</h4>
          <p class="text-sm text-operacao-400 mb-3">Quem vai realizar esta contagem?</p>

          <!-- Inline add new responsavel -->
          <div class="flex items-end gap-2 mb-3">
            <div class="flex-1 grid grid-cols-2 gap-2">
              <UInput
                v-model="novoResponsavelNome"
                placeholder="Nome"
                size="sm"
                icon="i-heroicons-user"
                @keydown.enter="adicionarResponsavel"
              />
              <UInput
                v-model="novoResponsavelTelefone"
                placeholder="Telefone"
                size="sm"
                icon="i-heroicons-phone"
                @keydown.enter="adicionarResponsavel"
              />
            </div>
            <UButton
              color="gray"
              variant="solid"
              size="sm"
              :disabled="!novoResponsavelNome.trim() || !novoResponsavelTelefone.trim()"
              @click="adicionarResponsavel"
            >
              <UIcon name="i-heroicons-plus" class="w-4 h-4" />
            </UButton>
          </div>

          <!-- Responsavel chips -->
          <div v-if="allResponsaveis.length > 0" class="flex flex-wrap gap-2">
            <button
              v-for="resp in allResponsaveis"
              :key="resp.nome + resp.telefone"
              type="button"
              class="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-sm transition-all border"
              :class="responsavel?.nome === resp.nome && responsavel?.telefone === resp.telefone
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-100'
                : 'border-operacao-200 bg-operacao-50 text-operacao-500 hover:border-operacao-300 hover:bg-operacao-100'"
              @click="responsavel = (responsavel?.nome === resp.nome && responsavel?.telefone === resp.telefone) ? null : resp"
            >
              <span
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase"
                :class="responsavel?.nome === resp.nome && responsavel?.telefone === resp.telefone
                  ? 'bg-emerald-500 text-white'
                  : 'bg-operacao-200 text-operacao-400'"
              >
                {{ resp.nome.charAt(0) }}
              </span>
              <span class="font-medium">{{ resp.nome }}</span>
              <span class="text-xs opacity-60">{{ resp.telefone }}</span>
              <UIcon
                v-if="responsavel?.nome === resp.nome && responsavel?.telefone === resp.telefone"
                name="i-heroicons-check-circle-solid"
                class="w-4 h-4 text-emerald-500"
              />
            </button>
          </div>
        </div>

        <div class="border-t border-operacao-200" />

        <!-- Setores -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <h4 class="font-semibold text-operacao-800">Selecionar Setores</h4>
            <span v-if="setoresSelecionados.size > 0" class="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {{ setoresSelecionados.size }} selecionado{{ setoresSelecionados.size !== 1 ? 's' : '' }}
            </span>
          </div>
          <p class="text-sm text-operacao-400 mb-3">Selecione os setores que farao parte desta contagem recorrente.</p>

          <UInput
            v-if="setores.length > 5"
            v-model="buscaSetor"
            placeholder="Filtrar setores..."
            icon="i-heroicons-magnifying-glass"
            size="sm"
            class="mb-3"
          />

          <div v-if="setoresFiltrados.length === 0" class="text-center py-6 text-operacao-400">
            <UIcon name="i-heroicons-map-pin" class="w-8 h-8 mb-2 mx-auto" />
            <p class="text-sm font-medium">Nenhum setor encontrado</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="setor in setoresFiltrados"
              :key="setor.id"
              class="border rounded-xl p-4 transition-all"
              :class="setoresSelecionados.has(setor.id)
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-operacao-200 bg-white'"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-operacao-800">{{ setor.nome }}</p>
                  <p class="text-xs text-operacao-400 mt-0.5">
                    {{ setorProdutosCount[setor.id] || 0 }} {{ (setorProdutosCount[setor.id] || 0) === 1 ? 'produto' : 'produtos' }}
                  </p>
                  <!-- Product list preview -->
                  <div v-if="produtosPorSetor[setor.id] && produtosPorSetor[setor.id].length > 0" class="mt-2">
                    <p class="text-xs text-operacao-400 leading-relaxed">
                      {{ produtosPorSetor[setor.id].slice(0, 5).map(p => p.nome).join(', ') }}
                      <span v-if="produtosPorSetor[setor.id].length > 5" class="text-operacao-300">
                        ...e mais {{ produtosPorSetor[setor.id].length - 5 }}
                      </span>
                    </p>
                  </div>
                </div>
                <UButton
                  v-if="setoresSelecionados.has(setor.id)"
                  color="red"
                  variant="soft"
                  size="xs"
                  @click="toggleSetor(setor.id)"
                >
                  Remover
                </UButton>
                <UButton
                  v-else
                  color="primary"
                  variant="soft"
                  size="xs"
                  @click="toggleSetor(setor.id)"
                >
                  Selecionar
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <UModal v-model="modalExcluirOpen" :ui="{ overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' } }">
      <UCard :ui="{ ring: 'ring-0', shadow: '', divide: 'divide-operacao-100' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Excluir Contagem</h3>
        </template>
        <p>Tem certeza que deseja excluir a contagem <strong>{{ contagem?.nome }}</strong>?</p>
        <p class="text-sm text-red-500 mt-2">Esta acao nao pode ser desfeita.</p>
        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalExcluirOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="excluindo" @click="excluirConfirmado">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </UModal>
</template>

<script setup lang="ts">
import type { Contagem, Setor } from '~/types'

const props = defineProps<{
  modelValue: boolean
  contagem: Contagem | null
  setores: Setor[]
  responsaveis: { id?: string; nome: string; telefone: string }[]
  setorProdutosCount: Record<string, number>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
  'deleted': []
}>()

const toast = useToast()
const { updateContagem, deleteContagem, createResponsavel, getAllSetorProdutos } = useEstoque()
const { empresaId } = useEmpresa()

// ==========================================
// FORM STATE
// ==========================================
const nome = ref('')
const recorrencia = ref('nenhuma')
const horarioNotificacao = ref('07:00')
const diasSemana = ref<Set<string>>(new Set())
const mensalPosicao = ref('primeira')
const mensalDia = ref('segunda')
const responsavel = ref<{ id?: string; nome: string; telefone: string } | null>(null)
const setoresSelecionados = ref<Set<string>>(new Set())

// UI state
const salvando = ref(false)
const excluindo = ref(false)
const modalExcluirOpen = ref(false)
const buscaSetor = ref('')
const novoResponsavelNome = ref('')
const novoResponsavelTelefone = ref('')

// Products per setor for preview
const produtosPorSetor = ref<Record<string, { id: string; nome: string }[]>>({})

// ==========================================
// OPTIONS
// ==========================================
const opcoesRecorrencia = [
  { label: 'Nao definida', value: 'nenhuma' },
  { label: 'Diaria', value: 'diaria' },
  { label: 'Semanal', value: 'semanal' },
  { label: 'A cada duas semanas', value: 'quinzenal' },
  { label: 'Mensal', value: 'mensal' }
]

const opcoesHorario = Array.from({ length: 16 }, (_, i) => {
  const h = i + 5
  const label = `${String(h).padStart(2, '0')}:00`
  return { label, value: label }
})

const diasDaSemana = [
  { label: 'SEG', value: 'seg' },
  { label: 'TER', value: 'ter' },
  { label: 'QUA', value: 'qua' },
  { label: 'QUI', value: 'qui' },
  { label: 'SEX', value: 'sex' },
  { label: 'SAB', value: 'sab' },
  { label: 'DOM', value: 'dom' }
]

const opcoesMensalPosicao = [
  { label: 'Primeira(o)', value: 'primeira' },
  { label: 'Ultima(o)', value: 'ultima' }
]

const opcoesMensalDia = [
  { label: 'domingo do mes', value: 'domingo' },
  { label: 'segunda-feira do mes', value: 'segunda' },
  { label: 'terca-feira do mes', value: 'terca' },
  { label: 'quarta-feira do mes', value: 'quarta' },
  { label: 'quinta-feira do mes', value: 'quinta' },
  { label: 'sexta-feira do mes', value: 'sexta' },
  { label: 'sabado do mes', value: 'sabado' },
  { label: 'dia do mes', value: 'dia' }
]

// ==========================================
// COMPUTED
// ==========================================
const formValido = computed(() => {
  return nome.value.trim().length > 0 && setoresSelecionados.value.size > 0
})

const allResponsaveis = computed(() => {
  return props.responsaveis
})

const setoresFiltrados = computed(() => {
  if (!buscaSetor.value) return props.setores
  const term = buscaSetor.value.toLowerCase()
  return props.setores.filter(s => s.nome.toLowerCase().includes(term))
})

// ==========================================
// WATCHERS
// ==========================================

// Populate form when contagem prop changes
watch(
  () => props.contagem,
  async (c) => {
    if (!c) return

    nome.value = c.nome || ''
    recorrencia.value = c.recorrencia || 'nenhuma'
    horarioNotificacao.value = c.horario_notificacao || '07:00'
    diasSemana.value = new Set(c.dias_semana || [])
    mensalPosicao.value = c.mensal_posicao || 'primeira'
    mensalDia.value = c.mensal_dia || 'segunda'

    // Set responsavel
    if (c.responsavel_nome) {
      const found = props.responsaveis.find(
        r => r.nome === c.responsavel_nome && r.telefone === c.responsavel_telefone
      )
      responsavel.value = found || {
        nome: c.responsavel_nome,
        telefone: c.responsavel_telefone || ''
      }
    } else {
      responsavel.value = null
    }

    // Set setores from contagem_setores
    const ids = (c.contagem_setores || []).map(cs => cs.setor_id)
    setoresSelecionados.value = new Set(ids)

    // Reset search
    buscaSetor.value = ''

    // Load products per setor for preview
    await carregarProdutosPorSetor()
  },
  { immediate: true }
)

// Reset dynamic fields when recurrence changes
watch(recorrencia, (newVal, oldVal) => {
  if (oldVal === undefined) return
  // Only reset sub-fields if user manually changed recurrence type
  if (newVal !== oldVal) {
    if (newVal !== 'semanal' && newVal !== 'quinzenal') {
      diasSemana.value = new Set()
    }
    if (newVal !== 'mensal') {
      mensalPosicao.value = 'primeira'
      mensalDia.value = 'segunda'
    }
  }
})

// ==========================================
// METHODS
// ==========================================
const close = () => {
  emit('update:modelValue', false)
}

const toggleDiaSemana = (dia: string) => {
  const novo = new Set(diasSemana.value)
  if (novo.has(dia)) {
    novo.delete(dia)
  } else {
    novo.add(dia)
  }
  diasSemana.value = novo
}

const toggleSetor = (setorId: string) => {
  const novo = new Set(setoresSelecionados.value)
  if (novo.has(setorId)) {
    novo.delete(setorId)
  } else {
    novo.add(setorId)
  }
  setoresSelecionados.value = novo
}

const adicionarResponsavel = async () => {
  if (!novoResponsavelNome.value.trim() || !novoResponsavelTelefone.value.trim()) return
  try {
    const novo = await createResponsavel({
      nome: novoResponsavelNome.value.trim(),
      telefone: novoResponsavelTelefone.value.trim()
    })
    // The parent should refresh the responsaveis list.
    // For now, select the new one immediately.
    responsavel.value = novo
    novoResponsavelNome.value = ''
    novoResponsavelTelefone.value = ''
    toast.add({ title: 'Sucesso', description: 'Responsavel adicionado', color: 'green' })
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar responsavel', color: 'red' })
  }
}

const carregarProdutosPorSetor = async () => {
  try {
    const allSP = await getAllSetorProdutos()
    const map: Record<string, { id: string; nome: string }[]> = {}
    for (const sp of allSP) {
      if (!map[sp.setor_id]) map[sp.setor_id] = []
      if (sp.produto) map[sp.setor_id].push(sp.produto)
    }
    produtosPorSetor.value = map
  } catch {
    produtosPorSetor.value = {}
  }
}

const salvar = async () => {
  if (!props.contagem || !formValido.value) return

  try {
    salvando.value = true

    const diasSemanaArr = Array.from(diasSemana.value)

    await updateContagem(
      props.contagem.id,
      {
        nome: nome.value.trim(),
        recorrencia: recorrencia.value,
        horario_notificacao: horarioNotificacao.value,
        dias_semana: diasSemanaArr.length > 0 ? diasSemanaArr : undefined,
        mensal_posicao: recorrencia.value === 'mensal' ? mensalPosicao.value : undefined,
        mensal_dia: recorrencia.value === 'mensal' ? mensalDia.value : undefined,
        responsavel_nome: responsavel.value?.nome || undefined,
        responsavel_telefone: responsavel.value?.telefone || undefined,
        responsavel_id: (responsavel.value as any)?.id || undefined
      },
      Array.from(setoresSelecionados.value)
    )

    toast.add({ title: 'Sucesso', description: 'Contagem atualizada com sucesso', color: 'green' })
    emit('saved')
    close()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar contagem', color: 'red' })
  } finally {
    salvando.value = false
  }
}

const confirmarExcluir = () => {
  modalExcluirOpen.value = true
}

const excluirConfirmado = async () => {
  if (!props.contagem) return

  try {
    excluindo.value = true
    await deleteContagem(props.contagem.id)
    modalExcluirOpen.value = false
    toast.add({ title: 'Sucesso', description: 'Contagem excluida', color: 'green' })
    emit('deleted')
    close()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao excluir contagem', color: 'red' })
  } finally {
    excluindo.value = false
  }
}
</script>
