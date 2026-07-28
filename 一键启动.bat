@echo off
setlocal EnableExtensions
title PNGcut - Vite

REM Always run from the folder where this BAT lives (project root)
cd /d "%~dp0"
if errorlevel 1 (
    echo [ERROR] Cannot cd to script folder.
    echo Path: %~dp0
    goto :EOF_PAUSE
)

echo.
echo ========================================
echo   PNGcut - local dev server
echo ========================================
echo Current dir: %CD%
echo.

REM Explorer double-click may have a shorter PATH than PowerShell.
REM If "where node" fails, try common Node.js install folders.
where node >nul 2>&1
if errorlevel 1 (
    if exist "%ProgramFiles%\nodejs\node.exe" (
        set "PATH=%ProgramFiles%\nodejs;%PATH%"
    )
    if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
        set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
    )
    if exist "%LocalAppData%\Programs\nodejs\node.exe" (
        set "PATH=%LocalAppData%\Programs\nodejs;%PATH%"
    )
)

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] node not found.
    echo Install Node.js LTS from https://nodejs.org/
    echo Check "Add to PATH", then restart PC and try again.
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
    echo [ERROR] package.json not found.
    echo Put this BAT inside the PNGcut project root.
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

echo Starting Vite. Keep this window open while testing.
echo Open in browser (note the trailing /PNGcut/ path):
echo   http://127.0.0.1:5173/PNGcut/
echo If port 5173 is busy, close other Vite windows first.
echo Stop server: press Ctrl+C in this window
echo.
echo ----------------------------------------

call npm run dev

echo.
echo ----------------------------------------
echo Server ended. Exit code: %ERRORLEVEL%
echo If the browser failed, copy any error text above and send it.

:EOF_PAUSE
echo.
pause
