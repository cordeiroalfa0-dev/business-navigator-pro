-- ============================================
-- SQL para configurar o Supabase
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela: materiais
CREATE TABLE IF NOT EXISTS materiais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_remo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  destino TEXT NOT NULL CHECK (destino IN ('Palazzo Lumini', 'Queen Victoria', 'Chateau Carmelo')),
  quantidade INTEGER DEFAULT 1,
  categoria TEXT,
  usuario_id UUID,
  usuario_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabela: fotos
CREATE TABLE IF NOT EXISTS fotos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES materiais(id) ON DELETE CASCADE,
  url_imagem TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tamanho INTEGER,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3.1 Tabela: envios
CREATE TABLE IF NOT EXISTS envios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID REFERENCES materiais(id) ON DELETE CASCADE,
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  observacao TEXT,
  usuario_id UUID,
  usuario_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_materiais_destino ON materiais(destino);
CREATE INDEX IF NOT EXISTS idx_materiais_codigo_remo ON materiais(codigo_remo);
CREATE INDEX IF NOT EXISTS idx_materiais_created_at ON materiais(created_at);
CREATE INDEX IF NOT EXISTS idx_fotos_material_id ON fotos(material_id);
CREATE INDEX IF NOT EXISTS idx_envios_material_id ON envios(material_id);
CREATE INDEX IF NOT EXISTS idx_envios_created_at ON envios(created_at);

-- 5. Função para gerar próximo código REMO
CREATE OR REPLACE FUNCTION gerar_proximo_codigo_remo()
RETURNS TEXT AS $$
DECLARE
  ultimo_numero INTEGER;
  proximo_codigo TEXT;
BEGIN
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(codigo_remo FROM 5) AS INTEGER)), 
    0
  ) INTO ultimo_numero
  FROM materiais
  WHERE codigo_remo ~ '^REMO[0-9]+$';
  
  proximo_codigo := 'REMO' || LPAD((ultimo_numero + 1)::TEXT, 4, '0');
  RETURN proximo_codigo;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_materiais_updated_at ON materiais;
CREATE TRIGGER update_materiais_updated_at
  BEFORE UPDATE ON materiais
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Configuração de Segurança (RLS)
ALTER TABLE materiais DISABLE ROW LEVEL SECURITY;
ALTER TABLE fotos DISABLE ROW LEVEL SECURITY;
ALTER TABLE envios DISABLE ROW LEVEL SECURITY;

ALTER TABLE materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE envios ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de acesso
DROP POLICY IF EXISTS "Permitir tudo para materiais" ON materiais;
CREATE POLICY "Permitir tudo para materiais" ON materiais FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo para fotos" ON fotos;
CREATE POLICY "Permitir tudo para fotos" ON fotos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo para envios" ON envios;
CREATE POLICY "Permitir tudo para envios" ON envios FOR ALL USING (true) WITH CHECK (true);

-- 10. Configuração do Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fotos-materiais', 'fotos-materiais', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Acesso Público para Fotos" ON storage.objects;
CREATE POLICY "Acesso Público para Fotos" ON storage.objects
FOR ALL USING (bucket_id = 'fotos-materiais')
WITH CHECK (bucket_id = 'fotos-materiais');
