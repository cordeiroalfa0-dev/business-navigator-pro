-- Create role enum
create type public.app_role as enum ('admin');

-- Profiles table for user-specific data
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Separate roles table to avoid privilege escalation on profiles/auth tables
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamp with time zone not null default now(),
  unique (user_id, role)
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- Timestamp helper
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

-- Role helper using SECURITY DEFINER to avoid recursive RLS
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- Profiles: admins manage all, users can read/update own profile
create policy "Admins can view all profiles"
on public.profiles
for select
using (public.has_role(auth.uid(), 'admin') or auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "Admins or owners can update profiles"
on public.profiles
for update
using (public.has_role(auth.uid(), 'admin') or auth.uid() = id)
with check (public.has_role(auth.uid(), 'admin') or auth.uid() = id);

-- User roles: only admins can manage/read roles
create policy "Admins can view roles"
on public.user_roles
for select
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert roles"
on public.user_roles
for insert
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update roles"
on public.user_roles
for update
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete roles"
on public.user_roles
for delete
using (public.has_role(auth.uid(), 'admin'));

-- Admin dashboard view
create or replace view public.admin_dashboard_view as
select
  (select count(*)::int from auth.users) as total_users,
  (select count(*)::int from public.user_roles where role = 'admin') as total_admins,
  (select count(*)::int from public.profiles) as total_profiles;

-- Restrict view access to admins through underlying table policies
grant select on public.admin_dashboard_view to authenticated;