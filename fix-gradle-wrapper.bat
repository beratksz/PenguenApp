@echo off
title Digital Signage - Gradle Wrapper Duzeltme

echo.
echo 🔧 GRADLE WRAPPER DUZELTME ARACI
echo ================================
echo.

if not exist "android-app" (
    echo ❌ android-app klasoru bulunamadi!
    echo 📁 Bu script'i proje ana klasorunde calistirin.
    pause
    exit /b 1
)

cd android-app

echo 🗑️ Eski gradle wrapper dosyalari temizleniyor...
if exist "gradle\wrapper" rmdir /s /q gradle\wrapper
if exist "gradlew.bat" del gradlew.bat
if exist "gradlew" del gradlew

echo 📁 Gradle wrapper klasoru olusturuluyor...
mkdir gradle\wrapper

echo 📝 gradle-wrapper.properties olusturuluyor...
(
echo distributionBase=GRADLE_USER_HOME
echo distributionPath=wrapper/dists
echo distributionUrl=https\://services.gradle.org/distributions/gradle-8.1-bin.zip
echo zipStoreBase=GRADLE_USER_HOME
echo zipStorePath=wrapper/dists
) > gradle\wrapper\gradle-wrapper.properties

echo 📦 gradle-wrapper.jar indiriliyor...
powershell -Command "& {
    try {
        $url = 'https://github.com/gradle/gradle/raw/v8.1.0/gradle/wrapper/gradle-wrapper.jar'
        Write-Host 'Indiriliyor...' -ForegroundColor Yellow
        Invoke-WebRequest -Uri $url -OutFile 'gradle\wrapper\gradle-wrapper.jar' -UseBasicParsing
        if (Test-Path 'gradle\wrapper\gradle-wrapper.jar') {
            $size = (Get-Item 'gradle\wrapper\gradle-wrapper.jar').Length
            Write-Host ('✅ gradle-wrapper.jar indirildi ({0:N0} bytes)' -f $size) -ForegroundColor Green
        } else {
            Write-Host '❌ Dosya bulunamadi' -ForegroundColor Red
        }
    } catch {
        Write-Host ('❌ Hata: {0}' -f $_.Exception.Message) -ForegroundColor Red
        Write-Host 'Alternatif indirme deneniyor...' -ForegroundColor Yellow
        try {
            $url2 = 'https://raw.githubusercontent.com/gradle/gradle/v8.1.0/gradle/wrapper/gradle-wrapper.jar'
            Invoke-WebRequest -Uri $url2 -OutFile 'gradle\wrapper\gradle-wrapper.jar' -UseBasicParsing
            Write-Host '✅ Alternatif kaynaktan indirildi' -ForegroundColor Green
        } catch {
            Write-Host '❌ Alternatif indirme de basarisiz' -ForegroundColor Red
        }
    }
}"

echo.
echo 📝 gradlew.bat olusturuluyor...
(
echo @rem
echo @rem Copyright 2015 the original author or authors.
echo @rem
echo @rem Licensed under the Apache License, Version 2.0 ^(the "License"^);
echo @rem you may not use this file except in compliance with the License.
echo @rem You may obtain a copy of the License at
echo @rem
echo @rem      https://www.apache.org/licenses/LICENSE-2.0
echo @rem
echo @rem Unless required by applicable law or agreed to in writing, software
echo @rem distributed under the License is distributed on an "AS IS" BASIS,
echo @rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
echo @rem See the License for the specific language governing permissions and
echo @rem limitations under the License.
echo @rem
echo.
echo @if "%%DEBUG%%" == "" @echo off
echo @rem ##########################################################################
echo @rem
echo @rem  Gradle startup script for Windows
echo @rem
echo @rem ##########################################################################
echo.
echo @rem Set local scope for the variables with windows NT shell
echo if "%%OS%%"=="Windows_NT" setlocal
echo.
echo set DIRNAME=%%~dp0
echo if "%%DIRNAME%%" == "" set DIRNAME=.
echo set APP_BASE_NAME=%%~n0
echo set APP_HOME=%%DIRNAME%%
echo.
echo @rem Resolve any "." and ".." in APP_HOME to make it shorter.
echo for %%%%i in ^("%%APP_HOME%%"^) do set APP_HOME=%%%%~fi
echo.
echo @rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
echo set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"
echo.
echo @rem Find java.exe
echo if defined JAVA_HOME goto findJavaFromJavaHome
echo.
echo set JAVA_EXE=java.exe
echo %%JAVA_EXE%% -version ^>NUL 2^>^&1
echo if "%%ERRORLEVEL%%" == "0" goto execute
echo.
echo echo.
echo echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo echo.
echo echo Please set the JAVA_HOME variable in your environment to match the
echo echo location of your Java installation.
echo.
echo goto fail
echo.
echo :findJavaFromJavaHome
echo set JAVA_HOME=%%JAVA_HOME:"=%%
echo set JAVA_EXE=%%JAVA_HOME%%/bin/java.exe
echo.
echo if exist "%%JAVA_EXE%%" goto execute
echo.
echo echo.
echo echo ERROR: JAVA_HOME is set to an invalid directory: %%JAVA_HOME%%
echo echo.
echo echo Please set the JAVA_HOME variable in your environment to match the
echo echo location of your Java installation.
echo.
echo goto fail
echo.
echo :execute
echo @rem Setup the command line
echo.
echo set CLASSPATH=%%APP_HOME%%\gradle\wrapper\gradle-wrapper.jar
echo.
echo @rem Execute Gradle
echo "%%JAVA_EXE%%" %%DEFAULT_JVM_OPTS%% %%JAVA_OPTS%% %%GRADLE_OPTS%% "-Dorg.gradle.appname=%%APP_BASE_NAME%%" -classpath "%%CLASSPATH%%" org.gradle.wrapper.GradleWrapperMain %%*
echo.
echo :end
echo @rem End local scope for the variables with windows NT shell
echo if "%%OS%%"=="Windows_NT" endlocal
echo.
echo :fail
echo rem Set variable GRADLE_EXIT_CONSOLE if you need the _script_ return code instead of
echo rem the _cmd_ return code.  Not all NT shells support this method; console output is
echo rem generally quite good, right out of the box.  Debugging info follows:
echo exit /b 1
) > gradlew.bat

cd ..

echo.
echo 🔍 Kontrol ediliyor...
if exist "android-app\gradle\wrapper\gradle-wrapper.jar" (
    echo ✅ gradle-wrapper.jar mevcut
) else (
    echo ❌ gradle-wrapper.jar eksik!
    echo.
    echo 🔄 Manuel cozum:
    echo 1. https://github.com/gradle/gradle/raw/v8.1.0/gradle/wrapper/gradle-wrapper.jar
    echo 2. Bu dosyayi android-app\gradle\wrapper\ klasorune kaydedin
)

if exist "android-app\gradlew.bat" (
    echo ✅ gradlew.bat mevcut
) else (
    echo ❌ gradlew.bat eksik!
)

echo.
echo 🧪 Test ediliyor...
cd android-app
echo Gradle version kontrol ediliyor...
gradlew.bat --version
cd ..

echo.
echo 🎯 Gradle wrapper duzeltme tamamlandi!
echo.
echo 📋 Sonraki adimlar:
echo   1. build-android.bat calistirin
echo   2. Veya: cd android-app ^&^& gradlew assembleDebug
echo.

pause
