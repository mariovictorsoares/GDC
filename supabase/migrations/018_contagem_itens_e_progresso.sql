-- =============================================
-- Migration 018: Tabela contagem_itens + progresso por setor
-- Permite persistir contagens parciais e acompanhar progresso por setor
-- =============================================

-- Tabela de itens contados (persistência de contagens parciais)
CREATE TABLE IF NOT EXISTS contagem_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contagem_id UUID NOT NULL REFERENCES contagens(id) ON DELETE CASCADE,
  setor_id UUID NOT NULL REFERENCES setores(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade_contada DECIMAL,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contagem_id, setor_id, produto_id)
);

ALTER TABLE contagem_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contagem_itens_empresa" ON contagem_itens
  FOR ALL USING (empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  ));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contagem_itens_contagem ON contagem_itens(contagem_id);
CREATE INDEX IF NOT EXISTS idx_contagem_itens_setor ON contagem_itens(contagem_id, setor_id);
CREATE INDEX IF NOT EXISTS idx_contagem_itens_empresa ON contagem_itens(empresa_id);

-- Novos campos em contagem_setores para rastrear progresso por setor
ALTER TABLE contagem_setores ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente';
ALTER TABLE contagem_setores ADD COLUMN IF NOT EXISTS progresso INTEGER DEFAULT 0;
ALTER TABLE contagem_setores ADD COLUMN IF NOT EXISTS finalizado_em TIMESTAMPTZ;
