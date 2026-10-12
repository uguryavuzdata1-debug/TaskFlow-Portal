import re

translations = {
    # Toast messages / Errors
    "Hatalı": "Invalid",
    "kullanıcı": "user",
    "Kullanıcı": "User",
    "şifre": "password",
    "Giriş": "Login",
    "bağlantısı": "connection",
    "kurulamadı": "failed",
    "Çevrimdışı": "Offline",
    "çalışılıyor": "working",
    "Veritabanı": "Database",
    "erişim": "access",
    "Hatası": "Error",
    "başarıyla": "successfully",
    "yüklendi": "loaded",
    "yükleniyor": "loading",
    "yükle": "load",
    "bulunamadı": "not found",
    "güncellendi": "updated",
    "güncellenemedi": "could not be updated",
    "Oluşturma": "Creation",
    "Müşteri": "Customer",
    "müşteri": "customer",
    "oluştu": "occurred",
    "Lütfen": "Please",
    "boş": "empty",
    "sayfasına": "page",
    "kısmından": "from the section",
    "oluşturun": "create",
    "kapatın": "close",
    "işlem": "operation",
    "İŞLEM": "OPERATION",
    "işlemler": "operations",
    "tamamlandı": "completed",
    "Tamamlandı": "Completed",
    "tarafından": "by",
    "veritabanından": "from database",
    "Tüm": "All",
    "kayıt": "record",
    "gösteriliyor": "shown",
    "Çıkış": "Logout",
    "Güncelleme": "Update",
    "Güvenlik": "Security",
    "gün": "day",
    "İndir": "Download"
}

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# I will just replace the exact matching strings that usually appear in the JS file as messages.
# First, some very specific sentences found in app.js:
sentence_translations = {
    "Supabase bağlantısı kurulamadı! Çevrimdışı modda çalışılıyor.": "Supabase connection failed! Working in offline mode.",
    "Hatalı kullanıcı veya şifre": "Invalid user or password",
    "Müşteri bulunamadı": "Customer not found",
    "Müşteri başarıyla güncellendi": "Customer updated successfully",
    "Güncelleme Hatası": "Update Error",
    "Veritabanı erişim hatası": "Database access error",
    "İşlem Tamamlandı": "Operation Completed",
    "Kayıt başarıyla oluşturuldu": "Record created successfully",
    "Tüm kayıtlar yükleniyor...": "Loading all records...",
    "Lütfen boş alanları doldurun": "Please fill empty fields",
    "Güvenlik çıkışı yapıldı": "Security logout completed",
    "Veritabanından yükle": "Load from database",
    "Müşteri oluşturun": "Create customer",
    "sayfasına dönün": "return to page",
    "kullanıcı tarafından": "by user"
}

for tr, en in sentence_translations.items():
    js = js.replace(tr, en)

# For any lingering words not caught by the sentences:
for tr, en in translations.items():
    # Only replace if surrounded by non-alphanumeric, to avoid variable name corruption
    js = re.sub(r'\b' + tr + r'\b', en, js)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
