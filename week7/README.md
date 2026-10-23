# Week 7：四則運算計算機與三種測試

**資工四｜111210529｜陳宏傑**

## 專案介紹

這是一個以 Rust/Axum 建置後端、以 HTML/CSS/JavaScript 建置前端的四則運算計算機。前端透過 HTTP API 傳送運算請求，後端計算後以 JSON 回傳結果。

功能包括：

- 加法、減法、乘法與除法，支援小數及負數。
- 交換兩個輸入數字、清除輸入與結果。
- 顯示目前頁面操作期間最近 8 筆計算紀錄，可載入紀錄或清除紀錄。
- 檢查除以零與超出浮點數範圍的結果，並顯示錯誤訊息。
- 保留 `POST /api/add` 加法端點，並提供支援四種運算的 `POST /api/calculate`。

後端使用 64 位元浮點數（`f64`）運算，數值範圍約至 `1.8 × 10^308`；浮點數精度有限，通常約有 15–17 位有效數字。

## 專案架構

```text
week7/
├── backend/
│   ├── Cargo.toml              # Rust 專案與依賴設定
│   ├── Cargo.lock              # Rust 依賴版本鎖定
│   └── src/
│       └── main.rs             # Axum API、靜態檔案服務與 Rust 單元測試
├── frontend/
│   └── index.html              # 計算機介面、樣式與前端互動
└── qa/
    ├── package.json            # Playwright 測試指令與依賴
    ├── package-lock.json       # Node.js 依賴版本鎖定
    ├── playwright.config.ts    # 測試設定及自動啟動後端
    └── tests/
        ├── api.spec.ts         # Web API 系統測試
        └── app.spec.ts         # 瀏覽器 E2E 測試
```

`backend/src/main.rs` 在 `127.0.0.1:3000` 啟動伺服器，提供 API 並將 `frontend/` 作為靜態網站提供。Playwright 設定會在測試前自動啟動後端；執行 Playwright 測試時不必另外開伺服器。

## 環境需求與首次設定

- Rust 與 Cargo
- Node.js 20 以上（含 npm）

在 PowerShell 中切換到 `week7` 目錄（以下以目前專案根目錄為起點）：

```powershell
Set-Location .\week7
```

首次執行測試時，安裝 QA 套件與 Playwright Chromium 瀏覽器：

```powershell
Set-Location .\qa
npm ci
npm run install:browsers
```

若 PowerShell 找不到 `cargo`，請先安裝 Rust，並重新開啟終端機。

## 執行三種測試

以下指令區塊都以 `week7` 目錄為起點。請先在專案根目錄執行 `Set-Location .\week7`；每個區塊執行後所在目錄可能改變，執行下一個區塊前請先回到 `week7`。

### 1. Rust 單元測試

直接測試後端計算邏輯，涵蓋四種運算、小數、負數、較大數值、除以零與溢位。

```powershell
Set-Location .\backend
cargo test
```

### 2. Web API 系統測試

使用 Playwright 直接呼叫 API，檢查 HTTP 狀態碼、JSON 結果、輸入格式與錯誤情況。

```powershell
Set-Location .\qa
npm run test:api
```

### 3. Chromium 無頭瀏覽器 E2E 測試

使用 Chromium 操作實際網頁，檢查介面、計算結果、錯誤提示、交換輸入與計算紀錄。

```powershell
Set-Location .\qa
npm run test:e2e
```

### 一次執行全部測試

在 `qa` 目錄執行下列指令，依序執行 Rust 單元測試、API 測試及 E2E 測試：

```powershell
npm run test:all
```

如果只要執行全部 Playwright 測試（API + E2E，不含 Rust 單元測試）：

```powershell
npm test
```

Playwright HTML 報告可在測試完成後以此指令開啟：

```powershell
npm run report
```

報告檔案會產生在 `qa/playwright-report/`。

## API 範例

四則運算端點為 `POST /api/calculate`，運算名稱是 `add`、`subtract`、`multiply`、`divide`。例如：

```json
{
  "a": 7,
  "b": 2,
  "operation": "divide"
}
```

成功時回傳：

```json
{
  "result": 3.5
}
```

可在伺服器啟動時以 PowerShell 呼叫 API：

```powershell
Invoke-RestMethod `
  -Uri http://127.0.0.1:3000/api/calculate `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"a":7,"b":2,"operation":"divide"}'
```

除以零或結果溢位時，API 回傳 HTTP 400 與錯誤 JSON；缺少欄位、格式錯誤或不支援的運算則會回傳 HTTP 422。

## 手動啟動網站

若要不透過測試工具，直接啟動網站並手動操作：

```powershell
Set-Location .\backend
cargo run
```

接著在瀏覽器開啟 <http://127.0.0.1:3000>。完成後在執行伺服器的終端機按 `Ctrl+C` 停止。

## 本次測試結果

以下為 **2026-10-23** 實際執行結果：

| 測試類型 | 執行指令 | 結果 |
|---|---|---|
| Rust 單元測試 | `cargo test` | 7 passed，0 failed |
| Web API 系統測試 | `npm run test:api` | 16 passed，0 failed |
| Chromium E2E 測試 | `npm run test:e2e` | 14 passed，0 failed |
| 完整測試套件 | `npm run test:all` | Rust 7 passed；Playwright 30 passed（API 16 + E2E 14） |
