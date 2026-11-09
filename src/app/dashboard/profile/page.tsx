import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateStudentProfile } from "@/app/actions/student-settings";

type SearchParams = Promise<{ q?: string; saved?: string; error?: string }>;

const errorMessages: Record<string, string> = {
  "display-name": "請輸入 1～60 個字元的顯示名稱。",
  grade: "年級與學段不相符，請重新確認。",
  school: "找不到這所學校，或學校資料目前未啟用。",
  "school-stage": "所選學校的學段與學生年級不相符。",
  "complete-profile": "請先完成學生學段與年級設定。",
  save: "資料儲存失敗，請稍後再試。",
};

export default async function StudentProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: student }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("student_profiles")
      .select("school_id, education_stage, grade")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const search = (params.q ?? "").trim().replace(/[,%().*"\\]/g, "").slice(0, 50);
  let schoolResults: Array<{
    id: string;
    school_code: string | null;
    name: string;
    city: string | null;
    district: string | null;
    school_level: string;
  }> = [];

  if (search.length >= 2) {
    const { data } = await supabase
      .from("schools")
      .select("id, school_code, name, city, district, school_level")
      .eq("is_active", true)
      .or(`name.ilike.%${search}%,city.ilike.%${search}%,district.ilike.%${search}%,school_code.ilike.%${search}%`)
      .order("city", { ascending: true })
      .order("name", { ascending: true })
      .limit(40);
    schoolResults = data ?? [];
  }

  let currentSchool: (typeof schoolResults)[number] | null = null;
  if (student?.school_id) {
    const { data } = await supabase
      .from("schools")
      .select("id, school_code, name, city, district, school_level")
      .eq("id", student.school_id)
      .maybeSingle();
    currentSchool = data;
  }

  const options = new Map<string, (typeof schoolResults)[number]>();
  if (currentSchool) options.set(currentSchool.id, currentSchool);
  for (const school of schoolResults) options.set(school.id, school);

  const errorMessage = params.error ? errorMessages[params.error] ?? "設定資料有誤，請重新確認。" : null;

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-blue-700 hover:underline">← 返回學習首頁</Link>
      <header className="mt-6">
        <p className="text-sm font-semibold tracking-widest text-blue-700">LEARNING RADAR</p>
        <h1 className="mt-2 text-3xl font-bold">學生基本資料</h1>
        <p className="mt-2 text-slate-600">設定學段、年級與就讀學校，讓後續教材與段考範圍能自動對應。</p>
      </header>

      {params.saved === "1" && (
        <p className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          學生資料已成功儲存。
        </p>
      )}
      {errorMessage && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</p>
      )}

      <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
        <form id="school-search" method="get" action="/dashboard/profile" className="mb-6 rounded-xl bg-slate-50 p-4">
          <label className="block text-sm font-medium text-slate-700">
            搜尋學校
            <span className="mt-1 block text-xs font-normal text-slate-500">可輸入學校名稱、縣市、行政區或學校代碼。</span>
          </label>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              name="q"
              defaultValue={params.q ?? ""}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3"
              placeholder="例如：彰化、板橋國小"
            />
            <button className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium">
              搜尋學校
            </button>
          </div>
        </form>

        <form action={updateStudentProfile} className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            學生顯示名稱
            <input
              name="display_name"
              required
              maxLength={60}
              defaultValue={profile?.display_name ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              placeholder="請輸入學生姓名或暱稱"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              就讀學段
              <select
                name="education_stage"
                required
                defaultValue={student?.education_stage ?? ""}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option value="" disabled>請選擇學段</option>
                <option value="elementary">國小</option>
                <option value="junior_high">國中</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              就讀年級
              <select
                name="grade"
                required
                defaultValue={student?.grade?.toString() ?? ""}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option value="" disabled>請選擇年級</option>
                <optgroup label="國小">
                  {[1, 2, 3, 4, 5, 6].map((grade) => <option key={grade} value={grade}>國小 {grade} 年級</option>)}
                </optgroup>
                <optgroup label="國中">
                  {[7, 8, 9].map((grade) => <option key={grade} value={grade}>國中 {grade - 6} 年級</option>)}
                </optgroup>
              </select>
            </label>
          </div>

          <div className="border-t pt-5">
            <h2 className="font-semibold">就讀學校</h2>
            <p className="mt-1 text-sm text-slate-500">請先使用上方欄位搜尋，再從下方選擇學校。</p>
          <label className="mt-4 block text-sm font-medium text-slate-700">
              選擇學校
              <select
                name="school_id"
                defaultValue={student?.school_id ?? ""}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                <option value="">尚未選擇／目前不設定</option>
                {Array.from(options.values()).map((school) => (
                  <option key={school.id} value={school.id}>
                    {[school.city, school.district, school.name].filter(Boolean).join("｜")}
                  </option>
                ))}
              </select>
            </label>
            {search.length >= 2 && (
              <p className="mt-2 text-xs text-slate-500">
                {schoolResults.length > 0 ? `找到 ${schoolResults.length} 所符合條件的學校。` : "沒有找到符合條件的學校，請調整關鍵字。"}
              </p>
            )}
            {search.length > 0 && search.length < 2 && (
              <p className="mt-2 text-xs text-slate-500">請輸入至少 2 個字元再搜尋。</p>
            )}
          </div>

          <button className="w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">
            儲存學生資料
          </button>
        </form>
      </section>

      <p className="mt-5 text-xs leading-6 text-slate-500">
        學校名錄來源：教育部統計處 115 學年度國民小學及國民中學名錄。學校資料會隨教育部年度更新而調整。
      </p>
    </main>
  );
}
