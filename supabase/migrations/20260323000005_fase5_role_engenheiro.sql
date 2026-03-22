-- ============================================================
-- FASE 5 — Role Engenheiro para Diário de Obra
-- ============================================================

-- Adicionar 'engenheiro' ao enum app_role (se ainda não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'engenheiro'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'engenheiro';
  END IF;
END $$;

-- RLS diario_obra: engenheiro também pode criar e editar os seus
DROP POLICY IF EXISTS "diario_insert" ON public.diario_obra;
DROP POLICY IF EXISTS "diario_update" ON public.diario_obra;

CREATE POLICY "diario_insert" ON public.diario_obra
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'master', 'engenheiro')
    )
  );

CREATE POLICY "diario_update" ON public.diario_obra
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'master', 'engenheiro')
    )
    OR created_by = auth.uid()
  );

COMMENT ON COLUMN public.diario_obra.created_by IS
  'Usuário que criou o RDO — pode ser admin, master ou engenheiro';
