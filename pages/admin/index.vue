<template>
  <div class="max-w-7xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-bold text-operacao-800">Painel Admin</h1>
      <UBadge color="purple" label="Super Admin" variant="subtle" />
    </div>

    <!-- Acesso negado -->
    <div v-if="!isSuperAdmin && !loading" class="flex flex-col items-center justify-center py-20">
      <UIcon name="i-heroicons-lock-closed" class="w-16 h-16 text-operacao-300 mb-4" />
      <h2 class="text-lg font-semibold text-operacao-600">Acesso restrito</h2>
      <p class="text-sm text-operacao-400">Esta página é acessível apenas para administradores.</p>
    </div>

    <template v-else>
      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <UCard :ui="{ body: { padding: 'p-4' } }">
          <p class="text-xs text-operacao-400 mb-1">Total</p>
          <p class="text-2xl font-bold text-operacao-800">{{ empresas.length }}</p>
        </UCard>
        <UCard :ui="{ body: { padding: 'p-4' } }">
          <p class="text-xs text-operacao-400 mb-1">Em Trial</p>
          <p class="text-2xl font-bold text-blue-600">{{ countByStatus('trial') }}</p>
        </UCard>
        <UCard :ui="{ body: { padding: 'p-4' } }">
          <p class="text-xs text-operacao-400 mb-1">Ativas</p>
          <p class="text-2xl font-bold text-green-600">{{ countByStatus('active') }}</p>
        </UCard>
        <UCard :ui="{ body: { padding: 'p-4' } }">
          <p class="text-xs text-operacao-400 mb-1">Free</p>
          <p class="text-2xl font-bold text-guardian-600">{{ countByStatus('free') }}</p>
        </UCard>
        <UCard :ui="{ body: { padding: 'p-4' } }">
          <p class="text-xs text-operacao-400 mb-1">Bloqueadas</p>
          <p class="text-2xl font-bold text-red-600">{{ countByStatus('blocked') + countByStatus('cancelled') }}</p>
        </UCard>
      </div>

      <!-- Filtros -->
      <div class="flex items-center gap-3 mb-4">
        <UInput
          v-model="busca"
          placeholder="Buscar empresa ou email..."
          icon="i-heroicons-magnifying-glass"
          size="sm"
          class="w-72"
          :ui="{ rounded: 'rounded-lg' }"
        />
        <USelect
          v-model="filtroStatus"
          :options="opcoesStatus"
          size="sm"
          class="w-40"
          :ui="{ rounded: 'rounded-lg' }"
        />
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <svg class="animate-spin h-8 w-8 text-guardian-500" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <!-- Tabela -->
      <UCard v-else :ui="{ body: { padding: '' } }">
        <UTable
          :rows="filteredEmpresas"
          :columns="columns"
          :ui="{
            th: { base: '[&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66]' },
            tr: { base: 'cursor-pointer' },
          }"
          @select="toggleExpand"
        >
          <template #empresa-data="{ row }">
            <div>
              <p class="text-sm font-semibold text-operacao-800">{{ row.nome }}</p>
              <p v-if="row.cnpj" class="text-xs text-operacao-400">{{ row.cnpj }}</p>
            </div>
          </template>

          <template #usuario-data="{ row }">
            <div>
              <p v-for="u in row.usuarios?.slice(0, 2)" :key="u.user_id" class="text-sm text-operacao-600">
                {{ u.email }}
                <span v-if="u.papel === 'admin'" class="text-xs text-operacao-400">(admin)</span>
              </p>
              <p v-if="row.usuarios?.length > 2" class="text-xs text-operacao-400">
                +{{ row.usuarios.length - 2 }} mais
              </p>
              <p v-if="!row.usuarios?.length" class="text-xs text-operacao-400">-</p>
            </div>
          </template>

          <template #plano-data="{ row }">
            <UBadge
              v-if="row.assinatura?.plano"
              :color="(planoBadgeColor(row.assinatura.plano.slug) as any)"
              :label="row.assinatura.plano.nome"
              size="xs"
              variant="subtle"
            />
            <span v-else class="text-xs text-operacao-400">-</span>
          </template>

          <template #status-data="{ row }">
            <UBadge
              v-if="row.assinatura"
              :color="(statusColor(row.assinatura.status) as any)"
              :label="statusLabel(row.assinatura.status)"
              size="xs"
              variant="subtle"
            />
            <span v-else class="text-xs text-operacao-400">-</span>
          </template>

          <template #trial_fim-data="{ row }">
            <span class="text-sm text-operacao-600">
              {{ row.assinatura ? formatarData(row.assinatura.trial_fim) : '-' }}
            </span>
          </template>

          <template #acoes-data="{ row }">
            <UDropdown
              :items="getAcoes(row)"
              :popper="{ placement: 'bottom-end' }"
            >
              <UButton
                icon="i-heroicons-ellipsis-vertical"
                size="xs"
                color="gray"
                variant="ghost"
                @click.stop
              />
            </UDropdown>
          </template>
        </UTable>

        <!-- Linha expandida -->
        <template v-for="row in filteredEmpresas" :key="'expand-' + row.id">
          <div
            v-if="expandedId === row.id"
            class="border-t border-operacao-100 bg-operacao-50/50 px-6 py-4"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Info -->
              <div class="space-y-3">
                <h4 class="text-sm font-semibold text-operacao-700">Detalhes</h4>
                <div class="text-sm space-y-1.5">
                  <p><span class="text-operacao-400">CNPJ:</span> <span class="text-operacao-700">{{ row.cnpj || '-' }}</span></p>
                  <p><span class="text-operacao-400">Criada em:</span> <span class="text-operacao-700">{{ formatarData(row.created_at) }}</span></p>
                  <p><span class="text-operacao-400">Stripe ID:</span> <span class="text-operacao-700 font-mono text-xs">{{ row.assinatura?.stripe_customer_id || '-' }}</span></p>
                  <p><span class="text-operacao-400">Taxa impl. paga:</span> <span class="text-operacao-700">{{ row.assinatura?.taxa_implementacao_paga ? 'Sim' : 'Não' }}</span></p>
                </div>
                <!-- Observacao admin -->
                <div v-if="row.assinatura?.observacao_admin" class="mt-2">
                  <p class="text-xs text-operacao-400 mb-1">Observação admin:</p>
                  <p class="text-sm text-operacao-600 bg-white rounded-lg px-3 py-2 border border-operacao-200">
                    {{ row.assinatura.observacao_admin }}
                  </p>
                </div>
              </div>

              <!-- Cobrancas -->
              <div>
                <h4 class="text-sm font-semibold text-operacao-700 mb-3">Histórico de cobranças</h4>
                <div v-if="loadingInvoices" class="text-sm text-operacao-400">Carregando...</div>
                <div v-else-if="!row.assinatura?.stripe_customer_id" class="text-sm text-operacao-400">
                  Sem Stripe customer vinculado.
                </div>
                <div v-else-if="invoices.length === 0" class="text-sm text-operacao-400">
                  Nenhuma cobrança encontrada.
                </div>
                <div v-else class="space-y-2">
                  <div
                    v-for="inv in invoices"
                    :key="inv.id"
                    class="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-operacao-200 text-sm"
                  >
                    <div>
                      <p class="text-operacao-700">R$ {{ inv.amount.toFixed(2) }}</p>
                      <p class="text-xs text-operacao-400">{{ inv.description }}</p>
                    </div>
                    <div class="text-right">
                      <UBadge
                        :color="(inv.status === 'paid' ? 'green' : inv.status === 'open' ? 'amber' : 'red') as any"
                        :label="invoiceStatusLabel(inv.status)"
                        size="xs"
                        variant="subtle"
                      />
                      <p class="text-xs text-operacao-400 mt-0.5">{{ formatarDataTimestamp(inv.created) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-if="filteredEmpresas.length === 0 && !loading" class="text-center py-8 text-sm text-operacao-400">
          Nenhuma empresa encontrada.
        </div>
      </UCard>
    </template>

    <!-- Modal: Estender Trial -->
    <UModal v-model="showEstenderModal" :ui="{ width: 'sm:max-w-md' }">
      <UCard :ui="{ body: { padding: 'p-6' } }">
        <template #header>
          <h3 class="text-lg font-semibold text-operacao-800">Estender período de teste</h3>
        </template>
        <div class="space-y-4">
          <p class="text-sm text-operacao-500">
            Empresa: <strong>{{ empresaEditando?.nome }}</strong>
          </p>
          <UFormGroup label="Dias adicionais">
            <UInput v-model.number="diasEstender" type="number" min="1" max="365" />
          </UFormGroup>
          <UFormGroup label="Observação (opcional)">
            <UTextarea v-model="observacaoAdmin" :rows="2" placeholder="Motivo da extensão..." />
          </UFormGroup>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton label="Cancelar" color="gray" variant="ghost" @click="showEstenderModal = false" />
            <UButton label="Estender" color="blue" :loading="salvando" @click="executarEstenderTrial" />
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Alterar Status -->
    <UModal v-model="showStatusModal" :ui="{ width: 'sm:max-w-md' }">
      <UCard :ui="{ body: { padding: 'p-6' } }">
        <template #header>
          <h3 class="text-lg font-semibold text-operacao-800">Alterar status</h3>
        </template>
        <div class="space-y-4">
          <p class="text-sm text-operacao-500">
            Empresa: <strong>{{ empresaEditando?.nome }}</strong>
          </p>
          <UFormGroup label="Novo status">
            <USelect
              v-model="novoStatus"
              :options="[
                { label: 'Trial', value: 'trial' },
                { label: 'Ativa', value: 'active' },
                { label: 'Free', value: 'free' },
                { label: 'Cancelada', value: 'cancelled' },
                { label: 'Bloqueada', value: 'blocked' },
              ]"
            />
          </UFormGroup>
          <UFormGroup label="Observação (opcional)">
            <UTextarea v-model="observacaoAdmin" :rows="2" placeholder="Motivo da alteração..." />
          </UFormGroup>
        </div>
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton label="Cancelar" color="gray" variant="ghost" @click="showStatusModal = false" />
            <UButton label="Salvar" color="primary" :loading="salvando" @click="executarAlterarStatus" />
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const toast = useToast()
const { isSuperAdmin, verificarSuperAdmin } = useAssinatura()

const empresas = ref<any[]>([])
const loading = ref(true)
const busca = ref('')
const filtroStatus = ref('todos')
const salvando = ref(false)
const expandedId = ref<string | null>(null)
const invoices = ref<any[]>([])
const loadingInvoices = ref(false)

// Modais
const showEstenderModal = ref(false)
const showStatusModal = ref(false)
const empresaEditando = ref<any>(null)
const diasEstender = ref(14)
const novoStatus = ref('active')
const observacaoAdmin = ref('')

const opcoesStatus = [
  { label: 'Todos', value: 'todos' },
  { label: 'Trial', value: 'trial' },
  { label: 'Ativa', value: 'active' },
  { label: 'Free', value: 'free' },
  { label: 'Past Due', value: 'past_due' },
  { label: 'Cancelada', value: 'cancelled' },
  { label: 'Bloqueada', value: 'blocked' },
]

const columns = [
  { key: 'empresa', label: 'Empresa', sortable: true },
  { key: 'usuario', label: 'Usuário' },
  { key: 'plano', label: 'Plano' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'trial_fim', label: 'Trial até', sortable: true },
  { key: 'acoes', label: '' },
]

onMounted(async () => {
  await verificarSuperAdmin()
  if (isSuperAdmin.value) {
    await carregarEmpresas()
  }
  loading.value = false
})

const carregarEmpresas = async () => {
  try {
    const data = await $fetch('/api/admin/empresas')
    empresas.value = data as any[]
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error?.data?.statusMessage || 'Erro ao carregar empresas',
      color: 'red',
    })
  }
}

const filteredEmpresas = computed(() => {
  return empresas.value.filter(e => {
    const term = busca.value.toLowerCase()
    const matchBusca = !term ||
      e.nome?.toLowerCase().includes(term) ||
      e.usuarios?.some((u: any) => u.email?.toLowerCase().includes(term))
    const status = e.assinatura?.status
    const matchStatus = filtroStatus.value === 'todos' || status === filtroStatus.value
    return matchBusca && matchStatus
  })
})

const countByStatus = (status: string) => {
  return empresas.value.filter(e => e.assinatura?.status === status).length
}

const statusColor = (status: string): string => {
  const map: Record<string, string> = {
    trial: 'blue', active: 'green', free: 'primary',
    past_due: 'orange', cancelled: 'gray', expired: 'red', blocked: 'red',
  }
  return map[status] || 'gray'
}

const statusLabel = (status: string): string => {
  const map: Record<string, string> = {
    trial: 'Trial', active: 'Ativa', free: 'Free',
    past_due: 'Pagamento pendente', cancelled: 'Cancelada',
    expired: 'Expirada', blocked: 'Bloqueada',
  }
  return map[status] || status
}

const planoBadgeColor = (slug: string): string => {
  const map: Record<string, string> = { silver: 'gray', gold: 'amber', diamond: 'purple' }
  return map[slug] || 'gray'
}

const formatarData = (data?: string): string => {
  if (!data) return '-'
  return new Date(data).toLocaleDateString('pt-BR')
}

const formatarDataTimestamp = (ts?: number | null): string => {
  if (!ts) return '-'
  return new Date(ts * 1000).toLocaleDateString('pt-BR')
}

const invoiceStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    paid: 'Pago', open: 'Aberto', draft: 'Rascunho',
    void: 'Anulado', uncollectible: 'Inadimplente',
  }
  return map[status] || status
}

// Expandir linha
const toggleExpand = async (row: any) => {
  if (expandedId.value === row.id) {
    expandedId.value = null
    invoices.value = []
    return
  }
  expandedId.value = row.id
  invoices.value = []

  // Carregar invoices se tiver stripe_customer_id
  if (row.assinatura?.stripe_customer_id) {
    loadingInvoices.value = true
    try {
      const data = await $fetch('/api/admin/stripe/invoices', {
        query: { customer_id: row.assinatura.stripe_customer_id },
      })
      invoices.value = data as any[]
    } catch {
      invoices.value = []
    } finally {
      loadingInvoices.value = false
    }
  }
}

// Ações contextuais
const getAcoes = (row: any) => {
  const status = row.assinatura?.status
  const items: any[] = []

  if (status !== 'free') {
    items.push({
      label: 'Conceder acesso grátis',
      icon: 'i-heroicons-gift',
      click: () => executarAcaoRapida(row, 'conceder_free'),
    })
  }
  if (status === 'free') {
    items.push({
      label: 'Revogar acesso grátis',
      icon: 'i-heroicons-no-symbol',
      click: () => executarAcaoRapida(row, 'revogar_free'),
    })
  }
  items.push({
    label: 'Estender trial',
    icon: 'i-heroicons-clock',
    click: () => abrirEstenderTrial(row),
  })
  items.push({
    label: 'Alterar status',
    icon: 'i-heroicons-pencil-square',
    click: () => abrirAlterarStatus(row),
  })
  if (row.assinatura?.stripe_customer_id) {
    items.push({
      label: 'Abrir no Stripe',
      icon: 'i-heroicons-arrow-top-right-on-square',
      click: () => window.open(
        `https://dashboard.stripe.com/customers/${row.assinatura.stripe_customer_id}`,
        '_blank'
      ),
    })
  }

  return [items]
}

// Ação rápida (sem modal)
const executarAcaoRapida = async (row: any, acao: string) => {
  if (!row.assinatura?.id) return
  try {
    await $fetch('/api/admin/assinaturas', {
      method: 'PATCH',
      body: { assinatura_id: row.assinatura.id, acao, dados: {} },
    })
    toast.add({
      title: acao === 'conceder_free' ? 'Acesso grátis concedido' : 'Acesso grátis revogado',
      color: 'green',
    })
    await carregarEmpresas()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error?.data?.statusMessage || 'Erro ao executar ação',
      color: 'red',
    })
  }
}

// Estender trial
const abrirEstenderTrial = (row: any) => {
  empresaEditando.value = row
  diasEstender.value = 14
  observacaoAdmin.value = ''
  showEstenderModal.value = true
}

const executarEstenderTrial = async () => {
  if (!empresaEditando.value?.assinatura?.id) return
  salvando.value = true
  try {
    await $fetch('/api/admin/assinaturas', {
      method: 'PATCH',
      body: {
        assinatura_id: empresaEditando.value.assinatura.id,
        acao: 'estender_trial',
        dados: { dias: diasEstender.value, observacao: observacaoAdmin.value },
      },
    })
    toast.add({ title: 'Trial estendido', color: 'green' })
    showEstenderModal.value = false
    await carregarEmpresas()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error?.data?.statusMessage || 'Erro ao estender trial',
      color: 'red',
    })
  } finally {
    salvando.value = false
  }
}

// Alterar status
const abrirAlterarStatus = (row: any) => {
  empresaEditando.value = row
  novoStatus.value = row.assinatura?.status || 'trial'
  observacaoAdmin.value = ''
  showStatusModal.value = true
}

const executarAlterarStatus = async () => {
  if (!empresaEditando.value?.assinatura?.id) return
  salvando.value = true
  try {
    await $fetch('/api/admin/assinaturas', {
      method: 'PATCH',
      body: {
        assinatura_id: empresaEditando.value.assinatura.id,
        acao: 'alterar_status',
        dados: { status: novoStatus.value, observacao: observacaoAdmin.value },
      },
    })
    toast.add({ title: 'Status alterado', color: 'green' })
    showStatusModal.value = false
    await carregarEmpresas()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error?.data?.statusMessage || 'Erro ao alterar status',
      color: 'red',
    })
  } finally {
    salvando.value = false
  }
}
</script>
