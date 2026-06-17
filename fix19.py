import codecs

with codecs.open('index.html', 'r', 'utf8') as f:
    html = f.read()

old_nav = """<button class="nav-link" onclick="showTab('calendar')" id="btn-calendar">Calendar</button>
    <button class="nav-link" onclick="showTab('invoices')" id="btn-invoices">Invoicing</button>"""

new_nav = """<button class="nav-link" onclick="showTab('calendar')" id="btn-calendar">Calendar</button>
    <button class="nav-link" onclick="showTab('waiting')" id="btn-waiting">Waiting Jobs</button>
    <button class="nav-link" onclick="showTab('invoices')" id="btn-invoices">Invoicing</button>"""

if "btn-waiting" not in html:
    html = html.replace(old_nav, new_nav)
    with codecs.open('index.html', 'w', 'utf8') as f:
        f.write(html)
    print("Added Waiting Jobs to top navbar")
else:
    print("Already added")
