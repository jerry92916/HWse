# Week 10 — COURTSIDE Roster（JSR）

**資工四｜111210529｜陳宏傑**

[`@courtside-roste/roster@0.1.0`](https://jsr.io/@courtside-roste/roster@0.1.0) 是可重複使用的 JavaScript / TypeScript 函式庫，用來驗證和搜尋 week9 COURTSIDE 網站使用的 NBA 球員名單 JSON。

## 與 week9 的關係

week9 的 COURTSIDE 網站介紹 NBA 30 支球隊的現役球員。名單更新程式從 ESPN 公開 API 讀取球員資料，產生 `data/players.json`；靜態網站讀取這份 JSON，呈現球員卡片、搜尋、篩選、收藏及球員介紹。

這個 JSR 套件沿用相同的名單 JSON 格式，提供通用的資料驗證、搜尋、位置篩選和 ID 查詢。套件只處理呼叫者傳入的資料，不會連線 ESPN、更新球員名單或部署 Cloudflare Pages 網站。week9 靜態網站目前沒有直接匯入這個套件。

## 實作方式

- `index.js`：JavaScript 核心實作，沒有執行時期的外部相依套件。
- `index.ts`：JSR 匯出入口，提供 TypeScript 型別並轉呼叫 `index.js`，避免重複維護兩份邏輯。
- `deno.json`：設定 JSR 套件名稱、版本、授權及匯出入口。
- `test/roster.test.js`：使用共用範例名單，測試驗證、搜尋、位置篩選、ID 查詢和錯誤資料處理。

### 公開 API

- `validateRoster(roster)`：檢查隊伍數是否為 30、球員陣列是否非空、`playerCount`（若提供）是否相符、必填欄位與位置群組是否合法，以及球員 ID 是否重複。驗證成功回傳 `true`，不符合時會丟出錯誤。
- `searchPlayers(roster, query = "", options = {})`：對球員姓名、英文或中文隊名、隊名縮寫、位置及背號進行不區分大小寫的部分比對。`options.group` 可指定 `guard`、`forward` 或 `center`；空查詢會列出符合位置條件的球員。
- `getPlayer(roster, id)`：依球員 ID 查詢，找不到時回傳 `null`。

## 安裝與使用

使用 Deno 在專案中加入已發布的版本：

```powershell
deno add jsr:@courtside-roste/roster@0.1.0
```

以下範例假設 `players.json` 位於程式執行目錄：

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

你可以使用 week9 名單更新程式產生的 `players.json`；請依程式執行目錄調整檔案路徑。

## 本機測試與發布檢查

在 `week10/node` 目錄執行：

```powershell
node --test
deno publish --dry-run --allow-dirty
```

`node --test` 會執行本機測試；`deno publish --dry-run` 會檢查套件檔案、JSR 入口與公開型別，但不會發布。工作目錄有未提交變更時才使用 `--allow-dirty`，並先確認 dry run 列出的檔案都是預期內容。

## 發布新版本

版本 `0.1.0` 已發布。更新程式碼或說明後，請先將 `deno.json` 的版本改為尚未發布的版本（例如 `0.1.1`），再執行測試、dry run，最後發布：

```powershell
deno publish --allow-dirty
```

Deno 會開啟瀏覽器進行登入與授權。核對套件名稱和版本後再允許發布。已發布版本的 README 是當時的快照；修改本機檔案不會改變既有版本，必須發布新版本才會更新 JSR 套件頁內容。
