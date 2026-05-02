/**
 * Data Management, Rendering, and API Integration Module
 */

let records = [];
let customers = [];
let vtigerCustomersCache = JSON.parse(localStorage.getItem('vtiger_customers')) || [];
let personnel = DEFAULT_PERSONNEL;
let subServices = DEFAULT_SUB_SERVICES;
let customTariffs = [];
let pricingConfig = DEFAULT_PRICING_CONFIG;
let autoRules = DEFAULT_RULES;

async function initAppData() {
  try {
    // 1. Load Records
    const { data: dbRecords, error: recordsError } = await supabaseClient
      .from('records')
      .select('*')
      .order('TIMESTAMP', { ascending: false });

    if (!recordsError) {
      records = (dbRecords || []).map(r => mapDBRecordToApp(r));
    }

    // 2. Load Customers
    const { data: dbCustomers, error: custError } = await supabaseClient
      .from('customers')
      .select('*')
      .order('COMPANY', { ascending: true });
    
    if (!custError) {
        customers = dbCustomers || [];
    }

    // 3. Load Settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('app_settings')
      .select('*');

    if (!settingsError && settings) {
      settings.forEach(s => {
        if (s.id === 'personnel') personnel = s.data;
        if (s.id === 'sub_services') subServices = normalizeSubServices(s.data);
        if (s.id === 'pricing') pricingConfig = s.data;
        if (s.id === 'rules') autoRules = s.data;
      });
    }

    console.log('TaskFlow Data Initialized');
    
    renderDataTable();
    renderInvoicesTable();
    renderVTigerDatalist();
    renderStats();
    populateSettingsInputs();
    
  } catch (err) {
    console.error('Initialization error:', err);
    records = JSON.parse(localStorage.getItem('taskflow_records')) || [];
  }
}

function mapDBRecordToApp(r) {
    const mainServiceCodeMap = { "MENU UPDATE": "S1", "CREDIT CARD": "S2", "DATA RESET": "S3", "SERVICE": "S4", "OTHER": "S5", "TILL SETUP": "S6" };
    const mainService = r.mainService || r['MAIN SERVICE'] || '';
    
    return {
        id: r.id || r.ID || r['REC ID'] || '',
        dbId: r.ID || r.id,
        timestamp: r.TIMESTAMP,
        user: r.user || r.USER || '',
        crmTicket: r.crmTicket || r['CRM TICKET'] || '',
        serviceDate: r.serviceDate || r['INV DATE'] || '',
        company: r.company || r.COMPANY || '',
        postcode: r.postcode || r.POSTCODE || '',
        mainService: mainService,
        subService: r.subService || r['SUB SERVICE'] || '',
        duration: r.duration || r.DURATION || 0,
        price: r.price || r.PRICE || 0,
        paymentStatus: r.paymentStatus || r['PAYMENT STATUS'] || '',
        description: r.description || r.DESCRIPTION || '',
        status: r.status || r.STATUS || 'Logged',
        invoiced: r.invoiced || (r.STATUS === 'Completed'),
        onHold: r.onHold || (r.STATUS === 'On Hold'),
        mainServiceCode: mainServiceCodeMap[mainService] || "S5"
    };
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

// --- Dashboard Stats ---
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
    if (revEl) revEl.innerText = '£' + monthlyRev.toLocaleString(undefined, {minimumFractionDigits: 2});
    if (holdEl) holdEl.innerText = holdRecords;
}

// --- Table Rendering ---

let currentDataCategory = 'all';
function showDataSubTab(cat) {
  currentDataCategory = cat;
  document.querySelectorAll('#section-dataview .sub-nav-link').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`data-btn-${cat}`);
  if (activeBtn) activeBtn.classList.add('active');
  renderDataTable();
}

function renderDataTable() {
  const tbody = document.getElementById('data-table-body');
  if (!tbody) return;

  const searchQuery = document.getElementById('dataview-search')?.value.toLowerCase() || '';
  const startDate = document.getElementById('dataview-start-date')?.value;
  const endDate = document.getElementById('dataview-end-date')?.value;
  
  let filtered = [...records];
  if (currentDataCategory !== 'all') filtered = filtered.filter(r => r.mainServiceCode === currentDataCategory);
  if (startDate) filtered = filtered.filter(r => r.serviceDate >= startDate);
  if (endDate) filtered = filtered.filter(r => r.serviceDate <= endDate);
  if (searchQuery) {
    filtered = filtered.filter(r => 
      `${r.company} ${r.postcode} ${r.dbId} ${r.crmTicket}`.toLowerCase().includes(searchQuery)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 3rem; color: var(--text-hint);">No records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => renderDataRow(r)).join('');
}

function renderDataRow(r) {
    const badgeClass = r.status === 'Completed' ? 'badge-success' : (r.status === 'On Hold' ? 'badge-warning' : 'badge-error');
    return `
      <tr onclick="viewDetails('${r.id}')" style="cursor:pointer;">
        <td>${r.timestamp}</td>
        <td><small>${r.user}</small></td>
        <td><strong>${r.dbId}</strong><br><small style="color:var(--text-muted)">${r.crmTicket}</small></td>
        <td><strong>${r.company}</strong><br><small style="color:var(--text-muted)">${r.postcode}</small></td>
        <td>${r.mainService}<br><small>${r.subService}</small></td>
        <td><span class="badge ${badgeClass}">${r.status.toUpperCase()}</span></td>
        <td>£${r.price}</td>
        <td><button class="btn btn-primary" style="padding:4px 8px; font-size:11px;">Details</button></td>
      </tr>
    `;
}

let currentInvoiceFilter = 'all';
function setInvoiceFilter(f) {
    currentInvoiceFilter = f;
    document.querySelectorAll('#section-invoices .sub-nav-link').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.toLowerCase().includes(f)) btn.classList.add('active');
    });
    renderInvoicesTable();
}

function renderInvoicesTable() {
    const tbody = document.getElementById('invoices-table-body');
    if (!tbody) return;
    
    let filtered = records.filter(r => r.paymentStatus !== 'Free');
    if (currentInvoiceFilter === 'pending') filtered = filtered.filter(r => r.status === 'Logged');
    if (currentInvoiceFilter === 'hold') filtered = filtered.filter(r => r.status === 'On Hold');
    if (currentInvoiceFilter === 'completed') filtered = filtered.filter(r => r.status === 'Completed');
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 3rem; color: var(--text-hint);">No invoices found.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filtered.map(r => `
        <tr>
            <td>${r.timestamp}</td>
            <td><strong>${r.dbId}</strong></td>
            <td><strong>${r.company}</strong></td>
            <td>${r.mainService} - ${r.subService}</td>
            <td>£${r.price}</td>
            <td><span class="badge ${r.status === 'Completed' ? 'badge-success' : 'badge-error'}">${r.status.toUpperCase()}</span></td>
            <td>
                <button class="btn btn-primary" style="padding:5px 12px; font-size:12px;" onclick="viewDetails('${r.id}', true)">
                    ${r.status === 'Completed' ? 'View' : 'Process'}
                </button>
            </td>
        </tr>
    `).join('');
}

function renderCustomersTable() {
    const tbody = document.getElementById('customers-table-body');
    if (!tbody) return;
    const q = document.getElementById('customer-search')?.value.toLowerCase() || '';
    
    let filtered = vtigerCustomersCache;
    if (q) filtered = filtered.filter(c => c.companyName.toLowerCase().includes(q) || c.postcode.toLowerCase().includes(q));

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 3rem; color: var(--text-hint);">No customers found.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = filtered.slice(0, 100).map(c => `
        <tr>
            <td><strong>${c.companyId}</strong></td>
            <td>${c.companyName}</td>
            <td>${c.postcode}</td>
            <td>${c.phone || 'N/A'}</td>
            <td><span class="badge badge-success">ACTIVE</span></td>
        </tr>
    `).join('');
}

// --- Settings Rendering ---

function populateSettingsInputs() {
    // Pricing
    Object.keys(pricingConfig).forEach(key => {
        const el = document.getElementById(`p-${key}`);
        if (el) el.value = pricingConfig[key];
    });
    // Rules
    const rDur = document.getElementById('rule-duration-mins');
    const rSur = document.getElementById('rule-surcharge-price');
    if (rDur) rDur.value = autoRules.durationMins;
    if (rSur) rSur.value = autoRules.surcharge;
}

function renderPersonnel() {
    const list = document.getElementById('personnel-list');
    if (!list) return;
    list.innerHTML = personnel.map(p => `
        <div class="flex-between mb-1" style="padding:10px; background:var(--bg-hover); border-radius:8px;">
            <span>${p}</span>
            <button class="btn btn-error" style="padding:4px 8px;" onclick="deletePersonnel('${p}')">Delete</button>
        </div>
    `).join('');
    
    // Update Staff dropdown in form
    const staffSelect = document.getElementById('f-user');
    if (staffSelect) {
        staffSelect.innerHTML = personnel.map(p => `<option value="${p}">${p}</option>`).join('');
    }
}

function renderSubServiceManagement() {
    const cat = document.getElementById('manage-srv-cat').value;
    const list = document.getElementById('subservices-list');
    if (!list) return;
    
    const items = subServices[cat] || [];
    list.innerHTML = items.map(item => {
        const name = typeof item === 'string' ? item : item.name;
        const price = typeof item === 'object' ? item.price : 0;
        return `
            <div class="flex-between mb-1" style="padding:10px; background:var(--bg-hover); border-radius:8px;">
                <div><strong>${name}</strong> ${price > 0 ? `<br><small>£${price}</small>` : ''}</div>
                <button class="btn btn-error" style="padding:4px 8px;" onclick="deleteSubService('${cat}', '${name}')">Delete</button>
            </div>
        `;
    }).join('');
}

function renderActivityLog() {
    const list = document.getElementById('activity-list');
    if (!list) return;
    const logs = JSON.parse(localStorage.getItem('taskflow_activity')) || [];
    if (logs.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--text-hint); padding:2rem;">No recent activity.</p>';
        return;
    }
    list.innerHTML = logs.map(l => `
        <div style="display:flex; gap:12px; padding:12px; border-bottom:1px solid var(--border-color);">
            <div style="width:36px; height:36px; border-radius:50%; background:${l.color}; display:flex; align-items:center; justify-content:center;">
                <i data-lucide="${l.icon}" style="width:18px; height:18px; color:rgba(0,0,0,0.5);"></i>
            </div>
            <div>
                <div style="font-weight:600;">${l.action}</div>
                <div style="font-size:12px; color:var(--text-muted);">${l.detail} • ${l.user} • ${l.time}</div>
            </div>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

// --- Sync & Modal Details ---

function viewDetails(id, isInvoiceMode = false) {
    const record = records.find(r => r.id == id);
    if (!record) return;

    const modal = document.getElementById('details-modal');
    document.getElementById('modal-title').innerText = `Ticket: ${record.dbId}`;
    
    const footer = document.getElementById('modal-footer');
    footer.innerHTML = `
        <button class="btn" onclick="editRecord('${record.id}')">Edit</button>
        <button class="btn btn-primary" onclick="closeModal()">Close</button>
    `;

    document.getElementById('modal-details-content').innerHTML = `
        <div class="details-grid">
            <div class="detail-item"><strong>Company:</strong> ${record.company}</div>
            <div class="detail-item"><strong>Postcode:</strong> ${record.postcode}</div>
            <div class="detail-item"><strong>Service:</strong> ${record.mainService} - ${record.subService}</div>
            <div class="detail-item"><strong>Price:</strong> £${record.price} (${record.paymentStatus})</div>
            <div class="detail-item"><strong>Staff:</strong> ${record.user}</div>
            <div class="detail-item"><strong>Status:</strong> ${record.status}</div>
            <div class="detail-item" style="grid-column: 1 / -1;">
                <strong>Description:</strong>
                <div style="background:var(--bg-hover); padding:1rem; border-radius:8px; margin-top:5px; white-space: pre-wrap;">${record.description || 'No description provided.'}</div>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('details-modal').classList.add('hidden');
}

async function syncVTigerCustomers() {
  const btn = document.getElementById('btn-sync-vtiger');
  if (btn) { btn.disabled = true; btn.innerText = 'Syncing...'; }
  try {
    const res = await fetch('http://localhost:3005/customers');
    const json = await res.json();
    if (json.success && json.data) {
      vtigerCustomersCache = json.data;
      localStorage.setItem('vtiger_customers', JSON.stringify(vtigerCustomersCache));
      renderVTigerDatalist();
      renderCustomersTable();
      showToast(`Synced ${vtigerCustomersCache.length} customers`, 'success');
    } else { showToast('CRM Sync failed.', 'error'); }
  } catch (e) { showToast('CRM Bridge error.', 'error'); }
  finally { if (btn) { btn.disabled = false; btn.innerHTML = '🔄 Sync from CRM'; } }
}

function renderVTigerDatalist() {
    const dl = document.getElementById('vtiger-customer-list');
    if (!dl) return;
    dl.innerHTML = vtigerCustomersCache.map(c => `<option value="${c.companyName} [${c.companyId}]">`).join('');
}

async function syncRecordToSheets(record) {
    const sheetUrl = localStorage.getItem('google_sheet_url');
    if (!sheetUrl) return;
    try {
        await fetch(sheetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_record', data: record })
        });
    } catch (e) { console.error('Sheet sync error:', e); }
}

function logActivity(action, detail, icon = 'info', color = 'var(--primary-soft)') {
    const logs = JSON.parse(localStorage.getItem('taskflow_activity')) || [];
    const newLog = {
        user: localStorage.getItem('taskflow_logged_user') || 'System',
        action, detail, icon, color,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    logs.unshift(newLog);
    localStorage.setItem('taskflow_activity', JSON.stringify(logs.slice(0, 50)));
}

async function saveAppSettingToDB(id, data) {
    try {
        await supabaseClient.from('app_settings').upsert({ id, data, updated_at: new Date() });
        return true;
    } catch (e) {
        showToast('DB Save Error: ' + e.message, 'error');
        return false;
    }
}
