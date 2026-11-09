-- Keep answer keys and attempt records server-only; recalculate scores in Postgres.
begin;

revoke all on public.practice_sets, public.practice_questions, public.practice_attempts from anon, authenticated;
grant select on public.practice_sets to authenticated;
grant insert on public.practice_attempts to authenticated;

create or replace function private.recalculate_practice_attempt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actual_total integer;
  actual_correct integer;
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null or new.user_id is distinct from current_user_id then
    raise exception 'Practice attempt user does not match authenticated user.';
  end if;

  if not exists (
    select 1
    from public.practice_sets ps
    where ps.id = new.practice_set_id
      and ps.user_id = current_user_id
  ) then
    raise exception 'Practice set does not belong to authenticated user.';
  end if;

  select count(*)::integer,
         count(*) filter (
           where new.answers ->> q.id::text = q.correct_answer
         )::integer
    into actual_total, actual_correct
  from public.practice_questions q
  where q.practice_set_id = new.practice_set_id;

  if actual_total = 0 then
    raise exception 'Practice set has no questions.';
  end if;

  if jsonb_typeof(new.answers) <> 'object'
     or jsonb_object_length(new.answers) <> actual_total then
    raise exception 'Please answer every question exactly once.';
  end if;

  if exists (
    select 1
    from jsonb_each_text(new.answers) answer
    where answer.value not in ('A', 'B', 'C', 'D')
       or not exists (
         select 1
         from public.practice_questions q
         where q.practice_set_id = new.practice_set_id
           and q.id::text = answer.key
       )
  ) then
    raise exception 'Invalid practice answer.';
  end if;

  new.total_count := actual_total;
  new.correct_count := actual_correct;
  new.score := round((actual_correct::numeric / actual_total::numeric) * 100, 2);
  new.completed_at := now();
  return new;
end;
$$;

revoke all on function private.recalculate_practice_attempt() from public, anon, authenticated;

drop trigger if exists recalculate_practice_attempt_before_insert on public.practice_attempts;
create trigger recalculate_practice_attempt_before_insert
before insert on public.practice_attempts
for each row execute function private.recalculate_practice_attempt();

commit;
