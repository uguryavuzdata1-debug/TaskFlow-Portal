import codecs
import re

html = codecs.open('index.html', 'r', 'utf-8').read()

# Check for btn-settings
if 'id="btn-settings"' in html:
    print("btn-settings exists.")
else:
    print("btn-settings is missing!")
    
# Let's fix btn-settings
html = html.replace('onclick="showTab(\'settings\')" style', 'id="btn-settings" onclick="showTab(\'settings\')" style')

# Now let's grab the missing modals from the backup
backup_html = codecs.open('backups/backup_20260529_1110/index.html', 'r', 'utf-8').read()

view_match = re.search(r'<!-- View/Edit Appointment Modal -->.*?</div>\s*</div>\s*</div>\s*</div>', backup_html, flags=re.DOTALL)
if view_match:
    print("Found view-appointment-modal in backup")
else:
    # Try simpler regex
    idx_start = backup_html.find('<!-- View/Edit Appointment Modal -->')
    idx_end = backup_html.find('<!-- QUICK ADD MODAL -->')
    if idx_start != -1 and idx_end != -1:
        view_match = backup_html[idx_start:idx_end]
        print("Found view-appointment-modal using string indexing")

day_match = re.search(r'<!-- Day View Modal -->.*?</div>\s*</div>\s*</div>', backup_html, flags=re.DOTALL)
if not day_match:
    idx_start = backup_html.find('<!-- Day View Modal -->')
    idx_end = backup_html.find('<!-- View/Edit Appointment Modal -->')
    if idx_start != -1 and idx_end != -1:
        day_match = backup_html[idx_start:idx_end]
        print("Found day-view-modal using string indexing")

# Insert them before gc-quick-add-modal
if type(view_match) == str:
    view_modal = view_match
else:
    view_modal = view_match.group(0) if view_match else ""

if type(day_match) == str:
    day_modal = day_match
else:
    day_modal = day_match.group(0) if day_match else ""

idx = html.find('<!-- QUICK ADD MODAL -->')
if idx != -1:
    html = html[:idx] + view_modal + '\n' + day_modal + '\n' + html[idx:]
    print("Injected modals into index.html")

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)
