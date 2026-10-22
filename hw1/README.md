# MyCurl - Python HTTP Request CLI 工具

MyCurl 是一個使用 Python 與 `requests` 模組打造的命令列工具，完美復刻了 Linux `curl` 的核心體驗。本專案支援超過 25 個核心指令參數，涵蓋自訂標頭、表單傳送、檔案上下傳、Cookie 管理、代理伺服器以及 SSL 憑證忽略等進階功能。

## 系統需求與安裝

請確保您的系統已安裝 **Python 3.6 或以上版本**。

1. **複製專案**：將 `mycurl.py` 下載或複製到您的本地目錄。
2. **安裝依賴套件**：本專案依賴 `requests` 模組來處理 HTTP 請求。

```bash
pip install requests
```

## 核心功能與參數列表

使用以下指令語法來發送請求：
```bash
python mycurl.py [options] <url>
```

支援的參數如下：

### 請求方法與標頭 (Method & Headers)

| 參數 | 說明 |
| :--- | :--- |
| `-X, --request` | 指定 HTTP 請求方法 (GET, POST, PUT, DELETE 等) |
| `-H, --header` | 自訂 HTTP 標頭 (可多次使用，例如 `-H "Content-Type: application/json"`) |
| `-A, --user-agent` | 指定 User-Agent 字串 |
| `-e, --referer` | 指定來源網址 (Referer) |
| `-b, --cookie` | 傳送 Cookie 資料字串或檔案 |

### 請求資料 (Request Data)

| 參數 | 說明 |
| :--- | :--- |
| `-d, --data` | 傳送 HTTP POST 資料 |
| `--data-raw` | 傳送原始 HTTP POST 資料 (不進行處理) |
| `-F, --form` | 模擬 HTTP 加上 `multipart/form-data` 的表單資料 |
| `-T, --upload-file` | 上傳指定的本地檔案 |
| `--json` | 傳送 JSON 格式資料並自動設定 `Content-Type: application/json` |

### 輸出控制 (Output Control)

| 參數 | 說明 |
| :--- | :--- |
| `-o, --output` | 將輸出寫入指定的本地檔案，而非標準輸出 (stdout) |
| `-O, --remote-name` | 將輸出寫入與遠端檔案同名的本地檔案 |
| `-i, --include` | 在輸出結果中包含 HTTP 回應標頭 |
| `-I, --head` | 僅取得 HTTP 標頭 (自動轉換為 HEAD 請求) |
| `-s, --silent` | 靜默模式，不顯示進度或錯誤訊息 |
| `-v, --verbose` | 詳細模式，顯示完整的請求與回應傳輸過程 |

### 連線設定與安全性 (Connection & Security)

| 參數 | 說明 |
| :--- | :--- |
| `-L, --location` | 自動跟隨伺服器的 HTTP 3xx 重新導向 |
| `--connect-timeout`| 允許連線的最大時間 (秒) |
| `-m, --max-time` | 允許傳輸的最大總時間 (秒) |
| `-k, --insecure` | 允許不安全的伺服器連線 (忽略 SSL 憑證驗證) |
| `-x, --proxy` | 使用指定的 Proxy 伺服器 (例如: `http://proxy:port`) |
| `-u, --user` | 伺服器 HTTP 基本驗證資訊，格式為 `USER:PASSWORD` |

### 進階選項 (Advanced)

| 參數 | 說明 |
| :--- | :--- |
| `-c, --cookie-jar` | 將請求完成後伺服器回傳的 Cookie 寫入指定檔案 |
| `--compressed` | 要求壓縮的回應 (自動附加 `Accept-Encoding` 標頭) |
| `-V, --version` | 顯示程式版本號碼並退出 |

---

## 實用測試範例

### 1. 基本 GET 請求
最基礎的用法，直接獲取網頁原始碼並印在終端機上：
```bash
python mycurl.py https://httpbin.org/get
```

### 2. 取得遠端檔案並儲存 (類似下載)
自動跟隨重新導向，並將結果存為 `index.html`：
```bash
python mycurl.py -L https://google.com -o index.html
```

### 3. 發送 JSON 格式的 POST 請求
使用專屬的 `--json` 參數，會自動幫你帶上正確的 Content-Type 標頭：
```bash
python mycurl.py -X POST https://httpbin.org/post --json '{"user": "HongJie", "role": "admin"}'
```

### 4. 檢視詳細的請求與回應標頭 (Debug 模式)
開啟 `-v` (Verbose)，可用於檢查自己送出的 Header 或 Cookie 是否正確：
```bash
python mycurl.py -v https://httpbin.org/headers -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. 測試未經信任的 HTTPS 網站 (忽略 SSL 憑證)
遇到憑證過期或自簽憑證的網站時，使用 `-k` 參數強制連線：
```bash
python mycurl.py -k https://expired.badssl.com/
```

### 6. 限制請求時間
設定連線超時與最大執行時間，避免程式卡死：
```bash
python mycurl.py https://httpbin.org/delay/5 --connect-timeout 2 -m 5
```