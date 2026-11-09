# 學習雷達 Learning Radar

國小／國中 AI 智慧段考複習平台。技術採 Next.js App Router、TypeScript、Supabase PostgreSQL/Auth 與 Tailwind CSS。

## Supabase 專案
- 專案：learning-radar
- 區域：Northeast Asia (Tokyo / ap-northeast-1)
- Project URL：https://znyxrlgurvvjwyrxepqv.supabase.co
- 前端使用 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY；不得將 Secret key 或 service role key 放入前端。

## 目前功能
- Email / Password 註冊、登入、登出
- 學生首頁與受保護的 Dashboard
- 學生基本資料設定：學段、年級、學校搜尋與選擇（/dashboard/profile）
- 教材版本選擇介面（/dashboard/textbooks）；依學段、年級、科目與學年度篩選
- Supabase 自動生成的資料庫 TypeScript 型別
- 全部 public 資料表啟用 RLS；一般學生不能自行變更 user_roles

## 學校名錄
- 已匯入 115 學年度官方學校資料，共 3,349 筆：國小 2,609 所、國中 740 所。
- 資料欄位包括校碼、校名、縣市、行政區、地址、電話、網址、設立別與學年度。
- 國小來源：教育部統計處 115 學年度 JSON 名錄（https://stats.moe.gov.tw/files/school/115/e1_new.json）。
- 國中來源：教育部統計處 JSON 名錄（https://stats.moe.gov.tw/files/opendata/j1_new.json），匯入時只保留「學年度=115」資料。
- 政府資料集頁面：國小 https://data.gov.tw/dataset/6087；國中 https://data.gov.tw/dataset/6088。
- 後續年度更新前應先核對來源學年度、資料筆數與校碼，再執行 scripts/import_moe_school_directory_115.sql 的年度調整版本。

## 教材與課綱目錄
- 已建立出版社、教材版本、階層式單元、知識點、單元－知識點關聯、能力／認知／難度標籤與學生教材選擇資料表。
- 已建立康軒、翰林、南一出版社基礎資料及 13 個通用學習標籤。
- 尚未匯入各年級實際教材版本、單元章節與知識點內容；介面會明確顯示尚未建檔，不會虛構教材資訊。

## 資料庫 Migration
依序對應東京 Supabase 專案 Migration 紀錄：
1. supabase/migrations/20261109054935_initial_learning_radar_schema.sql
2. supabase/migrations/20261109054953_index_student_profile_school_fk.sql
3. supabase/migrations/20261109060308_phase2_curriculum_catalog.sql

## 本機啟動
1. npm install
2. 複製 .env.example 為 .env.local
3. 設定 NEXT_PUBLIC_SUPABASE_URL 與 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
4. npm run dev

## 尚待完成
- Vercel 專案部署與正式環境變數。
- Supabase Auth 正式 Site URL／Redirect URLs。
- 實際註冊、登入、學生資料儲存與 RLS 權限整合測試。
- 教材各版本、單元、知識點的官方／授權內容建檔。
- 題庫、AI 出題驗證與段考範圍媒合。
- 對外開放前完成兒少隱私告知與必要家長同意流程。

## 安全注意
- SUPABASE_SERVICE_ROLE_KEY 或 Supabase Secret key 絕不可放在任何 NEXT_PUBLIC_ 變數。
- 不要在前端自行指定 user_id；由 Supabase Auth session 決定使用者身分。
- 維持 public 資料表 RLS 與最小權限政策。
