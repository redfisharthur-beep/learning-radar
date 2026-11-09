import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

const subjects = ["國文", "英文", "數學", "自然", "社會"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();

  return <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
    <header className="flex items-center justify-between">
      <div><p className="text-sm font-semibold text-blue-700">LEARNING RADAR</p><h1 className="mt-1 text-3xl font-bold">我的學習首頁</h1></div>
      <form action={signOut}><button className="rounded-lg border bg-white px-4 py-2 text-sm">登出</button></form>
    </header>
    <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-slate-500">歡迎回來</p>
      <h2 className="mt-1 text-xl font-semibold">{profile?.display_name || "學生"}！</h2>
      <p className="mt-2 text-sm text-slate-600">先完成學生資料與教材版本設定，系統就能依學校、年級及科目逐步媒合段考複習內容。</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link href="/dashboard/profile" className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 font-semibold text-blue-800 hover:bg-blue-100">學生基本資料 <span className="mt-1 block text-xs font-normal text-blue-700">設定學校、學段與年級</span></Link>
        <Link href="/dashboard/textbooks" className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 font-semibold text-slate-800 hover:bg-slate-100">教材版本設定 <span className="mt-1 block text-xs font-normal text-slate-600">選擇五科使用的出版社與版本</span></Link>
      </div>
    </section>
    <h2 className="mt-10 text-lg font-bold">學習科目</h2>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
      {subjects.map((subject) => <div key={subject} className="rounded-xl border bg-white p-5 text-center font-semibold">{subject}<p className="mt-2 text-xs font-normal text-slate-500">教材設定完成後開放</p></div>)}
    </div>
  </main>;
}
