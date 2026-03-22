
-- Create storage bucket for meta images (public for easy access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('meta-images', 'meta-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone authenticated can upload
CREATE POLICY "Authenticated users can upload meta images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'meta-images');

-- RLS: anyone can view
CREATE POLICY "Anyone can view meta images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'meta-images');

-- RLS: owners and admins can delete
CREATE POLICY "Owners and admins can delete meta images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'meta-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

-- Add image columns to meta_checkins
ALTER TABLE public.meta_checkins ADD COLUMN IF NOT EXISTS imagens text[] DEFAULT '{}';

-- Add image columns to acoes_meta
ALTER TABLE public.acoes_meta ADD COLUMN IF NOT EXISTS imagens text[] DEFAULT '{}';
