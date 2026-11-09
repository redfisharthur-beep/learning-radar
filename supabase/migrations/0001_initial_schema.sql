-- Learning Radar: initial schema
-- Apply using Supabase SQL Editor or Supabase CLI.
begin;

create extension if not exists pgcrypto;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  school_code text unique,
  name text not null,
  city text,
  district text,
  school_level text not null check (school_level in ('elementary', 'junior_high', 'combined')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists schools_name_idx on public.schools using gin (to_tsvector('simple', name));

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '學生' check (char_length(display_name) between 1 and 60),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  education_stage text check (education_stage in ('elementary', 'junior_high')),
  grade smallint check (
    (education_stage = 'elementary' and grade between 1 and 6) or
    (education_stage = 'junior_high' and grade between 7 and 9) or
    education_stage is null
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_stage_grade_consistency check (
    (education_stage is null and grade is null) or
    (education_stage = 'elementary' and grade between 1 and 6) or
    (education_stage = 'junior_high' and grade between 7 and 9)
  )
);

create table if not exists public.subjects (
  id text primary key,
  name text not null unique,
  sort_order smallint not null,
  is_active boolean not null default true
);

insert into public.subjects (id, name, sort_order) values
  ('chinese', '國文', 1),
  ('english', '英文', 2),
  ('math', '數學', 3),
  ('science', '自然', 4),
  ('social', '社會', 5)
on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order;

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('student', 'teacher', 'admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), '學生')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict do nothing;

  insert into public.student_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.user_roles enable row level security;

create policy "authenticated users can read active schools"
on public.schools for select to authenticated using (is_active = true);

create policy "users read own profile"
on public.profiles for select to authenticated using (id = (select auth.uid()));

create policy "users update own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "users read own student profile"
on public.student_profiles for select to authenticated
using (user_id = (select auth.uid()));

create policy "users insert own student profile"
on public.student_profiles for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "users update own student profile"
on public.student_profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "authenticated users can read active subjects"
on public.subjects for select to authenticated using (is_active = true);

create policy "users read own roles"
on public.user_roles for select to authenticated
using (user_id = (select auth.uid()));

revoke insert, update, delete on public.user_roles from anon, authenticated;
revoke insert, update, delete on public.schools from anon, authenticated;
revoke insert, update, delete on public.subjects from anon, authenticated;

grant select on public.schools to authenticated;
grant select on public.subjects to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.student_profiles to authenticated;
grant select on public.user_roles to authenticated;

commit;
