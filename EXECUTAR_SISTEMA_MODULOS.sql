-- ============================================================
-- SAN REMO ERP — Atualização completa do sistema de módulos
-- Execute integralmente no SQL Editor do Supabase
-- ============================================================
-- O que este script faz:
--  1. Cria função is_modulo_habilitado(key) — genérica para qualquer módulo
--  2. Cria função is_almoxarife() — atalho para o módulo almoxarifado
--  3. Recria TODAS as políticas de escrita do almoxarifado usando a função
--  4. Garante que todos os módulos existem em app_modules com labels corretos
--  5. Instrução de como ativar módulos por usuário
-- ============================================================


-- ============================================================
-- 1. FUNÇÃO GENÉRICA: verifica se usuário tem módulo habilitado
-- Retorna true para admin/master (sempre), ou para 'normal'
-- que tenha user_module_permissions.module_key = key e enabled = true
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_modulo_habilitado(p_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    -- admin e master sempre têm acesso
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'master')
    )
    OR
    -- normal com módulo explicitamente habilitado
    EXISTS (
      SELECT 1
      FROM public.user_module_permissions ump
      JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE ump.user_id    = auth.uid()
        AND ump.module_key = p_key
        AND ump.enabled    = true
        AND ur.role        = 'normal'
    );
$$;


-- ============================================================
-- 2. FUNÇÃO ATALHO: almoxarifado (mantém compatibilidade)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_almoxarife()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.is_modulo_habilitado('almoxarifado');
$$;


-- ============================================================
-- 3. POLÍTICAS RLS — ALMOXARIFADO
-- Recria todas as políticas de escrita usando is_almoxarife()
-- ============================================================

-- ativos_remo
DROP POLICY IF EXISTS "ativos_remo_write" ON public.ativos_remo;
CREATE POLICY "ativos_remo_write" ON public.ativos_remo
  FOR ALL TO authenticated
  USING      (public.is_almoxarife())
  WITH CHECK (public.is_almoxarife());

-- ativos_fotos
DROP POLICY IF EXISTS "ativos_fotos_write" ON public.ativos_fotos;
CREATE POLICY "ativos_fotos_write" ON public.ativos_fotos
  FOR ALL TO authenticated
  USING      (public.is_almoxarife())
  WITH CHECK (public.is_almoxarife());

-- ativos_envios
DROP POLICY IF EXISTS "ativos_envios_write" ON public.ativos_envios;
CREATE POLICY "ativos_envios_write" ON public.ativos_envios
  FOR ALL TO authenticated
  USING      (public.is_almoxarife())
  WITH CHECK (public.is_almoxarife());

-- ativos_destinos
DROP POLICY IF EXISTS "ativos_destinos_write" ON public.ativos_destinos;
CREATE POLICY "ativos_destinos_write" ON public.ativos_destinos
  FOR ALL TO authenticated
  USING      (public.is_almoxarife())
  WITH CHECK (public.is_almoxarife());

-- Storage — upload de fotos
DROP POLICY IF EXISTS "ativos_fotos_upload" ON storage.objects;
CREATE POLICY "ativos_fotos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fotos-materiais'
    AND public.is_almoxarife()
  );

-- Storage — delete de fotos
DROP POLICY IF EXISTS "ativos_fotos_delete" ON storage.objects;
CREATE POLICY "ativos_fotos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'fotos-materiais'
    AND public.is_almoxarife()
  );


-- ============================================================
-- 4. SEED COMPLETO DE app_modules
-- Garante que todos os módulos existem com labels e defaults corretos
-- ON CONFLICT DO UPDATE para atualizar labels sem resetar o enabled
-- ============================================================
INSERT INTO public.app_modules (key, label, enabled) VALUES
  ('metas',           'Metas',              true),
  ('execucao',        'Execução de Obra',   true),
  ('relatorios',      'Relatórios',         true),
  ('ranking',         'Ranking de Equipe',  true),
  ('metas_avancadas', 'Metas Avançadas',    true),
  ('cadastro',        'Cadastro de Dados',  true),
  ('importacao',      'Importar Excel',     true),
  ('almoxarifado',    'Almoxarifado',       true),
  ('financeiro',      'Financeiro',         true),
  ('obras',           'Obras',              true)
ON CONFLICT (key) DO UPDATE SET
  label   = EXCLUDED.label;
  -- NÃO atualiza enabled para preservar configuração existente do admin


-- ============================================================
-- 5. COMO ATIVAR MÓDULOS PARA UM USUÁRIO
-- ============================================================
-- Opção A — Pelo email (mais fácil):
-- Substitua o email abaixo e execute para cada módulo desejado.
--
-- INSERT INTO public.user_module_permissions (user_id, module_key, enabled)
-- SELECT id, 'almoxarifado', true FROM auth.users WHERE email = 'fulano@empresa.com'
-- ON CONFLICT (user_id, module_key) DO UPDATE SET enabled = true;
--
-- Módulos disponíveis: metas | execucao | relatorios | ranking |
--   metas_avancadas | cadastro | importacao | almoxarifado | financeiro | obras
--
-- Opção B — Múltiplos módulos de uma vez para o mesmo usuário:
-- (substitua o email)
--
-- WITH u AS (SELECT id FROM auth.users WHERE email = 'fulano@empresa.com')
-- INSERT INTO public.user_module_permissions (user_id, module_key, enabled)
-- SELECT u.id, m.key, true FROM u, (VALUES
--   ('almoxarifado'), ('relatorios')
-- ) AS m(key)
-- ON CONFLICT (user_id, module_key) DO UPDATE SET enabled = true;
--
-- Opção C — Desativar um módulo específico:
-- UPDATE public.user_module_permissions
-- SET enabled = false
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'fulano@empresa.com')
--   AND module_key = 'almoxarifado';


-- ============================================================
-- 6. VERIFICAÇÕES (rode separadamente para confirmar)
-- ============================================================

-- Ver todos os módulos do sistema:
-- SELECT key, label, enabled FROM public.app_modules ORDER BY key;

-- Ver permissões por usuário:
-- SELECT u.email, p.full_name, r.role, ump.module_key, ump.enabled
-- FROM public.user_module_permissions ump
-- JOIN auth.users u ON u.id = ump.user_id
-- LEFT JOIN public.profiles p ON p.id = ump.user_id
-- LEFT JOIN public.user_roles r ON r.user_id = ump.user_id
-- ORDER BY u.email, ump.module_key;

-- Ver todos os usuários e seus papéis:
-- SELECT u.email, p.full_name, r.role, u.created_at
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON p.id = u.id
-- LEFT JOIN public.user_roles r ON r.user_id = u.id
-- ORDER BY u.created_at DESC;

-- Testar função para usuário autenticado (role como esse usuário no Supabase):
-- SELECT public.is_modulo_habilitado('almoxarifado');
-- SELECT public.is_almoxarife();
