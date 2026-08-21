@echo off
title 关闭 Store Finder
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000,5199 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo [OK] Store Finder 后台服务已全部关闭。
ping 127.0.0.1 -n 2 >nul
