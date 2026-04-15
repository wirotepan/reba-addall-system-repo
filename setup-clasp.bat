@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════╗
echo ║   REBA GAS — clasp Setup Script         ║
echo ╚══════════════════════════════════════════╝
echo.

:: Step 1 — Login
echo [1/3] เข้าสู่ระบบ Google (browser จะเปิดขึ้นมา)...
echo.
clasp login
if %errorlevel% neq 0 (
  echo ERROR: clasp login ล้มเหลว กรุณาลองใหม่
  pause & exit /b 1
)

:: Step 2 — Script ID
echo.
echo [2/3] ใส่ Script ID จาก GAS Project Settings:
echo        (Apps Script → ⚙️ → Script ID)
echo.
set /p SCRIPT_ID=Script ID:

if "%SCRIPT_ID%"=="" (
  echo ERROR: ไม่ได้ใส่ Script ID
  pause & exit /b 1
)

:: Write .clasp.json
echo { "scriptId": "%SCRIPT_ID%", "rootDir": "./gas-mvp" } > .clasp.json
echo .clasp.json สร้างแล้ว

:: Step 3 — Push
echo.
echo [3/3] กำลัง push code ขึ้น GAS...
clasp push
if %errorlevel% neq 0 (
  echo ERROR: clasp push ล้มเหลว
  pause & exit /b 1
)

echo.
echo ══════════════════════════════════════════
echo  ✅ Push สำเร็จ! เปิด GAS Editor ได้เลย
echo ══════════════════════════════════════════
echo.
clasp open
pause
