import Link from "next/link";
import { resendSignupConfirmation, signIn } from "@/app/actions/auth";

type SearchParams = Promise<{ error?: string; message?: string; next?: string }>;

const errorMessages: Record<string, string> = {
  missing: "請輸入電子郵件與密碼。",
  unverified: "這個電子郵件尚未完成驗證，請先收取驗證信，或使用下方功能重新寄送。",
  credentials: "電子郵件或密碼不正確，請重新確認。",
  "auth-callback": "驗證連結已失效或已使用，請重新寄送驗證信後再試。",
  "resend-email": "請輸入要重新寄送驗證信的電子郵件。",
  "resend-failed": "目前無法重新寄送，請稍後再試或確認電子郵件是否正確。",
  "email-limit": "Supabase 目前的測試寄信額度已用完，這次沒有寄出驗證信。正式開放前需設定專用寄信服務。",
  "email-not-authorized": "目前測試寄信服務只允許寄給專案團隊成員，這個收件地址尚未獲授權。正式開放前需設定專用寄信服務。",
};

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
    <Link href="/" className="text-sm text-blue-700">← 學習雷達</Link>
    <h1 className="mt-6 text-3xl font-bold">學生登入</h1>
    <p className="mt-2 text-slate-600">登入後查看你的測驗與學習紀錄。</p>

    {params.message === "check-email" && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-green-800">帳號已建立！請至電子郵件收取驗證信，完成驗證後再登入。</p>}
    {params.message === "verification-sent" && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-green-800">若此電子郵件有待驗證的帳號，新的驗證信已送出，請檢查收件匣與垃圾郵件匣。</p>}
    {params.error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{errorMessages[params.error] ?? "登入或驗證作業未完成，請重新確認資料後再試。"}</p>}

    <form action={signIn} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={params.next ?? "/dashboard"} />
      <label className="block text-sm font-medium">電子郵件<input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
      <label className="block text-sm font-medium">密碼<input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
      <button className="w-full rounded-xl bg-blue-700 p-3 font-semibold text-white">登入</button>
    </form>

    <section className="mt-7 rounded-xl border bg-white p-4">
      <h2 className="font-semibold">尚未收到驗證信？</h2>
      <p className="mt-1 text-sm text-slate-600">輸入註冊時使用的電子郵件，我們會重新寄送驗證信。</p>
      <form action={resendSignupConfirmation} className="mt-3 space-y-3">
        <label className="block text-sm font-medium">電子郵件<input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-xl border bg-white p-3" /></label>
        <button className="w-full rounded-xl border border-blue-700 px-4 py-3 font-semibold text-blue-700">重新寄送驗證信</button>
      </form>
    </section>

    <p className="mt-6 text-sm text-slate-600">還沒有帳號？ <Link className="text-blue-700 underline" href="/register">建立學生帳號</Link></p>
  </main>;
}
