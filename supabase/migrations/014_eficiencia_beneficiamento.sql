-- Adiciona coluna de eficiência do beneficiamento (percentual)
-- Ex: 90 = de 1kg beneficiado, aproveita 900g
ALTER TABLE produtos ADD COLUMN eficiencia_beneficiamento NUMERIC(5,2) DEFAULT NULL;
