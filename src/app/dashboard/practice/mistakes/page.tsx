import Link from "next/link";
import { redirect } from "next/navigation";
import { createMistakeReviewSet } from "@/app/actions/mistake-review";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const LETTERS = ["A", "B", "C", "D"] as const;

function getOptions(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const options = value as Record<string, unknown>;
  return Object.fromEntries(LETTERS.map((letter) => [letter, String(options[letter] ?? "")]));
}

export default async function MistakeAnalysisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const admin = createAdminClient();

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: answers }, { data: subjects }] = await Promise.all([
    admin
      .from("practice_attempt_answers")
      .select("attempt_id, practice_set_id, question_id, subject_id, concept, selected_answer, correct_answer, is_correct, recorded_at")
      .eq("user_id", user.id)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: false })
      .limit(5000),
    supabase.from("subjects").select("id, name").order("sort_order"),
  ]);

  const rows = answers ?? [];
  const subjectNames = new Map((subjects ?? []).map((item) => [item.id, item.name]));
  const totalWrong = rows.filter((item) => !item.is_correct).length;
  const totalQuestions = rows.length;
  const totalCorrect = totalQuestions - totalWrong;
  const accuracy = totalQuestions ? totalCorrect / totalQuestions * 100 : 0;

  const subjectIds = [...new Set(rows.filter((item) => !item.is_correct).map((item) => item.subject_id))];
  const subjectGroups = subjectIds.map((subjectId) => {
    const subjectRows = rows.filter((item) => item.subject_id === subjectId);
    const wrongRows = subjectRows.filter((item) => !item.is_correct);
    const conceptMap = new Map<string, { attempts: number; wrong: number; latest: string }>();
    for (const item of subjectRows) {
      const concept = item.concept || "未分類觀念";
      const current = conceptMap.get(concept) ?? { attempts: 0, wrong: 0, latest: item.recorded_at };
      current.attempts += 1;
      if (!item.is_correct) current.wrong += 1;
      if (item.recorded_at > current.latest) current.latest = item.recorded_at;
      conceptMap.set(concept, current);
    }
    const concepts = [...conceptMap.entries()]
      .map(([concept, stats]) => ({ concept, ...stats, accuracy: stats.attempts ? (stats.attempts - stats.wrong) / stats.attempts * 100 : 0 }))
      .filter((item) => item.wrong > 0)
      .sort((a, b) => b.wrong - a.wrong || a.accuracy - b.accuracy)
      .slice(0, 8);
    return {
      subjectId,
      subjectName: subjectNames.get(subjectId) ?? subjectId,
      attempts: subjectRows.length,
      wrong: wrongRows.length,
      accuracy: subjectRows.length ? (subjectRows.length - wrongRows.length) / subjectRows.length * 100 : 0,
      uniqueWrongQuestions: new Set(wrongRows.map((item) => item.question_id)).size,
      repeatedConcepts: concepts.filter((item) => item.wrong >= 2).length,
      concepts,
    };
  }).sort((a, b) => b.wrong - a.wrong);

  const wrongRows = rows.filter((item) => !item.is_correct).slice(0, 40);
  const questionIds = [...new Set(wrongRows.map((item) => item.question_id))];
  const { data: questions } = questionIds.length
    ? await admin
        .from("practice_questions")
        .select("id, stem, options, explanation, concept")
        .in("id", questionIds)
    : { data: [] };
  const questionMap = new Map((questions ?? []).map((item) => [item.id, item]));
  const uniqueWrong = new Set(rows.filter((item) => !item.is_correct).map((item) => item.question_id));

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">← 返回學習首頁</Link>
      <header className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-widest text-blue-700">LEARNING RADAR</p>
          <h1 className="mt-2 text-3xl font-bold">錯題分析</h1>
          <p className="mt-2 text-slate-600">分析最近 90 天的逐題作答，找出常錯觀念與需要再次練習的題目。</p>
        </div>
        <Link href="/dashboard/progress" className="rounded-xl border bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">查看學習歷程 →</Link>
      </header>

      {totalQuestions === 0 ? (
        <section className="mt-8 rounded-2xl border bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">目前還沒有錯題分析資料</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">完成練習並送出答案後，系統會逐題記錄對錯與觀念，接著自動整理弱點。</p>
          <Link href="/dashboard/practice/new" className="mt-5 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">開始練習</Link>
        </section>
      ) : (
        <>
          <section className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-slate-500">累積作答</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{totalQuestions}<span className="ml-1 text-sm font-normal text-slate-500">題</span></p>
            </div>
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-slate-500">錯誤作答</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-red-700">{totalWrong}<span className="ml-1 text-sm font-normal text-slate-500">題次</span></p>
              <p className="mt-1 text-xs text-slate-500">涉及 {uniqueWrong.size} 道不同題目</p>
            </div>
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-slate-500">整體答對率</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{accuracy.toFixed(1)}<span className="ml-1 text-sm font-normal text-slate-500">%</span></p>
            </div>
          </section>

          {subjectGroups.length === 0 ? (
            <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
              <h2 className="font-semibold text-green-900">目前沒有錯題！</h2>
              <p className="mt-1 text-sm text-green-800">這段期間的作答紀錄全部答對，繼續保持。</p>
            </section>
          ) : (
            <section className="mt-8">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div><h2 className="text-xl font-bold">各科弱點整理</h2><p className="mt-1 text-sm text-slate-500">依答錯次數排序；同一觀念重複答錯會特別標示。</p></div>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {subjectGroups.map((group) => (
                  <section key={group.subjectId} className="rounded-2xl border bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div><h3 className="text-lg font-bold">{group.subjectName}</h3><p className="mt-1 text-xs text-slate-500">答對率 {group.accuracy.toFixed(1)}% · 答錯 {group.wrong}/{group.attempts} 題次</p></div>
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800">{group.uniqueWrongQuestions} 道錯題</span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {group.concepts.map((concept) => (
                        <div key={concept.concept} className="rounded-xl bg-slate-50 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold leading-6">{concept.concept}</p>
                            {concept.wrong >= 2 && <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-800">重複答錯</span>}
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                            <span>答錯 {concept.wrong}/{concept.attempts} 次</span>
                            <span>此觀念答對率 {concept.accuracy.toFixed(0)}%</span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                            <div className="h-full rounded-full bg-red-500" style={{ width: (100 - concept.accuracy) + "%" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <form action={createMistakeReviewSet} className="mt-4">
                      <input type="hidden" name="subject_id" value={group.subjectId} />
                      <button className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-100">
                        重新練習這科最近答錯的題目（最多 10 題）
                      </button>
                    </form>
                  </section>
                ))}
              </div>
            </section>
          )}

          {wrongRows.length > 0 && (
            <section className="mt-8 rounded-2xl border bg-white p-6">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div><h2 className="text-xl font-bold">最近答錯的題目</h2><p className="mt-1 text-sm text-slate-500">最多顯示 40 筆，可回到原題查看完整解析。</p></div>
                <span className="text-xs text-slate-500">依時間由新到舊</span>
              </div>
              <div className="mt-4 space-y-3">
                {wrongRows.map((row, index) => {
                  const question = questionMap.get(row.question_id);
                  if (!question) return null;
                  const options = getOptions(question.options);
                  return (
                    <article key={row.attempt_id + "-" + row.question_id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-red-700">{subjectNames.get(row.subject_id) ?? row.subject_id} · {row.concept}</span>
                        <span className="text-xs text-slate-400">{new Date(row.recorded_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}</span>
                      </div>
                      <p className="mt-2 font-medium leading-7">{question.stem}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">你的答案：{row.selected_answer}. {options[row.selected_answer as keyof typeof options] ?? ""}</p>
                        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">正確答案：{row.correct_answer}. {options[row.correct_answer as keyof typeof options] ?? ""}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-slate-500">此題答錯，建議複習「{question.concept}」</p>
                        <Link href={"/dashboard/practice/" + row.practice_set_id + "?result=" + row.attempt_id} className="text-sm font-semibold text-blue-700 hover:underline">查看原題解析 →</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
