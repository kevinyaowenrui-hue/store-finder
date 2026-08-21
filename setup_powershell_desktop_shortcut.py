import os
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
ICON_PATH = ROOT_DIR / "app_icon.ico"
LAUNCH_PS1 = ROOT_DIR / "launch.ps1"

# 1. 启动_Store_Finder.bat (ANSI / GBK)
start_bat = f"""@echo off
powershell.exe -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch.ps1"
"""

with open(ROOT_DIR / "启动_Store_Finder.bat", "wb") as f:
    f.write(start_bat.encode("gbk"))

with open(ROOT_DIR / "start.bat", "wb") as f:
    f.write(start_bat.encode("gbk"))

# 2. 关闭_Store_Finder.bat (ANSI / GBK)
stop_bat = f"""@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0shutdown.ps1"
echo [OK] Store Finder 后台服务已关闭。
ping 127.0.0.1 -n 2 >nul
"""

with open(ROOT_DIR / "关闭_Store_Finder.bat", "wb") as f:
    f.write(stop_bat.encode("gbk"))

with open(ROOT_DIR / "stop.bat", "wb") as f:
    f.write(stop_bat.encode("gbk"))

# 3. Create Desktop Shortcut via WScript
# Point directly to powershell.exe with -WindowStyle Hidden and -File launch.ps1
vbs_script = f'''Set ws = CreateObject("WScript.Shell")
desktop = ws.SpecialFolders("Desktop")
shortcutPath = desktop & "\\Store Finder 品牌门店搜索引擎.lnk"
Set shortcut = ws.CreateShortcut(shortcutPath)
shortcut.TargetPath = "powershell.exe"
shortcut.Arguments = "-WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -File " & Chr(34) & "{LAUNCH_PS1}" & Chr(34)
shortcut.WorkingDirectory = "{ROOT_DIR}"
shortcut.IconLocation = "{ICON_PATH},0"
shortcut.Description = "Store Finder 品牌实体门店与专柜搜索引擎"
shortcut.Save
'''

MAKER_VBS = ROOT_DIR / "create_lnk.vbs"
with open(MAKER_VBS, "w", encoding="gbk") as f:
    f.write(vbs_script)

subprocess.run(["cscript", "//nologo", str(MAKER_VBS)], check=True)
if MAKER_VBS.exists():
    os.remove(MAKER_VBS)

print("Desktop Shortcut & Batch scripts updated with 100% native hidden PowerShell launcher!")
