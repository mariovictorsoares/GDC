-- =====================================================
-- MULTI-EMPRESA: Tabelas e colunas para suporte multi-tenant
-- =====================================================

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(200) NOT NULL,
  cnpj VARCHAR(20),
  logo_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela associativa: usuario <-> empresa (com papel)
CREATE TABLE IF NOT EXISTS usuarios_empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  papel VARCHAR(50) DEFAULT 'membro',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, empresa_id)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_user ON usuarios_empresas(user_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_empresa ON usuarios_empresas(empresa_id);

-- =====================================================
-- ADICIONAR empresa_id NAS TABELAS EXISTENTES
-- =====================================================

ALTER TABLE categorias ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE destinos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE entradas ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE saidas ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE ajustes ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE custos_mensais ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE faturamentos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
ALTER TABLE subgrupos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;

-- Índices para empresa_id
CREATE INDEX IF NOT EXISTS idx_categorias_empresa ON categorias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_unidades_empresa ON unidades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_destinos_empresa ON destinos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_empresa ON produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_entradas_empresa ON entradas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_saidas_empresa ON saidas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ajustes_empresa ON ajustes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_custos_mensais_empresa ON custos_mensais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_faturamentos_empresa ON faturamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_empresa ON configuracoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_empresa ON fornecedores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_grupos_empresa ON grupos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_subgrupos_empresa ON subgrupos(empresa_id);

-- =====================================================
-- RLS POLICIES (Row Level Security)
-- =====================================================

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_empresas ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver empresas às quais pertence
CREATE POLICY "Usuarios podem ver suas empresas" ON empresas
  FOR SELECT USING (
    id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );

-- Usuário pode ver seus vínculos
CREATE POLICY "Usuarios podem ver seus vinculos" ON usuarios_empresas
  FOR SELECT USING (user_id = auth.uid());

-- Usuário pode inserir empresas (ao criar uma nova)
CREATE POLICY "Usuarios podem criar empresas" ON empresas
  FOR INSERT WITH CHECK (true);

-- Usuário pode inserir vínculos próprios
CREATE POLICY "Usuarios podem criar vinculos" ON usuarios_empresas
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Usuário pode atualizar empresas que pertence
CREATE POLICY "Usuarios podem atualizar suas empresas" ON empresas
  FOR UPDATE USING (
    id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );
