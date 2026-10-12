# Vtiger CRM - Turso Cloud Veritabanı Senkronizasyon Sistemi

Bu sistem, **Vtiger CRM** verilerini (Müşteriler, Biletler, Teklifler, Randevular ve Faturalar) otomatik olarak **Turso Cloud (libSQL)** veritabanına aktarmak, iki yönlü güncel tutmak ve TaskFlow Portal arayüzüne bağlamak için tasarlanmıştır.

> **Önemli Not:** Sistem tamamen **Turso Cloud** veritabanına taşınmış olup, eski Supabase bağımlılıkları bütünüyle kaldırılmıştır.

---

## 1. Veritabanı ve Bağlantı Detayları

* **Turso Veritabanı:** `https://taskflow-uguryavuz.aws-eu-west-1.turso.io`
* **Turso Konsolu:** `https://app.turso.tech/uguryavuz/databases/taskflow/data`
* **Vtiger CRM URL:** `http://ikacrm.ikaepos.com/vtigercrm`
* **Vtiger API Kullanıcı:** `ugur`
* **Lokal Node Köprüsü:** `http://localhost:3000/api`

---

## 2. Doğrulanmış VTiger CRM Kullanıcı Haritası (`USER_MAP`)

CRM kayıtları (biletler, sözleşmeler ve teklifler) incelenerek doğrulanmış gerçek kullanıcı kimlikleri:

| VTiger ID | CRM Ekranındaki Gerçek Ad | Görev / Modül | Teyit Eden Kayıtlar |
| :---: | :--- | :--- | :--- |
| **`19x1`** | **ismail Administrator** | Ana CRM Yöneticisi | `QUO135` (Space Pole), `TT24` |
| **`19x5`** | **Ugur Yavuz** | CRM Teknisyen / Yönetici | `TT1342` (Till), 575 Bilet |
| **`19x6`** | **Ahmet Baltaci** | CRM Teknisyen | `TT988` (Menu Items Change), 269 Bilet |
| **`19x7`** | **Ibrahim Ahmet** | CRM Satış & Teklif | `QUO12` (IKA Printer), 103 Teklif |
| **`19x8`** | **Alpay Burc** | CRM Sözleşme & Satış | `SERCON121` (S/O Contract), 28 Teklif |
| **`19x9`** | **ugur isikcevahir** | CRM Teknisyen | `TT1340` (SET Menu), 495 Bilet |
| **`19x10`** | **Osman Akgul** | CRM Satış | `QUO150` (new scale), `QUO159` |
| **`19x11`** | **Support User** | Sistem / Destek | `QUO64` (CORNER SUPERMARKET) |

---

## 3. Senkronize Edilen Tablolar ve Otomatik Eşleşmeler

### 1. `tickets` Tablosu
* **`customer_name` Eşleşmesi:** Biletin `parent_id` değeri ile `customers.id` ilişkilendirilerek müşteri unvanı (`organization_name`) otomatik doldurulur.
* **`assigned_user_id` Eşleşmesi:** Ham ID'ler (örn: `19x5`, `19x9`, `19x6`) yukarıdaki tabloya göre doğrudan kullanıcı isimlerine çevrilir.

### 2. `quotes` Tablosu
* **`customer_name` Eşleşmesi:** Teklifin `account_id` değeri ile `customers.id` ilişkilendirilerek müşteri unvanı doldurulur.
* **`assigned_user_id` Eşleşmesi:** Teklifi hazırlayan kullanıcı isimleri otomatik çözümlenir (örn: `19x7` -> `Ibrahim Ahmet`, `19x8` -> `Alpay Burc`).

### 3. `customers` Tablosu
* CRM'deki tüm müşteri hesapları (Hesap No, Adres, Posta Kodu, İletişim, Notlar vb.) Turso'ya aktarılır.

### 4. `appointments` Tablosu
* Vtiger `Events` kayıtları tarih, saat, konu ve atanan teknisyen adıyla senkronize edilir.

### 5. `users` Tablosu
* Portal ve CRM'de aktif olan ekip üyeleri listesi (şifre, rol, kullanıcı adı).

---

## 4. Senkronizasyon Betikleri ve Çalıştırma

Senkronizasyon betikleri `D:\AI\AI WORKS\Works_CRM\Source` altında yer almaktadır:

| Betik Adı | Görevi |
| :--- | :--- |
| `sync_all_turso.py` | 5 modülün tamamını (Müşteriler, Biletler, Teklifler, Randevular, Faturalar) sırayla Turso'ya senkronize eder. |
| `sync_turso_tickets.py` | Biletleri çeker, müşteri ve kullanıcı isimlerini eşleştirerek Turso'ya yazar. |
| `sync_turso_quotes.py` | Teklifleri çeker, müşteri ve kullanıcı isimlerini eşleştirerek Turso'ya yazar. |
| `sync_turso_customers.py` | Müşteri veritabanını günceller. |
| `sync_turso_events.py` | Randevu/Etkinlikleri isim çözümlemesi ile Turso'ya yazar. |
| `sync_turso_invoices.py` | Faturaları Turso'ya yazar. |

### Manuel Çalıştırma:
```cmd
D:\AI\AI WORKS\Works_CRM\run_turso_sync.bat
```

### Arka Planda Sessiz Çalıştırma:
```cmd
wscript "D:\AI\AI WORKS\Works_CRM\run_turso_sync_silent.vbs"
```
