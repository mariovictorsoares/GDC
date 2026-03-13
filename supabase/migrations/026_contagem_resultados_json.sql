-- Adiciona coluna resultados (JSONB) à tabela contagens
-- Armazena snapshot completo de cada contagem finalizada
-- para exibição no histórico detalhado.
ALTER TABLE contagens ADD COLUMN IF NOT EXISTS resultados JSONB DEFAULT '[]'::jsonb;
