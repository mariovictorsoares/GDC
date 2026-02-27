-- =============================================
-- Migration 016: Tabelas de Contagem, Setores e Responsáveis
-- =============================================

-- Tabela de Setores
CREATE TABLE IF NOT EXISTS setores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE setores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "setores_empresa" ON setores
  FOR ALL USING (empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  ));

-- Tabela de Produtos por Setor
CREATE TABLE IF NOT EXISTS setor_produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setor_id UUID NOT NULL REFERENCES setores(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(setor_id, produto_id)
);

ALTER TABLE setor_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "setor_produtos_via_setor" ON setor_produtos
  FOR ALL USING (setor_id IN (
    SELECT id FROM setores WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
    )
  ));

-- Tabela de Responsáveis
CREATE TABLE IF NOT EXISTS responsaveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "responsaveis_empresa" ON responsaveis
  FOR ALL USING (empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  ));

-- Tabela de Contagens
CREATE TABLE IF NOT EXISTS contagens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT DEFAULT 'estoque',
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'pendente', 'atrasada', 'em_andamento', 'finalizada')),
  -- Recorrência
  recorrencia TEXT DEFAULT 'nenhuma' CHECK (recorrencia IN ('nenhuma', 'diaria', 'semanal', 'quinzenal', 'mensal')),
  horario_notificacao TEXT DEFAULT '07:00',
  dias_semana TEXT[] DEFAULT '{}',
  mensal_posicao TEXT,
  mensal_dia TEXT,
  -- Responsável
  responsavel_nome TEXT,
  responsavel_telefone TEXT,
  responsavel_id UUID REFERENCES responsaveis(id) ON DELETE SET NULL,
  -- Progresso
  progresso INTEGER DEFAULT 0,
  ultima_contagem TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contagens_empresa" ON contagens
  FOR ALL USING (empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  ));

-- Tabela de relacionamento Contagem <-> Setores
CREATE TABLE IF NOT EXISTS contagem_setores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contagem_id UUID NOT NULL REFERENCES contagens(id) ON DELETE CASCADE,
  setor_id UUID NOT NULL REFERENCES setores(id) ON DELETE CASCADE,
  UNIQUE(contagem_id, setor_id)
);

ALTER TABLE contagem_setores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contagem_setores_via_contagem" ON contagem_setores
  FOR ALL USING (contagem_id IN (
    SELECT id FROM contagens WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
    )
  ));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contagens_empresa ON contagens(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contagens_status ON contagens(status);
CREATE INDEX IF NOT EXISTS idx_contagens_recorrencia ON contagens(recorrencia);
CREATE INDEX IF NOT EXISTS idx_setores_empresa ON setores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_setor_produtos_setor ON setor_produtos(setor_id);
CREATE INDEX IF NOT EXISTS idx_contagem_setores_contagem ON contagem_setores(contagem_id);
CREATE INDEX IF NOT EXISTS idx_responsaveis_empresa ON responsaveis(empresa_id);
