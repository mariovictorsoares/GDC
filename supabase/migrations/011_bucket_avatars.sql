-- Criar bucket avatars (público) para fotos de perfil dos usuários
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política: qualquer usuário autenticado pode fazer upload
CREATE POLICY "avatars_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Política: qualquer pessoa pode visualizar (público)
CREATE POLICY "avatars_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Política: usuário autenticado pode atualizar seus próprios avatars
CREATE POLICY "avatars_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Política: usuário autenticado pode deletar seus próprios avatars
CREATE POLICY "avatars_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
