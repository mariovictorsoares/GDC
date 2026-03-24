-- =====================================================
-- MIGRATION 031: Adicionar campo acuracidade nas contagens
-- =====================================================
-- Adiciona coluna acuracidade_geral na tabela contagem_resultados
-- e acuracidade na tabela contagem_resultado_itens

-- 1. Coluna na tabela de resultados (resumo)
ALTER TABLE contagem_resultados
ADD COLUMN IF NOT EXISTS acuracidade_geral NUMERIC DEFAULT 100;

-- 2. Coluna na tabela de itens do resultado (por produto)
ALTER TABLE contagem_resultado_itens
ADD COLUMN IF NOT EXISTS acuracidade NUMERIC DEFAULT 100;
