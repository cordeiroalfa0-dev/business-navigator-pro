-- EXECUTE ESTE SCRIPT NO SQL EDITOR DO SUPABASE

-- 1. Criar a tabela de envios (caso não exista)
CREATE TABLE IF NOT EXISTS public.envios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES public.materiais(id) ON DELETE CASCADE,
    origem TEXT NOT NULL,
    destino TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Habilitar RLS (Segurança)
ALTER TABLE public.envios ENABLE ROW LEVEL SECURITY;

-- 3. Criar política de acesso público (para teste/desenvolvimento)
DROP POLICY IF EXISTS "Permitir tudo para envios" ON public.envios;
CREATE POLICY "Permitir tudo para envios" ON public.envios FOR ALL USING (true) WITH CHECK (true);

-- 4. Garantir que a tabela materiais também tenha RLS configurado corretamente
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para materiais" ON public.materiais;
CREATE POLICY "Permitir tudo para materiais" ON public.materiais FOR ALL USING (true) WITH CHECK (true);
