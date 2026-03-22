-- Script para configurar o administrador padrão do sistema
-- Este script garante que o usuário especificado tenha o papel de 'admin'

DO $$
DECLARE
    target_email TEXT := 'emerson@sanremo.com';
    target_user_id UUID;
BEGIN
    -- 1. Tentar encontrar o ID do usuário pelo e-mail na tabela auth.users
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

    -- Se o usuário existir, garantimos que ele tenha o perfil e a role de admin
    IF target_user_id IS NOT NULL THEN
        -- Garantir que o perfil existe
        INSERT INTO public.profiles (id, full_name)
        VALUES (target_user_id, 'Emerson San Remo')
        ON CONFLICT (id) DO UPDATE SET full_name = 'Emerson San Remo';

        -- Garantir que a role de admin existe para este usuário
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;
