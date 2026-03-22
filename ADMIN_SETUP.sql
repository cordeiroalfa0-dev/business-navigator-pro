-- SCRIPT DE CONFIGURAÇÃO ADMINISTRATIVA - SISTEMA REMO
-- Este script configura as permissões básicas para o ambiente Supabase

-- 1. Habilitar RLS (Row Level Security) nas tabelas se ainda não estiverem
ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.envios ENABLE ROW LEVEL SECURITY;

-- 2. Criar Políticas de Acesso (Policies)
-- Nota: Como o sistema usa autenticação via Supabase Auth, 
-- estas políticas garantem que apenas usuários autenticados possam interagir com os dados.

-- Política para Materiais (Todos os usuários autenticados podem ver e editar)
CREATE POLICY "Acesso total para usuários autenticados" ON public.materiais
    FOR ALL USING (auth.role() = 'authenticated');

-- Política para Fotos
CREATE POLICY "Acesso total para usuários autenticados" ON public.fotos
    FOR ALL USING (auth.role() = 'authenticated');

-- Política para Envios
CREATE POLICY "Acesso total para usuários autenticados" ON public.envios
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Instruções para criação do usuário Admin via Dashboard do Supabase:
-- O usuário administrador deve ser criado com as seguintes credenciais:
-- E-mail: admin@sistema.com
-- Senha: [Sua Senha de 6 dígitos]
-- Metadados sugeridos (opcional): {"role": "admin", "name": "Administrador"}

-- 4. Exemplo de inserção de metadados para um usuário existente via SQL (se necessário):
-- UPDATE auth.users 
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}' 
-- WHERE email = 'admin@sistema.com';
