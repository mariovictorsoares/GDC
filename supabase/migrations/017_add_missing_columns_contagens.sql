-- =============================================
-- Migration 017: Criar tabelas auxiliares + colunas faltantes em contagens
-- (Tudo numa migration só, na ordem correta)
-- =============================================

-- ========== 1. TABELAS AUXILIARES ==========

-- Tabela de Setores
CREATE TABLE IF NOT EXISTS setores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE setores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'setores' AND policyname = 'setores_empresa') THEN
    CREATE POLICY "setores_empresa" ON setores
      FOR ALL USING (empresa_id IN (
        SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

-- Tabela de Produtos por Setor
CREATE TABLE IF NOT EXISTS setor_produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setor_id UUID NOT NULL REFERENCES setores(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(setor_id, produto_id)
);

ALTER TABLE setor_produtos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'setor_produtos' AND policyname = 'setor_produtos_via_setor') THEN
    CREATE POLICY "setor_produtos_via_setor" ON setor_produtos
      FOR ALL USING (setor_id IN (
        SELECT id FROM setores WHERE empresa_id IN (
          SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
        )
      ));
  END IF;
END $$;

-- Tabela de Responsáveis (PRECISA existir ANTES de adicionar FK em contagens)
CREATE TABLE IF NOT EXISTS responsaveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE responsaveis ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'responsaveis' AND policyname = 'responsaveis_empresa') THEN
    CREATE POLICY "responsaveis_empresa" ON responsaveis
      FOR ALL USING (empresa_id IN (
        SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

-- ========== 2. COLUNAS NOVAS EM CONTAGENS ==========

ALTER TABLE contagens ADD COLUMN IF NOT EXISTS recorrencia TEXT DEFAULT 'nenhuma';
ALTER TABLE contagens ADD COLUMN IF NOT EXISTS horario_notificacao TEXT DEFAULT '07:00';
ALTER TABLE contagens ADD COLUMN IF NOT EXISTS dias_semana TEXT[] DEFAULT '{}';
ALTER TABLE contagens ADD COLUMN IF NOT EXISTS mensal_posicao TEXT;
ALTER TABLE contagens ADD COLUMN IF NOT EXISTS mensal_dia TEXT;
ALTER TABLE contagens ADD COLUMN IF NOT EXISTS responsavel_nome TEXT;
ALTER TABLE contagens ADD COLUMN IF NOT EXISTS responsavel_telefone TEXT;
ALTER TABLE contagens ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES responsaveis(id) ON DELETE SET NULL;
ALTER TABLE contagens ADD COLUMN IF NOT EXISTS progresso INTEGER DEFAULT 0;
ALTER TABLE contagens ADD COLUMN IF NOT EXISTS ultima_contagem TIMESTAMPTZ;

-- ========== 3. CONTAGEM <-> SETORES ==========

CREATE TABLE IF NOT EXISTS contagem_setores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contagem_id UUID NOT NULL REFERENCES contagens(id) ON DELETE CASCADE,
  setor_id UUID NOT NULL REFERENCES setores(id) ON DELETE CASCADE,
  UNIQUE(contagem_id, setor_id)
);

ALTER TABLE contagem_setores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contagem_setores' AND policyname = 'contagem_setores_via_contagem') THEN
    CREATE POLICY "contagem_setores_via_contagem" ON contagem_setores
      FOR ALL USING (contagem_id IN (
        SELECT id FROM contagens WHERE empresa_id IN (
          SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
        )
      ));
  END IF;
END $$;

-- ========== 4. CONSTRAINTS ==========

-- CHECK para recorrencia
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contagens_recorrencia_check'
    AND conrelid = 'contagens'::regclass
  ) THEN
    ALTER TABLE contagens ADD CONSTRAINT contagens_recorrencia_check
      CHECK (recorrencia IN ('nenhuma', 'diaria', 'semanal', 'quinzenal', 'mensal'));
  END IF;
END $$;

-- CHECK para status (atualizar para incluir pendente e atrasada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attname = 'status'
    WHERE c.conrelid = 'contagens'::regclass
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%atrasada%'
  ) THEN
    BEGIN
      EXECUTE (
        SELECT 'ALTER TABLE contagens DROP CONSTRAINT ' || conname
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attname = 'status'
        WHERE c.conrelid = 'contagens'::regclass AND c.contype = 'c'
        LIMIT 1
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    ALTER TABLE contagens ADD CONSTRAINT contagens_status_check
      CHECK (status IN ('aguardando', 'pendente', 'atrasada', 'em_andamento', 'finalizada'));
  END IF;
END $$;

-- ========== 5. ÍNDICES ==========

CREATE INDEX IF NOT EXISTS idx_contagens_empresa ON contagens(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contagens_status ON contagens(status);
CREATE INDEX IF NOT EXISTS idx_contagens_recorrencia ON contagens(recorrencia);
CREATE INDEX IF NOT EXISTS idx_setores_empresa ON setores(empresa_id);
CREATE INDEX IF NOT EXISTS idx_setor_produtos_setor ON setor_produtos(setor_id);
CREATE INDEX IF NOT EXISTS idx_contagem_setores_contagem ON contagem_setores(contagem_id);
CREATE INDEX IF NOT EXISTS idx_responsaveis_empresa ON responsaveis(empresa_id);
