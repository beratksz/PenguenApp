class DigitalSignageAdmin {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentTab = 'content';
        this.devices = new Map();
        this.scheduledContent = [];
        this.templates = [];
        this.statistics = {};
        this.settings = {};
        this.init();
    }

    init() {
        this.connectSocket();
        this.bindEvents();
        this.loadInitialData();
        this.setupAutoRefresh();
    }

    connectSocket() {
        this.socket = io();

        this.socket.on('connect', () => {
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.showNotification('Sunucuya bağlandı', 'success');
            console.log('🔗 Sunucuya bağlandı');
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.showNotification('Sunucu bağlantısı kesildi', 'error');
            console.log('🔌 Sunucu bağlantısı kesildi');
        });

        this.socket.on('content-update', (content) => {
            this.updateContentPreview(content);
            this.showNotification('İçerik güncellendi', 'success');
        });

        this.socket.on('settings-update', (settings) => {
            this.settings = settings;
            this.updateSettingsUI();
            this.showNotification('Ayarlar güncellendi', 'success');
        });

        this.socket.on('emergency-content', (emergency) => {
            this.showEmergencyBanner(emergency);
            this.showNotification('Acil durum içeriği alındı!', 'warning');
        });

        this.socket.on('emergency-clear', () => {
            this.hideEmergencyBanner();
            this.showNotification('Acil durum temizlendi', 'success');
        });

        this.socket.on('health-check', (data) => {
            console.log('💓 Sağlık kontrolü alındı:', data);
        });

        this.socket.on('bulk-content', (bulkContent) => {
            this.showNotification(`Toplu içerik alındı: ${bulkContent.contents.length} öğe`, 'success');
        });

        this.socket.on('device-control', (data) => {
            console.log('🎛️ Cihaz kontrolü:', data);
        });

        this.socket.on('connect_error', () => {
            this.updateConnectionStatus(false);
            this.showNotification('Sunucuya bağlanılamadı', 'error');
        });
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Form submissions
        document.getElementById('textForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendTextContent();
        });

        document.getElementById('imageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendImageContent();
        });

        document.getElementById('quickScheduleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.scheduleContent();
        });

        document.getElementById('emergencyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendEmergencyContent();
        });

        // File input
        document.getElementById('imageFile').addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        // Settings
        document.getElementById('brightness').addEventListener('input', (e) => {
            document.getElementById('brightnessValue').textContent = e.target.value + '%';
        });

        document.getElementById('volume').addEventListener('input', (e) => {
            document.getElementById('volumeValue').textContent = e.target.value + '%';
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

        // Auto-set current date/time for scheduling
        const now = new Date();
        document.getElementById('scheduleDate').value = now.toISOString().split('T')[0];
        document.getElementById('scheduleTime').value = now.toTimeString().slice(0, 5);
    }

    async loadInitialData() {
        await Promise.all([
            this.loadCurrentContent(),
            this.loadDevices(),
            this.loadScheduledContent(),
            this.loadTemplates(),
            this.loadSettings(),
            this.loadStatistics()
        ]);
    }

    setupAutoRefresh() {
        // Refresh live stats every 10 seconds
        setInterval(() => {
            this.updateLiveStats();
        }, 10000);

        // Refresh devices every 30 seconds
        setInterval(() => {
            if (this.currentTab === 'devices') {
                this.loadDevices();
            }
        }, 30000);

        // Refresh scheduled content every minute
        setInterval(() => {
            if (this.currentTab === 'scheduled') {
                this.loadScheduledContent();
            }
        }, 60000);
    }

    switchTab(tabId) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabId).classList.add('active');

        this.currentTab = tabId;

        // Load data for active tab
        switch (tabId) {
            case 'devices':
                this.loadDevices();
                break;
            case 'scheduled':
                this.loadScheduledContent();
                break;
            case 'templates':
                this.loadTemplates();
                break;
            case 'statistics':
                this.loadStatistics();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
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

    async loadScheduledContent() {
        try {
            const response = await fetch('/api/scheduled');
            const scheduled = await response.json();
            this.scheduledContent = scheduled;
            this.updateScheduledContentUI();
        } catch (error) {
            console.error('Zamanlanmış içerik yüklenemedi:', error);
        }
    }

    async loadTemplates() {
        try {
            const response = await fetch('/api/templates');
            const templates = await response.json();
            this.templates = templates;
            this.updateTemplatesUI();
        } catch (error) {
            console.error('Şablonlar yüklenemedi:', error);
        }
    }

    async loadSettings() {
        try {
            const response = await fetch('/api/settings');
            const settings = await response.json();
            this.settings = settings;
            this.updateSettingsUI();
        } catch (error) {
            console.error('Ayarlar yüklenemedi:', error);
        }
    }

    async loadStatistics() {
        try {
            const response = await fetch('/api/statistics');
            const statistics = await response.json();
            this.statistics = statistics;
            this.updateStatisticsUI();
        } catch (error) {
            console.error('İstatistikler yüklenemedi:', error);
        }
    }

    async scheduleContent() {
        const contentType = document.getElementById('scheduleType').value;
        const content = document.getElementById('scheduleContent').value.trim();
        const date = document.getElementById('scheduleDate').value;
        const time = document.getElementById('scheduleTime').value;
        const duration = document.getElementById('scheduleDuration').value;

        if (!content || !date || !time) {
            this.showNotification('Lütfen tüm alanları doldurun', 'error');
            return;
        }

        try {
            const response = await fetch('/api/scheduled', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: contentType,
                    content: content,
                    scheduledTime: `${date}T${time}:00`,
                    duration: parseInt(duration)
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('İçerik başarıyla zamanlandı', 'success');
                document.getElementById('quickScheduleForm').reset();
                this.loadScheduledContent();
            } else {
                this.showNotification('İçerik zamanlanamadı: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async sendEmergencyContent() {
        const emergencyText = document.getElementById('emergencyText').value.trim();
        const priority = document.getElementById('emergencyPriority').value;

        if (!emergencyText) {
            this.showNotification('Lütfen acil durum mesajını girin', 'error');
            return;
        }

        try {
            const response = await fetch('/api/emergency', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: emergencyText,
                    priority: priority
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Acil durum mesajı gönderildi', 'success');
                document.getElementById('emergencyForm').reset();
            } else {
                this.showNotification('Acil durum mesajı gönderilemedi: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    updateScheduledContentUI() {
        const scheduledList = document.getElementById('scheduledList');
        if (!scheduledList) return;

        if (this.scheduledContent.length === 0) {
            scheduledList.innerHTML = '<div class="no-data">Zamanlanmış içerik yok</div>';
            return;
        }

        scheduledList.innerHTML = this.scheduledContent.map(item => `
            <div class="scheduled-item">
                <div class="scheduled-info">
                    <h4>${item.type === 'text' ? 'Metin' : 'Resim'}</h4>
                    <p>${item.content.length > 50 ? item.content.substring(0, 50) + '...' : item.content}</p>
                    <small>Zaman: ${new Date(item.scheduledTime).toLocaleString('tr-TR')}</small>
                </div>
                <div class="scheduled-actions">
                    <button onclick="admin.deleteScheduledContent('${item.id}')" class="btn btn-danger">Sil</button>
                </div>
            </div>
        `).join('');
    }

    updateTemplatesUI() {
        const templatesList = document.getElementById('templatesList');
        if (!templatesList) return;

        if (this.templates.length === 0) {
            templatesList.innerHTML = '<div class="no-data">Şablon yok</div>';
            return;
        }

        templatesList.innerHTML = this.templates.map(template => `
            <div class="template-item">
                <div class="template-info">
                    <h4>${template.name}</h4>
                    <p>${template.description || 'Açıklama yok'}</p>
                </div>
                <div class="template-actions">
                    <button onclick="admin.useTemplate('${template.id}')" class="btn btn-primary">Kullan</button>
                    <button onclick="admin.deleteTemplate('${template.id}')" class="btn btn-danger">Sil</button>
                </div>
            </div>
        `).join('');
    }

    updateSettingsUI() {
        if (this.settings.brightness !== undefined) {
            document.getElementById('brightness').value = this.settings.brightness;
            document.getElementById('brightnessValue').textContent = this.settings.brightness + '%';
        }
        if (this.settings.volume !== undefined) {
            document.getElementById('volume').value = this.settings.volume;
            document.getElementById('volumeValue').textContent = this.settings.volume + '%';
        }
        if (this.settings.autoRefresh !== undefined) {
            document.getElementById('autoRefresh').checked = this.settings.autoRefresh;
        }
        if (this.settings.displayTimeout !== undefined) {
            document.getElementById('displayTimeout').value = this.settings.displayTimeout;
        }
    }

    updateStatisticsUI() {
        const stats = this.statistics;
        if (!stats) return;

        const elements = {
            totalDevices: document.getElementById('totalDevices'),
            activeDevices: document.getElementById('activeDevices'),
            totalContent: document.getElementById('totalContent'),
            scheduledContent: document.getElementById('scheduledContentCount'),
            uptime: document.getElementById('uptime'),
            lastUpdate: document.getElementById('lastStatsUpdate')
        };

        if (elements.totalDevices) elements.totalDevices.textContent = stats.totalDevices || 0;
        if (elements.activeDevices) elements.activeDevices.textContent = stats.activeDevices || 0;
        if (elements.totalContent) elements.totalContent.textContent = stats.totalContent || 0;
        if (elements.scheduledContent) elements.scheduledContent.textContent = stats.scheduledContent || 0;
        if (elements.uptime) elements.uptime.textContent = stats.uptime || 'Bilinmiyor';
        if (elements.lastUpdate) elements.lastUpdate.textContent = new Date().toLocaleString('tr-TR');
    }

    updateLiveStats() {
        if (this.currentTab === 'statistics') {
            this.loadStatistics();
        }
    }

    showEmergencyBanner(emergency) {
        const banner = document.getElementById('emergencyBanner');
        if (banner) {
            banner.innerHTML = `
                <div class="emergency-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${emergency.text}</span>
                    <button onclick="admin.clearEmergency()" class="btn btn-sm">Temizle</button>
                </div>
            `;
            banner.style.display = 'block';
        }
    }

    hideEmergencyBanner() {
        const banner = document.getElementById('emergencyBanner');
        if (banner) {
            banner.style.display = 'none';
        }
    }

    async clearEmergency() {
        try {
            const response = await fetch('/api/emergency', {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.hideEmergencyBanner();
                this.showNotification('Acil durum temizlendi', 'success');
            } else {
                this.showNotification('Acil durum temizlenemedi: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async deleteScheduledContent(id) {
        if (!confirm('Bu zamanlanmış içeriği silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const response = await fetch(`/api/scheduled/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Zamanlanmış içerik silindi', 'success');
                this.loadScheduledContent();
            } else {
                this.showNotification('Zamanlanmış içerik silinemedi: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async useTemplate(id) {
        try {
            const response = await fetch(`/api/templates/${id}/use`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Şablon kullanıldı', 'success');
                this.updateContentPreview(result.content);
            } else {
                this.showNotification('Şablon kullanılamadı: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async deleteTemplate(id) {
        if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const response = await fetch(`/api/templates/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Şablon silindi', 'success');
                this.loadTemplates();
            } else {
                this.showNotification('Şablon silinemedi: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async saveSettings() {
        const settings = {
            brightness: parseInt(document.getElementById('brightness').value),
            volume: parseInt(document.getElementById('volume').value),
            autoRefresh: document.getElementById('autoRefresh').checked,
            displayTimeout: parseInt(document.getElementById('displayTimeout').value)
        };

        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings)
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Ayarlar kaydedildi', 'success');
                this.settings = settings;
            } else {
                this.showNotification('Ayarlar kaydedilemedi: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async restartDevice(deviceId) {
        if (!confirm('Bu cihazı yeniden başlatmak istediğinizden emin misiniz?')) {
            return;
        }

        try {
            const response = await fetch(`/api/devices/${deviceId}/restart`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Cihaz yeniden başlatılıyor...', 'success');
            } else {
                this.showNotification('Cihaz yeniden başlatılamadı: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async updateDevice(deviceId) {
        try {
            const response = await fetch(`/api/devices/${deviceId}/update`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Cihaz güncellemesi başlatıldı', 'success');
            } else {
                this.showNotification('Cihaz güncellenemedi: ' + result.error, 'error');
            }
        } catch (error) {
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    updateLiveStats() {
        if (this.currentTab === 'statistics') {
            this.loadStatistics();
        }
    }

    updateDevicesList(devices) {
        this.devices = new Map(devices.map(device => [device.id, device]));
        
        const devicesList = document.getElementById('devicesList');
        if (!devicesList) return;

        if (devices.length === 0) {
            devicesList.innerHTML = '<div class="no-data">Aktif cihaz yok</div>';
            return;
        }

        devicesList.innerHTML = devices.map(device => `
            <div class="device-item ${device.status === 'online' ? 'online' : 'offline'}">
                <div class="device-info">
                    <h4>${device.name || device.id}</h4>
                    <p>IP: ${device.ip}</p>
                    <small>Son görülme: ${new Date(device.lastSeen).toLocaleString('tr-TR')}</small>
                    <span class="device-status ${device.status}">${device.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
                </div>
                <div class="device-actions">
                    <button onclick="admin.restartDevice('${device.id}')" class="btn btn-warning" ${device.status === 'offline' ? 'disabled' : ''}>
                        Yeniden Başlat
                    </button>
                    <button onclick="admin.updateDevice('${device.id}')" class="btn btn-info" ${device.status === 'offline' ? 'disabled' : ''}>
                        Güncelle
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateContentPreview(content) {
        const preview = document.getElementById('contentPreview');
        if (!preview) return;

        if (!content) {
            preview.innerHTML = '<div class="no-content">İçerik bulunamadı</div>';
            return;
        }

        switch (content.type) {
            case 'text':
                preview.innerHTML = `
                    <div class="content-display text-content">
                        <h3>Aktif Metin İçeriği</h3>
                        <p>${content.text}</p>
                        <small>Gönderilme zamanı: ${new Date(content.timestamp).toLocaleString('tr-TR')}</small>
                    </div>
                `;
                break;
            case 'image':
                preview.innerHTML = `
                    <div class="content-display image-content">
                        <h3>Aktif Resim İçeriği</h3>
                        <img src="${content.url}" alt="Aktif İçerik" style="max-width: 100%; height: auto; border-radius: 8px;">
                        <small>Gönderilme zamanı: ${new Date(content.timestamp).toLocaleString('tr-TR')}</small>
                    </div>
                `;
                break;
            default:
                preview.innerHTML = '<div class="no-content">Bilinmeyen içerik türü</div>';
        }
    }

    updateConnectionStatus(isConnected) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.className = `connection-status ${isConnected ? 'connected' : 'disconnected'}`;
            statusElement.innerHTML = `
                <i class="fas ${isConnected ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                ${isConnected ? 'Bağlı' : 'Bağlantı Yok'}
            `;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-times-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) {
            return `${days}g ${hours}s ${minutes}d`;
        } else if (hours > 0) {
            return `${hours}s ${minutes}d`;
        } else {
            return `${minutes}d`;
        }
    }
}

// Global admin instance
let admin = null;

// Initialize the admin panel when page loads
document.addEventListener('DOMContentLoaded', () => {
    admin = new DigitalSignageAdmin();
    
    // Global device refresh is handled in setupAutoRefresh method
    console.log('🚀 Digital Signage Admin Panel başlatıldı');
});
