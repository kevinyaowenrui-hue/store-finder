import os
import sys
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
ICON_PATH = ROOT_DIR / "app_icon.ico"
FRONTEND_DIR = ROOT_DIR / "frontend"
BACKEND_DIR = ROOT_DIR / "backend"

# 1. launcher.js (Zero-console-flashing node launcher)
launcher_js = """const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');

const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

// 1. Spawn FastAPI backend in background
try {
  const backend = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
    cwd: BACKEND_DIR,
    stdio: 'ignore',
    detached: true,
    windowsHide: true
  });
  backend.unref();
} catch (e) {}

// 2. Spawn Next.js production/dev server in background
try {
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const frontend = spawn(npmCmd, ['run', 'start'], {
    cwd: FRONTEND_DIR,
    stdio: 'ignore',
    detached: true,
    windowsHide: true
  });
  frontend.unref();
} catch (e) {}

// 3. Poll and open browser
function checkAndOpen(count = 0) {
  if (count > 30) {
    exec('start http://127.0.0.1:5199');
    return;
  }
  const req = http.get('http://127.0.0.1:5199/', (res) => {
    if (res.statusCode === 200) {
      exec('start http://127.0.0.1:5199');
    } else {
      setTimeout(() => checkAndOpen(count + 1), 400);
    }
  });
  req.on('error', () => {
    setTimeout(() => checkAndOpen(count + 1), 400);
  });
}

setTimeout(() => checkAndOpen(0), 600);
"""

with open(ROOT_DIR / "launcher.js", "w", encoding="utf-8") as f:
    f.write(launcher_js)

# 2. run_app.vbs (Runs silently without CMD window)
run_vbs = """Set ws = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
ws.CurrentDirectory = currentDir
ws.Run "node launcher.js", 0, False
"""

with open(ROOT_DIR / "run_app.vbs", "w", encoding="gbk") as f:
    f.write(run_vbs)

# 3. 启动_Store_Finder.bat (Clean GBK / ANSI encoded batch file)
start_bat = """@echo off
cd /d "%~dp0"
wscript.exe "%~dp0run_app.vbs"
"""

with open(ROOT_DIR / "启动_Store_Finder.bat", "wb") as f:
    f.write(start_bat.encode("gbk"))

with open(ROOT_DIR / "start.bat", "wb") as f:
    f.write(start_bat.encode("gbk"))

# 4. 关闭_Store_Finder.bat (Clean GBK / ANSI encoded batch file)
stop_bat = """@echo off
title 关闭 Store Finder
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000,5199 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo [OK] Store Finder 服务已关闭
"""

with open(ROOT_DIR / "关闭_Store_Finder.bat", "wb") as f:
    f.write(stop_bat.encode("gbk"))

with open(ROOT_DIR / "stop.bat", "wb") as f:
    f.write(stop_bat.encode("gbk"))

# 5. Create Desktop Shortcut (.lnk) pointing directly to wscript.exe run_app.vbs
# This gives 100% silent, instant, native Windows startup with zero black boxes!
shortcut_maker_vbs = f'''Set ws = CreateObject("WScript.Shell")
desktop = ws.SpecialFolders("Desktop")
shortcutPath = desktop & "\\Store Finder 品牌门店搜索引擎.lnk"
Set shortcut = ws.CreateShortcut(shortcutPath)
shortcut.TargetPath = "wscript.exe"
shortcut.Arguments = Chr(34) & "{ROOT_DIR}\\run_app.vbs" & Chr(34)
shortcut.WorkingDirectory = "{ROOT_DIR}"
shortcut.IconLocation = "{ICON_PATH},0"
shortcut.Description = "Store Finder 品牌实体门店与专柜搜索引擎"
shortcut.Save
'''

MAKER_FILE = ROOT_DIR / "make_lnk.vbs"
with open(MAKER_FILE, "w", encoding="gbk") as f:
    f.write(shortcut_maker_vbs)

subprocess.run(["cscript", "//nologo", str(MAKER_FILE)], check=True)
if MAKER_FILE.exists():
    os.remove(MAKER_FILE)

print("All launchers and desktop shortcut updated cleanly with 0 console flashing!")
