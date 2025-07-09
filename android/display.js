class DigitalSignageDisplay {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.serverUrl = this.getServerUrl();
        this.deviceInfo = this.getDeviceInfo();
        this.currentContent = null;
        this.init();
    }

    init() {
        this.hideLoading();
        this.updateDeviceInfo();
        this.connectToServer();
        this.bindEvents();
        this.keepScreenOn();
    }

    getServerUrl() {
        // Try to get server URL from localStorage or use default
        const saved = localStorage.getItem('serverUrl');
        if (saved) return saved;
        
        // Default to current host with current port
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;
        return `${protocol}//${hostname}:${port}`;
    }

    getDeviceInfo() {
        return {
            name: this.getDeviceName(),
            model: this.getDeviceModel(),
            ip: this.getLocalIP(),
            userAgent: navigator.userAgent,
            screenWidth: screen.width,
            screenHeight: screen.height,
            timestamp: new Date().toISOString()
        };
    }

    getDeviceName() {
        // Try to get device name from various sources
        const saved = localStorage.getItem('deviceName');
        if (saved) return saved;
        
        const ua = navigator.userAgent;
        if (ua.includes('Mobile')) return 'Mobile Device';
        if (ua.includes('Tablet')) return 'Tablet Device';
        if (ua.includes('Android')) return 'Android Device';
        return 'Display Device';
    }

    getDeviceModel() {
        const ua = navigator.userAgent;
        
        // Android device detection
        const androidMatch = ua.match(/Android.*?(?:; )?(.*?)(?:\)| Build)/);
        if (androidMatch) return androidMatch[1];
        
        // Basic detection
        if (ua.includes('Mobile')) return 'Mobile Browser';
        if (ua.includes('Tablet')) return 'Tablet Browser';
        return 'Web Browser';
    }

    getLocalIP() {
        // This is a simplified approach - in a real app, you'd need more sophisticated IP detection
        return 'Auto-detect';
    }

    connectToServer() {
        try {
            this.socket = io(this.serverUrl);

            this.socket.on('connect', () => {
                this.isConnected = true;
                this.updateConnectionStatus(true);
                this.registerDevice();
                console.log('✅ Sunucuya bağlandı');
            });

            this.socket.on('disconnect', () => {
                this.isConnected = false;
                this.updateConnectionStatus(false);
                console.log('❌ Sunucu bağlantısı kesildi');
            });

            this.socket.on('content-update', (content) => {
                this.updateDisplay(content);
            });

            this.socket.on('connect_error', (error) => {
                this.updateConnectionStatus(false);
                console.error('🔌 Bağlantı hatası:', error);
                // Retry connection after 5 seconds
                setTimeout(() => this.connectToServer(), 5000);
            });

        } catch (error) {
            console.error('🚫 Socket bağlantı hatası:', error);
            this.updateConnectionStatus(false);
        }
    }

    registerDevice() {
        if (this.socket && this.isConnected) {
            this.socket.emit('register-device', this.deviceInfo);
            console.log('📱 Cihaz kaydedildi:', this.deviceInfo.name);
        }
    }

    updateDisplay(content) {
        const contentElement = document.getElementById('content');
        const lastUpdate = document.getElementById('lastUpdate');
        
        if (!content) return;
        
        this.currentContent = content;
        
        if (content.type === 'text') {
            contentElement.innerHTML = `<div class="text-content">${this.escapeHtml(content.content)}</div>`;
        } else if (content.type === 'image') {
            const imageUrl = this.serverUrl + content.content;
            contentElement.innerHTML = `<img class="image-content" src="${imageUrl}" alt="Display Content">`;
        }

        // Update last update time
        lastUpdate.textContent = new Date(content.timestamp).toLocaleString('tr-TR');
        
        // Show content with animation
        contentElement.style.display = 'flex';
        
        console.log('🔄 İçerik güncellendi:', content.type, content.content?.substring(0, 50));
    }

    updateConnectionStatus(connected) {
        const status = document.getElementById('connectionStatus');
        
        if (connected) {
            status.className = 'connection-status status-connected';
            status.innerHTML = '<i class="fas fa-circle"></i> Bağlı';
        } else {
            status.className = 'connection-status status-disconnected';
            status.innerHTML = '<i class="fas fa-circle"></i> Bağlantı Yok';
        }
    }

    updateDeviceInfo() {
        document.getElementById('deviceName').textContent = this.deviceInfo.name;
        document.getElementById('deviceModel').textContent = this.deviceInfo.model;
        document.getElementById('deviceIP').textContent = this.deviceInfo.ip;
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        setTimeout(() => {
            loading.style.display = 'none';
        }, 1000);
    }

    keepScreenOn() {
        // Prevent screen from going to sleep
        if ('wakeLock' in navigator) {
            navigator.wakeLock.request('screen').catch(err => {
                console.log('⚠️ Wake lock hatası:', err);
            });
        }
        
        // Alternative method: invisible video
        const video = document.createElement('video');
        video.src = 'data:video/mp4;base64,AAAAHGZ0eXBNNEEgAAACAGlzb21pc28yYXZjMQAAAAhmcmVlAAJOPW1kYXQAAAKuBgX//4qEnkWf2/8wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
        video.muted = true;
        video.loop = true;
        video.style.position = 'fixed';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '1px';
        video.style.height = '1px';
        video.style.opacity = '0';
        video.style.pointerEvents = 'none';
        document.body.appendChild(video);
        video.play().catch(() => {
            console.log('📹 Video autoplay engellendi (normal)');
        });
    }

    bindEvents() {
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.updateDeviceInfo();
                if (this.currentContent) {
                    this.updateDisplay(this.currentContent);
                }
            }, 500);
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.socket && !this.isConnected) {
                this.connectToServer();
            }
        });

        // Handle click for configuration (hidden feature)
        let clickCount = 0;
        document.addEventListener('click', () => {
            clickCount++;
            if (clickCount >= 5) {
                this.showConfigDialog();
                clickCount = 0;
            }
            setTimeout(() => { clickCount = 0; }, 3000);
        });

        // Handle app updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/android/sw.js')
                .then((registration) => {
                    console.log('🔧 Service Worker registered:', registration);
                })
                .catch((error) => {
                    console.log('⚠️ Service Worker registration failed:', error);
                });
        }
    }

    showConfigDialog() {
        const newUrl = prompt('Sunucu URL\'sini girin:', this.serverUrl);
        if (newUrl && newUrl !== this.serverUrl) {
            localStorage.setItem('serverUrl', newUrl);
            location.reload();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize display when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Digital Signage Display başlatılıyor...');
    new DigitalSignageDisplay();
});
