# Fix: Saldo Apoio e Separacao de Ajustes

**Data:** 2026-03-19
**Status:** Aprovado

## Problema

A view `v_saldo_estoque` tem 3 bugs que corrompem os saldos de estoque:

1. **`saldo_apoio` nunca diminui** — formula atual e `SUM(saidas WHERE tipo='transferencia')`. So acumula transferencias, nunca subtrai consumo. Ajustes de contagem de apoio nao entram no calculo.

2. **`saldo_apoio` inclui "Outra Loja"** — transferencias para outra loja (`empresa_destino_id IS NOT NULL`) inflam o saldo_apoio indevidamente.

3. **Ajustes de apoio bagunçam saldo_principal** — quando contagem de apoio gera ajuste (ex: -55), esse valor e somado no `saldo_principal`, reduzindo-o incorretamente.

4. **`saldo_atual` nao subtrai "Outra Loja"** — transferencias para outra loja nao sao subtraidas de `saldo_atual`, inflando o total.

5. **`contagem_id` nao preenchido** — a tabela `ajustes` tem a coluna `contagem_id` mas o codigo de finalizacao de contagem nao a preenche.

## Solucao

### Abordagem: Coluna `tipo` na tabela `ajustes`

Adicionar coluna `tipo` em `ajustes` com valores `'principal'` (default) ou `'apoio'`. O codigo de finalizacao de contagem seta o tipo conforme `contagens.tipo`. A view usa essa coluna para separar ajustes nas formulas.

### Formulas corrigidas

```
saldo_principal = estoque_inicial
  + SUM(entradas)
  - SUM(ALL saidas)
  + SUM(ajustes WHERE tipo = 'principal')

saldo_apoio = SUM(saidas WHERE tipo = 'transferencia' AND empresa_destino_id IS NULL)
  + SUM(ajustes WHERE tipo = 'apoio')

saldo_atual = estoque_inicial
  + SUM(entradas)
  - SUM(saidas WHERE tipo = 'definitiva' OR empresa_destino_id IS NOT NULL)
  + SUM(ALL ajustes)
```

**Invariante:** `saldo_atual = saldo_principal + saldo_apoio`

### Verificacao matematica

Exemplo: Produto Coca. Transferiu 60 para apoio. Contagem de apoio: contou 5.

| Campo | Calculo | Resultado |
|-------|---------|-----------|
| saldo_principal | 0 + entradas - 60(transf) + 0(aj.principal) | entradas - 60 |
| saldo_apoio | 60(transf apoio) + (-55)(aj.apoio) | 5 |
| saldo_atual | principal + apoio | entradas - 55 |

## Mudancas

### 1. Nova migration: `029_fix_saldo_apoio.sql`

**Coluna tipo em ajustes:**
```sql
ALTER TABLE ajustes ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'principal'
  CHECK (tipo IN ('principal', 'apoio'));
CREATE INDEX IF NOT EXISTS idx_ajustes_tipo ON ajustes(tipo);
```

**Backfill dados existentes:**
```sql
UPDATE ajustes SET tipo = 'apoio' WHERE motivo = 'Estoque de Apoio';
```
Match pelo campo `motivo` que guarda o nome da contagem. Ajustes que nao matcharem ficam como `'principal'` (default seguro).

**Recriar view:**
```sql
DROP VIEW IF EXISTS v_saldo_estoque;
CREATE VIEW v_saldo_estoque AS
SELECT
  p.id as produto_id,
  c.nome as categoria,
  p.nome as produto,
  u.sigla as unidade,
  p.estoque_inicial,
  COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0) as total_entradas,
  COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id), 0) as total_saidas,
  COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id), 0) as total_ajustes,

  -- Estoque Principal: entradas - TODAS saidas + ajustes PRINCIPAL
  p.estoque_inicial
    + COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0)
    - COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id), 0)
    + COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id AND tipo = 'principal'), 0)
    as saldo_principal,

  -- Estoque Apoio: transferencias internas + ajustes APOIO
  COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id AND tipo = 'transferencia' AND empresa_destino_id IS NULL), 0)
    + COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id AND tipo = 'apoio'), 0)
    as saldo_apoio,

  -- Saldo total (principal + apoio): entradas - (definitiva + outra loja) + TODOS ajustes
  p.estoque_inicial
    + COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0)
    - COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id AND (tipo = 'definitiva' OR empresa_destino_id IS NOT NULL)), 0)
    + COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id), 0)
    as saldo_atual,

  calcular_custo_medio(p.id) as custo_medio,

  (p.estoque_inicial
    + COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0)
    - COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id AND (tipo = 'definitiva' OR empresa_destino_id IS NOT NULL)), 0)
    + COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id), 0))
    * calcular_custo_medio(p.id) as valor_estoque

FROM produtos p
LEFT JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN unidades u ON p.unidade_id = u.id
WHERE p.ativo = true
ORDER BY c.nome, p.nome;
```

### 2. Backend: `server/api/contagem/[token].post.ts`

No bloco de criacao de ajustes (linhas ~247-262), adicionar `tipo` e `contagem_id`:

```typescript
const ajustesPayload = itensResultado
  .filter(i => i.diferenca !== 0)
  .map(i => ({
    empresa_id: contagem.empresa_id,
    produto_id: i.produto_id,
    data: contagem.data || new Date().toISOString().split('T')[0],
    quantidade: i.diferenca,
    motivo: contagem.nome || 'Contagem',
    contagem_id: contagem.id,                          // NOVO
    tipo: contagemTipo === 'apoio' ? 'apoio' : 'principal'  // NOVO
  }))
```

## Premissas

- Nao existem ajustes manuais sem contagem
- `estoque_inicial` esta zerado (nao usado)
- Nomes de contagem padrao: 'Estoque Principal', 'Estoque de Apoio', 'Inventario'
- Imprecisao historica no backfill e aceitavel (ajustes antigos sem contagem_id ficam como 'principal')

## Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `supabase/migrations/029_fix_saldo_apoio.sql` | Nova migration |
| `server/api/contagem/[token].post.ts` | Adicionar tipo e contagem_id no payload de ajustes |
