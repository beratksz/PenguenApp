@echo off
title Digital Signage APK Builder Setup

echo.
echo 🚀 Digital Signage APK Builder Setup
echo ====================================
echo.

echo 📋 Bu script APK olusturmak icin gerekli kontrolleri yapar:
echo   1. Android Studio kurulu mu?
echo   2. Android SDK mevcut mu?
echo   3. Environment variables ayarli mi?
echo   4. Gradle wrapper hazir mi?
echo.

pause

echo.
echo 🔍 Android Studio kontrol ediliyor...

:: Check if Android Studio is installed
set "ANDROID_STUDIO_PATH="
if exist "C:\Program Files\Android\Android Studio" (
    set "ANDROID_STUDIO_PATH=C:\Program Files\Android\Android Studio"
    echo ✅ Android Studio bulundu: %ANDROID_STUDIO_PATH%
) else if exist "C:\Users\%USERNAME%\AppData\Local\Android\Sdk" (
    echo ✅ Android SDK bulundu
) else (
    echo ❌ Android Studio bulunamadi!
    echo.
    echo 📥 Android Studio indirmek icin:
    echo    https://developer.android.com/studio
    echo.
    echo 🔧 Kurulum sonrasi bu script'i tekrar calistirin.
    pause
    exit /b 1
)

echo.
echo 🔍 Android SDK kontrol ediliyor...

:: Check ANDROID_HOME
if not defined ANDROID_HOME (
    echo ⚠️ ANDROID_HOME environment variable tanimli degil!
    echo.
    echo 🔧 Otomatik ayarlama deneniyor...
    
    :: Try to find SDK automatically
    if exist "C:\Users\%USERNAME%\AppData\Local\Android\Sdk" (
        set "ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk"
        echo ✅ SDK bulundu: %ANDROID_HOME%
        echo.
        echo 📝 Environment variable ayarlamak icin:
        echo    1. Windows + R tuslayarak 'sysdm.cpl' yazin
        echo    2. Advanced tab ^> Environment Variables
        echo    3. System variables bolumunden New tiklayip:
        echo       Variable name: ANDROID_HOME
        echo       Variable value: %ANDROID_HOME%
        echo    4. PATH'e ekleyin: %%ANDROID_HOME%%\platform-tools
        echo.
    ) else (
        echo ❌ Android SDK bulunamadi!
        echo 📥 Android Studio yukleyip SDK'yi indirin.
        pause
        exit /b 1
    )
) else (
    echo ✅ ANDROID_HOME tanimli: %ANDROID_HOME%
)

echo.
echo 🔍 Gradle wrapper kontrol ediliyor...

if exist "android-app\gradlew.bat" (
    echo ✅ Gradle wrapper bulundu
) else (
    echo ⚠️ Gradle wrapper bulunamadi!
    echo 🔧 Gradle wrapper olusturuluyor...
    
    if not exist "android-app" (
        echo ❌ android-app klasoru bulunamadi!
        echo 📁 Proje yapisini kontrol edin.
        pause
        exit /b 1
    )
    
    cd android-app
    
    :: Create gradle wrapper if it doesn't exist
    echo 📝 gradle-wrapper.properties olusturuluyor...
    if not exist "gradle\wrapper" mkdir gradle\wrapper
    
    echo distributionBase=GRADLE_USER_HOME > gradle\wrapper\gradle-wrapper.properties
    echo distributionPath=wrapper/dists >> gradle\wrapper\gradle-wrapper.properties
    echo distributionUrl=https\://services.gradle.org/distributions/gradle-8.1-bin.zip >> gradle\wrapper\gradle-wrapper.properties
    echo zipStoreBase=GRADLE_USER_HOME >> gradle\wrapper\gradle-wrapper.properties
    echo zipStorePath=wrapper/dists >> gradle\wrapper\gradle-wrapper.properties
    
    echo 📦 gradle-wrapper.jar indiriliyor...
    powershell -Command "& {try { Invoke-WebRequest -Uri 'https://github.com/gradle/gradle/raw/v8.1.0/gradle/wrapper/gradle-wrapper.jar' -OutFile 'gradle\wrapper\gradle-wrapper.jar' -UseBasicParsing; echo '✅ gradle-wrapper.jar indirildi' } catch { echo '❌ gradle-wrapper.jar indirilemedi. Internet baglantinizi kontrol edin.' }}"
    
    :: Create gradlew.bat
    echo @rem >> gradlew.bat
    echo @rem Copyright 2015 the original author or authors. >> gradlew.bat
    echo @rem >> gradlew.bat
    echo @rem Licensed under the Apache License, Version 2.0 (the "License"); >> gradlew.bat
    echo @rem you may not use this file except in compliance with the License. >> gradlew.bat
    echo @rem You may obtain a copy of the License at >> gradlew.bat
    echo @rem >> gradlew.bat
    echo @rem      https://www.apache.org/licenses/LICENSE-2.0 >> gradlew.bat
    echo @rem >> gradlew.bat
    echo @rem Unless required by applicable law or agreed to in writing, software >> gradlew.bat
    echo @rem distributed under the License is distributed on an "AS IS" BASIS, >> gradlew.bat
    echo @rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. >> gradlew.bat
    echo @rem See the License for the specific language governing permissions and >> gradlew.bat
    echo @rem limitations under the License. >> gradlew.bat
    echo @rem >> gradlew.bat
    echo. >> gradlew.bat
    echo @if "%%DEBUG%%" == "" @echo off >> gradlew.bat
    echo @rem ########################################################################## >> gradlew.bat
    echo @rem >> gradlew.bat
    echo @rem  Gradle startup script for Windows >> gradlew.bat
    echo @rem >> gradlew.bat
    echo @rem ########################################################################## >> gradlew.bat
    echo. >> gradlew.bat
    echo @rem Set local scope for the variables with windows NT shell >> gradlew.bat
    echo if "%%OS%%"=="Windows_NT" setlocal >> gradlew.bat
    echo. >> gradlew.bat
    echo set DIRNAME=%%~dp0 >> gradlew.bat
    echo if "%%DIRNAME%%" == "" set DIRNAME=. >> gradlew.bat
    echo set APP_BASE_NAME=%%~n0 >> gradlew.bat
    echo set APP_HOME=%%DIRNAME%% >> gradlew.bat
    echo. >> gradlew.bat
    echo @rem Resolve any "." and ".." in APP_HOME to make it shorter. >> gradlew.bat
    echo for %%%%i in ("%%APP_HOME%%") do set APP_HOME=%%%%~fi >> gradlew.bat
    echo. >> gradlew.bat
    echo @rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script. >> gradlew.bat
    echo set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m" >> gradlew.bat
    echo. >> gradlew.bat
    echo @rem Find java.exe >> gradlew.bat
    echo if defined JAVA_HOME goto findJavaFromJavaHome >> gradlew.bat
    echo. >> gradlew.bat
    echo set JAVA_EXE=java.exe >> gradlew.bat
    echo %%JAVA_EXE%% -version ^>NUL 2^>^&1 >> gradlew.bat
    echo if "%%ERRORLEVEL%%" == "0" goto execute >> gradlew.bat
    echo. >> gradlew.bat
    echo echo. >> gradlew.bat
    echo echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH. >> gradlew.bat
    echo echo. >> gradlew.bat
    echo echo Please set the JAVA_HOME variable in your environment to match the >> gradlew.bat
    echo echo location of your Java installation. >> gradlew.bat
    echo. >> gradlew.bat
    echo goto fail >> gradlew.bat
    echo. >> gradlew.bat
    echo :findJavaFromJavaHome >> gradlew.bat
    echo set JAVA_HOME=%%JAVA_HOME:"=%% >> gradlew.bat
    echo set JAVA_EXE=%%JAVA_HOME%%/bin/java.exe >> gradlew.bat
    echo. >> gradlew.bat
    echo if exist "%%JAVA_EXE%%" goto execute >> gradlew.bat
    echo. >> gradlew.bat
    echo echo. >> gradlew.bat
    echo echo ERROR: JAVA_HOME is set to an invalid directory: %%JAVA_HOME%% >> gradlew.bat
    echo echo. >> gradlew.bat
    echo echo Please set the JAVA_HOME variable in your environment to match the >> gradlew.bat
    echo echo location of your Java installation. >> gradlew.bat
    echo. >> gradlew.bat
    echo goto fail >> gradlew.bat
    echo. >> gradlew.bat
    echo :execute >> gradlew.bat
    echo @rem Setup the command line >> gradlew.bat
    echo. >> gradlew.bat
    echo set CLASSPATH=%%APP_HOME%%\gradle\wrapper\gradle-wrapper.jar >> gradlew.bat
    echo. >> gradlew.bat
    echo. >> gradlew.bat
    echo @rem Execute Gradle >> gradlew.bat
    echo "%%JAVA_EXE%%" %%DEFAULT_JVM_OPTS%% %%JAVA_OPTS%% %%GRADLE_OPTS%% "-Dorg.gradle.appname=%%APP_BASE_NAME%%" -classpath "%%CLASSPATH%%" org.gradle.wrapper.GradleWrapperMain %%* >> gradlew.bat
    echo. >> gradlew.bat
    echo :end >> gradlew.bat
    echo @rem End local scope for the variables with windows NT shell >> gradlew.bat
    echo if "%%OS%%"=="Windows_NT" endlocal >> gradlew.bat
    echo. >> gradlew.bat
    echo :fail >> gradlew.bat
    echo rem Set variable GRADLE_EXIT_CONSOLE if you need the _script_ return code instead of >> gradlew.bat
    echo rem the _cmd_ return code.  Not all NT shells support this method; console output is >> gradlew.bat
    echo rem generally quite good, right out of the box.  Debugging info follows: >> gradlew.bat
    echo exit /b 1 >> gradlew.bat
    
    cd ..
    echo ✅ Gradle wrapper olusturuldu!
)

echo.
echo 🎯 Hazirlik tamamlandi! APK olusturmak icin secenekler:
echo.
echo 1️⃣ Otomatik APK build (onerilen):
echo    build-android.bat
echo.
echo 2️⃣ Android Studio ile:
echo    - Android Studio'yu ac
echo    - "Open Project" ^> android-app klasorunu sec
echo    - Build ^> Build Bundle(s)/APK(s) ^> Build APK(s)
echo.
echo 3️⃣ Manuel command line:
echo    cd android-app
echo    gradlew assembleDebug
echo.
echo 📱 APK konumu:
echo    android-app\app\build\outputs\apk\debug\app-debug.apk
echo.

set /p choice="APK build'i simdi baslatmak istiyor musunuz? (y/n): "
if /i "%choice%"=="y" (
    echo.
    echo 🚀 APK build baslatiliyor...
    call build-android.bat
) else (
    echo.
    echo 👍 Hazir oldugunuzda build-android.bat calistirin!
)

pause
