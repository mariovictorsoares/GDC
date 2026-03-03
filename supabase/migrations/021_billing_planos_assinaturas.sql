-- =============================================
-- Migration 021: Sistema de Billing (Planos + Assinaturas)
-- =============================================

-- 1. Tabela de planos
CREATE TABLE planos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  descricao TEXT,
  preco_mensal DECIMAL(10,2) NOT NULL,
  stripe_product_id VARCHAR(100),
  stripe_price_id VARCHAR(100),
  recursos JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de assinaturas (1 por empresa)
CREATE TABLE assinaturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  plano_id UUID REFERENCES planos(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'trial',
  trial_inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_fim TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  grace_fim TIMESTAMPTZ,
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),
  taxa_implementacao_paga BOOLEAN DEFAULT false,
  data_ativacao TIMESTAMPTZ,
  data_cancelamento TIMESTAMPTZ,
  trial_estendido_por VARCHAR(100),
  observacao_admin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_assinaturas_empresa UNIQUE(empresa_id)
);

CREATE INDEX idx_assinaturas_empresa ON assinaturas(empresa_id);
CREATE INDEX idx_assinaturas_status ON assinaturas(status);
CREATE INDEX idx_assinaturas_stripe_customer ON assinaturas(stripe_customer_id);
CREATE INDEX idx_assinaturas_stripe_subscription ON assinaturas(stripe_subscription_id);

-- 3. Tabela de super-admins
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_admin_users_user UNIQUE(user_id)
);

-- 4. Trigger: updated_at automático em assinaturas
CREATE OR REPLACE FUNCTION update_assinaturas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_assinaturas_updated_at
  BEFORE UPDATE ON assinaturas
  FOR EACH ROW
  EXECUTE FUNCTION update_assinaturas_updated_at();

-- 5. Trigger: auto-criar assinatura trial ao criar empresa
CREATE OR REPLACE FUNCTION criar_assinatura_trial()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO assinaturas (empresa_id, status, trial_inicio, trial_fim)
  VALUES (NEW.id, 'trial', NOW(), NOW() + INTERVAL '14 days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_empresa_criar_trial
  AFTER INSERT ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION criar_assinatura_trial();

-- 6. Seed: planos padrão
INSERT INTO planos (nome, slug, descricao, preco_mensal, recursos, ordem) VALUES
  (
    'Silver',
    'silver',
    'Acesso completo ao aplicativo',
    197.00,
    '["Controle completo de estoque", "Relatórios e dashboards", "Multi-empresa", "Contagem de inventário", "Gestão de compras"]'::jsonb,
    1
  ),
  (
    'Gold',
    'gold',
    'App + acompanhamento mensal de fechamento dos indicadores',
    497.00,
    '["Tudo do Silver", "Acompanhamento mensal de fechamento", "Suporte prioritário"]'::jsonb,
    2
  ),
  (
    'Diamond',
    'diamond',
    'App + curso e formação do estoquista',
    997.00,
    '["Tudo do Gold", "Curso de formação de estoquista", "Consultoria dedicada"]'::jsonb,
    3
  );

-- 7. Backfill: criar trial para empresas existentes que não têm assinatura
INSERT INTO assinaturas (empresa_id, status, trial_inicio, trial_fim)
SELECT id, 'trial', NOW(), NOW() + INTERVAL '14 days'
FROM empresas
WHERE id NOT IN (SELECT empresa_id FROM assinaturas);
