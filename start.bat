@echo off
title Digital Signage System

echo.
echo 🚀 Digital Tabela Sistemi Baslatiliyor...
echo.

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js bulunamadi! Lutfen Node.js yukleyin.
    echo 📥 Indirme adresi: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js bulundu
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo 📥 NPM paketleri yukleniyor...
    npm install
    if errorlevel 1 (
        echo ❌ NPM paketleri yuklenemedi!
        pause
        exit /b 1
    )
)

:: Create uploads directory
if not exist "uploads" (
    mkdir uploads
    echo 📁 Uploads klasoru olusturuldu
)

echo.
echo 🌟 Server baslatiliyor...
echo.
echo 📋 Erisim bilgileri:
echo 📱 Yonetim Paneli: http://localhost:3001
echo 📺 Display App: http://localhost:3001/display
echo 🧪 Test Sayfasi: http://localhost:3001/test
echo.
echo ⏹️  Durdurmak icin Ctrl+C tushlarina basin
echo.

:: Start the server
npm start

pause
