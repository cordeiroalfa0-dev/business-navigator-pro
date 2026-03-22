
-- Fix overly permissive policies
DROP POLICY "Authenticated users can insert acoes" ON public.acoes_meta;
CREATE POLICY "Authenticated users can insert own acoes"
  ON public.acoes_meta FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY "Authenticated users can update acoes" ON public.acoes_meta;
-- Editors can update any, normal users can only update own
CREATE POLICY "Users can update acoes"
  ON public.acoes_meta FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'master') 
    OR created_by = auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'master') 
    OR created_by = auth.uid()
  );
