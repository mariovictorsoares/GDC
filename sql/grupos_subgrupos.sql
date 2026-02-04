-- =============================================
-- MIGRAÇÃO: Criar tabelas de Grupos e Subgrupos
-- =============================================

-- 1. Criar tabela de grupos
CREATE TABLE IF NOT EXISTS grupos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de subgrupos
CREATE TABLE IF NOT EXISTS subgrupos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(grupo_id, nome)
);

-- 3. Adicionar coluna subgrupo_id na tabela produtos (se não existir)
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS subgrupo_id UUID REFERENCES subgrupos(id);

-- 4. Habilitar RLS
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subgrupos ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de acesso
CREATE POLICY "Permitir leitura de grupos para usuários autenticados" ON grupos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção de grupos para usuários autenticados" ON grupos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização de grupos para usuários autenticados" ON grupos
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Permitir exclusão de grupos para usuários autenticados" ON grupos
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Permitir leitura de subgrupos para usuários autenticados" ON subgrupos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir inserção de subgrupos para usuários autenticados" ON subgrupos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir atualização de subgrupos para usuários autenticados" ON subgrupos
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Permitir exclusão de subgrupos para usuários autenticados" ON subgrupos
  FOR DELETE TO authenticated USING (true);

-- 6. Inserir dados iniciais dos grupos
INSERT INTO grupos (nome) VALUES
  ('Alimentos'),
  ('Bebidas'),
  ('Embalagens'),
  ('Consumo'),
  ('Limpeza')
ON CONFLICT (nome) DO NOTHING;

-- 7. Inserir subgrupos (precisa fazer em etapas para pegar o ID do grupo)

-- Subgrupos de ALIMENTOS
INSERT INTO subgrupos (grupo_id, nome)
SELECT g.id, s.nome
FROM grupos g
CROSS JOIN (VALUES
  ('Mercearia'),
  ('Alimentação funcionários'),
  ('Hortifruti'),
  ('Proteínas bovinas, suínas e aves'),
  ('Proteínas peixes e frutos do mar'),
  ('Congelados'),
  ('Porcionados proteínas'),
  ('Sorvetes e sobremesas'),
  ('Manipulado pronto'),
  ('Fracionados internos'),
  ('Frutas e polpas congeladas'),
  ('Laticínios e embutidos')
) AS s(nome)
WHERE g.nome = 'Alimentos'
ON CONFLICT (grupo_id, nome) DO NOTHING;

-- Subgrupos de BEBIDAS
INSERT INTO subgrupos (grupo_id, nome)
SELECT g.id, s.nome
FROM grupos g
CROSS JOIN (VALUES
  ('Águas, refrigerantes e similares'),
  ('Cervejas'),
  ('Chopp'),
  ('Destilados e similares'),
  ('Xaropes prontos'),
  ('Vinhos venda')
) AS s(nome)
WHERE g.nome = 'Bebidas'
ON CONFLICT (grupo_id, nome) DO NOTHING;

-- Subgrupos de EMBALAGENS
INSERT INTO subgrupos (grupo_id, nome)
SELECT g.id, s.nome
FROM grupos g
CROSS JOIN (VALUES
  ('Embalagens delivery'),
  ('Copos descartáveis, canudos e similares')
) AS s(nome)
WHERE g.nome = 'Embalagens'
ON CONFLICT (grupo_id, nome) DO NOTHING;

-- Subgrupos de CONSUMO
INSERT INTO subgrupos (grupo_id, nome)
SELECT g.id, s.nome
FROM grupos g
CROSS JOIN (VALUES
  ('Descartáveis de salão'),
  ('Material de expediente e escritório'),
  ('Gelo e carvão'),
  ('Descartáveis de cozinha')
) AS s(nome)
WHERE g.nome = 'Consumo'
ON CONFLICT (grupo_id, nome) DO NOTHING;

-- Subgrupos de LIMPEZA
INSERT INTO subgrupos (grupo_id, nome)
SELECT g.id, s.nome
FROM grupos g
CROSS JOIN (VALUES
  ('Desinfetantes e detergentes'),
  ('Descartáveis de limpeza'),
  ('Utensílios de limpeza')
) AS s(nome)
WHERE g.nome = 'Limpeza'
ON CONFLICT (grupo_id, nome) DO NOTHING;

-- 8. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_subgrupos_grupo_id ON subgrupos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_produtos_subgrupo_id ON produtos(subgrupo_id);
