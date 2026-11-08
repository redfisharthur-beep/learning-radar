import Link from "next/link";
import { signIn } from "@/app/actions/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
    <Link href="/" className="text-sm text-blue-700">← 學習雷達</Link>
    <h1 className="mt-6 text-3xl font-bold">學生登入</h1>
    <p className="mt-2 text-slate-600">登入後查看你的測驗與學習紀錄。</p>
    {params.message === "check-email" && <p className="mt-4 rounded-lg bg-green-50 p-3 text-green-800">請先至電子郵件完成驗證，再登入。</p>}
    {params.error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">登入資料有誤或欄位未填完整，請再試一次。</p>}
    <form action={signIn} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">電子郵件<input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
      <label className="block text-sm font-medium">密碼<input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
      <button className="w-full rounded-xl bg-blue-700 p-3 font-semibold text-white">登入</button>
    </form>
    <p className="mt-6 text-sm text-slate-600">還沒有帳號？ <Link className="text-blue-700 underline" href="/register">建立學生帳號</Link></p>
  </main>;
}
