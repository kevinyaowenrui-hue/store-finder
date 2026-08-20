@echo off
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
