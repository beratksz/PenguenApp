class DigitalSignageAdmin {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.init();
    }

    init() {
        this.connectSocket();
        this.bindEvents();
        this.loadCurrentContent();
        this.loadDevices();
    }

    connectSocket() {
        this.socket = io();

        this.socket.on('connect', () => {
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.showNotification('Sunucuya bağlandı', 'success');
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.showNotification('Sunucu bağlantısı kesildi', 'error');
        });

        this.socket.on('content-update', (content) => {
            this.updateContentPreview(content);
        });

        this.socket.on('connect_error', () => {
            this.updateConnectionStatus(false);
            this.showNotification('Sunucuya bağlanılamadı', 'error');
        });
    }

    bindEvents() {
        // Text form submission
        document.getElementById('textForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendTextContent();
        });

        // Image form submission
        document.getElementById('imageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendImageContent();
        });

        // File input change
        document.getElementById('imageFile').addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        // File drop zone
        const fileDisplay = document.querySelector('.file-input-display');
        fileDisplay.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileDisplay.style.background = '#667eea';
            fileDisplay.style.color = 'white';
        });

        fileDisplay.addEventListener('dragleave', (e) => {
            e.preventDefault();
            fileDisplay.style.background = '#f8f9fa';
            fileDisplay.style.color = '#667eea';
        });

        fileDisplay.addEventListener('drop', (e) => {
            e.preventDefault();
            fileDisplay.style.background = '#f8f9fa';
            fileDisplay.style.color = '#667eea';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('imageFile').files = files;
                this.handleFileSelect({ target: { files } });
            }
        });
    }

    async sendTextContent() {
        const textContent = document.getElementById('textContent').value.trim();
        
        if (!textContent) {
            this.showNotification('Lütfen metin içeriği girin', 'error');
            return;
        }

        try {
            const response = await fetch('/api/content/text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: textContent })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Metin başarıyla gönderildi', 'success');
                document.getElementById('textContent').value = '';
                this.updateContentPreview(result.content);
            } else {
                this.showNotification('Metin gönderilemedi: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async sendImageContent() {
        const fileInput = document.getElementById('imageFile');
        const file = fileInput.files[0];

        if (!file) {
            this.showNotification('Lütfen bir resim seçin', 'error');
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('Dosya boyutu 10MB\'dan büyük olamaz', 'error');
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            this.showNotification('Sadece JPEG, PNG, GIF ve WebP dosyaları desteklenir', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            this.showUploadProgress(true);
            
            const response = await fetch('/api/content/image', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Resim başarıyla gönderildi', 'success');
                fileInput.value = '';
                this.resetFileDisplay();
                this.updateContentPreview(result.content);
            } else {
                this.showNotification('Resim gönderilemedi: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        } finally {
            this.showUploadProgress(false);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        const fileDisplay = document.querySelector('.file-input-display');
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                fileDisplay.innerHTML = `
                    <div>
                        <img src="${e.target.result}" style="max-width: 200px; max-height: 150px; border-radius: 8px;">
                        <p style="margin-top: 10px;">${file.name}</p>
                        <small>${this.formatFileSize(file.size)}</small>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        } else {
            fileDisplay.innerHTML = `
                <div>
                    <i class="fas fa-file"></i>
                    <p>${file.name}</p>
                    <small>${this.formatFileSize(file.size)}</small>
                </div>
            `;
        }
    }

    resetFileDisplay() {
        const fileDisplay = document.querySelector('.file-input-display');
        fileDisplay.innerHTML = `
            <div>
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Resim yüklemek için tıklayın<br><small>PNG, JPG, GIF desteklenir (Max: 10MB)</small></p>
            </div>
        `;
    }

    async loadCurrentContent() {
        try {
            const response = await fetch('/api/content');
            const content = await response.json();
            this.updateContentPreview(content);
        } catch (error) {
            console.error('İçerik yüklenemedi:', error);
        }
    }

    async loadDevices() {
        try {
            const response = await fetch('/api/devices');
            const devices = await response.json();
            this.updateDevicesList(devices);
        } catch (error) {
            console.error('Cihazlar yüklenemedi:', error);
        }
    }

    updateContentPreview(content) {
        const preview = document.getElementById('contentPreview');
        const lastUpdate = document.getElementById('lastUpdate');
        
        if (content.type === 'text') {
            preview.innerHTML = `<div class="text-content">${this.escapeHtml(content.content)}</div>`;
        } else if (content.type === 'image') {
            preview.innerHTML = `<img src="${content.content}" alt="Current Content">`;
        }

        lastUpdate.textContent = new Date(content.timestamp).toLocaleString('tr-TR');
    }

    updateDevicesList(devices) {
        const devicesList = document.getElementById('devicesList');
        const deviceCount = document.getElementById('deviceCount');
        
        deviceCount.textContent = devices.length;

        if (devices.length === 0) {
            devicesList.innerHTML = `
                <div class="device-item">
                    <div class="device-info">
                        <p style="text-align: center; color: #6c757d;">Henüz bağlı cihaz yok</p>
                    </div>
                </div>
            `;
            return;
        }

        devicesList.innerHTML = devices.map(device => `
            <div class="device-item">
                <div class="device-info">
                    <h4>${device.name || 'Bilinmeyen Cihaz'}</h4>
                    <p>Model: ${device.model || 'Bilinmiyor'} | Son görülme: ${new Date(device.lastSeen).toLocaleString('tr-TR')}</p>
                </div>
                <div style="color: #28a745;">
                    <i class="fas fa-circle" style="font-size: 0.8em;"></i>
                </div>
            </div>
        `).join('');
    }

    updateConnectionStatus(connected) {
        const status = document.getElementById('connectionStatus');
        
        if (connected) {
            status.className = 'status-indicator status-connected';
            status.innerHTML = '<i class="fas fa-circle"></i><span>Sunucuya bağlı</span>';
        } else {
            status.className = 'status-indicator status-disconnected';
            status.innerHTML = '<i class="fas fa-circle"></i><span>Sunucu bağlantısı yok</span>';
        }
    }

    showUploadProgress(show) {
        const progress = document.querySelector('.upload-progress');
        const progressBar = document.querySelector('.upload-progress-bar');
        
        if (show) {
            progress.style.display = 'block';
            progressBar.style.width = '0%';
            
            // Simulate upload progress
            let width = 0;
            const interval = setInterval(() => {
                width += Math.random() * 30;
                if (width >= 100) {
                    width = 100;
                    clearInterval(interval);
                }
                progressBar.style.width = width + '%';
            }, 200);
        } else {
            setTimeout(() => {
                progress.style.display = 'none';
                progressBar.style.width = '0%';
            }, 500);
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the admin panel when page loads
document.addEventListener('DOMContentLoaded', () => {
    new DigitalSignageAdmin();
    
    // Refresh devices list every 30 seconds
    setInterval(async () => {
        try {
            const response = await fetch('/api/devices');
            const devices = await response.json();
            new DigitalSignageAdmin().updateDevicesList(devices);
        } catch (error) {
            console.error('Cihaz listesi güncellenemedi:', error);
        }
    }, 30000);
});
