-- AI-generated practice sets, per-question records, and private student attempts.
begin;

create table if not exists public.practice_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  subject_id text not null references public.subjects(id) on delete restrict,
  education_stage text not null check (education_stage in ('elementary', 'junior_high')),
  grade smallint not null,
  academic_year smallint not null,
  semester smallint not null check (semester in (1, 2)),
  textbook_edition_id uuid references public.textbook_editions(id) on delete set null,
  school_name_snapshot text,
  textbook_publisher_label text,
  textbook_source_url text,
  scope_text text not null check (char_length(scope_text) between 5 and 500),
  title text not null,
  teacher_note text not null default '',
  difficulty_level text not null check (difficulty_level in ('basic', 'intermediate', 'advanced', 'mixed')),
  question_count smallint not null check (question_count in (5, 10)),
  model text not null,
  input_tokens integer,
  output_tokens integer,
  generation_source text not null default 'ai_generated' check (generation_source = 'ai_generated'),
  created_at timestamptz not null default now(),
  constraint practice_set_grade_check check (
    (education_stage = 'elementary' and grade between 1 and 6) or
    (education_stage = 'junior_high' and grade between 7 and 9)
  )
);

alter table public.practice_sets
  add column if not exists textbook_source_url text,
  add column if not exists input_tokens integer,
  add column if not exists output_tokens integer,
  add column if not exists teacher_note text not null default '';

create index if not exists practice_sets_user_created_idx
  on public.practice_sets (user_id, created_at desc);
create index if not exists practice_sets_user_subject_idx
  on public.practice_sets (user_id, subject_id, created_at desc);

create table if not exists public.practice_questions (
  id uuid primary key default gen_random_uuid(),
  practice_set_id uuid not null references public.practice_sets(id) on delete cascade,
  sort_order smallint not null,
  question_type text not null default 'single_choice' check (question_type = 'single_choice'),
  stem text not null check (char_length(stem) between 5 and 2000),
  options jsonb not null check (
    jsonb_typeof(options) = 'object'
    and options ? 'A' and options ? 'B' and options ? 'C' and options ? 'D'
  ),
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D')),
  explanation text not null check (char_length(explanation) between 5 and 3000),
  concept text not null check (char_length(concept) between 1 and 120),
  difficulty_level text not null check (difficulty_level in ('basic', 'intermediate', 'advanced')),
  created_at timestamptz not null default now(),
  constraint practice_questions_order_unique unique (practice_set_id, sort_order)
);

create index if not exists practice_questions_set_order_idx
  on public.practice_questions (practice_set_id, sort_order);

create table if not exists public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  practice_set_id uuid not null references public.practice_sets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  correct_count smallint not null check (correct_count >= 0),
  total_count smallint not null check (total_count > 0 and correct_count <= total_count),
  score numeric(5,2) not null check (score between 0 and 100),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists practice_attempts_user_completed_idx
  on public.practice_attempts (user_id, completed_at desc);
create index if not exists practice_attempts_set_completed_idx
  on public.practice_attempts (practice_set_id, completed_at desc);

alter table public.practice_sets enable row level security;
alter table public.practice_questions enable row level security;
alter table public.practice_attempts enable row level security;

drop policy if exists "users manage own practice sets" on public.practice_sets;
create policy "users manage own practice sets"
on public.practice_sets for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "users read own practice questions" on public.practice_questions;
create policy "users read own practice questions"
on public.practice_questions for select to authenticated
using (
  exists (
    select 1 from public.practice_sets ps
    where ps.id = practice_set_id
      and ps.user_id = (select auth.uid())
  )
);

drop policy if exists "users insert questions into own practice sets" on public.practice_questions;
create policy "users insert questions into own practice sets"
on public.practice_questions for insert to authenticated
with check (
  exists (
    select 1 from public.practice_sets ps
    where ps.id = practice_set_id
      and ps.user_id = (select auth.uid())
  )
);

drop policy if exists "users delete questions from own practice sets" on public.practice_questions;
create policy "users delete questions from own practice sets"
on public.practice_questions for delete to authenticated
using (
  exists (
    select 1 from public.practice_sets ps
    where ps.id = practice_set_id
      and ps.user_id = (select auth.uid())
  )
);

drop policy if exists "users read own practice attempts" on public.practice_attempts;
create policy "users read own practice attempts"
on public.practice_attempts for select to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.practice_sets ps
    where ps.id = practice_set_id
      and ps.user_id = (select auth.uid())
  )
);

drop policy if exists "users create own practice attempts" on public.practice_attempts;
create policy "users create own practice attempts"
on public.practice_attempts for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.practice_sets ps
    where ps.id = practice_set_id
      and ps.user_id = (select auth.uid())
  )
);

revoke all on public.practice_sets, public.practice_questions, public.practice_attempts from anon, authenticated;
grant select, insert, update, delete on public.practice_sets to authenticated;
grant select, insert, delete on public.practice_questions to authenticated;
grant select, insert on public.practice_attempts to authenticated;

commit;
