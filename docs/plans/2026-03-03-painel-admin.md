# Painel Admin — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a unified admin dashboard at `/admin` where the super-admin can manage all subscriptions, users, billing history, and grant/revoke free access.

**Architecture:** Expand existing admin infrastructure (super-admin check, PATCH endpoint) with a new GET endpoint that joins empresas + assinaturas + usuarios_empresas, a Stripe invoices endpoint, and a redesigned page with expandable rows. Add `'free'` status across types/composable/middleware.

**Tech Stack:** Nuxt 3, Supabase (service key for admin queries), Stripe API (invoices), Nuxt UI (UTable, UDropdown, UModal, UBadge)

---

## Task 1: Add `'free'` status to types

**Files:**
- Modify: `types/index.ts:552` (Assinatura status union)

**Step 1: Add 'free' to the Assinatura status union type**

In `types/index.ts`, line 552, change:

```typescript
// FROM:
status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired' | 'blocked'

// TO:
status: 'trial' | 'active' | 'free' | 'past_due' | 'cancelled' | 'expired' | 'blocked'
```

**Step 2: Verify no TypeScript errors**

Run: `npx nuxi typecheck` (or just verify the app compiles in next tasks)

---

## Task 2: Handle `'free'` in composable and middleware

**Files:**
- Modify: `composables/useAssinatura.ts:13-21`
- Modify: `middleware/auth.global.ts` (no changes needed — `isBlocked` already handles it)

**Step 1: Update `computeSubscriptionState` in `composables/useAssinatura.ts`**

After line 19 (`if (assin.status === 'active')` block), add a new block:

```typescript
  // Acesso gratis concedido pelo admin
  if (assin.status === 'free') {
    return { state: 'active', diasRestantes: null, mensagem: '' }
  }
```

This goes right after the `active` check (line 21) and before the `past_due` check.

**Step 2: Verify middleware needs no changes**

The middleware at `middleware/auth.global.ts:70` checks `isBlocked.value`. Since `computeSubscriptionState` now returns `state: 'active'` for `'free'`, `isBlocked` will be `false`, so no middleware change is needed.

---

## Task 3: Expand PATCH endpoint with `conceder_free` and `revogar_free` actions

**Files:**
- Modify: `server/api/admin/assinaturas.patch.ts:39-85`

**Step 1: Add two new cases to the switch statement**

After the `alterar_status` case (line 81) and before the `default` case (line 83), add:

```typescript
    case 'conceder_free': {
      const { observacao } = dados || {}
      const { error } = await supabase
        .from('assinaturas')
        .update({
          status: 'free',
          grace_fim: null,
          observacao_admin: observacao || 'Acesso gratuito concedido pelo admin'
        })
        .eq('id', assinatura_id)

      if (error) throw createError({ statusCode: 500, statusMessage: error.message })
      break
    }

    case 'revogar_free': {
      const { observacao } = dados || {}
      const { error } = await supabase
        .from('assinaturas')
        .update({
          status: 'blocked',
          observacao_admin: observacao || 'Acesso gratuito revogado pelo admin'
        })
        .eq('id', assinatura_id)

      if (error) throw createError({ statusCode: 500, statusMessage: error.message })
      break
    }
```

---

## Task 4: Create GET endpoint for admin empresas list

**Files:**
- Create: `server/api/admin/empresas.get.ts`

**Step 1: Create the endpoint**

This endpoint lists all empresas with their assinatura, plano, and user emails. Uses Supabase service key to bypass RLS.

```typescript
/**
 * GET /api/admin/empresas
 *
 * Lista todas as empresas com assinatura, plano e usuarios.
 * Apenas super-admins podem acessar.
 */
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Nao autenticado' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Verificar super-admin
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!admin) {
    throw createError({ statusCode: 403, statusMessage: 'Acesso restrito a administradores' })
  }

  // Buscar empresas com assinatura e plano
  const { data: empresas, error } = await supabase
    .from('empresas')
    .select(`
      id, nome, cnpj, ativo, created_at,
      assinaturas(
        id, status, trial_inicio, trial_fim, grace_fim,
        stripe_customer_id, stripe_subscription_id,
        taxa_implementacao_paga, data_ativacao, data_cancelamento,
        trial_estendido_por, observacao_admin, created_at,
        plano:planos(id, nome, slug, preco_mensal)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Buscar usuarios de cada empresa (auth.users nao e acessivel via join direto)
  const empresaIds = (empresas || []).map(e => e.id)

  const { data: usuarios } = await supabase
    .from('usuarios_empresas')
    .select('empresa_id, user_id, papel')
    .in('empresa_id', empresaIds)

  // Buscar emails dos users via auth.admin
  const userIds = [...new Set((usuarios || []).map(u => u.user_id))]
  const userEmails: Record<string, string> = {}

  if (userIds.length > 0) {
    // Buscar em lotes de 50
    for (let i = 0; i < userIds.length; i += 50) {
      const batch = userIds.slice(i, i + 50)
      const { data: authUsers } = await supabase.auth.admin.listUsers({
        perPage: 50,
        page: 1,
      })
      if (authUsers?.users) {
        for (const u of authUsers.users) {
          if (batch.includes(u.id)) {
            userEmails[u.id] = u.email || ''
          }
        }
      }
    }
  }

  // Montar resposta
  const result = (empresas || []).map(empresa => {
    const assinatura = Array.isArray(empresa.assinaturas)
      ? empresa.assinaturas[0] || null
      : empresa.assinaturas

    const empresaUsuarios = (usuarios || [])
      .filter(u => u.empresa_id === empresa.id)
      .map(u => ({
        user_id: u.user_id,
        email: userEmails[u.user_id] || '',
        papel: u.papel,
      }))

    return {
      id: empresa.id,
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      ativo: empresa.ativo,
      created_at: empresa.created_at,
      assinatura,
      usuarios: empresaUsuarios,
    }
  })

  return result
})
```

**Note:** The auth.admin.listUsers approach has pagination limits. A better approach for production would be to fetch all users once and build the map. For now this works for < 50 users. If scaling is needed later, we can optimize.

---

## Task 5: Create Stripe invoices endpoint

**Files:**
- Create: `server/api/admin/stripe/invoices.get.ts`

**Step 1: Create the endpoint**

```typescript
/**
 * GET /api/admin/stripe/invoices?customer_id=cus_xxx
 *
 * Lista invoices de um customer no Stripe.
 * Apenas super-admins podem acessar.
 */
import { createClient } from '@supabase/supabase-js'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Nao autenticado' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // Verificar super-admin
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!admin) {
    throw createError({ statusCode: 403, statusMessage: 'Acesso restrito a administradores' })
  }

  const query = getQuery(event)
  const customerId = query.customer_id as string

  if (!customerId) {
    throw createError({ statusCode: 400, statusMessage: 'customer_id e obrigatorio' })
  }

  if (!isStripeConfigured()) {
    return []
  }

  const stripe = getStripe()

  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 20,
    })

    return invoices.data.map(inv => ({
      id: inv.id,
      status: inv.status,
      amount: inv.amount_due / 100,
      currency: inv.currency,
      created: inv.created,
      paid_at: inv.status_transitions?.paid_at || null,
      invoice_url: inv.hosted_invoice_url,
      description: inv.lines?.data?.[0]?.description || '',
    }))
  } catch (error: any) {
    console.error('[admin/stripe/invoices] Erro:', error.message)
    return []
  }
})
```

---

## Task 6: Build the admin page

**Files:**
- Modify: `pages/admin/assinaturas.vue` → rename/replace with new content
- The page will live at `pages/admin/index.vue` (route `/admin`)

**Step 1: Delete old page and create new one**

Delete `pages/admin/assinaturas.vue` and create `pages/admin/index.vue`.

The page should have:

1. **Header**: "Painel Admin" title + Super Admin badge
2. **Access denied state**: if not super-admin
3. **Stats row**: 4 KPI cards (Total, Trial, Ativas, Free, Bloqueadas)
4. **Filters**: search input + status select dropdown
5. **Table**: UTable with columns: Empresa, Usuario, Plano, Status, Trial ate, Acoes
6. **Expandable rows**: clicking a row shows details panel below with:
   - CNPJ, data criacao, stripe_customer_id, observacao_admin
   - Historico de cobrancas (loaded on expand from Stripe API)
7. **Actions dropdown** per row with contextual items:
   - Conceder acesso gratis (if not free)
   - Revogar acesso gratis (if free)
   - Estender trial
   - Alterar status
   - Abrir no Stripe (external link, if stripe_customer_id exists)
8. **Modals**: reuse estender trial + alterar status modals from old page (add `'free'` to status options)

Full code for `pages/admin/index.vue`:

```vue
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
      <p class="text-sm text-operacao-400">Esta pagina e acessivel apenas para administradores.</p>
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
                  <p><span class="text-operacao-400">Taxa impl. paga:</span> <span class="text-operacao-700">{{ row.assinatura?.taxa_implementacao_paga ? 'Sim' : 'Nao' }}</span></p>
                </div>
                <!-- Observacao admin -->
                <div v-if="row.assinatura?.observacao_admin" class="mt-2">
                  <p class="text-xs text-operacao-400 mb-1">Observacao admin:</p>
                  <p class="text-sm text-operacao-600 bg-white rounded-lg px-3 py-2 border border-operacao-200">
                    {{ row.assinatura.observacao_admin }}
                  </p>
                </div>
              </div>

              <!-- Cobrancas -->
              <div>
                <h4 class="text-sm font-semibold text-operacao-700 mb-3">Historico de cobrancas</h4>
                <div v-if="loadingInvoices" class="text-sm text-operacao-400">Carregando...</div>
                <div v-else-if="!row.assinatura?.stripe_customer_id" class="text-sm text-operacao-400">
                  Sem Stripe customer vinculado.
                </div>
                <div v-else-if="invoices.length === 0" class="text-sm text-operacao-400">
                  Nenhuma cobranca encontrada.
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
          <h3 class="text-lg font-semibold text-operacao-800">Estender periodo de teste</h3>
        </template>
        <div class="space-y-4">
          <p class="text-sm text-operacao-500">
            Empresa: <strong>{{ empresaEditando?.nome }}</strong>
          </p>
          <UFormGroup label="Dias adicionais">
            <UInput v-model.number="diasEstender" type="number" min="1" max="365" />
          </UFormGroup>
          <UFormGroup label="Observacao (opcional)">
            <UTextarea v-model="observacaoAdmin" :rows="2" placeholder="Motivo da extensao..." />
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
          <UFormGroup label="Observacao (opcional)">
            <UTextarea v-model="observacaoAdmin" :rows="2" placeholder="Motivo da alteracao..." />
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
  { key: 'usuario', label: 'Usuario' },
  { key: 'plano', label: 'Plano' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'trial_fim', label: 'Trial ate', sortable: true },
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

// Acoes contextuais
const getAcoes = (row: any) => {
  const status = row.assinatura?.status
  const items: any[] = []

  if (status !== 'free') {
    items.push({
      label: 'Conceder acesso gratis',
      icon: 'i-heroicons-gift',
      click: () => executarAcaoRapida(row, 'conceder_free'),
    })
  }
  if (status === 'free') {
    items.push({
      label: 'Revogar acesso gratis',
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

// Acao rapida (sem modal)
const executarAcaoRapida = async (row: any, acao: string) => {
  if (!row.assinatura?.id) return
  try {
    await $fetch('/api/admin/assinaturas', {
      method: 'PATCH',
      body: { assinatura_id: row.assinatura.id, acao, dados: {} },
    })
    toast.add({
      title: acao === 'conceder_free' ? 'Acesso gratis concedido' : 'Acesso gratis revogado',
      color: 'green',
    })
    await carregarEmpresas()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error?.data?.statusMessage || 'Erro ao executar acao',
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
```

---

## Task 7: Update sidebar menu

**Files:**
- Modify: `layouts/default.vue:1229-1231`

**Step 1: Update menuAdmin route and icon**

Change:
```typescript
const menuAdmin = [
  { to: '/admin/assinaturas', icon: 'i-heroicons-shield-check', label: 'Admin' }
]
```

To:
```typescript
const menuAdmin = [
  { to: '/admin', icon: 'i-heroicons-cog-6-tooth', label: 'Painel Admin' }
]
```

---

## Task 8: Delete old admin page

**Files:**
- Delete: `pages/admin/assinaturas.vue`

**Step 1: Remove the old page**

```bash
rm pages/admin/assinaturas.vue
```

The new `/admin` route is handled by `pages/admin/index.vue` created in Task 6.

---

## Task 9: Commit

**Step 1: Stage and commit all changes**

```bash
git add types/index.ts composables/useAssinatura.ts server/api/admin/assinaturas.patch.ts server/api/admin/empresas.get.ts server/api/admin/stripe/invoices.get.ts pages/admin/index.vue layouts/default.vue docs/plans/
git add -u pages/admin/assinaturas.vue
git commit -m "feat: painel admin unificado com acesso gratis e historico Stripe"
```
