import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

const subjects = [
  { id: "chinese", name: "國文" },
  { id: "english", name: "英文" },
  { id: "math", name: "數學" },
  { id: "science", name: "自然" },
  { id: "social", name: "社會" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: student }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("student_profiles").select("education_stage, grade").eq("user_id", user.id).maybeSingle(),
  ]);

  const stageLabel = student?.education_stage === "elementary" ? "國小" : student?.education_stage === "junior_high" ? "國中" : "";
  const gradeLabel = student?.grade ? stageLabel + " " + student.grade + " 年級" : "尚未設定年級";

  return <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
    <header className="flex items-center justify-between">
      <div><p className="text-sm font-semibold text-blue-700">LEARNING RADAR</p><h1 className="mt-1 text-3xl font-bold">我的學習首頁</h1></div>
      <form action={signOut}><button className="rounded-lg border bg-white px-4 py-2 text-sm">登出</button></form>
    </header>
    <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-slate-500">歡迎回來</p>
      <h2 className="mt-1 text-xl font-semibold">{profile?.display_name || "學生"}！</h2>
      <p className="mt-2 text-sm text-slate-600">目前設定：{gradeLabel}。選擇科目與段考範圍，AI 就能產生練習題，完成後自動批改並提供解析。</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link href="/dashboard/practice/new" className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 font-semibold text-blue-800 hover:bg-blue-100">AI 智慧出題 <span className="mt-1 block text-xs font-normal text-blue-700">依段考範圍產生 5 或 10 題練習</span></Link>
        <Link href="/dashboard/practice" className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold text-slate-800 hover:bg-slate-100">我的練習題本 <span className="mt-1 block text-xs font-normal text-slate-600">查看題本、成績與解析</span></Link>
        <Link href="/dashboard/profile" className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold text-slate-800 hover:bg-slate-100">學生基本資料 <span className="mt-1 block text-xs font-normal text-slate-600">設定學校、學段與年級</span></Link>
      </div>
      <Link href="/dashboard/textbooks" className="mt-3 inline-flex text-sm font-medium text-blue-700 underline">教材版本設定</Link>
    </section>

    <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-lg font-bold">選擇科目開始複習</h2><p className="mt-1 text-sm text-slate-500">點選科目即可直接開啟 AI 出題設定。</p></div>
      <Link href="/dashboard/practice" className="text-sm font-medium text-blue-700 hover:underline">查看全部題本 →</Link>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
      {subjects.map((subject) => (
        <Link key={subject.id} href={"/dashboard/practice/new?subject=" + subject.id} className="rounded-xl border bg-white p-5 text-center font-semibold transition hover:border-blue-300 hover:bg-blue-50">
          {subject.name}
          <p className="mt-2 text-xs font-normal text-slate-500">開始練習 →</p>
        </Link>
      ))}
    </div>
  </main>;
}
