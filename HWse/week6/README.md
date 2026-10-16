# Week 6 - Docker 微服務架構實作

這週的專案主要是練習 Docker 的多容器部署。把系統解耦成前端、後端與資料庫，並在最外面架一個 Nginx 當作 Reverse Proxy，建立一個基本的 4 層微服務架構。

## 系統架構

整個系統透過 docker-compose 跑在同一個內部網路裡，主要包含這四個部分：

1. Nginx (Reverse Proxy)
   - 對外的唯一入口，開 port 80。
   - 負責把外部瀏覽器的請求，轉發給內部的 Frontend 容器。

2. Frontend (Flask)
   - 負責網頁介面，用 Tailwind CSS 簡單刻了一個儀表板。
   - 負責打後端 API 抓資料來渲染畫面。

3. Backend (FastAPI)
   - 處理核心邏輯，包含系統資源監控、產生密碼等 API。
   - 負責跟 PostgreSQL 資料庫連線。
   - 為了開發測試方便，有額外對外開 port 8000，可以直接戳 API 檢查資料。

4. Database (PostgreSQL)
   - 關聯式資料庫。
   - 有掛載 volume (postgres_data)，免得重開 container 之後資料不見。

## 啟動與測試

### 踩坑紀錄與注意事項
- 跑指令前，要確認 Docker Desktop 有打開（右下角要有鯨魚圖示且顯示 Engine running）。
- 終端機的路徑一定要切進 `week6` 資料夾，不然下指令會報錯找不到 docker-compose.yml。

### 執行步驟

1. 建置並啟動系統：
   ```bash
   docker compose up --build## 專案目錄與系統架構

整個系統透過 `docker-compose` 跑在同一個內部網路裡，檔案結構與對應的架構如下：

```text
week6/
├── docker-compose.yml   # 總設定檔，定義所有服務、網路環境與 Database (PostgreSQL)
├── README.md
├── nginx/               # 1. Nginx (Reverse Proxy)
│   └── nginx.conf       # 對外的唯一入口 (port 80)，負責把請求轉發給 frontend:5000
├── frontend/            # 2. Frontend (Flask)
│   ├── Dockerfile       
│   ├── requirements.txt 
│   └── app.py           # 負責 Tailwind 網頁介面，並打 API 向後端抓資料
└── backend/             # 3. Backend (FastAPI)
    ├── Dockerfile       
    ├── requirements.txt 
    └── main.py          # 處理核心邏輯 (系統監控、產生密碼等 API) 與 DB 連線