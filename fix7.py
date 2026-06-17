import codecs

with codecs.open('index.html', 'r', 'utf8') as f:
    html = f.read()

new_modal = """
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

      <button id="va-edit-btn" class="btn btn-primary" style="margin-top:10px; width:100%; justify-content:center; padding:12px;">Edit Appointment</button>
    </div>
  </div>
</div>
"""
if 'view-appointment-modal' not in html:
    html = html.replace('<!-- DAY VIEW MODAL -->', new_modal + '\n<!-- DAY VIEW MODAL -->')
    with codecs.open('index.html', 'w', 'utf8') as f:
        f.write(html)
    print("Updated index.html")

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

func = """
window.openAppointmentView = function(id) {
    const r = appState.tickets.find(t => t.id == id || t.dbId == id);
    if (!r) return;
    
    // Fill fields
    const services = appState.settings?.services || window.LOCAL_SERVICES || [];
    const servObj = services.find(x => x.name === r.mainService);
    document.getElementById('va-service-category').innerText = servObj ? (servObj.full_name || servObj.name) : (r.mainService || 'N/A');
    document.getElementById('va-company').innerText = r.company || 'N/A';
    document.getElementById('va-postcode').innerText = r.postcode || 'N/A';
    
    const customer = (appState.customers || []).find(c => (c.COMPANY || '') === r.company);
    const statusVal = customer ? (customer['SERVICE STATUS'] || 'No Contract') : 'No Contract';
    const statusEl = document.getElementById('va-status');
    statusEl.innerText = statusVal;
    
    if (statusVal.toLowerCase().includes('contract') || statusVal.toLowerCase().includes('var')) {
        statusEl.style.setProperty('background', '#10b981', 'important');
        statusEl.style.setProperty('color', 'white', 'important');
    } else {
        statusEl.style.setProperty('background', '#ef4444', 'important');
        statusEl.style.setProperty('color', 'white', 'important');
    }
    
    const dObj = new Date(r.timestamp);
    const dateStr = dObj.getFullYear() + '-' + String(dObj.getMonth() + 1).padStart(2, '0') + '-' + String(dObj.getDate()).padStart(2, '0');
    document.getElementById('va-date').innerText = r.invoiceDate || dateStr;
    document.getElementById('va-start-time').innerText = r.startTime || 'N/A';
    
    document.getElementById('va-created-at').innerText = new Date(r.timestamp).toLocaleString('tr-TR');
    document.getElementById('va-created-by').innerText = r.user || 'N/A';
    
    const btn = document.getElementById('va-edit-btn');
    btn.onclick = function() {
        document.getElementById('view-appointment-modal').classList.add('hidden');
        loadIntoDashboard(id);
    };
    
    document.getElementById('view-appointment-modal').classList.remove('hidden');
};
"""

if 'openAppointmentView' not in ui:
    ui = ui + '\n' + func

# Replace onclick
ui = ui.replace("onclick=\"loadIntoDashboard('${t.id}');\"", "onclick=\"openAppointmentView('${t.id}');\"")
ui = ui.replace("onclick=\"event.stopPropagation(); loadIntoDashboard('${t.id}')\"", "onclick=\"event.stopPropagation(); openAppointmentView('${t.id}')\"")

# Fix calendar event render
old_render = """<div class="calendar-event ${statusClass}" onclick="event.stopPropagation(); openAppointmentView('${t.id}')" title="${compName} - ${t.mainService}">
                        <span style="overflow: hidden; text-overflow: ellipsis;">${timeStr} ${compName}</span>
                        <span>${isCompleted ? '<i data-lucide="check-circle" style="width:10px;height:10px"></i>' : '<i data-lucide="clock" style="width:10px;height:10px"></i>'}</span>
                    </div>"""

new_render = """<div class="calendar-event ${statusClass}" onclick="event.stopPropagation(); openAppointmentView('${t.id}')" title="${compName} - ${t.mainService}" style="display:flex; flex-direction:column;">
                        <div style="display:flex; justify-content:space-between; width:100%;">
                            <span style="overflow: hidden; text-overflow: ellipsis; white-space:nowrap; font-weight:700;">${timeStr} ${compName}</span>
                            <span>${isCompleted ? '<i data-lucide="check-circle" style="width:10px;height:10px"></i>' : '<i data-lucide="clock" style="width:10px;height:10px"></i>'}</span>
                        </div>
                        <div style="font-size: 0.70rem; opacity: 0.9; margin-top:2px; font-weight:500;">${t.mainService}</div>
                    </div>"""

ui = ui.replace(old_render, new_render)

with codecs.open('js/ui.js', 'w', 'utf8') as f:
    f.write(ui)
print("Updated ui.js")
