# Controle de Estoque — Melhorias e Novas Features

**Data:** 2026-03-12
**Status:** Aprovado (revisado)

---

## 1. Custo de Saída → UEPS (Último Custo de Entrada)

**Problema:** O sistema calculava custo de saída usando média ponderada mensal (CMC). Entrada de 10kg a R$150 resultava em saída de R$166,67 quando havia outras entradas no mês com custo diferente.

**Solução:** Trocar para UEPS — usar o custo unitário da entrada mais recente até a data da saída.

**Mudanças:**
- Nova função PostgreSQL `calcular_custo_ueps(produto_id, empresa_id, data)` — busca `valor_total / quantidade` da entrada mais recente com `data <= data_saida`, filtrada por `empresa_id` para isolamento multi-tenant
- Função marcada como `STABLE` para otimização de chamadas repetidas
- Fallback: se não houver entrada, usa `preco_inicial` do produto
- Trigger `trigger_set_semana_saida()` alterada para chamar `calcular_custo_ueps()` com `NEW.empresa_id`
- O custo só é calculado no INSERT (quando `custo_saida IS NULL`). Em UPDATE, o valor existente é preservado
- `calcular_custo_mes()` e `custos_mensais` mantidos para relatórios

**Migration:** `022_custo_saida_ueps.sql`

---

## 2. Cards do Controle de Estoque

**Arquivo:** `pages/movimentos/controle-estoque.vue` (linhas 29-61)

| Card | Antes | Depois |
|------|-------|--------|
| Movimentações | contagem total | sem mudança |
| Entradas | valor total entradas | sem mudança |
| Saídas | todos os tipos somados | **Renomear** para "Saídas CMV Consumo", **excluir** tipo `beneficiamento` do cálculo |
| Saldo | entradas - saídas | **Remover** |

**Layout:** Grid de 4 → 3 cards.

**Cálculo novo:** (dados já vêm filtrados por empresa via `filteredMovimentos`)
```typescript
filteredMovimentos.filter(m => m._tipoMov === 'saida' && m.tipo !== 'beneficiamento')
```

---

## 3. Mapa Visual — Estoque Principal (Detalhamento)

**Arquivo:** `pages/movimentos/controle-estoque.vue` (linhas ~1516-1576)

**Mudanças:**
- **Remover** colunas E.I. (Estoque Inicial) e E.F. (Estoque Final)
- **Colunas restantes:** Produto | Entradas (por semana + total) | Saídas (por semana + total) | C.Unit | Est.Total | CMV
- **Ordenação padrão:** Total Saídas decrescente
- **Sortable:** Todas as colunas numéricas clicáveis (usar lógica manual de sort com ícones)

---

## 4. Mapa Visual — Estoque de Apoio (novo layout)

**Arquivos:** `pages/movimentos/controle-estoque.vue` + `composables/useRelatorios.ts` (`getPainelMesApoio`)

**Layout novo — visão semanal com colunas diárias:**

```
            |  Seg 09/03          |  Ter 10/03          |  ...  | TOTAL
Produto     | EI  EN  EF  CMV    | EI  EN  EF  CMV    |       | CMV Total
────────────|─────────────────────|─────────────────────|───────|──────────
Filé frango | 10   5  12   3     |  12  0   8   4     |       |    7
Arroz       |  5   0   3   2     |   3  0   1   2     |       |    4
```

- **EI** = Estoque Inicial do dia
  - Primeiro dia da semana: calculado como `estoque_inicial_produto + sum(entradas até dia anterior) - sum(saidas até dia anterior)` (saldo acumulado)
  - Demais dias: EF do dia anterior
- **EN** = Entradas do dia
- **EF** = Estoque Final do dia (= EI + EN - saídas do dia)
- **CMV** = EI + EN - EF (consumo do dia)
- **Coluna TOTAL CMV** = soma dos CMVs diários da semana
- **Ordenação padrão:** CMV Total decrescente
- **Sortable**

**Mudança no composable:** `getPainelMesApoio()` precisa retornar por dia: `{ ei, entradas, ef, cmv }` ao invés de arrays separados `entradas_por_dia` / `saidas_por_dia`.

---

## 5. Lista de Requisição (nova feature)

### Autenticação

O responsável do setor **precisa estar logado** no sistema para criar requisições. O QR code leva à página de requisição com `empresa_id` e `setor_id` como parâmetros na URL, mas a criação efetiva da requisição usa as credenciais do usuário autenticado (RLS via `auth.uid()`).

### Modelo de dados

**Tabela `requisicoes`:**
- `id`, `empresa_id`, `setor_id`, `status` (pendente|enviado|cancelado)
- `data`, `solicitante_nome`, `observacao`
- `enviado_por`, `data_envio`

**Tabela `requisicao_itens`:**
- `id`, `requisicao_id`, `produto_id`
- `quantidade_solicitada` (CHECK > 0), `quantidade_enviada`
- `UNIQUE(requisicao_id, produto_id)` — mesmo produto não duplica na mesma requisição

**Migration:** `023_lista_requisicoes.sql`

### Fluxo

1. **Responsável do setor** escaneia QR code → faz login (se não estiver logado) → abre página de requisição
2. Vê produtos do seu setor, seleciona quantidades
3. Submete requisição (status: `pendente`)
4. **Estoquista** vê lista de requisições pendentes (contagem exibida via query simples no page load)
5. Pode alterar `quantidade_enviada` e clicar "Enviar para Apoio"
6. Sistema cria saída tipo `transferencia` para apoio
7. Status muda para `enviado`

### Páginas e componentes

- **Nova página:** `pages/movimentos/requisicoes.vue`
  - Visão do estoquista: lista de requisições com filtro por status
  - Cada requisição expansível com itens e quantidades editáveis
  - Botão "Enviar" processa a transferência
- **Formulário de requisição:** mesma página com query param `?setor_id=X` para visão do responsável
- **QR Code no modal de empresas** (`pages/configuracoes/empresas.vue`):
  - Botão "Gerar QR Code de Requisição"
  - QR aponta para URL: `https://cmv360app.com.br/movimentos/requisicoes?empresa_id=X&setor_id=Y`
  - Opção de imprimir

### Composable

Adicionar em `useEstoque.ts`:
- `getRequisicoes()` — lista com filtro por status/setor
- `createRequisicao()` — cria requisição com itens
- `enviarRequisicao(id)` — altera quantidades, cria saída, muda status
- `cancelarRequisicao(id)`

---

## 6. Modal Pós-Entrada — Escolha de Destino

**Arquivos:** `components/movimentos/TransferenciaApoioModal.vue` + `pages/movimentos/entradas.vue`

**Mudança:** Após salvar entrada, o modal mostra cada produto com um seletor de destino:

| Produto | Qtd | Destino |
|---------|-----|---------|
| Filé de Frango | 10kg | `[Apoio ▼]` |
| Arroz | 25kg | `[Loja X ▼]` |
| Óleo | 5L | `[Manter no Principal ▼]` |

**Opções do dropdown:**
- **Manter no Principal** (default) — não faz nada
- **Estoque de Apoio** — cria saída tipo `transferencia` sem `empresa_destino_id`
- **Loja [nome]** — cria saída tipo `transferencia` com `empresa_destino_id`
- **Saída Definitiva** — cria saída tipo `definitiva`

**Nota:** Beneficiamento (produção) **não** aparece como destino neste modal — tem seu próprio fluxo separado na página de saídas.

**Renomear componente** de `TransferenciaApoioModal` para `DestinoEntradaModal` (mais genérico).

---

## Arquivos impactados (resumo)

| Arquivo | Mudanças |
|---------|----------|
| `supabase/migrations/022_custo_saida_ueps.sql` | Nova função UEPS (multi-tenant) + trigger atualizada |
| `supabase/migrations/023_lista_requisicoes.sql` | Tabelas requisicoes + requisicao_itens (com CHECK e UNIQUE) |
| `types/index.ts` | Interfaces Requisicao, RequisicaoItem |
| `pages/movimentos/controle-estoque.vue` | Cards, Mapa Principal, Mapa Apoio |
| `pages/movimentos/entradas.vue` | Modal pós-entrada com destinos |
| `pages/movimentos/requisicoes.vue` | **NOVA** — página de requisições |
| `pages/configuracoes/empresas.vue` | QR code no modal |
| `components/movimentos/TransferenciaApoioModal.vue` → `DestinoEntradaModal.vue` | Refatorar para múltiplos destinos |
| `composables/useEstoque.ts` | CRUD requisições |
| `composables/useRelatorios.ts` | `getPainelMesApoio()` — novo formato EI/EN/EF/CMV |
