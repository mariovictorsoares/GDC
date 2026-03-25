<template>
  <div class="space-y-6">

    <!-- ======================== ROW 0: Header ======================== -->
    <div class="flex items-center justify-between pb-2">
      <h1 class="text-2xl font-semibold text-[#5a5a66] pb-4">{{ saudacao }}</h1>
    </div>

    <!-- ======================== ROW 1: KPI Cards ======================== -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <!-- KPI 1: Valor do Estoque -->
      <DashboardKpiCard
        label="Valor do Estoque"
        :display-value="formatCurrency(resumo.valorEstoque)"
        icon="i-heroicons-banknotes"
        icon-bg-class="bg-guardian-50"
        icon-color-class="text-guardian-600"
        accent-gradient="bg-gradient-to-r from-guardian-400 to-guardian-600"
        :trend-value="estoqueVariacao"
        secondary-text="Valor total em estoque"
      >
        <SparkLine
          v-if="estoqueSparkline.length >= 2"
          :data="estoqueSparkline"
          color="#0E63B6"
          fill-color="rgba(14, 99, 182, 0.08)"
          :width="120"
          :height="28"
        />
      </DashboardKpiCard>

      <!-- KPI 2: CMV % do Mês -->
      <DashboardKpiCard
        label="CMV do Mês"
        :display-value="currentMonthCMV ? currentMonthCMV.percentual_cmv.toFixed(1) + '%' : '—'"
        icon="i-heroicons-chart-pie"
        :icon-bg-class="cmvIconBg"
        :icon-color-class="cmvIconColor"
        :accent-gradient="cmvAccentGradient"
        :value-color-class="cmvValueColor"
        :secondary-text="previousMonthCMV ? `Mês anterior: ${previousMonthCMV.percentual_cmv.toFixed(1)}%` : ''"
      >
        <MiniGauge
          v-if="currentMonthCMV"
          :value="currentMonthCMV.percentual_cmv"
          :min="0"
          :max="50"
          :size="80"
          :stroke-width="6"
          :thresholds="[
            { value: 25, color: '#D97706' },
            { value: 32, color: '#0D9668' },
            { value: 50, color: '#EF4444' }
          ]"
        />
      </DashboardKpiCard>

      <!-- KPI 3: Giro de Estoque -->
      <DashboardKpiCard
        label="Giro de Estoque"
        :display-value="currentGiro ? currentGiro.giro_dias_real.toFixed(1) + ' dias' : '—'"
        icon="i-heroicons-arrow-path"
        :icon-bg-class="giroIconBg"
        :icon-color-class="giroIconColor"
        :accent-gradient="giroAccentGradient"
        :value-color-class="giroValueColor"
        :trend-value="giroVariacao"
        :secondary-text="previousGiro ? `Anterior: ${previousGiro.giro_dias_real.toFixed(1)} dias` : ''"
      >
        <!-- Barra de threshold visual -->
        <div v-if="currentGiro" class="w-full bg-operacao-100 rounded-full h-2">
          <div
            class="h-2 rounded-full transition-all duration-500"
            :class="giroBarColor"
            :style="{ width: Math.min((currentGiro.giro_dias_real / 15) * 100, 100) + '%' }"
          />
        </div>
      </DashboardKpiCard>

      <!-- KPI 4: Alertas de Estoque -->
      <DashboardKpiCard
        label="Alertas de Estoque"
        :display-value="String(resumo.produtosAbaixoMinimo)"
        :icon="resumo.produtosAbaixoMinimo > 0 ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-check-circle'"
        :icon-bg-class="resumo.produtosAbaixoMinimo > 0 ? 'bg-alerta-50' : 'bg-controle-50'"
        :icon-color-class="resumo.produtosAbaixoMinimo > 0 ? 'text-alerta-600 animate-pulse' : 'text-controle-600'"
        :accent-gradient="resumo.produtosAbaixoMinimo > 0 ? 'bg-gradient-to-r from-alerta-400 to-alerta-600' : 'bg-gradient-to-r from-controle-400 to-controle-600'"
        :value-color-class="resumo.produtosAbaixoMinimo > 0 ? 'text-alerta-600' : 'text-controle-600'"
        :secondary-text="`de ${resumo.totalProdutos} produtos`"
      >
        <div v-if="resumo.produtosAbaixoMinimo === 0" class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-check-badge" class="w-4 h-4 text-controle-500" />
          <span class="text-xs font-medium text-controle-600">Tudo OK</span>
        </div>
      </DashboardKpiCard>

      <!-- KPI 5: CMV Consumo -->
      <DashboardKpiCard
        label="CMV Consumo"
        :display-value="formatCurrency(currentMonthCMV?.cmv ?? 0)"
        icon="i-heroicons-fire"
        :icon-bg-class="cmvConsumoTrend !== null && cmvConsumoTrend < 0 ? 'bg-controle-50' : 'bg-red-50'"
        :icon-color-class="cmvConsumoTrend !== null && cmvConsumoTrend < 0 ? 'text-controle-600' : 'text-red-500'"
        :accent-gradient="cmvConsumoTrend !== null && cmvConsumoTrend < 0 ? 'bg-gradient-to-r from-controle-400 to-controle-600' : 'bg-gradient-to-r from-red-400 to-red-500'"
        :trend-value="cmvConsumoTrend"
        :secondary-text="currentMonthCMV ? currentMonthCMV.percentual_cmv.toFixed(1) + '% do faturamento' : ''"
      >
        <SparkLine
          v-if="cmvConsumoSparkline.length >= 2"
          :data="cmvConsumoSparkline"
          :color="cmvConsumoTrend !== null && cmvConsumoTrend < 0 ? '#0D9668' : '#EF4444'"
          :fill-color="cmvConsumoTrend !== null && cmvConsumoTrend < 0 ? 'rgba(13, 150, 104, 0.08)' : 'rgba(239, 68, 68, 0.08)'"
          :width="120"
          :height="28"
        />
      </DashboardKpiCard>
    </div>

    <!-- ======================== ROW 2: Charts Primários ======================== -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- CMV % Trend Line Chart -->
      <UCard class="lg:col-span-7" :ui="cardUi">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-operacao-800">Evolução CMV % × CMC %</h3>
            <UBadge v-if="currentMonthCMV" :color="cmvBadgeColor" variant="soft" size="sm">
              {{ currentMonthCMV.percentual_cmv.toFixed(1) }}%
            </UBadge>
          </div>
        </template>
        <div class="h-[280px]">
          <ClientOnly>
            <Line v-if="cmvChartData.datasets[0].data.length > 0" :data="cmvChartData" :options="cmvChartOptions" />
            <div v-else class="flex items-center justify-center h-full text-sm text-operacao-400">
              Sem dados de CMV para exibir
            </div>
          </ClientOnly>
        </div>
      </UCard>

      <!-- ABC Donut Chart -->
      <UCard class="lg:col-span-5" :ui="cardUi">
        <template #header>
          <h3 class="text-base font-semibold text-operacao-800">Curva ABC Estoque</h3>
        </template>
        <div class="relative h-[280px]">
          <ClientOnly>
            <Doughnut v-if="abcData.length > 0" :data="abcChartData" :options="abcChartOptions" />
            <div v-else class="flex items-center justify-center h-full text-sm text-operacao-400">
              Sem dados de curva ABC
            </div>
          </ClientOnly>
          <!-- Center text -->
          <div v-if="abcData.length > 0" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style="padding-bottom: 40px">
            <span class="text-[10px] text-operacao-400 uppercase tracking-wide">Total</span>
            <span class="text-sm font-bold text-operacao-800">{{ formatCurrency(abcTotal) }}</span>
          </div>
        </div>
      </UCard>
    </div>

    <!-- ======================== ROW 3: Charts Secundários ======================== -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Entradas vs Saídas Bar Chart -->
      <UCard :ui="cardUi">
        <template #header>
          <h3 class="text-base font-semibold text-operacao-800">Entradas vs Saídas</h3>
        </template>
        <div class="h-[260px]">
          <ClientOnly>
            <Bar v-if="movChartData.datasets[0].data.length > 0" :data="movChartData" :options="movChartOptions" />
            <div v-else class="flex items-center justify-center h-full text-sm text-operacao-400">
              Sem dados de movimentação
            </div>
          </ClientOnly>
        </div>
      </UCard>

      <!-- Top 10 Produtos com Mais Saídas -->
      <UCard :ui="cardUi">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="flex items-center justify-center p-1.5 bg-guardian-50 rounded-lg">
                <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4 text-guardian-600" />
              </div>
              <h3 class="text-base font-semibold text-operacao-800">Top 10 Produtos com Mais Saídas</h3>
            </div>
            <UBadge color="blue" variant="soft" size="sm">Este mês</UBadge>
          </div>
        </template>

        <div class="space-y-0.5">
          <div
            v-for="item in topSaidas"
            :key="item.rank"
            class="flex items-center gap-3 py-[7px] px-1.5 rounded-lg hover:bg-operacao-50/50 transition-colors"
          >
            <!-- Rank badge -->
            <div
              class="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold"
              :class="[
                item.rank === 1 ? 'bg-amber-100 text-amber-700' :
                item.rank === 2 ? 'bg-gray-200 text-gray-600' :
                item.rank === 3 ? 'bg-orange-100 text-orange-700' :
                'bg-operacao-50 text-operacao-400'
              ]"
            >
              {{ item.rank }}
            </div>
            <!-- Name + bar -->
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline justify-between gap-2 mb-0.5">
                <span class="text-[13px] font-medium text-operacao-700 truncate">{{ item.nome }}</span>
                <span class="text-[11px] text-operacao-400 flex-shrink-0 tabular-nums">
                  {{ formatNumber(item.qtd) }} {{ item.unidade }}
                </span>
              </div>
              <div class="w-full bg-operacao-50 rounded-full h-1">
                <div
                  class="h-1 rounded-full transition-all duration-700"
                  :class="item.rank <= 3 ? 'bg-gradient-to-r from-guardian-400 to-guardian-500' : 'bg-gradient-to-r from-guardian-300 to-guardian-400'"
                  :style="{ width: (item.valor / topSaidas[0].valor * 100) + '%' }"
                />
              </div>
            </div>
            <!-- Value -->
            <span
              class="text-[11px] font-semibold tabular-nums flex-shrink-0 w-[72px] text-right"
              :class="item.rank <= 3 ? 'text-operacao-700' : 'text-operacao-500'"
            >
              {{ formatCurrency(item.valor) }}
            </span>
          </div>
        </div>
      </UCard>
    </div>

    <!-- ======================== ROW 4: Tabela de Alertas ======================== -->
    <UCard v-if="lowStockWithDays.length > 0" :ui="cardUi">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="relative">
              <div class="flex items-center justify-center p-2 bg-alerta-50 rounded-lg">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-alerta-600" />
              </div>
              <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-operacao-800">Planejamento de Compras</h3>
              <p class="text-xs text-operacao-400">Produtos que precisam de reposição</p>
            </div>
          </div>
          <UBadge color="red" variant="soft" size="lg">
            {{ lowStockWithDays.length }} itens
          </UBadge>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-operacao-200/60">
              <th class="bg-operacao-100/70 text-left py-2.5 px-3 text-xs font-medium text-[#5a5a66] uppercase tracking-wider w-8"></th>
              <th class="bg-operacao-100/70 text-left py-2.5 px-3 text-xs font-medium text-[#5a5a66] uppercase tracking-wider">Subgrupo</th>
              <th class="bg-operacao-100/70 text-left py-2.5 px-3 text-xs font-medium text-[#5a5a66] uppercase tracking-wider">Produto</th>
              <th class="bg-operacao-100/70 text-left py-2.5 px-3 text-xs font-medium text-[#5a5a66] uppercase tracking-wider">Estoque Atual</th>
              <th class="bg-operacao-100/70 text-left py-2.5 px-3 text-xs font-medium text-[#5a5a66] uppercase tracking-wider">Pt. Reposição</th>
              <th class="bg-operacao-100/70 text-left py-2.5 px-3 text-xs font-medium text-[#5a5a66] uppercase tracking-wider">Dias até Ruptura</th>
              <th class="bg-operacao-100/70 text-left py-2.5 px-3 text-xs font-medium text-[#5a5a66] uppercase tracking-wider">Prev. Compras</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in lowStockWithDays"
              :key="row.produto_id"
              class="border-b border-operacao-50 hover:bg-operacao-50/50 transition-colors"
            >
              <!-- Severity indicator -->
              <td class="py-2.5 px-3">
                <div
                  class="w-1.5 h-8 rounded-full"
                  :class="getSeverityColor(row.diasRuptura)"
                />
              </td>
              <!-- Subgrupo -->
              <td class="py-2.5 px-3 text-operacao-500">{{ row.subgrupo }}</td>
              <!-- Produto -->
              <td class="py-2.5 px-3 font-medium text-operacao-800">{{ row.nome }}</td>
              <!-- Estoque Atual com progress bar -->
              <td class="py-2.5 px-3">
                <div class="space-y-1">
                  <span class="font-medium" :class="row.quantidade_estoque === 0 ? 'text-red-600' : 'text-alerta-600'">
                    {{ formatNumber(row.quantidade_estoque) }} {{ row.unidade }}
                  </span>
                  <div class="w-full bg-operacao-100 rounded-full h-1">
                    <div
                      class="h-1 rounded-full transition-all"
                      :class="getStockBarColor(row)"
                      :style="{ width: getStockPercentage(row) + '%' }"
                    />
                  </div>
                </div>
              </td>
              <!-- Ponto Reposição -->
              <td class="py-2.5 px-3 text-operacao-500">
                {{ formatNumber(row.pontoReposicao) }} {{ row.unidade }}
              </td>
              <!-- Dias até Ruptura -->
              <td class="py-2.5 px-3">
                <UBadge
                  :color="row.diasRuptura <= 3 ? 'red' : row.diasRuptura <= 7 ? 'yellow' : 'gray'"
                  variant="soft"
                  size="sm"
                >
                  {{ row.diasRuptura >= 999 ? '—' : row.diasRuptura + ' dias' }}
                </UBadge>
              </td>
              <!-- Previsão Compras -->
              <td class="py-2.5 px-3">
                <UBadge v-if="row.previsaoCompras > 0" color="yellow" variant="soft" size="sm">
                  Pedir: {{ formatNumber(row.previsaoCompras) }} {{ row.unidade }}
                </UBadge>
                <span v-else class="text-operacao-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Empty state: Tudo OK -->
    <div v-if="lowStockWithDays.length === 0 && resumo.totalProdutos > 0" class="rounded-xl bg-controle-50 ring-1 ring-controle-100 p-6 flex items-center gap-4">
      <div class="p-3 bg-controle-100 rounded-lg flex items-center justify-center">
        <UIcon name="i-heroicons-check-badge" class="w-6 h-6 text-controle-600" />
      </div>
      <div>
        <h3 class="text-sm font-semibold text-controle-800">Estoque saudável</h3>
        <p class="text-xs text-controle-600">Nenhum produto abaixo do ponto de reposição.</p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { Line, Doughnut, Bar } from 'vue-chartjs'

// TODO: Remover mock data e descomentar para usar dados reais
// const { loading, resumo, cmvData, abcData, abcTotal, currentMonthCMV, previousMonthCMV, cmvMesesComDados, currentGiro, previousGiro, lowStockWithDays, estoqueSparkline, saldoMes } = useDashboardData()

// ======================== MOCK DATA ========================

const loading = ref(false)

const resumo = ref({
  totalProdutos: 186,
  valorEstoque: 47850,
  produtosAbaixoMinimo: 4,
  totalEntradasMes: 38420,
  totalSaidasMes: 32415,
})

const currentMonthCMV = ref({
  ano: 2026, mes: 3, percentual_cmv: 28.5, cmv: 32415,
  faturamento: 113750, estoque_inicial: 45800, compras: 38420, estoque_final: 47850,
})

const previousMonthCMV = ref({
  ano: 2026, mes: 2, percentual_cmv: 29.4, cmv: 33800,
  faturamento: 114900, estoque_inicial: 44100, compras: 36500, estoque_final: 45800,
})

const cmvMesesComDados = ref([
  { mes: 4, percentual_cmv: 31.2, compras: 35200, cmv: 29800 },
  { mes: 5, percentual_cmv: 29.8, compras: 33100, cmv: 28500 },
  { mes: 6, percentual_cmv: 33.5, compras: 38400, cmv: 34200 },
  { mes: 7, percentual_cmv: 30.1, compras: 34800, cmv: 30100 },
  { mes: 8, percentual_cmv: 28.7, compras: 32200, cmv: 28700 },
  { mes: 9, percentual_cmv: 27.2, compras: 31500, cmv: 27200 },
  { mes: 10, percentual_cmv: 29.5, compras: 34100, cmv: 29500 },
  { mes: 11, percentual_cmv: 28.1, compras: 33200, cmv: 28100 },
  { mes: 12, percentual_cmv: 26.8, compras: 31800, cmv: 26800 },
  { mes: 1, percentual_cmv: 28.5, compras: 33500, cmv: 28500 },
  { mes: 2, percentual_cmv: 29.4, compras: 36500, cmv: 33800 },
  { mes: 3, percentual_cmv: 28.5, compras: 38420, cmv: 32415 },
])

const mockCmcMensal = [33.0, 31.8, 35.4, 32.3, 30.9, 29.5, 31.8, 30.1, 29.0, 30.7, 31.2, 30.8]

const currentGiro = ref({ giro_dias_real: 6.2 } as any)
const previousGiro = ref({ giro_dias_real: 7.8 } as any)

const abcData = ref([
  { classe: 'A', valor: 28900, produto_id: '', produto: '', categoria: '', quantidade: 0, percentual_valor: 0, percentual_acumulado: 0 },
  { classe: 'B', valor: 12400, produto_id: '', produto: '', categoria: '', quantidade: 0, percentual_valor: 0, percentual_acumulado: 0 },
  { classe: 'C', valor: 6550, produto_id: '', produto: '', categoria: '', quantidade: 0, percentual_valor: 0, percentual_acumulado: 0 },
] as any[])

const abcTotal = ref(47850)
const estoqueSparkline = ref([42300, 44100, 43200, 45800, 46200, 47850])
const saldoMes = ref(6005)

const cmvConsumoSparkline = ref([34200, 35100, 33500, 34800, 33800, 32415])

const topSaidas = [
  { rank: 1, nome: 'Picanha', qtd: 98, unidade: 'kg', valor: 8820 },
  { rank: 2, nome: 'Contra Filé', qtd: 145, unidade: 'kg', valor: 7250 },
  { rank: 3, nome: 'Cerveja Pilsen 600ml', qtd: 832, unidade: 'un', valor: 5824 },
  { rank: 4, nome: 'Camarão Rosa', qtd: 42, unidade: 'kg', valor: 5460 },
  { rank: 5, nome: 'Salmão Fresco', qtd: 35, unidade: 'kg', valor: 4200 },
  { rank: 6, nome: 'Coca-Cola 2L', qtd: 285, unidade: 'un', valor: 2565 },
  { rank: 7, nome: 'Queijo Mussarela', qtd: 68, unidade: 'kg', valor: 2380 },
  { rank: 8, nome: 'Batata Inglesa', qtd: 180, unidade: 'kg', valor: 1260 },
  { rank: 9, nome: 'Arroz Tipo 1', qtd: 120, unidade: 'kg', valor: 960 },
  { rank: 10, nome: 'Óleo de Soja', qtd: 85, unidade: 'L', valor: 765 },
]

const lowStockWithDays = ref([
  { produto_id: '1', subgrupo: 'Bebidas', nome: 'Cerveja Pilsen 600ml', unidade: 'un', quantidade_estoque: 48, pontoReposicao: 150, diasRuptura: 1, previsaoCompras: 200, media_semanas: 33.2 },
  { produto_id: '2', subgrupo: 'Carnes', nome: 'Contra Filé', unidade: 'kg', quantidade_estoque: 12, pontoReposicao: 30, diasRuptura: 2, previsaoCompras: 45, media_semanas: 5.8 },
  { produto_id: '3', subgrupo: 'Carnes', nome: 'Picanha', unidade: 'kg', quantidade_estoque: 8, pontoReposicao: 20, diasRuptura: 3, previsaoCompras: 30, media_semanas: 3.9 },
  { produto_id: '4', subgrupo: 'Frutos do Mar', nome: 'Camarão Rosa', unidade: 'kg', quantidade_estoque: 5, pontoReposicao: 12, diasRuptura: 4, previsaoCompras: 15, media_semanas: 1.7 },
  { produto_id: '5', subgrupo: 'Hortifruti', nome: 'Tomate', unidade: 'kg', quantidade_estoque: 15, pontoReposicao: 35, diasRuptura: 5, previsaoCompras: 40, media_semanas: 6.6 },
  { produto_id: '6', subgrupo: 'Laticínios', nome: 'Queijo Mussarela', unidade: 'kg', quantidade_estoque: 10, pontoReposicao: 22, diasRuptura: 6, previsaoCompras: 25, media_semanas: 2.7 },
] as any[])

const user = useSupabaseUser()

// ======================== FORMATAÇÃO ========================

const { formatCurrency, formatNumber } = useFormatters()

// ======================== HEADER ========================

const saudacao = computed(() => {
  const hora = new Date().getHours()
  const meta = user.value?.user_metadata
  const nome = (meta?.nome || meta?.name || meta?.full_name || '').split(' ')[0]
  if (hora < 12) return `Bom dia${nome ? ', ' + nome : ''}`
  if (hora < 18) return `Boa tarde${nome ? ', ' + nome : ''}`
  return `Boa noite${nome ? ', ' + nome : ''}`
})

const dataFormatada = computed(() => {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
})

const mesAtual = computed(() => {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

// ======================== KPI: ESTOQUE ========================

const estoqueVariacao = computed(() => {
  if (estoqueSparkline.value.length < 2) return null
  const data = estoqueSparkline.value
  const prev = data[data.length - 2]
  const curr = data[data.length - 1]
  if (prev === 0) return null
  return ((curr - prev) / prev) * 100
})

// ======================== KPI: CMV ========================

const cmvValueColor = computed(() => {
  if (!currentMonthCMV.value) return 'text-operacao-800'
  const pct = currentMonthCMV.value.percentual_cmv
  if (pct === 0) return 'text-operacao-400'
  if (pct <= 25) return 'text-alerta-600'
  if (pct <= 32) return 'text-controle-600'
  return 'text-red-600'
})

const cmvIconBg = computed(() => {
  if (!currentMonthCMV.value) return 'bg-operacao-100'
  const pct = currentMonthCMV.value.percentual_cmv
  if (pct <= 25) return 'bg-alerta-50'
  if (pct <= 32) return 'bg-controle-50'
  return 'bg-red-50'
})

const cmvIconColor = computed(() => {
  if (!currentMonthCMV.value) return 'text-operacao-400'
  const pct = currentMonthCMV.value.percentual_cmv
  if (pct <= 25) return 'text-alerta-600'
  if (pct <= 32) return 'text-controle-600'
  return 'text-red-600'
})

const cmvAccentGradient = computed(() => {
  if (!currentMonthCMV.value) return 'bg-operacao-300'
  const pct = currentMonthCMV.value.percentual_cmv
  if (pct <= 25) return 'bg-gradient-to-r from-alerta-400 to-alerta-600'
  if (pct <= 32) return 'bg-gradient-to-r from-controle-400 to-controle-600'
  return 'bg-gradient-to-r from-red-400 to-red-600'
})

const cmvBadgeColor = computed(() => {
  if (!currentMonthCMV.value) return 'gray'
  const pct = currentMonthCMV.value.percentual_cmv
  if (pct <= 25) return 'yellow'
  if (pct <= 32) return 'green'
  return 'red'
})

// ======================== KPI: GIRO ========================

const giroValueColor = computed(() => {
  if (!currentGiro.value) return 'text-operacao-800'
  const dias = currentGiro.value.giro_dias_real
  if (dias === 0) return 'text-operacao-400'
  if (dias <= 7) return 'text-controle-600'
  if (dias <= 10) return 'text-alerta-600'
  return 'text-red-600'
})

const giroIconBg = computed(() => {
  if (!currentGiro.value) return 'bg-operacao-100'
  const dias = currentGiro.value.giro_dias_real
  if (dias <= 7) return 'bg-controle-50'
  if (dias <= 10) return 'bg-alerta-50'
  return 'bg-red-50'
})

const giroIconColor = computed(() => {
  if (!currentGiro.value) return 'text-operacao-400'
  const dias = currentGiro.value.giro_dias_real
  if (dias <= 7) return 'text-controle-600'
  if (dias <= 10) return 'text-alerta-600'
  return 'text-red-600'
})

const giroAccentGradient = computed(() => {
  if (!currentGiro.value) return 'bg-operacao-300'
  const dias = currentGiro.value.giro_dias_real
  if (dias <= 7) return 'bg-gradient-to-r from-controle-400 to-controle-600'
  if (dias <= 10) return 'bg-gradient-to-r from-alerta-400 to-alerta-600'
  return 'bg-gradient-to-r from-red-400 to-red-600'
})

const giroBarColor = computed(() => {
  if (!currentGiro.value) return 'bg-operacao-300'
  const dias = currentGiro.value.giro_dias_real
  if (dias <= 7) return 'bg-controle-500'
  if (dias <= 10) return 'bg-alerta-500'
  return 'bg-red-500'
})

const giroVariacao = computed(() => {
  if (!currentGiro.value || !previousGiro.value) return null
  const prev = previousGiro.value.giro_dias_real
  const curr = currentGiro.value.giro_dias_real
  if (prev === 0) return null
  return ((curr - prev) / prev) * 100
})

// ======================== KPI: CMV CONSUMO ========================

const cmvConsumoTrend = computed(() => {
  if (!currentMonthCMV.value || !previousMonthCMV.value) return null
  const curr = currentMonthCMV.value.cmv
  const prev = previousMonthCMV.value.cmv
  if (prev === 0) return null
  return ((curr - prev) / prev) * 100
})

// ======================== CARD UI ========================

const cardUi = {
  base: 'overflow-hidden',
  background: 'bg-white',
  shadow: 'shadow-sm',
  body: { padding: 'px-5 py-5 sm:p-6' },
  ring: 'ring-1 ring-[#EBEBED]',
  rounded: 'rounded-xl',
  header: { padding: 'px-5 py-4 sm:px-6', base: 'border-b border-operacao-50' }
}

// ======================== CHARTS: CMV TREND ========================

const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const cmvChartData = computed(() => {
  const meses = cmvMesesComDados.value
  return {
    labels: meses.map(m => mesesAbrev[m.mes - 1]),
    datasets: [
      {
        label: 'CMV %',
        data: meses.map(m => m.percentual_cmv),
        borderColor: '#0E63B6',
        backgroundColor: 'rgba(14, 99, 182, 0.06)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0E63B6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'CMC %',
        data: mockCmcMensal,
        borderColor: '#0D9668',
        backgroundColor: 'rgba(13, 150, 104, 0.04)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0D9668',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Limite Aceitável (32%)',
        data: meses.map(() => 32),
        borderColor: 'rgba(239, 68, 68, 0.25)',
        borderDash: [6, 4],
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'Limite Atenção (25%)',
        data: meses.map(() => 25),
        borderColor: 'rgba(217, 119, 6, 0.25)',
        borderDash: [6, 4],
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
      }
    ]
  }
})

const cmvChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      align: 'end' as const,
      labels: {
        usePointStyle: true,
        pointStyle: 'circle' as const,
        padding: 16,
        font: { size: 11 },
        filter: (item: any) => !item.text.includes('Limite')
      }
    },
    tooltip: {
      backgroundColor: '#1C1C1C',
      titleFont: { size: 13, weight: '600' as const },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: any) => {
          if (ctx.datasetIndex === 0) return `CMV: ${ctx.parsed.y.toFixed(1)}%`
          if (ctx.datasetIndex === 1) return `CMC: ${ctx.parsed.y.toFixed(1)}%`
          return ''
        },
        afterLabel: (ctx: any) => {
          if (ctx.datasetIndex > 1) return ''
          const val = ctx.parsed.y
          if (val <= 25) return 'Atenção'
          if (val <= 32) return 'Aceitável'
          return 'Perigo'
        }
      }
    }
  },
  scales: {
    y: {
      min: 0,
      max: 50,
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: { callback: (val: any) => `${val}%`, font: { size: 11 } }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 } }
    }
  }
}

// ======================== CHARTS: ABC DONUT ========================

const abcChartData = computed(() => {
  const summary = { A: 0, B: 0, C: 0 }
  abcData.value.forEach(item => { summary[item.classe] += item.valor })
  return {
    labels: ['Classe A', 'Classe B', 'Classe C'],
    datasets: [{
      data: [summary.A, summary.B, summary.C],
      backgroundColor: ['#0D9668', '#D97706', '#8E8E9A'],
      borderColor: '#ffffff',
      borderWidth: 3,
      hoverOffset: 8,
    }]
  }
})

const abcChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        pointStyle: 'circle' as const,
        padding: 16,
        font: { size: 12 }
      }
    },
    tooltip: {
      backgroundColor: '#1C1C1C',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: any) => {
          const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const pct = ((ctx.parsed / total) * 100).toFixed(1)
          return `${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`
        }
      }
    }
  }
}

// ======================== CHARTS: ENTRADAS VS SAÍDAS BAR ========================

const movChartData = computed(() => {
  const meses = cmvMesesComDados.value.slice(-6)
  return {
    labels: meses.map(m => mesesAbrev[m.mes - 1]),
    datasets: [
      {
        label: 'Entradas',
        data: meses.map(m => m.compras),
        backgroundColor: 'rgba(13, 150, 104, 0.8)',
        borderRadius: 6,
        barPercentage: 0.7,
      },
      {
        label: 'Saídas (CMV)',
        data: meses.map(m => m.cmv),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 6,
        barPercentage: 0.7,
      }
    ]
  }
})

const movChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      align: 'end' as const,
      labels: {
        usePointStyle: true,
        pointStyle: 'circle' as const,
        padding: 16,
        font: { size: 11 }
      }
    },
    tooltip: {
      backgroundColor: '#1C1C1C',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: any) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
      }
    }
  },
  scales: {
    y: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: {
        callback: (val: any) => {
          if (val >= 1000) return 'R$ ' + (val / 1000).toFixed(0) + 'k'
          return 'R$ ' + val
        },
        font: { size: 11 }
      }
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 } }
    }
  }
}

// ======================== TABELA: HELPERS ========================

const getSeverityColor = (diasRuptura: number) => {
  if (diasRuptura <= 3) return 'bg-red-500'
  if (diasRuptura <= 7) return 'bg-alerta-500'
  return 'bg-yellow-400'
}

const getStockBarColor = (row: any) => {
  if (row.quantidade_estoque === 0) return 'bg-red-500'
  if (row.diasRuptura <= 3) return 'bg-red-400'
  if (row.diasRuptura <= 7) return 'bg-alerta-400'
  return 'bg-yellow-400'
}

const getStockPercentage = (row: any) => {
  if (row.pontoReposicao === 0) return 0
  return Math.min((row.quantidade_estoque / row.pontoReposicao) * 100, 100)
}
</script>
