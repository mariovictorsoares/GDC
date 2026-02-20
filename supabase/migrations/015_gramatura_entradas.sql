-- Adiciona coluna gramatura (peso em kg por unidade) na tabela de entradas
-- Usado no beneficiamento para informar o peso de cada produto final
ALTER TABLE entradas ADD COLUMN gramatura NUMERIC(10,4) DEFAULT NULL;
