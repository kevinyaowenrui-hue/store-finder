@echo off
chcp 65001 >nul
title Store Finder 品牌门店搜索引擎 - 一键启动器
echo ======================================================================
echo           Store Finder 品牌实体门店与专柜搜索引擎
echo ======================================================================
echo.
echo [*] 正在检查并启动后台服务...

cd /d "%~dp0"

REM 启动服务
"C:\Users\kevin\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe" "%~dp0run_servers.py"

echo.
ping 127.0.0.1 -n 4 >nul
