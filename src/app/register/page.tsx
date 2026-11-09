import Link from "next/link";
import { signUp } from "@/app/actions/auth";

type SearchParams = Promise<{ error?: string }>;

const errorMessages: Record<string, string> = {
  invalid: "請確認顯示名稱與帳號資料完整。",
  password: "密碼至少需要 6 個字元。",
  exists: "這個帳號已經註冊，請返回登入。",
  "confirmation-enabled": "目前後台仍要求電子郵件驗證。請管理員先關閉 Supabase 的 Confirm Email，再重新建立帳號。",
  signup: "目前無法建立帳號，請稍後再試。",
};

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
    <Link href="/" className="text-sm text-blue-700">← 學習雷達</Link>
    <h1 className="mt-6 text-3xl font-bold">建立學生帳號</h1>
    <p className="mt-2 text-slate-600">設定帳號與密碼，建立後即可登入，不需要收取驗證信。</p>
    {params.error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{errorMessages[params.error] ?? "註冊資料有誤，請重新確認。"}</p>}
    <form action={signUp} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">顯示名稱<input name="display_name" required maxLength={60} className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
      <label className="block text-sm font-medium">帳號（電子郵件）<input name="email" type="email" required autoComplete="username" className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
      <label className="block text-sm font-medium">設定密碼（至少 6 個字元）<input name="password" type="password" minLength={6} required autoComplete="new-password" className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
      <p className="text-xs leading-5 text-slate-500">目前採用免電子郵件驗證的測試登入方式。請勿使用重要網站的相同密碼；正式服務開放兒少使用前，仍須完成隱私告知與家長同意流程。</p>
      <button className="w-full rounded-xl bg-blue-700 p-3 font-semibold text-white">建立帳號並登入</button>
    </form>
    <p className="mt-6 text-sm text-slate-600">已有帳號？ <Link className="text-blue-700 underline" href="/login">返回登入</Link></p>
  </main>;
}
