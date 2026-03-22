
-- Allow all authenticated users to update the 'concluida' field on acoes_meta
-- This lets normal users mark actions as done
DROP POLICY IF EXISTS "Users can update acoes" ON public.acoes_meta;
CREATE POLICY "Users can update acoes"
  ON public.acoes_meta FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
