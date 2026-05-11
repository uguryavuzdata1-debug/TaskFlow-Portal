// --- Supabase Configuration ---
const SB_URL = 'https://ekjhhjrhfkoiklyxjfpu.supabase.co';
const SB_KEY = 'sb_publishable_hz1a48NHx7c8RPV_RYHfZg_YNvnNOdH';
const sbClient = supabase.createClient(SB_URL, SB_KEY);

// --- App State ---
let appState = {
    tickets: [],
    customers: [],
    settings: {
        personnel: ["UGUR YAVUZ", "AHMET BALTACI", "UGUR ISIKCEVAHIR", "USER"],
        users_auth: { "USER": { "pass": "1234", "role": "User" } }, // { "NAME": { "pass": "...", "role": "Admin|Muhasebe|User" } }
        sub_services: {
            S1: ["Food and Drink Menu", "Food Menu Only", "Drink Menu Only", "Dessert Menu", "Set Menu", "New Menu"],
            S2: ["Credit Card Setup", "Credit Card Replacement", "Credit Card Cancellation"],
            S3: ["Sales data has been deleted", "Data has been reset"],
            S4: ["Network Issues", "Wi-Fi Setup", "Modem Configuration", "OS Installation", "Virus Removal", "SSD Upgrade", "RAM Upgrade", "Hardware Repair", "Printing Problems", "General Maintenance"],
            S5: ["Other / Unlisted Issue"],
            S6: ["New Till Installation", "Till System Reconfiguration"]
        },
        pricing: { S1_SetMenu: 35.0, S1_Base: 125.0, S1_Hourly: 25.0, S2: 125.0, S3: 125.0, S4: 65.0, S6: 0.0 },
        sheet_url: localStorage.getItem('taskflow_gas_url') || ''
    },
    activeTab: 'dashboard',
    currentInvoiceTab: 'pending',
    currentDataTab: 'all',
    currentUser: '',
    currentUserRole: 'User', // Default role
    editingRecordId: null,
    alertCallback: null
};

// --- Custom Alert System ---
function showAlert(title, message, icon = '🔔', showCancel = false, isPrompt = false, callback = null) {
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;
    document.getElementById('alert-icon').innerText = icon;
    document.getElementById('alert-input').value = '';
    if (showCancel) document.getElementById('alert-btn-cancel').classList.remove('hidden'); else document.getElementById('alert-btn-cancel').classList.add('hidden');
    if (isPrompt) document.getElementById('alert-prompt-container').classList.remove('hidden'); else document.getElementById('alert-prompt-container').classList.add('hidden');
    appState.alertCallback = callback;
    document.getElementById('alert-modal').classList.remove('hidden');
}
function closeAlert(confirm) {
    document.getElementById('alert-modal').classList.add('hidden');
    const inputVal = document.getElementById('alert-input').value;
    if (appState.alertCallback) appState.alertCallback(confirm ? (inputVal || true) : null);
    appState.alertCallback = null;
}

// --- Initialization ---
async function initApp() {
    try {
        const { data: sData } = await sbClient.from('app_settings').select('*');
        if (sData) sData.forEach(s => { if (appState.settings[s.id]) appState.settings[s.id] = s.data; });
        const { data: tData } = await sbClient.from('records').select('*').order('TIMESTAMP', { ascending: false });
        if (tData) {
            appState.tickets = tData.map(r => ({
                id: r.id, dbId: r.ID || r.db_id, crmTicket: r['CRM TICKET'] || r.crm_ticket, timestamp: r.TIMESTAMP || r.timestamp,
                company: r.COMPANY || r.company_name, companyId: r.COMPANY_ID || r.company_id, postcode: r.POSTCODE || r.postcode,
                user: r.USER || r.staff_user, mainService: r['MAIN SERVICE'] || r.service_type, subService: r['SUB SERVICE'] || r.sub_service,
                startTime: r['START TIME'] || r.start_time, endTime: r['END TIME'] || r.end_time, duration: r.DURATION || r.duration,
                price: r.PRICE || r.price, paymentStatus: r['PAYMENT STATUS'] || r.payment_status, description: r.DESCRIPTION || r.description,
                status: r.STATUS || r.status, invoiced: r.invoiced, invoiceDate: r['INV DATE'] || r.invoice_date, invoiceNo: r['INV NO'] || r.invoice_no
            }));
        }
        const { data: cData } = await sbClient.from('customers').select('*').order('COMPANY', { ascending: true });
        if (cData) appState.customers = cData;
        renderAll();
        updateStats();
    } catch (err) { console.error("Init Error:", err); }
}

// --- Navigation ---
function showTab(tabId) {
    appState.activeTab = tabId;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(`section-${tabId}`).classList.add('active');
    document.getElementById(`btn-${tabId}`).classList.add('active');
    
    if (tabId === 'settings') {
        if (appState.currentUserRole !== 'Admin') showSettingsSubTab('account');
        else showSettingsSubTab('pricing');
    }
    
    renderTabContent(tabId);
}

function showInvoiceTab(tabId) {
    appState.currentInvoiceTab = tabId;
    renderInvoicesTable();
}

function showDataSubTab(tabId) {
    appState.currentDataTab = tabId;
    document.querySelectorAll('#section-dataview .sub-nav-link').forEach(btn => {
        btn.style.color = '#64748b'; btn.style.opacity = '0.8'; btn.style.boxShadow = 'none';
    });
    const activeBtn = document.getElementById(`data-btn-${tabId}`);
    if (activeBtn) { activeBtn.style.color = '#111827'; activeBtn.style.opacity = '1'; activeBtn.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }
    renderDataTable();
}

function showSettingsSubTab(tabId) {
    document.querySelectorAll('.settings-pane').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('#section-settings .sub-nav-link').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.color = '#64748b';
        btn.style.boxShadow = 'none';
    });
    const pane = document.getElementById(`set-pane-${tabId}`);
    if (pane) pane.classList.remove('hidden');
    const btn = document.getElementById(`set-btn-${tabId}`);
    if (btn) {
        btn.classList.add('active');
        btn.style.background = 'white';
        btn.style.color = 'var(--primary)';
        btn.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
    }

    if (tabId === 'personnel') renderPersonnelManagement();
    if (tabId === 'services') renderSubServiceManagement();
}

function renderTabContent(tabId) {
    if (tabId === 'dataview') renderDataTable();
    if (tabId === 'customers') renderCustomersTable();
    if (tabId === 'invoices') renderInvoicesTable();
}

// --- Data Table Rendering ---
function renderDataTable() {
    const tbody = document.getElementById('data-table-body');
    const search = document.getElementById('dataview-search').value.toLowerCase();
    const start = document.getElementById('dataview-start-date').value;
    const end = document.getElementById('dataview-end-date').value;
    const payment = document.getElementById('dataview-payment-filter').value;
    
    let filtered = appState.tickets;
    if (appState.currentDataTab !== 'all') filtered = filtered.filter(t => t.mainService === appState.currentDataTab);
    if (payment !== 'all') filtered = filtered.filter(t => t.paymentStatus === payment);
    if (search) filtered = filtered.filter(t => t.company.toLowerCase().includes(search) || t.dbId.toLowerCase().includes(search) || (t.description || '').toLowerCase().includes(search));
    if (start) filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(start));
    if (end) { const dEnd = new Date(end); dEnd.setHours(23,59,59); filtered = filtered.filter(t => new Date(t.timestamp) <= dEnd); }

    const totalRev = filtered.reduce((acc, t) => acc + (parseFloat(t.price) || 0), 0);
    const chargeable = filtered.filter(t => t.paymentStatus === 'Chargeable').length;
    const contract = filtered.filter(t => t.paymentStatus === 'Contract').length;
    
    document.getElementById('dv-stat-total').innerText = filtered.length;
    document.getElementById('dv-stat-revenue').innerText = `£${totalRev.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.getElementById('dv-stat-split').innerText = `${chargeable} Chargeable / ${contract} Contract`;

    ['all', 'S1', 'S2', 'S4', 'S6'].forEach(cat => {
        const count = cat === 'all' ? appState.tickets.length : appState.tickets.filter(t => t.mainService === cat).length;
        const el = document.getElementById(`data-count-${cat}`);
        if (el) el.innerText = count;
    });

    tbody.innerHTML = filtered.map(t => `
        <tr>
            <td>${new Date(t.timestamp).toLocaleDateString()}</td>
            <td><strong style="color:var(--primary)">${t.dbId}</strong></td>
            <td title="${t.postcode}"><strong>${t.company}</strong></td>
            <td><span class="badge" style="background:#f1f5f9; color:#475569;">${t.mainService}</span></td>
            <td><span class="badge ${t.paymentStatus === 'Chargeable' ? 'badge-warning' : 'badge-success'}">${t.paymentStatus}</span></td>
            <td><strong>£${parseFloat(t.price).toFixed(2)}</strong></td>
            <td style="text-align: right;">
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn-icon" onclick="showDetails('${t.id}')" title="View Details" style="background:none; border:none; cursor:pointer; font-size:1.1rem; color:#94a3b8;">👁️</button>
                    <button class="btn-icon" onclick="editInvoice('${t.id}')" title="Edit Record" style="background:none; border:none; cursor:pointer; font-size:1.1rem; color:#94a3b8;">✎</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function exportToCSV() {
    // Collect filtered data from renderDataTable logic
    const search = document.getElementById('dataview-search').value.toLowerCase();
    const start = document.getElementById('dataview-start-date').value;
    const end = document.getElementById('dataview-end-date').value;
    const payment = document.getElementById('dataview-payment-filter').value;
    
    let data = appState.tickets;
    if (appState.currentDataTab !== 'all') data = data.filter(t => t.mainService === appState.currentDataTab);
    if (payment !== 'all') data = data.filter(t => t.paymentStatus === payment);
    if (search) data = data.filter(t => t.company.toLowerCase().includes(search) || t.dbId.toLowerCase().includes(search));
    if (start) data = data.filter(t => new Date(t.timestamp) >= new Date(start));
    if (end) { const dEnd = new Date(end); dEnd.setHours(23,59,59); data = data.filter(t => new Date(t.timestamp) <= dEnd); }

    if (data.length === 0) { showAlert('No Data', 'There are no records to export with current filters.', 'ℹ️'); return; }

    const headers = ["Date", "Record ID", "Company", "Service", "Sub Service", "Price", "Status", "Duration", "Description"];
    const rows = data.map(t => [
        new Date(t.timestamp).toLocaleDateString(),
        t.dbId,
        `"${t.company}"`,
        t.mainService,
        `"${t.subService}"`,
        t.price,
        t.paymentStatus,
        t.duration,
        `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `TaskFlow_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function renderCustomersTable() {
    const tbody = document.getElementById('customers-table-body');
    const search = document.getElementById('customer-search').value.toLowerCase();
    let filtered = appState.customers;
    if (search) filtered = filtered.filter(c => (c['COMPANY'] || '').toLowerCase().includes(search) || (c['CUSTOMER ID'] || '').toLowerCase().includes(search));
    tbody.innerHTML = filtered.map(c => `
        <tr>
            <td style="padding: 16px 20px;"><strong>${c['CUSTOMER ID'] || 'N/A'}</strong></td>
            <td style="padding: 16px 20px;"><strong>${c['COMPANY'] || 'N/A'}</strong></td>
            <td style="padding: 16px 20px;">${c['POSTCODE'] || '0'}</td>
            <td style="padding: 16px 20px;"><span class="badge ${c['SERVICE STATUS'] === 'Contract' ? 'badge-success' : 'badge-warning'}">${c['SERVICE STATUS'] || 'No Contract'}</span></td>
            <td style="padding: 16px 20px; text-align: right;"><button class="btn" onclick="filterByCustomer('${c['COMPANY']}')">History</button></td>
        </tr>
    `).join('');
}

function renderInvoicesTable() {
    const tbody = document.getElementById('invoice-table-body');
    const isPending = appState.currentInvoiceTab === 'pending';
    const search = (document.getElementById('invoice-search')?.value || '').toLowerCase();
    const start = document.getElementById('invoice-start-date')?.value;
    const end = document.getElementById('invoice-end-date')?.value;

    let filtered = appState.tickets.filter(t => t.paymentStatus === 'Chargeable' && (isPending ? !t.invoiced : t.invoiced));
    
    // Apply filters
    if (search) filtered = filtered.filter(t => t.company.toLowerCase().includes(search) || t.dbId.toLowerCase().includes(search) || (t.subService || '').toLowerCase().includes(search));
    if (start) filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(start));
    if (end) { const dEnd = new Date(end); dEnd.setHours(23,59,59); filtered = filtered.filter(t => new Date(t.timestamp) <= dEnd); }

    document.getElementById('count-pending').innerText = appState.tickets.filter(t => !t.invoiced && t.paymentStatus === 'Chargeable').length;
    document.getElementById('count-invoiced').innerText = appState.tickets.filter(t => t.invoiced && t.paymentStatus === 'Chargeable').length;
    
    const canEdit = appState.currentUserRole === 'Admin' || appState.currentUserRole === 'Muhasebe';
    
    tbody.innerHTML = filtered.map(t => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 20px;"><div style="color:#2563eb; font-weight:700;">${t.dbId}</div><div style="color:#64748b; font-size:11px;">${new Date(t.timestamp).toLocaleDateString()}</div></td>
            <td style="padding: 20px;"><div style="font-weight:700;">${t.company}</div><div style="color:#64748b; font-size:11px;">${t.postcode}</div></td>
            <td style="padding: 20px;"><div style="font-weight:700;">${t.subService}</div><div style="color:#64748b; font-size:11px;">${t.mainService}</div></td>
            <td style="padding: 20px;"><strong>£${parseFloat(t.price).toFixed(2)}</strong></td>
            <td style="padding: 20px; text-align: right;"><div style="display: flex; align-items: center; justify-content: flex-end; gap: 12px;">${canEdit ? `<button onclick="editInvoice('${t.id}')" style="background:none; border:none; cursor:pointer; font-size:1.2rem; color:#94a3b8;">✎</button>` : ''}${isPending ? `<button onclick="markAsInvoiced('${t.id}')" style="background:#111827; color:white; padding:10px 20px; border-radius:10px; border:none; font-size:11px; font-weight:700; cursor:pointer;">PROCESS</button>` : `<span class="badge badge-success">INVOICED</span>`}</div></td>
        </tr>
    `).join('');
}

// --- Modal Functions ---
function editInvoice(id) {
    if (appState.currentUserRole === 'User') {
        showAlert('Yetki Yetersiz', 'Fatura düzenleme yetkiniz bulunmamaktadır.', '🚫');
        return;
    }
    const r = appState.tickets.find(t => t.id == id); if (!r) return;
    appState.editingRecordId = id;
    const content = document.getElementById('modal-details-content');
    document.getElementById('modal-title').innerText = "Edit Billing – " + r.dbId;
    document.getElementById('btn-modal-save').classList.remove('hidden');
    
    content.innerHTML = `
        <div style="padding: 1rem;">
            <div class="grid-4" style="opacity: 0.7;">
                <div class="field"><label>Staff</label><input type="text" value="${r.user}" readonly style="background:#f1f5f9;"></div>
                <div class="field"><label>Database ID</label><input type="text" value="${r.dbId}" readonly style="background:#f1f5f9;"></div>
                <div class="field"><label>CRM Ticket</label><input type="text" value="${r.crmTicket || ''}" readonly style="background:#f1f5f9;"></div>
                <div class="field"><label>Timestamp</label><input type="text" value="${new Date(r.timestamp).toLocaleString()}" readonly style="background:#f1f5f9;"></div>
            </div>
            <div class="grid-3 mt-2" style="opacity: 0.7;">
                <div class="field"><label>Customer ID</label><input type="text" value="${r.companyId || ''}" readonly style="background:#f1f5f9;"></div>
                <div class="field"><label>Company</label><input type="text" value="${r.company}" readonly style="background:#f1f5f9;"></div>
                <div class="field"><label>Postcode</label><input type="text" value="${r.postcode || ''}" readonly style="background:#f1f5f9;"></div>
            </div>
            <div class="grid-2 mt-2" style="opacity: 0.7;">
                <div class="field"><label>Category</label><input type="text" value="${r.mainService}" readonly style="background:#f1f5f9;"></div>
                <div class="field"><label>Sub Service</label><input type="text" value="${r.subService}" readonly style="background:#f1f5f9;"></div>
            </div>
            <div class="field mt-2" style="opacity: 0.7;"><label>Work Details</label><textarea readonly style="background:#f1f5f9; min-height:60px;">${r.description || ''}</textarea></div>
            
            <div class="mt-4" style="border-top: 2px solid var(--primary); padding-top: 20px;">
                <p style="font-size:12px; font-weight:800; color:var(--primary); margin-bottom:15px; text-transform:uppercase; letter-spacing:0.05em;">Billing Information (Editable)</p>
                <div class="grid-3">
                    <div class="field"><label>Invoice No</label><input type="text" id="e-inv-no" value="${r.invoiceNo || ''}" placeholder="Enter Inv No..."></div>
                    <div class="field"><label>Invoice Date</label><input type="date" id="e-inv-date" value="${r.invoiceDate || new Date().toISOString().split('T')[0]}"></div>
                    <div class="field"><label>Final Price (£)</label><input type="number" id="e-price" value="${r.price}" step="0.01" style="font-weight:700; color:var(--primary);"></div>
                </div>
                <div class="grid-2 mt-2">
                    <div class="field"><label>Payment Status</label>
                        <select id="e-payment">
                            <option value="Chargeable" ${r.paymentStatus === 'Chargeable' ? 'selected' : ''}>Chargeable</option>
                            <option value="Contract" ${r.paymentStatus === 'Contract' ? 'selected' : ''}>Contract</option>
                            <option value="Free" ${r.paymentStatus === 'Free' ? 'selected' : ''}>Free</option>
                        </select>
                    </div>
                    <div class="field"><label>Process Status</label>
                        <select id="e-invoiced" ${r.invoiced ? 'disabled style="background:#f1f5f9;"' : ''}>
                            <option value="false" ${!r.invoiced ? 'selected' : ''}>Pending</option>
                            <option value="true" ${r.invoiced ? 'selected' : ''}>Invoiced ✅</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('details-modal').classList.remove('hidden');
}

function updateEditSubServices(selected) {
    const main = document.getElementById('e-main-service').value;
    const opts = appState.settings.sub_services[main] || [];
    document.getElementById('e-sub-service').innerHTML = opts.map(o => `<option value="${o}" ${selected === o ? 'selected' : ''}>${o}</option>`).join('');
}
async function saveRecordEdits() {
    const updates = { 
        "INV NO": document.getElementById('e-inv-no').value,
        "INV DATE": document.getElementById('e-inv-date').value,
        PRICE: parseFloat(document.getElementById('e-price').value) || 0,
        "PAYMENT STATUS": document.getElementById('e-payment').value,
        invoiced: document.getElementById('e-invoiced').value === 'true'
    };
    try { 
        await sbClient.from('records').update(updates).eq('id', appState.editingRecordId); 
        closeModal(); 
        initApp(); 
        showAlert('Success', 'Billing information updated!', '✅');
    } catch (err) { showAlert('Error', err.message, '❌'); }
}
function showDetails(id) {
    const r = appState.tickets.find(t => t.id == id); if (!r) return;
    document.getElementById('modal-title').innerText = "Record Details Viewer";
    document.getElementById('btn-modal-save').classList.add('hidden');
    document.getElementById('modal-details-content').innerHTML = `<div style="background:#f8fafc; padding:1.5rem; border-radius:12px; border:1px solid #e2e8f0;"><div class="grid-2" style="gap: 20px;"><div><h4 style="font-size:11px; text-transform:uppercase; color:#64748b; margin-bottom:10px;">Primary Info</h4><div style="margin-bottom:8px;"><strong>ID:</strong> ${r.dbId}</div><div style="margin-bottom:8px;"><strong>Date:</strong> ${new Date(r.timestamp).toLocaleString()}</div><div style="margin-bottom:8px;"><strong>Staff:</strong> ${r.user}</div></div><div><h4 style="font-size:11px; text-transform:uppercase; color:#64748b; margin-bottom:10px;">Customer Info</h4><div style="margin-bottom:8px;"><strong>Company:</strong> ${r.company}</div><div style="margin-bottom:8px;"><strong>Postcode:</strong> ${r.postcode}</div></div></div><hr style="margin:20px 0; border:none; border-top:1px solid #e2e8f0;"><div class="grid-2" style="gap: 20px;"><div><h4 style="font-size:11px; text-transform:uppercase; color:#64748b; margin-bottom:10px;">Work Info</h4><div style="margin-bottom:8px;"><strong>Service:</strong> ${r.mainService}</div><div style="margin-bottom:8px;"><strong>Duration:</strong> ${r.duration} min</div></div><div><h4 style="font-size:11px; text-transform:uppercase; color:#64748b; margin-bottom:10px;">Billing Info</h4><div style="margin-bottom:8px;"><strong>Price:</strong> £${parseFloat(r.price).toFixed(2)}</div><div style="margin-bottom:8px;"><strong>Status:</strong> ${r.paymentStatus}</div><div style="margin-bottom:8px;"><strong>Inv No:</strong> ${r.invoiceNo || 'N/A'}</div></div></div></div>`;
    document.getElementById('details-modal').classList.remove('hidden');
}
function closeModal() { document.getElementById('details-modal').classList.add('hidden'); appState.editingRecordId = null; }

// --- Form Actions ---
async function handleLogin() {
    const user = document.getElementById('login-username').value.trim().toUpperCase();
    const pass = document.getElementById('login-password').value;
    
    if (!user || !pass) { showAlert('Error', 'Please enter username and password.', '❌'); return; }
    
    const auth = appState.settings.users_auth || {};
    let userData = auth[user] || { pass: '1234', role: (user === 'ADMIN' ? 'Admin' : 'User') };
    
    // Special fallback for initial ADMIN login
    if (user === 'ADMIN' && !auth['ADMIN'] && (pass === 'admin' || pass === '1234')) {
        userData = { pass: pass, role: 'Admin' };
    }
    
    const isPersonnel = appState.settings.personnel.some(p => p.toUpperCase() === user);
    
    if ((isPersonnel || user === 'ADMIN') && pass === userData.pass) {
        appState.currentUser = user;
        appState.currentUserRole = userData.role;
        
        document.getElementById('current-user-name').innerText = appState.currentUser;
        if (document.getElementById('login-remember').checked) {
            localStorage.setItem('taskflow_user', appState.currentUser);
        } else {
            localStorage.removeItem('taskflow_user');
        }
        
        document.body.classList.remove('is-logged-out'); document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-nav').classList.remove('hidden'); document.getElementById('main-content').classList.remove('hidden');
        
        // Hide Admin tabs if not Admin
        document.querySelectorAll('.sub-nav-link').forEach(btn => {
            if (btn.id.startsWith('set-btn-') && btn.id !== 'set-btn-account') {
                btn.style.display = (appState.currentUserRole === 'Admin') ? 'flex' : 'none';
            }
        });

        initApp();
    } else {
        showAlert('Access Denied', 'Invalid username or password.', '❌');
    }
}

async function updateAccount() {
    const newName = document.getElementById('acc-new-name').value.trim().toUpperCase();
    const newPass = document.getElementById('acc-new-pass').value.trim();
    const oldName = appState.currentUser;

    if (!newName && !newPass) { showAlert('Info', 'No changes provided.', 'ℹ️'); return; }

    try {
        if (newName && newName !== oldName) {
            appState.settings.personnel = appState.settings.personnel.map(p => p.toUpperCase() === oldName ? newName : p);
            if (appState.settings.users_auth && appState.settings.users_auth[oldName]) {
                appState.settings.users_auth[newName] = appState.settings.users_auth[oldName];
                delete appState.settings.users_auth[oldName];
            }
            appState.currentUser = newName;
            localStorage.setItem('taskflow_user', newName);
            document.getElementById('current-user-name').innerText = newName;
        }

        if (newPass) {
            if (!appState.settings.users_auth) appState.settings.users_auth = {};
            if (!appState.settings.users_auth[appState.currentUser]) appState.settings.users_auth[appState.currentUser] = { role: appState.currentUserRole };
            appState.settings.users_auth[appState.currentUser].pass = newPass;
        }

        await sbClient.from('app_settings').upsert([
            { id: 'personnel', data: appState.settings.personnel },
            { id: 'users_auth', data: appState.settings.users_auth }
        ]);

        showAlert('Success', 'Account updated successfully!', '✅');
        document.getElementById('acc-new-name').value = '';
        document.getElementById('acc-new-pass').value = '';
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function addPersonnel() {
    const name = document.getElementById('new-personnel-name').value.trim().toUpperCase();
    const role = document.getElementById('new-personnel-role').value;
    const pass = document.getElementById('new-personnel-pass').value.trim() || '1234';
    if (!name) return;
    
    if (!appState.settings.personnel.includes(name)) {
        appState.settings.personnel.push(name);
        if (!appState.settings.users_auth) appState.settings.users_auth = {};
        appState.settings.users_auth[name] = { pass: pass, role: role };
        
        try {
            await sbClient.from('app_settings').upsert([
                { id: 'personnel', data: appState.settings.personnel },
                { id: 'users_auth', data: appState.settings.users_auth }
            ]);
            document.getElementById('new-personnel-name').value = '';
            document.getElementById('new-personnel-pass').value = '1234';
            renderPersonnelManagement();
            showAlert('Başarılı', `${name} personeli ${role} yetkisiyle başarıyla veritabanına eklendi!`, '✅');
        } catch (e) { showAlert('Hata', e.message, '❌'); }
    }
}

function renderPersonnelManagement() {
    const container = document.getElementById('personnel-management-list');
    const auth = appState.settings.users_auth || {};
    const personnel = appState.settings.personnel || [];

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Staff Name</th>
                    <th>Role</th>
                    <th>Password</th>
                    <th style="text-align:right;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${personnel.map(name => {
                    const data = auth[name.toUpperCase()] || { pass: '1234', role: 'User' };
                    return `
                        <tr>
                            <td><strong>${name}</strong></td>
                            <td><span class="badge ${data.role === 'Admin' ? 'badge-success' : 'badge-warning'}">${data.role}</span></td>
                            <td><code>${data.pass}</code></td>
                            <td style="text-align:right;">
                                <button class="btn-icon" onclick="resetUserPassword('${name}')" title="Change Password" style="color:var(--primary); margin-right:10px;">🔑</button>
                                ${name !== 'ADMIN' ? `<button class="btn-icon" onclick="deleteUser('${name}')" title="Remove User" style="color:#ef4444;">🗑️</button>` : ''}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

async function resetUserPassword(name) {
    const newPass = prompt(`Enter new password for ${name}:`);
    if (!newPass) return;

    if (!appState.settings.users_auth) appState.settings.users_auth = {};
    if (!appState.settings.users_auth[name.toUpperCase()]) appState.settings.users_auth[name.toUpperCase()] = { role: 'User' };
    
    appState.settings.users_auth[name.toUpperCase()].pass = newPass;

    try {
        await sbClient.from('app_settings').upsert([{ id: 'users_auth', data: appState.settings.users_auth }]);
        renderPersonnelManagement();
        showAlert('Success', `Password for ${name} has been updated.`, '✅');
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function deleteUser(name) {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;

    appState.settings.personnel = appState.settings.personnel.filter(p => p !== name);
    if (appState.settings.users_auth) delete appState.settings.users_auth[name.toUpperCase()];

    try {
        await sbClient.from('app_settings').upsert([
            { id: 'personnel', data: appState.settings.personnel },
            { id: 'users_auth', data: appState.settings.users_auth }
        ]);
        renderPersonnelManagement();
        showAlert('Success', `${name} has been removed.`, '✅');
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

// --- Service Management ---
function renderSubServiceManagement() {
    const select = document.getElementById('manage-service-select');
    const currentVal = select.value;
    
    const categories = appState.settings.sub_services || {};
    
    // Refresh the category selector
    select.innerHTML = Object.keys(categories).sort().map(code => {
        const name = code === 'S1' ? 'MENU UPDATE' : (code === 'S2' ? 'CREDIT CARD' : (code === 'S3' ? 'DATA RESET' : (code === 'S4' ? 'SERVICE' : (code === 'S5' ? 'OTHER' : (code === 'S6' ? 'TILL SETUP' : code)))));
        return `<option value="${code}" ${code === currentVal ? 'selected' : ''}>${code} - ${name}</option>`;
    }).join('');

    const list = document.getElementById('subservice-management-list');
    const opts = categories[select.value] || [];

    list.innerHTML = opts.map(opt => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; border:1px solid #e2e8f0;">
            <span>${opt}</span>
            <button class="btn-icon" onclick="deleteSubService('${select.value}', '${opt}')" style="color:#ef4444;">🗑️</button>
        </div>
    `).join('');
}

async function addMainCategory() {
    const code = document.getElementById('new-cat-code').value.trim().toUpperCase();
    const name = document.getElementById('new-cat-name').value.trim();
    if (!code || !name) { showAlert('Error', 'Code and Name are required.', '❌'); return; }

    if (!appState.settings.sub_services) appState.settings.sub_services = {};
    if (appState.settings.sub_services[code]) { showAlert('Error', 'This category code already exists.', '❌'); return; }

    appState.settings.sub_services[code] = [];
    // We should probably store the mapping of Code -> Name somewhere, but for now we just use the code as key.
    
    try {
        await sbClient.from('app_settings').upsert([{ id: 'sub_services', data: appState.settings.sub_services }]);
        document.getElementById('new-cat-code').value = '';
        document.getElementById('new-cat-name').value = '';
        renderSubServiceManagement();
        showAlert('Success', `Category ${code} added.`, '✅');
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function addSubService() {
    const select = document.getElementById('manage-service-select');
    const name = document.getElementById('new-subservice-name').value.trim();
    if (!name) return;

    if (!appState.settings.sub_services[select.value]) appState.settings.sub_services[select.value] = [];
    appState.settings.sub_services[select.value].push(name);

    try {
        await sbClient.from('app_settings').upsert([{ id: 'sub_services', data: appState.settings.sub_services }]);
        document.getElementById('new-subservice-name').value = '';
        renderSubServiceManagement();
        showAlert('Success', 'Option added.', '✅');
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function deleteSubService(cat, sub) {
    if (!confirm(`Remove ${sub} from ${cat}?`)) return;

    appState.settings.sub_services[cat] = appState.settings.sub_services[cat].filter(s => s !== sub);

    try {
        await sbClient.from('app_settings').upsert([{ id: 'sub_services', data: appState.settings.sub_services }]);
        renderSubServiceManagement();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

function logout() {
    localStorage.removeItem('taskflow_user');
    window.location.reload();
}

function selectCategory(cat) { resetForm(); document.getElementById('f-service-type').value = cat; updateDynamicFields(); toggleMainForm('form'); }
function toggleMainForm(s) { ['dashboard-home', 'dashboard-category-selection', 'dashboard-form-container'].forEach(v => { const el = document.getElementById(v); if (el) el.style.display = 'none'; }); if (s === 'category') document.getElementById('dashboard-category-selection').style.display = 'block'; else if (s === 'form') document.getElementById('dashboard-form-container').style.display = 'block'; else document.getElementById('dashboard-home').style.display = 'block'; }
function updateDynamicFields() {
    const main = document.getElementById('f-service-type').value;
    const opts = appState.settings.sub_services[main] || [];
    document.getElementById('f-sub-service').innerHTML = opts.map(o => `<option value="${o}">${o}</option>`).join('');
    let extra = ''; if (main === 'S2') extra = `<div class="grid-2 mt-2"><div class="field"><label>IKA App</label><select id="f-ika-app"><option>No</option><option>Yes</option></select></div><div class="field"><label>Card Company</label><input type="text" id="f-card-company" placeholder="Dojo etc."></div></div>`;
    document.getElementById('dynamic-fields-container').innerHTML = extra + `<div class="field mt-2"><label>Work Details</label><textarea id="f-desc" style="min-height:80px;"></textarea></div>`;
    calculatePrice();
}
function calculatePrice() {
    const main = document.getElementById('f-service-type').value; const sub = document.getElementById('f-sub-service').value; const dur = parseInt(document.getElementById('f-duration').value) || 0; const p = appState.settings.pricing;
    let price = 0; if (main === 'S1') { if (sub === 'Set Menu') price = p.S1_SetMenu; else { price = p.S1_Base; if (dur > 60) price += Math.ceil((dur - 60) / 60) * p.S1_Hourly; } } else if (p[main]) price = p[main];
    document.getElementById('f-est-price').value = price.toFixed(2); document.getElementById('f-price').value = price.toFixed(2);
}
function calculateDuration() {
    const s = document.getElementById('f-start-time').value; const e = document.getElementById('f-end-time').value;
    if (s && e) { const [sh,sm] = s.split(':').map(Number); const [eh,em] = e.split(':').map(Number); let diff = (eh*60+em) - (sh*60+sm); if (diff < 0) diff += 1440; document.getElementById('f-duration').value = diff; calculatePrice(); }
}
function resetForm() {
    const form = document.getElementById('master-form'); if (form) form.reset();
    const nextId = appState.tickets.length + 1001; document.getElementById('f-db-id').value = `REC-${nextId}`; document.getElementById('f-invoice-no').value = `SRV-${nextId}`;
    document.getElementById('f-timestamp').value = new Date().toLocaleString(); document.getElementById('f-invoice-date').value = new Date().toISOString().split('T')[0];
    
    // Auto-fill logged in user and disable
    document.getElementById('f-user').innerHTML = `<option value="${appState.currentUser}">${appState.currentUser}</option>`;
    document.getElementById('f-user').disabled = true;
    
    updateDynamicFields();
}
document.getElementById('master-form').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = e.target.querySelector('button[type="submit"]'); btn.innerText = 'Saving...'; btn.disabled = true;
    const rec = { 
        ID: document.getElementById('f-db-id').value, 
        crm_ticket: document.getElementById('f-crm-ticket').value, 
        service_number: document.getElementById('f-invoice-no').value, 
        TIMESTAMP: new Date().toISOString(), 
        COMPANY: document.getElementById('f-company').value, 
        POSTCODE: document.getElementById('f-postcode').value, 
        USER: appState.currentUser, // Use logged in user
        "MAIN SERVICE": document.getElementById('f-service-type').value, 
        "SUB SERVICE": document.getElementById('f-sub-service').value, 
        "START TIME": document.getElementById('f-start-time').value, 
        "END TIME": document.getElementById('f-end-time').value, 
        DURATION: parseInt(document.getElementById('f-duration').value), 
        PRICE: parseFloat(document.getElementById('f-price').value), 
        "PAYMENT STATUS": document.getElementById('f-payment-status').value, 
        DESCRIPTION: document.getElementById('f-desc').value, 
        STATUS: 'Logged', 
        invoiced: false 
    };
    try { await sbClient.from('records').insert([rec]); showAlert('Success', 'Record saved!', '✅'); initApp(); toggleMainForm('home'); } catch (err) { showAlert('Error', err.message, '❌'); }
    finally { btn.innerText = 'Process Transaction'; btn.disabled = false; }
});
function updateStats() {
    document.getElementById('stat-pending').innerText = appState.tickets.filter(t => t.status === 'Logged').length;
    document.getElementById('stat-completed').innerText = appState.tickets.filter(t => t.status === 'Completed').length;
    document.getElementById('stat-customers').innerText = appState.customers.length;
}
function autoFillCustomerInfo() {
    const c = appState.customers.find(x => x.COMPANY === document.getElementById('f-company').value);
    if (c) { document.getElementById('f-company-id').value = c['CUSTOMER ID'] || ''; document.getElementById('f-postcode').value = c['POSTCODE'] || ''; }
}
async function markAsInvoiced(id) {
    showAlert('Process Invoice', 'Enter Invoice Number:', '🧾', true, true, async (n) => {
        if (!n) return; try { await sbClient.from('records').update({ invoiced: true, "INV NO": n === true ? `INV-${Date.now()}` : n, "INV DATE": new Date().toISOString().split('T')[0] }).eq('id', id); initApp(); showAlert('Invoiced', 'Record marked as invoiced with current date.', '✅'); } catch (e) { showAlert('Error', e.message, '❌'); }
    });
}
function filterByCustomer(name) { showTab('dataview'); document.getElementById('dataview-search').value = name; renderDataTable(); }
function renderAll() { 
    renderTabContent(appState.activeTab); 
    document.getElementById('vtiger-customer-list').innerHTML = appState.customers.map(c => `<option value="${c.COMPANY}">`).join(''); 
    if (window.lucide) lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => { 
    if (window.lucide) lucide.createIcons();
    const savedUser = localStorage.getItem('taskflow_user');
    if (savedUser) {
        document.getElementById('login-remember').checked = true;
        appState.currentUser = savedUser;
        document.getElementById('current-user-name').innerText = appState.currentUser;
        document.body.classList.remove('is-logged-out'); 
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-nav').classList.remove('hidden'); 
        document.getElementById('main-content').classList.remove('hidden');
        
        initApp().then(() => {
            const auth = appState.settings.users_auth || {};
            const userData = auth[appState.currentUser] || { role: (appState.currentUser === 'ADMIN' ? 'Admin' : 'User') };
            appState.currentUserRole = userData.role;
            
            // Re-apply role-based UI restrictions
            document.querySelectorAll('.sub-nav-link').forEach(btn => {
                if (btn.id.startsWith('set-btn-') && btn.id !== 'set-btn-account') {
                    btn.style.display = (appState.currentUserRole === 'Admin') ? 'flex' : 'none';
                }
            });
        });
    }
});

window.handleLogin = handleLogin; window.logout = logout; window.showTab = showTab; window.showInvoiceTab = showInvoiceTab; window.showDataSubTab = showDataSubTab; window.showSettingsSubTab = showSettingsSubTab; window.toggleMainForm = toggleMainForm;
window.selectCategory = selectCategory; window.updateDynamicFields = updateDynamicFields; window.calculateDuration = calculateDuration; window.calculatePrice = calculatePrice;
window.resetForm = resetForm; window.autoFillCustomerInfo = autoFillCustomerInfo; window.renderDataTable = renderDataTable; window.renderCustomersTable = renderCustomersTable;
window.renderInvoicesTable = renderInvoicesTable; window.editInvoice = editInvoice; window.saveRecordEdits = saveRecordEdits; window.showDetails = showDetails;
window.closeModal = closeModal; window.markAsInvoiced = markAsInvoiced; window.showAlert = showAlert; window.closeAlert = closeAlert; window.filterByCustomer = filterByCustomer; window.exportToCSV = exportToCSV; window.updateEditSubServices = updateEditSubServices; window.updateAccount = updateAccount; window.addPersonnel = addPersonnel;
window.renderPersonnelManagement = renderPersonnelManagement; window.resetUserPassword = resetUserPassword; window.deleteUser = deleteUser;
window.renderSubServiceManagement = renderSubServiceManagement; window.addMainCategory = addMainCategory; window.addSubService = addSubService; window.deleteSubService = deleteSubService;
