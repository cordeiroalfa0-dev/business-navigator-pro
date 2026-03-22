-- ============================================================
-- Configuração inicial do backup automático v5.0
-- ============================================================

-- Insere o registro de agendamento semanal (se não existir)
insert into public.backup_schedule (
  backup_name,
  frequency,
  day_of_week,
  hour,
  minute,
  status,
  next_backup_at
)
select
  'weekly_auto',
  'weekly',
  0,          -- domingo
  2,          -- 02:00
  0,
  'active',
  date_trunc('week', now()) + interval '7 days' + interval '2 hours'
where not exists (
  select 1 from public.backup_schedule where backup_name = 'weekly_auto'
);

-- Insere agendamento diário (desativado por padrão)
insert into public.backup_schedule (
  backup_name,
  frequency,
  day_of_week,
  hour,
  minute,
  status,
  next_backup_at
)
select
  'daily_auto',
  'daily',
  null,
  3,          -- 03:00
  0,
  'inactive',
  date_trunc('day', now()) + interval '1 day' + interval '3 hours'
where not exists (
  select 1 from public.backup_schedule where backup_name = 'daily_auto'
);

-- Tabela de histórico de backups automáticos
create table if not exists public.backup_history (
  id uuid primary key default gen_random_uuid(),
  backup_name text not null,
  executed_at timestamptz default now(),
  status text not null default 'success',  -- success | error
  total_records integer default 0,
  size_bytes bigint default 0,
  error_message text,
  tables_count integer default 0,
  created_at timestamptz default now()
);

alter table public.backup_history enable row level security;

create policy "backup_history_admin_only" on public.backup_history
  for all using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

comment on table public.backup_history is
  'Histórico de execuções de backups automáticos';
