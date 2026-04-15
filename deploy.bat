@echo off
chcp 65001 >nul

:: หา node จาก nvm หรือ PATH ปกติ
where node >nul 2>&1
if %errorlevel% equ 0 (
  node "%~dp0deploy.js"
  exit /b
)

:: nvm สำหรับ Windows
set NVM_HOME=%USERPROFILE%\AppData\Roaming\nvm
if exist "%NVM_HOME%\nvm.exe" (
  for /f "delims=" %%i in ('"%NVM_HOME%\nvm.exe" current') do set NODE_VER=%%i
  set NODE_EXE=%NVM_HOME%\%NODE_VER%\node.exe
  if exist "!NODE_EXE!" (
    "!NODE_EXE!" "%~dp0deploy.js"
    exit /b
  )
)

:: nvm ใน .nvm/versions (nvm-windows หรือ nvm-sh บน WSL path)
for /d %%v in ("%USERPROFILE%\.nvm\versions\node\*") do (
  if exist "%%v\node.exe" (
    "%%v\node.exe" "%~dp0deploy.js"
    exit /b
  )
)

echo.
echo [ERROR] ไม่พบ node.exe
echo กรุณารันใน PowerShell แทน:
echo   node deploy.js
pause
