-- ============================================================
-- CAMPOS CUSTOMIZADOS DAS METAS
-- Execute este script no SQL Editor do Supabase
-- Cria a tabela para armazenar categorias, ciclos, unidades,
-- etapas E campos de formulário personalizados pelo usuário
-- ============================================================

CREATE TABLE IF NOT EXISTS public.meta_campos_customizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,           -- 'categoria' | 'ciclo' | 'unidade' | 'etapa' | 'campo'
  valor TEXT NOT NULL,          -- chave interna (ex: "campo_marketing_budget")
  label TEXT,                   -- Nome exibido ao usuário (ex: "Budget Marketing")
  secao TEXT DEFAULT 'Personalizados',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tipo, valor)
);

CREATE INDEX IF NOT EXISTS idx_meta_campos_tipo ON public.meta_campos_customizados(tipo);

-- Coluna JSONB na tabela metas para armazenar valores dos campos extras
ALTER TABLE public.metas
  ADD COLUMN IF NOT EXISTS campos_extras JSONB DEFAULT '{}'::jsonb;

-- RLS
ALTER TABLE public.meta_campos_customizados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read campos" ON public.meta_campos_customizados;
CREATE POLICY "Authenticated users can read campos" ON public.meta_campos_customizados
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert campos" ON public.meta_campos_customizados;
CREATE POLICY "Authenticated users can insert campos" ON public.meta_campos_customizados
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Owner or admin can delete campos" ON public.meta_campos_customizados;
CREATE POLICY "Owner or admin can delete campos" ON public.meta_campos_customizados
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

SELECT 'meta_campos_customizados + campos_extras configurados com sucesso!' AS resultado;
