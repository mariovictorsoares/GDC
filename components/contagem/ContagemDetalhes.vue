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

      <div v-else-if="historico.length === 0" class="px-6 py-8 text-center text-operacao-400">
        <p class="text-sm">Nenhuma contagem finalizada até o momento.</p>
      </div>

      <div v-else class="divide-y divide-operacao-100">
        <div
          v-for="(h, idx) in historico"
          :key="idx"
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
import type { Contagem, ContagemHistorico } from '~/types'

const props = defineProps<{
  contagem: Contagem
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

const { formatCurrency } = useFormatters()

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
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}
</script>
