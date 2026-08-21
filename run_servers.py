import os
import sys
import time
import urllib.request
import webbrowser
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"
BACKEND_DIR = ROOT_DIR / "backend"

def is_port_listening(port: int) -> bool:
    try:
        urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=1)
        return True
    except Exception:
        return False

def main():
    print("=" * 60)
    print("      Store Finder 品牌实体门店与专柜搜索引擎 - 启动器")
    print("=" * 60)
    print("\n[*] 正在启动后台服务...")

    # 1. Start FastAPI Backend if not running
    try:
        backend_proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
            cwd=str(BACKEND_DIR),
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        )
        print("[OK] FastAPI 后端服务已唤起 (127.0.0.1:8000)")
    except Exception as e:
        print(f"[!] 后端启动提示: {e}")

    # 2. Start Next.js Frontend
    try:
        frontend_proc = subprocess.Popen(
            ["npm.cmd" if os.name == 'nt' else "npm", "run", "dev"],
            cwd=str(FRONTEND_DIR),
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        )
        print("[OK] Next.js 前端服务已唤起 (127.0.0.1:5199)")
    except Exception as e:
        print(f"[!] 前端启动提示: {e}")

    # 3. Wait for frontend to be ready
    print("[*] 正在等待页面就绪并唤起浏览器...")
    ready = False
    for _ in range(25):
        time.sleep(1)
        if is_port_listening(5199):
            ready = True
            break

    # 4. Open default browser
    webbrowser.open("http://127.0.0.1:5199")
    print("\n" + "=" * 60)
    print("  [SUCCESS] Store Finder 已成功启动并在浏览器中打开！")
    print("  - 前台搜索主页: http://127.0.0.1:5199")
    print("  - B端管理后台 : http://127.0.0.1:5199/admin")
    print("=" * 60)

if __name__ == "__main__":
    main()
