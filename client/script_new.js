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
        // Ensure DOM is fully loaded before binding events
        setTimeout(() => {
            this.bindEvents();
            this.loadInitialData();
            this.setupAutoRefresh();
            console.log('Digital Signage Admin initialized');
        }, 100); // Short timeout to ensure DOM is ready
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
        console.log('Binding events...');
        
        // Tab switching
        const navTabs = document.querySelectorAll('.nav-tab');
        console.log(`Found ${navTabs.length} tabs`);
        
        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = tab.getAttribute('data-tab');
                console.log(`Tab clicked: ${tabId}`);
                this.switchTab(tabId);
            });
        });

        // Form submissions
        const textForm = document.getElementById('textForm');
        if (textForm) {
            textForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Text form submitted');
                this.sendTextContent();
            });
        } else {
            console.error('Text form not found');
        }

        const imageForm = document.getElementById('imageForm');
        if (imageForm) {
            imageForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Image form submitted');
                this.sendImageContent();
            });
        }

        const quickScheduleForm = document.getElementById('quickScheduleForm');
        if (quickScheduleForm) {
            quickScheduleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Schedule form submitted');
                this.scheduleContent();
            });
        }

        const emergencyForm = document.getElementById('emergencyForm');
        if (emergencyForm) {
            emergencyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Emergency form submitted');
                this.sendEmergencyContent();
            });
        }

        // File input
        const imageFile = document.getElementById('imageFile');
        if (imageFile) {
            imageFile.addEventListener('change', (e) => {
                this.handleFileSelect(e);
            });
        }

        // Settings
        const brightness = document.getElementById('brightness');
        if (brightness) {
            brightness.addEventListener('input', (e) => {
                document.getElementById('brightnessValue').textContent = e.target.value + '%';
            });
        }

        const volume = document.getElementById('volume');
        if (volume) {
            volume.addEventListener('input', (e) => {
                document.getElementById('volumeValue').textContent = e.target.value + '%';
            });
        }

        // File drop zone
        const fileDisplay = document.querySelector('.file-input-display');
        if (fileDisplay) {
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

        // Auto-set current date/time for scheduling
        const scheduleDate = document.getElementById('scheduleDate');
        const scheduleTime = document.getElementById('scheduleTime');
        
        if (scheduleDate && scheduleTime) {
            const now = new Date();
            scheduleDate.value = now.toISOString().split('T')[0];
            scheduleTime.value = now.toTimeString().slice(0, 5);
        }
        
        // Settings save button
        const saveSettingsBtn = document.querySelector('[onclick="admin.saveSettings()"]');
        if (saveSettingsBtn) {
            saveSettingsBtn.removeAttribute('onclick');
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
    }

    async loadInitialData() {
        console.log('Loading initial data...');
        try {
            await Promise.all([
                this.loadCurrentContent(),
                this.loadDevices(),
                this.loadScheduledContent(),
                this.loadTemplates(),
                this.loadSettings(),
                this.loadStatistics()
            ]);
            console.log('Initial data loaded successfully');
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showNotification('Veri yüklenirken bir hata oluştu', 'error');
        }
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
        console.log(`Switching to tab: ${tabId}`);
        
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        const selectedTab = document.querySelector(`[data-tab="${tabId}"]`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const selectedContent = document.getElementById(tabId);
        if (selectedContent) {
            selectedContent.classList.add('active');
        }

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
        console.log('Sending text content...');
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
            console.error('Metin gönderilirken hata:', error);
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async sendImageContent() {
        console.log('Sending image content...');
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
            console.error('Resim gönderilirken hata:', error);
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        } finally {
            this.showUploadProgress(false);
        }
    }

    handleFileSelect(e) {
        console.log('File selected');
        const file = e.target.files[0];
        if (!file) return;

        const fileDisplay = document.querySelector('.file-input-display');
        if (!fileDisplay) return;
        
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
        if (!fileDisplay) return;
        
        fileDisplay.innerHTML = `
            <div>
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Resim yüklemek için tıklayın<br><small>PNG, JPG, GIF desteklenir (Max: 10MB)</small></p>
            </div>
        `;
    }

    async loadCurrentContent() {
        console.log('Loading current content...');
        try {
            const response = await fetch('/api/content');
            const content = await response.json();
            this.updateContentPreview(content);
            return content;
        } catch (error) {
            console.error('İçerik yüklenemedi:', error);
            return null;
        }
    }

    async loadDevices() {
        console.log('Loading devices...');
        try {
            const response = await fetch('/api/devices');
            const devices = await response.json();
            this.updateDevicesList(devices);
            return devices;
        } catch (error) {
            console.error('Cihazlar yüklenemedi:', error);
            return [];
        }
    }

    async loadScheduledContent() {
        console.log('Loading scheduled content...');
        try {
            const response = await fetch('/api/scheduled');
            const scheduled = await response.json();
            this.scheduledContent = scheduled;
            this.updateScheduledContentUI();
            return scheduled;
        } catch (error) {
            console.error('Zamanlanmış içerik yüklenemedi:', error);
            return [];
        }
    }

    async loadTemplates() {
        console.log('Loading templates...');
        try {
            const response = await fetch('/api/templates');
            const templates = await response.json();
            this.templates = templates;
            this.updateTemplatesUI();
            return templates;
        } catch (error) {
            console.error('Şablonlar yüklenemedi:', error);
            return [];
        }
    }

    async loadSettings() {
        console.log('Loading settings...');
        try {
            const response = await fetch('/api/settings');
            const settings = await response.json();
            this.settings = settings;
            this.updateSettingsUI();
            return settings;
        } catch (error) {
            console.error('Ayarlar yüklenemedi:', error);
            return {};
        }
    }

    async loadStatistics() {
        console.log('Loading statistics...');
        try {
            const response = await fetch('/api/statistics');
            const statistics = await response.json();
            this.statistics = statistics;
            this.updateStatisticsUI();
            return statistics;
        } catch (error) {
            console.error('İstatistikler yüklenemedi:', error);
            return {};
        }
    }

    async scheduleContent() {
        console.log('Scheduling content...');
        
        const contentEl = document.getElementById('scheduleContent');
        const dateEl = document.getElementById('scheduleDate');
        const timeEl = document.getElementById('scheduleTime');
        const durationEl = document.getElementById('scheduleDuration');
        const repeatEl = document.getElementById('scheduleRepeat');
        
        // Check if all elements exist
        if (!contentEl || !dateEl || !timeEl || !durationEl || !repeatEl) {
            console.error('Schedule form elements not found:', {
                content: !!contentEl,
                date: !!dateEl,
                time: !!timeEl,
                duration: !!durationEl,
                repeat: !!repeatEl
            });
            this.showNotification('Form elemanları bulunamadı', 'error');
            return;
        }
        
        const content = contentEl.value.trim();
        const date = dateEl.value;
        const time = timeEl.value;
        const duration = durationEl.value;
        const repeat = repeatEl.value;

        if (!content || !date || !time) {
            this.showNotification('Lütfen tüm alanları doldurun', 'error');
            return;
        }

        const scheduledTime = new Date(`${date}T${time}`);

        if (scheduledTime < new Date()) {
            this.showNotification('Geçmiş bir tarih seçemezsiniz', 'error');
            return;
        }

        try {
            const response = await fetch('/api/scheduled', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content,
                    type: 'text',
                    scheduledTime: scheduledTime.toISOString(),
                    duration: parseInt(duration),
                    repeat: repeat,
                    title: `Zamanlanmış İçerik - ${repeat !== 'once' ? 'Tekrarlı' : 'Tek Seferlik'}`
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('İçerik başarıyla zamanlandı', 'success');
                document.getElementById('quickScheduleForm').reset();
                
                // Auto-set current date/time for scheduling again
                const now = new Date();
                document.getElementById('scheduleDate').value = now.toISOString().split('T')[0];
                document.getElementById('scheduleTime').value = now.toTimeString().slice(0, 5);
                
                this.loadScheduledContent();
            } else {
                this.showNotification('İçerik zamanlanamadı: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('İçerik zamanlanırken hata:', error);
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async sendEmergencyContent() {
        console.log('Sending emergency content...');
        
        const emergencyTextEl = document.getElementById('emergencyText');
        const priorityEl = document.getElementById('emergencyPriority');
        
        // Check if elements exist
        if (!emergencyTextEl || !priorityEl) {
            console.error('Emergency form elements not found:', {
                text: !!emergencyTextEl,
                priority: !!priorityEl
            });
            this.showNotification('Form elemanları bulunamadı', 'error');
            return;
        }
        
        const emergencyText = emergencyTextEl.value.trim();
        const priority = priorityEl.value;

        if (!emergencyText) {
            this.showNotification('Lütfen acil durum mesajını yazın', 'error');
            return;
        }

        try {
            const response = await fetch('/api/emergency', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: emergencyText,
                    type: 'text',
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
            console.error('Acil durum mesajı gönderilirken hata:', error);
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    updateScheduledContentUI() {
        console.log('Updating scheduled content UI');
        const scheduledList = document.getElementById('scheduledList');
        if (!scheduledList) return;

        if (!this.scheduledContent || this.scheduledContent.length === 0) {
            scheduledList.innerHTML = '<div class="no-data">Zamanlanmış içerik yok</div>';
            return;
        }

        scheduledList.innerHTML = this.scheduledContent.map(item => {
            // Format the repeat text
            let repeatText = '';
            switch (item.repeat) {
                case 'daily':
                    repeatText = 'Her gün';
                    break;
                case 'weekly':
                    repeatText = 'Her hafta';
                    break;
                case 'monthly':
                    repeatText = 'Her ay';
                    break;
                default:
                    repeatText = 'Bir kere';
            }
            
            return `
            <div class="scheduled-item">
                <div class="scheduled-info">
                    <h4>${item.type === 'text' ? 'Metin' : 'Resim'}</h4>
                    <p>${item.content.length > 50 ? item.content.substring(0, 50) + '...' : item.content}</p>
                    <small>Zaman: ${new Date(item.scheduledTime).toLocaleString('tr-TR')}</small>
                    <small>Süre: ${item.duration || 30} dakika</small>
                    <small>Tekrar: ${repeatText}</small>
                </div>
                <div class="scheduled-actions">
                    <button onclick="admin.deleteScheduledContent('${item.id}')" class="btn btn-danger">Sil</button>
                </div>
            </div>
            `;
        }).join('');

        // Fix the delete buttons
        document.querySelectorAll('.scheduled-actions button').forEach(button => {
            const id = button.getAttribute('onclick').match(/'([^']+)'/)[1];
            button.removeAttribute('onclick');
            button.addEventListener('click', () => this.deleteScheduledContent(id));
        });
    }

    updateTemplatesUI() {
        console.log('Updating templates UI');
        const templatesList = document.getElementById('templatesList');
        if (!templatesList) return;

        if (!this.templates || this.templates.length === 0) {
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

        // Fix the buttons
        document.querySelectorAll('.template-actions button').forEach(button => {
            const onclick = button.getAttribute('onclick');
            button.removeAttribute('onclick');
            
            if (onclick.includes('useTemplate')) {
                const id = onclick.match(/'([^']+)'/)[1];
                button.addEventListener('click', () => this.useTemplate(id));
            } else if (onclick.includes('deleteTemplate')) {
                const id = onclick.match(/'([^']+)'/)[1];
                button.addEventListener('click', () => this.deleteTemplate(id));
            }
        });
    }

    updateSettingsUI() {
        console.log('Updating settings UI');
        if (!this.settings) return;
        
        if (this.settings.brightness !== undefined) {
            const brightness = document.getElementById('brightness');
            const brightnessValue = document.getElementById('brightnessValue');
            if (brightness && brightnessValue) {
                brightness.value = this.settings.brightness;
                brightnessValue.textContent = this.settings.brightness + '%';
            }
        }
        
        if (this.settings.volume !== undefined) {
            const volume = document.getElementById('volume');
            const volumeValue = document.getElementById('volumeValue');
            if (volume && volumeValue) {
                volume.value = this.settings.volume;
                volumeValue.textContent = this.settings.volume + '%';
            }
        }
        
        if (this.settings.autoRefresh !== undefined) {
            const autoRefresh = document.getElementById('autoRefresh');
            if (autoRefresh) {
                autoRefresh.checked = this.settings.autoRefresh;
            }
        }
        
        if (this.settings.displayTimeout !== undefined) {
            const displayTimeout = document.getElementById('displayTimeout');
            if (displayTimeout) {
                displayTimeout.value = this.settings.displayTimeout;
            }
        }
    }

    updateStatisticsUI() {
        console.log('Updating statistics UI');
        const stats = this.statistics;
        if (!stats) return;

        const statisticsContent = document.getElementById('statisticsContent');
        if (!statisticsContent) return;

        statisticsContent.innerHTML = `
            <div class="grid grid-3">
                <div class="stat-card">
                    <i class="fas fa-mobile-alt"></i>
                    <div class="stat-number">${stats.activeDevices || 0}</div>
                    <div class="stat-label">Aktif Cihazlar</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-sync-alt"></i>
                    <div class="stat-number">${stats.totalContentUpdates || 0}</div>
                    <div class="stat-label">İçerik Güncellemeleri</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-clock"></i>
                    <div class="stat-number">${this.formatUptime(Math.floor((Date.now() - new Date(stats.uptime).getTime()) / 1000))}</div>
                    <div class="stat-label">Çalışma Süresi</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-calendar-check"></i>
                    <div class="stat-number">${stats.totalScheduledContent || 0}</div>
                    <div class="stat-label">Zamanlanmış İçerikler</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-image"></i>
                    <div class="stat-number">${stats.totalImagesUploaded || 0}</div>
                    <div class="stat-label">Yüklenen Resimler</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-heartbeat"></i>
                    <div class="stat-number">${stats.deviceHealth ? stats.deviceHealth.length : 0}</div>
                    <div class="stat-label">Cihaz Sağlığı</div>
                </div>
            </div>
            <div class="card">
                <h3><i class="fas fa-history"></i> Son Aktiviteler</h3>
                <div id="activityLog">
                    ${stats.lastContentUpdate ? 
                        `<p><i class="fas fa-clock"></i> Son içerik güncellemesi: ${new Date(stats.lastContentUpdate).toLocaleString('tr-TR')}</p>` : 
                        '<p>Henüz aktivite yok</p>'
                    }
                </div>
            </div>
        `;
    }

    showEmergencyBanner(emergency) {
        const banner = document.getElementById('emergencyBanner');
        if (banner) {
            banner.innerHTML = `
                <div class="emergency-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${emergency.text}</span>
                    <button class="btn btn-sm">Temizle</button>
                </div>
            `;
            banner.style.display = 'block';
            
            // Add click event to clear button
            const clearBtn = banner.querySelector('button');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => this.clearEmergency());
            }
        }
    }

    hideEmergencyBanner() {
        const banner = document.getElementById('emergencyBanner');
        if (banner) {
            banner.style.display = 'none';
        }
    }

    async clearEmergency() {
        console.log('Clearing emergency...');
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
            console.error('Acil durum temizlenirken hata:', error);
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async deleteScheduledContent(id) {
        console.log(`Deleting scheduled content: ${id}`);
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
            console.error('Zamanlanmış içerik silinirken hata:', error);
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async useTemplate(id) {
        console.log(`Using template: ${id}`);
        
        // Check if id exists
        if (!id) {
            this.showNotification('Şablon ID\'si bulunamadı', 'error');
            return;
        }
        
        try {
            this.showNotification('Şablon yükleniyor...', 'info');
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
            console.error('Şablon kullanılırken hata:', error);
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async deleteTemplate(id) {
        console.log(`Deleting template: ${id}`);
        
        // Check if id exists
        if (!id) {
            this.showNotification('Şablon ID\'si bulunamadı', 'error');
            return;
        }
        
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
            console.error('Şablon silinirken hata:', error);
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async saveSettings() {
        console.log('Saving settings...');
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
            console.error('Ayarlar kaydedilirken hata:', error);
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async restartDevice(deviceId) {
        console.log(`Restarting device: ${deviceId}`);
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
            console.error('Cihaz yeniden başlatılırken hata:', error);
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    async updateDevice(deviceId) {
        console.log(`Updating device: ${deviceId}`);
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
            console.error('Cihaz güncellenirken hata:', error);
            this.showNotification('Bir hata oluştu: ' + error.message, 'error');
        }
    }

    updateLiveStats() {
        if (this.currentTab === 'statistics') {
            this.loadStatistics();
        }
    }

    updateDevicesList(devices) {
        console.log(`Updating devices list: ${devices.length} devices`);
        this.devices = new Map(devices.map(device => [device.id, device]));
        
        const devicesList = document.getElementById('devicesList');
        if (!devicesList) return;

        if (!devices || devices.length === 0) {
            devicesList.innerHTML = '<div class="no-data">Aktif cihaz yok</div>';
            return;
        }

        devicesList.innerHTML = devices.map(device => `
            <div class="device-item ${device.status === 'online' ? 'online' : 'offline'}">
                <div class="device-info">
                    <h4>${device.name || device.id}</h4>
                    <p>IP: ${device.ip || 'Bilinmiyor'}</p>
                    <small>Son görülme: ${device.lastSeen ? new Date(device.lastSeen).toLocaleString('tr-TR') : 'Bilinmiyor'}</small>
                    <span class="device-status ${device.status || 'offline'}">${device.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
                </div>
                <div class="device-actions">
                    <button class="restart-device btn btn-warning" data-id="${device.id}" ${device.status === 'offline' ? 'disabled' : ''}>
                        Yeniden Başlat
                    </button>
                    <button class="update-device btn btn-info" data-id="${device.id}" ${device.status === 'offline' ? 'disabled' : ''}>
                        Güncelle
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to device action buttons
        document.querySelectorAll('.restart-device').forEach(btn => {
            btn.addEventListener('click', () => {
                this.restartDevice(btn.dataset.id);
            });
        });

        document.querySelectorAll('.update-device').forEach(btn => {
            btn.addEventListener('click', () => {
                this.updateDevice(btn.dataset.id);
            });
        });
    }

    updateContentPreview(content) {
        console.log('Updating content preview');
        const preview = document.getElementById('contentPreview');
        const lastUpdate = document.getElementById('lastUpdate');
        
        if (!preview) return;
        
        if (!content) {
            preview.innerHTML = '<div class="no-content">İçerik bulunamadı</div>';
            return;
        }

        if (content.type === 'text') {
            preview.innerHTML = `<div class="text-content">${this.escapeHtml(content.content || content.text)}</div>`;
        } else if (content.type === 'image') {
            preview.innerHTML = `<img src="${content.content || content.url}" alt="Current Content">`;
        }

        if (lastUpdate && content.timestamp) {
            lastUpdate.textContent = new Date(content.timestamp).toLocaleString('tr-TR');
        }
    }

    updateConnectionStatus(isConnected) {
        console.log(`Connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
        const status = document.getElementById('connectionStatus');
        
        if (!status) return;
        
        if (isConnected) {
            status.className = 'connection-status connected';
            status.innerHTML = '<i class="fas fa-circle"></i> Sunucuya bağlı';
        } else {
            status.className = 'connection-status disconnected';
            status.innerHTML = '<i class="fas fa-circle"></i> Sunucu bağlantısı yok';
        }
    }

    showUploadProgress(show) {
        const progress = document.querySelector('.upload-progress');
        if (!progress) return;
        
        const progressBar = document.querySelector('.upload-progress-bar');
        if (!progressBar) return;
        
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

    showNotification(message, type = 'info') {
        console.log(`Notification (${type}): ${message}`);
        const notification = document.getElementById('notification');
        if (!notification) return;
        
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

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global admin instance
let admin = null;

// Initialize the admin panel when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    admin = new DigitalSignageAdmin();
});
