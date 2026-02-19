<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Planejamento de Compras</h1>
        <p class="text-sm text-gray-500">Ponto de reposição, CMC semanal e variação de custo</p>
      </div>
      <UButton color="primary" @click="loadData" :loading="loading">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
        Atualizar
      </UButton>
    </div>

    <!-- Tabs -->
    <UCard>
      <UTabs v-model="activeTab" :items="tabItems" />
    </UCard>

    <!-- Tab: Ponto de Reposição -->
    <template v-if="activeTab === 0">

    <!-- Filtros -->
    <UCard>
      <div class="flex flex-wrap gap-4 items-end">
        <UFormGroup label="Buscar">
          <UInput
            v-model="search"
            placeholder="Buscar produto ou subgrupo..."
            icon="i-heroicons-magnifying-glass"
            class="w-64"
          />
        </UFormGroup>
      </div>
    </UCard>

    <!-- Tabela -->
    <UCard :ui="{ body: { padding: '' } }">
      <UTable
        :columns="columns"
        :rows="paginatedItems"
        :loading="loading"
        :ui="{ td: { base: '' } }"
      >
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-gray-500">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhum registro encontrado</p>
          </div>
        </template>

        <template #subgrupo-data="{ row }">
          <span class="text-sm text-gray-600">{{ row.subgrupo }}</span>
        </template>
        <template #nome-data="{ row }">
          <span class="font-medium">{{ row.nome }}</span>
        </template>
        <template #quantidade_estoque-data="{ row }">
          <span class="font-medium">{{ formatNumber(row.quantidade_estoque) }} {{ row.unidade }}</span>
        </template>
        <template #media_semanal-data="{ row }">
          <UPopover :popper="{ placement: 'bottom' }" mode="hover" :open-delay="150">
            <button class="flex items-center gap-1.5 cursor-default group">
              <span class="font-semibold text-gray-900">{{ formatNumber(row.media_semanas) }}</span>
              <span class="text-xs text-gray-500">{{ row.unidade }}</span>
              <UIcon name="i-heroicons-information-circle" class="w-3.5 h-3.5 text-gray-300 group-hover:text-guardian-500 transition-colors" />
            </button>

            <template #panel>
              <div class="w-72">
                <!-- Header -->
                <div class="flex items-center gap-2 px-4 pt-3 pb-2">
                  <div class="p-1.5 bg-green-100 rounded-md">
                    <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p class="text-sm font-semibold text-gray-900">{{ row.nome }}</p>
                    <p class="text-[10px] text-gray-400">Consumo semanal · saídas definitivas</p>
                  </div>
                </div>

                <!-- Tabela estilo painel -->
                <table class="w-full text-xs">
                  <thead>
                    <tr class="bg-green-50">
                      <th class="px-3 py-1.5 text-left font-medium text-green-600">Semana</th>
                      <th class="px-3 py-1.5 text-left font-medium text-green-600">Período</th>
                      <th class="px-3 py-1.5 text-right font-medium text-green-600">Consumo</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr class="hover:bg-gray-50">
                      <td class="px-3 py-2 text-gray-700 font-medium">S -3</td>
                      <td class="px-3 py-2 text-gray-400">{{ row.semana3_periodo }}</td>
                      <td class="px-3 py-2 text-right text-green-600 font-medium">{{ formatNumber(row.semana3) }} {{ row.unidade }}</td>
                    </tr>
                    <tr class="hover:bg-gray-50">
                      <td class="px-3 py-2 text-gray-700 font-medium">S -2</td>
                      <td class="px-3 py-2 text-gray-400">{{ row.semana2_periodo }}</td>
                      <td class="px-3 py-2 text-right text-green-600 font-medium">{{ formatNumber(row.semana2) }} {{ row.unidade }}</td>
                    </tr>
                    <tr class="hover:bg-gray-50">
                      <td class="px-3 py-2 text-gray-700 font-medium">S -1</td>
                      <td class="px-3 py-2 text-gray-400">{{ row.semana1_periodo }}</td>
                      <td class="px-3 py-2 text-right text-green-600 font-medium">{{ formatNumber(row.semana1) }} {{ row.unidade }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="bg-green-50/70 border-t border-green-200">
                      <td colspan="2" class="px-3 py-2 font-semibold text-gray-900">Média</td>
                      <td class="px-3 py-2 text-right font-bold text-green-700">{{ formatNumber(row.media_semanas) }} {{ row.unidade }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </template>
          </UPopover>
        </template>
        <template #estoque_seguranca-data="{ row }">
          <div class="flex items-center gap-1">
            <UInput
              :model-value="getSeguranca(row.produto_id)"
              @update:model-value="setSeguranca(row.produto_id, $event)"
              type="number"
              size="xs"
              class="w-20"
              :ui="{ base: 'text-center' }"
            />
            <span class="text-xs text-gray-400">%</span>
          </div>
        </template>
        <template #ponto_reposicao-data="{ row }">
          <div style="text-align: right; width: 100%;">
            <span class="font-semibold text-blue-600">
              {{ formatNumber(calcPontoReposicao(row)) }}
            </span>
          </div>
        </template>
        <template #previsao_compras-data="{ row }">
          <div style="text-align: right; width: 100%;">
            <span
              :class="calcPrevisaoCompras(row) > 0 ? 'font-semibold text-red-600' : 'text-green-600'"
            >
              {{ calcPrevisaoCompras(row) > 0 ? formatNumber(calcPrevisaoCompras(row)) : 'OK' }}
            </span>
          </div>
        </template>
      </UTable>
      <TablePagination
        v-model="page"
        :page-size="pageSize"
        :total-items="filteredEstoque.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>

    </template>

    <!-- Tab: CMC Semanal -->
    <template v-if="activeTab === 1">

      <!-- Faturamento Semanal (Input) -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <div class="p-1.5 bg-blue-100 rounded-md">
              <UIcon name="i-heroicons-currency-dollar" class="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900">Faturamento Semanal</p>
              <p class="text-xs text-gray-400">Informe o faturamento de cada semana</p>
            </div>
          </div>
        </template>

        <div class="grid gap-3" :style="{ gridTemplateColumns: `repeat(${cmcData?.semanas?.length || 4}, minmax(0, 1fr))` }">
          <div
            v-for="(semana, idx) in cmcData?.semanas || []"
            :key="idx"
            class="flex flex-col gap-1"
          >
            <label class="text-xs font-medium text-gray-500 text-center">
              {{ semana.inicio }} - {{ semana.fim }}
            </label>
            <UInput
              :model-value="faturamentoInputs[idx]"
              @update:model-value="faturamentoInputs[idx] = $event"
              @blur="salvarFaturamento(idx)"
              type="number"
              size="sm"
              placeholder="R$ 0,00"
              :ui="{ base: 'text-center' }"
            />
          </div>
        </div>
      </UCard>

      <!-- Tabela CMC Semanal Agrupada -->
      <UCard :ui="{ body: { padding: '' } }">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="px-4 py-3 text-left font-semibold text-gray-700 min-w-[250px]">Grupo / Subgrupo</th>
                <th
                  v-for="(semana, idx) in cmcData?.semanas || []"
                  :key="idx"
                  class="px-3 py-3 text-right font-semibold text-gray-700 min-w-[120px]"
                >
                  {{ semana.inicio }} - {{ semana.fim }}
                </th>
                <th class="px-3 py-3 text-right font-semibold text-gray-700 min-w-[120px]">Total</th>
              </tr>
            </thead>
            <tbody v-if="cmcData?.grupos?.length" class="divide-y divide-gray-100">
              <template v-for="grupo in cmcData.grupos" :key="grupo.grupo_id">
                <!-- Linha do Grupo -->
                <tr class="bg-blue-50/50 hover:bg-blue-50 cursor-pointer" @click="toggleGrupo(grupo.grupo_id)">
                  <td class="px-4 py-2.5">
                    <div class="flex items-center gap-2">
                      <UIcon
                        :name="gruposAbertos.has(grupo.grupo_id) ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
                        class="w-4 h-4 text-blue-500"
                      />
                      <span class="font-semibold text-gray-900">{{ grupo.grupo_nome }}</span>
                    </div>
                  </td>
                  <td
                    v-for="(val, idx) in grupo.totais_semanas"
                    :key="idx"
                    class="px-3 py-2.5 text-right font-semibold text-gray-900"
                  >
                    {{ formatCurrency(val) }}
                  </td>
                  <td class="px-3 py-2.5 text-right font-bold text-blue-700">
                    {{ formatCurrency(grupo.totais_semanas.reduce((a: number, b: number) => a + b, 0)) }}
                  </td>
                </tr>
                <!-- Linhas dos Subgrupos -->
                <template v-if="gruposAbertos.has(grupo.grupo_id)">
                  <tr
                    v-for="sub in grupo.subgrupos"
                    :key="sub.subgrupo_id"
                    class="hover:bg-gray-50"
                  >
                    <td class="px-4 py-2 pl-10">
                      <span class="text-gray-600">{{ sub.subgrupo_nome }}</span>
                    </td>
                    <td
                      v-for="(val, idx) in sub.totais_semanas"
                      :key="idx"
                      class="px-3 py-2 text-right text-gray-700"
                    >
                      {{ val > 0 ? formatCurrency(val) : '-' }}
                    </td>
                    <td class="px-3 py-2 text-right font-medium text-gray-900">
                      {{ formatCurrency(sub.totais_semanas.reduce((a: number, b: number) => a + b, 0)) }}
                    </td>
                  </tr>
                </template>
              </template>
            </tbody>
            <tbody v-else>
              <tr>
                <td :colspan="(cmcData?.semanas?.length || 4) + 2" class="py-8 text-center text-gray-400">
                  <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2 mx-auto" />
                  <p class="text-sm">Nenhuma entrada encontrada no período</p>
                </td>
              </tr>
            </tbody>

            <!-- Footer: Totais e CMC % -->
            <tfoot v-if="cmcData?.grupos?.length" class="border-t-2 border-gray-300">
              <!-- Total Compras -->
              <tr class="bg-gray-50">
                <td class="px-4 py-2.5 font-bold text-gray-900">Total Compras</td>
                <td
                  v-for="(semana, idx) in cmcData.semanas"
                  :key="'total-'+idx"
                  class="px-3 py-2.5 text-right font-bold text-gray-900"
                >
                  {{ formatCurrency(calcTotalCompraSemana(idx)) }}
                </td>
                <td class="px-3 py-2.5 text-right font-bold text-blue-700">
                  {{ formatCurrency(cmcData.semanas.reduce((_: number, __: any, idx: number) => _ + calcTotalCompraSemana(idx), 0)) }}
                </td>
              </tr>
              <!-- Faturamento -->
              <tr class="bg-gray-50/50">
                <td class="px-4 py-2.5 font-medium text-gray-700">Faturamento</td>
                <td
                  v-for="(fat, idx) in cmcData.faturamentos"
                  :key="'fat-'+idx"
                  class="px-3 py-2.5 text-right font-medium text-gray-700"
                >
                  {{ fat > 0 ? formatCurrency(fat) : '-' }}
                </td>
                <td class="px-3 py-2.5 text-right font-bold text-gray-700">
                  {{ formatCurrency(cmcData.faturamentos.reduce((a: number, b: number) => a + b, 0)) }}
                </td>
              </tr>
              <!-- CMC % -->
              <tr class="bg-orange-50">
                <td class="px-4 py-2.5 font-bold text-orange-700">CMC %</td>
                <td
                  v-for="(pct, idx) in cmcData.cmc_percentuais"
                  :key="'cmc-'+idx"
                  class="px-3 py-2.5 text-right font-bold"
                  :class="pct > 35 ? 'text-red-600' : pct > 30 ? 'text-orange-600' : 'text-green-600'"
                >
                  {{ pct > 0 ? formatPercent(pct) : '-' }}
                </td>
                <td class="px-3 py-2.5 text-right font-bold"
                  :class="cmcMediaGeral > 35 ? 'text-red-600' : cmcMediaGeral > 30 ? 'text-orange-600' : 'text-green-600'"
                >
                  {{ cmcMediaGeral > 0 ? formatPercent(cmcMediaGeral) : '-' }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </UCard>

    </template>

    <!-- Tab: Variação de Custo -->
    <template v-if="activeTab === 2">

      <!-- Filtros -->
      <UCard>
        <div class="flex flex-wrap gap-4 items-end">
          <UFormGroup label="Mês">
            <USelect
              v-model="vcMesSelecionado"
              :options="vcMesesOptions"
              class="w-48"
            />
          </UFormGroup>
          <UFormGroup label="Buscar">
            <UInput
              v-model="vcSearch"
              placeholder="Buscar produto ou subgrupo..."
              icon="i-heroicons-magnifying-glass"
              class="w-64"
            />
          </UFormGroup>
        </div>
      </UCard>

      <!-- Tabela Variação de Custo Diária -->
      <UCard :ui="{ body: { padding: '' } }">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 min-w-[180px] z-10">Subgrupo</th>
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[180px] bg-gray-50 min-w-[200px] z-10">Produto</th>
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[380px] bg-gray-50 min-w-[50px] z-10">Un.</th>
                <th
                  v-for="dia in vcData?.dias || []"
                  :key="dia.data"
                  class="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[90px]"
                >
                  {{ dia.label }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="vcLoading">
                <td :colspan="3 + (vcData?.dias?.length || 0)" class="px-3 py-8 text-center text-gray-500">
                  <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin mx-auto mb-2" />
                  Carregando...
                </td>
              </tr>
              <tr v-else-if="vcFilteredData.length === 0">
                <td :colspan="3 + (vcData?.dias?.length || 0)" class="px-3 py-8 text-center text-gray-400">
                  <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2 mx-auto" />
                  <p class="text-sm">Nenhum dado encontrado</p>
                </td>
              </tr>
              <template v-for="item in vcFilteredData" :key="item.produto_id">
                <!-- Linha de Custo -->
                <tr class="hover:bg-gray-50">
                  <td class="px-3 py-2 text-sm text-gray-600 sticky left-0 bg-white">{{ item.subgrupo }}</td>
                  <td class="px-3 py-2 text-sm font-medium text-gray-900 sticky left-[180px] bg-white">{{ item.produto }}</td>
                  <td class="px-3 py-2 text-xs text-gray-400 sticky left-[380px] bg-white">{{ item.unidade }}</td>
                  <td
                    v-for="(custo, index) in item.custos"
                    :key="index"
                    class="px-3 py-2 text-sm text-center"
                  >
                    <span v-if="custo > 0" class="font-medium">{{ formatCurrency(custo) }}</span>
                    <span v-else class="text-gray-300">-</span>
                  </td>
                </tr>
                <!-- Linha de Variação -->
                <tr class="bg-gray-50/50">
                  <td class="px-3 py-1 sticky left-0 bg-gray-50/50"></td>
                  <td class="px-3 py-1 text-xs text-gray-400 sticky left-[180px] bg-gray-50/50">variação</td>
                  <td class="px-3 py-1 sticky left-[380px] bg-gray-50/50"></td>
                  <td
                    v-for="(variacao, index) in item.variacoes"
                    :key="index"
                    class="px-3 py-1 text-xs text-center"
                  >
                    <span v-if="variacao !== null" :class="getVariacaoClass(variacao)">
                      {{ variacao > 0 ? '+' : '' }}{{ formatVariacao(variacao) }}%
                    </span>
                    <span v-else class="text-gray-300">-</span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </UCard>

    </template>
  </div>
</template>

<script setup lang="ts">
import type { EstoqueMinimo, CmcSemanalResumo } from '~/types'

const { getEstoqueMinimo, getCmcSemanal, upsertFaturamentoSemanal, getVariacaoCustoDiaria } = useRelatorios()
const { empresaId } = useEmpresa()
const toast = useToast()

const activeTab = ref(0)
const tabItems = [
  { label: 'Ponto de Reposição' },
  { label: 'CMC Semanal' },
  { label: 'Variação de Custo' }
]

// ==========================================
// ESTADO GERAL
// ==========================================
const loading = ref(false)

// ==========================================
// PONTO DE REPOSIÇÃO
// ==========================================
const estoqueData = ref<EstoqueMinimo[]>([])
const search = ref('')

const segurancaMap = ref<Record<string, number>>({})

const getSeguranca = (produtoId: string) => {
  return segurancaMap.value[produtoId] ?? 20
}

const setSeguranca = (produtoId: string, value: any) => {
  segurancaMap.value[produtoId] = Number(value) || 0
}

const calcPontoReposicao = (row: EstoqueMinimo) => {
  const pct = getSeguranca(row.produto_id) / 100
  return row.media_semanas * (1 + pct)
}

const calcPrevisaoCompras = (row: EstoqueMinimo) => {
  const pontoReposicao = calcPontoReposicao(row)
  const diff = pontoReposicao - row.quantidade_estoque
  return diff > 0 ? diff : 0
}

const columns = [
  { key: 'subgrupo', label: 'Subgrupo', sortable: true },
  { key: 'nome', label: 'Produto', sortable: true },
  { key: 'quantidade_estoque', label: 'Estoque Atual', sortable: true },
  { key: 'media_semanal', label: 'Média Semanal', sortable: true },
  { key: 'estoque_seguranca', label: 'Est. Segurança' },
  { key: 'ponto_reposicao', label: 'Ponto Reposição', sortable: true, class: '!text-right', rowClass: '!text-right' },
  { key: 'previsao_compras', label: 'Prev. Compras', sortable: true, class: '!text-right', rowClass: '!text-right' }
]

const filteredEstoque = computed(() => {
  let result = estoqueData.value

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(e =>
      e.nome.toLowerCase().includes(term) ||
      e.subgrupo.toLowerCase().includes(term)
    )
  }

  return result
})

const { page, pageSize, paginatedItems } = usePagination(filteredEstoque)

// ==========================================
// CMC SEMANAL
// ==========================================
const cmcData = ref<CmcSemanalResumo | null>(null)
const cmcLoading = ref(false)
const faturamentoInputs = ref<(number | string)[]>([])
const gruposAbertos = ref<Set<string>>(new Set())

const toggleGrupo = (grupoId: string) => {
  if (gruposAbertos.value.has(grupoId)) {
    gruposAbertos.value.delete(grupoId)
  } else {
    gruposAbertos.value.add(grupoId)
  }
}

const calcTotalCompraSemana = (idx: number) => {
  if (!cmcData.value) return 0
  return cmcData.value.grupos.reduce((sum, g) => sum + g.totais_semanas[idx], 0)
}

const cmcMediaGeral = computed(() => {
  if (!cmcData.value) return 0
  const totalCompras = cmcData.value.semanas.reduce((sum, _, idx) => sum + calcTotalCompraSemana(idx), 0)
  const totalFat = cmcData.value.faturamentos.reduce((a, b) => a + b, 0)
  return totalFat > 0 ? (totalCompras / totalFat) * 100 : 0
})

const salvarFaturamento = async (idx: number) => {
  if (!cmcData.value) return
  const semana = cmcData.value.semanas[idx]
  const valor = Number(faturamentoInputs.value[idx]) || 0

  try {
    await upsertFaturamentoSemanal(semana.inicio_date, semana.fim_date, valor)
    // Atualizar local
    cmcData.value.faturamentos[idx] = valor
    // Recalcular CMC %
    cmcData.value.cmc_percentuais[idx] = valor > 0
      ? (calcTotalCompraSemana(idx) / valor) * 100
      : 0
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar faturamento',
      color: 'red'
    })
  }
}

const loadCmcSemanal = async () => {
  try {
    cmcLoading.value = true
    cmcData.value = await getCmcSemanal(4)
    // Preencher inputs de faturamento
    faturamentoInputs.value = cmcData.value.faturamentos.map(f => f || '')
    // Abrir todos os grupos por padrão
    cmcData.value.grupos.forEach(g => gruposAbertos.value.add(g.grupo_id))
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar CMC Semanal',
      color: 'red'
    })
  } finally {
    cmcLoading.value = false
  }
}

// ==========================================
// VARIAÇÃO DE CUSTO
// ==========================================
const vcData = ref<{ dias: { data: string; label: string }[]; produtos: any[] } | null>(null)
const vcLoading = ref(false)
const vcSearch = ref('')

const hoje = new Date()
const vcMesSelecionado = ref(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`)

const vcMesesOptions = computed(() => {
  const opcoes = []
  const current = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(current.getFullYear(), current.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    const label = `${meses[d.getMonth()]} ${d.getFullYear()}`
    opcoes.push({ label, value })
  }
  return opcoes
})

const vcFilteredData = computed(() => {
  if (!vcData.value) return []
  if (!vcSearch.value) return vcData.value.produtos
  const term = vcSearch.value.toLowerCase()
  return vcData.value.produtos.filter((p: any) =>
    p.produto.toLowerCase().includes(term) ||
    p.subgrupo.toLowerCase().includes(term)
  )
})

const getVariacaoClass = (variacao: number) => {
  if (variacao > 10) return 'text-red-600 font-medium'
  if (variacao > 0) return 'text-red-500'
  if (variacao < -10) return 'text-green-600 font-medium'
  if (variacao < 0) return 'text-green-500'
  return 'text-gray-500'
}

const loadVariacaoCusto = async () => {
  try {
    vcLoading.value = true
    const [ano, mes] = vcMesSelecionado.value.split('-').map(Number)
    vcData.value = await getVariacaoCustoDiaria(ano, mes)
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar variação de custo',
      color: 'red'
    })
  } finally {
    vcLoading.value = false
  }
}

watch(vcMesSelecionado, () => {
  loadVariacaoCusto()
})

// ==========================================
// FORMATAÇÃO
// ==========================================
const truncate2 = (v: number) => Math.trunc((v || 0) * 100) / 100

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(truncate2(value))
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(truncate2(value))
}

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`
}

const formatVariacao = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value || 0)
}

// ==========================================
// CARREGAMENTO DE DADOS
// ==========================================
const loadData = async () => {
  try {
    loading.value = true
    await Promise.all([
      getEstoqueMinimo().then(data => { estoqueData.value = data }),
      loadCmcSemanal(),
      loadVariacaoCusto()
    ])
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar dados',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

// Aguardar empresaId estar disponível antes de carregar
watch(empresaId, (id) => {
  if (id) loadData()
}, { immediate: true })
</script>
