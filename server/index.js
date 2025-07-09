const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
          "https://cdnjs.cloudflare.com",
          "https://cdn.socket.io"
        ],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "https://cdnjs.cloudflare.com",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://cdnjs.cloudflare.com",
          "https://fonts.gstatic.com",
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
app.use('/client', express.static(path.join(__dirname, '../client')));
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

// Store connected devices
const connectedDevices = new Map();

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔗 Yeni cihaz bağlandı:', socket.id);
  
  // Register device
  socket.on('register-device', (deviceInfo) => {
    connectedDevices.set(socket.id, {
      ...deviceInfo,
      lastSeen: new Date().toISOString()
    });
    console.log('📱 Cihaz kaydedildi:', deviceInfo.name || 'Bilinmeyen Cihaz', `(${socket.id})`);
    
    // Send current content to new device
    socket.emit('content-update', currentContent);
    console.log('📤 Mevcut içerik gönderildi:', currentContent.type);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const device = connectedDevices.get(socket.id);
    connectedDevices.delete(socket.id);
    console.log('❌ Cihaz bağlantısı kesildi:', device?.name || 'Bilinmeyen Cihaz', `(${socket.id})`);
  });

  // Send current content on connection
  socket.emit('content-update', currentContent);
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

module.exports = { app, server, io };
