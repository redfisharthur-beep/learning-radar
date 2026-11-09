-- Tighten default SQL privileges for future application objects.
-- This applies to objects created by the postgres migration owner.

begin;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;

commit;
