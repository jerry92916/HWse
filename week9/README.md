# week9:COURTSIDE — NBA 球員介紹網站

**資工四｜111210529｜陳宏傑**

🔗 **網站：[https://courtside-nba-7y4.pages.dev](https://courtside-nba-7y4.pages.dev)**

## 專案介紹

COURTSIDE 是一個以繁體中文介紹 NBA 現役球員的響應式網站。網站採用暖米色與橄欖綠的球場風格，彙整 NBA 30 支球隊的球員名單，讓球迷能瀏覽球員、依位置篩選、搜尋球員及球隊，並收藏喜愛的球員。

點選球員卡片可以查看所屬球隊標誌、場上位置、身高，以及最新球季的例行賽場均出賽、得分、籃板、助攻和投籃命中率等數據；精選球星另有球風與生涯亮點介紹。球員收藏儲存在使用者目前的瀏覽器中。

## 專案如何製作

- **前端介面：** 使用 HTML 建立網站結構、CSS 製作米色主題和響應式版面，並以原生 JavaScript 實作球員卡片、搜尋、位置篩選、收藏及介紹視窗，不需要前端框架或執行時期的後端伺服器。
- **球員資料：** Node.js 更新程式從 ESPN 公開 API 讀取 30 支球隊的現役球員名單，整理球員姓名、球隊、隊徽、位置、背號、身高和肖像網址，產生網站使用的 `data/players.json`。隊名會轉換成繁體中文，身高會換算為公分。
- **賽季數據：** 開啟球員介紹時，前端向 ESPN 公開統計 API 載入該球員最新有數據的 NBA 例行賽球季場均表現，並在瀏覽器中快取已載入的結果。
- **球員照片：** 從 ESPN CDN 載入；使用網站時需要網路連線。
- **網站託管：** 使用 Cloudflare Wrangler 將靜態網站部署到 Cloudflare Pages。
- **更新部署：** `npm run deploy` 會先執行 `npm run update-rosters` 更新球員名單，再部署網站。如果資料更新失敗或名單不完整，部署程序會停止。

名單是各隊公開的**現役登錄球員**，不是 NBA 歷年所有球員；一般球員頁面顯示球隊、基本資料與可取得的最新例行賽數據，精選球星則包含額外的球風與生涯亮點。

## 專案結構

```text
week9/
├── data/
│   └── players.json          # 網站球員資料，由更新程式產生
├── scripts/
│   └── update-rosters.js     # 從 ESPN API 更新 30 支球隊名單
├── index.html                # 網站內容與球員介紹視窗
├── styles.css                # 米色主題、互動樣式與響應式版面
├── app.js                    # 搜尋、篩選、收藏與球員資料載入
├── package.json              # 本機預覽、更新名單與部署指令
└── README.md
```

## 本機執行

需要 Node.js 18 或更新版本。在 PowerShell 中執行：

```powershell
cd week9
npm install
npm run dev
```

依 Wrangler 顯示的本機網址開啟網站。球員名單已包含在專案中；要手動更新名單，請執行：

```powershell
npm run update-rosters
```

更新名單需要網路連線。

## 部署到 Cloudflare Pages

先登入 Cloudflare：

```powershell
npx wrangler login
```

接著在 `week9` 目錄中執行：

```powershell
npm run deploy
```

Cloudflare Pages 專案名稱為 `courtside-nba`。部署成功後，Wrangler 會顯示此次部署網址；正式網站網址為：

**https://courtside-nba-7y4.pages.dev**
