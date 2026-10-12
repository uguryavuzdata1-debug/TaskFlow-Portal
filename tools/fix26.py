import codecs
import re

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

# 1. Modify completeJob
old_complete_job = """window.completeJob = async function(id) {
    const duration = prompt("Enter duration for this completed job (e.g. '1h 30m', '2h'):");
    if (duration === null) return; // User cancelled
    
    try {
        if (typeof showAlert !== 'undefined') showAlert('Info', 'Completing job...', '');
        const updates = { status: 'Completed', "DURATION": duration };
        
        const { error } = await sbClient.from('records').update(updates).eq('id', id);
        if (error) throw error;
        
        // update local state
        const t = appState.tickets.find(x => x.id === id);
        if (t) {
            t.status = 'Completed';
            t.DURATION = duration;
        }
        
        if (typeof showAlert !== 'undefined') showAlert('Success', 'Job completed and moved to Data View!', '');
        if (typeof renderWaitingJobs !== 'undefined') renderWaitingJobs();
        if (typeof renderCalendar !== 'undefined') renderCalendar();
        if (typeof updateDataStats !== 'undefined') updateDataStats();
    } catch(e) {
        console.error(e);
        if (typeof showAlert !== 'undefined') showAlert('Error', e.message, '');
    }
};"""

new_complete_job = """window.completeJob = async function(id) {
    // User requested NO prompt for duration here
    try {
        if (typeof showAlert !== 'undefined') showAlert('Info', 'Completing job...', '');
        const updates = { status: 'Completed' };
        
        const { error } = await sbClient.from('records').update(updates).eq('id', id);
        if (error) throw error;
        
        // update local state
        const t = appState.tickets.find(x => x.id === id);
        if (t) {
            t.status = 'Completed';
        }
        
        if (typeof showAlert !== 'undefined') showAlert('Success', 'Job completed and moved to Data View!', '');
        if (typeof renderWaitingJobs !== 'undefined') renderWaitingJobs();
        if (typeof renderCalendar !== 'undefined') renderCalendar();
        if (typeof updateDataStats !== 'undefined') updateDataStats();
    } catch(e) {
        console.error(e);
        if (typeof showAlert !== 'undefined') showAlert('Error', e.message, '');
    }
};"""

ui = ui.replace(old_complete_job, new_complete_job)

# 2. Modify Button HTML
old_button_html = """<div>
                    <button onclick="completeJob('${t.id}')" style="background:#10b981; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                        <i data-lucide="check" style="width:14px;height:14px;"></i> Complete
                    </button>
                </div>"""

new_button_html = """<div>
                    <button onclick="completeJob('${t.id}')" style="background:#f59e0b; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 1px 2px rgba(0,0,0,0.1);" title="Click to Complete">
                        <i data-lucide="clock" style="width:14px;height:14px;"></i> Waiting
                    </button>
                </div>"""

ui = ui.replace(old_button_html, new_button_html)

with codecs.open('js/ui.js', 'w', 'utf8') as f:
    f.write(ui)
    
print("Updated button and completeJob function")
