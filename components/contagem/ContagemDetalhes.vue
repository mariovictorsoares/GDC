<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <UButton color="gray" variant="ghost" icon="i-heroicons-arrow-left" size="sm" class="mb-3" @click="$emit('voltar')" />
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 class="text-2xl font-bold text-operacao-800">{{ contagem.nome }}</h1>
        <div class="flex gap-2">
          <UButton
            v-if="contagem.status !== 'finalizada'"
            color="gray"
            variant="soft"
            size="sm"
            @click="$emit('editar')"
          >
            <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 mr-1" />
            Editar
          </UButton>
          <UButton
            v-if="contagem.status !== 'finalizada'"
            color="red"
            variant="soft"
            size="sm"
            @click="$emit('excluir')"
          >
            <UIcon name="i-heroicons-trash" class="w-4 h-4 mr-1" />
            Excluir
          </UButton>
          <UButton
            v-if="contagem.responsavel_telefone"
            color="green"
            variant="soft"
            size="sm"
            @click="$emit('enviar-lembrete')"
          >
            <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-4 h-4 mr-1" />
            Enviar Lembrete
          </UButton>
          <UButton
            v-if="contagem.status !== 'finalizada'"
            color="primary"
            @click="$emit('ver-progresso')"
          >
            <UIcon name="i-heroicons-eye" class="w-4 h-4 mr-2" />
            Ver Progresso
          </UButton>
        </div>
      </div>
    </div>

    <!-- Cards de resumo -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Card esquerdo: Status + Progresso circular -->
      <UCard :ui="{ body: { padding: 'p-5' } }">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-operacao-400 mb-1">Status</p>
            <p
              class="text-lg font-bold"
              :class="{
                'text-red-500': contagem.status === 'atrasada',
                'text-alerta-600': contagem.status === 'aguardando' || contagem.status === 'pendente',
                'text-guardian-600': contagem.status === 'em_andamento',
                'text-controle-600': contagem.status === 'finalizada',
                'text-operacao-400': !contagem.status
              }"
            >
              {{ statusLabel(contagem.status) }}
            </p>
            <UButton
              v-if="contagem.status !== 'finalizada'"
              color="gray"
              variant="soft"
              size="xs"
              class="mt-4"
              @click="$emit('ver-progresso')"
            >
              <UIcon name="i-heroicons-play" class="w-3 h-3 mr-1" />
              Ver Progresso
            </UButton>
          </div>
          <!-- Progresso circular -->
          <CircularProgress
            :value="progressoGeral"
            :size="80"
          />
        </div>
      </UCard>

      <!-- Card central: Recorrência + Responsável -->
      <div class="flex flex-col gap-4">
        <UCard :ui="{ body: { padding: 'p-5' } }">
          <p class="text-sm text-operacao-400 mb-1">Recorrência</p>
          <p class="font-semibold text-operacao-800">{{ labelRecorrencia(contagem.recorrencia) }}</p>
        </UCard>
        <UCard :ui="{ body: { padding: 'p-5' } }">
          <p class="text-sm text-operacao-400 mb-1">Responsável</p>
          <p class="font-semibold text-operacao-800">{{ contagem.responsavel_nome || '-' }}</p>
          <p v-if="contagem.responsavel_telefone" class="text-xs text-operacao-400">{{ contagem.responsavel_telefone }}</p>
        </UCard>
      </div>

      <!-- Card direito: Setores -->
      <UCard :ui="{ body: { padding: 'p-5' } }">
        <p class="text-sm text-operacao-400 mb-2">Setores</p>
        <div v-if="(contagem.contagem_setores || []).length === 0" class="text-operacao-300 text-sm">
          Nenhum setor vinculado
        </div>
        <div v-else class="space-y-1 max-h-[140px] overflow-y-auto">
          <p
            v-for="cs in contagem.contagem_setores"
            :key="cs.id"
            class="font-medium text-operacao-800 text-sm"
          >
            {{ cs.setor?.nome || 'Setor' }}
          </p>
        </div>
      </UCard>
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

defineEmits<{
  'voltar': []
  'ver-progresso': []
  'editar': []
  'excluir': []
  'enviar-lembrete': []
}>()

const { formatCurrency } = useFormatters()

// Computed
const progressoGeral = computed(() => {
  const setores = props.contagem?.contagem_setores
  if (!setores || setores.length === 0) return 0
  const soma = setores.reduce((acc, s) => acc + (s.progresso || 0), 0)
  return Math.round(soma / setores.length)
})

// Helpers
const statusLabel = (status?: string) => {
  switch (status) {
    case 'atrasada': return 'Atrasada'
    case 'aguardando':
    case 'pendente': return 'Aguardando Contagem'
    case 'em_andamento': return 'Em Andamento'
    case 'finalizada': return 'Finalizada'
    default: return '-'
  }
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
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}
</script>
