<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <UButton color="gray" variant="ghost" icon="i-heroicons-arrow-left" size="sm" class="mb-3" @click="$emit('voltar')" />
      <h1 class="text-2xl font-semibold text-[#5a5a66]">{{ contagem.nome }}</h1>
    </div>

    <!-- Cards de resumo + Ações -->
    <div class="flex items-center gap-3">
      <div class="flex flex-wrap gap-3">
        <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-2.5">
          <span class="text-[11px] font-medium text-operacao-400">Tipo</span>
          <p class="text-sm font-bold text-operacao-800">{{ labelTipo(contagem.tipo) }}</p>
        </div>
        <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-2.5">
          <span class="text-[11px] font-medium text-operacao-400">Recorrência</span>
          <p class="text-sm font-bold text-operacao-800">{{ labelRecorrencia(contagem.recorrencia) }}</p>
        </div>
        <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-2.5">
          <span class="text-[11px] font-medium text-operacao-400">Responsável</span>
          <p class="text-sm font-bold text-operacao-800">{{ contagem.responsavel_nome || '-' }}</p>
        </div>
        <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-2.5">
          <span class="text-[11px] font-medium text-operacao-400">Setores</span>
          <p v-if="(contagem.contagem_setores || []).length === 0" class="text-sm text-operacao-300">-</p>
          <p v-else class="text-sm font-bold text-operacao-800">
            {{ (contagem.contagem_setores || []).map(cs => cs.setor?.nome || 'Setor').join(', ') }}
          </p>
        </div>
      </div>
      <UDropdown
        v-if="contagem.status !== 'finalizada'"
        :items="acoes"
        :popper="{ placement: 'bottom-end' }"
        class="ml-auto flex-shrink-0"
      >
        <UButton color="white" class="shadow-sm ring-1 ring-inset ring-[#EBEBED]">
          <UIcon name="i-heroicons-ellipsis-vertical" class="w-4 h-4" />
          Ações
        </UButton>
      </UDropdown>
    </div>

    <!-- Histórico -->
    <UCard :ui="{ body: { padding: '' } }">
      <template #header>
        <div>
          <h3 class="text-lg font-bold text-operacao-800">Histórico</h3>
          <p class="text-sm text-operacao-400 mt-0.5">Contagens finalizadas anteriormente para esta configuração.</p>
        </div>
      </template>

      <div v-if="loadingHistorico" class="px-6 py-8 text-center">
        <USkeleton class="h-4 w-48 mx-auto mb-3" />
        <USkeleton class="h-3 w-32 mx-auto" />
      </div>

      <div v-else-if="resultados.length === 0 && historico.length === 0" class="px-6 py-8 text-center text-operacao-400">
        <p class="text-sm">Nenhuma contagem finalizada até o momento.</p>
      </div>

      <div v-else class="divide-y divide-operacao-100">
        <!-- Resultados com detalhes (contagens novas com snapshot) -->
        <div
          v-for="(r, idx) in resultados"
          :key="'r-' + idx"
        >
          <!-- Linha clicável -->
          <button
            class="w-full px-6 py-4 text-left hover:bg-operacao-50/50 transition-colors"
            @click="toggleExpandido(idx)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-heroicons-chevron-right"
                  class="w-4 h-4 text-operacao-400 flex-shrink-0 transition-transform duration-200"
                  :class="expandido === idx ? 'rotate-90' : ''"
                />
                <div>
                  <p class="font-semibold text-operacao-800 text-sm">{{ r.motivo }}</p>
                  <p class="text-xs text-operacao-400">{{ formatDateTime(r.finalizado_em) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4 text-xs">
                <span class="text-operacao-400 font-medium">{{ r.resumo.total_contados }} contado(s)</span>
                <span v-if="r.resumo.total_sobras > 0" class="text-controle-600 font-medium">+{{ r.resumo.total_sobras }} sobra(s)</span>
                <span v-if="r.resumo.total_faltas > 0" class="text-red-600 font-medium">-{{ r.resumo.total_faltas }} falta(s)</span>
                <span class="font-bold" :class="r.resumo.valor_total_divergencia >= 0 ? 'text-controle-600' : 'text-red-600'">
                  {{ r.resumo.valor_total_divergencia >= 0 ? '+' : '' }}{{ formatCurrency(r.resumo.valor_total_divergencia) }}
                </span>
              </div>
            </div>
          </button>

          <!-- Detalhes expandidos -->
          <div
            class="grid transition-[grid-template-rows] duration-300 ease-in-out"
            :class="expandido === idx ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
          >
          <div class="overflow-hidden">
          <div class="px-6 pb-6 pt-2 bg-operacao-50/30">
            <!-- Cards de resumo -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-3 py-2 text-center">
                <p class="text-2xl font-bold text-guardian-600">{{ r.resumo.total_contados }}</p>
                <p class="text-[11px] text-operacao-400">Contados</p>
              </div>
              <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-3 py-2 text-center">
                <p class="text-2xl font-bold text-operacao-400">{{ r.resumo.total_nao_contados }}</p>
                <p class="text-[11px] text-operacao-400">Não contados</p>
              </div>
              <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-3 py-2 text-center">
                <p class="text-2xl font-bold text-controle-600">{{ r.resumo.total_sobras }}</p>
                <p class="text-[11px] text-operacao-400">Sobras</p>
              </div>
              <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-3 py-2 text-center">
                <p class="text-2xl font-bold text-red-600">{{ r.resumo.total_faltas }}</p>
                <p class="text-[11px] text-operacao-400">Faltas</p>
              </div>
              <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-3 py-2 text-center">
                <p
                  class="text-xl font-bold"
                  :class="r.resumo.valor_total_divergencia >= 0 ? 'text-controle-600' : 'text-red-600'"
                >
                  {{ r.resumo.valor_total_divergencia >= 0 ? '+' : '' }}{{ formatCurrency(r.resumo.valor_total_divergencia) }}
                </p>
                <p class="text-[11px] text-operacao-400">Impacto (R$)</p>
              </div>
            </div>

            <!-- Tabela de itens -->
            <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-[#5a5a66] border-b border-operacao-200">
                      <th class="px-4 py-3 font-medium text-xs uppercase tracking-wider">Produto</th>
                      <th class="px-2 py-3 font-medium text-xs uppercase tracking-wider text-right">Sistema</th>
                      <th class="px-2 py-3 font-medium text-xs uppercase tracking-wider text-right">Contado</th>
                      <th class="px-2 py-3 font-medium text-xs uppercase tracking-wider text-right">Diferença</th>
                      <th class="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in r.itens"
                      :key="item.produto_id"
                      class="border-b border-operacao-100 last:border-0"
                      :class="item.diferenca > 0 ? 'bg-controle-50/40' : item.diferenca < 0 ? 'bg-red-50/40' : ''"
                    >
                      <td class="px-4 py-2.5">
                        <p class="font-medium text-operacao-800">{{ item.nome }}</p>
                        <p class="text-xs text-operacao-400">{{ item.unidade_sigla }}</p>
                      </td>
                      <td class="px-2 py-2.5 text-right font-mono text-operacao-500">
                        {{ formatNumber(item.saldo_sistema) }}
                      </td>
                      <td class="px-2 py-2.5 text-right font-mono text-operacao-800 font-semibold">
                        {{ formatNumber(item.quantidade_contada) }}
                      </td>
                      <td class="px-2 py-2.5 text-right">
                        <span
                          v-if="item.diferenca !== 0"
                          class="font-bold font-mono"
                          :class="item.diferenca > 0 ? 'text-controle-600' : 'text-red-600'"
                        >
                          {{ item.diferenca > 0 ? '+' : '' }}{{ formatNumber(item.diferenca) }} {{ item.unidade_sigla }}
                        </span>
                        <span v-else class="text-operacao-300 font-mono">0</span>
                      </td>
                      <td class="px-4 py-2.5 text-right">
                        <span
                          v-if="item.valor_divergencia !== 0"
                          class="font-semibold font-mono"
                          :class="item.valor_divergencia > 0 ? 'text-controle-600' : 'text-red-600'"
                        >
                          {{ item.valor_divergencia > 0 ? '+' : '' }}{{ formatCurrency(item.valor_divergencia) }}
                        </span>
                        <span v-else class="text-operacao-300 font-mono">-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          </div>
          </div>
        </div>

        <!-- Histórico legado (contagens antigas, sem snapshot) -->
        <div
          v-for="(h, idx) in historico"
          :key="'h-' + idx"
          class="px-6 py-4"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-operacao-800 text-sm">{{ h.motivo }}</p>
              <p class="text-xs text-operacao-400">{{ formatDate(h.data) }}</p>
            </div>
            <div class="flex items-center gap-4 text-xs">
              <span v-if="h.total_sobras > 0" class="text-controle-600 font-medium">+{{ h.total_sobras }} sobra(s)</span>
              <span v-if="h.total_faltas > 0" class="text-red-600 font-medium">-{{ h.total_faltas }} falta(s)</span>
              <span class="font-bold" :class="h.valor_total_divergencia >= 0 ? 'text-controle-600' : 'text-red-600'">
                {{ h.valor_total_divergencia >= 0 ? '+' : '' }}{{ formatCurrency(h.valor_total_divergencia) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { Contagem, ContagemHistorico, ContagemResultado } from '~/types'

const props = defineProps<{
  contagem: Contagem
  resultados: ContagemResultado[]
  historico: ContagemHistorico[]
  loadingHistorico: boolean
}>()

const emit = defineEmits<{
  'voltar': []
  'ver-progresso': []
  'editar': []
  'excluir': []
  'enviar-lembrete': []
}>()

const { formatCurrency, formatNumber } = useFormatters()

// Estado de expansão
const expandido = ref<number | null>(null)

const toggleExpandido = (idx: number) => {
  expandido.value = expandido.value === idx ? null : idx
}

// Dropdown actions
const acoes = computed(() => {
  const items = [
    [
      { label: 'Editar', icon: 'i-heroicons-pencil-square', click: () => emit('editar') },
      ...(props.contagem.responsavel_telefone
        ? [{ label: 'Enviar Lembrete', icon: 'i-heroicons-chat-bubble-left-ellipsis', click: () => emit('enviar-lembrete') }]
        : []),
      { label: 'Excluir', icon: 'i-heroicons-trash', class: 'text-red-500', click: () => emit('excluir') }
    ]
  ]
  return items
})

// Helpers
const labelTipo = (tipo?: string) => {
  if (tipo === 'apoio') return 'Estoque de Apoio'
  if (tipo === 'inventario') return 'Inventário'
  return 'Estoque Principal' // handles 'principal', 'estoque', undefined
}

const labelRecorrencia = (recorrencia?: string) => {
  switch (recorrencia) {
    case 'diaria': return 'Diária'
    case 'semanal': return 'Semanal'
    case 'quinzenal': return 'Quinzenal'
    case 'mensal': return 'Mensal'
    default: return '-'
  }
}

const formatDate = (date?: string) => {
  if (!date) return '-'
  const d = date.includes('T') ? new Date(date) : new Date(date + 'T00:00:00')
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

const formatDateTime = (datetime?: string) => {
  if (!datetime) return '-'
  const d = new Date(datetime)
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
</script>
