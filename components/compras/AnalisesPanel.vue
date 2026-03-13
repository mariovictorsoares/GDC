<template>
  <USlideover
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :ui="{
      width: 'max-w-7xl',
      overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' }
    }"
  >
    <div class="flex flex-col h-full">

      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-operacao-200">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-guardian-100 rounded-lg">
            <UIcon name="i-heroicons-clipboard-document-list" class="w-5 h-5 text-guardian-600" />
          </div>
          <h2 class="text-lg font-bold text-operacao-800">Análises de Compras</h2>
        </div>
        <UButton
          icon="i-heroicons-x-mark"
          variant="ghost"
          color="gray"
          size="sm"
          @click="$emit('update:modelValue', false)"
        />
      </div>

      <!-- Content (scrollable) -->
      <div class="flex-1 overflow-y-auto p-6 space-y-4">

        <!-- Filtros + Tab Switcher -->
        <div class="flex items-center gap-3">
          <div class="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            <template v-if="activeTab === 0">
              <UInput
                v-model="search"
                placeholder="Buscar produto ou subgrupo..."
                icon="i-heroicons-magnifying-glass"
                class="w-64"
                :ui="toolbarInputUi"
              />
            </template>
            <template v-if="activeTab === 1">
              <UInput
                v-model="vcSearch"
                placeholder="Buscar produto..."
                icon="i-heroicons-magnifying-glass"
                class="w-64"
                :ui="toolbarInputUi"
              />
              <UPopover :popper="{ placement: 'bottom-start' }">
                <UButton
                  color="white"
                  class="w-auto justify-between"
                  :ui="toolbarButtonUi"
                >
                  <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-operacao-400 mr-2" />
                  <span class="text-sm font-normal text-gray-900 capitalize">{{ vcMesAnoLabel }}</span>
                </UButton>
                <template #panel="{ close }">
                  <div class="w-64 p-3">
                    <div class="flex items-center justify-between mb-3">
                      <button class="p-1 rounded hover:bg-operacao-100 transition-colors" @click="vcPickerAno--">
                        <UIcon name="i-heroicons-chevron-left-20-solid" class="w-4 h-4 text-operacao-500" />
                      </button>
                      <span class="text-sm font-semibold text-gray-700">{{ vcPickerAno }}</span>
                      <button class="p-1 rounded hover:bg-operacao-100 transition-colors" @click="vcPickerAno++">
                        <UIcon name="i-heroicons-chevron-right-20-solid" class="w-4 h-4 text-operacao-500" />
                      </button>
                    </div>
                    <div class="grid grid-cols-3 gap-1.5">
                      <button
                        v-for="(nome, idx) in mesesNomes"
                        :key="idx"
                        class="px-2 py-1.5 text-sm rounded-md transition-colors capitalize"
                        :class="vcSelectedMes === idx + 1 && vcSelectedAno === vcPickerAno
                          ? 'bg-guardian-600 text-white font-medium'
                          : 'text-operacao-600 hover:bg-operacao-50'"
                        @click="vcSelectMesAno(idx + 1, vcPickerAno); close()"
                      >
                        {{ nome }}
                      </button>
                    </div>
                  </div>
                </template>
              </UPopover>
            </template>
          </div>
          <!-- Tab Switcher -->
          <div class="inline-flex items-center rounded-lg bg-operacao-100/80 p-0.5 ring-1 ring-operacao-200/60 flex-shrink-0">
            <button
              v-for="(tab, idx) in tabItems"
              :key="idx"
              @click="activeTab = idx"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all"
              :class="activeTab === idx ? 'bg-white text-operacao-800 shadow-sm ring-1 ring-operacao-200/60' : 'text-operacao-400 hover:text-operacao-600'"
            >
              <UIcon :name="tab.icon" class="w-3.5 h-3.5" /><span>{{ tab.label }}</span>
            </button>
          </div>
        </div>

        <!-- Tab: Ponto de Reposição -->
        <template v-if="activeTab === 0">

          <!-- Tabela -->
          <UCard :ui="{ body: { padding: '' } }">
            <UTable
              :columns="columns"
              :rows="paginatedItems"
              :loading="loading"
              v-model:sort="sortState"
              :ui="{ td: { base: '' }, th: { base: 'bg-operacao-100/70 dark:bg-operacao-800 border-b border-operacao-200/60 [&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66] [&_button>span+span]:text-operacao-300 [&_button>span+span]:!w-3.5 [&_button>span+span]:!h-3.5', color: 'text-[#5a5a66] dark:text-operacao-400', font: 'font-medium', size: 'text-xs uppercase tracking-wider', padding: 'px-4 py-2' } }"
            >
              <template #empty-state>
                <div class="flex flex-col items-center justify-center py-6 text-operacao-400">
                  <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
                  <p class="text-sm">Nenhum registro encontrado</p>
                </div>
              </template>

              <template #nome-data="{ row }">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ row.nome }}</span>
                  <span
                    v-if="formatPedidoFlag(row.produto_id)"
                    class="inline-flex items-center gap-1 text-[10px] font-medium text-guardian-700 bg-guardian-50 ring-1 ring-guardian-200 px-1.5 py-0.5 rounded-full whitespace-nowrap"
                  >
                    <UIcon name="i-heroicons-check-circle-solid" class="w-3 h-3 text-guardian-500" />
                    {{ formatPedidoFlag(row.produto_id) }}
                  </span>
                </div>
              </template>
              <template #quantidade_estoque-data="{ row }">
                <span class="font-medium">{{ formatNumber(row.quantidade_estoque) }} {{ row.unidade }}</span>
              </template>
              <template #media_semanal-data="{ row }">
                <UPopover :popper="{ placement: 'bottom' }" mode="hover" :open-delay="150">
                  <button class="flex items-center gap-1.5 cursor-default group">
                    <span class="font-semibold text-operacao-800">{{ formatNumber(row.media_semanas) }}</span>
                    <span class="text-xs text-operacao-400">{{ row.unidade }}</span>
                    <UIcon name="i-heroicons-information-circle" class="w-3.5 h-3.5 text-operacao-300 group-hover:text-guardian-500 transition-colors" />
                  </button>

                  <template #panel>
                    <div class="w-72">
                      <div class="flex items-center gap-2 px-4 pt-3 pb-2">
                        <div class="p-1.5 bg-controle-100 rounded-md">
                          <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-controle-600" />
                        </div>
                        <div>
                          <p class="text-sm font-semibold text-operacao-800">{{ row.nome }}</p>
                          <p class="text-[10px] text-operacao-400">Consumo semanal · saídas definitivas</p>
                        </div>
                      </div>

                      <table class="w-full text-xs">
                        <thead>
                          <tr class="bg-controle-50">
                            <th class="px-3 py-1.5 text-left font-medium text-controle-600">Semana</th>
                            <th class="px-3 py-1.5 text-left font-medium text-controle-600">Período</th>
                            <th class="px-3 py-1.5 text-right font-medium text-controle-600">Consumo</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-operacao-100">
                          <tr class="hover:bg-operacao-50">
                            <td class="px-3 py-2 text-operacao-600 font-medium">S -3</td>
                            <td class="px-3 py-2 text-operacao-400">{{ row.semana3_periodo }}</td>
                            <td class="px-3 py-2 text-right text-controle-600 font-medium">{{ formatNumber(row.semana3) }} {{ row.unidade }}</td>
                          </tr>
                          <tr class="hover:bg-operacao-50">
                            <td class="px-3 py-2 text-operacao-600 font-medium">S -2</td>
                            <td class="px-3 py-2 text-operacao-400">{{ row.semana2_periodo }}</td>
                            <td class="px-3 py-2 text-right text-controle-600 font-medium">{{ formatNumber(row.semana2) }} {{ row.unidade }}</td>
                          </tr>
                          <tr class="hover:bg-operacao-50">
                            <td class="px-3 py-2 text-operacao-600 font-medium">S -1</td>
                            <td class="px-3 py-2 text-operacao-400">{{ row.semana1_periodo }}</td>
                            <td class="px-3 py-2 text-right text-controle-600 font-medium">{{ formatNumber(row.semana1) }} {{ row.unidade }}</td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr class="bg-controle-50/70 border-t border-green-200">
                            <td colspan="2" class="px-3 py-2 font-semibold text-operacao-800">Média</td>
                            <td class="px-3 py-2 text-right font-bold text-controle-700">{{ formatNumber(row.media_semanas) }} {{ row.unidade }}</td>
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
                  <span class="text-xs text-operacao-400">%</span>
                </div>
              </template>
              <template #ponto_reposicao-data="{ row }">
                <div style="text-align: right; width: 100%;">
                  <span class="font-semibold text-guardian-600">
                    {{ formatNumber(calcPontoReposicao(row)) }}
                  </span>
                </div>
              </template>
              <template #previsao_compras-data="{ row }">
                <div style="text-align: right; width: 100%;">
                  <span
                    :class="calcPrevisaoCompras(row) > 0 ? 'font-semibold text-red-600' : 'text-controle-600'"
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

        <!-- Tab: Variação de Custo -->
        <template v-if="activeTab === 1">

          <!-- Tabela Variação de Custo Diária -->
          <UCard :ui="{ body: { padding: '' } }">
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead class="bg-operacao-50">
                  <tr>
                    <th class="px-3 py-3 text-left text-xs font-medium text-[#5a5a66] uppercase tracking-wider sticky left-0 bg-operacao-50 min-w-[200px] z-10">Produto</th>
                    <th
                      v-for="dia in vcData?.dias || []"
                      :key="dia.data"
                      class="px-3 py-3 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider min-w-[90px]"
                    >
                      {{ dia.label }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-operacao-200">
                  <tr v-if="vcLoading">
                    <td :colspan="1 + (vcData?.dias?.length || 0)" class="px-3 py-8 text-center text-operacao-400">
                      <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin mx-auto mb-2" />
                      Carregando...
                    </td>
                  </tr>
                  <tr v-else-if="vcFilteredData.length === 0">
                    <td :colspan="1 + (vcData?.dias?.length || 0)" class="px-3 py-8 text-center text-operacao-400">
                      <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2 mx-auto" />
                      <p class="text-sm">Nenhum dado encontrado</p>
                    </td>
                  </tr>
                  <template v-for="item in vcPaginatedItems" :key="item.produto_id">
                    <tr class="hover:bg-operacao-50 h-12">
                      <td class="px-3 py-2 sticky left-0 bg-white z-10 align-middle">
                        <span class="text-sm font-medium text-operacao-800">{{ item.produto }} <span class="text-xs text-operacao-400 font-normal">({{ item.unidade }})</span></span>
                        <div v-if="item.menor_valor > 0 || item.maior_valor > 0" class="flex items-center gap-2 mt-0.5 text-[10px] text-operacao-400 leading-tight">
                          <span v-if="item.menor_valor > 0" class="text-controle-600">↓{{ formatCurrency(item.menor_valor) }}</span>
                          <span v-if="item.maior_valor > 0" class="text-red-500">↑{{ formatCurrency(item.maior_valor) }}</span>
                        </div>
                      </td>
                      <td
                        v-for="(custo, index) in item.custos"
                        :key="index"
                        class="px-3 py-2 text-sm text-center align-middle"
                      >
                        <span v-if="custo > 0" class="font-medium">{{ formatCurrency(custo) }}</span>
                        <span v-else class="text-operacao-300">-</span>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
            <TablePagination
              v-model="vcPage"
              :page-size="vcPageSize"
              :total-items="vcFilteredData.length"
              @update:page-size="vcPageSize = $event"
            />
          </UCard>

        </template>

      </div>
    </div>

    <!-- Modal: Gerar Compra -->
    <UModal
      v-model="modalGerarCompraOpen"
      :ui="{
        width: 'sm:max-w-lg',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-guardian-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-shopping-cart" class="w-5 h-5 text-guardian-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">Gerar Lista de Compras</h3>
              <p class="text-xs text-operacao-400">{{ produtosEmReposicao.length }} produto(s) em reposição</p>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Nome da lista -->
          <UFormGroup label="Nome da lista *">
            <UInput
              v-model="nomeCompra"
              placeholder="Ex: Compras da semana, Reposição urgente..."
            />
          </UFormGroup>

          <!-- Previsão de recebimento -->
          <UFormGroup label="Previsão de recebimento">
            <UInput
              v-model="previsaoRecebimento"
              type="date"
            />
          </UFormGroup>

          <div class="p-4 bg-guardian-50 rounded-lg">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-cube" class="w-5 h-5 text-guardian-600" />
                <span class="text-sm font-medium text-blue-800">Produtos para compra</span>
              </div>
              <span class="text-2xl font-bold text-guardian-600">{{ produtosEmReposicao.length }}</span>
            </div>
          </div>

          <!-- Lista resumida -->
          <div class="max-h-[30vh] overflow-y-auto border border-operacao-200 rounded-lg divide-y divide-operacao-100">
            <div
              v-for="row in produtosEmReposicao"
              :key="row.produto_id"
              class="flex items-center justify-between px-4 py-2.5"
            >
              <div class="flex-1 min-w-0">
                <p class="font-medium text-operacao-800 text-sm">{{ row.nome }}</p>
                <p class="text-xs text-operacao-400">{{ row.subgrupo }} &middot; {{ row.unidade }}</p>
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
                :disabled="salvandoWhatsApp || !nomeCompra.trim()"
                @click="salvarEImprimir"
              >
                <UIcon name="i-heroicons-printer" class="w-4 h-4 mr-1" />
                Salvar e Imprimir
              </UButton>
              <UButton
                color="primary"
                :loading="salvandoWhatsApp"
                :disabled="salvandoImprimir || !nomeCompra.trim()"
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

  </USlideover>
</template>

<script setup lang="ts">
import type { EstoqueMinimo } from '~/types'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'compra-criada': []
}>()

const { getEstoqueMinimo, getVariacaoCustoDiaria } = useRelatorios()
const { createPedido, getPedidosSemanaAtual } = useEstoque()
const { empresaId, empresaAtiva } = useEmpresa()
const toast = useToast()

const activeTab = ref(0)
const tabItems = [
  { label: 'Ponto de Reposição', icon: 'i-heroicons-arrow-path' },
  { label: 'Variação de Custo', icon: 'i-heroicons-arrow-trending-up' }
]

// ==========================================
// ESTADO GERAL
// ==========================================
const loading = ref(false)
const dataLoaded = ref(false)

// Load data when slideover opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen && !dataLoaded.value && empresaId.value) {
    loadData()
  }
})

// ==========================================
// PONTO DE REPOSIÇÃO
// ==========================================
const estoqueData = ref<EstoqueMinimo[]>([])
const pedidosSemana = ref<Map<string, string>>(new Map())
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
  dataLoaded.value = false
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

const formatPedidoFlag = (produtoId: string): string | null => {
  const data = pedidosSemana.value.get(produtoId)
  if (!data) return null
  const d = new Date(data + 'T00:00:00')
  return `Pedido feito ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ==========================================
// MODAL GERAR COMPRA
// ==========================================
const modalGerarCompraOpen = ref(false)
const nomeCompra = ref('')
const previsaoRecebimento = ref('')
const observacaoCompra = ref('')
const salvandoImprimir = ref(false)
const salvandoWhatsApp = ref(false)
const salvandoCompra = computed(() => salvandoImprimir.value || salvandoWhatsApp.value)

const gerarCompra = () => {
  if (produtosEmReposicao.value.length === 0) return
  nomeCompra.value = `Reposição ${new Date().toLocaleDateString('pt-BR')}`
  previsaoRecebimento.value = ''
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

    await createPedido({
      data: dataHoje,
      nome: nomeCompra.value.trim() || `Reposição ${new Date().toLocaleDateString('pt-BR')}`,
      observacao: obs,
      status: 'em_andamento',
      previsao_recebimento: previsaoRecebimento.value || undefined,
      origem: 'reposicao'
    }, itens)

    toast.add({ title: 'Sucesso', description: `Lista salva com ${itens.length} itens!`, color: 'green' })
    emit('compra-criada')
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
      <h1>${nomeCompra.value || 'Lista de Compras - Ponto de Reposição'}</h1>
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
      <div class="footer">Guardião do CMV - Compras</div>
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

  let texto = `*${nomeCompra.value || 'LISTA DE COMPRAS - PONTO DE REPOSIÇÃO'}*\n`
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
    const sucesso = await salvarPedidoReposicao('em_andamento')
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
    const sucesso = await salvarPedidoReposicao('em_andamento')
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

const enrichedEstoque = computed(() => {
  return estoqueData.value.map(row => ({
    ...row,
    media_semanal: row.media_semanas,
    ponto_reposicao: calcPontoReposicao(row),
    previsao_compras: calcPrevisaoCompras(row)
  }))
})

const filteredEstoque = computed(() => {
  let result = enrichedEstoque.value

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(e =>
      e.nome.toLowerCase().includes(term) ||
      e.subgrupo.toLowerCase().includes(term)
    )
  }

  return result
})

const sortState = ref({ column: 'previsao_compras', direction: 'desc' as const })
const { page, pageSize, paginatedItems } = usePagination(filteredEstoque)

// ==========================================
// VARIAÇÃO DE CUSTO
// ==========================================
const vcData = ref<{ dias: { data: string; label: string }[]; produtos: any[] } | null>(null)
const vcLoading = ref(false)
const vcSearch = ref('')

const hoje = new Date()
const vcSelectedAno = ref(hoje.getFullYear())
const vcSelectedMes = ref(hoje.getMonth() + 1)
const vcPickerAno = ref(hoje.getFullYear())

const mesesNomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const vcMesAnoLabel = computed(() => {
  return `${mesesNomes[vcSelectedMes.value - 1]} ${vcSelectedAno.value}`
})

const vcSelectMesAno = (mes: number, ano: number) => {
  vcSelectedMes.value = mes
  vcSelectedAno.value = ano
}

const toolbarInputUi = { color: { white: { outline: 'shadow-sm bg-white text-gray-900 ring-1 ring-inset ring-[#EBEBED] focus:ring-1 focus:ring-operacao-200 dark:ring-operacao-700' } } }
const toolbarButtonUi = { color: { white: { solid: 'shadow-sm ring-1 ring-inset ring-[#EBEBED] text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-guardian-500 dark:ring-operacao-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800/50' } } }

const vcFilteredData = computed(() => {
  if (!vcData.value) return []
  let result = vcData.value.produtos
  if (vcSearch.value) {
    const term = vcSearch.value.toLowerCase()
    result = result.filter((p: any) =>
      p.produto.toLowerCase().includes(term) ||
      p.subgrupo.toLowerCase().includes(term)
    )
  }
  // Ordenar: maior variação primeiro, depois por maior_valor desc, sem dados por último
  return [...result].sort((a: any, b: any) => {
    const aVar = a.variacao_mes ?? -Infinity
    const bVar = b.variacao_mes ?? -Infinity
    if (aVar !== bVar) return bVar - aVar
    return b.maior_valor - a.maior_valor
  })
})

const { page: vcPage, pageSize: vcPageSize, paginatedItems: vcPaginatedItems } = usePagination(vcFilteredData)

const loadVariacaoCusto = async () => {
  try {
    vcLoading.value = true
    vcData.value = await getVariacaoCustoDiaria(vcSelectedAno.value, vcSelectedMes.value)
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

watch([vcSelectedAno, vcSelectedMes], () => {
  loadVariacaoCusto()
})

// ==========================================
// FORMATAÇÃO
// ==========================================
const { formatCurrency, formatNumber } = useFormatters()

// ==========================================
// CARREGAMENTO DE DADOS
// ==========================================
const loadData = async () => {
  try {
    loading.value = true
    await Promise.all([
      getEstoqueMinimo().then(data => { estoqueData.value = data }),
      getPedidosSemanaAtual().then(data => { pedidosSemana.value = data }),
      loadVariacaoCusto()
    ])
    dataLoaded.value = true
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
</script>
