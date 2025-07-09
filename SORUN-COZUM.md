# 🛠️ APK Kurulum Sorunları - Hızlı Çözüm Rehberi

## ❌ Gradle Wrapper Hatası

**Hata:** `Could not find or load main class org.gradle.wrapper.GradleWrapperMain`

**Çözüm:**
```cmd
fix-gradle-wrapper.bat
```

Veya manuel:
1. `android-app\gradle\wrapper\` klasörünü silin
2. Şu URL'den `gradle-wrapper.jar` indirin: https://github.com/gradle/gradle/raw/v8.1.0/gradle/wrapper/gradle-wrapper.jar
3. `android-app\gradle\wrapper\gradle-wrapper.jar` olarak kaydedin
4. `setup-android.bat` çalıştırın

## ❌ Android SDK Bulunamadı

**Hata:** `ANDROID_HOME is not set`

**Çözüm:**
1. Android Studio'yu indirin: https://developer.android.com/studio
2. Android Studio'yu açın → SDK Manager → SDK'ları yükleyin
3. Environment Variables ayarlayın:
   - `ANDROID_HOME` = `C:\Users\[KULLANICI]\AppData\Local\Android\Sdk`
   - `PATH`'e ekleyin: `%ANDROID_HOME%\platform-tools`

## ❌ Java Bulunamadı

**Hata:** `Java bulunamadı`

**Çözüm:**
1. Java JDK yükleyin: https://adoptium.net/
2. `JAVA_HOME` environment variable'ı ayarlayın
3. `PATH`'e ekleyin: `%JAVA_HOME%\bin`

## ❌ APK Build Başarısız

**Hata:** `APK build basarisiz`

**Çözüm:**
1. Internet bağlantınızı kontrol edin
2. `.gradle` klasörünü silin (cache temizleme)
3. Android Studio ile projeyi açıp sync yapın
4. `setup-android.bat` çalıştırın

## ❌ APK Cihaza Kurulmuyor

**Hata:** APK kurulmuyor

**Çözüm:**
1. **Bilinmeyen kaynaklar**ı aktif edin:
   - Android 8+: Ayarlar → Güvenlik → Bilinmeyen kaynaklar
   - Android 7-: Ayarlar → Güvenlik → Bilinmeyen kaynaklar
2. **Developer options** açın:
   - Ayarlar → Telefon hakkında → Build number'a 7 kez tap
   - Ayarlar → Developer options → USB debugging ON
3. **Antivirüs** geçici kapatın
4. **Dosya bozuk** olabilir, yeniden build yapın

## ❌ Uygulama Açılmıyor

**Hata:** Uygulama crash oluyor

**Çözüm:**
1. **İzinleri** kontrol edin:
   - İnternet erişimi
   - Diğer uygulamalar üzerine çizim
   - Cihazı uyandırma
2. **Android sürümü** 5.0+ olmalı
3. **RAM** yeterli olmalı (min 1GB)
4. **Server URL** doğru girilmeli

## ❌ Server'a Bağlanmıyor

**Hata:** Connection failed

**Çözüm:**
1. **Aynı WiFi ağında** olun
2. **Server URL** doğru:
   - `http://192.168.1.100:3000/display`
   - IP adresini `ipconfig` ile kontrol edin
3. **Firewall** kapatın
4. **Port 3000** açık olmalı

## 🚀 Hızlı Kurulum

```cmd
# 1. Hazırlık
setup-android.bat

# 2. APK Oluştur
build-android.bat

# 3. Sorunu Çöz
fix-gradle-wrapper.bat

# 4. Kolay Kurulum
kolay-apk-kur.bat
```

## 📞 Hala Sorun Var?

1. **Log dosyalarını** kontrol edin
2. **Hata mesajını** tam olarak not edin
3. **System bilgilerini** toplayın:
   - Windows sürümü
   - Java sürümü
   - Android Studio sürümü
   - Hata mesajı

**Destek için gerekli bilgiler:**
- `java -version`
- `gradlew --version`
- `echo %ANDROID_HOME%`
- Tam hata mesajı

---

💡 **İpucu:** İlk kurulum genellikle 15-30 dakika sürer. Sabırlı olun!
