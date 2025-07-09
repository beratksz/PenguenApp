@echo off
title Digital Signage - Kolay APK Kurulumu
color 0A

echo.
echo  ██████╗ ██╗ ██████╗ ██╗████████╗ █████╗ ██╗         ███████╗██╗ ██████╗ ███╗   ██╗ █████╗  ██████╗ ███████╗
echo  ██╔══██╗██║██╔════╝ ██║╚══██╔══╝██╔══██╗██║         ██╔════╝██║██╔════╝ ████╗  ██║██╔══██╗██╔════╝ ██╔════╝
echo  ██║  ██║██║██║  ███╗██║   ██║   ███████║██║         ███████╗██║██║  ███╗██╔██╗ ██║███████║██║  ███╗█████╗  
echo  ██║  ██║██║██║   ██║██║   ██║   ██╔══██║██║         ╚════██║██║██║   ██║██║╚██╗██║██╔══██║██║   ██║██╔══╝  
echo  ██████╔╝██║╚██████╔╝██║   ██║   ██║  ██║███████╗    ███████║██║╚██████╔╝██║ ╚████║██║  ██║╚██████╔╝███████╗
echo  ╚═════╝ ╚═╝ ╚═════╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
echo.
echo                                    🚀 KOLAY APK KURULUM ASISTANI 🚀
echo.
echo  ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
echo.

echo 📋 BU ASISTAN SIZIN ICIN:
echo.
echo   ✅ Android gereksinimlerini kontrol eder
echo   ✅ Eksik olan seyleri indirir/yukler
echo   ✅ APK'yi otomatik olusturur
echo   ✅ Kurulum talimatlarini verir
echo.
echo 📱 DESTEKLENEN ANDROID VERSIYONLARI: 5.0+ (API 21+)
echo 💾 GEREKLI ALAN: ~500MB (Android Studio + SDK)
echo ⏱️ TAHMINI SURE: 15-30 dakika (internet hizina bagli)
echo.

set /p confirm="Baslamak icin ENTER'a basin (q = cikis): "
if /i "%confirm%"=="q" exit /b 0

echo.
echo ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
echo.
echo 🔍 ADIM 1/5: SISTEM KONTROL EDİLİYOR...
echo.

:: Check Windows version
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo 💻 Windows Version: %VERSION%

:: Check if 64-bit
if exist "%ProgramFiles(x86)%" (
    echo 🏗️ Sistem: 64-bit ✅
) else (
    echo ⚠️ 32-bit sistem tespit edildi. Android Studio 64-bit gerektirir.
    echo 📥 64-bit Windows kullanmaniz oneriliyor.
    pause
)

:: Check available disk space (simplified)
for /f "tokens=3" %%a in ('dir /-c %systemdrive%\ ^| find "bytes free"') do set FREE_SPACE=%%a
echo 💾 Bos disk alani kontrol ediliyor...

:: Check Java
echo.
echo ☕ Java kontrol ediliyor...
java -version >nul 2>&1
if errorlevel 1 (
    echo ❌ Java bulunamadi!
    echo 📥 Java JDK indirilecek (Android Studio ile birlikte)
) else (
    echo ✅ Java mevcut
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
echo.
echo 🔍 ADIM 2/5: ANDROID STUDIO KONTROL EDİLİYOR...
echo.

set "ANDROID_STUDIO_FOUND=0"
set "SDK_FOUND=0"

if exist "C:\Program Files\Android\Android Studio" (
    echo ✅ Android Studio bulundu: C:\Program Files\Android\Android Studio
    set "ANDROID_STUDIO_FOUND=1"
) else (
    echo ❌ Android Studio bulunamadi
)

if exist "C:\Users\%USERNAME%\AppData\Local\Android\Sdk" (
    echo ✅ Android SDK bulundu: C:\Users\%USERNAME%\AppData\Local\Android\Sdk
    set "SDK_FOUND=1"
    if not defined ANDROID_HOME (
        set "ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk"
        echo 🔧 ANDROID_HOME gecici olarak ayarlandi
    )
) else (
    echo ❌ Android SDK bulunamadi
)

if "%ANDROID_STUDIO_FOUND%"=="0" (
    echo.
    echo 📥 ANDROID STUDIO INDIRILIYOR...
    echo ⚠️ Bu adimda manuel islem gerekiyor:
    echo.
    echo 1. Tarayici acilacak
    echo 2. Android Studio'yu indirin (~1GB)
    echo 3. Indirilen dosyayi calisitirin
    echo 4. Standard kurulum yapin (SDK otomatik indirilir)
    echo 5. Bu script'e geri donun
    echo.
    set /p download="Android Studio indirmek icin ENTER'a basin: "
    start https://developer.android.com/studio
    echo.
    echo ⏳ Android Studio kurulumunu tamamlayin ve ENTER'a basin...
    pause
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
echo.
echo 🔍 ADIM 3/5: PROJE DOSYALARI KONTROL EDİLİYOR...
echo.

if not exist "android-app" (
    echo ❌ android-app klasoru bulunamadi!
    echo 📁 Bu script'i PenguenApp ana klasorununde calistirin.
    pause
    exit /b 1
) else (
    echo ✅ Android proje klasoru bulundu
)

if not exist "android-app\gradlew.bat" (
    echo 🔧 Gradle wrapper olusturuluyor...
    call setup-android.bat
) else (
    echo ✅ Gradle wrapper hazir
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
echo.
echo 🔍 ADIM 4/5: ENVIRONMENT VARIABLES AYARLANIYOR...
echo.

if not defined ANDROID_HOME (
    if exist "C:\Users\%USERNAME%\AppData\Local\Android\Sdk" (
        set "ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk"
        echo ✅ ANDROID_HOME ayarlandi: %ANDROID_HOME%
    ) else (
        echo ❌ Android SDK bulunamadi! Once Android Studio kurun.
        pause
        exit /b 1
    )
) else (
    echo ✅ ANDROID_HOME mevcut: %ANDROID_HOME%
)

echo.
echo 📝 KALICI ENVIRONMENT VARIABLE AYARI:
echo Sistem ayarlariniza kalici olarak eklemek icin:
echo 1. Windows + R ^> sysdm.cpl
echo 2. Advanced ^> Environment Variables
echo 3. System variables ^> New:
echo    Variable name: ANDROID_HOME
echo    Variable value: %ANDROID_HOME%
echo 4. PATH'e ekleyin: %%ANDROID_HOME%%\platform-tools

echo.
echo ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
echo.
echo 🔍 ADIM 5/5: APK OLUSTURULUYOR...
echo.

echo 🚀 APK build islemi baslatiliyor...
echo 📦 Ilk seferde dependencies indirilecegi icin uzun surebilir...
echo.

set /p startBuild="APK build'ini baslatmak icin ENTER'a basin: "

call build-android.bat

echo.
echo ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
echo.
echo 🎉 KURULUM TAMAMLANDI!
echo.

if exist "android-app\app\build\outputs\apk\debug\app-debug.apk" (
    echo ✅ APK basariyla olusturuldu!
    echo.
    echo 📱 ANDROID CIHAZA KURULUM:
    echo ═══════════════════════════
    echo 1. APK'yi USB ile cihaza kopyalayin
    echo 2. "Bilinmeyen kaynaklar"i aktif edin
    echo 3. APK'ya tiklayarak kurun
    echo 4. Server URL'yi ayarlayin
    echo.
    echo 🔧 ILKYONETIM PANELI:
    echo ═══════════════════════
    echo Web sunucusunu baslattin ve adresini not alin:
    echo npm start
    echo http://localhost:3001
    echo.
    echo 📍 APK Konumu:
    echo %CD%\android-app\app\build\outputs\apk\debug\app-debug.apk
    echo.
    
    set /p openApk="APK klasorunu acmak icin ENTER'a basin: "
    start "" "android-app\app\build\outputs\apk\debug"
) else (
    echo ❌ APK olusturulamadi!
    echo 🔍 build-android.bat'i manuel calistirmayi deneyin.
)

echo.
echo 🏁 ASISTAN TAMAMLANDI!
echo.
pause
