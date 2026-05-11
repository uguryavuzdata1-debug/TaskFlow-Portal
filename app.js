// --- Supabase Configuration ---
const SB_URL = 'https://ekjhhjrhfkoiklyxjfpu.supabase.co';
const SB_KEY = 'sb_publishable_hz1a48NHx7c8RPV_RYHfZg_YNvnNOdH';
let sbClient;
try {
    sbClient = supabase.createClient(SB_URL, SB_KEY);
} catch (e) {
    console.error("Supabase could not be initialized. Using offline mode.", e);
    // Robust Mock sbClient to prevent chain-call crashes
    const mockResponse = { data: [], error: null };
    const mockQuery = {
        select: function() { return this; },
        update: function() { return this; },
        upsert: function() { return this; },
        order: function() { return this; },
        eq: function() { return this; },
        then: function(onFullfilled) { 
            return Promise.resolve(mockResponse).then(onFullfilled); 
        }
    };
}
// --- Global Exports (Ensures UI availability even if initApp takes time) ---
window.handleLogin = handleLogin;
window.logout = logout;
window.showTab = showTab;
window.showInvoiceTab = showInvoiceTab;
window.showDataSubTab = showDataSubTab;
window.showSettingsSubTab = showSettingsSubTab;
window.toggleMainForm = toggleMainForm;
window.selectCategory = selectCategory;
window.updateDynamicFields = updateDynamicFields;
window.calculateDuration = calculateDuration;
window.calculatePrice = calculatePrice;
window.resetForm = resetForm;
window.autoFillCustomerInfo = autoFillCustomerInfo;
window.renderDataTable = renderDataTable;
window.renderCustomersTable = renderCustomersTable;
window.renderInvoicesTable = renderInvoicesTable;
window.editInvoice = editInvoice;
window.saveRecordEdits = saveRecordEdits;
window.showDetails = showDetails;
window.closeModal = closeModal;
window.markAsInvoiced = markAsInvoiced;
window.showAlert = showAlert;
window.closeAlert = closeAlert;
window.filterByCustomer = filterByCustomer;
window.exportToCSV = exportToCSV;
window.updateEditSubServices = updateEditSubServices;
window.updateAccount = updateAccount;
window.addPersonnel = addPersonnel;
window.renderPersonnelManagement = renderPersonnelManagement;
window.resetUserPassword = resetUserPassword;
window.deleteUser = deleteUser;
window.renderSubServiceManagement = renderSubServiceManagement;
window.addMainCategory = addMainCategory;
window.addSubService = addSubService;
window.deleteSubService = deleteSubService;
window.updateDataStats = updateDataStats;
window.filterCustomers = filterCustomers;
window.showToast = showToast;
window.renderOSManagement = renderOSManagement;
window.addOS = addOS;
window.deleteOS = deleteOS;
window.renderCCLocalManagement = renderCCLocalManagement;
window.addCCLocal = addCCLocal;
window.deleteCCLocal = deleteCCLocal;
window.renderCardCompanyManagement = renderCardCompanyManagement;
window.addCardCompany = addCardCompany;
window.editCardCompany = editCardCompany;
window.deleteCardCompany = deleteCardCompany;
window.editOS = editOS;
window.editCCLocal = editCCLocal;
window.renderCPUManagement = renderCPUManagement;
window.addCPU = addCPU;
window.editCPU = editCPU;
window.deleteCPU = deleteCPU;
window.renderTillModelManagement = renderTillModelManagement;
window.addTillModel = addTillModel;
window.editTillModel = editTillModel;
window.deleteTillModel = deleteTillModel;

// --- App State ---
let appState = {
    tickets: [],
    customers: [],
    settings: {
        personnel: [],
        users_auth: {}, // Populated from 'users' table
        sub_services: {}, // Populated from 'sub_services' table
        pricing: {}, // Populated from 'services' table
        operating_systems: [], // Populated from 'app_settings'
        cc_local_settings: [], // Populated from 'app_settings'
        card_companies: [], // Populated from 'app_settings'
        till_cpu: [], // Populated from 'app_settings'
        till_models: [], // Populated from 'app_settings'
        sheet_url: ''
    },
    activeTab: 'dashboard',
    currentInvoiceTab: 'pending',
    currentDataTab: 'all',
    currentCustomerFilter: 'all',
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

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s ease-out forwards';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// --- Initialization ---
async function initApp() {
    try {
        // 1. Fetch Users and Roles
        try {
            const { data: userData } = await sbClient.from('users').select('*, permissions(role_name, access_level)');
            if (userData) {
                appState.settings.users_auth = {};
                appState.settings.personnel = [];
                userData.forEach(u => {
                    const role = (u.permissions && u.permissions.role_name) || 'User';
                    const name = u.full_name || u.email || 'UNKNOWN';
                    appState.settings.users_auth[u.email] = {
                        id: u.id,
                        email: u.email,
                        password: u.password,
                        role: role
                    };
                    appState.settings.personnel.push(name);
                });
            }
        } catch (e) { console.error("Error fetching users:", e); }

        // 2. Fetch Services and Pricing
        const serviceIdToName = {};
        try {
            const { data: srvData } = await sbClient.from('services').select('*');
            if (srvData) {
                appState.settings.pricing = {};
                srvData.forEach(s => {
                    serviceIdToName[s.id] = s.name;
                    appState.settings.pricing[s.name] = parseFloat(s.base_price);
                    if (s.name === 'S1') {
                        appState.settings.pricing.S1_Base = parseFloat(s.base_price);
                        appState.settings.pricing.S1_Hourly = parseFloat(s.hourly_price);
                    }
                });
            }
        } catch (e) { console.error("Error fetching services:", e); }

        // 3. Fetch Sub-Services
        try {
            const { data: subData } = await sbClient.from('sub_services').select('*');
            if (subData) {
                appState.settings.sub_services = {};
                subData.forEach(ss => {
                    const main = serviceIdToName[ss.service_id];
                    if (main) {
                        if (!appState.settings.sub_services[main]) appState.settings.sub_services[main] = [];
                        appState.settings.sub_services[main].push(ss.name);
                    }
                });
            }
        } catch (e) { console.error("Error fetching sub-services:", e); }

        // 4. Fetch Records
        try {
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
        } catch (e) { console.error("Error fetching records:", e); }

        // 5. Fetch Vtiger CRM Organizations (Using flexible column names)
        try {
            const { data: cData, error: cError } = await sbClient.from('VtigerCRM_Organizations').select('*');
            if (cError) throw cError;
            if (cData) {
                appState.customers = cData.map(c => ({
                    'CUSTOMER ID': c.company_id || c.Organization_ID || c.id || '',
                    'COMPANY': c.company_name || c.Company_Name || c.company || '',
                    'POSTCODE': c.postcode || c.Postcode || '',
                    'SERVICE STATUS': c.status || c.Status || 'No Contract'
                }));
            }
        } catch (e) { console.error("Error fetching customers:", e); }

        // 6. Fetch App Settings
        try {
            const { data: sData } = await sbClient.from('app_settings').select('*');
            if (sData) {
                sData.forEach(s => {
                    if (s.id === 'S1_SetMenu') appState.settings.pricing.S1_SetMenu = parseFloat(s.data);
                    if (s.id === 'operating_systems') {
                        try {
                            appState.settings.operating_systems = JSON.parse(s.data);
                        } catch (e) {
                            appState.settings.operating_systems = s.data.split(',').map(x => x.trim());
                        }
                    }
                    if (s.id === 'cc_local_settings') {
                        try {
                            appState.settings.cc_local_settings = JSON.parse(s.data);
                        } catch (e) {
                            appState.settings.cc_local_settings = s.data.split(',').map(x => x.trim());
                        }
                    }
                    if (s.id === 'card_companies') {
                        try {
                            appState.settings.card_companies = JSON.parse(s.data);
                        } catch (e) {
                            appState.settings.card_companies = s.data.split(',').map(x => x.trim());
                        }
                    }
                    if (s.id === 'till_cpu') {
                        try {
                            appState.settings.till_cpu = JSON.parse(s.data);
                        } catch (e) {
                            appState.settings.till_cpu = s.data.split(',').map(x => x.trim());
                        }
                    }
                    if (s.id === 'till_models') {
                        try {
                            appState.settings.till_models = JSON.parse(s.data);
                        } catch (e) {
                            appState.settings.till_models = s.data.split(',').map(x => x.trim());
                        }
                    }
                });
            }
        } catch (e) { console.error("Error fetching app settings:", e); }

        renderAll();
        updateDataStats();
    } catch (err) { console.error("Critical Init Error:", err); }
}

// --- Navigation ---
function showTab(tabId) {
    appState.activeTab = tabId;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(`section-${tabId}`).classList.add('active');
    document.getElementById(`btn-${tabId}`).classList.add('active');
    
    if (tabId === 'settings') {
        updateDataStats(); // Update summary cards when settings is shown
        if (appState.currentUserRole !== 'Admin') showSettingsSubTab('account');
        else showSettingsSubTab('pricing');
    }
    
    renderTabContent(tabId);
}

function showInvoiceTab(tabId) {
    appState.currentInvoiceTab = tabId;
    renderInvoicesTable();
}

function filterCustomers(filterId) {
    appState.currentCustomerFilter = filterId;
    renderCustomersTable();
}

function showDataSubTab(tabId) {
    appState.currentDataTab = tabId;
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

    if (tabId === 'stats') updateDataStats(); // Refresh stats when opening stats pane
    if (tabId === 'personnel') renderPersonnelManagement();
    if (tabId === 'services') renderSubServiceManagement();
    if (tabId === 'os') renderOSManagement();
    if (tabId === 'cc_local') renderCCLocalManagement();
    if (tabId === 'card_companies') renderCardCompanyManagement();
    if (tabId === 'cpu') renderCPUManagement();
    if (tabId === 'till_models') renderTillModelManagement();
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

    updateDataStats(filtered);

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

function updateDataStats(filteredData = appState.tickets) {
    const totalRev = filteredData.reduce((acc, t) => acc + (parseFloat(t.price) || 0), 0);
    const chargeable = filteredData.filter(t => t.paymentStatus === 'Chargeable').length;
    const contract = filteredData.filter(t => t.paymentStatus === 'Contract').length;
    
    const dvStatTotal = document.getElementById('dv-stat-total');
    const dvStatRevenue = document.getElementById('dv-stat-revenue');
    const dvStatSplit = document.getElementById('dv-stat-split');

    if (dvStatTotal) dvStatTotal.innerText = filteredData.length;
    if (dvStatRevenue) dvStatRevenue.innerText = `£${totalRev.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    if (dvStatSplit) dvStatSplit.innerText = `${chargeable} Chargeable / ${contract} Contract`;
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

function exportCustomersToCSV() {
    const data = appState.customers;
    if (data.length === 0) { showAlert('No Data', 'Customer database is empty.', 'ℹ️'); return; }

    const headers = ["Customer ID", "Company", "Postcode", "Service Status"];
    const rows = data.map(c => [
        c['CUSTOMER ID'],
        `"${c['COMPANY']}"`,
        c['POSTCODE'],
        c['SERVICE STATUS']
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `TaskFlow_Customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function renderCustomersTable() {
    const tbody = document.getElementById('customers-table-body');
    const search = document.getElementById('customer-search').value.toLowerCase();
    let filtered = appState.customers;
    
    // Apply chips filter
    if (appState.currentCustomerFilter === 'contract') {
        filtered = filtered.filter(c => c['SERVICE STATUS'] === 'Contract');
    } else if (appState.currentCustomerFilter === 'none') {
        filtered = filtered.filter(c => c['SERVICE STATUS'] !== 'Contract');
    }

    if (search) filtered = filtered.filter(c => (c['COMPANY'] || '').toLowerCase().includes(search) || (c['CUSTOMER ID'] || '').toLowerCase().includes(search));
    
    // Update stats
    const statCount = document.getElementById('stat-customers-count');
    if (statCount) statCount.innerText = filtered.length;

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

// Ensure functions are available globally even if script execution fails later
window.handleLogin = handleLogin;
window.showToast = showToast;

async function handleLogin() {
    const user = document.getElementById('login-username').value.trim().toUpperCase();
    const pass = document.getElementById('login-password').value;
    
    if (!user || !pass) { 
        showToast('Please enter username and password.', 'error'); 
        return; 
    }
    
    // Master bypass for ADMIN (Temporary until Auth is fully linked)
    if (user === 'ADMIN' && (pass === 'admin' || pass === '1234')) {
        console.log("Master bypass triggered");
        appState.currentUser = 'ADMIN';
        appState.currentUserRole = 'Admin';
    } else {
        const auth = appState.settings.users_auth || {};
        let userData = auth[user] || auth[user.toLowerCase()] || Object.values(auth).find(u => u.email.toUpperCase() === user);

        if (!userData) {
            console.error("User not found in auth list:", user);
            showToast('User not found.', 'error');
            return;
        }

        if (pass !== userData.password) {
            showToast('Invalid password.', 'error');
            return;
        }
        
        appState.currentUser = userData.email;
        appState.currentUserRole = userData.role;
    }

    if (appState.currentUser) {
        document.getElementById('current-user-name').innerText = appState.currentUser;
        if (document.getElementById('login-remember').checked) {
            localStorage.setItem('taskflow_user', appState.currentUser);
        } else {
            localStorage.removeItem('taskflow_user');
        }
        
        document.body.classList.remove('is-logged-out'); 
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-nav').classList.remove('hidden'); 
        document.getElementById('main-content').classList.remove('hidden');
        
        // Show success toast with greeting
        showToast(`Welcome, ${appState.currentUser}! Login successful.`, 'success');

        // Hide Admin tabs if not Admin
        document.querySelectorAll('.sub-nav-link').forEach(btn => {
            if (btn.id.startsWith('set-btn-') && btn.id !== 'set-btn-account') {
                btn.style.display = (appState.currentUserRole === 'Admin') ? 'flex' : 'none';
            }
        });

        initApp();
    } else {
        showToast('Hatalı şifre. Lütfen tekrar deneyiniz.', 'error');
    }
}

async function updateAccount() {
    const newName = document.getElementById('acc-new-name').value.trim().toUpperCase();
    const oldName = appState.currentUser;
    const userData = appState.settings.users_auth[oldName];

    if (!newName) { showAlert('Info', 'No changes provided.', 'ℹ️'); return; }

    try {
        if (userData && userData.id) {
            await sbClient.from('users').update({ full_name: newName }).eq('id', userData.id);
            appState.currentUser = newName;
            localStorage.setItem('taskflow_user', newName);
            document.getElementById('current-user-name').innerText = newName;
        }

        showAlert('Success', 'Account updated successfully!', '✅');
        document.getElementById('acc-new-name').value = '';
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function addPersonnel() {
    const name = document.getElementById('new-personnel-name').value.trim().toUpperCase();
    const roleName = document.getElementById('new-personnel-role').value;
    const email = document.getElementById('new-personnel-email')?.value || `${name.toLowerCase()}@taskflow.com`;
    
    if (!name) return;
    
    try {
        // 1. Get Role ID
        const { data: roleData } = await sbClient.from('permissions').select('id').eq('role_name', roleName).single();
        if (!roleData) throw new Error('Role not found');

        // 2. Insert User
        const { error } = await sbClient.from('users').insert([{
            email: email,
            full_name: name,
            role_id: roleData.id
        }]);

        if (error) throw error;

        document.getElementById('new-personnel-name').value = '';
        showAlert('Başarılı', `${name} personeli eklendi!`, '✅');
        initApp();
    } catch (e) { showAlert('Hata', e.message, '❌'); }
}

function renderPersonnelManagement() {
    const container = document.getElementById('personnel-management-list');
    const auth = appState.settings.users_auth || {};
    const personnel = Object.keys(auth);

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Staff Name</th>
                    <th>Email / Username</th>
                    <th>Role</th>
                    <th style="text-align:right;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${personnel.map(name => {
                    const data = auth[name];
                    return `
                        <tr>
                            <td><strong>${name}</strong></td>
                            <td><code>${data.email}</code></td>
                            <td><span class="badge ${data.role === 'Admin' ? 'badge-success' : 'badge-warning'}">${data.role}</span></td>
                            <td style="text-align:right;">
                                <button class="btn-icon" onclick="resetUserPassword('${data.id}', '${name}')" title="Change Password" style="color:var(--primary); margin-right:10px;">🔑</button>
                                ${name !== 'ADMIN' ? `<button class="btn-icon" onclick="deleteUser('${data.id}', '${name}')" title="Remove User" style="color:#ef4444;">🗑️</button>` : 'System'}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

async function deleteUser(id, name) {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;

    try {
        await sbClient.from('users').delete().eq('id', id);
        showAlert('Success', `${name} has been removed.`, '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function resetUserPassword(id, name) {
    const newPass = prompt(`Enter new password for ${name}:`);
    if (!newPass) return;

    try {
        // In a real app, you would use Supabase Auth to reset password.
        // For now, we store it in a 'password' field if it exists, or just show success.
        // Note: The 'users' table might need a 'password' column if not using Auth.
        const { error } = await sbClient.from('users').update({ password: newPass }).eq('id', id);
        if (error) throw error;
        
        showAlert('Success', `Password for ${name} has been updated.`, '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function saveSettings() {
    const pS1_Set = parseFloat(document.getElementById('p-S1-SetMenu').value) || 0;
    const pS1_Base = parseFloat(document.getElementById('p-S1-Base').value) || 0;
    const pS1_Hour = parseFloat(document.getElementById('p-S1-Hourly').value) || 0;
    const pS2 = parseFloat(document.getElementById('p-S2').value) || 0;
    const pS3 = parseFloat(document.getElementById('p-S3').value) || 0;
    const pS4 = parseFloat(document.getElementById('p-S4').value) || 0;

    try {
        // Update S1
        await sbClient.from('services').update({ base_price: pS1_Base, hourly_price: pS1_Hour }).eq('name', 'S1');
        // Update S2, S3, S4 if they exist in services table
        await sbClient.from('services').update({ base_price: pS2 }).eq('name', 'S2');
        await sbClient.from('services').update({ base_price: pS3 }).eq('name', 'S3');
        await sbClient.from('services').update({ base_price: pS4 }).eq('name', 'S4');

        // Store S1_SetMenu in app_settings or as a special service
        await sbClient.from('app_settings').upsert([{ id: 'S1_SetMenu', data: pS1_Set }]);

        showAlert('Success', 'Pricing updated successfully!', '✅');
        initApp();
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
    const name = document.getElementById('new-cat-code').value.trim().toUpperCase();
    const basePrice = parseFloat(document.getElementById('new-cat-name').value) || 0;
    if (!name) { showAlert('Error', 'Service name is required.', '❌'); return; }

    try {
        await sbClient.from('services').insert([{ name: name, base_price: basePrice }]);
        document.getElementById('new-cat-code').value = '';
        document.getElementById('new-cat-name').value = '';
        showAlert('Success', `Service ${name} added.`, '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function addSubService() {
    const select = document.getElementById('manage-service-select');
    const mainName = select.value;
    const subName = document.getElementById('new-subservice-name').value.trim();
    if (!subName) return;

    try {
        // 1. Get Service ID
        const { data: srv } = await sbClient.from('services').select('id').eq('name', mainName).single();
        if (!srv) throw new Error('Main service not found');

        // 2. Insert Sub-Service
        await sbClient.from('sub_services').insert([{ service_id: srv.id, name: subName }]);

        document.getElementById('new-subservice-name').value = '';
        showAlert('Success', 'Sub-service added.', '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function deleteSubService(cat, sub) {
    if (!confirm(`Remove ${sub} from ${cat}?`)) return;

    try {
        // 1. Get Service ID
        const { data: srv } = await sbClient.from('services').select('id').eq('name', cat).single();
        if (!srv) throw new Error('Main service not found');

        // 2. Delete Sub-Service
        await sbClient.from('sub_services').delete().eq('service_id', srv.id).eq('name', sub);
        
        showAlert('Success', 'Sub-service removed.', '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

function logout() {
    localStorage.removeItem('taskflow_user');
    showToast('Logged out successfully.', 'success');
    setTimeout(() => window.location.reload(), 1000);
}

function selectCategory(cat) { resetForm(); document.getElementById('f-service-type').value = cat; updateDynamicFields(); toggleMainForm('form'); }
function toggleMainForm(s) { ['dashboard-home', 'dashboard-category-selection', 'dashboard-form-container'].forEach(v => { const el = document.getElementById(v); if (el) el.style.display = 'none'; }); if (s === 'category') document.getElementById('dashboard-category-selection').style.display = 'block'; else if (s === 'form') document.getElementById('dashboard-form-container').style.display = 'block'; else document.getElementById('dashboard-home').style.display = 'block'; }
function updateDynamicFields() {
    const main = document.getElementById('f-service-type').value;
    const opts = appState.settings.sub_services[main] || [];
    document.getElementById('f-sub-service').innerHTML = opts.map(o => `<option value="${o}">${o}</option>`).join('');
    
    let extra = ''; 
    if (main === 'S2') {
        extra = `
            <div class="grid-3 mt-2" style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px dashed #cbd5e1;">
                <div class="field">
                    <label>IKA App <span style="color:red">*</span></label>
                    <select id="f-ika-app">
                        <option value="">Select option</option>
                        <option>No</option>
                        <option>Yes</option>
                    </select>
                </div>
                <div class="field">
                    <label>Card Company <span style="color:red">*</span></label>
                    <select id="f-card-company">
                        <option value="">Select company</option>
                        ${(appState.settings.card_companies || []).map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                </div>
                <div class="field">
                    <label>Local Settings <span style="color:red">*</span></label>
                    <select id="f-local-settings">
                        <option value="">Select settings</option>
                        ${(appState.settings.cc_local_settings || []).map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="grid-3 mt-2" style="background: #f8fafc; padding: 20px; border-radius: 0 0 12px 12px; border: 1px dashed #cbd5e1; border-top: none;">
                <div class="field">
                    <label>Merchant ID (MID) <span style="color:red">*</span></label>
                    <input type="text" id="f-mid" placeholder="Enter MID">
                </div>
                <div class="field">
                    <label>Terminal ID (TID) <span style="color:red">*</span></label>
                    <input type="text" id="f-tid" placeholder="Enter TID">
                </div>
                <div class="field">
                    <label>Card Setup Number <span style="color:red">*</span></label>
                    <input type="text" id="f-setup-number" placeholder="Enter number">
                </div>
            </div>`;
    } else if (main === 'S6') {
        const staffOptions = (appState.settings.personnel || []).map(name => `<option value="${name}">${name}</option>`).join('');
        extra = `
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px dashed #1b4376; margin-top: 15px;">
                <div class="grid-4">
                    <div class="field"><label>Quote No. <span style="color:red">*</span></label><input type="text" id="f-s6-quote" placeholder="CRM Quote#"></div>
                    <div class="field"><label>System Type <span style="color:red">*</span></label><select id="f-s6-type"><option value="">Select type</option><option>New System</option><option>Used System</option><option>Relocation</option></select></div>
                    <div class="field"><label>Till Model <span style="color:red">*</span></label><select id="f-s6-model">
                        <option value="">Select Model</option>
                        ${(appState.settings.till_models || []).map(m => `<option value="${m}">${m}</option>`).join('')}
                    </select></div>
                    <div class="field"><label>CPU <span style="color:red">*</span></label><select id="f-s6-cpu">
                        <option value="">Select CPU</option>
                        ${(appState.settings.till_cpu || []).map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select></div>
                </div>
                <div class="grid-3 mt-2">
                    <div class="field"><label>OS Version <span style="color:red">*</span></label><select id="f-s6-os">
                        <option value="">Select OS</option>
                        ${(appState.settings.operating_systems || []).map(os => `<option value="${os}">${os}</option>`).join('')}
                    </select></div>
                    <div class="field"><label>App Version <span style="color:red">*</span></label><input type="text" id="f-s6-app-ver" placeholder="e.g. v2.4.5"></div>
                    <div class="field"><label>Sector <span style="color:red">*</span></label><select id="f-s6-sector"><option value="">Select sector</option><option>Hospitality</option><option>Retail</option><option>Quick Service</option></select></div>
                    <div class="field"><label>Service Option <span style="color:red">*</span></label><select id="f-s6-option"><option value="">Select option</option><option>Full Setup</option><option>Hardware Only</option><option>Software Only</option></select></div>
                </div>
                <div class="grid-3 mt-2">
                    <div class="field"><label>Till Programmer <span style="color:red">*</span></label><select id="f-s6-prog-till">${staffOptions}</select></div>
                    <div class="field"><label>Image Programmer <span style="color:red">*</span></label><select id="f-s6-prog-img">${staffOptions}</select></div>
                    <div class="field"><label>Menu Programmer <span style="color:red">*</span></label><select id="f-s6-prog-menu">${staffOptions}</select></div>
                </div>
            </div>`;
    }
    
    document.getElementById('dynamic-fields-container').innerHTML = extra + `
        <div class="field mt-2">
            <label>Work Details</label>
            <textarea id="f-desc" style="min-height:80px;" placeholder="Describe the work performed..."></textarea>
        </div>`;
    calculatePrice();
}
function calculatePrice() {
    const main = document.getElementById('f-service-type').value; 
    const sub = document.getElementById('f-sub-service').value; 
    const dur = parseInt(document.getElementById('f-duration').value) || 0; 
    const p = appState.settings.pricing || {};
    
    let price = 0; 
    if (main === 'S1') { 
        if (sub === 'Set Menu') {
            price = p.S1_SetMenu || 0;
        } else { 
            price = p.S1_Base || 0; 
            if (dur > 60) price += Math.ceil((dur - 60) / 60) * (p.S1_Hourly || 0); 
        } 
    } else if (p[main]) {
        price = p[main];
    }
    
    const estEl = document.getElementById('f-est-price');
    const priceEl = document.getElementById('f-price');
    if (estEl) estEl.value = (price || 0).toFixed(2); 
    if (priceEl) priceEl.value = (price || 0).toFixed(2);
}
function calculateDuration() {
    const s = document.getElementById('f-start-time').value; const e = document.getElementById('f-end-time').value;
    if (s && e) { const [sh,sm] = s.split(':').map(Number); const [eh,em] = e.split(':').map(Number); let diff = (eh*60+em) - (sh*60+sm); if (diff < 0) diff += 1440; document.getElementById('f-duration').value = diff; calculatePrice(); }
}
function autoFillCustomerInfo() {
    const company = document.getElementById('f-company').value;
    const customer = appState.customers.find(c => c.COMPANY === company);
    if (customer) {
        document.getElementById('f-company-id').value = customer['CUSTOMER ID'] || '';
        document.getElementById('f-postcode').value = customer['POSTCODE'] || '';
        document.getElementById('f-status').value = customer['SERVICE STATUS'] || 'No Contract';
        
        // Auto-select payment status if it matches
        if (customer['SERVICE STATUS'] === 'Contract') {
            document.getElementById('f-payment-status').value = 'Contract';
        } else {
            document.getElementById('f-payment-status').value = 'Chargeable';
        }
    }
}

function resetForm() {
    const form = document.getElementById('master-form'); if (form) form.reset();
    const nextId = appState.tickets.length + 1001; 
    document.getElementById('f-db-id').value = `REC-${nextId}`; 
    document.getElementById('f-invoice-no').value = `SRV-${nextId}`;
    document.getElementById('f-timestamp').value = new Date().toLocaleString(); 
    document.getElementById('f-invoice-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('f-status').value = ''; // Clear status field
    
    // Auto-fill logged in user and disable
    document.getElementById('f-user').innerHTML = `<option value="${appState.currentUser}">${appState.currentUser}</option>`;
    document.getElementById('f-user').disabled = true;
    
    updateDynamicFields();
}
document.getElementById('master-form').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = e.target.querySelector('button[type="submit"]'); btn.innerText = 'Saving...'; btn.disabled = true;
    let description = document.getElementById('f-desc').value;
    const main = document.getElementById('f-service-type').value;
    
    // Collect dynamic fields if S2
    if (main === 'S2') {
        const ika = document.getElementById('f-ika-app').value;
        const local = document.getElementById('f-local-settings')?.value || '';
        const mid = document.getElementById('f-mid')?.value || '';
        const tid = document.getElementById('f-tid')?.value || '';
        const setupNum = document.getElementById('f-setup-number')?.value || '';
        const company = document.getElementById('f-card-company')?.value || '';
        description = `[IKA APP: ${ika}] [SETTINGS: ${local}] [MID: ${mid}] [TID: ${tid}] [SETUP #: ${setupNum}] [CARD CO: ${company}]\n\n${description}`;
    } 
    // Collect dynamic fields if S6
    else if (main === 'S6') {
        const quote = document.getElementById('f-s6-quote').value;
        const type = document.getElementById('f-s6-type').value;
        const model = document.getElementById('f-s6-model').value;
        const cpu = document.getElementById('f-s6-cpu').value;
        const os = document.getElementById('f-s6-os').value;
        const appV = document.getElementById('f-s6-app-ver').value;
        const sector = document.getElementById('f-s6-sector').value;
        const opt = document.getElementById('f-s6-option').value;
        const pTill = document.getElementById('f-s6-prog-till').value;
        const pImg = document.getElementById('f-s6-prog-img').value;
        const pMenu = document.getElementById('f-s6-prog-menu').value;

        description = `--- TECHNICAL SPECIFICATIONS (TILL SETUP) ---\n` +
                     `Quote: ${quote} | Type: ${type} | Model: ${model}\n` +
                     `CPU: ${cpu} | OS: ${os} | App Ver: ${appV}\n` +
                     `Sector: ${sector} | Service: ${opt}\n` +
                     `Programmers -> Till: ${pTill}, Image: ${pImg}, Menu: ${pMenu}\n` +
                     `-------------------------------------------\n\n${description}`;
    }

    const rec = { 
        ID: document.getElementById('f-db-id').value, 
        crm_ticket: document.getElementById('f-crm-ticket').value, 
        service_number: document.getElementById('f-invoice-no').value, 
        TIMESTAMP: new Date().toISOString(), 
        COMPANY: document.getElementById('f-company').value, 
        POSTCODE: document.getElementById('f-postcode').value, 
        USER: appState.currentUser,
        "MAIN SERVICE": main, 
        "SUB SERVICE": document.getElementById('f-sub-service').value, 
        "START TIME": document.getElementById('f-start-time').value, 
        "END TIME": document.getElementById('f-end-time').value, 
        DURATION: parseInt(document.getElementById('f-duration').value), 
        PRICE: parseFloat(document.getElementById('f-price').value), 
        "PAYMENT STATUS": document.getElementById('f-payment-status').value, 
        DESCRIPTION: description, 
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

function renderOSManagement() {
    const list = document.getElementById('os-management-list');
    const oss = appState.settings.operating_systems || [];

    list.innerHTML = oss.map(os => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; border:1px solid #e2e8f0;">
            <span style="font-weight: 600;">${os}</span>
            <div style="display:flex; gap:8px;">
                <button class="btn-icon" onclick="editOS('${os}')" style="color:#6366f1;">✏️</button>
                <button class="btn-icon" onclick="deleteOS('${os}')" style="color:#ef4444;">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function editOS(oldName) {
    const newName = prompt(`Edit OS Name:`, oldName);
    if (!newName || newName === oldName) return;

    const newList = (appState.settings.operating_systems || []).map(os => os === oldName ? newName : os);
    try {
        await sbClient.from('app_settings').upsert([{ id: 'operating_systems', data: JSON.stringify(newList) }]);
        showAlert('Success', 'OS updated.', '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function addOS() {
    const name = document.getElementById('new-os-name').value.trim();
    if (!name) return;

    const newList = [...(appState.settings.operating_systems || []), name];
    try {
        await sbClient.from('app_settings').upsert([{ id: 'operating_systems', data: JSON.stringify(newList) }]);
        document.getElementById('new-os-name').value = '';
        showAlert('Success', `${name} added to OS list.`, '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function deleteOS(name) {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;

    const newList = (appState.settings.operating_systems || []).filter(os => os !== name);
    try {
        await sbClient.from('app_settings').upsert([{ id: 'operating_systems', data: JSON.stringify(newList) }]);
        showAlert('Success', `${name} removed from OS list.`, '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

function renderCCLocalManagement() {
    const list = document.getElementById('cc-local-management-list');
    const opts = appState.settings.cc_local_settings || [];

    list.innerHTML = opts.map(opt => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; border:1px solid #e2e8f0;">
            <span style="font-weight: 600;">${opt}</span>
            <div style="display:flex; gap:8px;">
                <button class="btn-icon" onclick="editCCLocal('${opt}')" style="color:#6366f1;">✏️</button>
                <button class="btn-icon" onclick="deleteCCLocal('${opt}')" style="color:#ef4444;">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function editCCLocal(oldName) {
    const newName = prompt(`Edit CC Local Setting:`, oldName);
    if (!newName || newName === oldName) return;

    const newList = (appState.settings.cc_local_settings || []).map(opt => opt === oldName ? newName : opt);
    try {
        await sbClient.from('app_settings').upsert([{ id: 'cc_local_settings', data: JSON.stringify(newList) }]);
        showAlert('Success', 'Settings updated.', '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function addCCLocal() {
    const name = document.getElementById('new-cc-local-name').value.trim();
    if (!name) return;

    const newList = [...(appState.settings.cc_local_settings || []), name];
    try {
        await sbClient.from('app_settings').upsert([{ id: 'cc_local_settings', data: JSON.stringify(newList) }]);
        document.getElementById('new-cc-local-name').value = '';
        showAlert('Success', `${name} added to local settings.`, '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function deleteCCLocal(name) {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;

    const newList = (appState.settings.cc_local_settings || []).filter(opt => opt !== name);
    try {
        await sbClient.from('app_settings').upsert([{ id: 'cc_local_settings', data: JSON.stringify(newList) }]);
        showAlert('Success', `${name} removed from local settings.`, '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

function renderCardCompanyManagement() {
    const list = document.getElementById('card-company-management-list');
    const opts = appState.settings.card_companies || [];

    list.innerHTML = opts.map(opt => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; border:1px solid #e2e8f0;">
            <span style="font-weight: 600;">${opt}</span>
            <div style="display:flex; gap:8px;">
                <button class="btn-icon" onclick="editCardCompany('${opt}')" style="color:#6366f1;">✏️</button>
                <button class="btn-icon" onclick="deleteCardCompany('${opt}')" style="color:#ef4444;">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function editCardCompany(oldName) {
    const newName = prompt(`Edit Card Company:`, oldName);
    if (!newName || newName === oldName) return;

    const newList = (appState.settings.card_companies || []).map(opt => opt === oldName ? newName : opt);
    try {
        await sbClient.from('app_settings').upsert([{ id: 'card_companies', data: JSON.stringify(newList) }]);
        showAlert('Success', 'Company updated.', '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function addCardCompany() {
    const name = document.getElementById('new-card-company-name').value.trim();
    if (!name) return;

    const newList = [...(appState.settings.card_companies || []), name];
    try {
        await sbClient.from('app_settings').upsert([{ id: 'card_companies', data: JSON.stringify(newList) }]);
        document.getElementById('new-card-company-name').value = '';
        showAlert('Success', `${name} added to card companies.`, '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function deleteCardCompany(name) {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;

    const newList = (appState.settings.card_companies || []).filter(opt => opt !== name);
    try {
        await sbClient.from('app_settings').upsert([{ id: 'card_companies', data: JSON.stringify(newList) }]);
        showAlert('Success', `${name} removed from card companies.`, '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

document.addEventListener('DOMContentLoaded', async () => { 
    if (window.lucide) lucide.createIcons();
    
    // Always init app first to get users/settings
    await initApp();

    const savedUser = localStorage.getItem('taskflow_user');
    if (savedUser) {
        document.getElementById('login-remember').checked = true;
        appState.currentUser = savedUser;
        document.getElementById('current-user-name').innerText = appState.currentUser;
        
        const auth = appState.settings.users_auth || {};
        const userData = auth[appState.currentUser] || (appState.currentUser === 'ADMIN' ? { role: 'Admin' } : { role: 'User' });
        appState.currentUserRole = userData.role || (appState.currentUser === 'ADMIN' ? 'Admin' : 'User');

        document.body.classList.remove('is-logged-out'); 
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-nav').classList.remove('hidden'); 
        document.getElementById('main-content').classList.remove('hidden');
        
        // Re-apply role-based UI restrictions
        document.querySelectorAll('.sub-nav-link').forEach(btn => {
            if (btn.id.startsWith('set-btn-') && btn.id !== 'set-btn-account') {
                btn.style.display = (appState.currentUserRole === 'Admin') ? 'flex' : 'none';
            }
        });
    }
});
