# Digital Signage Management System

Bu proje, local network üzerinde çalışan bir dijital tabela yönetim sistemidir. Web tabanlı yönetim paneli üzerinden tüm cihazlara anlık olarak içerik (metin veya resim) gönderebilirsiniz.

## 🚀 Özellikler

- **Web Yönetim Paneli**: Kolay kullanımlı arayüz ile içerik yönetimi
- **Real-time Güncelleme**: WebSocket ile anlık içerik gönderimi
- **Çoklu Cihaz Desteği**: Aynı anda birden fazla cihaza yayın
- **Resim ve Metin Desteği**: JPEG, PNG, GIF, WebP formatları desteklenir
- **Responsive Tasarım**: Tüm cihaz boyutlarında uyumlu
- **Bağlantı Durumu**: Cihazların online/offline durumunu izleme
- **Local Network**: İnternet bağlantısı gerektirmez

## 📦 Kurulum

### Gereksinimler
- Node.js 16+ 
- NPM veya Yarn

### Adımlar

1. **Hızlı başlatma (Windows):**
\`\`\`bash
# PowerShell ile
.\start.ps1

# Veya Command Prompt ile  
start.bat
\`\`\`

2. **Manuel başlatma:**
\`\`\`bash
npm start
\`\`\`

3. **Development modunda çalıştırın:**
\`\`\`bash
npm run dev
\`\`\`

4. **Yönetim paneline erişin:**
   - Tarayıcınızda \`http://localhost:3001\` adresini açın
   - Network üzerindeki diğer cihazlardan \`http://[SUNUCU_IP]:3001\` ile erişin

## � Android APK Uygulaması

### Özellikler
- **Arkaplanda Çalışır**: Cihaz kapalı olsa bile arka planda monitoring yapar
- **Otomatik Uyanma**: Yeni içerik geldiğinde cihazı uyandırır ve ekranda gösterir
- **Kiosk Mode**: Tam ekran mod, home tuşu devre dışı
- **Boot Autostart**: Cihaz açıldığında otomatik başlar
- **Wake Lock**: Ekranı sürekli açık tutar
- **Real-time**: 2 saniyede bir sunucuyu kontrol eder

### APK Oluşturma

1. **Android Studio Requirements:**
   - Android Studio yükleyin
   - Android SDK (API 21+) yükleyin
   - ANDROID_HOME environment variable tanımlayın

2. **APK Build:**
   \`\`\`bash
   # Windows:
   build-android.bat
   
   # Manuel:
   cd android-app
   ./gradlew assembleDebug
   \`\`\`

3. **APK Location:**
   \`android-app/app/build/outputs/apk/debug/app-debug.apk\`

### Android Kurulum

1. **APK Installation:**
   - APK'yı Android cihaza kopyalayın
   - "Bilinmeyen kaynaklar"ı aktif edin
   - APK'ya tıklayarak kurun

2. **İlk Kurulum Ayarları:**
   - Uygulama tam ekran modda açılır
   - 5 kez ekrana tıklayın → Settings açılır
   - Server URL girin: \`http://[SERVER_IP]:3001/display\`
   - Save Settings → Restart app

3. **Permissions:**
   - Overlay permission (ekranın üstünde gösterim)
   - Battery optimization disable (arkaplanda çalışma)
   - Autostart permission (bazı cihazlarda)

### Android Cihaz Optimizasyonu

1. **Battery Settings:**
   - Battery optimization'ı kapatın
   - "Don't kill app" ayarını açın
   - Power saving mode'u kapatın

2. **Display Settings:**
   - Screen timeout: Never
   - Adaptive brightness: Off
   - Auto-rotate: On (isteğe bağlı)

3. **Security Settings:**
   - Screen lock: None (kiosk modda)
   - Unknown sources: Enable

### Nasıl Çalışır

1. **Background Service**: Sürekli çalışan servis sunucuyu monitor eder
2. **Content Check**: Her 2 saniyede \`/api/content\` endpoint'ini kontrol eder
3. **Wake Up**: Yeni içerik geldiğinde:
   - Cihazı uyandırır (wake lock)
   - Ekranı açar
   - MainActivity'yi öne getirir
   - WebView'i yeniler
4. **Display**: Güncel içerik tam ekranda gösterilir

## �🖥️ Kullanım

### Yönetim Paneli (Web)

1. **Metin Gönderme:**
   - Metin kutusuna içeriğinizi yazın
   - "Metni Gönder" butonuna tıklayın
   - Tüm bağlı cihazlarda anında görünür

2. **Resim Gönderme:**
   - "Resim Seç" alanına tıklayın veya resmi sürükleyip bırakın
   - Desteklenen formatlar: PNG, JPG, GIF, WebP (Max: 10MB)
   - "Resmi Gönder" butonuna tıklayın

3. **Cihaz Takibi:**
   - Bağlı cihazları "Bağlı Cihazlar" bölümünde görebilirsiniz
   - Her cihazın model bilgisi ve son görülme zamanı gösterilir

### Display Cihazı (Android/Web)

1. **Android Cihazlarda:**
   - \`android/display.html\` dosyasını cihazın tarayıcısında açın
   - Tam ekran moduna geçin
   - Otomatik olarak sunucuya bağlanır

2. **Web Tarayıcılarında:**
   - \`http://[SUNUCU_IP]:3000/android/display.html\` adresini açın
   - F11 ile tam ekran yapın

# 🔧 Port Çakışması Çözümü

Eğer "port already in use" hatası alırsanız:

1. **Otomatik çözüm:** \`start.ps1\` veya \`start.bat\` kullanın (otomatik port bulur)
2. **Manuel çözüm:** \`.env\` dosyasında \`PORT=3002\` gibi farklı port belirleyin
3. **Port kontrolü:** \`netstat -ano | findstr :3001\` ile port kullanımını kontrol edin

## 🔧 Konfigürasyon

### .env Dosyası

\`\`\`env
PORT=3000                    # Sunucu portu
MAX_FILE_SIZE=10485760      # Maksimum dosya boyutu (10MB)
UPLOAD_PATH=./uploads       # Yükleme dizini
JWT_SECRET=your-secret      # Güvenlik anahtarı
CORS_ORIGIN=*              # CORS ayarları
\`\`\`

### Network Ayarları

Sunucu varsayılan olarak tüm network interface'lerinde (\`0.0.0.0\`) çalışır. Local network'teki tüm cihazlar sunucu IP'si üzerinden erişebilir.

## 📁 Proje Yapısı

\`\`\`
PenguenApp/
├── server/
│   └── index.js          # Backend server
├── client/
│   ├── index.html        # Yönetim paneli
│   └── script.js         # Frontend JavaScript
├── android/
│   └── display.html      # Display uygulaması
├── uploads/              # Yüklenen dosyalar
├── package.json
├── .env
└── README.md
\`\`\`

## 🔌 API Endpoints

- \`GET /api/content\` - Mevcut içeriği al
- \`POST /api/content/text\` - Metin içerik gönder
- \`POST /api/content/image\` - Resim yükle
- \`GET /api/devices\` - Bağlı cihazları listele
- \`DELETE /api/content/image/:filename\` - Resim sil

## 🌐 WebSocket Events

### Client → Server
- \`register-device\` - Cihaz kaydı

### Server → Client  
- \`content-update\` - İçerik güncelleme

## 🛠️ Geliştirme

### Yeni Özellik Ekleme

1. Backend API'sini \`server/index.js\` dosyasında genişletin
2. Frontend'i \`client/script.js\` dosyasında güncelleyin  
3. Display uygulamasını \`android/display.html\` dosyasında düzenleyin

### Debug Modu

\`\`\`bash
npm run dev
\`\`\`

Nodemon ile otomatik restart özelliği aktif olur.

## 🔒 Güvenlik

- Sadece local network erişimi
- Dosya boyutu limitleri
- Dosya tipi doğrulaması
- CORS koruması
- Helmet.js güvenlik headers

## 🚀 Production Deployment

1. Environment variables'ları production değerleriyle güncelleyin
2. \`NODE_ENV=production\` olarak ayarlayın
3. Güçlü bir \`JWT_SECRET\` belirleyin
4. HTTPS kullanın (opsiyonel)

## 📱 Mobil Kullanım

Android cihazlarda tam ekran deneyimi için:
- Chrome'da "Ana ekrana ekle" özelliğini kullanın
- Otomatik döndürme aktif olsun
- Ekran sürekli açık kalması için power ayarlarını düzenleyin

## 🐛 Sorun Giderme

### Bağlantı Problemi
- Firewall ayarlarını kontrol edin
- Port 3000'in açık olduğundan emin olun
- Network IP adresini doğru kullandığınızı kontrol edin

### Resim Yükleme Hatası
- Dosya boyutunun 10MB'dan küçük olduğundan emin olun
- Desteklenen format kullandığınızı kontrol edin
- \`uploads\` klasörünün yazma yetkisi olduğundan emin olun

## 📄 Lisans

MIT License - Açık kaynak kodlu proje

## 👥 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (\`git checkout -b feature/AmazingFeature\`)
3. Commit edin (\`git commit -m 'Add some AmazingFeature'\`)
4. Branch'e push edin (\`git push origin feature/AmazingFeature\`)
5. Pull Request oluşturun

## 📞 Destek

Herhangi bir sorun yaşarsanız GitHub issues bölümünden bildirebilirsiniz.
