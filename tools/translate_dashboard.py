import re

translations = {
    'Bugünün Programı': "Today's Schedule",
    'Takvimi Aç': 'Open Calendar',
    'Son Etkinlik': 'Recent Activity',
    'Tümünü Gör': 'View All',
    'ONAYLI': 'CONFIRMED',
    'BEKLİYOR': 'PENDING',
    'Randevu oluşturuldu': 'Appointment created',
    'Randevu saati güncellendi': 'Appointment time updated',
    'Oturum açıldı': 'User logged in',
    'Randevu iptal edildi': 'Appointment cancelled',
    'Dün': 'Yesterday'
}

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

for tr, en in translations.items():
    html = html.replace(tr, en)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# Also check for any remaining Turkish characters (ğ, ü, ş, ı, ö, ç)
remaining = set()
for c in html:
    if c in 'ğüşıöçĞÜŞİÖÇ':
        remaining.add(c)

print(f"Remaining Turkish characters: {list(remaining)}")
