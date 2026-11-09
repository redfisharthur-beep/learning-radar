-- School-specific adopted textbook versions, sourced from published school notices.
begin;

create table if not exists public.school_textbook_adoptions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_year smallint not null,
  education_stage text not null check (education_stage in ('elementary', 'junior_high')),
  grade smallint not null,
  subject_id text not null references public.subjects(id) on delete restrict,
  semester smallint not null check (semester in (1, 2)),
  textbook_edition_id uuid not null,
  source_type text not null check (source_type in ('official_school', 'official_gov', 'third_party', 'manual')),
  source_url text not null,
  source_title text not null,
  source_published_at date,
  verified_at timestamptz not null default now(),
  confidence numeric(3,2) not null default 1.00 check (confidence >= 0 and confidence <= 1),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_textbook_adoptions_grade_check check (
    (education_stage = 'elementary' and grade between 1 and 6) or
    (education_stage = 'junior_high' and grade between 7 and 9)
  ),
  constraint school_textbook_adoptions_edition_subject_fkey
    foreign key (textbook_edition_id, subject_id)
    references public.textbook_editions(id, subject_id) on delete restrict,
  constraint school_textbook_adoptions_unique
    unique (school_id, academic_year, grade, subject_id, semester)
);

create index if not exists school_textbook_adoptions_lookup_idx
  on public.school_textbook_adoptions (school_id, academic_year, grade, semester, subject_id)
  where is_active = true;

create schema if not exists private;

create or replace function private.validate_school_textbook_adoption()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  school_level text;
  edition_stage text;
  edition_grade smallint;
  edition_year smallint;
  edition_volume smallint;
begin
  select s.school_level into school_level
  from public.schools s
  where s.id = new.school_id and s.is_active = true;

  if school_level is null then
    raise exception 'School not found or inactive.';
  end if;
  if school_level <> 'combined' and school_level <> new.education_stage then
    raise exception 'School stage does not match adoption stage.';
  end if;

  select te.education_stage, te.grade, te.academic_year, te.volume_no
    into edition_stage, edition_grade, edition_year, edition_volume
  from public.textbook_editions te
  where te.id = new.textbook_edition_id
    and te.subject_id = new.subject_id
    and te.is_active = true;

  if edition_stage is null
    or edition_stage <> new.education_stage
    or edition_grade <> new.grade
    or edition_year <> new.academic_year
    or edition_volume <> new.semester then
    raise exception 'Textbook edition does not match school, grade, year, subject or semester.';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_school_textbook_adoption() from public, anon, authenticated;
drop trigger if exists validate_school_textbook_adoption_before_write on public.school_textbook_adoptions;
create trigger validate_school_textbook_adoption_before_write
before insert or update on public.school_textbook_adoptions
for each row execute function private.validate_school_textbook_adoption();

alter table public.school_textbook_adoptions enable row level security;
drop policy if exists "authenticated users can read active school textbook adoptions"
  on public.school_textbook_adoptions;
create policy "authenticated users can read active school textbook adoptions"
on public.school_textbook_adoptions for select to authenticated
using (is_active = true);

revoke all on public.school_textbook_adoptions from anon, authenticated;
grant select on public.school_textbook_adoptions to authenticated;

-- Verified example imported from 市立安平國中 official 115 academic-year notice.
-- The source lists one adopted publisher per grade and subject; the same publisher
-- is mapped to volumes 1 and 2 for the corresponding semesters.
with adoption_choices(grade, subject_id, publisher_name) as (
  values
    (7, 'chinese', '康軒'),
    (7, 'english', '翰林'),
    (7, 'math', '翰林'),
    (7, 'science', '康軒'),
    (7, 'social', '翰林'),
    (8, 'chinese', '南一'),
    (8, 'english', '康軒'),
    (8, 'math', '南一'),
    (8, 'science', '翰林'),
    (8, 'social', '翰林'),
    (9, 'chinese', '翰林'),
    (9, 'english', '翰林'),
    (9, 'math', '康軒'),
    (9, 'science', '翰林'),
    (9, 'social', '翰林')
),
expanded as (
  select
    s.id as school_id,
    115::smallint as academic_year,
    'junior_high'::text as education_stage,
    ac.grade::smallint as grade,
    ac.subject_id,
    v.semester::smallint as semester,
    te.id as textbook_edition_id
  from adoption_choices ac
  join public.schools s on s.name = '市立安平國中'
  cross join generate_series(1, 2) as v(semester)
  join public.textbook_publishers p on p.name = ac.publisher_name
  join public.textbook_editions te
    on te.publisher_id = p.id
   and te.education_stage = 'junior_high'
   and te.grade = ac.grade
   and te.subject_id = ac.subject_id
   and te.academic_year = 115
   and te.volume_no = v.semester
   and te.is_active = true
)
insert into public.school_textbook_adoptions (
  school_id, academic_year, education_stage, grade, subject_id, semester,
  textbook_edition_id, source_type, source_url, source_title, source_published_at,
  verified_at, confidence, is_active
)
select
  school_id, academic_year, education_stage, grade, subject_id, semester,
  textbook_edition_id, 'official_school',
  'https://www.apjh.tn.edu.tw/modules/school/index.php?content_id=402&department_id=2&page_id=13&type=news',
  '市立安平國中 115 學年度各年級教科書版本',
  date '2026-05-26', now(), 1.00, true
from expanded
on conflict (school_id, academic_year, grade, subject_id, semester)
do update set
  textbook_edition_id = excluded.textbook_edition_id,
  source_type = excluded.source_type,
  source_url = excluded.source_url,
  source_title = excluded.source_title,
  source_published_at = excluded.source_published_at,
  verified_at = excluded.verified_at,
  confidence = excluded.confidence,
  is_active = true,
  updated_at = now();

commit;
