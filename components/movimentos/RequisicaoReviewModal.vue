<template>
  <UModal
    v-model="modalAberto"
    :prevent-close="processando"
    :ui="{
      width: 'sm:max-w-xl',
      overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
      background: 'bg-white dark:bg-operacao-800',
      ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
      shadow: 'shadow-2xl'
    }"
  >
    <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-amber-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-clipboard-document-list" class="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">Revisar Requisição</h3>
              <p class="text-xs text-operacao-400">
                {{ requisicao?.setor?.nome }}
                <span v-if="requisicao?.solicitante_nome"> &middot; {{ requisicao.solicitante_nome }}</span>
                <span v-if="requisicao?.data"> &middot; {{ formatDate(requisicao.data) }}</span>
              </p>
            </div>
          </div>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="fechar" />
        </div>
      </template>

      <div v-if="requisicao" class="space-y-3 max-h-[50vh] overflow-y-auto">
        <!-- Observação do solicitante -->
        <div v-if="requisicao.observacao" class="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p class="text-xs text-amber-700">
            <span class="font-medium">Observação:</span> {{ requisicao.observacao }}
          </p>
        </div>

        <!-- Items table -->
        <div class="border border-operacao-200 rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-operacao-50 border-b border-operacao-200">
                <th class="text-left px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[#5a5a66]">Produto</th>
                <th class="text-right px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[#5a5a66] w-24">Estoque sistema</th>
                <th class="text-right px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[#5a5a66] w-24">Solicitado</th>
                <th class="text-right px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[#5a5a66] w-28">Enviar</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in requisicao.itens"
                :key="item.id"
                class="border-b border-operacao-100 last:border-b-0"
              >
                <td class="px-4 py-3">
                  <p class="font-medium text-operacao-800">{{ item.produto?.nome }}</p>
                  <p class="text-[11px] text-operacao-400">{{ item.produto?.unidade?.sigla }}</p>
                </td>
                <td class="text-right px-4 py-3">
                  <span
                    class="tabular-nums"
                    :class="(saldos[item.produto_id] ?? 0) < item.quantidade_solicitada ? 'text-red-500 font-medium' : 'text-operacao-500'"
                  >
                    {{ formatQtd(saldos[item.produto_id] ?? 0) }}
                  </span>
                </td>
                <td class="text-right px-4 py-3">
                  <span class="text-operacao-600 tabular-nums">
                    {{ formatQtd(item.quantidade_solicitada) }}
                  </span>
                </td>
                <td class="text-right px-4 py-3">
                  <input
                    :value="formatInputDisplay(quantidadesEnviar[item.id])"
                    type="text"
                    inputmode="decimal"
                    class="w-24 h-8 text-right pr-2 pl-2 rounded-lg bg-operacao-50 text-sm font-bold text-operacao-800 ring-1 ring-operacao-200 focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition-all"
                    @input="onQtdInput(item.id, $event)"
                    @focus="($event.target as HTMLInputElement).select()"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Confirmação de cancelamento -->
      <div v-if="confirmandoCancelamento" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-sm text-red-700 font-medium mb-2">Cancelar esta requisição?</p>
        <p class="text-xs text-red-600 mb-3">A requisição será marcada como cancelada.</p>
        <div class="flex gap-2">
          <UButton color="red" size="sm" :loading="processando" @click="cancelar">
            Sim, cancelar
          </UButton>
          <UButton color="gray" variant="ghost" size="sm" @click="confirmandoCancelamento = false">
            Voltar
          </UButton>
        </div>
      </div>

      <template #footer>
        <div v-if="!confirmandoCancelamento" class="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <UButton color="red" variant="ghost" class="w-full sm:w-auto" @click="confirmandoCancelamento = true">
            Cancelar Requisição
          </UButton>
          <UButton
            color="green"
            class="w-full sm:w-auto"
            :loading="processando"
            :disabled="totalItensEnviar === 0"
            @click="enviar"
          >
            <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4 mr-1.5" />
            Enviar para Apoio ({{ totalItensEnviar }} {{ totalItensEnviar === 1 ? 'item' : 'itens' }})
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { Requisicao } from '~/types'

const props = defineProps<{
  modelValue: boolean
  requisicao: Requisicao | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'enviada': []
  'cancelada': []
}>()

const modalAberto = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const { enviarRequisicao, cancelarRequisicao } = useEstoque()
const client = useSupabaseClient()
const toast = useToast()

const processando = ref(false)
const confirmandoCancelamento = ref(false)
const quantidadesEnviar = ref<Record<string, number | null>>({})
const saldos = ref<Record<string, number>>({})

// Load saldos do estoque principal
const loadSaldos = async () => {
  if (!props.requisicao?.itens) return
  const produtoIds = props.requisicao.itens.map(i => i.produto_id)
  const { data } = await client
    .from('v_saldo_estoque')
    .select('produto_id, saldo_principal')
    .in('produto_id', produtoIds)

  saldos.value = {}
  for (const row of (data || [])) {
    saldos.value[row.produto_id] = Number(row.saldo_principal || 0)
  }
}

// Initialize quantities and load saldos when modal opens
watch(modalAberto, async (aberto) => {
  if (aberto && props.requisicao?.itens) {
    confirmandoCancelamento.value = false
    quantidadesEnviar.value = {}
    for (const item of props.requisicao.itens) {
      quantidadesEnviar.value[item.id] = item.quantidade_solicitada
    }
    await loadSaldos()
  }
})

const totalItensEnviar = computed(() => {
  return Object.values(quantidadesEnviar.value).filter(v => v != null && Number(v) > 0).length
})

const formatDate = (date?: string) => {
  if (!date) return ''
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

const formatQtd = (val?: number) => {
  if (val == null) return '—'
  if (Number.isInteger(val)) return String(val)
  return val.toFixed(3).replace('.', ',')
}

const formatInputDisplay = (val: number | null | undefined): string => {
  if (val == null || val === '') return ''
  return String(val).replace('.', ',')
}

const onQtdInput = (itemId: string, event: Event) => {
  const input = event.target as HTMLInputElement
  let val = input.value.replace(',', '.')
  val = val.replace(/[^0-9.]/g, '')
  const parts = val.split('.')
  if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')

  if (val === '') {
    quantidadesEnviar.value[itemId] = null
  } else {
    quantidadesEnviar.value[itemId] = Number(val)
  }
}

const enviar = async () => {
  if (!props.requisicao) return

  // Validar estoque suficiente
  const divergencias: string[] = []
  for (const item of (props.requisicao.itens || [])) {
    const qtdEnviar = Number(quantidadesEnviar.value[item.id] || 0)
    if (qtdEnviar <= 0) continue
    const estoque = saldos.value[item.produto_id] ?? 0
    if (qtdEnviar > estoque) {
      divergencias.push(`${item.produto?.nome}: enviar ${formatQtd(qtdEnviar)}, estoque ${formatQtd(estoque)}`)
    }
  }

  if (divergencias.length > 0) {
    toast.add({
      title: 'Estoque insuficiente',
      description: divergencias.join(' · '),
      color: 'red',
      timeout: 6000
    })
    return
  }

  processando.value = true
  try {
    const itensAprovados = (props.requisicao.itens || [])
      .filter(item => {
        const qtd = quantidadesEnviar.value[item.id]
        return qtd != null && Number(qtd) > 0
      })
      .map(item => ({
        requisicao_item_id: item.id,
        produto_id: item.produto_id,
        quantidade_enviada: Number(quantidadesEnviar.value[item.id])
      }))

    await enviarRequisicao(props.requisicao.id, itensAprovados)
    toast.add({ title: 'Enviado!', description: 'Requisição atendida e transferida para o estoque de apoio', color: 'green', timeout: 3000 })
    emit('enviada')
    fechar()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao enviar requisição', color: 'red' })
  } finally {
    processando.value = false
  }
}

const cancelar = async () => {
  if (!props.requisicao) return
  processando.value = true
  try {
    await cancelarRequisicao(props.requisicao.id)
    toast.add({ title: 'Cancelada', description: 'Requisição cancelada', color: 'orange', timeout: 3000 })
    emit('cancelada')
    fechar()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao cancelar requisição', color: 'red' })
  } finally {
    processando.value = false
  }
}

const fechar = () => {
  modalAberto.value = false
}
</script>
