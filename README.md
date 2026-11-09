# 學習雷達 Learning Radar

國小／國中 AI 智慧段考複習平台。第一階段使用 Next.js App Router、TypeScript、Supabase PostgreSQL/Auth 與 Tailwind CSS。

## Supabase 專案
- 專案：learning-radar
- 區域：Northeast Asia (Tokyo / ap-northeast-1)
- 專案 URL：https://znyxrlgurvvjwyrxepqv.supabase.co
- 前端使用 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY；不得將 Secret key 或 service role key 放入前端。

## 目前包含
- 學校、學生個人資料、學生學籍設定、科目及角色資料表
- Auth 使用者建立時自動建立 profile、student role 與 student profile
- 所有五張資料表均啟用 RLS
- 學生個人資料僅能由本人讀取／修改
- 使用者角色不可由一般 authenticated 使用者自行修改
- 學校及科目目錄僅開放登入者讀取啟用中的資料
- Email / Password 註冊、登入、登出與受保護的學生儀表板
- Supabase 自動生成的資料庫 TypeScript 型別

## 資料庫 Migration
依序執行 supabase/migrations/0001_initial_schema.sql 與 supabase/migrations/0002_index_student_profile_school_fk.sql。
東京專案已由 Supabase 管理連線直接套用上述結構；Migration 檔案保留在 Repository，作為版本控制與新環境重建依據。

## 本機啟動
1. npm install
2. 複製 .env.example 為 .env.local
3. 設定 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
4. npm run dev

## 部署前待辦
1. 在 Vercel 設定上述兩個環境變數。
2. 在 Supabase Auth 設定正式 Site URL 與 Redirect URLs。
3. 執行正式註冊／登入測試及 RLS 權限測試。
4. 加入全台學校、教材版本、單元、知識點及題庫資料。
5. 完成兒少隱私告知及必要家長同意流程後，才對外開放兒少註冊。

## 安全注意
- SUPABASE_SERVICE_ROLE_KEY 或 Secret key 絕不可放在任何 NEXT_PUBLIC_ 變數。
- 不要在前端自行指定 user_id；由 Supabase Auth session 決定使用者身分。
- 所有經 Data API 暴露的資料表均須維持 RLS 與最小權限政策。
