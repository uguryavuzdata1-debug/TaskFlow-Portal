import codecs
import re

html_head = codecs.open('index_head.html', 'r', 'utf-16le').read()
html_curr = codecs.open('index.html', 'r', 'utf-8').read()

# 1. Extract Calendar and Waiting sections from current index.html
cal_match = re.search(r'<!-- CALENDAR SECTION -->.*?</section>', html_curr, flags=re.DOTALL)
wait_match = re.search(r'<!-- WAITING JOBS SECTION -->.*?</section>', html_curr, flags=re.DOTALL)

cal_sec = cal_match.group(0) if cal_match else ""
wait_sec = wait_match.group(0) if wait_match else ""

# 2. Extract Modals from current index.html
# We want view-appointment-modal, day-view-modal, and gc-quick-add-modal
view_match = re.search(r'<!-- View/Edit Appointment Modal -->.*?</div>\s*</div>', html_curr, flags=re.DOTALL)
day_match = re.search(r'<!-- Day View Modal -->.*?</div>\s*</div>', html_curr, flags=re.DOTALL)
gc_match = re.search(r'<!-- QUICK ADD MODAL -->.*?</div>\s*</div>\s*</div>', html_curr, flags=re.DOTALL) # Added one more </div>

view_modal = view_match.group(0) if view_match else ""
day_modal = day_match.group(0) if day_match else ""
gc_modal = gc_match.group(0) if gc_match else ""

modals = f"\n{view_modal}\n{day_modal}\n{gc_modal}\n"

# 3. Add to index_head.html

# Insert sections before </main>
sections_str = f"\n{cal_sec}\n{wait_sec}\n</main>"
new_html = html_head.replace('</main>', sections_str)

# Insert modals before <script src="js/api.js"> (or whatever is the first script)
# Let's just insert before <script src="app.js">
script_idx = new_html.rfind('<script src="app.js"></script>')
if script_idx == -1:
    script_idx = new_html.rfind('</body>')

new_html = new_html[:script_idx] + modals + new_html[script_idx:]

# 4. Insert Calendar button in nav
nav_button = '<button class="nav-link" onclick="showTab(\'calendar\')" id="btn-calendar">Calendar</button>'
new_html = new_html.replace('id="btn-dataview">Data View</button>', f'id="btn-dataview">Data View</button>\n    {nav_button}')

# 5. Insert gc_calendar script at the end
gc_script = """<script src="js/gc_calendar.js"></script>
<script>
  if(typeof lucide !== 'undefined') lucide.createIcons();
</script>
</body>"""
new_html = new_html.replace('</body>', gc_script)

# Ensure encoding declaration is UTF-8 (if there's a charset meta)
new_html = new_html.replace('charset="UTF-16LE"', 'charset="UTF-8"').replace('charset="utf-16le"', 'charset="UTF-8"')

# Save to index.html
with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(new_html)

print("Merged successfully. Size:", len(new_html))
