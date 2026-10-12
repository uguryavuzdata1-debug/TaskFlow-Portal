import codecs
import re

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

# 1. Update the layout in Waiting Jobs
# Let's search for the row HTML
old_row = """            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #f1f5f9; hover:background:#f8fafc;">
                <div style="display:flex; flex-direction:column; gap:4px; cursor:pointer;" onclick="openAppointmentView('${t.id}')">
                    <div style="font-weight:600; color:#0f172a;">${t.startTime || '00:00'} - ${t.company || 'Unknown Company'}</div>
                    <div style="font-size:0.85rem; color:#64748b; display:flex; flex-wrap:wrap; gap:12px;">
                        <span><i data-lucide="tag" style="width:12px;height:12px;"></i> ${displayService}</span>
                        <span><i data-lucide="list-ordered" style="width:12px;height:12px;"></i> Sıra: ${index + 1}</span>
                        <span><i data-lucide="map-pin" style="width:12px;height:12px;"></i> ${t.postcode || 'No Postcode'}</span>
                        <span style="color:${t.paymentStatus === 'Chargeable' ? '#ef4444' : '#10b981'}; font-weight:600;"><i data-lucide="info" style="width:12px;height:12px;"></i> ${t.paymentStatus || 'No Status'}</span>
                    </div>
                </div>
                <div>
                    <button onclick="completeJob('${t.id}')" style="background:#f59e0b; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 1px 2px rgba(0,0,0,0.1);" title="Click to Complete">
                        <i data-lucide="clock" style="width:14px;height:14px;"></i> Waiting
                    </button>
                </div>
            </div>"""

new_row = """            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #f1f5f9; hover:background:#f8fafc; gap:15px;">
                <div style="display:flex; flex-wrap:wrap; align-items:center; gap:15px; cursor:pointer; flex:1;" onclick="openAppointmentView('${t.id}')">
                    <span style="font-weight:700; color:#334155; min-width:40px;">#${index + 1}</span>
                    <span style="font-weight:600; color:#0f172a; min-width:180px;">${t.startTime || '00:00'} - ${t.company || 'Unknown Company'}</span>
                    <span style="font-size:0.85rem; color:#64748b; display:flex; align-items:center; gap:4px;"><i data-lucide="tag" style="width:12px;height:12px;"></i> ${displayService}</span>
                    <span style="font-size:0.85rem; color:#64748b; display:flex; align-items:center; gap:4px;"><i data-lucide="map-pin" style="width:12px;height:12px;"></i> ${t.postcode || 'N/A'}</span>
                    <span style="font-size:0.85rem; color:${t.paymentStatus === 'Chargeable' ? '#ef4444' : '#10b981'}; font-weight:600; display:flex; align-items:center; gap:4px;"><i data-lucide="info" style="width:12px;height:12px;"></i> ${t.paymentStatus || 'N/A'}</span>
                </div>
                <div>
                    <button onclick="completeJob('${t.id}')" style="background:#f59e0b; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 1px 2px rgba(0,0,0,0.1);" title="Click to Complete">
                        <i data-lucide="clock" style="width:14px;height:14px;"></i> Waiting
                    </button>
                </div>
            </div>"""

if old_row in ui:
    ui = ui.replace(old_row, new_row)
else:
    print("Could not find row html to replace")

# 2. Fix the Data View filter
pattern = re.compile(r"let filtered = appState\.tickets;\s*// --- Data Scoping: Users only see their own tickets ---")

new_filter = """let filtered = appState.tickets.filter(t => {
        const stat = t.status || '';
        return (stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamland' || t.invoiced === true);
    });
    
    // --- Data Scoping: Users only see their own tickets ---"""

if pattern.search(ui):
    ui = pattern.sub(new_filter, ui)
    print("Replaced Data View Filter")
else:
    print("Could not find data filter")

with codecs.open('js/ui.js', 'w', 'utf8') as f:
    f.write(ui)
