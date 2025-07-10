# Font Awesome Local Kurulum Rehberi

## 1. Font Awesome Dosyalarını İndirin

Aşağıdaki linklerden Font Awesome dosyalarını indirin ve belirtilen klasörlere yerleştirin:

### Font Dosyaları (client/lib/fontawesome/ klasörüne):

1. **fa-solid-900.woff2**
   - Link: https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2
   - Hedef: `client/lib/fontawesome/fa-solid-900.woff2`

2. **fa-solid-900.woff**
   - Link: https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff
   - Hedef: `client/lib/fontawesome/fa-solid-900.woff`

3. **fa-regular-400.woff2**
   - Link: https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2
   - Hedef: `client/lib/fontawesome/fa-regular-400.woff2`

4. **fa-regular-400.woff**
   - Link: https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff
   - Hedef: `client/lib/fontawesome/fa-regular-400.woff`

## 2. Hızlı İndirme (PowerShell ile)

Aşağıdaki PowerShell komutlarını çalıştırarak otomatik olarak indirebilirsiniz:

```powershell
# Font Awesome klasörüne git
cd "c:\Users\berat\source\repos\PenguenApp\client\lib\fontawesome"

# Font dosyalarını indir
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2" -OutFile "fa-solid-900.woff2"
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff" -OutFile "fa-solid-900.woff"
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2" -OutFile "fa-regular-400.woff2"
Invoke-WebRequest -Uri "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff" -OutFile "fa-regular-400.woff"

echo "Font Awesome dosyaları başarıyla indirildi!"
```

## 3. Manuel İndirme

1. Yukarıdaki linkleri tarayıcınızda açın
2. Dosyaları `client/lib/fontawesome/` klasörüne kaydedin
3. Dosya adlarının doğru olduğundan emin olun

## 4. Alternatif: Tam Font Awesome Paketi

Eğer tüm Font Awesome paketini indirmek isterseniz:

1. https://fontawesome.com/download adresine gidin
2. "Free for Web" seçeneğini indirin
3. İndirdiğiniz ZIP dosyasından `webfonts` klasöründeki dosyaları kopyalayın
4. `client/lib/fontawesome/` klasörüne yapıştırın

## 5. Doğrulama

Font dosyaları doğru yüklendikten sonra:
1. Sunucuyu yeniden başlatın
2. Web panelini yenileyin
3. İkonlar artık doğru görünmeli

## Dosya Yapısı

İndirme sonrası klasör yapınız şöyle olmalı:

```
client/
  lib/
    fontawesome/
      ├── all.min.css
      ├── fonts.css
      ├── fa-solid-900.woff2
      ├── fa-solid-900.woff
      ├── fa-regular-400.woff2
      └── fa-regular-400.woff
```

## Sorun Giderme

Eğer ikonlar hala görünmüyorsa:
1. Tarayıcı cache'ini temizleyin (Ctrl+F5)
2. Geliştirici araçlarında Console sekmesini kontrol edin
3. Network sekmesinde font dosyalarının doğru yüklendiğini kontrol edin
