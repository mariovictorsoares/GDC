-- =============================================
-- MIGRATION 010: Tabela de faturamentos semanais
-- Para CMC Semanal (entradas / faturamento por semana)
-- =============================================

-- Tabela para armazenar faturamento semanal (input manual)
CREATE TABLE IF NOT EXISTS faturamentos_semanais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  semana_inicio DATE NOT NULL, -- segunda-feira da semana
  semana_fim DATE NOT NULL,    -- domingo da semana
  valor DECIMAL(15,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(empresa_id, semana_inicio)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_faturamentos_semanais_empresa ON faturamentos_semanais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_faturamentos_semanais_periodo ON faturamentos_semanais(empresa_id, ano, semana_inicio);

-- RLS
ALTER TABLE faturamentos_semanais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faturamentos_semanais_select" ON faturamentos_semanais
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "faturamentos_semanais_insert" ON faturamentos_semanais
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "faturamentos_semanais_update" ON faturamentos_semanais
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "faturamentos_semanais_delete" ON faturamentos_semanais
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
    )
  );
