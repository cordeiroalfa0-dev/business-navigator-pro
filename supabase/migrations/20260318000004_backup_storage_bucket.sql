-- ============================================================
-- Bucket de backups automáticos — acesso restrito a admin
-- ============================================================

-- Bucket privado (public = false)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'backups',
  'backups',
  false,
  104857600, -- 100MB por arquivo
  ARRAY['application/zip', 'application/json', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- Apenas admin pode fazer upload
CREATE POLICY "Admin upload backups"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'backups'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Apenas admin pode listar e baixar
CREATE POLICY "Admin read backups"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'backups'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Apenas admin pode excluir
CREATE POLICY "Admin delete backups"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'backups'
    AND public.has_role(auth.uid(), 'admin')
  );
