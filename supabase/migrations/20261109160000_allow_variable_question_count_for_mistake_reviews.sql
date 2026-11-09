alter table public.practice_sets
  drop constraint if exists practice_sets_question_count_check;

alter table public.practice_sets
  add constraint practice_sets_question_count_check
  check (question_count between 1 and 10);
