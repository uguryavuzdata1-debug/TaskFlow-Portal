import re

with open('js/ui.js', 'r', encoding='utf8') as f:
    text = f.read()

text = text.replace('"PAYMENT STATUS": "Chargeable",', '"PAYMENT STATUS": "Chargeable",\n            "INV DATE": dateStr,')
text = text.replace('"PAYMENT STATUS": document.getElementById(\'f-payment-status\').value,', '"PAYMENT STATUS": document.getElementById(\'f-payment-status\').value,\n        "INV DATE": document.getElementById(\'f-date\') ? document.getElementById(\'f-date\').value : new Date().toISOString().split(\'T\')[0],')

with open('js/ui.js', 'w', encoding='utf8') as f:
    f.write(text)

print('Updated INV DATE insertion')
