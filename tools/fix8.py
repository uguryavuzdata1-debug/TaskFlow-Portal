import codecs

with codecs.open('index.html', 'r', 'utf8') as f:
    html = f.read()

html = html.replace('<div id="va-date" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:#f8fafc; font-weight:600; color:#111827; font-size:13px; min-height: 35px; display:flex; align-items:center;"></div>', '<input type="date" id="va-date" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:#ffffff; font-weight:600; color:#111827; font-size:13px; min-height: 35px;">')

html = html.replace('<div id="va-start-time" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:#f8fafc; font-weight:600; color:#111827; font-size:13px; min-height: 35px; display:flex; align-items:center;"></div>', '<input type="time" id="va-start-time" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px; background:#ffffff; font-weight:600; color:#111827; font-size:13px; min-height: 35px;">')

html = html.replace('<button id="va-edit-btn" class="btn btn-primary" style="margin-top:10px; width:100%; justify-content:center; padding:12px;">Edit Appointment</button>', '<div style="display:flex; gap:10px; margin-top:10px;"><button id="va-save-btn" class="btn btn-primary" style="flex:1; justify-content:center; padding:12px;">Save Changes</button><button id="va-edit-btn" class="btn" style="flex:1; justify-content:center; padding:12px; background:#f1f5f9; color:#475569; border:1px solid #cbd5e1;">Edit Full Form</button></div>')

with codecs.open('index.html', 'w', 'utf8') as f:
    f.write(html)

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

# Change how it's populated
ui = ui.replace("document.getElementById('va-date').innerText = r.invoiceDate || dateStr;", "document.getElementById('va-date').value = r.invoiceDate || dateStr;")
ui = ui.replace("document.getElementById('va-start-time').innerText = r.startTime || 'N/A';", "document.getElementById('va-start-time').value = r.startTime || '';")

# Now add logic for va-save-btn
save_logic = """
    const saveBtn = document.getElementById('va-save-btn');
    saveBtn.onclick = async function() {
        try {
            saveBtn.innerHTML = 'Saving...';
            saveBtn.disabled = true;
            
            const newDate = document.getElementById('va-date').value;
            const newTime = document.getElementById('va-start-time').value;
            
            const updates = {
                "INV DATE": newDate,
                "START TIME": newTime,
                "timestamp": new Date(newDate + 'T' + (newTime || '00:00') + ':00').toISOString()
            };
            
            const { error } = await sbClient.from('records').update(updates).eq('id', id);
            if (error) throw error;
            
            // update local state
            r.invoiceDate = newDate;
            r.startTime = newTime;
            r.timestamp = updates.timestamp;
            
            document.getElementById('view-appointment-modal').classList.add('hidden');
            if (typeof showAlert !== 'undefined') showAlert('Success', 'Appointment updated successfully!', '✅');
            if (typeof renderCalendar !== 'undefined') renderCalendar();
            if (typeof renderDataTable !== 'undefined') renderDataTable();
            
        } catch(e) {
            console.error(e);
            if (typeof showAlert !== 'undefined') showAlert('Error', e.message, '❌');
        } finally {
            saveBtn.innerHTML = 'Save Changes';
            saveBtn.disabled = false;
        }
    };
"""

# Inject save_logic before document.getElementById('view-appointment-modal').classList.remove('hidden');
if 'saveBtn.onclick = async function' not in ui:
    ui = ui.replace("document.getElementById('view-appointment-modal').classList.remove('hidden');", save_logic + "\n    document.getElementById('view-appointment-modal').classList.remove('hidden');")

with codecs.open('js/ui.js', 'w', 'utf8') as f:
    f.write(ui)

print("Updated view modal to be editable")
