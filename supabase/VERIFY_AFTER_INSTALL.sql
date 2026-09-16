-- CAP Leadership Feedback post-install verification.
-- Run in Supabase SQL Editor after 20260915_cap_leadership_feedback.sql succeeds.

-- 1. New shared and Leadership tables.
select table_name
from information_schema.tables
where table_schema='public'
  and table_name in (
    'members','member_unit_assignments','leadership_global_permissions',
    'leadership_unit_permissions','leadership_encampments','leadership_feedback','leadership_audit_log'
  )
order by table_name;

-- 2. New shared profile link.
select column_name, data_type
from information_schema.columns
where table_schema='public' and table_name='profiles' and column_name='member_id';

-- 3. Required Leadership functions.
select routine_name
from information_schema.routines
where routine_schema='public'
  and routine_name in (
    'is_leadership_app_admin','has_leadership_global_role','has_leadership_unit_role',
    'has_any_leadership_unit_access','has_any_schedule_unit_access','can_read_shared_member',
    'can_read_leadership_feedback','leadership_user_names','leadership_upsert_member','leadership_save_feedback'
  )
order by routine_name;

-- 4. RLS should be enabled on every new table.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in (
    'members','member_unit_assignments','leadership_global_permissions',
    'leadership_unit_permissions','leadership_encampments','leadership_feedback','leadership_audit_log'
  )
order by c.relname;

-- 5. Existing CAP Schedule units are still present.
select id, charter_number, name, active
from public.units
order by charter_number nulls last, name;

-- 6. Existing Schedule App Admin(s) should have been bootstrapped into Leadership App Admin.
select p.id, p.display_name, g.is_app_admin
from public.profiles p
join public.leadership_global_permissions g on g.user_id=p.id
where g.is_app_admin
order by p.display_name;

-- 7. Current shared roster counts (zero is normal immediately after migration).
select
  (select count(*) from public.members) as members,
  (select count(*) from public.member_unit_assignments where active) as active_member_assignments,
  (select count(*) from public.leadership_feedback) as feedback_records,
  (select count(*) from public.leadership_encampments) as encampments;
