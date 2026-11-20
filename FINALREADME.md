# 期末作品-寶可夢卡牌市價追蹤、估價與展示系統 
# 資工四 111210529 陳宏傑  
系統初步運作流程概念

1.定時抓價與資料標準化（Workers Cron + Zod）

利用 Cloudflare Workers Cron Triggers 每天定時抓取公開行情（如 TCGplayer、PriceCharting）與即時匯率。

透過 Zod 驗證資料並統一格式（標準化卡號、語言、品相與幣別），過濾異常數值。

將清洗完的每日價格紀錄寫入 Cloudflare D1 資料庫。

2.API 服務與型別共用（Workers + OpenAPI）

提供卡牌查詢、歷史價格與估價計算的 RESTful API，並產出 OpenAPI / Swagger 規格文件。

抽離 Shared Types 讓後端 API、前端網頁與 SDK 共用同一份型別定義，減少串接錯誤。

3.SDK 與 CLI 工具封裝（npm / PyPI）

將 API 呼叫、匯率換算、牌組總價與漲跌幅公式封裝成型別安全的套件。

提供 CLI 指令，讓使用者在終端機就能快速查單卡現價，或匯入清單直接算出總市值。

4.前端展示與價格追蹤（Cloudflare Pages）

卡牌展示：支援依系列、名稱搜尋與瀏覽卡牌圖鑑。

走勢與估價：顯示單卡歷史價格折線圖，並提供個人收藏/牌組清單的總價與漲跌幅統計。

降價通知：設定目標價，當排程抓到低於門檻的行情時自動發送通知（如 Email 或 Discord Webhook）。
