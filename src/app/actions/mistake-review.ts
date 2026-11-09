"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const SUBJECT_IDS = ["chinese", "english", "math", "science", "social"];

export async function createMistakeReviewSet(formData: FormData) {
  const subjectId = String(formData.get("subject_id") ?? "");
  if (!SUBJECT_IDS.includes(subjectId)) redirect("/dashboard/practice/mistakes?error=subject");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: mistakes, error: mistakesError } = await admin
    .from("practice_attempt_answers")
    .select("question_id, practice_set_id, recorded_at")
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .eq("is_correct", false)
    .order("recorded_at", { ascending: false })
    .limit(500);

  if (mistakesError) redirect("/dashboard/practice/mistakes?error=load");
  const uniqueQuestionIds: string[] = [];
  const seen = new Set<string>();
  for (const item of mistakes ?? []) {
    if (!seen.has(item.question_id)) {
      seen.add(item.question_id);
      uniqueQuestionIds.push(item.question_id);
    }
    if (uniqueQuestionIds.length >= 10) break;
  }

  if (!uniqueQuestionIds.length || !mistakes?.length) {
    redirect("/dashboard/practice/mistakes?error=no-mistakes");
  }

  const sourceSetId = mistakes[0].practice_set_id;
  const [{ data: sourceSet }, { data: subject }, { data: questions }] = await Promise.all([
    admin
      .from("practice_sets")
      .select("school_id, subject_id, education_stage, grade, academic_year, semester, textbook_edition_id, school_name_snapshot, textbook_publisher_label, textbook_source_url")
      .eq("id", sourceSetId)
      .eq("user_id", user.id)
      .maybeSingle(),
    admin.from("subjects").select("name").eq("id", subjectId).maybeSingle(),
    admin
      .from("practice_questions")
      .select("id, stem, options, correct_answer, explanation, concept, difficulty_level")
      .in("id", uniqueQuestionIds),
  ]);

  if (!sourceSet || sourceSet.subject_id !== subjectId || !questions?.length) {
    redirect("/dashboard/practice/mistakes?error=load");
  }

  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const orderedQuestions = uniqueQuestionIds
    .map((id) => questionMap.get(id))
    .filter((question): question is NonNullable<typeof question> => Boolean(question));

  if (!orderedQuestions.length) redirect("/dashboard/practice/mistakes?error=no-mistakes");

  const scopeText = "依據最近作答錯誤，重新練習" + (subject?.name ?? subjectId) + "的常錯觀念";
  const { data: reviewSet, error: setError } = await admin
    .from("practice_sets")
    .insert({
      user_id: user.id,
      school_id: sourceSet.school_id,
      subject_id: subjectId,
      education_stage: sourceSet.education_stage,
      grade: sourceSet.grade,
      academic_year: sourceSet.academic_year,
      semester: sourceSet.semester,
      textbook_edition_id: sourceSet.textbook_edition_id,
      school_name_snapshot: sourceSet.school_name_snapshot,
      textbook_publisher_label: sourceSet.textbook_publisher_label,
      textbook_source_url: sourceSet.textbook_source_url,
      scope_text: scopeText,
      title: (subject?.name ?? subjectId) + "錯題再挑戰",
      teacher_note: "本題本由你先前答錯的題目自動整理而成，重新作答後可比較後續學習表現。",
      difficulty_level: "mixed",
      question_count: orderedQuestions.length,
      model: "mistake-review-copy-v1",
      generation_source: "mistake_review",
    })
    .select("id")
    .single();

  if (setError || !reviewSet) redirect("/dashboard/practice/mistakes?error=save");

  const rows = orderedQuestions.map((question, index) => ({
    practice_set_id: reviewSet.id,
    sort_order: index + 1,
    question_type: "single_choice" as const,
    stem: question.stem,
    options: question.options,
    correct_answer: question.correct_answer,
    explanation: question.explanation,
    concept: question.concept,
    difficulty_level: question.difficulty_level,
  }));

  const { error: questionError } = await admin.from("practice_questions").insert(rows);
  if (questionError) {
    await admin.from("practice_sets").delete().eq("id", reviewSet.id).eq("user_id", user.id);
    redirect("/dashboard/practice/mistakes?error=save");
  }

  redirect("/dashboard/practice/" + reviewSet.id);
}
