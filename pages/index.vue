<template>
  <div class="space-y-6">

    <!-- ======================== ROW 0: Header ======================== -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">{{ saudacao }}</h1>
        <p class="text-sm text-gray-500">{{ dataFormatada }}</p>
      </div>
    </div>

    <!-- ======================== ROW 1: KPI Cards ======================== -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div v-for="i in 5" :key="i" class="rounded-xl bg-white ring-1 ring-gray-100 shadow-sm p-5 space-y-3">
        <USkeleton class="h-4 w-24" />
        <USkeleton class="h-8 w-32" />
        <USkeleton class="h-5 w-full" />
      </div>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
          color="#2A6FF0"
          fill-color="rgba(42, 111, 240, 0.08)"
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
            { value: 25, color: '#F6A63A' },
            { value: 32, color: '#4CC17A' },
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
        <div v-if="currentGiro" class="w-full bg-gray-100 rounded-full h-2">
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
        :icon-bg-class="resumo.produtosAbaixoMinimo > 0 ? 'bg-alerta-50' : 'bg-green-50'"
        :icon-color-class="resumo.produtosAbaixoMinimo > 0 ? 'text-alerta-600 animate-pulse' : 'text-green-600'"
        :accent-gradient="resumo.produtosAbaixoMinimo > 0 ? 'bg-gradient-to-r from-alerta-400 to-alerta-600' : 'bg-gradient-to-r from-green-400 to-green-600'"
        :value-color-class="resumo.produtosAbaixoMinimo > 0 ? 'text-alerta-600' : 'text-green-600'"
        :secondary-text="`de ${resumo.totalProdutos} produtos`"
      >
        <div v-if="resumo.produtosAbaixoMinimo === 0" class="flex items-center gap-1.5">
          <UIcon name="i-heroicons-check-badge" class="w-4 h-4 text-green-500" />
          <span class="text-xs font-medium text-green-600">Tudo OK</span>
        </div>
      </DashboardKpiCard>

      <!-- KPI 5: Saldo do Mês -->
      <DashboardKpiCard
        label="Saldo do Mês"
        :display-value="formatCurrency(saldoMes)"
        icon="i-heroicons-scale"
        :icon-bg-class="saldoMes >= 0 ? 'bg-green-50' : 'bg-red-50'"
        :icon-color-class="saldoMes >= 0 ? 'text-green-600' : 'text-red-600'"
        :accent-gradient="saldoMes >= 0 ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-red-400 to-red-600'"
        :value-color-class="saldoMes >= 0 ? 'text-green-600' : 'text-red-600'"
      >
        <!-- Barras proporcionais -->
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-gray-400 w-12">Entradas</span>
            <div class="flex-1 bg-gray-100 rounded-full h-1.5">
              <div
                class="h-1.5 rounded-full bg-controle-500 transition-all duration-500"
                :style="{ width: saldoBarEntradas + '%' }"
              />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] text-gray-400 w-12">Saídas</span>
            <div class="flex-1 bg-gray-100 rounded-full h-1.5">
              <div
                class="h-1.5 rounded-full bg-red-500 transition-all duration-500"
                :style="{ width: saldoBarSaidas + '%' }"
              />
            </div>
          </div>
        </div>
      </DashboardKpiCard>
    </div>

    <!-- ======================== ROW 2: Charts Primários ======================== -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-7 rounded-xl bg-white ring-1 ring-gray-100 shadow-sm p-6 space-y-3">
        <USkeleton class="h-5 w-48" />
        <USkeleton class="h-64 w-full" />
      </div>
      <div class="lg:col-span-5 rounded-xl bg-white ring-1 ring-gray-100 shadow-sm p-6 space-y-3">
        <USkeleton class="h-5 w-40" />
        <USkeleton class="h-64 w-full rounded-full mx-auto" style="max-width: 200px" />
      </div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- CMV % Trend Line Chart -->
      <UCard class="lg:col-span-7" :ui="cardUi">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-gray-900">Evolução do CMV %</h3>
            <UBadge v-if="currentMonthCMV" :color="cmvBadgeColor" variant="soft" size="sm">
              {{ currentMonthCMV.percentual_cmv.toFixed(1) }}%
            </UBadge>
          </div>
        </template>
        <div class="h-[280px]">
          <ClientOnly>
            <Line v-if="cmvChartData.datasets[0].data.length > 0" :data="cmvChartData" :options="cmvChartOptions" />
            <div v-else class="flex items-center justify-center h-full text-sm text-gray-400">
              Sem dados de CMV para exibir
            </div>
          </ClientOnly>
        </div>
      </UCard>

      <!-- ABC Donut Chart -->
      <UCard class="lg:col-span-5" :ui="cardUi">
        <template #header>
          <h3 class="text-base font-semibold text-gray-900">Distribuição ABC</h3>
        </template>
        <div class="relative h-[280px]">
          <ClientOnly>
            <Doughnut v-if="abcData.length > 0" :data="abcChartData" :options="abcChartOptions" />
            <div v-else class="flex items-center justify-center h-full text-sm text-gray-400">
              Sem dados de curva ABC
            </div>
          </ClientOnly>
          <!-- Center text -->
          <div v-if="abcData.length > 0" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style="padding-bottom: 40px">
            <span class="text-[10px] text-gray-400 uppercase tracking-wide">Total</span>
            <span class="text-sm font-bold text-gray-900">{{ formatCurrencyCompact(abcTotal) }}</span>
          </div>
        </div>
      </UCard>
    </div>

    <!-- ======================== ROW 3: Charts Secundários ======================== -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="rounded-xl bg-white ring-1 ring-gray-100 shadow-sm p-6 space-y-3">
        <USkeleton class="h-5 w-48" />
        <USkeleton class="h-56 w-full" />
      </div>
      <div class="rounded-xl bg-white ring-1 ring-gray-100 shadow-sm p-6 space-y-3">
        <USkeleton class="h-5 w-32" />
        <USkeleton class="h-56 w-full" />
      </div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Entradas vs Saídas Bar Chart -->
      <UCard :ui="cardUi">
        <template #header>
          <h3 class="text-base font-semibold text-gray-900">Entradas vs Saídas</h3>
        </template>
        <div class="h-[260px]">
          <ClientOnly>
            <Bar v-if="movChartData.datasets[0].data.length > 0" :data="movChartData" :options="movChartOptions" />
            <div v-else class="flex items-center justify-center h-full text-sm text-gray-400">
              Sem dados de movimentação
            </div>
          </ClientOnly>
        </div>
      </UCard>

      <!-- Ações Rápidas -->
      <UCard :ui="cardUi">
        <template #header>
          <h3 class="text-base font-semibold text-gray-900">Ações Rápidas</h3>
        </template>

        <div class="space-y-4">
          <!-- CTAs Principais -->
          <div class="grid grid-cols-2 gap-3">
            <NuxtLink to="/movimentos/entradas">
              <UButton color="green" variant="soft" block size="lg" class="justify-center">
                <UIcon name="i-heroicons-plus-circle" class="w-5 h-5 mr-2" />
                Nova Entrada
              </UButton>
            </NuxtLink>
            <NuxtLink to="/movimentos/saidas">
              <UButton color="red" variant="soft" block size="lg" class="justify-center">
                <UIcon name="i-heroicons-minus-circle" class="w-5 h-5 mr-2" />
                Nova Saída
              </UButton>
            </NuxtLink>
          </div>

          <!-- Links compactos -->
          <div class="grid grid-cols-2 gap-2">
            <NuxtLink
              v-for="link in quickLinks"
              :key="link.to"
              :to="link.to"
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-colors duration-150"
            >
              <div class="p-1.5 rounded-md" :class="link.iconBg">
                <UIcon :name="link.icon" class="w-4 h-4" :class="link.iconColor" />
              </div>
              <span class="text-sm font-medium text-gray-700">{{ link.label }}</span>
            </NuxtLink>
          </div>

          <!-- Movimentação resumida -->
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-calendar" class="w-4 h-4 text-gray-400" />
              <span class="text-xs text-gray-500">{{ mesAtual }}</span>
            </div>
            <div class="flex items-center gap-4 text-xs">
              <span class="text-controle-600 font-medium">{{ formatCurrencyCompact(resumo.totalEntradasMes) }} ent.</span>
              <span class="text-red-500 font-medium">{{ formatCurrencyCompact(resumo.totalSaidasMes) }} saí.</span>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- ======================== ROW 4: Tabela de Alertas ======================== -->
    <UCard v-if="!loading && lowStockWithDays.length > 0" :ui="cardUi">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="relative">
              <div class="p-2 bg-alerta-50 rounded-lg">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-alerta-600" />
              </div>
              <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900">Alertas de Reposição</h3>
              <p class="text-xs text-gray-500">Produtos que precisam de compra urgente</p>
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
            <tr class="border-b border-gray-100">
              <th class="text-left py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-8"></th>
              <th class="text-left py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Subgrupo</th>
              <th class="text-left py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Produto</th>
              <th class="text-left py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estoque Atual</th>
              <th class="text-left py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Pt. Reposição</th>
              <th class="text-left py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Dias até Ruptura</th>
              <th class="text-left py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Prev. Compras</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in lowStockWithDays"
              :key="row.produto_id"
              class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
            >
              <!-- Severity indicator -->
              <td class="py-2.5 px-3">
                <div
                  class="w-1.5 h-8 rounded-full"
                  :class="getSeverityColor(row.diasRuptura)"
                />
              </td>
              <!-- Subgrupo -->
              <td class="py-2.5 px-3 text-gray-600">{{ row.subgrupo }}</td>
              <!-- Produto -->
              <td class="py-2.5 px-3 font-medium text-gray-900">{{ row.nome }}</td>
              <!-- Estoque Atual com progress bar -->
              <td class="py-2.5 px-3">
                <div class="space-y-1">
                  <span class="font-medium" :class="row.quantidade_estoque === 0 ? 'text-red-600' : 'text-alerta-600'">
                    {{ formatNumber(row.quantidade_estoque) }} {{ row.unidade }}
                  </span>
                  <div class="w-full bg-gray-100 rounded-full h-1">
                    <div
                      class="h-1 rounded-full transition-all"
                      :class="getStockBarColor(row)"
                      :style="{ width: getStockPercentage(row) + '%' }"
                    />
                  </div>
                </div>
              </td>
              <!-- Ponto Reposição -->
              <td class="py-2.5 px-3 text-gray-600">
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
                <span v-else class="text-gray-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Empty state: Tudo OK -->
    <div v-if="!loading && lowStockWithDays.length === 0 && resumo.totalProdutos > 0" class="rounded-xl bg-green-50 ring-1 ring-green-100 p-6 flex items-center gap-4">
      <div class="p-3 bg-green-100 rounded-lg">
        <UIcon name="i-heroicons-check-badge" class="w-6 h-6 text-green-600" />
      </div>
      <div>
        <h3 class="text-sm font-semibold text-green-800">Estoque saudável</h3>
        <p class="text-xs text-green-600">Nenhum produto abaixo do ponto de reposição.</p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { Line, Doughnut, Bar } from 'vue-chartjs'

const {
  loading, resumo, cmvData, abcData, abcTotal,
  currentMonthCMV, previousMonthCMV, cmvMesesComDados,
  currentGiro, previousGiro,
  lowStockWithDays, estoqueSparkline, saldoMes
} = useDashboardData()

const user = useSupabaseUser()

// ======================== FORMATAÇÃO ========================

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

const formatCurrencyCompact = (value: number) => {
  if (value >= 1000000) return 'R$ ' + (value / 1000000).toFixed(1) + 'M'
  if (value >= 1000) return 'R$ ' + (value / 1000).toFixed(1) + 'k'
  return formatCurrency(value)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value || 0)
}

// ======================== HEADER ========================

const saudacao = computed(() => {
  const hora = new Date().getHours()
  const nome = user.value?.user_metadata?.full_name?.split(' ')[0] || ''
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
  if (!currentMonthCMV.value) return 'text-gray-900'
  const pct = currentMonthCMV.value.percentual_cmv
  if (pct === 0) return 'text-gray-400'
  if (pct <= 25) return 'text-alerta-600'
  if (pct <= 32) return 'text-controle-600'
  return 'text-red-600'
})

const cmvIconBg = computed(() => {
  if (!currentMonthCMV.value) return 'bg-gray-100'
  const pct = currentMonthCMV.value.percentual_cmv
  if (pct <= 25) return 'bg-alerta-50'
  if (pct <= 32) return 'bg-green-50'
  return 'bg-red-50'
})

const cmvIconColor = computed(() => {
  if (!currentMonthCMV.value) return 'text-gray-400'
  const pct = currentMonthCMV.value.percentual_cmv
  if (pct <= 25) return 'text-alerta-600'
  if (pct <= 32) return 'text-green-600'
  return 'text-red-600'
})

const cmvAccentGradient = computed(() => {
  if (!currentMonthCMV.value) return 'bg-gray-300'
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
  if (!currentGiro.value) return 'text-gray-900'
  const dias = currentGiro.value.giro_dias_real
  if (dias === 0) return 'text-gray-400'
  if (dias <= 7) return 'text-controle-600'
  if (dias <= 10) return 'text-alerta-600'
  return 'text-red-600'
})

const giroIconBg = computed(() => {
  if (!currentGiro.value) return 'bg-gray-100'
  const dias = currentGiro.value.giro_dias_real
  if (dias <= 7) return 'bg-green-50'
  if (dias <= 10) return 'bg-alerta-50'
  return 'bg-red-50'
})

const giroIconColor = computed(() => {
  if (!currentGiro.value) return 'text-gray-400'
  const dias = currentGiro.value.giro_dias_real
  if (dias <= 7) return 'text-green-600'
  if (dias <= 10) return 'text-alerta-600'
  return 'text-red-600'
})

const giroAccentGradient = computed(() => {
  if (!currentGiro.value) return 'bg-gray-300'
  const dias = currentGiro.value.giro_dias_real
  if (dias <= 7) return 'bg-gradient-to-r from-green-400 to-green-600'
  if (dias <= 10) return 'bg-gradient-to-r from-alerta-400 to-alerta-600'
  return 'bg-gradient-to-r from-red-400 to-red-600'
})

const giroBarColor = computed(() => {
  if (!currentGiro.value) return 'bg-gray-300'
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

// ======================== KPI: SALDO BARRAS ========================

const saldoBarEntradas = computed(() => {
  const total = resumo.value.totalEntradasMes + resumo.value.totalSaidasMes
  if (total === 0) return 0
  return (resumo.value.totalEntradasMes / total) * 100
})

const saldoBarSaidas = computed(() => {
  const total = resumo.value.totalEntradasMes + resumo.value.totalSaidasMes
  if (total === 0) return 0
  return (resumo.value.totalSaidasMes / total) * 100
})

// ======================== QUICK LINKS ========================

const quickLinks = [
  { to: '/relatorios/painel-mes', label: 'Painel de Controle', icon: 'i-heroicons-document-chart-bar', iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
  { to: '/relatorios/curva-abc', label: 'Curva ABC', icon: 'i-heroicons-chart-bar', iconBg: 'bg-alerta-50', iconColor: 'text-alerta-600' },
  { to: '/relatorios/estoque-minimo', label: 'Planej. Compras', icon: 'i-heroicons-clipboard-document-list', iconBg: 'bg-guardian-50', iconColor: 'text-guardian-600' },
  { to: '/relatorios/cmv', label: 'CMV', icon: 'i-heroicons-calculator', iconBg: 'bg-red-50', iconColor: 'text-red-600' }
]

// ======================== CARD UI ========================

const cardUi = {
  base: 'overflow-hidden',
  background: 'bg-white',
  shadow: 'shadow-sm',
  body: { padding: 'px-5 py-5 sm:p-6' },
  ring: 'ring-1 ring-gray-100',
  rounded: 'rounded-xl',
  header: { padding: 'px-5 py-4 sm:px-6', base: 'border-b border-gray-50' }
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
        borderColor: '#2A6FF0',
        backgroundColor: 'rgba(42, 111, 240, 0.06)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2A6FF0',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
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
        borderColor: 'rgba(246, 166, 58, 0.25)',
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
    legend: { display: false },
    tooltip: {
      backgroundColor: '#18181B',
      titleFont: { size: 13, weight: '600' as const },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: any) => {
          if (ctx.datasetIndex !== 0) return ''
          return `CMV: ${ctx.parsed.y.toFixed(1)}%`
        },
        afterLabel: (ctx: any) => {
          if (ctx.datasetIndex !== 0) return ''
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
      backgroundColor: ['#4CC17A', '#F6A63A', '#71717A'],
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
      backgroundColor: '#18181B',
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
        backgroundColor: 'rgba(76, 193, 122, 0.8)',
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
      backgroundColor: '#18181B',
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
