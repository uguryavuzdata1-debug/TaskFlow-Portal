import re

translations = {
    # Menu & Titles
    "Günaydın": "Good Morning",
    "Randevularınızı yönetin": "Manage your appointments",
    "Bugünün Programı": "Today's Schedule",
    "Takvimi Aç": "Open Calendar",
    "Son Etkinlik": "Recent Activity",
    "Tümünü Gör": "View All",
    "Hesabım": "My Account",
    "Ayarlarım": "My Settings",
    "Kullanıcı": "User",
    "Tüm": "All",
    "BİLETLER": "TICKETS",
    "MÜŞTERİ": "CUSTOMER",
    "Müşteri": "Customer",
    "müşteri": "customer",
    " PANELİ": " PANEL",
    
    # Statuses
    "ONAYLI": "CONFIRMED",
    "BEKLİYOR": "PENDING",
    "ÖDENDİ": "PAID",
    "Ödendi": "Paid",
    "GECİKMİŞ": "OVERDUE",
    "AKTİF": "ACTIVE",
    "AÇIK": "OPEN",
    "Açık": "Open",
    
    # Timeline
    "Bugün": "Today",
    "Dün": "Yesterday",
    "Geçmiş": "Past",
    "GEÇTİ": "PASSED",
    "GÜN": "DAY",
    "Ağu": "Aug",
    "gün": "day",
    
    # Labels & Fields
    "İsim": "Name",
    "Başlangıç": "Start",
    "Ücreti": "Fee",
    "Masrafı": "Cost",
    "VADESİ": "DUE",
    
    # Form Actions & Hints
    "Hızlı": "Quick",
    "Randevu oluşturuldu": "Appointment created",
    "Randevu saati güncellendi": "Appointment time updated",
    "Oturum açıldı": "User logged in",
    "Randevu iptal edildi": "Appointment cancelled",
    "Değişiklikleri": "Changes",
    "Değiştir": "Change",
    "Değiştirmek": "To change",
    "istemiyorsanız": "if you don't want",
    "boş": "empty",
    "bırakın": "leave",
    "şifrenizi": "your password",
    "adınızı": "your name",
    "güncellemek": "to update",
    "güncelleyin": "update",
    "için": "for",
    "işletme": "business",
    "Kayıtlı": "Registered",
    "kullanılan": "used",
    "alanları": "fields",
    "bağlı": "connected",
    "başlat": "start",
    "giriş": "entry",
    "yapıştırın": "paste",
    
    # Views
    "GÖRÜNÜM": "VIEW",
    "Görünüm": "View",
    "Görünen": "Displayed",
    "Görüntüle": "Display",
    "Detayı": "Detail",
    
    # Other
    "YENİ": "NEW",
    "Yükle": "Upload",
    "KESİM": "ISSUE",
    "Vazgeç": "Cancel",
    "ÖRNEK": "SAMPLE",
    "İsteğe": "Optional",
    "faturaların": "invoices",
    "İndir": "Download"
}

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace longer strings first to avoid partial word replacements if any
for tr, en in sorted(translations.items(), key=lambda x: len(x[0]), reverse=True):
    html = html.replace(tr, en)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
