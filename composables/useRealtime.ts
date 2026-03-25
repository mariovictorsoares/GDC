import type { RealtimeChannel } from '@supabase/supabase-js'

// Todas as tabelas que possuem empresa_id
const TABELAS_REALTIME = [
  'grupos',
  'subgrupos',
  'categorias',
  'unidades',
  'fornecedores',
  'produtos',
  'custos_mensais',
  'entradas',
  'saidas',
  'ajustes',
  'faturamentos',
  'faturamentos_semanais',
  'pedidos',
  'pedido_itens',
  'contagens',
  'contagem_setores',
  'contagem_itens',
  'setores',
  'setor_produtos',
  'responsaveis'
] as const

type TabelaRealtime = typeof TABELAS_REALTIME[number]

type Callback = () => void

// Estado global - compartilhado entre componentes
const callbacks = ref(new Map<TabelaRealtime, Set<Callback>>())
let channel: RealtimeChannel | null = null
let debounceTimers = new Map<TabelaRealtime, ReturnType<typeof setTimeout>>()
let empresaIdAtual: string | null = null

export const useRealtime = () => {
  const client = useSupabaseClient()
  const { empresaId } = useEmpresa()

  /**
   * Registra um callback para ser chamado quando uma tabela mudar.
   * Automaticamente remove o callback no onUnmounted do componente.
   */
  const onTableChange = (tabela: TabelaRealtime | TabelaRealtime[], callback: Callback) => {
    const tabelas = Array.isArray(tabela) ? tabela : [tabela]

    for (const t of tabelas) {
      if (!callbacks.value.has(t)) {
        callbacks.value.set(t, new Set())
      }
      callbacks.value.get(t)!.add(callback)
    }

    // Cleanup automático quando o componente desmontar
    if (getCurrentInstance()) {
      onUnmounted(() => {
        for (const t of tabelas) {
          callbacks.value.get(t)?.delete(callback)
        }
      })
    }
  }

  /**
   * Dispara callbacks de uma tabela com debounce de 300ms
   */
  const dispararCallbacks = (tabela: TabelaRealtime) => {
    // Cancelar timer anterior para essa tabela
    const timerExistente = debounceTimers.get(tabela)
    if (timerExistente) clearTimeout(timerExistente)

    debounceTimers.set(tabela, setTimeout(() => {
      const cbs = callbacks.value.get(tabela)
      if (cbs) {
        cbs.forEach(cb => {
          try {
            cb()
          } catch (e) {
            console.error(`[Realtime] Erro no callback da tabela ${tabela}:`, e)
          }
        })
      }
      debounceTimers.delete(tabela)
    }, 300))
  }

  /**
   * Dispara TODOS os callbacks (usado na reconexão)
   */
  const refetchTudo = () => {
    // Coletar callbacks únicos para não chamar a mesma função 2x
    const callbacksUnicos = new Set<Callback>()
    callbacks.value.forEach(cbs => {
      cbs.forEach(cb => callbacksUnicos.add(cb))
    })

    callbacksUnicos.forEach(cb => {
      try {
        cb()
      } catch (e) {
        console.error('[Realtime] Erro no refetch:', e)
      }
    })
  }

  /**
   * Cria o channel com subscriptions para todas as tabelas
   */
  const conectar = (empId: string) => {
    // Se já está conectado com a mesma empresa, não reconecta
    if (channel && empresaIdAtual === empId) return

    // Desconectar canal anterior
    desconectar()
    empresaIdAtual = empId

    // Criar um channel com todas as tabelas
    let ch = client.channel(`realtime-empresa-${empId}`)

    for (const tabela of TABELAS_REALTIME) {
      ch = ch.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tabela,
          filter: `empresa_id=eq.${empId}`
        },
        () => {
          dispararCallbacks(tabela)
        }
      )
    }

    let foiDesconectado = false

    channel = ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Conectado - empresa:', empId)
        if (foiDesconectado) {
          console.log('[Realtime] Reconectado! Fazendo refetch...')
          foiDesconectado = false
          setTimeout(() => refetchTudo(), 1000)
        }
      }

      if (status === 'CHANNEL_ERROR') {
        foiDesconectado = true
        console.warn('[Realtime] Erro no canal, tentando reconectar...')
      }
    })
  }

  /**
   * Desconecta o channel
   */
  const desconectar = () => {
    if (channel) {
      client.removeChannel(channel)
      channel = null
      empresaIdAtual = null

      // Limpar timers de debounce
      debounceTimers.forEach(timer => clearTimeout(timer))
      debounceTimers.clear()
    }
  }

  // Conectar/reconectar quando a empresa muda
  watch(empresaId, (novoId) => {
    if (novoId) {
      conectar(novoId)
    } else {
      desconectar()
    }
  }, { immediate: true })

  return {
    onTableChange
  }
}
