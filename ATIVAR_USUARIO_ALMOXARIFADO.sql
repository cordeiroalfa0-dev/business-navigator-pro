-- ============================================================
-- PASSO 1: Descubra o UUID do usuário almoxarife
-- Cole esta query primeiro e copie o id que aparecer
-- ============================================================
SELECT 
  u.id,
  u.email,
  p.full_name,
  r.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id
ORDER BY u.created_at DESC;

-- ============================================================
-- PASSO 2: Após encontrar o UUID correto na lista acima,
-- substitua o valor abaixo pelo id do almoxarife e rode.
-- Exemplo: o id aparece como algo assim no resultado:
--   a1b2c3d4-e5f6-7890-abcd-ef1234567890
-- ============================================================

-- Cole o UUID real aqui (sem os símbolos < >) e rode:
INSERT INTO public.user_module_permissions (user_id, module_key, enabled)
SELECT id, 'almoxarifado', true
FROM auth.users
WHERE email = 'email_do_almoxarife@exemplo.com'  -- troque pelo email real
ON CONFLICT (user_id, module_key) DO UPDATE SET enabled = true;

-- ============================================================
-- ALTERNATIVA: habilitar pelo email (mais simples)
-- Troque apenas o email abaixo e rode:
-- ============================================================
/*
INSERT INTO public.user_module_permissions (user_id, module_key, enabled)
SELECT id, 'almoxarifado', true
FROM auth.users
WHERE email = 'email_do_almoxarife@exemplo.com'
ON CONFLICT (user_id, module_key) DO UPDATE SET enabled = true;
*/

-- ============================================================
-- VERIFICAÇÃO: confirmar que foi inserido
-- ============================================================
SELECT 
  u.email,
  p.full_name,
  ump.module_key,
  ump.enabled
FROM public.user_module_permissions ump
JOIN auth.users u ON u.id = ump.user_id
LEFT JOIN public.profiles p ON p.id = ump.user_id
WHERE ump.module_key = 'almoxarifado';
