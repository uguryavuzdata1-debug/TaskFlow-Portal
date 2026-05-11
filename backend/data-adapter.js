/**
 * Data Adapter for Google Apps Script Backend
 * Replaces Supabase calls with Google Apps Script API calls
 * 
 * Replace existing data.js with this version
 */

let records = [];
let customers = [];
let personnel = DEFAULT_PERSONNEL;
let subServices = DEFAULT_SUB_SERVICES;
let customTariffs = [];
let pricingConfig = DEFAULT_PRICING_CONFIG;
let autoRules = DEFAULT_RULES;
let operatingSystems = ["Win11 Pro 24H2", "Win11 LTSC 2024 24H2", "Win10 LTSC 2021 21H2", "Win10 LTSC 2019", "Win10 LTSB 2016", "Win10 Pro", "Win7 Embedded", "Win7 Pro", "Other"];
let ccLocalSettings = ["Positive Credit Card", "PaymentSense V3 C", "Verifone Credit Card", "Windcave HIT Credit", "No-Use App"];
let cardCompanies = ["PaymentSense", "Dojo", "PaymentSave", "MerchantHub", "PaymentTap", "WorldPay", "United Payment", "Elavon"];
let tillCpu = ["i3", "i5", "Celeron", "ARM"];
let tillModels = ["iMin D4", "iMin Swan", "Sunmi T2", "Aures", "Other"];

// Google Apps Script Web App URL
// Update this with your deployed Google Apps Script Web App URL
const GAS_BACKEND_URL = 'https://script.google.com/macros/d/YOUR_SCRIPT_ID/usercontent'; // Update YOUR_SCRIPT_ID

/**
 * API Helper - Send requests to Google Apps Script backend
 */
async function gasAPICall(action, payload = {}) {
    try {
        const response = await fetch(GAS_BACKEND_URL, {
            method: 'POST',
            contentType: 'application/json',
            payload: JSON.stringify({ action, ...payload })
        });

        const text = await response.text();
        return JSON.parse(text);
    } catch (err) {
        console.error(`API Error (${action}):`, err);
        throw err;
    }
}

async function initAppData() {
    try {
        // 1. Load Records
        const recordsResponse = await gasAPICall('recordsRead', { filters: {} });
        if (!recordsResponse.error) {
            records = recordsResponse.data || [];
        }

        // 2. Load Customers
        const customersResponse = await gasAPICall('customersRead', {});
        if (!customersResponse.error) {
            customers = customersResponse.data || [];
        }

        // 3. Load Settings
        const settingsResponse = await gasAPICall('settingsRead', {});
        if (!settingsResponse.error) {
            const settings = settingsResponse.data || [];
            settings.forEach(s => {
                if (s.id === 'personnel') personnel = s.data;
                if (s.id === 'sub_services') subServices = normalizeSubServices(s.data);
                if (s.id === 'pricing') pricingConfig = s.data;
                if (s.id === 'rules') autoRules = s.data;
                if (s.id === 'operating_systems') operatingSystems = s.data;
                if (s.id === 'cc_local_settings') ccLocalSettings = s.data;
                if (s.id === 'card_companies') cardCompanies = s.data;
                if (s.id === 'till_cpu') tillCpu = s.data;
                if (s.id === 'till_models') tillModels = s.data;
            });
        }

        console.log('TaskFlow Data Initialized from Google Apps Script');

        renderDataTable();
        renderInvoicesTable();
        renderVTigerDatalist();
        renderStats();
        populateSettingsInputs();

    } catch (err) {
        console.error('Initialization error:', err);
        // Fallback to localStorage if API fails
        records = JSON.parse(localStorage.getItem('taskflow_records')) || [];
        showToast('Warning: Using local cache', 'warning');
    }
}

function normalizeSubServices(data) {
    const result = { ...DEFAULT_SUB_SERVICES };
    if (data && typeof data === 'object') {
        Object.keys(data).forEach(k => {
            if (Array.isArray(data[k])) result[k] = data[k];
        });
    }
    return result;
}

// ===== RECORDS CRUD =====

async function createRecord(recordData) {
    /**
     * Add new record to GAS backend
     */
    try {
        const response = await gasAPICall('recordsAdd', { record: recordData });

        if (response.error) {
            throw new Error(response.error);
        }

        // Add to local records array
        const newRecord = { ...recordData, id: response.data.id };
        records.unshift(newRecord);

        renderDataTable();
        return response.data;
    } catch (err) {
        console.error('Create record error:', err);
        throw err;
    }
}

async function updateRecordData(recordId, updates) {
    /**
     * Update existing record in GAS backend
     */
    try {
        const response = await gasAPICall('recordsUpdate', {
            id: recordId,
            updates: updates
        });

        if (response.error) {
            throw new Error(response.error);
        }

        // Update local array
        const recordIndex = records.findIndex(r => r.id === recordId || r.dbId === recordId);
        if (recordIndex > -1) {
            records[recordIndex] = { ...records[recordIndex], ...updates };
        }

        renderDataTable();
        return response.data;
    } catch (err) {
        console.error('Update record error:', err);
        throw err;
    }
}

async function deleteRecordData(recordId) {
    /**
     * Delete record from GAS backend
     */
    try {
        const response = await gasAPICall('recordsDelete', { id: recordId });

        if (response.error) {
            throw new Error(response.error);
        }

        // Remove from local array
        records = records.filter(r => r.id !== recordId && r.dbId !== recordId);

        renderDataTable();
        return response.data;
    } catch (err) {
        console.error('Delete record error:', err);
        throw err;
    }
}

// ===== CUSTOMERS CRUD =====

async function addCustomerData(customerData) {
    try {
        const response = await gasAPICall('customersAdd', { customer: customerData });

        if (response.error) {
            throw new Error(response.error);
        }

        customers.unshift({ ...customerData, ID: response.data.id });
        return response.data;
    } catch (err) {
        console.error('Add customer error:', err);
        throw err;
    }
}

async function updateCustomerData(customerId, updates) {
    try {
        const response = await gasAPICall('customersUpdate', {
            id: customerId,
            updates: updates
        });

        if (response.error) {
            throw new Error(response.error);
        }

        const custIndex = customers.findIndex(c => c.ID === customerId);
        if (custIndex > -1) {
            customers[custIndex] = { ...customers[custIndex], ...updates };
        }

        return response.data;
    } catch (err) {
        console.error('Update customer error:', err);
        throw err;
    }
}

// ===== SETTINGS =====

async function updateAppSettings(settingKey, settingValue, password = null) {
    /**
     * Update settings (requires password if updating certain keys)
     */
    try {
        const payload = {
            setting: settingKey,
            value: settingValue
        };

        if (password) {
            payload.password = password;
        }

        const response = await gasAPICall('settingsUpdate', payload);

        if (response.error) {
            throw new Error(response.error);
        }

        // Update local config if it's a known setting
        if (settingKey === 'personnel') personnel = settingValue;
        if (settingKey === 'pricing') pricingConfig = settingValue;
        if (settingKey === 'rules') autoRules = settingValue;
        if (settingKey === 'sub_services') subServices = normalizeSubServices(settingValue);

        return response.data;
    } catch (err) {
        console.error('Update settings error:', err);
        throw err;
    }
}

// ===== HELPER: Dashboard Stats =====

function renderStats() {
    const activeTickets = records.filter(r => r.status !== 'Completed').length;
    const monthlyRev = records
        .filter(r => {
            const date = new Date(r.timestamp);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && r.status === 'Completed';
        })
        .reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0);
    const holdRecords = records.filter(r => r.onHold || r.status === 'On Hold').length;

    const activeEl = document.getElementById('stat-active-tickets');
    const revEl = document.getElementById('stat-monthly-revenue');
    const holdEl = document.getElementById('stat-hold-records');

    if (activeEl) activeEl.innerText = activeTickets;
    if (revEl) revEl.innerText = '£' + monthlyRev.toLocaleString(undefined, { minimumFractionDigits: 2 });
    if (holdEl) holdEl.innerText = holdRecords;
}

function renderDataTable() {
    const tbody = document.getElementById('data-table-body');
    if (!tbody) return;

    const searchQuery = document.getElementById('dataview-search')?.value.toLowerCase() || '';

    let filtered = [...records];
    if (searchQuery) {
        filtered = filtered.filter(r =>
            `${r.company} ${r.postcode} ${r.id}`.toLowerCase().includes(searchQuery)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:2rem;">No records found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(r => `
    <tr class="${r.status === 'Completed' ? 'completed-row' : ''}">
      <td>${r.id || ''}</td>
      <td>${r.timestamp ? new Date(r.timestamp).toLocaleDateString() : ''}</td>
      <td>${r.user || ''}</td>
      <td>${r.company || ''}</td>
      <td>${r.postcode || ''}</td>
      <td>${r.mainService || ''}</td>
      <td>${r.subService || ''}</td>
      <td>£${parseFloat(r.price).toFixed(2)}</td>
      <td>${r.status || ''}</td>
      <td>
        <button onclick="selectRecordForEdit('${r.id}')" class="btn-small">Edit</button>
      </td>
    </tr>
  `).join('');
}

function renderInvoicesTable() {
    const tbody = document.getElementById('invoices-table-body');
    if (!tbody) return;

    const invoiceable = records.filter(r => r.status === 'Completed' && !r.invoiced);

    if (invoiceable.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10">No invoices pending</td></tr>';
        return;
    }

    tbody.innerHTML = invoiceable.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${r.company}</td>
      <td>£${parseFloat(r.price).toFixed(2)}</td>
      <td>
        <button onclick="markAsInvoiced('${r.id}')" class="btn-small">Mark Invoiced</button>
      </td>
    </tr>
  `).join('');
}

function renderVTigerDatalist() {
    // Placeholder - vTiger integration optional in GAS version
    console.log('vTiger data list (optional feature)');
}

function populateSettingsInputs() {
    const sheetUrlInput = document.getElementById('setting-sheet-url');
    if (sheetUrlInput) {
        sheetUrlInput.value = localStorage.getItem('google_sheet_url') || '';
    }
}
