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
      <p className="mt-2 text-sm text-slate-600">第一階段帳號系統已就緒。下一步將建立學校、年級與教材設定。</p>
    </section>
    <h2 className="mt-10 text-lg font-bold">學習科目</h2>
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
      {subjects.map((subject) => <div key={subject} className="rounded-xl border bg-white p-5 text-center font-semibold">{subject}<p className="mt-2 text-xs font-normal text-slate-500">即將開放</p></div>)}
    </div>
  </main>;
}
