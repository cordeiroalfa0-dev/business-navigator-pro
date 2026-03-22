-- Feature flags for sidebar modules (enabled by admin)
CREATE TABLE IF NOT EXISTS public.app_modules (
  key text PRIMARY KEY,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_modules ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read module enablement to render the UI
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'app_modules' AND policyname = 'view_app_modules'
  ) THEN
    CREATE POLICY "view_app_modules"
    ON public.app_modules
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

-- Only admins can manage modules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'app_modules' AND policyname = 'admin_insert_app_modules'
  ) THEN
    CREATE POLICY "admin_insert_app_modules"
    ON public.app_modules
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'app_modules' AND policyname = 'admin_update_app_modules'
  ) THEN
    CREATE POLICY "admin_update_app_modules"
    ON public.app_modules
    FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'app_modules' AND policyname = 'admin_delete_app_modules'
  ) THEN
    CREATE POLICY "admin_delete_app_modules"
    ON public.app_modules
    FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS update_app_modules_updated_at ON public.app_modules;
CREATE TRIGGER update_app_modules_updated_at
BEFORE UPDATE ON public.app_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default modules (disabled by default)
INSERT INTO public.app_modules (key, label, enabled)
VALUES
  ('financeiro', 'Financeiro', false),
  ('obras', 'Obras', false)
ON CONFLICT (key) DO NOTHING;
