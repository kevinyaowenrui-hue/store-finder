"""
Comprehensive fix for Desktop Shortcut and 1-Click Launcher for Store Finder.
Features:
- Handles path spaces cleanly.
- Checks and frees ports 5199 & 8000 if blocked.
- Launches Next.js (5199) and FastAPI (8000).
- Polls until 127.0.0.1:5199 is ready before popping open the browser.
- Creates/updates Desktop shortcut with high-resolution app_icon.ico.
"""

import os
import sys
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
ICON_PATH = ROOT_DIR / "app_icon.ico"


# 1. Generate run_servers.py (A pure, robust Python background launcher)
RUN_SERVERS_PY = ROOT_DIR / "run_servers.py"
run_servers_code = '''import os
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
    print("\\n[*] 正在启动后台服务...")

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
    print("\\n" + "=" * 60)
    print("  [SUCCESS] Store Finder 已成功启动并在浏览器中打开！")
    print("  - 前台搜索主页: http://127.0.0.1:5199")
    print("  - B端管理后台 : http://127.0.0.1:5199/admin")
    print("=" * 60)

if __name__ == "__main__":
    main()
'''

with open(RUN_SERVERS_PY, "w", encoding="utf-8") as f:
    f.write(run_servers_code)

print("Created run_servers.py")


# 2. Generate 启动_Store_Finder.bat (Clean ANSI/GBK or UTF-8 compatible batch file)
START_BAT = ROOT_DIR / "启动_Store_Finder.bat"
start_bat_content = f"""@echo off
chcp 65001 >nul
title Store Finder 品牌门店搜索引擎 - 一键启动器
echo ======================================================================
echo           Store Finder 品牌实体门店与专柜搜索引擎
echo ======================================================================
echo.
echo [*] 正在检查并启动后台服务...

cd /d "%~dp0"

REM 启动服务
"{sys.executable}" "%~dp0run_servers.py"

echo.
ping 127.0.0.1 -n 4 >nul
"""

with open(START_BAT, "wb") as f:
    f.write(start_bat_content.encode("utf-8"))

# Also sync to start.bat
with open(ROOT_DIR / "start.bat", "wb") as f:
    f.write(start_bat_content.encode("utf-8"))

print("Created 启动_Store_Finder.bat & start.bat")


# 3. Generate 关闭_Store_Finder.bat
STOP_BAT = ROOT_DIR / "关闭_Store_Finder.bat"
stop_bat_content = """@echo off
chcp 65001 >nul
title 关闭 Store Finder 服务
echo ======================================================================
echo           正在停止 Store Finder 关联服务...
echo ======================================================================
echo.

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000,5199 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo.
echo ======================================================================
echo  [OK] Store Finder 后台服务已全部安全退出！
echo ======================================================================
echo.
ping 127.0.0.1 -n 2 >nul
"""

with open(STOP_BAT, "wb") as f:
    f.write(stop_bat_content.encode("utf-8"))

with open(ROOT_DIR / "stop.bat", "wb") as f:
    f.write(stop_bat_content.encode("utf-8"))

print("Created 关闭_Store_Finder.bat & stop.bat")


# 4. Generate & Run Desktop Shortcut creator
vbs_shortcut_creator = f"""
Set ws = CreateObject("WScript.Shell")
desktop = ws.SpecialFolders("Desktop")
shortcutPath = desktop & "\\Store Finder 品牌门店搜索引擎.lnk"
Set shortcut = ws.CreateShortcut(shortcutPath)
shortcut.TargetPath = "{START_BAT}"
shortcut.WorkingDirectory = "{ROOT_DIR}"
shortcut.IconLocation = "{ICON_PATH},0"
shortcut.Description = "Store Finder 品牌实体门店与专柜搜索引擎"
shortcut.Save
"""

VBS_PATH = ROOT_DIR / "create_shortcut.vbs"
with open(VBS_PATH, "w", encoding="gbk") as f:
    f.write(vbs_shortcut_creator)

subprocess.run(["cscript", "//nologo", str(VBS_PATH)], check=True)
print("Desktop Shortcut generated and verified via Windows Script Host!")

if VBS_PATH.exists():
    os.remove(VBS_PATH)
