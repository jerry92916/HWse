# Week 10 — COURTSIDE Roster（JSR）

**資工四｜111210529｜陳宏傑**

## JSR 套件資訊

- 套件名稱：[`@courtside-roste/roster`](https://jsr.io/@courtside-roste/roster@0.1.0)
- 已發布版本：`0.1.0`
- Scope：`courtside-roste`
- Package name：`roster`
- 授權：MIT
- 匯出入口：`node/index.ts`

這個套件把 week9 COURTSIDE 球員網站使用的名單處理邏輯整理為可重用的 JavaScript / TypeScript 函式。它接收呼叫者提供的球員 JSON，提供名單驗證、球員搜尋、位置篩選和 ID 查詢。

## week9 與 week10

week9 的 COURTSIDE 是部署在 Cloudflare Pages 的繁體中文 NBA 球員介紹網站：[開啟網站](https://courtside-nba-7y4.pages.dev)。它呈現 30 支球隊的現役球員，提供搜尋、位置篩選、收藏和球員介紹；介紹視窗會載入 ESPN 的最新例行賽數據。

week9 的 `scripts/update-rosters.js` 從 ESPN 公開 API 更新球員名單，產生 `week9/data/players.json`。week10 的 JSR 套件使用相同的 JSON 資料格式，讓其他 Deno 或相容 TypeScript 的程式能重用名單處理功能。

套件不會連線 ESPN、不會更新球員資料，也不會部署 week9 網站；資料必須由呼叫者自行讀取後傳入。week9 靜態網站目前沒有直接匯入這個套件。

## 實作方式

### 輸入資料

套件接受已解析的 JSON 物件，主要使用 `teamCount`、`playerCount` 和 `players` 欄位。球員資料至少需要 `id`、`name`、`teamAbbreviation` 和 `group`。

### 程式結構

- `node/index.js`：JavaScript 核心實作，包含驗證、搜尋和查詢；沒有外部 runtime 相依套件。
- `node/index.ts`：JSR 使用的 TypeScript 入口，定義 `Roster`、`Player`、`PlayerGroup` 等型別，並將三個公開函式轉交給 `index.js`，避免重複維護兩份邏輯。
- `node/deno.json`：設定 JSR 套件名稱、版本、授權及 `index.ts` 匯出入口。
- `node/test/roster.test.js`：使用共用測試資料，測試正常名單、搜尋與位置篩選、ID 查詢及不合法資料。
- `fixtures/sample-roster.json`：提供本機測試使用的範例名單。

### 公開函式

- `validateRoster(roster)`：檢查隊伍數是否為 30、球員陣列是否非空、`playerCount`（若提供）是否相符、必填欄位與位置群組是否合法，以及球員 ID 是否重複。驗證成功回傳 `true`，不符合時會丟出錯誤。
- `searchPlayers(roster, query = "", options = {})`：對球員姓名、英文或中文隊名、隊名縮寫、位置及背號進行不區分大小寫的部分比對。`options.group` 可指定 `guard`、`forward` 或 `center`；空查詢會列出符合位置條件的球員。
- `getPlayer(roster, id)`：依球員 ID 查詢，找不到時回傳 `null`。

## 安裝與使用

需要 Deno。於使用者的 Deno 專案目錄加入已發布版本：

```powershell
deno add jsr:@courtside-roste/roster@0.1.0
```

以下範例假設 `players.json` 已放在程式執行目錄：

```ts
import {
  getPlayer,
  searchPlayers,
  validateRoster,
} from "@courtside-roste/roster";

const roster = JSON.parse(await Deno.readTextFile("players.json"));

validateRoster(roster);
const lakersPlayers = searchPlayers(roster, "los angeles");
const guards = searchPlayers(roster, "", { group: "guard" });
const lebron = getPlayer(roster, "2544");

console.log(`找到 ${lakersPlayers.length} 位洛杉磯球員`);
console.log(`找到 ${guards.length} 位後衛`);
console.log(lebron?.name ?? "找不到球員");
```

`players.json` 可使用 week9 更新程式產生的 `week9/data/players.json`；請依執行目錄調整檔案路徑。

## 本機測試與發布檢查

在專案的 `week10/node` 目錄執行：

```powershell
Set-Location 'C:\Users\宏傑\OneDrive\桌面\HWse hw1\week10\node'
node --test
deno publish --dry-run --allow-dirty
```

`node --test` 執行套件測試；`deno publish --dry-run` 會檢查 JSR 套件內容、入口和型別，但不會發布。`--allow-dirty` 用於工作目錄有未提交變更的情況；執行前應確認 dry run 列出的檔案都是預期內容。

## 發布新版本

`@courtside-roste/roster@0.1.0` 已發布。JSR 的已發布版本不會因修改本機檔案而變更；更新程式碼或說明時，請先將 `node/deno.json` 的 `version` 改為尚未發布的新版本（例如 `0.1.1`），再執行測試、dry run 和發布：

```powershell
deno publish --allow-dirty
```

首次或新的發布授權會透過瀏覽器完成。確認頁面顯示正確套件名稱與版本後，再授權 Deno；成功時命令列會顯示新的 JSR 套件網址。
