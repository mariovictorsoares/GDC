# Plano: Transformar "Ajustes" em "Contagem" — Estilo Alô Chefia

## Contexto

A página atual `/movimentos/ajustes.vue` permite registrar ajustes **produto a produto**, com modal individual. O Alô Chefia usa um modelo **conversacional em lote**: o usuário conta vários produtos de uma vez e o sistema processa tudo junto, mostrando diferenças automaticamente.

A ideia é transformar a "Contagem" em um **fluxo de inventário em lote por categoria**, onde o usuário seleciona uma categoria, vê TODOS os produtos dessa categoria de uma vez, preenche as quantidades contadas, e o sistema calcula automaticamente as diferenças (sobras/faltas) — gerando os ajustes em massa.

---

## O que vai mudar

### Página: `/movimentos/ajustes.vue` → Renomear para "Contagem"

A página deixa de ser "Ajustes de Estoque" e vira **"Contagem de Estoque"**, com o seguinte fluxo:

---

## Fluxo da Nova Contagem (Inspirado no Alô Chefia)

### ETAPA 1 — Iniciar Nova Contagem
- Botão principal: **"Nova Contagem"**
- Abre modal/step com:
  - **Data da contagem** (default: hoje)
  - **Filtro por Categoria** (obrigatório) — o usuário escolhe qual categoria contar
  - Botão "Iniciar Contagem"

### ETAPA 2 — Tela de Contagem em Lote (fullscreen/modal grande)
- Título: "Contagem — [Nome da Categoria] — [Data]"
- **Lista de TODOS os produtos da categoria selecionada**, cada um com:
  - Nome do produto
  - Unidade (sigla)
  - Estoque do Sistema (saldo atual, read-only, em cinza)
  - **Campo de input: Quantidade Contada** (campo numérico editável, inicialmente vazio)
  - **Diferença calculada automaticamente** (Contada - Sistema):
    - Verde se positiva (sobra)
    - Vermelho se negativa (falta)
    - Cinza se não preenchida
- **Barra de progresso** no topo mostrando: "X de Y produtos contados"
- **Campo de busca/filtro rápido** para encontrar produto dentro da lista
- A lista é scrollável, tipo planilha

### ETAPA 3 — Revisão e Confirmação
- Ao clicar "Finalizar Contagem":
  - Mostra um **resumo** com:
    - Total de produtos contados vs não contados
    - Produtos com **sobra** (verde)
    - Produtos com **falta** (vermelho)
    - Produtos **sem diferença** (ok, cinza)
  - Campo obrigatório: **Motivo/Observação geral** da contagem
  - Opção: "Salvar apenas produtos com diferença" (checkbox, default: ON)
  - Botão: **"Confirmar e Salvar Ajustes"**

### ETAPA 4 — Salvamento em Lote
- Para cada produto com diferença (quantidade_contada ≠ estoque_sistema):
  - Cria um registro na tabela `ajustes` com:
    - `produto_id`
    - `data` (data selecionada)
    - `quantidade` = quantidade_contada - saldo_sistema (o ajuste calculado)
    - `motivo` = motivo geral + nome do produto
- Toast de sucesso com resumo: "Contagem salva! X ajustes positivos, Y ajustes negativos"
- Modal perguntando: "Deseja contar outra categoria?"

---

## Histórico de Contagens

A tabela na parte inferior da página muda de "lista de ajustes individuais" para **"lista de contagens realizadas"** agrupadas:
- Cada linha = uma contagem (data + categoria + total de itens + sobras + faltas)
- Expandir uma contagem mostra os ajustes individuais gerados
- Filtros: data, categoria, tipo (sobra/falta/todos)
- Mantém ações de editar/excluir por item individual

---

## Arquivos a Criar/Modificar

### 1. `pages/movimentos/ajustes.vue` — REESCREVER COMPLETAMENTE
- Nova UI completa de contagem em lote
- 3 estados/etapas no fluxo (setup → contagem → revisão)
- Histórico de contagens agrupado

### 2. `composables/useEstoque.ts` — ADICIONAR FUNÇÕES
- `createAjustesEmLote(ajustes[])` — insert batch na tabela ajustes
- `getAjustesAgrupados()` — query que agrupa ajustes por data+motivo para mostrar como "contagens"

### 3. `types/index.ts` — ADICIONAR TIPOS
- `ContagemItem` — item individual na tela de contagem (produto_id, nome, unidade, saldo_sistema, quantidade_contada, diferenca)
- `ContagemResumo` — resumo agrupado para histórico

### 4. `layouts/default.vue` — ATUALIZAR MENU
- Mudar label "Ajustes" → "Contagem"
- Mudar ícone para `i-heroicons-clipboard-document-check`

---

## Detalhes Técnicos

### Dados necessários para a tela de contagem:
1. `getProdutos()` filtrado por `categoria_id` — lista de produtos
2. `getSaldoEstoque()` ou queries individuais via `v_saldo_estoque` — saldo de cada produto
3. Cálculo client-side: `diferenca = quantidade_contada - saldo_sistema`

### Performance:
- Carregar saldos de todos os produtos da categoria de uma vez (não um por um)
- Usar `getSaldoEstoque()` que já retorna todos, e filtrar no frontend por categoria

### Persistência temporária:
- Manter estado da contagem em ref/reactive (sem salvar rascunhos no banco)
- Se fechar sem salvar, perdem-se os dados (com aviso)

### Tabela de ajustes no banco:
- **Não muda** — continua usando a mesma tabela `ajustes`
- O que muda é que agora vários registros são inseridos de uma vez
- O campo `motivo` servirá como identificador da contagem (ex: "Contagem 18/02/2026 - Carnes")

---

## Resumo Visual do Fluxo

```
[Tela Principal: Contagem de Estoque]
    |
    ├── [Botão: Nova Contagem]
    |       ├── Seleciona Data
    |       ├── Seleciona Categoria
    |       └── [Iniciar]
    |              |
    |              ▼
    |       [Tela de Contagem em Lote]
    |       ┌─────────────────────────────────┐
    |       │ Progresso: 5/12 produtos        │
    |       │ 🔍 Buscar produto...            │
    |       ├─────────────────────────────────┤
    |       │ Produto    │ Sistema │ Contada │ Dif│
    |       │ Carne kg   │  25.5   │ [23.0]  │ -2.5│
    |       │ Frango kg  │  10.0   │ [10.0]  │  0  │
    |       │ Porco kg   │   8.0   │ [ 9.5]  │+1.5 │
    |       │ Peixe kg   │  15.0   │ [    ]  │  -  │
    |       └─────────────────────────────────┘
    |       [Finalizar Contagem]
    |              |
    |              ▼
    |       [Modal Revisão/Confirmação]
    |       → Resumo de diferenças
    |       → Motivo geral
    |       → [Confirmar e Salvar]
    |
    └── [Histórico de Contagens]
            ├── 18/02/2026 - Carnes (12 itens, 3 faltas, 1 sobra)
            ├── 17/02/2026 - Bebidas (8 itens, 0 faltas, 0 sobras)
            └── ...
```

---

## O que NÃO muda
- Tabela `ajustes` no banco (mesma estrutura)
- API `createAjuste()` individual (ainda disponível)
- View `v_saldo_estoque` (fonte dos saldos)
- Cálculo de semana automático (trigger do banco)
- Relatórios que usam ajustes (CMV, Gestão Inventário, etc.)
