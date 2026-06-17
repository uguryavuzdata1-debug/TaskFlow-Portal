import codecs

with codecs.open('index.html', 'r', 'utf8') as f:
    html = f.read()

old_btns = '<div style="display:flex; gap:10px; margin-top:10px;"><button id="va-save-btn" class="btn btn-primary" style="flex:1; justify-content:center; padding:12px;">Save Changes</button><button id="va-edit-btn" class="btn" style="flex:1; justify-content:center; padding:12px; background:#f1f5f9; color:#475569; border:1px solid #cbd5e1;">Edit Full Form</button></div>'

new_btns = """<div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
        <button id="va-save-btn" class="btn btn-primary" style="padding:12px; justify-content:center; font-size:12px;">Change Date Time</button>
        <button id="va-goticket-btn" class="btn" style="padding:12px; justify-content:center; font-size:12px; background:#10b981; color:white; border:none;">Go Ticket</button>
        <button id="va-hold-btn" class="btn" style="padding:12px; justify-content:center; font-size:12px; background:#64748b; color:white; border:none;">Hold</button>
        <button id="va-delete-btn" class="btn" style="padding:12px; justify-content:center; font-size:12px; background:#ef4444; color:white; border:none;">Delete</button>
      </div>"""

if old_btns in html:
    html = html.replace(old_btns, new_btns)
    with codecs.open('index.html', 'w', 'utf8') as f:
        f.write(html)
    print("Updated index.html")
else:
    print("Could not find old buttons in index.html")


with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

old_edit_logic = """    const btn = document.getElementById('va-edit-btn');
    btn.onclick = function() {
        document.getElementById('view-appointment-modal').classList.add('hidden');
        loadIntoDashboard(id);
    };"""

new_logic = """
    const goTicketBtn = document.getElementById('va-goticket-btn');
    if (goTicketBtn) {
        goTicketBtn.onclick = function() {
            document.getElementById('view-appointment-modal').classList.add('hidden');
            loadIntoDashboard(id);
        };
    }

    const holdBtn = document.getElementById('va-hold-btn');
    if (holdBtn) {
        holdBtn.onclick = function() {
            document.getElementById('view-appointment-modal').classList.add('hidden');
        };
    }

    const deleteBtn = document.getElementById('va-delete-btn');
    if (deleteBtn) {
        deleteBtn.onclick = async function() {
            if (!confirm('Are you sure you want to delete this appointment?')) return;
            try {
                deleteBtn.innerHTML = 'Deleting...';
                deleteBtn.disabled = true;
                const { error } = await sbClient.from('records').delete().eq('id', id);
                if (error) throw error;
                
                appState.tickets = appState.tickets.filter(t => t.id !== id);
                
                document.getElementById('view-appointment-modal').classList.add('hidden');
                if (typeof showAlert !== 'undefined') showAlert('Success', 'Appointment deleted.', '✅');
                if (typeof renderCalendar !== 'undefined') renderCalendar();
                if (typeof renderDataTable !== 'undefined') renderDataTable();
                if (typeof updateDataStats !== 'undefined') updateDataStats();
            } catch(e) {
                console.error(e);
                if (typeof showAlert !== 'undefined') showAlert('Error', e.message, '❌');
            } finally {
                deleteBtn.innerHTML = 'Delete';
                deleteBtn.disabled = false;
            }
        };
    }
"""

if old_edit_logic in ui:
    ui = ui.replace(old_edit_logic, new_logic)
    
    # Also fix "Save Changes" text in save logic:
    ui = ui.replace("saveBtn.innerHTML = 'Save Changes';", "saveBtn.innerHTML = 'Change Date Time';")
    
    with codecs.open('js/ui.js', 'w', 'utf8') as f:
        f.write(ui)
    print("Updated ui.js")
else:
    print("Could not find old edit logic in ui.js")

