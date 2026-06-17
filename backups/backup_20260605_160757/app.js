// --- STATIC SECTOR DICTIONARY ---
// To add new business sectors or modify existing ones, edit this array directly:
const LOCAL_SECTORS = ["HOSPITALITY", "RETAIL", "QUICK SERVICE"];

// --- STATIC SYSTEM TYPES DICTIONARY ---
// To add new system types or modify existing ones, edit this array directly:
const LOCAL_SYS_TYPES = ["IKA NEW TILL SYSTEM", "USED OWN SYSTEM", "IKA 2.HAND TILL SYSTEM", "OTHER"];

// --- STATIC PAYMENT METHODS DICTIONARY ---
// To add new payment methods or modify existing ones, edit this array directly:
const LOCAL_PAY_METHODS = ["Cash", "Card", "Bank Transfer", "PayPal"];

// --- STATIC SERVICES DICTIONARY ---
// To add new main service categories or modify existing ones, edit this array directly:
const LOCAL_SERVICES = [
    { name: 'S1', full_name: 'MENU UPDATE' },
    { name: 'S2', full_name: 'CREDIT CARD' },
    { name: 'S3', full_name: 'DATA RESET' },
    { name: 'S4', full_name: 'SERVICE' },
    { name: 'S5', full_name: 'OTHER' },
    { name: 'S6', full_name: 'TILL SETUP' }
];

// --- STATIC SUB-SERVICES DICTIONARY ---
// To add new sub-service options or modify existing ones, edit this object directly:
const LOCAL_SUB_SERVICES = {
    'S1': [
        'Food and Drink Menu',
        'Food Menu Only',
        'Drink Menu Only',
        'Dessert Menu',
        'Set Menu',
        'New Menu'
    ],
    'S2': [
        'Credit Card Setup',
        'Credit Card Replacement',
        'Credit Card Cancellation'
    ],
    'S3': [
        'Sales data has been deleted at the customer’s request',
        'Data has been reset due to a database malfunction'
    ],
    'S4': [
        'Network Connectivity Issues',
        'Wi-Fi Setup / Troubleshooting',
        'Modem / Router Configuration',
        'Operating System Installation',
        'Virus Removal / Performance Issues',
        'SSD Replacement / Upgrade',
        'RAM Upgrade',
        'Part Replacement (Screen, Keyboard, Battery, etc.)',
        'Printing Problems',
        'Printer Installation',
        'General Maintenance',
        'Various'
    ],
    'S5': [
        'Other / Unlisted Issue'
    ],
    'S6': [
        'Full Setup',
        'Hardware Only',
        'Software Only'
    ]
};

// --- Supabase Configuration ---
const SB_URL = 'https://ekjhhjrhfkoiklyxjfpu.supabase.co';
const SB_KEY = 'sb_publishable_hz1a48NHx7c8RPV_RYHfZg_YNvnNOdH';
let appState = {
    tickets: [],
    customers: [],
    settings: {
        personnel: [],
        users_auth: {}, 
        sub_services: {}, 
        pricing: {}, 
        operating_systems: [], 
        cc_local_settings: [], 
        card_companies: [], 
        till_cpu: [], 
        till_models: [], 
        sheet_url: ''
    },
    activeTab: 'dashboard',
    currentInvoiceTab: 'all',
    currentDataTab: 'all',
    currentCustomerFilter: 'all',
    currentUser: '',
    currentUserRole: 'User', 
    editingRecordId: null,
    alertCallback: null
};

let sbClient;
try {
    if (typeof supabase === 'undefined') {
        throw new Error("Supabase library not loaded. Check your internet or CDN link.");
    }
    sbClient = supabase.createClient(SB_URL, SB_KEY);
    console.log("[INIT] Supabase connection established.");
} catch (e) {
    console.error("Supabase could not be initialized. Using offline mode.", e);
    showToast("Supabase bağlantısı kurulamadı! Çevrimdışı modda çalışılıyor.", "error");
    // Robust Mock sbClient to prevent chain-call crashes
    const mockResponse = { data: [], error: null };
    const mockQuery = {
        from: function() { return this; },
        select: function() { return this; },
        update: function() { return this; },
        upsert: function() { return this; },
        order: function() { return this; },
        eq: function() { return this; },
        single: function() { return this; },
        then: function(onFullfilled) { 
            return Promise.resolve(mockResponse).then(onFullfilled); 
        }
    };
    sbClient = mockQuery;
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
window.printInvoice = printInvoice;
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


// --- App State Initialized Above ---

// --- Custom Alert System ---
function showAlert(title, message, icon = '🔔', showCancel = false, isPrompt = false, callback = null) {
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;
    
    // Map emojis/symbols to Lucide icons
    let lucideName = 'bell';
    let iconColor = 'var(--primary)';
    if (icon === '🚫') { lucideName = 'shield-alert'; iconColor = '#ef4444'; }
    else if (icon === '✅') { lucideName = 'check-circle'; iconColor = '#10b981'; }
    else if (icon === '❌') { lucideName = 'x-circle'; iconColor = '#ef4444'; }
    else if (icon === '🧾') { lucideName = 'receipt'; iconColor = 'var(--primary)'; }
    
    document.getElementById('alert-icon').innerHTML = `<i data-lucide="${lucideName}" style="width: 48px; height: 48px; color: ${iconColor};"></i>`;
    
    document.getElementById('alert-input').value = '';
    if (showCancel) document.getElementById('alert-btn-cancel').classList.remove('hidden'); else document.getElementById('alert-btn-cancel').classList.add('hidden');
    if (isPrompt) document.getElementById('alert-prompt-container').classList.remove('hidden'); else document.getElementById('alert-prompt-container').classList.add('hidden');
    appState.alertCallback = callback;
    document.getElementById('alert-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
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

// --- Fallback Handlers for Offline or Unconfigured Databases ---
function useDefaultServicesFallback(serviceIdToName) {
    if (!defaultSeeds || !defaultSeeds.services) return;
    appState.settings.services = defaultSeeds.services.map((s, idx) => ({
        id: `srv-${idx}`,
        name: s.name,
        full_name: s.full_name,
        base_price: s.name === 'S1' ? 125.00 : (s.name === 'S2' ? 125.00 : (s.name === 'S3' ? 125.00 : (s.name === 'S4' ? 65.00 : 0.00))),
        hourly_price: s.name === 'S1' ? 25.00 : 0.00
    }));
    appState.settings.pricing = {};
    appState.settings.services.forEach(s => {
        serviceIdToName[s.id] = s.name;
        appState.settings.pricing[s.name] = s.base_price;
        if (s.name === 'S1') {
            appState.settings.pricing.S1_Base = s.base_price;
            appState.settings.pricing.S1_Hourly = s.hourly_price;
            appState.settings.pricing.S1_SetMenu = 35.00;
        }
    });
}

function useDefaultSubServicesFallback() {
    if (!defaultSeeds || !defaultSeeds.sub_services) return;
    appState.settings.sub_services = {};
    defaultSeeds.sub_services.forEach(seed => {
        if (!appState.settings.sub_services[seed.service_name]) {
            appState.settings.sub_services[seed.service_name] = [];
        }
        appState.settings.sub_services[seed.service_name].push(seed.name);
    });
}

// --- Initialization ---
async function initApp() {
    try {
        // 1. Fetch Users and Roles
        try {
            const { data: userData } = await sbClient.from('users').select('*');
            const { data: roleData } = await sbClient.from('permissions').select('*');
            
            if (userData) {
                appState.settings.users_auth = {};
                appState.settings.personnel = [];
                userData.forEach(u => {
                    const roleObj = roleData ? roleData.find(r => r.id === u.role_id) : null;
                    const role = roleObj ? roleObj.role_name : 'User';
                    const name = u.full_name || u.email || 'UNKNOWN';
                    appState.settings.users_auth[u.email] = {
                        id: u.id,
                        email: u.email,
                        password: u.password,
                        role: role,
                        role_id: u.role_id,
                        full_name: u.full_name || name
                    };
                    appState.settings.personnel.push(name);
                });
            }
        } catch (e) { console.error("Error fetching users/roles:", e); }

        // 2. Fetch Services and Pricing
        try {
            const { data: srvData } = await sbClient.from('services').select('*');
            appState.settings.services = LOCAL_SERVICES;
            appState.settings.pricing = {};
            if (srvData && srvData.length > 0) {
                srvData.forEach(s => {
                    const bp = parseFloat(s.base_price);
                    if (!isNaN(bp)) {
                        appState.settings.pricing[s.name] = bp;
                    }
                    if (s.name === 'S1') {
                        const hp = parseFloat(s.hourly_price);
                        if (!isNaN(bp)) appState.settings.pricing.S1_Base = bp;
                        if (!isNaN(hp)) appState.settings.pricing.S1_Hourly = hp;
                    }
                });
            } else {
                console.warn("[INIT] Services table is empty/missing, using local default pricing.");
                LOCAL_SERVICES.forEach(s => {
                    appState.settings.pricing[s.name] = s.name === 'S1' ? 125.00 : (s.name === 'S2' ? 125.00 : (s.name === 'S3' ? 125.00 : (s.name === 'S4' ? 65.00 : 0.00)));
                    if (s.name === 'S1') {
                        appState.settings.pricing.S1_Base = 125.00;
                        appState.settings.pricing.S1_Hourly = 25.00;
                    }
                });
            }
        } catch (e) { 
            console.error("Error fetching services, using default pricing:", e); 
            appState.settings.services = LOCAL_SERVICES;
            appState.settings.pricing = {};
            LOCAL_SERVICES.forEach(s => {
                appState.settings.pricing[s.name] = s.name === 'S1' ? 125.00 : (s.name === 'S2' ? 125.00 : (s.name === 'S3' ? 125.00 : (s.name === 'S4' ? 65.00 : 0.00)));
                if (s.name === 'S1') {
                    appState.settings.pricing.S1_Base = 125.00;
                    appState.settings.pricing.S1_Hourly = 25.00;
                }
            });
        }

        // 3. Set Static Sub-Services
        appState.settings.sub_services = LOCAL_SUB_SERVICES;

        // 4. Fetch Records
        try {
            const { data: recData } = await sbClient.from('records').select('*').order('TIMESTAMP', { ascending: false });
            if (recData && recData.length > 0) {
                appState.tickets = recData.map(r => ({
                    id: r.id, 
                    dbId: (r.ID || r.db_id || r.id || 'N/A').toString().split('-')[0].substring(0, 5).toUpperCase(), 
                    crmTicket: r['CRM TICKET'] || r.crm_ticket || 'N/A', 
                    timestamp: r.TIMESTAMP || r.timestamp || new Date().toISOString(),
                    company: r.COMPANY || r.company_name, 
                    companyId: r.COMPANY_ID || r.company_id, 
                    postcode: r.POSTCODE || r.postcode,
                    user: r.USER || r.staff_user, 
                    mainService: r['MAIN SERVICE'] || r.service_type, 
                    subService: r['SUB SERVICE'] || r.sub_service,
                    startTime: r['START TIME'] || r.start_time, 
                    endTime: r['END TIME'] || r.end_time, 
                    duration: r.DURATION || r.duration,
                    price: r.PRICE || r.price, 
                    paymentStatus: r['PAYMENT STATUS'] || r.payment_status, 
                    description: r.DESCRIPTION || r.description,
                    status: r.STATUS || r.status, 
                    invoiced: r.invoiced === true || !!(r['INV NO'] && r['INV NO'].trim()) || !!(r.invoice_no && r.invoice_no.trim()), 
                    invoiceDate: r['INV DATE'] || r.invoice_date, 
                    invoiceNo: r['INV NO'] || r.invoice_no
                }));
            }
        } catch (e) { console.error("Error fetching records:", e); }

        // 5. Fetch Vtiger CRM Organizations & Service Contracts
        try {
            console.log("[INIT] Fetching customers from Supabase (Paginating)...");
            
            let orgData = [];
            let lastOrgSize = 1000;
            let orgOffset = 0;
            while (lastOrgSize === 1000) {
                const { data, error } = await sbClient.from('VtigerCRM_Organizations')
                    .select('*')
                    .range(orgOffset, orgOffset + 999);
                if (error) {
                    console.error("[INIT] Organizations Error:", error);
                    throw error;
                }
                if (data && data.length > 0) {
                    orgData = orgData.concat(data);
                    lastOrgSize = data.length;
                    orgOffset += 1000;
                } else {
                    break;
                }
            }

            let scData = [];
            let lastScSize = 1000;
            let scOffset = 0;
            while (lastScSize === 1000) {
                const { data, error } = await sbClient.from('VtigerCRM_ServiceContracts')
                    .select('*')
                    .range(scOffset, scOffset + 999);
                if (error) {
                    console.error("[INIT] Contracts Error:", error);
                    throw error;
                }
                if (data && data.length > 0) {
                    scData = scData.concat(data);
                    lastScSize = data.length;
                    scOffset += 1000;
                } else {
                    break;
                }
            }
            
            const contractMap = {};
            if (scData) {
                console.log(`[INIT] Loaded ${scData.length} service contracts.`);
                scData.forEach(sc => {
                    if (sc.organization_id) contractMap[sc.organization_id] = sc.status;
                });
            }

            if (orgData) {
                appState.customers = orgData.map(c => ({
                    'CUSTOMER ID': c.organization_number || c.id || '',
                    'COMPANY': c.organization_name || '',
                    'POSTCODE': c.billing_postal_code || '',
                    'ADDRESS': c.billing_address || '',
                    'CITY': c.billing_city || '',
                    'SERVICE STATUS': (contractMap[c.id] === 'In Progress' || contractMap[c.id] === 'Active') ? 'Contract' : 'No Contract'
                }));
                console.log(`[INIT] Successfully loaded ${appState.customers.length} customers.`);
            } else {
                console.warn("[INIT] No organization data returned.");
            }
        } catch (e) { 
            console.error("Error fetching customers from Supabase:", e);
            showToast("Müşteri verileri yüklenemedi. Lütfen konsolu kontrol edin.", "error");
        }


        // 6. Fetch App Settings (General)
        try {
            const { data: sData } = await sbClient.from('app_settings').select('*');
            if (sData) {
                sData.forEach(s => {
                    if (s.id === 'S1_SetMenu' || s.id === 'Pricing_S1_SetMenu') appState.settings.pricing.S1_SetMenu = parseFloat(s.data);
                    if (s.id === 'sheet_url' || s.id === 'Sheet_URL') appState.settings.sheet_url = s.data;
                });
            }
            if (!appState.settings.pricing.S1_SetMenu) {
                appState.settings.pricing.S1_SetMenu = 35.00;
            }
        } catch (e) { console.error("Error fetching app settings:", e); }

        // 7. Fetch Hardware & Systems (Individual Tables)
        const hwTables = ['operating_systems', 'cc_local_settings', 'card_companies', 'till_cpu', 'till_models'];
        for (const table of hwTables) {
            try {
                const { data, error } = await sbClient.from(table).select('*').order('name', { ascending: true });
                if (error) {
                    if (error.message.includes('not found') || error.code === '42P01') {
                        console.warn(`Table "${table}" is missing in Supabase.`);
                    } else { throw error; }
                }
                if (data && data.length > 0) {
                    appState.settings[table] = data;
                } else {
                    console.log(`Table "${table}" is empty or missing. Falling back to default seed.`);
                    appState.settings[table] = defaultSeeds[table].map((v, idx) => ({ id: idx, name: v }));
                }
            } catch (e) { 
                console.error(`Error fetching ${table}, using defaults:`, e); 
                appState.settings[table] = defaultSeeds[table].map((v, idx) => ({ id: idx, name: v }));
            }
        }
        
        // Auto-seed if empty
        if (await seedDatabaseIfNeeded()) {
            for (const table of hwTables) {
                try {
                    const { data } = await sbClient.from(table).select('*').order('name');
                    if (data && data.length > 0) appState.settings[table] = data;
                } catch (e) {}
            }
        }

        renderAll();
        updateDataStats();

        if (!appState.settings.services || appState.settings.services.length === 0) {
            console.warn("[INIT] No services found. Database might be empty or RLS is blocking access.");
            showToast("Servis listesi boş! Veritabanı boş olabilir veya RLS engelliyor.", "error");
        }
    } catch (err) { console.error("Critical Init Error:", err); }
}


// --- Navigation ---
function showTab(tabId) {
    appState.activeTab = tabId;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById(`section-${tabId}`).classList.add('active');
    document.getElementById(`btn-${tabId}`).classList.add('active');
    if (tabId === 'calendar' && typeof renderCalendar !== 'undefined') renderCalendar();
    if (tabId === 'waiting' && typeof renderWaitingJobs !== 'undefined') renderWaitingJobs();
    
    if (tabId === 'settings') {
        updateDataStats(); // Update summary cards when settings is shown
        if (appState.currentUserRole !== 'Admin') showSettingsSubTab('account');
        else showSettingsSubTab('pricing');
    }
    
    renderTabContent(tabId);
    if (window.lucide) lucide.createIcons();
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
    if (appState.currentUserRole !== 'Admin' && appState.currentUserRole !== 'Accounting') {
        tabId = 'account';
    }

    document.querySelectorAll('.settings-pane').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.sidebar-link').forEach(btn => {
        btn.classList.remove('active');
        if (appState.currentUserRole !== 'Admin' && appState.currentUserRole !== 'Accounting' && btn.id !== 'set-btn-account') {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'flex';
        }
    });

    document.querySelectorAll('.sidebar-group').forEach(grp => {
        if (appState.currentUserRole !== 'Admin' && appState.currentUserRole !== 'Accounting') {
            if (!grp.querySelector('#set-btn-account')) {
                grp.style.display = 'none';
            }
        } else {
            grp.style.display = 'block';
        }
    });

    const pane = document.getElementById(`set-pane-${tabId}`);
    if (pane) pane.classList.remove('hidden');
    const btn = document.getElementById(`set-btn-${tabId}`);
    if (btn) {
        btn.classList.add('active');
    }

    if (tabId === 'stats') updateDataStats(); 
    if (tabId === 'users') renderPersonnelManagement();
    if (tabId === 'permissions') renderPermissionsManagement();
    if (tabId === 'pricing') renderPricingSettings();
    if (tabId === 'account') renderAccountSettings();
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
    const invStatus = document.getElementById('dataview-invoice-filter')?.value || 'all';
    const isUser = appState.currentUserRole === 'User';
    
    // Toggle header visibility for User role
    const thAmount = document.getElementById('th-dataview-amount');
    if (thAmount) thAmount.style.display = isUser ? 'none' : 'table-cell';

    let filtered = appState.tickets;
    
    // --- Data Scoping: Users only see their own tickets ---
    if (isUser) {
        filtered = filtered.filter(t => t.user === appState.currentUser);
    }

    if (appState.currentDataTab !== 'all') filtered = filtered.filter(t => t.mainService === appState.currentDataTab);
    if (payment !== 'all') filtered = filtered.filter(t => t.paymentStatus === payment);
    if (invStatus === 'pending') filtered = filtered.filter(t => !t.invoiced);
    if (invStatus === 'invoiced') filtered = filtered.filter(t => t.invoiced);
    if (search) filtered = filtered.filter(t => (t.company || '').toLowerCase().includes(search) || (t.dbId || '').toLowerCase().includes(search) || (t.description || '').toLowerCase().includes(search));
    if (start) filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(start));
    if (end) { const dEnd = new Date(end); dEnd.setHours(23,59,59); filtered = filtered.filter(t => new Date(t.timestamp) <= dEnd); }

    updateDataStats();

    tbody.innerHTML = filtered.map(t => `
        <tr style="border-bottom: 1px solid var(--border-color);">
            <td>${new Date(t.timestamp).toLocaleDateString()}</td>
            <td><strong style="color:var(--primary)">${t.dbId}</strong></td>
            <td title="${t.postcode}"><strong>${t.company}</strong></td>
            <td><span class="badge" style="background:#f1f5f9; color:#475569;">${t.mainService}</span></td>
            <td>
                <span class="badge ${t.paymentStatus === 'Chargeable' ? 'badge-warning' : 'badge-success'}">${t.paymentStatus}</span>
                ${!isUser && t.paymentStatus === 'Chargeable' ? (t.invoiced ? '<br><span style="font-size:10px; font-weight:700; color:#10b981; display:inline-flex; align-items:center; gap:4px; margin-top:4px;"><div class="status-dot dot-green" style="margin:0;"></div> INVOICED</span>' : '<br><span style="font-size:10px; font-weight:700; color:#f59e0b; display:inline-flex; align-items:center; gap:4px; margin-top:4px;"><div class="status-dot dot-orange dot-blinking" style="margin:0;"></div> PENDING</span>') : ''}
            </td>
            ${isUser ? '' : `<td><strong>£${parseFloat(t.price).toFixed(2)}</strong></td>`}
            <td style="text-align: right;">
                <div style="display: flex; gap: 10px; justify-content: flex-end; align-items: center;">
                    <button class="btn-icon" onclick="showDetails('${t.id}')" title="View Details" style="background:none; border:none; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; color:#1b4376; width:28px; height:28px; border-radius:50%; transition: background-color 0.2s;"><i data-lucide="eye" style="width: 16px; height: 16px;"></i></button>
                    ${!(isUser && t.invoiced) ? `<button class="btn-icon" onclick="editInvoice('${t.id}')" title="Edit Record" style="background:none; border:none; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; color:#1b4376; width:28px; height:28px; border-radius:50%; transition: background-color 0.2s;"><i data-lucide="edit-3" style="width: 16px; height: 16px;"></i></button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function updateDataStats() {
    let tickets = appState.tickets || [];
    const customers = appState.customers || [];
    const isUser = appState.currentUserRole === 'User';
    
    // --- Data Scoping ---
    if (isUser) {
        tickets = tickets.filter(t => t.user === appState.currentUser);
    }
    
    const pending = tickets.filter(t => t.status !== 'Completed').length;
    const completed = tickets.filter(t => t.status === 'Completed').length;
    const totalRev = tickets.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
    const chargeable = tickets.filter(t => t.paymentStatus === 'Chargeable').length;
    const contract = tickets.filter(t => t.paymentStatus === 'Contract').length;

    const elPending = document.getElementById('stat-pending');
    const elCompleted = document.getElementById('stat-completed');
    const elCustomers = document.getElementById('stat-customers');
    const elTotalRecords = document.getElementById('stat-total-records');
    const elTotalRevenue = document.getElementById('stat-total-revenue');
    const elSplit = document.getElementById('stat-split');

    if (elPending) elPending.innerText = pending;
    if (elCompleted) elCompleted.innerText = completed;
    if (elCustomers) elCustomers.innerText = customers.length;
    if (elTotalRecords) elTotalRecords.innerText = tickets.length;
    if (elTotalRevenue) {
        if (isUser) {
            // Hide revenue entirely for User role
            elTotalRevenue.parentElement.parentElement.style.display = 'none';
        } else {
            elTotalRevenue.parentElement.parentElement.style.display = 'flex';
            elTotalRevenue.innerText = '£' + totalRev.toFixed(2);
        }
    }
    if (elSplit) {
        if (isUser) {
            elSplit.style.display = 'none';
        } else {
            elSplit.style.display = 'block';
            elSplit.innerHTML = `Chargeable: <strong>${chargeable}</strong> &nbsp;|&nbsp; Contract: <strong>${contract}</strong>`;
        }
    }
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
    if (search) data = data.filter(t => (t.company || '').toLowerCase().includes(search) || (t.dbId || '').toLowerCase().includes(search));
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
    
    // Apply display limit
    const limitVal = document.getElementById('customer-limit-filter')?.value || '100';
    const totalFiltered = filtered.length;
    if (limitVal !== 'all') {
        const limit = parseInt(limitVal);
        filtered = filtered.slice(0, limit);
    }

    // Update stats
    const statCount = document.getElementById('stat-customers-count');
    if (statCount) statCount.innerText = limitVal === 'all' ? totalFiltered : `${filtered.length} / ${totalFiltered}`;


    tbody.innerHTML = filtered.map(c => `
        <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 16px 20px;"><strong style="color:var(--primary)">${c['CUSTOMER ID'] || 'N/A'}</strong></td>
            <td style="padding: 16px 20px;"><strong>${c['COMPANY'] || 'N/A'}</strong></td>
            <td style="padding: 16px 20px;">${c['POSTCODE'] || '0'}</td>
            <td style="padding: 16px 20px;"><span class="badge ${c['SERVICE STATUS'] === 'Contract' ? 'badge-success' : 'badge-warning'}" style="${c['SERVICE STATUS'] === 'Contract' ? 'background:#10b981; color:white;' : ''}">${c['SERVICE STATUS'] || 'No Contract'}</span></td>

            <td style="padding: 16px 20px; text-align: right;"><button class="btn" style="background:#f1f5f9; color:#1b4376; border:none; font-weight:700; display:inline-flex; align-items:center; gap:6px;" onclick="filterByCustomer('${c['COMPANY']}')"><i data-lucide="history" style="width: 14px; height: 14px;"></i> History</button></td>
        </tr>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function renderInvoicesTable() {
    const tbody = document.getElementById('invoice-table-body');
    const isPending = appState.currentInvoiceTab === 'pending';
    const search = (document.getElementById('invoice-search')?.value || '').toLowerCase();
    const start = document.getElementById('invoice-start-date')?.value;
    const end = document.getElementById('invoice-end-date')?.value;

    let filtered = appState.tickets.filter(t => t.paymentStatus === 'Chargeable');
    if (appState.currentUserRole === 'User') {
        filtered = filtered.filter(t => t.user === appState.currentUser);
    }

    if (appState.currentInvoiceTab === 'pending') {
        filtered = filtered.filter(t => !t.invoiced);
    } else if (appState.currentInvoiceTab === 'invoiced') {
        filtered = filtered.filter(t => t.invoiced);
    }
    
    // Apply filters
    if (search) filtered = filtered.filter(t => (t.company || '').toLowerCase().includes(search) || (t.dbId || '').toLowerCase().includes(search) || (t.subService || '').toLowerCase().includes(search));
    if (start) filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(start));
    if (end) { const dEnd = new Date(end); dEnd.setHours(23,59,59); filtered = filtered.filter(t => new Date(t.timestamp) <= dEnd); }

    let baseScoped = appState.tickets.filter(t => t.paymentStatus === 'Chargeable');
    if (appState.currentUserRole === 'User') baseScoped = baseScoped.filter(t => t.user === appState.currentUser);

    const elPending = document.getElementById('count-pending');
    if (elPending) elPending.innerText = baseScoped.filter(t => !t.invoiced).length;
    
    const elInvoiced = document.getElementById('count-invoiced');
    if (elInvoiced) elInvoiced.innerText = baseScoped.filter(t => t.invoiced).length;
    
    const canEdit = appState.currentUserRole === 'Admin' || appState.currentUserRole === 'Accounting';
    
    tbody.innerHTML = filtered.map(t => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 20px;"><div style="color:#2563eb; font-weight:700;">${t.dbId}</div><div style="color:#64748b; font-size:11px;">${new Date(t.timestamp).toLocaleDateString()}</div></td>
            <td style="padding: 20px;"><div style="font-weight:700;">${t.company}</div><div style="color:#64748b; font-size:11px;">${t.postcode}</div></td>
            <td style="padding: 20px;"><div style="font-weight:700;">${t.subService}</div><div style="color:#64748b; font-size:11px;">${t.mainService}</div></td>
            <td style="padding: 20px;"><strong>£${parseFloat(t.price).toFixed(2)}</strong></td>
            <td style="padding: 20px; text-align: right;"><div style="display: flex; align-items: center; justify-content: flex-end; gap: 12px;">
                <button onclick="printInvoice('${t.id}')" title="Generate Invoice (Email/PDF)" style="background:none; border:none; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; color:#1e3a8a; width:28px; height:28px; border-radius:50%; transition: background-color 0.2s;"><i data-lucide="mail" style="width: 16px; height: 16px;"></i></button>
                ${canEdit
                    ? t.invoiced
                        ? `<button onclick="showDetails('${t.id}')" title="View Details (Locked – Already Invoiced)" style="background:none; border:none; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; color:#64748b; width:28px; height:28px; border-radius:50%; transition: background-color 0.2s;" title="Record locked – view only"><i data-lucide="eye" style="width: 16px; height: 16px;"></i></button>`
                        : `<button onclick="editInvoice('${t.id}')" title="Edit Billing" style="background:none; border:none; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; color:#94a3b8; width:28px; height:28px; border-radius:50%; transition: background-color 0.2s;"><i data-lucide="edit-3" style="width: 16px; height: 16px;"></i></button>`
                    : `<button onclick="showDetails('${t.id}')" title="View Details" style="background:none; border:none; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; color:#64748b; width:28px; height:28px; border-radius:50%; transition: background-color 0.2s;"><i data-lucide="eye" style="width: 16px; height: 16px;"></i></button>`}
                ${!t.invoiced
                    ? (canEdit ? `<input type="text" placeholder="Enter Inv No..." onchange="quickInvoice('${t.id}', this.value)" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 12px; font-weight: 700; width: 140px; text-align: center; outline: none; background: #fff; color: #1e293b;" title="Press Enter to Save">` : `<span class="badge badge-warning" style="display:inline-flex; align-items:center; gap:4px;"><div class="status-dot dot-orange dot-blinking" style="margin:0;"></div> PENDING</span>`)
                    : `<span class="badge badge-success" style="display:inline-flex; align-items:center; gap:4px;"><div class="status-dot dot-green" style="margin:0;"></div> INVOICED</span>`}
            </div></td>
        </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

// --- Modal Functions ---
function editInvoice(id) {
    const r = appState.tickets.find(t => t.id == id); if (!r) return;
    const isUser = appState.currentUserRole === 'User';
    const isAccounting = appState.currentUserRole === 'Accounting';

    // --- Lock: Invoiced records are read-only ---
    if (r.invoiced) {
        showDetails(id);
        return;
    }

    appState.editingRecordId = id;
    const content = document.getElementById('modal-details-content');
    document.getElementById('modal-title').innerText = isUser ? "Edit Record – " + r.dbId : "Edit Billing & Record – " + r.dbId;
    document.getElementById('btn-modal-save').classList.remove('hidden');
    const cancelBtn = document.getElementById('btn-modal-cancel');
    if (cancelBtn) cancelBtn.classList.add('hidden');

    const serviceOptions = (appState.settings.services || LOCAL_SERVICES)
        .map(s => `<option value="${s.name}" ${s.name === r.mainService ? 'selected' : ''}>${s.full_name || s.name} (${s.name})</option>`)
        .join('');

    content.innerHTML = `
        <div style="padding: 0.5rem; color: #111827; font-family: inherit;">
            <!-- Technician Info Section (Editable) -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <div class="grid-4" style="margin-bottom: 15px; gap: 1rem;">
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Staff</label>
                        <div style="background: #f8fafc; color: #111827; font-weight: 600; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.user}</div>
                    </div>
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Database ID</label>
                        <div style="background: #f8fafc; color: #111827; font-weight: 600; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.dbId}</div>
                    </div>
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">CRM Ticket</label>
                        <input type="text" id="e-crm-ticket" value="${r.crmTicket || ''}" ${isAccounting ? 'disabled' : ''} style="background: ${isAccounting ? '#f8fafc' : '#ffffff'}; color: #111827; font-weight: 600; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; width: 100%; box-sizing: border-box;">
                    </div>
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Timestamp</label>
                        <div style="background: #f8fafc; color: #111827; font-weight: 600; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${new Date(r.timestamp).toLocaleString()}</div>
                    </div>
                </div>
                <div class="grid-3" style="margin-bottom: 15px; gap: 1rem;">
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Customer ID</label>
                        <div style="background: #f8fafc; color: #111827; font-weight: 600; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.companyId || 'N/A'}</div>
                    </div>
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Company</label>
                        <div style="background: #f8fafc; color: #111827; font-weight: 600; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.company}</div>
                    </div>
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Postcode</label>
                        <div style="background: #f8fafc; color: #111827; font-weight: 600; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.postcode || 'N/A'}</div>
                    </div>
                </div>
                <div class="grid-2" style="margin-bottom: 15px; gap: 1rem;">
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Category</label>
                        <div style="background: #f8fafc; color: #111827; font-weight: 600; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${(appState.settings.services || LOCAL_SERVICES).find(x => x.name === r.mainService)?.full_name || r.mainService}</div>
                    </div>
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Sub Service</label>
                        <div style="background: #f8fafc; color: #111827; font-weight: 600; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.subService || 'N/A'}</div>
                    </div>
                </div>
                <div class="field" style="margin-bottom: 15px;">
                    <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Work Details</label>
                    <textarea id="e-description" rows="4" ${isAccounting ? 'disabled' : ''} style="background: ${isAccounting ? '#f8fafc' : '#ffffff'}; color: #334155; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 16px; outline: none; font-size: 13px; font-weight: 500;">${r.description || ''}</textarea>
                </div>
                <div class="grid-3" style="gap: 1rem;">
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Start Time</label>
                        <input type="time" id="e-start-time" value="${r.startTime || ''}" ${isAccounting ? 'disabled' : ''} style="background: ${isAccounting ? '#f8fafc' : '#ffffff'}; color: #111827; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600; width: 100%; box-sizing: border-box;">
                    </div>
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">End Time</label>
                        <input type="time" id="e-end-time" value="${r.endTime || ''}" ${isAccounting ? 'disabled' : ''} style="background: ${isAccounting ? '#f8fafc' : '#ffffff'}; color: #111827; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600; width: 100%; box-sizing: border-box;">
                    </div>
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Duration (min)</label>
                        <div style="background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 600; min-height: 38px; display: flex; align-items: center;">${r.duration || 'N/A'}</div>
                    </div>
                </div>
            </div>
            
            <!-- Billing Information (Restricted) -->
            ${isUser ? `
                <div style="border-top: 1px solid #e2e8f0; padding-top: 1.5rem; opacity: 0.6; pointer-events: none;">
                    <p style="font-size: 12px; font-weight: 800; color: #94a3b8; margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: 0.05em;">Billing Information (Admin Only)</p>
                    <div class="grid-3" style="gap: 1rem; margin-bottom: 1rem; display: none;">
                        <input type="hidden" id="e-price" value="${r.price}">
                        <input type="hidden" id="e-payment" value="${r.paymentStatus}">
                        <input type="hidden" id="e-inv-no" value="${r.invoiceNo || ''}">
                        <input type="hidden" id="e-inv-date" value="${r.invoiceDate || new Date().toISOString().split('T')[0]}">
                        <input type="hidden" id="e-invoiced" value="${r.invoiced ? 'true' : 'false'}">
                    </div>
                </div>
            ` : `
                <div style="border-top: 1px solid #e2e8f0; padding-top: 1.5rem;">
                    <p style="font-size: 12px; font-weight: 800; color: var(--primary); margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: 0.05em;">Billing Information (Editable)</p>
                    <div class="grid-3" style="gap: 1rem; margin-bottom: 1rem;">
                        <div class="field">
                            <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Invoice No</label>
                            <input type="text" id="e-inv-no" value="${r.invoiceNo || ''}" placeholder="Enter Inv No..." oninput="if(this.value.trim() !== '' && document.getElementById('e-payment').value === 'Chargeable') document.getElementById('e-invoiced').value = 'true';" onchange="if(this.value.trim() !== '') { saveRecordEdits(); }" style="background: #ffffff; color: #111827; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600;">
                        </div>
                        <div class="field">
                            <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Invoice Date</label>
                            <input type="date" id="e-inv-date" value="${r.invoiceDate || new Date().toISOString().split('T')[0]}" style="background: #ffffff; color: #111827; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600;">
                        </div>
                        <div class="field">
                            <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Final Price (£)</label>
                            <input type="number" id="e-price" value="${r.price}" step="0.01" style="background: #ffffff; color: var(--primary); border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 700;">
                        </div>
                    </div>
                    <div class="grid-2" style="gap: 1rem;">
                        <div class="field">
                            <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Payment Status</label>
                            <select id="e-payment" onchange="updateInvoiceStatusUI()" style="background: #ffffff url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%2364748b\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'%3e%3cpolyline points=\\'6 9 12 15 18 9\\'%3e%3c/polyline%3e%3c/svg%3e') no-repeat right 12px center; background-size: 14px; color: #111827; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600; cursor: pointer; -webkit-appearance: none; -moz-appearance: none; appearance: none; padding-right: 36px !important;">
                                <option value="Chargeable" ${r.paymentStatus === 'Chargeable' ? 'selected' : ''}>Chargeable</option>
                                <option value="Contract" ${r.paymentStatus === 'Contract' ? 'selected' : ''}>Contract</option>
                                <option value="Free" ${r.paymentStatus === 'Free' ? 'selected' : ''}>Free</option>
                            </select>
                        </div>
                        <div class="field">
                            <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Process Status</label>
                            <select id="e-invoiced" ${r.invoiced ? 'disabled style="background: #f8fafc; color: #94a3b8; border: 1px solid #e2e8f0; cursor: not-allowed;"' : 'style="background: #ffffff; color: #111827; border: 1px solid #cbd5e1; cursor: pointer;"'} style="background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%2364748b\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'%3e%3cpolyline points=\\'6 9 12 15 18 9\\'%3e%3c/polyline%3e%3c/svg%3e'); background-repeat: no-repeat; background-position: right 12px center; background-size: 14px; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600; -webkit-appearance: none; -moz-appearance: none; appearance: none; padding-right: 36px !important;">
                                <option value="false" ${!r.invoiced ? 'selected' : ''}>Pending</option>
                                <option value="true" ${r.invoiced ? 'selected' : ''}>Invoiced ✅</option>
                            </select>
                        </div>
                    </div>
                    <!-- Sync Notice Banner: shows real-time invoicing impact -->
                    <div id="sync-notice" style="margin-top: 1rem; display: none;"></div>
                </div>
            `}
        </div>
    `;
    document.getElementById('details-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
    setTimeout(() => {
        updateEditSubServices(r.subService);
        if (!isUser) updateInvoiceStatusUI();
    }, 50);
}

// --- Real-time Invoice Sync UI Feedback ---
function updateInvoiceStatusUI() {
    const paymentEl = document.getElementById('e-payment');
    const invoicedEl = document.getElementById('e-invoiced');
    const noticeEl = document.getElementById('sync-notice');
    const priceEl = document.getElementById('e-price');
    const invNoEl = document.getElementById('e-inv-no');
    const invDateEl = document.getElementById('e-inv-date');
    if (!paymentEl || !noticeEl) return;

    const status = paymentEl.value;
    const isChargeable = status === 'Chargeable';

    // Toggle invoiced dropdown availability
    if (invoicedEl) {
        if (!isChargeable) {
            invoicedEl.disabled = true;
            invoicedEl.style.setProperty('background', '#f8fafc', 'important');
            invoicedEl.style.color = '#94a3b8';
            invoicedEl.style.cursor = 'not-allowed';
            invoicedEl.value = 'false'; // force reset to pending
        } else {
            invoicedEl.disabled = false;
            invoicedEl.style.removeProperty('background');
            invoicedEl.style.background = '#ffffff';
            invoicedEl.style.color = '#111827';
            invoicedEl.style.cursor = 'pointer';
        }
    }

    // Show/hide sync notice banner
    if (!isChargeable) {
        noticeEl.style.display = 'block';
        noticeEl.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius:10px; padding:12px 16px;">
                <i data-lucide="alert-triangle" style="width:16px; height:16px; color:#f87171; flex-shrink:0;"></i>
                <span style="font-size:12px; color:#fca5a5; font-weight:600;">This record will be <strong style="color:#f87171;">removed from Invoicing</strong> automatically. Status: <strong style="color:#f87171;">${status}</strong> records are not billable.</span>
            </div>`;
        if (window.lucide) lucide.createIcons();
    } else {
        const price = parseFloat(priceEl?.value || 0);
        if (price > 0) {
            noticeEl.style.display = 'block';
            noticeEl.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); border-radius:10px; padding:12px 16px;">
                    <i data-lucide="check-circle" style="width:16px; height:16px; color:#34d399; flex-shrink:0;"></i>
                    <span style="font-size:12px; color:#6ee7b7; font-weight:600;">This record <strong style="color:#34d399;">is visible in Invoicing</strong>. Chargeable with £${price.toFixed(2)}.</span>
                </div>`;
            if (window.lucide) lucide.createIcons();
        } else {
            noticeEl.style.display = 'none';
        }
    }
}
window.updateInvoiceStatusUI = updateInvoiceStatusUI;


function updateEditSubServices(selected) {
    const main = document.getElementById('e-main-service').value;
    const opts = appState.settings.sub_services[main] || [];
    document.getElementById('e-sub-service').innerHTML = opts.map(o => `<option value="${o}" ${selected === o ? 'selected' : ''}>${o}</option>`).join('');
}
async function saveRecordEdits() {
    const newPaymentStatus = document.getElementById('e-payment').value;
    const newPrice = parseFloat(document.getElementById('e-price').value) || 0;
    const newInvNo = document.getElementById('e-inv-no').value;
    const newInvDate = document.getElementById('e-inv-date').value;
    const newStartTime = document.getElementById('e-start-time')?.value || '';
    const newEndTime = document.getElementById('e-end-time')?.value || '';

    const newMainService = document.getElementById('e-main-service')?.value || null;
    const newSubService = document.getElementById('e-sub-service')?.value || null;
    const newDescription = document.getElementById('e-description')?.value || '';
    const newCrmTicket = document.getElementById('e-crm-ticket')?.value || '';

    // --- Synchronization Logic ---
    let newInvoiced;
    const invoicedEl = document.getElementById('e-invoiced');
    if (newPaymentStatus !== 'Chargeable') {
        newInvoiced = false;
    } else {
        if (newInvNo && newInvNo.trim() !== '') {
            newInvoiced = true;
        } else {
            newInvoiced = invoicedEl ? (invoicedEl.value === 'true') : false;
        }
    }

    // Recalculate duration from edited times if both are set
    let newDuration = null;
    if (newStartTime && newEndTime) {
        const [sh, sm] = newStartTime.split(':').map(Number);
        const [eh, em] = newEndTime.split(':').map(Number);
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) diff += 1440;
        newDuration = diff;
    }

    const updates = {
        "INV NO": newInvNo,
        "INV DATE": newInvDate,
        PRICE: newPrice,
        "PAYMENT STATUS": newPaymentStatus,
        invoiced: newInvoiced,
        "START TIME": newStartTime,
        "END TIME": newEndTime,
        ...(newMainService ? { "MAIN SERVICE": newMainService } : {}),
        ...(newSubService ? { "SUB SERVICE": newSubService } : {}),
        ...(newDescription ? { DESCRIPTION: newDescription } : {}),
        "CRM TICKET": newCrmTicket,
        ...(newDuration !== null ? { DURATION: newDuration } : {})
    };

    try {
        await sbClient.from('records').update(updates).eq('id', appState.editingRecordId);

        // --- Optimistic Local State Update ---
        const localTicket = appState.tickets.find(t => t.id == appState.editingRecordId);
        if (localTicket) {
            const wasChargeable = localTicket.paymentStatus === 'Chargeable';
            localTicket.invoiceNo = newInvNo;
            localTicket.invoiceDate = newInvDate;
            localTicket.price = newPrice;
            localTicket.paymentStatus = newPaymentStatus;
            localTicket.invoiced = newInvoiced;
            localTicket.startTime = newStartTime;
            localTicket.endTime = newEndTime;
            if (newMainService) localTicket.mainService = newMainService;
            if (newSubService) localTicket.subService = newSubService;
            if (newDescription !== undefined) localTicket.description = newDescription;
            localTicket.crmTicket = newCrmTicket;
            if (newDuration !== null) localTicket.duration = newDuration;

            let msg = 'Record updated successfully!';
            if (wasChargeable && newPaymentStatus !== 'Chargeable') {
                msg = `Status changed to "${newPaymentStatus}" — record removed from Invoicing tab automatically.`;
            } else if (!wasChargeable && newPaymentStatus === 'Chargeable' && newPrice > 0) {
                msg = `Status changed to "Chargeable" — record is now visible in Invoicing tab.`;
            }

            closeModal();
            renderDataTable();
            renderInvoicesTable();
            updateDataStats();
            showAlert('Saved', msg, '✅');
        } else {
            closeModal();
            initApp();
            showAlert('Saved', 'Record updated successfully!', '✅');
        }
    } catch (err) {
        showAlert('Error', err.message, '❌');
    }
}

async function quickInvoice(id, invNo) {
    if (!invNo || invNo.trim() === '') return;
    const r = appState.tickets.find(t => t.id == id);
    if (!r) return;
    
    try {
        const invDate = new Date().toISOString().split('T')[0];
        const updates = {
            "INV NO": invNo.trim(),
            "INV DATE": invDate,
            invoiced: true
        };
        await sbClient.from('records').update(updates).eq('id', id);
        
        r.invoiceNo = invNo.trim();
        r.invoiceDate = invDate;
        r.invoiced = true;
        
        renderInvoicesTable();
        renderDataTable();
        updateDataStats();
        
        showToast('Invoice saved successfully!', 'success');
    } catch (e) {
        showAlert('Error', e.message, '❌');
    }
}
window.quickInvoice = quickInvoice;

function showDetails(id) {
    const r = appState.tickets.find(t => t.id == id); if (!r) return;
    const isUser = appState.currentUserRole === 'User';
    document.getElementById('modal-title').innerText = "Record Details Viewer";
    document.getElementById('btn-modal-save').classList.add('hidden');
    document.getElementById('modal-details-content').innerHTML = `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 16px; font-family: inherit; color: #111827;">
            <!-- Grid Layout for info groups -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <!-- Primary Info -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.25rem; border-radius: 12px;">
                    <h4 style="font-size: 11px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">Primary Info</h4>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 500;">ID:</span> <strong style="color: #111827;">${r.dbId}</strong></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 500;">CRM Ticket:</span> <span style="color: #111827; font-weight: 600;">${r.crmTicket || 'N/A'}</span></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 500;">Date:</span> <span style="color: #111827; font-weight: 600;">${new Date(r.timestamp).toLocaleString()}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 500;">Staff:</span> <span style="color: #111827; font-weight: 600;">${r.user}</span></div>
                </div>
                
                <!-- Customer Info -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.25rem; border-radius: 12px;">
                    <h4 style="font-size: 11px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">Customer Info</h4>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 500;">Company:</span> <strong style="color: #111827;">${r.company}</strong></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 500;">Postcode:</span> <span style="color: #111827; font-weight: 600;">${r.postcode}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 500;">Service Status:</span> <span style="color: #111827; font-weight: 600;">${appState.customers.find(c => c['COMPANY'] === r.company)?.['SERVICE STATUS'] || 'N/A'}</span></div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: ${isUser ? '1fr' : '1fr 1fr'}; gap: 24px; margin-top: 20px;">
                <!-- Work Info -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.25rem; border-radius: 12px;">
                    <h4 style="font-size: 11px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">Work Info</h4>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 500;">Service Category:</span> <strong style="color: #111827;">${(() => { const s = (appState.settings.services || LOCAL_SERVICES).find(x => x.name === r.mainService); return s ? (s.full_name || s.name) + ' (' + r.mainService + ')' : r.mainService; })()}</strong></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 500;">Sub Service:</span> <span style="color: #111827; font-weight: 600;">${r.subService || 'N/A'}</span></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 500;">Start Time:</span> <span style="color: #111827; font-weight: 600;">${r.startTime || 'N/A'}</span></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 500;">End Time:</span> <span style="color: #111827; font-weight: 600;">${r.endTime || 'N/A'}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 500;">Duration:</span> <span style="color: #111827; font-weight: 600;">${r.duration} min</span></div>
                </div>
                
                ${isUser ? '' : `
                <!-- Billing Info -->
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 1.25rem; border-radius: 12px;">
                    <h4 style="font-size: 11px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">Billing Info</h4>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 500;">Price:</span> <strong style="color: #111827;">£${parseFloat(r.price).toFixed(2)}</strong></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 500;">Status:</span> <span style="color: #111827; font-weight: 600;">${r.paymentStatus}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="color: #64748b; font-weight: 500;">Inv No:</span> <span style="color: #111827; font-weight: 600;">${r.invoiceNo || 'N/A'}</span></div>
                </div>
                `}
            </div>
            
            <!-- Work Details -->
            <div style="margin-top: 20px;">
                <h4 style="font-size: 11px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; margin-bottom: 10px;">Work Details / Technical Specs</h4>
                <div style="white-space: pre-wrap; font-size: 13.5px; line-height: 1.6; color: #334155; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; max-height: 250px; overflow-y: auto;">${r.description || 'No work details provided.'}</div>
            </div>
            
            ${!isUser ? `
            <!-- Action Buttons -->
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end;">
                <button onclick="printInvoice('${r.id}')" style="background: #1e3a8a; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(30,58,138,0.3); transition: transform 0.2s;">
                    <i data-lucide="mail" style="width: 18px; height: 18px;"></i> Generate Invoice (Email/PDF)
                </button>
            </div>
            ` : ''}
        </div>
    `;
    document.getElementById('btn-modal-save').classList.add('hidden');
    const cancelBtn = document.getElementById('btn-modal-cancel');
    if (cancelBtn) cancelBtn.classList.add('hidden');
    document.getElementById('details-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function printInvoice(id) {
    const r = appState.tickets.find(t => t.id == id);
    if (!r) return;
    
    const customer = appState.customers.find(c => c['COMPANY'] === r.company);
    const invoiceNo = r.invoiceNo || 'DRAFT-' + Date.now().toString().slice(-6);
    const invoiceDate = r.invoiceDate || new Date().toISOString().split('T')[0];
    const categoryName = (appState.settings.services || LOCAL_SERVICES).find(x => x.name === r.mainService)?.full_name || r.mainService;
    
    // Calculate Valid Until date (e.g. 90 days from invoice date)
    const d = new Date(invoiceDate);
    d.setDate(d.getDate() + 90);
    const validUntilDate = d.toISOString().split('T')[0];

    // Calculate Pricing, VAT, and Discount
    const finalPrice = parseFloat(r.price) || 0;
    const expectedBasePrice = (appState.settings.services || LOCAL_SERVICES).find(x => x.name === r.mainService)?.base_price || 0;
    
    let baseAmount = finalPrice;
    let discountAmt = 0;
    if (expectedBasePrice > finalPrice && expectedBasePrice > 0) {
        baseAmount = expectedBasePrice;
        discountAmt = expectedBasePrice - finalPrice;
    }

    const vatAmt = finalPrice * 0.20;
    const totalDue = finalPrice + vatAmt;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${r.company}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #1f2937; margin: 0; }
        .invoice-container { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 50px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 30px; }
        .logo-area h1 { margin: 0; color: #1e3a8a; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
        .logo-area p { margin: 5px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.5; }
        .invoice-details { text-align: right; }
        .invoice-details h2 { margin: 0 0 10px 0; color: #111827; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
        .invoice-details p { margin: 4px 0; color: #4b5563; font-size: 14px; }
        .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .info-block { width: 45%; }
        .info-block h3 { margin: 0 0 10px 0; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
        .info-block p { margin: 0; font-size: 15px; line-height: 1.6; color: #111827; font-weight: 500; }
        .table-container { margin-bottom: 40px; border-radius: 8px; overflow: hidden; border: 1px solid #cbd5e1; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e3a8a; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; text-align: left; padding: 16px; border-bottom: 2px solid #cbd5e1; font-weight: 700; }
        td { padding: 16px; border-bottom: 1px solid #cbd5e1; color: #1f2937; font-size: 15px; }
        tr:last-child td { border-bottom: none; }
        .totals { width: 50%; margin-left: auto; }
        .totals-row { display: flex; justify-content: space-between; padding: 12px 16px; font-size: 15px; color: #4b5563; }
        .totals-row.total { font-size: 20px; font-weight: 800; color: #1e3a8a; border-top: 2px solid #e5e7eb; margin-top: 8px; padding-top: 16px; }
        .footer { text-align: center; margin-top: 50px; padding-top: 30px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 13px; line-height: 1.6; }
        @media print {
            body { background: white; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .invoice-container { box-shadow: none; padding: 0; max-width: 100%; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Print Button for convenience -->
        <div class="no-print" style="text-align: right; margin-bottom: 30px;">
            <button onclick="window.print()" style="background: #1e3a8a; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px; box-shadow: 0 4px 12px rgba(30,58,138,0.2);">🖨️ Print to PDF / Email</button>
            <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Tip: You can also press Ctrl+A, Ctrl+C to copy this invoice and paste it directly into an email body.</p>
        </div>
        
        <div class="header">
            <div class="logo-area">
                <h1 style="color: #111827;">IKA Epos Ltd</h1>
                <p>Unit B Watkins House Pegamoid Road<br>London N18 2NG<br>Tel: 020 8887 1578<br>www.ikaepos.com &nbsp;|&nbsp; accounts@ikaepos.com &nbsp;|&nbsp; sales@ikaepos.com</p>
            </div>
            <div class="invoice-details">
                <h2>INVOICE</h2>
                <p><strong>Invoice No:</strong> ${invoiceNo}</p>
                <p><strong>Issued:</strong> ${invoiceDate}</p>
                <p><strong>Valid Until:</strong> ${validUntilDate}</p>
                <p style="margin-top: 8px;"><strong>Payment Status:</strong> <span style="display:inline-block; padding: 2px 8px; border-radius: 4px; background: ${r.paymentStatus === 'Chargeable' ? '#fee2e2' : '#dcfce3'}; color: ${r.paymentStatus === 'Chargeable' ? '#991b1b' : '#166534'}; font-weight: 700; font-size: 12px;">${r.paymentStatus}</span></p>
            </div>
        </div>
        
        <div class="info-section">
            <div class="info-block">
                <h3>Billed To</h3>
                <p><strong style="font-size: 18px; color: #111827;">${r.company}</strong><br>
                   <span style="color: #4b5563;">
                   ${customer && customer['ADDRESS'] ? customer['ADDRESS'] + '<br>' : ''}
                   ${customer && customer['CITY'] ? customer['CITY'] + ' ' : ''}${r.postcode || ''}<br>
                   ${customer && customer['CUSTOMER ID'] ? 'Customer ID: ' + customer['CUSTOMER ID'] : ''}
                   </span>
                </p>
            </div>
            <div class="info-block" style="text-align: right;">
                <h3>Service Details</h3>
                <p><span style="color: #4b5563;">CRM Ticket:</span> <strong>${r.crmTicket || 'N/A'}</strong><br>
                   <span style="color: #4b5563;">Assigned Staff:</span> <strong>${r.user}</strong>
                </p>
            </div>
        </div>
        
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Description of Service</th>
                        <th style="text-align: center; width: 15%;">Duration</th>
                        <th style="text-align: right; width: 25%;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong style="display:block; margin-bottom: 6px; color: #111827;">${categoryName}</strong>
                            <span style="color: #64748b; font-size: 14px;">${r.subService || 'General Service and Maintenance'}</span>
                        </td>
                        <td style="text-align: center; font-weight: 500;">${r.duration > 0 ? r.duration + ' min' : '-'}</td>
                        <td style="text-align: right; font-weight: 600;">£${baseAmount.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="totals">
            <div class="totals-row">
                <span>Subtotal</span>
                <span style="font-weight: 600;">£${baseAmount.toFixed(2)}</span>
            </div>
            ${discountAmt > 0 ? `
            <div class="totals-row" style="color: #059669;">
                <span>Discount Applied</span>
                <span style="font-weight: 600;">-£${discountAmt.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="totals-row">
                <span>VAT (20%)</span>
                <span style="font-weight: 600;">£${vatAmt.toFixed(2)}</span>
            </div>
            <div class="totals-row total">
                <span>Total Due</span>
                <span>£${totalDue.toFixed(2)}</span>
            </div>
        </div>
        
        <div class="footer" style="text-align: center; font-size: 11px; line-height: 1.6; color: #4b5563; padding-top: 20px;">
            <p>Unless otherwise agreed in writing by IKA Epos Ltd. all invoices are payable in full on delivery in the currency of the invoice, drawn on a bank based in the U.K or by such other method as is agreed in advance by IKA Epos Ltd. The supply of these goods are subject to our terms and conditions. You can find a copy on www.ikaepos.com.</p>
            <p style="margin-top: 10px; font-size: 12.5px; color: #111827;"><strong>For Bank Transfers:</strong> Natwest Bank &nbsp;|&nbsp; <strong>Sort Code:</strong> 60-16-12 &nbsp;|&nbsp; <strong>Account No:</strong> 77151216</p>
        </div>
    </div>
</body>
</html>`;

    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
}
function closeModal() { document.getElementById('details-modal').classList.add('hidden'); appState.editingRecordId = null; }

// Ensure functions are available globally even if script execution fails later
window.handleLogin = handleLogin;
window.showToast = showToast;

async function handleLogin() {
    if (!appState) {
        console.error("AppState not initialized yet.");
        return;
    }
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
        let userData = auth[user] || auth[user.toLowerCase()] || Object.values(auth).find(u => u.email.toUpperCase() === user || (u.full_name && u.full_name.toUpperCase() === user));

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
        try {
            // Handle "Remember Me"
            const rememberMe = document.getElementById('login-remember').checked;
            if (rememberMe) {
                localStorage.setItem('taskflow_user', appState.currentUser);
            } else {
                localStorage.removeItem('taskflow_user');
            }

            document.body.classList.remove('is-logged-out');
            const ls = document.getElementById('login-screen');
            if (ls) ls.classList.add('hidden');
        
            const mn = document.getElementById('main-nav');
            if (mn) mn.classList.remove('hidden');
            const mc = document.getElementById('main-content');
            if (mc) mc.classList.remove('hidden');
            const un = document.getElementById('current-user-name');
            if (un) un.innerText = appState.currentUser;
            
            showToast(`Welcome, ${appState.currentUser}!`, 'success');
            initApp();
        } catch (e) { console.error(e); document.body.classList.remove('is-logged-out'); }
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
    const nameInput = document.getElementById('new-personnel-name');
    const passInput = document.getElementById('new-personnel-pass');
    const roleSelect = document.getElementById('new-personnel-role');
    
    if (!nameInput || !passInput || !roleSelect) return;

    const name = nameInput.value.trim();
    const pass = passInput.value.trim();
    const roleName = roleSelect.value;
    const email = document.getElementById('new-personnel-email')?.value || `${name.toLowerCase()}@taskflow.com`;
    
    if (!name || !pass) {
        showAlert('Error', 'Please enter a name and password.', '❌');
        return;
    }
    
    try {
        // 1. Get or Create Role ID
        let { data: roleData } = await sbClient.from('permissions').select('id').eq('role_name', roleName).single();
        
        if (!roleData) {
            console.log(`Role ${roleName} not found, creating...`);
            const { data: newRole, error: roleErr } = await sbClient.from('permissions').insert([{ 
                role_name: roleName, 
                access_level: roleName === 'Admin' ? 100 : 10 
            }]).select().single();
            
            if (roleErr) throw roleErr;
            roleData = newRole;
        }

        // 2. Insert User with Password
        const { error } = await sbClient.from('users').insert([{
            email: email,
            full_name: name,
            role_id: roleData.id,
            password: pass
        }]);

        if (error) throw error;

        nameInput.value = '';
        passInput.value = '';
        showAlert('Success', `${name} personnel added!`, '✅');
        initApp();
    } catch (e) { 
        console.error("Personnel Add Error:", e);
        let msg = e.message;
        if (msg.includes('row-level security') || e.code === '42501') {
            msg = `Security Error (RLS): You don't have permission to add personnel. Please check Supabase policies.`;
        }
        showAlert('Error', msg, '❌'); 
    }
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
                ${Object.values(auth).map(data => {
                    const displayName = data.full_name || data.email;
                    return `
                        <tr>
                            <td><strong>${displayName}</strong></td>
                            <td><code>${data.email}</code></td>
                            <td><span class="badge ${data.role === 'Admin' ? 'badge-success' : 'badge-warning'}">${data.role}</span></td>
                            <td style="text-align:right;">
                                <button class="btn-icon" onclick="resetUserPassword('${data.id}', '${data.email}')" title="Change Password" style="color:var(--primary); margin-right:10px;">🔑</button>
                                ${data.email.toUpperCase() !== 'ADMIN' ? `<button class="btn-icon" onclick="deleteUser('${data.id}', '${displayName}')" title="Remove User" style="color:#ef4444;">🗑️</button>` : 'System'}
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
        await sbClient.from('app_settings').upsert([
            { id: 'S1_SetMenu', data: pS1_Set },
            { id: 'Pricing_S1_SetMenu', data: pS1_Set }
        ]);

        showAlert('Success', 'Pricing updated successfully!', '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}



function logout() {
    localStorage.removeItem('taskflow_user');
    showToast('Logged out successfully.', 'success');
    setTimeout(() => window.location.reload(), 1000);
}

function selectCategory(cat) { 
    resetForm(); 
    const el = document.getElementById('f-service-type');
    if (el) {
        // Ensure the option exists before selecting
        const exists = Array.from(el.options).some(opt => opt.value === cat);
        if (!exists) {
            const srv = (appState.settings.services || []).find(s => s.name === cat);
            if (srv) {
                const opt = document.createElement('option');
                opt.value = srv.name;
                opt.text = srv.full_name || srv.name;
                el.add(opt);
            }
        }
        el.value = cat; 
        el.disabled = true; // Lock the category when coming from a tile
    }
    updateDynamicFields(); 
    toggleMainForm('form'); 
}

function toggleMainForm(s) { ['dashboard-home', 'dashboard-category-selection', 'dashboard-form-container'].forEach(v => { const el = document.getElementById(v); if (el) el.style.display = 'none'; }); if (s === 'category') document.getElementById('dashboard-category-selection').style.display = 'block'; else if (s === 'form') document.getElementById('dashboard-form-container').style.display = 'block'; else document.getElementById('dashboard-home').style.display = 'block'; }
function updateDynamicFields() {
    const mainSelect = document.getElementById('f-service-type');
    if (!mainSelect) return;
    
    const main = mainSelect.value;
    const opts = (appState.settings.sub_services || {})[main] || [];
    
    const subSelect = document.getElementById('f-sub-service');
    if (subSelect) {
        subSelect.innerHTML = opts.map(o => `<option value="${o}">${o}</option>`).join('');
    }
    
    let extra = ''; 
    if (main === 'S1') {
        extra = `
            <div style="background: #f8fafc; padding: 15px 25px; border-radius: 12px; border: 1px dashed #cbd5e1; margin-top: 20px; margin-bottom: 25px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600; color: #1e293b;">
                    <input type="checkbox" id="f-s1-no-appointment" onchange="calculatePrice()" style="width: 18px; height: 18px; cursor: pointer;">
                    <span>Urgent / No Prior Appointment (+£25.00 Service Fee)</span>
                </label>
            </div>`;
    } else if (main === 'S2') {
        extra = `
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px dashed #cbd5e1; margin-top: 20px; margin-bottom: 25px;">
                <div class="grid-3">
                    <div class="field">
                        <label>IKA App <span style="color:red">*</span></label>
                        <select id="f-ika-app">
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                        </select>
                    </div>
                    <div class="field">
                        <label>Card Company <span style="color:red">*</span></label>
                        <select id="f-card-company">
                            <option value="">Select company</option>
                            ${(appState.settings.card_companies || []).map(opt => `<option value="${opt.name}">${opt.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="field">
                        <label>Local Settings <span style="color:red">*</span></label>
                        <select id="f-local-settings" onchange="handleLocalSettingsChange(this)">
                            <option value="">Select settings</option>
                            ${(appState.settings.cc_local_settings || []).map(opt => `<option value="${opt.name}">${opt.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="grid-2" style="margin-top: 20px;">
                    <div class="field">
                        <label>Sector <span style="color:red">*</span></label>
                        <select id="f-s2-sector">
                            <option value="">Select sector</option>
                            ${LOCAL_SECTORS.map(sec => `<option value="${sec}">${sec}</option>`).join('')}
                        </select>
                    </div>
                    <div class="field">
                        <label>Card Setup Number <span style="color:red">*</span></label>
                        <input type="text" id="f-setup-number" placeholder="Enter number">
                    </div>
                </div>
            </div>`;
    } else if (main === 'S6') {
        const staffOptions = (appState.settings.personnel || []).map(name => `<option value="${name}">${name}</option>`).join('');
        extra = `
            <div style="background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px dashed #1b4376; margin-top: 20px; margin-bottom: 25px;">
                <div class="grid-4">
                    <div class="field"><label>Quote No. <span style="color:red">*</span></label><input type="text" id="f-s6-quote" placeholder="CRM Quote#"></div>
                    <div class="field"><label>System Type <span style="color:red">*</span></label><select id="f-s6-type">
                        <option value="">Select type</option>
                        ${LOCAL_SYS_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select></div>
                    <div class="field"><label>Till Model <span style="color:red">*</span></label><select id="f-s6-model">
                        <option value="">Select Model</option>
                        ${(appState.settings.till_models || []).map(m => `<option value="${m.name}">${m.name}</option>`).join('')}
                    </select></div>
                    <div class="field"><label>CPU <span style="color:red">*</span></label><select id="f-s6-cpu">
                        <option value="">Select CPU</option>
                        ${(appState.settings.till_cpu || []).map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                    </select></div>
                </div>
                <div class="grid-4" style="margin-top: 20px;">
                    <div class="field"><label>OS Version <span style="color:red">*</span></label><select id="f-s6-os">
                        <option value="">Select OS</option>
                        ${(appState.settings.operating_systems || []).map(os => `<option value="${os.name}">${os.name}</option>`).join('')}
                    </select></div>
                    <div class="field"><label>App Version <span style="color:red">*</span></label><input type="text" id="f-s6-app-ver" placeholder="e.g. v2.4.5"></div>
                    <div class="field"><label>Sector <span style="color:red">*</span></label><select id="f-s6-sector">
                        <option value="">Select sector</option>
                        ${LOCAL_SECTORS.map(sec => `<option value="${sec}">${sec}</option>`).join('')}
                    </select></div>
                    <div class="field"><label>Service Option <span style="color:red">*</span></label><select id="f-s6-option">
                        <option value="">Select option</option>
                        ${((appState.settings.sub_services || {})['S6'] || []).map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select></div>
                </div>
                <div class="grid-3" style="margin-top: 20px;">
                    <div class="field"><label>Till Programmer <span style="color:red">*</span></label><select id="f-s6-prog-till">${staffOptions}</select></div>
                    <div class="field"><label>Image Programmer <span style="color:red">*</span></label><select id="f-s6-prog-img">${staffOptions}</select></div>
                    <div class="field"><label>Programmers -> Menu <span style="color:red">*</span></label><input type="text" id="f-s6-prog-menu" placeholder="Name"></div>
                </div>
            </div>`;
    }
    
    const container = document.getElementById('dynamic-fields-container');
    if (container) {
        container.innerHTML = extra + `
            <div class="field" style="margin-top: 25px; margin-bottom: 25px;">
                <label>Work Details</label>
                <textarea id="f-desc" style="min-height:90px;" placeholder="Describe the work performed..."></textarea>
            </div>`;
    }
    calculateDuration();
}

function renderServiceSelects() {
    const services = appState.settings.services || [];
    const selects = ['f-service-type', 'dataview-category-filter', 'manage-service-select'];
    
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const current = el.value;
            const options = services.map(s => `<option value="${s.name}">${s.full_name || s.name}</option>`).join('');
            
            if (id === 'dataview-category-filter') {
                el.innerHTML = '<option value="all">ALL CAT</option>' + options;
            } else if (id === 'manage-service-select') {
                el.innerHTML = services.map(s => `<option value="${s.name}">${s.name} - ${s.full_name || s.name}</option>`).join('');
            } else {
                el.innerHTML = options;
            }
            
            if (current) el.value = current;
        }
    });
}

function renderAll() {
    renderServiceSelects();
    renderDataTable();
    renderCustomersTable();
    renderInvoicesTable();
    updateDataStats();
}
function calculatePrice() {
    const main = document.getElementById('f-service-type').value; 
    const sub = document.getElementById('f-sub-service').value; 
    const dur = parseInt(document.getElementById('f-duration').value) || 0; 
    const p = appState.settings.pricing || {};
    
    let price = 0; 
    if (main === 'S1') { 
        const basePrice = p.S1_Base || 125.00;
        const hourlyPrice = p.S1_Hourly || 25.00;
        const setMenuPrice = p.S1_SetMenu || 35.00;

        if (sub === 'Set Menu' || sub === 'Dessert Menu') {
            price = setMenuPrice;
        } else { 
            price = (sub === 'New Menu') ? 250.00 : basePrice; 
            if (dur > 60) price += Math.ceil((dur - 60) / 60) * hourlyPrice; 
        } 
        
        // Add urgent fee if checked
        const urgentCheck = document.getElementById('f-s1-no-appointment');
        if (urgentCheck && urgentCheck.checked) {
            price += 25.00;
        }
    } else if (p[main] !== undefined && p[main] !== 0) {
        price = p[main];
    } else {
        if (main === 'S2') price = 125.00;
        else if (main === 'S3') price = 125.00;
        else if (main === 'S4') price = 65.00;
        else price = 0.00;
    }
    
    const estEl = document.getElementById('f-est-price');
    const finalEl = document.getElementById('f-price');
    const paymentStatus = document.getElementById('f-payment-status')?.value;

    if (estEl) estEl.value = (price || 0).toFixed(2);
    
    if (paymentStatus === 'Chargeable') {
        if (finalEl) finalEl.value = (price || 0).toFixed(2);
    } else {
        if (finalEl) finalEl.value = '0.00';
    }
}

function calculateDuration() {
    const startEl = document.getElementById('f-start-time');
    const endEl   = document.getElementById('f-end-time');
    let s = startEl.value;
    const e = endEl.value;
    
    // Auto-fill start time based on end time ONLY if start time is empty, to allow manual editing
    if (!s && e) {
        const main = document.getElementById('f-service-type')?.value || '';
        const defaultMins = (main === 'S1') ? 30 : 15; // Menu Update = 30 min, others = 15 min
        const [eh, em] = e.split(':').map(Number);
        let totalStart = (eh * 60 + em) - defaultMins;
        if (totalStart < 0) totalStart += 1440;
        const sh = String(Math.floor(totalStart / 60)).padStart(2, '0');
        const sm = String(totalStart % 60).padStart(2, '0');
        startEl.value = `${sh}:${sm}`;
        s = startEl.value;
    }

    if (s && e) {
        const [sh, sm] = s.split(':').map(Number);
        const [eh, em] = e.split(':').map(Number);
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) diff += 1440;
        document.getElementById('f-duration').value = diff;
    } else {
        document.getElementById('f-duration').value = '';
    }
    calculatePrice();
}
function autoFillCustomerInfo() {
    const companyInput = document.getElementById('f-company');
    if (!companyInput) return;
    const company = companyInput.value;
    const customer = (appState.customers || []).find(c => (c.COMPANY || '') === company);
    if (customer) {
        const statusEl = document.getElementById('f-status');
        const paymentEl = document.getElementById('f-payment-status');
        const statusVal = customer['SERVICE STATUS'] || 'No Contract';
        
        document.getElementById('f-company-id').value = customer['CUSTOMER ID'] || '';
        document.getElementById('f-postcode').value = customer['POSTCODE'] || '';
        statusEl.value = statusVal;
        
        // Apply green color if Contract
        if (statusVal === 'Contract') {
            statusEl.style.setProperty('background', '#10b981', 'important');
            statusEl.style.setProperty('color', 'white', 'important');
            statusEl.style.fontWeight = '800';
            
            paymentEl.value = 'Contract';
            paymentEl.style.setProperty('background', '#10b981', 'important');
            paymentEl.style.setProperty('color', 'white', 'important');
            paymentEl.style.fontWeight = '800';
        } else {
            statusEl.style.setProperty('background', '#f8fafc', 'important');
            statusEl.style.setProperty('color', '#111827', 'important');
            statusEl.style.fontWeight = '500';
            
            paymentEl.value = 'Chargeable';
            paymentEl.style.setProperty('background', '#f8fafc', 'important');
            paymentEl.style.setProperty('color', '#111827', 'important');
            paymentEl.style.fontWeight = '500';
        }

    }
}function updatePaymentStyle(el) {
    if (el.value === 'Contract') {
        el.style.setProperty('background', '#10b981', 'important');
        el.style.setProperty('color', 'white', 'important');
        el.style.fontWeight = '800';
    } else {
        el.style.setProperty('background', '#f8fafc', 'important');
        el.style.setProperty('color', '#111827', 'important');
        el.style.fontWeight = '500';
    }

    if (el.value === 'Contract' || el.value === 'Free') {
        const priceInput = document.getElementById('f-price');
        if (priceInput) priceInput.value = '0.00';
    } else {
        const priceInput = document.getElementById('f-price');
        const estPriceInput = document.getElementById('f-est-price');
        if (priceInput && estPriceInput) priceInput.value = estPriceInput.value;
    }
}

function handleLocalSettingsChange(el) {
    const ikaAppSelect = document.getElementById('f-ika-app');
    if (ikaAppSelect) {
        if (el.value.toLowerCase() === 'no-use app') {
            ikaAppSelect.value = 'Yes';
        } else {
            ikaAppSelect.value = 'No';
        }
    }
}

window.handleLocalSettingsChange = handleLocalSettingsChange;
window.updatePaymentStyle = updatePaymentStyle;


function resetForm() {
    const form = document.getElementById('master-form'); if (form) form.reset();
    const nextId = appState.tickets.length + 1001; 
    document.getElementById('f-db-id').value = `REC-${nextId}`; 
    document.getElementById('f-invoice-no').value = `SRV-${nextId}`;
    document.getElementById('f-timestamp').value = new Date().toLocaleString(); 
    document.getElementById('f-invoice-date').value = new Date().toISOString().split('T')[0];
    
    // Set End Time to current local time in HH:MM format
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('f-end-time').value = `${hh}:${mm}`;
    
    const statusEl = document.getElementById('f-status');
    statusEl.value = ''; 
    statusEl.style.setProperty('background', '#f8fafc', 'important');
    statusEl.style.setProperty('color', '#111827', 'important');
    statusEl.style.fontWeight = '500';
    
    const paymentEl = document.getElementById('f-payment-status');
    paymentEl.value = 'Chargeable';
    paymentEl.style.setProperty('background', '#f8fafc', 'important');
    paymentEl.style.setProperty('color', '#111827', 'important');
    paymentEl.style.fontWeight = '500';

    
    // Auto-fill logged in user and disable


    document.getElementById('f-user').innerHTML = `<option value="${appState.currentUser}">${appState.currentUser}</option>`;
    document.getElementById('f-user').disabled = true;
    
    // Enable category field (it might be locked by selectCategory)
    document.getElementById('f-service-type').disabled = false;
    
    updateDynamicFields();
}

document.getElementById('master-form').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = e.target.querySelector('button[type="submit"]'); btn.innerText = 'Saving...'; btn.disabled = true;
    let description = document.getElementById('f-desc').value;
    const main = document.getElementById('f-service-type').value;
    
    // Collect dynamic fields if S1
    if (main === 'S1') {
        const urgent = document.getElementById('f-s1-no-appointment')?.checked ? 'Yes' : 'No';
        if (urgent === 'Yes') {
            description = `[URGENT / NO APPOINTMENT: Yes] (+£25.00 Service Fee)\n\n${description}`;
        }
    }
    // Collect dynamic fields if S2
    else if (main === 'S2') {
        const ika = document.getElementById('f-ika-app').value;
        const local = document.getElementById('f-local-settings')?.value || '';
        const sector = document.getElementById('f-s2-sector')?.value || '';
        const setupNum = document.getElementById('f-setup-number')?.value || '';
        const company = document.getElementById('f-card-company')?.value || '';
        description = `[IKA APP: ${ika}] [SETTINGS: ${local}] [SECTOR: ${sector}] [SETUP #: ${setupNum}] [CARD CO: ${company}]\n\n${description}`;
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
        "CRM TICKET": document.getElementById('f-crm-ticket').value, 
        "INV NO": document.getElementById('f-invoice-no').value, 
        COMPANY: document.getElementById('f-company').value, 
        POSTCODE: document.getElementById('f-postcode').value, 
        USER: appState.currentUser,
        "MAIN SERVICE": main, 
        "SUB SERVICE": document.getElementById('f-sub-service').value, 
        "START TIME": document.getElementById('f-start-time').value, 
        "END TIME": document.getElementById('f-end-time').value, 
        DURATION: parseInt(document.getElementById('f-duration').value) || 0, 
        PRICE: parseFloat(document.getElementById('f-price').value) || 0, 
        "PAYMENT STATUS": document.getElementById('f-payment-status').value, 
        DESCRIPTION: description, 
        STATUS: 'Logged', 
        invoiced: false 
    };
    try { 
        const { data, error } = await sbClient.from('records').insert([rec]).select();
        if (error) throw error;
        if (data && data.length > 0) {
            const r = data[0];
            appState.tickets.unshift({
                id: r.id, 
                dbId: (r.ID || r.db_id || r.id || 'N/A').toString().split('-')[0].substring(0, 5).toUpperCase(), 
                crmTicket: r['CRM TICKET'] || r.crm_ticket || 'N/A', 
                timestamp: r.TIMESTAMP || r.timestamp || new Date().toISOString(),
                company: r.COMPANY || r.company_name, 
                companyId: r.COMPANY_ID || r.company_id, 
                postcode: r.POSTCODE || r.postcode,
                user: r.USER || r.staff_user, 
                mainService: r['MAIN SERVICE'] || r.service_type, 
                subService: r['SUB SERVICE'] || r.sub_service,
                startTime: r['START TIME'] || r.start_time, 
                endTime: r['END TIME'] || r.end_time, 
                duration: r.DURATION || r.duration,
                price: r.PRICE || r.price, 
                paymentStatus: r['PAYMENT STATUS'] || r.payment_status, 
                description: r.DESCRIPTION || r.description,
                status: r.STATUS || r.status, 
                invoiced: r.invoiced, 
                invoiceDate: r['INV DATE'] || r.invoice_date, 
                invoiceNo: r['INV NO'] || r.invoice_no
            });
            updateDataStats();
        }
        showAlert('Success', 'Record saved!', '✅');
        toggleMainForm('home');
        renderAll();
    } catch (err) { 
        showAlert('Error', err.message, '❌'); 
    }
    finally { btn.innerText = 'Process Transaction'; btn.disabled = false; }
});
function updateStats() {
    updateDataStats();
}
// Placeholder for potential future logic
async function markAsInvoiced(id) {
    showAlert('Process Invoice', 'Enter Invoice Number:', '🧾', true, true, async (n) => {
        if (!n) return; try { const { error } = await sbClient.from('records').update({ invoiced: true, "INV NO": n === true ? `INV-${Date.now()}` : n, "INV DATE": new Date().toISOString().split('T')[0] }).eq('id', id); if (error) throw error; initApp(); showAlert('Invoiced', 'Record marked as invoiced with current date.', '✅'); } catch (e) { showAlert('Error', e.message, '❌'); }
    });
}
function filterByCustomer(name) { showTab('dataview'); document.getElementById('dataview-search').value = name; renderDataTable(); }
function renderAll() { 
    renderTabContent(appState.activeTab); 
    document.getElementById('vtiger-customer-list').innerHTML = appState.customers.map(c => `<option value="${c.COMPANY}">`).join(''); 
    if (window.lucide) lucide.createIcons();
}

// --- App Initialization & Auth ---

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
        document.querySelectorAll('.sidebar-link').forEach(btn => {
            if (btn.id.startsWith('set-btn-') && btn.id !== 'set-btn-account') {
                btn.style.display = (appState.currentUserRole === 'Admin') ? 'flex' : 'none';
            }
        });
    }
});

// --- NEW: Permissions & Access Management ---
async function renderPermissionsManagement() {
    const container = document.getElementById('permissions-management-list');
    const auth = appState.settings.users_auth || {};
    const users = Object.values(auth);

    if (users.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:3rem; background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1; color:#64748b;">
            <i data-lucide="user-x" style="width:48px; height:48px; margin-bottom:1rem; opacity:0.5;"></i>
            <p>No users found in database. Try adding some users first.</p>
        </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    let roles = [];
    try {
        const { data: roleData } = await sbClient.from('permissions').select('*');
        roles = roleData || [];
    } catch (e) { console.error(e); }

    container.innerHTML = `
        <table class="table-modern">
            <thead>
                <tr>
                    <th>User / Email</th>
                    <th>Current Role</th>
                    <th>Access Mapping (POS | CC | ADMIN)</th>
                    <th style="text-align:right;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(u => {
                    const isSystemAdmin = u.email.toUpperCase() === 'ADMIN';
                    const displayName = u.full_name || u.email;
                    return `
                        <tr>
                            <td>
                                <div style="font-weight:700; color:var(--primary);">${displayName}</div>
                                <div style="font-size:11px; color:var(--text-muted);">${u.email}</div>
                            </td>
                            <td>
                                <select onchange="updateUserRole('${u.id}', this.value)" style="padding: 8px 12px; border-radius: 10px; border: 1px solid #e2e8f0; font-weight:600; width:100%; cursor:pointer;" ${isSystemAdmin ? 'disabled' : ''}>
                                    ${roles.map(r => `<option value="${r.id}" ${u.role === r.role_name ? 'selected' : ''}>${r.role_name}</option>`).join('')}
                                </select>
                            </td>
                            <td>
                                <div style="display:flex; gap:10px; font-size:12px;">
                                    <span style="padding:4px 8px; border-radius:6px; background:${u.role === 'Admin' || u.role === 'User' ? '#ecfdf5' : '#f1f5f9'}; color:${u.role === 'Admin' || u.role === 'User' ? '#059669' : '#94a3b8'}; font-weight:600;">POS</span>
                                    <span style="padding:4px 8px; border-radius:6px; background:${u.role === 'Admin' || u.role === 'User' ? '#ecfdf5' : '#f1f5f9'}; color:${u.role === 'Admin' || u.role === 'User' ? '#059669' : '#94a3b8'}; font-weight:600;">CARD</span>
                                    <span style="padding:4px 8px; border-radius:6px; background:${u.role === 'Admin' || u.role === 'Accounting' ? '#eff6ff' : '#f1f5f9'}; color:${u.role === 'Admin' || u.role === 'Accounting' ? '#2563eb' : '#94a3b8'}; font-weight:600;">ACC</span>
                                    <span style="padding:4px 8px; border-radius:6px; background:${u.role === 'Admin' ? '#fef2f2' : '#f1f5f9'}; color:${u.role === 'Admin' ? '#dc2626' : '#94a3b8'}; font-weight:600;">ADMIN</span>
                                </div>
                            </td>
                            <td style="text-align:right;">
                                <button class="btn-icon" onclick="resetUserPassword('${u.id}', '${u.email}')" title="Change Password" style="color:var(--primary); background:none; border:none; cursor:pointer; font-size:1.2rem;">🔑</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    if (window.lucide) lucide.createIcons();
}

async function updateUserRole(userId, roleId) {
    try {
        const { error } = await sbClient.from('users').update({ role_id: roleId }).eq('id', userId);
        if (error) throw error;
        showToast('Yetki/Rol başarıyla güncellendi.', 'success');
        initApp();
    } catch (e) {
        console.error(e);
        showAlert('Hata', 'Rol güncellenemedi: ' + e.message, '❌');
    }
}


// --- Pricing & Account Settings ---
function renderPricingSettings() {
    const p = appState.settings.pricing || {};
    const ids = {
        'p-S1-SetMenu': p.S1_SetMenu || 35,
        'p-S1-Base': p.S1_Base || 125,
        'p-S1-Hourly': p.S1_Hourly || 25,
        'p-S2': p.S2 || 125,
        'p-S3': p.S3 || 125,
        'p-S4': p.S4 || 65
    };
    for (const [id, val] of Object.entries(ids)) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }
}

function renderAccountSettings() {
    const nameEl = document.getElementById('acc-new-name');
    if (nameEl) nameEl.value = appState.currentUser || '';
    
    const sheetEl = document.getElementById('setting-sheet-url');
    if (sheetEl) sheetEl.value = appState.settings.sheet_url || '';
}

// --- OS Management ---
function renderOSManagement() {
    const list = document.getElementById('os-management-list');
    const oss = appState.settings.operating_systems || [];
    list.innerHTML = oss.map(os => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; border:1px solid #e2e8f0;">
            <span style="font-weight: 600;">${os.name}</span>
            <div style="display:flex; gap:8px;">
                <button class="btn-icon" onclick="editOS('${os.id}', '${os.name}')" style="color:#6366f1;">✏️</button>
                <button class="btn-icon" onclick="deleteOS('${os.id}', '${os.name}')" style="color:#ef4444;">🗑️</button>
            </div>
        </div>
    `).join('');
}
async function addOS() { const name = document.getElementById('new-os-name').value.trim(); if (name) { await handleHWAction('operating_systems', 'add', { name }); document.getElementById('new-os-name').value = ''; } }
async function editOS(id, oldName) { const newName = prompt('Edit OS Name:', oldName); if (newName && newName !== oldName) await handleHWAction('operating_systems', 'edit', { id, newName }); }
async function deleteOS(id, name) { if (confirm(`Remove ${name}?`)) await handleHWAction('operating_systems', 'delete', { id }); }

// --- CC Local Management ---
function renderCCLocalManagement() {
    const list = document.getElementById('cc-local-management-list');
    const opts = appState.settings.cc_local_settings || [];
    list.innerHTML = opts.map(opt => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; border:1px solid #e2e8f0;">
            <span style="font-weight: 600;">${opt.name}</span>
            <div style="display:flex; gap:8px;">
                <button class="btn-icon" onclick="editCCLocal('${opt.id}', '${opt.name}')" style="color:#6366f1;">✏️</button>
                <button class="btn-icon" onclick="deleteCCLocal('${opt.id}', '${opt.name}')" style="color:#ef4444;">🗑️</button>
            </div>
        </div>
    `).join('');
}
async function addCCLocal() { const name = document.getElementById('new-cc-local-name').value.trim(); if (name) { await handleHWAction('cc_local_settings', 'add', { name }); document.getElementById('new-cc-local-name').value = ''; } }
async function editCCLocal(id, oldName) { const newName = prompt('Edit CC Local Name:', oldName); if (newName && newName !== oldName) await handleHWAction('cc_local_settings', 'edit', { id, newName }); }
async function deleteCCLocal(id, name) { if (confirm(`Remove ${name}?`)) await handleHWAction('cc_local_settings', 'delete', { id }); }

// --- Card Company Management ---
function renderCardCompanyManagement() {
    const list = document.getElementById('card-company-management-list');
    const opts = appState.settings.card_companies || [];
    list.innerHTML = opts.map(opt => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; border:1px solid #e2e8f0;">
            <span style="font-weight: 600;">${opt.name}</span>
            <div style="display:flex; gap:8px;">
                <button class="btn-icon" onclick="editCardCompany('${opt.id}', '${opt.name}')" style="color:#6366f1;">✏️</button>
                <button class="btn-icon" onclick="deleteCardCompany('${opt.id}', '${opt.name}')" style="color:#ef4444;">🗑️</button>
            </div>
        </div>
    `).join('');
}
async function addCardCompany() { const name = document.getElementById('new-card-company-name').value.trim(); if (name) { await handleHWAction('card_companies', 'add', { name }); document.getElementById('new-card-company-name').value = ''; } }
async function editCardCompany(id, oldName) { const newName = prompt('Edit Card Company Name:', oldName); if (newName && newName !== oldName) await handleHWAction('card_companies', 'edit', { id, newName }); }
async function deleteCardCompany(id, name) { if (confirm(`Remove ${name}?`)) await handleHWAction('card_companies', 'delete', { id }); }

// --- CPU Management ---
function renderCPUManagement() {
    const list = document.getElementById('cpu-management-list');
    const cpus = appState.settings.till_cpu || [];
    list.innerHTML = cpus.map(cpu => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; border:1px solid #e2e8f0;">
            <span style="font-weight: 600;">${cpu.name}</span>
            <div style="display:flex; gap:8px;">
                <button class="btn-icon" onclick="editCPU('${cpu.id}', '${cpu.name}')" style="color:#6366f1;">✏️</button>
                <button class="btn-icon" onclick="deleteCPU('${cpu.id}', '${cpu.name}')" style="color:#ef4444;">🗑️</button>
            </div>
        </div>
    `).join('');
}
async function addCPU() { const name = document.getElementById('new-cpu-name').value.trim(); if (name) { await handleHWAction('till_cpu', 'add', { name }); document.getElementById('new-cpu-name').value = ''; } }
async function editCPU(id, oldName) { const newName = prompt('Edit CPU Name:', oldName); if (newName && newName !== oldName) await handleHWAction('till_cpu', 'edit', { id, newName }); }
async function deleteCPU(id, name) { if (confirm(`Remove ${name}?`)) await handleHWAction('till_cpu', 'delete', { id }); }

// --- Till Model Management ---
function renderTillModelManagement() {
    const list = document.getElementById('till-model-management-list');
    const models = appState.settings.till_models || [];
    list.innerHTML = models.map(m => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; border:1px solid #e2e8f0;">
            <span style="font-weight: 600;">${m.name}</span>
            <div style="display:flex; gap:8px;">
                <button class="btn-icon" onclick="editTillModel('${m.id}', '${m.name}')" style="color:#6366f1;">✏️</button>
                <button class="btn-icon" onclick="deleteTillModel('${m.id}', '${m.name}')" style="color:#ef4444;">🗑️</button>
            </div>
        </div>
    `).join('');
}
async function addTillModel() { const name = document.getElementById('new-till-model-name').value.trim(); if (name) { await handleHWAction('till_models', 'add', { name }); document.getElementById('new-till-model-name').value = ''; } }
async function editTillModel(id, oldName) { const newName = prompt('Edit Model Name:', oldName); if (newName && newName !== oldName) await handleHWAction('till_models', 'edit', { id, newName }); }
async function deleteTillModel(id, name) { if (confirm(`Remove ${name}?`)) await handleHWAction('till_models', 'delete', { id }); }


async function handleHWAction(table, action, data) {
    try {
        let error;
        if (action === 'add') {
            const { error: err } = await sbClient.from(table).insert(data);
            error = err;
        } else if (action === 'edit') {
            const { id, ...updates } = data;
            const { error: err } = await sbClient.from(table).update(updates).eq('id', id);
            error = err;
        } else if (action === 'delete') {
            const { error: err } = await sbClient.from(table).delete().eq('id', data.id);
            error = err;
        }

        if (error) {
            let msg = error.message;
            if (msg.includes('row-level security') || error.code === '42501') {
                msg = `Güvenlik Hatası: "${table}" tablosuna erişim yetkiniz yok. Lütfen Supabase -> Table Editor -> ${table} -> RLS Settings kısmından RLS'i kapatın veya bir politika ekleyin.`;
            } else if (msg.includes('not found') || error.code === '42P01') {
                msg = `Veritabanı Hatası: "${table}" tablosu Supabase'de bulunamadı. Lütfen SQL Editor ile tabloyu oluşturun.`;
            }
            throw new Error(msg);
        }

        showToast(`${action.charAt(0).toUpperCase() + action.slice(1)} successful.`, 'success');
        initApp();
    } catch (e) {
        console.error(e);
        showAlert('Hata', e.message, '❌');
    }
}

window.handleHWAction = handleHWAction;
window.renderPersonnelManagement = renderPersonnelManagement;
window.addPersonnel = addPersonnel;
window.deleteUser = deleteUser;
window.resetUserPassword = resetUserPassword;
window.renderPermissionsManagement = renderPermissionsManagement;
window.updateUserRole = updateUserRole;
window.renderOSManagement = renderOSManagement;
window.addOS = addOS;
window.editOS = editOS;
window.deleteOS = deleteOS;
window.renderCCLocalManagement = renderCCLocalManagement;
window.addCCLocal = addCCLocal;
window.editCCLocal = editCCLocal;
window.deleteCCLocal = deleteCCLocal;
window.renderCardCompanyManagement = renderCardCompanyManagement;
window.addCardCompany = addCardCompany;
window.editCardCompany = editCardCompany;
window.deleteCardCompany = deleteCardCompany;
window.renderCPUManagement = renderCPUManagement;
window.addCPU = addCPU;
window.editCPU = editCPU;
window.deleteCPU = deleteCPU;
window.renderTillModelManagement = renderTillModelManagement;
window.addTillModel = addTillModel;
window.editTillModel = editTillModel;
window.deleteTillModel = deleteTillModel;
window.renderPricingSettings = renderPricingSettings;
window.renderAccountSettings = renderAccountSettings;
window.savePricingSettings = savePricingSettings;
window.saveAccountSettings = saveAccountSettings;
window.updateDataStats = updateDataStats;
window.exportData = exportData;
window.backupDatabase = () => showAlert('Info', 'Database backup started... Check Supabase logs.', '☁️');

// --- Missing Handlers Implementation ---
async function savePricingSettings() {
    try {
        const updates = [
            { id: 'Pricing_S1_SetMenu', data: document.getElementById('p-S1-SetMenu').value },
            { id: 'Pricing_S1_Base', data: document.getElementById('p-S1-Base').value },
            { id: 'Pricing_S1_Hourly', data: document.getElementById('p-S1-Hourly').value },
            { id: 'Pricing_S2', data: document.getElementById('p-S2').value },
            { id: 'Pricing_S3', data: document.getElementById('p-S3').value },
            { id: 'Pricing_S4', data: document.getElementById('p-S4').value }
        ];
        
        for (const item of updates) {
            await sbClient.from('app_settings').upsert(item);
        }
        
        await sbClient.from('services').update({ base_price: document.getElementById('p-S1-Base').value, hourly_price: document.getElementById('p-S1-Hourly').value }).eq('name', 'S1');
        await sbClient.from('services').update({ base_price: document.getElementById('p-S2').value }).eq('name', 'S2');
        await sbClient.from('services').update({ base_price: document.getElementById('p-S3').value }).eq('name', 'S3');
        await sbClient.from('services').update({ base_price: document.getElementById('p-S4').value }).eq('name', 'S4');

        showToast('Pricing updated successfully.', 'success');
        initApp();
    } catch (e) {
        console.error(e);
        showAlert('Error', 'Failed to save pricing: ' + e.message, '❌');
    }
}

async function saveAccountSettings() {
    try {
        const newName = document.getElementById('acc-new-name').value.trim();
        const newPass = document.getElementById('acc-new-pass').value.trim();
        
        const updateData = { full_name: newName };
        if (newPass) updateData.password = newPass;
        
        const { error } = await sbClient.from('users').update(updateData).eq('email', appState.currentUserEmail);
        if (error) throw error;
        
        appState.currentUser = newName;
        showToast('Account updated successfully.', 'success');
        renderAll();
    } catch (e) {
        console.error(e);
        showAlert('Error', 'Failed to update account: ' + e.message, '❌');
    }
}

async function saveGoogleSettings() {
    try {
        const url = document.getElementById('setting-sheet-url').value.trim();
        await sbClient.from('app_settings').upsert({ id: 'Sheet_URL', data: url });
        showToast('Google integration updated.', 'success');
        initApp();
    } catch (e) {
        console.error(e);
        showAlert('Error', 'Failed to save Google settings.', '❌');
    }
}

// updateDataStats is unified and defined above.

function exportData() {
    const records = appState.records || [];
    if (records.length === 0) {
        showAlert('Info', 'No records to export.', 'ℹ️');
        return;
    }
    
    let csv = 'ID,Date,Customer,Service,Status,Total Price\n';
    records.forEach(r => {
        csv += `${r.id},${r.created_at},"${r.customer_name || ''}","${r.service_name || ''}",${r.status},${r.total_price}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `TaskFlow_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

const defaultSeeds = {
    sectors: ["HOSPITALITY", "RETAIL", "QUICK SERVICE"],
    sys_types: ["IKA NEW TILL SYSTEM", "USED OWN SYSTEM", "IKA 2.HAND TILL SYSTEM", "OTHER"],
    pay_methods: ["Cash", "Card", "Bank Transfer", "PayPal"],
    operating_systems: ["WINDOWS 10", "WINDOWS 11", "WINDOWS 7", "WINDOWS LTSC", "ANDROID", "OTHER"],
    till_cpu: ["J6412", "J1900", "J4125", "J1037U", "I3", "I5", "I7", "ATOM", "N97", "OTHER"],
    till_models: ["IKA S-300 RT3", "IKA S-100", "IKA S-150", "IKA S-150 8GB", "IKA S-200 (I5)", "IKA RT-12", "RT-3", "RT-6", "PHOENIX", "OKPOS Z", "OPTIMUS", "POSBANK", "AURES", "MAZIC 1500", "BST", "RUGGED TABLET", "NO NAME", "OTHER"],
    cc_local_settings: ["Positive Credit Card", "PaymentSense V3 C", "Verifone Credit Card", "Windcave HIT Credit", "No-Use App"],
    card_companies: ["Dojo", "Elavon", "MerchantHub", "PaymenTap", "PaymentSave", "PaymentSense", "United Payment", "WorldPay"],
    services: [
        { name: 'S1', full_name: 'MENU UPDATE' },
        { name: 'S2', full_name: 'CREDIT CARD' },
        { name: 'S3', full_name: 'DATA RESET' },
        { name: 'S4', full_name: 'SERVICE' },
        { name: 'S5', full_name: 'OTHER' },
        { name: 'S6', full_name: 'TILL SETUP' }
    ],
    sub_services: [
        { service_name: 'S1', name: 'Food and Drink Menu' },
        { service_name: 'S1', name: 'Food Menu Only' },
        { service_name: 'S1', name: 'Drink Menu Only' },
        { service_name: 'S1', name: 'Dessert Menu' },
        { service_name: 'S1', name: 'Set Menu' },
        { service_name: 'S1', name: 'New Menu' },
        { service_name: 'S2', name: 'Credit Card Setup' },
        { service_name: 'S2', name: 'Credit Card Replacement' },
        { service_name: 'S2', name: 'Credit Card Cancellation' },
        { service_name: 'S3', name: 'Sales data has been deleted at the customer’s request' },
        { service_name: 'S3', name: 'Data has been reset due to a database malfunction' },
        { service_name: 'S4', name: 'Network Connectivity Issues' },
        { service_name: 'S4', name: 'Wi-Fi Setup / Troubleshooting' },
        { service_name: 'S4', name: 'Modem / Router Configuration' },
        { service_name: 'S4', name: 'Operating System Installation' },
        { service_name: 'S4', name: 'Virus Removal / Performance Issues' },
        { service_name: 'S4', name: 'SSD Replacement / Upgrade' },
        { service_name: 'S4', name: 'RAM Upgrade' },
        { service_name: 'S4', name: 'Part Replacement (Screen, Keyboard, Battery, etc.)' },
        { service_name: 'S4', name: 'Printing Problems' },
        { service_name: 'S4', name: 'Printer Installation' },
        { service_name: 'S4', name: 'General Maintenance' },
        { service_name: 'S4', name: 'Various' },
        { service_name: 'S5', name: 'Other / Unlisted Issue' },
        { service_name: 'S6', name: 'Full Setup' },
        { service_name: 'S6', name: 'Hardware Only' },
        { service_name: 'S6', name: 'Software Only' }
    ]
};

async function seedDatabaseIfNeeded() {
    let seededAny = false;
    
    // Services Seeding
    try {
        const { data: existingServices, error: fetchErr } = await sbClient.from('services').select('*');
        if (fetchErr) throw fetchErr;

        if (!existingServices || existingServices.length === 0) {
            console.log("Seeding services...");
            const { error: insErr } = await sbClient.from('services').insert(defaultSeeds.services);
            if (insErr) throw insErr;
            seededAny = true;
        }
    } catch (e) {
        console.error("Error seeding services:", e);
        if (e.message && (e.message.includes('row-level security') || e.code === '42501')) {
            showToast("Hata: 'services' tablosuna erişim RLS tarafından engellendi.", "error");
        }
    }
    // Standard hardware/dictionary tables
    const hardwareTables = ['operating_systems', 'till_cpu', 'till_models', 'cc_local_settings', 'card_companies'];
    for (const table of hardwareTables) {
        const currentData = appState.settings[table] || [];
        if (currentData.length === 0) {
            console.log(`Seeding table ${table}...`);
            const inserts = defaultSeeds[table].map(v => ({ name: v }));
            const { error } = await sbClient.from(table).insert(inserts);
            if (!error) seededAny = true;
        }
    }



    // Users Seeding
    try {
        const { data: existingUsers, error: userFetchErr } = await sbClient.from('users').select('*');
        if (userFetchErr) throw userFetchErr;

        if (!existingUsers || existingUsers.length === 0) {
            console.log("Seeding users...");
            // Get or create roles
            let { data: adminRole } = await sbClient.from('permissions').select('id').eq('role_name', 'Admin').single();
            if (!adminRole) {
                const { data: newRole } = await sbClient.from('permissions').insert([{ role_name: 'Admin', access_level: 100 }]).select().single();
                adminRole = newRole;
            }
            let { data: staffRole } = await sbClient.from('permissions').select('id').eq('role_name', 'Staff').single();
            if (!staffRole) {
                const { data: newRole } = await sbClient.from('permissions').insert([{ role_name: 'Staff', access_level: 50 }]).select().single();
                staffRole = newRole;
            }

            if (adminRole && staffRole) {
                const defaultUsers = [
                    { email: 'ugur@taskflow.com', full_name: 'UGUR YAVUZ', role_id: adminRole.id, password: 'admin' },
                    { email: 'ahmet@taskflow.com', full_name: 'AHMET BALTACI', role_id: staffRole.id, password: '1234' },
                    { email: 'ugurisik@taskflow.com', full_name: 'UGUR ISIKCEVAHIR', role_id: staffRole.id, password: '1234' }
                ];
                const { error: insUserErr } = await sbClient.from('users').insert(defaultUsers);
                if (insUserErr) throw insUserErr;
                seededAny = true;
            }
        }
    } catch (e) {
        console.error("Error seeding users:", e);
    }

    return seededAny;
}

function renderAccountSettings() {
    const userEmail = appState.currentUser;
    const auth = appState.settings.users_auth || {};
    const uData = auth[userEmail] || Object.values(auth).find(u => u.email === userEmail || u.full_name === userEmail);
    if (uData) {
        document.getElementById('acc-name').value = uData.full_name || '';
        document.getElementById('acc-pass').value = uData.password || '';
    }
}

async function updateAccountProfile() {
    const newName = document.getElementById('acc-name').value.trim();
    const newPass = document.getElementById('acc-pass').value.trim();
    if (!newName || !newPass) {
        showToast('Name and Password cannot be empty.', 'error');
        return;
    }
    
    const userEmail = appState.currentUser;
    const auth = appState.settings.users_auth || {};
    const uData = auth[userEmail] || Object.values(auth).find(u => u.email === userEmail || u.full_name === userEmail);
    
    if (!uData) {
        showToast('User data not found.', 'error');
        return;
    }

    try {
        await sbClient.from('users').update({ full_name: newName, password: newPass }).eq('id', uData.id);
        uData.full_name = newName;
        uData.password = newPass;
        showToast('Profile updated successfully!', 'success');
    } catch(e) {
        showToast(e.message, 'error');
    }
}
window.updateAccountProfile = updateAccountProfile;


// --- CALENDAR LOGIC ---
let currentCalMonth = new Date().getMonth();
let currentCalYear = new Date().getFullYear();

window.prevMonth = function() {
    currentCalMonth--;
    if (currentCalMonth < 0) {
        currentCalMonth = 11;
        currentCalYear--;
    }
    if (typeof renderCalendar === 'function') renderCalendar();
}

window.nextMonth = function() {
    currentCalMonth++;
    if (currentCalMonth > 11) {
        currentCalMonth = 0;
        currentCalYear++;
    }
    if (typeof renderCalendar === 'function') renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if(!grid) return;
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthDisplay = document.getElementById('calendar-month-display');
    if (monthDisplay) monthDisplay.innerText = `${monthNames[currentCalMonth]} ${currentCalYear}`;
    
    const firstDay = new Date(currentCalYear, currentCalMonth, 1);
    const lastDay = new Date(currentCalYear, currentCalMonth + 1, 0);
    
    let startingDay = firstDay.getDay(); 
    if (startingDay === 0) startingDay = 7; 
    
    const prevMonthDays = new Date(currentCalYear, currentCalMonth, 0).getDate();
    
    let html = '';
    
    for (let i = 1; i < startingDay; i++) {
        const d = prevMonthDays - startingDay + i + 1;
        html += `<div class="calendar-day other-month"><span class="calendar-date">${d}</span></div>`;
    }
    
    const today = new Date();
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const isToday = d === today.getDate() && currentCalMonth === today.getMonth() && currentCalYear === today.getFullYear();
        html += `<div class="calendar-day ${isToday ? 'today' : ''}" onclick="openDayView(${currentCalYear}, ${currentCalMonth}, ${d})" style="cursor:pointer;">
                   <span class="calendar-date">${d}</span>
                   <div id="cal-day-${currentCalYear}-${currentCalMonth}-${d}" style="display:flex; flex-direction:column; gap:2px; margin-top:5px; height: calc(100% - 30px); overflow-y: auto;"></div>
                 </div>`;
    }
    
    const totalCells = startingDay - 1 + lastDay.getDate();
    const remaining = totalCells > 35 ? 42 - totalCells : 35 - totalCells;
    for(let i = 1; i <= remaining; i++) {
        html += `<div class="calendar-day other-month"><span class="calendar-date">${i}</span></div>`;
    }
    
    grid.innerHTML = html;
    
    const tickets = appState.tickets || [];
    
    const ticketsByDay = {};
    tickets.forEach(t => {
        if (!t.timestamp) return;
        const dObj = new Date(t.timestamp);
        if (dObj.getMonth() === currentCalMonth && dObj.getFullYear() === currentCalYear) {
            const day = dObj.getDate();
            if (!ticketsByDay[day]) ticketsByDay[day] = [];
            ticketsByDay[day].push(t);
        }
    });

    Object.keys(ticketsByDay).forEach(day => {
        const dayCell = document.getElementById(`cal-day-${currentCalYear}-${currentCalMonth}-${day}`);
        if (dayCell) {
            const list = ticketsByDay[day];
            const waitingCount = list.filter(t => {
                const stat = t.status || '';
                return !(stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamland' || t.invoiced === true);
            }).length;
            const completedCount = list.length - waitingCount;
            
            let htmlInner = '';
            if (waitingCount > 0) {
                htmlInner += `<div style="background-color:#f59e0b; color:white; border-radius:6px; padding:6px 0; text-align:center; font-weight:700; font-size:12px; margin-bottom:5px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">Waiting ${waitingCount} Job${waitingCount > 1 ? 's' : ''}</div>`;
            }
            if (completedCount > 0) {
                htmlInner += `<div style="background-color:#10b981; color:white; border-radius:6px; padding:6px 0; text-align:center; font-weight:700; font-size:12px; margin-bottom:5px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">Completed ${completedCount} Job${completedCount > 1 ? 's' : ''}</div>`;
            }
            
            // Set content
            dayCell.innerHTML = htmlInner;
        }
    });

    if (window.lucide) window.lucide.createIcons();
}
window.renderCalendar = renderCalendar;

window.openDayView = function(year, month, day) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('day-view-title').innerText = `${day} ${monthNames[month]} ${year}`;
    
    // Convert to YYYY-MM-DD
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    
    // Find tickets for this date
    const dayTickets = (appState.tickets || []).filter(t => {
        if (!t.timestamp) return false;
        const dObj = new Date(t.timestamp);
        return dObj.getFullYear() === year && dObj.getMonth() === month && dObj.getDate() === day;
    });

    let html = '';
    
    // Hours 09:00 to 18:00
    for(let h = 9; h <= 18; h++) {
        const timeStr = `${String(h).padStart(2,'0')}:00`;
        const nextTimeStr = `${String(h+1).padStart(2,'0')}:00`;
        
        // Find tickets starting within this hour
        const hourTickets = dayTickets.filter(t => {
            if(!t.startTime) return false;
            const tHour = parseInt(t.startTime.split(':')[0]);
            return tHour === h;
        });
        
        html += `<div style="display:flex; border-bottom:1px solid #e2e8f0; min-height:60px;">`;
        html += `  <div style="width:80px; padding:15px; border-right:1px solid #e2e8f0; font-weight:bold; color:#64748b; font-size:0.9rem;">${timeStr}</div>`;
        html += `  <div style="flex:1; padding:10px; position:relative;" class="hourly-slot-content">`;
        
        if (hourTickets.length > 0) {
            hourTickets.sort((a,b) => (a.startTime || "").localeCompare(b.startTime || ""));
            hourTickets.forEach(t => {
                const isCompleted = t.status === 'Completed' || t.status === 'Tamamlandı' || t.invoiced === true;
                const statusClass = isCompleted ? 'completed' : 'pending';
                html += `
                    <div class="calendar-event ${statusClass}" style="margin-bottom:5px; padding:8px 12px; cursor:pointer; ${isCompleted ? 'text-decoration: line-through; opacity: 0.7;' : ''}" onclick="openAppointmentView('${t.id}');" title="${t.company} - ${t.mainService}">
                        <div style="font-weight:600; font-size:0.95rem;">${t.startTime} - ${t.company}</div>
                        <div style="font-size:0.85rem; opacity:0.9;">${t.mainService} | Ticket: ${t.crmTicket}</div>
                    </div>
                `;
            });
            // Still allow adding if they want multiple in same hour
            html += `<button onclick="createAppointmentForSlot('${dateStr}', '${timeStr}')" style="background:transparent; color:#3b82f6; border:1px dashed #cbd5e1; border-radius:4px; padding:4px 8px; font-size:0.8rem; cursor:pointer; width:100%; text-align:center; margin-top:5px;">+ Add Another</button>`;
        } else {
            html += `<button onclick="createAppointmentForSlot('${dateStr}', '${timeStr}')" style="background:transparent; color:#94a3b8; border:1px dashed #e2e8f0; border-radius:4px; width:100%; height:100%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;" onmouseover="this.style.color='#3b82f6'; this.style.borderColor='#93c5fd';" onmouseout="this.style.color='#94a3b8'; this.style.borderColor='#e2e8f0';">+ Add Appointment</button>`;
        }
        
        html += `  </div>`;
        html += `</div>`;
    }
    
    document.getElementById('day-view-hourly-list').innerHTML = html;
    document.getElementById('day-view-modal').classList.remove('hidden');
};

window.createAppointmentForSlot = function(dateStr, timeStr) {
    document.getElementById('day-view-modal').classList.add('hidden');
    
    // Show quick add modal
    document.getElementById('quick-add-modal').classList.remove('hidden'); if(window.initPickers) window.initPickers();
    
    // Reset quick add fields
    document.getElementById('qa-date').value = dateStr;
    document.getElementById('qa-time').value = timeStr;
    document.getElementById('qa-company').value = '';
    document.getElementById('qa-postcode').value = '';
    const qaStatus = document.getElementById('qa-status');
    qaStatus.value = 'Checking...';
    qaStatus.style.setProperty('background', '#f8fafc', 'important');
    qaStatus.style.setProperty('color', '#111827', 'important');
    qaStatus.style.fontWeight = '500';
    document.getElementById('qa-service-category').value = 'S1';
};

window.submitQuickAdd = async function() {
    const btn = document.querySelector('#quick-add-modal button.btn-primary');
    btn.innerText = 'Creating...';
    btn.disabled = true;

    try {
        const dateStr = document.getElementById('qa-date').value;
        const timeStr = document.getElementById('qa-time').value;
        const company = document.getElementById('qa-company').value;
        const postcode = document.getElementById('qa-postcode').value;
        const status = document.getElementById('qa-status').value || 'Logged';
        const service = document.getElementById('qa-service-category').value;
        
        let combinedDate;
        try {
            combinedDate = new Date(`${dateStr}T${timeStr}`).toISOString();
        } catch(e) {
            combinedDate = new Date().toISOString();
        }
        
        const nextId = appState.tickets.length + 1001; 
        
        // Calculate an end time (+30 mins)
        let tHour = parseInt(timeStr.split(':')[0]) || 0;
        let tMin = (parseInt(timeStr.split(':')[1]) || 0) + 30;
        if(tMin >= 60) { tHour++; tMin -= 60; }
        const endStr = `${String(tHour).padStart(2,'0')}:${String(tMin).padStart(2,'0')}`;
        
        const rec = { 
            "CRM TICKET": "", 
            "INV NO": `SRV-${nextId}`, 
            COMPANY: company, 
            POSTCODE: postcode, 
            USER: appState.currentUser,
            "MAIN SERVICE": service, 
            "SUB SERVICE": "", 
            "START TIME": timeStr, 
            "END TIME": endStr, 
            DURATION: 30, 
            
            PRICE: 0, 
            "PAYMENT STATUS": "Chargeable",
            "INV DATE": dateStr, 
            DESCRIPTION: "Quick Added via Calendar", 
            STATUS: status, 
            invoiced: false 
        };
        
        const { data, error } = await sbClient.from('records').insert([rec]).select();
        if (error) throw error;
        
        if (data && data.length > 0) {
            const r = data[0];
            appState.tickets.unshift({
                id: r.id, 
                dbId: (r.ID || r.db_id || r.id || 'N/A').toString().split('-')[0].substring(0, 5).toUpperCase(), 
                crmTicket: r['CRM TICKET'] || r.crm_ticket || 'N/A', 
                timestamp: r.TIMESTAMP || r.timestamp || r['INV DATE'] || r.created_at || new Date().toISOString(),
                company: r.COMPANY || r.company_name, 
                companyId: r.COMPANY_ID || r.company_id, 
                postcode: r.POSTCODE || r.postcode,
                user: r.USER || r.staff_user, 
                mainService: r['MAIN SERVICE'] || r.service_type, 
                subService: r['SUB SERVICE'] || r.sub_service || '',
                startTime: r['START TIME'] || r.start_time, 
                endTime: r['END TIME'] || r.end_time, 
                duration: r.DURATION || r.duration,
                price: r.PRICE || r.price, 
                paymentStatus: r['PAYMENT STATUS'] || r.payment_status, 
                description: r.DESCRIPTION || r.description,
                status: r.STATUS || r.status, 
                invoiced: r.invoiced, 
                invoiceDate: r['INV DATE'] || r.invoice_date, 
                invoiceNo: r['INV NO'] || r.invoice_no
            });
            updateDataStats();
            if (typeof addSystemLog === 'function') {
                addSystemLog('CREATE RECORD', `Quick added record for company: ${company}`);
            }
        }
        
        document.getElementById('quick-add-modal').classList.add('hidden');
        showAlert('Success', 'Appointment created!', '✅');
        renderCalendar(); // refresh calendar
        
    } catch(e) {
        showAlert('Error', e.message, '❌');
    } finally {
        btn.innerText = 'Create Appointment';
        btn.disabled = false;
    }
};

window.autoFillQuickAdd = function() {
    const companyInput = document.getElementById('qa-company');
    if (!companyInput) return;
    const company = companyInput.value;
    const customer = (appState.customers || []).find(c => (c.COMPANY || '') === company);
    const statusEl = document.getElementById('qa-status');
    const postcodeEl = document.getElementById('qa-postcode');
    
    if (customer) {
        const statusVal = customer['SERVICE STATUS'] || 'No Contract';
        postcodeEl.value = customer['POSTCODE'] || '';
        statusEl.value = statusVal;
        
        const isContract = statusVal.toLowerCase().includes('contract') || statusVal.toLowerCase().includes('var');
        if (isContract) {
            statusEl.style.setProperty('background', '#10b981', 'important');
            statusEl.style.setProperty('color', 'white', 'important');
            statusEl.style.fontWeight = '800';
        } else {
            statusEl.style.setProperty('background', '#ef4444', 'important');
            statusEl.style.setProperty('color', 'white', 'important');
            statusEl.style.fontWeight = '800';
        }
    } else {
        postcodeEl.value = '';
        statusEl.value = 'Checking...';
        statusEl.style.setProperty('background', '#f8fafc', 'important');
        statusEl.style.setProperty('color', '#111827', 'important');
        statusEl.style.fontWeight = '500';
    }
};


window.loadIntoDashboard = function(id) {
    const r = appState.tickets.find(t => t.id == id || t.dbId == id);
    if (!r) return;
    
    // Close modal if open
    const modal = document.getElementById('day-view-modal');
    if (modal) modal.classList.add('hidden');
    
    // Switch to dashboard tab
    showTab("dashboard");
    if (typeof toggleMainForm === 'function') toggleMainForm('form');
    
    appState.editingRecordId = r.id;
    
    // Populate fields
    if(document.getElementById('f-db-id')) document.getElementById('f-db-id').value = r.dbId || '';
    if(document.getElementById('f-crm-ticket')) document.getElementById('f-crm-ticket').value = r.crmTicket || '';
    if(document.getElementById('f-invoice-no')) document.getElementById('f-invoice-no').value = r.invoiceNo || '';
    if(document.getElementById('f-company')) document.getElementById('f-company').value = r.company || '';
    if(document.getElementById('f-company-id')) document.getElementById('f-company-id').value = r.companyId || '';
    if(document.getElementById('f-postcode')) document.getElementById('f-postcode').value = r.postcode || '';
    
    const dObj = new Date(r.timestamp);
    const dateStr = dObj.getFullYear() + '-' + String(dObj.getMonth() + 1).padStart(2, '0') + '-' + String(dObj.getDate()).padStart(2, '0');
    if(document.getElementById('f-date')) document.getElementById('f-date').value = r.invoiceDate || dateStr;
    
    if(document.getElementById('f-service-type')) {
        document.getElementById('f-service-type').value = r.mainService || '';
        if(typeof updateDynamicFields === 'function') updateDynamicFields();
    }
    if(typeof updateSubServices === 'function') updateSubServices('f-service-type', 'f-sub-service');
    if(document.getElementById('f-sub-service')) document.getElementById('f-sub-service').value = r.subService || '';
    
    if(document.getElementById('f-start-time')) document.getElementById('f-start-time').value = r.startTime || '';
    if(document.getElementById('f-end-time')) document.getElementById('f-end-time').value = r.endTime || '';
    if(document.getElementById('f-duration')) document.getElementById('f-duration').value = r.duration || '';
    if(document.getElementById('f-price')) document.getElementById('f-price').value = r.price || 0;
    if(document.getElementById('f-payment-status')) document.getElementById('f-payment-status').value = r.paymentStatus || 'Chargeable';
    if(document.getElementById('f-description')) document.getElementById('f-description').value = r.description || '';
    if(document.getElementById('f-status')) document.getElementById('f-status').value = r.status || 'Logged';
    
    // Change submit button text
    const submitBtn = document.querySelector('#master-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i data-lucide="save" style="width: 18px; height: 18px; margin-right: 8px;"></i> Update Record';
        submitBtn.style.background = '#f59e0b';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};


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
    document.getElementById('va-date').value = r.invoiceDate || dateStr;
    document.getElementById('va-start-time').value = r.startTime || '';
    
    document.getElementById('va-created-at').innerText = new Date(r.timestamp).toLocaleString('tr-TR');
    document.getElementById('va-created-by').innerText = r.user || 'N/A';
    

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

    
    
    const saveBtn = document.getElementById('va-save-btn');
    saveBtn.onclick = async function() {
        try {
            saveBtn.innerHTML = 'Saving...';
            saveBtn.disabled = true;
            
            const newDate = document.getElementById('va-date').value;
            const newTime = document.getElementById('va-start-time').value;
            
            const updates = {
                "INV DATE": newDate,
                "START TIME": newTime
            };
            
            const { error } = await sbClient.from('records').update(updates).eq('id', id);
            if (error) throw error;
            
            // update local state
            r.invoiceDate = newDate;
            r.startTime = newTime;
            r.timestamp = new Date(newDate + 'T' + (newTime || '00:00') + ':00').toISOString();
            
            document.getElementById('view-appointment-modal').classList.add('hidden');
            if (typeof showAlert !== 'undefined') showAlert('Success', 'Appointment updated successfully!', '✅');
            if (typeof renderCalendar !== 'undefined') renderCalendar();
            if (typeof renderDataTable !== 'undefined') renderDataTable();
            
        } catch(e) {
            console.error(e);
            if (typeof showAlert !== 'undefined') showAlert('Error', e.message, '❌');
        } finally {
            saveBtn.innerHTML = 'Change Date Time';
            saveBtn.disabled = false;
        }
    };

    document.getElementById('view-appointment-modal').classList.remove('hidden');
};


window.completeJob = async function(id) {
    // User requested NO prompt for duration here
    try {
        if (typeof showAlert !== 'undefined') showAlert('Info', 'Completing job...', '');
        const updates = { STATUS: 'Completed' };
        
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
};

window.renderWaitingJobs = function() {
    const container = document.getElementById('waiting-tree-container');
    if (!container) return;

    const tickets = appState.tickets || [];
    
    // Filter waiting jobs
    const waitingJobs = tickets.filter(t => {
        const stat = t.status || '';
        const isStatusCompleted = (stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamland' || t.invoiced === true);
        return !isStatusCompleted; // Only show if NOT completed
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
        
        const categoryNames = {
            'S1': 'MENU UPDATE',
            'S2': 'CREDIT CARD',
            'S3': 'DATA RESET',
            'S4': 'SERVICE',
            'S5': 'OTHER',
            'S6': 'TILL SETUP'
        };

        const dayJobs = groupedByDate[dateStr].sort((a,b) => (a.startTime || '').localeCompare(b.startTime || ''));
        
        dayJobs.forEach((t, index) => {
            const catName = categoryNames[t.mainService] || '';
            const displayService = t.mainService ? `${t.mainService} - ${catName}` : 'N/A';
            
            html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #f1f5f9; hover:background:#f8fafc; gap:15px;">
                <div style="display:flex; flex-wrap:wrap; align-items:center; gap:15px; cursor:pointer; flex:1;" onclick="openAppointmentView('${t.id}')">
                    <span style="font-weight:700; color:#334155; min-width:40px;">#${index + 1}</span>
                    <span style="font-weight:600; color:#0f172a; min-width:180px;">${t.startTime || '00:00'} - ${t.company || 'Unknown Company'}</span>
                    <span style="font-size:0.85rem; color:#64748b; display:flex; align-items:center; gap:4px;"><i data-lucide="tag" style="width:12px;height:12px;"></i> ${displayService}</span>
                    <span style="font-size:0.85rem; color:#64748b; display:flex; align-items:center; gap:4px;"><i data-lucide="map-pin" style="width:12px;height:12px;"></i> ${t.postcode || 'N/A'}</span>
                    <span style="font-size:0.85rem; color:${t.paymentStatus === 'Chargeable' ? '#ef4444' : '#10b981'}; font-weight:600; display:flex; align-items:center; gap:4px;"><i data-lucide="info" style="width:12px;height:12px;"></i> ${t.paymentStatus || 'N/A'}</span>
                </div>
                <div>
                    <button onclick="openAppointmentView('${t.id}')" style="background:#f59e0b; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 1px 2px rgba(0,0,0,0.1);" title="View Details">
                        <i data-lucide="clock" style="width:14px;height:14px;"></i> Waiting
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

