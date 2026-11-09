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
    .select("education_stage, grade, school_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const [
    { data: subjects },
    { data: publishers },
    { data: editions },
    { data: selections },
    { data: adoptions },
    { data: school },
  ] = await Promise.all([
    supabase.from("subjects").select("id, name, sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("textbook_publishers").select("id, name").eq("is_active", true).order("name"),
    student?.education_stage && student.grade
      ? supabase
          .from("textbook_editions")
          .select("id, subject_id, edition_name, publisher_id, volume_no, grade, education_stage")
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
    student?.school_id && student.grade
      ? supabase
          .from("school_textbook_adoptions")
          .select("subject_id, textbook_edition_id, source_url, source_title, source_published_at, confidence")
          .eq("school_id", student.school_id)
          .eq("academic_year", academicYear)
          .eq("grade", student.grade)
          .eq("semester", semester)
          .eq("is_active", true)
      : Promise.resolve({ data: [] }),
    student?.school_id
      ? supabase
          .from("schools")
          .select("name, city, district")
          .eq("id", student.school_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const publisherNames = new Map((publishers ?? []).map((publisher) => [publisher.id, publisher.name]));
  const selectedEditions = new Map((selections ?? []).map((selection) => [selection.subject_id, selection.textbook_edition_id]));
  const availableEditions = editions ?? [];
  const editionById = new Map(availableEditions.map((edition) => [edition.id, edition]));
  const adoptionBySubject = new Map((adoptions ?? []).map((adoption) => [adoption.subject_id, adoption]));

  const errorMessages: Record<string, string> = {
    invalid: "選擇資料不完整，請重新操作。",
    "edition-mismatch": "教材版本與目前學生年級或科目不相符。",
    save: "教材版本儲存失敗，請稍後再試。",
  };

  const studentIsReady = Boolean(student?.education_stage && student.grade);
  const gradeLabel = student?.grade
    ? student.education_stage === "elementary" ? `國小 ${student.grade} 年級` : `${student.grade} 年級`
    : "";

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">← 返回學習首頁</Link>
      <header className="mt-6">
        <p className="text-sm font-semibold tracking-widest text-blue-700">LEARNING RADAR</p>
        <h1 className="mt-2 text-3xl font-bold">教材版本</h1>
        <p className="mt-2 text-slate-600">系統會先依學校公告自動帶入版本；只有資料不符時，才需要手動修改。</p>
      </header>

      {params.saved === "1" && (
        <p className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          教材版本已更新。
        </p>
      )}
      {params.error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessages[params.error] ?? "設定資料有誤，請重新確認。"}
        </p>
      )}

      {!studentIsReady ? (
        <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">先完成學生基本資料</h2>
          <p className="mt-2 text-sm text-slate-600">設定學段、年級與學校後，系統才能查找該校採用的教材版本。</p>
          <Link href="/dashboard/profile" className="mt-4 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">
            設定學生資料
          </Link>
        </section>
      ) : (
        <>
          <section className="mt-8 rounded-2xl bg-slate-900 p-5 text-white">
            <p className="text-sm text-slate-300">目前學生資料</p>
            <h2 className="mt-1 text-xl font-semibold">{gradeLabel}</h2>
            <p className="mt-1 text-sm text-slate-300">
              {school ? [school.city, school.district, school.name].filter(Boolean).join("｜") : "尚未選擇學校"}
            </p>
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

          {!student?.school_id && (
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              還沒有設定就讀學校。先到學生基本資料選擇學校，系統才能自動查找該校公告的教材版本。
              <Link href="/dashboard/profile" className="ml-2 font-semibold underline">設定學校</Link>
            </p>
          )}

          <div className="mt-5 space-y-3">
            {(subjects ?? []).map((subject) => {
              const choices = availableEditions.filter((edition) => edition.subject_id === subject.id);
              const savedEditionId = selectedEditions.get(subject.id);
              const validSavedEditionId = savedEditionId && editionById.has(savedEditionId) ? savedEditionId : undefined;
              const adoption = adoptionBySubject.get(subject.id);
              const editionId = validSavedEditionId ?? adoption?.textbook_edition_id;
              const edition = editionId ? editionById.get(editionId) : undefined;
              const publisherName = edition ? publisherNames.get(edition.publisher_id) : undefined;
              const isManuallyChanged = Boolean(validSavedEditionId);
              const hasSchoolSource = Boolean(adoption && !isManuallyChanged);

              return (
                <section key={subject.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">{subject.name}</h2>
                    {isManuallyChanged ? (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">已自行修改</span>
                    ) : hasSchoolSource ? (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">依學校公告帶入</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">尚待確認</span>
                    )}
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-500">目前教材版本</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {edition ? [publisherName, edition.edition_name].filter(Boolean).join("｜") : "尚無可核對的版本資料"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {isManuallyChanged
                        ? "目前使用你手動選擇的版本。"
                        : hasSchoolSource
                          ? "由學校公開公告比對帶入，不需要逐科設定。"
                          : student?.school_id
                            ? "目前資料庫尚未找到這所學校此科目的可核對公告，不會自行猜測。"
                            : "設定就讀學校後，系統會自動查找版本。"}
                    </p>
                    {adoption?.source_url && (
                      <a
                        href={adoption.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs font-medium text-blue-700 underline"
                      >
                        查看學校公告來源
                      </a>
                    )}
                  </div>

                  <details className="mt-4">
                    <summary className="inline-flex cursor-pointer list-none items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                      修改版本
                    </summary>
                    {choices.length > 0 ? (
                      <form action={saveStudentTextbookSelection} className="mt-3 flex flex-col gap-3 sm:flex-row">
                        <input type="hidden" name="subject_id" value={subject.id} />
                        <input type="hidden" name="academic_year" value={academicYear} />
                        <input type="hidden" name="semester" value={semester} />
                        <select
                          name="textbook_edition_id"
                          required
                          defaultValue={editionId ?? ""}
                          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3"
                        >
                          <option value="" disabled>請選擇出版社與教材版本</option>
                          {choices.map((choice) => {
                            const publisher = publisherNames.get(choice.publisher_id) ?? "未指定出版社";
                            return (
                              <option key={choice.id} value={choice.id}>
                                {[publisher, choice.edition_name].filter(Boolean).join("｜")}
                              </option>
                            );
                          })}
                        </select>
                        <button className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">
                          儲存修改
                        </button>
                      </form>
                    ) : (
                      <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                        目前尚未匯入這個年級的審定版本資料。
                      </p>
                    )}
                  </details>
                </section>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-6 text-xs leading-6 text-slate-500">
        學校採用版本以學校當學年度公開公告為優先；若尚未取得可核對資料，系統會明確標示，不會把國家教育研究院的「審定可選版本」誤當成學校實際採用版本。
      </p>
    </main>
  );
}
