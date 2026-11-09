-- Preserve a school's original textbook publisher label while mapping to an approved edition.
begin;

alter table public.school_textbook_adoptions
  add column if not exists source_publisher_label text,
  add column if not exists mapping_note text;

update public.school_textbook_adoptions a
set source_publisher_label = case
  when a.grade = 7 and a.subject_id = 'chinese' then '康軒'
  when a.grade = 7 and a.subject_id = 'english' then '翰林'
  when a.grade = 7 and a.subject_id = 'math' then '翰林'
  when a.grade = 7 and a.subject_id = 'science' then '康軒'
  when a.grade = 7 and a.subject_id = 'social' then '翰林'
  when a.grade = 8 and a.subject_id = 'chinese' then '南一'
  when a.grade = 8 and a.subject_id = 'english' then '康軒'
  when a.grade = 8 and a.subject_id = 'math' then '南一'
  when a.grade = 8 and a.subject_id = 'science' then '翰林'
  when a.grade = 8 and a.subject_id = 'social' then '翰林'
  when a.grade = 9 and a.subject_id = 'chinese' then '翰林'
  when a.grade = 9 and a.subject_id = 'english' then '翰林'
  when a.grade = 9 and a.subject_id = 'math' then '康軒'
  when a.grade = 9 and a.subject_id = 'science' then '翰林'
  when a.grade = 9 and a.subject_id = 'social' then '翰林'
  else a.source_publisher_label
end,
mapping_note = case
  when a.education_stage = 'junior_high'
   and a.subject_id = 'english'
   and a.grade in (7, 9)
  then '學校公告原文標示「翰林」；115 學年度國中英語審定清冊對應出版者為佳音。第三方 115 學年度國中英文版本整理註明「佳音為翰林的版本」，因此保留學校原始顯示名稱，教材 edition 對應佳音審定版本。'
  else a.mapping_note
end,
updated_at = now()
from public.schools s
where a.school_id = s.id
  and s.name = '市立安平國中'
  and a.academic_year = 115
  and a.is_active = true;

with missing_choices(grade, publisher_name, source_label) as (
  values (7::smallint, '佳音'::text, '翰林'::text),
         (9::smallint, '佳音'::text, '翰林'::text)
),
expanded as (
  select
    s.id as school_id,
    mc.grade,
    v.semester::smallint as semester,
    te.id as textbook_edition_id,
    mc.source_label
  from missing_choices mc
  join public.schools s on s.name = '市立安平國中' and s.is_active = true
  cross join generate_series(1, 2) as v(semester)
  join public.textbook_publishers p on p.name = mc.publisher_name
  join public.textbook_editions te
    on te.publisher_id = p.id
   and te.education_stage = 'junior_high'
   and te.grade = mc.grade
   and te.subject_id = 'english'
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
  school_id, 115, 'junior_high', grade, 'english', semester,
  textbook_edition_id, 'official_school',
  'https://schoolweb2.tn.edu.tw/~apjh_www/modules/school/index.php?content_id=402&department_id=2&page_id=13&type=news',
  '市立安平國中 115 學年度各年級教科書版本公告',
  date '2026-05-26', now(), 1.00, true,
  source_label,
  '學校公告原文標示「翰林」；115 學年度國中英語審定清冊對應出版者為佳音。第三方 115 學年度國中英文版本整理註明「佳音為翰林的版本」，因此保留學校原始顯示名稱，教材 edition 對應佳音審定版本。'
from expanded
on conflict (school_id, academic_year, grade, subject_id, semester)
do update set
  textbook_edition_id = excluded.textbook_edition_id,
  source_publisher_label = excluded.source_publisher_label,
  mapping_note = excluded.mapping_note,
  source_url = excluded.source_url,
  source_title = excluded.source_title,
  source_published_at = excluded.source_published_at,
  verified_at = excluded.verified_at,
  is_active = true,
  updated_at = now();

create table if not exists public.school_textbook_adoption_evidence (
  id uuid primary key default gen_random_uuid(),
  adoption_id uuid not null references public.school_textbook_adoptions(id) on delete cascade,
  source_role text not null check (
    source_role in ('official_school', 'oneclass', 'edubaania', 'publisher', 'third_party')
  ),
  source_url text not null,
  source_title text not null,
  observed_publisher_label text,
  agrees_with_school_notice boolean,
  notes text,
  checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint school_textbook_adoption_evidence_unique unique (adoption_id, source_role, source_url)
);

create index if not exists school_textbook_adoption_evidence_adoption_idx
  on public.school_textbook_adoption_evidence (adoption_id, checked_at desc);

alter table public.school_textbook_adoption_evidence enable row level security;
drop policy if exists "authenticated users can read textbook adoption evidence"
  on public.school_textbook_adoption_evidence;
create policy "authenticated users can read textbook adoption evidence"
on public.school_textbook_adoption_evidence for select to authenticated using (true);
revoke all on public.school_textbook_adoption_evidence from anon, authenticated;
grant select on public.school_textbook_adoption_evidence to authenticated;

insert into public.school_textbook_adoption_evidence (
  adoption_id, source_role, source_url, source_title,
  observed_publisher_label, agrees_with_school_notice, notes
)
select
  a.id,
  'official_school',
  a.source_url,
  a.source_title,
  a.source_publisher_label,
  true,
  '學校教務處 115 學年度教科書版本公告；學校公告為主要採用版本依據。'
from public.school_textbook_adoptions a
join public.schools s on s.id = a.school_id
where s.name = '市立安平國中'
  and a.academic_year = 115
  and a.is_active = true
on conflict (adoption_id, source_role, source_url)
do update set
  observed_publisher_label = excluded.observed_publisher_label,
  agrees_with_school_notice = excluded.agrees_with_school_notice,
  notes = excluded.notes,
  checked_at = now();

insert into public.school_textbook_adoption_evidence (
  adoption_id, source_role, source_url, source_title,
  observed_publisher_label, agrees_with_school_notice, notes
)
select
  a.id,
  'third_party',
  'https://baxterenglish.com/schools/textbooks/?g=junior',
  'BaxterEnglish 115 學年度國中英文各校版本對照',
  case a.grade when 7 then '翰林' when 8 then '康軒' when 9 then '翰林' end,
  true,
  '第三方頁面列出安平國中七、八、九年級英文版本為翰林／康軒／翰林，並說明佳音歸入翰林版本；用作英文出版社名稱對照，學校公告仍為主要依據。'
from public.school_textbook_adoptions a
join public.schools s on s.id = a.school_id
where s.name = '市立安平國中'
  and a.academic_year = 115
  and a.subject_id = 'english'
  and a.grade in (7, 8, 9)
  and a.semester = 1
  and a.is_active = true
on conflict (adoption_id, source_role, source_url)
do update set
  observed_publisher_label = excluded.observed_publisher_label,
  agrees_with_school_notice = excluded.agrees_with_school_notice,
  notes = excluded.notes,
  checked_at = now();

commit;
