<template>
  <div class="space-y-6">
    <!-- ============================================ -->
    <!-- ETAPA: PRINCIPAL (lista de contagens)        -->
    <!-- ============================================ -->
    <ContagemLista
      v-if="etapa === 'principal'"
      :contagens="contagensPersistidas"
      :loading="loadingContagens"
      @click-contagem="abrirDetalhes"
      @nova-contagem="abrirModalSetup"
      @gerenciar-setores="slideoverSetoresOpen = true"
    />

    <!-- ============================================ -->
    <!-- ETAPA: DETALHES DE UMA CONTAGEM              -->
    <!-- ============================================ -->
    <ContagemDetalhes
      v-if="etapa === 'detalhes' && contagemSelecionada"
      :contagem="contagemSelecionada"
      :resultados="resultadosContagem"
      :historico="historicoContagem"
      :loading-historico="loadingHistorico"
      @voltar="etapa = 'principal'"
      @ver-progresso="abrirProgressoModal"
      @editar="abrirEditarContagem"
      @excluir="modalExcluirContagemOpen = true"
      @enviar-lembrete="enviarLembreteManual"
    />

    <!-- ============================================ -->
    <!-- ETAPA: CONTAGEM DE UM SETOR (standalone)     -->
    <!-- ============================================ -->
    <ContagemSetorContagem
      v-if="etapa === 'contagem-setor' && contagemSelecionada && setorAtual"
      :contagem-id="contagemSelecionada.id"
      :setor="setorAtual"
      @salvo="onSetorSalvo"
      @voltar="voltarDoSetor"
    />

    <!-- ============================================ -->
    <!-- ETAPA: REVISÃO E CONFIRMAÇÃO                 -->
    <!-- ============================================ -->
    <ContagemRevisao
      v-if="etapa === 'revisao' && contagemSelecionada"
      :contagem-id="contagemSelecionada.id"
      :contagem="contagemSelecionada"
      @salvo="onContagemFinalizada"
      @voltar="abrirProgressoModal"
    />

    <!-- ============================================ -->
    <!-- MODAIS E SLIDEOVERS                          -->
    <!-- ============================================ -->

    <!-- Modal: Ver Progresso -->
    <ContagemProgressoModal
      v-model="progressoModalOpen"
      :contagem="contagemSelecionada"
      @iniciar-setor="iniciarContagemSetor"
      @finalizar="iniciarRevisao"
      @reiniciar="reiniciarContagem"
      @cancelar="cancelarContagem"
    />


    <!-- Slideover: Gerenciar Setores -->
    <ContagemSetorGerenciarModal
      v-model="slideoverSetoresOpen"
      :setores="setores"
      :produtos="produtos"
      :grupos="grupos"
      :subgrupos="subgrupos"
      :setor-produtos-count="setorProdutosCount"
      @atualizado="recarregarSetores"
    />

    <!-- Slideover: Nova Contagem -->
    <USlideover
      v-model="slideoverSetupOpen"
      :ui="{
        width: 'max-w-xl',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800'
      }"
    >
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between px-6 py-4 border-b border-operacao-200">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-guardian-100 rounded-lg">
              <UIcon :name="editandoContagemId ? 'i-heroicons-pencil-square' : 'i-heroicons-clipboard-document-check'" class="w-5 h-5 text-guardian-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">{{ editandoContagemId ? 'Editar Contagem' : 'Nova Contagem' }}</h3>
              <p class="text-xs text-operacao-400">{{ editandoContagemId ? 'Altere as configurações da contagem' : 'Configure e selecione os setores para contar' }}</p>
            </div>
          </div>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="slideoverSetupOpen = false" />
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <UFormGroup label="Nome da Contagem" required>
            <UInput v-model="setupNomeContagem" placeholder="Ex: Contagem semanal de bebidas" />
          </UFormGroup>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormGroup label="Data da Contagem" required>
              <UInput v-model="setupData" type="date" />
            </UFormGroup>
            <UFormGroup label="Recorrência" required>
              <USelect v-model="setupRecorrencia" :options="opcoesRecorrencia" option-attribute="label" value-attribute="value" />
            </UFormGroup>
          </div>

          <!-- Campos dinâmicos de recorrência -->
          <template v-if="setupRecorrencia && setupRecorrencia !== 'nenhuma'">
            <UFormGroup v-if="setupRecorrencia === 'diaria'" label="Horário da Notificação" required>
              <UInput v-model="setupHorarioNotificacao" type="time" />
            </UFormGroup>

            <div v-if="setupRecorrencia === 'semanal' || setupRecorrencia === 'quinzenal'">
              <UFormGroup label="Dias em que ocorre" required>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="dia in diasDaSemana"
                    :key="dia.value"
                    class="px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all min-w-[52px] text-center"
                    :class="setupDiasSemana.has(dia.value)
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-operacao-200 bg-white text-operacao-400 hover:border-operacao-300 hover:bg-operacao-50'"
                    @click="toggleDiaSemana(dia.value)"
                  >
                    {{ dia.label }}
                  </button>
                </div>
              </UFormGroup>
              <UFormGroup label="Horário da Notificação" required class="mt-4">
                <UInput v-model="setupHorarioNotificacao" type="time" />
              </UFormGroup>
            </div>

            <template v-if="setupRecorrencia === 'mensal'">
              <UFormGroup label="Ocorre em" required>
                <div class="grid grid-cols-2 gap-3">
                  <USelect v-model="setupMensalPosicao" :options="opcoesMensalPosicao" option-attribute="label" value-attribute="value" />
                  <USelect v-model="setupMensalDia" :options="opcoesMensalDia" option-attribute="label" value-attribute="value" />
                </div>
              </UFormGroup>
              <UFormGroup label="Horário da Notificação" required>
                <UInput v-model="setupHorarioNotificacao" type="time" />
              </UFormGroup>
            </template>

            <p class="text-xs text-operacao-400 -mt-2">
              Nos dias e horário definidos, o responsável receberá uma notificação para realizar a contagem.
            </p>
          </template>

          <!-- Responsável -->
          <div>
            <h4 class="font-semibold text-operacao-800 mb-1">Responsável</h4>
            <p class="text-sm text-operacao-400 mb-3">Quem vai realizar esta contagem?</p>
            <div class="flex items-end gap-2 mb-3">
              <div class="flex-1 grid grid-cols-2 gap-2">
                <UInput v-model="novoResponsavelNome" placeholder="Nome" size="sm" icon="i-heroicons-user" @keydown.enter="adicionarResponsavel" />
                <UInput v-model="novoResponsavelTelefone" placeholder="Telefone" size="sm" icon="i-heroicons-phone" @keydown.enter="adicionarResponsavel" />
              </div>
              <UButton color="gray" variant="solid" size="sm" :disabled="!novoResponsavelNome.trim() || !novoResponsavelTelefone.trim()" @click="adicionarResponsavel">
                <UIcon name="i-heroicons-plus" class="w-4 h-4" />
              </UButton>
            </div>
            <div v-if="responsaveis.length > 0" class="flex flex-wrap gap-2">
              <button
                v-for="resp in responsaveis"
                :key="resp.nome + resp.telefone"
                class="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-sm transition-all border"
                :class="setupResponsavel?.nome === resp.nome && setupResponsavel?.telefone === resp.telefone
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-100'
                  : 'border-operacao-200 bg-operacao-50 text-operacao-500 hover:border-operacao-300 hover:bg-operacao-100'"
                @click="setupResponsavel = (setupResponsavel?.nome === resp.nome && setupResponsavel?.telefone === resp.telefone) ? null : resp"
              >
                <span
                  class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase"
                  :class="setupResponsavel?.nome === resp.nome && setupResponsavel?.telefone === resp.telefone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-operacao-200 text-operacao-400'"
                >
                  {{ resp.nome.charAt(0) }}
                </span>
                <span class="font-medium">{{ resp.nome }}</span>
                <span class="text-xs opacity-60">{{ resp.telefone }}</span>
                <UIcon
                  v-if="setupResponsavel?.nome === resp.nome && setupResponsavel?.telefone === resp.telefone"
                  name="i-heroicons-check-circle-solid"
                  class="w-4 h-4 text-emerald-500"
                />
              </button>
            </div>
          </div>

          <div class="border-t border-operacao-200" />

          <!-- Tipo + Setores -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <h4 class="font-semibold text-operacao-800">Tipo e Setores</h4>
              <span v-if="setupSetoresSelecionados.size > 0" class="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                {{ setupSetoresSelecionados.size }}/{{ setoresFiltradosSetup.length }}
              </span>
            </div>
            <p class="text-sm text-operacao-400 mb-3">Escolha o tipo de contagem e os setores.</p>

            <!-- Seletor de tipo -->
            <div v-if="!editandoContagemId" class="grid grid-cols-3 gap-2 mb-4">
              <button
                v-for="opt in [
                  { value: 'principal', label: 'Estoque Principal', icon: 'i-heroicons-building-storefront' },
                  { value: 'apoio', label: 'Estoque de Apoio', icon: 'i-heroicons-archive-box' },
                  { value: 'inventario', label: 'Inventário', icon: 'i-heroicons-clipboard-document-list' }
                ]"
                :key="opt.value"
                class="flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg text-sm font-medium border-2 transition-all text-center"
                :class="setupTipoContagem === opt.value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-operacao-200 bg-white text-operacao-400 hover:border-operacao-300 hover:bg-operacao-50'"
                @click="setupTipoContagem = opt.value as TipoContagem"
              >
                <UIcon :name="opt.icon" class="w-5 h-5" />
                <span>{{ opt.label }}</span>
              </button>
            </div>
            <div v-else class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-operacao-100 text-operacao-600 text-sm font-medium mb-4">
              <UIcon :name="setupTipoContagem === 'apoio' ? 'i-heroicons-archive-box' : setupTipoContagem === 'inventario' ? 'i-heroicons-clipboard-document-list' : 'i-heroicons-building-storefront'" class="w-4 h-4" />
              {{ setupTipoContagem === 'apoio' ? 'Estoque de Apoio' : setupTipoContagem === 'inventario' ? 'Inventário' : 'Estoque Principal' }}
              <span class="text-xs text-operacao-400">(não editável)</span>
            </div>

            <UInput
              v-if="setores.length > 5"
              v-model="setupBuscaSetor"
              placeholder="Filtrar setores..."
              icon="i-heroicons-magnifying-glass"
              size="sm"
              class="mb-3"
            />

            <div v-if="setoresFiltradosSetup.length === 0" class="text-center py-6 text-operacao-400">
              <UIcon name="i-heroicons-map-pin" class="w-8 h-8 mb-2 mx-auto" />
              <p class="text-sm font-medium">Nenhum setor encontrado</p>
              <p class="text-xs mt-1">Crie setores na tela principal antes de criar uma contagem</p>
            </div>

            <div v-else class="rounded-lg border border-operacao-200 divide-y divide-operacao-100 overflow-hidden">
              <label
                v-for="setor in setoresFiltradosSetup"
                :key="setor.id"
                class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                :class="setupSetoresSelecionados.has(setor.id) ? 'bg-emerald-50/60' : 'hover:bg-operacao-50'"
              >
                <div
                  class="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all"
                  :class="setupSetoresSelecionados.has(setor.id)
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-operacao-300 bg-white'"
                  @click.prevent="toggleSetorSelecionado(setor.id)"
                >
                  <UIcon v-if="setupSetoresSelecionados.has(setor.id)" name="i-heroicons-check" class="w-3.5 h-3.5 text-white" />
                </div>
                <div class="flex-1 min-w-0" @click.prevent="toggleSetorSelecionado(setor.id)">
                  <p class="text-sm font-medium text-operacao-800">
                    {{ setor.nome }}
                    <span v-if="setupTipoContagem === 'inventario'" class="text-[10px] font-normal text-operacao-400 ml-1">{{ setor.tipo === 'apoio' ? 'Apoio' : 'Principal' }}</span>
                  </p>
                </div>
                <span class="text-xs text-operacao-400 tabular-nums flex-shrink-0">
                  {{ (setorProdutosPorSetor[setor.id] || []).length }} {{ (setorProdutosPorSetor[setor.id] || []).length === 1 ? 'produto' : 'produtos' }}
                </span>
              </label>
            </div>

            <div v-if="setoresFiltradosSetup.length > 1" class="mt-2 flex justify-end">
              <button
                class="text-xs text-operacao-400 hover:text-operacao-500 transition-colors underline underline-offset-2"
                @click="setupSetoresSelecionados.size === setoresFiltradosSetup.length ? setupSetoresSelecionados = new Set() : setupSetoresSelecionados = new Set(setoresFiltradosSetup.map(s => s.id))"
              >
                {{ setupSetoresSelecionados.size === setoresFiltradosSetup.length ? 'Desmarcar todos' : 'Selecionar todos' }}
              </button>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-operacao-200 bg-white">
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="slideoverSetupOpen = false">Cancelar</UButton>
            <UButton
              color="primary"
              :disabled="!setupNomeContagem.trim() || !setupRecorrencia || !setupResponsavel || setupSetoresSelecionados.size === 0"
              :loading="loadingSetup"
              @click="salvarContagem"
            >
              <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
              {{ editandoContagemId ? 'Salvar' : 'Criar Contagem' }}
            </UButton>
          </div>
        </div>
      </div>
    </USlideover>

    <!-- Modal: Excluir contagem persistida -->
    <UModal v-model="modalExcluirContagemOpen" :ui="{ overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' } }">
      <UCard :ui="{ ring: 'ring-0', shadow: '', divide: 'divide-operacao-100' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Excluir Contagem</h3>
        </template>
        <p>Tem certeza que deseja excluir a contagem <strong>{{ contagemSelecionada?.nome }}</strong>?</p>
        <p class="text-sm text-red-500 mt-2">Esta ação não pode ser desfeita.</p>
        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalExcluirContagemOpen = false">Cancelar</UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="excluindo" @click="excluirContagemConfirmada">Excluir</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Sucesso -->
    <UModal v-model="modalSucessoOpen" :ui="{ overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' } }">
      <UCard :ui="{ ring: 'ring-0', shadow: '', divide: 'divide-operacao-100' }">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-controle-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-check-circle" class="w-6 h-6 text-controle-600" />
            </div>
            <h3 class="text-lg font-semibold">Contagem salva!</h3>
          </div>
        </template>
        <p>{{ resumoSalvamento }}</p>
        <template #footer>
          <div class="flex justify-end">
            <UButton color="primary" @click="modalSucessoOpen = false">OK</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Grupo, Subgrupo, Produto, Setor, Contagem, Ajuste, SaldoEstoque, ContagemHistorico, ContagemResultado, TipoContagem } from '~/types'

const toast = useToast()
const {
  getGrupos, getSubgrupos, getProdutos,
  getSaldoEstoque,
  getAjustes,
  getSetores, countSetorProdutos, getAllSetorProdutos,
  getContagens, createContagem, updateContagem, updateContagemStatus, prepararProximoCiclo, deleteContagem,
  deleteContagemItens, resetContagemSetores,
  getContagemResultados,
  getResponsaveis, createResponsavel
} = useEstoque()
const { empresaId } = useEmpresa()

// ==========================================
// ESTADO DE NAVEGAÇÃO
// ==========================================
type Etapa = 'principal' | 'detalhes' | 'contagem-setor' | 'revisao'
const etapa = ref<Etapa>('principal')

// ==========================================
// DADOS BASE
// ==========================================
const grupos = ref<Grupo[]>([])
const subgrupos = ref<Subgrupo[]>([])
const produtos = ref<Produto[]>([])
const setores = ref<Setor[]>([])
const saldos = ref<SaldoEstoque[]>([])
const setorProdutosCount = ref<Record<string, number>>({})

// ==========================================
// CONTAGENS
// ==========================================
const contagensPersistidas = ref<Contagem[]>([])
const loadingContagens = ref(true)
const contagemSelecionada = ref<Contagem | null>(null)

// ==========================================
// SETOR ATUAL (para etapa contagem-setor)
// ==========================================
const setorAtual = ref<{ id: string; nome: string } | null>(null)

// ==========================================
// HISTÓRICO
// ==========================================
const historicoContagem = ref<ContagemHistorico[]>([])
const resultadosContagem = ref<ContagemResultado[]>([])
const loadingHistorico = ref(false)

// ==========================================
// MODAIS / SLIDEOVERS
// ==========================================
const slideoverSetoresOpen = ref(false)
const slideoverSetupOpen = ref(false)
const editandoContagemId = ref<string | null>(null)
const progressoModalOpen = ref(false)
const modalExcluirContagemOpen = ref(false)
const modalSucessoOpen = ref(false)
const excluindo = ref(false)
const resumoSalvamento = ref('')
const loadingEnviarWhatsApp = ref(false)

// ==========================================
// SETUP NOVA CONTAGEM
// ==========================================
const setupNomeContagem = ref('')
const setupData = ref(new Date().toISOString().split('T')[0])
const setupRecorrencia = ref('nenhuma')
const setupResponsavel = ref<{ nome: string; telefone: string } | null>(null)
const loadingSetup = ref(false)
const setupSetoresSelecionados = ref<Set<string>>(new Set())
const setupBuscaSetor = ref('')
const setupHorarioNotificacao = ref('07:00')
const setupDiasSemana = ref<Set<string>>(new Set())
const setupMensalPosicao = ref('primeira')
const setupMensalDia = ref('segunda')
const setupTipoContagem = ref<TipoContagem>('principal')

// Responsáveis
const responsaveis = ref<{ id?: string; nome: string; telefone: string }[]>([])
const novoResponsavelNome = ref('')
const novoResponsavelTelefone = ref('')

// Dados de setores para o setup
const allSetorProdutosData = ref<{ id: string; setor_id: string; produto_id: string; produto: { id: string; nome: string } | null }[]>([])

// ==========================================
// CONSTANTES
// ==========================================
const opcoesRecorrencia = [
  { label: 'Não definida', value: 'nenhuma' },
  { label: 'Diária', value: 'diaria' },
  { label: 'Semanal', value: 'semanal' },
  { label: 'A cada duas semanas', value: 'quinzenal' },
  { label: 'Mensal', value: 'mensal' }
]

const opcoesHorario = Array.from({ length: 16 }, (_, i) => {
  const h = i + 5
  const label = `${String(h).padStart(2, '0')}:00`
  return { label, value: label }
})

const diasDaSemana = [
  { label: 'SEG', value: 'seg' },
  { label: 'TER', value: 'ter' },
  { label: 'QUA', value: 'qua' },
  { label: 'QUI', value: 'qui' },
  { label: 'SEX', value: 'sex' },
  { label: 'SÁB', value: 'sab' },
  { label: 'DOM', value: 'dom' }
]

const opcoesMensalPosicao = [
  { label: 'Primeira(o)', value: 'primeira' },
  { label: 'Última(o)', value: 'ultima' }
]

const opcoesMensalDia = [
  { label: 'domingo do mês', value: 'domingo' },
  { label: 'segunda-feira do mês', value: 'segunda' },
  { label: 'terça-feira do mês', value: 'terca' },
  { label: 'quarta-feira do mês', value: 'quarta' },
  { label: 'quinta-feira do mês', value: 'quinta' },
  { label: 'sexta-feira do mês', value: 'sexta' },
  { label: 'sábado do mês', value: 'sabado' },
  { label: 'dia do mês', value: 'dia' }
]

// ==========================================
// COMPUTED
// ==========================================
const setorProdutosPorSetor = computed(() => {
  const map: Record<string, { id: string; nome: string }[]> = {}
  for (const sp of allSetorProdutosData.value) {
    if (!map[sp.setor_id]) map[sp.setor_id] = []
    if (sp.produto) map[sp.setor_id].push(sp.produto)
  }
  return map
})

const setoresFiltradosSetup = computed(() => {
  let lista = setores.value
  // Filtrar por tipo da contagem (exceto inventário que mostra todos)
  if (setupTipoContagem.value !== 'inventario') {
    lista = lista.filter(s => s.tipo === setupTipoContagem.value)
  }
  if (setupBuscaSetor.value) {
    const term = setupBuscaSetor.value.toLowerCase()
    lista = lista.filter(s => s.nome.toLowerCase().includes(term))
  }
  return lista
})

// ==========================================
// CARREGAMENTO DE DADOS
// ==========================================
const carregarDadosBase = async () => {
  try {
    const [g, s, p, st, counts] = await Promise.all([
      getGrupos(),
      getSubgrupos(),
      getProdutos(),
      getSetores().catch(() => [] as Setor[]),
      countSetorProdutos().catch(() => ({} as Record<string, number>))
    ])
    grupos.value = g
    subgrupos.value = s
    produtos.value = p
    setores.value = st
    setorProdutosCount.value = counts
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar dados', color: 'red' })
  }
}

const carregarContagens = async () => {
  try {
    loadingContagens.value = true
    contagensPersistidas.value = await getContagens()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar contagens', color: 'red' })
  } finally {
    loadingContagens.value = false
  }
}

const carregarResponsaveis = async () => {
  try {
    responsaveis.value = await getResponsaveis()
  } catch (error: any) {
  }
}

const carregarHistorico = async () => {
  if (!contagemSelecionada.value) return
  try {
    loadingHistorico.value = true

    // 1. Carregar resultados (snapshots das contagens novas)
    const resultados = await getContagemResultados(contagemSelecionada.value.id)
    resultadosContagem.value = [...resultados].sort((a, b) => b.finalizado_em.localeCompare(a.finalizado_em))

    // 2. Histórico legado (contagens antigas, sem snapshot — baseado em ajustes)
    const [ajustes, todosSaldos] = await Promise.all([
      getAjustes({}),
      getSaldoEstoque()
    ])
    saldos.value = todosSaldos

    const nomeContagem = contagemSelecionada.value.nome
    // Pegar datas dos resultados para excluí-las do histórico legado
    const datasResultados = new Set(resultados.map(r => r.data))

    const ajustesFiltrados = ajustes.filter((a: Ajuste) =>
      a.motivo?.includes(nomeContagem) && !datasResultados.has(a.data)
    )

    const map = new Map<string, ContagemHistorico>()
    for (const ajuste of ajustesFiltrados) {
      const key = `${ajuste.data}||${ajuste.motivo || 'Sem motivo'}`
      if (!map.has(key)) {
        map.set(key, {
          data: ajuste.data,
          motivo: ajuste.motivo || 'Sem motivo',
          tipo_contagem: 'principal',
          grupo_nome: '',
          total_itens: 0,
          total_sobras: 0,
          total_faltas: 0,
          total_zerados: 0,
          valor_total_divergencia: 0,
          ajustes: []
        })
      }
      const contagem = map.get(key)!
      contagem.ajustes.push(ajuste)
      contagem.total_itens++
      const qty = Number(ajuste.quantidade)
      if (qty > 0) contagem.total_sobras++
      else if (qty < 0) contagem.total_faltas++
      else contagem.total_zerados++
      const saldo = todosSaldos.find((s: SaldoEstoque) => s.produto_id === ajuste.produto_id)
      contagem.valor_total_divergencia += qty * (saldo?.custo_medio || 0)
    }

    historicoContagem.value = Array.from(map.values()).sort((a, b) => b.data.localeCompare(a.data))
  } catch (error: any) {
  } finally {
    loadingHistorico.value = false
  }
}

// ==========================================
// AÇÕES DE NAVEGAÇÃO
// ==========================================
const abrirDetalhes = async (contagem: Contagem) => {
  contagemSelecionada.value = contagem
  etapa.value = 'detalhes'
  await carregarHistorico()
}

const abrirProgressoModal = async () => {
  if (!contagemSelecionada.value) return
  // Atualizar status para em_andamento se ainda não está
  if (contagemSelecionada.value.status !== 'em_andamento' && contagemSelecionada.value.status !== 'finalizada') {
    try {
      await updateContagemStatus(contagemSelecionada.value.id, 'em_andamento')
      contagemSelecionada.value.status = 'em_andamento'
    } catch {}
  }
  progressoModalOpen.value = true
}

const iniciarContagemSetor = (setor: any) => {
  setorAtual.value = { id: setor.id, nome: setor.nome }
  progressoModalOpen.value = false
  etapa.value = 'contagem-setor'
}

const onSetorSalvo = async (progresso: number) => {
  // Recarregar contagem para atualizar progresso dos setores
  await carregarContagens()
  if (contagemSelecionada.value) {
    const atualizada = contagensPersistidas.value.find(c => c.id === contagemSelecionada.value!.id)
    if (atualizada) contagemSelecionada.value = atualizada
  }
  // Voltar para o modal de progresso
  etapa.value = 'detalhes'
  progressoModalOpen.value = true
}

const voltarDoSetor = () => {
  etapa.value = 'detalhes'
  progressoModalOpen.value = true
}

const iniciarRevisao = () => {
  progressoModalOpen.value = false
  etapa.value = 'revisao'
}

const onContagemFinalizada = async () => {
  // Se a contagem é recorrente, resetar para o próximo ciclo
  const contagem = contagemSelecionada.value
  if (contagem && contagem.recorrencia && contagem.recorrencia !== 'nenhuma') {
    try {
      await prepararProximoCiclo(contagem.id)
    } catch (err) {
      console.error('Erro ao preparar próximo ciclo:', err)
    }
  }

  resumoSalvamento.value = 'A contagem foi finalizada e os ajustes foram registrados com sucesso.'
  modalSucessoOpen.value = true
  contagemSelecionada.value = null
  etapa.value = 'principal'
  await carregarContagens()
}

const reiniciarContagem = async () => {
  if (!contagemSelecionada.value) return
  try {
    await deleteContagemItens(contagemSelecionada.value.id)
    await resetContagemSetores(contagemSelecionada.value.id)
    await updateContagemStatus(contagemSelecionada.value.id, 'em_andamento')
    toast.add({ title: 'Reiniciada', description: 'Contagem reiniciada com sucesso', color: 'green' })
    progressoModalOpen.value = false
    await carregarContagens()
    const atualizada = contagensPersistidas.value.find(c => c.id === contagemSelecionada.value!.id)
    if (atualizada) contagemSelecionada.value = atualizada
    progressoModalOpen.value = true
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message, color: 'red' })
  }
}

const cancelarContagem = async () => {
  if (!contagemSelecionada.value) return
  try {
    await deleteContagemItens(contagemSelecionada.value.id)
    await resetContagemSetores(contagemSelecionada.value.id)
    await updateContagemStatus(contagemSelecionada.value.id, 'aguardando')
    toast.add({ title: 'Cancelada', description: 'Contagem cancelada', color: 'yellow' })
    progressoModalOpen.value = false
    await carregarContagens()
    const atualizada = contagensPersistidas.value.find(c => c.id === contagemSelecionada.value!.id)
    if (atualizada) contagemSelecionada.value = atualizada
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message, color: 'red' })
  }
}

// ==========================================
// AÇÕES DE CONTAGEM
// ==========================================

const excluirContagemConfirmada = async () => {
  if (!contagemSelecionada.value) return
  try {
    excluindo.value = true
    await deleteContagem(contagemSelecionada.value.id)
    toast.add({ title: 'Sucesso', description: 'Contagem excluída', color: 'green' })
    modalExcluirContagemOpen.value = false
    contagemSelecionada.value = null
    etapa.value = 'principal'
    await carregarContagens()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao excluir contagem', color: 'red' })
  } finally {
    excluindo.value = false
  }
}

// ==========================================
// ENVIAR LEMBRETE WHATSAPP
// ==========================================
const enviarLembreteManual = async () => {
  if (!contagemSelecionada.value) return
  const c = contagemSelecionada.value
  if (!c.responsavel_telefone || !c.responsavel_nome) {
    toast.add({ title: 'Aviso', description: 'Esta contagem não possui responsável com telefone cadastrado.', color: 'yellow' })
    return
  }
  try {
    loadingEnviarWhatsApp.value = true
    const setoresNomes = (c.contagem_setores || []).map((cs: any) => cs.setor?.nome).filter(Boolean)
    const recLabels: Record<string, string> = { diaria: 'Diária', semanal: 'Semanal', quinzenal: 'Quinzenal', mensal: 'Mensal' }
    const setoresTexto = setoresNomes.length > 0 ? setoresNomes.map((s: string) => `  • ${s}`).join('\n') : '  • (setores não disponíveis)'
    const link = c.token
      ? `https://www.cmv360app.com.br/contagem/${c.token}`
      : `https://www.cmv360app.com.br/movimentos/contagens`
    const mensagem = [
      `📋 *Lembrete de Contagem*`, ``,
      `Olá, *${c.responsavel_nome}*!`, `Está na hora de realizar a contagem:`, ``,
      `📌 *${c.nome}*`,
      `🔄 Recorrência: ${recLabels[c.recorrencia || ''] || c.recorrencia || 'Nenhuma'}`,
      `⏰ Horário: ${c.horario_notificacao || '07:00'}`, ``,
      `📍 *Setores:*`, setoresTexto, ``,
      `👉 *Acesse e inicie a contagem:*`,
      link
    ].join('\n')
    await $fetch('/api/whatsapp/enviar', { method: 'POST', body: { phone: c.responsavel_telefone, message: mensagem } })
    toast.add({ title: 'Enviado!', description: `Lembrete enviado para ${c.responsavel_nome} via WhatsApp`, color: 'green' })
  } catch (error: any) {
    toast.add({ title: 'Erro ao enviar', description: error?.data?.message || error.message || 'Erro ao enviar WhatsApp', color: 'red' })
  } finally {
    loadingEnviarWhatsApp.value = false
  }
}

// ==========================================
// SETUP NOVA CONTAGEM
// ==========================================
const toggleDiaSemana = (dia: string) => {
  const novo = new Set(setupDiasSemana.value)
  if (novo.has(dia)) novo.delete(dia)
  else novo.add(dia)
  setupDiasSemana.value = novo
}

const toggleSetorSelecionado = (setorId: string) => {
  const newSet = new Set(setupSetoresSelecionados.value)
  if (newSet.has(setorId)) newSet.delete(setorId)
  else newSet.add(setorId)
  setupSetoresSelecionados.value = newSet
}

watch(() => setupRecorrencia.value, () => {
  setupHorarioNotificacao.value = '07:00'
  setupDiasSemana.value = new Set()
  setupMensalPosicao.value = 'primeira'
  setupMensalDia.value = 'segunda'
})

// Quando tipo muda, auto-selecionar setores adequados
watch(() => setupTipoContagem.value, () => {
  if (!editandoContagemId.value) {
    if (setupTipoContagem.value === 'inventario') {
      // Inventário: pré-seleciona todos os setores
      nextTick(() => {
        setupSetoresSelecionados.value = new Set(setoresFiltradosSetup.value.map(s => s.id))
      })
    } else {
      setupSetoresSelecionados.value = new Set()
    }
  }
})

const adicionarResponsavel = async () => {
  if (!novoResponsavelNome.value.trim() || !novoResponsavelTelefone.value.trim()) return
  try {
    const novo = await createResponsavel({
      nome: novoResponsavelNome.value.trim(),
      telefone: novoResponsavelTelefone.value.trim()
    })
    responsaveis.value.push(novo)
    setupResponsavel.value = novo
    novoResponsavelNome.value = ''
    novoResponsavelTelefone.value = ''
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar responsável', color: 'red' })
  }
}

const abrirModalSetup = async () => {
  editandoContagemId.value = null
  setupData.value = new Date().toISOString().split('T')[0]
  setupNomeContagem.value = ''
  setupTipoContagem.value = 'principal'
  setupRecorrencia.value = 'nenhuma'
  setupHorarioNotificacao.value = '07:00'
  setupDiasSemana.value = new Set()
  setupMensalPosicao.value = 'primeira'
  setupMensalDia.value = 'segunda'
  setupResponsavel.value = null
  setupSetoresSelecionados.value = new Set()
  setupBuscaSetor.value = ''
  slideoverSetupOpen.value = true
  try { allSetorProdutosData.value = await getAllSetorProdutos() } catch {}
}

const abrirEditarContagem = async () => {
  const c = contagemSelecionada.value
  if (!c) return

  editandoContagemId.value = c.id
  setupNomeContagem.value = c.nome || ''
  setupData.value = c.data || new Date().toISOString().split('T')[0]
  setupBuscaSetor.value = ''
  // Mapear legacy 'estoque' → 'principal'
  const tipoRaw = c.tipo as string
  setupTipoContagem.value = tipoRaw === 'apoio' ? 'apoio' : tipoRaw === 'inventario' ? 'inventario' : 'principal'

  // Setar recorrência primeiro (dispara watcher que reseta campos dependentes)
  setupRecorrencia.value = c.recorrencia || 'nenhuma'
  await nextTick()

  // Agora popular campos dependentes (depois do watcher ter rodado)
  setupHorarioNotificacao.value = c.horario_notificacao || '07:00'
  setupDiasSemana.value = new Set(c.dias_semana || [])
  setupMensalPosicao.value = c.mensal_posicao || 'primeira'
  setupMensalDia.value = c.mensal_dia || 'segunda'

  // Responsável
  if (c.responsavel_nome) {
    const found = responsaveis.value.find(
      r => r.nome === c.responsavel_nome && r.telefone === c.responsavel_telefone
    )
    setupResponsavel.value = found || { nome: c.responsavel_nome, telefone: c.responsavel_telefone || '' }
  } else {
    setupResponsavel.value = null
  }

  // Setores
  const ids = (c.contagem_setores || []).map((cs: any) => cs.setor_id)
  setupSetoresSelecionados.value = new Set(ids)

  slideoverSetupOpen.value = true
  try { allSetorProdutosData.value = await getAllSetorProdutos() } catch {}
}

const salvarContagem = async () => {
  if (!setupNomeContagem.value.trim() || !setupRecorrencia.value || !setupResponsavel.value || setupSetoresSelecionados.value.size === 0) return
  try {
    loadingSetup.value = true
    const diasSemanaArr = Array.from(setupDiasSemana.value)
    const setorIds = Array.from(setupSetoresSelecionados.value)

    if (editandoContagemId.value) {
      // Modo edição
      await updateContagem(
        editandoContagemId.value,
        {
          nome: setupNomeContagem.value.trim(),
          recorrencia: setupRecorrencia.value,
          horario_notificacao: setupHorarioNotificacao.value,
          dias_semana: diasSemanaArr.length > 0 ? diasSemanaArr : undefined,
          mensal_posicao: setupRecorrencia.value === 'mensal' ? setupMensalPosicao.value : undefined,
          mensal_dia: setupRecorrencia.value === 'mensal' ? setupMensalDia.value : undefined,
          responsavel_nome: setupResponsavel.value.nome,
          responsavel_telefone: setupResponsavel.value.telefone,
          responsavel_id: (setupResponsavel.value as any).id || undefined
        },
        setorIds
      )
      slideoverSetupOpen.value = false
      toast.add({ title: 'Sucesso', description: 'Contagem atualizada com sucesso', color: 'green' })
      await carregarContagens()
      // Atualizar contagem selecionada se estiver nos detalhes
      if (contagemSelecionada.value?.id === editandoContagemId.value) {
        const atualizada = contagensPersistidas.value.find(c => c.id === editandoContagemId.value)
        if (atualizada) contagemSelecionada.value = atualizada
      }
      editandoContagemId.value = null
    } else {
      // Modo criação
      await createContagem(
        {
          nome: setupNomeContagem.value.trim(),
          tipo: setupTipoContagem.value,
          data: setupData.value,
          recorrencia: setupRecorrencia.value,
          horario_notificacao: setupHorarioNotificacao.value,
          dias_semana: diasSemanaArr.length > 0 ? diasSemanaArr : undefined,
          mensal_posicao: setupRecorrencia.value === 'mensal' ? setupMensalPosicao.value : undefined,
          mensal_dia: setupRecorrencia.value === 'mensal' ? setupMensalDia.value : undefined,
          responsavel_nome: setupResponsavel.value.nome,
          responsavel_telefone: setupResponsavel.value.telefone,
          responsavel_id: (setupResponsavel.value as any).id || undefined
        },
        setorIds
      )
      slideoverSetupOpen.value = false
      toast.add({ title: 'Sucesso', description: 'Contagem criada com sucesso', color: 'green' })
      await carregarContagens()
    }
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar contagem', color: 'red' })
  } finally {
    loadingSetup.value = false
  }
}

// ==========================================
// RECARREGAR SETORES (após gerenciar)
// ==========================================
const recarregarSetores = async () => {
  try {
    const [st, counts] = await Promise.all([
      getSetores().catch(() => [] as Setor[]),
      countSetorProdutos().catch(() => ({} as Record<string, number>))
    ])
    setores.value = st
    setorProdutosCount.value = counts
  } catch {}
}

// ==========================================
// REALTIME
// ==========================================
const { onTableChange } = useRealtime()
onTableChange(['contagens', 'contagem_setores', 'contagem_itens'], () => carregarContagens())
onTableChange(['produtos', 'grupos', 'subgrupos', 'setores', 'setor_produtos'], () => carregarDadosBase())
onTableChange('responsaveis', () => carregarResponsaveis())
onTableChange('ajustes', () => carregarContagens())

// ==========================================
// INIT
// ==========================================
watch(empresaId, async () => {
  if (empresaId.value) {
    await carregarDadosBase()
    await Promise.all([
      carregarContagens(),
      carregarResponsaveis()
    ])
  }
}, { immediate: true })
</script>
