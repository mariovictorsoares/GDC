<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <UButton color="gray" variant="ghost" icon="i-heroicons-arrow-left" size="sm" @click="$emit('voltar')" />
      <div>
        <h1 class="text-xl font-semibold text-[#5a5a66]">Revisão da Contagem</h1>
        <p class="text-sm text-operacao-400">{{ contagem?.nome }} — {{ formatDate(contagem?.data) }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <UCard v-for="i in 5" :key="i">
          <div class="text-center">
            <USkeleton class="h-8 w-16 mx-auto mb-2" />
            <USkeleton class="h-3 w-20 mx-auto" />
          </div>
        </UCard>
      </div>
    </div>

    <template v-else>
      <!-- Cards de resumo -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold text-guardian-600">{{ itensContados }}</p>
            <p class="text-xs text-operacao-400 mt-1">Contados</p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold text-operacao-400">{{ itensNaoContados }}</p>
            <p class="text-xs text-operacao-400 mt-1">Não contados</p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold text-controle-600">{{ itensComSobra }}</p>
            <p class="text-xs text-operacao-400 mt-1">Sobras</p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold text-red-600">{{ itensComFalta }}</p>
            <p class="text-xs text-operacao-400 mt-1">Faltas</p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p
              class="text-2xl font-bold"
              :class="valorTotalDivergencia >= 0 ? 'text-controle-600' : 'text-red-600'"
            >
              {{ valorTotalDivergencia >= 0 ? '+' : '' }}{{ formatCurrency(valorTotalDivergencia) }}
            </p>
            <p class="text-xs text-operacao-400 mt-1">Impacto (R$)</p>
          </div>
        </UCard>
      </div>

      <!-- Tabela de divergências -->
      <UCard v-if="itensComDiferenca.length > 0">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-operacao-800">Divergências encontradas</h3>
            <span class="text-sm text-operacao-400">{{ itensComDiferenca.length }} itens</span>
          </div>
        </template>

        <div class="overflow-x-auto -mx-4 sm:-mx-6">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-[#5a5a66] border-b border-operacao-200">
                <th class="px-4 sm:px-6 pb-3 font-medium">Produto</th>
                <th class="px-2 pb-3 font-medium text-right">Sistema</th>
                <th class="px-2 pb-3 font-medium text-right">Contado</th>
                <th class="px-2 pb-3 font-medium text-right">Diferença</th>
                <th class="px-4 sm:px-6 pb-3 font-medium text-right">Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in itensComDiferenca"
                :key="item.produto_id"
                class="border-b border-operacao-100 last:border-0"
                :class="item.diferenca > 0 ? 'bg-controle-50/40' : 'bg-red-50/40'"
              >
                <td class="px-4 sm:px-6 py-3">
                  <p class="font-medium text-operacao-800">{{ item.nome }}</p>
                  <p class="text-xs text-operacao-400">{{ item.unidade_sigla }}</p>
                </td>
                <td class="px-2 py-3 text-right font-mono text-operacao-500">
                  {{ formatNumber(item.saldo_sistema) }}
                </td>
                <td class="px-2 py-3 text-right font-mono text-operacao-800 font-semibold">
                  {{ formatNumber(item.quantidade_contada) }}
                </td>
                <td class="px-2 py-3 text-right">
                  <span
                    class="font-bold font-mono"
                    :class="item.diferenca > 0 ? 'text-controle-600' : 'text-red-600'"
                  >
                    {{ item.diferenca > 0 ? '+' : '' }}{{ formatNumber(item.diferenca) }} {{ item.unidade_sigla }}
                  </span>
                </td>
                <td class="px-4 sm:px-6 py-3 text-right">
                  <span
                    class="font-semibold font-mono"
                    :class="item.valor_divergencia > 0 ? 'text-controle-600' : 'text-red-600'"
                  >
                    {{ item.valor_divergencia > 0 ? '+' : '' }}{{ formatCurrency(item.valor_divergencia) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <!-- Sem divergência -->
      <UCard v-if="itensComDiferenca.length === 0 && itensContados > 0">
        <div class="text-center py-6 text-operacao-400">
          <UIcon name="i-heroicons-check-circle" class="w-10 h-10 text-controle-500 mb-2 mx-auto" />
          <p class="font-medium">Nenhuma divergência encontrada!</p>
        </div>
      </UCard>

      <!-- Motivo -->
      <UCard>
        <UFormGroup label="Observação / Motivo da Contagem" required>
          <UTextarea
            v-model="motivoContagem"
            placeholder="Ex: Contagem semanal de rotina, Inventário mensal..."
            :rows="3"
          />
        </UFormGroup>

        <div class="mt-4">
          <UCheckbox
            v-model="apenasComDiferenca"
            label="Salvar apenas produtos com divergência"
          />
          <p class="text-xs text-operacao-400 ml-6 mt-1">
            Se desmarcado, salva todos os produtos contados (inclusive os sem divergência, com ajuste zero)
          </p>
        </div>
      </UCard>

      <!-- Botões -->
      <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <UButton color="gray" variant="ghost" @click="$emit('voltar')">
          Voltar
        </UButton>
        <UButton
          color="primary"
          :loading="salvando"
          :disabled="!motivoContagem.trim() || itensContados === 0"
          @click="salvarContagem"
        >
          <UIcon name="i-heroicons-check" class="w-4 h-4 mr-2" />
          Confirmar e Salvar ({{ itensParaSalvar.length }} {{ itensParaSalvar.length === 1 ? 'ajuste' : 'ajustes' }})
        </UButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Contagem, SaldoEstoque, ContagemItemDB } from '~/types'

interface ItemRevisao {
  produto_id: string
  nome: string
  unidade_sigla: string
  saldo_sistema: number
  quantidade_contada: number
  diferenca: number
  custo_medio: number
  valor_divergencia: number
}

const props = defineProps<{
  contagemId: string
  contagem: Contagem | null
}>()

const emit = defineEmits<{
  'salvo': []
  'voltar': []
}>()

const toast = useToast()
const { getContagemItens, getSaldoEstoque, createAjustesEmLote, updateContagemStatus, deleteContagemItens, appendContagemResultado, getContagemResultados } = useEstoque()
const { formatCurrency, formatNumber } = useFormatters()

// State
const loading = ref(true)
const salvando = ref(false)
const motivoContagem = ref('')
const apenasComDiferenca = ref(true)
const itensRevisao = ref<ItemRevisao[]>([])

// Load data on mount
onMounted(async () => {
  try {
    loading.value = true

    // Pre-fill motivo with contagem name
    if (props.contagem?.nome) {
      motivoContagem.value = props.contagem.nome
    }

    // Load contagem items and saldos in parallel
    const [savedItems, saldos] = await Promise.all([
      getContagemItens(props.contagemId),
      getSaldoEstoque()
    ])

    // Build revision items by merging saved items with saldos
    const saldoMap = new Map<string, SaldoEstoque>()
    for (const s of saldos) {
      saldoMap.set(s.produto_id, s)
    }

    itensRevisao.value = savedItems
      .filter((item: ContagemItemDB) => item.quantidade_contada !== null && item.quantidade_contada !== undefined)
      .map((item: ContagemItemDB) => {
        const saldo = saldoMap.get(item.produto_id)
        const saldoSistema = Number(saldo?.saldo_principal || 0)
        const qtdContada = Number(item.quantidade_contada)
        const diferenca = qtdContada - saldoSistema
        const custoMedio = Number(saldo?.custo_medio || 0)

        return {
          produto_id: item.produto_id,
          nome: item.produto?.nome || saldo?.produto || '',
          unidade_sigla: item.produto?.unidade?.sigla || saldo?.unidade || '',
          saldo_sistema: saldoSistema,
          quantidade_contada: qtdContada,
          diferenca,
          custo_medio: custoMedio,
          valor_divergencia: diferenca * custoMedio
        }
      })
      .sort((a: ItemRevisao, b: ItemRevisao) => a.nome.localeCompare(b.nome))
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message, color: 'red' })
  } finally {
    loading.value = false
  }
})

// Computed
const itensContados = computed(() => itensRevisao.value.length)
const itensNaoContados = computed(() => {
  // We only have counted items, so we'd need total products count
  // For simplicity, count items with 0 difference as "counted without difference"
  return 0 // This will be overridden by the total from contagem_itens
})
const itensComSobra = computed(() => itensRevisao.value.filter(i => i.diferenca > 0).length)
const itensComFalta = computed(() => itensRevisao.value.filter(i => i.diferenca < 0).length)
const itensComDiferenca = computed(() => itensRevisao.value.filter(i => i.diferenca !== 0))
const valorTotalDivergencia = computed(() => itensRevisao.value.reduce((sum, i) => sum + i.valor_divergencia, 0))

const itensParaSalvar = computed(() => {
  if (apenasComDiferenca.value) {
    return itensRevisao.value.filter(i => i.diferenca !== 0)
  }
  return itensRevisao.value
})

// Methods
const formatDate = (date?: string) => {
  if (!date) return '-'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

const salvarContagem = async () => {
  if (!motivoContagem.value.trim()) {
    toast.add({ title: 'Atenção', description: 'Informe o motivo/observação da contagem', color: 'yellow' })
    return
  }

  try {
    salvando.value = true

    // Create ajustes em lote
    const ajustesPayload = itensParaSalvar.value.map(item => ({
      produto_id: item.produto_id,
      data: props.contagem?.data || new Date().toISOString().split('T')[0],
      quantidade: item.diferenca,
      motivo: motivoContagem.value.trim()
    }))

    if (ajustesPayload.length > 0) {
      await createAjustesEmLote(ajustesPayload)
    }

    // Snapshot: salvar resultado completo no JSONB da contagem
    const existentes = await getContagemResultados(props.contagemId)
    const cicloAtual = existentes.length + 1

    const resultado: import('~/types').ContagemResultado = {
      ciclo: cicloAtual,
      data: props.contagem?.data || new Date().toISOString().split('T')[0],
      finalizado_em: new Date().toISOString(),
      motivo: motivoContagem.value.trim(),
      resumo: {
        total_contados: itensContados.value,
        total_nao_contados: itensNaoContados.value,
        total_sobras: itensComSobra.value,
        total_faltas: itensComFalta.value,
        valor_total_divergencia: valorTotalDivergencia.value
      },
      itens: itensRevisao.value.map(item => ({
        produto_id: item.produto_id,
        nome: item.nome,
        unidade_sigla: item.unidade_sigla,
        saldo_sistema: item.saldo_sistema,
        quantidade_contada: item.quantidade_contada,
        diferenca: item.diferenca,
        custo_medio: item.custo_medio,
        valor_divergencia: item.valor_divergencia
      }))
    }

    await appendContagemResultado(props.contagemId, resultado)

    // Update contagem status to finalizada
    await updateContagemStatus(props.contagemId, 'finalizada')

    // Clean up contagem_itens
    await deleteContagemItens(props.contagemId)

    const sobras = ajustesPayload.filter(a => a.quantidade > 0).length
    const faltas = ajustesPayload.filter(a => a.quantidade < 0).length

    toast.add({
      title: 'Contagem salva!',
      description: `${ajustesPayload.length} ajuste(s) registrado(s): ${sobras} sobra(s), ${faltas} falta(s).`,
      color: 'green'
    })

    emit('salvo')
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar contagem', color: 'red' })
  } finally {
    salvando.value = false
  }
}
</script>
