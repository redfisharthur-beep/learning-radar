"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Subject = { id: string; name: string };

type Props = {
  subjects: Subject[];
  defaultSubject?: string;
  studentLabel: string;
};

const errorLabels: Record<string, string> = {
  OPENAI_NOT_CONFIGURED: "AI 出題尚未啟用。請先在 Vercel 專案新增 OPENAI_API_KEY，儲存並重新部署。",
  UNAUTHENTICATED: "登入狀態已失效，請重新登入。",
  PROFILE_REQUIRED: "請先完成學生基本資料的學段與年級設定。",
  DAILY_LIMIT_REACHED: "每個帳號每 24 小時最多產生 5 份題本，請稍後再試。",
  OPENAI_RATE_LIMIT: "AI 服務目前忙碌或額度不足，請稍後再試。",
  QUESTION_VALIDATION_FAILED: "題目未通過答案與格式檢查，請重新產生。",
  INVALID_SCOPE: "請輸入 5～500 字的段考範圍或複習主題。",
};

export default function NewPracticeForm({ subjects, defaultSubject, studentLabel }: Props) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState(defaultSubject ?? subjects[0]?.id ?? "chinese");
  const [semester, setSemester] = useState("1");
  const [questionCount, setQuestionCount] = useState("5");
  const [difficulty, setDifficulty] = useState("mixed");
  const [scopeText, setScopeText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/practice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          subject_id: subjectId,
          semester: Number(semester),
          question_count: Number(questionCount),
          difficulty,
          scope_text: scopeText,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const code = typeof result.code === "string" ? result.code : "";
        setError(errorLabels[code] ?? (typeof result.error === "string" ? result.error : "出題失敗，請稍後再試。"));
        return;
      }
      if (typeof result.id !== "string") {
        setError("題本建立成功，但頁面導向資訊不完整，請到題本紀錄查看。");
        return;
      }
      router.push("/dashboard/practice/" + result.id);
      router.refresh();
    } catch {
      setError("目前無法連線到出題服務，請確認網路後再試。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">目前學生</p>
        <p className="mt-1 font-semibold">{studentLabel}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          科目
          <select
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"
            required
          >
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          學期
          <select
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"
          >
            <option value="1">第 1 學期</option>
            <option value="2">第 2 學期</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          題數
          <select
            value={questionCount}
            onChange={(event) => setQuestionCount(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"
          >
            <option value="5">5 題（快速練習）</option>
            <option value="10">10 題（完整練習）</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          難度
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"
          >
            <option value="mixed">混合難度</option>
            <option value="basic">基礎</option>
            <option value="intermediate">進階</option>
            <option value="advanced">挑戰</option>
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        段考範圍／複習主題
        <textarea
          value={scopeText}
          onChange={(event) => setScopeText(event.target.value)}
          minLength={5}
          maxLength={500}
          required
          rows={5}
          placeholder={"例如：數學，第一章整數的運算、第二章分數的加減乘除；重點練習負數四則運算與分數應用題。"}
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 leading-7"
        />
        <span className="mt-1 block text-xs font-normal text-slate-500">
          5～500 字。教材目錄尚未完整匯入時，AI 會以這裡輸入的範圍為主要依據。請勿填入學生姓名、電話等個人資料。
        </span>
      </label>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        AI 會產生原創練習題，不是歷屆考古題。系統會先檢查題目格式、四個選項與正確答案，再儲存題本。每個帳號每 24 小時最多產生 5 份題本。
      </div>

      <button
        type="submit"
        disabled={busy || !subjects.length || scopeText.trim().length < 5}
        className="w-full rounded-xl bg-blue-700 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {busy ? "AI 正在依照範圍命題，請稍候…" : "產生練習題"}
      </button>
    </form>
  );
}
