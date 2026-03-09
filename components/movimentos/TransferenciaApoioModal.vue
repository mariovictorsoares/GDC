<template>
  <UModal
    v-model="modalAberto"
    :prevent-close="salvando"
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
            <div
              class="p-2 rounded-lg flex items-center justify-center"
              :class="etapa === 'resumo' ? 'bg-green-100' : 'bg-blue-100'"
            >
              <UIcon
                :name="etapa === 'resumo' ? 'i-heroicons-check-circle' : 'i-heroicons-arrow-path-rounded-square'"
                class="w-5 h-5"
                :class="etapa === 'resumo' ? 'text-green-600' : 'text-blue-600'"
              />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">
                {{ etapa === 'resumo' ? 'Transferência Concluída' : 'Enviar para Estoque de Apoio?' }}
              </h3>
              <p v-if="etapa === 'selecao'" class="text-xs text-operacao-400">
                Selecione os produtos para transferir ao estoque de apoio
              </p>
            </div>
          </div>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="fechar"
          />
        </div>
      </template>

      <!-- Etapa: Seleção -->
      <div v-if="etapa === 'selecao'" class="space-y-3">
        <div v-if="carregandoSaldos" class="flex items-center justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-operacao-400 animate-spin mr-2" />
          <span class="text-sm text-operacao-400">Carregando saldos...</span>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="item in itensModal"
            :key="item.produto_id"
            class="flex items-center gap-3 p-3 rounded-xl border transition-colors"
            :class="item.selecionado ? 'border-blue-200 bg-blue-50/50' : 'border-operacao-100 bg-operacao-50/50'"
          >
            <input
              type="checkbox"
              v-model="item.selecionado"
              class="w-4 h-4 rounded border-operacao-300 text-blue-600 focus:ring-blue-500"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-operacao-800 truncate">{{ item.produto_nome }}</p>
              <p class="text-xs text-operacao-400">
                Entrou: {{ item.qtd_entrada }} {{ item.unidade_sigla }} · Saldo principal: {{ item.saldo_principal }} {{ item.unidade_sigla }}
              </p>
            </div>
            <div class="w-24 flex-shrink-0">
              <UInput
                v-model.number="item.quantidade"
                type="number"
                size="sm"
                placeholder="Qtd"
                :min="0"
                :max="item.saldo_principal"
                :disabled="!item.selecionado"
              />
              <p v-if="item.selecionado && item.quantidade > item.saldo_principal" class="text-[10px] text-red-500 mt-0.5">
                Máx: {{ item.saldo_principal }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Etapa: Resumo -->
      <div v-else-if="etapa === 'resumo'" class="space-y-3">
        <div
          v-for="item in itensTransferidos"
          :key="item.produto_id"
          class="flex items-center gap-3 p-3 rounded-xl bg-green-50/50 border border-green-200"
        >
          <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-operacao-800 truncate">{{ item.produto_nome }}</p>
          </div>
          <p class="text-sm font-semibold text-green-700 flex-shrink-0">
            {{ item.quantidade }} {{ item.unidade_sigla }} → Apoio
          </p>
        </div>
        <p class="text-xs text-operacao-400 text-center pt-1">
          {{ itensTransferidos.length }} produto{{ itensTransferidos.length > 1 ? 's' : '' }} transferido{{ itensTransferidos.length > 1 ? 's' : '' }} ao estoque de apoio
        </p>
      </div>

      <template #footer>
        <div v-if="etapa === 'selecao'" class="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="fechar">
            Não enviar nada
          </UButton>
          <UButton
            color="blue"
            class="w-full sm:w-auto"
            :loading="salvando"
            :disabled="!temItensSelecionados"
            @click="confirmarTransferencia"
          >
            <UIcon name="i-heroicons-arrow-path-rounded-square" class="w-4 h-4 mr-1.5" />
            Confirmar Transferência
          </UButton>
        </div>
        <div v-else class="flex justify-end">
          <UButton color="gray" variant="soft" class="w-full sm:w-auto" @click="fechar">
            Fechar
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
interface ItemEntradaInfo {
  produto_id: string
  quantidade: number
  produto_nome: string
  unidade_sigla: string
}

interface ItemModal {
  produto_id: string
  produto_nome: string
  unidade_sigla: string
  qtd_entrada: number
  saldo_principal: number
  selecionado: boolean
  quantidade: number
}

const props = defineProps<{
  modelValue: boolean
  itensEntrada: ItemEntradaInfo[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const modalAberto = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const { createSaida, getSaldoProduto } = useEstoque()
const toast = useToast()

const etapa = ref<'selecao' | 'resumo'>('selecao')
const carregandoSaldos = ref(false)
const salvando = ref(false)
const itensModal = ref<ItemModal[]>([])
const itensTransferidos = ref<ItemModal[]>([])

const temItensSelecionados = computed(() =>
  itensModal.value.some(i => i.selecionado && i.quantidade > 0 && i.quantidade <= i.saldo_principal)
)

watch(modalAberto, async (aberto) => {
  if (aberto) {
    etapa.value = 'selecao'
    itensTransferidos.value = []
    await carregarSaldos()
  }
})

const carregarSaldos = async () => {
  carregandoSaldos.value = true
  try {
    itensModal.value = await Promise.all(
      props.itensEntrada.map(async (item) => {
        const saldo = await getSaldoProduto(item.produto_id)
        return {
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          unidade_sigla: item.unidade_sigla,
          qtd_entrada: item.quantidade,
          saldo_principal: saldo,
          selecionado: false,
          quantidade: 0
        }
      })
    )
  } catch (error) {
    console.error('Erro ao carregar saldos:', error)
  } finally {
    carregandoSaldos.value = false
  }
}

const confirmarTransferencia = async () => {
  const selecionados = itensModal.value.filter(
    i => i.selecionado && i.quantidade > 0 && i.quantidade <= i.saldo_principal
  )
  if (selecionados.length === 0) return

  salvando.value = true
  try {
    const hoje = new Date().toISOString().split('T')[0]
    for (const item of selecionados) {
      await createSaida({
        produto_id: item.produto_id,
        tipo: 'transferencia' as const,
        data: hoje,
        quantidade: item.quantidade,
        observacao: 'Transferência automática pós-entrada'
      })
    }
    itensTransferidos.value = selecionados
    etapa.value = 'resumo'
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao transferir produtos',
      color: 'red'
    })
  } finally {
    salvando.value = false
  }
}

const fechar = () => {
  modalAberto.value = false
}
</script>
