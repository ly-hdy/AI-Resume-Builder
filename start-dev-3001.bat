@echo off
cd /d "%~dp0"
"D:\New Folder\npm.cmd" run dev -- -p 3001 > "%~dp0dev-host-3001.log" 2>&1
