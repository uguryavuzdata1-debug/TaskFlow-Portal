import re

with open('js/ui.js', 'r', encoding='utf8') as f:
    text = f.read()

text = text.replace('if (hourTickets.length > 0) {\n            hourTickets.forEach(t => {', 'if (hourTickets.length > 0) {\n            hourTickets.sort((a,b) => (a.startTime || "").localeCompare(b.startTime || ""));\n            hourTickets.forEach(t => {')

text = text.replace('onclick="editRecord(\'${t.dbId}\')"', 'onclick="document.getElementById(\'day-view-modal\').classList.add(\'hidden\'); editRecord(\'${t.dbId}\');"')

with open('js/ui.js', 'w', encoding='utf8') as f:
    f.write(text)

print('Updated ui.js')
