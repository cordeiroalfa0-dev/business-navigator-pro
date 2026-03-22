-- Remove admin view that referenced auth.users and recreate it securely
DROP VIEW IF EXISTS public.admin_dashboard_view;

create or replace view public.admin_dashboard_view
with (security_invoker = true) as
select
  (select count(*)::int from public.profiles) as total_profiles,
  (select count(*)::int from public.user_roles where role = 'admin') as total_admins;

grant select on public.admin_dashboard_view to authenticated;