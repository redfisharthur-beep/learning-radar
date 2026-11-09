-- Index the optional school foreign key for efficient joins and deletes.
create index if not exists student_profiles_school_id_idx
on public.student_profiles (school_id)
where school_id is not null;
