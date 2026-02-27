<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Planejamento de Compras</h1>
        <p class="text-sm text-gray-500">Ponto de reposição, CMC e variação de custo</p>
      </div>
      <div class="flex gap-2">
        <UButton color="primary" variant="outline" @click="gerarCompra" v-if="activeTab === 0" :disabled="produtosEmReposicao.length === 0">
          <UIcon name="i-heroicons-shopping-cart" class="w-4 h-4 mr-2" />
          Gerar Compra
        </UButton>
        <UButton color="primary" @click="loadData" :loading="loading">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-2" />
          Atualizar
        </UButton>
      </div>
    </div>

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

            <!-- Resumo no topo: Total Compras, Faturamento (inline input), CMC % -->
            <tbody v-if="cmcData?.grupos?.length" class="border-b-2 border-gray-300">
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
                <td class="px-4 py-2.5 font-medium text-gray-700">
                  <NuxtLink to="/cadastro/faturamentos" class="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    Faturamento
                    <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3 text-gray-400" />
                  </NuxtLink>
                </td>
                <td
                  v-for="(fat, idx) in cmcData.faturamentos"
                  :key="'fat-'+idx"
                  class="px-3 py-2.5 text-right"
                  :class="fat > 0 ? 'text-gray-700' : 'text-gray-400 italic'"
                >
                  {{ fat > 0 ? formatCurrency(fat) : 'não informado' }}
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
                  :class="getCmcColorClass(pct)"
                >
                  <span v-if="pct > 0" class="flex items-center justify-end gap-1">
                    {{ formatPercent(pct) }}
                    <UTooltip :popper="{ placement: 'top' }" :ui="{ width: 'max-w-sm', base: 'whitespace-normal text-center' }">
                      <UIcon :name="getCmcIcon(pct)" class="w-4 h-4 cursor-help" />
                      <template #text>
                        <span class="text-xs">{{ getCmcTooltip(pct) }}</span>
                      </template>
                    </UTooltip>
                  </span>
                  <span v-else>-</span>
                </td>
                <td class="px-3 py-2.5 text-right font-bold"
                  :class="getCmcColorClass(cmcMediaGeral)"
                >
                  <span v-if="cmcMediaGeral > 0" class="flex items-center justify-end gap-1">
                    {{ formatPercent(cmcMediaGeral) }}
                    <UTooltip :popper="{ placement: 'top' }" :ui="{ width: 'max-w-sm', base: 'whitespace-normal text-center' }">
                      <UIcon :name="getCmcIcon(cmcMediaGeral)" class="w-4 h-4 cursor-help" />
                      <template #text>
                        <span class="text-xs">{{ getCmcTooltip(cmcMediaGeral) }}</span>
                      </template>
                    </UTooltip>
                  </span>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>

            <!-- Dados agrupados -->
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
              placeholder="Buscar produto..."
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
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 min-w-[200px] z-10">Produto</th>
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[200px] bg-gray-50 min-w-[50px] z-10">Un.</th>
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
                <td :colspan="2 + (vcData?.dias?.length || 0)" class="px-3 py-8 text-center text-gray-500">
                  <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin mx-auto mb-2" />
                  Carregando...
                </td>
              </tr>
              <tr v-else-if="vcFilteredData.length === 0">
                <td :colspan="2 + (vcData?.dias?.length || 0)" class="px-3 py-8 text-center text-gray-400">
                  <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2 mx-auto" />
                  <p class="text-sm">Nenhum dado encontrado</p>
                </td>
              </tr>
              <template v-for="item in vcFilteredData" :key="item.produto_id">
                <!-- Linha de Custo -->
                <tr class="hover:bg-gray-50">
                  <td class="px-3 py-1.5 sticky left-0 bg-white z-10">
                    <span class="text-sm font-medium text-gray-900">{{ item.produto }}</span>
                    <div class="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 leading-tight">
                      <span v-if="item.menor_valor > 0" class="text-green-600">↓{{ formatCurrency(item.menor_valor) }}</span>
                      <span v-if="item.maior_valor > 0" class="text-red-500">↑{{ formatCurrency(item.maior_valor) }}</span>
                    </div>
                  </td>
                  <td class="px-3 py-1.5 text-xs text-gray-400 sticky left-[200px] bg-white z-10">{{ item.unidade }}</td>
                  <td
                    v-for="(custo, index) in item.custos"
                    :key="index"
                    class="px-3 py-1.5 text-sm text-center"
                  >
                    <span v-if="custo > 0" class="font-medium">{{ formatCurrency(custo) }}</span>
                    <span v-else class="text-gray-300">-</span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </UCard>

    </template>

    <!-- Modal: Gerar Compra -->
    <UModal
      v-model="modalGerarCompraOpen"
      :ui="{
        width: 'sm:max-w-lg',
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-shopping-cart" class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Gerar Lista de Compras</h3>
              <p class="text-xs text-gray-500">{{ produtosEmReposicao.length }} produto(s) em reposição</p>
            </div>
          </div>
        </template>

        <!-- Resumo dos itens -->
        <div class="space-y-4">
          <div class="p-4 bg-blue-50 rounded-lg">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-cube" class="w-5 h-5 text-blue-600" />
                <span class="text-sm font-medium text-blue-800">Produtos para compra</span>
              </div>
              <span class="text-2xl font-bold text-blue-600">{{ produtosEmReposicao.length }}</span>
            </div>
          </div>

          <!-- Lista resumida -->
          <div class="max-h-[30vh] overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            <div
              v-for="row in produtosEmReposicao"
              :key="row.produto_id"
              class="flex items-center justify-between px-4 py-2.5"
            >
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 text-sm">{{ row.nome }}</p>
                <p class="text-xs text-gray-500">{{ row.subgrupo }} &middot; {{ row.unidade }}</p>
              </div>
              <span class="font-bold text-sm text-red-600 ml-3 whitespace-nowrap">
                {{ formatNumber(calcPrevisaoCompras(row)) }} {{ row.unidade }}
              </span>
            </div>
          </div>

          <!-- Observação -->
          <UFormGroup label="Observação (opcional)">
            <UTextarea
              v-model="observacaoCompra"
              placeholder="Ex: Pedido urgente, entrega até sexta..."
              rows="2"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-between gap-3">
            <UButton color="gray" variant="ghost" @click="modalGerarCompraOpen = false" :disabled="salvandoCompra">
              Cancelar
            </UButton>
            <div class="flex flex-col-reverse sm:flex-row gap-2">
              <UButton
                color="gray"
                :loading="salvandoImprimir"
                :disabled="salvandoWhatsApp"
                @click="salvarEImprimir"
              >
                <UIcon name="i-heroicons-printer" class="w-4 h-4 mr-1" />
                Salvar e Imprimir
              </UButton>
              <UButton
                color="primary"
                :loading="salvandoWhatsApp"
                :disabled="salvandoImprimir"
                @click="salvarEEnviarWhatsApp"
              >
                <UIcon name="i-heroicons-chat-bubble-left-ellipsis" class="w-4 h-4 mr-1" />
                Salvar e Enviar WhatsApp
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { EstoqueMinimo, CmcSemanalResumo } from '~/types'

const { getEstoqueMinimo, getCmcSemanal, getVariacaoCustoDiaria } = useRelatorios()
const { createPedido } = useEstoque()
const { empresaId, empresaAtiva } = useEmpresa()
const toast = useToast()

const route = useRoute()

const activeTab = ref(Number(route.query.tab) || 0)
const tabItems = [
  { label: 'Ponto de Reposição' },
  { label: 'CMC Semanal' },
  { label: 'Variação de Custo' }
]

// React to query param changes from sidebar navigation
watch(() => route.query.tab, (tab) => {
  if (tab !== undefined) {
    activeTab.value = Number(tab)
  }
})

// ==========================================
// ESTADO GERAL
// ==========================================
const loading = ref(false)

// ==========================================
// PONTO DE REPOSIÇÃO
// ==========================================
const estoqueData = ref<EstoqueMinimo[]>([])
const search = ref('')

const SEGURANCA_STORAGE_KEY = computed(() => `seguranca_map_${empresaId.value || 'default'}`)

const loadSegurancaFromStorage = (): Record<string, number> => {
  try {
    const stored = localStorage.getItem(SEGURANCA_STORAGE_KEY.value)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

const segurancaMap = ref<Record<string, number>>(loadSegurancaFromStorage())

const saveSegurancaToStorage = () => {
  try {
    localStorage.setItem(SEGURANCA_STORAGE_KEY.value, JSON.stringify(segurancaMap.value))
  } catch {}
}

const getSeguranca = (produtoId: string) => {
  return segurancaMap.value[produtoId] ?? 20
}

const setSeguranca = (produtoId: string, value: any) => {
  segurancaMap.value[produtoId] = Number(value) || 0
  saveSegurancaToStorage()
}

// Reload segurancaMap when empresa changes
watch(empresaId, () => {
  segurancaMap.value = loadSegurancaFromStorage()
})

const calcPontoReposicao = (row: EstoqueMinimo) => {
  const pct = getSeguranca(row.produto_id) / 100
  return row.media_semanas * (1 + pct)
}

const calcPrevisaoCompras = (row: EstoqueMinimo) => {
  const pontoReposicao = calcPontoReposicao(row)
  return pontoReposicao - row.quantidade_estoque
}

const produtosEmReposicao = computed(() => {
  return estoqueData.value.filter(row => calcPrevisaoCompras(row) > 0)
})

// ==========================================
// MODAL GERAR COMPRA
// ==========================================
const modalGerarCompraOpen = ref(false)
const observacaoCompra = ref('')
const salvandoImprimir = ref(false)
const salvandoWhatsApp = ref(false)
const salvandoCompra = computed(() => salvandoImprimir.value || salvandoWhatsApp.value)

const gerarCompra = () => {
  if (produtosEmReposicao.value.length === 0) return
  observacaoCompra.value = ''
  modalGerarCompraOpen.value = true
}

const salvarPedidoReposicao = async (status: string) => {
  const produtos = produtosEmReposicao.value
  if (produtos.length === 0) return false

  try {
    const dataHoje = new Date().toISOString().split('T')[0]
    const obs = observacaoCompra.value.trim()
      ? `Ponto de Reposição — ${observacaoCompra.value.trim()}`
      : 'Gerado via Ponto de Reposição'

    const itens = produtos.map(row => ({
      produto_id: row.produto_id,
      quantidade: Math.ceil(calcPrevisaoCompras(row) * 100) / 100
    }))

    await createPedido({ data: dataHoje, observacao: obs, status }, itens)

    toast.add({ title: 'Sucesso', description: `Pedido salvo com ${itens.length} itens!`, color: 'green' })
    return true
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar pedido', color: 'red' })
    return false
  }
}

const imprimirLista = () => {
  const produtos = produtosEmReposicao.value
  if (produtos.length === 0) return

  const hojeStr = new Date().toLocaleDateString('pt-BR')
  const empresa = empresaAtiva?.value?.nome || ''

  const linhas = produtos.map((row, idx) => {
    const previsao = calcPrevisaoCompras(row)
    const ponto = calcPontoReposicao(row)
    return `
      <tr>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${idx + 1}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb;">${row.nome}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${row.unidade}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatNumber(row.quantidade_estoque)}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatNumber(ponto)}</td>
        <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #dc2626;">${formatNumber(previsao)}</td>
      </tr>
    `
  }).join('')

  const html = `
    <html>
    <head>
      <title>Lista de Compras - Ponto de Reposição</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
          .no-print { display: none !important; }
        }
        body { font-family: Arial, sans-serif; color: #111827; padding: 20px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background-color: #f3f4f6; padding: 8px 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #d1d5db; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .footer { margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: center; }
      </style>
    </head>
    <body>
      <h1>Lista de Compras - Ponto de Reposição</h1>
      <div class="subtitle">${empresa} · Gerado em ${hojeStr} · ${produtos.length} produto(s)</div>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 40px;">#</th>
            <th>Produto</th>
            <th class="text-center" style="width: 50px;">Un.</th>
            <th class="text-right" style="width: 100px;">Est. Atual</th>
            <th class="text-right" style="width: 100px;">Pto. Repos.</th>
            <th class="text-right" style="width: 100px;">Qtd. Compra</th>
          </tr>
        </thead>
        <tbody>
          ${linhas}
        </tbody>
      </table>
      <div class="footer">Guardião do CMV - Planejamento de Compras</div>
      <script>window.onload = function() { window.print(); }<\/script>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}

const montarTextoWhatsApp = () => {
  const produtos = produtosEmReposicao.value
  const empresa = empresaAtiva?.value?.nome || ''
  const hojeStr = new Date().toLocaleDateString('pt-BR')

  const itensTexto = produtos.map((row, idx) => {
    const previsao = calcPrevisaoCompras(row)
    return `${idx + 1}. ${row.nome} — ${formatNumber(previsao)} ${row.unidade}`
  })

  let texto = `*LISTA DE COMPRAS - PONTO DE REPOSIÇÃO*\n`
  texto += `Empresa: ${empresa}\n`
  texto += `Data: ${hojeStr}\n\n`
  texto += `*ITENS:*\n`
  texto += itensTexto.join('\n')
  texto += `\n\nTotal: ${produtos.length} ${produtos.length === 1 ? 'item' : 'itens'}`
  if (observacaoCompra.value.trim()) texto += `\nObs: ${observacaoCompra.value.trim()}`

  return texto
}

const salvarEImprimir = async () => {
  salvandoImprimir.value = true
  try {
    const sucesso = await salvarPedidoReposicao('rascunho')
    if (sucesso) {
      modalGerarCompraOpen.value = false
      imprimirLista()
    }
  } finally {
    salvandoImprimir.value = false
  }
}

const salvarEEnviarWhatsApp = async () => {
  salvandoWhatsApp.value = true
  try {
    const texto = montarTextoWhatsApp()
    const sucesso = await salvarPedidoReposicao('enviado')
    if (sucesso) {
      modalGerarCompraOpen.value = false
      const encoded = encodeURIComponent(texto)
      window.open(`https://wa.me/?text=${encoded}`, '_blank')
    }
  } finally {
    salvandoWhatsApp.value = false
  }
}

const columns = [
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
// CMC
// ==========================================
const cmcData = ref<CmcSemanalResumo | null>(null)
const cmcLoading = ref(false)
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

// CMC color/icon helpers
const getCmcColorClass = (pct: number) => {
  if (pct <= 0) return 'text-gray-400'
  if (pct < 25) return 'text-blue-600'
  if (pct <= 30) return 'text-green-600'
  if (pct <= 35) return 'text-orange-600'
  return 'text-red-600'
}

const getCmcIcon = (pct: number) => {
  if (pct < 25) return 'i-heroicons-question-mark-circle'
  if (pct <= 30) return 'i-heroicons-check-circle'
  if (pct <= 35) return 'i-heroicons-exclamation-triangle'
  return 'i-heroicons-x-circle'
}

const getCmcTooltip = (pct: number) => {
  if (pct <= 0) return 'Sem dados para análise'
  if (pct < 25) return 'CMC abaixo de 25% — Confirmar dados de compras e faturamento'
  if (pct <= 30) return 'CMC entre 25% e 30% — Dentro do ideal'
  if (pct <= 35) return 'CMC entre 30% e 35% — Atenção, custo se aproximando do limite'
  return 'CMC acima de 35% — Risco! Custo de compras elevado'
}

const loadCmcSemanal = async () => {
  try {
    cmcLoading.value = true
    cmcData.value = await getCmcSemanal(4)
    // Abrir todos os grupos por padrão
    cmcData.value.grupos.forEach(g => gruposAbertos.value.add(g.grupo_id))
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar CMC',
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
