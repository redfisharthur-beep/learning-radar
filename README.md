# 學習雷達 Learning Radar

國小／國中 AI 智慧段考複習平台。技術採 Next.js App Router、TypeScript、Tailwind CSS、Supabase PostgreSQL/Auth 與 Vercel。

## 正式網站與部署

- Production URL：https://learning-radar-wheat.vercel.app
- Vercel 專案：learning-radar
- Production 部署使用 Vercel Production；Preview 部署保留 SSO 保護。
- Node.js：26.x；GitHub Actions 使用相同版本。
- GitHub Actions 執行 npm ci、TypeScript typecheck 與 Next.js production build。

## Supabase 專案

- 專案：learning-radar
- Region：Tokyo / ap-northeast-1
- Project URL：https://znyxrlgurvvjwyrxepqv.supabase.co
- 前端使用 `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`。
- 不可將 Supabase Secret Key 或 Service Role Key 放入任何 `NEXT_PUBLIC_*` 變數。

## 登入方式（免電子郵件驗證）

- 帳號：電子郵件格式的帳號識別字；不要求使用者收信或點擊驗證連結。
- 密碼：至少 6 個字元。
- 註冊後直接建立 Supabase Auth Session 並進入 Dashboard。
- 登入使用 Email + Password。
- LINE Login 尚未整合；目前先以免驗證的 Email + Password 測試流程為主。

### 必須在 Supabase Hosted Dashboard 關閉 Confirm Email

目前程式已按「免電子郵件驗證」方式實作，但 Hosted Supabase 專案仍必須在 Dashboard 手動關閉：

1. 開啟 Supabase 專案。
2. 進入 Authentication → Sign In / Providers。
3. 展開 Email provider。
4. 關閉 **Confirm email**，儲存變更。

專案設定直達頁：https://supabase.com/dashboard/project/znyxrlgurvvjwyrxepqv/auth/providers

官方文件確認：Hosted 專案預設要求 Email Confirmation；關閉後，註冊會直接回傳 session，並將電子郵件視為已確認。這同時代表任何人都可以用非本人持有的電子郵件字串註冊；測試階段可接受，正式對外開放前必須重新評估垃圾註冊、帳號冒用、密碼重設與兒少保護風險。

`supabase/config.toml` 已加入 `[auth.email] enable_confirmations = false`，供本機 Supabase 開發環境使用。修改此檔案本身不會自動更新 Hosted Dashboard 的設定。

## 目前已實作功能

- Email／Password 註冊、登入、登出（免 Email Confirmation）。
- 註冊成功後取得 Session 並進入 Dashboard；若 Hosted Auth 仍要求驗證，會顯示明確錯誤。
- 學生首頁與受保護的 Dashboard。
- 學生基本資料設定：顯示名稱、學段、年級、學校搜尋與選擇（`/dashboard/profile`）。
- 年級顯示統一採教育階段連續編號：國小 1～6 年級、國中 7～9 年級；資料庫保留 7、8、9 的原始年級值，不轉回國中一、二、三年級。
- 教材版本選擇介面（`/dashboard/textbooks`）：依學段、年級、科目、學年度與冊次篩選。\n- 教材版本頁改為先顯示學校公告自動帶入結果，只有需要時再展開「修改版本」，不再要求學生逐科先手動挑選。\n- 已建立 `school_textbook_adoptions` 學校採用版本資料表，保存學校、學年度、年級、科目、冊次、審核來源網址、公告日期與信心值。\n- 第一批已匯入市立安平國中 115 學年度 26 筆可與審定版本清冊對應的資料。全台學校採用版本資料仍在擴充，尚未達到 3,349 所學校全覆蓋。\n- 若學校公告與國家教育研究院審定可選清冊出現版本不一致，系統不會擅自轉換或猜測，會保留為待確認項目。
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

## 學校教材版本來源與推定規則\n\n- 國家教育研究院審定本清冊只列出各年級可使用的審定出版社，不等於各校實際採用版本。\n- 學校實際版本優先採用該校教務處公告，保存公告連結與日期供使用者核對。\n- 目前已匯入 1 所學校的第一批 26 筆可核對資料；全台覆蓋率尚未完成，未有資料時不會自行推測。\n\n## 資料庫安全

- 全部 13 張 public 資料表均啟用 RLS。
- `anon` 不具備 public 資料表或序列權限。
- `authenticated` 僅保留應用程式需要的最小資料表權限；行資料存取再由 RLS 控制。
- 已收緊 postgres migration owner 的預設權限，未來新建 public 資料表、序列與函式不會自動授權給 anon／authenticated。
- 目前密碼最低長度為 6；建議使用不重複且更長的密碼。
- 關閉 Email Confirmation 會讓使用者以未經驗證的電子郵件字串建立帳號，忘記密碼時無法假設使用者能收到重設信；測試階段請記錄好測試帳號與密碼。
- Supabase Security Advisor 目前仍提示 Leaked Password Protection 未啟用；這項功能需 Pro 以上方案，Free 方案無法開啟。

## Migration

以下 Migration 已套用至東京 Supabase 專案，且檔案已提交至 Repository：

1. `supabase/migrations/20261109054935_initial_learning_radar_schema.sql`
2. `supabase/migrations/20261109054953_index_student_profile_school_fk.sql`
3. `supabase/migrations/20261109060308_phase2_curriculum_catalog.sql`
4. `supabase/migrations/20261109060706_seed_naer_115_textbook_editions.sql`
5. `supabase/migrations/20261109060932_correct_grade9_social_approved_publishers.sql`
6. `supabase/migrations/20261109080737_tighten_public_table_grants.sql`
7. `supabase/migrations/20261109081145_tighten_public_default_privileges.sql`\n8. `supabase/migrations/20261109100000_add_school_textbook_adoptions.sql`

## 本機啟動

1. `npm install`
2. 複製 `.env.example` 為 `.env.local`
3. 設定 `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. `npm run dev`

## 尚待完成（產品功能）

- 關閉 Hosted Supabase 的 Confirm Email 並完成一次真實註冊／登入端到端測試。
- 學生資料、學校搜尋、五科教材選擇的登入後儲存測試。
- 各出版社教材單元、知識點及題目內容的官方／授權資料建檔。
- 題庫、AI 出題與答案驗證、段考範圍媒合、測驗作答及學習分析。
- 對外開放前完成兒少隱私告知、必要的家長／監護人同意流程與服務條款。
- 正式營運前重新評估免驗證 Email 註冊的濫用風險與帳號復原方案。

## 安全注意

- `SUPABASE_SERVICE_ROLE_KEY` 或 Supabase Secret Key 絕不可放在任何 `NEXT_PUBLIC_*` 變數。
- 不要在前端自行指定 `user_id`；由 Supabase Auth session 決定使用者身分。
- 維持 public 資料表 RLS 與最小權限政策。
- 實際教材資料必須有可核對來源或授權，不得捏造教材章節、試題來源或答案。
