# APK Crash Debug Rehberi

## 🔍 Crash Sebeplerini Bulma

### 1. Logcat ile Hata Takibi

ADB ile cihazı bağlayıp logcat kullanın:

```cmd
adb logcat | findstr "digitalsignage"
```

### 2. En Basit Test APK'sı

Eğer hala crash ederse, minimal APK oluşturalım:

```java
// Sadece WebView açan basit Activity
public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        WebView webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.loadUrl("http://192.168.1.100:3000");
        setContentView(webView);
    }
}
```

### 3. Android Sürüm Kontrolleri

- Android 5.0+ gerekli
- WebView güncel olmalı
- İnternet izni verilmeli

### 4. Manuel APK Install

```cmd
adb install app-debug.apk
adb shell am start -n com.digitalsignage/.MainActivity
```

### 5. Crash Raporu Alma

```cmd
adb logcat -d > crash_log.txt
```

## 🎯 Alternatif Çözümler

1. **Web App olarak kullanın:** Chrome'da `http://IP:3000/android/display.html`
2. **PWA kurulumu:** "Ana ekrana ekle" seçeneği
3. **Kiosk browser:** Android kiosk uygulamaları

Bu yöntemlerle APK olmadan da sistem çalışabilir!
