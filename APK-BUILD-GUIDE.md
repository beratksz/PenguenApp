# APK Oluşturma Rehberi - Digital Signage

## 🛠️ Gereksinimler

### Android Studio Kurulumu
1. **Android Studio İndir:**
   - https://developer.android.com/studio adresinden indirin
   - Windows 64-bit: android-studio-*.exe dosyasını indirin

2. **Kurulum:**
   - İndirilen exe dosyasını çalıştırın
   - "Next" ile devam edin
   - "Install Type" → "Standard" seçin
   - SDK Components otomatik indirilecek (yaklaşık 3-4 GB)

3. **İlk Açılış:**
   - Android Studio'yu açın
   - "More Actions" → "SDK Manager" tıklayın
   - SDK Platforms sekmesinde Android 13.0 (API 33) ve Android 14.0 (API 34) seçin
   - SDK Tools sekmesinde:
     ✅ Android SDK Build-Tools
     ✅ Android SDK Command-line Tools
     ✅ Android Emulator
     ✅ Android SDK Platform-Tools
   - "Apply" → "OK" ile yükleyin

### Environment Variables Ayarı
Windows'ta:
1. Windows key + R → "sysdm.cpl" yazın
2. "Advanced" tab → "Environment Variables"
3. "New" (System variables):
   - Variable name: ANDROID_HOME
   - Variable value: C:\Users\[KULLANICI_ADI]\AppData\Local\Android\Sdk
4. Path değişkenine ekleyin:
   - %ANDROID_HOME%\platform-tools
   - %ANDROID_HOME%\tools

## 🏗️ APK Build Adımları

### Yöntem 1: Otomatik Script
```cmd
# Proje klasöründe:
build-android.bat
```

### Yöntem 2: Android Studio ile
1. Android Studio'yu açın
2. "Open an Existing Project" 
3. "android-app" klasörünü seçin
4. Gradle sync bekleyin (ilk seferde uzun sürer)
5. Build → Build Bundle(s) / APK(s) → Build APK(s)
6. APK: app\build\outputs\apk\debug\app-debug.apk

### Yöntem 3: Command Line
```cmd
cd android-app
gradlew assembleDebug
```

## 📦 APK Dosyası
Başarılı build sonrası APK şu konumda olacak:
```
PenguenApp/android-app/app/build/outputs/apk/debug/app-debug.apk
```

## 🚨 Olası Sorunlar ve Çözümler

### Gradle Sync Hatası
- File → Invalidate Caches and Restart
- Gradle wrapper'ı yeniden indirin

### SDK Missing
- SDK Manager'dan eksik SDK'ları yükleyin
- Build Tools version'unu kontrol edin

### Memory Error
- gradle.properties dosyasında:
  ```
  org.gradle.jvmargs=-Xmx4096m
  ```

### Build Error
- Clean Project → Rebuild Project deneyin
- Gradle cache temizleyin: .gradle klasörünü silin

## 📋 APK Test Etme
1. APK'yı USB ile Android cihaza kopyalayın
2. Dosya yöneticisinde APK'ya tıklayın
3. "Bilinmeyen kaynaklar"ı aktif edin
4. "Yükle" deyin
5. Uygulama otomatik açılacak
