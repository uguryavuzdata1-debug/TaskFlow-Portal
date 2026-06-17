import codecs
import re

html = codecs.open('index.html', 'r', 'utf-8').read()

# 1. Revert <div class="layout-wrapper"> and <nav class="sidebar...">
html = html.replace('<div class="layout-wrapper">', '')
html = html.replace('<nav class="sidebar hidden" id="main-nav">', '<nav class="nav hidden" id="main-nav">')
# The user profile has flex column in sidebar? Actually it was `display: flex; align-items: center; gap: 15px;` which is fine for top nav.
# Change .nav-links from column to row. Wait, nav-links flex direction is handled by CSS, not HTML inline styles, but let's check.
# Remove the closing </div> of layout-wrapper which was added right after </main>
wrapper_end_idx = html.find('</div>\n<datalist')
if wrapper_end_idx != -1:
    html = html[:wrapper_end_idx] + html[wrapper_end_idx+7:]
elif html.find('</main>\n</div>') != -1:
    html = html.replace('</main>\n</div>', '</main>')

# 2. Remove "New Customer" tile
tile_match = re.search(r'<div class="tile"[^>]*onclick="showTab\(\'customers\'\)"[^>]*>.*?</div>\s*</div>\s*</div>', html, flags=re.DOTALL)
if tile_match:
    html = html.replace(tile_match.group(0), '')
else:
    # Alternative regex just in case
    tile_pattern = re.compile(r'<div class="tile"[^>]*onclick="showTab\(\'customers\'\)"[^>]*>.*?</div>\s*(<div class="tile")', re.DOTALL)
    html = tile_pattern.sub(r'\1', html)

# 3. Add Calendar HTML if missing
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

if 'section-calendar' not in html:
    html = html.replace('</main>', sections + '\n</main>')

if 'view-appointment-modal' not in html:
    # Just insert before datalist
    html = html.replace('<datalist id="vtiger-customer-list">', modals + '\n<datalist id="vtiger-customer-list">')


with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)
    
print("Reverted HTML layout and restored Calendar HTML.")
