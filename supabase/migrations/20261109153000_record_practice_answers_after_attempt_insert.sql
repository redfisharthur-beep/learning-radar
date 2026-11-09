-- Persist question-level answers only after the parent attempt row exists.
begin;

create or replace function private.record_practice_attempt_answers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.practice_attempt_answers (
    attempt_id,
    practice_set_id,
    question_id,
    user_id,
    subject_id,
    concept,
    selected_answer,
    correct_answer,
    is_correct,
    recorded_at
  )
  select
    new.id,
    new.practice_set_id,
    q.id,
    new.user_id,
    ps.subject_id,
    coalesce(nullif(btrim(q.concept), ''), '未分類觀念'),
    new.answers ->> q.id::text,
    q.correct_answer,
    (new.answers ->> q.id::text = q.correct_answer),
    new.completed_at
  from public.practice_questions q
  join public.practice_sets ps on ps.id = q.practice_set_id
  where q.practice_set_id = new.practice_set_id;

  return new;
end;
$$;

revoke all on function private.record_practice_attempt_answers() from public, anon, authenticated;

drop trigger if exists record_practice_attempt_answers_after_insert on public.practice_attempts;
create trigger record_practice_attempt_answers_after_insert
after insert on public.practice_attempts
for each row execute function private.record_practice_attempt_answers();

commit;
