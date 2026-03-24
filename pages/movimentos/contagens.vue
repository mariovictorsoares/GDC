<template>
  <div class="space-y-6">
    <!-- ============================================ -->
    <!-- ETAPA: PRINCIPAL (3 cards fixos)              -->
    <!-- ============================================ -->
    <div v-if="etapa === 'principal'" class="flex flex-col h-full">
      <!-- Toolbar -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-semibold text-[#5a5a66]">Contagens</h1>
        <UButton color="white" :ui="{ color: { white: { solid: 'shadow-sm ring-1 ring-inset ring-[#EBEBED] text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-guardian-500' } } }" @click="slideoverSetoresOpen = true">
          <UIcon name="i-heroicons-map-pin" class="w-4 h-4 mr-1.5 text-operacao-400" />
          Gerenciar Setores
        </UButton>
      </div>

      <!-- Contagens -->
      <div class="flex flex-col gap-4">
        <!-- Skeleton loading -->
        <template v-if="loadingContagens">
          <div
            v-for="i in 3"
            :key="'skeleton-' + i"
            class="flex rounded-xl bg-white ring-1 ring-[#EBEBED] shadow-sm overflow-hidden"
          >
            <div class="w-[3px] flex-shrink-0 bg-gray-200 animate-pulse" />
            <div class="flex items-center gap-6 px-6 py-4 flex-1 min-w-0">
              <div class="flex items-center gap-3.5 min-w-0 w-48 flex-shrink-0">
                <div class="w-10 h-10 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
                <div class="min-w-0 space-y-2">
                  <div class="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                  <div class="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-x-8 gap-y-2.5 flex-1 min-w-0">
                <div v-for="j in 4" :key="j" class="min-w-0 space-y-1.5">
                  <div class="h-2.5 w-20 bg-gray-100 rounded animate-pulse" />
                  <div class="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div class="flex items-center flex-shrink-0">
                <div class="h-8 w-24 bg-gray-200 rounded-md animate-pulse" />
              </div>
            </div>
          </div>
        </template>

        <!-- Cards reais -->
        <template v-else>
          <div
            v-for="c in contagensFixas"
            :key="c.tipo"
            class="flex rounded-xl bg-white ring-1 ring-[#EBEBED] shadow-sm hover:shadow-md overflow-hidden transition-shadow duration-200"
            :class="c.configurada ? 'cursor-pointer' : ''"
            @click="c.contagem && c.configurada && abrirDetalhes(c.contagem)"
          >
            <!-- Accent -->
            <div class="w-[3px] flex-shrink-0" :class="c.accentClass" />

            <!-- Content -->
            <div class="flex items-center gap-6 px-6 py-4 flex-1 min-w-0">
              <!-- Icon + title -->
              <div class="flex items-center gap-3.5 min-w-0 w-48 flex-shrink-0">
                <div class="w-10 h-10 rounded-lg bg-operacao-100/70 flex items-center justify-center flex-shrink-0">
                  <UIcon :name="c.icon" class="w-5 h-5 text-[#5a5a66]" />
                </div>
                <div class="min-w-0">
                  <h3 class="text-sm font-medium text-[#5a5a66] truncate">{{ c.label }}</h3>
                  <p class="text-xs text-operacao-400 mt-0.5">{{ c.setoresCount }} {{ c.setoresCount === 1 ? 'setor' : 'setores' }}</p>
                </div>
              </div>

              <!-- Info grid 2x2 -->
              <div class="grid grid-cols-2 gap-x-8 gap-y-2.5 flex-1 min-w-0">
                <div class="min-w-0">
                  <p class="text-[10px] uppercase tracking-wider text-operacao-400 font-medium mb-0.5">Recorrência</p>
                  <p class="text-sm font-medium truncate" :class="c.configurada ? 'text-[#5a5a66]' : 'text-operacao-300'">{{ c.recorrenciaLabel }}</p>
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] uppercase tracking-wider text-operacao-400 font-medium mb-0.5">Responsáveis</p>
                  <p class="text-sm font-medium truncate" :class="c.configurada ? 'text-[#5a5a66]' : 'text-operacao-300'">{{ c.responsavelLabel }}</p>
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] uppercase tracking-wider text-operacao-400 font-medium mb-0.5">Última contagem</p>
                  <p class="text-sm font-medium truncate" :class="c.contagem?.ultima_contagem ? 'text-[#5a5a66]' : 'text-operacao-300'">{{ c.ultimaContagemLabel }}</p>
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] uppercase tracking-wider text-operacao-400 font-medium mb-0.5">Próxima contagem</p>
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span v-if="c.proximaStatusDot" class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="c.proximaStatusDot" />
                    <p class="text-sm font-medium truncate" :class="c.proximaTextClass">{{ c.proximaContagemLabel }}</p>
                  </div>
                </div>
              </div>

              <!-- Action -->
              <div class="flex items-center flex-shrink-0">
                <UButton
                  :color="c.configurada ? 'gray' : 'primary'"
                  variant="soft"
                  size="sm"
                  @click.stop="c.contagem && abrirConfigurar(c.contagem)"
                >
                  <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 mr-1.5" />
                  {{ c.configurada ? 'Editar' : 'Configurar' }}
                </UButton>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

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
      @editar="abrirConfigurar(contagemSelecionada!)"
      @enviar-lembrete="enviarLembreteManual"
      @atualizar="carregarContagens(); carregarHistorico()"
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

    <!-- Slideover: Configurar Contagem -->
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
            <div class="w-9 h-9 bg-guardian-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-guardian-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">Configurar Contagem</h3>
              <p class="text-xs text-operacao-400">Defina a recorrência e o responsável</p>
            </div>
          </div>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="slideoverSetupOpen = false" />
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <!-- Tipo (read-only badge) -->
          <div class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-operacao-100 text-operacao-600 text-sm font-medium">
            <UIcon :name="configurandoTipoIcon" class="w-4 h-4" />
            {{ configurandoTipoLabel }}
          </div>

          <!-- Recorrência -->
          <UFormGroup label="Recorrência" required>
            <USelect v-model="setupRecorrencia" :options="opcoesRecorrencia" option-attribute="label" value-attribute="value" />
          </UFormGroup>

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

          <!-- Responsáveis -->
          <div>
            <h4 class="font-semibold text-operacao-800 mb-1">Responsáveis</h4>
            <p class="text-sm text-operacao-400 mb-3">Quem vai realizar esta contagem? Selecione um ou mais.</p>
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
              <div
                v-for="resp in responsaveis"
                :key="resp.nome + resp.telefone"
                class="relative group/resp"
              >
                <button
                  class="inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-sm transition-all border"
                  :class="isResponsavelSelecionado(resp)
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-100'
                    : 'border-operacao-200 bg-operacao-50 text-operacao-500 hover:border-operacao-300 hover:bg-operacao-100'"
                  @click="toggleResponsavel(resp)"
                >
                  <span
                    class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase"
                    :class="isResponsavelSelecionado(resp)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-operacao-200 text-operacao-400'"
                  >
                    {{ resp.nome.charAt(0) }}
                  </span>
                  <span class="font-medium">{{ resp.nome }}</span>
                  <span class="text-xs opacity-60">{{ resp.telefone }}</span>
                  <UIcon
                    v-if="isResponsavelSelecionado(resp)"
                    name="i-heroicons-check-circle-solid"
                    class="w-4 h-4 text-emerald-500"
                  />
                </button>
                <button
                  class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/resp:opacity-100 transition-opacity duration-150 hover:bg-red-600 shadow-sm"
                  @click.stop="removerResponsavel(resp)"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div class="border-t border-operacao-200" />

          <!-- Info: setores que serão contados -->
          <div v-if="setoresDoTipoSelecionado.length > 0" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-operacao-50 border border-operacao-200 text-sm text-operacao-500">
            <UIcon name="i-heroicons-information-circle" class="w-4 h-4 flex-shrink-0 text-operacao-400" />
            <span>
              <span class="font-medium text-operacao-700">{{ setoresDoTipoSelecionado.length }} {{ setoresDoTipoSelecionado.length === 1 ? 'setor' : 'setores' }}</span>
              serão contados: {{ setoresDoTipoSelecionado.map(s => s.nome).join(', ') }}
            </span>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-operacao-200 bg-white">
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="slideoverSetupOpen = false">Cancelar</UButton>
            <UButton
              color="primary"
              :disabled="!setupRecorrencia || setupResponsaveis.length === 0"
              :loading="loadingSetup"
              @click="salvarContagem"
            >
              <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
              Salvar
            </UButton>
          </div>
        </div>
      </div>
    </USlideover>

    <!-- Modal: Sucesso -->
    <UModal v-model="modalSucessoOpen" :ui="{ overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' } }">
      <UCard :ui="{ ring: 'ring-0', shadow: '', divide: 'divide-operacao-100' }">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-controle-100 rounded-lg flex items-center justify-center">
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
import type { Grupo, Subgrupo, Produto, Setor, Contagem, Ajuste, SaldoEstoque, ContagemHistorico, ContagemResultado } from '~/types'

const toast = useToast()
const {
  getGrupos, getSubgrupos, getProdutos,
  getSaldoEstoque,
  getAjustes,
  getSetores, countSetorProdutos, getAllSetorProdutos,
  getContagens, updateContagem, updateContagemStatus, prepararProximoCiclo, ensureDefaultContagens,
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
const modalSucessoOpen = ref(false)
const resumoSalvamento = ref('')
const loadingEnviarWhatsApp = ref(false)

// ==========================================
// SETUP CONFIGURAR CONTAGEM
// ==========================================
const setupRecorrencia = ref('nenhuma')
const setupResponsaveis = ref<{ id?: string; nome: string; telefone: string }[]>([])
const loadingSetup = ref(false)
const setupHorarioNotificacao = ref('07:00')
const setupDiasSemana = ref<Set<string>>(new Set())
const setupMensalPosicao = ref('primeira')
const setupMensalDia = ref('segunda')

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
// HELPERS: PRÓXIMA CONTAGEM
// ==========================================
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

const calcularProximaContagem = (contagem: Contagem | undefined): string => {
  if (!contagem) return '—'
  const rec = contagem.recorrencia
  if (!rec || rec === 'nenhuma') return '—'

  const now = new Date()
  const [hh, mm] = (contagem.horario_notificacao || '07:00').split(':').map(Number)

  if (rec === 'diaria') {
    const next = new Date()
    next.setHours(hh, mm, 0, 0)
    if (now > next) next.setDate(next.getDate() + 1)
    return formatProximaData(next)
  }

  if (rec === 'semanal' || rec === 'quinzenal') {
    const dias = contagem.dias_semana || []
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
    const posLabel = contagem.mensal_posicao === 'ultima' ? 'Últ.' : '1ª'
    const diaLabels: Record<string, string> = {
      domingo: 'dom.', segunda: 'seg.', terca: 'ter.', quarta: 'qua.',
      quinta: 'qui.', sexta: 'sex.', sabado: 'sáb.', dia: 'dia do mês'
    }
    return `${posLabel} ${diaLabels[contagem.mensal_dia || ''] || contagem.mensal_dia || ''}`
  }

  return '—'
}

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

const setoresDoTipoSelecionado = computed(() => {
  const contagem = editandoContagemId.value
    ? contagensPersistidas.value.find(c => c.id === editandoContagemId.value)
    : null
  const tipo = contagem?.tipo
  if (!tipo) return []
  if (tipo === 'inventario') return setores.value
  return setores.value.filter(s => s.tipo === tipo)
})

// Labels e cores de status para os cards
const statusLabels: Record<string, string> = {
  aguardando: 'Aguardando',
  pendente: 'Pendente',
  atrasada: 'Atrasada',
  em_andamento: 'Em andamento',
  finalizada: 'Finalizada'
}
const statusColors: Record<string, string> = {
  aguardando: 'gray',
  pendente: 'yellow',
  atrasada: 'red',
  em_andamento: 'blue',
  finalizada: 'green'
}
const statusDotClasses: Record<string, string> = {
  pendente: 'bg-yellow-400',
  atrasada: 'bg-red-500',
  em_andamento: 'bg-blue-500',
  finalizada: 'bg-emerald-500'
}
const statusProximaTextClasses: Record<string, string> = {
  pendente: 'text-yellow-600',
  atrasada: 'text-red-600',
  em_andamento: 'text-blue-600',
  finalizada: 'text-emerald-600'
}

const contagensFixas = computed(() => {
  const tipos = [
    { tipo: 'principal', label: 'Estoque Principal',
      icon: 'i-heroicons-building-storefront',
      bgClass: 'bg-emerald-100', iconClass: 'text-emerald-600',
      accentClass: 'bg-emerald-500' },
    { tipo: 'apoio', label: 'Estoque de Apoio',
      icon: 'i-heroicons-archive-box',
      bgClass: 'bg-amber-100', iconClass: 'text-amber-600',
      accentClass: 'bg-amber-500' },
    { tipo: 'inventario', label: 'Inventário',
      icon: 'i-heroicons-clipboard-document-list',
      bgClass: 'bg-blue-100', iconClass: 'text-blue-600',
      accentClass: 'bg-blue-500' }
  ]

  return tipos.map(t => {
    const contagem = contagensPersistidas.value.find(c => c.tipo === t.tipo)
    const setoresCount = contagem?.contagem_setores?.length || 0
    const rec = contagem?.recorrencia
    const configurada = !!(rec && rec !== 'nenhuma')
    const recLabels: Record<string, string> = {
      nenhuma: 'Não configurada', diaria: 'Diária',
      semanal: 'Semanal', quinzenal: 'Quinzenal', mensal: 'Mensal'
    }

    // Última contagem
    let ultimaContagemLabel = 'Nenhuma'
    if (contagem?.ultima_contagem) {
      const d = new Date(contagem.ultima_contagem)
      ultimaContagemLabel = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    return {
      ...t,
      contagem,
      configurada,
      setoresCount,
      recorrenciaLabel: recLabels[rec || 'nenhuma'] || 'Não configurada',
      responsavelLabel: (() => {
        const resps = contagem?.responsaveis_data
        if (resps && resps.length > 0) {
          if (resps.length <= 2) return resps.map((r: any) => r.nome).join(', ')
          return `${resps.slice(0, 2).map((r: any) => r.nome).join(', ')} (+${resps.length - 2})`
        }
        return contagem?.responsavel_nome || 'Nenhum responsável'
      })(),
      statusLabel: statusLabels[contagem?.status || 'aguardando'] || 'Aguardando',
      statusColor: statusColors[contagem?.status || 'aguardando'] || 'gray',
      ultimaContagemLabel,
      proximaContagemLabel: calcularProximaContagem(contagem),
      proximaStatusDot: statusDotClasses[contagem?.status || ''] || '',
      proximaTextClass: configurada
        ? (statusProximaTextClasses[contagem?.status || ''] || 'text-[#5a5a66]')
        : 'text-operacao-300'
    }
  })
})

// Computeds para o slideover (tipo da contagem sendo configurada)
const configurandoTipoLabel = computed(() => {
  const contagem = contagensPersistidas.value.find(c => c.id === editandoContagemId.value)
  if (!contagem) return ''
  const labels: Record<string, string> = { principal: 'Estoque Principal', apoio: 'Estoque de Apoio', inventario: 'Inventário' }
  return labels[contagem.tipo] || contagem.tipo
})
const configurandoTipoIcon = computed(() => {
  const contagem = contagensPersistidas.value.find(c => c.id === editandoContagemId.value)
  if (!contagem) return 'i-heroicons-clipboard-document-check'
  const icons: Record<string, string> = {
    principal: 'i-heroicons-building-storefront',
    apoio: 'i-heroicons-archive-box',
    inventario: 'i-heroicons-clipboard-document-list'
  }
  return icons[contagem.tipo] || 'i-heroicons-clipboard-document-check'
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
    // Sincronizar contagemSelecionada com os dados atualizados
    if (contagemSelecionada.value) {
      const atualizada = contagensPersistidas.value.find(c => c.id === contagemSelecionada.value!.id)
      if (atualizada) contagemSelecionada.value = atualizada
    }
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

// ==========================================
// ENVIAR LEMBRETE WHATSAPP
// ==========================================
const enviarLembreteManual = async () => {
  if (!contagemSelecionada.value) return
  const c = contagemSelecionada.value

  // Montar lista de responsáveis
  const resps: Array<{ nome: string; telefone: string }> = []
  if (c.responsaveis_data && c.responsaveis_data.length > 0) {
    for (const r of c.responsaveis_data) {
      if (r.nome && r.telefone) resps.push({ nome: r.nome, telefone: r.telefone })
    }
  } else if (c.responsavel_nome && c.responsavel_telefone) {
    resps.push({ nome: c.responsavel_nome, telefone: c.responsavel_telefone })
  }

  if (resps.length === 0) {
    toast.add({ title: 'Aviso', description: 'Esta contagem não possui responsável com telefone cadastrado.', color: 'yellow' })
    return
  }

  try {
    loadingEnviarWhatsApp.value = true
    const link = c.token
      ? `https://www.cmv360app.com.br/contagem/${c.token}`
      : `https://www.cmv360app.com.br/movimentos/contagens`

    const nomesEnviados: string[] = []
    for (const resp of resps) {
      const mensagem = [
        `📋 *${c.nome}*`, ``,
        `Olá, *${resp.nome}*!`,
        `Hora de contar o estoque.`, ``,
        `👉 ${link}`
      ].join('\n')
      await $fetch('/api/whatsapp/enviar', { method: 'POST', body: { phone: resp.telefone, message: mensagem } })
      nomesEnviados.push(resp.nome)
    }
    toast.add({ title: 'Enviado!', description: `Lembrete enviado para ${nomesEnviados.join(', ')} via WhatsApp`, color: 'green' })
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

watch(() => setupRecorrencia.value, () => {
  setupHorarioNotificacao.value = '07:00'
  setupDiasSemana.value = new Set()
  setupMensalPosicao.value = 'primeira'
  setupMensalDia.value = 'segunda'
})

const isResponsavelSelecionado = (resp: { nome: string; telefone: string }) => {
  return setupResponsaveis.value.some(r => r.nome === resp.nome && r.telefone === resp.telefone)
}

const toggleResponsavel = (resp: { id?: string; nome: string; telefone: string }) => {
  const idx = setupResponsaveis.value.findIndex(r => r.nome === resp.nome && r.telefone === resp.telefone)
  if (idx >= 0) {
    setupResponsaveis.value = setupResponsaveis.value.filter((_, i) => i !== idx)
  } else {
    setupResponsaveis.value = [...setupResponsaveis.value, resp]
  }
}

const adicionarResponsavel = async () => {
  if (!novoResponsavelNome.value.trim() || !novoResponsavelTelefone.value.trim()) return
  try {
    const novo = await createResponsavel({
      nome: novoResponsavelNome.value.trim(),
      telefone: novoResponsavelTelefone.value.trim()
    })
    responsaveis.value.push(novo)
    setupResponsaveis.value = [...setupResponsaveis.value, novo]
    novoResponsavelNome.value = ''
    novoResponsavelTelefone.value = ''
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar responsável', color: 'red' })
  }
}

const removerResponsavel = (resp: { id?: string; nome: string; telefone: string }) => {
  responsaveis.value = responsaveis.value.filter(r => !(r.nome === resp.nome && r.telefone === resp.telefone))
  setupResponsaveis.value = setupResponsaveis.value.filter(r => !(r.nome === resp.nome && r.telefone === resp.telefone))
}

const abrirConfigurar = async (contagem: Contagem) => {
  editandoContagemId.value = contagem.id

  // Setar recorrência primeiro (dispara watcher que reseta campos dependentes)
  setupRecorrencia.value = contagem.recorrencia || 'nenhuma'
  await nextTick()

  // Agora popular campos dependentes (depois do watcher ter rodado)
  setupHorarioNotificacao.value = contagem.horario_notificacao || '07:00'
  setupDiasSemana.value = new Set(contagem.dias_semana || [])
  setupMensalPosicao.value = contagem.mensal_posicao || 'primeira'
  setupMensalDia.value = contagem.mensal_dia || 'segunda'

  // Responsáveis (carregar do array ou fallback para campo legado)
  if (contagem.responsaveis_data && contagem.responsaveis_data.length > 0) {
    setupResponsaveis.value = contagem.responsaveis_data.map(rd => {
      const found = responsaveis.value.find(r => r.nome === rd.nome && r.telefone === rd.telefone)
      return found || { id: rd.id, nome: rd.nome, telefone: rd.telefone }
    })
  } else if (contagem.responsavel_nome) {
    const found = responsaveis.value.find(
      r => r.nome === contagem.responsavel_nome && r.telefone === contagem.responsavel_telefone
    )
    setupResponsaveis.value = [found || { nome: contagem.responsavel_nome, telefone: contagem.responsavel_telefone || '' }]
  } else {
    setupResponsaveis.value = []
  }

  slideoverSetupOpen.value = true
}

const salvarContagem = async () => {
  if (!editandoContagemId.value || !setupRecorrencia.value || setupResponsaveis.value.length === 0) return
  try {
    loadingSetup.value = true
    const diasSemanaArr = Array.from(setupDiasSemana.value)
    const primeiro = setupResponsaveis.value[0]

    await updateContagem(
      editandoContagemId.value,
      {
        recorrencia: setupRecorrencia.value,
        horario_notificacao: setupHorarioNotificacao.value,
        dias_semana: diasSemanaArr.length > 0 ? diasSemanaArr : undefined,
        mensal_posicao: setupRecorrencia.value === 'mensal' ? setupMensalPosicao.value : undefined,
        mensal_dia: setupRecorrencia.value === 'mensal' ? setupMensalDia.value : undefined,
        // Legacy fields (primeiro responsável para retrocompatibilidade)
        responsavel_nome: primeiro.nome,
        responsavel_telefone: primeiro.telefone,
        responsavel_id: (primeiro as any).id || undefined,
        // Array completo
        responsaveis_data: setupResponsaveis.value.map(r => ({ id: r.id, nome: r.nome, telefone: r.telefone }))
      }
    )
    slideoverSetupOpen.value = false
    toast.add({ title: 'Sucesso', description: 'Contagem configurada com sucesso', color: 'green' })
    await carregarContagens()
    // Atualizar contagem selecionada se estiver nos detalhes
    if (contagemSelecionada.value?.id === editandoContagemId.value) {
      const atualizada = contagensPersistidas.value.find(c => c.id === editandoContagemId.value)
      if (atualizada) contagemSelecionada.value = atualizada
    }
    editandoContagemId.value = null
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
onTableChange(['contagens', 'contagem_setores', 'contagem_itens'], () => {
  carregarContagens()
  // Se o usuario esta vendo detalhes, atualizar historico tambem
  if (etapa.value === 'detalhes' && contagemSelecionada.value) {
    carregarHistorico()
  }
})
onTableChange(['produtos', 'grupos', 'subgrupos', 'setores', 'setor_produtos'], () => carregarDadosBase())
onTableChange('responsaveis', () => carregarResponsaveis())
onTableChange('ajustes', () => carregarContagens())

// ==========================================
// INIT
// ==========================================
watch(empresaId, async () => {
  if (empresaId.value) {
    await carregarDadosBase()
    await ensureDefaultContagens()
    await Promise.all([
      carregarContagens(),
      carregarResponsaveis()
    ])
  }
}, { immediate: true })
</script>
