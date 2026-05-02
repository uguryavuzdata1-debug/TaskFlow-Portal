// Initialize Supabase immediately
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isSettingsUnlocked = false;

document.addEventListener('DOMContentLoaded', async () => {
  
  // Initialize Lucide icons
  if (window.lucide) lucide.createIcons();
  
  // Check Login State
  const loggedUser = localStorage.getItem('taskflow_logged_user');
  const rememberMe = localStorage.getItem('taskflow_remember_me');
  
  if (loggedUser || rememberMe) {
    const userToLog = loggedUser || rememberMe;
    localStorage.setItem('taskflow_logged_user', userToLog);
    
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-nav').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    
    // Update UI elements
    const nameSpan = document.getElementById('nav-user-name');
    const avatarDiv = document.getElementById('nav-user-avatar');
    if (nameSpan) nameSpan.textContent = userToLog;
    if (avatarDiv) avatarDiv.textContent = userToLog.charAt(0).toUpperCase();
    
    showTab('dashboard');
  }

  // Load App Data
  await initAppData();
  
  // Setup Dark Mode
  if (localStorage.getItem('dark_mode') === 'true') {
    document.body.classList.add('dark-mode');
  }

  // Populate UI settings
  const sheetUrlInput = document.getElementById('setting-sheet-url');
  if (sheetUrlInput) sheetUrlInput.value = localStorage.getItem('google_sheet_url') || '';
});

// --- Settings Security ---
async function getSettingsPass() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const sum = day + month + year;
    return `ika${sum}tf`;
}

async function showSettingsWithAuth() {
    if (isSettingsUnlocked) {
        showTab('settings');
        showSettingsTab('general');
        return;
    }

    const pass = await getSettingsPass();
    const input = await showModalPrompt('Settings Access', 'Enter daily security password to access settings:', '', 'password');
    
    if (input === pass || input === 'ika789') {
        isSettingsUnlocked = true;
        showTab('settings');
        showSettingsTab('general');
        showToast('Settings unlocked', 'success');
    } else if (input !== null) {
        showToast('Invalid security password', 'error');
    }
}

// --- Form Interaction ---

function selectCategory(code) {
  const select = document.getElementById('f-service-type');
  if (select) {
    select.value = code;
    updateDynamicFields();
    toggleMainForm('form');
  }
}

function updateDynamicFields() {
  const mainService = document.getElementById('f-service-type').value;
  const container = document.getElementById('dynamic-fields');
  const subSelect = document.getElementById('f-sub-service');
  
  // Populate Sub-Services
  const options = subServices[mainService] || [];
  subSelect.innerHTML = '<option value="">Select Sub-Service</option>' + 
    options.map(o => {
      const name = typeof o === 'string' ? o : o.name;
      const price = typeof o === 'string' ? 0 : o.price;
      return `<option value="${name}" data-price="${price}">${name} ${price > 0 ? `(£${price})` : ''}</option>`;
    }).join('');

  // Handle Dynamic Fields based on Service
  let extraHtml = '';
  if (mainService === 'S1') {
      extraHtml = `
          <div class="grid-2 mt-1">
              <div class="field"><label>Start Time</label><input type="time" id="f-start-time" onchange="calculateDuration()"></div>
              <div class="field"><label>End Time</label><input type="time" id="f-end-time" onchange="calculateDuration()"></div>
          </div>
      `;
  } else if (mainService === 'S2') {
      extraHtml = `
          <div class="grid-2 mt-1">
              <div class="field"><label>IKA App Enabled?</label>
                  <select id="f-ika-app"><option value="No">No</option><option value="Yes">Yes</option></select>
              </div>
              <div class="field"><label>Card Company</label><input type="text" id="f-card-company" placeholder="e.g. Worldpay"></div>
          </div>
      `;
  } else if (mainService === 'S6') {
      extraHtml = `
          <div class="grid-3 mt-1">
              <div class="field"><label>Quote Number</label><input type="text" id="f-quote-no" placeholder="Q-1001"></div>
              <div class="field"><label>System Type</label><input type="text" id="f-system-type" placeholder="e.g. IKA Till"></div>
              <div class="field"><label>Till Model</label><input type="text" id="f-till-model" placeholder="e.g. J1900"></div>
          </div>
      `;
  }

  container.innerHTML = extraHtml + `
    <div class="field mt-2">
      <label>Detailed Description</label>
      <textarea id="f-description" placeholder="Enter work details here..." style="min-height:80px;"></textarea>
    </div>
  `;
  
  calculateEstimatedPrice();
}

// --- Logic & Calculations ---

function calculateDuration() {
  const start = document.getElementById('f-start-time')?.value;
  const end = document.getElementById('f-end-time')?.value;
  const durationField = document.getElementById('f-duration');

  if (start && end && durationField) {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff < 0) diff += 1440;
    durationField.value = diff;
    calculateEstimatedPrice();
  }
}

function calculateEstimatedPrice() {
  const mainService = document.getElementById('f-service-type')?.value;
  const subService = document.getElementById('f-sub-service')?.value;
  const duration = parseInt(document.getElementById('f-duration')?.value) || 0;
  const estPriceField = document.getElementById('f-price');
  
  if (!mainService || !estPriceField) return;

  let price = 0;
  const opts = subServices[mainService] || [];
  const selectedOpt = opts.find(o => (typeof o === 'string' ? o : o.name) === subService);
  const subPrice = selectedOpt && typeof selectedOpt === 'object' ? parseFloat(selectedOpt.price) || 0 : 0;

  if (subPrice > 0) {
    price = subPrice;
  } else {
    switch(mainService) {
      case 'S1':
        if (subService === 'Set Menu') { price = pricingConfig.S1_SetMenu; } 
        else {
          price = pricingConfig.S1_Base;
          if (duration > 60) {
            const extraHours = Math.ceil((duration - 60) / 60);
            price += (extraHours * pricingConfig.S1_Hourly);
          }
        }
        break;
      case 'S2': price = pricingConfig.S2; break;
      case 'S3': price = pricingConfig.S3; break;
      case 'S4': price = pricingConfig.S4; break;
      case 'S6': price = pricingConfig.S6; break;
    }
  }

  if (autoRules && autoRules.durationMins > 0 && duration > autoRules.durationMins) {
    price += (autoRules.surcharge || 0);
  }

  estPriceField.value = price.toFixed(2);
}

// --- Settings Management ---

async function addPersonnel() {
    const name = document.getElementById('new-person-name').value.trim();
    if (!name) return;
    if (personnel.includes(name)) { showToast('Staff already exists', 'error'); return; }
    personnel.push(name);
    if (await saveAppSettingToDB('personnel', personnel)) {
        showToast('Staff added', 'success');
        document.getElementById('new-person-name').value = '';
        renderPersonnel();
    }
}

async function deletePersonnel(name) {
    personnel = personnel.filter(p => p !== name);
    if (await saveAppSettingToDB('personnel', personnel)) {
        showToast('Staff removed', 'success');
        renderPersonnel();
    }
}

async function addSubService() {
    const cat = document.getElementById('manage-srv-cat').value;
    const name = document.getElementById('new-sub-name').value.trim();
    const price = parseFloat(document.getElementById('new-sub-price').value) || 0;
    if (!name) return;
    
    if (!subServices[cat]) subServices[cat] = [];
    subServices[cat].push({ name, price });
    
    if (await saveAppSettingToDB('sub_services', subServices)) {
        showToast('Sub-service added', 'success');
        document.getElementById('new-sub-name').value = '';
        document.getElementById('new-sub-price').value = '';
        renderSubServiceManagement();
    }
}

async function deleteSubService(cat, name) {
    subServices[cat] = subServices[cat].filter(s => (typeof s === 'string' ? s : s.name) !== name);
    if (await saveAppSettingToDB('sub_services', subServices)) {
        showToast('Sub-service removed', 'success');
        renderSubServiceManagement();
    }
}

async function saveSettings() {
    const sheetUrl = document.getElementById('setting-sheet-url').value.trim();
    localStorage.setItem('google_sheet_url', sheetUrl);
    
    // Save pricing
    const pricing = {
        S1_SetMenu: parseFloat(document.getElementById('p-S1-SetMenu').value) || 0,
        S1_Base: parseFloat(document.getElementById('p-S1-Base').value) || 0,
        S1_Hourly: parseFloat(document.getElementById('p-S1-Hourly').value) || 0,
        S2: parseFloat(document.getElementById('p-S2').value) || 0,
        S3: parseFloat(document.getElementById('p-S3').value) || 0,
        S4: parseFloat(document.getElementById('p-S4').value) || 0,
        S6: parseFloat(document.getElementById('p-S6').value) || 0
    };
    
    const rules = {
        durationMins: parseInt(document.getElementById('rule-duration-mins').value) || 0,
        surcharge: parseFloat(document.getElementById('rule-surcharge-price').value) || 0
    };
    
    const pSuccess = await saveAppSettingToDB('pricing', pricing);
    const rSuccess = await saveAppSettingToDB('rules', rules);
    
    if (pSuccess && rSuccess) {
        pricingConfig = pricing;
        autoRules = rules;
        showToast('Settings saved successfully', 'success');
    }
}

// Form Submission Event Listener (kept here as it ties UI and Data)
const masterForm = document.getElementById('master-form');
if (masterForm) {
  masterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const serviceType = document.getElementById('f-service-type');
    const typeLabel = serviceType.options[serviceType.selectedIndex].text;
    
    const record = {
      ID: generateDBID(),
      TIMESTAMP: new Date().toLocaleString('en-GB'),
      COMPANY: document.getElementById('f-company').value,
      POSTCODE: document.getElementById('f-postcode').value,
      USER: document.getElementById('f-user').value,
      'MAIN SERVICE': typeLabel,
      'SUB SERVICE': document.getElementById('f-sub-service').value,
      'CRM TICKET': document.getElementById('f-crm-ticket').value || 'N/A',
      PRICE: parseFloat(document.getElementById('f-price').value) || 0,
      'PAYMENT STATUS': document.getElementById('f-payment-status').value,
      DESCRIPTION: document.getElementById('f-description').value,
      STATUS: 'Logged'
    };

    try {
      const { data, error } = await supabaseClient.from('records').insert([record]).select();
      if (error) throw error;
      
      const newRec = mapDBRecordToApp(data[0]);
      records.unshift(newRec);
      
      syncRecordToSheets(newRec);
      logActivity('New Ticket', `${newRec.company} - ${newRec.mainService}`, 'plus-circle', '#dcfce7');
      
      showToast('Ticket created successfully!', 'success');
      resetForm();
      toggleMainForm('home');
      renderDataTable();
    } catch (err) {
      showToast('Error saving record: ' + err.message, 'error');
    }
  });
}

function generateDBID() {
  return 'REC-' + (records.length + 1001);
}

function resetForm() {
  masterForm.reset();
  const loggedUser = localStorage.getItem('taskflow_logged_user');
  if (loggedUser) document.getElementById('f-user').value = loggedUser;
  document.getElementById('f-timestamp').value = new Date().toLocaleString('en-GB');
  updateDynamicFields();
}
