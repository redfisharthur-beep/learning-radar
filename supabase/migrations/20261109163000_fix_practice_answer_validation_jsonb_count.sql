-- Fix answer-count validation in the before-insert score trigger.
create or replace function private.recalculate_practice_attempt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actual_total integer;
  actual_correct integer;
  provided_answer_count integer;
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

  if jsonb_typeof(new.answers) <> 'object' then
    raise exception 'Answers must be a JSON object.';
  end if;

  select count(*)::integer
    into provided_answer_count
  from jsonb_object_keys(new.answers);

  if provided_answer_count <> actual_total then
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
