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
- 教材版本頁（`/dashboard/textbooks`）先依學校公告自動帶入版本，只有需要時才展開「修改版本」。
- 教材版本頁提供 OneClass 與 AIMii（EduBaania）外部交叉查核入口。
- 學校公告的原始出版社名稱與「審定版本資料庫」中的正式出版者分開保存，避免例如學校稱「翰林」、審定出版者標示「佳音」時發生錯配。
- 教材版本頁改為先顯示學校公告自動帶入結果，只有需要時再展開「修改版本」，不再要求學生逐科先手動挑選。
- 已建立 `school_textbook_adoptions` 學校採用版本資料表，保存學校、學年度、年級、科目、冊次、審核來源網址、公告日期與信心值。
- 第一批已匯入市立安平國中 115 學年度 26 筆可與審定版本清冊對應的資料。全台學校採用版本資料仍在擴充，尚未達到 3,349 所學校全覆蓋。
- 若學校公告與國家教育研究院審定可選清冊出現版本不一致，系統不會擅自轉換或猜測，會保留為待確認項目。
- 學生資料及教材選擇由 Supabase RLS 限制使用者只能管理自己的資料。
- AI 智慧出題（`/dashboard/practice/new`）：依學生年級、五科、學期、使用者輸入的段考範圍，產生 5 或 10 題四選一原創練習題。
- 支援基礎／進階／挑戰／混合難度；每題包含正確答案、觀念標籤與逐題解析。
- 完成作答後自動批改、計算分數、保存作答紀錄；可查看個人題本歷史（`/dashboard/practice`）。
- AI 透過 OpenAI Responses API + Structured Outputs 產生結構化題目；使用 `gpt-6-luna` 作為預設模型，伺服器端使用 `OPENAI_API_KEY`，不會把金鑰送到瀏覽器。
- 每個帳號每 24 小時最多產生 5 份題本；每份可選 5 或 10 題。
- 題目為 AI 原創練習題，不宣稱為歷屆試題；教材目錄尚未匯入時，以學生指定範圍為準，不虛構課本單元。
- 正確答案與逐題解析只由伺服器讀取；資料庫限制瀏覽器無法直接讀取 `practice_questions` 與 `practice_attempts`，並由 Postgres trigger 重新計算分數。

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

## 學校教材版本來源與推定規則

- 國家教育研究院審定本清冊提供的是可使用的審定出版社／冊次，不等於各校實際採用版本。
- 學校實際版本優先採用該校教務處公告，保存公告連結、公告日期、原文出版社名稱與比對證據。
- OneClass 查詢入口：https://version.oneclass.com.tw/
- AIMii（EduBaania）查詢入口：https://school.edubaania.com/textbooks/
- OneClass 頁面定位為審定本使用版本查詢；AIMii 說明資料彙整自出版社公開資訊並交叉核對。兩者作為第二來源，不取代學校公告。
- 已建立 `school_textbook_adoption_evidence` 保存官方公告及第二來源的查核軌跡。
- 已匯入彰化縣立秀水國中 115 學年度七年級五科（國文、英文、數學、自然、社會）第 1、2 學期共 10 筆學校採用版本及 10 筆官方公告證據；教材公告優先於舊的個人選擇，使用者仍可明確手動覆寫。
- 目前完成 1 所學校 115 學年度 30 筆年級／科目／學期資料；全台覆蓋率尚未完成，未有資料時不會自行推測。
- 英文資料名稱對應範例：安平國中公告稱「翰林」，115 學年度英語審定清冊的出版者欄為「佳音」；第三方英文版本整理明確說明佳音對應翰林版。系統保留學校原始標籤，同時指向佳音審定教材。
## 資料庫安全

- 全部 18 張 public 資料表均啟用 RLS。
- `anon` 不具備 public 資料表或序列權限。
- `authenticated` 僅保留應用程式需要的最小資料表權限；行資料存取再由 RLS 控制。
- 已收緊 postgres migration owner 的預設權限，未來新建 public 資料表、序列與函式不會自動授權給 anon／authenticated。
- 目前密碼最低長度為 6；建議使用不重複且更長的密碼。
- 關閉 Email Confirmation 會讓使用者以未經驗證的電子郵件字串建立帳號，忘記密碼時無法假設使用者能收到重設信；測試階段請記錄好測試帳號與密碼。
- Supabase Security Advisor 目前仍提示 Leaked Password Protection 未啟用；這項功能需 Pro 以上方案，Free 方案無法開啟。
- AI 出題使用 `SUPABASE_SERVICE_ROLE_KEY`（僅伺服器）讀寫答案資料；不可新增 `NEXT_PUBLIC_OPENAI_API_KEY` 或把 Supabase Secret Key 暴露到瀏覽器。

## Migration

以下 Migration 已套用至東京 Supabase 專案，且檔案已提交至 Repository：

1. `supabase/migrations/20261109054935_initial_learning_radar_schema.sql`
2. `supabase/migrations/20261109054953_index_student_profile_school_fk.sql`
3. `supabase/migrations/20261109060308_phase2_curriculum_catalog.sql`
4. `supabase/migrations/20261109060706_seed_naer_115_textbook_editions.sql`
5. `supabase/migrations/20261109060932_correct_grade9_social_approved_publishers.sql`
6. `supabase/migrations/20261109080737_tighten_public_table_grants.sql`
7. `supabase/migrations/20261109081145_tighten_public_default_privileges.sql`
8. `supabase/migrations/20261109100000_add_school_textbook_adoptions.sql`
9. `supabase/migrations/20261109110000_preserve_school_publisher_labels_and_evidence.sql`
10. `supabase/migrations/20261109130000_add_ai_practice_question_workflow.sql`
11. `supabase/migrations/20261109140000_secure_practice_answer_access_and_scoring.sql`
12. `supabase/migrations/20261109150000_secure_learning_progress_and_wrong_answer_analytics.sql`
13. `supabase/migrations/20261109153000_record_practice_answers_after_attempt_insert.sql`
14. `supabase/migrations/20261109160000_allow_variable_question_count_for_mistake_reviews.sql`
15. `supabase/migrations/20261109163000_fix_practice_answer_validation_jsonb_count.sql`
16. `supabase/migrations/20261109192049_school_adoptions_and_manual_override.sql`


## AI 出題設定與啟用

- Vercel 專案需在 Settings → Environment Variables 新增 `OPENAI_API_KEY`，環境選 Production；請勿把金鑰貼在聊天訊息、GitHub 或任何 `NEXT_PUBLIC_*` 變數。
- 可選擇設定 `OPENAI_MODEL`；未設定時預設使用 `gpt-6-luna`。
- 儲存環境變數後，重新部署 Production，AI 出題 API 才能真正呼叫模型。
- 尚未設定金鑰時，出題頁會顯示明確的啟用提示，不會產生假題或假裝成功。
- 每次模型呼叫都會保存模型名稱與 token 使用量，供後續成本監控；實際費用依 OpenAI API 當期價格和 token 用量計算。
- 學習歷程（`/dashboard/progress`）：最近 90 天完成練習次數、總作答量、平均得分、整體答對率、近 7 日活動、最近 10 次成績走勢、各科表現與練習紀錄。
- 錯題分析（`/dashboard/practice/mistakes`）：依科目與知識觀念統計答題次數、錯誤次數、答對率、重複答錯觀念，並可回到原題解析。
- 每次作答由資料庫 trigger 自動寫入 `practice_attempt_answers` 逐題資料，保存當時選項、正確答案、是否答對、科目、觀念與時間；此表啟用 RLS 且瀏覽器角色沒有讀取權限，僅伺服器可取用。
- 支援依科目建立錯題再挑戰題本：從該科最近答錯的題目中去重，重新整理最多 10 題，重做後可繼續累積新的學習歷程。這類題本標記為 `mistake_review`，不會冒充新的 AI 生成題。
- API 使用 Structured Outputs 限定題本格式，並由伺服器檢查題數、選項、正確答案欄位與格式。

## 本機啟動

1. `npm install`
2. 複製 `.env.example` 為 `.env.local`
3. 設定 `NEXT_PUBLIC_SUPABASE_URL` 與 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. `npm run dev`

## 尚待完成（產品功能）

- 關閉 Hosted Supabase 的 Confirm Email 並完成一次真實註冊／登入端到端測試。
- 學生資料、學校搜尋、五科教材選擇的登入後儲存測試。
- 各出版社教材單元、知識點及題目內容的官方／授權資料建檔。
- AI 出題、學習歷程及錯題分析第一版已完成；待設定 OpenAI API Key 後，進行真實模型呼叫、跨科出題品質與成本測試。
- 後續擴充題型（非選擇題、素養題、圖表題）、教材單元精準媒合、錯題分析與個人化複習。
- 對外開放前完成兒少隱私告知、必要的家長／監護人同意流程與服務條款。
- 正式營運前重新評估免驗證 Email 註冊的濫用風險與帳號復原方案。

## 安全注意

- `SUPABASE_SERVICE_ROLE_KEY` 或 Supabase Secret Key 絕不可放在任何 `NEXT_PUBLIC_*` 變數。
- 不要在前端自行指定 `user_id`；由 Supabase Auth session 決定使用者身分。
- 維持 public 資料表 RLS 與最小權限政策。
- 實際教材資料必須有可核對來源或授權，不得捏造教材章節、試題來源或答案。
