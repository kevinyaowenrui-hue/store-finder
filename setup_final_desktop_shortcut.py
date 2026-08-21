import os
import sys
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
ICON_PATH = ROOT_DIR / "app_icon.ico"
RUN_APP_PY = ROOT_DIR / "run_app.py"
PYTHONW_EXE = Path(sys.executable).parent / "pythonw.exe"
if not PYTHONW_EXE.exists():
    PYTHONW_EXE = Path("C:/Users/kevin/AppData/Local/hermes/hermes-agent/venv/Scripts/pythonw.exe")

# 1. 启动_Store_Finder.bat (ANSI / GBK)
start_bat = f"""@echo off
start "" "{PYTHONW_EXE}" "%~dp0run_app.py"
"""

with open(ROOT_DIR / "启动_Store_Finder.bat", "wb") as f:
    f.write(start_bat.encode("gbk"))

with open(ROOT_DIR / "start.bat", "wb") as f:
    f.write(start_bat.encode("gbk"))

# 2. 关闭_Store_Finder.bat (ANSI / GBK)
stop_bat = """@echo off
title 关闭 Store Finder
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000,5199 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo [OK] Store Finder 服务已关闭。
ping 127.0.0.1 -n 2 >nul
"""

with open(ROOT_DIR / "关闭_Store_Finder.bat", "wb") as f:
    f.write(stop_bat.encode("gbk"))

with open(ROOT_DIR / "stop.bat", "wb") as f:
    f.write(stop_bat.encode("gbk"))

# 3. Create Desktop Shortcut via WScript pointing directly to pythonw.exe
vbs_script = f'''Set ws = CreateObject("WScript.Shell")
desktop = ws.SpecialFolders("Desktop")
shortcutPath = desktop & "\\Store Finder 品牌门店搜索引擎.lnk"
Set shortcut = ws.CreateShortcut(shortcutPath)
shortcut.TargetPath = "{PYTHONW_EXE}"
shortcut.Arguments = Chr(34) & "{RUN_APP_PY}" & Chr(34)
shortcut.WorkingDirectory = "{ROOT_DIR}"
shortcut.IconLocation = "{ICON_PATH},0"
shortcut.Description = "Store Finder 品牌实体门店与专柜搜索引擎"
shortcut.Save
'''

MAKER_VBS = ROOT_DIR / "create_lnk_final.vbs"
with open(MAKER_VBS, "w", encoding="gbk") as f:
    f.write(vbs_script)

subprocess.run(["cscript", "//nologo", str(MAKER_VBS)], check=True)
if MAKER_VBS.exists():
    os.remove(MAKER_VBS)

print("Desktop Shortcut updated cleanly with PythonW native silent executor!")
