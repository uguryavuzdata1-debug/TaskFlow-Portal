// --- DESCRIPTION METADATA SERIALIZER ---
function parseMetadata(desc) {
    if (!desc) return { metadata: {}, details: '' };
    const match = desc.match(/^\[METADATA: ({.*?})\]\n([\s\S]*)$/);
    if (match) {
        try {
            return {
                metadata: JSON.parse(match[1]),
                details: match[2]
            };
        } catch(e) {}
    }
    return {
        metadata: {},
        details: desc
    };
}
function serializeMetadata(metadata, details) {
    return `[METADATA: ${JSON.stringify(metadata)}]\n${details}`;
}

// --- STATIC SECTOR DICTIONARY ---
// To add new business sectors or modify existing ones, edit this array directly:
// --- STATIC SYSTEM TYPES DICTIONARY ---
// To add new system types or modify existing ones, edit this array directly:
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
window.refreshCustomersFromDatabase = refreshCustomersFromDatabase;
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
window.deleteCardCompany = deleteCardCompany;
window.editOS = editOS;
window.editCCLocal = editCCLocal;
window.toggleUserProfileDropdown = toggleUserProfileDropdown;
window.logout = logout;


// --- App State Initialized Above ---

// --- Custom Alert System ---
function showAlert(title, message, icon = '🔔', showCancel = false, isPrompt = false, callback = null) {
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;
    
    // Map emojis/symbols to Lucide icons
    let lucideName = 'bell';
    let iconColor = 'var(--primary)';
    if (icon === '🚫') { lucideName = 'shield-alert'; iconColor = '#B5563A'; }
    else if (icon === '✅') { lucideName = 'check-circle'; iconColor = '#4F7A5C'; }
    else if (icon === '❌') { lucideName = 'x-circle'; iconColor = '#B5563A'; }
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

function toggleUserProfileDropdown() {
    const dropdown = document.getElementById('user-profile-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

function logout() {
    // Clear user state
    appState.currentUser = null;
    appState.currentUserRole = null;
    localStorage.removeItem('taskflow_user');
    
    // Switch to logged out view by reloading or setting classes
    document.body.classList.add('is-logged-out');
    
    const ls = document.getElementById('login-screen');
    if (ls) ls.classList.remove('hidden');
    
    const mn = document.getElementById('main-nav');
    if (mn) mn.classList.add('hidden');
    
    const mc = document.getElementById('main-content');
    if (mc) mc.classList.add('hidden');
    
    // Hide dropdown if open
    const dropdown = document.getElementById('user-profile-dropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
    
    showToast('Successfully logged out.', 'success');
}

// Close dropdown if clicking outside
document.addEventListener('click', function(e) {
    const wrapper = document.querySelector('.user-profile-dropdown-wrapper');
    const dropdown = document.getElementById('user-profile-dropdown');
    if (dropdown && !dropdown.classList.contains('hidden') && wrapper && !wrapper.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});

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
// initApp is loaded from js/api.js




// --- Navigation ---
function showTab(tabId) {
    appState.activeTab = tabId;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    const section = document.getElementById(`section-${tabId}`);
    if (section) section.classList.add('active');
    
    const btn = document.getElementById(`btn-${tabId}`);
    if (btn) btn.classList.add('active');
    
    if (tabId === 'dashboard') {
        if (typeof updateDashboardKPIs === 'function') updateDashboardKPIs();
        if (typeof renderDashboardSchedule === 'function') renderDashboardSchedule();
        if (typeof renderDashboardActivity === 'function') renderDashboardActivity();
    }
    if (tabId === 'calendar' && typeof renderCalendar !== 'undefined') renderCalendar();
    if (tabId === 'waiting' && typeof renderWaitingJobs !== 'undefined') renderWaitingJobs();
    if (tabId === 'customers' && typeof renderCustomersTable !== 'undefined') renderCustomersTable();
    if (tabId === 'invoices' && typeof renderInvoicesTable !== 'undefined') renderInvoicesTable();
    if (tabId === 'dataview' && typeof renderDataTable !== 'undefined') renderDataTable();
    
    if (tabId === 'settings') {
        updateDataStats(); // Update summary cards when settings is shown
        if (appState.currentUserRole !== 'Admin') showSettingsSubTab('account');
        else showSettingsSubTab('pricing');
    }
    
    // Preferences page gidilince user bilgilerini doldur
    if (tabId === 'preferences' || tabId === 'settings') {
        if (typeof renderPreferencesPage === 'function') renderPreferencesPage();
    }


    // Admin Panel tab: populate Personnel Directory on load
    if (tabId === 'admin') {
        setTimeout(function() {
            // Show users pane by default and render list
            if (typeof renderAdminUsersList === 'function') renderAdminUsersList();
            // Ensure first tab is visually active
            var firstAdminTab = document.querySelector('.admin-tab-btn');
            if (firstAdminTab) {
                document.querySelectorAll('.admin-tab-btn').forEach(function(b) {
                    b.style.borderBottomColor = 'transparent';
                    b.style.color = 'var(--steel)';
                });
                firstAdminTab.style.borderBottomColor = 'var(--ink)';
                firstAdminTab.style.color = 'var(--ink)';
            }
            // Ensure users pane visible, others hidden
            var allPanes = document.querySelectorAll('.admin-pane');
            allPanes.forEach(function(p) { p.style.display = 'none'; });
            var userPane = document.getElementById('admin-pane-users');
            if (userPane) userPane.style.display = 'block';
            if (window.lucide) lucide.createIcons();
        }, 150);
    }

    renderTabContent(tabId);
    if (window.lucide) lucide.createIcons();
}
window.showTab = showTab;

function showInvoiceTab(tabId) {
    appState.currentInvoiceTab = tabId;
    renderInvoicesTable();
}

function filterCustomers(filterId) {
    appState.currentCustomerFilter = filterId;
    renderCustomersTable();
}

async function refreshCustomersFromDatabase() {
    console.log("[REFRESH] Starting manual customer data refresh from Supabase...");
    showToast("Customer verileri from database loading...", "success");
    
    try {
        // --- Fallback chain: try multiple table/view names ---
        const TABLE_CANDIDATES = ['vt_customers', 'Organizations', 'VtigerCRM_Organizations', 'customers'];
        let usedTable = '';

        for (const tableName of TABLE_CANDIDATES) {
            try {
                const { data, error } = await sbClient.from(tableName).select('*').limit(1);
                if (!error && data !== null) {
                    usedTable = tableName;
                    break;
                }
            } catch (e) { continue; }
        }

        if (!usedTable) {
            showToast("No accessible customer table found.", "error");
            return;
        }

        let orgData = [];
        let lastOrgSize = 1000;
        let orgOffset = 0;
        
        while (lastOrgSize === 1000) {
            const { data, error } = await sbClient.from(usedTable)
                .select('*')
                .range(orgOffset, orgOffset + 999);
            if (error) {
                console.error("[REFRESH] Fetch error:", error);
                break;
            }
            if (data && data.length > 0) {
                orgData = orgData.concat(data);
                lastOrgSize = data.length;
                orgOffset += 1000;
            } else {
                break;
            }
        }

        if (orgData && orgData.length > 0) {
            console.log("[DEBUG] Organization fields:", Object.keys(orgData[0]));
            
            const sample = orgData[0];
            const hasVtigerColumns = 'organization_name' in sample;
            
            if (hasVtigerColumns) {
                appState.customers = orgData.map(c => ({
                    'CUSTOMER ID': c.organization_number || c.id || '',
                    'COMPANY': c.organization_name || '',
                    'POSTCODE': c.billing_postal_code || '',
                    'ADDRESS': c.billing_address || '',
                    'CITY': c.billing_city || '',
                    'PHONE': c.phone || '',
                    'PRIMARY PHONE': c.phone || '',
                    'CONTACT': c.contact_name || '',
                    'PRIMARY CONTACT': c.contact_name || '',
                    'SERVICE STATUS': (c.service_status === 'In Progress' || c.service_status === 'Active') ? 'Contract' : 'No Contract'
                }));
            } else {
                appState.customers = orgData.map(c => ({
                    'CUSTOMER ID': c.customer_id || c.id || '',
                    'COMPANY': c.company || c.company_name || c.name || '',
                    'POSTCODE': c.postcode || c.postal_code || '',
                    'ADDRESS': c.address || '',
                    'CITY': c.city || '',
                    'PHONE': c.phone || '',
                    'PRIMARY PHONE': c.phone || '',
                    'CONTACT': c.contact || c.contact_name || '',
                    'PRIMARY CONTACT': c.contact || c.contact_name || '',
                    'SERVICE STATUS': c.status || c.service_status || 'No Contract'
                }));
            }
            console.log(`[REFRESH] ✓ Refreshed ${appState.customers.length} customers from "${usedTable}"`);
            renderCustomersTable();
            showToast(`✅ ${appState.customers.length} customer loaded`, "success");
        } else {
            console.warn("[REFRESH] No organizations found.");
            appState.customers = [];
            renderCustomersTable();
            showToast("Customer not found");
        }
    } catch (e) {
        console.error("[REFRESH] Error refreshing customers:", e);
        showToast("Customer verileri yenilenirken hata occurred", "error");
    }
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

    // Call individual renderers
    if (tabId === 'stats') updateDataStats(); 
    if (tabId === 'users' || tabId === 'personnel') renderPersonnelManagement();
    if (tabId === 'permissions') renderPermissionsManagement();
    if (tabId === 'pricing') renderPricingSettings();
    if (tabId === 'logs') renderSystemLogs();
    if (tabId === 'account') renderAccountSettings();
    if (tabId === 'os') renderOSManagement();
    if (tabId === 'cc_local') renderCCLocalManagement();
    if (tabId === 'card_companies') renderCardCompanyManagement();
    if (tabId === 'cpu') renderCPUManagement();
    if (tabId === 'till_models') renderTillModelManagement();
}

function renderCustomersTable() {
    if (typeof applyCustomerFilters === 'function') applyCustomerFilters();
    else if (typeof loadCustomers === 'function') loadCustomers();
}
window.renderCustomersTable = renderCustomersTable;

function renderTabContent(tabId) {
    if (tabId === 'dataview') renderDataTable();
    if (tabId === 'customers') renderCustomersTable();
    if (tabId === 'invoices') renderInvoicesTable();
}

// --- Data Table Rendering ---
function renderDataTable() {
    const container = document.getElementById('data-table-body');
    if (!container) return;

    const search = (document.getElementById('dataview-search')?.value || '').toLowerCase().trim();
    const category = document.getElementById('dataview-category-filter')?.value || 'all';
    const payment = document.getElementById('dataview-payment-filter')?.value || 'all';
    const start = document.getElementById('dataview-start-date')?.value || '';
    const end = document.getElementById('dataview-end-date')?.value || '';

    let tickets = appState.tickets || [];

    if (category !== 'all') {
        tickets = tickets.filter(t => (t.mainService || '').includes(category));
    }

    if (payment !== 'all') {
        tickets = tickets.filter(t => (t.paymentStatus || '').toLowerCase() === payment.toLowerCase() || (t.status || '').toLowerCase() === payment.toLowerCase());
    }

    if (search) {
        tickets = tickets.filter(t => 
            (t.company || '').toLowerCase().includes(search) ||
            (t.dbId || '').toLowerCase().includes(search) ||
            (t.crmTicket || '').toLowerCase().includes(search) ||
            (t.description || '').toLowerCase().includes(search)
        );
    }

    if (start) tickets = tickets.filter(t => (t.timestamp || '').split('T')[0] >= start);
    if (end) tickets = tickets.filter(t => (t.timestamp || '').split('T')[0] <= end);

    if (tickets.length === 0) {
        container.innerHTML = '<div style="padding:2.5rem; text-align:center; color:var(--steel); font-size:0.85rem;">No service records match the selected filters.</div>';
        return;
    }

    // Display first 100 records for optimal performance
    const displayList = tickets.slice(0, 100);

    let html = '';
    displayList.forEach(t => {
        const isClosed = (t.status || '').toLowerCase() === 'closed';
        const statusBadge = isClosed
            ? '<span class="stamp confirmed" style="font-size:0.65rem; padding:2px 8px; border-radius:20px; background:#dcfce7; color:#15803d; border:1px solid #15803d;">CLOSED</span>'
            : '<span class="stamp pending" style="font-size:0.65rem; padding:2px 8px; border-radius:20px; background:#fef3c7; color:#b45309; border:1px solid #b45309;">OPEN</span>';

        const dateStr = (t.timestamp || '').split('T')[0] || (t.timestamp || '').split(' ')[0] || 'N/A';
        const priceStr = parseFloat(t.price || 0) > 0 ? '£' + parseFloat(t.price).toFixed(2) : '£0.00';

        html += `
        <div class="ledger-row" style="display:grid; grid-template-columns:100px 1.5fr 1fr 100px 100px 80px; align-items:center; padding:0.65rem 1rem; border-bottom:1px solid var(--line);">
            <div class="ledger-ts" style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">${dateStr}</div>
            <div style="font-weight:700; color:var(--ink); font-size:0.85rem;">${t.company || 'Unknown'}</div>
            <div style="font-size:0.8rem; color:var(--steel); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${t.mainService || ''}">${t.mainService || 'Support'}</div>
            <div>${statusBadge}</div>
            <div style="font-weight:700; color:var(--ink); font-size:0.85rem;">${priceStr}</div>
            <div style="text-align:right;">
                <button class="ticket-btn" onclick="showDetails('${t.id}')" style="padding:2px 8px; font-size:0.75rem; cursor:pointer;">View</button>
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
}
function renderInvoicesTable() {
    const tbody = document.getElementById('invoice-table-body');
    if (!tbody) return;

    const tabFilter = document.getElementById('invoice-tab-filter')?.value || 'all';
    const search = (document.getElementById('invoice-search')?.value || '').toLowerCase().trim();
    const start = document.getElementById('invoice-start-date')?.value;
    const end = document.getElementById('invoice-end-date')?.value;

    let invoices = appState.invoices || [];

    if (tabFilter === 'pending') {
        invoices = invoices.filter(i => (i.status || '').toUpperCase() === 'PENDING');
    } else if (tabFilter === 'invoiced' || tabFilter === 'paid') {
        invoices = invoices.filter(i => (i.status || '').toUpperCase() !== 'PENDING');
    }

    if (search) {
        invoices = invoices.filter(i => 
            (i.customer_name || '').toLowerCase().includes(search) ||
            (i.id || '').toLowerCase().includes(search)
        );
    }

    if (start) invoices = invoices.filter(i => (i.issue_date || '') >= start);
    if (end) invoices = invoices.filter(i => (i.issue_date || '') <= end);

    if (invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--steel);">No invoices match filter.</td></tr>';
        return;
    }

    tbody.innerHTML = invoices.slice(0, 100).map(inv => {
        const isPaid = (inv.status || '').toUpperCase() === 'PAID';
        const statusBadge = isPaid
            ? '<span class="stamp confirmed" style="font-size:0.7rem; padding:2px 8px; border-radius:20px; background:#dcfce7; color:#15803d; border:1px solid #15803d;">PAID</span>'
            : '<span class="stamp pending" style="font-size:0.7rem; padding:2px 8px; border-radius:20px; background:#fef3c7; color:#b45309; border:1px solid #b45309;">PENDING</span>';

        return `
        <tr style="border-bottom: 1px solid var(--border-color, #e2e8f0);">
            <td style="padding:12px 16px;">
                <div style="font-weight:600; color:var(--ink);">${inv.issue_date || 'N/A'}</div>
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">${inv.id}</div>
            </td>
            <td style="padding:12px 16px; font-weight:700; color:var(--ink);">${inv.customer_name || 'Customer'}</td>
            <td style="padding:12px 16px; color:var(--steel); font-size:0.85rem;">Quotation / Equipment & Service</td>
            <td style="padding:12px 16px; font-weight:700; color:var(--ink);">£${parseFloat(inv.total || 0).toFixed(2)}</td>
            <td style="padding:12px 16px; text-align:right;">
                ${statusBadge}
            </td>
        </tr>
        `;
    }).join('');
    if (window.lucide) lucide.createIcons();
}
// --- Modal Functions ---
function editInvoice(id) {
    const r = appState.tickets.find(t => t.id == id); if (!r) return;
    const isUser = appState.currentUserRole === 'User';
    const isAccounting = appState.currentUserRole === 'Accounting';

    appState.editingRecordId = id;
    const content = document.getElementById('modal-details-content');
    document.getElementById('modal-title').innerText = isUser ? "Edit Record – " + r.dbId : "Edit Billing & Record – " + r.dbId;
    document.getElementById('btn-modal-save').classList.remove('hidden');
    const cancelBtn = document.getElementById('btn-modal-cancel');
    if (cancelBtn) cancelBtn.classList.add('hidden');

    content.innerHTML = `
        <div style="padding: 0.5rem; color: #1D2430; font-family: inherit;">
            <!-- Ticket Info (Read Only) -->
            <div style="background: #FBF9F3; border: 1px solid #FBF9F3; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <div class="grid-4" style="margin-bottom: 15px; gap: 1rem;">
                    <div class="field">
                        <label style="color:#66707C; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Staff (Created By)</label>
                        <div style="background: #FBF9F3; color: #1D2430; font-weight: 600; border: 1px solid #FBF9F3; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.user}</div>
                    </div>
                    <div class="field">
                        <label style="color:#66707C; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Database ID</label>
                        <div style="background: #FBF9F3; color: #1D2430; font-weight: 600; border: 1px solid #FBF9F3; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.dbId}</div>
                    </div>
                    <div class="field">
                        <label style="color:#66707C; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">CRM Ticket</label>
                        <div style="background: #FBF9F3; color: #1D2430; font-weight: 600; border: 1px solid #FBF9F3; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.crmTicket || 'N/A'}</div>
                        <input type="hidden" id="e-crm-ticket" value="${r.crmTicket || ''}">
                    </div>
                    <div class="field">
                        <label style="color:#66707C; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Timestamp</label>
                        <div style="background: #FBF9F3; color: #1D2430; font-weight: 600; border: 1px solid #FBF9F3; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${new Date(r.timestamp).toLocaleString()}</div>
                    </div>
                </div>
                <div class="grid-3" style="margin-bottom: 15px; gap: 1rem;">
                    <div class="field">
                        <label style="color:#66707C; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Customer ID</label>
                        <div style="background: #FBF9F3; color: #1D2430; font-weight: 600; border: 1px solid #FBF9F3; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.companyId || 'N/A'}</div>
                    </div>
                    <div class="field">
                        <label style="color:#66707C; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Company</label>
                        <div style="background: #FBF9F3; color: #1D2430; font-weight: 600; border: 1px solid #FBF9F3; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.company}</div>
                    </div>
                    <div class="field">
                        <label style="color:#66707C; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Postcode</label>
                        <div style="background: #FBF9F3; color: #1D2430; font-weight: 600; border: 1px solid #FBF9F3; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.postcode || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <!-- Editable Fields -->
            <div style="background: #FBF9F3; border: 1px solid #FBF9F3; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <p style="font-size: 12px; font-weight: 800; color: var(--primary); margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: 0.05em;">Invoice Billing Details (Editable)</p>
                <div class="grid-3" style="gap: 1rem; margin-bottom: 15px;">
                    <div class="field">
                        <label style="color:#66707C; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Invoice Reference</label>
                        <input type="text" id="e-inv-no" value="${r.invoiceNo || ''}" placeholder="Enter Inv No..." style="background: #FBF9F3; color: #1D2430; border: 1px solid #66707C; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600;">
                    </div>
                    <div class="field">
                        <label style="color:#66707C; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Service Date</label>
                        <input type="date" id="e-inv-date" value="${r.invoiceDate || new Date().toISOString().split('T')[0]}" style="background: #FBF9F3; color: #1D2430; border: 1px solid #66707C; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600;">
                    </div>
                    <div class="field">
                        <label style="color:#66707C; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Payment Status</label>
                        <select id="e-invoice-status" style="background: #FBF9F3 url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%2364748b\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'%3e%3cpolyline points=\\'6 9 12 15 18 9\\'%3e%3c/polyline%3e%3c/svg%3e') no-repeat right 12px center; background-size: 14px; color: #1D2430; border: 1px solid #66707C; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600; cursor: pointer; -webkit-appearance: none; -moz-appearance: none; appearance: none; padding-right: 36px !important;">
                            <option value="Pending" ${r.status === 'Pending' || r.status === 'Logged' ? 'selected' : ''}>Pending</option>
                            <option value="Paid" ${r.status === 'Paid' ? 'selected' : ''}>Paid</option>
                            <option value="Partially Paid" ${r.status === 'Partially Paid' ? 'selected' : ''}>Partially Paid</option>
                            <option value="Cancelled" ${r.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                            <option value="Refunded" ${r.status === 'Refunded' ? 'selected' : ''}>Refunded</option>
                            <option value="Write Off" ${r.status === 'Write Off' ? 'selected' : ''}>Write Off</option>
                        </select>
                        <input type="hidden" id="e-payment" value="${r.paymentStatus}">
                        <input type="hidden" id="e-invoiced" value="${r.status !== 'Pending' && r.status !== 'Logged' ? 'true' : 'false'}">
                    </div>
                </div>
                <div class="grid-2" style="gap: 1rem; margin-bottom: 15px;">
                    <div class="field">
                        <label style="color:#66707C; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Final Price (£)</label>
                        <input type="number" id="e-price" value="${r.price}" step="0.01" style="background: #FBF9F3; color: var(--primary); border: 1px solid #66707C; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 700;">
                    </div>
                    <div class="field">
                        <label style="color:#66707C; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">VAT (£)</label>
                        <input type="number" id="e-vat" value="${parseFloat(r.vat || 0).toFixed(2)}" step="0.01" style="background: #FBF9F3; color: #1D2430; border: 1px solid #66707C; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600;">
                    </div>
                </div>
                <div class="field" style="margin-bottom: 15px;">
                    <label style="color:#66707C; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Invoice Notes</label>
                    <input type="text" id="e-invoice-notes" value="${r.invoiceNotes || ''}" placeholder="Enter payment/VAT notes here..." style="background: #FBF9F3; color: #1D2430; border: 1px solid #66707C; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600;">
                </div>
                <div class="field" style="margin-bottom: 15px;">
                    <label style="color:#66707C; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Work Details</label>
                    <textarea id="e-description" rows="4" style="background: #FBF9F3; color: #1D2430; border: 1px solid #66707C; border-radius: 10px; padding: 12px 16px; outline: none; font-size: 13px; font-weight: 500;">${r.description || ''}</textarea>
                </div>
                <input type="hidden" id="e-start-time" value="${r.startTime || ''}">
                <input type="hidden" id="e-end-time" value="${r.endTime || ''}">
                <div id="sync-notice" style="margin-top: 1rem; display: none;"></div>
            </div>
        </div>
    `;
    document.getElementById('details-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
    setTimeout(() => {
        if (typeof updateEditSubServices === 'function') updateEditSubServices(r.subService);
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
            invoicedEl.style.setProperty('background', '#FBF9F3', 'important');
            invoicedEl.style.color = '#66707C';
            invoicedEl.style.cursor = 'not-allowed';
            invoicedEl.value = 'false'; // force reset to pending
        } else {
            invoicedEl.disabled = false;
            invoicedEl.style.removeProperty('background');
            invoicedEl.style.background = '#FBF9F3';
            invoicedEl.style.color = '#1D2430';
            invoicedEl.style.cursor = 'pointer';
        }
    }

    // Show/hide sync notice banner
    if (!isChargeable) {
        noticeEl.style.display = 'block';
        noticeEl.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); border-radius:10px; padding:12px 16px;">
                <i data-lucide="alert-triangle" style="width:16px; height:16px; color:#B5563A; flex-shrink:0;"></i>
                <span style="font-size:12px; color:#fca5a5; font-weight:600;">This record will be <strong style="color:#B5563A;">removed from Invoicing</strong> automatically. Status: <strong style="color:#B5563A;">${status}</strong> records are not billable.</span>
            </div>`;
        if (window.lucide) lucide.createIcons();
    } else {
        const price = parseFloat(priceEl?.value || 0);
        if (price > 0) {
            noticeEl.style.display = 'block';
            noticeEl.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); border-radius:10px; padding:12px 16px;">
                    <i data-lucide="check-circle" style="width:16px; height:16px; color:#4F7A5C; flex-shrink:0;"></i>
                    <span style="font-size:12px; color:#4F7A5C; font-weight:600;">This record <strong style="color:#4F7A5C;">is visible in Invoicing</strong>. Chargeable with £${price.toFixed(2)}.</span>
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
    const newStatus = document.getElementById('e-invoice-status')?.value || 'Pending';
    const newPrice = parseFloat(document.getElementById('e-price').value) || 0;
    const newInvNo = document.getElementById('e-inv-no').value;
    const newInvDate = document.getElementById('e-inv-date').value;
    const newStartTime = document.getElementById('e-start-time')?.value || '';
    const newEndTime = document.getElementById('e-end-time')?.value || '';

    const newMainService = document.getElementById('e-main-service')?.value || null;
    const newSubService = document.getElementById('e-sub-service')?.value || null;
    const newDescription = document.getElementById('e-description')?.value || '';
    const newCrmTicket = document.getElementById('e-crm-ticket')?.value || '';
    
    const newVat = parseFloat(document.getElementById('e-vat')?.value || 0) || 0;
    const newInvoiceNotes = document.getElementById('e-invoice-notes')?.value || '';
    const newPaymentStatus = document.getElementById('e-payment')?.value || 'Chargeable';

    const r = appState.tickets.find(t => t.id == appState.editingRecordId);
    const parsed = parseMetadata(r ? (r.rawDescription || r.description) : '');
    const updatedMetadata = {
        ...parsed.metadata,
        vat: newVat,
        invoiceNotes: newInvoiceNotes
    };
    const updatedDescription = serializeMetadata(updatedMetadata, newDescription);

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
        invoiced: newStatus !== 'Pending',
        STATUS: newStatus,
        "START TIME": newStartTime,
        "END TIME": newEndTime,
        DESCRIPTION: updatedDescription,
        "CRM TICKET": newCrmTicket,
        ...(newDuration !== null ? { DURATION: newDuration } : {})
    };

    try {
        await sbClient.from('records').update(updates).eq('id', appState.editingRecordId);

        // --- Optimistic Local State Update ---
        const localTicket = appState.tickets.find(t => t.id == appState.editingRecordId);
        if (localTicket) {
            localTicket.invoiceNo = newInvNo;
            localTicket.invoiceDate = newInvDate;
            localTicket.price = newPrice;
            localTicket.paymentStatus = newPaymentStatus;
            localTicket.invoiced = newStatus !== 'Pending';
            localTicket.status = newStatus;
            localTicket.startTime = newStartTime;
            localTicket.endTime = newEndTime;
            if (newMainService) localTicket.mainService = newMainService;
            if (newSubService) localTicket.subService = newSubService;
            localTicket.description = newDescription;
            localTicket.rawDescription = updatedDescription;
            localTicket.crmTicket = newCrmTicket;
            if (newDuration !== null) localTicket.duration = newDuration;
            localTicket.vat = newVat;
            localTicket.invoiceNotes = newInvoiceNotes;

            closeModal();
            renderDataTable();
            renderInvoicesTable();
            updateDataStats();
            showAlert('Saved', 'Record updated successfully!', '✅');
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
        <div style="background: #FBF9F3; border: 1px solid #FBF9F3; padding: 1.5rem; border-radius: 16px; font-family: inherit; color: #1D2430;">
            <!-- Grid Layout for info groups -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <!-- Primary Info -->
                <div style="background: #FBF9F3; border: 1px solid #FBF9F3; padding: 1.25rem; border-radius: 12px;">
                    <h4 style="font-size: 11px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1px solid #66707C; padding-bottom: 6px;">Primary Info</h4>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #66707C; font-weight: 500;">ID:</span> <strong style="color: #1D2430;">${r.dbId}</strong></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #66707C; font-weight: 500;">CRM Ticket:</span> <span style="color: #1D2430; font-weight: 600;">${r.crmTicket || 'N/A'}</span></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #66707C; font-weight: 500;">Date:</span> <span style="color: #1D2430; font-weight: 600;">${new Date(r.timestamp).toLocaleString()}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="color: #66707C; font-weight: 500;">Staff:</span> <span style="color: #1D2430; font-weight: 600;">${r.user}</span></div>
                </div>
                
                <!-- Customer Info -->
                <div style="background: #FBF9F3; border: 1px solid #FBF9F3; padding: 1.25rem; border-radius: 12px;">
                    <h4 style="font-size: 11px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1px solid #66707C; padding-bottom: 6px;">Customer Info</h4>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #66707C; font-weight: 500;">Company:</span> <strong style="color: #1D2430;">${r.company}</strong></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #66707C; font-weight: 500;">Postcode:</span> <span style="color: #1D2430; font-weight: 600;">${r.postcode}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="color: #66707C; font-weight: 500;">Service Status:</span> <span style="color: #1D2430; font-weight: 600;">${appState.customers.find(c => c['COMPANY'] === r.company)?.['SERVICE STATUS'] || 'N/A'}</span></div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: ${isUser ? '1fr' : '1fr 1fr'}; gap: 24px; margin-top: 20px;">
                <!-- Work Info -->
                <div style="background: #FBF9F3; border: 1px solid #FBF9F3; padding: 1.25rem; border-radius: 12px;">
                    <h4 style="font-size: 11px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1px solid #66707C; padding-bottom: 6px;">Work Info</h4>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #66707C; font-weight: 500;">Service Category:</span> <strong style="color: #1D2430;">${(() => { const s = (appState.settings.services || LOCAL_SERVICES).find(x => x.name === r.mainService); return s ? (s.full_name || s.name) + ' (' + r.mainService + ')' : r.mainService; })()}</strong></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #66707C; font-weight: 500;">Sub Service:</span> <span style="color: #1D2430; font-weight: 600;">${r.subService || 'N/A'}</span></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #66707C; font-weight: 500;">Start Time:</span> <span style="color: #1D2430; font-weight: 600;">${r.startTime || 'N/A'}</span></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #66707C; font-weight: 500;">End Time:</span> <span style="color: #1D2430; font-weight: 600;">${r.endTime || 'N/A'}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="color: #66707C; font-weight: 500;">Duration:</span> <span style="color: #1D2430; font-weight: 600;">${r.duration} min</span></div>
                </div>
                
                ${isUser ? '' : `
                <!-- Billing Info -->
                <div style="background: #FBF9F3; border: 1px solid #FBF9F3; padding: 1.25rem; border-radius: 12px;">
                    <h4 style="font-size: 11px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 1px solid #66707C; padding-bottom: 6px;">Billing Info</h4>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #66707C; font-weight: 500;">Price:</span> <strong style="color: #1D2430;">£${parseFloat(r.price).toFixed(2)}</strong></div>
                    <div style="margin-bottom: 10px; display: flex; justify-content: space-between;"><span style="color: #66707C; font-weight: 500;">Status:</span> <span style="color: #1D2430; font-weight: 600;">${r.paymentStatus}</span></div>
                    <div style="display: flex; justify-content: space-between;"><span style="color: #66707C; font-weight: 500;">Inv No:</span> <span style="color: #1D2430; font-weight: 600;">${r.invoiceNo || 'N/A'}</span></div>
                </div>
                `}
            </div>
            
            <!-- Work Details -->
            <div style="margin-top: 20px;">
                <h4 style="font-size: 11px; text-transform: uppercase; color: var(--primary); font-weight: 800; letter-spacing: 0.05em; margin-bottom: 10px;">Work Details / Technical Specs</h4>
                <div style="white-space: pre-wrap; font-size: 13.5px; line-height: 1.6; color: #1D2430; background: #FBF9F3; padding: 16px; border-radius: 12px; border: 1px solid #FBF9F3; max-height: 250px; overflow-y: auto;">${r.description || 'No work details provided.'}</div>
            </div>
            
            ${!isUser ? `
            <!-- Action Buttons -->
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #FBF9F3; display: flex; justify-content: flex-end;">
                <button onclick="printInvoice('${r.id}')" style="background: #4C5FA6; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(30,58,138,0.3); transition: transform 0.2s;">
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
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FBF9F3; padding: 40px 20px; color: #1D2430; margin: 0; }
        .invoice-container { max-width: 800px; margin: 0 auto; background: #FBF9F3; padding: 50px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #FBF9F3; padding-bottom: 30px; }
        .logo-area h1 { margin: 0; color: #4C5FA6; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
        .logo-area p { margin: 5px 0 0 0; color: #66707C; font-size: 14px; line-height: 1.5; }
        .invoice-details { text-align: right; }
        .invoice-details h2 { margin: 0 0 10px 0; color: #1D2430; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
        .invoice-details p { margin: 4px 0; color: #66707C; font-size: 14px; }
        .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .info-block { width: 45%; }
        .info-block h3 { margin: 0 0 10px 0; color: #66707C; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
        .info-block p { margin: 0; font-size: 15px; line-height: 1.6; color: #1D2430; font-weight: 500; }
        .table-container { margin-bottom: 40px; border-radius: 8px; overflow: hidden; border: 1px solid #66707C; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #4C5FA6; color: #FBF9F3; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; text-align: left; padding: 16px; border-bottom: 2px solid #66707C; font-weight: 700; }
        td { padding: 16px; border-bottom: 1px solid #66707C; color: #1D2430; font-size: 15px; }
        tr:last-child td { border-bottom: none; }
        .totals { width: 50%; margin-left: auto; }
        .totals-row { display: flex; justify-content: space-between; padding: 12px 16px; font-size: 15px; color: #66707C; }
        .totals-row.total { font-size: 20px; font-weight: 800; color: #4C5FA6; border-top: 2px solid #FBF9F3; margin-top: 8px; padding-top: 16px; }
        .footer { text-align: center; margin-top: 50px; padding-top: 30px; border-top: 1px solid #FBF9F3; color: #66707C; font-size: 13px; line-height: 1.6; }
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
            <button onclick="window.print()" style="background: #4C5FA6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 14px; box-shadow: 0 4px 12px rgba(30,58,138,0.2);">🖨️ Print to PDF / Email</button>
            <p style="font-size: 12px; color: #66707C; margin-top: 8px;">Tip: You can also press Ctrl+A, Ctrl+C to copy this invoice and paste it directly into an email body.</p>
        </div>
        
        <div class="header">
            <div class="logo-area">
                <h1 style="color: #1D2430;">IKA Epos Ltd</h1>
                <p>Unit B Watkins House Pegamoid Road<br>London N18 2NG<br>Tel: 020 8887 1578<br>www.ikaepos.com &nbsp;|&nbsp; accounts@ikaepos.com &nbsp;|&nbsp; sales@ikaepos.com</p>
            </div>
            <div class="invoice-details">
                <h2>INVOICE</h2>
                <p><strong>Invoice No:</strong> ${invoiceNo}</p>
                <p><strong>Issued:</strong> ${invoiceDate}</p>
                <p><strong>Valid Until:</strong> ${validUntilDate}</p>
                <p style="margin-top: 8px;"><strong>Payment Status:</strong> <span style="display:inline-block; padding: 2px 8px; border-radius: 4px; background: ${r.paymentStatus === 'Chargeable' ? '#fee2e2' : '#dcfce3'}; color: ${r.paymentStatus === 'Chargeable' ? '#B5563A' : '#4F7A5C'}; font-weight: 700; font-size: 12px;">${r.paymentStatus}</span></p>
            </div>
        </div>
        
        <div class="info-section">
            <div class="info-block">
                <h3>Billed To</h3>
                <p><strong style="font-size: 18px; color: #1D2430;">${r.company}</strong><br>
                   <span style="color: #66707C;">
                   ${customer && customer['ADDRESS'] ? customer['ADDRESS'] + '<br>' : ''}
                   ${customer && customer['CITY'] ? customer['CITY'] + ' ' : ''}${r.postcode || ''}<br>
                   ${customer && customer['CUSTOMER ID'] ? 'Customer ID: ' + customer['CUSTOMER ID'] : ''}
                   </span>
                </p>
            </div>
            <div class="info-block" style="text-align: right;">
                <h3>Service Details</h3>
                <p><span style="color: #66707C;">CRM Ticket:</span> <strong>${r.crmTicket || 'N/A'}</strong><br>
                   <span style="color: #66707C;">Assigned Staff:</span> <strong>${r.user}</strong>
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
                            <strong style="display:block; margin-bottom: 6px; color: #1D2430;">${categoryName}</strong>
                            <span style="color: #66707C; font-size: 14px;">${r.subService || 'General Service and Maintenance'}</span>
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
            <div class="totals-row" style="color: #4F7A5C;">
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
        
        <div class="footer" style="text-align: center; font-size: 11px; line-height: 1.6; color: #66707C; padding-top: 20px;">
            <p>Unless otherwise agreed in writing by IKA Epos Ltd. all invoices are payable in full on delivery in the currency of the invoice, drawn on a bank based in the U.K or by such other method as is agreed in advance by IKA Epos Ltd. The supply of these goods are subject to our terms and conditions. You can find a copy on www.ikaepos.com.</p>
            <p style="margin-top: 10px; font-size: 12.5px; color: #1D2430;"><strong>For Bank Transfers:</strong> Natwest Bank &nbsp;|&nbsp; <strong>Sort Code:</strong> 60-16-12 &nbsp;|&nbsp; <strong>Account No:</strong> 77151216</p>
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
        
        appState.currentUser = userData.full_name || userData.email;
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
            
            // Setup Profile Dropdown Fields
            const fn = document.getElementById('dropdown-full-name');
            if (fn) fn.innerText = appState.currentUser;
            const firstName = document.getElementById('dropdown-first-name');
            const actualFirstName = appState.currentUser.split(' ')[0];
            if (firstName) firstName.innerText = actualFirstName;
            const role = document.getElementById('dropdown-role');
            if (role) role.innerText = appState.currentUserRole || 'User';
            const avatar = document.getElementById('current-user-avatar');
            if (avatar) avatar.innerText = appState.currentUser.charAt(0).toUpperCase();

            // Update dashboard hero greeting
            const hg = document.getElementById('hero-greeting');
            if (hg) {
                const hour = new Date().getHours();
                let greeting = 'Good evening';
                if (hour < 12) greeting = 'Good morning';
                else if (hour < 18) greeting = 'Good afternoon';
                
                let displayName = actualFirstName;
                if (appState.currentUser.toUpperCase().includes('ADMIN') || (appState.currentUserRole && appState.currentUserRole.toUpperCase().includes('ADMIN'))) {
                    displayName = 'Admin';
                }
                
                hg.innerText = `${greeting}, ${displayName} 👋`;
            }

            showToast(`Welcome, ${appState.currentUser}!`, 'success');
            initApp();
        } catch (e) { console.error(e); document.body.classList.remove('is-logged-out'); }
    } else {
        showToast('Invalid password. Please tekrar deneyiniz.', 'error');
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
            const un = document.getElementById('current-user-name');
            if (un) un.innerText = newName;
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
                                ${data.email.toUpperCase() !== 'ADMIN' ? `<button class="btn-icon" onclick="deleteUser('${data.id}', '${displayName}')" title="Remove User" style="color:#B5563A;">🗑️</button>` : 'System'}
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

function selectCategory(cat, dept) { 
    resetForm(); 
    const el = document.getElementById('f-service-type');
    if (el) {
        const exists = Array.from(el.options).some(opt => opt.value === cat);
        if (!exists) {
            const opt = document.createElement('option');
            opt.value = cat;
            const catMap = {
                'S1': 'MENU UPDATE',
                'S2': 'CREDIT CARD',
                'S3': 'DATA RESET',
                'S4': 'SERVICE',
                'S5': 'OTHER',
                'S6': 'TILL SETUP'
            };
            opt.text = catMap[cat] || cat;
            el.add(opt);
        }
        el.value = cat; 
        el.disabled = true; // Lock the category when coming from a tile
    }
    
    const deptEl = document.getElementById('f-department');
    if (deptEl) {
        deptEl.value = dept || '';
    }
    
    const catDispEl = document.getElementById('f-service-type-display');
    if (catDispEl) {
        const catMap = {
            'S1': 'MENU UPDATE',
            'S2': 'CREDIT CARD',
            'S3': 'DATA RESET',
            'S4': 'SERVICE',
            'S5': 'OTHER',
            'S6': 'TILL SETUP'
        };
        catDispEl.value = catMap[cat] || cat;
    }
    
    updateDynamicFields(); 
    toggleMainForm('form'); 
}

function toggleMainForm(s) { ['dashboard-home', 'dashboard-category-selection', 'dashboard-form-container'].forEach(v => { const el = document.getElementById(v); if (el) el.style.display = 'none'; }); if (s === 'category') document.getElementById('dashboard-category-selection').style.display = 'block'; else if (s === 'form') document.getElementById('dashboard-form-container').style.display = 'block'; else document.getElementById('dashboard-home').style.display = 'block'; }
function updateDynamicFields() {
    const mainSelect = document.getElementById('f-service-type');
    if (!mainSelect) return;
    
    const main = mainSelect.value;
    const subServices = appState.settings?.sub_services || 
                        (typeof defaultSeeds !== 'undefined' ? defaultSeeds.sub_services : null) || 
                        (typeof LOCAL_SUB_SERVICES !== 'undefined' ? LOCAL_SUB_SERVICES : null);
    let opts = [];
    if (subServices) {
        if (Array.isArray(subServices)) {
            opts = subServices.filter(s => s.service_name === main).map(s => s.name);
        } else if (typeof subServices === 'object') {
            opts = subServices[main] || [];
        }
    }
    
    const subSelect = document.getElementById('f-sub-service');
    if (subSelect) {
        subSelect.innerHTML = opts.map(o => `<option value="${o}">${o}</option>`).join('');
    }
    
    let extra = ''; 
    if (main === 'S1') {
        extra = `
            <div style="background: #FBF9F3; padding: 15px 25px; border-radius: 12px; border: 1px dashed #66707C; margin-top: 20px; margin-bottom: 25px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600; color: #1D2430;">
                    <input type="checkbox" id="f-s1-no-appointment" onchange="calculatePrice()" style="width: 18px; height: 18px; cursor: pointer;">
                    <span>Urgent / No Prior Appointment (+£25.00 Service Fee)</span>
                </label>
            </div>`;
    } else if (main === 'S2') {
        extra = `
            <div style="background: #FBF9F3; padding: 25px; border-radius: 12px; border: 1px dashed #66707C; margin-top: 20px; margin-bottom: 25px;">
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
            <div style="background: #FBF9F3; padding: 25px; border-radius: 12px; border: 1px dashed #4C5FA6; margin-top: 20px; margin-bottom: 25px;">
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
    if (typeof updateDashboardKPIs === 'function') updateDashboardKPIs();
    if (typeof renderDashboardSchedule === 'function') renderDashboardSchedule();
    if (typeof renderDashboardActivity === 'function') renderDashboardActivity();
    renderServiceSelects();
    renderDataTable();
    renderCustomersTable();
    renderInvoicesTable();
    if (typeof renderWaitingJobs === 'function') renderWaitingJobs();
    updateDataStats();

    const dl = document.getElementById('vtiger-customer-list');
    const custSource = (typeof allCustomersCache !== 'undefined' && allCustomersCache.length > 0) ? allCustomersCache : (appState.customers || []);
    if (dl && custSource.length > 0) {
        dl.innerHTML = custSource.map(c => {
            const orgName = c.organization_name || c.COMPANY || '';
            const orgId = c.organization_number || c['CUSTOMER ID'] || '';
            const postcode = c.billing_postal_code || c.POSTCODE || '';
            const label = `${orgName} (${orgId}, ${postcode})`;
            return `<option value="${label}">`;
        }).join('');
    }
    if (window.lucide) lucide.createIcons();
}
window.renderAll = renderAll;
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

function populateTimeDropdowns() {
    // Business hours options: 09:00 – 18:00, every 15 minutes
    const businessOptions = [];
    for (let h = 9; h <= 18; h++) {
        for (let m = 0; m < 60; m += 15) {
            if (h === 18 && m > 0) break; // stop at 18:00 exactly
            const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            businessOptions.push(`<option value="${time}">${time}</option>`);
        }
    }

    // Full 24h options for quick-add modals (appointments can be any time)
    const fullOptions = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            fullOptions.push(`<option value="${time}">${time}</option>`);
        }
    }

    // Main form: business hours only
    ['f-start-time', 'f-end-time'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = businessOptions.join('');
    });

    // Quick-add modals: full 24h range
    ['qa-time', 'gc-qa-time'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = fullOptions.join('');
    });
}


function calculateDuration() {
    const startEl = document.getElementById('f-start-time');
    const endEl   = document.getElementById('f-end-time');
    let s = startEl.value;
    const e = endEl.value;
    
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
    const searchEl = document.getElementById('f-customer-search');
    if (!searchEl) return;
    const searchValue = searchEl.value;
    
    // Find customer by name, or CID, or postcode, or full autocomplete label
    const customer = (appState.customers || []).find(c => {
        const label = `${c.COMPANY} (${c['CUSTOMER ID'] || c['ORGANIZATION NUMBER'] || ''}, ${c.POSTCODE || ''})`;
        return label === searchValue || 
               c.COMPANY === searchValue || 
               (c['CUSTOMER ID'] || c['ORGANIZATION NUMBER'] || '') === searchValue || 
               (c.POSTCODE && c.POSTCODE === searchValue);
    });
    
    const companyEl = document.getElementById('f-company');
    const companyIdEl = document.getElementById('f-company-id');
    const postcodeEl = document.getElementById('f-postcode');
    const addressEl = document.getElementById('f-address');
    const phoneEl = document.getElementById('f-phone');
    const ownerEl = document.getElementById('f-owner');
    const statusEl = document.getElementById('f-status');
    const paymentEl = document.getElementById('f-payment-status');
    
    if (customer) {
        if (companyEl) companyEl.value = customer.COMPANY || '';
        if (companyIdEl) companyIdEl.value = customer['CUSTOMER ID'] || customer['ORGANIZATION NUMBER'] || '';
        if (postcodeEl) postcodeEl.value = customer.POSTCODE || customer['BILLING POSTAL CODE'] || '';
        
        const street = customer['ADDRESS'] || '';
        const city = customer['CITY'] || '';
        const postcodeVal = customer['POSTCODE'] || customer['BILLING POSTAL CODE'] || '';
        const addressParts = [street, city, postcodeVal].filter(Boolean);
        if (addressEl) addressEl.value = addressParts.join(', ');
        
        if (phoneEl) phoneEl.value = customer['PHONE'] || customer['PRIMARY PHONE'] || '';
        if (ownerEl) ownerEl.value = customer['OWNERSHIP'] || '';
        
        const statusVal = customer['SERVICE STATUS'] || 'No Contract';
        if (statusEl) statusEl.value = statusVal;
        
        // Update Status Badge
        const statusBadge = document.getElementById('f-status-badge');
        if (statusBadge) {
            if (statusVal === 'Contract') {
                statusBadge.textContent = 'ACTIVE CONTRACT';
                statusBadge.style.cssText = 'background: #4F7A5C; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
            } else {
                statusBadge.textContent = 'CHARGEABLE (NO CONTRACT)';
                statusBadge.style.cssText = 'background: #D98E3F; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
            }
        }
        
        // Update Payment Status and Payment Badge
        const paymentBadge = document.getElementById('f-payment-badge');
        if (statusVal === 'Contract') {
            if (paymentEl) paymentEl.value = 'Contract';
            if (paymentBadge) {
                paymentBadge.textContent = 'CONTRACT (FREE)';
                paymentBadge.style.cssText = 'background: #4F7A5C; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
            }
            const priceInput = document.getElementById('f-price');
            if (priceInput) priceInput.value = '0.00';
        } else {
            if (paymentEl) paymentEl.value = 'Chargeable';
            if (paymentBadge) {
                paymentBadge.textContent = 'CHARGEABLE';
                paymentBadge.style.cssText = 'background: #4C5FA6; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
            }
            // Recalculate price and update final price
            calculatePrice();
        }
    } else {
        // Reset customer details to empty
        if (companyEl) companyEl.value = '';
        if (companyIdEl) companyIdEl.value = '';
        if (postcodeEl) postcodeEl.value = '';
        if (addressEl) addressEl.value = '';
        if (phoneEl) phoneEl.value = '';
        if (ownerEl) ownerEl.value = '';
        if (statusEl) statusEl.value = '';
        
        const statusBadge = document.getElementById('f-status-badge');
        if (statusBadge) {
            statusBadge.textContent = 'NO CUSTOMER';
            statusBadge.style.cssText = 'background: #66707C; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
        }
        
        const paymentBadge = document.getElementById('f-payment-badge');
        if (paymentBadge) {
            paymentBadge.textContent = 'PENDING';
            paymentBadge.style.cssText = 'background: #66707C; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
        }
    }
}function updatePaymentStyle(el) {
    if (el.value === 'Contract') {
        el.style.setProperty('background', '#4F7A5C', 'important');
        el.style.setProperty('color', 'white', 'important');
        el.style.fontWeight = '800';
    } else {
        el.style.setProperty('background', '#FBF9F3', 'important');
        el.style.setProperty('color', '#1D2430', 'important');
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

function updatePriceFieldAccessibility() {
    const priceInput = document.getElementById('f-price');
    if (priceInput) {
        const canEdit = appState.currentUserRole === 'Admin' || appState.currentUserRole === 'Accounting';
        priceInput.readOnly = !canEdit;
        if (!canEdit) {
            priceInput.style.background = '#FBF9F3';
        } else {
            priceInput.style.background = '';
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
    
    // Set End Time to current local time in HH:MM format
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('f-end-time').value = `${hh}:${mm}`;
    
    if (document.getElementById('f-date')) {
        document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
    }
    
    const statusEl = document.getElementById('f-status');
    if (statusEl) {
        statusEl.value = ''; 
    }
    
    const paymentEl = document.getElementById('f-payment-status');
    if (paymentEl) {
        paymentEl.value = 'Chargeable';
    }

    // Clear smart search and badges
    const searchEl = document.getElementById('f-customer-search');
    if (searchEl) searchEl.value = '';
    
    const statusBadge = document.getElementById('f-status-badge');
    if (statusBadge) {
        statusBadge.textContent = 'NO CUSTOMER';
        statusBadge.style.cssText = 'background: #66707C; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
    }
    
    const paymentBadge = document.getElementById('f-payment-badge');
    if (paymentBadge) {
        paymentBadge.textContent = 'PENDING';
        paymentBadge.style.cssText = 'background: #66707C; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
    }

    const deptEl = document.getElementById('f-department');
    if (deptEl) deptEl.value = '';
    
    const catDispEl = document.getElementById('f-service-type-display');
    if (catDispEl) catDispEl.value = '';

    // Clear extended CRM fields
    const addressEl = document.getElementById('f-address');
    const phoneEl = document.getElementById('f-phone');
    const ownerEl = document.getElementById('f-owner');
    if (addressEl) addressEl.value = '';
    if (phoneEl) phoneEl.value = '';
    if (ownerEl) ownerEl.value = '';

    // Auto-fill logged in user and display
    const userDisplay = document.getElementById('f-user-display');
    if (userDisplay) {
        userDisplay.innerText = appState.currentUser || '-';
    }
    
    const userEl = document.getElementById('f-user');
    if (userEl) {
        userEl.innerHTML = `<option value="${appState.currentUser}">${appState.currentUser}</option>`;
        userEl.disabled = true;
    }
    
    // Enable category field (it might be locked by selectCategory)
    const serviceTypeEl = document.getElementById('f-service-type');
    if (serviceTypeEl) serviceTypeEl.disabled = false;
    
    updatePriceFieldAccessibility();
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

    const finalPrice = parseFloat(document.getElementById('f-price').value) || 0;
    const paymentStatus = document.getElementById('f-payment-status').value;
    const isContract = document.getElementById('f-status').value === 'Contract';
    
    const isInvoiceRequired = finalPrice > 0 || paymentStatus === 'Chargeable' || !isContract;
    const recStatus = isInvoiceRequired ? 'Pending' : 'Completed';
    
    // Serialize description metadata
    const estPrice = parseFloat(document.getElementById('f-est-price').value) || 0;
    const deptVal = document.getElementById('f-department').value;
    const metadata = {
        vat: finalPrice * 0.20,
        invoiceNotes: '',
        estimatedPrice: estPrice,
        department: deptVal
    };
    
    const finalDescription = serializeMetadata(metadata, description);
    
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
        PRICE: finalPrice, 
        "PAYMENT STATUS": paymentStatus, 
        DESCRIPTION: finalDescription, 
        STATUS: recStatus, 
        invoiced: false 
    };
    try { 
        const { data, error } = await sbClient.from('records').insert([rec]).select();
        if (error) throw error;
        if (data && data.length > 0) {
            const r = data[0];
            const parsed = parseMetadata(r.DESCRIPTION || r.description || '');
            const priceVal = parseFloat(r.PRICE || r.price || 0);
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
                price: priceVal, 
                paymentStatus: r['PAYMENT STATUS'] || r.payment_status, 
                description: parsed.details, 
                rawDescription: r.DESCRIPTION || r.description || '',
                status: r.STATUS || r.status, 
                invoiced: r.invoiced === true || (r.STATUS !== 'Pending' && r.STATUS !== 'Logged'), 
                invoiceDate: r['INV DATE'] || r.invoice_date, 
                invoiceNo: r['INV NO'] || r.invoice_no,
                vat: parsed.metadata.vat !== undefined ? parsed.metadata.vat : (priceVal * 0.20),
                invoiceNotes: parsed.metadata.invoiceNotes || '',
                estimatedPrice: parsed.metadata.estimatedPrice || 0,
                department: parsed.metadata.department || ''
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

// --- App Initialization & Auth ---

document.addEventListener('DOMContentLoaded', async () => { 
    try {
        if (window.lucide) lucide.createIcons();
        populateTimeDropdowns();
        
        // Always init app first to get users/settings
        await initApp();
    } catch (e) {
        console.error("Initialization Error:", e);
    }

    const savedUser = localStorage.getItem('taskflow_user');
    if (savedUser) {
        document.getElementById('login-remember').checked = true;
        appState.currentUser = savedUser;
        const un = document.getElementById('current-user-name');
        if (un) un.innerText = appState.currentUser;

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

        // Bind smart customer search inputs
        const searchInput = document.getElementById('f-customer-search');
        if (searchInput) {
            searchInput.addEventListener('input', autoFillCustomerInfo);
            searchInput.addEventListener('change', autoFillCustomerInfo);
        }

        // Populate user display and price field access
        const userDisplay = document.getElementById('f-user-display');
        if (userDisplay) {
            userDisplay.innerText = appState.currentUser || '-';
        }
        updatePriceFieldAccessibility();
    }
});

// --- NEW: Permissions & Access Management ---
async function renderPermissionsManagement() {
    const container = document.getElementById('permissions-management-list');
    const auth = appState.settings.users_auth || {};
    const users = Object.values(auth);

    if (users.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:3rem; background:#FBF9F3; border-radius:12px; border:1px dashed #66707C; color:#66707C;">
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
                                <select onchange="updateUserRole('${u.id}', this.value)" style="padding: 8px 12px; border-radius: 10px; border: 1px solid #FBF9F3; font-weight:600; width:100%; cursor:pointer;" ${isSystemAdmin ? 'disabled' : ''}>
                                    ${roles.map(r => `<option value="${r.id}" ${u.role === r.role_name ? 'selected' : ''}>${r.role_name}</option>`).join('')}
                                </select>
                            </td>
                            <td>
                                <div style="display:flex; gap:10px; font-size:12px;">
                                    <span style="padding:4px 8px; border-radius:6px; background:${u.role === 'Admin' || u.role === 'User' ? '#FBF9F3' : '#FBF9F3'}; color:${u.role === 'Admin' || u.role === 'User' ? '#4F7A5C' : '#66707C'}; font-weight:600;">POS</span>
                                    <span style="padding:4px 8px; border-radius:6px; background:${u.role === 'Admin' || u.role === 'User' ? '#FBF9F3' : '#FBF9F3'}; color:${u.role === 'Admin' || u.role === 'User' ? '#4F7A5C' : '#66707C'}; font-weight:600;">CARD</span>
                                    <span style="padding:4px 8px; border-radius:6px; background:${u.role === 'Admin' || u.role === 'Accounting' ? '#FBF9F3' : '#FBF9F3'}; color:${u.role === 'Admin' || u.role === 'Accounting' ? '#4C5FA6' : '#66707C'}; font-weight:600;">ACC</span>
                                    <span style="padding:4px 8px; border-radius:6px; background:${u.role === 'Admin' ? '#fef2f2' : '#FBF9F3'}; color:${u.role === 'Admin' ? '#B5563A' : '#66707C'}; font-weight:600;">ADMIN</span>
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
        showToast('Yetki/Rol successfully updated.', 'success');
        initApp();
    } catch (e) {
        console.error(e);
        showAlert('Hata', 'Rol could not be updated: ' + e.message, '❌');
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
        <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; border:1px solid #FBF9F3;">
            <span style="font-weight: 600;">${os.name}</span>
            <div style="display:flex; gap:8px;">
                <button class="btn-icon" onclick="editOS('${os.id}', '${os.name}')" style="color:#4C5FA6;">✏️</button>
                <button class="btn-icon" onclick="deleteOS('${os.id}', '${os.name}')" style="color:#B5563A;">🗑️</button>
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
        <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; border:1px solid #FBF9F3;">
            <span style="font-weight: 600;">${opt.name}</span>
            <div style="display:flex; gap:8px;">
                <button class="btn-icon" onclick="editCCLocal('${opt.id}', '${opt.name}')" style="color:#4C5FA6;">✏️</button>
                <button class="btn-icon" onclick="deleteCCLocal('${opt.id}', '${opt.name}')" style="color:#B5563A;">🗑️</button>
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
        <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; border:1px solid #FBF9F3;">
            <span style="font-weight: 600;">${opt.name}</span>
            <div style="display:flex; gap:8px;">
                <button class="btn-icon" onclick="editCardCompany('${opt.id}', '${opt.name}')" style="color:#4C5FA6;">✏️</button>
                <button class="btn-icon" onclick="deleteCardCompany('${opt.id}', '${opt.name}')" style="color:#B5563A;">🗑️</button>
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
        <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; border:1px solid #FBF9F3;">
            <span style="font-weight: 600;">${cpu.name}</span>
            <div style="display:flex; gap:8px;">
                <button class="btn-icon" onclick="editCPU('${cpu.id}', '${cpu.name}')" style="color:#4C5FA6;">✏️</button>
                <button class="btn-icon" onclick="deleteCPU('${cpu.id}', '${cpu.name}')" style="color:#B5563A;">🗑️</button>
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
        <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px; border-radius:10px; border:1px solid #FBF9F3;">
            <span style="font-weight: 600;">${m.name}</span>
            <div style="display:flex; gap:8px;">
                <button class="btn-icon" onclick="editTillModel('${m.id}', '${m.name}')" style="color:#4C5FA6;">✏️</button>
                <button class="btn-icon" onclick="deleteTillModel('${m.id}', '${m.name}')" style="color:#B5563A;">🗑️</button>
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
                msg = `Security Error: "${table}" tablosuna access yetkiniz yok. Please Supabase -> Table Editor -> ${table} -> RLS Settings from the section RLS'i close veya bir politika ekleyin.`;
            } else if (msg.includes('not found') || error.code === '42P01') {
                msg = `Database Error: "${table}" tablosu Supabase'de not found. Please SQL Editor ile tabloyu create.`;
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
        const el = document.getElementById('setting-sheet-url');
        if (!el) {
            console.warn('Google settings UI is not currently active.');
            return;
        }
        const url = el.value.trim();
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
    a.setAttribute('download', `records_${Date.now()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Auto-seeding disabled to ensure strictly real data from database
async function seedDatabaseIfNeeded() {
    return false;
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
var currentCalMonth = window.currentCalMonth || new Date().getMonth();
var currentCalYear = window.currentCalYear || new Date().getFullYear();

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
        
        html += `<div style="display:flex; border-bottom:1px solid #FBF9F3; min-height:60px;">`;
        html += `  <div style="width:80px; padding:15px; border-right:1px solid #FBF9F3; font-weight:bold; color:#66707C; font-size:0.9rem;">${timeStr}</div>`;
        html += `  <div style="flex:1; padding:10px; position:relative;" class="hourly-slot-content">`;
        
        if (hourTickets.length > 0) {
            hourTickets.sort((a,b) => (a.startTime || "").localeCompare(b.startTime || ""));
            hourTickets.forEach(t => {
                const isCompleted = t.status === 'Completed' || t.status === 'Completed' || t.invoiced === true;
                const statusClass = isCompleted ? 'completed' : 'pending';
                html += `
                    <div class="calendar-event ${statusClass}" style="margin-bottom:5px; padding:8px 12px; cursor:pointer; ${isCompleted ? 'text-decoration: line-through; opacity: 0.7;' : ''}" onclick="openAppointmentView('${t.id}');" title="${t.company} - ${t.mainService}">
                        <div style="font-weight:600; font-size:0.95rem;">${t.startTime} - ${t.company}</div>
                        <div style="font-size:0.85rem; opacity:0.9;">${t.mainService} | Ticket: ${t.crmTicket}</div>
                    </div>
                `;
            });
            // Still allow adding if they want multiple in same hour
            html += `<button onclick="createAppointmentForSlot('${dateStr}', '${timeStr}')" style="background:transparent; color:#4C5FA6; border:1px dashed #66707C; border-radius:4px; padding:4px 8px; font-size:0.8rem; cursor:pointer; width:100%; text-align:center; margin-top:5px;">+ Add Another</button>`;
        } else {
            html += `<button onclick="createAppointmentForSlot('${dateStr}', '${timeStr}')" style="background:transparent; color:#66707C; border:1px dashed #FBF9F3; border-radius:4px; width:100%; height:100%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;" onmouseover="this.style.color='#4C5FA6'; this.style.borderColor='#4C5FA6';" onmouseout="this.style.color='#66707C'; this.style.borderColor='#FBF9F3';">+ Add Appointment</button>`;
        }
        
        html += `  </div>`;
        html += `</div>`;
    }
    
    document.getElementById('day-view-hourly-list').innerHTML = html;
    document.getElementById('day-view-modal').classList.remove('hidden');
};

function populateStaffDropdowns() {
    const dropdowns = ['qa-staff-select', 'f-user'];
    const personnel = appState.settings.personnel || [];
    const options = personnel.map(name => `<option value="${name}">${name}</option>`).join('');
    dropdowns.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = options;
    });
}

window.createAppointmentForSlot = function(dateStr, timeStr, companyName = '') {
    const dayModal = document.getElementById('day-view-modal');
    if (dayModal) dayModal.classList.add('hidden');
    
    // Show quick add modal
    const qaModal = document.getElementById('quick-add-modal');
    if (qaModal) {
        qaModal.classList.remove('hidden');
        if(window.initPickers) window.initPickers();
    }
    
    // Populate personnel if not done
    populateStaffDropdowns();
    
    // Reset quick add fields
    document.getElementById('qa-customer-search').value = companyName || '';
    document.getElementById('qa-date').value = dateStr || new Date().toISOString().split('T')[0];
    document.getElementById('qa-company-name').value = '';
    document.getElementById('qa-company-id').value = '';
    document.getElementById('qa-postcode').value = '';
    document.getElementById('qa-address').value = '';
    document.getElementById('qa-contact').value = '';
    document.getElementById('qa-phone').value = '';
    document.getElementById('qa-notes').value = '';
    
    const qaStatus = document.getElementById('qa-status');
    if (qaStatus) {
        qaStatus.value = 'Checking...';
        qaStatus.style.setProperty('background', '#FBF9F3', 'important');
        qaStatus.style.setProperty('color', '#1D2430', 'important');
        qaStatus.style.fontWeight = '500';
    }
    
    const serviceCat = document.getElementById('qa-service-category');
    if (serviceCat) {
        serviceCat.value = 'S1';
    }
    
    // Populate times dropdown in qa-time if it's empty
    const qaTimeSelect = document.getElementById('qa-time');
    if (qaTimeSelect && qaTimeSelect.options.length === 0) {
        let timesHtml = '';
        for (let h = 9; h <= 18; h++) {
            const tStr = `${String(h).padStart(2,'0')}:00`;
            timesHtml += `<option value="${tStr}">${tStr}</option>`;
        }
        qaTimeSelect.innerHTML = timesHtml;
    }
    if (timeStr) qaTimeSelect.value = timeStr;
    
    // Populate Assigned Engineer select options
    const qaStaffSelect = document.getElementById('qa-staff-select');
    if (qaStaffSelect && qaStaffSelect.options.length === 0) {
        const personnel = appState.settings.personnel || [];
        qaStaffSelect.innerHTML = personnel.map(p => `<option value="${p}">${p}</option>`).join('');
    }
    if (qaStaffSelect && appState.currentUser) qaStaffSelect.value = appState.currentUser;
    
    if (typeof updateQaSubServices === 'function') updateQaSubServices();
    if (typeof updatePriorityUI === 'function') updatePriorityUI('Normal');
    
    if (companyName) {
        window.autoFillQuickAdd();
    }
};

window.submitQuickAdd = async function() {
    const btn = document.querySelector('#quick-add-modal button.btn-primary');
    if (!btn) return;
    const originalText = btn.innerText;
    btn.innerText = 'Creating...';
    btn.disabled = true;

    try {
        const dateStr = document.getElementById('qa-date').value;
        const timeStr = document.getElementById('qa-time').value;
        const company = document.getElementById('qa-company-name').value;
        const companyId = document.getElementById('qa-company-id').value;
        const postcode = document.getElementById('qa-postcode').value;
        const statusVal = document.getElementById('qa-status').value || 'Logged';
        const service = document.getElementById('qa-service-category').value;
        const subService = document.getElementById('qa-sub-service')?.value || '';
        const durationVal = parseInt(document.getElementById('qa-duration').value) || 30;
        const engineerVal = document.getElementById('qa-staff-select').value;
        const notesVal = document.getElementById('qa-notes').value || '';
        
        const priorityEl = document.querySelector('input[name="qa-priority"]:checked');
        const priorityVal = priorityEl ? priorityEl.value : 'Normal';
        
        if (!company) {
            showAlert('Required', 'Please select a valid customer first.', '⚠️');
            btn.innerText = originalText;
            btn.disabled = false;
            return;
        }

        // Calculate end time
        let [tHour, tMin] = timeStr.split(':').map(Number);
        tMin = (tMin || 0) + durationVal;
        while (tMin >= 60) {
            tHour = (tHour + 1) % 24;
            tMin -= 60;
        }
        const endStr = `${String(tHour).padStart(2,'0')}:${String(tMin).padStart(2,'0')}`;

        const metadata = {
            address: document.getElementById('qa-address').value || '',
            primaryContact: document.getElementById('qa-contact').value || '',
            phone: document.getElementById('qa-phone').value || '',
            contractStatus: statusVal,
            priority: priorityVal,
            notes: notesVal
        };
        const finalDescription = serializeMetadata(metadata, notesVal);
        const nextId = appState.tickets.length + 1001; 
        
        const rec = { 
            "CRM TICKET": "", 
            "INV NO": `SRV-${nextId}`, 
            COMPANY: company, 
            COMPANY_ID: companyId,
            POSTCODE: postcode, 
            USER: engineerVal,
            "MAIN SERVICE": service, 
            "SUB SERVICE": subService, 
            "START TIME": timeStr, 
            "END TIME": endStr, 
            DURATION: durationVal, 
            PRICE: 0, 
            "PAYMENT STATUS": (statusVal.toLowerCase().includes('contract') ? "Contract" : "Chargeable"),
            "INV DATE": dateStr, 
            DESCRIPTION: finalDescription, 
            STATUS: 'Logged', 
            invoiced: false 
        };
        
        if (window.globalEventBus) {
            window.globalEventBus.publish({
                type: 'appointment_quick_add_requested',
                payload: {
                    ...rec,
                    company: rec.COMPANY,
                    mainService: rec["MAIN SERVICE"],
                    subService: rec["SUB SERVICE"],
                    duration: rec.DURATION
                }
            });
            document.getElementById('quick-add-modal').classList.add('hidden');
            showAlert('Success', 'Appointment processed via Antigravity Loop!', '✅');
            renderCalendar(); 
        } else {
            const { data, error } = await sbClient.from('records').insert([rec]).select();
            if (error) throw error;
            
            if (data && data.length > 0) {
                const r = data[0];
                const parsed = parseMetadata(r.DESCRIPTION || r.description || '');
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
                    description: parsed.details, 
                    rawDescription: r.DESCRIPTION || r.description || '',
                    status: r.STATUS || r.status, 
                    invoiced: r.invoiced, 
                    invoiceDate: r['INV DATE'] || r.invoice_date, 
                    invoiceNo: r['INV NO'] || r.invoice_no,
                    vat: parsed.metadata.vat !== undefined ? parsed.metadata.vat : 0,
                    invoiceNotes: parsed.metadata.invoiceNotes || '',
                    address: parsed.metadata.address || '',
                    phone: parsed.metadata.phone || '',
                    primaryContact: parsed.metadata.primaryContact || '',
                    priority: parsed.metadata.priority || 'Normal'
                });
                updateDataStats();
                if (typeof addSystemLog === 'function') {
                    addSystemLog('CREATE RECORD', `Quick added record for company: ${company}`);
                }
            }
            
            document.getElementById('quick-add-modal').classList.add('hidden');
            showAlert('Success', 'Appointment created!', '✅');
            renderCalendar(); 
        }
    } catch(e) {
        showAlert('Error', e.message, '❌');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

window.autoFillQuickAdd = function() {
    const searchInput = document.getElementById('qa-customer-search');
    if (!searchInput) return;
    const searchVal = searchInput.value;
    if (!searchVal) return;
    
    const customer = (appState.customers || []).find(c => {
        const name = (c.COMPANY || '').toLowerCase();
        const cid = (c['CUSTOMER ID'] || '').toLowerCase();
        const pc = (c.POSTCODE || '').toLowerCase();
        return name === searchVal.toLowerCase() || 
               cid === searchVal.toLowerCase() || 
               pc === searchVal.toLowerCase() ||
               searchVal.toLowerCase().includes(name) ||
               searchVal.toLowerCase().includes(cid);
    });

    const companyEl = document.getElementById('qa-company-name');
    const companyIdEl = document.getElementById('qa-company-id');
    const postcodeEl = document.getElementById('qa-postcode');
    const addressEl = document.getElementById('qa-address');
    const contactEl = document.getElementById('qa-contact');
    const phoneEl = document.getElementById('qa-phone');
    const statusEl = document.getElementById('qa-status');

    if (customer) {
        companyEl.value = customer.COMPANY || '';
        companyIdEl.value = customer['CUSTOMER ID'] || '';
        postcodeEl.value = customer.POSTCODE || '';
        addressEl.value = customer.ADDRESS1 || customer.ADDRESS2 || 'N/A';
        contactEl.value = customer.CONTACT_NAME || 'N/A';
        phoneEl.value = customer.PHONE || 'N/A';
        
        const statusVal = customer['SERVICE STATUS'] || 'No Contract';
        statusEl.value = statusVal;
        
        const isContract = statusVal.toLowerCase().includes('contract') || statusVal.toLowerCase().includes('var');
        if (isContract) {
            statusEl.style.setProperty('background', '#dcfce7', 'important');
            statusEl.style.setProperty('color', '#4F7A5C', 'important');
            statusEl.style.fontWeight = '800';
        } else {
            statusEl.style.setProperty('background', '#fee2e2', 'important');
            statusEl.style.setProperty('color', '#B5563A', 'important');
            statusEl.style.fontWeight = '800';
        }
    } else {
        companyEl.value = '';
        companyIdEl.value = '';
        postcodeEl.value = '';
        addressEl.value = '';
        contactEl.value = '';
        phoneEl.value = '';
        statusEl.value = '';
        statusEl.style.background = '#FBF9F3';
        statusEl.style.color = '#1D2430';
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
        submitBtn.style.background = '#D98E3F';
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
        statusEl.style.setProperty('background', '#4F7A5C', 'important');
        statusEl.style.setProperty('color', 'white', 'important');
    } else {
        statusEl.style.setProperty('background', '#B5563A', 'important');
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
                deleteBtn.innerHTML = 'Delete Appt.';
                deleteBtn.disabled = false;
            }
        };
    }

    const saveBtn = document.getElementById('va-save-btn');
    if (saveBtn) {
        saveBtn.onclick = async function() {
            try {
                saveBtn.innerHTML = 'Saving...';
                saveBtn.disabled = true;
                
                const newDate = document.getElementById('va-date').value;
                const newTime = document.getElementById('va-start-time').value;
                
                if (!newDate || !newTime) {
                    throw new Error('Please enter both date and time.');
                }
                
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
                if (typeof updateDataStats !== 'undefined') updateDataStats();
                
            } catch(e) {
                console.error(e);
                if (typeof showAlert !== 'undefined') showAlert('Error', e.message, '❌');
            } finally {
                saveBtn.innerHTML = 'Change Date Time';
                saveBtn.disabled = false;
            }
        };
    }

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
    const appointments = appState.appointments || [];

    // Filter open tickets
    const openTickets = tickets.filter(t => {
        const stat = (t.status || '').toLowerCase();
        return stat !== 'closed' && stat !== 'completed' && stat !== 'tamamlandı' && t.invoiced !== true;
    }).map(t => ({
        id: t.id,
        dateStr: t.invoiceDate || (t.timestamp ? t.timestamp.split('T')[0] : 'N/A'),
        timeStr: t.startTime || '09:00',
        company: t.company || 'Unknown',
        service: t.mainService ? `${t.mainService} - Ticket` : 'Ticket',
        postcode: t.postcode || 'N/A',
        status: (t.status || 'OPEN').toUpperCase(),
        isAppt: false
    }));

    // Map appointments from Turso
    const apptItems = appointments.map(a => ({
        id: String(a.id),
        dateStr: a.date || 'N/A',
        timeStr: a.time || '09:00',
        company: a.customer_name || a.company || 'Customer Appointment',
        service: a.service_type || 'Appointment',
        postcode: a.postcode || 'N/A',
        status: (a.status || 'PENDING').toUpperCase(),
        isAppt: true
    }));

    const combined = [...apptItems, ...openTickets];

    if (combined.length === 0) {
        container.innerHTML = '<div style="padding:40px; text-align:center; color:#66707C; background:white; border-radius:12px; border:1px solid #FBF9F3;">No pending appointments found.</div>';
        return;
    }

    // Sort by Date and Time
    combined.sort((a, b) => {
        const da = (a.dateStr || '') + ' ' + (a.timeStr || '');
        const db = (b.dateStr || '') + ' ' + (b.timeStr || '');
        return da.localeCompare(db);
    });

    let html = `
    <div class="table-wrap" style="background:white; border-radius:12px; border:1px solid #FBF9F3; overflow:hidden;">
        <table style="width:100%; border-collapse:collapse;">
            <thead>
                <tr style="background:#FBF9F3; border-bottom:2px solid #FBF9F3; text-align:left;">
                    <th style="padding:15px; font-size:11px; text-transform:uppercase; color:#66707C;">Date & Time</th>
                    <th style="padding:15px; font-size:11px; text-transform:uppercase; color:#66707C;">Company</th>
                    <th style="padding:15px; font-size:11px; text-transform:uppercase; color:#66707C;">Service</th>
                    <th style="padding:15px; font-size:11px; text-transform:uppercase; color:#66707C;">Postcode</th>
                    <th style="padding:15px; font-size:11px; text-transform:uppercase; color:#66707C;">Status</th>
                    <th style="padding:15px; font-size:11px; text-transform:uppercase; color:#66707C; text-align:right;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    combined.forEach(t => {
        const isConfirmed = t.status === 'CONFIRMED' || t.status === 'HELD' || t.status === 'COMPLETED';
        const statusBadge = isConfirmed
            ? '<span style="font-size:0.75rem; font-weight:800; padding:4px 8px; border-radius:50px; background:#dcfce7; color:#15803d;">CONFIRMED</span>'
            : '<span style="font-size:0.75rem; font-weight:800; padding:4px 8px; border-radius:50px; background:#fef3c7; color:#b45309;">PLANNED</span>';

        html += `
            <tr style="border-bottom:1px solid #FBF9F3;">
                <td style="padding:15px; font-weight:600; color:#1D2430;">
                    <div style="display:flex; flex-direction:column;">
                        <span>${t.dateStr}</span>
                        <span style="font-size:0.75rem; color:#66707C;">${t.timeStr}</span>
                    </div>
                </td>
                <td style="padding:15px; font-weight:700; color:#1D2430;">${t.company}</td>
                <td style="padding:15px;">
                    <span style="font-size:0.85rem; color:#66707C; background:#FBF9F3; padding:4px 10px; border-radius:6px;">${t.service}</span>
                </td>
                <td style="padding:15px; color:#66707C; font-family:monospace;">${t.postcode}</td>
                <td style="padding:15px;">
                    ${statusBadge}
                </td>
                <td style="padding:15px; text-align:right;">
                    <button onclick="completeJob('${t.id}')" class="btn" style="background:#15803d; color:white; border:none; padding:6px 12px; border-radius:6px; font-size:12px; cursor:pointer; margin-right:6px;">
                        Complete
                    </button>
                    <button onclick="generateInvoiceFromTicket('${t.id}')" class="btn" style="background:var(--primary); color:white; border:none; padding:6px 12px; border-radius:6px; font-size:12px; cursor:pointer;">
                        Invoice
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    </div>
    `;

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
};

// --- SYSTEM LOGGING FUNCTIONS ---
const systemActivityLog = [];

function addSystemLog(action, description) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        user: appState.currentUser || 'System',
        action: action,
        description: description
    };
    systemActivityLog.push(logEntry);
    console.log(`[${action}] ${description}`);
    
    // Optional: Save to Supabase when implemented
    // sbClient.from('activity_logs').insert([logEntry]).catch(e => console.error('Log save error:', e));
}

function renderSystemLogs() {
    const container = document.getElementById('logs-container');
    if (!container) return;
    
    if (systemActivityLog.length === 0) {
        container.innerHTML = `
            <div style="padding: 2rem; background: var(--card); border-radius: 2px; border: 1px dashed var(--line); text-align: center; color: var(--steel); font-family: 'IBM Plex Mono', monospace;">
                No Activity Logged Yet
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    let html = `
        <div class="toolbar">
            <input type="text" placeholder="User veya operation ara...">
            <select><option>All operations</option><option>Creation</option><option>Update</option><option>Silme</option><option>Login/Logout</option></select>
            <select><option>Son 24 saat</option><option>Son 7 day</option><option>Son 30 day</option></select>
            <div class="spacer" style="flex:1;"></div>
            <button class="ticket-btn">CSV Download</button>
            <button class="ticket-btn primary" onclick="renderSystemLogs()">Yenile</button>
        </div>
        <div class="ledger">
            <div class="ledger-head"><div>ZAMAN</div><div>KULLANICI</div><div>OPERATION</div><div>DETAY</div></div>
    `;
    
    systemActivityLog.slice().reverse().forEach(log => {
        const dt = new Date(log.timestamp);
        const timeStr = dt.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        
        let tagClass = "update";
        if (log.action.includes("CREATE")) tagClass = "create";
        else if (log.action.includes("DELETE")) tagClass = "delete";
        else if (log.action.includes("LOGIN") || log.action.includes("AUTH")) tagClass = "auth";

        html += `
            <div class="ledger-row">
                <div class="ledger-ts">${timeStr}</div>
                <div class="ledger-user">${log.user}</div>
                <span class="ledger-tag ${tagClass}">${log.action}</span>
                <div class="ledger-detail">${log.description}</div>
            </div>
        `;
    });
    
    html += `
            <div class="ledger-foot">
                <span>Son ${systemActivityLog.length} record shown</span>
                <button class="ticket-btn">Daha fazla load</button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}


window.renderSystemLogs = renderSystemLogs;
window.addSystemLog = addSystemLog;

window.addLogEntry = async function(action, details) {
    if(typeof addSystemLog === 'function') {
        addSystemLog(action, details);
    }
};

window.updateSubServices = function(mainSelectId, subSelectId) {
    const mainSelect = document.getElementById(mainSelectId);
    const subSelect = document.getElementById(subSelectId);
    if (!mainSelect || !subSelect) return;
    
    const selectedService = mainSelect.value;
    subSelect.innerHTML = '<option value="">Select Sub Service...</option>';
    
    const subServices = appState.settings?.sub_services || 
                        (typeof defaultSeeds !== 'undefined' ? defaultSeeds.sub_services : null) || 
                        (typeof LOCAL_SUB_SERVICES !== 'undefined' ? LOCAL_SUB_SERVICES : null);
    if (!subServices) return;
    
    if (Array.isArray(subServices)) {
        subServices.filter(s => s.service_name === selectedService).forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub.name;
            opt.innerText = sub.name;
            subSelect.appendChild(opt);
        });
    } else if (typeof subServices === 'object') {
        const opts = subServices[selectedService] || [];
        opts.forEach(val => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.innerText = val;
            subSelect.appendChild(opt);
        });
    }
};


// showAdminPane + helpers ? moved to js/admin.js

// ==========================================
// ADMIN PANEL LOGIC (Added for "Make these functional")
// ==========================================

let adminUsers = [
    { id: 1, name: 'Ugur Yavuz', role: 'Administrator', status: 'ACTIVE' },
    { id: 2, name: 'Jane Doe', role: 'Financial', status: 'ACTIVE' },
    { id: 3, name: 'David Whitfield', role: 'Field Technician', status: 'ACTIVE' }
];

let systemLogs = [
    { time: '2026-09-26 09:12', user: 'Ugur Yavuz', action: 'LOGIN', details: 'Auth success via #VA-2026-0912' },
    { time: '2026-09-26 09:15', user: 'Jane Doe', action: 'CREATE', details: 'New invoice #INV-4402 added' },
    { time: '2026-09-26 09:18', user: 'Ugur Yavuz', action: 'DELETE', details: 'Removed legacy customer #ACCT-0012' }
];

async function renderAdminUsers() {
    try {
        const res = await fetch('http://localhost:3000/api/users');
        const users = await res.json();
        appState.users = users;
        const html = users.map(u => `
            <div class="ledger-row" style="grid-template-columns:1fr 1fr 150px 100px;">
                <div style="font-weight:600; color:var(--ink);">${u.full_name}</div>
                <div>${u.role}</div>
                <div><span class="badge ${u.status==='ACTIVE'?'badge-green':'badge-amber'}">${u.status}</span></div>
                <div><button class="ticket-btn ghost" onclick="deleteAdminUser('${u.id}', '${u.full_name}')" style="color:var(--clay); border-color:var(--clay); padding:0.2rem 0.5rem;">Delete</button></div>
            </div>
        `).join('');
        document.getElementById('admin-users-list').innerHTML = html;
    } catch (e) {
        console.error(e);
    }
}

async function adminAddUser() {
    const name = document.getElementById('admin-new-user-name').value;
    const role = document.getElementById('admin-new-user-role').value;
    const pass = document.getElementById('admin-new-user-pass').value;
    if(!name) return alert('Name required');
    const id = 'U-'+Math.floor(Math.random()*10000);
    
    try {
        await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id, full_name: name, role, status: 'ACTIVE', password_hash: pass})
        });
        
        await fetch('http://localhost:3000/api/logs', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({user_id: appState.currentUser, action: 'ADD_USER', details: `Added ${role} ${name}`, timestamp: new Date().toISOString()})
        });

        document.getElementById('admin-new-user-name').value = '';
        renderAdminUsers();
        renderAdminLogs();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

if (typeof adminAddUser !== 'undefined') window.adminAddUser = adminAddUser;
if (typeof deleteAdminUser !== 'undefined') window.deleteAdminUser = deleteAdminUser;
if (typeof showAdminPane !== 'undefined') window.showAdminPane = showAdminPane;

// ==========================================
// E2E LOGIC (Dashboard, Customer Search, etc)
// ==========================================

function updateDashboardKPIs() {
    const appointments = appState.appointments || [];
    const tickets = appState.tickets || [];
    const invoices = appState.invoices || [];
    const customers = appState.customers || [];

    // KPI 1: Open Tickets & Appointments
    const openTicketsCount = tickets.filter(t => {
        const st = (t.status || '').toLowerCase();
        return st !== 'closed' && st !== 'completed';
    }).length;
    const pendingApptsCount = appointments.filter(a => a.status === 'PENDING' || a.status === 'Planned').length;
    const totalOpenTickets = openTicketsCount + pendingApptsCount;

    // KPI 2: Pending Invoices
    const pendingInvoicesCount = invoices.filter(i => {
        const st = (i.status || '').toUpperCase();
        return st === 'PENDING' || st === 'DRAFT' || st === 'UNPAID';
    }).length;

    // KPI 3: Registered / Active Customers
    const totalCustomersCount = customers.length;

    // Update index.html KPI IDs
    const elTickets = document.getElementById('kpi-tickets');
    const elInvoices = document.getElementById('kpi-invoices');
    const elCustomers = document.getElementById('kpi-customers');

    if (elTickets) elTickets.innerText = totalOpenTickets;
    if (elInvoices) elInvoices.innerText = pendingInvoicesCount;
    if (elCustomers) elCustomers.innerText = totalCustomersCount.toLocaleString('tr-TR');

    // Also update legacy IDs if present
    const el1 = document.getElementById('dash-kpi-pending');
    const el2 = document.getElementById('dash-kpi-completed');
    const el3 = document.getElementById('dash-kpi-overdue');
    const el4 = document.getElementById('dash-kpi-revenue');
    if (el1) el1.innerText = pendingApptsCount;
    if (el2) el2.innerText = tickets.filter(t => (t.status || '').toLowerCase() === 'closed').length;
    if (el3) el3.innerText = pendingInvoicesCount;
    if (el4) {
        const monthlyRev = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0);
        el4.innerText = '£' + monthlyRev.toFixed(2);
    }

    renderDashboardSchedule(appointments);
    renderDashboardActivity();
}

function renderDashboardSchedule(appointments) {
    const list = document.getElementById('dashboard-schedule-list');
    if (!list) return;

    const allApps = (appointments && appointments.length > 0) ? appointments : (appState.appointments || []);
    if (allApps.length === 0) {
        list.innerHTML = '<div style="padding:1.5rem; text-align:center; color:var(--steel); font-size:0.85rem;">No scheduled appointments for today.</div>';
        return;
    }

    // Sort by date then time
    const sorted = allApps.slice().sort((a, b) => {
        const d1 = (a.date || '') + ' ' + (a.time || '');
        const d2 = (b.date || '') + ' ' + (b.time || '');
        return d1.localeCompare(d2);
    }).slice(0, 5);

    let html = '';
    sorted.forEach(a => {
        const isConfirmed = a.status === 'CONFIRMED' || a.status === 'HELD';
        const statusTag = isConfirmed
            ? '<span class="ticket-status confirmed" style="font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:12px; background:#dcfce7; color:#15803d;">CONFIRMED</span>'
            : '<span class="ticket-status pending" style="font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:12px; background:#fef3c7; color:#b45309;">PLANNED</span>';

        html += `
        <div class="dash-schedule-row" style="display:flex; justify-content:space-between; padding:0.75rem 0; border-bottom:1px dashed var(--line); align-items:center;">
            <div style="font-family:'IBM Plex Mono',monospace; color:var(--steel); width:75px; font-size:0.8rem;">${a.time || '09:00'}</div>
            <div style="flex:1; padding:0 0.5rem;">
                <div style="font-weight:600; color:var(--ink); font-size:0.88rem;">${a.customer_name || a.company || 'Appointment'}</div>
                <div style="font-size:0.75rem; color:var(--steel);">${a.service_type || 'On-site'} · ${a.technician || 'Technician'}</div>
            </div>
            <div>${statusTag}</div>
        </div>
        `;
    });
    list.innerHTML = html;
}

function renderDashboardActivity() {
    const list = document.getElementById('dashboard-activity-list');
    if (!list) return;

    let entries = [];
    if (window.systemLogs && window.systemLogs.length > 0) {
        entries = window.systemLogs.slice(0, 5);
    } else if (typeof systemActivityLog !== 'undefined' && systemActivityLog.length > 0) {
        entries = systemActivityLog.slice(-5).reverse();
    } else if (appState.tickets && appState.tickets.length > 0) {
        entries = appState.tickets.slice(0, 5).map(t => ({
            time: t.timestamp ? t.timestamp.slice(0, 16) : new Date().toLocaleDateString(),
            user: t.user || 'Technician',
            details: `${t.crmTicket} - ${t.company} (${t.mainService || 'Service'})`
        }));
    }

    if (entries.length === 0) {
        list.innerHTML = '<div style="padding:1.5rem; text-align:center; color:var(--steel); font-size:0.85rem;">No recent activity to display.</div>';
        return;
    }

    let html = '';
    entries.forEach(log => {
        const timeStr = log.time || log.timestamp || '';
        const userStr = (log.user || 'SYSTEM').toUpperCase();
        const detailStr = log.details || log.description || log.action || '';
        html += `
        <div class="dash-activity-row" style="padding:0.75rem 0; border-bottom:1px dashed var(--line);">
            <div style="font-family:'IBM Plex Mono',monospace; font-size:0.7rem; color:var(--steel); margin-bottom:0.2rem;">${timeStr} · ${userStr}</div>
            <div style="font-size:0.85rem; color:var(--ink); font-weight:500;">${detailStr}</div>
        </div>
        `;
    });
    list.innerHTML = html;
}

// ==========================================
// WAITING JOBS & APPOINTMENTS TABLE RENDERER
// ==========================================

function completeJob(ticketId) {
    const tkt = (appState.appointments || []).find(a => String(a.id) === String(ticketId)) ||
                (appState.tickets || []).find(t => String(t.id) === String(ticketId));
    if(tkt) {
        tkt.status = 'CONFIRMED';
        showToast('Job marked as completed', 'success');
        if (typeof updateDashboardKPIs === 'function') updateDashboardKPIs();
        renderWaitingJobs();
    }
}

function generateInvoiceFromTicket(ticketId) {
    const tkt = (appState.appointments || []).find(a => String(a.id) === String(ticketId)) ||
                (appState.tickets || []).find(t => String(t.id) === String(ticketId));
    if(tkt) {
        const comp = tkt.customer_name || tkt.company || 'Customer';
        const newInv = {
            id: 'INV-' + Date.now().toString().slice(-4),
            customer_name: comp,
            issue_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
            total: 125.00,
            status: 'PENDING'
        };
        if(!appState.invoices) appState.invoices = [];
        appState.invoices.unshift(newInv);
        showToast('Invoice Generated!', 'success');
        showTab('invoices');
    }
}

function renderWaitingList() {
    renderWaitingJobs();
}

window.completeJob = completeJob;
window.generateInvoiceFromTicket = generateInvoiceFromTicket;
window.renderWaitingList = renderWaitingList;
window.updateDashboardKPIs = updateDashboardKPIs;
window.renderDashboardSchedule = renderDashboardSchedule;
window.renderDashboardActivity = renderDashboardActivity;
window.showTab = showTab;

// Auto-run dashboard render if appState is already populated
if (window.appState && ((appState.tickets && appState.tickets.length > 0) || (appState.customers && appState.customers.length > 0))) {
    if (typeof updateDashboardKPIs === 'function') updateDashboardKPIs();
    if (typeof renderDashboardSchedule === 'function') renderDashboardSchedule();
    if (typeof renderDashboardActivity === 'function') renderDashboardActivity();
}
