# Java 17 Kurulum Rehberi - Android APK İçin

## 🚨 Problem: Java 24 Android Build ile Uyumlu Değil

Android build için Java 17 (LTS) kullanmamız gerekiyor. Java 24 henüz tam destek görmüyor.

## ✅ Çözüm: Java 17 Kurulumu

### 1. Java 17 İndir
- **AdoptOpenJDK** (Önerilen): https://adoptium.net/
- **OpenJDK 17**: https://jdk.java.net/17/
- **Oracle JDK 17**: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html

### 2. Kurulum Adımları

1. **İndirme:**
   - https://adoptium.net/ adresine gidin
   - "Other platforms and versions" tıklayın
   - "17" seçin → "Windows" → "x64" → "JDK"
   - `.msi` dosyasını indirin

2. **Kurulum:**
   - İndirilen `.msi` dosyasını çalıştırın
   - "Add to PATH" seçeneğini işaretleyin
   - "Set JAVA_HOME" seçeneğini işaretleyin
   - "Install" deyin

3. **Doğrulama:**
   ```cmd
   java -version
   ```
   Output:
   ```
   openjdk version "17.0.x"
   ```

### 3. Environment Variables Manuel Ayarı

Eğer otomatik ayarlanmadıysa:

1. **JAVA_HOME:**
   - Windows Key + R → `sysdm.cpl`
   - Advanced → Environment Variables
   - System Variables → New:
     - Name: `JAVA_HOME`
     - Value: `C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x-hotspot`

2. **PATH:**
   - PATH değişkenini düzenleyin
   - Yeni ekleyin: `%JAVA_HOME%\bin`

### 4. Gradle Ayarları

`android-app/gradle.properties` dosyasını güncelleyin:
```properties
org.gradle.java.home=C:/Program Files/Eclipse Adoptium/jdk-17.0.x.x-hotspot
```

### 5. APK Build

```cmd
cd android-app
gradlew clean
gradlew assembleDebug
```

## 🔧 Alternatif Çözüm: SDKMAN

Windows için SDKMAN kullanarak:

```cmd
# SDKMAN kurulumu
curl -s "https://get.sdkman.io" | bash

# Java 17 kurulumu
sdk install java 17.0.8-tem
sdk use java 17.0.8-tem
```

## 📱 APK Konumu

Başarılı build sonrası:
```
android-app/app/build/outputs/apk/debug/app-debug.apk
```

## 🚨 Hata Çözümleri

### "Unsupported class file major version 68"
- Java 24 kullanıyorsunuz, Java 17 gerekiyor

### "JAVA_HOME is not set"
- Environment variables'ı doğru ayarlayın
- Command prompt'u yeniden açın

### "Could not find or load main class"
- `gradle-wrapper.jar` dosyası eksik
- `setup-android.bat` çalıştırın

## 🎯 Sonuç

Java 17 kurulumu sonrası:
1. Command prompt'u yeniden açın
2. `java -version` ile doğrulayın
3. `android-app` klasöründe `gradlew assembleDebug` çalıştırın
4. APK hazır!
