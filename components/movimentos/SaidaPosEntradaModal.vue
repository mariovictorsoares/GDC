<template>
  <UModal
    v-model="modalAberto"
    :prevent-close="salvando"
    :ui="{
      width: 'sm:max-w-xl',
      overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
      background: 'bg-white dark:bg-operacao-800',
      ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
      shadow: 'shadow-2xl'
    }"
  >
    <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="p-2 rounded-lg flex items-center justify-center"
              :class="etapa === 'resumo' ? 'bg-green-100' : 'bg-blue-100'"
            >
              <UIcon
                :name="etapa === 'resumo' ? 'i-heroicons-check-circle' : 'i-heroicons-arrow-path-rounded-square'"
                class="w-5 h-5"
                :class="etapa === 'resumo' ? 'text-green-600' : 'text-blue-600'"
              />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">
                {{ etapa === 'resumo' ? 'Saídas Registradas' : 'Enviar produtos para...' }}
              </h3>
              <p v-if="etapa === 'selecao'" class="text-xs text-operacao-400">
                Selecione o destino de cada produto
              </p>
            </div>
          </div>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="fechar"
          />
        </div>
      </template>

      <!-- Etapa: Seleção -->
      <div v-if="etapa === 'selecao'" class="space-y-3">
        <div v-if="carregandoSaldos" class="flex items-center justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-operacao-400 animate-spin mr-2" />
          <span class="text-sm text-operacao-400">Carregando saldos...</span>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="item in itensModal"
            :key="item.produto_id"
            class="rounded-xl border transition-colors"
            :class="item.selecionado
              ? destinoBorderClass(item.destino)
              : 'border-operacao-100 bg-operacao-50/50'"
          >
            <div class="flex items-center gap-3 p-3">
              <input
                type="checkbox"
                v-model="item.selecionado"
                class="w-4 h-4 rounded border-operacao-300 text-blue-600 focus:ring-blue-500"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-operacao-800 truncate">{{ item.produto_nome }}</p>
                <p class="text-xs text-operacao-400">
                  Entrou: {{ item.qtd_entrada }} {{ item.unidade_sigla }} · Saldo principal: {{ item.saldo_principal }} {{ item.unidade_sigla }}
                </p>
              </div>
              <div class="w-24 flex-shrink-0">
                <UInput
                  v-model.number="item.quantidade"
                  type="number"
                  size="sm"
                  placeholder="Qtd"
                  :min="0"
                  :max="item.saldo_principal"
                  :disabled="!item.selecionado"
                />
                <p v-if="item.selecionado && item.quantidade > item.saldo_principal" class="text-[10px] text-red-500 mt-0.5">
                  Máx: {{ item.saldo_principal }}
                </p>
              </div>
            </div>

            <!-- Destino selector -->
            <div v-if="item.selecionado" class="px-3 pb-3 space-y-2">
              <div class="flex gap-1 p-0.5 bg-operacao-100 rounded-lg">
                <button
                  v-for="opt in destinoOpcoes"
                  :key="opt.value"
                  class="flex-1 text-xs font-medium py-1.5 px-2 rounded-md transition-all"
                  :class="item.destino === opt.value ? opt.activeClass : 'text-operacao-400 hover:text-operacao-600'"
                  @click="item.destino = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>

              <!-- Campos extras para Outra Loja -->
              <div v-if="item.destino === 'loja'" class="space-y-2 pt-1">
                <USelectMenu
                  v-model="item.empresa_destino_id"
                  :options="outrasEmpresas"
                  placeholder="Selecionar loja destino..."
                  value-attribute="value"
                  option-attribute="label"
                  size="sm"
                >
                  <template #leading>
                    <UIcon name="i-heroicons-building-storefront" class="w-3.5 h-3.5 text-operacao-400" />
                  </template>
                </USelectMenu>

                <USelectMenu
                  v-if="item.empresa_destino_id"
                  v-model="item.produto_destino_id"
                  :options="produtosDestinoOptions(item.empresa_destino_id)"
                  placeholder="Produto na loja destino..."
                  searchable
                  searchable-placeholder="Buscar produto..."
                  value-attribute="value"
                  option-attribute="label"
                  size="sm"
                >
                  <template #leading>
                    <UIcon name="i-heroicons-cube" class="w-3.5 h-3.5 text-operacao-400" />
                  </template>
                </USelectMenu>
              </div>
            </div>
          </div>
        </div>

        <!-- Aviso de definitiva -->
        <div
          v-if="temDefinitiva"
          class="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-red-700">
            <strong>Atenção:</strong> {{ itensDefinitivos.length }} produto{{ itensDefinitivos.length > 1 ? 's serão removidos' : ' será removido' }} permanentemente (saída definitiva).
          </p>
        </div>
      </div>

      <!-- Etapa: Confirmar Definitiva -->
      <div v-else-if="etapa === 'confirmarDefinitiva'" class="space-y-3">
        <div class="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-semibold text-red-800">Confirmar Saída Definitiva</p>
            <p class="text-xs text-red-600 mt-1">
              Os produtos abaixo serão removidos permanentemente do estoque. Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
        <div
          v-for="item in itensDefinitivos"
          :key="item.produto_id"
          class="flex items-center gap-3 p-3 rounded-xl bg-red-50/50 border border-red-200"
        >
          <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-red-500 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-operacao-800 truncate">{{ item.produto_nome }}</p>
          </div>
          <p class="text-sm font-semibold text-red-700 flex-shrink-0">
            {{ item.quantidade }} {{ item.unidade_sigla }}
          </p>
        </div>
      </div>

      <!-- Etapa: Resumo -->
      <div v-else-if="etapa === 'resumo'" class="space-y-3">
        <div
          v-for="item in itensProcessados"
          :key="item.produto_id"
          class="flex items-center gap-3 p-3 rounded-xl border"
          :class="resumoCardClass(item.destino)"
        >
          <UIcon :name="resumoIcon(item.destino)" class="w-5 h-5 flex-shrink-0" :class="resumoIconClass(item.destino)" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-operacao-800 truncate">{{ item.produto_nome }}</p>
            <p v-if="item.destino === 'loja'" class="text-xs text-operacao-400 truncate">
              → {{ nomeEmpresa(item.empresa_destino_id) }}
            </p>
          </div>
          <p class="text-sm font-semibold flex-shrink-0" :class="resumoTextClass(item.destino)">
            {{ item.quantidade }} {{ item.unidade_sigla }} → {{ resumoDestinoLabel(item.destino) }}
          </p>
        </div>
        <p class="text-xs text-operacao-400 text-center pt-1">
          {{ itensProcessados.length }} produto{{ itensProcessados.length > 1 ? 's' : '' }} processado{{ itensProcessados.length > 1 ? 's' : '' }}
        </p>
      </div>

      <template #footer>
        <!-- Seleção -->
        <div v-if="etapa === 'selecao'" class="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="fechar">
            Não enviar nada
          </UButton>
          <UButton
            color="blue"
            class="w-full sm:w-auto"
            :loading="salvando"
            :disabled="!temItensSelecionados"
            @click="avancar"
          >
            <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
            Confirmar Saídas
          </UButton>
        </div>
        <!-- Confirmar Definitiva -->
        <div v-else-if="etapa === 'confirmarDefinitiva'" class="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="etapa = 'selecao'">
            Voltar
          </UButton>
          <UButton
            color="red"
            class="w-full sm:w-auto"
            :loading="salvando"
            @click="processar"
          >
            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 mr-1.5" />
            Confirmar Remoção e Processar
          </UButton>
        </div>
        <!-- Resumo -->
        <div v-else class="flex justify-end">
          <UButton color="gray" variant="soft" class="w-full sm:w-auto" @click="fechar">
            Fechar
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { Empresa, Produto } from '~/types'

type DestinoTipo = 'apoio' | 'definitiva' | 'loja'

interface ItemEntradaInfo {
  produto_id: string
  quantidade: number
  produto_nome: string
  unidade_sigla: string
}

interface ItemModal {
  produto_id: string
  produto_nome: string
  unidade_sigla: string
  qtd_entrada: number
  saldo_principal: number
  selecionado: boolean
  quantidade: number
  destino: DestinoTipo
  empresa_destino_id: string
  produto_destino_id: string
}

const props = defineProps<{
  modelValue: boolean
  itensEntrada: ItemEntradaInfo[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const modalAberto = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const { createSaida, getSaldoProduto, createTransferenciaLoja } = useEstoque()
const { empresaAtiva, empresas } = useEmpresa()
const toast = useToast()

const etapa = ref<'selecao' | 'confirmarDefinitiva' | 'resumo'>('selecao')
const carregandoSaldos = ref(false)
const salvando = ref(false)
const itensModal = ref<ItemModal[]>([])
const itensProcessados = ref<ItemModal[]>([])

// Produtos por empresa destino (cache)
const produtosPorEmpresa = ref<Record<string, Produto[]>>({})
const carregandoProdutos = ref<Record<string, boolean>>({})

const destinoOpcoes = [
  { value: 'apoio' as DestinoTipo, label: 'Apoio', activeClass: 'bg-blue-500 text-white shadow-sm' },
  { value: 'definitiva' as DestinoTipo, label: 'Definitiva', activeClass: 'bg-red-500 text-white shadow-sm' },
  { value: 'loja' as DestinoTipo, label: 'Outra Loja', activeClass: 'bg-purple-500 text-white shadow-sm' }
]

const outrasEmpresas = computed(() =>
  empresas.value
    .filter(e => e.id !== empresaAtiva.value?.id)
    .map(e => ({ label: e.nome, value: e.id }))
)

const temItensSelecionados = computed(() =>
  itensModal.value.some(i => {
    if (!i.selecionado || i.quantidade <= 0 || i.quantidade > i.saldo_principal) return false
    if (i.destino === 'loja' && (!i.empresa_destino_id || !i.produto_destino_id)) return false
    return true
  })
)

const itensSelecionadosValidos = computed(() =>
  itensModal.value.filter(i => {
    if (!i.selecionado || i.quantidade <= 0 || i.quantidade > i.saldo_principal) return false
    if (i.destino === 'loja' && (!i.empresa_destino_id || !i.produto_destino_id)) return false
    return true
  })
)

const temDefinitiva = computed(() =>
  itensSelecionadosValidos.value.some(i => i.destino === 'definitiva')
)

const itensDefinitivos = computed(() =>
  itensSelecionadosValidos.value.filter(i => i.destino === 'definitiva')
)

// Carregar produtos de uma empresa destino
const carregarProdutosEmpresa = async (empresaId: string) => {
  if (produtosPorEmpresa.value[empresaId] || carregandoProdutos.value[empresaId]) return
  carregandoProdutos.value[empresaId] = true
  try {
    const client = useSupabaseClient()
    const { data, error } = await client
      .from('produtos')
      .select('*, unidade:unidades(*)')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('nome')
    if (error) throw error
    produtosPorEmpresa.value[empresaId] = data as Produto[]
  } catch (error) {
    console.error('Erro ao carregar produtos da empresa destino:', error)
    produtosPorEmpresa.value[empresaId] = []
  } finally {
    carregandoProdutos.value[empresaId] = false
  }
}

const produtosDestinoOptions = (empresaId: string) => {
  const prods = produtosPorEmpresa.value[empresaId] || []
  return prods.map(p => ({
    label: `${p.nome}${p.unidade?.sigla ? ` (${p.unidade.sigla})` : ''}`,
    value: p.id
  }))
}

// Watch empresa_destino_id changes para carregar produtos
watch(itensModal, (itens) => {
  for (const item of itens) {
    if (item.destino === 'loja' && item.empresa_destino_id && !produtosPorEmpresa.value[item.empresa_destino_id]) {
      carregarProdutosEmpresa(item.empresa_destino_id)
    }
  }
}, { deep: true })

watch(modalAberto, async (aberto) => {
  if (aberto) {
    etapa.value = 'selecao'
    itensProcessados.value = []
    produtosPorEmpresa.value = {}
    await carregarSaldos()
  }
})

const carregarSaldos = async () => {
  carregandoSaldos.value = true
  try {
    itensModal.value = await Promise.all(
      props.itensEntrada.map(async (item) => {
        const saldo = await getSaldoProduto(item.produto_id)
        return {
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          unidade_sigla: item.unidade_sigla,
          qtd_entrada: item.quantidade,
          saldo_principal: saldo,
          selecionado: false,
          quantidade: 0,
          destino: 'apoio' as DestinoTipo,
          empresa_destino_id: '',
          produto_destino_id: ''
        }
      })
    )
  } catch (error) {
    console.error('Erro ao carregar saldos:', error)
  } finally {
    carregandoSaldos.value = false
  }
}

const avancar = () => {
  if (temDefinitiva.value) {
    etapa.value = 'confirmarDefinitiva'
  } else {
    processar()
  }
}

const processar = async () => {
  const selecionados = itensSelecionadosValidos.value
  if (selecionados.length === 0) return

  salvando.value = true
  try {
    const hoje = new Date().toISOString().split('T')[0]

    for (const item of selecionados) {
      if (item.destino === 'apoio') {
        await createSaida({
          produto_id: item.produto_id,
          tipo: 'transferencia' as const,
          data: hoje,
          quantidade: item.quantidade,
          observacao: 'Transferência automática pós-entrada'
        })
      } else if (item.destino === 'definitiva') {
        await createSaida({
          produto_id: item.produto_id,
          tipo: 'definitiva' as const,
          data: hoje,
          quantidade: item.quantidade,
          observacao: 'Saída definitiva pós-entrada'
        })
      } else if (item.destino === 'loja') {
        await createTransferenciaLoja(
          item.produto_id,
          item.produto_destino_id,
          item.empresa_destino_id,
          item.quantidade,
          hoje,
          'Transferência entre lojas pós-entrada'
        )
      }
    }

    itensProcessados.value = selecionados
    etapa.value = 'resumo'
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao processar saídas',
      color: 'red'
    })
  } finally {
    salvando.value = false
  }
}

const fechar = () => {
  modalAberto.value = false
}

// Helpers de estilo
const destinoBorderClass = (destino: DestinoTipo) => {
  const map: Record<DestinoTipo, string> = {
    apoio: 'border-blue-200 bg-blue-50/50',
    definitiva: 'border-red-200 bg-red-50/50',
    loja: 'border-purple-200 bg-purple-50/50'
  }
  return map[destino]
}

const resumoCardClass = (destino: DestinoTipo) => {
  const map: Record<DestinoTipo, string> = {
    apoio: 'bg-green-50/50 border-green-200',
    definitiva: 'bg-red-50/50 border-red-200',
    loja: 'bg-purple-50/50 border-purple-200'
  }
  return map[destino]
}

const resumoIcon = (destino: DestinoTipo) => {
  const map: Record<DestinoTipo, string> = {
    apoio: 'i-heroicons-check-circle',
    definitiva: 'i-heroicons-x-circle',
    loja: 'i-heroicons-truck'
  }
  return map[destino]
}

const resumoIconClass = (destino: DestinoTipo) => {
  const map: Record<DestinoTipo, string> = {
    apoio: 'text-green-500',
    definitiva: 'text-red-500',
    loja: 'text-purple-500'
  }
  return map[destino]
}

const resumoTextClass = (destino: DestinoTipo) => {
  const map: Record<DestinoTipo, string> = {
    apoio: 'text-green-700',
    definitiva: 'text-red-700',
    loja: 'text-purple-700'
  }
  return map[destino]
}

const resumoDestinoLabel = (destino: DestinoTipo) => {
  const map: Record<DestinoTipo, string> = {
    apoio: 'Apoio',
    definitiva: 'Definitiva',
    loja: 'Outra Loja'
  }
  return map[destino]
}

const nomeEmpresa = (empresaId: string | undefined) => {
  if (!empresaId) return ''
  return empresas.value.find(e => e.id === empresaId)?.nome || ''
}
</script>
