# hw3 AI多益學習平台
## 資工四 111210529 陳宏傑
這個專案提供多益風格英文練習的自適應學習網站。涵蓋聽力、文法、單字與閱讀題型，可依照學習者的興趣選擇商務情境，並根據作答紀錄提供弱點分析與練習建議。

> 題目為原創學習示範內容，不包含官方考題；這個練習網站與 ETS 及 TOEIC® 測驗無隸屬或背書關係。學習紀錄存在使用者瀏覽器，不需要帳號。

## 功能介紹

### 六種練習題型

| 題型 | 練習內容 |
|---|---|
| Part 2 | 聽力問答，從四個簡短回答中選出合適回應 |
| Part 3 | 聆聽職場對話並回答理解問題 |
| Part 4 | 聆聽廣播、通知或簡短獨白並回答問題 |
| Part 5 | 句子填空，練習文法與商務單字 |
| Part 6 | 短文填空，依照上下文選擇合適詞語 |
| Part 7 | 閱讀電子郵件、公告或商務通知並回答問題 |

### 情境主題

可選擇科技與軟體工程、電子商務、行銷、專案管理、客戶服務、人力資源、商務差旅、餐旅、金融、物流、醫療、永續、教育及房地產等情境，也可以輸入自己的主題，例如「國際咖啡品牌行銷」。

### 其他學習功能

- **聽力播放：** Part 2、Part 3、Part 4 均可播放聽力，支援選擇美式、英式、澳洲或加拿大口音。設定 OpenAI API key 後使用雲端 TTS；Windows 未設定金鑰時使用本機已安裝的英語語音。
- **作答解析：** 作答後顯示正確答案與繁體中文說明；設定 OpenAI API key 後，可取得依照使用者選項生成的 AI 解析。
- **弱點追蹤：** 紀錄文法、單字、閱讀、聽力的答題表現，以圖表呈現能力分布，並建議優先補強的技能。
- **示範模式：** 不設定 API key 也能使用內建原創題庫練習。

## 如何製作

### 使用技術

- **前端：** HTML、CSS、原生 JavaScript，負責頁面呈現、題型選擇、作答互動、圖表與本機學習紀錄。
- **後端：** Node.js 與 Express，提供靜態頁面及 JSON API，處理題目生成、答案解析和語音服務。
- **AI 題目與解析：** 伺服器端呼叫 OpenAI Chat Completions，要求模型以指定 JSON 格式回傳原創題目或解析，再由後端檢查欄位、選項與答案格式。
- **文字轉語音：** 雲端模式呼叫 OpenAI TTS；Windows 示範模式則透過 PowerShell System.Speech 產生 WAV 音訊。
- **學習紀錄：** 使用瀏覽器 `localStorage` 保存作答結果，計算各技能的正確率與補強建議。

### 專案檔案

```text
hw3/
├── public/
│   ├── index.html       # 頁面結構與表單
│   ├── styles.css       # 網頁樣式與響應式版面
│   └── app.js           # 題型互動、API 串接、圖表與學習紀錄
├── tests/
│   └── app.test.js      # API 與題庫測試
├── server.js            # Express 伺服器、題庫、AI 與語音 API
├── package.json         # 執行指令與套件設定
└── README.md            # 專案說明文件
```

題目有兩種來源：沒有 API key 時，後端從內建示範題庫挑選；設定 API key 後，後端會依題型、主題與技能呼叫 AI 產生題目。前端收到題目後負責顯示題目、播放聽力、提交答案並更新本機學習紀錄。

## 如何啟動

### 環境需求

- Node.js 18 以上
- npm
- Windows 離線播放聽力時使用內建 Windows PowerShell 與 System.Speech；目前系統必須安裝所選口音的語音。若未安裝，可設定 OpenAI API key 使用雲端 TTS。

### 安裝與啟動

在專案根目錄的 PowerShell 執行：

```powershell
Set-Location .\hw3
npm install
npm start
```

伺服器啟動後，在瀏覽器開啟 <http://127.0.0.1:3001>。不設定 API key 時，可直接使用示範題庫；完成後在執行伺服器的終端機按 `Ctrl+C` 停止。

### 啟用 AI 出題、解析與雲端語音（選用）

在啟動伺服器的同一個 PowerShell 工作階段設定金鑰。請勿將金鑰寫入前端檔案或提交到版本控制：

```powershell
Set-Location .\hw3
$env:OPENAI_API_KEY = "你的 API 金鑰"
npm start
```

可選環境設定：

```powershell
$env:OPENAI_MODEL = "gpt-4o-mini"
$env:OPENAI_BASE_URL = "https://api.openai.com/v1"
$env:PORT = "3001"
```

AI 出題與解析使用 Chat Completions JSON mode；雲端聽力使用 `gpt-4o-mini-tts`。外部模型與語音 API 可能產生費用，需使用者自行確認金鑰、帳戶權限及服務收費。若本機未安裝所選口音，平台會顯示錯誤提示。

## 執行測試

在專案根目錄執行：

```powershell
npm test --prefix hw3
```

測試涵蓋六種題型的示範題庫、API 輸入驗證、AI 題目與解析格式，以及聽力語音服務。

## API 一覽

| 方法 | 路徑 | 用途 |
|---|---|---|
| `GET` | `/api/health` | 檢查伺服器、AI 及本機語音服務狀態 |
| `POST` | `/api/questions/generate` | 依題型、主題、技能與題數（1–5 題）取得題目 |
| `POST` | `/api/explanations` | 依題目和使用者答案取得解析 |
| `POST` | `/api/speech` | 依文字和口音取得語音；雲端為 MP3，Windows 本機為 WAV |

出題 API 請求範例：

```json
{
  "part": "part5",
  "topic": "電子商務與零售",
  "category": "grammar",
  "count": 5
}
```
