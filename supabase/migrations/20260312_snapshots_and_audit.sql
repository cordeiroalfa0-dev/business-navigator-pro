-- Tabela de Snapshots de Metas (para histórico de evolução)
CREATE TABLE IF NOT EXISTS meta_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  nome TEXT NOT NULL,
  atual NUMERIC NOT NULL,
  objetivo NUMERIC NOT NULL,
  percentual_concluido NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'no_prazo',
  responsavel TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_meta_snapshots_meta_id ON meta_snapshots(meta_id);
CREATE INDEX idx_meta_snapshots_date ON meta_snapshots(snapshot_date);

-- Tabela de Auditoria de Ações
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  old_values JSONB,
  new_values JSONB,
  changes_summary TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'meta_alert', 'backup_reminder', 'user_created', 'system_alert'
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
  related_entity_type TEXT, -- 'meta', 'user', 'backup', etc
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notifications_admin_id ON admin_notifications(admin_id);
CREATE INDEX idx_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX idx_notifications_created_at ON admin_notifications(created_at DESC);

-- Tabela de Agendamento de Backups
CREATE TABLE IF NOT EXISTS backup_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name TEXT NOT NULL,
  frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  day_of_week INT DEFAULT 5, -- 0=Sunday, 5=Friday
  hour INT DEFAULT 22,
  minute INT DEFAULT 0,
  last_backup_at TIMESTAMP WITH TIME ZONE,
  next_backup_at TIMESTAMP WITH TIME ZONE,
  backup_file_url TEXT,
  backup_size_bytes BIGINT,
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_backup_schedule_status ON backup_schedule(status);

-- RLS Policies
ALTER TABLE meta_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_schedule ENABLE ROW LEVEL SECURITY;

-- Policies para meta_snapshots (todos podem ler, apenas admin pode inserir)
CREATE POLICY "Anyone can read meta snapshots" ON meta_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Only admin can insert meta snapshots" ON meta_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- Policies para audit_logs (apenas admin pode ler)
CREATE POLICY "Only admin can read audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Policies para admin_notifications
CREATE POLICY "Users can read their own notifications" ON admin_notifications
  FOR SELECT USING (admin_id = auth.uid());

CREATE POLICY "System can insert notifications" ON admin_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON admin_notifications
  FOR UPDATE USING (admin_id = auth.uid());

-- Policies para backup_schedule (apenas admin)
CREATE POLICY "Only admin can manage backup schedule" ON backup_schedule
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );
