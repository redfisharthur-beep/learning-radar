"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_ANSWERS = ["A", "B", "C", "D"];

export async function submitPracticeAttempt(formData: FormData) {
  const setId = String(formData.get("practice_set_id") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(setId)) {
    redirect("/dashboard/practice?error=invalid");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const admin = createAdminClient();

  const [{ data: practiceSet }, { data: questions }] = await Promise.all([
    admin
      .from("practice_sets")
      .select("id")
      .eq("id", setId)
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("practice_questions")
      .select("id, correct_answer")
      .eq("practice_set_id", setId)
      .order("sort_order"),
  ]);

  if (!practiceSet || !questions?.length) redirect("/dashboard/practice?error=not-found");

  const answers: Record<string, string> = {};
  let correctCount = 0;

  for (const question of questions) {
    const answer = String(formData.get("answer_" + question.id) ?? "");
    if (!VALID_ANSWERS.includes(answer)) {
      redirect("/dashboard/practice/" + setId + "?error=incomplete");
    }
    answers[question.id] = answer;
    if (answer === question.correct_answer) correctCount += 1;
  }

  const score = Number(((correctCount / questions.length) * 100).toFixed(2));
  const { data: attempt, error } = await admin
    .from("practice_attempts")
    .insert({
      practice_set_id: setId,
      user_id: user.id,
      answers,
      correct_count: correctCount,
      total_count: questions.length,
      score,
    })
    .select("id")
    .single();

  if (error || !attempt) redirect("/dashboard/practice/" + setId + "?error=save");
  redirect("/dashboard/practice/" + setId + "?result=" + attempt.id);
}
