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
            <h1 class="text-xl font-bold text-operacao-900 truncate mb-1">{{ contagem.nome }}</h1>

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
              <span class="text-operacao-200">|</span>
              <span class="inline-flex items-center gap-1.5">
                <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5 text-operacao-400" />
                Última: {{ ultimaContagemLabel }}
              </span>
              <span class="inline-flex items-center gap-1.5">
                <span v-if="proximaStatusDot" class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="proximaStatusDot" />
                <UIcon v-else name="i-heroicons-calendar" class="w-3.5 h-3.5 text-operacao-400" />
                <span :class="proximaTextClass">Próxima: {{ proximaContagemLabel }}</span>
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <UButton color="white" variant="solid" size="sm" class="ring-1 ring-inset ring-[#EBEBED]" :loading="loadingHistorico" @click="$emit('atualizar')">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
              Atualizar
            </UButton>
            <UDropdown
              :items="acoes"
              :popper="{ placement: 'bottom-end' }"
            >
              <UButton color="white" variant="solid" size="sm" class="ring-1 ring-inset ring-[#EBEBED]">
                <UIcon name="i-heroicons-ellipsis-vertical" class="w-4 h-4" />
                Ações
              </UButton>
            </UDropdown>
          </div>
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
      <UCard :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
        <UTable :columns="historicoColumns" :rows="[]" :loading="true" :ui="historicoTableUi">
          <template #empty-state><div /></template>
        </UTable>
      </UCard>
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

      <UCard :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
        <UTable
          :columns="historicoColumns"
          :rows="paginatedHistorico"
          :ui="historicoTableUi"
          @select="onHistoricoRowClick"
        >
          <template #empty-state>
            <div class="flex flex-col items-center justify-center py-6 text-operacao-400">
              <UIcon name="i-heroicons-clipboard-document-check" class="w-8 h-8 mb-2" />
              <p class="text-sm">Nenhuma contagem encontrada</p>
            </div>
          </template>

          <template #ciclo-data="{ row }">
            <span v-if="row._tipo === 'resultado'" class="font-semibold text-operacao-500">#{{ row.ciclo }}</span>
            <span v-else class="text-operacao-300">—</span>
          </template>

          <template #data-data="{ row }">
            {{ row.dataFormatada }}
          </template>

          <template #tipo-data="{ row }">
            <span class="text-operacao-800">{{ row.motivo }}</span>
          </template>

          <template #status-data="{ row }">
            <span
              v-if="row._tipo === 'resultado'"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase"
              :class="row.badgeClass"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="row.dotClass" />
              {{ row.statusLabel }}
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-operacao-100 text-operacao-400"
            >
              Legado
            </span>
          </template>

          <template #contados-data="{ row }">
            <span v-if="row._tipo === 'resultado'" class="font-semibold text-operacao-700 tabular-nums">{{ row.contados }}</span>
            <span v-else class="text-operacao-300">—</span>
          </template>

          <template #sobras-data="{ row }">
            <span class="font-semibold tabular-nums" :class="row.sobras > 0 ? 'text-controle-600' : 'text-operacao-300'">{{ row.sobras }}</span>
          </template>

          <template #faltas-data="{ row }">
            <span class="font-semibold tabular-nums" :class="row.faltas > 0 ? 'text-red-500' : 'text-operacao-300'">{{ row.faltas }}</span>
          </template>

          <template #impacto-data="{ row }">
            <span class="font-semibold tabular-nums" :class="impactoColor(row.valorDivergencia)">{{ formatCurrencyCompact(row.valorDivergencia) }}</span>
          </template>
        </UTable>

        <TablePagination
          v-if="totalContagens > 0"
          v-model="historicoPage"
          :page-size="historicoPageSize"
          :total-items="allHistoricoRows.length"
          @update:page-size="historicoPageSize = $event"
        />
      </UCard>
    </div>

    <!-- ========================================== -->
    <!-- MODAL DE DETALHES DO CICLO                  -->
    <!-- ========================================== -->
    <UModal
      v-model="slideoverOpen"
      :ui="{
        width: 'sm:max-w-7xl',
        overlay: { background: 'bg-operacao-900/40 backdrop-blur-[2px]' },
        background: 'bg-white',
        rounded: 'rounded-2xl',
        shadow: 'shadow-xl',
        padding: 'p-0'
      }"
    >
      <div v-if="resultadoSelecionado" class="flex flex-col max-h-[85vh]">
        <!-- Header compacto fixo -->
        <div class="px-6 py-3 border-b border-operacao-100 flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="saudeIconBg(resultadoSelecionado)">
              <UIcon :name="saudeIcon(resultadoSelecionado)" class="w-4.5 h-4.5" :class="saudeIconColor(resultadoSelecionado)" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-operacao-800 leading-tight">Ciclo #{{ resultadoSelecionado.ciclo || '—' }}</h3>
              <p class="text-xs text-operacao-400">{{ formatDateTime(resultadoSelecionado.finalizado_em) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-operacao-400">
              <span class="inline-flex items-center gap-1">
                <UIcon name="i-heroicons-arrow-path" class="w-3.5 h-3.5 text-operacao-300" />
                {{ labelRecorrencia(contagem.recorrencia) }}
              </span>
              <span class="inline-flex items-center gap-1">
                <UIcon name="i-heroicons-user-group" class="w-3.5 h-3.5 text-operacao-300" />
                {{ responsaveisLabel }}
              </span>
              <span class="inline-flex items-center gap-1">
                <UIcon name="i-heroicons-map-pin" class="w-3.5 h-3.5 text-operacao-300" />
                {{ setoresList.length > 0 ? setoresList.join(', ') : 'Sem setores' }}
              </span>
            </div>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" size="sm" @click="slideoverOpen = false" />
          </div>
        </div>

        <!-- Conteudo com scroll (cards + tabela) -->
        <div class="flex-1 overflow-y-auto">
          <!-- Stat cards -->
          <div class="px-6 py-4">
            <div class="grid grid-cols-5 gap-3">
              <div class="rounded-lg bg-white ring-1 ring-operacao-100 py-2.5 text-center shadow-sm">
                <p class="text-xl font-bold text-guardian-600 leading-none tracking-tight">{{ resultadoSelecionado.resumo.total_contados }}</p>
                <p class="text-[10px] text-operacao-400 font-medium mt-1.5 uppercase tracking-wider">Contados</p>
              </div>
              <div class="rounded-lg bg-white ring-1 ring-operacao-100 py-2.5 text-center shadow-sm">
                <p class="text-xl font-bold leading-none tracking-tight" :class="resultadoSelecionado.resumo.total_sobras > 0 ? 'text-controle-600' : 'text-operacao-300'">{{ resultadoSelecionado.resumo.total_sobras }}</p>
                <p class="text-[10px] text-operacao-400 font-medium mt-1.5 uppercase tracking-wider">Sobras</p>
              </div>
              <div class="rounded-lg bg-white ring-1 ring-operacao-100 py-2.5 text-center shadow-sm">
                <p class="text-xl font-bold leading-none tracking-tight" :class="resultadoSelecionado.resumo.total_faltas > 0 ? 'text-red-500' : 'text-operacao-300'">{{ resultadoSelecionado.resumo.total_faltas }}</p>
                <p class="text-[10px] text-operacao-400 font-medium mt-1.5 uppercase tracking-wider">Faltas</p>
              </div>
              <div class="rounded-lg bg-white ring-1 ring-operacao-100 py-2.5 text-center shadow-sm">
                <p class="text-lg font-bold leading-none tracking-tight" :class="resultadoSelecionado.resumo.valor_total_divergencia >= 0 ? 'text-controle-600' : 'text-red-500'">
                  {{ formatCurrencyCompact(resultadoSelecionado.resumo.valor_total_divergencia) }}
                </p>
                <p class="text-[10px] text-operacao-400 font-medium mt-1.5 uppercase tracking-wider">Impacto</p>
              </div>
              <div class="rounded-lg bg-white ring-1 ring-operacao-100 py-2.5 text-center shadow-sm">
                <p class="text-xl font-bold leading-none tracking-tight" :class="acuracidadeColor(acuracidadeGeral)">
                  {{ formatPercent(acuracidadeGeral) }}
                </p>
                <p class="text-[10px] text-operacao-400 font-medium mt-1.5 uppercase tracking-wider">Acuracidade</p>
              </div>
            </div>
          </div>

          <!-- Items table -->
          <div class="px-6 pb-0">
            <UCard :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
              <UTable
                :columns="cicloColumns"
                :rows="paginatedItens"
                :ui="{
                  divide: 'divide-y divide-operacao-50 dark:divide-operacao-700',
                  thead: '',
                  th: { base: 'bg-operacao-100/70 dark:bg-operacao-800 border-b border-operacao-200/60 [&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66] [&_button>span+span]:text-operacao-300 [&_button>span+span]:!w-3.5 [&_button>span+span]:!h-3.5', color: 'text-[#5a5a66] dark:text-operacao-400', font: 'font-medium', size: 'text-xs uppercase tracking-wider', padding: 'px-4 py-2' },
                  td: { color: 'text-operacao-600 dark:text-operacao-200', size: 'text-sm', padding: 'px-4 py-2.5' },
                  tr: { base: 'hover:bg-operacao-50/50 transition-all duration-200 ease-in-out' }
                }"
              >
                <template #empty-state>
                  <div class="flex flex-col items-center justify-center py-6 text-operacao-400">
                    <UIcon name="i-heroicons-clipboard-document-check" class="w-8 h-8 mb-2" />
                    <p class="text-sm">Nenhum item contado</p>
                  </div>
                </template>

                <template #produto-data="{ row }">
                  <div>
                    <p class="font-semibold text-operacao-800">{{ row.nome }}</p>
                    <p class="text-[10px] text-operacao-400">{{ row.unidade_sigla }}</p>
                  </div>
                </template>

                <template #sistema-data="{ row }">
                  <span class="font-mono tabular-nums">{{ formatNumber(row.saldo_sistema) }}</span>
                </template>

                <template #contado-data="{ row }">
                  <UTooltip
                    v-if="row.setores_breakdown && row.setores_breakdown.length >= 1"
                    :popper="{ placement: 'top', strategy: 'fixed' }"
                    :ui="{ container: 'z-[100]', background: 'bg-gray-900', color: 'text-white', base: '!h-auto px-3 py-2.5 rounded-lg shadow-lg' }"
                  >
                    <span class="font-mono font-semibold text-operacao-800 tabular-nums border-b border-dashed border-operacao-300 cursor-help">
                      {{ formatNumber(row.quantidade_contada) }}
                    </span>
                    <template #text>
                      <div>
                        <p class="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1.5">Contagem por setor</p>
                        <div class="space-y-1">
                          <div
                            v-for="sb in row.setores_breakdown"
                            :key="sb.setor_id"
                            class="flex items-center justify-between gap-6 text-xs"
                          >
                            <span class="text-gray-300">{{ sb.setor_nome }}</span>
                            <span class="font-semibold text-white font-mono tabular-nums">{{ formatNumber(sb.quantidade) }} <span class="text-gray-500 font-normal text-[10px]">{{ row.unidade_sigla }}</span></span>
                          </div>
                        </div>
                        <div class="border-t border-gray-700 mt-1.5 pt-1.5 flex items-center justify-between text-xs">
                          <span class="text-gray-400 font-medium">Total</span>
                          <span class="font-bold text-white font-mono tabular-nums">{{ formatNumber(row.quantidade_contada) }} <span class="text-gray-500 font-normal text-[10px]">{{ row.unidade_sigla }}</span></span>
                        </div>
                      </div>
                    </template>
                  </UTooltip>
                  <span v-else class="font-mono font-semibold text-operacao-800 tabular-nums border-b border-dashed border-operacao-300">{{ formatNumber(row.quantidade_contada) }}</span>
                </template>

                <template #diferenca-data="{ row }">
                  <span
                    v-if="row.diferenca !== 0"
                    class="inline-flex items-center gap-0.5 font-bold font-mono tabular-nums"
                    :class="row.diferenca > 0 ? 'text-controle-600' : 'text-red-500'"
                  >
                    <UIcon
                      :name="row.diferenca > 0 ? 'i-heroicons-arrow-small-up' : 'i-heroicons-arrow-small-down'"
                      class="w-4 h-4"
                    />
                    {{ formatNumber(Math.abs(row.diferenca)) }}
                  </span>
                  <span v-else class="text-operacao-300">—</span>
                </template>

                <template #valor-data="{ row }">
                  <span
                    v-if="row.valor_divergencia !== 0"
                    class="font-semibold font-mono tabular-nums"
                    :class="row.valor_divergencia > 0 ? 'text-controle-600' : 'text-red-500'"
                  >
                    {{ row.valor_divergencia > 0 ? '+' : '' }}{{ formatCurrency(row.valor_divergencia) }}
                  </span>
                  <span v-else class="text-operacao-300">—</span>
                </template>

                <template #acuracidade-data="{ row }">
                  <span class="font-semibold tabular-nums" :class="acuracidadeColor(row.acuracidade ?? 100)">
                    {{ formatPercent(row.acuracidade ?? 100) }}
                  </span>
                </template>
              </UTable>

              <TablePagination
                v-if="itensOrdenados.length > 0"
                v-model="cicloPage"
                :page-size="cicloPageSize"
                :total-items="itensOrdenados.length"
                @update:page-size="cicloPageSize = $event"
              />
            </UCard>
          </div>
          <div class="h-4" />
        </div>
      </div>
    </UModal>
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
  'atualizar': []
}>()

const { formatCurrency, formatNumber } = useFormatters()

// ==========================================
// MODAL DE DETALHES
// ==========================================
const slideoverOpen = ref(false)
const resultadoSelecionado = ref<ContagemResultado | null>(null)
const abrirSlideover = (r: ContagemResultado) => {
  resultadoSelecionado.value = r
  cicloPage.value = 1
  slideoverOpen.value = true
}

// Mapa setor_id → nome, extraído dos dados da contagem
const setorNomeMap = computed(() => {
  const map = new Map<string, string>()
  for (const cs of (props.contagem.contagem_setores || [])) {
    if (cs.setor_id && cs.setor?.nome) {
      map.set(cs.setor_id, cs.setor.nome)
    }
  }
  return map
})

const calcAcuracidade = (saldo: number, contado: number) => {
  if (saldo === 0) return contado === 0 ? 100 : 0
  if (saldo < 0) return 0
  return Math.round((contado / saldo) * 10000) / 100
}

const itensOrdenados = computed(() => {
  if (!resultadoSelecionado.value) return []
  return [...resultadoSelecionado.value.itens].map(item => {
    // Sempre recalcular acuracidade a partir dos dados brutos (não confiar no valor salvo)
    const acuracidade = calcAcuracidade(item.saldo_sistema, item.quantidade_contada)
    const enriched = { ...item, acuracidade }
    // Enriquecer setores_breakdown com nomes caso estejam vazios
    if (enriched.setores_breakdown) {
      enriched.setores_breakdown = enriched.setores_breakdown.map(sb => ({
        ...sb,
        setor_nome: sb.setor_nome || setorNomeMap.value.get(sb.setor_id) || 'Setor'
      }))
    }
    return enriched
  }).sort((a, b) => {
    const absDiffA = Math.abs(a.diferenca)
    const absDiffB = Math.abs(b.diferenca)
    if (absDiffA !== absDiffB) return absDiffB - absDiffA
    return a.nome.localeCompare(b.nome)
  })
})

const acuracidadeGeral = computed(() => {
  const itens = itensOrdenados.value
  if (itens.length === 0) return 100
  const soma = itens.reduce((acc, i) => acc + i.acuracidade, 0)
  return Math.round((soma / itens.length) * 100) / 100
})

const esperadoLabel = computed(() => {
  const tipo = props.contagem.tipo
  if (tipo === 'apoio') return 'Esperado (Apoio)'
  if (tipo === 'inventario') return 'Esperado (Total)'
  return 'Esperado (Principal)'
})

const cicloColumns = computed(() => [
  { key: 'produto', label: 'Produto' },
  { key: 'sistema', label: esperadoLabel.value, class: 'text-center w-36', rowClass: 'text-center' },
  { key: 'contado', label: 'Contado', class: 'text-center w-24', rowClass: 'text-center' },
  { key: 'diferenca', label: 'Diferença', class: 'text-center w-28', rowClass: 'text-center' },
  { key: 'valor', label: 'Valor', class: 'text-right w-28', rowClass: 'text-right' },
  { key: 'acuracidade', label: 'Acuracidade', class: 'text-center w-28', rowClass: 'text-center' }
])

const cicloPage = ref(1)
const cicloPageSize = ref(20)
const paginatedItens = computed(() => {
  const start = (cicloPage.value - 1) * cicloPageSize.value
  return itensOrdenados.value.slice(start, start + cicloPageSize.value)
})

// ==========================================
// TABELA DE HISTÓRICO
// ==========================================
const historicoColumns = [
  { key: 'ciclo', label: '#', class: 'w-16' },
  { key: 'data', label: 'Data', class: 'w-40' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'status', label: 'Status', class: 'w-24' },
  { key: 'contados', label: 'Contados', class: 'text-right w-24' },
  { key: 'sobras', label: 'Sobras', class: 'text-right w-20' },
  { key: 'faltas', label: 'Faltas', class: 'text-right w-20' },
  { key: 'impacto', label: 'Impacto', class: 'text-right w-24' }
]

const historicoTableUi = {
  divide: 'divide-y divide-operacao-50 dark:divide-operacao-700',
  thead: '',
  th: {
    base: 'bg-operacao-100/70 dark:bg-operacao-800 border-b border-operacao-200/60 [&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66] [&_button>span+span]:text-operacao-300 [&_button>span+span]:!w-3.5 [&_button>span+span]:!h-3.5',
    color: 'text-[#5a5a66] dark:text-operacao-400',
    font: 'font-medium',
    size: 'text-xs uppercase tracking-wider',
    padding: 'px-4 py-2'
  },
  td: {
    color: 'text-operacao-600 dark:text-operacao-200',
    size: 'text-sm',
    padding: 'px-4 py-2.5'
  },
  tr: { base: 'cursor-pointer hover:bg-operacao-50 transition-colors' }
}

const allHistoricoRows = computed(() => {
  const resultadoRows = props.resultados.map((r, idx) => ({
    _tipo: 'resultado' as const,
    _original: r,
    ciclo: r.ciclo || (props.resultados.length - idx),
    dataFormatada: formatDateTime(r.finalizado_em),
    motivo: r.motivo || 'Contagem finalizada',
    statusLabel: saudeLabel(r),
    badgeClass: saudeBadge(r),
    dotClass: saudeDot(r),
    contados: r.resumo.total_contados,
    sobras: r.resumo.total_sobras,
    faltas: r.resumo.total_faltas,
    valorDivergencia: r.resumo.valor_total_divergencia
  }))

  const legadoRows = props.historico.map(h => ({
    _tipo: 'legado' as const,
    _original: null,
    ciclo: 0,
    dataFormatada: formatDate(h.data),
    motivo: h.motivo,
    statusLabel: 'Legado',
    badgeClass: '',
    dotClass: '',
    contados: 0,
    sobras: h.total_sobras,
    faltas: h.total_faltas,
    valorDivergencia: h.valor_total_divergencia
  }))

  return [...resultadoRows, ...legadoRows]
})

const historicoPage = ref(1)
const historicoPageSize = ref(10)

const paginatedHistorico = computed(() => {
  const start = (historicoPage.value - 1) * historicoPageSize.value
  return allHistoricoRows.value.slice(start, start + historicoPageSize.value)
})

// Reset page when data changes
watch([() => props.resultados, () => props.historico], () => {
  historicoPage.value = 1
})

const onHistoricoRowClick = (row: any) => {
  if (row._tipo === 'resultado' && row._original) {
    abrirSlideover(row._original)
  }
}

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

// ==========================================
// ÚLTIMA E PRÓXIMA CONTAGEM
// ==========================================
const ultimaContagemLabel = computed(() => {
  if (props.contagem.ultima_contagem) {
    const d = new Date(props.contagem.ultima_contagem)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return 'Nenhuma'
})

const diasSemanaMap: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 }

const formatProximaData = (date: Date): string => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const hora = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 0) return `Hoje, ${hora}`
  if (diffDays === 1) return `Amanhã, ${hora}`
  const diaSemana = date.toLocaleDateString('pt-BR', { weekday: 'short' })
  if (diffDays < 7) return `${diaSemana}, ${hora}`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + `, ${hora}`
}

const proximaContagemLabel = computed(() => {
  const c = props.contagem
  const rec = c.recorrencia
  if (!rec || rec === 'nenhuma') return '—'

  const now = new Date()
  const [hh, mm] = (c.horario_notificacao || '07:00').split(':').map(Number)

  if (rec === 'diaria') {
    const next = new Date()
    next.setHours(hh, mm, 0, 0)
    if (now > next) next.setDate(next.getDate() + 1)
    return formatProximaData(next)
  }

  if (rec === 'semanal' || rec === 'quinzenal') {
    const dias = c.dias_semana || []
    if (dias.length === 0) return '—'
    let minDiff = Infinity
    const todayDay = now.getDay()
    for (const d of dias) {
      const target = diasSemanaMap[d]
      if (target === undefined) continue
      let diff = target - todayDay
      if (diff < 0) diff += 7
      if (diff === 0) {
        const t = new Date()
        t.setHours(hh, mm, 0, 0)
        if (now > t) diff = 7
      }
      if (diff < minDiff) minDiff = diff
    }
    if (minDiff === Infinity) return '—'
    const next = new Date(now)
    next.setDate(next.getDate() + minDiff)
    next.setHours(hh, mm, 0, 0)
    return formatProximaData(next)
  }

  if (rec === 'mensal') {
    const posLabel = c.mensal_posicao === 'ultima' ? 'Últ.' : '1ª'
    const diaLabels: Record<string, string> = {
      domingo: 'dom.', segunda: 'seg.', terca: 'ter.', quarta: 'qua.',
      quinta: 'qui.', sexta: 'sex.', sabado: 'sáb.', dia: 'dia do mês'
    }
    return `${posLabel} ${diaLabels[c.mensal_dia || ''] || c.mensal_dia || ''}`
  }

  return '—'
})

const statusDotClasses: Record<string, string> = {
  pendente: 'bg-yellow-400', atrasada: 'bg-red-500',
  em_andamento: 'bg-blue-500', finalizada: 'bg-emerald-500'
}
const statusProximaTextClasses: Record<string, string> = {
  pendente: 'text-yellow-600', atrasada: 'text-red-600',
  em_andamento: 'text-blue-600', finalizada: 'text-emerald-600'
}

const proximaStatusDot = computed(() => statusDotClasses[props.contagem.status || ''] || '')
const proximaTextClass = computed(() => {
  const configured = props.contagem.recorrencia && props.contagem.recorrencia !== 'nenhuma'
  return configured
    ? (statusProximaTextClasses[props.contagem.status || ''] || 'text-operacao-500')
    : 'text-operacao-400'
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

const acuracidadeColor = (v: number) => {
  return v === 100 ? 'text-controle-600' : 'text-red-500'
}

const formatPercent = (v: number) => `${Math.round(v)}%`

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
