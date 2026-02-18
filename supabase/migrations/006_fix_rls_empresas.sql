-- =====================================================
-- FIX: Desabilitar RLS nas tabelas empresas e usuarios_empresas
-- A segurança será tratada a nível de aplicação via empresa_id
-- =====================================================

-- Remover todas as policies existentes
DROP POLICY IF EXISTS "Usuarios podem ver suas empresas" ON empresas;
DROP POLICY IF EXISTS "Usuarios podem criar empresas" ON empresas;
DROP POLICY IF EXISTS "Usuarios podem atualizar suas empresas" ON empresas;
DROP POLICY IF EXISTS "Usuarios podem ver seus vinculos" ON usuarios_empresas;
DROP POLICY IF EXISTS "Usuarios podem criar vinculos" ON usuarios_empresas;
DROP POLICY IF EXISTS "empresas_select" ON empresas;
DROP POLICY IF EXISTS "empresas_insert" ON empresas;
DROP POLICY IF EXISTS "empresas_update" ON empresas;
DROP POLICY IF EXISTS "empresas_delete" ON empresas;
DROP POLICY IF EXISTS "vinculos_select" ON usuarios_empresas;
DROP POLICY IF EXISTS "vinculos_insert" ON usuarios_empresas;
DROP POLICY IF EXISTS "vinculos_delete" ON usuarios_empresas;

-- Desabilitar RLS
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_empresas DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STORAGE: Bucket para logos de empresas
-- =====================================================

-- Criar bucket logos (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Remover policies existentes de storage para logos (caso existam)
DROP POLICY IF EXISTS "logos_upload" ON storage.objects;
DROP POLICY IF EXISTS "logos_select" ON storage.objects;
DROP POLICY IF EXISTS "logos_update" ON storage.objects;
DROP POLICY IF EXISTS "logos_delete" ON storage.objects;

-- Policy: qualquer usuário autenticado pode fazer upload
CREATE POLICY "logos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos' AND auth.uid() IS NOT NULL
  );

-- Policy: qualquer um pode ver logos (público)
CREATE POLICY "logos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

-- Policy: usuário autenticado pode atualizar/deletar
CREATE POLICY "logos_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "logos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos' AND auth.uid() IS NOT NULL
  );
