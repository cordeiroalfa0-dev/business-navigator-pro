-- ============================================================
-- SCRIPT PARA ATUALIZAR AS RESTRIÇÕES DE DESTINO NO SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. Remover a restrição (CHECK constraint) antiga da tabela materiais
-- Nota: O nome da restrição pode variar, mas geralmente segue o padrão 'materiais_destino_check'
DO $$ 
BEGIN 
    ALTER TABLE materiais DROP CONSTRAINT IF EXISTS materiais_destino_check;
EXCEPTION 
    WHEN undefined_object THEN 
        RAISE NOTICE 'Restrição não encontrada, pulando...';
END $$;

-- 2. Adicionar a nova restrição incluindo 'Almoxarifado'
ALTER TABLE materiais 
ADD CONSTRAINT materiais_destino_check 
CHECK (destino IN ('Almoxarifado', 'Palazzo Lumini', 'Queen Victoria', 'Chateau Carmelo'));

-- 3. (Opcional) Se você já tiver dados e quiser garantir que o histórico de envios também aceite o novo destino
-- A tabela 'envios' não tinha CHECK constraint no script original, mas é bom garantir.
-- Se houver uma restrição em envios, você pode repetir o processo acima para a tabela 'envios'.

RAISE NOTICE 'Banco de dados atualizado com sucesso para aceitar o destino Almoxarifado.';
