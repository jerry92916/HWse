from fastapi import FastAPI
import datetime
import random
import string
import psycopg2
import os

app = FastAPI()

# 測試資料庫連線的函數
def check_db():
    try:
        conn = psycopg2.connect(
            host=os.environ.get("DB_HOST", "db"),
            database=os.environ.get("DB_NAME", "mydb"),
            user=os.environ.get("DB_USER", "myuser"),
            password=os.environ.get("DB_PASSWORD", "mypassword")
        )
        conn.close()
        return "🟢 成功連線到 PostgreSQL"
    except Exception as e:
        return f"🔴 資料庫連線失敗: {e}"

@app.get("/data")
def get_data():
    return {
        "status": "🟢 API 連線成功",
        "message": "微服務 API 運作中",
        "service": "FastAPI (Python 3.10)",
        "db_status": check_db(),  # 回傳資料庫狀態
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

@app.get("/system")
def get_system():
    return {
        "cpu": f"{random.randint(10, 60)}%",
        "ram": f"{random.randint(30, 80)}%",
        "active_tasks": random.randint(1, 15)
    }

@app.get("/tool/password")
def generate_password():
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    pwd = ''.join(random.choice(chars) for _ in range(12))
    return {"password": pwd}