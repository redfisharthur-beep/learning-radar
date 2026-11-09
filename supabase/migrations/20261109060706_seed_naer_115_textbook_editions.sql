-- 115 academic-year approved textbook publishers and semester volume metadata.
-- Source: National Academy for Educational Research, "115 學年度國民小學及國民中學審定本教科用書清冊"
-- Published 115-05-04; latest listed update for this snapshot: 115-05-25.
-- This stores approved publisher options, not an assertion about each school's actual adoption.
begin;

alter table public.textbook_editions
  add column if not exists volume_no smallint not null default 1;

alter table public.textbook_editions
  drop constraint if exists textbook_edition_volume_check;
alter table public.textbook_editions
  add constraint textbook_edition_volume_check check (volume_no in (1, 2));

create index if not exists textbook_editions_grade_subject_volume_idx
  on public.textbook_editions (education_stage, grade, subject_id, academic_year, volume_no)
  where is_active = true;

insert into public.textbook_publishers (slug, name) values
  ('hess', '何嘉仁'),
  ('joy', '佳音'),
  ('nan-yi-publishing', '南億興業')
on conflict (slug) do update set name = excluded.name;

with subject_publishers as (
  select * from (values
    ('elementary'::text, 'chinese'::text, 1, 6, array['nani','kang-hsuan','hanlin']::text[]),
    ('elementary', 'english', 3, 6, array['hess','kang-hsuan','hanlin']::text[]),
    ('elementary', 'math', 1, 6, array['nani','kang-hsuan','hanlin']::text[]),
    ('elementary', 'social', 3, 6, array['nani','kang-hsuan','hanlin']::text[]),
    ('elementary', 'science', 3, 6, array['nani','kang-hsuan','hanlin']::text[]),
    ('junior_high', 'chinese', 7, 9, array['nani','kang-hsuan','hanlin']::text[]),
    ('junior_high', 'english', 7, 9, array['joy','nani','kang-hsuan']::text[]),
    ('junior_high', 'math', 7, 9, array['nani','kang-hsuan','hanlin']::text[]),
    ('junior_high', 'social', 7, 9, array['nani','nan-yi-publishing','kang-hsuan','hanlin']::text[]),
    ('junior_high', 'science', 7, 9, array['nani','kang-hsuan','hanlin']::text[])
  ) as v(education_stage, subject_id, min_grade, max_grade, publisher_slugs)
),
expanded as (
  select
    sp.education_stage,
    g.grade,
    sp.subject_id,
    pub.id as publisher_id,
    volume.volume_no,
    case volume.volume_no when 1 then '第一冊' else '第二冊' end as edition_name
  from subject_publishers sp
  cross join lateral generate_series(sp.min_grade, sp.max_grade) as g(grade)
  cross join lateral generate_series(1, 2) as volume(volume_no)
  cross join lateral unnest(sp.publisher_slugs) as slugs(slug)
  join public.textbook_publishers pub on pub.slug = slugs.slug
)
insert into public.textbook_editions
  (publisher_id, education_stage, grade, subject_id, academic_year,
   edition_name, series_name, volume_no, is_active)
select
  publisher_id, education_stage, grade, subject_id, 115,
  edition_name, '國家教育研究院 115 學年度審定本清冊（115.05.25版）', volume_no, true
from expanded
on conflict (publisher_id, education_stage, grade, subject_id, academic_year, edition_name)
do update set
  series_name = excluded.series_name,
  volume_no = excluded.volume_no,
  is_active = true;

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
  edition_volume_no smallint;
begin
  select sp.education_stage, sp.grade
    into student_stage, student_grade
  from public.student_profiles sp
  where sp.user_id = new.user_id;

  select te.education_stage, te.grade, te.academic_year, te.volume_no
    into edition_stage, edition_grade, edition_year, edition_volume_no
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
  if edition_volume_no <> new.semester then
    raise exception 'The selected textbook volume does not match the selected semester.';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_student_textbook_selection() from public, anon, authenticated;

commit;
