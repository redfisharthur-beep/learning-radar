# 學習雷達 Learning Radar

國小／國中 AI 智慧段考複習平台。第一階段提供 Next.js + Supabase 基礎架構、學生帳號登入及資料庫安全政策。

## 技術
- Next.js App Router + TypeScript
- Supabase PostgreSQL + Auth
- Supabase SSR (`@supabase/ssr`)
- Tailwind CSS
- 五科：國文、英文、數學、自然、社會

## 目前包含
- Supabase Migration：學校、學生個人資料、學生學籍設定、科目
- Auth 使用者建立時自動建立 `profiles`
- RLS：學生只能讀寫自己的個人資料與學生設定
- 學校及科目啟用資料可供登入後選擇
- Email / Password 註冊、登入、登出
- 受保護的學生儀表板
- 環境變數範例

## 尚未完成／需要部署者操作
1. 建立 Supabase 專案。
2. 在 Supabase SQL Editor 執行 `supabase/migrations/0001_initial_schema.sql`，或安裝 Supabase CLI 後執行 migration。
3. 複製 `.env.example` 為 `.env.local`，填入 Supabase URL 與 anon/publishable key。
4. 在 Supabase Auth 設定 Site URL 與 Redirect URLs。
5. `npm install`、`npm run dev`。

## 本機啟動
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase CLI（選用）
```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

## 安全注意
- `SUPABASE_SERVICE_ROLE_KEY` 不可放在 `NEXT_PUBLIC_` 變數，也不可送到瀏覽器。
- 本專案僅使用公開 anon/publishable key 搭配 RLS。
- 不要在前端自行指定 `user_id`；由 Supabase Auth session 決定使用者身分。
- 上線前需完成個資、未成年人使用及家長同意流程檢視。
