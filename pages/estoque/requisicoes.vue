<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between pb-4">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-semibold text-[#5a5a66]">Requisições</h1>
        <span v-if="pendentesCount > 0" class="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 text-xs font-bold leading-none rounded-full bg-amber-500 text-white">
          {{ pendentesCount }}
        </span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex items-end justify-between">
      <div ref="tabsContainerRef" class="relative flex items-center gap-0.5">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :ref="el => { if (el) tabRefs[tab.key] = el as HTMLElement }"
          class="relative flex items-center gap-1.5 px-3.5 pb-2.5 pt-1 text-sm font-medium transition-colors duration-200"
          :class="abaAtiva === tab.key ? 'text-guardian-700' : 'text-operacao-400 hover:text-operacao-600'"
          @click="abaAtiva = tab.key"
        >
          <UIcon :name="tab.icon" class="w-4 h-4" />
          {{ tab.label }}
          <span v-if="tab.key === 'pendentes' && pendentesCount > 0" class="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none rounded-full bg-amber-500 text-white">
            {{ pendentesCount }}
          </span>
        </button>
        <!-- Sliding indicator -->
        <span class="absolute bottom-0 h-[2px] bg-guardian-600 rounded-full transition-all duration-300 ease-in-out" :style="tabIndicatorStyle" />
      </div>
      <div class="flex items-center gap-2.5 pb-2">
        <!-- Filtros do Histórico (só aparecem nessa aba) -->
        <template v-if="abaAtiva === 'historico'">
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton color="white" class="justify-between" trailing-icon="i-heroicons-chevron-down-20-solid" :ui="toolbarButtonUi">
              <span class="truncate text-left font-normal"><span class="text-operacao-400">Status:</span> <span class="text-gray-900">{{ filtrosHistorico.find(f => f.value === filtroHistorico)?.label }}</span></span>
            </UButton>
            <template #panel="{ close }">
              <div class="w-44 py-1">
                <button
                  v-for="f in filtrosHistorico"
                  :key="f.value"
                  class="w-full text-left px-3 py-1.5 text-sm rounded transition-colors"
                  :class="filtroHistorico === f.value ? 'text-guardian-600 font-medium bg-guardian-50' : 'text-operacao-600 hover:bg-operacao-50'"
                  @click="filtroHistorico = f.value; close()"
                >
                  {{ f.label }}
                </button>
              </div>
            </template>
          </UPopover>
        </template>
        <!-- Botão Imprimir (só na aba Pendentes com itens) -->
        <button v-if="abaAtiva === 'pendentes' && requisicoesPendentes.length > 0" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-[#5a5a66] border border-gray-300 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-all duration-150" @click="imprimirListaRequisicoes">
          <UIcon name="i-heroicons-printer" class="w-4 h-4" />
          Imprimir lista
        </button>
        <!-- Botão Imprimir todos (só na aba QR Codes) -->
        <button v-if="abaAtiva === 'qrcodes' && setores.length > 0" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-white text-[#5a5a66] border border-gray-300 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-all duration-150" @click="imprimirQRCodes()">
          <UIcon name="i-heroicons-printer" class="w-4 h-4" />
          Imprimir todos
        </button>
        <button @click="loadAll()" class="flex items-center justify-center w-8 h-8 rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm text-operacao-500 hover:text-guardian-600 hover:ring-guardian-200 hover:bg-guardian-50 transition-all" :disabled="loadingPendentes">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" :class="{ 'animate-spin': loadingPendentes }" />
        </button>
      </div>
    </div>

    <!-- ======================== ABA: PENDENTES ======================== -->
    <template v-if="abaAtiva === 'pendentes'">
      <div v-if="loadingPendentes" class="space-y-3">
        <USkeleton v-for="i in 3" :key="i" class="h-20 w-full rounded-xl" />
      </div>

      <template v-else>
        <div class="space-y-3">
          <div
            v-for="req in requisicoesPendentes"
            :key="req.id"
            class="p-4 rounded-xl border border-operacao-200 hover:border-amber-300 bg-white hover:bg-amber-50/30 transition-all cursor-pointer group"
            @click="openRequisicaoReview(req)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-operacao-800 truncate">{{ req.setor?.nome || 'Setor' }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <UBadge color="amber" variant="subtle" size="xs">
                    {{ req.itens?.length || 0 }} {{ (req.itens?.length || 0) === 1 ? 'item' : 'itens' }}
                  </UBadge>
                  <span class="text-xs text-operacao-400">{{ formatDate(req.data) }}</span>
                </div>
                <p v-if="req.solicitante_nome" class="text-xs text-operacao-400 mt-1.5">
                  Solicitante: {{ req.solicitante_nome }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <UButton size="xs" color="amber" variant="soft" class="flex-shrink-0" @click.stop="openRequisicaoReview(req)">
                  Revisar
                </UButton>
                <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-operacao-300 group-hover:text-amber-500 transition-colors flex-shrink-0 mt-1" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="requisicoesPendentes.length === 0" class="flex flex-col items-center justify-center py-16 text-operacao-400">
          <UIcon name="i-heroicons-check-circle" class="w-12 h-12 mb-3 text-controle-400" />
          <p class="text-sm font-medium">Nenhuma requisição pendente</p>
          <p class="text-xs mt-1">Requisições dos setores aparecerão aqui</p>
        </div>
      </template>
    </template>

    <!-- ======================== ABA: HISTÓRICO ======================== -->
    <template v-if="abaAtiva === 'historico'">
      <div v-if="loadingHistorico" class="space-y-3">
        <USkeleton v-for="i in 4" :key="i" class="h-16 w-full rounded-xl" />
      </div>

      <template v-else>
        <div class="space-y-3">
          <div
            v-for="req in historicoFiltrado"
            :key="req.id"
            class="rounded-xl border border-operacao-200 bg-white overflow-hidden"
          >
            <!-- Header do card (clicável para expandir) -->
            <div
              class="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-operacao-50/50 transition-colors"
              @click="toggleExpand(req.id)"
            >
              <div class="flex-1 min-w-0">
                <p class="font-medium text-operacao-800 truncate">{{ req.setor?.nome || 'Setor' }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <UBadge
                    :color="req.status === 'enviado' ? 'green' : 'red'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ req.status === 'enviado' ? 'Enviado' : 'Cancelado' }}
                  </UBadge>
                  <span class="text-xs text-operacao-400">{{ formatDate(req.data) }}</span>
                </div>
                <p v-if="req.solicitante_nome" class="text-xs text-operacao-400 mt-1">
                  Solicitante: {{ req.solicitante_nome }}
                </p>
              </div>
              <UIcon
                name="i-heroicons-chevron-down"
                class="w-4 h-4 text-operacao-300 flex-shrink-0 mt-1 transition-transform"
                :class="expandidos.has(req.id) ? 'rotate-180' : ''"
              />
            </div>

            <!-- Detalhes expandidos -->
            <div v-if="expandidos.has(req.id)" class="border-t border-operacao-100 px-4 py-3 bg-operacao-50/30">
              <table class="w-full text-xs">
                <thead>
                  <tr class="text-operacao-400">
                    <th class="text-left pb-2 font-medium">Produto</th>
                    <th class="text-right pb-2 font-medium">Solicitado</th>
                    <th v-if="req.status === 'enviado'" class="text-right pb-2 font-medium">Enviado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in req.itens" :key="item.id" class="border-t border-operacao-100">
                    <td class="py-1.5 text-operacao-700">{{ item.produto?.nome }}</td>
                    <td class="py-1.5 text-right text-operacao-500 tabular-nums">{{ formatQtd(item.quantidade_solicitada) }}</td>
                    <td v-if="req.status === 'enviado'" class="py-1.5 text-right font-medium text-operacao-700 tabular-nums">
                      {{ formatQtd(item.quantidade_enviada) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div v-if="historicoFiltrado.length === 0 && !loadingHistorico" class="flex flex-col items-center justify-center py-16 text-operacao-400">
          <UIcon name="i-heroicons-clock" class="w-12 h-12 mb-3" />
          <p class="text-sm font-medium">Nenhuma requisição no histórico</p>
        </div>
      </template>
    </template>

    <!-- ======================== ABA: QR CODES ======================== -->
    <template v-if="abaAtiva === 'qrcodes'">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="setor in setores"
          :key="setor.id"
          class="p-4 rounded-xl border border-operacao-200 bg-white"
        >
          <div class="flex items-start gap-4">
            <!-- QR Code -->
            <div class="flex-shrink-0">
              <div
                v-if="qrCodes[setor.id]"
                class="w-24 h-24 rounded-lg overflow-hidden border border-operacao-100"
              >
                <img :src="qrCodes[setor.id]" :alt="`QR Code ${setor.nome}`" class="w-full h-full" />
              </div>
              <div v-else class="w-24 h-24 rounded-lg border border-operacao-100 flex items-center justify-center bg-operacao-50">
                <div class="animate-spin rounded-full h-5 w-5 border-2 border-operacao-200 border-t-amber-500" />
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-operacao-800 truncate">{{ setor.nome }}</p>
              <div class="flex flex-wrap gap-2 mt-3">
                <button class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white text-[#5a5a66] border border-gray-300 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-all duration-150" @click="copiarLink(setor)">
                  <UIcon name="i-heroicons-link" class="w-3.5 h-3.5" />
                  Copiar link
                </button>
                <button class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white text-[#5a5a66] border border-gray-300 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-all duration-150" @click="imprimirQRCodes(setor)">
                  <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="setores.length === 0" class="flex flex-col items-center justify-center py-16 text-operacao-400">
        <UIcon name="i-heroicons-qr-code" class="w-12 h-12 mb-3" />
        <p class="text-sm font-medium">Nenhum setor cadastrado</p>
        <p class="text-xs mt-1">Cadastre setores na seção de Contagens</p>
      </div>
    </template>

    <!-- Modal de revisão -->
    <MovimentosRequisicaoReviewModal
      v-model="requisicaoReviewModalOpen"
      :requisicao="requisicaoSelecionada"
      @enviada="onRequisicaoResolvida"
      @cancelada="onRequisicaoResolvida"
    />

  </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'
import type { Requisicao, Setor } from '~/types'

const { getRequisicoes, countRequisicoesPendentes, getSetores } = useEstoque()
const { empresaId } = useEmpresa()
const toast = useToast()

// ======================== UI ========================
const toolbarButtonUi = { color: { white: { solid: 'shadow-sm ring-1 ring-inset ring-[#EBEBED] text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-guardian-500 dark:ring-operacao-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800/50' } } }

// ======================== TABS ========================
const abaAtiva = ref<'pendentes' | 'historico' | 'qrcodes'>('pendentes')
const tabs = [
  { key: 'pendentes' as const, label: 'Pendentes', icon: 'i-heroicons-clipboard-document-list' },
  { key: 'historico' as const, label: 'Histórico', icon: 'i-heroicons-clock' },
  { key: 'qrcodes' as const, label: 'QR Codes', icon: 'i-heroicons-qr-code' }
]

// Tab sliding indicator
const tabsContainerRef = ref<HTMLElement>()
const tabRefs = reactive<Record<string, HTMLElement>>({})
const tabIndicatorStyle = computed(() => {
  const el = tabRefs[abaAtiva.value]
  if (!el || !tabsContainerRef.value) return { left: '0px', width: '0px' }
  const containerRect = tabsContainerRef.value.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  return {
    left: `${elRect.left - containerRect.left}px`,
    width: `${elRect.width}px`
  }
})

// ======================== PENDENTES ========================
const loadingPendentes = ref(false)
const pendentesCount = ref(0)
const requisicoesPendentes = ref<Requisicao[]>([])
const setores = ref<Setor[]>([])

const loadPendentes = async () => {
  loadingPendentes.value = true
  try {
    pendentesCount.value = await countRequisicoesPendentes()
    requisicoesPendentes.value = pendentesCount.value > 0 ? await getRequisicoes('pendente') : []
    setores.value = (await getSetores()).filter((s: Setor) => s.tipo !== 'apoio')
  } catch {
  } finally {
    loadingPendentes.value = false
  }
}

// Modal de revisão
const requisicaoReviewModalOpen = ref(false)
const requisicaoSelecionada = ref<Requisicao | null>(null)

const openRequisicaoReview = (req: Requisicao) => {
  requisicaoSelecionada.value = req
  requisicaoReviewModalOpen.value = true
}

const onRequisicaoResolvida = async () => {
  await loadPendentes()
  if (abaAtiva.value === 'historico') await loadHistorico()
}

// ======================== HISTÓRICO ========================
const loadingHistorico = ref(false)
const historico = ref<Requisicao[]>([])
const filtroHistorico = ref<'todos' | 'enviado' | 'cancelado'>('todos')
const expandidos = ref<Set<string>>(new Set())

const filtrosHistorico = [
  { label: 'Todos', value: 'todos' as const },
  { label: 'Enviados', value: 'enviado' as const },
  { label: 'Cancelados', value: 'cancelado' as const }
]

const historicoFiltrado = computed(() => {
  if (filtroHistorico.value === 'todos') return historico.value
  return historico.value.filter(r => r.status === filtroHistorico.value)
})

const toggleExpand = (id: string) => {
  if (expandidos.value.has(id)) {
    expandidos.value.delete(id)
  } else {
    expandidos.value.add(id)
  }
  expandidos.value = new Set(expandidos.value)
}

const loadHistorico = async () => {
  loadingHistorico.value = true
  try {
    const todas = await getRequisicoes()
    historico.value = todas.filter((r: Requisicao) => r.status !== 'pendente')
  } catch {
  } finally {
    loadingHistorico.value = false
  }
}

// ======================== QR CODES ========================
const qrCodes = ref<Record<string, string>>({})

const getRequisicaoUrl = (setor: Setor): string => {
  return `${window.location.origin}/requisicao/${setor.token_requisicao}`
}

const gerarQRCodes = async () => {
  for (const setor of setores.value) {
    if (qrCodes.value[setor.id] || !setor.token_requisicao) continue
    try {
      const url = getRequisicaoUrl(setor)
      qrCodes.value[setor.id] = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' }
      })
    } catch {
      // Silently skip
    }
  }
}

const copiarLink = async (setor: Setor) => {
  try {
    const url = getRequisicaoUrl(setor)
    await navigator.clipboard.writeText(url)
    toast.add({ title: 'Link copiado!', color: 'green', icon: 'i-heroicons-check-circle', timeout: 2000 })
  } catch {
    toast.add({ title: 'Erro ao copiar', color: 'red', timeout: 2000 })
  }
}

const imprimirQRCodes = async (setor?: Setor) => {
  const setoresImprimir = setor ? [setor] : setores.value
  await gerarQRCodes()

  const itens = setoresImprimir
    .filter(s => qrCodes.value[s.id])
    .map(s => `
      <div style="page-break-inside:avoid; text-align:center; padding:24px; border:1px solid #e5e7eb; border-radius:12px; margin-bottom:16px;">
        <img src="${qrCodes.value[s.id]}" style="width:200px; height:200px;" />
        <h2 style="margin:12px 0 4px; font-size:18px; font-weight:600;">${s.nome}</h2>
      </div>
    `).join('')

  const html = `<!DOCTYPE html><html><head><title>QR Codes - Requisições</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width:800px; margin:0 auto; padding:24px; }
      h1 { font-size:20px; color:#374151; margin-bottom:20px; }
      .grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:16px; }
      @media print { body { padding:0; } h1 { margin-top:0; } }
    </style></head><body>
    <h1>QR Codes — Requisições de Estoque</h1>
    <div class="grid">${itens}</div>
  </body></html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    win.onload = () => { win.print() }
  }
}

// ======================== IMPRESSÃO PENDENTES ========================
const imprimirListaRequisicoes = () => {
  if (requisicoesPendentes.value.length === 0) return

  const cards = requisicoesPendentes.value.map(req => {
    const rows = (req.itens || []).map(item => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;">${item.produto?.nome || '-'}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #f3f4f6;text-align:right;color:#374151;font-weight:500;">${formatQtd(item.quantidade_solicitada)} ${(item.produto as any)?.unidade?.sigla || ''}</td>
      </tr>`).join('')
    return `
      <div style="page-break-inside:avoid;margin-bottom:20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div style="background:#fffbeb;padding:10px 16px;border-bottom:1px solid #e5e7eb;">
          <div style="font-size:14px;font-weight:600;color:#1f2937;">${req.setor?.nome || 'Setor'}</div>
          ${req.solicitante_nome ? `<div style="font-size:11px;color:#6b7280;margin-top:2px;">Solicitante: ${req.solicitante_nome}</div>` : ''}
          <div style="font-size:11px;color:#9ca3af;margin-top:1px;">${formatDate(req.data)}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:#f9fafb;">
            <th style="text-align:left;padding:6px 12px;font-size:10px;font-weight:600;text-transform:uppercase;color:#9ca3af;">Produto</th>
            <th style="text-align:right;padding:6px 12px;font-size:10px;font-weight:600;text-transform:uppercase;color:#9ca3af;">Quantidade</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><title>Requisições Pendentes</title>
    <style>
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:780px;margin:0 auto;padding:24px;color:#1f2937;}
      h1{font-size:18px;font-weight:700;color:#111827;margin:0 0 4px;}
      .sub{font-size:12px;color:#9ca3af;margin:0 0 24px;}
      @media print{body{padding:0;}h1{margin-top:0;}}
    </style></head><body>
    <h1>Requisições Pendentes</h1>
    <p class="sub">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
    ${cards}
  </body></html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
    win.onload = () => { win.print() }
  }
}

// ======================== HELPERS ========================
const formatDate = (date?: string) => {
  if (!date) return ''
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

const formatQtd = (val?: number | null) => {
  if (val == null) return '—'
  if (Number.isInteger(val)) return String(val)
  return Number(val).toFixed(3).replace('.', ',')
}

// ======================== LOAD ALL ========================
const loadAll = async () => {
  await loadPendentes()
}

// ======================== WATCHERS ========================
watch(abaAtiva, (aba) => {
  if (aba === 'qrcodes') gerarQRCodes()
  if (aba === 'historico' && historico.value.length === 0) loadHistorico()
})

// Polling: verifica novas requisições a cada 30s
let pollingTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  pollingTimer = setInterval(async () => {
    if (!empresaId.value) return
    const novoCount = await countRequisicoesPendentes()
    if (novoCount !== pendentesCount.value) {
      pendentesCount.value = novoCount
      requisicoesPendentes.value = novoCount > 0 ? await getRequisicoes('pendente') : []
    }
  }, 30000)
})

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer)
})

watch(empresaId, () => {
  if (empresaId.value) loadAll()
}, { immediate: true })
</script>
