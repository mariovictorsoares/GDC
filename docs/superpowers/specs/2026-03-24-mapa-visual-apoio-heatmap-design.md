# Mapa Visual Estoque de Apoio — Redesign Heatmap

**Data:** 2026-03-24
**Arquivo:** `pages/estoque/apoio.vue`
**Escopo:** Redesign do template da tabela do Mapa Visual + computed de heatmap. Sem mudança em composables, tipos ou API.

## Objetivo

Simplificar o mapa visual de 4 colunas por dia (EI, EN, EF, CMV) para 2 colunas (En, CMV) com heatmap de cores para leitura visual instantânea.

## Estrutura da Tabela

### Header (2 rows)

- **Row 1:** Produto (sticky, rowspan=2) | Dia da semana com colspan=2 por dia (ex: "Seg 24", "Ter 25") | Total En (rowspan=2) | Total CMV (rowspan=2, sortable)
- **Row 2:** Sub-headers "En" e "CMV" repetidos para cada dia

### Body

- **Coluna Produto:** sticky left, nome + unidade entre parênteses, shadow sutil na borda
- **2 colunas por dia:** En (verde) e CMV (vermelho)
- **2 colunas de totais:** soma semanal de En e soma semanal de CMV

### Sem linha de totais no rodapé

Cada produto tem seu próprio ritmo, uma soma geral não agrega valor.

## Heatmap

### Lógica

- Calcula o valor máximo de En e o máximo de CMV entre todos os produtos visíveis **na página atual** da semana selecionada. Isso é intencional — maximiza o contraste visual dentro de cada página. As cores se recalculam ao trocar de página.
- Cada célula recebe intensidade de cor proporcional: `valor / máximo`
- Valor zero = sem cor, exibe "-"
- Se uma semana inteira não tiver movimentação, todas as células ficam "-" sem background (max === 0).

### Colunas de Total

Também recebem heatmap, mas com máximos calculados separadamente (max dos totais de En e max dos totais de CMV entre os produtos da página).

### Implementação

Uma função `heatmapStyle(value: number, max: number, type: 'en' | 'cmv')` que retorna um objeto de estilo inline com `backgroundColor` usando RGBA com opacidade proporcional. Gradiente contínuo (não discreto):

- `type === 'en'` → `rgba(16, 185, 129, opacity)` (emerald-500 base)
- `type === 'cmv'` → `rgba(244, 63, 94, opacity)` (rose-500 base)
- `opacity` = `(value / max) * 0.35` (cap em 0.35 para manter legibilidade do texto)
- Se `value === 0` ou `max === 0` → sem background

## Detalhes Visuais

- Font `tabular-nums` para alinhamento numérico
- Texto `text-[11px]` (mais espaço agora com 2 colunas)
- En: texto `text-emerald-700`
- CMV: texto `text-rose-700`, `font-semibold`
- Total En: texto `text-emerald-800`, `font-bold`
- Total CMV: texto `text-rose-800`, `font-bold`
- Sub-headers En: `text-emerald-600`, fundo `bg-emerald-50/40`
- Sub-headers CMV: `text-rose-600`, fundo `bg-rose-50/40`
- Header dos dias: fundo `bg-operacao-100/50`

## Mudanças no Script

### Novo helper: `getMapaTotalEn`

```ts
const getMapaTotalEn = (item: MapaVisualApoioItem) => {
  const semana = item.semanas[semanaIndex.value]
  if (!semana) return 0
  return semana.dias.reduce((sum, dia) => sum + (dia.en || 0), 0)
}
```

`getMapaTotal` (CMV) permanece como está.

### Computeds de max para heatmap

```ts
const heatmapMaxEn = computed(() => Math.max(...mapaPaginatedItems.value.map(i => /* max de en diário */)))
const heatmapMaxCmv = computed(() => Math.max(...mapaPaginatedItems.value.map(i => /* max de cmv diário */)))
const heatmapMaxTotalEn = computed(() => Math.max(...mapaPaginatedItems.value.map(i => getMapaTotalEn(i))))
const heatmapMaxTotalCmv = computed(() => Math.max(...mapaPaginatedItems.value.map(i => getMapaTotal(i))))
```

### Colunas sortable

- **Produto**: sortable (alfabético) — já existe
- **Total CMV**: sortable (numérico, default desc) — já existe
- **Total En**: NÃO sortable

### Coluna Produto (sticky)

Mantém `bg-white` no body para contraste com as células de heatmap ao lado.

## O que NÃO muda

- Toolbar (tabs, month picker, week navigator, search, refresh)
- Paginação (TablePagination)
- Loading skeleton
- View "Posição Atual" inteira
- Data model (`MapaVisualApoioDia` continua com ei/en/ef/cmv)
- Composable `getMapaVisualApoio()` — sem alteração
- Tipos em `types/index.ts` — sem alteração
- Watchers, realtime, sort por produto
