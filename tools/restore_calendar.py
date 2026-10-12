import codecs
import re

# 1. Update app.js
with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui_js = f.read()

with codecs.open('app.js', 'r', 'utf8') as f:
    app_js = f.read()

# Extract Calendar & Waiting Jobs Logic from ui.js
idx = ui_js.find('// --- CALENDAR LOGIC ---')
if idx != -1:
    calendar_logic = ui_js[idx:]
    
    if '// --- CALENDAR LOGIC ---' not in app_js:
        app_js += '\n\n' + calendar_logic
        print("Appended calendar logic to app.js")
    
    # Also need renderWaitingJobs and completeJob
    waiting_jobs_idx = ui_js.find('window.completeJob = async function')
    if waiting_jobs_idx != -1:
        # Find end of waiting jobs logic
        end_idx = ui_js.find('// 3. Update renderDataTable', waiting_jobs_idx)
        if end_idx == -1: end_idx = len(ui_js)
        
        waiting_logic = ui_js[waiting_jobs_idx:end_idx]
        if 'window.completeJob = async function' not in app_js:
            app_js += '\n\n' + waiting_logic
            print("Appended waiting jobs logic to app.js")

# Update showTab in app.js
old_showtab = """function showTab(tabId) {
    appState.activeTab = tabId;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(`section-${tabId}`).classList.add('active');
    document.getElementById(`btn-${tabId}`).classList.add('active');"""

new_showtab = """function showTab(tabId) {
    appState.activeTab = tabId;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(`section-${tabId}`).classList.add('active');
    document.getElementById(`btn-${tabId}`).classList.add('active');
    
    if (tabId === 'calendar' && typeof renderCalendar !== 'undefined') renderCalendar();
    if (tabId === 'waiting' && typeof renderWaitingJobs !== 'undefined') renderWaitingJobs();"""

if old_showtab in app_js and "renderCalendar();" not in app_js:
    app_js = app_js.replace(old_showtab, new_showtab)
    print("Updated showTab in app.js")
else:
    # Try regex
    showtab_pattern = re.compile(r'(function showTab\(tabId\) \{.*?document\.getElementById\(`btn-\$\{tabId\}`\)\.classList\.add\(\'active\'\);)', re.DOTALL)
    app_js = showtab_pattern.sub(r'\1\n    if (tabId === \'calendar\' && typeof renderCalendar !== \'undefined\') renderCalendar();\n    if (tabId === \'waiting\' && typeof renderWaitingJobs !== \'undefined\') renderWaitingJobs();', app_js)
    print("Updated showTab in app.js via regex")

with codecs.open('app.js', 'w', 'utf8') as f:
    f.write(app_js)


# 2. Update index.html
with codecs.open('index.html', 'r', 'utf8') as f:
    html = f.read()

# Add nav links
if 'btn-calendar' not in html:
    nav_pattern = re.compile(r'(<button class="nav-link" onclick="showTab\(\'data\'\)" id="btn-data">Data View</button>)')
    nav_repl = r'\1\n        <button class="nav-link" onclick="showTab(\'calendar\')" id="btn-calendar">Calendar</button>\n        <button class="nav-link" onclick="showTab(\'waiting\')" id="btn-waiting">Waiting Jobs</button>'
    html = nav_pattern.sub(nav_repl, html)
    print("Added nav links")

# Add sections
sections = """
  <!-- CALENDAR SECTION -->
  <section id="section-calendar" class="section">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <h2 style="font-size: 1.5rem; font-weight: 700; color: #1e293b; letter-spacing: -0.02em;">Appointments & Calendar</h2>
      <div style="display:flex; gap:10px;">
          <button class="btn" onclick="prevMonth()">Previous</button>
          <h3 id="calendar-month-display" style="min-width:150px; text-align:center;"></h3>
          <button class="btn" onclick="nextMonth()">Next</button>
      </div>
    </div>
    
    <div class="calendar-wrapper">
      <div class="calendar-header">
        <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
      </div>
      <div class="calendar-grid" id="calendar-grid">
        <!-- Rendered via JS -->
      </div>
    </div>
  </section>

  <!-- WAITING JOBS SECTION -->
  <section id="section-waiting" class="section">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <h2 style="font-size: 1.5rem; font-weight: 700; color: #1e293b; letter-spacing: -0.02em;">Waiting Jobs</h2>
    </div>
    <div id="waiting-tree-container" style="display:flex; flex-direction:column; gap:15px; overflow-y:auto; padding-right:10px;"></div>
  </section>
"""

if 'section-calendar' not in html:
    html = html.replace('</main>', sections + '\n</main>')
    print("Added sections")

# Add modals
modals = """
<!-- VIEW APPOINTMENT MODAL -->
<div id="view-appointment-modal" class="modal-overlay hidden" style="z-index: 3002;">
  <div class="modal-content" style="max-width: 400px; padding: 25px;">
    <div class="modal-header">
      <h2>Appointment Details</h2>
      <button class="close-btn" onclick="document.getElementById('view-appointment-modal').classList.add('hidden')">&times;</button>
    </div>
    <div class="modal-body" style="display:flex; flex-direction:column; gap:15px; margin-top:20px;">
      <div class="field">
        <label>Service Category</label>
        <div id="va-service-category" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:#f8fafc; font-weight:600; color:#111827; font-size:14px; min-height: 38px; display:flex; align-items:center;"></div>
      </div>
      <div class="field">
        <label>Company Name</label>
        <div id="va-company" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:#f8fafc; font-weight:600; color:#111827; font-size:14px; min-height: 38px; display:flex; align-items:center;"></div>
      </div>
      <div class="field">
        <label>Postcode</label>
        <div id="va-postcode" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:#f8fafc; font-weight:600; color:#111827; font-size:14px; min-height: 38px; display:flex; align-items:center;"></div>
      </div>
      <div class="field">
        <label>Service Status</label>
        <div id="va-status" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:#f8fafc; font-weight:800; color:#111827; font-size:14px; min-height: 38px; display:flex; align-items:center;"></div>
      </div>
      <div style="display: flex; gap: 10px;">
          <div class="field" style="flex:1;">
            <label>Date</label>
            <div id="va-date" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:#f8fafc; font-weight:600; color:#111827; font-size:13px; min-height: 35px; display:flex; align-items:center;"></div>
          </div>
          <div class="field" style="flex:1;">
            <label>Start Time</label>
            <div id="va-start-time" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:#f8fafc; font-weight:600; color:#111827; font-size:13px; min-height: 35px; display:flex; align-items:center;"></div>
          </div>
      </div>
      <div style="background:#f1f5f9; padding:12px; border-radius:6px; margin-top:5px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:12px;">
            <span style="color:#64748b; font-weight:600;">Created Date/Time:</span>
            <span id="va-created-at" style="color:#111827; font-weight:600;"></span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px;">
            <span style="color:#64748b; font-weight:600;">Created by:</span>
            <span id="va-created-by" style="color:#111827; font-weight:600;"></span>
        </div>
      </div>
      
      <div style="display:flex; gap:10px; margin-top:10px;">
          <button id="va-edit-btn" class="btn btn-primary" style="flex:1; justify-content:center; padding:12px;">Edit Appt.</button>
          <button id="va-goticket-btn" class="btn" style="flex:1; justify-content:center; padding:12px; background:#3b82f6; color:white; border:none;">Go To Ticket</button>
      </div>
      <div style="display:flex; gap:10px; margin-top:5px;">
          <button id="va-hold-btn" class="btn" style="flex:1; justify-content:center; padding:12px; background:#f59e0b; color:white; border:none;">On Hold</button>
          <button id="va-delete-btn" class="btn" style="flex:1; justify-content:center; padding:12px; background:#ef4444; color:white; border:none;">Delete Appt.</button>
      </div>
    </div>
  </div>
</div>

<!-- DAY VIEW MODAL -->
<div id="day-view-modal" class="modal-overlay hidden" style="z-index: 3001;">
  <div class="modal-content" style="max-width: 600px; padding: 0; display:flex; flex-direction:column; height: 85vh;">
    <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; background: white; z-index: 10;">
      <h2 id="day-view-title" style="font-size: 1.4rem; color: #1e293b;"></h2>
      <button class="close-btn" onclick="document.getElementById('day-view-modal').classList.add('hidden')">&times;</button>
    </div>
    <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 0; background: #f8fafc;">
      <div id="day-view-hourly-list" style="display: flex; flex-direction: column;"></div>
    </div>
  </div>
</div>

<!-- QUICK ADD MODAL -->
<div id="quick-add-modal" class="modal-overlay hidden" style="z-index: 3005;">
  <div class="modal-content" style="max-width: 450px;">
    <div class="modal-header">
      <h2>Quick Add Appointment</h2>
      <button class="close-btn" onclick="document.getElementById('quick-add-modal').classList.add('hidden')">&times;</button>
    </div>
    <div class="modal-body" style="display:flex; flex-direction:column; gap:15px; margin-top:15px;">
        <div style="display:flex; gap:10px;">
            <div class="field" style="flex:1;">
                <label>Date</label>
                <input type="date" id="qa-date">
            </div>
            <div class="field" style="flex:1;">
                <label>Time</label>
                <input type="time" id="qa-time">
            </div>
        </div>
        <div class="field">
            <label>Service Category</label>
            <select id="qa-service-category">
                <option value="S1">MENU UPDATE</option>
                <option value="S2">CREDIT CARD</option>
                <option value="S3">DATA RESET</option>
                <option value="S4">SERVICE</option>
                <option value="S5">OTHER</option>
                <option value="S6">TILL SETUP</option>
            </select>
        </div>
        <div class="field">
            <label>Company Name</label>
            <input type="text" id="qa-company" onchange="autoFillQuickAdd()" placeholder="Type to search..." list="vtiger-customer-list">
        </div>
        <div class="field">
            <label>Postcode</label>
            <input type="text" id="qa-postcode">
        </div>
        <div class="field">
            <label>Contract Status</label>
            <input type="text" id="qa-status" disabled style="background:#f8fafc; color:#111827; font-weight:600;">
        </div>
        <button class="btn btn-primary" onclick="submitQuickAdd()" style="margin-top:10px; width:100%; justify-content:center; padding:12px;">Create Appointment</button>
    </div>
  </div>
</div>
"""

if 'view-appointment-modal' not in html:
    html = html.replace('</body>', modals + '\n</body>')
    print("Added modals")

with codecs.open('index.html', 'w', 'utf8') as f:
    f.write(html)
