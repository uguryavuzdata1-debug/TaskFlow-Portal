import codecs
import re

with codecs.open('index.html', 'r', 'utf8') as f:
    html = f.read()

pattern = re.compile(r'<button class="nav-link" onclick="showTab\(\'calendar\'\)" id="btn-calendar">Calendar</button>\s*<button class="nav-link" onclick="showTab\(\'invoices\'\)" id="btn-invoices">Invoicing</button>')

new_nav = """<button class="nav-link" onclick="showTab('calendar')" id="btn-calendar">Calendar</button>
    <button class="nav-link" onclick="showTab('waiting')" id="btn-waiting">Waiting Jobs</button>
    <button class="nav-link" onclick="showTab('invoices')" id="btn-invoices">Invoicing</button>"""

if 'id="btn-waiting"' not in html:
    html = pattern.sub(new_nav, html)
    with codecs.open('index.html', 'w', 'utf8') as f:
        f.write(html)
    print("Replaced with regex!")
else:
    print("Already there!")
