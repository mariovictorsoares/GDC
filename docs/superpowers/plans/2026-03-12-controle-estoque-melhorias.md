# Controle de Estoque — Melhorias — Plano de Implementação

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar 7 melhorias no módulo de controle de estoque: custo UEPS, cards KPI, mapa visual principal, mapa visual apoio, modal pós-entrada, lista de requisições e QR code.

**Architecture:** Alterações no banco (2 migrations), refatoração de composable e componentes existentes, nova página de requisições.

**Tech Stack:** Nuxt 3, Vue 3, Supabase (PostgreSQL), Tailwind CSS, Nuxt UI

**Nota:** Projeto sem suite de testes. NÃO ligar dev servers. Apenas editar código.

**Spec:** `docs/superpowers/specs/2026-03-12-controle-estoque-melhorias-design.md`

---

## File Structure

| Arquivo | Ação | Responsabilidade |
|---------|------|------------------|
| `supabase/migrations/022_custo_saida_ueps.sql` | Já criado | Função UEPS + trigger |
| `supabase/migrations/023_lista_requisicoes.sql` | Já criado | Tabelas requisicoes + itens |
| `types/index.ts` | Modificar | Adicionar interfaces Requisicao, RequisicaoItem, atualizar PainelMesApoio |
| `pages/movimentos/controle-estoque.vue` | Modificar | Cards KPI, mapa principal, mapa apoio |
| `composables/useRelatorios.ts` | Modificar | getPainelMesApoio novo formato |
| `composables/useEstoque.ts` | Modificar | CRUD requisições |
| `components/movimentos/DestinoEntradaModal.vue` | Criar | Substitui TransferenciaApoioModal |
| `components/movimentos/TransferenciaApoioModal.vue` | Remover | Substituído por DestinoEntradaModal |
| `pages/movimentos/entradas.vue` | Modificar | Usar DestinoEntradaModal |
| `pages/movimentos/requisicoes.vue` | Criar | Página de requisições |
| `pages/configuracoes/empresas.vue` | Modificar | QR code no modal |

---

## Chunk 1: Migrations + Types

### Task 1: Aplicar migration UEPS no Supabase

As migrations já estão criadas em `supabase/migrations/`. Devem ser aplicadas manualmente via Dashboard do Supabase (SQL Editor) ou CLI.

- [ ] **Step 1: Aplicar migration 022**

Executar o conteúdo de `supabase/migrations/022_custo_saida_ueps.sql` no SQL Editor do Supabase.

- [ ] **Step 2: Aplicar migration 023**

Executar o conteúdo de `supabase/migrations/023_lista_requisicoes.sql` no SQL Editor do Supabase.

- [ ] **Step 3: Verificar**

Testar no SQL Editor:
```sql
-- Deve retornar a função
SELECT calcular_custo_ueps('00000000-0000-0000-0000-000000000000'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, '2026-03-12'::date);

-- Deve existir a tabela
SELECT * FROM requisicoes LIMIT 0;
SELECT * FROM requisicao_itens LIMIT 0;
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/022_custo_saida_ueps.sql supabase/migrations/023_lista_requisicoes.sql
git commit -m "feat: add UEPS cost function and requisicoes tables"
```

---

### Task 2: Atualizar TypeScript interfaces

**Arquivo:** `types/index.ts`

- [ ] **Step 1: Atualizar PainelMesApoio para novo formato**

Substituir a interface `PainelMesApoio` (linhas 245-255) por:

```typescript
export interface PainelMesApoioDia {
  ei: number
  entradas: number
  ef: number
  cmv: number
}

export interface PainelMesApoio {
  produto_id: string
  produto: string
  unidade: string
  dias: PainelMesApoioDia[]
  cmv_total: number
}
```

- [ ] **Step 2: Adicionar interfaces de Requisição**

Após a interface `PedidoContagemItem` (linha ~538), adicionar:

```typescript
// Requisições de Setor
export type StatusRequisicao = 'pendente' | 'enviado' | 'cancelado'

export interface Requisicao {
  id: string
  empresa_id?: string
  setor_id: string
  status: StatusRequisicao
  data: string
  solicitante_nome?: string
  observacao?: string
  enviado_por?: string
  data_envio?: string
  created_at?: string
  updated_at?: string
  // Relacionamentos
  setor?: Setor
  itens?: RequisicaoItem[]
}

export interface RequisicaoItem {
  id: string
  requisicao_id: string
  produto_id: string
  quantidade_solicitada: number
  quantidade_enviada?: number
  created_at?: string
  // Relacionamentos
  produto?: Produto
}
```

- [ ] **Step 3: Adicionar import do novo type no useRelatorios.ts**

Em `composables/useRelatorios.ts` linha 5, atualizar import:

```typescript
import type {
  PainelMes,
  SemanaInfo,
  DiaInfo,
  PainelMesApoio,
  PainelMesApoioDia,
  // ... rest
} from '~/types'
```

- [ ] **Step 4: Commit**

```bash
git add types/index.ts
git commit -m "feat: add Requisicao interfaces and update PainelMesApoio type"
```

---

## Chunk 2: Cards KPI + Mapa Visual Principal

### Task 3: Renomear card "Saídas" e remover "Saldo"

**Arquivo:** `pages/movimentos/controle-estoque.vue`

- [ ] **Step 1: Alterar computed totalSaidas para excluir beneficiamento**

Localizar linhas 1697-1701. Substituir:

```typescript
const totalSaidas = computed(() =>
  filteredMovimentos.value
    .filter(m => m._tipoMov === 'saida')
    .reduce((sum, m) => sum + Number(m.valor), 0)
)
```

Por:

```typescript
const totalSaidas = computed(() =>
  filteredMovimentos.value
    .filter(m => m._tipoMov === 'saida' && m.tipo !== 'beneficiamento')
    .reduce((sum, m) => sum + Number(m.valor), 0)
)
```

- [ ] **Step 2: Renomear label do card e remover card Saldo no template**

Localizar linhas 40-55 (bloco dos cards KPI). Fazer duas mudanças:

**2a) Renomear "Saídas" para "Saídas CMV Consumo"** — na linha 43:

```html
<span class="text-[11px] font-medium text-operacao-400">Saídas CMV Consumo</span>
```

**2b) Remover o card Saldo inteiro** — deletar linhas 47-55 (o quarto `<div>` do grid).

**2c) Mudar o grid de 4 para 3 colunas** — na linha 25:

```html
<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
```

- [ ] **Step 3: Remover computed saldoPeriodo**

Localizar e remover a linha 1703:

```typescript
const saldoPeriodo = computed(() => totalEntradas.value - totalSaidas.value)
```

- [ ] **Step 4: Commit**

```bash
git add pages/movimentos/controle-estoque.vue
git commit -m "feat: rename Saidas card to Saidas CMV Consumo, remove Saldo card"
```

---

### Task 4: Remover colunas E.I. e E.F. do Mapa Visual Principal

**Arquivo:** `pages/movimentos/controle-estoque.vue`

**IMPORTANTE:** Existem DUAS tabelas com E.I. e E.F.:
1. Tabela waterfall principal (linhas ~285-335, visível quando `painelEstoque === 'principal'`)
2. Tabela "Detalhamento" sub-tab (linhas ~1313-1373, visível quando `painelTab === 'detalhamento'`)

Ambas precisam ter E.I. e E.F. removidos.

- [ ] **Step 1: Remover E.I. e E.F. da PRIMEIRA tabela (waterfall, ~linha 289)**

No `<thead>`, remover as `<th>` de E.I. e E.F.:

```html
<!-- REMOVER E.I. (~linha 291): -->
<th rowspan="2" class="...">E.I.</th>
<!-- REMOVER E.F. (~linha 294): -->
<th rowspan="2" class="...">E.F.</th>
```

No `<tbody>`, remover as `<td>` correspondentes:

```html
<!-- REMOVER E.I. (~linha 319): -->
<td class="px-2 py-2 text-xs text-center text-operacao-500 border-r">{{ painelFormatQtd(item.estoque_inicial) }}</td>
<!-- REMOVER E.F. (~linha 324): -->
<td class="px-2 py-2 text-xs text-center font-medium text-guardian-600">{{ painelFormatQtd(item.estoque_final) }}</td>
```

- [ ] **Step 2: Remover E.I. e E.F. da SEGUNDA tabela (detalhamento sub-tab, ~linha 1315)**

No `<thead>` da tabela detalhamento, remover as `<th>` de E.I. e E.F. (~linhas 1319, 1322).

No `<tbody>`, remover as `<td>` correspondentes (~linhas 1350, 1355).

- [ ] **Step 3: Atualizar painelTotalColunas**

Localizar (~linha 2164):
```typescript
const painelTotalColunas = computed(() => 2 + (painelSemanas.value.length + 1) * 2 + 1)
```
Substituir por (removendo E.I. e E.F. = -2):
```typescript
const painelTotalColunas = computed(() => 1 + (painelSemanas.value.length + 1) * 2)
```

- [ ] **Step 4: Commit**

```bash
git add pages/movimentos/controle-estoque.vue
git commit -m "feat: remove EI and EF columns from both principal tables"
```

---

### Task 5: Adicionar sorting ao Mapa Visual Principal

**Arquivo:** `pages/movimentos/controle-estoque.vue`

- [ ] **Step 1: Adicionar state de sorting no script**

Após `painelPage` (linha ~1539), adicionar:

```typescript
// Sorting do mapa principal
const painelSortKey = ref<string>('total_saidas')
const painelSortDir = ref<'asc' | 'desc'>('desc')

const togglePainelSort = (key: string) => {
  if (painelSortKey.value === key) {
    painelSortDir.value = painelSortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    painelSortKey.value = key
    painelSortDir.value = 'desc'
  }
  painelPage.value = 1
}
```

- [ ] **Step 2: Criar computed painelSorted**

Localizar `painelFiltered` (deve ser um computed que filtra painelData). Após ele, criar:

```typescript
const painelSorted = computed(() => {
  const data = [...painelFiltered.value]
  const key = painelSortKey.value
  const dir = painelSortDir.value === 'asc' ? 1 : -1

  return data.sort((a: any, b: any) => {
    const va = Number(a[key]) || 0
    const vb = Number(b[key]) || 0
    return (va - vb) * dir
  })
})
```

**IMPORTANTE:** Localizar `painelPaginatedItems` (~linha 2207) e mudar de `painelFiltered.value.slice(...)` para `painelSorted.value.slice(...)`.

- [ ] **Step 3: Tornar headers clicáveis para sorting**

Aplicar click handler a TODAS as colunas numéricas. Usar helper para gerar `<th>` sortable:

**Tot Saídas:**
```html
<th class="px-2 py-1 text-center text-xs font-medium text-[#5a5a66] bg-red-50 border-r cursor-pointer select-none hover:bg-red-100 transition-colors" @click="togglePainelSort('total_saidas')">
  Tot
  <UIcon v-if="painelSortKey === 'total_saidas'" :name="painelSortDir === 'asc' ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'" class="w-3 h-3 inline-block ml-0.5 text-operacao-300" />
</th>
```

**Tot Entradas:** (mesma lógica, `@click="togglePainelSort('total_entradas')"`)

**Repetir para colunas adicionais** (se presentes na tabela detalhamento): `custo`, `valor_total`, `cmv`, `giro_dias`

- [ ] **Step 4: Commit**

```bash
git add pages/movimentos/controle-estoque.vue
git commit -m "feat: add sorting to principal waterfall table (default: total_saidas desc)"
```

---

## Chunk 3: Mapa Visual Apoio

**IMPORTANTE:** A imagem do usuário mostra visão "semanal" com dias dentro da semana (09/03, 10/03...). Mostrar todos os 31 dias do mês criaria 124+ colunas — inutilizável. O correto é mostrar **7 dias por semana** com um **seletor de semana**.

### Task 6: Refatorar getPainelMesApoio no composable

**Arquivo:** `composables/useRelatorios.ts`

- [ ] **Step 1: Reescrever getPainelMesApoio (linhas 1751-1833)**

A função agora recebe `dataInicio` e `dataFim` (período de 1 semana) ao invés de mês inteiro. Substituir por:

```typescript
const getPainelMesApoio = async (dataInicio: string, dataFim: string): Promise<{ dias: DiaInfo[], itens: PainelMesApoio[] }> => {
  if (!empresaId.value) return { dias: [], itens: [] }

  // Gerar info de dias do período
  const dias: DiaInfo[] = []
  const start = new Date(dataInicio + 'T12:00:00')
  const end = new Date(dataFim + 'T12:00:00')
  const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().split('T')[0]
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    dias.push({
      label: `${diasNomes[d.getDay()]} ${dd}/${mm}`,
      data: iso
    })
  }
  const numDias = dias.length

  // Buscar produtos ativos
  const { data: produtos, error: prodError } = await comEmpresa(client
    .from('produtos')
    .select('id, nome, estoque_inicial, unidade:unidades(sigla)')
    .eq('ativo', true)
    .order('nome'))
  if (prodError) throw prodError

  // Entradas no apoio no período
  const { data: entradasApoio } = await comEmpresa(client
    .from('saidas')
    .select('produto_id, quantidade, data')
    .eq('tipo', 'transferencia')
    .is('empresa_destino_id', null)
    .gte('data', dataInicio)
    .lte('data', dataFim))

  // E.I. do apoio: soma de transf. apoio ANTES do período
  const diaAntes = new Date(start)
  diaAntes.setDate(diaAntes.getDate() - 1)
  const dataAntes = diaAntes.toISOString().split('T')[0]

  const { data: entradasApoioAnt } = await comEmpresa(client
    .from('saidas')
    .select('produto_id, quantidade')
    .eq('tipo', 'transferencia')
    .is('empresa_destino_id', null)
    .lte('data', dataAntes))

  const eiApoioMap = new Map<string, number>()
  entradasApoioAnt?.forEach(s => {
    eiApoioMap.set(s.produto_id, (eiApoioMap.get(s.produto_id) || 0) + Number(s.quantidade))
  })

  // Montar painel diário
  const itens: PainelMesApoio[] = (produtos || []).map(p => {
    const eiPeriodo = eiApoioMap.get(p.id) || 0

    // Agrupar entradas por dia do período
    const entradasPorDia = new Array(numDias).fill(0)
    entradasApoio?.filter(e => e.produto_id === p.id).forEach(e => {
      const idx = dias.findIndex(d => d.data === e.data)
      if (idx >= 0) entradasPorDia[idx] += Number(e.quantidade)
    })

    // Calcular EI, EN, EF, CMV por dia
    const diasCalc: PainelMesApoioDia[] = []
    let eiDia = eiPeriodo

    for (let d = 0; d < numDias; d++) {
      const en = entradasPorDia[d]
      const saidasDia = 0 // futuro: contagens/baixas
      const ef = eiDia + en - saidasDia
      const cmv = eiDia + en - ef

      diasCalc.push({ ei: eiDia, entradas: en, ef, cmv })
      eiDia = ef
    }

    const cmvTotal = diasCalc.reduce((sum, d) => sum + d.cmv, 0)

    return {
      produto_id: p.id,
      produto: p.nome,
      unidade: (p.unidade as any)?.sigla || '',
      dias: diasCalc,
      cmv_total: cmvTotal
    }
  })

  return { dias, itens }
}
```

- [ ] **Step 2: Atualizar assinatura no return do composable**

A função mudou de `(ano, mes)` para `(dataInicio, dataFim)`. Os chamadores precisam ser atualizados.

- [ ] **Step 3: Commit**

```bash
git add composables/useRelatorios.ts
git commit -m "feat: refactor getPainelMesApoio to weekly view with EI/EN/EF/CMV per day"
```

---

### Task 7: Novo template do Mapa Visual Apoio

**Arquivo:** `pages/movimentos/controle-estoque.vue`

- [ ] **Step 1: Atualizar state e computeds do apoio**

Substituir `painelApoioData` type (linha ~1553):

```typescript
const painelApoioData = ref<PainelMesApoio[]>([])
```

Adicionar seletor de semana + sorting para apoio:

```typescript
// Semanas do apoio (calculadas a partir do mês selecionado)
const painelApoioSemanas = computed(() => {
  const semanas: { label: string; inicio: string; fim: string }[] = []
  const ano = painelSelectedAno.value
  const mes = painelSelectedMes.value
  const primeiro = new Date(ano, mes - 1, 1)
  const ultimo = new Date(ano, mes, 0)

  // Encontrar primeira segunda-feira (ou dia 1 se cair em seg)
  let d = new Date(primeiro)
  // Recuar até segunda-feira
  while (d.getDay() !== 1) d.setDate(d.getDate() - 1)

  while (d <= ultimo) {
    const inicio = new Date(d)
    const fim = new Date(d)
    fim.setDate(fim.getDate() + 6)
    const fmt = (dt: Date) => `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`
    semanas.push({
      label: `${fmt(inicio)} - ${fmt(fim)}`,
      inicio: inicio.toISOString().split('T')[0],
      fim: fim.toISOString().split('T')[0]
    })
    d.setDate(d.getDate() + 7)
  }
  return semanas
})

const painelApoioSemanaIdx = ref(0) // índice da semana selecionada

// Sorting do mapa apoio
const painelApoioSortKey = ref<string>('cmv_total')
const painelApoioSortDir = ref<'asc' | 'desc'>('desc')

const togglePainelApoioSort = (key: string) => {
  if (painelApoioSortKey.value === key) {
    painelApoioSortDir.value = painelApoioSortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    painelApoioSortKey.value = key
    painelApoioSortDir.value = 'desc'
  }
  painelPage.value = 1
}
```

**SUBSTITUIR** o `painelApoioFiltered` existente (~linhas 2215-2218) por:

```typescript
const painelApoioFiltered = computed(() => {
  let data = painelApoioData.value
  if (painelSearch.value) {
    const term = painelSearch.value.toLowerCase()
    data = data.filter(p => p.produto.toLowerCase().includes(term))
  }
  // Sorting
  const key = painelApoioSortKey.value
  const dir = painelApoioSortDir.value === 'asc' ? 1 : -1
  return [...data].sort((a: any, b: any) => {
    const va = Number(a[key]) || 0
    const vb = Number(b[key]) || 0
    return (va - vb) * dir
  })
})
```

- [ ] **Step 2: Substituir template do apoio (linhas ~340-393)**

Remover todo o bloco `<template v-if="!painelApoioLoading && painelEstoque === 'apoio'">` e substituir por:

```html
<template v-if="!painelApoioLoading && painelEstoque === 'apoio'">
  <!-- Seletor de semana -->
  <div class="flex items-center gap-2 mb-3">
    <span class="text-xs font-medium text-operacao-400 uppercase tracking-wider">Semana:</span>
    <div class="flex gap-1">
      <button
        v-for="(sem, idx) in painelApoioSemanas"
        :key="idx"
        class="px-3 py-1.5 text-xs rounded-md transition-colors"
        :class="painelApoioSemanaIdx === idx ? 'bg-guardian-100 text-guardian-700 font-medium ring-1 ring-guardian-200' : 'text-operacao-500 hover:bg-operacao-100'"
        @click="painelApoioSemanaIdx = idx; loadApoio()"
      >
        {{ sem.label }}
      </button>
    </div>
  </div>

  <div class="relative overflow-x-auto rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm">
    <table class="min-w-full divide-y divide-operacao-200">
      <thead class="bg-operacao-50">
        <tr>
          <th rowspan="2" class="px-3 py-3 text-left text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r sticky left-0 bg-operacao-50 z-10">Produto</th>
          <template v-for="dia in painelApoioDias" :key="'ah-' + dia.data">
            <th colspan="4" class="px-1 py-2 text-center text-xs font-medium text-[#5a5a66] tracking-wider border-r">
              {{ dia.label }}
            </th>
          </template>
          <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider cursor-pointer select-none hover:bg-operacao-100 transition-colors" @click="togglePainelApoioSort('cmv_total')">
            CMV Total
            <UIcon v-if="painelApoioSortKey === 'cmv_total'" :name="painelApoioSortDir === 'asc' ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'" class="w-3 h-3 inline-block ml-0.5 text-operacao-300" />
          </th>
        </tr>
        <tr>
          <template v-for="dia in painelApoioDias" :key="'ash-' + dia.data">
            <th class="px-1 py-1 text-center text-[10px] font-medium text-operacao-400 w-10">EI</th>
            <th class="px-1 py-1 text-center text-[10px] font-medium text-controle-500 bg-controle-50 w-10">EN</th>
            <th class="px-1 py-1 text-center text-[10px] font-medium text-operacao-400 w-10">EF</th>
            <th class="px-1 py-1 text-center text-[10px] font-medium text-red-500 bg-red-50 w-10 border-r">CMV</th>
          </template>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-operacao-200">
        <tr v-if="painelApoioFiltered.length === 0">
          <td :colspan="painelApoioDias.length * 4 + 2" class="px-3 py-8 text-center text-operacao-400">
            Nenhum dado encontrado para o período
          </td>
        </tr>
        <tr v-for="item in painelApoioPaginatedItems" :key="item.produto_id" class="hover:bg-operacao-50">
          <td class="px-2 py-2 text-xs font-medium text-operacao-800 border-r truncate max-w-[120px] sticky left-0 bg-white z-10" :title="item.produto">
            {{ item.produto }} <span class="text-[10px] text-operacao-400 font-normal">({{ item.unidade }})</span>
          </td>
          <template v-for="(dia, idx) in item.dias" :key="'ad-' + idx">
            <td class="px-1 py-2 text-[11px] text-center text-operacao-400">{{ painelFormatQtd(dia.ei) }}</td>
            <td class="px-1 py-2 text-[11px] text-center text-controle-600 bg-controle-50/30">{{ painelFormatQtd(dia.entradas) }}</td>
            <td class="px-1 py-2 text-[11px] text-center text-operacao-500">{{ painelFormatQtd(dia.ef) }}</td>
            <td class="px-1 py-2 text-[11px] text-center font-medium border-r" :class="dia.cmv > 0 ? 'text-red-600 bg-red-50/30' : 'text-operacao-300'">{{ painelFormatQtd(dia.cmv) }}</td>
          </template>
          <td class="px-2 py-2 text-xs text-center font-bold text-red-700">{{ painelFormatQtd(item.cmv_total) }}</td>
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
```

- [ ] **Step 2b: Atualizar função loadApoio para usar seletor de semana**

Localizar onde `getPainelMesApoio` é chamado (provavelmente em um watch ou função de load). Mudar a chamada:

```typescript
// Antes:
const { dias, itens } = await getPainelMesApoio(painelSelectedAno.value, painelSelectedMes.value)

// Depois:
const sem = painelApoioSemanas.value[painelApoioSemanaIdx.value]
if (!sem) return
const { dias, itens } = await getPainelMesApoio(sem.inicio, sem.fim)
```

- [ ] **Step 3: Atualizar imports de PainelMesApoio no script**

Verificar que `PainelMesApoio` e `PainelMesApoioDia` estão importados no topo do script.

- [ ] **Step 4: Commit**

```bash
git add pages/movimentos/controle-estoque.vue
git commit -m "feat: new apoio visual map with EI/EN/EF/CMV per day, sortable by CMV"
```

---

## Chunk 4: Modal Pós-Entrada com Destinos

### Task 8: Criar DestinoEntradaModal

**Arquivo:** `components/movimentos/DestinoEntradaModal.vue` (CRIAR)

- [ ] **Step 1: Criar componente**

Criar `components/movimentos/DestinoEntradaModal.vue` baseado no `TransferenciaApoioModal.vue`, mas com dropdown de destino por item.

```vue
<template>
  <UModal v-model="modelValue" :ui="{ width: 'sm:max-w-xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-guardian-100">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-guardian-600" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-operacao-800">Destino dos Produtos</h3>
              <p class="text-xs text-operacao-400">Escolha para onde enviar cada produto</p>
            </div>
          </div>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="modelValue = false" />
        </div>
      </template>

      <!-- Lista de itens com destino -->
      <div class="space-y-3 max-h-[400px] overflow-y-auto">
        <div v-for="(item, idx) in itensComDestino" :key="idx"
          class="flex items-center gap-3 p-3 rounded-lg ring-1 ring-operacao-200 bg-operacao-50/50">
          <!-- Info do produto -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-operacao-800 truncate">{{ item.produto_nome }}</p>
            <p class="text-xs text-operacao-400">{{ item.quantidade }} {{ item.unidade_sigla }}</p>
          </div>
          <!-- Selector de destino -->
          <USelectMenu
            v-model="item.destino"
            :options="destinoOptions"
            value-attribute="value"
            option-attribute="label"
            class="w-48"
            size="sm"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="gray" variant="ghost" @click="modelValue = false">Pular</UButton>
          <UButton color="primary" :loading="saving" @click="confirmar">
            Confirmar
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { Empresa } from '~/types'

interface ItemEntradaParaDestino {
  produto_id: string
  quantidade: number
  produto_nome: string
  unidade_sigla: string
}

interface ItemComDestino extends ItemEntradaParaDestino {
  destino: string
}

const props = defineProps<{
  itensEntrada: ItemEntradaParaDestino[]
}>()

const emit = defineEmits(['transferido'])

const modelValue = defineModel<boolean>({ default: false })
const { createSaida } = useEstoque()
const { empresaId } = useEmpresa()
const toast = useToast()

// Buscar empresas do grupo para opção "Loja"
const empresasDoGrupo = ref<Empresa[]>([])
const saving = ref(false)

const fetchEmpresas = async () => {
  const client = useSupabaseClient()
  const { data } = await client
    .from('usuarios_empresas')
    .select('empresa:empresas(*)')
    .neq('empresa_id', empresaId.value)
  empresasDoGrupo.value = (data || []).map((d: any) => d.empresa).filter(Boolean)
}

watch(modelValue, (open) => {
  if (open) fetchEmpresas()
})

const destinoOptions = computed(() => {
  const opts = [
    { value: 'manter', label: 'Manter no Principal' },
    { value: 'apoio', label: 'Estoque de Apoio' },
    { value: 'definitiva', label: 'Saída Definitiva' }
  ]
  empresasDoGrupo.value.forEach(e => {
    opts.push({ value: `loja_${e.id}`, label: `Loja: ${e.nome}` })
  })
  return opts
})

// Ref reativa (NÃO computed — computed é read-only, não funciona com v-model)
const itensComDestino = ref<ItemComDestino[]>([])

watch(() => props.itensEntrada, (newItens) => {
  itensComDestino.value = newItens.map(item => ({
    ...item,
    destino: 'manter'
  }))
}, { immediate: true, deep: true })

const confirmar = async () => {
  saving.value = true
  try {
    const hoje = new Date().toISOString().split('T')[0]

    for (const item of itensComDestino.value) {
      const destino = item.destino

      if (destino === 'manter') continue

      if (destino === 'apoio') {
        await createSaida({
          produto_id: item.produto_id,
          tipo: 'transferencia',
          data: hoje,
          quantidade: item.quantidade
        })
      } else if (destino === 'definitiva') {
        await createSaida({
          produto_id: item.produto_id,
          tipo: 'definitiva',
          data: hoje,
          quantidade: item.quantidade
        })
      } else if (destino.startsWith('loja_')) {
        const empresaDestinoId = destino.replace('loja_', '')
        await createSaida({
          produto_id: item.produto_id,
          tipo: 'transferencia',
          data: hoje,
          quantidade: item.quantidade,
          empresa_destino_id: empresaDestinoId
        })
      }
    }

    toast.add({ title: 'Destinos processados com sucesso', color: 'green' })
    emit('transferido')
    modelValue.value = false
  } catch (e: any) {
    toast.add({ title: 'Erro ao processar destinos', description: e.message, color: 'red' })
  } finally {
    saving.value = false
  }
}
</script>
```

- [ ] **Step 2: Commit**

```bash
git add components/movimentos/DestinoEntradaModal.vue
git commit -m "feat: create DestinoEntradaModal with multi-destination support"
```

---

### Task 9: Integrar DestinoEntradaModal nas páginas

**Arquivos:** `pages/movimentos/entradas.vue` + `pages/movimentos/controle-estoque.vue`

- [ ] **Step 1: Atualizar entradas.vue**

No template, substituir:

```html
<MovimentosTransferenciaApoioModal
  v-model="transferenciaApoioOpen"
  :itens-entrada="itensParaApoio"
/>
```

Por:

```html
<MovimentosDestinoEntradaModal
  v-model="transferenciaApoioOpen"
  :itens-entrada="itensParaApoio"
  @transferido="loadData()"
/>
```

- [ ] **Step 2: Atualizar controle-estoque.vue**

Mesma substituição no template (linhas ~1387-1390):

```html
<MovimentosDestinoEntradaModal
  v-model="transferenciaApoioOpen"
  :itens-entrada="itensParaApoio"
  @transferido="refreshData()"
/>
```

- [ ] **Step 3: Remover TransferenciaApoioModal.vue**

```bash
git rm components/movimentos/TransferenciaApoioModal.vue
```

- [ ] **Step 4: Commit**

```bash
git add components/movimentos/DestinoEntradaModal.vue pages/movimentos/entradas.vue pages/movimentos/controle-estoque.vue
git commit -m "feat: replace TransferenciaApoioModal with DestinoEntradaModal"
```

---

## Chunk 5: Lista de Requisições + QR Code

### Task 10: CRUD de Requisições no useEstoque

**Arquivo:** `composables/useEstoque.ts`

- [ ] **Step 1: Adicionar imports**

No topo do arquivo (linhas 1-20), adicionar `Requisicao` e `RequisicaoItem` ao import de types.

- [ ] **Step 2: Adicionar funções CRUD**

Antes do `return` final do composable, adicionar:

```typescript
// ==========================================
// REQUISIÇÕES
// ==========================================

const getRequisicoes = async (filtros?: { status?: string; setor_id?: string }) => {
  if (!empresaId.value) return [] as Requisicao[]

  let query = client
    .from('requisicoes')
    .select(`
      *,
      setor:setores(id, nome),
      itens:requisicao_itens(*, produto:produtos(id, nome, unidade:unidades(sigla)))
    `)
    .eq('empresa_id', empresaId.value)
    .order('created_at', { ascending: false })

  if (filtros?.status) query = query.eq('status', filtros.status)
  if (filtros?.setor_id) query = query.eq('setor_id', filtros.setor_id)

  const { data, error } = await query
  if (error) throw error
  return data as Requisicao[]
}

const getRequisicoesPendentesCount = async () => {
  if (!empresaId.value) return 0

  const { count, error } = await client
    .from('requisicoes')
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', empresaId.value)
    .eq('status', 'pendente')

  if (error) throw error
  return count || 0
}

const createRequisicao = async (requisicao: {
  setor_id: string
  solicitante_nome?: string
  observacao?: string
  itens: { produto_id: string; quantidade_solicitada: number }[]
}) => {
  // Criar requisição
  const { data: req, error: reqError } = await client
    .from('requisicoes')
    .insert({
      empresa_id: empresaId.value,
      setor_id: requisicao.setor_id,
      solicitante_nome: requisicao.solicitante_nome,
      observacao: requisicao.observacao
    })
    .select()
    .single()

  if (reqError) throw reqError

  // Criar itens
  const itens = requisicao.itens.map(item => ({
    requisicao_id: req.id,
    produto_id: item.produto_id,
    quantidade_solicitada: item.quantidade_solicitada
  }))

  const { error: itensError } = await client
    .from('requisicao_itens')
    .insert(itens)

  if (itensError) throw itensError

  return req as Requisicao
}

const enviarRequisicao = async (id: string, itensEnviados: { id: string; produto_id: string; quantidade_enviada: number }[]) => {
  const user = useSupabaseUser()
  const hoje = new Date().toISOString().split('T')[0]

  // Atualizar quantidades enviadas e CRIAR SAÍDAS para apoio
  for (const item of itensEnviados) {
    if (item.quantidade_enviada <= 0) continue

    // Atualizar quantidade enviada no item
    const { error } = await client
      .from('requisicao_itens')
      .update({ quantidade_enviada: item.quantidade_enviada })
      .eq('id', item.id)
    if (error) throw error

    // Criar saída tipo transferência para apoio
    await createSaida({
      produto_id: item.produto_id,
      tipo: 'transferencia',
      data: hoje,
      quantidade: item.quantidade_enviada
    })
  }

  // Marcar como enviado
  const { error: reqError } = await client
    .from('requisicoes')
    .update({
      status: 'enviado',
      enviado_por: user.value?.id,
      data_envio: new Date().toISOString()
    })
    .eq('id', id)

  if (reqError) throw reqError
}

const cancelarRequisicao = async (id: string) => {
  const { error } = await client
    .from('requisicoes')
    .update({ status: 'cancelado' })
    .eq('id', id)

  if (error) throw error
}
```

- [ ] **Step 3: Adicionar ao return do composable**

```typescript
getRequisicoes,
getRequisicoesPendentesCount,
createRequisicao,
enviarRequisicao,
cancelarRequisicao,
```

- [ ] **Step 4: Commit**

```bash
git add composables/useEstoque.ts
git commit -m "feat: add requisicoes CRUD functions to useEstoque"
```

---

### Task 11: Página de Requisições

**Arquivo:** `pages/movimentos/requisicoes.vue` (CRIAR)

- [ ] **Step 1: Criar página completa**

Criar `pages/movimentos/requisicoes.vue`. Esta é uma página grande — deve conter:

**Header:** "Requisições" + botão "Nova Requisição"

**Filtros:** Status (todas/pendente/enviado/cancelado) + busca por setor

**Lista de requisições:** Cards expansíveis, cada um mostrando:
- Setor, data, solicitante, status badge
- Ao expandir: tabela de itens com quantidade_solicitada e campo editável quantidade_enviada
- Botão "Enviar para Apoio" (para pendentes)
- Ao enviar: cria saídas tipo transferencia para apoio para cada item

**Formulário de requisição:** (modo para responsável do setor, via query param `?setor_id=X`)
- Lista de produtos do setor (via setor_produtos)
- Campos de quantidade
- Botão submeter

**O componente deve seguir os padrões do projeto:**
- Toolbar padrão (filtros à esquerda, ações à direita)
- UTable ou tabela manual com estilos Tailwind consistentes
- UModal para nova requisição
- Badge de status com cores: pendente (yellow), enviado (green), cancelado (gray)

A implementação completa é extensa (~300-400 linhas de template + ~200 linhas de script). O implementador deve usar as páginas existentes (ex: `entradas.vue`, `saidas.vue`, `lista-pedidos.vue`) como referência de padrão.

- [ ] **Step 2: Adicionar rota no menu lateral**

Verificar `layouts/default.vue` ou componente de navegação. Adicionar item de menu "Requisições" com ícone `i-heroicons-clipboard-document-list` na seção Movimentos.

- [ ] **Step 3: Commit**

```bash
git add pages/movimentos/requisicoes.vue
git commit -m "feat: create requisicoes page with estoquista and setor views"
```

---

### Task 12: QR Code no Modal de Empresas

**Arquivo:** `pages/configuracoes/empresas.vue`

- [ ] **Step 1: Instalar dependência qrcode**

```bash
npm install qrcode
npm install -D @types/qrcode
```

- [ ] **Step 2: Adicionar seção QR Code no modal**

Após o campo de logo (linhas ~219), antes do footer do modal, adicionar:

```html
<!-- QR Code para Requisições -->
<div class="border-t pt-4 mt-4">
  <div class="flex items-center justify-between mb-3">
    <div>
      <h4 class="text-sm font-medium text-operacao-800">QR Code de Requisição</h4>
      <p class="text-xs text-operacao-400">Para responsáveis de setor escanearem</p>
    </div>
    <UButton
      v-if="qrCodeUrl"
      color="white"
      size="sm"
      icon="i-heroicons-printer"
      @click="imprimirQrCode"
    >
      Imprimir
    </UButton>
  </div>
  <!-- Seletor de setor -->
  <USelectMenu
    v-model="qrSetorId"
    :options="setoresSelect"
    placeholder="Selecione o setor"
    value-attribute="value"
    option-attribute="label"
    class="mb-3"
    size="sm"
  />
  <div v-if="qrCodeUrl" class="flex justify-center">
    <img :src="qrCodeUrl" alt="QR Code Requisição" class="w-40 h-40" />
  </div>
</div>
```

- [ ] **Step 3: Adicionar lógica no script**

**Nota SSR:** `qrcode` usa canvas, que não existe no servidor. Importar de forma lazy e usar apenas client-side.

```typescript
// Import lazy (client-side only)
let QRCode: any = null
if (import.meta.client) {
  import('qrcode').then(m => { QRCode = m.default })
}

const qrSetorId = ref('')
const qrCodeUrl = ref('')

// Buscar setores
const setoresSelect = computed(() =>
  setores.value.map(s => ({ value: s.id, label: s.nome }))
)

watch(qrSetorId, async (setorId) => {
  if (!setorId || !editandoEmpresa.value?.id || !QRCode) {
    qrCodeUrl.value = ''
    return
  }
  const url = `https://www.cmv360app.com.br/movimentos/requisicoes?empresa_id=${editandoEmpresa.value.id}&setor_id=${setorId}`
  qrCodeUrl.value = await QRCode.toDataURL(url, { width: 256, margin: 1 })
})

const imprimirQrCode = () => {
  const win = window.open('', '_blank')
  if (!win) return
  const setor = setores.value.find(s => s.id === qrSetorId.value)
  win.document.write(`
    <html><body style="text-align:center;font-family:sans-serif;padding:40px">
      <h2>${editandoEmpresa.value?.nome || ''}</h2>
      <p>Requisição de Estoque — ${setor?.nome || ''}</p>
      <img src="${qrCodeUrl.value}" style="width:300px;height:300px" />
      <p style="margin-top:10px;font-size:12px;color:#666">Escaneie para solicitar itens</p>
    </body></html>
  `)
  win.document.close()
  win.print()
}
```

- [ ] **Step 4: Carregar setores na página**

Verificar se `getSetores()` já é chamado na página. Se não, adicionar ao `onMounted`:

```typescript
const { getSetores } = useEstoque()
const setores = ref<Setor[]>([])

onMounted(async () => {
  setores.value = await getSetores()
})
```

- [ ] **Step 5: Commit**

```bash
git add pages/configuracoes/empresas.vue package.json package-lock.json
git commit -m "feat: add QR code generation for requisicoes in empresa modal"
```

---

## Resumo de Commits

| # | Mensagem | Arquivos |
|---|----------|----------|
| 1 | feat: add UEPS cost function and requisicoes tables | migrations |
| 2 | feat: add Requisicao interfaces and update PainelMesApoio type | types/index.ts |
| 3 | feat: rename Saidas card to Saidas CMV Consumo, remove Saldo card | controle-estoque.vue |
| 4 | feat: remove EI and EF columns from principal waterfall table | controle-estoque.vue |
| 5 | feat: add sorting to principal waterfall table | controle-estoque.vue |
| 6 | feat: refactor getPainelMesApoio to return EI/EN/EF/CMV per day | useRelatorios.ts, types |
| 7 | feat: new apoio visual map with EI/EN/EF/CMV per day, sortable | controle-estoque.vue |
| 8 | feat: create DestinoEntradaModal with multi-destination support | DestinoEntradaModal.vue |
| 9 | feat: replace TransferenciaApoioModal with DestinoEntradaModal | multiple |
| 10 | feat: add requisicoes CRUD functions to useEstoque | useEstoque.ts |
| 11 | feat: create requisicoes page | requisicoes.vue |
| 12 | feat: add QR code in empresa modal | empresas.vue |
