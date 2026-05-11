# Vtiger CRM - Supabase Senkronizasyon Sistemi

Bu sistem, yerel ağdaki Vtiger CRM verilerini otomatik olarak Supabase bulut veritabanına aktarmak, güncel tutmak ve güvenliğini sağlamak için tasarlanmıştır.

## Sistemin Çalışma Mantığı
Sistem **"Delta Sync"** (Fark Senkronizasyonu) ve **"Pagination"** (Sayfalama) yöntemleriyle çalışır.
*   **Sayfalama:** Vtiger'daki 3300+ müşteri kaydının tamamını 100'erli paketler halinde hatasız çeker.
*   **Fark Senkronizasyonu:** Her çalışmasında sadece son işlemden sonra değişen kayıtları günceller.
*   **İsim Eşleştirme:** Quotes, Tickets gibi tablolardaki müşteri ID'lerini otomatik olarak gerçek isimlere çevirir.

## Yapılandırma Bilgileri

### 1. Bağlantı Detayları
*   **Vtiger Endpoint:** `http://192.168.1.129/vtigercrm/webservice.php`
*   **Vtiger Kullanıcı:** `ugur`
*   **Vtiger Access Key:** `uzFBLl4e1FXuea2f`
*   **Supabase URL:** `https://ekjhhjrhfkoiklyxjfpu.supabase.co`

### 2. Senkronize Edilen Tablolar ve Veriler
*   `VtigerCRM_Organizations`: Müşteri listesi, adresler ve özel açıklamalar.
*   `VtigerCRM_ServiceContracts`: Hizmet sözleşmeleri ve atanan personeller.
*   `VtigerCRM_Quotes`: Teklifler, müşteri isimleri ve fiyat detayları.
*   `VtigerCRM_Tickets`: Destek talepleri ve müşteri eşleşmeleri.
*   `VtigerCRM_Documents`: Belgeler ve notlar.
*   `VtigerCRM_Users`: Personel ID-İsim eşleşme tablosu.
*   `VtigerCRM_Logs`: Tüm işlem geçmişi ve hata kayıtları.

## Güvenlik
Sistemde **Row Level Security (RLS)** aktiftir. Veriler internete açık değildir; sadece yetkili `service_role` anahtarı ile erişilebilir.

## Dosyalar
*   `sync_crm.py`: Ana Python scripti.
*   `run_sync.bat`: Başlatıcı dosya.
*   `sync_state.json`: Senkronizasyon durum dosyası.
*   `sync_log.txt`: Günlük dosyası (Her Pazartesi otomatik temizlenir).

## Otomasyon
Görev Zamanlayıcı komutu (15 dakikada bir):
```powershell
schtasks /create /sc minute /mo 15 /tn "VtigerCRM_To_Supabase_Sync" /tr "c:\Users\Ugur\Desktop\New Crm\run_sync.bat" /f
```
