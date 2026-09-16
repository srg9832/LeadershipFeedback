-- CAP Leadership Feedback migration for the existing CAP Schedule Supabase project.
-- Designed to preserve existing CAP Schedule users, units, schedules, rooms, and history.
-- Project used during development: vosvdkkuiijywwmqzdiu

begin;

create extension if not exists pgcrypto;

-- Fail early if this is not the CAP Schedule database this migration was designed for.
do $$ begin
  if to_regclass('public.profiles') is null
     or to_regclass('public.units') is null
     or to_regclass('public.user_unit_permissions') is null then
    raise exception 'CAP Leadership Feedback requires the existing CAP Schedule profiles, units, and user_unit_permissions tables.';
  end if;
  if to_regprocedure('public.is_app_admin()') is null then
    raise exception 'CAP Leadership Feedback requires CAP Schedule function public.is_app_admin(). Apply the current CAP Schedule schema/migrations first.';
  end if;
  if to_regprocedure('public.set_updated_at()') is null then
    raise exception 'CAP Leadership Feedback requires CAP Schedule function public.set_updated_at(). Apply the current CAP Schedule schema/migrations first.';
  end if;
end $$;

-- ============================================================
-- Shared CAP membership foundation
-- ============================================================

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  capid text not null unique,
  first_name text not null,
  last_name text not null,
  member_type text not null check (member_type in ('Cadet','Senior')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_members_name on public.members(last_name, first_name);
create index if not exists idx_members_active on public.members(active);

create table if not exists public.member_unit_assignments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete restrict,
  is_primary boolean not null default true,
  active boolean not null default true,
  start_date date not null default current_date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create index if not exists idx_member_assignments_member on public.member_unit_assignments(member_id);
create index if not exists idx_member_assignments_unit on public.member_unit_assignments(unit_id);
create unique index if not exists uq_member_one_active_primary
  on public.member_unit_assignments(member_id)
  where active and is_primary;

alter table public.profiles add column if not exists member_id uuid;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='profiles_member_id_fkey') then
    alter table public.profiles
      add constraint profiles_member_id_fkey
      foreign key(member_id) references public.members(id) on delete set null;
  end if;
end $$;
create unique index if not exists uq_profiles_member_id
  on public.profiles(member_id) where member_id is not null;

-- ============================================================
-- Leadership Feedback permissions and data
-- ============================================================

create table if not exists public.leadership_global_permissions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  is_app_admin boolean not null default false,
  encampment_evaluator boolean not null default false,
  encampment_reviewer boolean not null default false,
  encampment_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leadership_unit_permissions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  cadet_evaluator boolean not null default false,
  cadet_reviewer boolean not null default false,
  senior_evaluator boolean not null default false,
  senior_reviewer boolean not null default false,
  unit_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(user_id, unit_id)
);

create index if not exists idx_leadership_unit_perms_unit on public.leadership_unit_permissions(unit_id);

create table if not exists public.leadership_encampments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null,
  start_date date not null,
  end_date date not null,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists idx_leadership_encampments_dates on public.leadership_encampments(start_date desc, end_date desc);
create index if not exists idx_leadership_encampments_active on public.leadership_encampments(active);

create table if not exists public.leadership_feedback (
  id uuid primary key default gen_random_uuid(),
  form_type text not null check (form_type in ('phase1','phase2','phase3','phase4','enc_student','enc_cadre','senior')),
  subject_member_id uuid not null references public.members(id) on delete restrict,
  evaluator_user_id uuid not null references public.profiles(id) on delete restrict,

  evaluation_unit_type text not null check (evaluation_unit_type in ('unit','encampment')),
  unit_id_at_evaluation uuid references public.units(id) on delete restrict,
  encampment_id uuid references public.leadership_encampments(id) on delete restrict,

  capid_snapshot text not null,
  first_name_snapshot text not null,
  last_name_snapshot text not null,
  member_type_at_evaluation text not null check (member_type_at_evaluation in ('Cadet','Senior')),
  grade_at_evaluation text,
  evaluator_name_snapshot text,
  evaluator_title text,

  review_start date,
  review_end date,
  discussion_date date,
  feedback_type text,
  feedback_mode text,
  duty_title text,

  ratings jsonb not null default '{}'::jsonb,
  comments jsonb not null default '{}'::jsonb,
  narratives jsonb not null default '{}'::jsonb,
  decision jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),

  check (
    (evaluation_unit_type='unit' and encampment_id is null and unit_id_at_evaluation is not null)
    or
    (evaluation_unit_type='encampment' and encampment_id is not null)
  )
);

create index if not exists idx_leadership_feedback_member_date on public.leadership_feedback(subject_member_id, coalesce(review_end,discussion_date) desc);
create index if not exists idx_leadership_feedback_unit on public.leadership_feedback(unit_id_at_evaluation);
create index if not exists idx_leadership_feedback_encampment on public.leadership_feedback(encampment_id);
create index if not exists idx_leadership_feedback_evaluator on public.leadership_feedback(evaluator_user_id);
create index if not exists idx_leadership_feedback_form_type on public.leadership_feedback(form_type);

create table if not exists public.leadership_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Updated-at triggers
-- ============================================================

do $$ declare t text; begin
  foreach t in array array[
    'members','member_unit_assignments','leadership_global_permissions',
    'leadership_unit_permissions','leadership_encampments'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I',t,t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',t,t);
  end loop;
end $$;

-- ============================================================
-- Leadership helper functions
-- ============================================================

create or replace function public.is_leadership_app_admin()
returns boolean
language sql stable security definer set search_path=public
as $$
  select exists(
    select 1 from public.leadership_global_permissions p
    where p.user_id=auth.uid() and p.is_app_admin
  );
$$;

create or replace function public.has_leadership_global_role(p_role text)
returns boolean
language sql stable security definer set search_path=public
as $$
  select public.is_leadership_app_admin() or exists(
    select 1
    from public.leadership_global_permissions p
    where p.user_id=auth.uid()
      and case p_role
        when 'encampment_evaluator' then p.encampment_evaluator
        when 'encampment_reviewer' then p.encampment_reviewer
        when 'encampment_admin' then p.encampment_admin
        when 'app_admin' then p.is_app_admin
        else false
      end
  );
$$;

create or replace function public.has_leadership_unit_role(p_unit_id uuid, p_role text)
returns boolean
language sql stable security definer set search_path=public
as $$
  select public.is_leadership_app_admin() or exists(
    select 1
    from public.leadership_unit_permissions p
    where p.user_id=auth.uid() and p.unit_id=p_unit_id
      and case p_role
        when 'cadet_evaluator' then p.cadet_evaluator
        when 'cadet_reviewer' then p.cadet_reviewer
        when 'senior_evaluator' then p.senior_evaluator and exists(
          select 1 from public.profiles pr join public.members m on m.id=pr.member_id
          where pr.id=auth.uid() and m.member_type='Senior'
        )
        when 'senior_reviewer' then p.senior_reviewer and exists(
          select 1 from public.profiles pr join public.members m on m.id=pr.member_id
          where pr.id=auth.uid() and m.member_type='Senior'
        )
        when 'unit_admin' then p.unit_admin
        else false
      end
  );
$$;

create or replace function public.has_any_leadership_unit_access(p_unit_id uuid)
returns boolean
language sql stable security definer set search_path=public
as $$
  select public.is_leadership_app_admin() or exists(
    select 1 from public.leadership_unit_permissions p
    where p.user_id=auth.uid() and p.unit_id=p_unit_id
      and (p.cadet_evaluator or p.cadet_reviewer or p.senior_evaluator or p.senior_reviewer or p.unit_admin)
  );
$$;

create or replace function public.has_any_schedule_unit_access(p_unit_id uuid)
returns boolean
language sql stable security definer set search_path=public
as $$
  select public.is_app_admin() or exists(
    select 1 from public.user_unit_permissions p
    where p.user_id=auth.uid() and p.unit_id=p_unit_id
      and (p.can_edit_cadet or p.can_edit_senior or p.is_unit_admin)
  );
$$;

create or replace function public.can_read_shared_member(p_member_id uuid)
returns boolean
language sql stable security definer set search_path=public
as $$
  select
    auth.uid() is not null
    and (
      exists(select 1 from public.profiles pr where pr.id=auth.uid() and pr.member_id=p_member_id)
      or public.is_app_admin()
      or public.is_leadership_app_admin()
      or public.has_leadership_global_role('encampment_evaluator')
      or public.has_leadership_global_role('encampment_reviewer')
      or exists(
        select 1
        from public.member_unit_assignments a
        where a.member_id=p_member_id and a.active
          and (public.has_any_leadership_unit_access(a.unit_id) or public.has_any_schedule_unit_access(a.unit_id))
      )
    );
$$;

create or replace function public.can_read_leadership_feedback(
  p_form_type text,
  p_unit_id uuid,
  p_encampment_id uuid,
  p_evaluator_user_id uuid
)
returns boolean
language sql stable security definer set search_path=public
as $$
  select
    public.is_leadership_app_admin()
    or (
      p_encampment_id is not null
      and (
        public.has_leadership_global_role('encampment_reviewer')
        or (p_evaluator_user_id=auth.uid() and public.has_leadership_global_role('encampment_evaluator'))
      )
    )
    or (
      p_encampment_id is null and p_form_type='senior'
      and (
        public.has_leadership_unit_role(p_unit_id,'senior_reviewer')
        or (p_evaluator_user_id=auth.uid() and public.has_leadership_unit_role(p_unit_id,'senior_evaluator'))
      )
    )
    or (
      p_encampment_id is null and p_form_type<>'senior'
      and (
        public.has_leadership_unit_role(p_unit_id,'cadet_reviewer')
        or public.has_leadership_unit_role(p_unit_id,'unit_admin')
        or (p_evaluator_user_id=auth.uid() and public.has_leadership_unit_role(p_unit_id,'cadet_evaluator'))
      )
    );
$$;

-- Names only; used to display evaluator names in records/history.
-- A caller receives their own name plus evaluator names from feedback rows that the
-- caller is actually authorized to read. This avoids exposing a statewide user list.
create or replace function public.leadership_user_names()
returns table(
  user_id uuid,
  display_name text,
  first_name text,
  last_name text,
  member_type text
)
language sql stable security definer set search_path=public
as $$
  select distinct
    p.id,
    coalesce(nullif(p.display_name,''), trim(concat_ws(' ',m.first_name,m.last_name)), 'CAP User') as display_name,
    m.first_name,
    m.last_name,
    m.member_type
  from public.profiles p
  left join public.members m on m.id=p.member_id
  where auth.uid() is not null
    and (
      p.id=auth.uid()
      or exists(
        select 1
        from public.leadership_feedback f
        where f.evaluator_user_id=p.id
          and public.can_read_leadership_feedback(
            f.form_type,f.unit_id_at_evaluation,f.encampment_id,f.evaluator_user_id
          )
      )
    )
  order by display_name;
$$;

-- ============================================================
-- Shared member management RPC
-- ============================================================

create or replace function public.leadership_upsert_member(
  p_member_id uuid,
  p_capid text,
  p_first_name text,
  p_last_name text,
  p_member_type text,
  p_unit_id uuid,
  p_active boolean default true
)
returns uuid
language plpgsql security definer set search_path=public
as $$
declare
  v_id uuid;
  v_existing public.members%rowtype;
  v_capid_owner public.members%rowtype;
  v_current_assignment public.member_unit_assignments%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_capid is null or btrim(p_capid)='' then raise exception 'CAPID is required'; end if;
  if p_first_name is null or btrim(p_first_name)='' then raise exception 'First name is required'; end if;
  if p_last_name is null or btrim(p_last_name)='' then raise exception 'Last name is required'; end if;
  if p_member_type not in ('Cadet','Senior') then raise exception 'Invalid member type'; end if;
  if p_unit_id is null then raise exception 'Unit is required'; end if;

  -- The caller must administer the destination unit. App Admins may manage every unit.
  if not (public.is_leadership_app_admin() or public.has_leadership_unit_role(p_unit_id,'unit_admin')) then
    raise exception 'Not authorized to manage members for this unit';
  end if;

  if p_member_id is not null then
    select * into v_existing from public.members where id=p_member_id;
    if v_existing.id is null then raise exception 'Member not found'; end if;

    select * into v_capid_owner from public.members where capid=btrim(p_capid);
    if v_capid_owner.id is not null and v_capid_owner.id<>p_member_id then
      raise exception 'CAPID already belongs to another member';
    end if;
    v_id:=p_member_id;
  else
    select * into v_existing from public.members where capid=btrim(p_capid);
    if v_existing.id is not null then
      v_id:=v_existing.id;
    end if;
  end if;

  if v_id is not null then
    select a.* into v_current_assignment
    from public.member_unit_assignments a
    where a.member_id=v_id and a.active and a.is_primary
    order by a.start_date desc limit 1;

    -- Prevent a Unit Admin from taking a member away from another unit merely by
    -- entering that member's CAPID. They must also administer the current unit.
    if v_current_assignment.id is not null
       and v_current_assignment.unit_id<>p_unit_id
       and not public.is_leadership_app_admin()
       and not public.has_leadership_unit_role(v_current_assignment.unit_id,'unit_admin') then
      raise exception 'Not authorized to move this member from the current unit';
    end if;

    update public.members
    set capid=btrim(p_capid),
        first_name=btrim(p_first_name),
        last_name=btrim(p_last_name),
        member_type=p_member_type,
        active=coalesce(p_active,true)
    where id=v_id;
  else
    insert into public.members(capid,first_name,last_name,member_type,active)
    values(btrim(p_capid),btrim(p_first_name),btrim(p_last_name),p_member_type,coalesce(p_active,true))
    returning id into v_id;
  end if;

  -- Keep the current primary assignment while preserving prior assignments as history.
  if v_current_assignment.id is null then
    select a.* into v_current_assignment
    from public.member_unit_assignments a
    where a.member_id=v_id and a.active and a.is_primary
    order by a.start_date desc limit 1;
  end if;

  if v_current_assignment.id is null or v_current_assignment.unit_id<>p_unit_id then
    if v_current_assignment.id is not null then
      update public.member_unit_assignments
      set active=false, end_date=greatest(start_date,current_date-1)
      where id=v_current_assignment.id;
    end if;

    insert into public.member_unit_assignments(member_id,unit_id,is_primary,active,start_date)
    values(v_id,p_unit_id,true,true,current_date);
  end if;

  insert into public.leadership_audit_log(actor_user_id,action,entity_type,entity_id,details)
  values(auth.uid(),case when p_member_id is null then 'UPSERT' else 'UPDATE' end,'member',v_id::text,
         jsonb_build_object('capid',btrim(p_capid),'unit_id',p_unit_id,'active',coalesce(p_active,true)));

  return v_id;
end $$;

-- ============================================================
-- Feedback insert RPC (records are intentionally immutable)
-- ============================================================

create or replace function public.leadership_save_feedback(p_payload jsonb)
returns uuid
language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid:=auth.uid();
  v_form text:=p_payload->>'type';
  v_capid text:=btrim(coalesce(p_payload->>'capid',''));
  v_first text:=btrim(coalesce(p_payload->>'firstName',''));
  v_last text:=btrim(coalesce(p_payload->>'lastName',''));
  v_grade text:=nullif(p_payload->>'grade','');
  v_unit uuid;
  v_enc uuid;
  v_member public.members%rowtype;
  v_assignment public.member_unit_assignments%rowtype;
  v_member_type text;
  v_eval_date date;
  v_encrow public.leadership_encampments%rowtype;
  v_evaluator_name text;
  v_id uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if v_form not in ('phase1','phase2','phase3','phase4','enc_student','enc_cadre','senior') then raise exception 'Invalid feedback type'; end if;
  if v_capid='' or v_first='' or v_last='' then raise exception 'CAPID, first name, and last name are required'; end if;

  v_member_type:=case when v_form='senior' then 'Senior' else 'Cadet' end;
  v_eval_date:=case when v_form='senior' then nullif(p_payload->>'discussionDate','')::date else nullif(p_payload->>'reviewEnd','')::date end;
  if v_eval_date is null then raise exception 'Evaluation date is required'; end if;

  if v_form in ('enc_student','enc_cadre') then
    v_enc:=nullif(p_payload->>'encampmentId','')::uuid;
    if v_enc is null then raise exception 'Encampment is required'; end if;
    if not public.has_leadership_global_role('encampment_evaluator') then raise exception 'Encampment Evaluator permission required'; end if;
    select * into v_encrow from public.leadership_encampments where id=v_enc;
    if v_encrow.id is null then raise exception 'Encampment not found'; end if;
    if not v_encrow.active then raise exception 'Encampment is inactive'; end if;
    if v_eval_date < (v_encrow.start_date-3) or v_eval_date > v_encrow.end_date then
      raise exception 'Feedback date is outside the authorized encampment entry window';
    end if;
  else
    v_unit:=nullif(p_payload->>'unitId','')::uuid;
    if v_unit is null then raise exception 'Unit is required'; end if;
    if v_form='senior' then
      if not public.has_leadership_unit_role(v_unit,'senior_evaluator') then raise exception 'Senior Evaluator permission required'; end if;
      if not public.is_leadership_app_admin() and not exists(
        select 1 from public.profiles p join public.members m on m.id=p.member_id
        where p.id=v_user and m.member_type='Senior'
      ) then raise exception 'Senior Evaluator must be a Senior member'; end if;
    else
      if not public.has_leadership_unit_role(v_unit,'cadet_evaluator') then raise exception 'Cadet Evaluator permission required'; end if;
    end if;
  end if;

  select * into v_member from public.members where capid=v_capid;
  if v_member.id is null then
    insert into public.members(capid,first_name,last_name,member_type,active)
    values(v_capid,v_first,v_last,v_member_type,true)
    returning * into v_member;
  else
    if v_member.member_type<>v_member_type then
      raise exception 'CAPID is registered as %, not %',v_member.member_type,v_member_type;
    end if;
    update public.members set active=true where id=v_member.id;
  end if;

  select a.* into v_assignment
  from public.member_unit_assignments a
  where a.member_id=v_member.id and a.active and a.is_primary
  order by a.start_date desc limit 1;

  if v_form not in ('enc_student','enc_cadre') then
    if v_assignment.id is not null and v_assignment.unit_id<>v_unit then
      raise exception 'Member is assigned to a different active unit';
    end if;
    if v_assignment.id is null then
      insert into public.member_unit_assignments(member_id,unit_id,is_primary,active,start_date)
      values(v_member.id,v_unit,true,true,current_date)
      returning * into v_assignment;
    end if;
  end if;

  select coalesce(nullif(p.display_name,''),trim(concat_ws(' ',m.first_name,m.last_name)),'CAP User')
    into v_evaluator_name
  from public.profiles p left join public.members m on m.id=p.member_id
  where p.id=v_user;

  insert into public.leadership_feedback(
    form_type,subject_member_id,evaluator_user_id,evaluation_unit_type,
    unit_id_at_evaluation,encampment_id,
    capid_snapshot,first_name_snapshot,last_name_snapshot,member_type_at_evaluation,grade_at_evaluation,
    evaluator_name_snapshot,evaluator_title,
    review_start,review_end,discussion_date,feedback_type,feedback_mode,duty_title,
    ratings,comments,narratives,decision
  ) values (
    v_form,v_member.id,v_user,
    case when v_form in ('enc_student','enc_cadre') then 'encampment' else 'unit' end,
    case when v_form in ('enc_student','enc_cadre') then v_assignment.unit_id else v_unit end,
    v_enc,
    v_member.capid,v_member.first_name,v_member.last_name,v_member_type,v_grade,
    v_evaluator_name,nullif(p_payload->>'evaluatorTitle',''),
    nullif(p_payload->>'reviewStart','')::date,
    nullif(p_payload->>'reviewEnd','')::date,
    nullif(p_payload->>'discussionDate','')::date,
    nullif(p_payload->>'feedbackType',''),nullif(p_payload->>'feedbackMode',''),nullif(p_payload->>'dutyTitle',''),
    coalesce(p_payload->'ratings','{}'::jsonb),coalesce(p_payload->'comments','{}'::jsonb),
    coalesce(p_payload->'narratives','{}'::jsonb),coalesce(p_payload->'decision','{}'::jsonb)
  ) returning id into v_id;

  insert into public.leadership_audit_log(actor_user_id,action,entity_type,entity_id,details)
  values(v_user,'CREATE','feedback',v_id::text,
         jsonb_build_object('form_type',v_form,'subject_member_id',v_member.id,'unit_id',v_unit,'encampment_id',v_enc));

  return v_id;
end $$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.members enable row level security;
alter table public.member_unit_assignments enable row level security;
alter table public.leadership_global_permissions enable row level security;
alter table public.leadership_unit_permissions enable row level security;
alter table public.leadership_encampments enable row level security;
alter table public.leadership_feedback enable row level security;
alter table public.leadership_audit_log enable row level security;

-- Drop only policies owned by this migration so reruns remain safe.
do $$ declare r record; begin
  for r in select schemaname,tablename,policyname from pg_policies
  where schemaname='public' and policyname like 'leadership_%'
  loop execute format('drop policy if exists %I on %I.%I',r.policyname,r.schemaname,r.tablename); end loop;
end $$;

create policy leadership_members_read
  on public.members for select to authenticated
  using(public.can_read_shared_member(id));

create policy leadership_member_assignments_read
  on public.member_unit_assignments for select to authenticated
  using(public.can_read_shared_member(member_id));

create policy leadership_global_perms_read
  on public.leadership_global_permissions for select to authenticated
  using(user_id=auth.uid() or public.is_leadership_app_admin());

create policy leadership_unit_perms_read
  on public.leadership_unit_permissions for select to authenticated
  using(
    user_id=auth.uid()
    or public.is_leadership_app_admin()
    or public.has_leadership_unit_role(unit_id,'unit_admin')
  );

create policy leadership_encampments_read
  on public.leadership_encampments for select to authenticated
  using(true);

create policy leadership_encampments_insert
  on public.leadership_encampments for insert to authenticated
  with check(public.has_leadership_global_role('encampment_admin'));

create policy leadership_encampments_update
  on public.leadership_encampments for update to authenticated
  using(public.has_leadership_global_role('encampment_admin'))
  with check(public.has_leadership_global_role('encampment_admin'));

create policy leadership_feedback_read
  on public.leadership_feedback for select to authenticated
  using(public.can_read_leadership_feedback(form_type,unit_id_at_evaluation,encampment_id,evaluator_user_id));

create policy leadership_audit_read
  on public.leadership_audit_log for select to authenticated
  using(public.is_leadership_app_admin());

-- Leadership App Admins may maintain the shared unit list from this application.
create policy leadership_units_app_admin_read
  on public.units for select to authenticated
  using(public.is_leadership_app_admin());

create policy leadership_units_app_admin_insert
  on public.units for insert to authenticated
  with check(public.is_leadership_app_admin());

create policy leadership_units_app_admin_update
  on public.units for update to authenticated
  using(public.is_leadership_app_admin())
  with check(public.is_leadership_app_admin());

-- ============================================================
-- Grants
-- ============================================================

grant select on public.members,public.member_unit_assignments,
  public.leadership_global_permissions,public.leadership_unit_permissions,
  public.leadership_encampments,public.leadership_feedback,public.leadership_audit_log
  to authenticated;

grant insert,update on public.leadership_encampments to authenticated;

revoke insert,update,delete on public.members from authenticated;
revoke insert,update,delete on public.member_unit_assignments from authenticated;
revoke insert,update,delete on public.leadership_global_permissions from authenticated;
revoke insert,update,delete on public.leadership_unit_permissions from authenticated;
revoke insert,update,delete on public.leadership_feedback from authenticated;
revoke insert,update,delete on public.leadership_audit_log from authenticated;

revoke execute on function public.is_leadership_app_admin() from public, anon;
revoke execute on function public.has_leadership_global_role(text) from public, anon;
revoke execute on function public.has_leadership_unit_role(uuid,text) from public, anon;
revoke execute on function public.has_any_leadership_unit_access(uuid) from public, anon;
revoke execute on function public.has_any_schedule_unit_access(uuid) from public, anon;
revoke execute on function public.can_read_shared_member(uuid) from public, anon;
revoke execute on function public.can_read_leadership_feedback(text,uuid,uuid,uuid) from public, anon;
revoke execute on function public.leadership_user_names() from public, anon;
revoke execute on function public.leadership_upsert_member(uuid,text,text,text,text,uuid,boolean) from public, anon;
revoke execute on function public.leadership_save_feedback(jsonb) from public, anon;

grant execute on function public.is_leadership_app_admin() to authenticated;
grant execute on function public.has_leadership_global_role(text) to authenticated;
grant execute on function public.has_leadership_unit_role(uuid,text) to authenticated;
grant execute on function public.has_any_leadership_unit_access(uuid) to authenticated;
grant execute on function public.has_any_schedule_unit_access(uuid) to authenticated;
grant execute on function public.can_read_shared_member(uuid) to authenticated;
grant execute on function public.can_read_leadership_feedback(text,uuid,uuid,uuid) to authenticated;
grant execute on function public.leadership_user_names() to authenticated;
grant execute on function public.leadership_upsert_member(uuid,text,text,text,text,uuid,boolean) to authenticated;
grant execute on function public.leadership_save_feedback(jsonb) to authenticated;

-- ============================================================
-- Bootstrap: existing CAP Schedule App Admins become Leadership App Admins.
-- This gives the current project owner a way into the new Administration tab.
-- Additional Leadership App Admins can be granted later from the application.
-- ============================================================

insert into public.leadership_global_permissions(user_id,is_app_admin)
select p.id,true
from public.profiles p
where p.is_app_admin
on conflict(user_id) do update set is_app_admin=true;

commit;
