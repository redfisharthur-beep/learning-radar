-- Learning Radar: Phase 2 school profile and curriculum catalogue.
-- This file records the SQL already applied to the Tokyo production project.
begin;

alter table public.schools
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists ownership text,
  add column if not exists academic_year smallint,
  add column if not exists data_source text,
  add column if not exists source_updated_at date;

create index if not exists schools_city_district_idx on public.schools (city, district);
create index if not exists schools_academic_year_idx on public.schools (academic_year desc);

create extension if not exists pg_trgm with schema extensions;
create index if not exists schools_name_trgm_idx
  on public.schools using gin (name extensions.gin_trgm_ops);

create table if not exists public.textbook_publishers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.textbook_editions (
  id uuid primary key default gen_random_uuid(),
  publisher_id uuid not null references public.textbook_publishers(id) on delete restrict,
  education_stage text not null check (education_stage in ('elementary', 'junior_high')),
  grade smallint not null,
  subject_id text not null references public.subjects(id) on delete restrict,
  academic_year smallint not null,
  edition_name text not null default '一般版',
  series_name text,
  isbn text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint textbook_edition_grade_check check (
    (education_stage = 'elementary' and grade between 1 and 6) or
    (education_stage = 'junior_high' and grade between 7 and 9)
  ),
  constraint textbook_edition_unique unique
    (publisher_id, education_stage, grade, subject_id, academic_year, edition_name),
  constraint textbook_edition_id_subject_unique unique (id, subject_id)
);

create index if not exists textbook_editions_lookup_idx
  on public.textbook_editions (education_stage, grade, subject_id, academic_year)
  where is_active = true;
create index if not exists textbook_editions_subject_id_idx
  on public.textbook_editions (subject_id);

create table if not exists public.curriculum_units (
  id uuid primary key default gen_random_uuid(),
  textbook_edition_id uuid not null references public.textbook_editions(id) on delete cascade,
  parent_unit_id uuid references public.curriculum_units(id) on delete cascade,
  unit_code text not null,
  title text not null,
  unit_type text not null default 'unit'
    check (unit_type in ('volume', 'unit', 'lesson', 'section')),
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint curriculum_unit_code_unique unique (textbook_edition_id, parent_unit_id, unit_code)
);

create index if not exists curriculum_units_edition_order_idx
  on public.curriculum_units (textbook_edition_id, sort_order)
  where is_active = true;
create index if not exists curriculum_units_parent_unit_id_idx
  on public.curriculum_units (parent_unit_id) where parent_unit_id is not null;

create table if not exists public.knowledge_points (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references public.subjects(id) on delete restrict,
  education_stage text not null check (education_stage in ('elementary', 'junior_high')),
  grade smallint not null,
  code text not null,
  title text not null,
  description text,
  cognitive_level text check (cognitive_level in ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create')),
  difficulty_level text check (difficulty_level in ('basic', 'intermediate', 'advanced')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_point_grade_check check (
    (education_stage = 'elementary' and grade between 1 and 6) or
    (education_stage = 'junior_high' and grade between 7 and 9)
  ),
  constraint knowledge_point_code_unique unique (subject_id, education_stage, grade, code)
);

create index if not exists knowledge_points_lookup_idx
  on public.knowledge_points (subject_id, education_stage, grade)
  where is_active = true;

create table if not exists public.unit_knowledge_points (
  unit_id uuid not null references public.curriculum_units(id) on delete cascade,
  knowledge_point_id uuid not null references public.knowledge_points(id) on delete cascade,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (unit_id, knowledge_point_id)
);
create index if not exists unit_knowledge_points_knowledge_point_id_idx
  on public.unit_knowledge_points (knowledge_point_id);

create table if not exists public.learning_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  tag_type text not null check (tag_type in ('ability', 'cognitive', 'difficulty', 'learning_strategy')),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_point_tags (
  knowledge_point_id uuid not null references public.knowledge_points(id) on delete cascade,
  tag_id uuid not null references public.learning_tags(id) on delete cascade,
  primary key (knowledge_point_id, tag_id)
);
create index if not exists knowledge_point_tags_tag_id_idx
  on public.knowledge_point_tags (tag_id);

create table if not exists public.student_textbook_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_id text not null references public.subjects(id) on delete restrict,
  textbook_edition_id uuid not null,
  academic_year smallint not null,
  semester smallint not null check (semester in (1, 2)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_textbook_selections_unique
    unique (user_id, subject_id, academic_year, semester),
  constraint student_textbook_edition_subject_fkey
    foreign key (textbook_edition_id, subject_id)
    references public.textbook_editions(id, subject_id) on delete restrict
);

create index if not exists student_textbook_selections_user_idx
  on public.student_textbook_selections (user_id, academic_year, semester);
create index if not exists student_textbook_selections_subject_id_idx
  on public.student_textbook_selections (subject_id);
create index if not exists student_textbook_selections_edition_subject_idx
  on public.student_textbook_selections (textbook_edition_id, subject_id);

create schema if not exists private;
create or replace function private.validate_student_textbook_selection()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  student_stage text;
  student_grade smallint;
  edition_stage text;
  edition_grade smallint;
  edition_year smallint;
begin
  select sp.education_stage, sp.grade
    into student_stage, student_grade
  from public.student_profiles sp
  where sp.user_id = new.user_id;

  select te.education_stage, te.grade, te.academic_year
    into edition_stage, edition_grade, edition_year
  from public.textbook_editions te
  where te.id = new.textbook_edition_id
    and te.subject_id = new.subject_id
    and te.is_active = true;

  if student_stage is null or student_grade is null then
    raise exception 'Please complete your education stage and grade before choosing a textbook.';
  end if;
  if edition_stage is null or edition_stage <> student_stage or edition_grade <> student_grade then
    raise exception 'The selected textbook does not match the student stage and grade.';
  end if;
  if edition_year <> new.academic_year then
    raise exception 'The selected textbook academic year does not match the selection year.';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_student_textbook_selection() from public, anon, authenticated;
drop trigger if exists validate_student_textbook_selection_before_write on public.student_textbook_selections;
create trigger validate_student_textbook_selection_before_write
before insert or update on public.student_textbook_selections
for each row execute function private.validate_student_textbook_selection();

alter table public.textbook_publishers enable row level security;
alter table public.textbook_editions enable row level security;
alter table public.curriculum_units enable row level security;
alter table public.knowledge_points enable row level security;
alter table public.unit_knowledge_points enable row level security;
alter table public.learning_tags enable row level security;
alter table public.knowledge_point_tags enable row level security;
alter table public.student_textbook_selections enable row level security;

drop policy if exists "authenticated users can read active textbook publishers" on public.textbook_publishers;
create policy "authenticated users can read active textbook publishers"
on public.textbook_publishers for select to authenticated using (is_active = true);

drop policy if exists "authenticated users can read active textbook editions" on public.textbook_editions;
create policy "authenticated users can read active textbook editions"
on public.textbook_editions for select to authenticated using (is_active = true);

drop policy if exists "authenticated users can read active curriculum units" on public.curriculum_units;
create policy "authenticated users can read active curriculum units"
on public.curriculum_units for select to authenticated using (is_active = true);

drop policy if exists "authenticated users can read active knowledge points" on public.knowledge_points;
create policy "authenticated users can read active knowledge points"
on public.knowledge_points for select to authenticated using (is_active = true);

drop policy if exists "authenticated users can read unit knowledge point links" on public.unit_knowledge_points;
create policy "authenticated users can read unit knowledge point links"
on public.unit_knowledge_points for select to authenticated
using (
  exists (select 1 from public.curriculum_units u where u.id = unit_id and u.is_active = true)
  and exists (select 1 from public.knowledge_points kp where kp.id = knowledge_point_id and kp.is_active = true)
);

drop policy if exists "authenticated users can read active learning tags" on public.learning_tags;
create policy "authenticated users can read active learning tags"
on public.learning_tags for select to authenticated using (is_active = true);

drop policy if exists "authenticated users can read knowledge point tags" on public.knowledge_point_tags;
create policy "authenticated users can read knowledge point tags"
on public.knowledge_point_tags for select to authenticated
using (exists (select 1 from public.knowledge_points kp where kp.id = knowledge_point_id and kp.is_active = true));

drop policy if exists "users read own textbook selections" on public.student_textbook_selections;
create policy "users read own textbook selections"
on public.student_textbook_selections for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "users insert own textbook selections" on public.student_textbook_selections;
create policy "users insert own textbook selections"
on public.student_textbook_selections for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "users update own textbook selections" on public.student_textbook_selections;
create policy "users update own textbook selections"
on public.student_textbook_selections for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "users delete own textbook selections" on public.student_textbook_selections;
create policy "users delete own textbook selections"
on public.student_textbook_selections for delete to authenticated using (user_id = (select auth.uid()));

revoke insert, update, delete on public.textbook_publishers,
  public.textbook_editions, public.curriculum_units, public.knowledge_points,
  public.unit_knowledge_points, public.learning_tags, public.knowledge_point_tags
from anon, authenticated;

grant select on public.textbook_publishers, public.textbook_editions,
  public.curriculum_units, public.knowledge_points, public.unit_knowledge_points,
  public.learning_tags, public.knowledge_point_tags to authenticated;
grant select, insert, update, delete on public.student_textbook_selections to authenticated;

insert into public.textbook_publishers (slug, name) values
  ('kang-hsuan', '康軒'), ('hanlin', '翰林'), ('nani', '南一')
on conflict (slug) do update set name = excluded.name;

insert into public.learning_tags (slug, name, tag_type, description) values
  ('problem-solving', '解題能力', 'ability', '理解題意、選擇策略並完成解題。'),
  ('reading-comprehension', '閱讀理解', 'ability', '擷取資訊、推論與整合文本內容。'),
  ('calculation', '計算能力', 'ability', '正確運用數字、符號與運算程序。'),
  ('logical-reasoning', '邏輯推理', 'ability', '依據條件建立關係並提出合理推論。'),
  ('application', '生活應用', 'ability', '將學科概念應用於生活情境。'),
  ('observation', '觀察與辨識', 'ability', '觀察現象、辨識特徵與關鍵線索。'),
  ('remember', '記憶', 'cognitive', '提取已學習的知識與概念。'),
  ('understand', '理解', 'cognitive', '解釋概念、規則及其關係。'),
  ('apply', '應用', 'cognitive', '運用所學解決題目或情境問題。'),
  ('analyze', '分析', 'cognitive', '拆解資訊、比較異同並建立關聯。'),
  ('basic', '基礎', 'difficulty', '基礎知識與單一步驟練習。'),
  ('intermediate', '進階', 'difficulty', '多個概念或步驟的整合練習。'),
  ('advanced', '挑戰', 'difficulty', '高層次推理、跨單元或複合情境練習。')
on conflict (slug) do update
set name = excluded.name, tag_type = excluded.tag_type, description = excluded.description;

commit;
