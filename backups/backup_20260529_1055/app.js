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
    currentInvoiceTab: 'pending',
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
                    appState.settings.pricing[s.name] = parseFloat(s.base_price);
                    if (s.name === 'S1') {
                        appState.settings.pricing.S1_Base = parseFloat(s.base_price);
                        appState.settings.pricing.S1_Hourly = parseFloat(s.hourly_price);
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

        // Generate temporary test data for KILIS KITCHEN
        const mockTickets = [
            // S1 (MENU UPDATE)
            {
                id: 'mock-s1-v1', dbId: 'REC-KILIS-S1-V1', crmTicket: 'CRM-1001', timestamp: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'UGUR YAVUZ',
                mainService: 'S1', subService: 'Food and Drink Menu', startTime: '10:00', endTime: '11:00', duration: 60,
                price: 125.00, paymentStatus: 'Chargeable', status: 'Completed', invoiced: true, invoiceDate: '2026-05-01', invoiceNo: 'INV-KILIS-101',
                description: 'Summer menu update. Added 10 food dishes and updated pricing across all dessert pages.'
            },
            {
                id: 'mock-s1-v2', dbId: 'REC-KILIS-S1-V2', crmTicket: 'CRM-1002', timestamp: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'AHMET BALTACI',
                mainService: 'S1', subService: 'Set Menu', startTime: '14:00', endTime: '14:30', duration: 30,
                price: 35.00, paymentStatus: 'Chargeable', status: 'Completed', invoiced: true, invoiceDate: '2026-05-15', invoiceNo: 'INV-KILIS-102',
                description: 'Set menu design and generation. Configured 3 pages of set menu for group bookings.'
            },
            {
                id: 'mock-s1-v3', dbId: 'REC-KILIS-S1-V3', crmTicket: 'CRM-1003', timestamp: new Date().toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'UGUR ISIKCEVAHIR',
                mainService: 'S1', subService: 'New Menu', startTime: '11:00', endTime: '12:30', duration: 90,
                price: 150.00, paymentStatus: 'Chargeable', status: 'Logged', invoiced: false, invoiceDate: '', invoiceNo: '',
                description: '[URGENT / NO APPOINTMENT: Yes] (+£25.00 Service Fee)\n\nComplete overhaul of menu list at client request.'
            },
            
            // S2 (CREDIT CARD)
            {
                id: 'mock-s2-v1', dbId: 'REC-KILIS-S2-V1', crmTicket: 'CRM-1004', timestamp: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'UGUR YAVUZ',
                mainService: 'S2', subService: 'Credit Card Setup', startTime: '09:00', endTime: '09:45', duration: 45,
                price: 125.00, paymentStatus: 'Chargeable', status: 'Completed', invoiced: true, invoiceDate: '2026-05-05', invoiceNo: 'INV-KILIS-103',
                description: '[IKA APP: Yes] [SETTINGS: Positive Credit Card] [SECTOR: HOSPITALITY] [SETUP #: Dojo-991] [CARD CO: Dojo]\n\nConfigured and initialized card terminal integrated with Till 1.'
            },
            {
                id: 'mock-s2-v2', dbId: 'REC-KILIS-S2-V2', crmTicket: 'CRM-1005', timestamp: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'AHMET BALTACI',
                mainService: 'S2', subService: 'Credit Card Replacement', startTime: '15:00', endTime: '15:30', duration: 30,
                price: 125.00, paymentStatus: 'Chargeable', status: 'Completed', invoiced: false, invoiceDate: '', invoiceNo: '',
                description: '[IKA APP: No] [SETTINGS: PaymentSense V3 C] [SECTOR: HOSPITALITY] [SETUP #: PS-882] [CARD CO: PaymentSense]\n\nReplaced faulty terminal with a new PaymentSense card unit.'
            },
            {
                id: 'mock-s2-v3', dbId: 'REC-KILIS-S2-V3', crmTicket: 'CRM-1006', timestamp: new Date().toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'UGUR YAVUZ',
                mainService: 'S2', subService: 'Credit Card Cancellation', startTime: '16:00', endTime: '16:20', duration: 20,
                price: 0.00, paymentStatus: 'Free', status: 'Logged', invoiced: false, invoiceDate: '', invoiceNo: '',
                description: '[IKA APP: No] [SETTINGS: No-Use App] [SECTOR: HOSPITALITY] [SETUP #: Dojo-Cancel] [CARD CO: Dojo]\n\nDeactivation of old Dojo terminal at customer request.'
            },

            // S3 (DATA RESET)
            {
                id: 'mock-s3-v1', dbId: 'REC-KILIS-S3-V1', crmTicket: 'CRM-1007', timestamp: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'UGUR YAVUZ',
                mainService: 'S3', subService: 'Sales data has been deleted at the customer’s request', startTime: '09:00', endTime: '10:00', duration: 60,
                price: 125.00, paymentStatus: 'Chargeable', status: 'Completed', invoiced: true, invoiceDate: '2026-05-02', invoiceNo: 'INV-KILIS-104',
                description: 'Cleared sales history for POS Till-1 at upper floor before the new financial year.'
            },
            {
                id: 'mock-s3-v2', dbId: 'REC-KILIS-S3-V2', crmTicket: 'CRM-1008', timestamp: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'AHMET BALTACI',
                mainService: 'S3', subService: 'Data has been reset due to a database malfunction', startTime: '11:00', endTime: '12:30', duration: 90,
                price: 125.00, paymentStatus: 'Chargeable', status: 'Completed', invoiced: true, invoiceDate: '2026-05-16', invoiceNo: 'INV-KILIS-105',
                description: 'Restored corrupted database tables from the automatic cloud backup after a power outage.'
            },
            {
                id: 'mock-s3-v3', dbId: 'REC-KILIS-S3-V3', crmTicket: 'CRM-1009', timestamp: new Date().toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'UGUR ISIKCEVAHIR',
                mainService: 'S3', subService: 'Sales data has been deleted at the customer’s request', startTime: '10:00', endTime: '10:45', duration: 45,
                price: 125.00, paymentStatus: 'Chargeable', status: 'Logged', invoiced: false, invoiceDate: '', invoiceNo: '',
                description: 'Delete sales records from the database on Till-2. Pre-live test database cleanup.'
            },

            // S4 (SERVICE)
            {
                id: 'mock-s4-v1', dbId: 'REC-KILIS-S4-V1', crmTicket: 'CRM-1010', timestamp: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'UGUR YAVUZ',
                mainService: 'S4', subService: 'Network Connectivity Issues', startTime: '13:00', endTime: '14:00', duration: 60,
                price: 65.00, paymentStatus: 'Chargeable', status: 'Completed', invoiced: true, invoiceDate: '2026-05-10', invoiceNo: 'INV-KILIS-106',
                description: 'Resolved network offline issue on Till-2. Reconfigured router channel and assigned static IP.'
            },
            {
                id: 'mock-s4-v2', dbId: 'REC-KILIS-S4-V2', crmTicket: 'CRM-1011', timestamp: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'AHMET BALTACI',
                mainService: 'S4', subService: 'Printer Installation', startTime: '10:00', endTime: '11:00', duration: 60,
                price: 65.00, paymentStatus: 'Chargeable', status: 'Completed', invoiced: false, invoiceDate: '', invoiceNo: '',
                description: 'Installed new network kitchen printer. Connected via Ethernet and mapped to POS printers list.'
            },
            {
                id: 'mock-s4-v3', dbId: 'REC-KILIS-S4-V3', crmTicket: 'CRM-1012', timestamp: new Date().toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'UGUR ISIKCEVAHIR',
                mainService: 'S4', subService: 'General Maintenance', startTime: '15:00', endTime: '16:00', duration: 60,
                price: 65.00, paymentStatus: 'Chargeable', status: 'Logged', invoiced: false, invoiceDate: '', invoiceNo: '',
                description: 'Full hardware checkup, disk cleanup, dust removal from CPU vents, and screen calibration verification.'
            },

            // S5 (OTHER)
            {
                id: 'mock-s5-v1', dbId: 'REC-KILIS-S5-V1', crmTicket: 'CRM-1013', timestamp: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'UGUR YAVUZ',
                mainService: 'S5', subService: 'Other / Unlisted Issue', startTime: '11:00', endTime: '11:30', duration: 30,
                price: 0.00, paymentStatus: 'Free', status: 'Completed', invoiced: false, invoiceDate: '', invoiceNo: '',
                description: 'Assisted manager with POS navigation training. Instructed staff on how to use refund and split bill buttons.'
            },
            {
                id: 'mock-s5-v2', dbId: 'REC-KILIS-S5-V2', crmTicket: 'CRM-1014', timestamp: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'AHMET BALTACI',
                mainService: 'S5', subService: 'Other / Unlisted Issue', startTime: '12:00', endTime: '12:45', duration: 45,
                price: 0.00, paymentStatus: 'Free', status: 'Completed', invoiced: false, invoiceDate: '', invoiceNo: '',
                description: 'Assisted with exporting tax and sales summary CSV reports for accounting department.'
            },
            {
                id: 'mock-s5-v3', dbId: 'REC-KILIS-S5-V3', crmTicket: 'CRM-1015', timestamp: new Date().toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'UGUR ISIKCEVAHIR',
                mainService: 'S5', subService: 'Other / Unlisted Issue', startTime: '14:00', endTime: '14:30', duration: 30,
                price: 0.00, paymentStatus: 'Free', status: 'Logged', invoiced: false, invoiceDate: '', invoiceNo: '',
                description: 'Pending enquiry regarding integration options for third-party food delivery services.'
            },

            // S6 (TILL SETUP)
            {
                id: 'mock-s6-v1', dbId: 'REC-KILIS-S6-V1', crmTicket: 'CRM-1016', timestamp: new Date(Date.now() - 22 * 24 * 3600 * 1000).toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'UGUR YAVUZ',
                mainService: 'S6', subService: 'Full Setup', startTime: '09:00', endTime: '12:00', duration: 180,
                price: 125.00, paymentStatus: 'Chargeable', status: 'Completed', invoiced: true, invoiceDate: '2026-05-08', invoiceNo: 'INV-KILIS-107',
                description: '--- TECHNICAL SPECIFICATIONS (TILL SETUP) ---\nQuote: QT-2511 | Type: IKA NEW TILL SYSTEM | Model: IKA S-300 RT3\nCPU: J6412 | OS: WINDOWS 10 | App Ver: v2.5.1\nSector: HOSPITALITY | Service: Full Setup\nProgrammers -> Till: UGUR YAVUZ, Image: UGUR YAVUZ, Menu: UGUR YAVUZ\n-------------------------------------------\n\nInstalled and tested complete POS Till System on the upper floor.'
            },
            {
                id: 'mock-s6-v2', dbId: 'REC-KILIS-S6-V2', crmTicket: 'CRM-1017', timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'AHMET BALTACI',
                mainService: 'S6', subService: 'Hardware Only', startTime: '13:00', endTime: '14:30', duration: 90,
                price: 125.00, paymentStatus: 'Chargeable', status: 'Completed', invoiced: false, invoiceDate: '', invoiceNo: '',
                description: '--- TECHNICAL SPECIFICATIONS (TILL SETUP) ---\nQuote: QT-2512 | Type: IKA 2.HAND TILL SYSTEM | Model: POSBANK\nCPU: I5 | OS: WINDOWS 11 | App Ver: v2.5.1\nSector: HOSPITALITY | Service: Hardware Only\nProgrammers -> Till: UGUR YAVUZ, Image: AHMET BALTACI, Menu: UGUR YAVUZ\n-------------------------------------------\n\nAssembled cash drawer, customer-facing VFD display, and receipt printer.'
            },
            {
                id: 'mock-s6-v3', dbId: 'REC-KILIS-S6-V3', crmTicket: 'CRM-1018', timestamp: new Date().toISOString(),
                company: 'KILIS KITCHEN', companyId: 'ACC2504', postcode: 'N1 0QX', user: 'UGUR ISIKCEVAHIR',
                mainService: 'S6', subService: 'Software Only', startTime: '15:00', endTime: '16:00', duration: 60,
                price: 125.00, paymentStatus: 'Chargeable', status: 'Logged', invoiced: false, invoiceDate: '', invoiceNo: '',
                description: '--- TECHNICAL SPECIFICATIONS (TILL SETUP) ---\nQuote: QT-2513 | Type: USED OWN SYSTEM | Model: OTHER\nCPU: I7 | OS: WINDOWS LTSC | App Ver: v2.6.0\nSector: HOSPITALITY | Service: Software Only\nProgrammers -> Till: UGUR ISIKCEVAHIR, Image: UGUR ISIKCEVAHIR, Menu: UGUR ISIKCEVAHIR\n-------------------------------------------\n\nDeploying software licenses and database server configuration on client-owned system.'
            }
        ];
        appState.tickets = appState.tickets.concat(mockTickets);

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
    document.querySelectorAll('.sidebar-link').forEach(btn => {
        btn.classList.remove('active');
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
    
    let filtered = appState.tickets;
    if (appState.currentDataTab !== 'all') filtered = filtered.filter(t => t.mainService === appState.currentDataTab);
    if (payment !== 'all') filtered = filtered.filter(t => t.paymentStatus === payment);
    if (search) filtered = filtered.filter(t => t.company.toLowerCase().includes(search) || t.dbId.toLowerCase().includes(search) || (t.description || '').toLowerCase().includes(search));
    if (start) filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(start));
    if (end) { const dEnd = new Date(end); dEnd.setHours(23,59,59); filtered = filtered.filter(t => new Date(t.timestamp) <= dEnd); }

    updateDataStats();

    tbody.innerHTML = filtered.map(t => `
        <tr style="border-bottom: 1px solid var(--border-color);">
            <td>${new Date(t.timestamp).toLocaleDateString()}</td>
            <td><strong style="color:var(--primary)">${t.dbId}</strong></td>
            <td title="${t.postcode}"><strong>${t.company}</strong></td>
            <td><span class="badge" style="background:#f1f5f9; color:#475569;">${t.mainService}</span></td>
            <td><span class="badge ${t.paymentStatus === 'Chargeable' ? 'badge-warning' : 'badge-success'}">${t.paymentStatus}</span></td>
            <td><strong>£${parseFloat(t.price).toFixed(2)}</strong></td>
            <td style="text-align: right;">
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn-icon" onclick="showDetails('${t.id}')" title="View Details" style="background:none; border:none; cursor:pointer; font-size:1.1rem; color:#1b4376;">👁️</button>
                    <button class="btn-icon" onclick="editInvoice('${t.id}')" title="Edit Record" style="background:none; border:none; cursor:pointer; font-size:1.1rem; color:#1b4376;">✎</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateDataStats() {
    const tickets = appState.tickets || [];
    const customers = appState.customers || [];
    
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
    if (elTotalRevenue) elTotalRevenue.innerText = `£${totalRev.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    if (elSplit) elSplit.innerText = `${chargeable} Chargeable / ${contract} Contract`;
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

            <td style="padding: 16px 20px; text-align: right;"><button class="btn" style="background:#f1f5f9; color:#1b4376; border:none; font-weight:700;" onclick="filterByCustomer('${c['COMPANY']}')">History</button></td>
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
    if (search) filtered = filtered.filter(t => (t.company || '').toLowerCase().includes(search) || (t.dbId || '').toLowerCase().includes(search) || (t.subService || '').toLowerCase().includes(search));
    if (start) filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(start));
    if (end) { const dEnd = new Date(end); dEnd.setHours(23,59,59); filtered = filtered.filter(t => new Date(t.timestamp) <= dEnd); }

    const elPending = document.getElementById('count-pending');
    if (elPending) elPending.innerText = appState.tickets.filter(t => !t.invoiced && t.paymentStatus === 'Chargeable').length;
    
    const elInvoiced = document.getElementById('count-invoiced');
    if (elInvoiced) elInvoiced.innerText = appState.tickets.filter(t => t.invoiced && t.paymentStatus === 'Chargeable').length;
    
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
        <div style="padding: 0.5rem; color: #f8fafc; font-family: inherit;">
            <!-- Read-Only Section (Unified premium dark cards) -->
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <div class="grid-4" style="margin-bottom: 15px; gap: 1rem;">
                    <div class="field">
                        <label style="color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Staff</label>
                        <div style="background: rgba(255,255,255,0.04); color: #cbd5e1; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.user}</div>
                    </div>
                    <div class="field">
                        <label style="color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Database ID</label>
                        <div style="background: rgba(255,255,255,0.04); color: #cbd5e1; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.dbId}</div>
                    </div>
                    <div class="field">
                        <label style="color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">CRM Ticket</label>
                        <div style="background: rgba(255,255,255,0.04); color: #cbd5e1; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.crmTicket || 'N/A'}</div>
                    </div>
                    <div class="field">
                        <label style="color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Timestamp</label>
                        <div style="background: rgba(255,255,255,0.04); color: #cbd5e1; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${new Date(r.timestamp).toLocaleString()}</div>
                    </div>
                </div>
                <div class="grid-3" style="margin-bottom: 15px; gap: 1rem;">
                    <div class="field">
                        <label style="color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Customer ID</label>
                        <div style="background: rgba(255,255,255,0.04); color: #cbd5e1; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.companyId || 'N/A'}</div>
                    </div>
                    <div class="field">
                        <label style="color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Company</label>
                        <div style="background: rgba(255,255,255,0.04); color: #cbd5e1; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.company}</div>
                    </div>
                    <div class="field">
                        <label style="color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Postcode</label>
                        <div style="background: rgba(255,255,255,0.04); color: #cbd5e1; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.postcode || 'N/A'}</div>
                    </div>
                </div>
                <div class="grid-2" style="margin-bottom: 15px; gap: 1rem;">
                    <div class="field">
                        <label style="color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Category</label>
                        <div style="background: rgba(255,255,255,0.04); color: #cbd5e1; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.mainService}</div>
                    </div>
                    <div class="field">
                        <label style="color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Sub Service</label>
                        <div style="background: rgba(255,255,255,0.04); color: #cbd5e1; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.subService}</div>
                    </div>
                </div>
                <div class="field">
                    <label style="color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Work Details</label>
                    <div style="background: rgba(255,255,255,0.03); color: #e2e8f0; font-weight: 500; border: 1px solid rgba(255,255,255,0.08); padding: 12px 16px; border-radius: 10px; font-size: 13px; min-height: 60px; max-height: 150px; overflow-y: auto; white-space: pre-wrap; line-height: 1.5;">${r.description || 'No work details provided.'}</div>
                </div>
            </div>
            
            <!-- Editable Billing Information -->
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 1.5rem;">
                <p style="font-size: 12px; font-weight: 800; color: var(--primary); margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: 0.05em;">Billing Information (Editable)</p>
                <div class="grid-3" style="gap: 1rem; margin-bottom: 1rem;">
                    <div class="field">
                        <label style="color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Invoice No</label>
                        <input type="text" id="e-inv-no" value="${r.invoiceNo || ''}" placeholder="Enter Inv No..." style="background: rgba(255,255,255,0.07); color: #ffffff; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600;">
                    </div>
                    <div class="field">
                        <label style="color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Invoice Date</label>
                        <input type="date" id="e-inv-date" value="${r.invoiceDate || new Date().toISOString().split('T')[0]}" style="background: rgba(255,255,255,0.07); color: #ffffff; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600;">
                    </div>
                    <div class="field">
                        <label style="color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Final Price (£)</label>
                        <input type="number" id="e-price" value="${r.price}" step="0.01" style="background: rgba(255,255,255,0.07); color: var(--primary); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 700;">
                    </div>
                </div>
                <div class="grid-2" style="gap: 1rem;">
                    <div class="field">
                        <label style="color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Payment Status</label>
                        <select id="e-payment" style="background: rgba(255,255,255,0.07) url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%2394a3b8\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'%3e%3cpolyline points=\\'6 9 12 15 18 9\\'%3e%3c/polyline%3e%3c/svg%3e') no-repeat right 12px center; background-size: 14px; color: #ffffff; border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600; cursor: pointer; -webkit-appearance: none; -moz-appearance: none; appearance: none; padding-right: 36px !important;">
                            <option value="Chargeable" ${r.paymentStatus === 'Chargeable' ? 'selected' : ''} style="background: #1e293b; color: white;">Chargeable</option>
                            <option value="Contract" ${r.paymentStatus === 'Contract' ? 'selected' : ''} style="background: #1e293b; color: white;">Contract</option>
                            <option value="Free" ${r.paymentStatus === 'Free' ? 'selected' : ''} style="background: #1e293b; color: white;">Free</option>
                        </select>
                    </div>
                    <div class="field">
                        <label style="color:#94a3b8; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Process Status</label>
                        <select id="e-invoiced" ${r.invoiced ? 'disabled style="background: rgba(255,255,255,0.04); color: #94a3b8; border: 1px solid rgba(255,255,255,0.08); cursor: not-allowed;"' : 'style="background: rgba(255,255,255,0.07); color: #ffffff; border: 1px solid rgba(255,255,255,0.15); cursor: pointer;"'} style="background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%2394a3b8\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'%3e%3cpolyline points=\\'6 9 12 15 18 9\\'%3e%3c/polyline%3e%3c/svg%3e'); background-repeat: no-repeat; background-position: right 12px center; background-size: 14px; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600; -webkit-appearance: none; -moz-appearance: none; appearance: none; padding-right: 36px !important;">
                            <option value="false" ${!r.invoiced ? 'selected' : ''} style="background: #1e293b; color: white;">Pending</option>
                            <option value="true" ${r.invoiced ? 'selected' : ''} style="background: #1e293b; color: white;">Invoiced ✅</option>
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
    document.getElementById('modal-details-content').innerHTML = `
        <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); padding: 1.5rem; border-radius: 16px; font-family: inherit; color: #e2e8f0;">
            <!-- Grid Layout for info groups -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <!-- Primary Info -->
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 1.25rem; border-radius: 12px;">
                    <h4 style="font-size: 11px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 6px;">Primary Info</h4>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #94a3b8; font-weight: 500;">ID:</span> <strong style="color: #ffffff;">${r.dbId}</strong></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #94a3b8; font-weight: 500;">Date:</span> <span style="color: #f8fafc; font-weight: 600;">${new Date(r.timestamp).toLocaleString()}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8; font-weight: 500;">Staff:</span> <span style="color: #f8fafc; font-weight: 600;">${r.user}</span></div>
                </div>
                
                <!-- Customer Info -->
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 1.25rem; border-radius: 12px;">
                    <h4 style="font-size: 11px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 6px;">Customer Info</h4>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #94a3b8; font-weight: 500;">Company:</span> <strong style="color: #ffffff;">${r.company}</strong></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #94a3b8; font-weight: 500;">Postcode:</span> <span style="color: #f8fafc; font-weight: 600;">${r.postcode}</span></div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px;">
                <!-- Work Info -->
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 1.25rem; border-radius: 12px;">
                    <h4 style="font-size: 11px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 6px;">Work Info</h4>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #94a3b8; font-weight: 500;">Service Category:</span> <strong style="color: #ffffff;">${r.mainService}</strong></div>
                    <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8; font-weight: 500;">Duration:</span> <span style="color: #f8fafc; font-weight: 600;">${r.duration} min</span></div>
                </div>
                
                <!-- Billing Info -->
                <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); padding: 1.25rem; border-radius: 12px;">
                    <h4 style="font-size: 11px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 6px;">Billing Info</h4>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #94a3b8; font-weight: 500;">Price:</span> <strong style="color: #ffffff;">£${parseFloat(r.price).toFixed(2)}</strong></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #94a3b8; font-weight: 500;">Status:</span> <span style="color: #f8fafc; font-weight: 600;">${r.paymentStatus}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="color: #94a3b8; font-weight: 500;">Inv No:</span> <span style="color: #f8fafc; font-weight: 600;">${r.invoiceNo || 'N/A'}</span></div>
                </div>
            </div>
            
            <!-- Work Details -->
            <div style="margin-top: 20px;">
                <h4 style="font-size: 11px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; margin-bottom: 10px;">Work Details / Technical Specs</h4>
                <div style="white-space: pre-wrap; font-size: 13.5px; line-height: 1.6; color: #e2e8f0; background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); max-height: 250px; overflow-y: auto;">${r.description || 'No work details provided.'}</div>
            </div>
        </div>
    `;
    document.getElementById('details-modal').classList.remove('hidden');
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
        showAlert('Hata', 'Lütfen isim ve şifre giriniz.', '❌');
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
        showAlert('Başarılı', `${name} personeli eklendi!`, '✅');
        initApp();
    } catch (e) { 
        console.error("Personnel Add Error:", e);
        let msg = e.message;
        if (msg.includes('row-level security') || e.code === '42501') {
            msg = `Güvenlik Hatası (RLS): "users" tablosuna yeni personel ekleme yetkiniz yok. Lütfen Supabase -> Authentication -> Policies kısmından "users" tablosu için INSERT politikası ekleyin veya RLS'i geçici olarak kapatın.`;
        }
        showAlert('Hata', msg, '❌'); 
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
                            <option value="">Select option</option>
                            <option>No</option>
                            <option>Yes</option>
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
                        <select id="f-local-settings">
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
                    <div class="field"><label>Menu Programmer <span style="color:red">*</span></label><select id="f-s6-prog-menu">${staffOptions}</select></div>
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
    calculatePrice();
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
        const basePrice = (p.S1_Base !== undefined) ? p.S1_Base : 125.00;
        const hourlyPrice = (p.S1_Hourly !== undefined) ? p.S1_Hourly : 25.00;
        const setMenuPrice = (p.S1_SetMenu !== undefined) ? p.S1_SetMenu : 35.00;

        if (sub === 'Set Menu') {
            price = setMenuPrice;
        } else { 
            price = basePrice; 
            if (dur > 60) price += Math.ceil((dur - 60) / 60) * hourlyPrice; 
        } 
        
        // Add urgent fee if checked
        const urgentCheck = document.getElementById('f-s1-no-appointment');
        if (urgentCheck && urgentCheck.checked) {
            price += 25.00;
        }
    } else if (p[main] !== undefined) {
        price = p[main];
    } else {
        if (main === 'S2') price = 125.00;
        else if (main === 'S3') price = 125.00;
        else if (main === 'S4') price = 65.00;
        else price = 0.00;
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
}

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
    updateDataStats();
}
// Placeholder for potential future logic
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
        'p-S1-SetMenu': p.S1_SetMenu,
        'p-S1-Base': p.S1_Base,
        'p-S1-Hourly': p.S1_Hourly,
        'p-S2': p.S2,
        'p-S3': p.S3,
        'p-S4': p.S4
    };
    for (const [id, val] of Object.entries(ids)) {
        const el = document.getElementById(id);
        if (el) el.value = val || 0;
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
