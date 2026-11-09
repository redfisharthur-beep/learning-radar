-- Prefer verified school textbook adoptions over legacy saved selections.
-- Manual selections remain available as explicit overrides after this migration.

begin;

alter table public.student_textbook_selections
  add column if not exists is_manual_override boolean not null default true;

with grade_seven_adoptions(subject_id, publisher_name) as (
  values
    ('chinese'::text, '翰林'::text),
    ('english'::text, '康軒'::text),
    ('math'::text, '翰林'::text),
    ('social'::text, '翰林'::text),
    ('science'::text, '翰林'::text)
),
expanded as (
  select
    s.id as school_id,
    g.subject_id,
    g.publisher_name,
    v.semester::smallint as semester,
    te.id as textbook_edition_id
  from grade_seven_adoptions g
  join public.schools s
    on s.name = '縣立秀水國中'
   and s.city = '彰化縣'
   and s.district = '秀水鄉'
   and s.is_active = true
  cross join generate_series(1, 2) as v(semester)
  join public.textbook_publishers p
    on p.name = g.publisher_name
   and p.is_active = true
  join public.textbook_editions te
    on te.publisher_id = p.id
   and te.education_stage = 'junior_high'
   and te.grade = 7
   and te.subject_id = g.subject_id
   and te.academic_year = 115
   and te.volume_no = v.semester
   and te.is_active = true
)
insert into public.school_textbook_adoptions (
  school_id, academic_year, education_stage, grade, subject_id, semester,
  textbook_edition_id, source_type, source_url, source_title,
  source_published_at, verified_at, confidence, is_active,
  source_publisher_label, mapping_note
)
select
  school_id,
  115,
  'junior_high',
  7,
  subject_id,
  semester,
  textbook_edition_id,
  'official_school',
  'https://hsjh.chc.edu.tw/contents/32/show',
  '彰化縣立秀水國中 115 學年度各年級教科書選用版本一覽表',
  null,
  now(),
  1.00,
  true,
  publisher_name,
  '學校公告按年級列示出版社，未另分學期；第 1 學期對應第一冊，第 2 學期對應第二冊。出版社依學校公告原文保留。'
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
  source_publisher_label = excluded.source_publisher_label,
  mapping_note = excluded.mapping_note,
  updated_at = now();

insert into public.school_textbook_adoption_evidence (
  adoption_id, source_role, source_url, source_title,
  observed_publisher_label, agrees_with_school_notice, notes, checked_at
)
select
  a.id,
  'official_school',
  'https://hsjh.chc.edu.tw/contents/32/show',
  '彰化縣立秀水國中 115 學年度各年級教科書選用版本一覽表',
  a.source_publisher_label,
  true,
  '學校官網公告直接列示七年級五科出版社；同一出版社依學期對應第一冊或第二冊。',
  now()
from public.school_textbook_adoptions a
join public.schools s on s.id = a.school_id
where s.name = '縣立秀水國中'
  and s.city = '彰化縣'
  and s.district = '秀水鄉'
  and a.academic_year = 115
  and a.education_stage = 'junior_high'
  and a.grade = 7
  and a.source_url = 'https://hsjh.chc.edu.tw/contents/32/show'
on conflict (adoption_id, source_role, source_url)
do update set
  source_title = excluded.source_title,
  observed_publisher_label = excluded.observed_publisher_label,
  agrees_with_school_notice = true,
  notes = excluded.notes,
  checked_at = now();

-- Existing saved choices were created before school adoption records were available.
-- Convert those legacy values to the verified school defaults; users can explicitly override later.
update public.student_textbook_selections sts
set
  textbook_edition_id = a.textbook_edition_id,
  is_manual_override = false,
  updated_at = now()
from public.student_profiles sp
join public.school_textbook_adoptions a
  on a.school_id = sp.school_id
 and a.academic_year = 115
 and a.education_stage = sp.education_stage
 and a.grade = sp.grade
 and a.is_active = true
where sts.user_id = sp.user_id
  and sts.subject_id = a.subject_id
  and sts.academic_year = a.academic_year
  and sts.semester = a.semester
  and sp.school_id = (
    select id from public.schools
    where name = '縣立秀水國中'
      and city = '彰化縣'
      and district = '秀水鄉'
    limit 1
  );

commit;
