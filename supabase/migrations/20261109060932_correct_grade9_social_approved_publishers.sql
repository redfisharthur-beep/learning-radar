-- Correct 115 academic-year Junior High Social Studies approved publishers.
-- Grade 7-8 include 南一、南億興業、康軒、翰林; Grade 9 includes 南一、康軒、翰林.
update public.textbook_editions te
set is_active = false
from public.textbook_publishers p
where te.publisher_id = p.id
  and p.slug = 'nan-yi-publishing'
  and te.education_stage = 'junior_high'
  and te.subject_id = 'social'
  and te.grade = 9
  and te.academic_year = 115
  and te.is_active = true;
