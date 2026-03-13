# Histórico Detalhado de Contagens Finalizadas

## Problema

Quando uma contagem é finalizada, os `contagem_itens` são deletados e o histórico é reconstruído a partir de ajustes filtrados por nome (frágil). O admin não consegue ver produto a produto o que aconteceu numa contagem passada.

## Solução

### 1. Preservar `contagem_itens` após finalização

- **Remover** `deleteContagemItens()` do `ContagemRevisao.vue` (linha 306)
- Os dados já contêm `quantidade_contada` e `saldo_no_momento` — suficiente para reconstruir a visão completa
- Para contagens recorrentes: `prepararProximoCiclo()` cria novo ciclo; itens antigos ficam vinculados ao ID da contagem finalizada, sem conflito

### 2. Refatorar carregamento do histórico

- **Antes**: `getAjustes({})` → filtra por `motivo.includes(nomeContagem)` (frágil)
- **Depois**: buscar contagens finalizadas com mesmo nome/configuração, ou simplesmente listar finalizações da contagem selecionada
- Para contagens recorrentes: cada ciclo finalizado gera uma nova contagem com status 'finalizada' — listar todas que compartilham o mesmo `nome`
- Nova função `getContagemItensComProduto(contagemId)` que retorna itens com dados do produto (nome, unidade, custo_medio)

### 3. UI do histórico detalhado

**ContagemDetalhes.vue** — cada linha do histórico fica clicável:

Ao clicar, expande inline mostrando:
- **Cards de resumo**: total contados, sobras, faltas, impacto R$
- **Tabela completa**: produto | unidade | saldo sistema | contado | diferença | valor R$
- Linhas com sobra em verde, falta em vermelho, sem diferença neutro
- Para contagens antigas (sem contagem_itens): mostra mensagem "Detalhes indisponíveis para contagens anteriores à atualização"

### 4. Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `components/contagem/ContagemRevisao.vue` | Remover `deleteContagemItens()` |
| `components/contagem/ContagemDetalhes.vue` | Adicionar expansão com tabela detalhada |
| `composables/useEstoque.ts` | Nova função para buscar itens com produto |
| `pages/movimentos/contagens.vue` | Ajustar carregamento do histórico |

### 5. Dados antigos

Contagens finalizadas antes desta mudança não terão `contagem_itens` preservados. Para essas, o histórico continua mostrando apenas o resumo (sobras/faltas/valor), com indicação de que detalhes não estão disponíveis.
