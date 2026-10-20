import argparse
import requests
import sys
import os
import json
from urllib.parse import urlparse

__version__ = "1.0.0"

def create_parser():
    parser = argparse.ArgumentParser(description="一個類似 curl 的 HTTP 請求 CLI 工具 (具備 25+ 指令)")
    
    # 1. 目標 URL (位置參數)
    parser.add_argument("url", help="目標 URL")
    
    # --- 請求方法與標頭 (Request Method & Headers) ---
    # 2. -X, --request
    parser.add_argument("-X", "--request", dest="method", help="指定 HTTP 請求方法 (GET, POST, PUT, DELETE 等)")
    # 3. -H, --header
    parser.add_argument("-H", "--header", action="append", help="自訂 HTTP 標頭 (可多次使用)")
    # 4. -A, --user-agent
    parser.add_argument("-A", "--user-agent", help="指定 User-Agent 字串")
    # 5. -e, --referer
    parser.add_argument("-e", "--referer", help="指定來源網址 (Referer)")
    # 6. -b, --cookie
    parser.add_argument("-b", "--cookie", help="傳送 Cookie 資料字串或檔案")
    
    # --- 請求資料 (Request Data) ---
    # 7. -d, --data
    parser.add_argument("-d", "--data", help="傳送 HTTP POST 資料")
    # 8. --data-raw
    parser.add_argument("--data-raw", help="傳送原始 HTTP POST 資料 (不進行處理)")
    # 9. -F, --form
    parser.add_argument("-F", "--form", action="append", help="模擬 HTTP 加上 multipart/form-data 的表單資料")
    # 10. -T, --upload-file
    parser.add_argument("-T", "--upload-file", help="上傳指定的本地檔案")
    
    # --- 輸出控制 (Output Control) ---
    # 11. -o, --output
    parser.add_argument("-o", "--output", help="將輸出寫入檔案，而非標準輸出 (stdout)")
    # 12. -O, --remote-name
    parser.add_argument("-O", "--remote-name", action="store_true", help="將輸出寫入與遠端檔案同名的本地檔案")
    # 13. -i, --include
    parser.add_argument("-i", "--include", action="store_true", help="在輸出中包含 HTTP 回應標頭")
    # 14. -I, --head
    parser.add_argument("-I", "--head", action="store_true", help="僅取得 HTTP 標頭 (等同於 HEAD 請求)")
    # 15. -s, --silent
    parser.add_argument("-s", "--silent", action="store_true", help="靜默模式，不顯示進度或錯誤訊息")
    # 16. -v, --verbose
    parser.add_argument("-v", "--verbose", action="store_true", help="詳細模式，顯示請求與回應的詳細資訊")
    
    # --- 連線設定與安全性 (Connection & Security) ---
    # 17. -L, --location
    parser.add_argument("-L", "--location", action="store_true", help="自動跟隨伺服器的重新導向 (Redirects)")
    # 18. --connect-timeout
    parser.add_argument("--connect-timeout", type=float, help="允許連線的最大時間 (秒)")
    # 19. -m, --max-time
    parser.add_argument("-m", "--max-time", type=float, help="允許傳輸的最大總時間 (秒)")
    # 20. -k, --insecure
    parser.add_argument("-k", "--insecure", action="store_true", help="允許不安全的伺服器連線 (忽略 SSL 憑證驗證)")
    # 21. -x, --proxy
    parser.add_argument("-x", "--proxy", help="使用指定的 Proxy 伺服器 (例如: http://proxy:port)")
    # 22. -u, --user
    parser.add_argument("-u", "--user", help="伺服器驗證資訊，格式為 USER:PASSWORD")
    
    # --- 其他進階選項 (Advanced) ---
    # 23. -c, --cookie-jar
    parser.add_argument("-c", "--cookie-jar", help="將請求完成後的 Cookie 寫入指定檔案")
    # 24. --compressed
    parser.add_argument("--compressed", action="store_true", help="要求壓縮的回應 (支援 gzip, deflate 等)")
    # 25. -V, --version
    parser.add_argument("-V", "--version", action="version", version=f"mycurl/{__version__}", help="顯示版本號碼並退出")
    # 26. --json
    parser.add_argument("--json", help="傳送 JSON 格式資料並自動設定 Content-Type: application/json")

    return parser

def main():
    parser = create_parser()
    args = parser.parse_args()

    url = args.url
    if not url.startswith('http://') and not url.startswith('https://'):
        url = 'http://' + url

    # 決定 HTTP Method
    method = "GET"
    if args.head:
        method = "HEAD"
    elif args.data or args.data_raw or args.form or args.json:
        method = "POST"
    if args.method:
        method = args.method.upper()

    # 準備 Headers
    headers = {}
    if args.header:
        for h in args.header:
            if ':' in h:
                k, v = h.split(':', 1)
                headers[k.strip()] = v.strip()
    
    if args.user_agent:
        headers["User-Agent"] = args.user_agent
    if args.referer:
        headers["Referer"] = args.referer
    if args.compressed:
        headers["Accept-Encoding"] = "gzip, deflate, br"
    if args.json:
        headers["Content-Type"] = "application/json"
        headers["Accept"] = "application/json"

    # 準備 Data
    request_data = None
    if args.data:
        request_data = args.data
    elif args.data_raw:
        request_data = args.data_raw
    elif args.json:
        request_data = args.json
    
    # 檔案上傳
    files = None
    if args.upload_file:
        try:
            files = {'file': open(args.upload_file, 'rb')}
            method = "PUT" if not args.method else method
        except FileNotFoundError:
            print(f"錯誤: 找不到檔案 {args.upload_file}", file=sys.stderr)
            sys.exit(1)

    # Proxy 與 驗證
    proxies = None
    if args.proxy:
        proxies = {"http": args.proxy, "https": args.proxy}
    
    auth = None
    if args.user:
        if ':' in args.user:
            auth = tuple(args.user.split(':', 1))
        else:
            auth = (args.user, "")

    # Cookie 處理
    cookies = None
    if args.cookie:
        cookies = {}
        for cookie in args.cookie.split(';'):
            if '=' in cookie:
                k, v = cookie.split('=', 1)
                cookies[k.strip()] = v.strip()

    # Timeouts
    timeout_config = None
    if args.connect_timeout and args.max_time:
        timeout_config = (args.connect_timeout, args.max_time)
    elif args.max_time:
        timeout_config = args.max_time
    elif args.connect_timeout:
        timeout_config = (args.connect_timeout, None)

    # 準備 Request 參數
    request_kwargs = {
        "method": method,
        "url": url,
        "headers": headers,
        "data": request_data,
        "files": files,
        "auth": auth,
        "proxies": proxies,
        "cookies": cookies,
        "timeout": timeout_config,
        "verify": not args.insecure,
        "allow_redirects": args.location
    }

    if args.verbose and not args.silent:
        print(f"> {method} {url}")
        for k, v in headers.items():
            print(f"> {k}: {v}")
        print(">")

    try:
        # 發送請求
        response = requests.request(**request_kwargs)

        if args.verbose and not args.silent:
            print(f"< HTTP/{response.raw.version} {response.status_code} {response.reason}")
            for k, v in response.headers.items():
                print(f"< {k}: {v}")
            print("<")

        # 寫入 Cookie Jar
        if args.cookie_jar:
            with open(args.cookie_jar, 'w') as cj:
                json.dump(requests.utils.dict_from_cookiejar(response.cookies), cj)

        output_content = response.text

        # 輸出處理
        if not args.silent:
            if args.include or args.head:
                header_str = f"HTTP/1.1 {response.status_code} {response.reason}\n"
                for k, v in response.headers.items():
                    header_str += f"{k}: {v}\n"
                print(header_str)
            
            if not args.head:
                if args.output:
                    with open(args.output, 'w', encoding='utf-8') as f:
                        f.write(output_content)
                elif args.remote_name:
                    filename = os.path.basename(urlparse(url).path)
                    if not filename:
                        filename = "index.html"
                    with open(filename, 'w', encoding='utf-8') as f:
                        f.write(output_content)
                else:
                    print(output_content)

    except requests.exceptions.RequestException as e:
        if not args.silent:
            print(f"請求錯誤: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if files:
            files['file'].close()

if __name__ == "__main__":
    main()