@echo off
chcp 65001 >nul
title 创建 Store Finder 桌面快捷方式
echo ======================================================================
echo           正在为 Store Finder 创建桌面快捷方式...
echo ======================================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $desktop = [Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut((Join-Path $desktop 'Store Finder 品牌门店搜索引擎.lnk')); $s.TargetPath = '%~dp0启动_Store_Finder.bat'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = '%~dp0app_icon.ico,0'; $s.Description = 'Store Finder 品牌实体门店与专柜搜索引擎'; $s.Save()"

echo.
echo ======================================================================
echo  [OK] 桌面快捷方式创建成功！
echo.
echo  - 快捷方式已绑定高辨识度专属图标 (app_icon.ico)
echo  - 以后直接在桌面上双击图标即可一键启动并自动调起浏览器！
echo ======================================================================
echo.
ping 127.0.0.1 -n 3 >nul
