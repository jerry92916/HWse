from flask import Flask, render_template_string, jsonify
import requests

app = Flask(__name__)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>進階微服務儀表板</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-slate-100 text-slate-800 font-sans min-h-screen flex flex-col items-center py-10">
    
    <div class="w-full max-w-4xl px-4">
        <header class="mb-8 text-center">
            <h1 class="text-4xl font-extrabold text-indigo-600 mb-2"><i class="fa-brands fa-docker mr-2"></i>Docker 微服務儀表板</h1>
            <p class="text-slate-500">FastAPI 後端 × Flask 前端 × Tailwind UI × PostgreSQL</p>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 class="text-xl font-bold mb-4 border-b pb-2"><i class="fa-solid fa-server text-blue-500 mr-2"></i>API 伺服器狀態</h2>
                <div class="space-y-3" id="status-box">
                    <p class="text-slate-500 text-sm animate-pulse">與後端連線中...</p>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 class="text-xl font-bold mb-4 border-b pb-2"><i class="fa-solid fa-gauge-high text-emerald-500 mr-2"></i>資源監控 (模擬)</h2>
                <div class="flex justify-between items-center mb-4">
                    <span class="text-slate-600 font-medium">後端 CPU 負載</span>
                    <span id="cpu-val" class="font-bold text-emerald-600">--%</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-2.5 mb-4">
                    <div id="cpu-bar" class="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style="width: 0%"></div>
                </div>
                <button onclick="fetchSystem()" class="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors">
                    <i class="fa-solid fa-arrows-rotate mr-1"></i> 刷新監控數據
                </button>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:col-span-2 flex flex-col md:flex-row items-center justify-between">
                <div class="mb-4 md:mb-0">
                    <h2 class="text-xl font-bold mb-2"><i class="fa-solid fa-key text-amber-500 mr-2"></i>後端密碼運算器</h2>
                    <p class="text-sm text-slate-500">點擊按鈕呼叫 FastAPI 進行運算，並將結果回傳至前端。</p>
                </div>
                <div class="flex items-center space-x-4">
                    <code id="pwd-display" class="bg-slate-800 text-green-400 px-4 py-2 rounded-lg text-lg tracking-wider w-48 text-center select-all">******</code>
                    <button onclick="fetchPassword()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium shadow-md transition-colors">
                        產生密碼
                    </button>
                </div>
            </div>

        </div>
    </div>

    <script>
        async function fetchStatus() {
            try {
                const res = await fetch('/api/data');
                const data = await res.json();
                document.getElementById('status-box').innerHTML = `
                    <div class="flex justify-between mb-2"><span class="text-slate-500 font-medium">API 狀態</span> <span class="font-bold text-green-600">${data.status}</span></div>
                    <div class="flex justify-between mb-2"><span class="text-slate-500 font-medium">DB 狀態</span> <span class="font-bold text-blue-600">${data.db_status}</span></div>
                    <div class="flex justify-between"><span class="text-slate-500 font-medium">來源服務</span> <span class="font-bold text-slate-700">${data.service}</span></div>
                    <div class="flex justify-between mt-2 pt-2 border-t border-slate-100"><span class="text-slate-400 text-sm">最後更新時間</span> <span class="font-mono text-xs text-slate-500 mt-1">${data.timestamp}</span></div>
                `;
            } catch (e) {
                document.getElementById('status-box').innerHTML = `<p class="text-red-500 text-sm"><i class="fa-solid fa-triangle-exclamation mr-1"></i>無法連線到後端 API</p>`;
            }
        }

        async function fetchSystem() {
            try {
                const res = await fetch('/api/system');
                const data = await res.json();
                document.getElementById('cpu-val').innerText = data.cpu;
                document.getElementById('cpu-bar').style.width = data.cpu;
            } catch (e) {}
        }

        async function fetchPassword() {
            try {
                document.getElementById('pwd-display').innerText = "運算中...";
                const res = await fetch('/api/password');
                const data = await res.json();
                document.getElementById('pwd-display').innerText = data.password;
            } catch (e) {
                document.getElementById('pwd-display').innerText = "Error";
            }
        }

        fetchStatus();
        fetchSystem();
    </script>
</body>
</html>
"""

@app.route("/")
def home():
    return render_template_string(HTML_TEMPLATE)

@app.route("/api/data")
def api_data():
    try:
        return jsonify(requests.get("http://backend:8000/data").json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/system")
def api_system():
    try:
        return jsonify(requests.get("http://backend:8000/system").json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/password")
def api_password():
    try:
        return jsonify(requests.get("http://backend:8000/tool/password").json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)