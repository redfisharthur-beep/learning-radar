import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewPracticeForm from "@/components/practice/NewPracticeForm";

type SearchParams = Promise<{ subject?: string }>;

export default async function NewPracticePage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: student }, { data: subjects }, { data: profile }] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("education_stage, grade, school_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("subjects").select("id, name, sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
  ]);

  if (!student?.education_stage || !student.grade) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
        <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">← 返回學習首頁</Link>
        <section className="mt-8 rounded-2xl border bg-white p-6">
          <h1 className="text-2xl font-bold">先完成學生基本資料</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">設定學段與年級後，AI 才能依照適齡程度命題。</p>
          <Link href="/dashboard/profile" className="mt-5 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">設定學生資料</Link>
        </section>
      </main>
    );
  }

  const stageLabel = student.education_stage === "elementary" ? "國小" : "國中";
  const studentLabel = (profile?.display_name || "學生") + "｜" + stageLabel + " " + student.grade + " 年級";

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link href="/dashboard/practice" className="text-sm text-blue-700 hover:underline">← 題本紀錄</Link>
      <header className="mt-6">
        <p className="text-sm font-semibold tracking-widest text-blue-700">LEARNING RADAR</p>
        <h1 className="mt-2 text-3xl font-bold">AI 智慧出題</h1>
        <p className="mt-2 leading-7 text-slate-600">設定科目與段考範圍，AI 會產生適合目前年級的選擇題，完成後立即批改並提供解析。</p>
      </header>
      <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
        <NewPracticeForm
          subjects={(subjects ?? []).map((item) => ({ id: item.id, name: item.name }))}
          studentLabel={studentLabel}
          defaultSubject={(subjects ?? []).some((item) => item.id === query.subject) ? query.subject : undefined}
        />
      </section>
    </main>
  );
}
