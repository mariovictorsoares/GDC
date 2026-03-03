import type { Assinatura, Plano, SubscriptionState, SubscriptionStateName } from '~/types'

// Estado global compartilhado entre componentes
const assinatura = ref<Assinatura | null>(null)
const planos = ref<Plano[]>([])
const carregando = ref(false)
const isSuperAdmin = ref(false)
const _loaded = ref(false)

/**
 * Calcula o estado efetivo da assinatura com base nas datas e status
 */
function computeSubscriptionState(assin: Assinatura | null): SubscriptionState {
  if (!assin) {
    return { state: 'trial', diasRestantes: 14, mensagem: '' }
  }

  // Se já tem pagamento ativo
  if (assin.status === 'active') {
    return { state: 'active', diasRestantes: null, mensagem: '' }
  }

  // Acesso gratuito concedido pelo admin
  if (assin.status === 'free') {
    return { state: 'active', diasRestantes: null, mensagem: '' }
  }

  if (assin.status === 'past_due') {
    return { state: 'past_due', diasRestantes: null, mensagem: 'Pagamento pendente. Atualize sua forma de pagamento.' }
  }

  if (assin.status === 'cancelled') {
    return { state: 'cancelled', diasRestantes: null, mensagem: 'Assinatura cancelada.' }
  }

  // Lógica de trial
  const now = new Date()
  const trialFim = new Date(assin.trial_fim)
  const diasRestantes = Math.ceil((trialFim.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Trial normal (mais de 3 dias)
  if (diasRestantes > 3) {
    return { state: 'trial', diasRestantes, mensagem: `Teste grátis: ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''} restante${diasRestantes > 1 ? 's' : ''}.` }
  }

  // Trial com aviso (1-3 dias)
  if (diasRestantes > 0) {
    return {
      state: 'trial_warning',
      diasRestantes,
      mensagem: `Seu período de teste expira em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}. Assine agora!`
    }
  }

  // Trial expirou — verificar período de carência (3 dias)
  const graceFim = assin.grace_fim
    ? new Date(assin.grace_fim)
    : new Date(trialFim.getTime() + 3 * 24 * 60 * 60 * 1000)

  const diasGraca = Math.ceil((graceFim.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diasGraca > 0) {
    return {
      state: 'grace',
      diasRestantes: diasGraca,
      mensagem: 'Período de teste expirado. Assine para continuar usando o sistema.'
    }
  }

  // Bloqueado
  return {
    state: 'blocked',
    diasRestantes: 0,
    mensagem: 'Acesso bloqueado. Assine um plano para continuar.'
  }
}

export const useAssinatura = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()
  const { empresaId } = useEmpresa()

  // Carregar assinatura da empresa ativa
  const carregarAssinatura = async () => {
    if (!empresaId.value) return
    if (carregando.value) return

    carregando.value = true
    try {
      const { data, error } = await client
        .from('assinaturas')
        .select('*, plano:planos(*)')
        .eq('empresa_id', empresaId.value)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('[useAssinatura] Erro ao carregar assinatura:', error)
      }

      assinatura.value = data as Assinatura | null
      _loaded.value = true
    } finally {
      carregando.value = false
    }
  }

  // Carregar planos disponíveis
  const carregarPlanos = async () => {
    const { data, error } = await client
      .from('planos')
      .select('*')
      .eq('ativo', true)
      .order('ordem')

    if (error) {
      console.error('[useAssinatura] Erro ao carregar planos:', error)
      return
    }

    planos.value = (data || []) as Plano[]
  }

  // Verificar se usuário é super-admin
  const verificarSuperAdmin = async () => {
    if (!user.value) return

    const { data } = await client
      .from('admin_users')
      .select('id')
      .eq('user_id', user.value.id)
      .maybeSingle()

    isSuperAdmin.value = !!data
  }

  // Estado computado da assinatura
  const subscriptionState = computed((): SubscriptionState => {
    return computeSubscriptionState(assinatura.value)
  })

  // Computed helpers
  const isTrial = computed(() =>
    ['trial', 'trial_warning'].includes(subscriptionState.value.state)
  )
  const isActive = computed(() =>
    subscriptionState.value.state === 'active'
  )
  const isBlocked = computed(() =>
    subscriptionState.value.state === 'blocked'
  )
  const showBanner = computed(() =>
    ['trial', 'trial_warning', 'grace', 'past_due', 'cancelled'].includes(subscriptionState.value.state)
  )
  const loaded = computed(() => _loaded.value)

  // Iniciar checkout (redireciona para Stripe)
  const iniciarCheckout = async (planoSlug: string) => {
    const data = await $fetch('/api/stripe/checkout', {
      method: 'POST',
      body: { plano_slug: planoSlug, empresa_id: empresaId.value }
    })
    if (data?.url) {
      window.location.href = data.url
    }
  }

  // Abrir Stripe Customer Portal
  const abrirPortal = async () => {
    const data = await $fetch('/api/stripe/portal', {
      method: 'POST',
      body: { empresa_id: empresaId.value }
    })
    if (data?.url) {
      window.location.href = data.url
    }
  }

  // Reset ao trocar de empresa
  const reset = () => {
    assinatura.value = null
    _loaded.value = false
  }

  return {
    // Estado
    assinatura: readonly(assinatura),
    planos: readonly(planos),
    carregando: readonly(carregando),
    isSuperAdmin: readonly(isSuperAdmin),
    subscriptionState,
    loaded,

    // Helpers
    isTrial,
    isActive,
    isBlocked,
    showBanner,

    // Ações
    carregarAssinatura,
    carregarPlanos,
    verificarSuperAdmin,
    iniciarCheckout,
    abrirPortal,
    reset,
  }
}
