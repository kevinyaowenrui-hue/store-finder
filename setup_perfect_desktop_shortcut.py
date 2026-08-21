import os
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
ICON_PATH = ROOT_DIR / "app_icon.ico"
NODE_EXE = "F:\\Node.js\\node.exe"

# 1. 启动_Store_Finder.bat
start_bat = f"""@echo off
title Store Finder 品牌门店搜索引擎
cd /d "%~dp0"
"{NODE_EXE}" "%~dp0launcher.js"
"""

with open(ROOT_DIR / "启动_Store_Finder.bat", "wb") as f:
    f.write(start_bat.encode("gbk"))

with open(ROOT_DIR / "start.bat", "wb") as f:
    f.write(start_bat.encode("gbk"))

# 2. 关闭_Store_Finder.bat
stop_bat = """@echo off
title 关闭 Store Finder
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000,5199 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo [OK] Store Finder 后台服务已全部关闭。
ping 127.0.0.1 -n 2 >nul
"""

with open(ROOT_DIR / "关闭_Store_Finder.bat", "wb") as f:
    f.write(stop_bat.encode("gbk"))

with open(ROOT_DIR / "stop.bat", "wb") as f:
    f.write(stop_bat.encode("gbk"))

# 3. Create/Update Desktop Shortcut
# TargetPath: F:\Node.js\node.exe
# Arguments: "F:\antigravity exports\store finder\launcher.js"
# WorkingDirectory: F:\antigravity exports\store finder
# IconLocation: F:\antigravity exports\store finder\app_icon.ico,0
vbs_script = f'''Set ws = CreateObject("WScript.Shell")
desktop = ws.SpecialFolders("Desktop")
shortcutPath = desktop & "\\Store Finder 品牌门店搜索引擎.lnk"
Set shortcut = ws.CreateShortcut(shortcutPath)
shortcut.TargetPath = "{NODE_EXE}"
shortcut.Arguments = Chr(34) & "{ROOT_DIR}\\launcher.js" & Chr(34)
shortcut.WorkingDirectory = "{ROOT_DIR}"
shortcut.IconLocation = "{ICON_PATH},0"
shortcut.Description = "Store Finder 品牌实体门店与专柜搜索引擎"
shortcut.Save
'''

MAKER_VBS = ROOT_DIR / "update_shortcut.vbs"
with open(MAKER_VBS, "w", encoding="gbk") as f:
    f.write(vbs_script)

subprocess.run(["cscript", "//nologo", str(MAKER_VBS)], check=True)
if MAKER_VBS.exists():
    os.remove(MAKER_VBS)

print("Desktop Shortcut & Batch scripts updated successfully!")
