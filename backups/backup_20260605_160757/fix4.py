import re

with open('js/ui.js', 'r', encoding='utf8') as f:
    text = f.read()

text = text.replace("editRecord('${t.dbId}')", "editInvoice('${t.id}')")

with open('js/ui.js', 'w', encoding='utf8') as f:
    f.write(text)

print('Fixed editRecord to editInvoice')
