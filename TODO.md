# TaskFlow Portal – Yapılacaklar Listesi (TODO)
**Tarih:** 15 Ekim 2026 (Tamamlandı ✅)

---

## 🎯 1. Kapsamlı Güvenlik Planı (Öncelik: 1)

> Detaylı teknik rehber ve risk matrisi için: [SECURITY_PLAN.md](SECURITY_PLAN.md)

### 🔴 Aşama 1: İstemci Tarafındaki Turso Token'ının Kaldırılması (Kritik)
- [x] `js/turso.js` içindeki `TURSO_CONFIG.token` (libSQL JWT) tamamen kaldırıldı.
- [x] İstemcinin doğrudan internete açık Turso pipeline'ına bağlanması engellendi.
- [x] Tüm veritabanı okuma/yazma istekleri Node.js API (`server.js`) üzerindeki `/api/query` güvenli köprüsüyle çalıştırıldı.
- [x] Turso kimlik bilgileri sadece sunucudaki `.env` dosyasında tutuluyor.

### 🔴 Aşama 2: API Kimlik Doğrulama & Yetkilendirme (Auth Middleware)
- [x] Express sunucusuna (`server.js`) JWT tabanlı `authMiddleware` entegre edildi (`jsonwebtoken`).
- [x] `/api/customers`, `/api/tickets`, `/api/invoices`, `/api/users`, `/api/records` gibi veri uçları yetkisiz dış isteklere kapatıldı (HTTP 401 koruması).
- [x] Rol bazlı erişim kontrolü (`requireRole(['Admin'])`) API katmanında uygulandı (kullanıcı silme ve yapılandırma yetkileri kısıtlandı).
- [x] `/api/auth/login` ve `/api/auth/me` uç noktaları eklendi; giriş başarılı olduğunda JWT Bearer token üretiliyor.

### 🟡 Aşama 3: Ağ & İstek Güvenliği (Hardening)
- [x] `cors()` yapılandırması `*` yerine yalnızca izin verilen adreslere (`http://localhost:3000`, `http://127.0.0.1:3000`) sınırlandırıldı.
- [x] `express-rate-limit` paketi kurularak genel API için dakikada 180 istek, giriş (`/api/auth/login`) için dakikada 10 istek kotası getirildi.
- [x] `server.js` içindeki generic modül tablolarına (`products`, `contacts`, `contracts`, `comments`, `documents`) beyaz liste (whitelist) kontrolü eklendi.

### 🟢 Aşama 4: Şifreleme & Bildirimler
- [x] `users` tablosundaki kullanıcı şifreleri `bcryptjs` ile hash'lenerek saklandı ve sunucu başlangıcında otomatik yükseltildi.
- [x] `GET /api/users` çıktısından şifre alanları temizlenerek veri sızıntısı önlendi.
- [x] Yetkisiz erişim / şüpheli brute-force denemelerinde ve toplu kayıt silme (>10 kayıt) girişimlerinde yönetici Telegram kanalına anında güvenlik alarmı (`sendSecurityAlert`) entegre edildi.

---

## 🧪 2. Test & Kullanıcı Doğrulaması
- [x] Yeni eklenen **Hızlı Arama / Komut Paleti (`Ctrl + K`)** özelliği tarayıcı üzerinde canlı olarak test edildi ve arama doğrulaması yapıldı.
- [x] Üst bardaki **Canlı CRM Senkronizasyon Rozeti & Modalı** üzerinden günlük aktarım sayılarının (Biletler: 4.557, Müşteriler: 6.830, Teklifler: 374, Eşitleme Turu: 3) kontrolü sağlandı.
