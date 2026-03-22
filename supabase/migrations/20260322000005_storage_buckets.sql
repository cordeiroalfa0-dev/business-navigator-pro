-- ============================================================
-- Criação dos buckets de Storage necessários para o sistema
-- Execute no Supabase SQL Editor OU via Dashboard
-- ============================================================

-- Bucket: fotos-materiais (Almoxarifado, AdicionarMaterial)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos-materiais', 'fotos-materiais', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket: meta-images (MetaFileUpload)
INSERT INTO storage.buckets (id, name, public)
VALUES ('meta-images', 'meta-images', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket: meta-evidencias (MetaCheckInModal)
INSERT INTO storage.buckets (id, name, public)
VALUES ('meta-evidencias', 'meta-evidencias', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket: backups (BackupRestore)
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- ── Policies de acesso ────────────────────────────────────────

-- fotos-materiais: leitura pública, upload apenas autenticados
CREATE POLICY "Public read fotos-materiais"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fotos-materiais');

CREATE POLICY "Auth upload fotos-materiais"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'fotos-materiais' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete fotos-materiais"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'fotos-materiais' AND auth.role() = 'authenticated');

-- meta-images: leitura pública, upload apenas autenticados
CREATE POLICY "Public read meta-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'meta-images');

CREATE POLICY "Auth upload meta-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'meta-images' AND auth.role() = 'authenticated');

-- meta-evidencias: leitura pública, upload apenas autenticados
CREATE POLICY "Public read meta-evidencias"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'meta-evidencias');

CREATE POLICY "Auth upload meta-evidencias"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'meta-evidencias' AND auth.role() = 'authenticated');

-- backups: apenas admins leem e fazem upload
CREATE POLICY "Admin only backups"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'backups'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
