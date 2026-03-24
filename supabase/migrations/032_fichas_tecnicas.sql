-- =====================================================
-- MIGRATION 032: Fichas Técnicas (Receitas)
-- =====================================================
-- Pré-requisito para o módulo de Ordens de Produção.
-- Permite cadastrar receitas vinculadas a produtos,
-- definindo ingredientes, quantidades e fatores de correção.

-- 1. Tabela de Fichas Técnicas (cabeçalho da receita)
CREATE TABLE IF NOT EXISTS fichas_tecnicas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  rendimento DECIMAL(15,4) NOT NULL DEFAULT 1 CHECK (rendimento > 0),
  versao INTEGER NOT NULL DEFAULT 1,
  ativa BOOLEAN NOT NULL DEFAULT true,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, produto_id, versao)
);

-- Apenas 1 versão ativa por produto/empresa
CREATE UNIQUE INDEX idx_ft_ativa_unica
  ON fichas_tecnicas(empresa_id, produto_id)
  WHERE ativa = true;

CREATE INDEX idx_ft_empresa ON fichas_tecnicas(empresa_id);
CREATE INDEX idx_ft_produto ON fichas_tecnicas(produto_id);

-- 2. Tabela de Ingredientes da Ficha Técnica (BOM)
CREATE TABLE IF NOT EXISTS ficha_tecnica_ingredientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ficha_tecnica_id UUID NOT NULL REFERENCES fichas_tecnicas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade DECIMAL(15,4) NOT NULL CHECK (quantidade > 0),
  fator_correcao DECIMAL(8,4) NOT NULL DEFAULT 1.0 CHECK (fator_correcao > 0),
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ficha_tecnica_id, produto_id)
);

CREATE INDEX idx_fti_ficha ON ficha_tecnica_ingredientes(ficha_tecnica_id);
CREATE INDEX idx_fti_produto ON ficha_tecnica_ingredientes(produto_id);

-- 3. RLS
ALTER TABLE fichas_tecnicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ft_select" ON fichas_tecnicas FOR SELECT
  USING (empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()));

CREATE POLICY "ft_insert" ON fichas_tecnicas FOR INSERT
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()));

CREATE POLICY "ft_update" ON fichas_tecnicas FOR UPDATE
  USING (empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()));

CREATE POLICY "ft_delete" ON fichas_tecnicas FOR DELETE
  USING (empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()));

ALTER TABLE ficha_tecnica_ingredientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fti_select" ON ficha_tecnica_ingredientes FOR SELECT
  USING (ficha_tecnica_id IN (
    SELECT id FROM fichas_tecnicas WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "fti_insert" ON ficha_tecnica_ingredientes FOR INSERT
  WITH CHECK (ficha_tecnica_id IN (
    SELECT id FROM fichas_tecnicas WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "fti_update" ON ficha_tecnica_ingredientes FOR UPDATE
  USING (ficha_tecnica_id IN (
    SELECT id FROM fichas_tecnicas WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "fti_delete" ON ficha_tecnica_ingredientes FOR DELETE
  USING (ficha_tecnica_id IN (
    SELECT id FROM fichas_tecnicas WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
    )
  ));
