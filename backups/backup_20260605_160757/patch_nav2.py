import codecs
html = codecs.open('index.html', 'r', 'utf-8').read()

# Add Waiting Jobs / Appointments nav button
nav_calendar = '<button class="nav-link" onclick="showTab(\'calendar\')" id="btn-calendar">Calendar</button>'
nav_waiting = '<button class="nav-link" onclick="showTab(\'waiting\')" id="btn-waiting">Appointments</button>'

if 'id="btn-waiting"' not in html:
    html = html.replace(nav_calendar, f'{nav_calendar}\n    {nav_waiting}')
    print("Added Appointments to nav.")

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)
