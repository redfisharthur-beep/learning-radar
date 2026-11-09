-- Tighten public API table privileges for anonymous and authenticated roles.
-- RLS policies still apply; this migration removes non-essential SQL privileges
-- such as TRUNCATE, TRIGGER and REFERENCES from application roles.

begin;

revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;

grant select on
  public.schools,
  public.subjects,
  public.user_roles,
  public.textbook_publishers,
  public.textbook_editions,
  public.curriculum_units,
  public.knowledge_points,
  public.unit_knowledge_points,
  public.learning_tags,
  public.knowledge_point_tags
to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update on public.student_profiles to authenticated;

grant select, insert, update, delete
on public.student_textbook_selections to authenticated;

commit;
