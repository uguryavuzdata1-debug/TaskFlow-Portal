import re

js = """
// ==========================================
// E2E LOGIC (Dashboard, Customer Search, etc)
// ==========================================

function updateDashboardKPIs() {
    const appointments = appState.appointments || [];
    const invoices = appState.invoices || [];
    
    const today = new Date().toISOString().split('T')[0];
    
    // KPI 1: Today's Appointments (Pending)
    const todayPending = appointments.filter(a => a.date === today && a.status === 'PENDING').length;
    
    // KPI 2: Completed Today
    const todayCompleted = appointments.filter(a => a.date === today && a.status === 'CONFIRMED').length;
    
    // KPI 3: Overdue Invoices
    const overdueCount = invoices.filter(i => i.status === 'OVERDUE').length;
    
    // KPI 4: Monthly Revenue
    const monthlyRev = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);
    
    const el1 = document.getElementById('dash-kpi-pending');
    const el2 = document.getElementById('dash-kpi-completed');
    const el3 = document.getElementById('dash-kpi-overdue');
    const el4 = document.getElementById('dash-kpi-revenue');
    
    if(el1) el1.innerText = todayPending;
    if(el2) el2.innerText = todayCompleted;
    if(el3) el3.innerText = overdueCount;
    if(el4) el4.innerText = '£' + monthlyRev.toFixed(2);
    
    renderDashboardSchedule(appointments);
    renderDashboardActivity();
}

function renderDashboardSchedule(appointments) {
    const list = document.getElementById('dashboard-schedule-list');
    if (!list) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todayApps = appointments.filter(a => a.date === today).sort((a,b) => a.time.localeCompare(b.time));
    
    let html = '';
    todayApps.forEach(a => {
        let statusTag = `<span class="ticket-status pending">PENDING</span>`;
        if(a.status === 'CONFIRMED') statusTag = `<span class="ticket-status confirmed">CONFIRMED</span>`;
        
        html += `
        <div class="dash-schedule-row" style="display:flex; justify-content:space-between; padding:1rem 0; border-bottom:1px dashed var(--line); align-items:center;">
            <div style="font-family:'IBM Plex Mono',monospace; color:var(--steel); width:60px;">${a.time}</div>
            <div style="flex:1;">
                <div style="font-weight:600; color:var(--ink);">${a.customer_name}</div>
                <div style="font-size:0.8rem; color:var(--steel);">${a.postcode}</div>
            </div>
            <div>${statusTag}</div>
        </div>
        `;
    });
    list.innerHTML = html;
}

function renderDashboardActivity() {
    const list = document.getElementById('dashboard-activity-list');
    if (!list) return;
    
    let html = '';
    const recent = (systemLogs || []).slice(0, 5);
    recent.forEach(log => {
        html += `
        <div class="dash-activity-row" style="padding:1rem 0; border-bottom:1px dashed var(--line);">
            <div style="font-family:'IBM Plex Mono',monospace; font-size:0.7rem; color:var(--steel); margin-bottom:0.3rem;">${log.time} · ${log.user.toUpperCase()}</div>
            <div style="font-size:0.9rem; color:var(--ink);">${log.details}</div>
        </div>
        `;
    });
    list.innerHTML = html;
}

// Call updateDashboardKPIs when tab is switched
const originalShowTab = showTab;
showTab = function(tabId) {
    originalShowTab(tabId);
    if(tabId === 'dashboard') {
        updateDashboardKPIs();
    }
}
"""

with open('app.js', 'a', encoding='utf-8') as f:
    f.write(js)
