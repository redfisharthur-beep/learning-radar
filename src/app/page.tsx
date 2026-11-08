import Link from "next/link";

export default function HomePage() {
  return <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
    <p className="text-sm font-semibold tracking-widest text-blue-700">LEARNING RADAR</p>
    <h1 className="mt-3 text-4xl font-bold">學習雷達</h1>
    <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">掌握學校進度，找出學習弱點，讓每一次練習都看得見進步。</p>
    <div className="mt-8 flex gap-3">
      <Link className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white" href="/login">學生登入</Link>
      <Link className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold" href="/register">建立帳號</Link>
    </div>
    <p className="mt-10 text-sm text-slate-500">國小・國中｜國文・英文・數學・自然・社會</p>
  </main>;
}
