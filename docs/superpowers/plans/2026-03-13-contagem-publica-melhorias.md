# Melhorias na Página Pública de Contagem — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix quantity leaking between sectors, replace tabs with dropdown, add review step before saving, and lock finalized sectors as read-only.

**Architecture:** All changes are in a single file (`pages/contagem/[token].vue`). The state `quantidades` changes from flat `Record<produto_id, number>` to nested `Record<setor_id, Record<produto_id, number>>`. A new `modoRevisao` boolean controls a review screen before saving. Finalized sectors render in read-only mode.

**Tech Stack:** Nuxt 3, Vue 3, Tailwind CSS, Nuxt UI

**Spec:** `docs/superpowers/specs/2026-03-13-contagem-publica-melhorias-design.md`

---

## Chunk 1: All Changes

### Task 1: Fix quantidades data structure (flat → nested by setor)

**Files:**
- Modify: `pages/contagem/[token].vue`

- [ ] **Step 1: Change `quantidades` type and update `carregarDados`**

Change the state declaration (line 232):

```typescript
// OLD:
const quantidades = ref<Record<string, number | null>>({})

// NEW:
const quantidades = ref<Record<string, Record<string, number | null>>>({})
```

In `carregarDados`, replace lines 254-259:

```typescript
// OLD:
for (const setor of res.setores) {
  for (const p of setor.produtos) {
    if (p.quantidade_contada !== null && p.quantidade_contada !== undefined) {
      quantidades.value[p.id] = p.quantidade_contada
    }
  }
}

// NEW:
for (const setor of res.setores) {
  quantidades.value[setor.id] = {}
  for (const p of setor.produtos) {
    if (p.quantidade_contada !== null && p.quantidade_contada !== undefined) {
      quantidades.value[setor.id][p.id] = p.quantidade_contada
    }
  }
}
```

- [ ] **Step 2: Update all computed properties that read quantidades**

`preenchidosSetorAtual` (lines 291-296):

```typescript
// OLD:
const preenchidosSetorAtual = computed(() => {
  if (!setorAtual.value) return 0
  return setorAtual.value.produtos.filter(
    (p: any) => quantidades.value[p.id] != null && quantidades.value[p.id] !== ''
  ).length
})

// NEW:
const preenchidosSetorAtual = computed(() => {
  if (!setorAtual.value) return 0
  const setorQtds = quantidades.value[setorAtivo.value] || {}
  return setorAtual.value.produtos.filter(
    (p: any) => setorQtds[p.id] != null && setorQtds[p.id] !== ''
  ).length
})
```

- [ ] **Step 3: Update input handlers to use nested key**

`onQuantidadeInput` (lines 304-312):

```typescript
// OLD:
const onQuantidadeInput = (produtoId: string, event: Event) => {
  const input = event.target as HTMLInputElement
  const val = input.value
  if (val === '' || val === null) {
    quantidades.value[produtoId] = null
  } else {
    quantidades.value[produtoId] = Number(val)
  }
}

// NEW:
const onQuantidadeInput = (produtoId: string, event: Event) => {
  const input = event.target as HTMLInputElement
  const val = input.value
  if (!quantidades.value[setorAtivo.value]) quantidades.value[setorAtivo.value] = {}
  if (val === '' || val === null) {
    quantidades.value[setorAtivo.value][produtoId] = null
  } else {
    quantidades.value[setorAtivo.value][produtoId] = Number(val)
  }
}
```

`incrementar` (lines 314-317):

```typescript
// OLD:
const incrementar = (produtoId: string) => {
  const current = quantidades.value[produtoId]
  quantidades.value[produtoId] = (current ?? 0) + 1
}

// NEW:
const incrementar = (produtoId: string) => {
  if (!quantidades.value[setorAtivo.value]) quantidades.value[setorAtivo.value] = {}
  const current = quantidades.value[setorAtivo.value][produtoId]
  quantidades.value[setorAtivo.value][produtoId] = (current ?? 0) + 1
}
```

`decrementar` (lines 319-326):

```typescript
// OLD:
const decrementar = (produtoId: string) => {
  const current = quantidades.value[produtoId]
  if (current != null && current > 0) {
    quantidades.value[produtoId] = current - 1
  } else {
    quantidades.value[produtoId] = 0
  }
}

// NEW:
const decrementar = (produtoId: string) => {
  if (!quantidades.value[setorAtivo.value]) quantidades.value[setorAtivo.value] = {}
  const current = quantidades.value[setorAtivo.value][produtoId]
  if (current != null && current > 0) {
    quantidades.value[setorAtivo.value][produtoId] = current - 1
  } else {
    quantidades.value[setorAtivo.value][produtoId] = 0
  }
}
```

- [ ] **Step 4: Update `salvarSetor` payload builder**

In `salvarSetor` (lines 339-344):

```typescript
// OLD:
const itens = setorAtual.value.produtos
  .filter((p: any) => quantidades.value[p.id] != null && quantidades.value[p.id] !== '')
  .map((p: any) => ({
    produto_id: p.id,
    quantidade_contada: quantidades.value[p.id]
  }))

// NEW:
const setorQtds = quantidades.value[setorAtivo.value] || {}
const itens = setorAtual.value.produtos
  .filter((p: any) => setorQtds[p.id] != null && setorQtds[p.id] !== '')
  .map((p: any) => ({
    produto_id: p.id,
    quantidade_contada: setorQtds[p.id]
  }))
```

- [ ] **Step 5: Update template bindings that read quantidades**

Product card `:class` (line 132-134):

```html
<!-- OLD -->
:class="quantidades[produto.id] != null && quantidades[produto.id] !== ''
  ? 'ring-controle-200 bg-controle-50/30'
  : 'ring-operacao-100'"

<!-- NEW -->
:class="quantidades[setorAtivo]?.[produto.id] != null && quantidades[setorAtivo]?.[produto.id] !== ''
  ? 'ring-controle-200 bg-controle-50/30'
  : 'ring-operacao-100'"
```

Input `:value` (line 151):

```html
<!-- OLD -->
:value="quantidades[produto.id] ?? ''"

<!-- NEW -->
:value="quantidades[setorAtivo]?.[produto.id] ?? ''"
```

- [ ] **Step 6: Commit**

```bash
git add pages/contagem/\[token\].vue
git commit -m "fix: separate quantities by sector in public counting page"
```

---

### Task 2: Replace tabs with dropdown

**Files:**
- Modify: `pages/contagem/[token].vue`

- [ ] **Step 1: Add `modoRevisao` state**

After `contagemCompleta` declaration (line 234), add:

```typescript
const modoRevisao = ref(false)
```

- [ ] **Step 2: Add watcher to reset state on sector change**

After the `formatarData` function, add:

```typescript
watch(setorAtivo, () => {
  modoRevisao.value = false
  busca.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
```

- [ ] **Step 3: Replace tab buttons with native select**

Replace lines 62-88 (the setor tabs block) with:

```html
<!-- Setor selector -->
<div class="sticky top-[53px] sm:top-[57px] z-20 bg-operacao-50 pt-3 pb-2 px-4 sm:px-6">
  <select
    :value="setorAtivo"
    @change="setorAtivo = ($event.target as HTMLSelectElement).value"
    class="w-full py-2.5 px-4 rounded-xl bg-white text-sm font-medium text-operacao-800 ring-1 ring-operacao-200 focus:ring-2 focus:ring-guardian-500 focus:outline-none transition-shadow appearance-none cursor-pointer"
    style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E&quot;); background-position: right 0.75rem center; background-repeat: no-repeat; background-size: 1.25em 1.25em; padding-right: 2.5rem;"
  >
    <option
      v-for="s in dados.setores"
      :key="s.id"
      :value="s.id"
    >{{ s.status === 'finalizado' ? '✓ ' : '' }}{{ s.nome }}</option>
  </select>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add pages/contagem/\[token\].vue
git commit -m "feat: replace sector tabs with dropdown selector"
```

---

### Task 3: Enforce 100% completion + review screen + lock sectors

**Files:**
- Modify: `pages/contagem/[token].vue`

- [ ] **Step 1: Add `setorFinalizado` computed**

After `progressoAtual` computed, add:

```typescript
const setorFinalizado = computed(() => {
  return setorAtual.value?.status === 'finalizado'
})
```

- [ ] **Step 2: Add `todosPreenchidos` computed**

After `setorFinalizado`, add:

```typescript
const todosPreenchidos = computed(() => {
  return totalSetorAtual.value > 0 && preenchidosSetorAtual.value === totalSetorAtual.value
})
```

- [ ] **Step 3: Replace search + product cards section with conditional template**

Replace the search block (lines 90-124) and product cards block (lines 126-175) with the following. This handles 3 modes: finalized (read-only), review, and editing.

```html
<!-- Finalized sector banner -->
<div v-if="setorFinalizado" class="px-4 sm:px-6 pb-3">
  <div class="flex items-center gap-2 px-4 py-3 rounded-xl bg-controle-50 text-controle-700 text-sm font-medium">
    <UIcon name="i-heroicons-check-circle-solid" class="w-5 h-5 text-controle-500 flex-shrink-0" />
    Este setor já foi salvo
  </div>
</div>

<!-- Review mode banner -->
<div v-else-if="modoRevisao" class="px-4 sm:px-6 pb-3">
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-bold text-operacao-800">Revisão — {{ setorAtual?.nome }}</h3>
    <span class="text-xs text-operacao-400">{{ totalSetorAtual }} produtos</span>
  </div>
</div>

<!-- Search + count (editing mode only) -->
<div v-else class="px-4 sm:px-6 pb-3">
  <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
    <div class="relative flex-1">
      <UIcon
        name="i-heroicons-magnifying-glass"
        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-operacao-300 pointer-events-none"
      />
      <input
        v-model="busca"
        type="text"
        placeholder="Buscar produto..."
        class="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white text-sm text-operacao-800 placeholder-operacao-300 ring-1 ring-operacao-200 focus:ring-2 focus:ring-guardian-500 focus:outline-none transition-shadow"
      />
      <button
        v-if="busca"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-operacao-300 hover:text-operacao-500"
        @click="busca = ''"
      >
        <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
      </button>
    </div>
    <div class="flex items-center justify-between sm:justify-end sm:gap-4 text-xs text-operacao-400">
      <p class="font-medium">
        {{ produtosFiltrados.length }} {{ produtosFiltrados.length === 1 ? 'produto' : 'produtos' }}
      </p>
      <p>
        <span class="font-semibold text-guardian-600">{{ preenchidosSetorAtual }}</span> / {{ totalSetorAtual }} contados
      </p>
    </div>
  </div>
</div>

<!-- Product cards: read-only (finalized or review) -->
<div v-if="setorFinalizado || modoRevisao" class="px-4 sm:px-6 space-y-1.5">
  <div
    v-for="produto in setorAtual?.produtos || []"
    :key="produto.id"
    class="flex items-center justify-between bg-white rounded-xl px-4 py-3 ring-1 ring-operacao-100"
  >
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-operacao-800 leading-tight">{{ produto.nome }}</p>
      <p class="text-[11px] text-operacao-400 mt-0.5">{{ produto.unidade }}</p>
    </div>
    <span class="text-sm font-bold text-operacao-800 tabular-nums ml-3">
      {{ quantidades[setorAtivo]?.[produto.id] ?? '—' }}
    </span>
  </div>
</div>

<!-- Product cards: editable (normal mode) -->
<div v-else class="px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
  <div
    v-for="produto in produtosFiltrados"
    :key="produto.id"
    class="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 ring-1 transition-all duration-150"
    :class="quantidades[setorAtivo]?.[produto.id] != null && quantidades[setorAtivo]?.[produto.id] !== ''
      ? 'ring-controle-200 bg-controle-50/30'
      : 'ring-operacao-100'"
  >
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-operacao-800 leading-tight">{{ produto.nome }}</p>
      <p class="text-[11px] text-operacao-400 mt-0.5">{{ produto.unidade }}</p>
    </div>
    <div class="flex items-center gap-1.5 flex-shrink-0">
      <button
        class="w-8 h-8 rounded-lg bg-operacao-50 text-operacao-400 hover:bg-operacao-100 flex items-center justify-center transition-colors active:scale-95"
        @click="decrementar(produto.id)"
      >
        <UIcon name="i-heroicons-minus" class="w-3.5 h-3.5" />
      </button>
      <input
        :value="quantidades[setorAtivo]?.[produto.id] ?? ''"
        type="number"
        inputmode="decimal"
        min="0"
        step="any"
        placeholder="—"
        class="w-16 h-10 text-center rounded-xl bg-operacao-50 text-sm font-bold text-operacao-800 placeholder-operacao-300 ring-1 ring-operacao-200 focus:ring-2 focus:ring-guardian-500 focus:bg-white focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        @input="onQuantidadeInput(produto.id, $event)"
        @focus="($event.target as HTMLInputElement).select()"
      />
      <button
        class="w-8 h-8 rounded-lg bg-operacao-50 text-operacao-400 hover:bg-operacao-100 flex items-center justify-center transition-colors active:scale-95"
        @click="incrementar(produto.id)"
      >
        <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>

  <div v-if="produtosFiltrados.length === 0" class="col-span-full py-12 text-center">
    <UIcon name="i-heroicons-magnifying-glass" class="w-8 h-8 text-operacao-200 mx-auto mb-2" />
    <p class="text-sm text-operacao-400">Nenhum produto encontrado</p>
  </div>
</div>
```

- [ ] **Step 4: Replace footer with conditional buttons**

Replace the footer (lines 178-216) with:

```html
<!-- Fixed footer -->
<div
  v-if="dados && !contagemCompleta && !erro && !setorFinalizado"
  class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-operacao-100 safe-area-bottom"
>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-3">
    <!-- Progress bar -->
    <div class="flex items-center gap-3 mb-3">
      <div class="flex-1 bg-operacao-100 rounded-full h-2 overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500 ease-out"
          :class="progressoAtual >= 100 ? 'bg-controle-500' : 'bg-guardian-500'"
          :style="{ width: `${progressoAtual}%` }"
        />
      </div>
      <span
        class="text-xs font-bold w-10 text-right"
        :class="progressoAtual >= 100 ? 'text-controle-600' : 'text-guardian-600'"
      >{{ progressoAtual }}%</span>
    </div>

    <!-- Review mode: Confirmar / Voltar -->
    <div v-if="modoRevisao" class="flex gap-3">
      <button
        class="flex-1 py-3 sm:py-2.5 px-6 rounded-xl text-sm font-bold text-operacao-600 bg-operacao-100 hover:bg-operacao-200 transition-all active:scale-[0.98]"
        @click="modoRevisao = false"
      >
        Voltar para editar
      </button>
      <button
        :disabled="salvando"
        class="flex-1 py-3 sm:py-2.5 px-6 rounded-xl text-sm font-bold text-white bg-controle-500 hover:bg-controle-600 shadow-sm shadow-controle-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        @click="confirmarSetor"
      >
        <span v-if="salvando" class="flex items-center justify-center gap-2">
          <span class="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
          Salvando...
        </span>
        <span v-else>Confirmar</span>
      </button>
    </div>

    <!-- Normal mode: Revisar e Salvar (only when 100%) -->
    <button
      v-else
      :disabled="!todosPreenchidos"
      class="w-full sm:w-auto sm:min-w-[200px] sm:float-right py-3 sm:py-2.5 px-6 rounded-xl text-sm font-bold text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
      :class="todosPreenchidos
        ? 'bg-controle-500 hover:bg-controle-600 shadow-sm shadow-controle-500/20'
        : 'bg-guardian-500'"
      @click="entrarRevisao"
    >
      <span v-if="todosPreenchidos">
        Revisar e Salvar
      </span>
      <span v-else>
        {{ preenchidosSetorAtual }} de {{ totalSetorAtual }} contados
      </span>
    </button>
  </div>
</div>
```

- [ ] **Step 5: Add `entrarRevisao` and `confirmarSetor` functions**

Replace `salvarSetor` with these two functions:

```typescript
// Enter review mode
const entrarRevisao = () => {
  modoRevisao.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Confirm and save sector (called from review screen)
const confirmarSetor = async () => {
  if (!setorAtual.value) return
  salvando.value = true

  const setorQtds = quantidades.value[setorAtivo.value] || {}
  const itens = setorAtual.value.produtos
    .filter((p: any) => setorQtds[p.id] != null && setorQtds[p.id] !== '')
    .map((p: any) => ({
      produto_id: p.id,
      quantidade_contada: setorQtds[p.id]
    }))

  try {
    const res = await $fetch(`/api/contagem/${token.value}`, {
      method: 'POST',
      body: {
        setor_id: setorAtivo.value,
        itens
      }
    })

    if (res.saved === 0) {
      toast.add({ title: 'Erro', description: 'Nenhum item foi salvo. Verifique as quantidades.', color: 'red' })
      return
    }

    if (res.contagemCompleta) {
      contagemCompleta.value = true
    } else {
      toast.add({ title: 'Setor salvo!', color: 'green', icon: 'i-heroicons-check-circle' })
      // Update local state
      if (setorAtual.value) {
        setorAtual.value.progresso = res.progresso
        setorAtual.value.status = res.setorFinalizado ? 'finalizado' : 'em_andamento'
      }
      modoRevisao.value = false
      // Auto-switch to next incomplete setor
      if (res.setorFinalizado) {
        const proximo = dados.value.setores.find(
          (s: any) => s.id !== setorAtivo.value && s.status !== 'finalizado'
        )
        if (proximo) {
          setorAtivo.value = proximo.id
        }
      }
    }
  } catch (e: any) {
    toast.add({ title: 'Erro ao salvar', description: e?.data?.message || e?.message, color: 'red' })
  } finally {
    salvando.value = false
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add pages/contagem/\[token\].vue
git commit -m "feat: add review step, 100% enforcement, and sector locking"
```
