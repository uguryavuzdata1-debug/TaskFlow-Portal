import codecs
import re

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

# 1. Update showTab
old_showtab = """    if (tabId === 'calendar' && typeof renderCalendar !== 'undefined') renderCalendar();
    if (tabId === 'data' && typeof renderDataTable !== 'undefined') renderDataTable();"""

new_showtab = """    if (tabId === 'calendar' && typeof renderCalendar !== 'undefined') renderCalendar();
    if (tabId === 'data' && typeof renderDataTable !== 'undefined') renderDataTable();
    if (tabId === 'waiting' && typeof renderWaitingJobs !== 'undefined') renderWaitingJobs();"""

if "renderWaitingJobs" not in ui:
    ui = ui.replace(old_showtab, new_showtab)


# 2. Add renderWaitingJobs and completeJob function
new_waiting_logic = """

window.completeJob = async function(id) {
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
};

window.renderWaitingJobs = function() {
    const container = document.getElementById('waiting-tree-container');
    if (!container) return;

    const tickets = appState.tickets || [];
    
    // Filter waiting jobs
    const waitingJobs = tickets.filter(t => {
        const stat = t.status || '';
        const isStatusCompleted = (stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamland' || t.invoiced === true);
        
        let isFuture = false;
        if (t.timestamp) {
            const tDate = new Date(t.timestamp);
            if (tDate > new Date()) isFuture = true;
        }
        
        if (isFuture) return true;
        return !isStatusCompleted;
    });

    if (waitingJobs.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#64748b;">No waiting jobs found.</div>';
        return;
    }

    // Group by Date
    const groupedByDate = {};
    waitingJobs.forEach(t => {
        const dateStr = t.invoiceDate || 'No Date';
        if (!groupedByDate[dateStr]) groupedByDate[dateStr] = [];
        groupedByDate[dateStr].push(t);
    });

    // Sort dates
    const sortedDates = Object.keys(groupedByDate).sort();

    let html = '';
    sortedDates.forEach(dateStr => {
        html += `
        <div style="background:white; border-radius:8px; border:1px solid #e2e8f0; overflow:hidden;">
            <div style="background:#f1f5f9; padding:12px 20px; font-weight:700; color:#334155; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; gap:10px;">
                <i data-lucide="calendar-days" style="width:18px;height:18px;"></i> ${dateStr}
                <span style="background:#f59e0b; color:white; font-size:0.75rem; padding:2px 8px; border-radius:12px; margin-left:auto;">${groupedByDate[dateStr].length} Jobs</span>
            </div>
            <div style="padding:10px;">
        `;
        
        const dayJobs = groupedByDate[dateStr].sort((a,b) => (a.startTime || '').localeCompare(b.startTime || ''));
        
        dayJobs.forEach(t => {
            html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #f1f5f9; hover:background:#f8fafc;">
                <div style="display:flex; flex-direction:column; gap:4px; cursor:pointer;" onclick="openAppointmentView('${t.id}')">
                    <div style="font-weight:600; color:#0f172a;">${t.startTime || '00:00'} - ${t.company || 'Unknown Company'}</div>
                    <div style="font-size:0.85rem; color:#64748b; display:flex; gap:10px;">
                        <span><i data-lucide="tag" style="width:12px;height:12px;"></i> ${t.mainService || 'N/A'}</span>
                        <span><i data-lucide="ticket" style="width:12px;height:12px;"></i> Ticket: ${t.crmTicket || 'N/A'}</span>
                    </div>
                </div>
                <div>
                    <button onclick="completeJob('${t.id}')" style="background:#10b981; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                        <i data-lucide="check" style="width:14px;height:14px;"></i> Complete
                    </button>
                </div>
            </div>
            `;
        });
        
        html += `
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
};

"""

if "window.renderWaitingJobs = function" not in ui:
    ui += new_waiting_logic


# 3. Update renderDataTable to exclude Waiting Jobs
# In renderDataTable, we have:
# const tickets = appState.tickets || [];
# Then it filters based on activeDataTab.
old_data_filter = """    let filtered = tickets;

    if (activeDataTab === 'today') {"""

new_data_filter = """    // Exclude waiting jobs
    let filtered = tickets.filter(t => {
        const stat = t.status || '';
        const isStatusCompleted = (stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamland' || t.invoiced === true);
        
        let isFuture = false;
        if (t.timestamp) {
            const tDate = new Date(t.timestamp);
            if (tDate > new Date()) isFuture = true;
        }
        
        // Include ONLY if it is completed AND not in the future
        return !isFuture && isStatusCompleted;
    });

    if (activeDataTab === 'today') {"""

ui = ui.replace(old_data_filter, new_data_filter)

with codecs.open('js/ui.js', 'w', 'utf8') as f:
    f.write(ui)

print("Updated ui.js")
