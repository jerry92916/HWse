# Week 8：AI 客服工單系統

**資工四｜111210529｜陳宏傑**

## 專案介紹

這是一個可操作的客服工單工作台。顧客提交問題後，後端會自動判斷問題分類與優先層級、整理問題摘要，並產生繁體中文建議回覆。客服人員可在收件匣搜尋及篩選工單、更新處理狀態、套用 AI 草稿並記錄回覆對話。

沒有 API 金鑰時，系統會使用內建規則分類，方便直接試用完整流程；設定 OpenAI 或 Anthropic 金鑰後，工單則會送到所選大型語言模型進行分析。AI 服務失敗時會明確顯示錯誤，不會建立一張看似已完成分析的工單。

## 功能

- 建立客服工單，驗證姓名、電子郵件、主旨與問題描述。
- 自動分類為帳務與付款、技術問題、帳戶與登入、訂單與配送或其他問題。
- 自動判斷低、中、高、緊急優先級，產生摘要、建議回覆及信心度。
- 在收件匣搜尋工單，依狀態和分類篩選；儀表板統計不受篩選條件影響。
- 更新待處理、處理中、已解決狀態，並保留顧客與客服的對話紀錄。
- 使用 JSON 檔案持久化工單；伺服器重新啟動後資料仍然保留。
- 在伺服器端串接 OpenAI Chat Completions 或 Anthropic Messages API，API 金鑰不會傳到瀏覽器。

## 專案架構

```text
week8/
├── lib/
│   ├── ticket-store.js   # JSON 工單儲存、篩選與狀態／回覆更新
│   └── triage.js         # 示範分類、OpenAI／Anthropic 串接與輸出驗證
├── public/
│   ├── index.html        # 客服工作台與新增工單表單
│   ├── styles.css        # 米色風格、響應式版面與狀態樣式
│   └── app.js            # 前端收件匣、API 呼叫與回覆操作
├── tests/
│   └── app.test.js       # API、持久化、分類邏輯及兩種 LLM 串接測試
├── data/
│   └── tickets.json      # 執行後自動建立的工單資料（不提交至 Git）
├── server.js             # Express API 與靜態網站伺服器
├── package.json
└── README.md
```

## 環境需求與啟動

- Node.js 18 以上（含 npm）

在 PowerShell 執行：

```powershell
Set-Location .\week8
npm install
npm start
```

開啟 <http://127.0.0.1:3008>。未設定金鑰時，介面會顯示「示範分類模式」，可以直接建立及管理工單。資料預設儲存在 `week8/data/tickets.json`。

### 啟用 OpenAI

在同一個 PowerShell 工作階段設定伺服器環境變數；請勿把金鑰寫進前端檔案、README 或提交至 Git：

```powershell
$env:OPENAI_API_KEY = "你的 OpenAI API 金鑰"
$env:AI_PROVIDER = "openai"
$env:AI_MODEL = "gpt-4o-mini"
npm start
```

可選設定：

```powershell
$env:OPENAI_BASE_URL = "https://api.openai.com/v1"
$env:PORT = "3008"
$env:TICKET_DATA_FILE = "C:\support-data\tickets.json"
```

### 啟用 Anthropic

```powershell
$env:AI_PROVIDER = "anthropic"
$env:ANTHROPIC_API_KEY = "你的 Anthropic API 金鑰"
$env:AI_MODEL = "claude-3-5-haiku-latest"
npm start
```

使用模型 API 可能產生費用；請確認金鑰、模型權限與服務收費。模型回應會由後端驗證分類、層級、摘要、回覆及信心度格式；若服務逾時、失敗或回傳不合格式，API 會回報錯誤，不會以示範結果冒充 AI 分析。

## API

| 方法 | 路徑 | 用途 |
|---|---|---|
| `GET` | `/api/health` | 取得服務狀態與 AI／示範模式（不回傳 API 金鑰） |
| `GET` | `/api/tickets` | 列出工單；可用 `search`、`status`、`category` 篩選，並回傳未篩選的統計 |
| `GET` | `/api/tickets/:id` | 取得單張工單與對話紀錄 |
| `POST` | `/api/tickets` | 建立工單並執行 AI 分類或示範規則分類 |
| `PATCH` | `/api/tickets/:id/status` | 更新狀態為 `open`、`in_progress` 或 `resolved` |
| `POST` | `/api/tickets/:id/replies` | 新增客服回覆並保存至對話紀錄 |

建立工單範例：

```json
{
  "customerName": "林小明",
  "customerEmail": "ming@example.com",
  "subject": "訂單重複扣款",
  "message": "我的訂單被重複扣款，請協助確認這筆付款。"
}
```

成功時回傳工單識別碼、狀態、分類、優先層級、摘要、建議回覆、信心度、分析來源及建立時間。

## 執行測試

在專案根目錄執行：

```powershell
npm test --prefix week8
```

測試不需要 API 金鑰或網路連線；OpenAI 與 Anthropic 的 HTTP 請求以模擬回應測試。涵蓋工單輸入驗證、API 狀態碼、篩選統計、資料持久化、模型輸出驗證、錯誤處理及兩家供應商的請求格式。
