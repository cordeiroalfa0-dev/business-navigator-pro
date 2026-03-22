-- ============================================================
-- Fix: RLS do meta_acoes_kanban
-- Adiciona DROP IF EXISTS em todas as policies antes de recriar
-- ============================================================

-- Remove TODAS as policies existentes (abertas e novas)
DROP POLICY IF EXISTS "Anyone can insert kanban actions"                    ON meta_acoes_kanban;
DROP POLICY IF EXISTS "Users can update kanban actions"                     ON meta_acoes_kanban;
DROP POLICY IF EXISTS "Anyone can read kanban actions"                      ON meta_acoes_kanban;
DROP POLICY IF EXISTS "Authenticated users can insert kanban actions"       ON meta_acoes_kanban;
DROP POLICY IF EXISTS "Owner or admin can update kanban actions"            ON meta_acoes_kanban;
DROP POLICY IF EXISTS "Admin can delete kanban actions"                     ON meta_acoes_kanban;

-- SELECT: qualquer autenticado pode ler
CREATE POLICY "Anyone can read kanban actions"
  ON meta_acoes_kanban
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: autenticado pode criar (responsavel_id = próprio ou null, ou admin/master)
CREATE POLICY "Authenticated users can insert kanban actions"
  ON meta_acoes_kanban
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      responsavel_id = auth.uid()
      OR responsavel_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'master')
      )
    )
  );

-- UPDATE: responsável ou admin/master
CREATE POLICY "Owner or admin can update kanban actions"
  ON meta_acoes_kanban
  FOR UPDATE
  USING (
    responsavel_id = auth.uid()
    OR responsavel_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'master')
    )
  );

-- DELETE: apenas admin/master
CREATE POLICY "Admin can delete kanban actions"
  ON meta_acoes_kanban
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'master')
    )
  );
