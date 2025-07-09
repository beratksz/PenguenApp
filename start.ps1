# Digital Signage System Launcher
# PowerShell script to start the digital signage system

Write-Host "🚀 Digital Tabela Sistemi Başlatılıyor..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js versiyon: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js bulunamadı! Lütfen Node.js yükleyin." -ForegroundColor Red
    Write-Host "📥 İndirme adresi: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ NPM versiyon: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ NPM bulunamadı!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "📦 Bağımlılıklar kontrol ediliyor..." -ForegroundColor Yellow

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📥 NPM paketleri yükleniyor..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ NPM paketleri yüklenemedi!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "🔍 Kullanılabilir port aranıyor..." -ForegroundColor Yellow

# Find available port starting from 3001
$port = 3001
$maxPort = 3100
$foundPort = $false

while ($port -le $maxPort -and -not $foundPort) {
    $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if (-not $connection.TcpTestSucceeded) {
        $foundPort = $true
        break
    }
    $port++
}

if (-not $foundPort) {
    Write-Host "❌ Kullanılabilir port bulunamadı!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Update .env file with found port
$envContent = @"
# Digital Signage System Configuration

# Server Configuration
PORT=$port
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security
JWT_SECRET=your-secret-key-here-change-in-production
BCRYPT_ROUNDS=10

# Database (if you want to use SQLite in the future)
# DB_PATH=./data/signage.db

# CORS Configuration
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ Port $port kullanılacak" -ForegroundColor Green
Write-Host ""

# Create uploads directory if it doesn't exist
if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" | Out-Null
    Write-Host "📁 Uploads klasörü oluşturuldu" -ForegroundColor Green
}

Write-Host ""
Write-Host "🌟 Server başlatılıyor..." -ForegroundColor Green
Write-Host ""
Write-Host "📋 Erişim bilgileri:" -ForegroundColor Cyan
Write-Host "📱 Yönetim Paneli: http://localhost:$port" -ForegroundColor White
Write-Host "📺 Display App: http://localhost:$port/display" -ForegroundColor White
Write-Host "🧪 Test Sayfası: http://localhost:$port/test" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Network erişimi için IP adresinizi kullanın:" -ForegroundColor Cyan

# Get local IP addresses
$ips = Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Dhcp, Manual | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" }
foreach ($ip in $ips) {
    Write-Host "   http://$($ip.IPAddress):$port" -ForegroundColor White
}

Write-Host ""
Write-Host "⏹️  Durdurmak için Ctrl+C tuşlarına basın" -ForegroundColor Yellow
Write-Host ""

# Start the server
try {
    & npm start
} catch {
    Write-Host ""
    Write-Host "❌ Server başlatılamadı!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
