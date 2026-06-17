import codecs

with codecs.open('index.html', 'r', 'utf8') as f:
    html = f.read()

old_str = '<button class="nav-link" onclick="showTab(\'dataview\')" id="btn-dataview">Data View</button>'
new_str = '<button class="nav-link" onclick="showTab(\'dataview\')" id="btn-dataview">Data View</button>\n    <button class="nav-link" onclick="showTab(\'calendar\')" id="btn-calendar">Calendar</button>\n    <button class="nav-link" onclick="showTab(\'waiting\')" id="btn-waiting">Waiting Jobs</button>'

if old_str in html:
    html = html.replace(old_str, new_str)
    with codecs.open('index.html', 'w', 'utf8') as f:
        f.write(html)
    print("Injected nav links successfully!")
else:
    print("Could not find the target string to inject nav links!")
