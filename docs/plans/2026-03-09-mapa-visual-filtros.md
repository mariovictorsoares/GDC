# Mapa Visual: Filtros Estoque Principal/Apoio + Tipos de Saída — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add segmented control (Principal/Apoio) and multi-select filter for saída types in the Mapa Visual tab.

**Architecture:** Client-side filtering using per-type per-week breakdown arrays added to `PainelMes`. New `getPainelMesApoio` function returns daily saldo data. No server/API changes.

**Tech Stack:** Nuxt 3, Vue 3 Composition API, Supabase client, Tailwind CSS, NuxtUI (USelectMenu, UButton, UIcon)

---

### Task 1: Add per-type per-week breakdown to types and backend

**Files:**
- Modify: `types/index.ts:246-267` (PainelMes interface)
- Modify: `composables/useRelatorios.ts:253-264` (saidas_por_semana grouping)
- Modify: `composables/useRelatorios.ts:292-312` (return object)

**Step 1: Add new arrays to PainelMes interface**

In `types/index.ts`, add 4 new fields after `saidas_por_semana`:

```ts
export interface PainelMes {
  produto_id: string
  categoria: string
  produto: string
  unidade: string
  estoque_inicial: number
  entradas_por_semana: number[]
  saidas_por_semana: number[]
  // Breakdown de saídas por semana e tipo
  saidas_definitiva_por_semana: number[]
  saidas_transf_loja_por_semana: number[]
  saidas_transf_apoio_por_semana: number[]
  saidas_beneficiamento_por_semana: number[]
  total_saidas: number
  total_entradas: number
  estoque_final: number
  custo: number
  valor_total: number
  cmv: number
  giro_dias: number
  vezes_mes: number
  // Breakdown de saídas por tipo (totais)
  saidas_definitiva: number
  saidas_transf_loja: number
  saidas_transf_apoio: number
  saidas_beneficiamento: number
}
```

**Step 2: Compute per-type per-week arrays in `getPainelMes`**

In `composables/useRelatorios.ts`, after line 264 (end of `saidas_por_semana` loop), add:

```ts
      // Breakdown por semana por tipo
      const saidas_definitiva_por_semana = new Array(qtdSemanas).fill(0)
      const saidas_transf_loja_por_semana = new Array(qtdSemanas).fill(0)
      const saidas_transf_apoio_por_semana = new Array(qtdSemanas).fill(0)
      const saidas_beneficiamento_por_semana = new Array(qtdSemanas).fill(0)

      prodSaidasAll.forEach(s => {
        const idx = getIndiceSemana(s.data)
        if (idx < 0) return
        const qty = Number(s.quantidade)
        if (s.tipo === 'definitiva') saidas_definitiva_por_semana[idx] += qty
        else if (s.tipo === 'transferencia' && s.empresa_destino_id) saidas_transf_loja_por_semana[idx] += qty
        else if (s.tipo === 'transferencia' && !s.empresa_destino_id) saidas_transf_apoio_por_semana[idx] += qty
        else if (s.tipo === 'beneficiamento') saidas_beneficiamento_por_semana[idx] += qty
      })
```

**Step 3: Include new arrays in return object**

In the return object (around line 292-312), add the 4 new arrays:

```ts
      return {
        // ... existing fields ...
        saidas_definitiva_por_semana,
        saidas_transf_loja_por_semana,
        saidas_transf_apoio_por_semana,
        saidas_beneficiamento_por_semana,
        // ... rest of existing fields ...
      }
```

---

### Task 2: Add types and function for Apoio daily view

**Files:**
- Modify: `types/index.ts` (add `PainelMesApoio` and `DiaInfo`)
- Modify: `composables/useRelatorios.ts` (add `getPainelMesApoio`, export it)

**Step 1: Add new types**

In `types/index.ts`, after `SemanaInfo` (line 274):

```ts
export interface DiaInfo {
  label: string   // "1", "2", ... "31"
  data: string    // "2026-03-01" ISO
}

export interface PainelMesApoio {
  produto_id: string
  produto: string
  unidade: string
  estoque_inicial: number
  saldo_por_dia: number[]   // entradas - saídas per day
  estoque_final: number
}
```

**Step 2: Add `getPainelMesApoio` function**

In `composables/useRelatorios.ts`, before the final `return {` (line 1671):

```ts
  const getPainelMesApoio = async (ano: number, mes: number): Promise<{ dias: DiaInfo[], itens: PainelMesApoio[] }> => {
    if (!empresaId.value) return { dias: [], itens: [] }

    const ultimoDia = new Date(ano, mes, 0).getDate()
    const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`
    const dataFim = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`

    // Gerar info de dias do mês
    const dias: DiaInfo[] = []
    for (let d = 1; d <= ultimoDia; d++) {
      dias.push({
        label: String(d),
        data: `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      })
    }

    // Buscar produtos ativos
    const { data: produtos, error: prodError } = await comEmpresa(client
      .from('produtos')
      .select('id, nome, estoque_inicial, unidade:unidades(sigla)')
      .eq('ativo', true)
      .order('nome'))
    if (prodError) throw prodError

    // Entradas no apoio = transferências para apoio (tipo='transferencia', sem empresa_destino_id)
    const { data: entradasApoio } = await comEmpresa(client
      .from('saidas')
      .select('produto_id, quantidade, data')
      .eq('tipo', 'transferencia')
      .is('empresa_destino_id', null)
      .gte('data', dataInicio)
      .lte('data', dataFim))

    // Saídas do apoio = placeholder (futuro: contagens)
    // Por enquanto não há tabela/dados para saídas do apoio

    // Calcular E.I. do apoio: soma de todas transf. apoio anteriores ao mês
    const dataFimAnterior = new Date(ano, mes - 1, 0)
    const dataFimAntStr = dataFimAnterior.getFullYear() === 0
      ? '1970-01-01'
      : `${dataFimAnterior.getFullYear()}-${String(dataFimAnterior.getMonth() + 1).padStart(2, '0')}-${String(dataFimAnterior.getDate()).padStart(2, '0')}`

    const { data: entradasApoioAnt } = await comEmpresa(client
      .from('saidas')
      .select('produto_id, quantidade')
      .eq('tipo', 'transferencia')
      .is('empresa_destino_id', null)
      .lte('data', dataFimAntStr))

    // Mapa de E.I. do apoio por produto
    const eiApoio = new Map<string, number>()
    entradasApoioAnt?.forEach(s => {
      eiApoio.set(s.produto_id, (eiApoio.get(s.produto_id) || 0) + Number(s.quantidade))
    })

    // Helper: index do dia (0-based)
    const getIndiceDia = (data: string): number => {
      const day = parseInt(data.split('-')[2], 10)
      return day - 1
    }

    // Montar painel
    const itens: PainelMesApoio[] = (produtos || []).map(p => {
      const ei = eiApoio.get(p.id) || 0
      const saldo_por_dia = new Array(ultimoDia).fill(0)

      // Entradas no apoio (positivo)
      entradasApoio?.filter(e => e.produto_id === p.id).forEach(e => {
        const idx = getIndiceDia(e.data)
        if (idx >= 0 && idx < ultimoDia) saldo_por_dia[idx] += Number(e.quantidade)
      })

      // Saídas do apoio seriam subtraídas aqui (futuro)

      const totalSaldo = saldo_por_dia.reduce((sum, v) => sum + v, 0)

      return {
        produto_id: p.id,
        produto: p.nome,
        unidade: (p.unidade as any)?.sigla || '',
        estoque_inicial: ei,
        saldo_por_dia,
        estoque_final: ei + totalSaldo
      }
    }).filter(p => p.estoque_inicial !== 0 || p.saldo_por_dia.some(v => v !== 0))

    return { dias, itens }
  }
```

**Step 3: Export the function**

Add `getPainelMesApoio` to the return object and import `DiaInfo`, `PainelMesApoio` in the import block.

---

### Task 3: Add state and filtered computeds to controle-estoque.vue

**Files:**
- Modify: `pages/movimentos/controle-estoque.vue:1512` (imports)
- Modify: `pages/movimentos/controle-estoque.vue:1635-1665` (state section)
- Modify: `pages/movimentos/controle-estoque.vue:2412-2590` (computed + loader section)

**Step 1: Update imports**

At line 1512, add `PainelMesApoio` and `DiaInfo` to the type import. Also import `getPainelMesApoio` from composable at line 1567.

**Step 2: Add new state variables**

After `painelPageSize` (line 1663):

```ts
const painelEstoque = ref<'principal' | 'apoio'>('principal')
const painelTiposSaida = ref<string[]>(['definitiva', 'transf_loja', 'transf_apoio', 'beneficiamento'])
const painelTiposSaidaOptions = [
  { value: 'definitiva', label: 'Definitiva' },
  { value: 'transf_loja', label: 'Transf. Loja' },
  { value: 'transf_apoio', label: 'Transf. Apoio' },
  { value: 'beneficiamento', label: 'Produção' }
]

// Apoio data
const painelApoioData = ref<PainelMesApoio[]>([])
const painelApoioDias = ref<DiaInfo[]>([])
const painelApoioLoading = ref(false)
```

**Step 3: Add filtered computed that respects tipo filter**

Replace the existing `painelFiltered` computed (line 2417) to add type-aware filtering. The new computed wraps the existing data and recalculates `saidas_por_semana`, `total_saidas`, and `estoque_final` based on selected types:

```ts
const painelFiltered = computed(() => {
  const term = (search.value || painelSearch.value || '').toLowerCase()
  let data = painelData.value
  if (term) {
    data = data.filter(p =>
      p.produto.toLowerCase().includes(term) ||
      p.categoria.toLowerCase().includes(term)
    )
  }

  const tipos = painelTiposSaida.value
  const allSelected = tipos.length === 4

  if (allSelected) return data

  // Recalculate saidas per week based on selected types
  return data.map(p => {
    const saidas_por_semana = p.saidas_por_semana.map((_, idx) => {
      let total = 0
      if (tipos.includes('definitiva')) total += (p.saidas_definitiva_por_semana?.[idx] || 0)
      if (tipos.includes('transf_loja')) total += (p.saidas_transf_loja_por_semana?.[idx] || 0)
      if (tipos.includes('transf_apoio')) total += (p.saidas_transf_apoio_por_semana?.[idx] || 0)
      if (tipos.includes('beneficiamento')) total += (p.saidas_beneficiamento_por_semana?.[idx] || 0)
      return total
    })
    const total_saidas = saidas_por_semana.reduce((sum, v) => sum + v, 0)
    const estoque_final = p.estoque_inicial + p.total_entradas - total_saidas
    const valor_total = estoque_final * p.custo

    return {
      ...p,
      saidas_por_semana,
      total_saidas,
      estoque_final,
      valor_total,
      saidas_definitiva: tipos.includes('definitiva') ? p.saidas_definitiva : 0,
      saidas_transf_loja: tipos.includes('transf_loja') ? p.saidas_transf_loja : 0,
      saidas_transf_apoio: tipos.includes('transf_apoio') ? p.saidas_transf_apoio : 0,
      saidas_beneficiamento: tipos.includes('beneficiamento') ? p.saidas_beneficiamento : 0
    }
  })
})
```

**Step 4: Add apoio filtered computed and loader**

```ts
const painelApoioFiltered = computed(() => {
  const term = (search.value || painelSearch.value || '').toLowerCase()
  if (!term) return painelApoioData.value
  return painelApoioData.value.filter(p => p.produto.toLowerCase().includes(term))
})

const painelApoioPaginatedItems = computed(() => {
  const start = (painelPage.value - 1) * painelPageSize.value
  const end = start + painelPageSize.value
  return painelApoioFiltered.value.slice(start, end)
})

const loadPainelApoio = async () => {
  try {
    painelApoioLoading.value = true
    const resultado = await getPainelMesApoio(painelSelectedAno.value, painelSelectedMes.value)
    painelApoioDias.value = resultado.dias
    painelApoioData.value = resultado.itens
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar apoio', color: 'red' })
  } finally {
    painelApoioLoading.value = false
  }
}
```

**Step 5: Update watchers to load apoio data**

In the watcher for `painelSelectedMes/painelSelectedAno` (line 2591), and in the `viewMode` watcher (line 2601), add apoio loading:

```ts
watch([painelSelectedMes, painelSelectedAno], () => {
  if (painelEstoque.value === 'principal') loadPainel()
  else loadPainelApoio()
})

watch(viewMode, (val) => {
  if (val === 'detalhamento') {
    if (painelEstoque.value === 'principal' && painelData.value.length === 0) loadPainel()
    else if (painelEstoque.value === 'apoio' && painelApoioData.value.length === 0) loadPainelApoio()
  }
})
```

Add watcher for `painelEstoque`:

```ts
watch(painelEstoque, (val) => {
  painelPage.value = 1
  if (val === 'principal' && painelData.value.length === 0) loadPainel()
  else if (val === 'apoio' && painelApoioData.value.length === 0) loadPainelApoio()
})
```

**Step 6: Add label computed for multi-select**

```ts
const painelTiposSaidaLabel = computed(() => {
  const sel = painelTiposSaida.value
  if (sel.length === 4) return 'Todas'
  if (sel.length === 0) return 'Nenhuma'
  if (sel.length <= 2) return sel.map(v => painelTiposSaidaOptions.find(o => o.value === v)?.label).join(', ')
  return `${sel.length} tipos`
})
```

---

### Task 4: Update template — toolbar with segmented control + multi-select

**Files:**
- Modify: `pages/movimentos/controle-estoque.vue:192-231` (detalhamento toolbar)

**Step 1: Add segmented control and multi-select to toolbar**

After the month picker `</UPopover>` (line 221), before `</div>` (line 222), add:

```html
          <!-- Segmented: Principal / Apoio -->
          <div class="inline-flex items-center rounded-lg bg-operacao-100/80 p-0.5 ring-1 ring-operacao-200/60">
            <button
              v-for="opt in [{ key: 'principal', label: 'Principal' }, { key: 'apoio', label: 'Apoio' }]"
              :key="opt.key"
              @click="painelEstoque = opt.key as any"
              class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
              :class="painelEstoque === opt.key ? 'bg-white text-operacao-800 shadow-sm ring-1 ring-operacao-200/60' : 'text-operacao-400 hover:text-operacao-600'"
            >{{ opt.label }}</button>
          </div>

          <!-- Multi-select: Tipos de saída (só Principal) -->
          <UPopover v-if="painelEstoque === 'principal'" :popper="{ placement: 'bottom-start' }">
            <UButton color="white" class="w-full sm:w-auto justify-between" trailing-icon="i-heroicons-chevron-down-20-solid" :ui="toolbarButtonUi">
              <span class="truncate text-left font-normal"><span class="text-operacao-400">Saídas:</span> <span class="text-gray-900">{{ painelTiposSaidaLabel }}</span></span>
            </UButton>
            <template #panel>
              <div class="w-52 py-1.5 px-1">
                <label
                  v-for="opt in painelTiposSaidaOptions"
                  :key="opt.value"
                  class="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors hover:bg-operacao-50"
                >
                  <input
                    type="checkbox"
                    :value="opt.value"
                    v-model="painelTiposSaida"
                    class="rounded border-operacao-300 text-guardian-600 focus:ring-guardian-500"
                  />
                  <span class="text-operacao-700">{{ opt.label }}</span>
                </label>
              </div>
            </template>
          </UPopover>
```

---

### Task 5: Update template — conditional table rendering (Principal vs Apoio)

**Files:**
- Modify: `pages/movimentos/controle-estoque.vue:246-311` (detalhamento table section)

**Step 1: Wrap existing table in `v-if="painelEstoque === 'principal'"`**

The existing `<template v-if="!painelLoading">` block (line 246-311) gets wrapped:

```html
      <template v-if="!painelLoading && painelEstoque === 'principal'">
        <!-- existing principal table stays exactly the same -->
        <!-- BUT: hide breakdown columns for unselected types -->
      </template>
```

**Step 2: Update breakdown columns to conditionally show**

In the header row (around line 273-278), wrap each breakdown `<th>` with `v-if`:

```html
<th v-if="painelTiposSaida.includes('definitiva')" class="...">Defin.</th>
<th v-if="painelTiposSaida.includes('transf_loja')" class="...">Tr.Loja</th>
<th v-if="painelTiposSaida.includes('transf_apoio')" class="...">Tr.Apoio</th>
<th v-if="painelTiposSaida.includes('beneficiamento')" class="...">Prod.</th>
```

Same for the body cells (lines 295-298):

```html
<td v-if="painelTiposSaida.includes('definitiva')" class="...">{{ painelFormatQtd(item.saidas_definitiva) }}</td>
<td v-if="painelTiposSaida.includes('transf_loja')" class="...">{{ painelFormatQtd(item.saidas_transf_loja) }}</td>
<td v-if="painelTiposSaida.includes('transf_apoio')" class="...">{{ painelFormatQtd(item.saidas_transf_apoio) }}</td>
<td v-if="painelTiposSaida.includes('beneficiamento')" class="...">{{ painelFormatQtd(item.saidas_beneficiamento) }}</td>
```

Update the header `colspan` for breakdown to be dynamic:

```html
<th :colspan="painelTiposSaida.length" class="...">Breakdown Saídas</th>
```

Also update `painelTotalColunas` computed to account for dynamic breakdown columns.

**Step 3: Add apoio table**

After the principal table section, add:

```html
      <template v-if="!painelApoioLoading && painelEstoque === 'apoio'">
        <div class="relative overflow-x-auto rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm">
          <table class="min-w-full divide-y divide-operacao-200">
            <thead class="bg-operacao-50">
              <tr>
                <th class="px-3 py-3 text-left text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r sticky left-0 bg-operacao-50 z-10">Produto</th>
                <th class="px-2 py-3 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r w-14">E.I.</th>
                <th v-for="dia in painelApoioDias" :key="dia.data" class="px-1 py-3 text-center text-xs font-medium text-[#5a5a66] w-10">{{ dia.label }}</th>
                <th class="px-2 py-3 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider w-14">E.F.</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-operacao-200">
              <tr v-if="painelApoioFiltered.length === 0">
                <td :colspan="painelApoioDias.length + 3" class="px-3 py-8 text-center text-operacao-400">
                  Nenhum dado encontrado para o período
                </td>
              </tr>
              <tr v-for="item in painelApoioPaginatedItems" :key="item.produto_id" class="hover:bg-operacao-50">
                <td class="px-2 py-2 text-xs font-medium text-operacao-800 border-r truncate max-w-[120px] sticky left-0 bg-white z-10" :title="item.produto">
                  {{ item.produto }} <span class="text-[10px] text-operacao-400 font-normal">({{ item.unidade }})</span>
                </td>
                <td class="px-2 py-2 text-xs text-center text-operacao-500 border-r">{{ painelFormatQtd(item.estoque_inicial) }}</td>
                <td v-for="(saldo, idx) in item.saldo_por_dia" :key="idx"
                  class="px-1 py-2 text-xs text-center"
                  :class="saldo > 0 ? 'text-controle-600 bg-controle-50/30' : saldo < 0 ? 'text-red-600 bg-red-50/30' : ''"
                >{{ saldo !== 0 ? painelFormatQtd(saldo) : '-' }}</td>
                <td class="px-2 py-2 text-xs text-center font-medium text-guardian-600">{{ painelFormatQtd(item.estoque_final) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          v-model="painelPage"
          :page-size="painelPageSize"
          :total-items="painelApoioFiltered.length"
          @update:page-size="painelPageSize = $event"
        />
      </template>

      <!-- Loading apoio -->
      <div v-if="painelApoioLoading && painelEstoque === 'apoio'" class="space-y-4">
        <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm overflow-hidden">
          <div class="p-4 space-y-3">
            <USkeleton class="h-8 w-full" />
            <USkeleton v-for="i in 6" :key="i" class="h-10 w-full" />
          </div>
        </div>
      </div>
```

---

### Task 6: Update `painelTotalColunas` and cleanup

**Files:**
- Modify: `pages/movimentos/controle-estoque.vue:2415` (painelTotalColunas)

**Step 1: Make painelTotalColunas dynamic**

```ts
const painelTotalColunas = computed(() => {
  const breakdownCols = painelTiposSaida.value.length
  const apoioCols = painelTiposSaida.value.includes('transf_apoio') ? 2 : 0
  return 2 + (painelSemanas.value.length + 1) * 2 + 1 + breakdownCols + apoioCols
})
```

**Step 2: Hide "Est. Apoio" columns in principal table when transf_apoio is not selected**

In the header (line 258), add `v-if`:

```html
<th v-if="painelTiposSaida.includes('transf_apoio')" colspan="2" class="...">Est. Apoio</th>
```

And for the sub-header (lines 277-278) and body cells (lines 299-300), same `v-if`.
