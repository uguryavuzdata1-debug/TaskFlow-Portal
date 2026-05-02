/**
 * UI Management Module
 */

function showTab(tabName) {
  if (tabName === 'settings') {
    // This is handled in app.js as it needs getSettingsPass
    return; 
  }

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  
  const targetSection = document.getElementById(`section-${tabName}`);
  const targetLink = document.getElementById(`btn-${tabName}`);
  
  if (targetSection) targetSection.classList.add('active');
  if (targetLink) targetLink.classList.add('active');
  
  if (tabName === 'dashboard') toggleMainForm('home');
  if (tabName === 'dataview') renderDataTable();
  if (tabName === 'invoices') renderInvoicesTable();
  if (tabName === 'customers') renderCustomersTable();
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
  window.scrollTo(0, 0);
}

function showSettingsTab(tabId) {
  document.querySelectorAll('.settings-tab').forEach(t => t.style.display = 'none');
  document.querySelectorAll('#section-settings .sub-nav-link').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(`settings-${tabId}`);
  if (target) target.style.display = 'block';

  const btn = document.getElementById(`sbtn-${tabId}`);
  if (btn) btn.classList.add('active');

  if (tabId === 'personnel') renderPersonnel();
  if (tabId === 'subservices') renderSubServiceManagement();
  if (tabId === 'pricing') renderCustomTariffs();
  if (tabId === 'activity') renderActivityLog();
  if (tabId === 'backup') loadNotifPrefs();
  
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function toggleMainForm(state) {
  const home = document.getElementById('dashboard-home');
  const selection = document.getElementById('dashboard-category-selection');
  const form = document.getElementById('dashboard-form-container');
  
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

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'info';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'alert-triangle';

  toast.innerHTML = `
    <i data-lucide="${icon}" class="toast-icon"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  // Show
  setTimeout(() => toast.classList.add('show'), 10);

  // Hide and remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// Modal Helpers
function showModalAlert(title, message, type = 'info') {
  const modal = document.getElementById('alert-modal');
  const titleEl = document.getElementById('alert-modal-title');
  const msgEl = document.getElementById('alert-modal-message');
  const iconBox = document.getElementById('alert-modal-icon');
  
  titleEl.textContent = title;
  msgEl.textContent = message;
  
  // Update icon/color based on type
  iconBox.style.background = (type === 'error') ? '#fef2f2' : (type === 'success') ? '#f0fdf4' : '#eff6ff';
  const icon = iconBox.querySelector('i');
  icon.setAttribute('data-lucide', (type === 'error') ? 'alert-octagon' : (type === 'success') ? 'check-circle' : 'info');
  icon.style.color = (type === 'error') ? '#ef4444' : (type === 'success') ? '#10b981' : '#3b82f6';
  
  modal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeModalAlert() {
  document.getElementById('alert-modal').classList.add('hidden');
}

let promptResolve = null;
function showModalPrompt(title, message, defaultValue = '', type = 'text') {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-prompt-modal');
        document.getElementById('custom-prompt-title').textContent = title;
        document.getElementById('custom-prompt-message').textContent = message;
        const input = document.getElementById('custom-prompt-input');
        input.value = defaultValue;
        input.type = type;
        
        modal.classList.remove('hidden');
        input.focus();
        promptResolve = resolve;
    });
}

function confirmCustomPrompt() {
    const val = document.getElementById('custom-prompt-input').value;
    closeCustomPrompt(val);
}

function closeCustomPrompt(val) {
    document.getElementById('custom-prompt-modal').classList.add('hidden');
    if (promptResolve) promptResolve(val);
    promptResolve = null;
}
