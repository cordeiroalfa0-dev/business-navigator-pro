-- Tabela de Check-ins com Evidências (Fotos e Comentários)
CREATE TABLE IF NOT EXISTS meta_checkins_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  percentual_anterior NUMERIC DEFAULT 0,
  percentual_novo NUMERIC NOT NULL,
  comentario TEXT,
  foto_url TEXT,
  evidencia_urls TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array de múltiplas fotos
  tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- Tags para categorizar o check-in
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meta_checkins_v2_meta_id ON meta_checkins_v2(meta_id);
CREATE INDEX idx_meta_checkins_v2_user_id ON meta_checkins_v2(user_id);
CREATE INDEX idx_meta_checkins_v2_created_at ON meta_checkins_v2(created_at DESC);

-- Tabela de Dependências entre Metas
CREATE TABLE IF NOT EXISTS meta_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
  depends_on_meta_id UUID NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'finish_to_start', -- 'finish_to_start', 'finish_to_finish', 'start_to_start', 'start_to_finish'
  lag_days INT DEFAULT 0, -- Dias de atraso permitido entre a conclusão da predecessor e início da dependente
  is_critical BOOLEAN DEFAULT FALSE, -- Se TRUE, atraso nesta meta afeta o caminho crítico
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meta_id, depends_on_meta_id)
);

CREATE INDEX idx_meta_dependencies_meta_id ON meta_dependencies(meta_id);
CREATE INDEX idx_meta_dependencies_depends_on ON meta_dependencies(depends_on_meta_id);

-- Tabela de Análise Preditiva (Estimativas de Conclusão)
CREATE TABLE IF NOT EXISTS meta_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
  data_analise DATE NOT NULL,
  velocidade_media NUMERIC, -- % por dia
  data_estimada_conclusao DATE,
  margem_risco TEXT DEFAULT 'baixo', -- 'baixo', 'medio', 'alto', 'critico'
  dias_atraso_estimado INT DEFAULT 0,
  confianca_predicao NUMERIC DEFAULT 0, -- 0-100
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meta_id, data_analise)
);

CREATE INDEX idx_meta_predictions_meta_id ON meta_predictions(meta_id);
CREATE INDEX idx_meta_predictions_margem_risco ON meta_predictions(margem_risco);

-- Tabela de Ações em Kanban (Tarefas da Meta)
CREATE TABLE IF NOT EXISTS meta_acoes_kanban (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responsavel_nome TEXT,
  status TEXT DEFAULT 'todo', -- 'todo', 'in_progress', 'done', 'blocked'
  prioridade TEXT DEFAULT 'media', -- 'baixa', 'media', 'alta', 'critica'
  data_inicio DATE,
  data_vencimento DATE,
  percentual_completo NUMERIC DEFAULT 0,
  ordem INT DEFAULT 0, -- Para ordenar no Kanban
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meta_acoes_kanban_meta_id ON meta_acoes_kanban(meta_id);
CREATE INDEX idx_meta_acoes_kanban_status ON meta_acoes_kanban(status);
CREATE INDEX idx_meta_acoes_kanban_responsavel ON meta_acoes_kanban(responsavel_id);

-- Tabela de Histórico de Desempenho (para Ranking)
CREATE TABLE IF NOT EXISTS responsavel_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT,
  total_metas INT DEFAULT 0,
  metas_no_prazo INT DEFAULT 0,
  metas_atrasadas INT DEFAULT 0,
  metas_concluidas INT DEFAULT 0,
  taxa_sucesso NUMERIC DEFAULT 0, -- Percentual de metas no prazo
  pontos_gamificacao INT DEFAULT 0,
  mes_ano TEXT, -- 'YYYY-MM' para agrupar por mês
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, mes_ano)
);

CREATE INDEX idx_responsavel_performance_user_id ON responsavel_performance(user_id);
CREATE INDEX idx_responsavel_performance_taxa_sucesso ON responsavel_performance(taxa_sucesso DESC);
CREATE INDEX idx_responsavel_performance_mes_ano ON responsavel_performance(mes_ano);

-- RLS Policies
ALTER TABLE meta_checkins_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_acoes_kanban ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsavel_performance ENABLE ROW LEVEL SECURITY;

-- Policies para meta_checkins_v2
CREATE POLICY "Anyone can read meta checkins" ON meta_checkins_v2
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own checkins" ON meta_checkins_v2
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own checkins" ON meta_checkins_v2
  FOR UPDATE USING (user_id = auth.uid());

-- Policies para meta_dependencies
CREATE POLICY "Anyone can read meta dependencies" ON meta_dependencies
  FOR SELECT USING (true);

CREATE POLICY "Only admin can manage dependencies" ON meta_dependencies
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- Policies para meta_predictions
CREATE POLICY "Anyone can read predictions" ON meta_predictions
  FOR SELECT USING (true);

CREATE POLICY "System can insert predictions" ON meta_predictions
  FOR INSERT WITH CHECK (true);

-- Policies para meta_acoes_kanban
CREATE POLICY "Anyone can read kanban actions" ON meta_acoes_kanban
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert kanban actions" ON meta_acoes_kanban
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update kanban actions" ON meta_acoes_kanban
  FOR UPDATE USING (true);

-- Policies para responsavel_performance
CREATE POLICY "Anyone can read performance" ON responsavel_performance
  FOR SELECT USING (true);

CREATE POLICY "System can manage performance" ON responsavel_performance
  FOR ALL WITH CHECK (true);
