import os

start_bat = """@echo off
chcp 65001 >nul
title Store Finder 品牌门店搜索引擎 - 一键启动器
echo ======================================================================
echo           Store Finder 品牌实体门店与专柜搜索引擎
echo ======================================================================
echo.
echo [*] 正在检查并启动后台服务...

cd /d "%~dp0"

REM 1. 检查并启动后端 FastAPI
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [i] 后端服务已在端口 8000 运行中
) else (
    echo [*] 正在启动 FastAPI 后端服务 127.0.0.1:8000
    start "Store Finder Backend" /min cmd /c "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
)

REM 2. 检查并启动前端 Next.js
netstat -ano | findstr ":5199" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [i] 前端服务已在端口 5199 运行中
) else (
    echo [*] 正在启动 Next.js 前端服务 127.0.0.1:5199
    start "Store Finder Frontend" /min cmd /c "cd /d %~dp0frontend && npm run dev"
)


REM 等待服务就绪并打开浏览器
echo [*] 正在连接服务并唤起浏览器...
ping 127.0.0.1 -n 4 >nul
start http://127.0.0.1:5199

echo.
echo ======================================================================
echo  [OK] Store Finder 启动成功！
echo.
echo  - 前台搜索主页：http://127.0.0.1:5199
echo  - B端管理后台 ：http://127.0.0.1:5199/admin (默认密钥: admin123456)
echo  - API 接口文档：http://127.0.0.1:8000/docs
echo.
echo  提示：
echo  1. 后台服务已在最小化窗口中平稳运行；
echo  2. 如需关闭所有服务，可直接双击运行【关闭_Store_Finder.bat】。
echo ======================================================================
echo.
ping 127.0.0.1 -n 5 >nul

""".replace("\r\n", "\n").replace("\n", "\r\n")

stop_bat = """@echo off
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
""".replace("\r\n", "\n").replace("\n", "\r\n")


with open("启动_Store_Finder.bat", "wb") as f:
    f.write(start_bat.encode("utf-8"))

with open("start.bat", "wb") as f:
    f.write(start_bat.encode("utf-8"))

with open("关闭_Store_Finder.bat", "wb") as f:
    f.write(stop_bat.encode("utf-8"))

with open("stop.bat", "wb") as f:
    f.write(stop_bat.encode("utf-8"))

print("Bat scripts written successfully with proper CRLF and UTF-8 encoding!")
