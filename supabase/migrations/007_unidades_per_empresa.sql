-- =====================================================
-- 007: Unidades padrão por empresa
-- =====================================================

-- 1. Remover UNIQUE global em sigla
ALTER TABLE unidades DROP CONSTRAINT IF EXISTS unidades_sigla_key;

-- 2. Criar UNIQUE composto (sigla + empresa_id)
ALTER TABLE unidades ADD CONSTRAINT unidades_sigla_empresa_unique
  UNIQUE (sigla, empresa_id);

-- 3. Criar unidades padrão para empresas existentes que ainda não têm
INSERT INTO unidades (sigla, descricao, empresa_id)
SELECT u.sigla, u.descricao, e.id
FROM (VALUES
  ('KG','Quilograma'),('UN','Unidade'),('PC','Pacote'),
  ('CX','Caixa'),('L','Litro'),('ML','Mililitro'),
  ('G','Grama'),('DZ','Dúzia'),('FD','Fardo'),
  ('PT','Pote'),('GF','Garrafa'),('LT','Lata')
) AS u(sigla, descricao)
CROSS JOIN empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM unidades un WHERE un.empresa_id = e.id AND un.sigla = u.sigla
);

-- 4. Remapear produtos que apontam para unidades globais (NULL empresa_id)
UPDATE produtos p
SET unidade_id = nu.id
FROM unidades ou, unidades nu
WHERE p.unidade_id = ou.id
  AND ou.empresa_id IS NULL
  AND nu.empresa_id = p.empresa_id
  AND nu.sigla = ou.sigla;

-- 5. Remover unidades globais órfãs
DELETE FROM unidades WHERE empresa_id IS NULL;
