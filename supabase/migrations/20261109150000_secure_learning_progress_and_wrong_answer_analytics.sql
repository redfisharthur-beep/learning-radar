-- Store one private row for every question answered so history and misconception analytics are evidence-based.
begin;

alter table public.practice_sets
  drop constraint if exists practice_sets_generation_source_check;
alter table public.practice_sets
  add constraint practice_sets_generation_source_check
  check (generation_source in ('ai_generated', 'mistake_review'));

create table if not exists public.practice_attempt_answers (
  attempt_id uuid not null references public.practice_attempts(id) on delete cascade,
  practice_set_id uuid not null references public.practice_sets(id) on delete cascade,
  question_id uuid not null references public.practice_questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_id text not null references public.subjects(id) on delete restrict,
  concept text not null,
  selected_answer text not null check (selected_answer in ('A', 'B', 'C', 'D')),
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D')),
  is_correct boolean not null,
  recorded_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

create index if not exists practice_attempt_answers_user_time_idx
  on public.practice_attempt_answers (user_id, recorded_at desc);
create index if not exists practice_attempt_answers_user_subject_idx
  on public.practice_attempt_answers (user_id, subject_id, recorded_at desc);
create index if not exists practice_attempt_answers_user_concept_idx
  on public.practice_attempt_answers (user_id, subject_id, concept, recorded_at desc);
create index if not exists practice_attempt_answers_user_wrong_idx
  on public.practice_attempt_answers (user_id, recorded_at desc)
  where is_correct = false;
create index if not exists practice_attempt_answers_question_idx
  on public.practice_attempt_answers (question_id, recorded_at desc);

alter table public.practice_attempt_answers enable row level security;
revoke all on public.practice_attempt_answers from anon, authenticated;
grant all on public.practice_attempt_answers to service_role;

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

commit;
