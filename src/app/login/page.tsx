import Link from "next/link";
import { signIn } from "@/app/actions/auth";

type SearchParams = Promise<{ error?: string; next?: string }>;

const errorMessages: Record<string, string> = {
  missing: "請輸入帳號與密碼。",
  credentials: "帳號或密碼不正確，請重新確認。",
  "confirmation-enabled": "後台仍開啟電子郵件驗證。請管理員先關閉 Supabase 的 Confirm Email，再重新註冊或登入。",
};

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
    <Link href="/" className="text-sm text-blue-700">← 學習雷達</Link>
    <h1 className="mt-6 text-3xl font-bold">學生登入</h1>
    <p className="mt-2 text-slate-600">使用註冊時設定的帳號與密碼登入。</p>

    {params.error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{errorMessages[params.error] ?? "登入資料有誤，請重新確認後再試。"}</p>}

    <form action={signIn} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={params.next ?? "/dashboard"} />
      <label className="block text-sm font-medium">帳號（電子郵件）<input name="email" type="email" required autoComplete="username" className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
      <label className="block text-sm font-medium">密碼<input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
      <button className="w-full rounded-xl bg-blue-700 p-3 font-semibold text-white">登入</button>
    </form>

    <p className="mt-6 text-sm text-slate-600">還沒有帳號？ <Link className="text-blue-700 underline" href="/register">建立學生帳號</Link></p>
  </main>;
}
