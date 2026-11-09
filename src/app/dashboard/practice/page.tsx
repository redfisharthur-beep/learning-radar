import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SearchParams = Promise<{ error?: string }>;

export default async function PracticeHistoryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const [{ data: sets }, { data: subjects }] = await Promise.all([
    admin
      .from("practice_sets")
      .select("id, title, subject_id, grade, education_stage, question_count, difficulty_level, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("subjects").select("id, name"),
  ]);
  const subjectNames = new Map((subjects ?? []).map((subject) => [subject.id, subject.name]));

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">← 返回學習首頁</Link>
      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-widest text-blue-700">LEARNING RADAR</p>
          <h1 className="mt-2 text-3xl font-bold">AI 練習題本</h1>
          <p className="mt-2 text-slate-600">每份題本都會保存，方便複習與查看作答解析。</p>
        </div>
        <Link href="/dashboard/practice/new" className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">＋ 產生新題本</Link>
      </header>

      {params.error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {params.error === "incomplete" ? "請完成所有題目再送出。" : "目前無法完成這項操作，請重新嘗試。"}
        </p>
      )}

      {!sets?.length ? (
        <section className="mt-8 rounded-2xl border bg-white p-8 text-center">
          <h2 className="text-xl font-semibold">還沒有練習題本</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">選擇科目、設定段考範圍，就能建立第一份 AI 練習題。</p>
          <Link href="/dashboard/practice/new" className="mt-5 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">開始 AI 出題</Link>
        </section>
      ) : (
        <div className="mt-8 space-y-3">
          {sets.map((item) => (
            <Link key={item.id} href={"/dashboard/practice/" + item.id} className="block rounded-2xl border bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">{item.title}</h2>
                <span className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {subjectNames.get(item.subject_id) ?? item.subject_id}｜{item.education_stage === "elementary" ? "國小" : ""}{item.grade} 年級｜{item.question_count} 題
              </p>
              <p className="mt-1 text-xs text-slate-500">AI 原創練習題 · {item.difficulty_level === "mixed" ? "混合難度" : item.difficulty_level === "basic" ? "基礎" : item.difficulty_level === "intermediate" ? "進階" : "挑戰"}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
