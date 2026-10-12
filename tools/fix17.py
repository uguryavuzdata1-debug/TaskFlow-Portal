import codecs

with codecs.open('index.html', 'r', 'utf8') as f:
    html = f.read()

# 1. Update Add Appointment hidden fields
old_qa_hidden = """<input type="hidden" id="qa-date">
      <input type="hidden" id="qa-time">"""

new_qa_visible = """<div style="display:flex; gap:10px;">
        <div class="field" style="flex:1;">
          <label>Date</label>
          <input type="date" id="qa-date" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;">
        </div>
        <div class="field" style="flex:1;">
          <label>Start Time</label>
          <input type="time" id="qa-time" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;">
        </div>
      </div>"""

html = html.replace(old_qa_hidden, new_qa_visible)

# 2. Add Sidebar link
old_sidebar = """<a href="#" class="nav-item" onclick="showTab('calendar')"><i data-lucide="calendar"></i> Calendar</a>"""
new_sidebar = """<a href="#" class="nav-item" onclick="showTab('calendar')"><i data-lucide="calendar"></i> Calendar</a>
        <a href="#" class="nav-item" onclick="showTab('waiting')"><i data-lucide="list-tree"></i> Waiting Jobs</a>"""

if "list-tree" not in html:
    html = html.replace(old_sidebar, new_sidebar)

# 3. Add tab content
old_cal_view = """<!-- CALENDAR VIEW -->
      <div id="calendar-view" class="tab-content hidden" style="display:flex; flex-direction:column; gap:20px; height: 100%;">"""

new_waiting_view = """<!-- WAITING JOBS VIEW -->
      <div id="waiting-view" class="tab-content hidden" style="display:flex; flex-direction:column; gap:20px; height: 100%; overflow-y:auto; padding-right:10px;">
         <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:15px 20px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="font-size:1.25rem; font-weight:700; display:flex; align-items:center; gap:10px;">
              <i data-lucide="list-tree"></i> Waiting Jobs (Tree View)
            </h2>
         </div>
         <div id="waiting-tree-container" style="display:flex; flex-direction:column; gap:15px;"></div>
      </div>
"""

if "waiting-tree-container" not in html:
    html = html.replace(old_cal_view, new_waiting_view + "\n      " + old_cal_view)

with codecs.open('index.html', 'w', 'utf8') as f:
    f.write(html)
print("Updated index.html")
