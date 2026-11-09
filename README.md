# 學習雷達 Learning Radar

國小／國中 AI 智慧段考複習平台。技術採 Next.js App Router、TypeScript、Tailwind CSS、Supabase PostgreSQL/Auth 與 Vercel。

## 正式網站與部署

- Production URL：https://learning-radar-wheat.vercel.app
- Vercel 專案：learning-radar
- Production 部署已成功；目前 Vercel SSO 僅保護 Preview，正式 Production 網址可由一般訪客開啟。
- Node.js：26.x；GitHub Actions 使用相同版本。
- GitHub Actions 已通過 npm ci、TypeScript typecheck、Next.js production build。
- Production 的首頁、登入頁、註冊頁已以 HTTP 200 實際檢查。
- 尚未完成真實信箱的端到端註冊／驗證／登入測試。

## Supabase 專案

- 專案：learning-radar
- Region：Tokyo / ap-northeast-1
- Project URL：https://znyxrlgurvvjwyrxepqv.supabase.co
- 前端使用 `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。
- 不可將 Supabase Secret Key 或 Service Role Key 放入任何 `NEXT_PUBLIC_*` 變數。

### Supabase Auth 上線設定（尚需在託管專案確認）

請在 Supabase Dashboard 的 Authentication → URL Configuration 設定：

- Site URL：`https://learning-radar-wheat.vercel.app`
- Additional Redirect URLs：`https://learning-radar-wheat.vercel.app/**`
- 本機開發可保留：`http://localhost:3000/**`

Repository 的 `supabase/config.toml` 已記錄上述設定，但修改該檔案本身不會自動更新 Supabase 託管專案的 Dashboard 設定。請在第一次真實註冊測試前，確認遠端設定已套用。

Vercel Production 環境已設定 `NEXT_PUBLIC_SITE_URL`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。

## 目前已實作功能

- Email／Password 註冊、登入、登出。
- Supabase Email Confirmation PKCE callback（`/auth/callback`）。
- 未驗證帳號登入時顯示明確訊息。
- 重新寄送註冊驗證信。
- 學生首頁與受保護的 Dashboard。
- 學生基本資料設定：顯示名稱、學段、年級、學校搜尋與選擇（`/dashboard/profile`）。
- 教材版本選擇介面（`/dashboard/textbooks`）：依學段、年級、科目、學年度與冊次篩選。
- 學生資料及教材選擇由 Supabase RLS 限制使用者只能管理自己的資料。

## 學校名錄

- 已匯入 115 學年度官方學校資料，共 3,349 筆：國小 2,609 所、國中 740 所。
- 資料欄位包括校碼、校名、縣市、行政區、地址、電話、網址、設立別與學年度。
- 國小來源：教育部統計處 115 學年度 JSON 名錄（https://stats.moe.gov.tw/files/school/115/e1_new.json）。
- 國中來源：教育部統計處 JSON 名錄（https://stats.moe.gov.tw/files/opendata/j1_new.json），匯入時只保留「學年度=115」資料。
- 政府資料集頁面：國小 https://data.gov.tw/dataset/6087；國中 https://data.gov.tw/dataset/6088。
- 後續年度更新前應先核對來源學年度、資料筆數與校碼，再執行 `scripts/import_moe_school_directory_115.sql` 的年度調整版本。

## 教材與課綱目錄

- 已建立出版社、教材版本、階層式單元、知識點、單元－知識點關聯、能力／認知／難度標籤與學生教材選擇資料表。
- 已建立康軒、翰林、南一、何嘉仁、佳音、南億興業等出版社資料及 13 個通用學習標籤。
- 已依國家教育研究院 115 學年度審定本清冊，匯入 238 組國小／國中五科各年級、第一冊／第二冊的有效可選審定出版社組合；各校實際採用版本仍需由學生依學校課本確認。
- 已建立 115 學年度審定本可選版本（出版社／年級／冊次）。
- 各出版社實際目錄、課文、單元章節與知識點內容尚未匯入；介面不會虛構教材資訊。
- 目前 `curriculum_units`、`knowledge_points`、`unit_knowledge_points` 尚無資料。

## 資料庫安全

- 全部 13 張 public 資料表均啟用 RLS。
- `anon` 不具備 public 資料表或序列權限。
- `authenticated` 僅保留應用程式需要的最小資料表權限；行資料存取再由 RLS 控制。
- 已收緊 postgres migration owner 的預設權限，未來新建 public 資料表、序列與函式不會自動授權給 anon／authenticated。
- Supabase Security Advisor 目前仍提示 Leaked Password Protection 未啟用。這項功能需 Pro 以上方案；目前 Free 方案尚無法開啟。
- 6 個字元為目前應用程式與 Supabase Auth 的最低密碼長度；建議使用者採用更長且不重複的密碼。

## Migration

以下 Migration 已套用至東京 Supabase 專案，且檔案已提交至 Repository：

1. `supabase/migrations/20261109054935_initial_learning_radar_schema.sql`
2. `supabase/migrations/20261109054953_index_student_profile_school_fk.sql`
3. `supabase/migrations/20261109060308_phase2_curriculum_catalog.sql`
4. `supabase/migrations/20261109060706_seed_naer_115_textbook_editions.sql`
5. `supabase/migrations/20261109060932_correct_grade9_social_approved_publishers.sql`
6. `supabase/migrations/20261109080737_tighten_public_table_grants.sql`
7. `supabase/migrations/20261109081145_tighten_public_default_privileges.sql`

## 本機啟動

1. `npm install`
2. 複製 `.env.example` 為 `.env.local`
3. 設定 `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. 正式信箱導回測試前，依前述章節設定 Supabase Auth Site URL／Redirect URLs。
5. `npm run dev`

## 尚待完成（產品功能）

- 真實電子郵件註冊、驗證、重新寄送與登入端到端測試。
- 學生資料、學校搜尋、五科教材選擇的登入後儲存測試。
- 各出版社教材單元、知識點及題目內容的官方／授權資料建檔。
- 題庫、AI 出題與答案驗證、段考範圍媒合、測驗作答及學習分析。
- 對外開放前完成兒少隱私告知、必要的家長／監護人同意流程與服務條款。

## 安全注意

- `SUPABASE_SERVICE_ROLE_KEY` 或 Supabase Secret Key 絕不可放在任何 `NEXT_PUBLIC_*` 變數。
- 不要在前端自行指定 `user_id`；由 Supabase Auth session 決定使用者身分。
- 維持 public 資料表 RLS 與最小權限政策。
- 實際教材資料必須有可核對來源或授權，不得捏造教材章節、試題來源或答案。
