<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Digital Signage System - Copilot Instructions

Bu proje, local network üzerinde çalışan bir dijital tabela yönetim sistemidir.

## Proje Yapısı
- **Backend**: Node.js + Express + Socket.io (server/index.js)
- **Frontend**: Vanilla JavaScript + HTML/CSS (client/)
- **Display App**: HTML5 tabanlı Android display uygulaması (android/)
- **Real-time Communication**: WebSocket ile anlık içerik güncellemesi

## Teknoloji Stack
- Node.js, Express.js, Socket.io
- Vanilla JavaScript, HTML5, CSS3
- Multer (file upload), SQLite (future database)
- Responsive design, mobile-first approach

## Kod Yazım Kuralları
- Modern ES6+ JavaScript kullan
- Async/await pattern tercih et
- Console.log ile Türkçe debug mesajları
- Mobile-first responsive tasarım
- WebSocket events için camelCase naming
- API endpoints için RESTful convention

## Güvenlik Considerations
- Local network only (no internet dependency)
- File size limits (10MB max)
- CORS configuration
- Input validation and sanitization
- Error handling with user-friendly Turkish messages

## UI/UX Guidelines
- Modern, clean interface
- Turkish language for all user-facing text
- Gradient backgrounds and smooth animations
- Mobile-friendly touch targets
- Accessibility considerations
- Loading states and error handling

## Performance Optimizations
- Efficient WebSocket communication
- Image optimization for display
- Minimal DOM manipulation
- CSS animations over JavaScript
- Background process handling for Android

## Development Best Practices
- Environment variables for configuration
- Modular code structure
- Error boundaries and graceful degradation
- Cross-browser compatibility
- Mobile device optimization

When helping with this project, focus on:
1. Turkish language support in UI
2. Mobile/Android compatibility
3. Real-time communication efficiency
4. Local network stability
5. User experience optimization
