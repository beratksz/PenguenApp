const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  // Development modunda CSP'yi devre dışı bırak
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  console.log('🔓 Development mode: CSP devre dışı');
} else {
  // Production modunda güvenli CSP kullan
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "https://cdn.socket.io"
        ],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'"
        ],
        fontSrc: [
          "'self'",
          "data:"
        ],
        imgSrc: [
          "'self'", 
          "data:", 
          "blob:",
          "http://localhost:*",
          "http://*:*"
        ],
        connectSrc: [
          "'self'", 
          "ws://localhost:*",
          "wss://localhost:*",
          "http://localhost:*"
        ],
        mediaSrc: ["'self'", "data:", "blob:"],
        objectSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  }));
  console.log('🔒 Production mode: Güvenli CSP aktif');
}
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve client files with correct MIME types
app.use('/client', express.static(path.join(__dirname, '../client'), {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    }
  }
}));

// Serve the script.js file directly to ensure correct MIME type
app.get('/client/script.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../client/script.js'));
});

// Serve the script_new.js file directly to ensure correct MIME type
app.get('/client/script_new.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, '../client/script_new.js'));
});

app.use('/android', express.static(path.join(__dirname, '../android')));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// In-memory storage for content (you can replace with database)
let currentContent = {
  type: 'text', // 'text' or 'image'
  content: 'Hoş geldiniz! Digital Tabela Sistemi',
  timestamp: new Date().toISOString(),
  id: uuidv4()
};

// Store scheduled content
let scheduledContents = [];

// Store device settings
let deviceSettings = {
  brightness: 100,
  volume: 50,
  refreshInterval: 30, // seconds
  powerSaveMode: false,
  orientation: 'landscape', // 'landscape' or 'portrait'
  autoUpdate: true,
  displayName: 'Ana Tabela',
  location: 'Giriş Katı',
  timezone: 'Europe/Istanbul'
};

// Statistics
let statistics = {
  totalContentUpdates: 0,
  totalConnections: 0,
  uptime: Date.now(),
  totalScheduledContent: 0,
  totalImagesUploaded: 0,
  lastContentUpdate: null,
  deviceHealth: []
};

// Content templates
let contentTemplates = [
  {
    id: 'welcome',
    name: 'Hoş Geldiniz',
    type: 'text',
    content: 'Hoş geldiniz! Dijital Tabela Sistemimize',
    variables: []
  },
  {
    id: 'announcement',
    name: 'Duyuru',
    type: 'text',
    content: 'Önemli Duyuru: {{message}}',
    variables: ['message']
  },
  {
    id: 'weather',
    name: 'Hava Durumu',
    type: 'text',
    content: 'Bugün {{location}} için {{weather}} bekleniyor. Sıcaklık: {{temp}}°C',
    variables: ['location', 'weather', 'temp']
  }
];

// Emergency content queue
let emergencyContent = null;

// Store connected devices
const connectedDevices = new Map();

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔗 Yeni cihaz bağlandı:', socket.id);
  statistics.totalConnections++;
  
  // Register device
  socket.on('register-device', (deviceInfo) => {
    connectedDevices.set(socket.id, {
      ...deviceInfo,
      lastSeen: new Date().toISOString(),
      socketId: socket.id
    });
    console.log('📱 Cihaz kaydedildi:', deviceInfo.name || 'Bilinmeyen Cihaz', `(${socket.id})`);
    
    // Send current content to new device
    socket.emit('content-update', currentContent);
    
    // Send current settings to new device
    socket.emit('settings-update', deviceSettings);
    
    // Send emergency content if exists
    if (emergencyContent) {
      socket.emit('emergency-content', emergencyContent);
    }
    
    console.log('📤 Mevcut içerik ve ayarlar gönderildi');
  });

  // Handle device status updates
  socket.on('device-status', (status) => {
    const device = connectedDevices.get(socket.id);
    if (device) {
      connectedDevices.set(socket.id, {
        ...device,
        status: status,
        lastSeen: new Date().toISOString()
      });
    }
  });

  // Handle device heartbeat
  socket.on('heartbeat', (data) => {
    const device = connectedDevices.get(socket.id);
    if (device) {
      connectedDevices.set(socket.id, {
        ...device,
        lastHeartbeat: new Date().toISOString(),
        systemInfo: data
      });
    }
  });

  // Handle content acknowledgment
  socket.on('content-ack', (data) => {
    console.log(`✅ İçerik onaylandı: ${socket.id} - ${data.contentId}`);
    
    // Update device info
    const device = connectedDevices.get(socket.id);
    if (device) {
      connectedDevices.set(socket.id, {
        ...device,
        lastContentReceived: new Date().toISOString(),
        lastContentId: data.contentId
      });
    }
  });

  // Handle error reports
  socket.on('error-report', (error) => {
    console.error(`❌ Cihaz hatası (${socket.id}):`, error);
    
    // Store error in device info
    const device = connectedDevices.get(socket.id);
    if (device) {
      const errors = device.errors || [];
      errors.push({
        ...error,
        timestamp: new Date().toISOString()
      });
      
      connectedDevices.set(socket.id, {
        ...device,
        errors: errors.slice(-10) // Keep last 10 errors
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const device = connectedDevices.get(socket.id);
    connectedDevices.delete(socket.id);
    
    if (device) {
      console.log('🔌 Cihaz bağlantısı kesildi:', device.name || 'Bilinmeyen Cihaz');
    }
  });
});

// API Routes

// Get current content
app.get('/api/content', (req, res) => {
  res.json(currentContent);
});

// Update text content
app.post('/api/content/text', (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text content is required' });
  }

  currentContent = {
    type: 'text',
    content: text,
    timestamp: new Date().toISOString(),
    id: uuidv4()
  };

  // Broadcast to all connected devices
  io.emit('content-update', currentContent);
  
  const deviceCount = connectedDevices.size;
  console.log(`📝 Text içerik güncellendi: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" → ${deviceCount} cihaza gönderildi`);
  res.json({ success: true, content: currentContent });
});

// Upload image content
app.post('/api/content/image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Image file is required' });
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  
  currentContent = {
    type: 'image',
    content: imageUrl,
    timestamp: new Date().toISOString(),
    id: uuidv4(),
    filename: req.file.filename,
    originalname: req.file.originalname
  };

  // Broadcast to all connected devices
  io.emit('content-update', currentContent);
  
  const deviceCount = connectedDevices.size;
  console.log(`🖼️ Resim içerik güncellendi: "${req.file.originalname}" (${(req.file.size / 1024).toFixed(1)} KB) → ${deviceCount} cihaza gönderildi`);
  res.json({ success: true, content: currentContent });
});

// Get connected devices
app.get('/api/devices', (req, res) => {
  const devices = Array.from(connectedDevices.entries()).map(([id, info]) => ({
    id,
    ...info
  }));
  res.json(devices);
});

// Delete uploaded file
app.delete('/api/content/image/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'File deleted' });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Scheduled Content API
app.get('/api/scheduled', (req, res) => {
  res.json(scheduledContents);
});

app.post('/api/scheduled', (req, res) => {
  try {
    // Extract all possible parameters including duration for compatibility
    const { content, type, scheduledTime, repeat, title, duration } = req.body;
    
    console.log('Received schedule request:', req.body);
    
    if (!content || !scheduledTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Default type to 'text' if not provided
    const contentType = type || 'text';

    const scheduled = {
      id: uuidv4(),
      title: title || 'Zamanlanmış İçerik',
      content,
      type: contentType,
      scheduledTime,
      duration: duration || 30, // Store duration in minutes, default to 30
      repeat: repeat || 'once', // 'once', 'daily', 'weekly', 'monthly'
      status: 'pending', // 'pending', 'sent', 'cancelled'
      createdAt: new Date().toISOString()
    };

    scheduledContents.push(scheduled);
    console.log(`📅 Yeni zamanlanmış içerik eklendi: ${scheduled.title} - ${scheduledTime}`);
    
    res.json({ success: true, scheduled });
  } catch (error) {
    console.error('❌ Zamanlanmış içerik hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/scheduled/:id', (req, res) => {
  const { id } = req.params;
  const index = scheduledContents.findIndex(s => s.id === id);
  
  if (index !== -1) {
    scheduledContents.splice(index, 1);
    res.json({ success: true, message: 'Scheduled content deleted' });
  } else {
    res.status(404).json({ error: 'Scheduled content not found' });
  }
});

// Device Settings API
app.get('/api/settings', (req, res) => {
  res.json(deviceSettings);
});

app.post('/api/settings', (req, res) => {
  try {
    deviceSettings = { ...deviceSettings, ...req.body };
    
    // Broadcast settings to all devices
    io.emit('settings-update', deviceSettings);
    console.log('⚙️ Cihaz ayarları güncellendi:', deviceSettings);
    
    res.json({ success: true, settings: deviceSettings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistics API
app.get('/api/statistics', (req, res) => {
  const uptime = Date.now() - statistics.uptime;
  const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
  const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
  
  res.json({
    ...statistics,
    uptimeFormatted: `${uptimeHours}h ${uptimeMinutes}m`,
    connectedDevices: connectedDevices.size,
    scheduledContentCount: scheduledContents.length,
    pendingScheduledContent: scheduledContents.filter(s => s.status === 'pending').length,
    currentContent: currentContent
  });
});

// Content Templates API
app.get('/api/templates', (req, res) => {
  res.json(contentTemplates);
});

app.post('/api/templates', (req, res) => {
  try {
    const { name, type, content, variables } = req.body;
    
    if (!name || !type || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const template = {
      id: uuidv4(),
      name,
      type,
      content,
      variables: variables || [],
      createdAt: new Date().toISOString()
    };

    contentTemplates.push(template);
    console.log(`📋 Yeni template eklendi: ${template.name}`);
    
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get template by ID
app.get('/api/templates/:id', (req, res) => {
  try {
    const template = contentTemplates.find(t => t.id === req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Use template
app.post('/api/templates/:id/use', (req, res) => {
  try {
    const template = contentTemplates.find(t => t.id === req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    console.log(`📋 Template kullanıldı: ${template.name}`);
    
    // Return the content from the template
    res.json({
      success: true,
      content: template.content,
      type: template.type
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete template
app.delete('/api/templates/:id', (req, res) => {
  try {
    const index = contentTemplates.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const deleted = contentTemplates.splice(index, 1)[0];
    console.log(`📋 Template silindi: ${deleted.name}`);
    
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Emergency Content API
app.post('/api/emergency', (req, res) => {
  try {
    // Accept either text or content field, and set type if not provided
    const { content, text, type = 'text', priority } = req.body;
    
    // Allow either content or text field
    const messageContent = content || text;
    
    if (!messageContent) {
      return res.status(400).json({ error: 'Missing required content/text field' });
    }

    emergencyContent = {
      id: uuidv4(),
      content: messageContent,
      type,
      priority: priority || 'high',
      timestamp: new Date().toISOString()
    };

    // Immediately broadcast to all devices
    io.emit('emergency-content', emergencyContent);
    console.log('🚨 Acil durum içeriği gönderildi:', content);
    
    res.json({ success: true, emergency: emergencyContent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/emergency', (req, res) => {
  emergencyContent = null;
  io.emit('emergency-clear');
  console.log('🚨 Acil durum içeriği temizlendi');
  res.json({ success: true });
});

// Bulk Content API
app.post('/api/content/bulk', (req, res) => {
  try {
    const { contents } = req.body;
    
    if (!contents || !Array.isArray(contents)) {
      return res.status(400).json({ error: 'Contents array is required' });
    }

    const bulkContent = {
      id: uuidv4(),
      type: 'bulk',
      contents: contents.map(content => ({
        ...content,
        id: uuidv4(),
        timestamp: new Date().toISOString()
      })),
      timestamp: new Date().toISOString()
    };

    // Broadcast to all devices
    io.emit('bulk-content', bulkContent);
    console.log(`📦 Toplu içerik gönderildi: ${contents.length} öğe`);
    
    statistics.totalContentUpdates += contents.length;
    res.json({ success: true, bulkContent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Advanced Scheduling API
app.post('/api/scheduled/advanced', (req, res) => {
  try {
    const { 
      content, 
      type, 
      startDate, 
      endDate, 
      timeSlots, 
      weekdays, 
      title,
      priority,
      deviceIds
    } = req.body;
    
    if (!content || !type || !startDate || !timeSlots) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const scheduled = {
      id: uuidv4(),
      title: title || 'Gelişmiş Zamanlanmış İçerik',
      content,
      type,
      startDate,
      endDate,
      timeSlots: timeSlots || [], // [{ start: '09:00', end: '17:00' }]
      weekdays: weekdays || [1, 2, 3, 4, 5], // Monday to Friday
      priority: priority || 'normal',
      deviceIds: deviceIds || [], // Empty means all devices
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    scheduledContents.push(scheduled);
    console.log(`📅 Gelişmiş zamanlanmış içerik eklendi: ${scheduled.title}`);
    
    statistics.totalScheduledContent++;
    res.json({ success: true, scheduled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Device Control API
app.post('/api/device/:deviceId/control', (req, res) => {
  try {
    const { deviceId } = req.params;
    const { action, data } = req.body;
    
    if (!connectedDevices.has(deviceId)) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Send control command to specific device
    io.to(deviceId).emit('device-control', { action, data });
    console.log(`🎛️ Cihaz kontrolü gönderildi: ${deviceId} - ${action}`);
    
    res.json({ success: true, message: 'Control command sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Device Restart API
app.post('/api/devices/:deviceId/restart', (req, res) => {
  try {
    const { deviceId } = req.params;
    
    if (!connectedDevices.has(deviceId)) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Send restart command to specific device
    io.to(deviceId).emit('device-control', { action: 'restart' });
    console.log(`🔄 Cihaz yeniden başlatma komutu gönderildi: ${deviceId}`);
    
    res.json({ success: true, message: 'Restart command sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Device Update API
app.post('/api/devices/:deviceId/update', (req, res) => {
  try {
    const { deviceId } = req.params;
    
    if (!connectedDevices.has(deviceId)) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Send update command to specific device
    io.to(deviceId).emit('device-control', { action: 'update' });
    console.log(`📦 Cihaz güncellenme komutu gönderildi: ${deviceId}`);
    
    res.json({ success: true, message: 'Update command sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Content History API
app.get('/api/content/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  // This would normally come from a database
  // For now, return mock history
  const history = Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
    id: uuidv4(),
    type: i % 2 === 0 ? 'text' : 'image',
    content: `Test Content ${i + 1}`,
    timestamp: new Date(Date.now() - (i * 60000)).toISOString(),
    deviceCount: Math.floor(Math.random() * 5) + 1
  }));
  
  res.json(history);
});
app.get('/api/statistics', (req, res) => {
  const uptime = moment.duration(Date.now() - statistics.uptime);
  
  res.json({
    ...statistics,
    connectedDevices: connectedDevices.size,
    scheduledContents: scheduledContents.length,
    uptime: {
      days: Math.floor(uptime.asDays()),
      hours: uptime.hours(),
      minutes: uptime.minutes(),
      seconds: uptime.seconds()
    }
  });
});

// Bulk content management
app.post('/api/content/bulk', upload.array('files', 10), (req, res) => {
  try {
    const { contents } = req.body;
    const uploadedFiles = req.files || [];
    
    let processedContents = [];
    
    if (contents) {
      processedContents = JSON.parse(contents);
    }
    
    // Process uploaded files
    uploadedFiles.forEach((file, index) => {
      processedContents.push({
        id: uuidv4(),
        type: 'image',
        content: `/uploads/${file.filename}`,
        title: `Toplu Yükleme ${index + 1}`,
        timestamp: new Date().toISOString()
      });
    });
    
    statistics.totalContentUpdates += processedContents.length;
    
    res.json({ 
      success: true, 
      processed: processedContents.length,
      contents: processedContents 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve admin panel
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Serve test page
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, '../test.html'));
});

// Serve display app
app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, '../android/display.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error.message);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Dosya boyutu çok büyük. Maksimum boyut 10MB.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Beklenmeyen dosya alanı.' });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({ error: 'Geçersiz dosya tipi. Sadece JPEG, PNG, GIF ve WebP desteklenir.' });
  }
  
  res.status(500).json({ 
    error: 'Sunucu hatası oluştu.',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 Not Found:', req.url);
  res.status(404).json({ 
    error: 'Sayfa bulunamadı',
    path: req.url,
    suggestion: 'Ana sayfaya dönmek için / adresini ziyaret edin'
  });
});

// Start server
const PORT = process.env.PORT || 3001;

// Function to find available port
const findAvailablePort = async (startPort) => {
  const net = require('net');
  
  const isPortTaken = (port) => {
    return new Promise((resolve) => {
      const tester = net.createServer()
        .once('error', () => resolve(true))
        .once('listening', () => {
          tester.once('close', () => resolve(false)).close();
        })
        .listen(port);
    });
  };

  for (let port = startPort; port <= startPort + 100; port++) {
    if (!(await isPortTaken(port))) {
      return port;
    }
  }
  throw new Error('No available port found');
};

// Start server with available port
(async () => {
  try {
    const availablePort = await findAvailablePort(PORT);
    
    server.listen(availablePort, '0.0.0.0', () => {
      console.log(`🚀 Digital Tabela Server başlatıldı`);
      console.log(`📱 Yönetim Paneli: http://localhost:${availablePort}`);
      console.log(`🌐 Network IP'niz üzerinden erişilebilir: http://[YOUR_IP]:${availablePort}`);
      console.log(`📺 Display App: http://localhost:${availablePort}/display`);
      console.log(`🧪 Test Sayfası: http://localhost:${availablePort}/test`);
      console.log(`📡 WebSocket Server çalışıyor`);
      console.log(`💾 Upload klasörü: ${path.join(__dirname, '../uploads')}`);
    });
  } catch (error) {
    console.error('❌ Server başlatılamadı:', error.message);
    process.exit(1);
  }
})();

// Cron Job System - Check scheduled content every minute
cron.schedule('* * * * *', () => {
  const now = moment();
  
  scheduledContents.forEach((scheduled, index) => {
    if (scheduled.status === 'pending') {
      let shouldSend = false;
      
      if (scheduled.scheduledTime) {
        // Simple scheduled time
        const scheduledTime = moment(scheduled.scheduledTime);
        shouldSend = now.isSameOrAfter(scheduledTime);
      } else if (scheduled.startDate && scheduled.timeSlots) {
        // Advanced scheduling
        const currentDate = now.format('YYYY-MM-DD');
        const currentTime = now.format('HH:mm');
        const currentWeekday = now.isoWeekday(); // 1=Monday, 7=Sunday
        
        // Check if current date is within range
        const inDateRange = now.isSameOrAfter(moment(scheduled.startDate)) &&
                           (!scheduled.endDate || now.isSameOrBefore(moment(scheduled.endDate)));
        
        // Check if current weekday is allowed
        const weekdayAllowed = !scheduled.weekdays || scheduled.weekdays.includes(currentWeekday);
        
        // Check if current time is within any time slot
        const inTimeSlot = scheduled.timeSlots.some(slot => {
          return currentTime >= slot.start && currentTime <= slot.end;
        });
        
        shouldSend = inDateRange && weekdayAllowed && inTimeSlot;
      }
      
      if (shouldSend) {
        // Send scheduled content
        const contentToSend = {
          type: scheduled.type,
          content: scheduled.content,
          timestamp: new Date().toISOString(),
          id: uuidv4(),
          title: scheduled.title,
          priority: scheduled.priority || 'normal'
        };
        
        if (scheduled.deviceIds && scheduled.deviceIds.length > 0) {
          // Send to specific devices
          scheduled.deviceIds.forEach(deviceId => {
            if (connectedDevices.has(deviceId)) {
              io.to(deviceId).emit('content-update', contentToSend);
            }
          });
          console.log(`📅 Zamanlanmış içerik belirli cihazlara gönderildi: ${scheduled.title} → ${scheduled.deviceIds.length} cihaz`);
        } else {
          // Send to all devices
          currentContent = contentToSend;
          io.emit('content-update', currentContent);
          console.log(`📅 Zamanlanmış içerik gönderildi: ${scheduled.title}`);
        }
        
        // Update statistics
        statistics.totalContentUpdates++;
        statistics.lastContentUpdate = new Date().toISOString();
        
        // Handle repeat logic
        if (scheduled.repeat === 'once' || scheduled.startDate) {
          scheduled.status = 'sent';
        } else {
          // Calculate next occurrence for simple scheduling
          let nextTime = moment(scheduled.scheduledTime);
          
          switch (scheduled.repeat) {
            case 'daily':
              nextTime.add(1, 'day');
              break;
            case 'weekly':
              nextTime.add(1, 'week');
              break;
            case 'monthly':
              nextTime.add(1, 'month');
              break;
          }
          
          scheduled.scheduledTime = nextTime.toISOString();
          console.log(`🔄 Sonraki tekrar: ${scheduled.title} - ${nextTime.format('DD/MM/YYYY HH:mm')}`);
        }
      }
    }
  });
});

// Auto-cleanup completed scheduled content (older than 7 days)
cron.schedule('0 0 * * *', () => {
  const weekAgo = moment().subtract(7, 'days');
  const initialCount = scheduledContents.length;
  
  scheduledContents = scheduledContents.filter(scheduled => {
    if (scheduled.status === 'sent') {
      return moment(scheduled.createdAt).isAfter(weekAgo);
    }
    return true;
  });
  
  const cleaned = initialCount - scheduledContents.length;
  if (cleaned > 0) {
    console.log(`🧹 ${cleaned} adet eski zamanlanmış içerik temizlendi`);
  }
});

// Health check cron - ping devices every 5 minutes
cron.schedule('*/5 * * * *', () => {
  if (connectedDevices.size > 0) {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      serverUptime: Date.now() - statistics.uptime,
      totalDevices: connectedDevices.size
    };
    
    io.emit('health-check', healthCheck);
    console.log(`💓 Sağlık kontrolü gönderildi - ${connectedDevices.size} cihaz`);
    
    // Update device health statistics
    statistics.deviceHealth = Array.from(connectedDevices.entries()).map(([id, info]) => ({
      deviceId: id,
      ...info,
      lastSeen: new Date().toISOString()
    }));
  }
});

// Statistics update cron - every hour
cron.schedule('0 * * * *', () => {
  console.log(`📊 Saatlik İstatistikler:
    - Toplam Bağlantı: ${statistics.totalConnections}
    - Toplam İçerik Güncellemesi: ${statistics.totalContentUpdates}
    - Aktif Cihazlar: ${connectedDevices.size}
    - Bekleyen Zamanlanmış İçerik: ${scheduledContents.filter(s => s.status === 'pending').length}
    - Uptime: ${Math.floor((Date.now() - statistics.uptime) / (1000 * 60 * 60))} saat`
  );
});

// Content template processing cron - every 30 minutes
cron.schedule('*/30 * * * *', () => {
  // Process dynamic content templates (weather, news, etc.)
  const dynamicTemplates = contentTemplates.filter(t => t.variables && t.variables.length > 0);
  
  if (dynamicTemplates.length > 0) {
    console.log(`🔄 ${dynamicTemplates.length} dinamik template kontrol ediliyor...`);
    
    // Here you could integrate with external APIs for weather, news, etc.
    // For now, just log the action
  }
});

module.exports = { app, server, io };
