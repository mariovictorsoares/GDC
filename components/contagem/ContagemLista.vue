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

// Pagination
const page = ref(1)
const pageSize = ref(10)

const contagensPaginadas = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return props.contagens.slice(start, start + pageSize.value)
})

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
  const diaHoje = hoje.getDate()

  let esperadas = 0
  if (rec === 'diaria') {
    esperadas = diaHoje
  } else if (rec === 'semanal') {
    const diasConfig = contagem.dias_semana || []
    if (diasConfig.length === 0) {
      esperadas = Math.ceil(diaHoje / 7)
    } else {
      let count = 0
      for (let d = 1; d <= diaHoje; d++) {
        const diaSemana = new Date(ano, mes, d).getDay()
        const label = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][diaSemana]
        if (diasConfig.includes(label)) count++
      }
      esperadas = count
    }
  } else if (rec === 'quinzenal') {
    esperadas = diaHoje >= 15 ? 2 : 1
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

  if (diffDias < 0) return 'Atrasada'
  if (diffDias === 0) return `Hoje (${horario})`
  if (diffDias === 1) return `Amanhã (${horario})`
  return `Em ${diffDias} dias`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-operacao-800">Contagem de Estoque</h1>
        <p class="text-sm text-operacao-400">Gerencie suas contagens de estoque e inventário</p>
      </div>
      <div class="flex gap-2">
        <UButton color="gray" variant="soft" @click="$emit('gerenciar-setores')">
          <UIcon name="i-heroicons-map-pin" class="w-4 h-4 mr-2" />
          Setores
        </UButton>
        <UButton color="primary" @click="$emit('nova-contagem')">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
          Nova Contagem
        </UButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <UCard :ui="{ body: { padding: '' } }">
        <div class="p-5 space-y-4">
          <div v-for="i in 4" :key="i" class="flex items-center justify-between py-3">
            <div class="flex items-center gap-4">
              <USkeleton class="h-10 w-10 rounded-lg" />
              <div class="space-y-2">
                <USkeleton class="h-4 w-48" />
                <USkeleton class="h-3 w-32" />
              </div>
            </div>
            <div class="flex items-center gap-3">
              <USkeleton class="h-6 w-20 rounded-full" />
              <USkeleton class="h-5 w-5 rounded-full" />
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty state -->
    <UCard v-else-if="contagens.length === 0">
      <div class="flex flex-col items-center justify-center py-16 text-operacao-400">
        <UIcon name="i-heroicons-clipboard-document-list" class="w-12 h-12 mb-4 text-operacao-300" />
        <p class="text-base font-medium">Nenhuma contagem criada</p>
        <p class="text-sm text-operacao-400 mt-1 mb-6">Crie uma contagem para organizar e contar seus produtos por setor</p>
        <UButton color="primary" @click="$emit('nova-contagem')">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
          Criar primeira contagem
        </UButton>
      </div>
    </UCard>

    <!-- Lista de contagens -->
    <UCard v-else :ui="{ body: { padding: '' } }">
      <!-- Tabela desktop -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-operacao-200">
              <th class="text-left px-6 py-3 text-xs font-medium text-operacao-400 uppercase tracking-wider w-[28%]"></th>
              <th class="text-center px-4 py-3 text-xs font-medium text-operacao-400 uppercase tracking-wider">Última contagem</th>
              <th class="text-center px-4 py-3 text-xs font-medium text-operacao-400 uppercase tracking-wider">Próxima contagem</th>
              <th class="text-center px-4 py-3 text-xs font-medium text-operacao-400 uppercase tracking-wider">Recorrência</th>
              <th class="text-center px-4 py-3 text-xs font-medium text-operacao-400 uppercase tracking-wider w-[100px]">Progresso</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-operacao-100">
            <tr
              v-for="contagem in contagensPaginadas"
              :key="contagem.id"
              class="hover:bg-operacao-50 transition-colors cursor-pointer"
              @click="$emit('click-contagem', contagem)"
            >
              <td class="px-6 py-4">
                <p class="font-semibold text-operacao-800">{{ contagem.nome }}</p>
              </td>
              <td class="px-4 py-4 text-center">
                <p class="text-xs text-operacao-400">Última contagem</p>
                <p class="font-semibold text-operacao-600 text-sm">{{ contagem.ultima_contagem ? formatDate(contagem.ultima_contagem) : '-' }}</p>
              </td>
              <td class="px-4 py-4 text-center">
                <p class="text-xs text-operacao-400">Próxima contagem</p>
                <p class="font-semibold text-operacao-600 text-sm">{{ calcProximaContagem(contagem) }}</p>
              </td>
              <td class="px-4 py-4 text-center">
                <p class="text-xs text-operacao-400">Recorrência</p>
                <p class="font-semibold text-operacao-600 text-sm">{{ labelRecorrencia(contagem.recorrencia) }}</p>
              </td>
              <td class="px-4 py-4 text-center">
                <p class="text-xs text-operacao-400">Progresso</p>
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

      <TablePagination
        v-if="contagens.length > pageSize"
        v-model="page"
        :page-size="pageSize"
        :total-items="contagens.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>
  </div>
</template>
