-- ============================================================
-- EXECUTAR NO SUPABASE — Almoxarifado: liberar acesso por módulo
-- SQL Editor → New Query → Cole este script → Run
-- ============================================================
-- O que este script faz:
--   1. Cria função is_almoxarife() que retorna true para:
--      - admin e master (como antes)
--      - role 'normal' com user_module_permissions.almoxarifado = true
--   2. Recria as 4 políticas de escrita das tabelas do almoxarifado
--      usando essa função
--   3. Recria as políticas de upload/delete do Storage
--   4. Garante que o módulo 'almoxarifado' está habilitado globalmente
--
-- Após rodar este script, acesse o sistema como admin e vá em:
--   Módulos → selecione o usuário almoxarife → habilite "Almoxarifado"
-- O usuário já terá acesso completo sem precisar trocar a role.
-- ============================================================

-- 1. Função auxiliar
CREATE OR REPLACE FUNCTION public.is_almoxarife()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'master')
  )
  OR EXISTS (
    SELECT 1 FROM public.user_module_permissions ump
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE ump.user_id    = auth.uid()
      AND ump.module_key = 'almoxarifado'
      AND ump.enabled    = true
      AND ur.role        = 'normal'
  );
$$;

-- 2. ativos_remo
DROP POLICY IF EXISTS "ativos_remo_write" ON public.ativos_remo;
CREATE POLICY "ativos_remo_write" ON public.ativos_remo
  FOR ALL TO authenticated
  USING      (public.is_almoxarife())
  WITH CHECK (public.is_almoxarife());

-- 3. ativos_fotos
DROP POLICY IF EXISTS "ativos_fotos_write" ON public.ativos_fotos;
CREATE POLICY "ativos_fotos_write" ON public.ativos_fotos
  FOR ALL TO authenticated
  USING      (public.is_almoxarife())
  WITH CHECK (public.is_almoxarife());

-- 4. ativos_envios
DROP POLICY IF EXISTS "ativos_envios_write" ON public.ativos_envios;
CREATE POLICY "ativos_envios_write" ON public.ativos_envios
  FOR ALL TO authenticated
  USING      (public.is_almoxarife())
  WITH CHECK (public.is_almoxarife());

-- 5. ativos_destinos
DROP POLICY IF EXISTS "ativos_destinos_write" ON public.ativos_destinos;
CREATE POLICY "ativos_destinos_write" ON public.ativos_destinos
  FOR ALL TO authenticated
  USING      (public.is_almoxarife())
  WITH CHECK (public.is_almoxarife());

-- 6. Storage — upload de fotos
DROP POLICY IF EXISTS "ativos_fotos_upload" ON storage.objects;
CREATE POLICY "ativos_fotos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fotos-materiais'
    AND public.is_almoxarife()
  );

-- 7. Storage — delete de fotos
DROP POLICY IF EXISTS "ativos_fotos_delete" ON storage.objects;
CREATE POLICY "ativos_fotos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'fotos-materiais'
    AND public.is_almoxarife()
  );

-- 8. Garantir módulo habilitado globalmente
INSERT INTO public.app_modules (key, label, enabled)
VALUES ('almoxarifado', 'Almoxarifado', true)
ON CONFLICT (key) DO UPDATE SET enabled = true;

-- ============================================================
-- VERIFICAÇÃO — rode estas queries para confirmar:
-- ============================================================
-- Ver políticas ativas:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename IN
--   ('ativos_remo','ativos_fotos','ativos_envios','ativos_destinos');
--
-- Habilitar módulo para um usuário específico (substitua o UUID):
-- INSERT INTO public.user_module_permissions (user_id, module_key, enabled)
-- VALUES ('<UUID_DO_ALMOXARIFE>', 'almoxarifado', true)
-- ON CONFLICT (user_id, module_key) DO UPDATE SET enabled = true;
--
-- Testar função (logado como almoxarife):
-- SELECT public.is_almoxarife();  -- deve retornar true
-- ============================================================
