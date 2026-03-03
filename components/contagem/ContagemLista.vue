<script setup lang="ts">
import type { Contagem } from '~/types'

const props = defineProps<{
  contagens: Contagem[]
  loading: boolean
}>()

defineEmits<{
  'click-contagem': [contagem: Contagem]
  'nova-contagem': []
  'gerenciar-setores': []
}>()

// UI
const toolbarInputUi = { color: { white: { outline: 'shadow-sm bg-white text-gray-900 ring-1 ring-inset ring-[#EBEBED] focus:ring-1 focus:ring-operacao-200 dark:ring-operacao-700' } } }
const toolbarButtonUi = { color: { white: { solid: 'shadow-sm ring-1 ring-inset ring-[#EBEBED] text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-guardian-500 dark:ring-operacao-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800/50' } } }

// Search
const search = ref('')

// Filtered + Pagination
const filteredContagens = computed(() => {
  if (!search.value) return props.contagens
  const term = search.value.toLowerCase()
  return props.contagens.filter(c => c.nome?.toLowerCase().includes(term))
})

const { page, pageSize, paginatedItems: contagensPaginadas } = usePagination(filteredContagens)

// Helper functions
const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
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

const calcProgressoMensal = (contagem: Contagem): { feitas: number; esperadas: number } => {
  const rec = contagem.recorrencia || 'nenhuma'
  if (rec === 'nenhuma') return { feitas: 0, esperadas: 0 }

  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()

  let esperadas = 0
  if (rec === 'diaria') {
    esperadas = diasNoMes
  } else if (rec === 'semanal') {
    const diasConfig = contagem.dias_semana || []
    if (diasConfig.length === 0) {
      esperadas = Math.ceil(diasNoMes / 7)
    } else {
      let count = 0
      for (let d = 1; d <= diasNoMes; d++) {
        const diaSemana = new Date(ano, mes, d).getDay()
        const label = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][diaSemana]
        if (diasConfig.includes(label)) count++
      }
      esperadas = count
    }
  } else if (rec === 'quinzenal') {
    esperadas = 2
  } else if (rec === 'mensal') {
    esperadas = 1
  }

  const feitas = contagem.progresso || 0
  return { feitas, esperadas }
}

const calcProximaContagem = (contagem: Contagem) => {
  if (!contagem.recorrencia || contagem.recorrencia === 'nenhuma') return '-'
  if (contagem.status === 'finalizada') return '-'

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dataContagem = new Date(contagem.data + 'T00:00:00')

  const diffMs = dataContagem.getTime() - hoje.getTime()
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  const horario = contagem.horario_notificacao || '7:00'

  if (diffDias < 0) return formatDate(contagem.data)
  if (diffDias === 0) return `Hoje (${horario})`
  if (diffDias === 1) return `Amanhã (${horario})`
  return `Em ${diffDias} dias`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <h1 class="text-2xl font-semibold text-[#5a5a66] mb-2">Contagem de Estoque</h1>

    <!-- Toolbar: Filtros + Ações -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
      <!-- Filtros (esquerda) -->
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <UInput v-model="search" placeholder="Buscar contagem..." icon="i-heroicons-magnifying-glass" class="w-full sm:w-52" :ui="toolbarInputUi" />
      </div>
      <!-- Ações (direita) -->
      <div class="flex gap-2 flex-shrink-0">
        <UButton color="white" :ui="toolbarButtonUi" @click="$emit('gerenciar-setores')">
          <UIcon name="i-heroicons-map-pin" class="w-4 h-4 mr-1.5" />
          Setores
        </UButton>
        <UButton color="white" :ui="toolbarButtonUi" @click="$emit('nova-contagem')">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1.5" />
          Nova Contagem
        </UButton>
      </div>
    </div>

    <!-- Lista de contagens -->
    <UCard :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-operacao-400">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin mb-2" />
        <p class="text-sm">Carregando...</p>
      </div>

      <!-- Empty state: nenhuma contagem criada -->
      <div v-else-if="contagens.length === 0" class="flex flex-col items-center justify-center py-16 text-operacao-400">
        <UIcon name="i-heroicons-clipboard-document-list" class="w-12 h-12 mb-4 text-operacao-300" />
        <p class="text-base font-medium">Nenhuma contagem criada</p>
        <p class="text-sm text-operacao-400 mt-1 mb-6">Crie uma contagem para organizar e contar seus produtos por setor</p>
        <UButton color="white" class="hover:!bg-emerald-50 hover:!ring-emerald-200" :ui="toolbarButtonUi" @click="$emit('nova-contagem')">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1.5 text-emerald-500" />
          Criar primeira contagem
        </UButton>
      </div>

      <!-- Empty state: busca sem resultados -->
      <div v-else-if="filteredContagens.length === 0" class="flex flex-col items-center justify-center py-6 text-operacao-400">
        <UIcon name="i-heroicons-magnifying-glass" class="w-8 h-8 mb-2" />
        <p class="text-sm">Nenhuma contagem encontrada</p>
      </div>

      <!-- Conteúdo -->
      <template v-else>
      <!-- Tabela desktop -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-operacao-200/60">
              <th class="text-left px-6 py-3 text-xs font-medium text-[#5a5a66] uppercase tracking-wider bg-operacao-100/70 w-[28%]">Nome da contagem</th>
              <th class="text-center px-4 py-3 text-xs font-medium text-[#5a5a66] uppercase tracking-wider bg-operacao-100/70">Última contagem</th>
              <th class="text-center px-4 py-3 text-xs font-medium text-[#5a5a66] uppercase tracking-wider bg-operacao-100/70">Próxima contagem</th>
              <th class="text-center px-4 py-3 text-xs font-medium text-[#5a5a66] uppercase tracking-wider bg-operacao-100/70">Recorrência</th>
              <th class="text-center px-4 py-3 text-xs font-medium text-[#5a5a66] uppercase tracking-wider bg-operacao-100/70 w-[100px]">Progresso</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-operacao-100">
            <tr
              v-for="contagem in contagensPaginadas"
              :key="contagem.id"
              class="hover:bg-operacao-50 transition-colors cursor-pointer"
              @click="$emit('click-contagem', contagem)"
            >
              <td class="px-4 py-2.5">
                <p class="font-semibold text-operacao-800 text-sm">{{ contagem.nome }}</p>
              </td>
              <td class="px-4 py-2.5 text-center">
                <p class="text-sm text-operacao-600">{{ contagem.ultima_contagem ? formatDate(contagem.ultima_contagem) : '-' }}</p>
              </td>
              <td class="px-4 py-2.5 text-center">
                <p class="text-sm text-operacao-600">{{ calcProximaContagem(contagem) }}</p>
              </td>
              <td class="px-4 py-2.5 text-center">
                <p class="text-sm text-operacao-600">{{ labelRecorrencia(contagem.recorrencia) }}</p>
              </td>
              <td class="px-4 py-2.5 text-center">
                <p class="font-bold text-sm" :class="calcProgressoMensal(contagem).feitas >= calcProgressoMensal(contagem).esperadas ? 'text-controle-600' : 'text-operacao-600'">
                  {{ calcProgressoMensal(contagem).feitas }}/{{ calcProgressoMensal(contagem).esperadas }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards mobile -->
      <div class="sm:hidden divide-y divide-operacao-100">
        <div
          v-for="contagem in contagensPaginadas"
          :key="'m-' + contagem.id"
          class="px-5 py-4 hover:bg-operacao-50 transition-colors cursor-pointer"
          @click="$emit('click-contagem', contagem)"
        >
          <div class="flex items-center justify-between mb-2">
            <p class="font-semibold text-operacao-800">{{ contagem.nome }}</p>
            <p class="text-xs font-bold" :class="calcProgressoMensal(contagem).feitas >= calcProgressoMensal(contagem).esperadas ? 'text-controle-600' : 'text-operacao-600'">
              {{ calcProgressoMensal(contagem).feitas }}/{{ calcProgressoMensal(contagem).esperadas }}
            </p>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div>
              <p class="text-[10px] text-operacao-400 uppercase">Próxima</p>
              <p class="text-xs font-semibold text-operacao-600">{{ calcProximaContagem(contagem) }}</p>
            </div>
            <div>
              <p class="text-[10px] text-operacao-400 uppercase">Recorrência</p>
              <p class="text-xs font-semibold text-operacao-600">{{ labelRecorrencia(contagem.recorrencia) }}</p>
            </div>
            <div>
              <p class="text-[10px] text-operacao-400 uppercase">Progresso</p>
              <p class="text-xs font-bold" :class="calcProgressoMensal(contagem).feitas >= calcProgressoMensal(contagem).esperadas ? 'text-controle-600' : 'text-operacao-600'">
                {{ calcProgressoMensal(contagem).feitas }}/{{ calcProgressoMensal(contagem).esperadas }}
              </p>
            </div>
          </div>
        </div>
      </div>

      </template>

      <TablePagination
        v-if="!loading && contagens.length > 0"
        v-model="page"
        :page-size="pageSize"
        :total-items="filteredContagens.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>
  </div>
</template>
