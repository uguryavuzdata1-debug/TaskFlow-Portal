import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add E2E functions
e2e_js = """
// ==========================================
// END-TO-END FLOW (Tickets -> Invoices)
// ==========================================

function openQuickAdd() {
    const modal = document.getElementById('quick-add-modal');
    if(modal) {
        modal.classList.add('show');
    }
}

function saveQuickAdd() {
    // 1. Get values from form
    // Let's assume there are inputs in the modal. We'll use mock data if fields are empty.
    const companyInput = document.querySelector('#quick-add-modal input[placeholder*="Company"]');
    const company = companyInput && companyInput.value ? companyInput.value : 'New Walk-in Customer';
    
    // 2. Create Ticket
    const newAppt = {
        id: 'TKT-' + Date.now().toString().slice(-4),
        customer_name: company,
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        status: 'PENDING',
        postcode: 'SW1A 1AA',
        service_type: 'On-site Service'
    };
    
    if(!appState.appointments) appState.appointments = [];
    appState.appointments.push(newAppt);
    
    // Log
    if(typeof systemLogs !== 'undefined') {
        systemLogs.unshift({
            time: new Date().toLocaleString(),
            user: 'Administrator',
            action: 'CREATE',
            details: `Appointment created for ${company}`
        });
    }
    
    showToast('Ticket Created Successfully', 'success');
    closeModal('quick-add-modal');
    
    // Re-render
    if(typeof updateDashboardKPIs === 'function') updateDashboardKPIs();
    renderWaitingList();
}

function completeJob(ticketId) {
    const tkt = appState.appointments.find(a => a.id === ticketId);
    if(tkt) {
        tkt.status = 'CONFIRMED';
        showToast('Job marked as completed', 'success');
        
        if(typeof systemLogs !== 'undefined') {
            systemLogs.unshift({
                time: new Date().toLocaleString(),
                user: 'Administrator',
                action: 'UPDATE',
                details: `Job completed for ${tkt.customer_name}`
            });
        }
        if(typeof updateDashboardKPIs === 'function') updateDashboardKPIs();
        renderWaitingList();
    }
}

function generateInvoiceFromTicket(ticketId) {
    const tkt = appState.appointments.find(a => a.id === ticketId);
    if(tkt) {
        if(tkt.status !== 'CONFIRMED') {
            showToast('Job must be completed first!', 'warning');
            return;
        }
        
        const newInv = {
            id: 'INV-' + Date.now().toString().slice(-4),
            customer_name: tkt.customer_name,
            issue_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
            total: 150.00,
            status: 'PENDING'
        };
        
        if(!appState.invoices) appState.invoices = [];
        appState.invoices.push(newInv);
        
        showToast('Invoice Generated!', 'success');
        
        if(typeof systemLogs !== 'undefined') {
            systemLogs.unshift({
                time: new Date().toLocaleString(),
                user: 'Administrator',
                action: 'CREATE',
                details: `Invoice generated for ${tkt.customer_name}`
            });
        }
        showTab('invoices');
    }
}

function renderWaitingList() {
    const container = document.getElementById('waiting-list-container');
    if(!container) return;
    
    let html = '';
    const apps = appState.appointments || [];
    apps.forEach(a => {
        let actBtn = '';
        if(a.status === 'PENDING') {
            actBtn = `<button class="ticket-btn primary" onclick="completeJob('${a.id}')">Complete Job</button>`;
        } else {
            actBtn = `<button class="ticket-btn" onclick="generateInvoiceFromTicket('${a.id}')">Generate Invoice</button>`;
        }
        
        html += `
        <div class="ledger-row" style="grid-template-columns:100px 100px 1.5fr 150px 1fr; align-items:center;">
            <div style="font-family:'IBM Plex Mono',monospace; color:var(--steel);">${a.id}</div>
            <div style="font-family:'IBM Plex Mono',monospace;">${a.time}</div>
            <div style="font-weight:600; color:var(--ink);">${a.customer_name}</div>
            <div><span class="ledger-tag ${a.status === 'PENDING' ? 'auth' : 'create'}">${a.status}</span></div>
            <div style="display:flex; justify-content:flex-end;">${actBtn}</div>
        </div>
        `;
    });
    container.innerHTML = html;
}

window.openQuickAdd = openQuickAdd;
window.saveQuickAdd = saveQuickAdd;
window.completeJob = completeJob;
window.generateInvoiceFromTicket = generateInvoiceFromTicket;

// Re-override showTab to include waiting list
const prevShowTab2 = showTab;
showTab = function(tabId) {
    prevShowTab2(tabId);
    if(tabId === 'waiting') {
        renderWaitingList();
    }
}
"""

if 'saveQuickAdd' not in js:
    with open('app.js', 'a', encoding='utf-8') as f:
        f.write('\n' + e2e_js)

# Update index.html to have the container for waiting list and trigger button
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace waiting list table with container
wait_old = r'<div class="ledger-head" style="grid-template-columns:100px 1.5fr 1fr 100px 150px 70px;">.*?<div class="section-label"'
# Let's do it safely
match = re.search(r'(<section id="section-waiting".*?<div class="ledger".*?>\s*<div class="ledger-head"[^>]*>.*?</div>)(.*?)(</div>\s*<div class="section-label")', html, re.DOTALL)
if match:
    # Just insert <div id="waiting-list-container">
    # Wait, the ledger-head is good. We replace the rows with the container.
    new_html = html[:match.start(2)] + '\n<div id="waiting-list-container"></div>\n' + html[match.start(3):]
    html = new_html

# Hook up Quick Add modal "Create Ticket" button
html = html.replace('<button class="ticket-btn primary">Create Ticket</button>', '<button class="ticket-btn primary" onclick="saveQuickAdd()">Create Ticket</button>')
html = html.replace('<button class="ticket-btn primary">+ New Appointment</button>', '<button class="ticket-btn primary" onclick="openQuickAdd()">+ New Appointment</button>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
