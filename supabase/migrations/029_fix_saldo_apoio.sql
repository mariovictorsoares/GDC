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
