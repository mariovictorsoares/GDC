-- =====================================================
-- MIGRATION 033: Ordens de Produção
-- =====================================================
-- Módulo completo de ordens de produção com:
-- - Tabela principal (ordens_producao)
-- - BOM da OP (op_ingredientes)
-- - Expansão de saidas.tipo para incluir 'producao'
-- - Colunas em entradas para rastrear origem de produção
-- - Atualização da v_saldo_estoque para considerar saídas de produção

-- 1. Tabela de Ordens de Produção
CREATE TABLE IF NOT EXISTS ordens_producao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  ficha_tecnica_id UUID NOT NULL REFERENCES fichas_tecnicas(id),
  produto_id UUID NOT NULL REFERENCES produtos(id),
  status TEXT NOT NULL DEFAULT 'planejada'
    CHECK (status IN ('planejada', 'em_producao', 'concluida', 'cancelada')),
  quantidade_planejada DECIMAL(15,4) NOT NULL CHECK (quantidade_planejada > 0),
  quantidade_produzida DECIMAL(15,4),
  data_planejada DATE NOT NULL,
  data_inicio TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  responsavel_nome TEXT,
  ficha_versao INTEGER NOT NULL DEFAULT 1,
  custo_estimado DECIMAL(15,4),
  custo_real DECIMAL(15,4),
  observacao TEXT,
  motivo_cancelamento TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_op_empresa_status ON ordens_producao(empresa_id, status);
CREATE INDEX idx_op_produto ON ordens_producao(produto_id);
CREATE INDEX idx_op_data ON ordens_producao(data_planejada);
CREATE INDEX idx_op_ficha ON ordens_producao(ficha_tecnica_id);
CREATE UNIQUE INDEX idx_op_codigo_empresa ON ordens_producao(empresa_id, codigo);

-- 2. Tabela de Ingredientes da OP (BOM)
CREATE TABLE IF NOT EXISTS op_ingredientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ordem_id UUID NOT NULL REFERENCES ordens_producao(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade_planejada DECIMAL(15,4) NOT NULL,
  quantidade_real DECIMAL(15,4),
  custo_unitario DECIMAL(15,4),
  fator_correcao DECIMAL(8,4) NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ordem_id, produto_id)
);

CREATE INDEX idx_opi_ordem ON op_ingredientes(ordem_id);
CREATE INDEX idx_opi_produto ON op_ingredientes(produto_id);

-- 3. Expandir CHECK de saidas.tipo para incluir 'producao'
ALTER TABLE saidas DROP CONSTRAINT IF EXISTS saidas_tipo_check;
ALTER TABLE saidas ADD CONSTRAINT saidas_tipo_check
  CHECK (tipo IN ('transferencia', 'definitiva', 'beneficiamento', 'producao'));

-- 4. Adicionar colunas em entradas para rastrear origem de produção
ALTER TABLE entradas ADD COLUMN IF NOT EXISTS origem_producao BOOLEAN DEFAULT false;
ALTER TABLE entradas ADD COLUMN IF NOT EXISTS ordem_producao_id UUID REFERENCES ordens_producao(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_entradas_op ON entradas(ordem_producao_id) WHERE ordem_producao_id IS NOT NULL;

-- 5. Adicionar coluna ordem_producao_id em saidas para rastreabilidade
ALTER TABLE saidas ADD COLUMN IF NOT EXISTS ordem_producao_id UUID REFERENCES ordens_producao(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_saidas_op ON saidas(ordem_producao_id) WHERE ordem_producao_id IS NOT NULL;

-- 6. Recriar v_saldo_estoque com suporte a saídas tipo='producao'
-- Mudanças vs migration 029:
--   - Adicionado p.empresa_id ao SELECT (necessário para filtro PostgREST)
--   - saldo_atual agora subtrai tipo='producao' além de 'definitiva'
DROP VIEW IF EXISTS v_saldo_estoque;
CREATE VIEW v_saldo_estoque AS
SELECT
  p.id as produto_id,
  p.empresa_id,
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

  -- Saldo total: EI + entradas - (definitiva + producao + outra loja) + TODOS ajustes
  p.estoque_inicial
    + COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0)
    - COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id AND (tipo IN ('definitiva', 'producao') OR empresa_destino_id IS NOT NULL)), 0)
    + COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id), 0)
    as saldo_atual,

  calcular_custo_medio(p.id) as custo_medio,

  (p.estoque_inicial
    + COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0)
    - COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id AND (tipo IN ('definitiva', 'producao') OR empresa_destino_id IS NOT NULL)), 0)
    + COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id), 0))
    * calcular_custo_medio(p.id) as valor_estoque

FROM produtos p
LEFT JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN unidades u ON p.unidade_id = u.id
WHERE p.ativo = true
ORDER BY c.nome, p.nome;

-- 7. RLS
ALTER TABLE ordens_producao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "op_select" ON ordens_producao FOR SELECT
  USING (empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()));

CREATE POLICY "op_insert" ON ordens_producao FOR INSERT
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()));

CREATE POLICY "op_update" ON ordens_producao FOR UPDATE
  USING (empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()));

CREATE POLICY "op_delete" ON ordens_producao FOR DELETE
  USING (empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()));

ALTER TABLE op_ingredientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opi_select" ON op_ingredientes FOR SELECT
  USING (ordem_id IN (
    SELECT id FROM ordens_producao WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "opi_insert" ON op_ingredientes FOR INSERT
  WITH CHECK (ordem_id IN (
    SELECT id FROM ordens_producao WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "opi_update" ON op_ingredientes FOR UPDATE
  USING (ordem_id IN (
    SELECT id FROM ordens_producao WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "opi_delete" ON op_ingredientes FOR DELETE
  USING (ordem_id IN (
    SELECT id FROM ordens_producao WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
    )
  ));
