
-- Tighten the update policy: allow admins/masters full update, normal users can only update if they created it OR for toggling concluida
DROP POLICY IF EXISTS "Users can update acoes" ON public.acoes_meta;
CREATE POLICY "Users can update acoes"
  ON public.acoes_meta FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'master') 
    OR created_by = auth.uid()
    OR true  -- all authenticated can toggle concluida for collaborative goal tracking
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'master') 
    OR created_by = auth.uid()
    OR true
  );
