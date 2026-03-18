<template>
  <div class="space-y-6">
    <!-- ========================================== -->
    <!-- HERO HEADER                                 -->
    <!-- ========================================== -->
    <div class="rounded-2xl bg-white ring-1 ring-[#EBEBED] shadow-sm overflow-hidden">
      <!-- Accent top bar -->
      <div class="h-1" :class="accentBar" />

      <div class="px-6 py-5">
        <div class="flex items-start gap-4">
          <!-- Back -->
          <button
            class="w-8 h-8 mt-0.5 rounded-lg bg-operacao-50 flex items-center justify-center hover:bg-operacao-100 transition-colors flex-shrink-0"
            @click="$emit('voltar')"
          >
            <UIcon name="i-heroicons-arrow-left" class="w-4 h-4 text-operacao-600" />
          </button>

          <!-- Title + metadata -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2.5 mb-1">
              <h1 class="text-xl font-bold text-operacao-900 truncate">{{ contagem.nome }}</h1>
              <UBadge :color="statusColor" variant="subtle" size="xs">{{ statusLabel }}</UBadge>
            </div>

            <!-- Inline metadata -->
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-operacao-500">
              <span class="inline-flex items-center gap-1.5">
                <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 text-operacao-400" />
                {{ labelRecorrencia(contagem.recorrencia) }}
              </span>
              <span class="inline-flex items-center gap-1.5">
                <UIcon name="i-heroicons-user-group" class="w-3.5 h-3.5 text-operacao-400" />
                {{ responsaveisLabel }}
              </span>
              <span class="inline-flex items-center gap-1.5">
                <UIcon name="i-heroicons-map-pin" class="w-3.5 h-3.5 text-operacao-400" />
                {{ setoresList.length > 0 ? setoresList.join(', ') : 'Sem setores' }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <UDropdown
            :items="acoes"
            :popper="{ placement: 'bottom-end' }"
            class="flex-shrink-0"
          >
            <UButton color="white" variant="solid" size="sm" class="ring-1 ring-inset ring-[#EBEBED]">
              <UIcon name="i-heroicons-ellipsis-vertical" class="w-4 h-4" />
              Ações
            </UButton>
          </UDropdown>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- SEÇÃO DE HISTÓRICO                          -->
    <!-- ========================================== -->

    <!-- Loading -->
    <div v-if="loadingHistorico" class="space-y-4">
      <div class="flex items-center gap-3 mb-1">
        <USkeleton class="h-5 w-40" />
        <USkeleton class="h-4 w-24" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="rounded-xl bg-white ring-1 ring-[#EBEBED] p-4">
          <div class="flex items-center gap-2 mb-3">
            <USkeleton class="h-3 w-16" />
            <USkeleton class="h-4 w-12 rounded-full" />
          </div>
          <USkeleton class="h-4 w-36 mb-1" />
          <USkeleton class="h-3 w-28 mb-4" />
          <div class="grid grid-cols-4 gap-2">
            <USkeleton v-for="j in 4" :key="j" class="h-14 rounded-lg" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="resultados.length === 0 && historico.length === 0"
      class="rounded-2xl bg-white ring-1 ring-[#EBEBED] shadow-sm py-14 px-6 text-center"
    >
      <div class="relative w-20 h-20 mx-auto mb-5">
        <div class="absolute inset-0 rounded-2xl bg-operacao-100/80 rotate-6" />
        <div class="relative w-full h-full rounded-2xl bg-white ring-1 ring-[#EBEBED] shadow-sm flex items-center justify-center">
          <UIcon name="i-heroicons-clipboard-document-check" class="w-9 h-9 text-operacao-300" />
        </div>
      </div>
      <h3 class="text-base font-bold text-operacao-700 mb-1">Nenhuma contagem realizada</h3>
      <p class="text-sm text-operacao-400 max-w-xs mx-auto">
        As contagens finalizadas aparecerão aqui com todos os detalhes.
      </p>
    </div>

    <!-- Resultados -->
    <div v-else>
      <div class="flex items-center gap-3 mb-4">
        <h2 class="text-base font-bold text-operacao-800">Histórico</h2>
        <span class="text-xs font-medium text-operacao-400 bg-operacao-100 px-2 py-0.5 rounded-full">
          {{ totalContagens }}
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <!-- Resultado cards -->
        <button
          v-for="(r, idx) in resultados"
          :key="'r-' + idx"
          class="group relative text-left rounded-xl bg-white ring-1 ring-[#EBEBED] shadow-sm overflow-hidden transition-all duration-200 hover:shadow-lg hover:ring-operacao-300 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
          @click="abrirSlideover(r)"
        >
          <!-- Accent bar -->
          <div class="h-1 w-full" :class="saudeBarCor(r)" />

          <div class="p-4">
            <!-- Top row -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-bold text-operacao-400 uppercase tracking-wider">
                  #{{ r.ciclo || (resultados.length - idx) }}
                </span>
                <span class="w-1 h-1 rounded-full bg-operacao-200" />
                <span class="text-[11px] text-operacao-400">{{ formatDateShort(r.finalizado_em) }}</span>
              </div>
              <span
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase"
                :class="saudeBadge(r)"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="saudeDot(r)" />
                {{ saudeLabel(r) }}
              </span>
            </div>

            <!-- Motivo -->
            <p class="text-sm font-semibold text-operacao-800 truncate mb-0.5">
              {{ r.motivo || 'Contagem finalizada' }}
            </p>
            <p class="text-xs text-operacao-400 mb-3">{{ formatDateTime(r.finalizado_em) }}</p>

            <!-- Stats row -->
            <div class="flex items-stretch gap-1.5">
              <div class="flex-1 rounded-lg bg-operacao-50 py-2 text-center">
                <p class="text-base font-bold text-operacao-700 leading-none mb-0.5">{{ r.resumo.total_contados }}</p>
                <p class="text-[9px] font-semibold uppercase tracking-wider text-operacao-400">Contados</p>
              </div>
              <div class="flex-1 rounded-lg py-2 text-center" :class="r.resumo.total_sobras > 0 ? 'bg-controle-50' : 'bg-operacao-50'">
                <p class="text-base font-bold leading-none mb-0.5" :class="r.resumo.total_sobras > 0 ? 'text-controle-600' : 'text-operacao-300'">{{ r.resumo.total_sobras }}</p>
                <p class="text-[9px] font-semibold uppercase tracking-wider text-operacao-400">Sobras</p>
              </div>
              <div class="flex-1 rounded-lg py-2 text-center" :class="r.resumo.total_faltas > 0 ? 'bg-red-50' : 'bg-operacao-50'">
                <p class="text-base font-bold leading-none mb-0.5" :class="r.resumo.total_faltas > 0 ? 'text-red-500' : 'text-operacao-300'">{{ r.resumo.total_faltas }}</p>
                <p class="text-[9px] font-semibold uppercase tracking-wider text-operacao-400">Faltas</p>
              </div>
              <div class="flex-1 rounded-lg py-2 text-center" :class="impactoBg(r.resumo.valor_total_divergencia)">
                <p class="text-sm font-bold leading-none mb-0.5 truncate px-1" :class="impactoColor(r.resumo.valor_total_divergencia)">
                  {{ formatCurrencyCompact(r.resumo.valor_total_divergencia) }}
                </p>
                <p class="text-[9px] font-semibold uppercase tracking-wider text-operacao-400">R$</p>
              </div>
            </div>
          </div>

          <!-- Hover indicator -->
          <div class="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <UIcon name="i-heroicons-arrow-right" class="w-4 h-4 text-operacao-300" />
          </div>
        </button>

        <!-- Legado cards -->
        <div
          v-for="(h, idx) in historico"
          :key="'h-' + idx"
          class="relative rounded-xl bg-white ring-1 ring-[#EBEBED] shadow-sm overflow-hidden"
        >
          <div class="h-1 w-full bg-operacao-200" />
          <div class="p-4">
            <div class="flex items-center gap-2 mb-3">
              <span class="text-[11px] font-bold text-operacao-300 uppercase tracking-wider">Legado</span>
              <span class="w-1 h-1 rounded-full bg-operacao-200" />
              <span class="text-[11px] text-operacao-400">{{ formatDate(h.data) }}</span>
            </div>
            <p class="text-sm font-semibold text-operacao-800 truncate mb-3">{{ h.motivo }}</p>
            <div class="flex items-stretch gap-1.5">
              <div class="flex-1 rounded-lg py-2 text-center" :class="h.total_sobras > 0 ? 'bg-controle-50' : 'bg-operacao-50'">
                <p class="text-base font-bold leading-none mb-0.5" :class="h.total_sobras > 0 ? 'text-controle-600' : 'text-operacao-300'">{{ h.total_sobras }}</p>
                <p class="text-[9px] font-semibold uppercase tracking-wider text-operacao-400">Sobras</p>
              </div>
              <div class="flex-1 rounded-lg py-2 text-center" :class="h.total_faltas > 0 ? 'bg-red-50' : 'bg-operacao-50'">
                <p class="text-base font-bold leading-none mb-0.5" :class="h.total_faltas > 0 ? 'text-red-500' : 'text-operacao-300'">{{ h.total_faltas }}</p>
                <p class="text-[9px] font-semibold uppercase tracking-wider text-operacao-400">Faltas</p>
              </div>
              <div class="flex-1 rounded-lg py-2 text-center" :class="impactoBg(h.valor_total_divergencia)">
                <p class="text-sm font-bold leading-none mb-0.5 truncate px-1" :class="impactoColor(h.valor_total_divergencia)">
                  {{ formatCurrencyCompact(h.valor_total_divergencia) }}
                </p>
                <p class="text-[9px] font-semibold uppercase tracking-wider text-operacao-400">R$</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- SLIDEOVER DE DETALHES                       -->
    <!-- ========================================== -->
    <USlideover
      v-model="slideoverOpen"
      :ui="{
        width: 'max-w-2xl',
        overlay: { background: 'bg-operacao-900/40 backdrop-blur-[2px]' },
        background: 'bg-white'
      }"
    >
      <div v-if="resultadoSelecionado" class="flex flex-col h-full">
        <!-- Slideover header -->
        <div class="px-6 py-4 border-b border-operacao-100">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center" :class="saudeIconBg(resultadoSelecionado)">
                <UIcon :name="saudeIcon(resultadoSelecionado)" class="w-5 h-5" :class="saudeIconColor(resultadoSelecionado)" />
              </div>
              <div>
                <h3 class="text-base font-bold text-operacao-800">Ciclo #{{ resultadoSelecionado.ciclo || '—' }}</h3>
                <p class="text-xs text-operacao-400">{{ formatDateTime(resultadoSelecionado.finalizado_em) }}</p>
              </div>
            </div>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" size="sm" @click="slideoverOpen = false" />
          </div>

          <!-- Motivo -->
          <div v-if="resultadoSelecionado.motivo" class="flex items-start gap-2 px-3 py-2 rounded-lg bg-operacao-50 text-sm text-operacao-600">
            <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="w-3.5 h-3.5 text-operacao-400 mt-0.5 flex-shrink-0" />
            <span>{{ resultadoSelecionado.motivo }}</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <!-- Stat cards -->
          <div class="px-6 py-4 border-b border-operacao-100">
            <div class="grid grid-cols-5 gap-2">
              <div class="rounded-lg bg-guardian-50 ring-1 ring-guardian-100 py-2.5 text-center">
                <p class="text-xl font-bold text-guardian-600 leading-none">{{ resultadoSelecionado.resumo.total_contados }}</p>
                <p class="text-[10px] text-guardian-500 font-semibold mt-1">Contados</p>
              </div>
              <div class="rounded-lg bg-operacao-50 ring-1 ring-operacao-100 py-2.5 text-center">
                <p class="text-xl font-bold text-operacao-400 leading-none">{{ resultadoSelecionado.resumo.total_nao_contados }}</p>
                <p class="text-[10px] text-operacao-400 font-semibold mt-1">Ignorados</p>
              </div>
              <div class="rounded-lg bg-controle-50 ring-1 ring-controle-100 py-2.5 text-center">
                <p class="text-xl font-bold text-controle-600 leading-none">{{ resultadoSelecionado.resumo.total_sobras }}</p>
                <p class="text-[10px] text-controle-500 font-semibold mt-1">Sobras</p>
              </div>
              <div class="rounded-lg bg-red-50 ring-1 ring-red-100 py-2.5 text-center">
                <p class="text-xl font-bold text-red-500 leading-none">{{ resultadoSelecionado.resumo.total_faltas }}</p>
                <p class="text-[10px] text-red-400 font-semibold mt-1">Faltas</p>
              </div>
              <div
                class="rounded-lg ring-1 py-2.5 text-center"
                :class="resultadoSelecionado.resumo.valor_total_divergencia >= 0
                  ? 'bg-controle-50 ring-controle-100'
                  : 'bg-red-50 ring-red-100'"
              >
                <p class="text-lg font-bold leading-none" :class="resultadoSelecionado.resumo.valor_total_divergencia >= 0 ? 'text-controle-600' : 'text-red-500'">
                  {{ formatCurrencyCompact(resultadoSelecionado.resumo.valor_total_divergencia) }}
                </p>
                <p class="text-[10px] font-semibold mt-1" :class="resultadoSelecionado.resumo.valor_total_divergencia >= 0 ? 'text-controle-500' : 'text-red-400'">Impacto</p>
              </div>
            </div>
          </div>

          <!-- Items table -->
          <div class="px-6 py-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-bold text-operacao-700">Itens</h4>
              <div class="flex items-center rounded-lg bg-operacao-50 p-0.5">
                <button
                  class="text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all"
                  :class="filtroItens === 'todos'
                    ? 'bg-white text-operacao-700 shadow-sm ring-1 ring-black/5'
                    : 'text-operacao-400 hover:text-operacao-600'"
                  @click="filtroItens = 'todos'"
                >
                  Todos ({{ resultadoSelecionado.itens.length }})
                </button>
                <button
                  class="text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all"
                  :class="filtroItens === 'divergencias'
                    ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5'
                    : 'text-operacao-400 hover:text-operacao-600'"
                  @click="filtroItens = 'divergencias'"
                >
                  Divergências ({{ resultadoSelecionado.itens.filter(i => i.diferenca !== 0).length }})
                </button>
              </div>
            </div>

            <div class="rounded-lg ring-1 ring-[#EBEBED] overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-operacao-50/60">
                    <th class="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-operacao-400">Produto</th>
                    <th class="px-2 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-operacao-400 w-20">Sistema</th>
                    <th class="px-2 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-operacao-400 w-20">Contado</th>
                    <th class="px-2 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-operacao-400 w-24">Diferença</th>
                    <th class="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-operacao-400 w-24">Valor</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-operacao-50">
                  <tr
                    v-for="item in itensFiltrados"
                    :key="item.produto_id"
                    class="transition-colors"
                    :class="itemRowClass(item)"
                  >
                    <td class="px-3 py-2.5">
                      <p class="font-medium text-operacao-800 text-[13px]">{{ item.nome }}</p>
                      <p class="text-[10px] text-operacao-400">{{ item.unidade_sigla }}</p>
                    </td>
                    <td class="px-2 py-2.5 text-right font-mono text-[13px] text-operacao-500 tabular-nums">
                      {{ formatNumber(item.saldo_sistema) }}
                    </td>
                    <td class="px-2 py-2.5 text-right font-mono text-[13px] text-operacao-800 font-semibold tabular-nums">
                      {{ formatNumber(item.quantidade_contada) }}
                    </td>
                    <td class="px-2 py-2.5 text-right">
                      <span
                        v-if="item.diferenca !== 0"
                        class="inline-flex items-center gap-0.5 font-bold font-mono text-[13px] tabular-nums"
                        :class="item.diferenca > 0 ? 'text-controle-600' : 'text-red-500'"
                      >
                        <UIcon
                          :name="item.diferenca > 0 ? 'i-heroicons-arrow-small-up' : 'i-heroicons-arrow-small-down'"
                          class="w-4 h-4"
                        />
                        {{ Math.abs(item.diferenca) }}
                      </span>
                      <span v-else class="text-operacao-300 text-[13px]">—</span>
                    </td>
                    <td class="px-3 py-2.5 text-right">
                      <span
                        v-if="item.valor_divergencia !== 0"
                        class="font-semibold font-mono text-[13px] tabular-nums"
                        :class="item.valor_divergencia > 0 ? 'text-controle-600' : 'text-red-500'"
                      >
                        {{ item.valor_divergencia > 0 ? '+' : '' }}{{ formatCurrency(item.valor_divergencia) }}
                      </span>
                      <span v-else class="text-operacao-300 text-[13px]">—</span>
                    </td>
                  </tr>
                  <tr v-if="itensFiltrados.length === 0">
                    <td colspan="5" class="px-3 py-8 text-center text-operacao-400 text-sm">
                      Nenhuma divergência encontrada
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import type { Contagem, ContagemHistorico, ContagemResultado, ContagemResultadoItem } from '~/types'

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
  'enviar-lembrete': []
}>()

const { formatCurrency, formatNumber } = useFormatters()

// ==========================================
// SLIDEOVER
// ==========================================
const slideoverOpen = ref(false)
const resultadoSelecionado = ref<ContagemResultado | null>(null)
const filtroItens = ref<'todos' | 'divergencias'>('todos')

const abrirSlideover = (r: ContagemResultado) => {
  resultadoSelecionado.value = r
  filtroItens.value = 'todos'
  slideoverOpen.value = true
}

const itensFiltrados = computed(() => {
  if (!resultadoSelecionado.value) return []
  if (filtroItens.value === 'divergencias') {
    return resultadoSelecionado.value.itens.filter(i => i.diferenca !== 0)
  }
  return resultadoSelecionado.value.itens
})

// ==========================================
// COMPUTED
// ==========================================
const totalContagens = computed(() => props.resultados.length + props.historico.length)

const responsaveisLabel = computed(() => {
  if (props.contagem.responsaveis_data && props.contagem.responsaveis_data.length > 0) {
    const nomes = props.contagem.responsaveis_data.map((r: any) => r.nome)
    if (nomes.length <= 2) return nomes.join(', ')
    return `${nomes.slice(0, 2).join(', ')} +${nomes.length - 2}`
  }
  return props.contagem.responsavel_nome || 'Sem responsável'
})

const setoresList = computed(() => {
  return (props.contagem.contagem_setores || [])
    .map(cs => cs.setor?.nome)
    .filter(Boolean) as string[]
})

const statusLabels: Record<string, string> = {
  aguardando: 'Aguardando', pendente: 'Pendente', atrasada: 'Atrasada',
  em_andamento: 'Em andamento', finalizada: 'Finalizada'
}
const statusColors: Record<string, string> = {
  aguardando: 'gray', pendente: 'yellow', atrasada: 'red',
  em_andamento: 'blue', finalizada: 'green'
}

const statusLabel = computed(() => statusLabels[props.contagem.status || 'aguardando'] || 'Aguardando')
const statusColor = computed(() => statusColors[props.contagem.status || 'aguardando'] || 'gray')

const accentBar = computed(() => {
  const bars: Record<string, string> = {
    principal: 'bg-emerald-500',
    apoio: 'bg-amber-500',
    inventario: 'bg-blue-500'
  }
  return bars[props.contagem.tipo] || bars.principal
})

const acoes = computed(() => {
  return [
    [
      { label: 'Editar', icon: 'i-heroicons-pencil-square', click: () => emit('editar') },
      ...(props.contagem.responsavel_telefone
        ? [{ label: 'Enviar Lembrete', icon: 'i-heroicons-chat-bubble-left-ellipsis', click: () => emit('enviar-lembrete') }]
        : [])
    ]
  ]
})

// ==========================================
// SAÚDE
// ==========================================
const getDivPct = (r: ContagemResultado) => {
  const total = r.resumo.total_contados + r.resumo.total_nao_contados
  if (total === 0) return 0
  return ((r.resumo.total_sobras + r.resumo.total_faltas) / total) * 100
}

const saudeBarCor = (r: ContagemResultado) => {
  const p = getDivPct(r)
  if (p === 0) return 'bg-gradient-to-r from-controle-300 to-controle-400'
  if (p <= 15) return 'bg-gradient-to-r from-amber-300 to-amber-400'
  return 'bg-gradient-to-r from-red-300 to-red-400'
}

const saudeLabel = (r: ContagemResultado) => {
  const p = getDivPct(r)
  if (p === 0) return 'OK'
  if (p <= 15) return 'Atenção'
  return 'Crítica'
}

const saudeBadge = (r: ContagemResultado) => {
  const p = getDivPct(r)
  if (p === 0) return 'bg-controle-50 text-controle-700'
  if (p <= 15) return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-700'
}

const saudeDot = (r: ContagemResultado) => {
  const p = getDivPct(r)
  if (p === 0) return 'bg-controle-500'
  if (p <= 15) return 'bg-amber-500'
  return 'bg-red-500'
}

const saudeIcon = (r: ContagemResultado) => {
  const p = getDivPct(r)
  if (p === 0) return 'i-heroicons-check-circle'
  if (p <= 15) return 'i-heroicons-exclamation-triangle'
  return 'i-heroicons-x-circle'
}

const saudeIconBg = (r: ContagemResultado) => {
  const p = getDivPct(r)
  if (p === 0) return 'bg-controle-100'
  if (p <= 15) return 'bg-amber-100'
  return 'bg-red-100'
}

const saudeIconColor = (r: ContagemResultado) => {
  const p = getDivPct(r)
  if (p === 0) return 'text-controle-600'
  if (p <= 15) return 'text-amber-600'
  return 'text-red-600'
}

// ==========================================
// STYLING HELPERS
// ==========================================
const impactoBg = (v: number) => v >= 0 ? 'bg-controle-50' : 'bg-red-50'
const impactoColor = (v: number) => v >= 0 ? 'text-controle-600' : 'text-red-500'

const itemRowClass = (item: ContagemResultadoItem) => {
  if (item.diferenca > 0) return 'bg-controle-50/20 hover:bg-controle-50/40'
  if (item.diferenca < 0) return 'bg-red-50/20 hover:bg-red-50/40'
  return 'hover:bg-operacao-50/40'
}

// ==========================================
// FORMATTERS
// ==========================================
const labelRecorrencia = (r?: string) => {
  const m: Record<string, string> = { diaria: 'Diária', semanal: 'Semanal', quinzenal: 'Quinzenal', mensal: 'Mensal' }
  return m[r || ''] || 'Sem recorrência'
}

const formatDate = (date?: string) => {
  if (!date) return '-'
  const d = date.includes('T') ? new Date(date) : new Date(date + 'T00:00:00')
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

const formatDateShort = (datetime?: string) => {
  if (!datetime) return '-'
  const d = new Date(datetime)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const formatDateTime = (datetime?: string) => {
  if (!datetime) return '-'
  const d = new Date(datetime)
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const formatCurrencyCompact = (value: number) => {
  const abs = Math.abs(value)
  const sign = value >= 0 ? '+' : '-'
  if (abs >= 10000) return `${sign}R$${(abs / 1000).toFixed(0)}k`
  if (abs >= 1000) return `${sign}R$${(abs / 1000).toFixed(1).replace('.', ',')}k`
  return `${sign}R$${abs.toFixed(0)}`
}
</script>
