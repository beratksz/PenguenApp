@echo off
title Digital Signage APK Build:: Check if gradlew exists
if exist "gradlew.bat" (
    echo ✅ Gradle wrapper bulundu
    
    :: Check if gradle-wrapper.jar exists
    if not exist "gradle\wrapper\gradle-wrapper.jar" (
        echo ⚠️ gradle-wrapper.jar eksik! Duzeltiliyor...
        echo.
        echo 📦 gradle-wrapper.jar indiriliyor...
        powershell -Command "& {try { Invoke-WebRequest -Uri 'https://github.com/gradle/gradle/raw/v8.1.0/gradle/wrapper/gradle-wrapper.jar' -OutFile 'gradle\wrapper\gradle-wrapper.jar' -UseBasicParsing; echo '✅ gradle-wrapper.jar indirildi' } catch { echo '❌ gradle-wrapper.jar indirilemedi. Internet baglantinizi kontrol edin.' }}"
        
        if not exist "gradle\wrapper\gradle-wrapper.jar" (
            echo ❌ gradle-wrapper.jar indirilemedi!
            echo 🔧 fix-gradle-wrapper.bat scriptini calistirin
            cd ..
            pause
            exit /b 1
        )
    )
) else (
    echo ❌ Gradle wrapper bulunamadi!
    echo 🔧 Setup script'ini calistirin: ..\setup-android.bat
    cd ..
    pause
    exit /b 1
)
echo 🏗️ Digital Signage Android APK Olusturuluyor...
echo ================================================
echo.

:: Check if we're in the right directory
if not exist "android-app" (
    echo ❌ android-app klasoru bulunamadi!
    echo 📁 Bu script'i PenguenApp ana klasorununde calistirin.
    echo 📍 Mevcut konum: %CD%
    pause
    exit /b 1
)

:: Check if Android SDK is available
if not defined ANDROID_HOME (
    echo ⚠️ ANDROID_HOME environment variable tanimli degil!
    echo.
    echo � Otomatik tespit deneniyor...
    if exist "C:\Users\%USERNAME%\AppData\Local\Android\Sdk" (
        set "ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk"
        echo ✅ Android SDK bulundu: %ANDROID_HOME%
    ) else (
        echo ❌ Android SDK bulunamadi!
        echo.
        echo 📥 Setup script'ini calistirin: setup-android.bat
        echo 📱 Veya Android Studio yuklayip SDK'yi indirin:
        echo    https://developer.android.com/studio
        echo.
        echo 📍 SDK konumu: C:\Users\%USERNAME%\AppData\Local\Android\Sdk
        pause
        exit /b 1
    )
) else (
    echo ✅ ANDROID_HOME: %ANDROID_HOME%
)

:: Navigate to android app directory
cd android-app

:: Check if gradlew exists
if exist "gradlew.bat" (
    echo ✅ Gradle wrapper bulundu
) else (
    echo ❌ Gradle wrapper bulunamadi!
    echo � Setup script'ini calistirin: ..\setup-android.bat
    cd ..
    pause
    exit /b 1
)

echo.
echo 🔍 Java kontrol ediliyor...

:: Check Java
java -version 2>nul
if errorlevel 1 (
    echo ❌ Java bulunamadi!
    echo 📥 Java JDK yukleyin veya PATH'e ekleyin.
    cd ..
    pause
    exit /b 1
) else (
    echo ✅ Java bulundu
)

echo.
echo 🧹 Onceki build'leri temizleniyor...
if exist "app\build" (
    echo Eski build dosyalari siliniyor...
    rmdir /s /q "app\build" 2>nul
)

echo.
echo 🔨 APK build baslatiliyor...
echo 📦 Bu islem birkaç dakika surebilir (ilk seferde daha uzun)...
echo.

:: Build debug APK with better error handling
echo 📋 Gradle build komutu calistiriliyor...
call gradlew.bat assembleDebug --info

if errorlevel 1 (
    echo.
    echo ❌ APK build basarisiz!
    echo.
    echo 🔍 Olasi cozumler:
    echo 1. Internet baglantinizi kontrol edin (dependencies indirilecek)
    echo 2. Android SDK'nin tam yuklu oldugunu kontrol edin
    echo 3. Gradle cache temizleyin: .gradle klasorunu silin
    echo 4. Android Studio ile projeyi acip sync yapin
    echo.
    echo 🔧 Detayli hata bilgisi icin yukaridaki loglari inceleyin.
    cd ..
    pause
    exit /b 1
) else (
    echo.
    echo ✅ APK basariyla olusturuldu!
    echo.
    echo 📱 APK bilgileri:
    echo ===============
    
    set "APK_PATH=app\build\outputs\apk\debug\app-debug.apk"
    
    if exist "%APK_PATH%" (
        echo 📍 Konum: %CD%\%APK_PATH%
        
        :: Get file size
        for %%A in ("%APK_PATH%") do (
            set "SIZE=%%~zA"
            set /a "SIZE_MB=!SIZE! / 1024 / 1024"
            echo 📏 Boyut: %%~zA bytes (~!SIZE_MB! MB)
        )
        
        :: Get creation time
        for %%A in ("%APK_PATH%") do (
            echo 🕒 Olusturma: %%~tA
        )
        
        echo.
        echo 📋 Android Cihaza Kurulum Adımlari:
        echo ===================================
        echo 1. APK dosyasini Android cihaza kopyalayin
        echo 2. Cihazda "Ayarlar ^> Guvenlik ^> Bilinmeyen kaynaklar" aktif edin
        echo 3. Dosya yoneticisinde APK'ya tiklayarak kurun
        echo 4. Ilk calisma icin server URL ayarlayın:
        echo    - Uygulamada 5 kez ekrana tiklayin
        echo    - Server URL girin: http://[SERVER_IP]:3001/display
        echo    - Ayarlari kaydedin ve uygulamayi yeniden baslatın
        echo.
        echo 🔧 Onerilen Cihaz Ayarlari:
        echo =========================
        echo - Battery optimization: OFF (uygulama icin)
        echo - Screen timeout: Never / 30 min
        echo - Auto-rotate: ON
        echo - Developer options ^> Stay awake: ON
        echo.
        echo 🎯 APK hazir! Artık cihaziniza kurabilirsiniz.
        
        :: Ask if user wants to open APK location
        set /p openFolder="APK klasorunu Windows Explorer'da acmak istiyor musunuz? (y/n): "
        if /i "!openFolder!"=="y" (
            start "" "app\build\outputs\apk\debug"
        )
        
    ) else (
        echo ⚠️ APK dosyasi beklenmedik bir konumda olabilir.
        echo 🔍 Build output klasorunu kontrol edin: app\build\outputs\apk\
    )
)

cd ..
echo.
echo 🎉 Islem tamamlandi!
pause
