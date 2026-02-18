-- =====================================================
-- MIGRATION 009: Tipo de Saída + Estoque Duplo (Principal/Apoio)
-- =====================================================

-- 1. Adicionar coluna tipo na tabela saidas
ALTER TABLE saidas ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'definitiva'
  CHECK (tipo IN ('transferencia', 'definitiva'));

-- 2. Índice para filtrar por tipo
CREATE INDEX IF NOT EXISTS idx_saidas_tipo ON saidas(tipo);

-- 3. Migrar dados existentes: saídas para "ESTOQUE APOIO" viram transferência
UPDATE saidas s
SET tipo = 'transferencia'
FROM destinos d
WHERE s.destino_id = d.id
  AND UPPER(d.nome) = 'ESTOQUE APOIO';

-- 4. Garantir que todas as saídas existentes tenham tipo preenchido
UPDATE saidas SET tipo = 'definitiva' WHERE tipo IS NULL;

-- 5. Dropar e recriar view v_saldo_estoque com saldo_principal e saldo_apoio
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
  -- Estoque Principal: entradas - TODAS as saídas (transferências e definitivas saem do principal)
  p.estoque_inicial
    + COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0)
    - COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id), 0)
    + COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id), 0) as saldo_principal,
  -- Estoque de Apoio: acumula transferências recebidas
  COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id AND tipo = 'transferencia'), 0) as saldo_apoio,
  -- Saldo total (principal + apoio) = estoque_inicial + entradas - definitivas + ajustes
  p.estoque_inicial
    + COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0)
    - COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id AND tipo = 'definitiva'), 0)
    + COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id), 0) as saldo_atual,
  calcular_custo_medio(p.id) as custo_medio,
  (p.estoque_inicial
    + COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0)
    - COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id AND tipo = 'definitiva'), 0)
    + COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id), 0))
    * calcular_custo_medio(p.id) as valor_estoque
FROM produtos p
LEFT JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN unidades u ON p.unidade_id = u.id
WHERE p.ativo = true
ORDER BY c.nome, p.nome;
