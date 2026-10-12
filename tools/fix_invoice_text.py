import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

translations = {
    # Invoices Section
    "Createulan all invoices durumu, vade tarihleri ve tahsilat takibi.": "Manage all invoice statuses, due dates and collections.",
    "Vadesi Past": "Overdue",
    "Bekleyen Toplam": "Pending Total",
    "Bu Ay Tahsil Edilen": "Collected This Month",
    "Open Fatura": "Open Invoices",
    "Fatura no veya customer ara...": "Search invoice no or customer...",
    "All durumlar": "All statuses",
    "Bekliyor": "Pending",
    "Bu ay": "This month",
    "Son 3 ay": "Last 3 months",
    "All zamanlar": "All time",
    "Yeni Fatura": "+ New Invoice",
    "FATURA NO": "INVOICE NO",
    "TUTAR": "AMOUNT",
    "DURUM": "STATUS",
    "FATURA DETAYI": "INVOICE DETAIL",
    "Kalem": "Item",
    "Adet": "Qty",
    "Birim": "Unit",
    "Search Toplam": "Subtotal",
    "Ara Toplam": "Subtotal",
    "KDV (%0 — muaf)": "VAT (0% — exempt)",
    "Toplam": "Total",
    "Yerinde Servis Fee": "On-site Service Fee",
    "sa<": "hr<",
    "Yol Cost": "Travel Cost",
    "Till Kurulumu": "Till Installation",
    
    # Customer Search section (if any remaining)
    "Customer Search": "Customer Search",
    
    # Fix broken search replaces
    "VADE": "DUE"
}

for tr, en in translations.items():
    html = html.replace(tr, en)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
