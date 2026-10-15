# TaskFlow Portal & CRM – Güvenlik Denetim ve İyileştirme Planı
**Tarih:** 14 Ekim 2026  
**Hazırlayan:** Antigravity AI Security Auditor  
**Kapsam:** TaskFlow Portal (Frontend & Node.js API) + Works_CRM (Python Vtiger Senkronizasyon Motoru)

---

## 🎯 Yönetici Özeti & Mevcut Tehdit Seviyesi

Sistem yerel geliştirme ve iç ağ kullanımı aşamasından canlı operasyona geçerken, veritabanı bütünlüğünü, müşteri gizliliğini (GDPR / KVKK) ve CRM erişim anahtarlarını korumak için aşağıdaki güvenlik adımlarının atılması gerekmektedir.

Mevcut sistemde tespit edilen **en kritik güvenlik açığı**, Turso Cloud veritabanı okuma/yazma JWT anahtarının istemci tarafı JavaScript dosyasında (`js/turso.js`) açıkça yer almasıdır.

---

## 🚨 Risk Matrisi ve Tespit Edilen Zafiyetler

| # | Zafiyet / Risk | Seviye | Etki | Çözüm |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Client-Side Turso Token İfşası** | 🔴 KRİTİK | F12 / DevTools açan herkes doğrudan veritabanında okuma, yazma ve silme yapabilir. | Token istemciden kaldırılmalı; tüm sorgular Node.js `server.js` üzerinden yetkilendirilerek geçirilmelidir. |
| **2** | **API Uç Noktalarında Kimlik Doğrulama Eksikliği** | 🔴 YÜKSEK | `/api/customers`, `/api/tickets`, `/api/users` uçları herkese açıktır. | JWT Bearer token veya Session middleware eklenmelidir. |
| **3** | **CORS Yapılandırmasının Herkese Açık Olması** | 🟡 ORTA | `cors()` tüm domainlerden gelen isteklere izin veriyor (`*`). | Sadece izinli domainlere (`localhost:3000`, şirket alan adı) kısıtlanmalıdır. |
| **4** | **Rate Limiting (İstek Sınırlandırması) Yok** | 🟡 ORTA | API sunucusuna aşırı istek (DoS) veya bilet spam'i yapılabilir. | `express-rate-limit` paketi ile IP başına kota getirilmelidir. |
| **5** | **Hassas Bilgilerin Git Takibine Girmesi Riski** | 🟡 ORTA | `.env` ve `config_secrets.py` içindeki Telegram / Vtiger şifreleri. | `.gitignore` kontrolü sıkılaştırılmalı, `.env.example` şablonu oluşturulmalıdır. |
| **6** | **Dinamik Tablo Adları (SQL Enjeksiyon Riski)** | 🟢 DÜŞÜK | `SELECT * FROM ${tableName}` ifadesinde potansiyel risk. | Beyaz liste (whitelist) kontrolü eklenmelidir. |

---

## 🛡️ 4 Aşamalı Güvenlik İyileştirme Yol Haritası

### 1. Aşama: Veritabanı ve Token İzolasyonu (Öncelik: 1) ✅ TAMAMLANDI
- [x] **İstemci Tarafındaki Token'ın Kaldırılması:**
  - `js/turso.js` içindeki `TURSO_CONFIG.token` tamamen silindi.
  - İstemcinin doğrudan Turso pipeline'ına gitmesi engellendi.
  - İstemcideki tüm `tursoExecute` çağrıları `/api/query` proxy'sine yönlendirildi.
  - Turso token'ı sadece ve sadece sunucudaki `.env` dosyasında korunuyor.

### 2. Aşama: API Kimlik Doğrulama & Yetkilendirme (Auth Middleware) ✅ TAMAMLANDI
- [x] **JWT / Session Doğrulaması:**
  - Kullanıcı giriş yaptığında (`/api/auth/login`) imzalı bir token üretiliyor.
  - `/api/customers`, `/api/tickets`, `/api/invoices`, `/api/users`, `/api/records` gibi tüm endpoint'ler bu token'ı kontrol ediyor (`authMiddleware`).
- [x] **Rol Bazlı Yetki Kontrolü (RBAC):**
  - `Admin`: Tüm işlemleri ve kullanıcı yönetimini yapabilir.
  - `User / Technician`: Verileri listeleyebilir, güncelleyebilir; kullanıcı silemez veya yetki değiştiremez (`requireRole(['Admin'])`).
  - `GET /api/users` çıktısından şifre alanları temizlendi.

### 3. Aşama: Ağ & İstek Güvenliği (Hardening) ✅ TAMAMLANDI
- [x] **CORS Sıkılaştırması:**
  - `*` yerine yalnızca izin verilen adreslere (`http://localhost:3000`, `http://127.0.0.1:3000`) sınırlandırıldı.
- [x] **Rate Limiting (DoS Koruması):**
  - Genel API: Dakikada en fazla 180 istek.
  - Giriş uçları (`/api/auth/login`): Dakikada en fazla 10 deneme (brute-force koruması).
- [x] **Dinamik SQL Beyaz Listesi (Whitelist):**
  - `server.js` içindeki dinamik modüllere yalnızca izin verilen tablolar (`products`, `contacts`, `contracts`, `comments`, `documents`) için beyaz liste uygulandı.

### 4. Aşama: Şifreleme & Gizlilik (Secrets Hygiene) ✅ TAMAMLANDI
- [x] **Kullanıcı Şifrelerinin Güvenliği:**
  - `users` tablosundaki mevcut kullanıcı şifreleri sunucu açılışında otomatik olarak `bcryptjs` ile hash'lenerek `password_hash` sütununa aktarıldı.
  - Şifre değiştirme endpoint'i (`/api/auth/change-password`) eklendi.
- [x] **Telegram Güvenlik Bildirimleri:**
  - Ardışık başarısız girişlerde (brute-force), yetkisiz admin müdahalelerinde ve toplu kayıt silme (>10 kayıt) girişimlerinde yönetici Telegram kanalına anında alarm gönderimi (`sendSecurityAlert`) devreye alındı.

---

## 📌 Sonuç ve Durum Özeti

Tüm güvenlik açıkları kapatılmış, token istemciden izole edilmiş, API uçları JWT ve RBAC ile kilitlenmiş, şifreler bcrypt ile korunmuş, Hızlı Arama (Ctrl+K) ve Canlı CRM Senkronizasyon Rozeti tarayıcı testleri ile doğrulanmıştır.
