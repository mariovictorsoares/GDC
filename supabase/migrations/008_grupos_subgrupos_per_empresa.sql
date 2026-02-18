-- =====================================================
-- 008: Grupos e subgrupos padrão por empresa
-- =====================================================

-- 1. Remover UNIQUE global em nome dos grupos
ALTER TABLE grupos DROP CONSTRAINT IF EXISTS grupos_nome_key;

-- 2. Criar UNIQUE composto (nome + empresa_id)
ALTER TABLE grupos ADD CONSTRAINT grupos_nome_empresa_unique
  UNIQUE (nome, empresa_id);

-- 3. Atualizar UNIQUE dos subgrupos para incluir empresa_id
ALTER TABLE subgrupos DROP CONSTRAINT IF EXISTS subgrupos_grupo_id_nome_key;
ALTER TABLE subgrupos ADD CONSTRAINT subgrupos_grupo_nome_empresa_unique
  UNIQUE (grupo_id, nome, empresa_id);

-- 4. Atualizar RLS dos grupos (filtrar por empresa do usuário)
DROP POLICY IF EXISTS "Permitir leitura de grupos para usuários autenticados" ON grupos;
DROP POLICY IF EXISTS "Permitir inserção de grupos para usuários autenticados" ON grupos;
DROP POLICY IF EXISTS "Permitir atualização de grupos para usuários autenticados" ON grupos;
DROP POLICY IF EXISTS "Permitir exclusão de grupos para usuários autenticados" ON grupos;

CREATE POLICY "grupos_select" ON grupos
  FOR SELECT TO authenticated USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );

CREATE POLICY "grupos_insert" ON grupos
  FOR INSERT TO authenticated WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );

CREATE POLICY "grupos_update" ON grupos
  FOR UPDATE TO authenticated USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );

CREATE POLICY "grupos_delete" ON grupos
  FOR DELETE TO authenticated USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );

-- 5. Atualizar RLS dos subgrupos
DROP POLICY IF EXISTS "Permitir leitura de subgrupos para usuários autenticados" ON subgrupos;
DROP POLICY IF EXISTS "Permitir inserção de subgrupos para usuários autenticados" ON subgrupos;
DROP POLICY IF EXISTS "Permitir atualização de subgrupos para usuários autenticados" ON subgrupos;
DROP POLICY IF EXISTS "Permitir exclusão de subgrupos para usuários autenticados" ON subgrupos;

CREATE POLICY "subgrupos_select" ON subgrupos
  FOR SELECT TO authenticated USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );

CREATE POLICY "subgrupos_insert" ON subgrupos
  FOR INSERT TO authenticated WITH CHECK (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );

CREATE POLICY "subgrupos_update" ON subgrupos
  FOR UPDATE TO authenticated USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );

CREATE POLICY "subgrupos_delete" ON subgrupos
  FOR DELETE TO authenticated USING (
    empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid())
  );

-- 6. Criar grupos/subgrupos padrão para empresas existentes que ainda não têm
DO $$
DECLARE
  emp RECORD;
  grupo_id UUID;
BEGIN
  FOR emp IN SELECT id FROM empresas LOOP
    -- Pular empresas que já têm grupos
    IF EXISTS (SELECT 1 FROM grupos WHERE empresa_id = emp.id) THEN
      CONTINUE;
    END IF;

    -- Alimentos
    INSERT INTO grupos (nome, empresa_id) VALUES ('Alimentos', emp.id) RETURNING id INTO grupo_id;
    INSERT INTO subgrupos (grupo_id, nome, empresa_id) VALUES
      (grupo_id, 'Mercearia', emp.id),
      (grupo_id, 'Alimentação funcionários', emp.id),
      (grupo_id, 'Hortifruti', emp.id),
      (grupo_id, 'Proteínas bovinas, suínas e aves', emp.id),
      (grupo_id, 'Proteínas peixes e frutos do mar', emp.id),
      (grupo_id, 'Congelados', emp.id),
      (grupo_id, 'Porcionados proteínas', emp.id),
      (grupo_id, 'Sorvetes e sobremesas', emp.id),
      (grupo_id, 'Manipulado pronto', emp.id),
      (grupo_id, 'Fracionados internos', emp.id),
      (grupo_id, 'Frutas e polpas congeladas', emp.id),
      (grupo_id, 'Laticínios e embutidos', emp.id);

    -- Bebidas
    INSERT INTO grupos (nome, empresa_id) VALUES ('Bebidas', emp.id) RETURNING id INTO grupo_id;
    INSERT INTO subgrupos (grupo_id, nome, empresa_id) VALUES
      (grupo_id, 'Águas, refrigerantes e similares', emp.id),
      (grupo_id, 'Cervejas', emp.id),
      (grupo_id, 'Chopp', emp.id),
      (grupo_id, 'Destilados e similares', emp.id),
      (grupo_id, 'Xaropes prontos', emp.id),
      (grupo_id, 'Vinhos venda', emp.id);

    -- Embalagens
    INSERT INTO grupos (nome, empresa_id) VALUES ('Embalagens', emp.id) RETURNING id INTO grupo_id;
    INSERT INTO subgrupos (grupo_id, nome, empresa_id) VALUES
      (grupo_id, 'Embalagens delivery', emp.id),
      (grupo_id, 'Copos descartáveis, canudos e similares', emp.id);

    -- Consumo
    INSERT INTO grupos (nome, empresa_id) VALUES ('Consumo', emp.id) RETURNING id INTO grupo_id;
    INSERT INTO subgrupos (grupo_id, nome, empresa_id) VALUES
      (grupo_id, 'Descartáveis de salão', emp.id),
      (grupo_id, 'Material de expediente e escritório', emp.id),
      (grupo_id, 'Gelo e carvão', emp.id),
      (grupo_id, 'Descartáveis de cozinha', emp.id);

    -- Limpeza
    INSERT INTO grupos (nome, empresa_id) VALUES ('Limpeza', emp.id) RETURNING id INTO grupo_id;
    INSERT INTO subgrupos (grupo_id, nome, empresa_id) VALUES
      (grupo_id, 'Desinfetantes e detergentes', emp.id),
      (grupo_id, 'Descartáveis de limpeza', emp.id),
      (grupo_id, 'Utensílios de limpeza', emp.id);
  END LOOP;
END $$;

-- 7. Remapear produtos que apontam para subgrupos globais (NULL empresa_id)
--    Caso A: produto TEM empresa_id → remapear para o subgrupo equivalente da empresa
UPDATE produtos p
SET subgrupo_id = ns.id
FROM subgrupos os, subgrupos ns, grupos og, grupos ng
WHERE p.subgrupo_id = os.id
  AND os.empresa_id IS NULL
  AND p.empresa_id IS NOT NULL
  AND os.grupo_id = og.id
  AND ng.empresa_id = p.empresa_id
  AND ng.nome = og.nome
  AND ns.grupo_id = ng.id
  AND ns.empresa_id = p.empresa_id
  AND ns.nome = os.nome;

--    Caso B: produto NÃO tem empresa_id e aponta para subgrupo global → desvincular
UPDATE produtos SET subgrupo_id = NULL
WHERE subgrupo_id IN (SELECT id FROM subgrupos WHERE empresa_id IS NULL)
  AND empresa_id IS NULL;

-- 8. Remover subgrupos globais órfãos
DELETE FROM subgrupos WHERE empresa_id IS NULL;

-- 9. Remover grupos globais órfãos
DELETE FROM grupos WHERE empresa_id IS NULL;
