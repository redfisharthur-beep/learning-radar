import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DAYS = ["日", "一", "二", "三", "四", "五", "六"];

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export default async function LearningProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const admin = createAdminClient();

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: attempts }, { data: subjects }] = await Promise.all([
    admin
      .from("practice_attempts")
      .select("id, practice_set_id, correct_count, total_count, score, completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", since)
      .order("completed_at", { ascending: false })
      .limit(300),
    supabase.from("subjects").select("id, name").order("sort_order"),
  ]);

  const attemptRows = attempts ?? [];
  const setIds = [...new Set(attemptRows.map((item) => item.practice_set_id))];
  const [{ data: sets }, { data: profile }] = await Promise.all([
    setIds.length
      ? admin.from("practice_sets").select("id, subject_id, title, grade, education_stage").in("id", setIds)
      : Promise.resolve({ data: [] }),
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
  ]);

  const setMap = new Map((sets ?? []).map((item) => [item.id, item]));
  const subjectMap = new Map((subjects ?? []).map((item) => [item.id, item.name]));
  const totalAnswered = attemptRows.reduce((sum, item) => sum + item.total_count, 0);
  const totalCorrect = attemptRows.reduce((sum, item) => sum + item.correct_count, 0);
  const accuracy = totalAnswered ? totalCorrect / totalAnswered * 100 : 0;
  const averageScore = average(attemptRows.map((item) => Number(item.score)));
  const recentTen = attemptRows.slice(0, 10).map((item) => Number(item.score));
  const previousTen = attemptRows.slice(10, 20).map((item) => Number(item.score));
  const scoreChange = previousTen.length ? average(recentTen) - average(previousTen) : null;
  const studyDays = new Set(attemptRows.map((item) => item.completed_at.slice(0, 10))).size;

  const subjectStats = new Map<string, { attempts: number; questions: number; correct: number; scoreTotal: number }>();
  for (const attempt of attemptRows) {
    const set = setMap.get(attempt.practice_set_id);
    if (!set) continue;
    const current = subjectStats.get(set.subject_id) ?? { attempts: 0, questions: 0, correct: 0, scoreTotal: 0 };
    current.attempts += 1;
    current.questions += attempt.total_count;
    current.correct += attempt.correct_count;
    current.scoreTotal += Number(attempt.score);
    subjectStats.set(set.subject_id, current);
  }

  const today = new Date();
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const key = date.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
    const count = attemptRows.filter((item) => {
      const itemKey = new Date(item.completed_at).toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
      return itemKey === key;
    }).length;
    return { key, label: DAYS[date.getDay()], count };
  });
  const maxWeekCount = Math.max(1, ...week.map((item) => item.count));
  const trend = [...attemptRows].slice(0, 10).reverse();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">← 返回學習首頁</Link>
      <header className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-widest text-blue-700">LEARNING RADAR</p>
          <h1 className="mt-2 text-3xl font-bold">學習歷程</h1>
          <p className="mt-2 text-slate-600">{profile?.display_name || "學生"}的學習足跡與成績變化，統計最近 90 天。</p>
        </div>
        <Link href="/dashboard/practice/mistakes" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 font-semibold text-red-800 hover:bg-red-100">查看錯題分析 →</Link>
      </header>

      {attemptRows.length === 0 ? (
        <section className="mt-8 rounded-2xl border bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">開始累積你的學習歷程</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">完成第一份練習題後，這裡就會記錄作答次數、答題量、平均表現與各科學習變化。</p>
          <Link href="/dashboard/practice/new" className="mt-5 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">開始第一次練習</Link>
        </section>
      ) : (
        <>
          <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-slate-500">完成練習</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{attemptRows.length}<span className="ml-1 text-sm font-normal text-slate-500">次</span></p>
            </div>
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-slate-500">累積作答</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{totalAnswered}<span className="ml-1 text-sm font-normal text-slate-500">題</span></p>
            </div>
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-slate-500">平均得分</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{averageScore.toFixed(1)}<span className="ml-1 text-sm font-normal text-slate-500">分</span></p>
              <p className="mt-1 text-xs text-slate-500">每次練習成績平均</p>
            </div>
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm text-slate-500">整體答對率</p>
              <p className="mt-2 text-3xl font-bold tabular-nums">{accuracy.toFixed(1)}<span className="ml-1 text-sm font-normal text-slate-500">%</span></p>
              <p className="mt-1 text-xs text-slate-500">涵蓋 {studyDays} 個學習日</p>
            </div>
          </section>

          <section className="mt-6 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6">
              <h2 className="text-lg font-bold">最近 7 天學習活動</h2>
              <p className="mt-1 text-sm text-slate-500">每天完成的練習份數</p>
              <div className="mt-6 flex h-36 items-end justify-between gap-2">
                {week.map((day) => (
                  <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-xs tabular-nums text-slate-600">{day.count || ""}</span>
                    <div className="flex h-24 w-full items-end rounded-t-lg bg-slate-100">
                      <div className="w-full rounded-t-lg bg-blue-600" style={{ height: day.count ? Math.max(8, day.count / maxWeekCount * 96) + "px" : "3px" }} />
                    </div>
                    <span className="text-xs text-slate-500">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <h2 className="text-lg font-bold">最近 10 次成績</h2>
              <p className="mt-1 text-sm text-slate-500">依完成時間排列，查看近期變化</p>
              <div className="mt-6 space-y-3">
                {trend.map((attempt) => {
                  const set = setMap.get(attempt.practice_set_id);
                  const score = Number(attempt.score);
                  return (
                    <div key={attempt.id}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-slate-600">{set ? (subjectMap.get(set.subject_id) ?? set.subject_id) + " · " + set.title : "練習題本"}</span>
                        <span className="shrink-0 font-semibold tabular-nums">{score.toFixed(0)} 分</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: Math.max(0, Math.min(100, score)) + "%" }} />
                      </div>
                      <p className="mt-1 text-right text-[11px] text-slate-400">{new Date(attempt.completed_at).toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" })}</p>
                    </div>
                  );
                })}
              </div>
              {scoreChange !== null && (
                <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  最近 10 次平均 {average(recentTen).toFixed(1)} 分，
                  相較前 10 次 {scoreChange >= 0 ? "提升 " : "下降 "}{Math.abs(scoreChange).toFixed(1)} 分。
                </p>
              )}
            </div>
          </section>

          <section className="mt-6 rounded-2xl border bg-white p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div><h2 className="text-lg font-bold">各科學習表現</h2><p className="mt-1 text-sm text-slate-500">以答對題數計算各科答對率</p></div>
              <Link href="/dashboard/practice/mistakes" className="text-sm font-medium text-blue-700 hover:underline">查看各科弱點 →</Link>
            </div>
            <div className="mt-5 space-y-5">
              {(subjects ?? []).filter((subject) => subjectStats.has(subject.id)).map((subject) => {
                const stats = subjectStats.get(subject.id)!;
                const rate = stats.questions ? stats.correct / stats.questions * 100 : 0;
                return (
                  <div key={subject.id}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="font-semibold">{subject.name}</span>
                      <span className="text-sm text-slate-600">{rate.toFixed(1)}% · {stats.correct}/{stats.questions} 題答對</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600" style={{ width: rate + "%" }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">完成 {stats.attempts} 次練習 · 平均得分 {(stats.scoreTotal / stats.attempts).toFixed(1)} 分</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-6 rounded-2xl border bg-white p-6">
            <h2 className="text-lg font-bold">最近學習紀錄</h2>
            <div className="mt-4 divide-y">
              {attemptRows.slice(0, 20).map((attempt) => {
                const set = setMap.get(attempt.practice_set_id);
                return (
                  <Link key={attempt.id} href={"/dashboard/practice/" + attempt.practice_set_id + "?result=" + attempt.id} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-slate-50">
                    <div>
                      <p className="font-medium">{set?.title ?? "練習題本"}</p>
                      <p className="mt-1 text-xs text-slate-500">{set ? subjectMap.get(set.subject_id) ?? set.subject_id : ""} · {new Date(attempt.completed_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}</p>
                    </div>
                    <div className="text-right"><p className="font-bold tabular-nums">{Number(attempt.score).toFixed(0)} 分</p><p className="text-xs text-slate-500">{attempt.correct_count}/{attempt.total_count} 題</p></div>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
