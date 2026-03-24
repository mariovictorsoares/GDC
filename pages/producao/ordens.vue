<template>
  <div class="space-y-6">
    <!-- Header -->
    <h1 class="text-2xl font-semibold text-[#5a5a66] mb-2">Ordens de Produção</h1>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg border border-operacao-200 p-4">
        <p class="text-xs font-medium text-operacao-400 uppercase">Total (mês)</p>
        <p class="text-2xl font-bold text-operacao-800 mt-1">{{ kpis.total }}</p>
      </div>
      <div class="bg-white rounded-lg border border-blue-200 p-4">
        <p class="text-xs font-medium text-blue-500 uppercase">Planejadas</p>
        <p class="text-2xl font-bold text-blue-700 mt-1">{{ kpis.planejadas }}</p>
      </div>
      <div class="bg-white rounded-lg border border-orange-200 p-4">
        <p class="text-xs font-medium text-orange-500 uppercase">Em Produção</p>
        <p class="text-2xl font-bold text-orange-700 mt-1">{{ kpis.em_producao }}</p>
      </div>
      <div class="bg-white rounded-lg border border-green-200 p-4">
        <p class="text-xs font-medium text-green-500 uppercase">Concluídas</p>
        <p class="text-2xl font-bold text-green-700 mt-1">{{ kpis.concluidas }}</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
      <div class="flex flex-col sm:flex-row flex-wrap gap-3 flex-1 min-w-0">
        <UInput
          v-model="search"
          placeholder="Buscar..."
          icon="i-heroicons-magnifying-glass"
          class="w-full sm:w-44"
          :ui="toolbarInputUi"
        />
        <USelect
          v-model="filterStatus"
          :options="statusOptions"
          value-attribute="value"
          option-attribute="label"
          placeholder="Status"
          class="w-full sm:w-40"
          :ui="toolbarInputUi"
        />
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <NuxtLink to="/producao/fichas-tecnicas">
          <UButton color="white" :ui="toolbarButtonUi">
            <UIcon name="i-heroicons-beaker" class="w-4 h-4 mr-1.5" />
            Fichas Técnicas
          </UButton>
        </NuxtLink>
        <UButton color="primary" @click="criarModalOpen = true">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1.5" />
          Nova OP
        </UButton>
      </div>
    </div>

    <!-- Tabela -->
    <UCard :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
      <UTable
        :columns="columns"
        :rows="ordensFiltradas"
        :loading="loading"
        :ui="{
          divide: 'divide-y divide-operacao-50 dark:divide-operacao-700',
          thead: '',
          th: { base: 'bg-operacao-100/70 dark:bg-operacao-800 border-b border-operacao-200/60 [&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66] [&_button>span+span]:text-operacao-300 [&_button>span+span]:!w-3.5 [&_button>span+span]:!h-3.5', color: 'text-[#5a5a66] dark:text-operacao-400', font: 'font-medium', size: 'text-xs uppercase tracking-wider', padding: 'px-4 py-2' },
          td: { color: 'text-operacao-600 dark:text-operacao-200', size: 'text-sm', padding: 'px-4 py-2.5' }
        }"
        @select="abrirDetalhe"
      >
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-operacao-400">
            <UIcon name="i-heroicons-clipboard-document-list" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhuma ordem de produção</p>
          </div>
        </template>

        <template #codigo-data="{ row }">
          <span class="font-semibold text-operacao-800 cursor-pointer hover:text-guardian-600">{{ row.codigo }}</span>
        </template>

        <template #produto-data="{ row }">
          {{ row.produto?.nome || '-' }}
        </template>

        <template #data_planejada-data="{ row }">
          <span :class="{ 'text-red-500 font-medium': isAtrasada(row) }">
            {{ formatDate(row.data_planejada) }}
            <span v-if="isAtrasada(row)" class="text-xs">(atrasada)</span>
          </span>
        </template>

        <template #status-data="{ row }">
          <UBadge :color="getStatusColor(row.status)" variant="subtle" size="xs">
            {{ getStatusLabel(row.status) }}
          </UBadge>
        </template>

        <template #responsavel_nome-data="{ row }">
          {{ row.responsavel_nome || '-' }}
        </template>

        <template #quantidade_planejada-data="{ row }">
          {{ row.quantidade_planejada }} {{ row.produto?.unidade?.sigla || '' }}
        </template>

        <template #custo_estimado-data="{ row }">
          {{ formatCurrency(row.custo_estimado || 0) }}
        </template>

        <template #actions-data="{ row }">
          <div class="flex gap-2 justify-end" @click.stop>
            <UButton
              v-if="row.status === 'planejada'"
              color="primary"
              variant="soft"
              size="xs"
              @click="quickIniciar(row)"
              :loading="quickLoading === row.id"
            >
              Iniciar
            </UButton>
            <UButton
              v-if="row.status === 'em_producao'"
              color="green"
              variant="soft"
              size="xs"
              @click="abrirDetalhe(row)"
            >
              Concluir
            </UButton>
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Modal Criar OP -->
    <ProducaoOrdemProducaoModal
      v-model="criarModalOpen"
      :fichas="fichas"
      :produtos="produtos"
      @criado="carregarDados"
    />

    <!-- Slideover Detalhe OP -->
    <ProducaoOrdemProducaoDetalhes
      v-model="detalheOpen"
      :op="opSelecionada"
      @atualizado="onOPAtualizada"
    />
  </div>
</template>

<script setup lang="ts">
import type { OrdemProducao, FichaTecnica, Produto, StatusOP } from '~/types'

definePageMeta({ layout: 'default' })

const { getOrdensProducao, iniciarProducao, getFichasTecnicas } = useProducao()
const { getProdutos } = useEstoque()
const { formatCurrency } = useFormatters()
const toast = useToast()

const toolbarInputUi = { color: { white: { outline: 'shadow-sm bg-white text-gray-900 ring-1 ring-inset ring-[#EBEBED] focus:ring-1 focus:ring-operacao-200 dark:ring-operacao-700' } } }
const toolbarButtonUi = { color: { white: { solid: 'shadow-sm ring-1 ring-inset ring-[#EBEBED] text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-guardian-500 dark:ring-operacao-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800/50' } } }

const loading = ref(false)
const ordens = ref<OrdemProducao[]>([])
const fichas = ref<FichaTecnica[]>([])
const produtos = ref<Produto[]>([])
const search = ref('')
const filterStatus = ref('todos')
const quickLoading = ref<string | null>(null)

// Modais
const criarModalOpen = ref(false)
const detalheOpen = ref(false)
const opSelecionada = ref<OrdemProducao | null>(null)

const statusOptions = [
  { value: 'todos', label: 'Todos' },
  { value: 'planejada', label: 'Planejadas' },
  { value: 'em_producao', label: 'Em Produção' },
  { value: 'concluida', label: 'Concluídas' },
  { value: 'cancelada', label: 'Canceladas' }
]

const columns = [
  { key: 'codigo', label: 'Código', sortable: true },
  { key: 'produto', label: 'Produto' },
  { key: 'data_planejada', label: 'Data', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'responsavel_nome', label: 'Responsável' },
  { key: 'quantidade_planejada', label: 'Qtd', sortable: true },
  { key: 'custo_estimado', label: 'Custo Est.', sortable: true },
  { key: 'actions', label: '' }
]

// KPIs
const kpis = computed(() => {
  const hoje = new Date()
  const mesAtual = ordens.value.filter(o => {
    const d = new Date(o.data_planejada)
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear()
  })
  return {
    total: mesAtual.length,
    planejadas: mesAtual.filter(o => o.status === 'planejada').length,
    em_producao: mesAtual.filter(o => o.status === 'em_producao').length,
    concluidas: mesAtual.filter(o => o.status === 'concluida').length
  }
})

const ordensFiltradas = computed(() => {
  let result = ordens.value

  if (filterStatus.value !== 'todos') {
    result = result.filter(o => o.status === filterStatus.value)
  }

  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(o =>
      o.codigo.toLowerCase().includes(q) ||
      o.produto?.nome?.toLowerCase().includes(q) ||
      o.responsavel_nome?.toLowerCase().includes(q)
    )
  }

  return result
})

const getStatusColor = (status: StatusOP) => {
  switch (status) {
    case 'planejada': return 'blue'
    case 'em_producao': return 'orange'
    case 'concluida': return 'green'
    case 'cancelada': return 'red'
    default: return 'gray'
  }
}

const getStatusLabel = (status: StatusOP) => {
  switch (status) {
    case 'planejada': return 'Planejada'
    case 'em_producao': return 'Em Produção'
    case 'concluida': return 'Concluída'
    case 'cancelada': return 'Cancelada'
    default: return status
  }
}

const isAtrasada = (op: OrdemProducao) =>
  op.status === 'planejada' && op.data_planejada < new Date().toISOString().split('T')[0]

const formatDate = (d: string) => {
  if (!d) return '-'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const carregarDados = async () => {
  loading.value = true
  try {
    const [ordensData, fichasData, produtosData] = await Promise.all([
      getOrdensProducao(),
      getFichasTecnicas(),
      getProdutos()
    ])
    ordens.value = ordensData
    fichas.value = fichasData
    produtos.value = produtosData
  } catch (e: any) {
    toast.add({ title: 'Erro ao carregar dados', description: e.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

const abrirDetalhe = (row: OrdemProducao) => {
  opSelecionada.value = row
  detalheOpen.value = true
}

const onOPAtualizada = async () => {
  await carregarDados()
  // Reabrir detalhe atualizado
  if (opSelecionada.value) {
    const atualizada = ordens.value.find(o => o.id === opSelecionada.value!.id)
    if (atualizada) {
      opSelecionada.value = atualizada
    } else {
      detalheOpen.value = false
    }
  }
}

const quickIniciar = async (op: OrdemProducao) => {
  quickLoading.value = op.id
  try {
    await iniciarProducao(op.id)
    toast.add({ title: 'Produção iniciada', color: 'green' })
    await carregarDados()
  } catch (e: any) {
    toast.add({ title: 'Erro', description: e.message, color: 'red' })
  } finally {
    quickLoading.value = null
  }
}

onMounted(carregarDados)
</script>
