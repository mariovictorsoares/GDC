# Contagens Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement complete inventory counting system with public mobile page (tokenized, no login), admin review/adjustment page, stock type separation (principal/apoio via sector type), and cron fix for WhatsApp reminders.

**Architecture:** New migration adds `tipo` to setores, `token` to contagens, `saldo_no_momento`/`ajuste_registrado` to contagem_itens, and `contagem_id` to ajustes. Public page at `/contagem/[token]` uses server API routes with `service_role` to bypass RLS. Admin page at `/movimentos/contagens` handles listing, review, and adjustment registration. Cron endpoint updated to include token link in WhatsApp messages.

**Tech Stack:** Nuxt 3, Supabase (PostgreSQL), Tailwind CSS, Nuxt UI, Z-API (WhatsApp), pg_cron

**Spec:** `docs/superpowers/specs/2026-03-12-contagens-design.md`

---

## Chunk 1: Database Migration + Types + Composable Updates

### Task 1: Create database migration

**Files:**
- Create: `supabase/migrations/024_contagens_token_setor_tipo.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- =============================================
-- Migration 024: Contagens token + setor tipo + ajuste tracking
-- =============================================

-- 1. Campo tipo nos setores (principal vs apoio)
ALTER TABLE setores ADD COLUMN tipo TEXT NOT NULL DEFAULT 'principal'
  CHECK (tipo IN ('principal', 'apoio'));

-- 2. Token permanente nas contagens (acesso publico sem login)
ALTER TABLE contagens ADD COLUMN token UUID DEFAULT gen_random_uuid();
UPDATE contagens SET token = gen_random_uuid() WHERE token IS NULL;
ALTER TABLE contagens ALTER COLUMN token SET NOT NULL;
CREATE UNIQUE INDEX idx_contagens_token ON contagens(token);

-- 3. Tracking de ajuste nos itens de contagem
ALTER TABLE contagem_itens ADD COLUMN ajuste_registrado BOOLEAN DEFAULT false;
ALTER TABLE contagem_itens ADD COLUMN saldo_no_momento NUMERIC;

-- 4. Rastreabilidade: vincular ajustes a contagens
ALTER TABLE ajustes ADD COLUMN contagem_id UUID REFERENCES contagens(id) ON DELETE SET NULL;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/024_contagens_token_setor_tipo.sql
git commit -m "feat(db): migration 024 - token contagens, tipo setores, ajuste tracking"
```

---

### Task 2: Update TypeScript types

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Add `tipo` to Setor interface**

At `types/index.ts:400-407`, update the `Setor` interface:

```typescript
export interface Setor {
  id: string
  nome: string
  descricao?: string
  tipo: 'principal' | 'apoio'
  empresa_id?: string
  created_at?: string
  produtos?: SetorProduto[]
}
```

- [ ] **Step 2: Add `token` to Contagem interface**

At `types/index.ts:422-442`, update the `Contagem` interface — add `token` field after `empresa_id`:

```typescript
export interface Contagem {
  id: string
  empresa_id?: string
  token?: string
  nome: string
  // ... rest stays the same
}
```

- [ ] **Step 3: Add new fields to ContagemItemDB**

At `types/index.ts:455-465`, update:

```typescript
export interface ContagemItemDB {
  id: string
  contagem_id: string
  setor_id: string
  produto_id: string
  quantidade_contada: number | null
  ajuste_registrado: boolean
  saldo_no_momento: number | null
  empresa_id?: string
  created_at?: string
  updated_at?: string
  produto?: Produto
}
```

- [ ] **Step 4: Add `contagem_id` to Ajuste interface**

At `types/index.ts:171-181`, update:

```typescript
export interface Ajuste {
  id: string
  produto_id: string
  contagem_id?: string
  data: string
  semana: string
  quantidade: number
  motivo?: string
  created_at?: string
  // Relacionamentos
  produto?: Produto
}
```

- [ ] **Step 5: Commit**

```bash
git add types/index.ts
git commit -m "feat(types): add token, tipo, ajuste_registrado, contagem_id fields"
```

---

### Task 3: Update composable — createSetor with tipo

**Files:**
- Modify: `composables/useEstoque.ts:1293-1302`

- [ ] **Step 1: Update createSetor signature**

Change the `createSetor` function at line 1293 to accept `tipo`:

```typescript
const createSetor = async (setor: { nome: string; descricao?: string; tipo?: 'principal' | 'apoio' }) => {
    const { data, error } = await client
      .from('setores')
      .insert({ ...setor, empresa_id: empresaId.value })
      .select()
      .single()

    if (error) throw error
    return data as import('~/types').Setor
  }
```

- [ ] **Step 2: Commit**

```bash
git add composables/useEstoque.ts
git commit -m "feat(composable): createSetor accepts tipo parameter"
```

---

### Task 4: Update composable — createAjustesEmLote with contagem_id

**Files:**
- Modify: `composables/useEstoque.ts:641-659`

- [ ] **Step 1: Update createAjustesEmLote signature**

Change at line 641 to accept optional `contagem_id`:

```typescript
const createAjustesEmLote = async (ajustes: Array<{ produto_id: string; data: string; semana: string; quantidade: number; motivo: string; contagem_id?: string }>) => {
    if (!ajustes.length) return []

    const payload = ajustes.map(a => ({
      ...a,
      empresa_id: empresaId.value
    }))

    const { data, error } = await client
      .from('ajustes')
      .insert(payload)
      .select(`
        *,
        produto:produtos(*, categoria:categorias(*), subgrupo:subgrupos(*, grupo:grupos(*)), unidade:unidades(*))
      `)

    if (error) throw error
    return data as Ajuste[]
  }
```

- [ ] **Step 2: Add `markContagemItensAjustados` method**

Add after `resetContagemSetores` (after line 1274):

```typescript
const markContagemItensAjustados = async (contagemId: string, produtoIds: string[]) => {
    if (!produtoIds.length) return
    const { error } = await client
      .from('contagem_itens')
      .update({ ajuste_registrado: true })
      .eq('contagem_id', contagemId)
      .in('produto_id', produtoIds)

    if (error) throw error
  }

  const snapshotSaldoContagem = async (contagemId: string, saldos: Array<{ produto_id: string; saldo: number }>) => {
    // Batch update using Promise.all for better performance
    await Promise.all(saldos.map(s =>
      client
        .from('contagem_itens')
        .update({ saldo_no_momento: s.saldo })
        .eq('contagem_id', contagemId)
        .eq('produto_id', s.produto_id)
    ))
  }
```

- [ ] **Step 3: Export new methods**

At the return block (starts at line 1380, look for the `// Contagem Itens` section around line 1472-1477), add the new methods:

```typescript
    // Contagem Itens
    getContagemItens,
    upsertContagemItens,
    deleteContagemItens,
    updateContagemSetor,
    resetContagemSetores,
    markContagemItensAjustados,
    snapshotSaldoContagem,
```

- [ ] **Step 4: Commit**

```bash
git add composables/useEstoque.ts
git commit -m "feat(composable): ajustesEmLote with contagem_id, mark/snapshot methods"
```

---

### Task 5: Update getContagens to include setor.tipo in join

**Files:**
- Modify: `composables/useEstoque.ts:1060`

- [ ] **Step 1: Add `tipo` to the setores join in getContagens select**

At line 1060, change:

```typescript
.select('*, contagem_setores(id, contagem_id, setor_id, status, progresso, finalizado_em, setor:setores(id, nome))')
```

to:

```typescript
.select('*, contagem_setores(id, contagem_id, setor_id, status, progresso, finalizado_em, setor:setores(id, nome, tipo))')
```

This ensures the admin page can access `cs.setor.tipo` to determine whether each setor is `principal` or `apoio`.

- [ ] **Step 2: Commit**

```bash
git add composables/useEstoque.ts
git commit -m "feat(composable): include setor.tipo in getContagens join"
```

---

## Chunk 2: Auth Middleware + Server API Routes

### Task 6: Update auth middleware for public contagem routes

**Files:**
- Modify: `middleware/auth.global.ts:5-6`

- [ ] **Step 1: Add contagem routes to public routes**

At line 5, update the `publicRoutes` array:

```typescript
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
```

Change to also check for contagem prefix:

```typescript
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

// Rotas de contagem pública (acessadas via token, sem login)
if (to.path.startsWith('/contagem/')) {
  return
}
```

Add this check right after line 8 (`if (publicRoutes.includes(to.path))`), before the `if (!user.value)` check:

```typescript
// Se a rota é pública, permite acesso
if (publicRoutes.includes(to.path)) {
  return
}

// Rotas de contagem pública (acessadas via token, sem login)
if (to.path.startsWith('/contagem/')) {
  return
}
```

- [ ] **Step 2: Commit**

```bash
git add middleware/auth.global.ts
git commit -m "feat(auth): allow public access to /contagem/ routes"
```

---

### Task 7: Create GET API route for public contagem

**Files:**
- Create: `server/api/contagem/[token].get.ts`

- [ ] **Step 1: Write the GET endpoint**

```typescript
/**
 * GET /api/contagem/[token]
 * Retorna dados da contagem para a página pública (sem autenticação).
 * Usa service_role para bypassar RLS.
 */
import { getSupabaseAdmin } from '~/server/utils/supabase-admin'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, message: 'Token obrigatório' })
  }

  const supabase = getSupabaseAdmin()

  // 1. Buscar contagem pelo token
  const { data: contagem, error: errContagem } = await supabase
    .from('contagens')
    .select(`
      id, nome, data, status, empresa_id,
      contagem_setores (
        id, setor_id, status, progresso,
        setor:setores ( id, nome, tipo )
      )
    `)
    .eq('token', token)
    .single()

  if (errContagem || !contagem) {
    throw createError({ statusCode: 404, message: 'Contagem não encontrada' })
  }

  if (contagem.status === 'finalizada') {
    throw createError({ statusCode: 410, message: 'Esta contagem já foi finalizada' })
  }

  // 2. Buscar produtos de cada setor
  const setorIds = (contagem.contagem_setores || []).map((cs: any) => cs.setor_id)

  const { data: setorProdutos, error: errProdutos } = await supabase
    .from('setor_produtos')
    .select(`
      setor_id,
      produto:produtos ( id, nome, unidade:unidades ( sigla ) )
    `)
    .in('setor_id', setorIds)

  if (errProdutos) {
    throw createError({ statusCode: 500, message: errProdutos.message })
  }

  // 3. Buscar itens já contados
  const { data: itensContados, error: errItens } = await supabase
    .from('contagem_itens')
    .select('setor_id, produto_id, quantidade_contada')
    .eq('contagem_id', contagem.id)

  if (errItens) {
    throw createError({ statusCode: 500, message: errItens.message })
  }

  // 4. Montar resposta agrupada por setor
  const itensMap = new Map<string, Map<string, number | null>>()
  for (const item of (itensContados || [])) {
    if (!itensMap.has(item.setor_id)) itensMap.set(item.setor_id, new Map())
    itensMap.get(item.setor_id)!.set(item.produto_id, item.quantidade_contada)
  }

  const produtosMap = new Map<string, any[]>()
  for (const sp of (setorProdutos || [])) {
    if (!produtosMap.has(sp.setor_id)) produtosMap.set(sp.setor_id, [])
    produtosMap.get(sp.setor_id)!.push(sp.produto)
  }

  const setores = (contagem.contagem_setores || []).map((cs: any) => ({
    id: cs.setor_id,
    nome: cs.setor?.nome || '',
    tipo: cs.setor?.tipo || 'principal',
    status: cs.status || 'pendente',
    progresso: cs.progresso || 0,
    produtos: (produtosMap.get(cs.setor_id) || []).map((p: any) => ({
      id: p.id,
      nome: p.nome,
      unidade: p.unidade?.sigla || '',
      quantidade_contada: itensMap.get(cs.setor_id)?.get(p.id) ?? null
    }))
  }))

  return {
    contagem: {
      id: contagem.id,
      nome: contagem.nome,
      data: contagem.data,
      status: contagem.status
    },
    setores
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add server/api/contagem/\[token\].get.ts
git commit -m "feat(api): GET /api/contagem/[token] - public contagem data endpoint"
```

---

### Task 8: Create POST API route for public contagem

**Files:**
- Create: `server/api/contagem/[token].post.ts`

- [ ] **Step 1: Write the POST endpoint**

```typescript
/**
 * POST /api/contagem/[token]
 * Salva itens contados da página pública (sem autenticação).
 * Valida que setor pertence à contagem e produtos pertencem ao setor.
 * Usa service_role para bypassar RLS.
 */
import { getSupabaseAdmin } from '~/server/utils/supabase-admin'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, message: 'Token obrigatório' })
  }

  const body = await readBody(event)
  if (!body?.setor_id || !Array.isArray(body?.itens)) {
    throw createError({ statusCode: 400, message: 'setor_id e itens[] são obrigatórios' })
  }

  const supabase = getSupabaseAdmin()

  // 1. Buscar contagem pelo token
  const { data: contagem, error: errContagem } = await supabase
    .from('contagens')
    .select('id, empresa_id, status')
    .eq('token', token)
    .single()

  if (errContagem || !contagem) {
    throw createError({ statusCode: 404, message: 'Contagem não encontrada' })
  }

  if (contagem.status === 'finalizada') {
    throw createError({ statusCode: 410, message: 'Esta contagem já foi finalizada' })
  }

  // 2. Validar que setor pertence a esta contagem
  const { data: contagemSetor, error: errSetor } = await supabase
    .from('contagem_setores')
    .select('id, setor_id')
    .eq('contagem_id', contagem.id)
    .eq('setor_id', body.setor_id)
    .single()

  if (errSetor || !contagemSetor) {
    throw createError({ statusCode: 400, message: 'Setor não pertence a esta contagem' })
  }

  // 3. Validar que produtos pertencem ao setor
  const { data: setorProdutos } = await supabase
    .from('setor_produtos')
    .select('produto_id')
    .eq('setor_id', body.setor_id)

  const produtosValidos = new Set((setorProdutos || []).map((sp: any) => sp.produto_id))
  const itensValidos = body.itens.filter((i: any) =>
    produtosValidos.has(i.produto_id) &&
    i.quantidade_contada !== null &&
    i.quantidade_contada !== undefined
  )

  if (!itensValidos.length) {
    return { success: true, saved: 0 }
  }

  // 4. Upsert itens contados
  const payload = itensValidos.map((i: any) => ({
    contagem_id: contagem.id,
    setor_id: body.setor_id,
    produto_id: i.produto_id,
    quantidade_contada: Number(i.quantidade_contada),
    empresa_id: contagem.empresa_id,
    updated_at: new Date().toISOString()
  }))

  const { error: errUpsert } = await supabase
    .from('contagem_itens')
    .upsert(payload, { onConflict: 'contagem_id,setor_id,produto_id' })

  if (errUpsert) {
    throw createError({ statusCode: 500, message: errUpsert.message })
  }

  // 5. Atualizar progresso do setor
  const totalProdutos = produtosValidos.size
  const { count: contados } = await supabase
    .from('contagem_itens')
    .select('*', { count: 'exact', head: true })
    .eq('contagem_id', contagem.id)
    .eq('setor_id', body.setor_id)
    .not('quantidade_contada', 'is', null)

  const progresso = totalProdutos > 0 ? Math.round(((contados || 0) / totalProdutos) * 100) : 0
  const setorStatus = progresso >= 100 ? 'finalizado' : 'em_andamento'

  await supabase
    .from('contagem_setores')
    .update({
      status: setorStatus,
      progresso,
      ...(setorStatus === 'finalizado' ? { finalizado_em: new Date().toISOString() } : {})
    })
    .eq('contagem_id', contagem.id)
    .eq('setor_id', body.setor_id)

  // 6. Atualizar status da contagem para em_andamento se ainda não está
  if (contagem.status === 'aguardando' || contagem.status === 'pendente' || contagem.status === 'atrasada') {
    await supabase
      .from('contagens')
      .update({ status: 'em_andamento', updated_at: new Date().toISOString() })
      .eq('id', contagem.id)
  }

  // 7. Checar se todos os setores estão finalizados → auto-finalizar contagem
  const { data: todosSetores } = await supabase
    .from('contagem_setores')
    .select('status')
    .eq('contagem_id', contagem.id)

  const todosFinalizados = (todosSetores || []).every((s: any) => s.status === 'finalizado')

  if (todosFinalizados) {
    // Auto-finalizar a contagem e salvar snapshot dos saldos
    await supabase
      .from('contagens')
      .update({ status: 'finalizada', updated_at: new Date().toISOString() })
      .eq('id', contagem.id)

    // Snapshot dos saldos atuais para cada item contado
    const { data: itensContagem } = await supabase
      .from('contagem_itens')
      .select('produto_id, setor_id')
      .eq('contagem_id', contagem.id)

    if (itensContagem && itensContagem.length > 0) {
      // Buscar setores com tipo para saber qual saldo usar
      const { data: setoresInfo } = await supabase
        .from('contagem_setores')
        .select('setor_id, setor:setores(tipo)')
        .eq('contagem_id', contagem.id)

      const setorTipoMap = new Map((setoresInfo || []).map((s: any) => [s.setor_id, s.setor?.tipo || 'principal']))

      // Buscar saldos da view
      const produtoIds = [...new Set(itensContagem.map(i => i.produto_id))]
      const { data: saldoData } = await supabase
        .from('v_saldo_estoque')
        .select('produto_id, saldo_principal, saldo_apoio')
        .eq('empresa_id', contagem.empresa_id)
        .in('produto_id', produtoIds)

      const saldoMap = new Map((saldoData || []).map((s: any) => [s.produto_id, s]))

      // Atualizar saldo_no_momento para cada item
      for (const item of itensContagem) {
        const saldo = saldoMap.get(item.produto_id)
        const tipo = setorTipoMap.get(item.setor_id) || 'principal'
        const saldoValor = tipo === 'apoio' ? (saldo?.saldo_apoio || 0) : (saldo?.saldo_principal || 0)

        await supabase
          .from('contagem_itens')
          .update({ saldo_no_momento: saldoValor })
          .eq('contagem_id', contagem.id)
          .eq('produto_id', item.produto_id)
          .eq('setor_id', item.setor_id)
      }
    }
  }

  return {
    success: true,
    saved: itensValidos.length,
    progresso,
    setorFinalizado: setorStatus === 'finalizado',
    contagemCompleta: todosFinalizados
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add server/api/contagem/\[token\].post.ts
git commit -m "feat(api): POST /api/contagem/[token] - save counted items with validation"
```

---

## Chunk 3: Public Mobile Counting Page

### Task 9: Create public counting page

**Files:**
- Create: `pages/contagem/[token].vue`

- [ ] **Step 1: Write the page component**

This is a mobile-first page with `layout: false`. It fetches data from the GET endpoint, shows products per sector with numeric inputs, and saves via POST.

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-4 py-4">
      <div class="flex items-center gap-3">
        <img src="/logo.png" alt="CMV360" class="h-8 w-8" />
        <div>
          <h1 class="text-lg font-semibold text-gray-900">{{ dados?.contagem?.nome || 'Contagem' }}</h1>
          <p class="text-sm text-gray-500">{{ formatarData(dados?.contagem?.data) }}</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-guardian-500" />
    </div>

    <!-- Error: Token inválido -->
    <div v-else-if="erro" class="flex flex-col items-center justify-center py-20 px-6 text-center">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-16 h-16 text-red-400 mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 mb-2">{{ erro === 'finalizada' ? 'Contagem finalizada' : 'Link inválido' }}</h2>
      <p class="text-gray-500">
        {{ erro === 'finalizada' ? 'Esta contagem já foi concluída.' : 'Este link de contagem não é válido ou não existe.' }}
      </p>
    </div>

    <!-- Sucesso -->
    <div v-else-if="contagemCompleta" class="flex flex-col items-center justify-center py-20 px-6 text-center">
      <UIcon name="i-heroicons-check-circle" class="w-16 h-16 text-green-500 mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Contagem concluída!</h2>
      <p class="text-gray-500">Todos os setores foram contados. Obrigado!</p>
    </div>

    <!-- Contagem ativa -->
    <div v-else-if="dados" class="pb-32">
      <!-- Seletor de setor -->
      <div class="px-4 py-3 bg-white border-b">
        <label class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Setor</label>
        <select
          v-model="setorAtivo"
          class="w-full rounded-lg border-gray-300 text-sm focus:ring-guardian-500 focus:border-guardian-500"
        >
          <option v-for="s in dados.setores" :key="s.id" :value="s.id">
            {{ s.nome }} ({{ s.tipo === 'apoio' ? 'Apoio' : 'Principal' }})
            {{ s.progresso > 0 ? `— ${s.progresso}%` : '' }}
          </option>
        </select>
      </div>

      <!-- Busca -->
      <div class="px-4 py-2 bg-white border-b">
        <UInput
          v-model="busca"
          icon="i-heroicons-magnifying-glass"
          placeholder="Buscar produto..."
          size="sm"
        />
      </div>

      <!-- Lista de produtos -->
      <div class="divide-y divide-gray-100">
        <div
          v-for="produto in produtosFiltrados"
          :key="produto.id"
          class="flex items-center justify-between px-4 py-3 bg-white"
        >
          <div class="flex-1 min-w-0 mr-3">
            <p class="text-sm font-medium text-gray-900 truncate">{{ produto.nome }}</p>
            <p class="text-xs text-gray-400">{{ produto.unidade }}</p>
          </div>
          <input
            v-model.number="quantidades[produto.id]"
            type="number"
            inputmode="decimal"
            min="0"
            step="any"
            placeholder="0"
            class="w-20 text-right rounded-lg border-gray-300 text-sm focus:ring-guardian-500 focus:border-guardian-500"
          />
        </div>

        <div v-if="produtosFiltrados.length === 0" class="py-8 text-center text-gray-400 text-sm">
          Nenhum produto encontrado
        </div>
      </div>
    </div>

    <!-- Footer fixo -->
    <div v-if="dados && !contagemCompleta && !erro" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-bottom">
      <!-- Barra de progresso -->
      <div class="flex items-center gap-2 mb-3">
        <div class="flex-1 bg-gray-200 rounded-full h-2">
          <div
            class="bg-guardian-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${progressoAtual}%` }"
          />
        </div>
        <span class="text-xs font-medium text-gray-500 w-10 text-right">{{ progressoAtual }}%</span>
      </div>

      <UButton
        block
        :loading="salvando"
        :disabled="salvando"
        color="primary"
        size="lg"
        @click="salvarSetor"
      >
        Salvar Setor
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const token = computed(() => route.params.token as string)
const toast = useToast()

const loading = ref(true)
const erro = ref<string | null>(null)
const dados = ref<any>(null)
const setorAtivo = ref<string>('')
const busca = ref('')
const quantidades = ref<Record<string, number | null>>({})
const salvando = ref(false)
const contagemCompleta = ref(false)

// Carregar dados
const carregarDados = async () => {
  loading.value = true
  erro.value = null
  try {
    const res = await $fetch(`/api/contagem/${token.value}`)
    dados.value = res
    if (res.setores?.length > 0) {
      setorAtivo.value = res.setores[0].id
      // Carregar quantidades já contadas
      for (const setor of res.setores) {
        for (const p of setor.produtos) {
          if (p.quantidade_contada !== null) {
            quantidades.value[p.id] = p.quantidade_contada
          }
        }
      }
    }
  } catch (e: any) {
    if (e?.statusCode === 410) {
      erro.value = 'finalizada'
    } else {
      erro.value = 'invalido'
    }
  } finally {
    loading.value = false
  }
}

onMounted(carregarDados)

// Setor ativo
const setorAtual = computed(() => {
  return dados.value?.setores?.find((s: any) => s.id === setorAtivo.value)
})

const produtosFiltrados = computed(() => {
  if (!setorAtual.value) return []
  const term = busca.value.toLowerCase()
  return setorAtual.value.produtos.filter((p: any) =>
    !term || p.nome.toLowerCase().includes(term)
  )
})

// Progresso do setor atual
const progressoAtual = computed(() => {
  if (!setorAtual.value) return 0
  const total = setorAtual.value.produtos.length
  if (!total) return 0
  const preenchidos = setorAtual.value.produtos.filter(
    (p: any) => quantidades.value[p.id] !== null && quantidades.value[p.id] !== undefined
  ).length
  return Math.round((preenchidos / total) * 100)
})

const formatarData = (data?: string) => {
  if (!data) return ''
  const d = new Date(data + 'T00:00:00')
  return d.toLocaleDateString('pt-BR')
}

// Salvar
const salvarSetor = async () => {
  if (!setorAtual.value) return
  salvando.value = true

  const itens = setorAtual.value.produtos
    .filter((p: any) => quantidades.value[p.id] !== null && quantidades.value[p.id] !== undefined)
    .map((p: any) => ({
      produto_id: p.id,
      quantidade_contada: quantidades.value[p.id]
    }))

  try {
    const res = await $fetch(`/api/contagem/${token.value}`, {
      method: 'POST',
      body: {
        setor_id: setorAtivo.value,
        itens
      }
    })

    if (res.contagemCompleta) {
      contagemCompleta.value = true
    } else {
      toast.add({ title: 'Setor salvo!', color: 'green', icon: 'i-heroicons-check-circle' })
      // Atualizar progresso local
      if (setorAtual.value) {
        setorAtual.value.progresso = res.progresso
        setorAtual.value.status = res.setorFinalizado ? 'finalizado' : 'em_andamento'
      }
    }
  } catch (e: any) {
    toast.add({ title: 'Erro ao salvar', description: e?.data?.message || e?.message, color: 'red' })
  } finally {
    salvando.value = false
  }
}
</script>

<style scoped>
.safe-area-bottom {
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add pages/contagem/\[token\].vue
git commit -m "feat(page): public mobile counting page at /contagem/[token]"
```

---

## Chunk 4: Admin Page — List + Details + Adjustments

### Task 10: Create admin contagens page

**Files:**
- Create: `pages/movimentos/contagens.vue`

- [ ] **Step 1: Write the admin page**

This page has two views: list (default) and details (when a contagem is selected). It reuses existing modal components (ContagemEditarModal, SetorGerenciarModal) for creation/editing.

```vue
<template>
  <div class="p-6 space-y-4">
    <!-- View: Detalhes -->
    <div v-if="contagemSelecionada">
      <!-- Header com voltar -->
      <div class="flex items-center gap-3 mb-4">
        <UButton
          icon="i-heroicons-arrow-left"
          variant="ghost"
          color="gray"
          @click="contagemSelecionada = null"
        />
        <div>
          <h1 class="text-xl font-semibold text-gray-900">{{ contagemSelecionada.nome }}</h1>
          <p class="text-sm text-gray-500">{{ formatarData(contagemSelecionada.data) }}</p>
        </div>
        <UBadge :color="statusColor(contagemSelecionada.status)" class="ml-2">
          {{ statusLabel(contagemSelecionada.status) }}
        </UBadge>
      </div>

      <!-- Contagem Em Andamento / Pendente -->
      <div v-if="contagemSelecionada.status !== 'finalizada'">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <!-- Progresso por setor -->
          <UCard v-for="cs in contagemSelecionada.contagem_setores" :key="cs.id">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-sm">{{ cs.setor?.nome || 'Setor' }}</span>
              <span class="text-xs text-gray-500">{{ cs.progresso || 0 }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-guardian-500 h-2 rounded-full transition-all"
                :style="{ width: `${cs.progresso || 0}%` }"
              />
            </div>
          </UCard>
        </div>

        <!-- Ações -->
        <div class="flex gap-2">
          <UButton
            icon="i-heroicons-link"
            variant="outline"
            size="sm"
            @click="copiarLink(contagemSelecionada.token)"
          >
            Copiar Link
          </UButton>
          <UButton
            v-if="contagemSelecionada.responsavel_telefone"
            icon="i-heroicons-chat-bubble-left"
            variant="outline"
            size="sm"
            color="green"
            @click="enviarLembrete(contagemSelecionada)"
          >
            Enviar Lembrete
          </UButton>
        </div>
      </div>

      <!-- Contagem Finalizada: Revisão -->
      <div v-else>
        <!-- KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <UCard>
            <p class="text-xs text-gray-500 uppercase">Contados</p>
            <p class="text-2xl font-bold">{{ kpis.contados }}</p>
          </UCard>
          <UCard>
            <p class="text-xs text-gray-500 uppercase">Divergências</p>
            <p class="text-2xl font-bold text-amber-600">{{ kpis.divergencias }}</p>
          </UCard>
          <UCard>
            <p class="text-xs text-gray-500 uppercase">Sobras</p>
            <p class="text-2xl font-bold text-green-600">{{ kpis.sobras }}</p>
          </UCard>
          <UCard>
            <p class="text-xs text-gray-500 uppercase">Faltas</p>
            <p class="text-2xl font-bold text-red-600">{{ kpis.faltas }}</p>
          </UCard>
        </div>

        <!-- Tabela de divergências por setor -->
        <div v-for="setor in setoresRevisao" :key="setor.id" class="mb-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-2">
            {{ setor.nome }}
            <span class="text-xs font-normal text-gray-400 ml-1">({{ setor.tipo === 'apoio' ? 'Apoio' : 'Principal' }})</span>
          </h3>
          <UTable
            :rows="setor.itens"
            :columns="colunasRevisao"
          >
            <template #diferenca-data="{ row }">
              <span :class="row.diferenca > 0 ? 'text-green-600' : row.diferenca < 0 ? 'text-red-600' : 'text-gray-400'">
                {{ row.diferenca > 0 ? '+' : '' }}{{ row.diferenca }}
              </span>
            </template>
            <template #acao-data="{ row }">
              <UBadge v-if="row.ajuste_registrado" color="green" variant="subtle">Ajustado</UBadge>
              <UButton
                v-else-if="row.diferenca !== 0"
                size="xs"
                variant="soft"
                @click="registrarAjusteIndividual(row)"
                :loading="ajustandoIds.has(row.produto_id)"
              >
                Ajustar
              </UButton>
              <span v-else class="text-xs text-gray-400">—</span>
            </template>
          </UTable>
        </div>

        <!-- Botão registrar todos -->
        <div v-if="temDivergenciasPendentes" class="flex justify-end">
          <UButton
            color="primary"
            :loading="ajustandoTodos"
            @click="registrarTodosAjustes"
          >
            Registrar Todos os Ajustes
          </UButton>
        </div>
      </div>
    </div>

    <!-- View: Lista -->
    <div v-else>
      <h1 class="text-xl font-semibold text-gray-900 mb-4">Contagens</h1>

      <!-- Toolbar -->
      <div class="flex items-center gap-3 mb-4">
        <UInput
          v-model="filtroNome"
          icon="i-heroicons-magnifying-glass"
          placeholder="Buscar contagem..."
          size="sm"
          class="w-64"
        />
        <USelect
          v-model="filtroStatus"
          :options="opcoesStatus"
          size="sm"
          class="w-40"
        />
        <div class="flex-1" />
        <UButton
          icon="i-heroicons-plus"
          color="primary"
          size="sm"
          @click="abrirCriacao"
        >
          Nova Contagem
        </UButton>
      </div>

      <!-- Tabela -->
      <UTable
        :rows="contagensFiltradas"
        :columns="colunasLista"
        :loading="carregando"
        @select="selecionarContagem"
        class="cursor-pointer"
      >
        <template #status-data="{ row }">
          <UBadge :color="statusColor(row.status)" variant="subtle">
            {{ statusLabel(row.status) }}
          </UBadge>
          <UBadge v-if="row.status === 'finalizada' && isAjustado(row)" color="green" variant="subtle" class="ml-1">
            Ajustado
          </UBadge>
        </template>
        <template #acoes-data="{ row }">
          <div class="flex gap-1" @click.stop>
            <UTooltip text="Copiar link">
              <UButton
                icon="i-heroicons-link"
                variant="ghost"
                color="gray"
                size="xs"
                @click="copiarLink(row.token)"
              />
            </UTooltip>
            <UTooltip text="Editar">
              <UButton
                icon="i-heroicons-pencil"
                variant="ghost"
                color="gray"
                size="xs"
                @click="abrirEdicao(row)"
              />
            </UTooltip>
            <UTooltip text="Excluir">
              <UButton
                icon="i-heroicons-trash"
                variant="ghost"
                color="red"
                size="xs"
                @click="confirmarExclusao(row)"
              />
            </UTooltip>
          </div>
        </template>
      </UTable>
    </div>

    <!-- Modais existentes -->
    <ContagemEditarModal
      v-if="modalEditar"
      :contagem="contagemEditando"
      @close="modalEditar = false"
      @saved="onContagemSalva"
    />
  </div>
</template>

<script setup lang="ts">
import type { Contagem, ContagemItemDB, SaldoEstoque } from '~/types'

const toast = useToast()
const { getContagens, deleteContagem, getSaldoEstoque, createAjustesEmLote, markContagemItensAjustados, getContagemItens, updateContagemStatus } = useEstoque()

// Calcula semana no formato usado pelo sistema (ex: "SEMANA 1")
const calcularSemana = (dataStr: string): string => {
  const d = new Date(dataStr + 'T00:00:00')
  const dia = d.getDate()
  const semanaNum = Math.ceil(dia / 7)
  return `SEMANA ${semanaNum}`
}

// Estado da lista
const contagens = ref<Contagem[]>([])
const carregando = ref(false)
const filtroNome = ref('')
const filtroStatus = ref('todos')
const contagemSelecionada = ref<Contagem | null>(null)

// Estado da revisão
const itensRevisao = ref<ContagemItemDB[]>([])
const saldos = ref<SaldoEstoque[]>([])
const ajustandoIds = ref(new Set<string>())
const ajustandoTodos = ref(false)

// Estado de modais
const modalEditar = ref(false)
const contagemEditando = ref<Contagem | null>(null)

const opcoesStatus = [
  { label: 'Todos', value: 'todos' },
  { label: 'Aguardando', value: 'aguardando' },
  { label: 'Pendente', value: 'pendente' },
  { label: 'Em andamento', value: 'em_andamento' },
  { label: 'Finalizada', value: 'finalizada' }
]

const colunasLista = [
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'data', label: 'Data', sortable: true },
  { key: 'responsavel_nome', label: 'Responsável' },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: '' }
]

const colunasRevisao = [
  { key: 'produto_nome', label: 'Produto' },
  { key: 'saldo_sistema', label: 'Sistema' },
  { key: 'quantidade_contada', label: 'Contado' },
  { key: 'diferenca', label: 'Dif' },
  { key: 'acao', label: '' }
]

// Carregar dados
const carregarContagens = async () => {
  carregando.value = true
  try {
    contagens.value = await getContagens()
    await checarStatusAjustado()
  } finally {
    carregando.value = false
  }
}

onMounted(carregarContagens)

// Filtro
const contagensFiltradas = computed(() => {
  let lista = contagens.value
  if (filtroNome.value) {
    const term = filtroNome.value.toLowerCase()
    lista = lista.filter(c => c.nome.toLowerCase().includes(term))
  }
  if (filtroStatus.value !== 'todos') {
    lista = lista.filter(c => c.status === filtroStatus.value)
  }
  return lista
})

// Formatação
const formatarData = (data?: string) => {
  if (!data) return ''
  return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
}

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    aguardando: 'blue',
    pendente: 'yellow',
    atrasada: 'red',
    em_andamento: 'orange',
    finalizada: 'green'
  }
  return map[status] || 'gray'
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    aguardando: 'Aguardando',
    pendente: 'Pendente',
    atrasada: 'Atrasada',
    em_andamento: 'Em andamento',
    finalizada: 'Finalizada'
  }
  return map[status] || status
}

// Seleção de contagem
const selecionarContagem = async (row: Contagem) => {
  contagemSelecionada.value = row

  if (row.status === 'finalizada') {
    // Carregar itens + saldos para revisão
    const [itens, saldoData] = await Promise.all([
      getContagemItens(row.id),
      getSaldoEstoque()
    ])
    itensRevisao.value = itens
    saldos.value = saldoData
  }
}

// Dados de revisão
const setoresRevisao = computed(() => {
  if (!contagemSelecionada.value?.contagem_setores) return []
  const saldoMap = new Map(saldos.value.map(s => [s.produto_id, s]))

  return contagemSelecionada.value.contagem_setores.map(cs => {
    const setorTipo = (cs.setor as any)?.tipo || 'principal'
    const itensDoSetor = itensRevisao.value.filter(i => i.setor_id === cs.setor_id)

    return {
      id: cs.setor_id,
      nome: cs.setor?.nome || '',
      tipo: setorTipo,
      itens: itensDoSetor.map(item => {
        const saldo = saldoMap.get(item.produto_id)
        const saldoSistema = item.saldo_no_momento ??
          (setorTipo === 'apoio' ? (saldo?.saldo_apoio || 0) : (saldo?.saldo_principal || 0))
        const diferenca = (item.quantidade_contada ?? 0) - saldoSistema

        return {
          produto_id: item.produto_id,
          produto_nome: saldo?.produto || item.produto_id,
          saldo_sistema: saldoSistema,
          quantidade_contada: item.quantidade_contada,
          diferenca,
          ajuste_registrado: item.ajuste_registrado
        }
      })
    }
  })
})

const kpis = computed(() => {
  const todosItens = setoresRevisao.value.flatMap(s => s.itens)
  return {
    contados: todosItens.length,
    divergencias: todosItens.filter(i => i.diferenca !== 0).length,
    sobras: todosItens.filter(i => i.diferenca > 0).length,
    faltas: todosItens.filter(i => i.diferenca < 0).length
  }
})

const temDivergenciasPendentes = computed(() => {
  return setoresRevisao.value.some(s =>
    s.itens.some(i => i.diferenca !== 0 && !i.ajuste_registrado)
  )
})

// Cache de status "ajustado" por contagem (carregado sob demanda)
const ajustadoCache = ref<Record<string, boolean>>({})

const isAjustado = (contagem: Contagem) => {
  return ajustadoCache.value[contagem.id] || false
}

// Ao carregar contagens, checar quais finalizadas tem todos ajustes feitos
const checarStatusAjustado = async () => {
  const finalizadas = contagens.value.filter(c => c.status === 'finalizada')
  for (const c of finalizadas) {
    const itens = await getContagemItens(c.id)
    const comDivergencia = itens.filter(i =>
      i.quantidade_contada !== null && i.saldo_no_momento !== null &&
      i.quantidade_contada !== i.saldo_no_momento
    )
    ajustadoCache.value[c.id] = comDivergencia.length > 0 &&
      comDivergencia.every(i => i.ajuste_registrado)
  }
}

// Ações
const copiarLink = (token?: string) => {
  if (!token) return
  const url = `https://www.cmv360app.com.br/contagem/${token}`
  navigator.clipboard.writeText(url)
  toast.add({ title: 'Link copiado!', color: 'green' })
}

const enviarLembrete = async (contagem: Contagem) => {
  if (!contagem.responsavel_telefone || !contagem.responsavel_nome) return
  try {
    const mensagem = [
      `📋 *Lembrete de Contagem*`,
      ``,
      `Olá, *${contagem.responsavel_nome}*!`,
      `Está na hora de realizar a contagem:`,
      ``,
      `📌 *${contagem.nome}*`,
      ``,
      `👉 *Acesse e inicie a contagem:*`,
      `https://www.cmv360app.com.br/contagem/${contagem.token}`
    ].join('\n')

    await $fetch('/api/whatsapp/enviar', {
      method: 'POST',
      body: { phone: contagem.responsavel_telefone, message: mensagem }
    })
    toast.add({ title: 'Lembrete enviado!', color: 'green' })
  } catch {
    toast.add({ title: 'Erro ao enviar lembrete', color: 'red' })
  }
}

const registrarAjusteIndividual = async (item: any) => {
  if (!contagemSelecionada.value || item.diferenca === 0) return
  ajustandoIds.value.add(item.produto_id)

  try {
    const hoje = new Date().toISOString().split('T')[0]
    const semana = calcularSemana(hoje)
    await createAjustesEmLote([{
      produto_id: item.produto_id,
      data: hoje,
      semana,
      quantidade: item.diferenca,
      motivo: `Contagem: ${contagemSelecionada.value.nome}`,
      contagem_id: contagemSelecionada.value.id
    }])
    await markContagemItensAjustados(contagemSelecionada.value.id, [item.produto_id])
    item.ajuste_registrado = true
    toast.add({ title: 'Ajuste registrado', color: 'green' })
  } catch (e: any) {
    toast.add({ title: 'Erro', description: e.message, color: 'red' })
  } finally {
    ajustandoIds.value.delete(item.produto_id)
  }
}

const registrarTodosAjustes = async () => {
  if (!contagemSelecionada.value) return
  ajustandoTodos.value = true

  try {
    const hoje = new Date().toISOString().split('T')[0]
    const pendentes = setoresRevisao.value
      .flatMap(s => s.itens)
      .filter(i => i.diferenca !== 0 && !i.ajuste_registrado)

    if (!pendentes.length) return

    const semana = calcularSemana(hoje)
    await createAjustesEmLote(pendentes.map(i => ({
      produto_id: i.produto_id,
      data: hoje,
      semana,
      quantidade: i.diferenca,
      motivo: `Contagem: ${contagemSelecionada.value!.nome}`,
      contagem_id: contagemSelecionada.value!.id
    })))

    await markContagemItensAjustados(
      contagemSelecionada.value.id,
      pendentes.map(i => i.produto_id)
    )

    // Atualizar UI
    for (const s of setoresRevisao.value) {
      for (const i of s.itens) {
        if (i.diferenca !== 0) i.ajuste_registrado = true
      }
    }

    toast.add({ title: 'Todos os ajustes registrados!', color: 'green' })
  } catch (e: any) {
    toast.add({ title: 'Erro', description: e.message, color: 'red' })
  } finally {
    ajustandoTodos.value = false
  }
}

const abrirCriacao = () => {
  contagemEditando.value = null
  modalEditar.value = true
}

const abrirEdicao = (contagem: Contagem) => {
  contagemEditando.value = contagem
  modalEditar.value = true
}

const onContagemSalva = () => {
  modalEditar.value = false
  carregarContagens()
}

const confirmarExclusao = async (contagem: Contagem) => {
  if (!confirm(`Excluir contagem "${contagem.nome}"?`)) return
  try {
    await deleteContagem(contagem.id)
    toast.add({ title: 'Contagem excluída', color: 'green' })
    carregarContagens()
  } catch (e: any) {
    toast.add({ title: 'Erro', description: e.message, color: 'red' })
  }
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add pages/movimentos/contagens.vue
git commit -m "feat(page): admin contagens page with list, detail, review, and adjustment"
```

---

## Chunk 5: Sidebar + Cron Fix + WhatsApp Integration

### Task 11: Update sidebar navigation

**Files:**
- Modify: `layouts/default.vue:1210`

- [ ] **Step 1: Change sidebar entry to point to new contagens page**

At line 1210, change:

```typescript
{ to: '/movimentos/ajustes', icon: 'i-heroicons-clipboard-document-check', label: 'Contagem' },
```

to:

```typescript
{ to: '/movimentos/contagens', icon: 'i-heroicons-clipboard-document-check', label: 'Contagens' },
```

- [ ] **Step 2: Commit**

```bash
git add layouts/default.vue
git commit -m "feat(nav): point sidebar Contagens to new /movimentos/contagens page"
```

---

### Task 12: Update cron endpoint to include token in WhatsApp message

**Files:**
- Modify: `server/api/cron/lembretes-contagem.get.ts:113-119`
- Modify: `server/utils/zapi.ts:80-119`

- [ ] **Step 1: Add `token` to cron query select**

At `server/api/cron/lembretes-contagem.get.ts:115`, update the select to include `token`:

```typescript
    .select(`
      id, nome, token, recorrencia, horario_notificacao, dias_semana,
      mensal_posicao, mensal_dia, responsavel_nome, responsavel_telefone,
      status, ultima_contagem, data, ultimo_lembrete_enviado,
      contagem_setores ( setor_id, setores ( nome ) )
    `)
```

- [ ] **Step 2: Pass token to montarMensagemLembrete**

At line 197-203, update the call to pass `token`:

```typescript
    const mensagem = montarMensagemLembrete({
      nomeContagem: contagem.nome,
      responsavelNome: contagem.responsavel_nome,
      setores,
      recorrencia: contagem.recorrencia,
      horario,
      token: contagem.token
    })
```

- [ ] **Step 3: Update montarMensagemLembrete in zapi.ts**

At `server/utils/zapi.ts:80-119`, update the function:

```typescript
export function montarMensagemLembrete(dados: {
  nomeContagem: string
  contagemId?: string
  token?: string
  responsavelNome: string
  setores: string[]
  recorrencia: string
  horario: string
  baseUrl?: string
}): string {
  const setoresTexto = dados.setores.length > 0
    ? dados.setores.map(s => `  • ${s}`).join('\n')
    : '  • Todos os setores'

  const recorrenciaLabel: Record<string, string> = {
    diaria: 'Diária',
    semanal: 'Semanal',
    quinzenal: 'Quinzenal',
    mensal: 'Mensal'
  }

  const appUrl = dados.baseUrl || 'https://www.cmv360app.com.br'
  const link = dados.token
    ? `${appUrl}/contagem/${dados.token}`
    : `${appUrl}/movimentos/contagens`

  return [
    `📋 *Lembrete de Contagem*`,
    ``,
    `Olá, *${dados.responsavelNome}*!`,
    `Está na hora de realizar a contagem:`,
    ``,
    `📌 *${dados.nomeContagem}*`,
    `🔄 Recorrência: ${recorrenciaLabel[dados.recorrencia] || dados.recorrencia}`,
    `⏰ Horário: ${dados.horario}`,
    ``,
    `📍 *Setores:*`,
    setoresTexto,
    ``,
    `👉 *Acesse e inicie a contagem:*`,
    link
  ].join('\n')
}
```

- [ ] **Step 4: Commit**

```bash
git add server/api/cron/lembretes-contagem.get.ts server/utils/zapi.ts
git commit -m "feat(cron): include token-based public link in WhatsApp reminders"
```

---

### Task 13: Create cron recreation migration

**Files:**
- Create: `supabase/migrations/025_recreate_pg_cron_lembretes.sql`

- [ ] **Step 1: Write the migration**

```sql
-- =============================================
-- Migration 025: Recriar pg_cron job para lembretes de contagem
-- IMPORTANTE: Executar no SQL Editor do Supabase (não roda via CLI migrations)
-- O Bearer token DEVE ser identico ao CRON_SECRET configurado no Vercel
-- =============================================

-- Garantir extensões
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remover job anterior
DO $$
BEGIN
  PERFORM cron.unschedule('lembretes-contagem');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Recriar job: chama endpoint GET a cada minuto
SELECT cron.schedule(
  'lembretes-contagem',
  '* * * * *',
  $$
  SELECT net.http_get(
    url := 'https://www.cmv360app.com.br/api/cron/lembretes-contagem',
    headers := '{"Authorization": "Bearer cmv360cron2026"}'::jsonb
  );
  $$
);

-- SQL para diagnóstico (executar manualmente se necessário):
-- SELECT * FROM cron.job WHERE jobname = 'lembretes-contagem';
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'lembretes-contagem') ORDER BY start_time DESC LIMIT 20;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/025_recreate_pg_cron_lembretes.sql
git commit -m "feat(db): migration 025 - recreate pg_cron job for contagem reminders"
```

---

### Task 14: Update SetorGerenciarModal to include tipo field

**Files:**
- Modify: `components/contagem/SetorGerenciarModal.vue`

- [ ] **Step 1: Add tipo selector to the setor creation form**

In the template at lines 37-47, change the creation row from a single input+button to include a tipo select. Replace:

```vue
        <div class="flex gap-2">
          <UInput
            v-model="novoSetorNome"
            placeholder="Nome do novo setor..."
            class="flex-1"
            @keydown.enter="adicionarSetor"
          />
          <UButton color="primary" :loading="salvandoSetor" :disabled="!novoSetorNome.trim()" @click="adicionarSetor">
            <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          </UButton>
        </div>
```

with:

```vue
        <div class="flex gap-2">
          <UInput
            v-model="novoSetorNome"
            placeholder="Nome do novo setor..."
            class="flex-1"
            @keydown.enter="adicionarSetor"
          />
          <USelect
            v-model="novoSetorTipo"
            :options="[{ label: 'Principal', value: 'principal' }, { label: 'Apoio', value: 'apoio' }]"
            size="sm"
            class="w-32"
          />
          <UButton color="primary" :loading="salvandoSetor" :disabled="!novoSetorNome.trim()" @click="adicionarSetor">
            <UIcon name="i-heroicons-plus" class="w-4 h-4" />
          </UButton>
        </div>
```

- [ ] **Step 2: Add tipo badge to the setor list items**

At line 67, after the setor name, add a tipo badge:

```vue
<span class="font-medium text-operacao-800">{{ setor.nome }}</span>
<UBadge :color="setor.tipo === 'apoio' ? 'orange' : 'blue'" variant="subtle" size="xs" class="ml-1.5">
  {{ setor.tipo === 'apoio' ? 'Apoio' : 'Principal' }}
</UBadge>
```

- [ ] **Step 3: Add novoSetorTipo ref in script**

At line 258 (after `novoSetorNome`), add:

```typescript
const novoSetorTipo = ref<'principal' | 'apoio'>('principal')
```

- [ ] **Step 4: Update adicionarSetor to pass tipo**

At line 343, change:

```typescript
await createSetor({ nome: novoSetorNome.value.trim() })
```

to:

```typescript
await createSetor({ nome: novoSetorNome.value.trim(), tipo: novoSetorTipo.value })
```

And after success, reset the tipo:

```typescript
novoSetorNome.value = ''
novoSetorTipo.value = 'principal'
```

- [ ] **Step 2: Commit**

```bash
git add components/contagem/SetorGerenciarModal.vue
git commit -m "feat(component): add tipo (principal/apoio) field to SetorGerenciarModal"
```

---

### Task 15: Final integration commit

- [ ] **Step 1: Run type checks if available**

```bash
npx nuxi typecheck
```

If there are errors, fix them. If typecheck is not configured, skip.

- [ ] **Step 2: Verify all files are committed**

```bash
git status
```

Ensure no uncommitted changes related to the contagens feature.

- [ ] **Step 3: Final commit if needed**

Only if there are remaining fixes from the typecheck.
