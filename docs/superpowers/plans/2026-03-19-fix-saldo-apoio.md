# Fix Saldo Apoio Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir a view `v_saldo_estoque` para que `saldo_apoio` reflita corretamente o estoque de apoio (transferencias internas - consumo via contagem) e ajustes de contagem de apoio nao contaminem `saldo_principal`.

**Architecture:** Adicionar coluna `tipo` na tabela `ajustes` para distinguir ajustes de estoque principal vs apoio. Recriar a view com formulas corrigidas. Atualizar backend de finalizacao de contagem para preencher `tipo` e `contagem_id`.

**Tech Stack:** PostgreSQL (Supabase), Nuxt 3 server API (TypeScript)

**Spec:** `docs/superpowers/specs/2026-03-19-fix-saldo-apoio-design.md`

---

### Task 1: Migration SQL

**Files:**
- Create: `supabase/migrations/029_fix_saldo_apoio.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- =====================================================
-- MIGRATION 029: Fix saldo_apoio + separar ajustes por tipo
-- =====================================================
-- Problemas corrigidos:
-- 1. saldo_apoio nunca diminuia (nao considerava ajustes de contagem)
-- 2. saldo_apoio incluia transferencias para outra loja
-- 3. ajustes de contagem de apoio reduziam saldo_principal incorretamente
-- 4. saldo_atual nao subtraia transferencias para outra loja
-- 5. contagem_id nao era preenchido nos ajustes

-- 1. Adicionar coluna tipo na tabela ajustes
ALTER TABLE ajustes ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'principal'
  CHECK (tipo IN ('principal', 'apoio'));
CREATE INDEX IF NOT EXISTS idx_ajustes_tipo ON ajustes(tipo);

-- 2. Backfill: marcar ajustes de contagem de apoio
-- 2a. Via contagem_id FK (confiavel)
UPDATE ajustes a SET tipo = 'apoio'
FROM contagens c
WHERE a.contagem_id = c.id AND c.tipo = 'apoio';

-- 2b. Fallback: para ajustes sem contagem_id, match por motivo
UPDATE ajustes SET tipo = 'apoio'
WHERE contagem_id IS NULL AND motivo ILIKE '%apoio%';

-- 3. Recriar view v_saldo_estoque com formulas corrigidas
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

  -- Estoque Principal: entradas - TODAS saidas + ajustes PRINCIPAL apenas
  p.estoque_inicial
    + COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0)
    - COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id), 0)
    + COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id AND tipo = 'principal'), 0)
    as saldo_principal,

  -- Estoque Apoio: transferencias internas (para apoio, nao outra loja) + ajustes APOIO
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

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/029_fix_saldo_apoio.sql
git commit -m "fix: migration para corrigir saldo_apoio e separar ajustes por tipo"
```

---

### Task 2: Backend — preencher tipo e contagem_id nos ajustes

**Files:**
- Modify: `server/api/contagem/[token].post.ts:248-256`

- [ ] **Step 3: Add tipo and contagem_id to ajustes payload**

Change lines 248-256 from:

```typescript
    const ajustesPayload = itensResultado
      .filter(i => i.diferenca !== 0)
      .map(i => ({
        empresa_id: contagem.empresa_id,
        produto_id: i.produto_id,
        data: contagem.data || new Date().toISOString().split('T')[0],
        quantidade: i.diferenca,
        motivo: contagem.nome || 'Contagem'
      }))
```

To:

```typescript
    const ajustesPayload = itensResultado
      .filter(i => i.diferenca !== 0)
      .map(i => ({
        empresa_id: contagem.empresa_id,
        produto_id: i.produto_id,
        data: contagem.data || new Date().toISOString().split('T')[0],
        quantidade: i.diferenca,
        motivo: contagem.nome || 'Contagem',
        contagem_id: contagem.id,
        tipo: contagemTipo === 'apoio' ? 'apoio' : 'principal'
      }))
```

Note: `contagemTipo` is already defined at line 149 of this file as `const contagemTipo = (contagem as any).tipo || 'principal'`.

- [ ] **Step 4: Commit**

```bash
git add server/api/contagem/[token].post.ts
git commit -m "fix: preencher tipo e contagem_id ao criar ajustes de contagem"
```

---

### Task 3: Aplicar migration no Supabase

- [ ] **Step 5: Executar a migration no banco de producao via Supabase SQL Editor**

Copiar o conteudo de `supabase/migrations/029_fix_saldo_apoio.sql` e executar no SQL Editor do Supabase. Verificar que:
- A coluna `tipo` foi adicionada na tabela `ajustes`
- O backfill marcou ajustes de apoio corretamente
- A view `v_saldo_estoque` foi recriada

- [ ] **Step 6: Verificar saldos no banco**

Executar no SQL Editor:
```sql
-- Verificar que saldo_apoio agora considera ajustes
SELECT produto_id, produto, saldo_principal, saldo_apoio, saldo_atual,
       saldo_principal + saldo_apoio as soma_check
FROM v_saldo_estoque
WHERE saldo_apoio != 0
LIMIT 10;
```

Confirmar que `saldo_atual` = `saldo_principal + saldo_apoio` para todas as linhas.
