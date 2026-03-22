-- 🚀 SCRIPT DE CORREÇÃO MESTRE: BUSINESS NAVIGATOR PRO
-- Este script garante que todas as tabelas, permissões e roles estejam configuradas corretamente.
-- COLE E EXECUTE NO SQL EDITOR DO SUPABASE (https://supabase.com/dashboard/project/_/sql)

-- 1. Garantir que as roles (tipos de usuário) existam
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'master', 'normal');
    ELSE
        -- Tentar adicionar as novas roles se elas não existirem no enum
        BEGIN
            ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'master';
            ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'normal';
        EXCEPTION
            WHEN duplicate_object THEN null;
        END;
    END IF;
END $$;

-- 2. Garantir que as tabelas base existam com a estrutura correta
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 2 AND 120),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Ativar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Criar a função has_role de forma segura (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 5. Configurar Políticas de Acesso (RLS)
DROP POLICY IF EXISTS "view_profiles" ON public.profiles;
CREATE POLICY "view_profiles" ON public.profiles FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master') OR auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;
CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Configurar o Administrador Padrão (IMPORTANTE: Mude o e-mail se necessário)
-- Substitua 'emerson@sanremo.com' pelo seu e-mail de login se for diferente
DO $$
DECLARE
    target_email TEXT := 'emerson@sanremo.com';
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    IF target_user_id IS NOT NULL THEN
        -- Garantir Perfil
        INSERT INTO public.profiles (id, full_name)
        VALUES (target_user_id, 'Administrador Master')
        ON CONFLICT (id) DO UPDATE SET full_name = 'Administrador Master';

        -- Garantir Role de Admin
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;

-- 7. Garantir que os módulos básicos estejam ativos
CREATE TABLE IF NOT EXISTS public.app_modules (
  key text PRIMARY KEY,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_modules (key, label, enabled)
VALUES
  ('financeiro', 'Financeiro', true),
  ('obras', 'Obras', true)
ON CONFLICT (key) DO UPDATE SET enabled = true;

GRANT SELECT ON public.app_modules TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- ✅ SUCESSO: Banco de dados configurado!
