<template>
  <USlideover
    v-model="slideoverAberto"
    :ui="{
      width: 'max-w-lg',
      overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
      background: 'bg-white dark:bg-operacao-800'
    }"
  >
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-operacao-200 dark:border-operacao-700">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-amber-100 rounded-lg">
            <UIcon name="i-heroicons-clipboard-document-list" class="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-operacao-800">Requisições</h3>
            <p class="text-xs text-operacao-400">
              QR Codes dos setores e requisições pendentes
            </p>
          </div>
        </div>
        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="slideoverAberto = false" />
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-operacao-200">
        <button
          class="flex-1 py-3 text-sm font-medium text-center transition-colors relative"
          :class="abaAtiva === 'pendentes'
            ? 'text-amber-600'
            : 'text-operacao-400 hover:text-operacao-600'"
          @click="abaAtiva = 'pendentes'"
        >
          Pendentes
          <span v-if="requisicoes.length > 0" class="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none rounded-full bg-amber-500 text-white">
            {{ requisicoes.length }}
          </span>
          <div v-if="abaAtiva === 'pendentes'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
        </button>
        <button
          class="flex-1 py-3 text-sm font-medium text-center transition-colors relative"
          :class="abaAtiva === 'historico'
            ? 'text-amber-600'
            : 'text-operacao-400 hover:text-operacao-600'"
          @click="abaAtiva = 'historico'"
        >
          Histórico
          <div v-if="abaAtiva === 'historico'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
        </button>
        <button
          class="flex-1 py-3 text-sm font-medium text-center transition-colors relative"
          :class="abaAtiva === 'qrcodes'
            ? 'text-amber-600'
            : 'text-operacao-400 hover:text-operacao-600'"
          @click="abaAtiva = 'qrcodes'"
        >
          QR Codes
          <div v-if="abaAtiva === 'qrcodes'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Pendentes tab -->
        <div v-if="abaAtiva === 'pendentes'" class="px-6 py-4 space-y-3">
          <div v-if="requisicoes.length > 0" class="flex justify-end">
            <UButton
              color="amber"
              variant="soft"
              size="xs"
              icon="i-heroicons-printer"
              @click="imprimirListaRequisicoes"
            >
              Imprimir lista
            </UButton>
          </div>
          <div
            v-for="req in requisicoes"
            :key="req.id"
            class="p-4 rounded-xl border border-operacao-200 hover:border-amber-300 bg-white hover:bg-amber-50/30 transition-all cursor-pointer group"
            @click="emit('selecionar', req)"
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
              <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-operacao-300 group-hover:text-amber-500 transition-colors flex-shrink-0 mt-1" />
            </div>
          </div>

          <div v-if="requisicoes.length === 0" class="flex flex-col items-center justify-center py-12 text-operacao-400">
            <UIcon name="i-heroicons-check-circle" class="w-10 h-10 mb-3 text-controle-400" />
            <p class="text-sm font-medium">Nenhuma requisição pendente</p>
          </div>
        </div>

        <!-- Histórico tab -->
        <div v-if="abaAtiva === 'historico'" class="px-6 py-4 space-y-3">
          <!-- Filtro -->
          <div class="flex gap-2">
            <button
              v-for="f in filtrosHistorico"
              :key="f.value"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              :class="filtroHistorico === f.value
                ? 'bg-amber-100 text-amber-700'
                : 'bg-operacao-100 text-operacao-500 hover:text-operacao-700'"
              @click="filtroHistorico = f.value"
            >
              {{ f.label }}
            </button>
          </div>

          <div v-if="loadingHistorico" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-6 w-6 border-2 border-operacao-200 border-t-amber-500" />
          </div>

          <template v-else>
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

            <div v-if="historicoFiltrado.length === 0" class="flex flex-col items-center justify-center py-12 text-operacao-400">
              <UIcon name="i-heroicons-clock" class="w-10 h-10 mb-3" />
              <p class="text-sm font-medium">Nenhuma requisição no histórico</p>
            </div>
          </template>
        </div>

        <!-- QR Codes tab -->
        <div v-if="abaAtiva === 'qrcodes'" class="px-6 py-4 space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-xs text-operacao-400">
              Compartilhe o QR Code ou link com o responsável do setor.
            </p>
            <UButton
              v-if="setores.length > 0"
              color="amber"
              variant="soft"
              size="xs"
              icon="i-heroicons-printer"
              @click="imprimirQRCodes()"
            >
              Imprimir todos
            </UButton>
          </div>

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

                <div class="flex gap-2 mt-3">
                  <UButton
                    color="amber"
                    variant="soft"
                    size="xs"
                    icon="i-heroicons-link"
                    @click="copiarLink(setor)"
                  >
                    Copiar link
                  </UButton>
                  <UButton
                    color="gray"
                    variant="soft"
                    size="xs"
                    icon="i-heroicons-printer"
                    @click="imprimirQRCodes(setor)"
                  >
                    Imprimir
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <div v-if="setores.length === 0" class="flex flex-col items-center justify-center py-12 text-operacao-400">
            <UIcon name="i-heroicons-qr-code" class="w-10 h-10 mb-3" />
            <p class="text-sm font-medium">Nenhum setor cadastrado</p>
            <p class="text-xs">Cadastre setores na seção de Contagens</p>
          </div>
        </div>
      </div>
    </div>
  </USlideover>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'
import type { Requisicao, Setor } from '~/types'

const props = defineProps<{
  modelValue: boolean
  setores: Setor[]
  requisicoes: Requisicao[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'selecionar': [requisicao: Requisicao]
}>()

const slideoverAberto = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
})

const toast = useToast()
const { getRequisicoes } = useEstoque()
const abaAtiva = ref<'pendentes' | 'historico' | 'qrcodes'>('pendentes')

// Histórico
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
  // Trigger reactivity
  expandidos.value = new Set(expandidos.value)
}

const loadHistorico = async () => {
  loadingHistorico.value = true
  try {
    const todas = await getRequisicoes()
    historico.value = todas.filter(r => r.status !== 'pendente')
  } catch {
  } finally {
    loadingHistorico.value = false
  }
}

const formatQtd = (val?: number | null) => {
  if (val == null) return '—'
  if (Number.isInteger(val)) return String(val)
  return Number(val).toFixed(3).replace('.', ',')
}

// QR Code generation (lazy, on tab switch)
const qrCodes = ref<Record<string, string>>({})

const getRequisicaoUrl = (setor: Setor): string => {
  return `${window.location.origin}/requisicao/${setor.token_requisicao}`
}

const imprimirListaRequisicoes = () => {
  if (props.requisicoes.length === 0) return

  const cards = props.requisicoes.map(req => {
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

const gerarQRCodes = async () => {
  for (const setor of props.setores) {
    if (qrCodes.value[setor.id] || !setor.token_requisicao) continue
    try {
      const url = getRequisicaoUrl(setor)
      qrCodes.value[setor.id] = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' }
      })
    } catch {
      // Silently skip failed QR code generation
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
  const setoresImprimir = setor ? [setor] : props.setores
  // Garantir que QR codes estão gerados
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

const formatDate = (date?: string) => {
  if (!date) return ''
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

// Load data when switching tabs
watch(abaAtiva, (aba) => {
  if (aba === 'qrcodes') gerarQRCodes()
  if (aba === 'historico') loadHistorico()
})

// Auto switch to pendentes if there are pending, qrcodes otherwise
watch(slideoverAberto, (aberto) => {
  if (aberto) {
    abaAtiva.value = props.requisicoes.length > 0 ? 'pendentes' : 'qrcodes'
    if (abaAtiva.value === 'qrcodes') {
      gerarQRCodes()
    }
  }
})
</script>
