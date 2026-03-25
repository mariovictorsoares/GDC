<template>
  <UModal
    v-model="isOpen"
    :ui="{
      width: 'sm:max-w-3xl',
      overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
      background: 'bg-white dark:bg-operacao-800',
      ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
      shadow: 'shadow-2xl'
    }"
  >
    <UCard v-if="op" :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-semibold">{{ op.codigo }}</h3>
            <UBadge :color="statusColor" variant="subtle" size="sm">
              {{ statusLabel }}
            </UBadge>
            <UBadge v-if="atrasada" color="red" variant="solid" size="xs">Atrasada</UBadge>
          </div>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isOpen = false" />
        </div>
      </template>

      <div class="space-y-5">
        <!-- Info básica -->
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-operacao-400">Produto</span>
            <p class="font-medium text-operacao-800">{{ op.produto?.nome }}</p>
          </div>
          <div>
            <span class="text-operacao-400">Data Planejada</span>
            <p class="font-medium text-operacao-800">{{ formatDate(op.data_planejada) }}</p>
          </div>
          <div>
            <span class="text-operacao-400">Responsável</span>
            <p class="font-medium text-operacao-800">{{ op.responsavel_nome || '-' }}</p>
          </div>
          <div>
            <span class="text-operacao-400">Ficha Técnica (v{{ op.ficha_versao }})</span>
            <p class="font-medium text-operacao-800">{{ op.quantidade_planejada }} {{ op.produto?.unidade?.sigla }}</p>
          </div>
          <div v-if="op.data_inicio">
            <span class="text-operacao-400">Início</span>
            <p class="font-medium text-operacao-800">{{ formatDateTime(op.data_inicio) }}</p>
          </div>
          <div v-if="op.data_conclusao">
            <span class="text-operacao-400">Conclusão</span>
            <p class="font-medium text-operacao-800">{{ formatDateTime(op.data_conclusao) }}</p>
          </div>
          <div v-if="op.observacao" class="col-span-2">
            <span class="text-operacao-400">Observações</span>
            <p class="text-operacao-700">{{ op.observacao }}</p>
          </div>
        </div>

        <!-- Custos -->
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-lg bg-operacao-50 border border-operacao-100">
            <span class="text-xs text-operacao-400">Custo Estimado</span>
            <p class="text-lg font-semibold text-operacao-800">{{ formatCurrency(op.custo_estimado || 0) }}</p>
          </div>
          <div v-if="op.status === 'concluida'" class="p-3 rounded-lg border" :class="custoVarianciaClass">
            <span class="text-xs" :class="custoVarianciaTextClass">Custo Real</span>
            <p class="text-lg font-semibold" :class="custoVarianciaTextClass">{{ formatCurrency(op.custo_real || 0) }}</p>
            <span class="text-xs" :class="custoVarianciaTextClass">({{ custoVariancia > 0 ? '+' : '' }}{{ custoVariancia.toFixed(1) }}%)</span>
          </div>
        </div>

        <!-- Variância de rendimento (se concluída) -->
        <div v-if="op.status === 'concluida'" class="grid grid-cols-2 gap-3">
          <div class="p-3 rounded-lg border" :class="rendimentoVarianciaClass">
            <span class="text-xs" :class="rendimentoVarianciaTextClass">Rendimento</span>
            <p class="text-lg font-semibold" :class="rendimentoVarianciaTextClass">{{ rendimentoPercentual.toFixed(1) }}%</p>
          </div>
          <div class="p-3 rounded-lg bg-operacao-50 border border-operacao-100">
            <span class="text-xs text-operacao-400">Qtd Produzida</span>
            <p class="text-lg font-semibold text-operacao-800">{{ op.quantidade_produzida }} {{ op.produto?.unidade?.sigla }}</p>
          </div>
        </div>

        <!-- Ingredientes -->
        <div>
          <label class="text-sm font-medium text-operacao-700 mb-2 block">Ingredientes</label>
          <div class="rounded-lg border border-operacao-200 overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="bg-operacao-50">
                  <th class="text-left px-3 py-2 text-xs font-medium text-operacao-500 uppercase">Ingrediente</th>
                  <th class="text-right px-3 py-2 text-xs font-medium text-operacao-500 uppercase">Planejado</th>
                  <th v-if="emConclusao || op.status === 'concluida'" class="text-right px-3 py-2 text-xs font-medium text-operacao-500 uppercase">Real</th>
                  <th class="text-right px-3 py-2 text-xs font-medium text-operacao-500 uppercase">Custo Unit.</th>
                  <th v-if="op.status === 'planejada' || op.status === 'em_producao'" class="text-center px-3 py-2 text-xs font-medium text-operacao-500 uppercase">Estoque</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-operacao-100">
                <tr v-for="(ing, idx) in op.ingredientes" :key="ing.id">
                  <td class="px-3 py-2 text-operacao-700">{{ ing.produto?.nome }} <span class="text-operacao-400">({{ ing.produto?.unidade?.sigla }})</span></td>
                  <td class="px-3 py-2 text-right text-operacao-600">{{ formatNumber(ing.quantidade_planejada) }}</td>
                  <td v-if="emConclusao" class="px-3 py-2 text-right">
                    <UInput
                      v-model.number="quantidadesReais[idx]"
                      type="number"
                      step="0.001"
                      min="0"
                      size="xs"
                      class="w-24 ml-auto"
                    />
                  </td>
                  <td v-else-if="op.status === 'concluida'" class="px-3 py-2 text-right text-operacao-600">{{ formatNumber(ing.quantidade_real || ing.quantidade_planejada) }}</td>
                  <td class="px-3 py-2 text-right text-operacao-600">{{ formatCurrency(ing.custo_unitario || 0) }}</td>
                  <td v-if="op.status === 'planejada' || op.status === 'em_producao'" class="px-3 py-2 text-center">
                    <span
                      v-if="disponibilidadeMap.has(ing.produto_id)"
                      class="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs"
                      :class="semaforoClass(disponibilidadeMap.get(ing.produto_id)!)"
                    >
                      {{ semaforoIcon(disponibilidadeMap.get(ing.produto_id)!) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Seção de conclusão -->
        <div v-if="emConclusao" class="space-y-4 p-4 bg-guardian-50 rounded-lg border border-guardian-200">
          <label class="text-sm font-medium text-guardian-800 block">Concluir Produção</label>

          <UFormGroup :label="`Quantidade Produzida (${op.produto?.unidade?.sigla || 'un'})`">
            <UInput v-model.number="quantidadeProduzida" type="number" step="0.01" min="0.01" />
          </UFormGroup>

          <div class="flex items-center justify-between text-sm">
            <span class="text-guardian-700">Custo total ingredientes:</span>
            <span class="font-semibold text-guardian-800">{{ formatCurrency(custoRealEstimado) }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-guardian-700">Custo unitário produzido:</span>
            <span class="font-semibold text-guardian-800">{{ formatCurrency(custoUnitarioEstimado) }}/{{ op.produto?.unidade?.sigla || 'un' }}</span>
          </div>

          <!-- Alerta de variância -->
          <div v-if="alertaRendimento" class="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" />
            Variação de rendimento de {{ rendimentoPreview.toFixed(1) }}% — confirme que os valores estão corretos.
          </div>
        </div>

        <!-- Motivo cancelamento -->
        <div v-if="op.status === 'cancelada' && op.motivo_cancelamento" class="p-4 bg-red-50 rounded-lg border border-red-200">
          <span class="text-xs font-medium text-red-600 uppercase">Motivo do Cancelamento</span>
          <p class="text-sm text-red-800 mt-1">{{ op.motivo_cancelamento }}</p>
        </div>

        <!-- Seção cancelar -->
        <div v-if="cancelando" class="space-y-3 p-4 bg-red-50 rounded-lg border border-red-200">
          <label class="text-sm font-medium text-red-800 block">Cancelar OP</label>
          <UFormGroup label="Motivo (obrigatório)">
            <UTextarea v-model="motivoCancelamento" placeholder="Informe o motivo do cancelamento" :rows="2" />
          </UFormGroup>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <div>
            <!-- Botão cancelar OP -->
            <UButton
              v-if="(op.status === 'planejada' || op.status === 'em_producao') && !emConclusao"
              color="red"
              variant="soft"
              size="sm"
              @click="cancelando ? confirmarCancelamento() : (cancelando = true)"
              :loading="processando"
              :disabled="cancelando && !motivoCancelamento.trim()"
            >
              {{ cancelando ? 'Confirmar Cancelamento' : 'Cancelar OP' }}
            </UButton>
            <UButton v-if="cancelando" color="white" size="sm" class="ml-2" @click="cancelando = false">
              Voltar
            </UButton>
          </div>

          <div class="flex gap-2">
            <!-- Imprimir -->
            <UButton v-if="op.status !== 'cancelada'" color="gray" variant="ghost" size="sm" @click="imprimir">
              <UIcon name="i-heroicons-printer" class="w-4 h-4 mr-1" />
              Imprimir
            </UButton>

            <!-- Iniciar Produção -->
            <UButton
              v-if="op.status === 'planejada'"
              color="primary"
              :loading="processando"
              @click="iniciar"
            >
              Iniciar Produção
            </UButton>

            <!-- Concluir -->
            <UButton
              v-if="op.status === 'em_producao' && !emConclusao"
              color="primary"
              @click="emConclusao = true"
            >
              Concluir Produção
            </UButton>

            <UButton
              v-if="emConclusao"
              color="primary"
              :loading="processando"
              :disabled="!quantidadeProduzida || quantidadeProduzida <= 0"
              @click="concluir"
            >
              Confirmar e Baixar Estoque
            </UButton>
          </div>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { OrdemProducao } from '~/types'

const props = defineProps<{
  modelValue: boolean
  op: OrdemProducao | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'atualizado': []
}>()

const { iniciarProducao, cancelarProducao, calcularDisponibilidade } = useProducao()
const { formatCurrency } = useFormatters()
const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Estado
const processando = ref(false)
const emConclusao = ref(false)
const cancelando = ref(false)
const motivoCancelamento = ref('')
const quantidadeProduzida = ref(0)
const quantidadesReais = ref<number[]>([])
const disponibilidadeMap = ref(new Map<string, 'verde' | 'amarelo' | 'vermelho'>())

// Status helpers
const statusColor = computed(() => {
  switch (props.op?.status) {
    case 'planejada': return 'blue'
    case 'em_producao': return 'amber'
    case 'concluida': return 'green'
    case 'cancelada': return 'red'
    default: return 'gray'
  }
})

const statusLabel = computed(() => {
  switch (props.op?.status) {
    case 'planejada': return 'Planejada'
    case 'em_producao': return 'Em Produção'
    case 'concluida': return 'Concluída'
    case 'cancelada': return 'Cancelada'
    default: return ''
  }
})

const atrasada = computed(() => {
  if (!props.op || props.op.status !== 'planejada') return false
  return props.op.data_planejada < new Date().toISOString().split('T')[0]
})

// Variâncias
const rendimentoPercentual = computed(() => {
  if (!props.op?.quantidade_planejada || !props.op?.quantidade_produzida) return 0
  return (props.op.quantidade_produzida / props.op.quantidade_planejada) * 100
})

const custoVariancia = computed(() => {
  if (!props.op?.custo_estimado || !props.op?.custo_real) return 0
  return ((props.op.custo_real - props.op.custo_estimado) / props.op.custo_estimado) * 100
})

const rendimentoPreview = computed(() => {
  if (!props.op?.quantidade_planejada || !quantidadeProduzida.value) return 100
  return (quantidadeProduzida.value / props.op.quantidade_planejada) * 100
})

const alertaRendimento = computed(() =>
  Math.abs(rendimentoPreview.value - 100) > 10
)

const custoRealEstimado = computed(() => {
  if (!props.op?.ingredientes) return 0
  return props.op.ingredientes.reduce((acc, ing, idx) => {
    const qtdReal = quantidadesReais.value[idx] || ing.quantidade_planejada
    return acc + ((ing.custo_unitario || 0) * qtdReal)
  }, 0)
})

const custoUnitarioEstimado = computed(() => {
  if (!quantidadeProduzida.value || quantidadeProduzida.value <= 0) return 0
  return custoRealEstimado.value / quantidadeProduzida.value
})

// Variância styling
const rendimentoVarianciaClass = computed(() => {
  const r = rendimentoPercentual.value
  if (r >= 95) return 'bg-green-50 border-green-200'
  if (r >= 85) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
})

const rendimentoVarianciaTextClass = computed(() => {
  const r = rendimentoPercentual.value
  if (r >= 95) return 'text-green-700'
  if (r >= 85) return 'text-yellow-700'
  return 'text-red-700'
})

const custoVarianciaClass = computed(() => {
  const c = Math.abs(custoVariancia.value)
  if (c <= 5) return 'bg-green-50 border-green-200'
  if (c <= 15) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
})

const custoVarianciaTextClass = computed(() => {
  const c = Math.abs(custoVariancia.value)
  if (c <= 5) return 'text-green-700'
  if (c <= 15) return 'text-yellow-700'
  return 'text-red-700'
})

const semaforoClass = (s: string) => ({
  'bg-green-100 text-green-700': s === 'verde',
  'bg-yellow-100 text-yellow-700': s === 'amarelo',
  'bg-red-100 text-red-700': s === 'vermelho'
})

const semaforoIcon = (s: string) => s === 'verde' ? '✓' : s === 'amarelo' ? '!' : '✗'

const formatNumber = (n: number) =>
  Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })

const formatDate = (d: string) => {
  if (!d) return '-'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const formatDateTime = (d: string) => {
  if (!d) return '-'
  const dt = new Date(d)
  return dt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Ações
const iniciar = async () => {
  if (!props.op) return
  processando.value = true
  try {
    await iniciarProducao(props.op.id)
    toast.add({ title: 'Produção iniciada', color: 'green' })
    emit('atualizado')
  } catch (e: any) {
    toast.add({ title: 'Erro ao iniciar', description: e.message, color: 'red' })
  } finally {
    processando.value = false
  }
}

const concluir = async () => {
  if (!props.op) return
  processando.value = true

  try {
    const ingredientes = (props.op.ingredientes || []).map((ing, idx) => ({
      produto_id: ing.produto_id,
      quantidade_real: quantidadesReais.value[idx] || ing.quantidade_planejada
    }))

    await $fetch('/api/producao/concluir', {
      method: 'POST',
      body: {
        ordem_id: props.op.id,
        quantidade_produzida: quantidadeProduzida.value,
        ingredientes
      }
    })

    toast.add({ title: 'Produção concluída! Estoque atualizado.', color: 'green' })
    emConclusao.value = false
    emit('atualizado')
  } catch (e: any) {
    toast.add({ title: 'Erro ao concluir', description: e.data?.message || e.message, color: 'red' })
  } finally {
    processando.value = false
  }
}

const confirmarCancelamento = async () => {
  if (!props.op || !motivoCancelamento.value.trim()) return
  processando.value = true
  try {
    await cancelarProducao(props.op.id, motivoCancelamento.value)
    toast.add({ title: 'OP cancelada', color: 'green' })
    cancelando.value = false
    emit('atualizado')
  } catch (e: any) {
    toast.add({ title: 'Erro ao cancelar', description: e.message, color: 'red' })
  } finally {
    processando.value = false
  }
}

const imprimir = () => {
  window.print()
}

// Carregar disponibilidade quando OP muda
watch(() => props.op, async (op) => {
  emConclusao.value = false
  cancelando.value = false
  motivoCancelamento.value = ''

  if (!op?.ingredientes) {
    disponibilidadeMap.value = new Map()
    quantidadesReais.value = []
    quantidadeProduzida.value = 0
    return
  }

  quantidadeProduzida.value = op.quantidade_planejada
  quantidadesReais.value = op.ingredientes.map(i => i.quantidade_real || i.quantidade_planejada)

  if (op.status === 'planejada' || op.status === 'em_producao') {
    try {
      const ingredientes = op.ingredientes.map(i => ({
        produto_id: i.produto_id,
        quantidade_planejada: i.quantidade_planejada
      }))
      const result = await calcularDisponibilidade(ingredientes)
      disponibilidadeMap.value = new Map(result.map(r => [r.produto_id, r.semaforo]))
    } catch {
      disponibilidadeMap.value = new Map()
    }
  }
}, { immediate: true })
</script>
