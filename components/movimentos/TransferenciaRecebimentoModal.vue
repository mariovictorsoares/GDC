<template>
  <UModal
    v-model="modalAberto"
    :prevent-close="processando"
    :ui="{
      width: 'sm:max-w-lg',
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
            <div class="p-2 bg-blue-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-truck" class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">Transferência Recebida</h3>
              <p class="text-xs text-operacao-400">Confirme ou rejeite o recebimento</p>
            </div>
          </div>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="fechar" />
        </div>
      </template>

      <div v-if="transferencia" class="space-y-4">
        <!-- Origem -->
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <UIcon name="i-heroicons-building-storefront" class="w-4 h-4 text-blue-600" />
            <span class="text-sm font-medium text-blue-700">Enviado por: {{ transferencia.empresa_origem?.nome }}</span>
          </div>
          <div class="text-xs text-blue-600">
            Data: {{ formatDate(transferencia.data) }}
          </div>
        </div>

        <!-- Produto -->
        <div class="p-4 border border-operacao-200 rounded-lg bg-operacao-50/50">
          <div class="flex items-center gap-3 mb-3">
            <UIcon name="i-heroicons-cube" class="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div>
              <p class="text-sm font-medium text-operacao-800">{{ transferencia.produto_origem?.nome }}</p>
              <p class="text-xs text-operacao-400">Produto destino: {{ transferencia.produto_destino?.nome }}</p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <p class="text-xs text-operacao-400 mb-1">Quantidade</p>
              <p class="text-sm font-semibold text-operacao-800">
                {{ formatNumber(transferencia.quantidade) }} {{ transferencia.produto_origem?.unidade?.sigla }}
              </p>
            </div>
            <div>
              <p class="text-xs text-operacao-400 mb-1">Custo unit.</p>
              <p class="text-sm font-semibold text-operacao-800">{{ formatCurrency(transferencia.custo_unitario) }}</p>
            </div>
            <div>
              <p class="text-xs text-operacao-400 mb-1">Custo total</p>
              <p class="text-sm font-semibold text-blue-700">{{ formatCurrency(transferencia.custo_total) }}</p>
            </div>
          </div>
        </div>

        <!-- Observação -->
        <p v-if="transferencia.observacao" class="text-xs text-operacao-400 italic">
          Obs: {{ transferencia.observacao }}
        </p>

        <!-- Confirmação de rejeição -->
        <div v-if="confirmandoRejeicao" class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-700 font-medium mb-2">Tem certeza que deseja rejeitar?</p>
          <p class="text-xs text-red-600 mb-3">A transferência será cancelada e nenhum estoque será movimentado.</p>
          <div class="flex gap-2">
            <UButton color="red" size="sm" :loading="processando" @click="rejeitar">
              Sim, rejeitar
            </UButton>
            <UButton color="gray" variant="ghost" size="sm" @click="confirmandoRejeicao = false">
              Cancelar
            </UButton>
          </div>
        </div>
      </div>

      <template #footer>
        <div v-if="!confirmandoRejeicao" class="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <UButton color="red" variant="ghost" class="w-full sm:w-auto" @click="confirmandoRejeicao = true">
            Rejeitar
          </UButton>
          <UButton color="green" class="w-full sm:w-auto" :loading="processando" @click="confirmar">
            <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
            Confirmar Recebimento
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { TransferenciaPendente } from '~/types'

const props = defineProps<{
  modelValue: boolean
  transferencia: TransferenciaPendente | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirmada': []
  'rejeitada': []
}>()

const modalAberto = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const { confirmarTransferencia, rejeitarTransferencia } = useEstoque()
const { formatCurrency, formatNumber } = useFormatters()
const toast = useToast()

const processando = ref(false)
const confirmandoRejeicao = ref(false)

const formatDate = (date: string) => {
  if (!date) return ''
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

watch(modalAberto, (aberto) => {
  if (aberto) {
    confirmandoRejeicao.value = false
  }
})

const confirmar = async () => {
  if (!props.transferencia) return
  processando.value = true
  try {
    await confirmarTransferencia(props.transferencia.id)
    toast.add({ title: 'Recebido!', description: 'Transferência confirmada com sucesso', color: 'green', timeout: 3000 })
    emit('confirmada')
    fechar()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao confirmar transferência', color: 'red' })
  } finally {
    processando.value = false
  }
}

const rejeitar = async () => {
  if (!props.transferencia) return
  processando.value = true
  try {
    await rejeitarTransferencia(props.transferencia.id)
    toast.add({ title: 'Rejeitada', description: 'Transferência rejeitada', color: 'orange', timeout: 3000 })
    emit('rejeitada')
    fechar()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao rejeitar transferência', color: 'red' })
  } finally {
    processando.value = false
  }
}

const fechar = () => {
  modalAberto.value = false
}
</script>
