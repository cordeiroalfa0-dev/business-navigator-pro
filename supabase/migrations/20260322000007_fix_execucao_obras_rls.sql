-- ============================================================
-- Fix: RLS execucao_obras
-- DELETE estava aberto para qualquer autenticado.
-- Apenas admin/master podem remover obras.
-- ============================================================

DROP POLICY IF EXISTS "execucao_obras_delete" ON public.execucao_obras;

CREATE POLICY "execucao_obras_delete"
  ON public.execucao_obras
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'master')
    )
  );

-- UPDATE também deve ser restrito a admin/master
DROP POLICY IF EXISTS "execucao_obras_update" ON public.execucao_obras;

CREATE POLICY "execucao_obras_update"
  ON public.execucao_obras
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'master')
    )
  );

-- INSERT também restrito a admin/master
DROP POLICY IF EXISTS "execucao_obras_insert" ON public.execucao_obras;

CREATE POLICY "execucao_obras_insert"
  ON public.execucao_obras
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'master')
    )
  );
