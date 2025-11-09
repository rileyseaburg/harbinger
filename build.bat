@echo off
echo 🚀 Building API Specs Generator for Windows...

echo 🔍 Checking current directory...
cd /d "%~dp0"
echo Current directory: %CD%

echo 🏗️ Changing to project root...
cd ..

echo 🔍 Frontend build check...
dir ui\src 2>nul
if %ERRORLEVEL% neq 0 (
  echo ❌ UI source files not found in ui\src\
  pause
  exit /b 1
)

echo ✅ Building with verbose output...
cargo tauri build --target x86_64-pc-windows-msvc --verbose
if %ERRORLEVEL% neq 0 (
  echo ❌ Windows app build failed!
  pause
  exit /b 1
)

echo ✅ Build complete! 
echo 📁 Find your app in: target\release\bundle\msi\
pause