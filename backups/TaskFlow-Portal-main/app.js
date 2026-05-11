// --- Supabase Configuration ---
const SUPABASE_URL = 'https://ekjhhjrhfkoiklyxjfpu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hz1a48NHx7c8RPV_RYHfZg_YNvnNOdH';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Authentication ---
function handleLogin() {
  const user = document.getElementById('login-username').value;
  const pass = document.getElementById('login-password').value;
  if (user && pass) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-nav').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    showTab('dashboard');
  } else {
    alert('Please enter username and password.');
  }
}

function handleLogout() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('main-nav').classList.add('hidden');
  document.getElementById('main-content').classList.add('hidden');
}

// --- Data Initialization ---
const defaultSubServices = {
  S1: ["Food and Drink Menu", "Food Menu Only", "Drink Menu Only", "Dessert Menu", "Set Menu", "New Menu"],
  S2: ["Credit Card Setup", "Credit Card Replacement", "Credit Card Cancellation"],
  S3: ["Sales data has been deleted at the customer’s request.", "Data has been reset due to a database malfunction."],
  S4: ["Network Connectivity Issues", "Wi-Fi Setup / Troubleshooting", "Modem / Router Configuration", "Operating System Installation", "Virus Removal", "SSD Replacement / Upgrade", "RAM Upgrade", "Hardware Repair", "Printing Problems", "General Maintenance"],
  S5: ["Other / Unlisted Issue"],
  S6: ["New Till Installation", "Till System Reconfiguration"]
};

const defaultPersonnel = ["UGUR YAVUZ", "AHMET BALTACI", "UGUR ISIKCEVAHIR"];

const defaultPricingConfig = {
  S1_SetMenu: 35.00,
  S1_Base: 125.00,
  S1_Hourly: 25.00,
  S2: 125.00,
  S3: 125.00,
  S4: 65.00,
  S6: 0.00
};

let subServices = defaultSubServices;
let personnel = defaultPersonnel;
let records = [];
let customers = [];
let vtigerCustomersCache = JSON.parse(localStorage.getItem('vtiger_customers')) || [];
let pricingConfig = defaultPricingConfig;

// Initialize and Load from Supabase
async function initAppData() {
  try {
    // 1. Load Records
    const { data: dbRecords, error: recordsError } = await supabaseClient
      .from('records')
      .select('*')
      .order('TIMESTAMP', { ascending: false });

    if (!recordsError) {
      records = (dbRecords || []).map(r => ({
        id: r.id,
        dbId: r.ID,
        crmTicket: r['CRM TICKET'],
        timestamp: r.TIMESTAMP,
        company: r.COMPANY,
        postcode: r.POSTCODE,
        user: r.USER,
        mainService: r['MAIN SERVICE'],
        subService: r['SUB SERVICE'],
        startTime: r['START TIME'],
        endTime: r['END TIME'],
        duration: r.DURATION,
        price: r.PRICE,
        paymentStatus: r['PAYMENT STATUS'],
        description: r.DESCRIPTION,
        status: r.STATUS,
        invoiced: r.invoiced,
        invoiceDate: r['INV DATE'],
        invoiceNo: r['INV NO'],
        invoiceNote: r['INV NOTE']
      }));
    }

    // 1.5 Load Customers
    const { data: dbCustomers, error: custError } = await supabaseClient
      .from('customers')
      .select('*')
      .order('COMPANY', { ascending: true });
    
    if (!custError) {
        customers = dbCustomers || [];
    }

    // 2. Load Settings (Personnel, SubServices, Pricing)
    const { data: settings, error: settingsError } = await supabaseClient
      .from('app_settings')
      .select('*');

    if (!settingsError && settings) {
      settings.forEach(s => {
        if (s.id === 'personnel') personnel = s.data;
        if (s.id === 'sub_services') subServices = s.data;
        if (s.id === 'pricing') pricingConfig = s.data;
      });
    }

    console.log('Supabase Data Loaded:', { recordsCount: records.length });
    
    // Refresh UI
    if (typeof renderDataTable === 'function') renderDataTable();
    if (typeof renderInvoicesTable === 'function') renderInvoicesTable();
    if (typeof renderSubServiceManagement === 'function') renderSubServiceManagement();
    if (typeof renderPersonnelList === 'function') renderPersonnelList();
    
  } catch (err) {
    console.error('Error loading data from Supabase:', err);
    // Fallback to localStorage if needed
    records = JSON.parse(localStorage.getItem('taskflow_records')) || [];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAppData();
  renderVTigerDatalist();
});

// --- Tab Navigation ---
function showTab(tabName) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const targetSection = document.getElementById(`section-${tabName}`);
  const targetLink = document.getElementById(`btn-${tabName}`);
  if (targetSection) targetSection.classList.add('active');
  if (targetLink) targetLink.classList.add('active');
  
  // Reset dashboard view if going to dashboard
  if (tabName === 'dashboard') {
    toggleMainForm('home');
  }

  if (tabName === 'dataview') renderDataTable();
  if (tabName === 'invoices') renderInvoicesTable();
  if (tabName === 'customers') renderCustomersTable();
  window.scrollTo(0, 0);
}

function toggleMainForm(state) {
  const home = document.getElementById('dashboard-home');
  const selection = document.getElementById('dashboard-category-selection');
  const form = document.getElementById('dashboard-form-container');
  
  // Hide everything first
  home.style.display = 'none';
  if (selection) selection.style.display = 'none';
  if (form) form.style.display = 'none';
  
  if (state === 'category') {
    if (selection) selection.style.display = 'block';
  } else if (state === 'form') {
    if (form) form.style.display = 'block';
  } else {
    home.style.display = 'block';
  }
}

function selectCategory(categoryCode) {
  // 1. Reset form for a fresh start
  resetForm();
  
  // 2. Set the selected category
  const categorySelect = document.getElementById('f-service-type');
  if (categorySelect) {
    categorySelect.value = categoryCode;
    categorySelect.disabled = true; // Lock the selection
    // 3. Update fields based on selected category
    updateDynamicFields();
  }
  
  // 4. Transition to form view
  toggleMainForm('form');
}

function renderCustomersTable() {
  const tbody = document.getElementById('customers-table-body');
  if (!tbody) return;
  const searchQuery = document.getElementById('customer-search')?.value.toLowerCase() || '';
  const pageSize = document.getElementById('customer-page-size')?.value || '25';
  
  let customerMap = new Map();
  
  // 1. Load CRM customers
  (vtigerCustomersCache || []).forEach(c => {
    customerMap.set(c.companyId.toLowerCase().trim(), {
      dateAdded: c.registerDate || 'CRM Record',
      companyId: c.companyId,
      company: c.companyName,
      postcode: c.postcode || 'N/A',
      status: c.status || 'Active',
      lastUpdate: c.lastUpdate || 'vTiger CRM'
    });
  });

  // 2. Overwrite/Merge with local records for fresh activity
  [...records].sort((a, b) => a.id - b.id).forEach(r => {
    if (!r.company) return;
    const cid = (r.companyId || r.company).toLowerCase().trim();
    if (!customerMap.has(cid)) {
      customerMap.set(cid, {
        dateAdded: r.timestamp,
        companyId: r.companyId || 'N/A',
        company: r.company,
        postcode: r.postcode || 'N/A',
        status: r.status || 'Active',
        lastUpdate: r.timestamp
      });
    } else {
      let exist = customerMap.get(cid);
      exist.status = r.status || 'Active';
      exist.lastUpdate = r.timestamp;
    }
  });

  let customers = Array.from(customerMap.values());

  // Search Filter
  if (searchQuery) {
    customers = customers.filter(c => {
      const matchString = `${c.company} ${c.companyId} ${c.postcode}`.toLowerCase();
      return matchString.includes(searchQuery);
    });
  }

  // Sorting: Newest interaction first
  customers.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));

  // Pagination Logic
  const totalCount = customers.length;
  if (pageSize !== 'all') {
    customers = customers.slice(0, parseInt(pageSize));
  }

  if (customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-hint);">No customers match your search.</td></tr>`;
    return;
  }

  tbody.innerHTML = customers.map(c => {
    // Condition check for status colors
    const isInProgress = c.status.toLowerCase().includes('in progress');
    const badgeStyle = isInProgress 
      ? "background:#dcfce7; color:#166534; border: 1px solid #bbf7d0;" // Green style
      : "background:#e0f2fe; color:#0369a1; border: 1px solid #bae6fd;"; // Default Blue style

    return `
    <tr>
      <td style="font-size: 12px; color: var(--text-muted);">${c.dateAdded}</td>
      <td><strong>${c.companyId}</strong></td>
      <td><strong style="color: var(--primary);">${c.company}</strong></td>
      <td>${c.postcode}</td>
      <td><span class="badge" style="${badgeStyle}">${c.status}</span></td>
      <td>
        <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="document.getElementById('dataview-search').value='${c.company}'; showTab('dataview');">View Records</button>
      </td>
    </tr>
    `;
  }).join('');
}

// --- vTiger Integration Handlers ---

function autoFillCustomerInfo() {
  const val = document.getElementById('f-company').value;
  const match = val.match(/(.+) \[([^\]]+)\]$/);
  if (match) {
    const name = match[1].trim();
    const id = match[2].trim();
    const customer = vtigerCustomersCache.find(c => c.companyId === id);
    
    if (customer) {
      document.getElementById('f-company').value = customer.companyName;
      document.getElementById('f-company-id').value = customer.companyId;
      document.getElementById('f-postcode').value = customer.postcode || '';
    }
  }
}

async function syncVTigerCustomers() {
  const btn = document.getElementById('btn-sync-vtiger');
  if(btn) btn.innerText = 'Syncing...';
  
  try {
    const res = await fetch('http://localhost:3005/customers');
    const json = await res.json();
    if(json.success && json.data) {
      vtigerCustomersCache = json.data;
      localStorage.setItem('vtiger_customers', JSON.stringify(vtigerCustomersCache));
      renderVTigerDatalist();
      
      // Merge with records and push to Google Sheets
      await pushCustomersToSheet();
      
      if (document.getElementById('section-customers').classList.contains('active')) {
        renderCustomersTable();
      }
      alert(`Successfully synced ${vtigerCustomersCache.length} customers from vTiger and pushed to Google Sheets!`);
    } else {
      alert('Failed to sync. Is the vTiger Bridge Script running?');
    }
  } catch(e) {
    alert('Connection error! Please ensure your "start_vtiger_bridge.bat" is running in the background. Error: ' + e.message);
  }
  
  if(btn) btn.innerHTML = '🔄 Sync from CRM';
}

async function pushCustomersToSheet() {
  const url = localStorage.getItem('taskflow_gas_url');
  if (!url) return; // No sheet configured
  
  let customerMap = new Map();
  const nowStr = new Date().toLocaleString('en-GB');

  // Load CRM customers first
  (vtigerCustomersCache || []).forEach(c => {
    customerMap.set(c.companyId.toLowerCase().trim(), {
      timestamp: nowStr,
      companyId: c.companyId,
      companyName: c.companyName,
      postcode: c.postcode || 'N/A',
      status: c.status || 'Active',
      registerDate: c.registerDate || 'vTiger CRM',
      lastUpdate: c.lastUpdate || 'vTiger CRM',
      lastNote: c.lastNote || ''
    });
  });

  // Load local records to add history data
  [...records].sort((a, b) => a.id - b.id).forEach(r => {
    if (!r.company) return;
    const cid = (r.companyId || r.company).toLowerCase().trim();
    const currentNote = r.invoiceNote || r.description || '';
    
    if (!customerMap.has(cid)) {
      customerMap.set(cid, {
        timestamp: r.timestamp,
        companyId: r.companyId || 'N/A',
        companyName: r.company,
        postcode: r.postcode || 'N/A',
        status: r.status || 'Active',
        registerDate: r.timestamp,
        lastUpdate: r.timestamp,
        lastNote: currentNote
      });
    } else {
      let exist = customerMap.get(cid);
      exist.lastUpdate = r.timestamp; // update with latest activity
      exist.status = r.status || 'Active';
      if (currentNote) exist.lastNote = currentNote; // update note if exists
    }
  });

  const payload = {
    action: 'sync_customers',
    customers: Array.from(customerMap.values())
  };

  try {
    // Fire and forget (no-cors prevents reading successful JSON but will still post it)
    fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch(e) {
    console.error('Failed to push customers to sheets', e);
  }
}

function showSubTab(subTabName) {
  // Hide all sub-sections
  const subSections = document.querySelectorAll('.sub-section');
  subSections.forEach(s => {
    s.style.display = 'none';
    s.classList.remove('active');
  });
  
  // Deactivate all sub-links
  const subLinks = document.querySelectorAll('.sub-nav-link');
  subLinks.forEach(l => {
    l.classList.remove('active');
    l.style.background = 'transparent';
    l.style.color = 'var(--text-muted)';
  });
  
  // Show target
  const targetSub = document.getElementById(`sub-section-${subTabName}`);
  const targetBtn = document.getElementById(`sub-btn-${subTabName}`);
  
  if (targetSub) {
    targetSub.style.display = 'block';
    targetSub.classList.add('active');
  }
  
  if (targetBtn) {
    targetBtn.classList.add('active');
    targetBtn.style.background = 'var(--bg-hover)';
    targetBtn.style.color = 'var(--text-main)';
  }
}

// --- Dynamic Fields ---
function updateDynamicFields() {
  const mainService = document.getElementById('f-service-type').value;
  const subServiceSelect = document.getElementById('f-sub-service');
  const options = subServices[mainService] || [];
  subServiceSelect.innerHTML = options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
  
  const container = document.getElementById('dynamic-fields-container');
  let extraHtml = '';

  // Credit Card Specific Fields
  if (mainService === 'S2') {
    extraHtml = `
      <div class="grid-4 mt-2" style="background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 8px; border: 1px dashed var(--border-color);">
        <div class="field">
          <label>IKA App <span style="color:red">*</span></label>
          <select id="f-ika-app">
            <option value="">Select option</option>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>
        <div class="field">
          <label>Local Settings <span style="color:red">*</span></label>
          <select id="f-local-settings">
            <option value="">Select settings</option>
            <option value="Positive Credit Card">Positive Credit Card</option>
            <option value="PaymentSense V3 Credit Card">PaymentSense V3 Credit Card</option>
            <option value="Verifone Credit Card">Verifone Credit Card</option>
            <option value="Windcave HIT Credit Card">Windcave HIT Credit Card</option>
            <option value="No-Use App">No-Use App</option>
          </select>
        </div>
        <div class="field">
          <label>Card Setup Number <span style="color:red">*</span></label>
          <input type="text" id="f-card-setup-no" placeholder="Enter number">
        </div>
        <div class="field">
          <label>Card Company <span style="color:red">*</span></label>
          <select id="f-card-company">
            <option value="">Select company</option>
            <option value="PaymentSense">PaymentSense</option>
            <option value="MerchantHub">MerchantHub</option>
            <option value="PaymentSave">PaymentSave</option>
            <option value="PaymenTap">PaymenTap</option>
            <option value="WorldPay">WorldPay</option>
            <option value="United Payment">United Payment</option>
            <option value="Elavon">Elavon</option>
            <option value="Dojo">Dojo</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
      </div>
    `;
  }

  // Till Setup Specific Fields
  if (mainService === 'S6') {
    const staffOptions = personnel.map(p => `<option value="${p}">${p}</option>`).join('');

    extraHtml = `
      <div class="grid-5 mt-2" style="background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 8px; border: 1px dashed var(--border-color);">
        <div class="field">
          <label>Quote No. <span style="color:red">*</span></label>
          <input type="text" id="f-quote-no" placeholder="CRM Quote#">
        </div>
        <div class="field">
          <label>System Type <span style="color:red">*</span></label>
          <select id="f-system-type">
            <option value="">Select type</option>
            <option value="IKA NEW TILL SYSTEM">IKA NEW TILL SYSTEM</option>
            <option value="USED OWN SYSTEM">USED OWN SYSTEM</option>
            <option value="IKA 2.HAND TILL SYSTEM">IKA 2.HAND TILL SYSTEM</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
        <div class="field">
          <label>Till Model <span style="color:red">*</span></label>
          <select id="f-till-model">
            <option value="">Select Model</option>
            <option value="IKA S-300 RT3">IKA S-300 RT3</option>
            <option value="IKA S-100">IKA S-100</option>
            <option value="IKA S-150">IKA S-150</option>
            <option value="IKA S-150 8GB">IKA S-150 8GB</option>
            <option value="IKA S-200 (I5)">IKA S-200 (I5)</option>
            <option value="IKA RT-12">IKA RT-12</option>
            <option value="RT-3">RT-3</option>
            <option value="RT-6">RT-6</option>
            <option value="PHOENIX">PHOENIX</option>
            <option value="OKPOS Z">OKPOS Z</option>
            <option value="OPTIMUS">OPTIMUS</option>
            <option value="POSBANK">POSBANK</option>
            <option value="AURES">AURES</option>
            <option value="MAZIC 1500">MAZIC 1500</option>
            <option value="BST">BST</option>
            <option value="RUGGED TABLET">RUGGED TABLET</option>
            <option value="NO NAME">NO NAME</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
        <div class="field">
          <label>CPU <span style="color:red">*</span></label>
          <select id="f-cpu">
            <option value="">Select CPU</option>
            <option value="J6412">J6412</option>
            <option value="J1900">J1900</option>
            <option value="J4125">J4125</option>
            <option value="J1037U">J1037U</option>
            <option value="I3">I3</option>
            <option value="I5">I5</option>
            <option value="I7">I7</option>
            <option value="ATOM">ATOM</option>
            <option value="N97">N97</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
        <div class="field">
          <label>OS Version <span style="color:red">*</span></label>
          <select id="f-os-version">
            <option value="">Select OS</option>
            <option value="WIN 11 24H2">WIN 11 24H2</option>
            <option value="LTSC 21H2">LTSC 21H2</option>
            <option value="LTSC 2018">LTSC 2018</option>
            <option value="LTSC 2016">LTSC 2016</option>
            <option value="LTSC">LTSC</option>
            <option value="WIN 10 PRO">WIN 10 PRO</option>
            <option value="WIN 10 22H2">WIN 10 22H2</option>
            <option value="WIN 7 PRO">WIN 7 PRO</option>
            <option value="WIN 7 EMBEDDED">WIN 7 EMBEDDED</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
      </div>

      <div class="grid-3 mt-1" style="background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 8px; border: 1px dashed var(--border-color); border-top:none;">
        <div class="field">
          <label>App Version <span style="color:red">*</span></label>
          <input type="text" id="f-app-version" placeholder="e.g. v2.4.5">
        </div>
        <div class="field">
          <label>Sector <span style="color:red">*</span></label>
          <select id="f-sector">
            <option value="">Select sector</option>
            <option value="RETAIL">RETAIL</option>
            <option value="HOSPITALITY">HOSPITALITY</option>
          </select>
        </div>
        <div class="field">
          <label>Service Option <span style="color:red">*</span></label>
          <select id="f-service-option">
            <option value="">Select option</option>
            <option value="NEW MENU">NEW MENU</option>
            <option value="RETAIL TEMPLATE">RETAIL TEMPLATE</option>
            <option value="CUSTOMER BACK UP">CUSTOMER BACK UP</option>
            <option value="SLAVE TILL">SLAVE TILL</option>
          </select>
        </div>
      </div>

      <div class="grid-3 mt-1" style="background: rgba(0,0,0,0.02); padding: 1rem; border-radius: 8px; border: 1px dashed var(--border-color); border-top:none;">
        <div class="field">
          <label>Till Programmer <span style="color:red">*</span></label>
          <select id="f-till-prog">${staffOptions}</select>
        </div>
        <div class="field">
          <label>Image Programmer <span style="color:red">*</span></label>
          <select id="f-img-prog">${staffOptions}</select>
        </div>
        <div class="field">
          <label>Menu Programmer <span style="color:red">*</span></label>
          <select id="f-menu-prog">${staffOptions}</select>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    ${extraHtml}
    <div class="field mt-2">
      <label>Service Description / Update Info <span style="color:red">*</span></label>
      <textarea id="f-desc" placeholder="Provide detailed notes or Update Info for this ${mainService} task..." style="min-height: 100px;"></textarea>
    </div>
  `;
  
  calculateEstimatedPrice();
}

// --- Pricing & Time Calculations ---
function calculateDuration() {
  const start = document.getElementById('f-start-time').value;
  const end = document.getElementById('f-end-time').value;
  const durationField = document.getElementById('f-duration');

  if (start && end) {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff < 0) diff += 1440;
    durationField.value = diff;
  } else {
    durationField.value = "0";
  }
  calculateEstimatedPrice();
}

function renderVTigerDatalist() {
  const datalist = document.getElementById('vtiger-customer-list');
  if (!datalist) return;
  datalist.innerHTML = (vtigerCustomersCache || []).map(c => `<option value="${c.companyName} [${c.companyId}]">`).join('');
}

function calculateEstimatedPrice() {
  const mainService = document.getElementById('f-service-type').value;
  const subService = document.getElementById('f-sub-service').value;
  const duration = parseInt(document.getElementById('f-duration').value) || 0;
  const estPriceField = document.getElementById('f-est-price');
  
  let price = 0;

  switch(mainService) {
    case 'S1': // MENU UPDATE
      if (subService === 'Set Menu') {
        price = pricingConfig.S1_SetMenu;
      } else {
        price = pricingConfig.S1_Base;
        if (duration > 60) {
          const extraMinutes = duration - 60;
          const extraHours = Math.ceil(extraMinutes / 60);
          price += (extraHours * pricingConfig.S1_Hourly);
        }
      }
      break;
    case 'S2': // CREDIT CARD
      price = pricingConfig.S2;
      break;
    case 'S3': // DATA RESET
      price = pricingConfig.S3;
      break;
    case 'S4': // SERVICE
      price = pricingConfig.S4;
      break;
    case 'S6': // TILL SETUP
      price = pricingConfig.S6;
      break;
    default:
      price = 0;
  }

  estPriceField.value = price.toFixed(2);
}

document.addEventListener('change', (e) => {
  if (e.target.id === 'f-sub-service') calculateEstimatedPrice();
});

// --- ID & Field Generation ---
function generateDBID() {
  const nextId = records.length + 1001;
  return `REC-${nextId}`;
}

function generateServiceNumber() {
  const nextId = records.length + 1001;
  return `SRV-${nextId}`;
}

function resetForm() {
  const masterForm = document.getElementById('master-form');
  if (masterForm) masterForm.reset();
  
  const categorySelect = document.getElementById('f-service-type');
  if (categorySelect) categorySelect.disabled = false;
  
  // Auto-fill Numbers
  const nextDBID = generateDBID();
  document.getElementById('f-db-id').value = nextDBID;
  document.getElementById('f-invoice-no').value = generateServiceNumber();
  
  // Auto-fill Dates & Times
  const now = new Date();
  document.getElementById('f-timestamp').value = now.toLocaleString();
  document.getElementById('f-duration').value = "0";
  
  // Service Date (ISO format YYYY-MM-DD for date input)
  const today = now.toISOString().split('T')[0];
  document.getElementById('f-invoice-date').value = today;
  
  const pad = n => String(n).padStart(2, '0');
  document.getElementById('f-start-time').value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  
  updateDynamicFields();
  
  // Reset Invoice Details
  document.getElementById('f-real-invoice-no').value = '';
  document.getElementById('f-real-invoice-date').value = '';
  document.getElementById('f-real-invoice-note').value = '';
}

// Helper to save settings to Supabase
async function saveAppSettingToDB(settingId, data) {
  try {
    const { error } = await supabaseClient
      .from('app_settings')
      .upsert({ id: settingId, data: data, updated_at: new Date().toISOString() });
    if (error) throw error;
    console.log(`Setting ${settingId} saved to Supabase`);
  } catch (err) {
    console.error(`Error saving ${settingId} to Supabase:`, err);
  }
}

document.getElementById('master-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const mainServiceLabel = document.getElementById('f-service-type').options[document.getElementById('f-service-type').selectedIndex].text;

  const newRecord = {
    db_id: document.getElementById('f-db-id').value,
    crm_ticket: document.getElementById('f-crm-ticket').value || 'N/A',
    service_number: document.getElementById('f-invoice-no').value,
    service_date: document.getElementById('f-invoice-date').value,
    timestamp: document.getElementById('f-timestamp').value,
    company_id: document.getElementById('f-company-id').value || 'N/A',
    company_name: document.getElementById('f-company').value || 'Unknown Client',
    postcode: document.getElementById('f-postcode').value,
    staff_user: document.getElementById('f-user').value,
    service_type: document.getElementById('f-service-type').value,
    sub_service: document.getElementById('f-sub-service').value,
    start_time: document.getElementById('f-start-time').value,
    end_time: document.getElementById('f-end-time').value,
    duration: parseInt(document.getElementById('f-duration').value) || 0,
    price: parseFloat(document.getElementById('f-price').value) || 0,
    payment_status: document.getElementById('f-payment-status').value,
    description: document.getElementById('f-desc').value || '',
    status: 'Logged',
    // Supabase compatible booleans/fields
    invoiced: false,
    on_hold: false,
    invoice_date: document.getElementById('f-real-invoice-date').value || null,
    invoice_no: document.getElementById('f-real-invoice-no').value || '',
    invoice_note: document.getElementById('f-real-invoice-note').value || ''
  };

  try {
    const { data, error } = await supabaseClient.from('records').insert([newRecord]).select();
    if (error) throw error;

    // Update local state
    records.unshift(data[0]);
    localStorage.setItem('taskflow_records', JSON.stringify(records));
    
    alert('Task logged successfully to Supabase!');
    
    // Auto-sync new record to Sheets (Optional backup)
    const sheetUrl = localStorage.getItem('taskflow_gas_url');
    if (sheetUrl) {
      syncRecordToSheets(data[0]);
    }

    resetForm();
    toggleMainForm('home');
    renderDataTable();
  } catch (err) {
    console.error('Error saving to Supabase:', err);
    alert('Error saving to Supabase. Check console.');
  }
});

// --- Data View ---
let currentDataCategory = 'all';

function showDataSubTab(cat) {
  currentDataCategory = cat;
  
  // Update UI
  document.querySelectorAll('#section-dataview .sub-nav-link').forEach(btn => {
    btn.classList.remove('active');
    btn.style.background = 'transparent';
    btn.style.color = 'var(--text-muted)';
  });
  
  const activeBtn = document.getElementById(`data-btn-${cat}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.style.background = 'var(--bg-hover)';
    activeBtn.style.color = 'var(--text-main)';
  }
  
  renderDataTable();
}

function renderDataTable() {
  const tbody = document.getElementById('data-table-body');
  const searchQuery = document.getElementById('dataview-search')?.value.toLowerCase() || '';
  const startDate = document.getElementById('dataview-start-date')?.value;
  const endDate = document.getElementById('dataview-end-date')?.value;
  
  // Sort by ID descending to ensure newest first
  let filteredRecords = [...records].sort((a, b) => b.id - a.id);

  // Filter by Category
  if (currentDataCategory !== 'all') {
    filteredRecords = filteredRecords.filter(r => r.mainServiceCode === currentDataCategory);
  }
  
  // Filter by Date Range (YYYY-MM-DD comparison works correctly on strings)
  if (startDate) {
    filteredRecords = filteredRecords.filter(r => r.serviceDate >= startDate);
  }
  if (endDate) {
    filteredRecords = filteredRecords.filter(r => r.serviceDate <= endDate);
  }

  if (searchQuery) {
    filteredRecords = filteredRecords.filter(r => {
      const matchString = `
        ${r.company} ${r.companyId} ${r.postcode} ${r.serviceNumber} 
        ${r.user} ${r.crmTicket} ${r.mainService} ${r.subService} 
        ${r.status} ${r.paymentStatus} ${r.description}
        ${r.invoiceNo || ''} ${r.invoiceNote || ''}
      `.toLowerCase();
      return matchString.includes(searchQuery);
    });
  }

  if (filteredRecords.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: var(--text-hint);">No records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredRecords.map(r => {
    let extraInfo = '';
    
    // Credit Card Specific Summary
    if (r.mainServiceCode === 'S2' && r.cardCompany) {
      extraInfo = `
        <div style="margin-top:4px;">
          <span style="font-size:10px; padding:2px 6px; background:#e0f2fe; color:#0369a1; border-radius:4px; font-weight:600;">
            ${r.cardCompany} | ${r.cardSetupNo || 'No Info'}
          </span>
        </div>
      `;
    }
    
    // Till Setup Specific Summary
    if (r.mainServiceCode === 'S6') {
      extraInfo = `
        <div style="margin-top:4px;">
          <span style="font-size:10px; padding:2px 6px; background:#fef3c7; color:#92400e; border-radius:4px; font-weight:600;">
            Quote: ${r.quoteNo || 'N/A'}
          </span>
          <span style="font-size:10px; padding:2px 6px; background:#f5f3ff; color:#5b21b6; border-radius:4px; font-weight:600; margin-left:4px;">
            ${r.systemType} | ${r.tillModel}
          </span>
        </div>
      `;
    }

    // Determine Status Badge
    let statusLabel = 'PENDING';
    let statusColor = '#ef4444'; // Red
    let statusBg = '#fee2e2';
    let statusBorder = '#fecaca';

    if (r.invoiced) {
      statusLabel = 'PAID / COMPLETED';
      statusColor = '#166534'; // Green
      statusBg = '#dcfce7'; 
      statusBorder = '#bbf7d0';
    } else if (r.onHold) {
      statusLabel = 'ON HOLD';
      statusColor = '#92400e'; // Orange
      statusBg = '#fef3c7';
      statusBorder = '#fde68a';
    } else if (r.paymentStatus === 'Free') {
      statusLabel = 'FREE';
      statusColor = '#0369a1'; // Blue
      statusBg = '#e0f2fe';
      statusBorder = '#bae6fd';
    }

    const badgeStyle = `background:${statusBg}; color:${statusColor}; border: 1px solid ${statusBorder}; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 10px; display: inline-block;`;

    return `
      <tr>
        <td>
          <span class="status-dot ${r.onHold ? 'dot-orange' : (r.invoiced ? 'dot-green' : 'dot-red')}"></span>
          ${r.timestamp}
        </td>
        <td>
          <strong>${r.dbId}</strong><br>
          <small style="color:var(--text-muted)">CRM: ${r.crmTicket}</small><br>
          <small style="color:var(--primary)">SRV: ${r.serviceNumber}</small>
        </td>
        <td>
          <strong>${r.company}</strong><br>
          <small style="color:var(--text-muted)">ID: ${r.companyId} | ${r.postcode}</small>
        </td>
        <td>
          ${r.mainService}<br>
          <small>${r.subService}</small>
          ${extraInfo}
          <div style="font-size:10px; color:var(--text-muted); margin-top:4px; font-style:italic;">
            ${r.description ? r.description.substring(0, 30) + '...' : ''}
          </div>
        </td>
        <td><span style="${badgeStyle}">${statusLabel}</span></td>
        <td>${r.price}<br><small>${r.paymentStatus}</small></td>
        <td>
          <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="viewDetails(${r.id})">Details</button>
        </td>
      </tr>
    `;
  }).join('');
}

// --- Details View Logic ---
function viewDetails(id) {
  const record = records.find(r => r.id == id);
  if (!record) return;

  const modal = document.getElementById('details-modal');
  const detailsContent = document.getElementById('modal-details-content');
  const modalTitle = document.getElementById('modal-title');
  const editBtn = document.getElementById('modal-edit-btn');
  const footer = document.getElementById('modal-footer');

  modalTitle.innerText = `Record Details: ${record.dbId}`;
  
  // Reset footer buttons
  footer.innerHTML = `
    <button class="btn" id="modal-edit-btn" onclick="editRecord(${record.id})">Edit Record</button>
    <button class="btn btn-primary" onclick="closeModal()" id="modal-close-btn">Close</button>
  `;

  let dynamicSection = '';

  // Credit Card Specifics
  if (record.mainServiceCode === 'S2') {
    dynamicSection = `
      <div class="detail-section-title">Credit Card Details</div>
      <div class="detail-item">
        <span class="detail-label">IKA App</span>
        <span class="detail-value">${record.ikaApp || 'N/A'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Local Settings</span>
        <span class="detail-value">${record.localSettings || 'N/A'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Card Setup No</span>
        <span class="detail-value">${record.cardSetupNo || 'N/A'}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Card Company</span>
        <span class="detail-value">${record.cardCompany || 'N/A'}</span>
      </div>
    `;
  }

  // Till Setup Specifics
  if (record.mainServiceCode === 'S6') {
    dynamicSection = `
      <div class="detail-section-title">Till Setup Details</div>
      <div class="grid-5" style="grid-column: 1 / -1; display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-top: 5px;">
        <div class="detail-item">
          <span class="detail-label">Quote Number</span>
          <span class="detail-value">${record.quoteNo || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">System Type</span>
          <span class="detail-value">${record.systemType || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Till Model</span>
          <span class="detail-value">${record.tillModel || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">CPU</span>
          <span class="detail-value">${record.cpu || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">OS Version</span>
          <span class="detail-value">${record.osVersion || 'N/A'}</span>
        </div>
      </div>
    `;
  }

  detailsContent.innerHTML = `
    <div class="details-grid">
      <div class="detail-section-title">General Information</div>
      <div class="detail-item">
        <span class="detail-label">Recorded On</span>
        <span class="detail-value">${record.timestamp}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Staff Member</span>
        <span class="detail-value">${record.user}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">CRM Ticket</span>
        <span class="detail-value">${record.crmTicket}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Service Number</span>
        <span class="detail-value">${record.serviceNumber}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Service Date</span>
        <span class="detail-value">${record.serviceDate}</span>
      </div>

      <div class="detail-section-title">Client Information</div>
      <div class="detail-item">
        <span class="detail-label">Company Name</span>
        <span class="detail-value">${record.company}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Company ID</span>
        <span class="detail-value">${record.companyId}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Postcode</span>
        <span class="detail-value">${record.postcode || 'N/A'}</span>
      </div>

      <div class="detail-section-title">Work & Service</div>
      <div class="detail-item">
        <span class="detail-label">Service Type</span>
        <span class="detail-value">${record.mainService}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Sub Service</span>
        <span class="detail-value">${record.subService}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Timing</span>
        <span class="detail-value">${record.startTime} - ${record.endTime} (${record.duration} min)</span>
      </div>

      ${dynamicSection}

      <div class="detail-section-title">Payment & Notes</div>
      <div class="detail-item">
        <span class="detail-label">Price / Status</span>
        <span class="detail-value">${record.price} (${record.paymentStatus})</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Invoice Info</span>
        <span class="detail-value">${record.invoiceNo || 'No Inv#'} / ${record.invoiceDate || 'No Date'}</span>
      </div>
      <div class="detail-item detail-full-width">
        <span class="detail-label">Invoice Note</span>
        <span class="detail-value" style="font-style:italic;">${record.invoiceNote || 'No specific invoicing notes.'}</span>
      </div>
      <div class="detail-item detail-full-width">
        <span class="detail-label">Service Description</span>
        <div class="detail-value" style="background: var(--bg-hover); padding: 1rem; border-radius: 8px; margin-top: 5px; white-space: pre-wrap;">${record.description || 'No description provided.'}</div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('details-modal').classList.add('hidden');
}

function editRecord(id) {
  const record = records.find(r => r.id == id);
  if (!record) return;

  const detailsContent = document.getElementById('modal-details-content');
  const footer = document.getElementById('modal-footer');

  // Change footer buttons
  footer.innerHTML = `
    <button class="btn" onclick="viewDetails(${id})">Cancel</button>
    <button class="btn btn-primary" onclick="saveRecord(${id})">Save Changes</button>
  `;

  const staffOptions = [
    "UGUR YAVUZ", "AHMET BALTACI", "UGUR ISIKCEVAHIR"
  ].map(s => `<option value="${s}" ${record.user === s ? 'selected' : ''}>${s}</option>`).join('');

  const serviceTypes = [
    {v:"S1", t:"MENU UPDATE"},
    {v:"S2", t:"CREDIT CARD"},
    {v:"S3", t:"DATA RESET"},
    {v:"S4", t:"SERVICE"},
    {v:"S5", t:"OTHER"},
    {v:"S6", t:"TILL SETUP"}
  ].map(s => `<option value="${s.v}" ${record.mainServiceCode === s.v ? 'selected' : ''}>${s.t}</option>`).join('');

  let dynamicSection = '';

  if (record.mainServiceCode === 'S2') {
    dynamicSection = `
      <div class="detail-section-title">Credit Card Details</div>
      <div class="detail-item">
        <span class="detail-label">IKA App</span>
        <select class="modal-input" id="e-ika-app">
          <option value="No" ${record.ikaApp === 'No' ? 'selected' : ''}>No</option>
          <option value="Yes" ${record.ikaApp === 'Yes' ? 'selected' : ''}>Yes</option>
        </select>
      </div>
      <div class="detail-item">
        <span class="detail-label">Local Settings</span>
        <input type="text" class="modal-input" id="e-local-settings" value="${record.localSettings || ''}">
      </div>
      <div class="detail-item">
        <span class="detail-label">Card Setup No</span>
        <input type="text" class="modal-input" id="e-card-setup-no" value="${record.cardSetupNo || ''}">
      </div>
      <div class="detail-item">
        <span class="detail-label">Card Company</span>
        <input type="text" class="modal-input" id="e-card-company" value="${record.cardCompany || ''}">
      </div>
    `;
  }

  if (record.mainServiceCode === 'S6') {
    dynamicSection = `
      <div class="detail-section-title">Till Setup Details</div>
      <div class="grid-5" style="grid-column: 1 / -1; display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-top: 1rem;">
        <div class="detail-item">
          <span class="detail-label">Quote No.</span>
          <input type="text" class="modal-input" id="e-quote-no" value="${record.quoteNo || ''}">
        </div>
        <div class="detail-item">
          <span class="detail-label">System Type</span>
          <select class="modal-input" id="e-system-type">
            <option value="IKA NEW TILL SYSTEM" ${record.systemType === 'IKA NEW TILL SYSTEM' ? 'selected' : ''}>IKA NEW TILL SYSTEM</option>
            <option value="USED OWN SYSTEM" ${record.systemType === 'USED OWN SYSTEM' ? 'selected' : ''}>USED OWN SYSTEM</option>
            <option value="IKA 2.HAND TILL SYSTEM" ${record.systemType === 'IKA 2.HAND TILL SYSTEM' ? 'selected' : ''}>IKA 2.HAND TILL SYSTEM</option>
            <option value="OTHER" ${record.systemType === 'OTHER' ? 'selected' : ''}>OTHER</option>
          </select>
        </div>
        <div class="detail-item">
          <span class="detail-label">Till Model</span>
          <select class="modal-input" id="e-till-model">
            <option value="IKA S-300 RT3" ${record.tillModel === 'IKA S-300 RT3' ? 'selected' : ''}>IKA S-300 RT3</option>
            <option value="IKA S-100" ${record.tillModel === 'IKA S-100' ? 'selected' : ''}>IKA S-100</option>
            <option value="IKA S-150" ${record.tillModel === 'IKA S-150' ? 'selected' : ''}>IKA S-150</option>
            <option value="IKA S-150 8GB" ${record.tillModel === 'IKA S-150 8GB' ? 'selected' : ''}>IKA S-150 8GB</option>
            <option value="IKA S-200 (I5)" ${record.tillModel === 'IKA S-200 (I5)' ? 'selected' : ''}>IKA S-200 (I5)</option>
            <option value="IKA RT-12" ${record.tillModel === 'IKA RT-12' ? 'selected' : ''}>IKA RT-12</option>
            <option value="RT-3" ${record.tillModel === 'RT-3' ? 'selected' : ''}>RT-3</option>
            <option value="RT-6" ${record.tillModel === 'RT-6' ? 'selected' : ''}>RT-6</option>
            <option value="PHOENIX" ${record.tillModel === 'PHOENIX' ? 'selected' : ''}>PHOENIX</option>
            <option value="OKPOS Z" ${record.tillModel === 'OKPOS Z' ? 'selected' : ''}>OKPOS Z</option>
            <option value="OPTIMUS" ${record.tillModel === 'OPTIMUS' ? 'selected' : ''}>OPTIMUS</option>
            <option value="POSBANK" ${record.tillModel === 'POSBANK' ? 'selected' : ''}>POSBANK</option>
            <option value="AURES" ${record.tillModel === 'AURES' ? 'selected' : ''}>AURES</option>
            <option value="MAZIC 1500" ${record.tillModel === 'MAZIC 1500' ? 'selected' : ''}>MAZIC 1500</option>
            <option value="BST" ${record.tillModel === 'BST' ? 'selected' : ''}>BST</option>
            <option value="RUGGED TABLET" ${record.tillModel === 'RUGGED TABLET' ? 'selected' : ''}>RUGGED TABLET</option>
            <option value="NO NAME" ${record.tillModel === 'NO NAME' ? 'selected' : ''}>NO NAME</option>
            <option value="OTHER" ${record.tillModel === 'OTHER' ? 'selected' : ''}>OTHER</option>
          </select>
        </div>
        <div class="detail-item">
          <span class="detail-label">CPU</span>
          <select class="modal-input" id="e-cpu">
            <option value="J6412" ${record.cpu === 'J6412' ? 'selected' : ''}>J6412</option>
            <option value="J1900" ${record.cpu === 'J1900' ? 'selected' : ''}>J1900</option>
            <option value="J4125" ${record.cpu === 'J4125' ? 'selected' : ''}>J4125</option>
            <option value="J1037U" ${record.cpu === 'J1037U' ? 'selected' : ''}>J1037U</option>
            <option value="I3" ${record.cpu === 'I3' ? 'selected' : ''}>I3</option>
            <option value="I5" ${record.cpu === 'I5' ? 'selected' : ''}>I5</option>
            <option value="I7" ${record.cpu === 'I7' ? 'selected' : ''}>I7</option>
            <option value="ATOM" ${record.cpu === 'ATOM' ? 'selected' : ''}>ATOM</option>
            <option value="N97" ${record.cpu === 'N97' ? 'selected' : ''}>N97</option>
            <option value="OTHER" ${record.cpu === 'OTHER' ? 'selected' : ''}>OTHER</option>
          </select>
        </div>
        <div class="detail-item">
          <span class="detail-label">OS Version</span>
          <select class="modal-input" id="e-os-version">
            <option value="WIN 11 24H2" ${record.osVersion === 'WIN 11 24H2' ? 'selected' : ''}>WIN 11 24H2</option>
            <option value="LTSC 21H2" ${record.osVersion === 'LTSC 21H2' ? 'selected' : ''}>LTSC 21H2</option>
            <option value="LTSC 2018" ${record.osVersion === 'LTSC 2018' ? 'selected' : ''}>LTSC 2018</option>
            <option value="LTSC 2016" ${record.osVersion === 'LTSC 2016' ? 'selected' : ''}>LTSC 2016</option>
            <option value="WIN 10 PRO" ${record.osVersion === 'WIN 10 PRO' ? 'selected' : ''}>WIN 10 PRO</option>
            <option value="WIN 10 22H2" ${record.osVersion === 'WIN 10 22H2' ? 'selected' : ''}>WIN 10 22H2</option>
            <option value="WIN 7 PRO" ${record.osVersion === 'WIN 7 PRO' ? 'selected' : ''}>WIN 7 PRO</option>
            <option value="OTHER" ${record.osVersion === 'OTHER' ? 'selected' : ''}>OTHER</option>
          </select>
        </div>
      </div>
    `;
  }

  detailsContent.innerHTML = `
    <div class="details-grid">
      <div class="detail-section-title">General Information</div>
      <div class="detail-item">
        <span class="detail-label">Staff Member</span>
        <select class="modal-input" id="e-user">${staffOptions}</select>
      </div>
      <div class="detail-item">
        <span class="detail-label">CRM Ticket</span>
        <input type="text" class="modal-input" id="e-crm-ticket" value="${record.crmTicket}">
      </div>
      <div class="detail-item">
        <span class="detail-label">Service Number</span>
        <input type="text" class="modal-input" id="e-service-number" value="${record.serviceNumber}">
      </div>
      <div class="detail-item">
        <span class="detail-label">Service Date</span>
        <input type="date" class="modal-input" id="e-service-date" value="${record.serviceDate}">
      </div>

      <div class="detail-section-title">Client Information</div>
      <div class="detail-item">
        <span class="detail-label">Company Name</span>
        <input type="text" class="modal-input" id="e-company" value="${record.company}">
      </div>
      <div class="detail-item">
        <span class="detail-label">Company ID</span>
        <input type="text" class="modal-input" id="e-company-id" value="${record.companyId}">
      </div>
      <div class="detail-item">
        <span class="detail-label">Postcode</span>
        <input type="text" class="modal-input" id="e-postcode" value="${record.postcode || ''}">
      </div>

      <div class="detail-section-title">Work & Service</div>
      <div class="detail-item">
        <span class="detail-label">Service Type</span>
        <select class="modal-input" id="e-service-type">${serviceTypes}</select>
      </div>
      <div class="detail-item">
        <span class="detail-label">Sub Service</span>
        <input type="text" class="modal-input" id="e-sub-service" value="${record.subService}">
      </div>
      <div class="detail-item">
        <span class="detail-label">Duration (min)</span>
        <input type="number" class="modal-input" id="e-duration" value="${record.duration}">
      </div>

      ${dynamicSection}

      <div class="detail-section-title">Payment & Notes</div>
      <div class="detail-item">
        <span class="detail-label">Price (£)</span>
        <input type="text" class="modal-input" id="e-price" value="${record.price.replace('£','')}">
      </div>
      <div class="detail-item">
        <span class="detail-label">Payment Status</span>
        <select class="modal-input" id="e-payment-status">
          <option value="Chargeable" ${record.paymentStatus === 'Chargeable' ? 'selected' : ''}>Chargeable</option>
          <option value="Contract" ${record.paymentStatus === 'Contract' ? 'selected' : ''}>Service Contract</option>
          <option value="Free" ${record.paymentStatus === 'Free' ? 'selected' : ''}>FREE (No Charge)</option>
        </select>
      </div>

      <div class="detail-section-title">Invoicing Information</div>
      <div class="detail-item">
        <span class="detail-label">Invoice Date</span>
        <input type="date" class="modal-input" id="e-invoice-date" value="${record.invoiceDate || ''}">
      </div>
      <div class="detail-item">
        <span class="detail-label">Invoice Number</span>
        <input type="text" class="modal-input" id="e-invoice-number" value="${record.invoiceNo || ''}">
      </div>
      <div class="detail-item detail-full-width">
        <span class="detail-label">Invoice Note</span>
        <input type="text" class="modal-input" id="e-invoice-note" value="${record.invoiceNote || ''}">
      </div>

      <div class="detail-item detail-full-width">
        <span class="detail-label">Service Description</span>
        <textarea class="modal-input" id="e-desc" style="min-height:100px; width:100%; border: 0.5px solid var(--border-color); border-radius: 8px; padding: 10px;">${record.description || ''}</textarea>
      </div>
    </div>
  `;
}

async function saveRecord(id) {
  const index = records.findIndex(r => r.id == id);
  if (index === -1) return;

  const r = records[index];
  
  const updatedData = {
    staff_user: document.getElementById('e-user').value,
    crm_ticket: document.getElementById('e-crm-ticket').value,
    service_number: document.getElementById('e-service-number').value,
    service_date: document.getElementById('e-service-date').value,
    company_name: document.getElementById('e-company').value,
    company_id: document.getElementById('e-company-id').value,
    postcode: document.getElementById('e-postcode').value,
    service_type: document.getElementById('e-service-type').value,
    sub_service: document.getElementById('e-sub-service').value,
    duration: parseInt(document.getElementById('e-duration').value) || 0,
    price: parseFloat(document.getElementById('e-price').value) || 0,
    payment_status: document.getElementById('e-payment-status').value,
    description: document.getElementById('e-desc').value,
    invoice_date: document.getElementById('e-invoice-date').value || null,
    invoice_no: document.getElementById('e-invoice-number').value || '',
    invoice_note: document.getElementById('e-invoice-note').value || ''
  };

  try {
    const { error } = await supabase
      .from('records')
      .update(updatedData)
      .eq('id', id);

    if (error) throw error;

    // Update local state
    Object.assign(records[index], updatedData);
    localStorage.setItem('taskflow_records', JSON.stringify(records));
    
    renderDataTable();
    if (document.getElementById('section-invoices').classList.contains('active')) {
      renderInvoicesTable();
    }
    viewDetails(id);
    alert('Changes saved successfully to Supabase!');
  } catch (err) {
    console.error('Error updating Supabase:', err);
    alert('Update failed. Check console.');
  }
}

// --- Invoicing Logic ---
function renderInvoicesTable() {
  const pendingBody = document.getElementById('invoice-pending-table-body');
  const holdBody = document.getElementById('invoice-hold-table-body');
  const completedBody = document.getElementById('invoice-completed-table-body');
  const allBody = document.getElementById('invoice-all-table-body');
  const searchQuery = document.getElementById('invoice-search')?.value.toLowerCase() || '';
  
  // Filter chargeable and sort by ID descending (newest first)
  let chargeableRecords = records
    .filter(r => r.paymentStatus === 'Chargeable')
    .sort((a, b) => b.id - a.id);

  // Filter based on search query
  if (searchQuery) {
    chargeableRecords = chargeableRecords.filter(r => {
      const matchString = `
        ${r.company} ${r.companyId} ${r.postcode} ${r.serviceNumber} 
        ${r.mainService} ${r.subService} ${r.price} 
        ${r.invoiceNo || ''} ${r.invoiceNote || ''}
      `.toLowerCase();
      return matchString.includes(searchQuery);
    });
  }

  const pendingRecords = chargeableRecords.filter(r => !r.invoiced && !r.onHold);
  const holdRecords = chargeableRecords.filter(r => r.onHold);
  const completedRecords = chargeableRecords.filter(r => r.invoiced);

  // Update Counts
  if (document.getElementById('count-pending')) document.getElementById('count-pending').textContent = pendingRecords.length;
  if (document.getElementById('count-hold')) document.getElementById('count-hold').textContent = holdRecords.length;
  if (document.getElementById('count-completed')) document.getElementById('count-completed').textContent = completedRecords.length;
  if (document.getElementById('count-all')) document.getElementById('count-all').textContent = chargeableRecords.length;

  // Render ALL
  if (allBody) {
    if (chargeableRecords.length === 0) {
      allBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 1.5rem; color: var(--text-hint);">No chargeable records found.</td></tr>`;
    } else {
      allBody.innerHTML = chargeableRecords.map(r => {
        const status = r.invoiced ? 'COMPLETED' : (r.onHold ? 'HOLD' : 'PENDING');
        const color = r.invoiced ? '#166534' : (r.onHold ? '#b45309' : '#ef4444');
        return `
          <tr>
            <td>${r.serviceDate}</td>
            <td><strong>${r.serviceNumber}</strong></td>
            <td>
              <strong>${r.company}</strong><br>
              <small style="color:var(--text-muted)">${r.companyId}</small>
            </td>
            <td><strong>${r.price}</strong></td>
            <td>
              <span class="badge" style="background: ${color}22; color: ${color}; border: 1px solid ${color}44;">
                ${status}
              </span>
            </td>
            <td>
              <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="viewDetails(${r.id})">Details</button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Render Pending
  if (pendingBody) {
    if (pendingRecords.length === 0) {
      pendingBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 1.5rem; color: var(--text-hint);">No pending invoices.</td></tr>`;
    } else {
      pendingBody.innerHTML = pendingRecords.map(r => `
        <tr>
          <td>
            <span class="status-dot dot-red"></span>
            ${r.serviceDate}
          </td>
          <td><strong>${r.serviceNumber}</strong></td>
          <td>
            <strong>${r.company}</strong><br>
            <small style="color:var(--text-muted)">${r.companyId} | ${r.postcode || 'N/A'}</small>
          </td>
          <td><strong>${r.price}</strong></td>
          <td>
            <small>${r.invoiceDate || '-'}</small><br>
            <small>${r.invoiceNo || '-'}</small>
          </td>
          <td>
            <button class="btn btn-primary" style="padding: 4px 8px; font-size: 11px; margin-bottom:4px;" onclick="markAsInvoiced(${r.id}, true)">Finish</button>
            <button class="btn" style="padding: 4px 8px; font-size: 11px; margin-bottom:4px; border-color: #f59e0b; color: #b45309;" onclick="toggleHold(${r.id}, true)">Hold</button>
            <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="viewDetails(${r.id})">Details</button>
          </td>
        </tr>
      `).join('');
    }
  }

  // Render Hold
  if (holdBody) {
    if (holdRecords.length === 0) {
      holdBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 1.5rem; color: var(--text-hint);">No records on hold.</td></tr>`;
    } else {
      holdBody.innerHTML = holdRecords.map(r => `
        <tr>
          <td>
            <span class="status-dot dot-orange"></span>
            ${r.serviceDate}
          </td>
          <td><strong>${r.serviceNumber}</strong></td>
          <td>
            <strong>${r.company}</strong><br>
            <small style="color:var(--text-muted)">${r.companyId} | ${r.postcode || 'N/A'}</small>
          </td>
          <td><strong>${r.price}</strong></td>
          <td style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            <small>${r.invoiceNote || 'No Note'}</small>
          </td>
          <td>
            <button class="btn" style="padding: 4px 8px; font-size: 11px; margin-bottom:4px;" onclick="toggleHold(${r.id}, false)">Release</button>
            <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="viewDetails(${r.id})">Details</button>
          </td>
        </tr>
      `).join('');
    }
  }

  // Render Completed
  if (completedBody) {
    if (completedRecords.length === 0) {
      completedBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 1.5rem; color: var(--text-hint);">No completed invoices.</td></tr>`;
    } else {
      completedBody.innerHTML = completedRecords.map(r => `
        <tr>
          <td>
            <span class="status-dot dot-green"></span>
            ${r.serviceDate}
          </td>
          <td><strong>${r.serviceNumber}</strong></td>
          <td>
            <strong>${r.company}</strong><br>
            <small style="color:var(--text-muted)">${r.companyId} | ${r.postcode || 'N/A'}</small>
          </td>
          <td><strong>${r.price}</strong></td>
          <td>
            <strong>${r.invoiceNo || 'N/A'}</strong><br>
            <small>${r.invoiceDate || 'N/A'}</small><br>
            <small style="font-style:italic; color:var(--text-muted)">${r.invoiceNote || ''}</small>
          </td>
          <td>
            <button class="btn" style="padding: 4px 8px; font-size: 11px; margin-bottom:4px;" onclick="markAsInvoiced(${r.id}, false)">Revert</button>
            <button class="btn" style="padding: 4px 8px; font-size: 11px;" onclick="viewDetails(${r.id})">Details</button>
          </td>
        </tr>
      `).join('');
    }
  }
}

async function toggleHold(id, status) {
  const index = records.findIndex(r => r.id == id);
  if (index === -1) return;
  
  try {
    const { error } = await supabaseClient
      .from('records')
      .update({ on_hold: status, invoiced: status ? false : records[index].invoiced })
      .eq('id', id);
    if (error) throw error;

    records[index].onHold = status;
    if (status) records[index].invoiced = false;
    
    localStorage.setItem('taskflow_records', JSON.stringify(records));
    renderInvoicesTable();
    if (document.getElementById('section-dataview').classList.contains('active')) renderDataTable();
  } catch (err) {
    console.error('Error updating hold status in Supabase:', err);
  }
}

async function markAsInvoiced(id, status) {
  const index = records.findIndex(r => r.id == id);
  if (index === -1) return;
  
  try {
    const { error } = await supabaseClient
      .from('records')
      .update({ invoiced: status })
      .eq('id', id);
    if (error) throw error;

    records[index].invoiced = status;
    localStorage.setItem('taskflow_records', JSON.stringify(records));
    renderInvoicesTable();
  } catch (err) {
    console.error('Error updating invoice status in Supabase:', err);
  }
}

// Initial Setup
window.onload = () => {
  resetForm();
  renderDataTable();
};

// --- Settings Management ---
function saveSettings() {
  const url = document.getElementById('setting-sheet-url').value;
  localStorage.setItem('taskflow_gas_url', url);

  // Pricing config
  pricingConfig = {
    S1_SetMenu: parseFloat(document.getElementById('p-S1-SetMenu').value) || 0,
    S1_Base: parseFloat(document.getElementById('p-S1-Base').value) || 0,
    S1_Hourly: parseFloat(document.getElementById('p-S1-Hourly').value) || 0,
    S2: parseFloat(document.getElementById('p-S2').value) || 0,
    S3: parseFloat(document.getElementById('p-S3').value) || 0,
    S4: parseFloat(document.getElementById('p-S4').value) || 0,
    S6: parseFloat(document.getElementById('p-S6').value) || 0
  };
  localStorage.setItem('taskflow_pricing', JSON.stringify(pricingConfig));
  saveAppSettingToDB('pricing', pricingConfig);

  alert('Settings and Pricing saved successfully to Supabase!');
  calculateEstimatedPrice(); // Recalculate if form open
}

function loadSettings() {
  const defaultUrl = 'https://script.google.com/macros/s/AKfycby53LvFWigxEqY9wq702c8dWwzD1SZvAnTcALSFjFHqoAO0t6-6yY8I3-ySE1kcoUIV/exec';
  const url = localStorage.getItem('taskflow_gas_url') || defaultUrl;
  
  if (!localStorage.getItem('taskflow_gas_url') || localStorage.getItem('taskflow_gas_url') !== defaultUrl) {
    localStorage.setItem('taskflow_gas_url', defaultUrl);
  }

  if (document.getElementById('setting-sheet-url')) {
    document.getElementById('setting-sheet-url').value = url;
  }

  // Load Pricing Config to Inputs
  if (document.getElementById('p-S1-SetMenu')) {
    document.getElementById('p-S1-SetMenu').value = pricingConfig.S1_SetMenu;
    document.getElementById('p-S1-Base').value = pricingConfig.S1_Base;
    document.getElementById('p-S1-Hourly').value = pricingConfig.S1_Hourly;
    document.getElementById('p-S2').value = pricingConfig.S2;
    document.getElementById('p-S3').value = pricingConfig.S3;
    document.getElementById('p-S4').value = pricingConfig.S4;
    document.getElementById('p-S6').value = pricingConfig.S6;
  }

  renderPersonnel();
  renderSubServiceManagement();
}

// --- Personnel Management Logic ---
function renderPersonnel() {
  const list = document.getElementById('personnel-list');
  if (!list) return;
  list.innerHTML = personnel.map(name => `
    <div style="background: var(--bg-hover); padding: 6px 12px; border-radius: 20px; font-size: 12px; display: flex; align-items: center; gap: 8px;">
      ${name}
      <span onclick="deletePersonnel('${name}')" style="cursor:pointer; color:red; font-weight:bold;">&times;</span>
    </div>
  `).join('');
  
  // Also update the main form dropdown if it exists
  const userSelect = document.getElementById('f-user');
  if (userSelect) {
    userSelect.innerHTML = personnel.map(p => `<option value="${p}">${p}</option>`).join('');
  }
}

async function addPersonnel() {
  const input = document.getElementById('new-personnel-name');
  const name = input.value.trim();
  if (!name) return;
  if (personnel.includes(name)) {
    alert('This user already exists.');
    return;
  }
  personnel.push(name);
  localStorage.setItem('taskflow_personnel', JSON.stringify(personnel));
  await saveAppSettingToDB('personnel', personnel);
  input.value = '';
  renderPersonnel();
}

async function deletePersonnel(name) {
  if (!confirm(`Remove ${name} from personnel list?`)) return;
  personnel = personnel.filter(p => p !== name);
  localStorage.setItem('taskflow_personnel', JSON.stringify(personnel));
  await saveAppSettingToDB('personnel', personnel);
  renderPersonnel();
}

// --- Sub-Service Management Logic ---
function renderSubServiceManagement() {
  const mainCode = document.getElementById('manage-service-select').value;
  const list = document.getElementById('subservice-management-list');
  if (!list) return;
  
  const options = subServices[mainCode] || [];
  list.innerHTML = options.map((opt, idx) => `
    <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid var(--border-color); font-size: 13px;">
      <span>${opt}</span>
      <span onclick="deleteSubService('${mainCode}', ${idx})" style="cursor:pointer; color:red;">Delete</span>
    </div>
  `).join('');
}

async function addSubService() {
  const mainCode = document.getElementById('manage-service-select').value;
  const input = document.getElementById('new-subservice-name');
  const name = input.value.trim();
  if (!name) return;
  
  if (!subServices[mainCode]) subServices[mainCode] = [];
  subServices[mainCode].push(name);
  localStorage.setItem('taskflow_subservices', JSON.stringify(subServices));
  await saveAppSettingToDB('sub_services', subServices);
  input.value = '';
  renderSubServiceManagement();
}

async function deleteSubService(mainCode, idx) {
  if (!confirm('Delete this sub-service option?')) return;
  subServices[mainCode].splice(idx, 1);
  localStorage.setItem('taskflow_subservices', JSON.stringify(subServices));
  await saveAppSettingToDB('sub_services', subServices);
  renderSubServiceManagement();
}

function dangerResetAllData() {
  if (!confirm('CRITICAL WARNING: This will delete ALL records from this app permanently. Are you absolutely sure?')) return;
  if (!confirm('STILL SURE? There is no undo and your Google Sheet will NOT be automatically cleared.')) return;
  
  localStorage.removeItem('taskflow_records');
  records = [];
  renderDataTable();
  renderInvoicesTable();
  alert('All local app data has been cleared. You now have a fresh start.');
}

// Initialize settings on load
async function syncRecordToSheets(record) {
  const url = localStorage.getItem('taskflow_gas_url');
  if (!url) return;

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Apps Script requires no-cors if not using complex Auth
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    // With no-cors, we can't read response, but data is sent
    console.log('Record synced to Google Sheets:', record.dbId);
    return true;
  } catch (error) {
    console.error('Sync failed:', error);
    return false;
  }
}

async function syncAllHistoricData() {
  const url = localStorage.getItem('taskflow_gas_url');
  if (!url) {
    alert('Please enter a Web App URL in settings first.');
    return;
  }

  if (!confirm(`Are you sure you want to sync all ${records.length} records? This may take a few minutes.`)) {
    return;
  }

  const progressContainer = document.getElementById('sync-progress');
  const progressBar = document.getElementById('sync-progress-bar');
  const statusText = document.getElementById('sync-status-text');
  const btnSync = document.getElementById('btn-sync-all');

  progressContainer.style.display = 'block';
  btnSync.disabled = true;

  for (let i = 0; i < records.length; i++) {
    const progress = Math.round(((i + 1) / records.length) * 100);
    progressBar.style.width = `${progress}%`;
    statusText.textContent = `Syncing ${i + 1} of ${records.length}...`;
    
    await syncRecordToSheets(records[i]);
    // Small delay to prevent rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  statusText.textContent = 'Sync complete! All records pushed to Google Sheets.';
  btnSync.disabled = false;
  setTimeout(() => { progressContainer.style.display = 'none'; }, 5000);
}

// Initialize settings on load
window.addEventListener('load', loadSettings);
document.addEventListener('DOMContentLoaded', loadSettings);

function dangerResetAllData() {
  const code = prompt("ÖNEMLİ UYARI:\nBu işlem tarayıcınızdaki TÜM geçmiş işlemleri silecek.\nEmin misiniz? Devam etmek için büyük harflerle 'SIL' yazın:");
  if (code === 'SIL') {
    records = [];
    localStorage.removeItem('taskflow_records');
    vtigerCustomersCache = [];
    localStorage.removeItem('vtiger_customers');
    
    if (typeof renderDataTable === 'function') renderDataTable();
    if (typeof renderInvoicesTable === 'function') renderInvoicesTable();
    if (typeof renderCustomersTable === 'function') renderCustomersTable();
    
    alert('Tüm yerel veriler sistemden temizlendi!');
  } else if (code) {
    alert('İptal edildi.');
  }
}
