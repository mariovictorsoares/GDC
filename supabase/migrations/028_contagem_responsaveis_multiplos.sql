-- Migration 028: Suporte a múltiplos responsáveis por contagem
-- Adiciona coluna JSONB para armazenar array de responsáveis.
-- Campos legados (responsavel_nome/telefone/id) mantidos para retrocompatibilidade.

ALTER TABLE contagens
  ADD COLUMN IF NOT EXISTS responsaveis_data JSONB DEFAULT '[]'::jsonb;

-- Migrar dados existentes: se tem responsável definido, popular o array
UPDATE contagens
SET responsaveis_data = jsonb_build_array(
  jsonb_build_object(
    'id', responsavel_id::text,
    'nome', responsavel_nome,
    'telefone', responsavel_telefone
  )
)
WHERE responsavel_nome IS NOT NULL
  AND responsaveis_data = '[]'::jsonb;
