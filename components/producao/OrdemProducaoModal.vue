<template>
  <UModal
    v-model="isOpen"
    :ui="{
      width: 'sm:max-w-2xl',
      overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
      background: 'bg-white dark:bg-operacao-800',
      ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
      shadow: 'shadow-2xl'
    }"
  >
    <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Nova Ordem de Produção</h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isOpen = false" />
        </div>
      </template>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormGroup label="Ficha Técnica" required class="md:col-span-2">
            <USelectMenu
              v-model="form.ficha_tecnica_id"
              :options="fichasOptions"
              searchable
              searchable-placeholder="Buscar ficha..."
              placeholder="Selecione a ficha técnica"
              value-attribute="value"
              option-attribute="label"
            />
          </UFormGroup>

          <UFormGroup :label="`Quantidade a Produzir (${unidadeReceita})`" required>
            <UInput v-model.number="form.quantidade_planejada" type="number" step="0.01" min="0.01" placeholder="1" />
          </UFormGroup>

          <UFormGroup label="Data de Produção" required>
            <UInput v-model="form.data_planejada" type="date" />
          </UFormGroup>

          <UFormGroup label="Responsável">
            <UInput v-model="form.responsavel_nome" placeholder="Nome do responsável" />
          </UFormGroup>

          <UFormGroup label="Observações">
            <UTextarea v-model="form.observacao" placeholder="Observações (opcional)" :rows="2" />
          </UFormGroup>
        </div>

        <!-- Preview Ingredientes -->
        <div v-if="fichaSelecionada && form.quantidade_planejada > 0">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-operacao-700">Ingredientes Necessários</label>
            <span v-if="disponibilidade.length > 0" class="text-xs text-operacao-400">
              Custo estimado: <strong class="text-guardian-700">{{ formatCurrency(custoEstimado) }}</strong>
            </span>
          </div>

          <div class="rounded-lg border border-operacao-200 overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-operacao-50">
                  <th class="text-left px-3 py-2 text-xs font-medium text-operacao-500 uppercase">Ingrediente</th>
                  <th class="text-right px-3 py-2 text-xs font-medium text-operacao-500 uppercase">Necessário</th>
                  <th class="text-right px-3 py-2 text-xs font-medium text-operacao-500 uppercase">Estoque</th>
                  <th class="text-center px-3 py-2 text-xs font-medium text-operacao-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-operacao-100">
                <tr v-for="d in disponibilidade" :key="d.produto_id">
                  <td class="px-3 py-2 text-operacao-700">{{ nomeProduto(d.produto_id) }}</td>
                  <td class="px-3 py-2 text-right text-operacao-600">{{ formatNumber(d.quantidade_necessaria) }}</td>
                  <td class="px-3 py-2 text-right text-operacao-600">{{ formatNumber(d.saldo_atual) }}</td>
                  <td class="px-3 py-2 text-center">
                    <span
                      class="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs"
                      :class="{
                        'bg-green-100 text-green-700': d.semaforo === 'verde',
                        'bg-yellow-100 text-yellow-700': d.semaforo === 'amarelo',
                        'bg-red-100 text-red-700': d.semaforo === 'vermelho'
                      }"
                    >
                      {{ d.semaforo === 'verde' ? '✓' : d.semaforo === 'amarelo' ? '!' : '✗' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="temInsuficiente" class="mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <UIcon name="i-heroicons-x-circle" class="w-4 h-4" />
            Estoque insuficiente. Não é possível criar a OP.
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="isOpen = false">
            Cancelar
          </UButton>
          <UButton color="primary" class="w-full sm:w-auto" :loading="criando" :disabled="!formValido || temInsuficiente" @click="criar">
            Criar OP
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { FichaTecnica, Produto } from '~/types'

const props = defineProps<{
  modelValue: boolean
  fichas: FichaTecnica[]
  produtos: Produto[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'criado': []
}>()

const { createOrdemProducao, calcularDisponibilidade } = useProducao()
const { formatCurrency } = useFormatters()
const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const hoje = new Date().toISOString().split('T')[0]

const form = ref({
  ficha_tecnica_id: '',
  quantidade_planejada: 1,
  data_planejada: hoje,
  responsavel_nome: '',
  observacao: ''
})

const criando = ref(false)
const disponibilidade = ref<Array<{
  produto_id: string
  quantidade_necessaria: number
  saldo_atual: number
  saldo_apos: number
  custo_medio: number
  semaforo: 'verde' | 'amarelo' | 'vermelho'
}>>([])

const fichasOptions = computed(() =>
  props.fichas.filter(f => f.ativa).map(f => ({
    value: f.id,
    label: `${f.nome} (${f.produto?.nome || ''})`
  }))
)

const fichaSelecionada = computed(() =>
  props.fichas.find(f => f.id === form.value.ficha_tecnica_id)
)

const unidadeReceita = computed(() =>
  fichaSelecionada.value?.produto?.unidade?.sigla || 'un'
)

const custoEstimado = computed(() =>
  disponibilidade.value.reduce((acc, d) => acc + (d.custo_medio * d.quantidade_necessaria), 0)
)

const temInsuficiente = computed(() =>
  disponibilidade.value.some(d => d.semaforo === 'vermelho')
)

const formValido = computed(() =>
  form.value.ficha_tecnica_id &&
  form.value.quantidade_planejada > 0 &&
  form.value.data_planejada
)

const nomeProduto = (id: string) => {
  const p = props.produtos.find(p => p.id === id)
  return p ? `${p.nome} (${p.unidade?.sigla || ''})` : id
}

const formatNumber = (n: number) => {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

// Recalcular disponibilidade quando ficha ou quantidade mudam
watch([() => form.value.ficha_tecnica_id, () => form.value.quantidade_planejada], async ([fichaId, qtd]) => {
  if (!fichaId || !qtd || qtd <= 0) {
    disponibilidade.value = []
    return
  }

  const ficha = props.fichas.find(f => f.id === fichaId)
  if (!ficha?.ingredientes?.length) {
    disponibilidade.value = []
    return
  }

  try {
    const rendimento = ficha.rendimento || 1
    const ingredientes = ficha.ingredientes.map(ing => ({
      produto_id: ing.produto_id,
      quantidade_planejada: Number(((ing.quantidade / rendimento) * qtd * ing.fator_correcao).toFixed(4))
    }))
    disponibilidade.value = await calcularDisponibilidade(ingredientes)
  } catch (e) {
    disponibilidade.value = []
  }
}, { immediate: true })

const criar = async () => {
  if (!formValido.value) return
  criando.value = true

  try {
    await createOrdemProducao(form.value)
    toast.add({ title: 'OP criada com sucesso', color: 'green' })
    emit('criado')
    isOpen.value = false
  } catch (e: any) {
    toast.add({ title: 'Erro ao criar OP', description: e.message, color: 'red' })
  } finally {
    criando.value = false
  }
}

// Reset form ao abrir
watch(isOpen, (open) => {
  if (open) {
    form.value = {
      ficha_tecnica_id: '',
      quantidade_planejada: 1,
      data_planejada: hoje,
      responsavel_nome: '',
      observacao: ''
    }
    disponibilidade.value = []
  }
})
</script>
