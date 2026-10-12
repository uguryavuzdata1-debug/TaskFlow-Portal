import re

# 1. Update app.js
with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace old showAdminPane with robust version
old_func = r"function showAdminPane\(paneId\) \{.*?\}"
new_func = """function showAdminPane(paneId, btn) {
    document.querySelectorAll('.admin-pane').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.admin-tab-btn').forEach(b => {
        b.classList.remove('active');
        b.style.borderBottom = '3px solid transparent';
        b.style.color = 'var(--steel)';
    });
    
    let pane = document.getElementById('admin-pane-' + paneId);
    if (pane) pane.style.display = 'block';
    
    if (btn) {
        btn.classList.add('active');
        btn.style.borderBottom = '3px solid var(--ink)';
        btn.style.color = 'var(--ink)';
    }
}"""
js = re.sub(old_func, new_func, js, flags=re.DOTALL)
if 'function showAdminPane' not in js:
    js += '\n\n' + new_func

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)

# 2. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Update onclick handlers
html = html.replace("showAdminPane('users')", "showAdminPane('users', this)")
html = html.replace("showAdminPane('roles')", "showAdminPane('roles', this)")
html = html.replace("showAdminPane('logs')", "showAdminPane('logs', this)")
html = html.replace("showAdminPane('performance')", "showAdminPane('performance', this)")

# Translation Dictionary
translations = {
    'Personel Açma': 'Add Personnel',
    'Fatura Takibi': 'Invoice Tracking',
    'PDF İndir': 'Download PDF',
    'Hatırlatma Gönder': 'Send Reminder',
    'Ödendi Olarak İşaretle': 'Mark as Paid',
    'Sistem Logları': 'System Logs',
    'Giriş': 'Login',
    'Çıkış': 'Logout',
    'Şifre': 'Password',
    'Yeni Kullanıcı': 'New User',
    'Müşteri Atama': 'Assign Customer',
    'Hesap defteri': 'Ledger',
    'Ara': 'Search',
    'İptal': 'Cancel',
    'Kaydet': 'Save',
    'Oluştur': 'Create',
    'Düzenle': 'Edit',
    'Sil': 'Delete'
}

for tr, en in translations.items():
    html = html.replace(tr, en)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
