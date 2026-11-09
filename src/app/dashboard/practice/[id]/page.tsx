import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { submitPracticeAttempt } from "@/app/actions/practice";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ result?: string; retry?: string; error?: string }>;
};

const letters = ["A", "B", "C", "D"] as const;

function getOptions(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const options = value as Record<string, unknown>;
  return Object.fromEntries(letters.map((letter) => [letter, String(options[letter] ?? "")]));
}

export default async function PracticeSetPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const admin = createAdminClient();

  const { data: practiceSet } = await admin
    .from("practice_sets")
    .select("id, title, subject_id, grade, education_stage, semester, academic_year, scope_text, teacher_note, question_count, generation_source, school_name_snapshot, textbook_publisher_label, textbook_source_url, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!practiceSet) notFound();

  const { data: subject } = await supabase.from("subjects").select("id, name").eq("id", practiceSet.subject_id).maybeSingle();

  let attempt: {
    id: string;
    answers: unknown;
    correct_count: number;
    total_count: number;
    score: number;
    completed_at: string;
  } | null = null;

  if (query.result && query.retry !== "1") {
    const { data } = await admin
      .from("practice_attempts")
      .select("id, answers, correct_count, total_count, score, completed_at")
      .eq("id", query.result)
      .eq("practice_set_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    attempt = data;
  }

  const questionsQuery = attempt
    ? admin
        .from("practice_questions")
        .select("id, sort_order, stem, options, correct_answer, explanation, concept, difficulty_level")
    : admin
        .from("practice_questions")
        .select("id, sort_order, stem, options, concept, difficulty_level");
  const { data: questions } = await questionsQuery
    .eq("practice_set_id", id)
    .order("sort_order");

  const answerMap = attempt?.answers && typeof attempt.answers === "object"
    ? attempt.answers as Record<string, string>
    : {};

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link href="/dashboard/practice" className="text-sm text-blue-700 hover:underline">← 題本紀錄</Link>
      <header className="mt-6">
        <p className="text-sm font-semibold tracking-widest text-blue-700">LEARNING RADAR</p>
        <h1 className="mt-2 text-3xl font-bold">{practiceSet.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {subject?.name ?? practiceSet.subject_id}｜{practiceSet.education_stage === "elementary" ? "國小" : ""}{practiceSet.grade} 年級｜{practiceSet.academic_year} 學年度第 {practiceSet.semester} 學期｜{practiceSet.question_count} 題
        </p>
      </header>

      <section className="mt-6 rounded-xl border bg-white p-4 text-sm leading-6 text-slate-600">
        <p><span className="font-semibold text-slate-800">複習範圍：</span>{practiceSet.scope_text}</p>
        {practiceSet.school_name_snapshot && <p className="mt-1"><span className="font-semibold text-slate-800">學校：</span>{practiceSet.school_name_snapshot}</p>}
        {practiceSet.textbook_publisher_label && <p className="mt-1"><span className="font-semibold text-slate-800">教材版本：</span>{practiceSet.textbook_publisher_label}</p>}
        {practiceSet.textbook_source_url && <a href={practiceSet.textbook_source_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-blue-700 underline">查看學校教材公告</a>}
        {practiceSet.teacher_note && <p className="mt-2 text-xs text-slate-500">{practiceSet.teacher_note}</p>}
        <p className="mt-2 text-xs text-amber-700">AI 原創練習題，非歷屆考古題；請以學校老師及正式教材為準。</p>
      </section>

      {query.error === "incomplete" && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">每一題都要選擇答案，才能送出批改。</p>
      )}
      {query.error === "save" && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">作答紀錄儲存失敗，請再試一次。</p>
      )}

      {attempt ? (
        <>
          <section className="mt-6 rounded-2xl bg-slate-900 p-6 text-white">
            <p className="text-sm text-slate-300">本次練習成績</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <span className="text-5xl font-bold tabular-nums">{Number(attempt.score).toFixed(0)}</span>
              <span className="pb-1 text-lg">分</span>
              <span className="pb-1 text-sm text-slate-300">{attempt.correct_count} / {attempt.total_count} 題答對</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              {Number(attempt.score) === 100 ? "太好了！全部答對，繼續保持。" : Number(attempt.score) >= 80 ? "表現不錯，再把錯題的觀念複習一次。" : "先看解析找出觀念缺口，再重新練習一次。"}
            </p>
          </section>
          <div className="mt-6 space-y-4">
            {(questions ?? []).map((question) => {
              const options = getOptions(question.options);
              const selected = answerMap[question.id];
              const correctAnswer = "correct_answer" in question ? String(question.correct_answer) : "";
              const explanation = "explanation" in question ? String(question.explanation) : "";
              const concept = String(question.concept ?? "");
              const isCorrect = selected === correctAnswer;
              return (
                <section key={question.id} className="rounded-2xl border bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold leading-7">{question.sort_order}. {question.stem}</h2>
                    <span className={isCorrect ? "shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800" : "shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800"}>
                      {isCorrect ? "答對" : "答錯"}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    {letters.map((letter) => (
                      <p key={letter} className={letter === correctAnswer ? "rounded-lg bg-green-50 px-3 py-2 text-green-900" : letter === selected ? "rounded-lg bg-red-50 px-3 py-2 text-red-800" : "rounded-lg bg-slate-50 px-3 py-2 text-slate-700"}>
                        <span className="mr-2 font-semibold">{letter}.</span>{options[letter]}
                        {letter === correctAnswer ? "（正確答案）" : letter === selected ? "（你的答案）" : ""}
                      </p>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm leading-7 text-blue-950">
                    <p className="font-semibold">觀念：{concept}</p>
                    <p className="mt-1">{explanation}</p>
                  </div>
                </section>
              );
            })}
          </div>
          <Link href={"/dashboard/practice/" + id + "?retry=1"} className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">再練習一次</Link>
        </>
      ) : (
        <form action={submitPracticeAttempt} className="mt-6 space-y-4">
          <input type="hidden" name="practice_set_id" value={id} />
          {(questions ?? []).map((question) => {
            const options = getOptions(question.options);
            const concept = String(question.concept ?? "");
            return (
              <fieldset key={question.id} className="rounded-2xl border bg-white p-5">
                <legend className="sr-only">第 {question.sort_order} 題</legend>
                <p className="font-semibold leading-7">{question.sort_order}. {question.stem}</p>
                {concept && <p className="mt-1 text-xs text-slate-500">練習觀念：{concept}</p>}
                <div className="mt-4 space-y-2">
                  {letters.map((letter) => (
                    <label key={letter} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50">
                      <input
                        type="radio"
                        name={"answer_" + question.id}
                        value={letter}
                        required
                        className="mt-1 h-4 w-4 accent-blue-700"
                      />
                      <span className="text-sm leading-6"><span className="mr-2 font-semibold">{letter}.</span>{options[letter]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
          <button className="w-full rounded-xl bg-blue-700 px-5 py-3.5 font-semibold text-white hover:bg-blue-800">送出答案並批改</button>
        </form>
      )}
    </main>
  );
}
