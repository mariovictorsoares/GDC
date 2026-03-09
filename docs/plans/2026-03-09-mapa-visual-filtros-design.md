# Mapa Visual: Filtros Estoque Principal/Apoio + Tipos de Saída

## Resumo

Adicionar na toolbar do Mapa Visual:
1. Segmented control para alternar entre **Estoque Principal** e **Estoque de Apoio**
2. Multi-select de tipos de saída (só visível quando Principal selecionado)

## Toolbar

```
[Buscar produto...] [Mar 2026 v] [Principal | Apoio] [Saídas: Todas v]  ...  [Histórico | Mapa Visual]
```

- Segmented control: mesmo estilo visual do view switcher existente
- Multi-select: USelectMenu com `multiple`. Label dinâmico: "Todas" (tudo marcado), "3 tipos" (parcial), nomes (1-2 selecionados). Desaparece quando Apoio selecionado.

## Estoque Principal (com filtro de saídas)

Tipos de saída filtráveis:
- Definitiva
- Transf. Loja
- Transf. Apoio
- Produção

Quando desmarcar tipos:
- **Saídas por semana**: recalculam somando apenas tipos selecionados
- **Total saídas**: soma apenas tipos selecionados
- **E.F.**: recalcula como `E.I. + Entradas - Saídas(filtradas)`
- **Breakdown**: mostra só colunas dos tipos selecionados
- **Entradas e E.I.**: não mudam

Filtro é client-side. `getPainelMes` já retorna breakdown completo.

## Estoque de Apoio (visão diária)

Layout com saldo diário (entrada - saída por dia em célula única):

```
Produto | E.I. | Dia 1 | Dia 2 | ... | Dia N | E.F.
```

- Cada célula = saldo do dia (positivo = entrou mais, negativo = saiu mais, `-` = sem movimento)
- E.I. = saldo acumulado do apoio até o dia anterior ao mês
- E.F. = E.I. + soma dos saldos diários
- Entradas no apoio = transferências p/ apoio do estoque principal (`tipo='transferencia'` sem `empresa_destino_id`)
- Saídas do apoio = placeholder por agora (será alimentado pelas contagens futuras)

Requer nova função no `useRelatorios` para buscar dados diários do apoio.

## State novo

```ts
const painelEstoque = ref<'principal' | 'apoio'>('principal')
const painelTiposSaida = ref<string[]>(['definitiva', 'transf_loja', 'transf_apoio', 'beneficiamento'])
```

## Arquivos a alterar

- `pages/movimentos/controle-estoque.vue` — template (toolbar + tabela apoio) + script (state + computeds)
- `composables/useRelatorios.ts` — nova função `getPainelMesApoio` para dados diários
- `types/index.ts` — novo type `PainelMesApoio` e `DiaInfo`

## Fora de escopo

- Saídas do estoque de apoio (dados reais virão das contagens, futuro)
- Backend / API server changes
