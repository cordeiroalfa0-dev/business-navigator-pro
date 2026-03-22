
-- 1. Fix permissive UPDATE policy on metas (remove OR true)
DROP POLICY IF EXISTS "Users can update metas" ON public.metas;
CREATE POLICY "Users can update metas" ON public.metas
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'master'::app_role) 
    OR created_by = auth.uid()
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'master'::app_role) 
    OR created_by = auth.uid()
  );

-- 2. Fix permissive UPDATE policy on acoes_meta
DROP POLICY IF EXISTS "Users can update acoes" ON public.acoes_meta;
CREATE POLICY "Users can update acoes" ON public.acoes_meta
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'master'::app_role) 
    OR created_by = auth.uid()
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'master'::app_role) 
    OR created_by = auth.uid()
  );

-- 3. Create dados_cadastro table for CadastroDados persistence
CREATE TABLE IF NOT EXISTS public.dados_cadastro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria text NOT NULL,
  descricao text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  data date NOT NULL DEFAULT now()::date,
  responsavel text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dados_cadastro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view dados" ON public.dados_cadastro
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and master can insert dados" ON public.dados_cadastro
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'master'::app_role)
  );

CREATE POLICY "Admin and master can delete dados" ON public.dados_cadastro
  FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'master'::app_role)
    OR created_by = auth.uid()
  );

CREATE POLICY "Admin and master can update dados" ON public.dados_cadastro
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'master'::app_role)
    OR created_by = auth.uid()
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'master'::app_role)
    OR created_by = auth.uid()
  );
