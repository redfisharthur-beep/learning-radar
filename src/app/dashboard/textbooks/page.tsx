import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveStudentTextbookSelection } from "@/app/actions/student-settings";

type SearchParams = Promise<{ saved?: string; error?: string; semester?: string }>;

const academicYear = 115;

export default async function TextbookSettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedSemester = Number(params.semester ?? "1");
  const semester = requestedSemester === 2 ? 2 : 1;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: student } = await supabase
    .from("student_profiles")
    .select("education_stage, grade")
    .eq("user_id", user.id)
    .maybeSingle();

  const [{ data: subjects }, { data: publishers }, { data: editions }, { data: selections }] = await Promise.all([
    supabase.from("subjects").select("id, name, sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("textbook_publishers").select("id, name").eq("is_active", true).order("name"),
    student?.education_stage && student.grade
      ? supabase
          .from("textbook_editions")
          .select("id, subject_id, edition_name, series_name, publisher_id, volume_no")
          .eq("is_active", true)
          .eq("education_stage", student.education_stage)
          .eq("grade", student.grade)
          .eq("academic_year", academicYear)
          .eq("volume_no", semester)
          .order("subject_id")
          .order("edition_name")
      : Promise.resolve({ data: [] }),
    supabase
      .from("student_textbook_selections")
      .select("subject_id, textbook_edition_id, semester")
      .eq("user_id", user.id)
      .eq("academic_year", academicYear)
      .eq("semester", semester),
  ]);

  const publisherNames = new Map((publishers ?? []).map((publisher) => [publisher.id, publisher.name]));
  const selectedEditions = new Map((selections ?? []).map((selection) => [selection.subject_id, selection.textbook_edition_id]));
  const availableEditions = editions ?? [];

  const errorMessages: Record<string, string> = {
    invalid: "選擇資料不完整，請重新操作。",
    "edition-mismatch": "教材版本與目前學生年級或科目不相符。",
    save: "教材版本儲存失敗，請稍後再試。",
  };

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">← 返回學習首頁</Link>
      <header className="mt-6">
        <p className="text-sm font-semibold tracking-widest text-blue-700">LEARNING RADAR</p>
        <h1 className="mt-2 text-3xl font-bold">教材版本設定</h1>
        <p className="mt-2 text-slate-600">依學生學段、年級與科目指定正在使用的教材，後續練習會以這些版本對應單元與知識點。</p>
      </header>

      {params.saved === "1" && (
        <p className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          教材版本已成功儲存。
        </p>
      )}
      {params.error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessages[params.error] ?? "設定資料有誤，請重新確認。"}
        </p>
      )}

      {!student?.education_stage || !student.grade ? (
        <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">請先完成學生基本資料</h2>
          <p className="mt-2 text-sm text-slate-600">設定國小／國中學段與年級後，系統才能篩選相符的教材版本。</p>
          <Link href="/dashboard/profile" className="mt-4 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">
            前往設定學生資料
          </Link>
        </section>
      ) : (
        <>
          <section className="mt-8 rounded-2xl bg-slate-900 p-5 text-white">
            <p className="text-sm text-slate-300">目前設定對象</p>
            <h2 className="mt-1 text-xl font-semibold">
              {student.education_stage === "elementary" ? "國小" : "國中"} {student.education_stage === "elementary" ? student.grade : student.grade - 6} 年級
            </h2>
            <p className="mt-2 text-sm text-slate-300">{academicYear} 學年度第 {semester} 學期</p>
          </section>

          <nav aria-label="選擇學期" className="mt-6 flex gap-2">
            {[1, 2].map((term) => (
              <Link
                key={term}
                href={`/dashboard/textbooks?semester=${term}`}
                aria-current={semester === term ? "page" : undefined}
                className={`rounded-xl px-5 py-3 text-sm font-semibold ${semester === term ? "bg-blue-700 text-white" : "border bg-white text-slate-700 hover:bg-slate-50"}`}
              >
                第 {term} 學期
              </Link>
            ))}
          </nav>

          <div className="mt-4 space-y-4">
            {(subjects ?? []).map((subject) => {
              const choices = availableEditions.filter((edition) => edition.subject_id === subject.id);
              const currentEdition = selectedEditions.get(subject.id);
              return (
                <section key={subject.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">{subject.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {choices.length > 0 ? `目前有 ${choices.length} 個可選教材版本。` : "目前尚未匯入這個年級的教材版本。"}
                      </p>
                    </div>
                    {currentEdition && <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">已設定</span>}
                  </div>

                  {choices.length > 0 ? (
                    <form action={saveStudentTextbookSelection} className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <input type="hidden" name="subject_id" value={subject.id} />
                      <input type="hidden" name="academic_year" value={academicYear} />
                      <input type="hidden" name="semester" value={semester} />
                      <select
                        name="textbook_edition_id"
                        required
                        defaultValue={currentEdition ?? ""}
                        className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3"
                      >
                        <option value="" disabled>請選擇出版社與教材版本</option>
                        {choices.map((edition) => {
                          const publisher = publisherNames.get(edition.publisher_id) ?? "未指定出版社";
                          const label = [publisher, edition.edition_name].filter(Boolean).join("｜");
                          return <option key={edition.id} value={edition.id}>{label}</option>;
                        })}
                      </select>
                      <button className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">
                        儲存版本
                      </button>
                    </form>
                  ) : (
                    <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      教材目錄資料尚在整理中，不會先提供未經確認的版本或單元名稱。
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
      <p className="mt-6 text-xs leading-6 text-slate-500">
        以上列出國家教育研究院 115 學年度審定本清冊中的可選出版社與冊次；各校實際採用版本可能不同，請依學校發放的課本選擇。教材單元與知識點內容尚待依正式教材資料逐步建檔。
      </p>
    </main>
  );
}
