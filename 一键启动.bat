@echo off
setlocal EnableExtensions
title PNGcut - Vite

REM 切换到本 bat 所在目录（项目根目录）
cd /d "%~dp0" 2>nul
if errorlevel 1 (
    echo Failed to cd to script folder.
    echo Path: %~dp0
    goto :EOF_PAUSE
)

echo.
echo ========================================
echo   PNGcut - local dev server
echo ========================================
echo Current dir: %CD%
echo.

REM 检查 node / npm（从资源管理器双击时 PATH 可能和终端不同）
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] node not found. Install Node.js and enable "Add to PATH", then restart PC.
    echo Download: https://nodejs.org/
    goto :EOF_PAUSE
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm not found. Reinstall Node.js LTS with PATH option.
    goto :EOF_PAUSE
)

echo node:
node -v
echo npm:
npm -v
echo.

if not exist "package.json" (
    echo [ERROR] package.json not found. Put this BAT inside PNGcut project root.
    goto :EOF_PAUSE
)

if not exist "node_modules\" (
    echo Running npm install ...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed.
        goto :EOF_PAUSE
    )
    echo.
)

echo Starting Vite. DO NOT close this window while testing.
echo 浏览器地址一般为（须带末尾的 /PNGcut/ 路径^）:
echo   http://127.0.0.1:5173/PNGcut/
echo 若提示端口被占用，请先关掉其它 Vite 窗口或改占用 5173 的程序。
echo 以本窗口下方 Vite 打印的 Local 行为准。
echo Stop server: press Ctrl+C in this window
echo.
echo ----------------------------------------

call npm run dev

echo.
echo ----------------------------------------
echo Server process ended (exit code %ERRORLEVEL%^)
echo 若浏览器无法打开，请把上面窗口里的报错完整复制发出来。
:EOF_PAUSE
echo.
pause
