-- ============================================================
-- PERMISSÕES DE MÓDULOS POR USUÁRIO
-- Permite ao admin definir quais módulos cada usuário acessa
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_module_permissions (
  id         uuid        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key text        NOT NULL,
  enabled    boolean     NOT NULL DEFAULT true,
  updated_by uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_ump_user_id    ON public.user_module_permissions (user_id);
CREATE INDEX IF NOT EXISTS idx_ump_module_key ON public.user_module_permissions (module_key);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_ump_updated_at ON public.user_module_permissions;
CREATE TRIGGER trg_ump_updated_at
  BEFORE UPDATE ON public.user_module_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

-- Usuário lê as próprias permissões
DROP POLICY IF EXISTS "ump_self_select" ON public.user_module_permissions;
CREATE POLICY "ump_self_select" ON public.user_module_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin lê todas
DROP POLICY IF EXISTS "ump_admin_select" ON public.user_module_permissions;
CREATE POLICY "ump_admin_select" ON public.user_module_permissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin escreve em todas
DROP POLICY IF EXISTS "ump_admin_write" ON public.user_module_permissions;
CREATE POLICY "ump_admin_write" ON public.user_module_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
