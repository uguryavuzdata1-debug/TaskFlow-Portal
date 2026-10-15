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

// --- Epoch Time Helper (Latest Records First) ---
function toEpoch(ts) {
    if (!ts) return 0;
    if (typeof ts === 'number') return ts;
    const str = String(ts).trim();
    const normalized = str.includes(' ') && !str.includes('T') ? str.replace(' ', 'T') : str;
    const d = new Date(normalized);
    const ms = d.getTime();
    return isNaN(ms) ? 0 : ms;
}
window.toEpoch = window.toEpoch || toEpoch;

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


// --- Navigation ---
function showTab(tabId) {
    appState.activeTab = tabId;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const section = document.getElementById(`section-${tabId}`);
    if (section) section.classList.add('active');
    const btn = document.getElementById(`btn-${tabId}`);
    if (btn) btn.classList.add('active');
    
    if (tabId === 'preferences' || tabId === 'settings') {
        if (typeof renderPreferencesPage === 'function') renderPreferencesPage();
    }
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

    if (tabId === 'logs') {
        renderSystemLogs();
    }

    if (tabId === 'stats') updateDataStats(); 
    if (tabId === 'users') {
        if (typeof renderPersonnelManagement === 'function') renderPersonnelManagement();
        if (typeof renderAdminUsersList === 'function') renderAdminUsersList();
    }
    if (tabId === 'permissions') renderPermissionsManagement();
    if (tabId === 'pricing') renderPricingSettings();
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
    if (tabId === 'calendar') renderCalendar();
    if (tabId === 'waiting' && typeof window.renderWaitingJobs !== 'undefined') window.renderWaitingJobs();
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

    // CRITICAL: Sort ALWAYS newest first (son kayıt her zaman en üstte)
    tickets.sort((a, b) => {
        const tA = window.toEpoch ? window.toEpoch(a.timestamp) : new Date(String(a.timestamp || '').replace(' ', 'T')).getTime();
        const tB = window.toEpoch ? window.toEpoch(b.timestamp) : new Date(String(b.timestamp || '').replace(' ', 'T')).getTime();
        const diff = (tB || 0) - (tA || 0);
        if (diff !== 0) return diff;
        return (parseInt(b.id) || 0) - (parseInt(a.id) || 0);
    });

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

        const ts = t.timestamp || '';
        const datePart = ts.includes('T') ? ts.split('T')[0] : (ts.includes(' ') ? ts.split(' ')[0] : ts);
        const rawTime = ts.includes('T') ? ts.split('T')[1] : (ts.includes(' ') ? ts.split(' ')[1] : '');
        const timePart = rawTime ? rawTime.slice(0, 8) : '';
        const priceStr = parseFloat(t.price || 0) > 0 ? '£' + parseFloat(t.price).toFixed(2) : '£0.00';

        html += `
        <div class="ledger-row" style="display:grid; grid-template-columns:120px 1.5fr 1fr 100px 100px 80px; align-items:center; padding:0.65rem 1rem; border-bottom:1px solid var(--line);">
            <div class="ledger-ts" style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel); line-height:1.25;">
                <div style="font-weight:600; color:var(--ink);">${datePart || 'N/A'}</div>
                ${timePart ? `<div style="font-size:0.68rem; color:#64748b;">${timePart}</div>` : ''}
            </div>
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

    let invoices = [...(appState.invoices || [])];

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

    // CRITICAL: Sort ALWAYS newest invoice first
    invoices.sort((a, b) => {
        const tA = window.toEpoch ? window.toEpoch(a.issue_date) : new Date(String(a.issue_date || '').replace(' ', 'T')).getTime();
        const tB = window.toEpoch ? window.toEpoch(b.issue_date) : new Date(String(b.issue_date || '').replace(' ', 'T')).getTime();
        const diff = (tB || 0) - (tA || 0);
        if (diff !== 0) return diff;
        return (parseInt(b.id) || 0) - (parseInt(a.id) || 0);
    });

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
        <div style="padding: 0.5rem; color: #111827; font-family: inherit;">
            <!-- Ticket Info (Read Only) -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <div class="grid-4" style="margin-bottom: 15px; gap: 1rem;">
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Staff (Created By)</label>
                        <div style="background: #f8fafc; color: #111827; font-weight: 600; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.user}</div>
                    </div>
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Database ID</label>
                        <div style="background: #f8fafc; color: #111827; font-weight: 600; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.dbId}</div>
                    </div>
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">CRM Ticket</label>
                        <div style="background: #f8fafc; color: #111827; font-weight: 600; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 10px; font-size: 13px; min-height: 38px; display: flex; align-items: center;">${r.crmTicket || 'N/A'}</div>
                        <input type="hidden" id="e-crm-ticket" value="${r.crmTicket || ''}">
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
            </div>

            <!-- Editable Fields -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem;">
                <p style="font-size: 12px; font-weight: 800; color: var(--primary); margin-bottom: 1.25rem; text-transform: uppercase; letter-spacing: 0.05em;">Invoice Billing Details (Editable)</p>
                <div class="grid-3" style="gap: 1rem; margin-bottom: 15px;">
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Invoice Reference</label>
                        <input type="text" id="e-inv-no" value="${r.invoiceNo || ''}" placeholder="Enter Inv No..." style="background: #ffffff; color: #111827; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600;">
                    </div>
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Service Date</label>
                        <input type="date" id="e-inv-date" value="${r.invoiceDate || new Date().toISOString().split('T')[0]}" style="background: #ffffff; color: #111827; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600;">
                    </div>
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Payment Status</label>
                        <select id="e-invoice-status" style="background: #ffffff url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%2364748b\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'%3e%3cpolyline points=\\'6 9 12 15 18 9\\'%3e%3c/polyline%3e%3c/svg%3e') no-repeat right 12px center; background-size: 14px; color: #111827; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600; cursor: pointer; -webkit-appearance: none; -moz-appearance: none; appearance: none; padding-right: 36px !important;">
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
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Final Price (£)</label>
                        <input type="number" id="e-price" value="${r.price}" step="0.01" style="background: #ffffff; color: var(--primary); border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 700;">
                    </div>
                    <div class="field">
                        <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">VAT (£)</label>
                        <input type="number" id="e-vat" value="${parseFloat(r.vat || 0).toFixed(2)}" step="0.01" style="background: #ffffff; color: #111827; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600;">
                    </div>
                </div>
                <div class="field" style="margin-bottom: 15px;">
                    <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Invoice Notes</label>
                    <input type="text" id="e-invoice-notes" value="${r.invoiceNotes || ''}" placeholder="Enter payment/VAT notes here..." style="background: #ffffff; color: #111827; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; outline: none; font-size: 13px; font-weight: 600;">
                </div>
                <div class="field" style="margin-bottom: 15px;">
                    <label style="color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Work Details</label>
                    <textarea id="e-description" rows="4" style="background: #ffffff; color: #334155; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 16px; outline: none; font-size: 13px; font-weight: 500;">${r.description || ''}</textarea>
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
        if (window.globalEventBus) {
            window.globalEventBus.publish({
                type: 'ticket_update_requested',
                payload: {
                    id: appState.editingRecordId,
                    updates: updates
                }
            });
            
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
        } else {
            await sbClient.from('records').update(updates).eq('id', appState.editingRecordId);

            // Log the edit
            if (typeof addSystemLog === 'function') {
                addSystemLog('EDIT RECORD', `Record ID: ${appState.editingRecordId}. New Price: £${newPrice}, Status: ${newStatus}`);
            }

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
        
        if (window.globalEventBus) {
            window.globalEventBus.publish({
                type: 'ticket_update_requested',
                payload: {
                    id: id,
                    updates: updates
                }
            });
            // Update local state optimistically
            r.invoiceNo = invNo.trim();
            r.invoiceDate = invDate;
            r.invoiced = true;
            
            renderInvoicesTable();
            renderDataTable();
            updateDataStats();
            
            showToast('Invoice saved successfully!', 'success');
        } else {
            await sbClient.from('records').update(updates).eq('id', id);
            
            r.invoiceNo = invNo.trim();
            r.invoiceDate = invDate;
            r.invoiced = true;
            
            renderInvoicesTable();
            renderDataTable();
            updateDataStats();
            
            showToast('Invoice saved successfully!', 'success');
        }
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

// Clean transition to updateAccount

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

        // Log the creation
        if (typeof addSystemLog === 'function') {
            addSystemLog('ADD USER', `Added new personnel: ${name} with role ${roleName}`);
        }

        nameInput.value = '';
        passInput.value = '';
        showAlert('Success', `${name} personnel added!`, '✅');
        initApp();
    } catch (e) { 
        console.error("Personnel Add Error:", e);
        let msg = e.message;
        if (msg.includes('row-level security') || e.code === '42501') {
            msg = `Security Error (RLS): You don't have permission to add personnel. Please check Turso DB.`;
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
        
        // Log the deletion
        if (typeof addSystemLog === 'function') {
            addSystemLog('DELETE USER', `Removed user: ${name}`);
        }

        showAlert('Success', `${name} has been removed.`, '✅');
        initApp();
    } catch (e) { showAlert('Error', e.message, '❌'); }
}

async function resetUserPassword(id, name) {
    const newPass = prompt(`Enter new password for ${name}:`);
    if (!newPass) return;

    try {
        // In a real app, you would use Turso Auth to reset password.
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
    const catMap = {
        'S1': 'MENU UPDATE',
        'S2': 'CREDIT CARD',
        'S3': 'DATA RESET',
        'S4': 'SERVICE',
        'S5': 'OTHER',
        'S6': 'TILL SETUP',
        'S8': 'SOFTWARING',
        'S9': 'HARDWARE'
    };
    if (el) {
        const exists = Array.from(el.options).some(opt => opt.value === cat);
        if (!exists) {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.text = catMap[cat] || cat;
            el.add(opt);
        }
        el.value = cat; 
        el.disabled = true; // Lock the category when coming from a tile
    }
    
    const deptEl = document.getElementById('f-department');
    if (deptEl) {
        deptEl.value = dept || catMap[cat] || '';
    }
    
    const catDispEl = document.getElementById('f-service-type-display');
    if (catDispEl) {
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
    const dept = (document.getElementById('f-department')?.value || '').toUpperCase();
    
    // Alt servisleri doldur (Departman duyarlı)
    const subDict = (typeof LOCAL_SUB_SERVICES !== 'undefined' && Object.keys(LOCAL_SUB_SERVICES).length > 0)
        ? LOCAL_SUB_SERVICES
        : (appState.settings?.sub_services || {});
    
    let subList = [];
    if (main === 'S6') {
        subList = subDict['S6'] || [
            "Full Till System Setup",
            "Clean OS Installation",
            "Disk Image Cloning",
            "OS Upgrade (Windows 10 -> 11 / LTSC)",
            "SSD / Storage Migration",
            "Table Plan & Screen Layout Design",
            "Peripherals / Printers Configuration",
            "Software Only Configuration",
            "Cas CN1",
            "Barcode Label Scale",
            "Other"
        ];
    } else if (main === 'S8') {
        subList = subDict['S8'] || [
            "HandHeld Restaurant",
            "HandHeld Retail",
            "Kiosk",
            "Online",
            "Tablet"
        ];
    } else if (main === 'S9') {
        subList = subDict['S9'] || [
            "Cas CN1",
            "Barcode Label Scale",
            "Other"
        ];
    } else {
        subList = subDict[main] || [];
    }
    
    const subSelect = document.getElementById('f-sub-service');
    if (subSelect) {
        subSelect.innerHTML = subList.map(o => `<option value="${o}">${o}</option>`).join('');
    }

    // Personel listesi
    const staffOptions = (appState.settings?.personnel && appState.settings.personnel.length > 0 
        ? appState.settings.personnel 
        : ['Admin', 'Technician']
    ).map(name => `<option value="${name}">${name}</option>`).join('');
    
    // Kart Firmaları
    const cardCoOptions = (appState.settings?.card_companies && appState.settings.card_companies.length > 0
        ? appState.settings.card_companies
        : [{name: 'Dojo'}, {name: 'Elavon'}, {name: 'PaymentSense'}, {name: 'WorldPay'}, {name: 'Barclaycard'}]
    ).map(c => `<option value="${c.name || c}">${c.name || c}</option>`).join('');

    // Till Modelleri & CPU
    const modelOptions = (appState.settings?.till_models && appState.settings.till_models.length > 0
        ? appState.settings.till_models
        : [{name: 'IKA S-300 RT3'}, {name: 'IKA S-150'}, {name: 'POSBANK'}, {name: 'AURES'}, {name: 'OTHER'}]
    ).map(m => `<option value="${m.name || m}">${m.name || m}</option>`).join('');

    const cpuOptions = (appState.settings?.till_cpu && appState.settings.till_cpu.length > 0
        ? appState.settings.till_cpu
        : [{name: 'J6412'}, {name: 'J1900'}, {name: 'I3'}, {name: 'I5'}, {name: 'N97'}]
    ).map(c => `<option value="${c.name || c}">${c.name || c}</option>`).join('');

    // Sektör listesi
    const sectorList = (typeof LOCAL_SECTORS !== 'undefined' && LOCAL_SECTORS.length > 0) ? LOCAL_SECTORS : ["HOSPITALITY", "RETAIL", "QUICK SERVICE", "OTHER"];
    const sectorOptions = sectorList.map(sec => `<option value="${sec}">${sec}</option>`).join('');

    let extra = '';

    // 1. MENU UPDATE (S1)
    if (main === 'S1') {
        extra = `
        <div style="background: #f0f7ff; padding: 20px; border-radius: 12px; border: 1px solid #bae0ff; margin-top: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #0958d9; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600;">
                <i data-lucide="file-text" style="width: 18px; height: 18px;"></i> Menu Update Details
            </h4>
            <div class="grid-2">
                <div class="field">
                    <label>Menu Type <span style="color:red">*</span></label>
                    <select id="f-s1-menu-type">
                        <option value="Food & Drink Menu">Food & Drink Menu</option>
                        <option value="Food Menu Only">Food Menu Only</option>
                        <option value="Drink Menu Only">Drink Menu Only</option>
                        <option value="Dessert Menu">Dessert Menu</option>
                        <option value="Set Menu">Set Menu</option>
                        <option value="Full New Menu Setup">Full New Menu Setup</option>
                    </select>
                </div>
                <div class="field">
                    <label>Menu Attachment / Cloud Link (Google Drive / PDF / Photo URL)</label>
                    <input type="url" id="f-s1-menu-link" placeholder="https://drive.google.com/... or dropbox link">
                </div>
            </div>
            <div style="background: #fff; padding: 12px 18px; border-radius: 8px; border: 1px dashed #91caff; margin-top: 15px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600; color: #1e293b;">
                    <input type="checkbox" id="f-s1-no-appointment" onchange="calculatePrice()" style="width: 18px; height: 18px; cursor: pointer;">
                    <span>⚡ Urgent / No Prior Appointment (+£25.00 Fast-Track Fee)</span>
                </label>
            </div>
        </div>`;
    }
    // 2. CREDIT CARD (S2)
    else if (main === 'S2') {
        extra = `
        <div style="background: #f6ffed; padding: 20px; border-radius: 12px; border: 1px solid #b7eb8f; margin-top: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #389e0d; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600;">
                <i data-lucide="credit-card" style="width: 18px; height: 18px;"></i> Payment & Terminal Details
            </h4>
            <div class="grid-3">
                <div class="field">
                    <label>Card Company / Provider <span style="color:red">*</span></label>
                    <select id="f-card-company">
                        <option value="">Select provider</option>
                        ${cardCoOptions}
                    </select>
                </div>
                <div class="field">
                    <label>Terminal Serial / TID No <span style="color:red">*</span></label>
                    <input type="text" id="f-setup-number" placeholder="e.g. SN-892183 / TID-1002">
                </div>
                <div class="field">
                    <label>IKA POS Integration Status <span style="color:red">*</span></label>
                    <select id="f-ika-app">
                        <option value="Yes - Fully Integrated">Yes - Fully Integrated</option>
                        <option value="No - Standalone Terminal">No - Standalone Terminal</option>
                    </select>
                </div>
            </div>
            <div class="grid-2" style="margin-top: 15px;">
                <div class="field">
                    <label>Sector</label>
                    <select id="f-s2-sector">${sectorOptions}</select>
                </div>
                <div class="field">
                    <label>Terminal Model / Notes</label>
                    <input type="text" id="f-s2-terminal-model" placeholder="Pax A920, Castles, etc.">
                </div>
            </div>
        </div>`;
    }
    // 3. DATA RESET (S3)
    else if (main === 'S3') {
        extra = `
        <div style="background: #fff2f0; padding: 20px; border-radius: 12px; border: 1px solid #ffccc7; margin-top: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #cf1322; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600;">
                <i data-lucide="refresh-cw" style="width: 18px; height: 18px;"></i> Database Reset & Security Authorisation
            </h4>
            <div class="grid-2">
                <div class="field">
                    <label>Reset Scope / Type <span style="color:red">*</span></label>
                    <select id="f-s3-reset-type">
                        <option value="Clear Daily Z-Reports Only">Clear Daily Z-Reports Only</option>
                        <option value="Delete Customer Sales History (Fresh Start)">Delete Customer Sales History (Fresh Start)</option>
                        <option value="Full Database Wipe / Factory Reset">Full Database Wipe / Factory Reset</option>
                    </select>
                </div>
                <div class="field">
                    <label>Authorising Manager / Customer Name <span style="color:red">*</span></label>
                    <input type="text" id="f-s3-authoriser" placeholder="Full name of person authorising reset">
                </div>
            </div>
            <div style="background: #fff; padding: 15px; border-radius: 8px; border: 1px dashed #ffa39e; margin-top: 15px; display: flex; flex-direction: column; gap: 10px;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600; color: #cf1322;">
                    <input type="checkbox" id="f-s3-written-consent" style="width: 18px; height: 18px; cursor: pointer;">
                    <span>⚠️ Written / Verbal Customer Consent Confirmed</span>
                </label>
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600; color: #1e293b;">
                    <input type="checkbox" id="f-s3-backup-taken" style="width: 18px; height: 18px; cursor: pointer;">
                    <span>💾 Pre-Reset Database Backup successfully archived to Cloud / USB</span>
                </label>
            </div>
        </div>`;
    }
    // 4. SERVICE (S4)
    else if (main === 'S4') {
        extra = `
        <div style="background: #fffbe6; padding: 20px; border-radius: 12px; border: 1px solid #ffe58f; margin-top: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #d46b08; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600;">
                <i data-lucide="wrench" style="width: 18px; height: 18px;"></i> Hardware / Technical Service Details
            </h4>
            <div class="grid-3">
                <div class="field">
                    <label>Hardware / Component Type <span style="color:red">*</span></label>
                    <select id="f-s4-hardware-type">
                        <option value="Thermal Receipt Printer">Thermal Receipt Printer</option>
                        <option value="Touchscreen Display / Till">Touchscreen Display / Till</option>
                        <option value="Cash Drawer">Cash Drawer</option>
                        <option value="Barcode Scanner">Barcode Scanner</option>
                        <option value="Network Router / Switch / Wi-Fi">Network Router / Switch / Wi-Fi</option>
                        <option value="Power Supply / Cables">Power Supply / Cables</option>
                        <option value="Other Component">Other Component</option>
                    </select>
                </div>
                <div class="field">
                    <label>Fault Classification <span style="color:red">*</span></label>
                    <select id="f-s4-fault-type">
                        <option value="Hardware Component Defect">Hardware Component Defect</option>
                        <option value="Physical Damage / Liquid Spill">Physical Damage / Liquid Spill</option>
                        <option value="Software / Driver Glitch">Software / Driver Glitch</option>
                        <option value="Connectivity / Cable Loss">Connectivity / Cable Loss</option>
                    </select>
                </div>
                <div class="field">
                    <label>Warranty Status <span style="color:red">*</span></label>
                    <select id="f-s4-warranty">
                        <option value="Under Warranty (Free Repair)">Under Warranty (Free Repair)</option>
                        <option value="Out of Warranty (Chargeable)">Out of Warranty (Chargeable)</option>
                        <option value="Inspection Only">Inspection Only</option>
                    </select>
                </div>
            </div>
            <div class="grid-2" style="margin-top: 15px;">
                <div class="field">
                    <label>Hardware Serial Number (S/N)</label>
                    <input type="text" id="f-s4-serial" placeholder="Serial no on device label">
                </div>
                <div class="field">
                    <label>Assigned Field Technician</label>
                    <select id="f-s4-technician">${staffOptions}</select>
                </div>
            </div>
        </div>`;
    }
    // 5. OTHER (S5)
    else if (main === 'S5') {
        extra = `
        <div style="background: #f9f0ff; padding: 20px; border-radius: 12px; border: 1px solid #d3adf7; margin-top: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #531dab; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600;">
                <i data-lucide="sparkles" style="width: 18px; height: 18px;"></i> Custom Ticket Routing & Priority
            </h4>
            <div class="grid-2">
                <div class="field">
                    <label>Request Channel / Source <span style="color:red">*</span></label>
                    <select id="f-s5-source">
                        <option value="WhatsApp Support Line">WhatsApp Support Line</option>
                        <option value="Phone Call">Phone Call</option>
                        <option value="Email / Portal">Email / Portal</option>
                        <option value="On-Site Visit">On-Site Visit</option>
                    </select>
                </div>
                <div class="field">
                    <label>Priority Level <span style="color:red">*</span></label>
                    <select id="f-s5-priority">
                        <option value="Normal">Normal</option>
                        <option value="Low">Low</option>
                        <option value="High Priority">High Priority</option>
                        <option value="Critical / Business Down">Critical / Business Down</option>
                    </select>
                </div>
            </div>
        </div>`;
    }
    // 6. TILL SETUP (S6) - Unified Programming & Imaging
    else if (main === 'S6') {
        extra = `
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1; margin-top: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #1e293b; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600;">
                <i data-lucide="monitor" style="width: 18px; height: 18px;"></i> Till System, Database & OS Image Details
            </h4>
            <div class="grid-4">
                <div class="field">
                    <label>CRM Quote No</label>
                    <input type="text" id="f-s6-quote" placeholder="Quote #">
                </div>
                <div class="field">
                    <label>Till Model <span style="color:red">*</span></label>
                    <select id="f-s6-model">${modelOptions}</select>
                </div>
                <div class="field">
                    <label>CPU <span style="color:red">*</span></label>
                    <select id="f-s6-cpu">${cpuOptions}</select>
                </div>
                <div class="field">
                    <label>Number of Tills (Qty) <span style="color:red">*</span></label>
                    <input type="number" id="f-s6-qty" value="1" min="1" max="50">
                </div>
            </div>
            <div class="grid-3" style="margin-top: 15px;">
                <div class="field">
                    <label>Target Operating System / Image</label>
                    <select id="f-s6-os">
                        <option value="Windows 10 IoT Enterprise LTSC">Windows 10 IoT Enterprise LTSC</option>
                        <option value="Windows 11 Pro / LTSC">Windows 11 Pro / LTSC</option>
                        <option value="Windows 7 Embedded POSReady">Windows 7 Embedded POSReady</option>
                        <option value="Android POS Custom ROM">Android POS Custom ROM</option>
                        <option value="Other OS">Other OS</option>
                    </select>
                </div>
                <div class="field">
                    <label>Storage Medium / Drive</label>
                    <select id="f-s6-drive">
                        <option value="M.2 NVMe SSD (High Speed)">M.2 NVMe SSD (High Speed)</option>
                        <option value="2.5 SATA SSD">2.5 SATA SSD</option>
                        <option value="mSATA SSD">mSATA SSD</option>
                        <option value="eMMC Onboard">eMMC Onboard</option>
                    </select>
                </div>
                <div class="field">
                    <label>License Status</label>
                    <select id="f-s6-license">
                        <option value="Digital OEM BIOS Key">Digital OEM BIOS Key</option>
                        <option value="COA Sticker Attached">COA Sticker Attached</option>
                        <option value="Customer Provided Key">Customer Provided Key</option>
                        <option value="Unlicensed / Evaluation">Unlicensed / Evaluation</option>
                    </select>
                </div>
            </div>
            <div class="grid-2" style="margin-top: 15px;">
                <div class="field">
                    <label>Till Lead Programmer <span style="color:red">*</span></label>
                    <select id="f-s6-prog-till">${staffOptions}</select>
                </div>
                <div class="field">
                    <label>Image Specialist / Builder</label>
                    <input type="text" id="f-s6-prog-menu" placeholder="Programmer or technician name">
                </div>
            </div>
        </div>`;
    }
    // 8. SOFTWARING (S8)
    else if (main === 'S8') {
        extra = `
        <div style="background: #fdf4ff; padding: 20px; border-radius: 12px; border: 1px solid #f0abfc; margin-top: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #a21caf; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600;">
                <i data-lucide="layers" style="width: 18px; height: 18px;"></i> Softwaring & App Deployment Details
            </h4>
            <div class="grid-3">
                <div class="field">
                    <label>Device / Hardware Type <span style="color:red">*</span></label>
                    <select id="f-s8-device-type">
                        <option value="HandHeld Terminal (Sunmi / Pax)">HandHeld Terminal (Sunmi / Pax)</option>
                        <option value="Self-Service Kiosk (Android/Win)">Self-Service Kiosk (Android/Win)</option>
                        <option value="Tablet (iPad / Android Tablet)">Tablet (iPad / Android Tablet)</option>
                        <option value="Online Ordering Box / Server">Online Ordering Box / Server</option>
                        <option value="Kitchen Display System (KDS)">Kitchen Display System (KDS)</option>
                    </select>
                </div>
                <div class="field">
                    <label>Station / Device Name <span style="color:red">*</span></label>
                    <input type="text" id="f-s8-station" placeholder="e.g. Waiter-1, Kiosk-Entry, Bar-Tab">
                </div>
                <div class="field">
                    <label>Number of Devices (Qty) <span style="color:red">*</span></label>
                    <input type="number" id="f-s8-qty" value="1" min="1" max="50">
                </div>
            </div>
            <div class="grid-2" style="margin-top: 15px;">
                <div class="field">
                    <label>Till Host IP / Server Connection</label>
                    <input type="text" id="f-s8-ip" placeholder="e.g. 192.168.1.100:8080 or Cloud URL">
                </div>
                <div class="field">
                    <label>Assigned Software Specialist</label>
                    <select id="f-s8-technician">${staffOptions}</select>
                </div>
            </div>
        </div>`;
    }
    // 9. HARDWARE PROGRAMMING (S9)
    else if (main === 'S9') {
        extra = `
        <div style="background: #fffbeb; padding: 20px; border-radius: 12px; border: 1px solid #fde68a; margin-top: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #b45309; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600;">
                <i data-lucide="scale" style="width: 18px; height: 18px;"></i> Hardware & Scale Programming Details
            </h4>
            <div class="grid-3">
                <div class="field">
                    <label>Hardware / Scale Model <span style="color:red">*</span></label>
                    <select id="f-s9-scale-model">
                        <option value="Cas CN1 Label Scale">Cas CN1 Label Scale</option>
                        <option value="Cas CL5200 / CL5000">Cas CL5200 / CL5000</option>
                        <option value="Cas ER Plus / PD-2">Cas ER Plus / PD-2 (Check-out Scale)</option>
                        <option value="Avery Berkel / Dibal Scale">Avery Berkel / Dibal Scale</option>
                        <option value="Barcode Label Printer (Zebra/Citizen/TSC)">Barcode Label Printer (Zebra/Citizen/TSC)</option>
                        <option value="Other Hardware Peripheral">Other Hardware Peripheral</option>
                    </select>
                </div>
                <div class="field">
                    <label>Connection Interface <span style="color:red">*</span></label>
                    <select id="f-s9-interface">
                        <option value="Ethernet / TCP/IP LAN">Ethernet / TCP/IP LAN</option>
                        <option value="RS232 Serial Port (COM)">RS232 Serial Port (COM)</option>
                        <option value="USB Direct">USB Direct</option>
                        <option value="Wi-Fi Wireless">Wi-Fi Wireless</option>
                    </select>
                </div>
                <div class="field">
                    <label>Scale IP / Port Address</label>
                    <input type="text" id="f-s9-ip" placeholder="e.g. 192.168.1.50:2001 or COM1">
                </div>
            </div>
            <div class="grid-3" style="margin-top: 15px;">
                <div class="field">
                    <label>Barcode / Label Format</label>
                    <select id="f-s9-barcode-format">
                        <option value="EAN-13 (Weight Embedded 20/21/28/29)">EAN-13 (Weight Embedded 20/21/28/29)</option>
                        <option value="EAN-13 Standard (Item Code)">EAN-13 Standard (Item Code)</option>
                        <option value="Custom Shelf Label 58x40mm">Custom Shelf Label 58x40mm</option>
                        <option value="Custom Meat/Deli Label 58x60mm">Custom Meat/Deli Label 58x60mm</option>
                    </select>
                </div>
                <div class="field">
                    <label>PLU / Item Capacity</label>
                    <input type="text" id="f-s9-plu" placeholder="e.g. 500 PLUs, Meat Dept, Veg">
                </div>
                <div class="field">
                    <label>Hardware Programmer <span style="color:red">*</span></label>
                    <select id="f-s9-technician">${staffOptions}</select>
                </div>
            </div>
        </div>`;
    }

    const container = document.getElementById('dynamic-fields-container');
    if (container) {
        container.innerHTML = extra;
        if (window.lucide) {
            lucide.createIcons();
        }
    }
    calculateDuration();
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
    let fastTrackFee = 0;
    if (main === 'S1') { 
        const basePrice = p.S1_Base || 125.00;
        const hourlyPrice = p.S1_Hourly || 25.00;
        const setMenuPrice = p.S1_SetMenu || 35.00;

        if (sub.includes('Set Menu') || sub.includes('Dessert')) {
            price = setMenuPrice;
        } else if (sub.includes('New Menu')) { 
            price = 250.00; 
        } else { 
            price = basePrice;
            if (dur > 60) price += Math.ceil((dur - 60) / 60) * hourlyPrice; 
        } 
        
        // Add urgent fee if checked
        const urgentCheck = document.getElementById('f-s1-no-appointment');
        if (urgentCheck && urgentCheck.checked) {
            fastTrackFee = 25.00;
            price += fastTrackFee;
        }
    } else if (p[main] !== undefined && p[main] !== 0) {
        price = p[main];
    } else {
        if (main === 'S2') price = 125.00;
        else if (main === 'S3') price = 125.00;
        else if (main === 'S4') price = 65.00;
        else if (main === 'S6') price = 150.00;
        else if (main === 'S7') price = 65.00;
        else if (main === 'S8') price = 85.00;
        else if (main === 'S9') price = 85.00;
        else price = 0.00;
    }
    
    // Update Fast-Track Fee Badge
    const ftBadge = document.getElementById('f-fast-track-badge');
    if (ftBadge) {
        ftBadge.textContent = `£${fastTrackFee.toFixed(2)}`;
        if (fastTrackFee > 0) {
            ftBadge.style.cssText = 'background: #fee2e2; color: #dc2626; border: 1px solid #f87171; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px;';
        } else {
            ftBadge.style.cssText = 'background: var(--card); color: var(--steel); border: 1px solid var(--border-color); padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px;';
        }
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
        // Clamp to business hours floor (09:00 = 540 min)
        if (totalStart < 540) totalStart = 540;
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
                statusBadge.style.cssText = 'background: #10b981; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
            } else {
                statusBadge.textContent = 'CHARGEABLE (NO CONTRACT)';
                statusBadge.style.cssText = 'background: #f97316; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
            }
        }
        
        // Update Payment Status and Payment Badge
        const paymentBadge = document.getElementById('f-payment-badge');
        if (statusVal === 'Contract') {
            if (paymentEl) paymentEl.value = 'Contract';
            if (paymentBadge) {
                paymentBadge.textContent = 'CONTRACT (FREE)';
                paymentBadge.style.cssText = 'background: #10b981; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
            }
            const priceInput = document.getElementById('f-price');
            if (priceInput) priceInput.value = '0.00';
        } else {
            if (paymentEl) paymentEl.value = 'Chargeable';
            if (paymentBadge) {
                paymentBadge.textContent = 'CHARGEABLE';
                paymentBadge.style.cssText = 'background: #3b82f6; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
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
            statusBadge.style.cssText = 'background: #94a3b8; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
        }
        
        const paymentBadge = document.getElementById('f-payment-badge');
        if (paymentBadge) {
            paymentBadge.textContent = 'PENDING';
            paymentBadge.style.cssText = 'background: #94a3b8; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
        }
    }
}
function updatePaymentStyle(el) {
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


function updatePriceFieldAccessibility() {
    const priceInput = document.getElementById('f-price');
    if (priceInput) {
        const canEdit = appState.currentUserRole === 'Admin' || appState.currentUserRole === 'Accounting';
        priceInput.readOnly = !canEdit;
        if (!canEdit) {
            priceInput.style.background = '#f8fafc';
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
        statusBadge.style.cssText = 'background: #94a3b8; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
    }
    
    const paymentBadge = document.getElementById('f-payment-badge');
    if (paymentBadge) {
        paymentBadge.textContent = 'PENDING';
        paymentBadge.style.cssText = 'background: #94a3b8; color: white; padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 12px; display: inline-block;';
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
    
    // ========================================================
    // DEPARTMAN BAZLI DİNAMİK ALANLARI TOPLAMA & RAPORLAMA
    // ========================================================
    let extraSummary = '';

    if (main === 'S1') {
        const menuType = document.getElementById('f-s1-menu-type')?.value || '';
        const menuLink = document.getElementById('f-s1-menu-link')?.value || '';
        const urgent = document.getElementById('f-s1-no-appointment')?.checked ? 'YES (+£25.00 Fast-Track)' : 'No';
        extraSummary = `[MENU TYPE: ${menuType}] | [URGENT: ${urgent}]` + (menuLink ? `\n[ATTACHMENT LINK: ${menuLink}]` : '');
    }
    else if (main === 'S2') {
        const co = document.getElementById('f-card-company')?.value || '';
        const sn = document.getElementById('f-setup-number')?.value || '';
        const ika = document.getElementById('f-ika-app')?.value || '';
        const sec = document.getElementById('f-s2-sector')?.value || '';
        const tModel = document.getElementById('f-s2-terminal-model')?.value || '';
        extraSummary = `[CARD CO: ${co}] | [TID / S/N: ${sn}] | [INTEGRATION: ${ika}] | [SECTOR: ${sec}]` + (tModel ? ` | [MODEL: ${tModel}]` : '');
    }
    else if (main === 'S3') {
        const rType = document.getElementById('f-s3-reset-type')?.value || '';
        const auth = document.getElementById('f-s3-authoriser')?.value || '';
        const consent = document.getElementById('f-s3-written-consent')?.checked ? 'CONFIRMED' : 'MISSING';
        const backup = document.getElementById('f-s3-backup-taken')?.checked ? 'ARCHIVED' : 'NOT ARCHIVED';
        extraSummary = `[DATA RESET TYPE: ${rType}]\n[AUTHORISED BY: ${auth}] | [CUSTOMER CONSENT: ${consent}] | [BACKUP: ${backup}]`;
    }
    else if (main === 'S4') {
        const hw = document.getElementById('f-s4-hardware-type')?.value || '';
        const fault = document.getElementById('f-s4-fault-type')?.value || '';
        const war = document.getElementById('f-s4-warranty')?.value || '';
        const sn = document.getElementById('f-s4-serial')?.value || 'N/A';
        const tech = document.getElementById('f-s4-technician')?.value || '';
        extraSummary = `[SERVICE HARDWARE: ${hw} | S/N: ${sn}]\n[FAULT: ${fault}] | [WARRANTY: ${war}] | [TECH: ${tech}]`;
    }
    else if (main === 'S5') {
        const src = document.getElementById('f-s5-source')?.value || '';
        const prio = document.getElementById('f-s5-priority')?.value || '';
        extraSummary = `[REQUEST SOURCE: ${src}] | [PRIORITY: ${prio}]`;
    }
    else if (main === 'S6') {
        const quote = document.getElementById('f-s6-quote')?.value || '';
        const model = document.getElementById('f-s6-model')?.value || '';
        const cpu = document.getElementById('f-s6-cpu')?.value || '';
        const qty = document.getElementById('f-s6-qty')?.value || '1';
        const os = document.getElementById('f-s6-os')?.value || '';
        const drv = document.getElementById('f-s6-drive')?.value || '';
        const lic = document.getElementById('f-s6-license')?.value || '';
        const pTill = document.getElementById('f-s6-prog-till')?.value || '';
        const pMenu = document.getElementById('f-s6-prog-menu')?.value || '';
        extraSummary = `--- TILL SETUP & OS SPECIFICATIONS ---\nQuote: ${quote} | Model: ${model} | CPU: ${cpu} | Qty: ${qty}\nOS: ${os} | Drive: ${drv} | License: ${lic}\nLead Programmer: ${pTill} | Image/Builder: ${pMenu}\n---------------------------------------`;
    }
    else if (main === 'S8') {
        const devType = document.getElementById('f-s8-device-type')?.value || '';
        const station = document.getElementById('f-s8-station')?.value || '';
        const qty = document.getElementById('f-s8-qty')?.value || '1';
        const ip = document.getElementById('f-s8-ip')?.value || '';
        const tech = document.getElementById('f-s8-technician')?.value || '';
        extraSummary = `--- SOFTWARING MODULE SPECIFICATIONS ---\nDevice Type: ${devType} | Station: ${station} | Qty: ${qty}\nServer/Host: ${ip} | Software Tech: ${tech}\n----------------------------------------`;
    }
    else if (main === 'S9') {
        const model = document.getElementById('f-s9-scale-model')?.value || '';
        const iface = document.getElementById('f-s9-interface')?.value || '';
        const ip = document.getElementById('f-s9-ip')?.value || '';
        const fmt = document.getElementById('f-s9-barcode-format')?.value || '';
        const plu = document.getElementById('f-s9-plu')?.value || '';
        const tech = document.getElementById('f-s9-technician')?.value || '';
        extraSummary = `--- HARDWARE PROGRAMMING SPECIFICATIONS ---\nScale/Device: ${model} | Interface: ${iface} | IP/Port: ${ip}\nBarcode Format: ${fmt} | Capacity: ${plu} | Hardware Tech: ${tech}\n-------------------------------------------`;
    }

    if (extraSummary) {
        description = `${extraSummary}\n\n${description}`;
    }

    const dateVal = document.getElementById('f-date') ? document.getElementById('f-date').value : new Date().toISOString().split('T')[0];
    const timeVal = document.getElementById('f-start-time').value || '00:00';
    let combinedDate;
    try {
        combinedDate = new Date(`${dateVal}T${timeVal}`).toISOString();
    } catch(e) {
        combinedDate = new Date().toISOString();
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
        "INV DATE": document.getElementById('f-date') ? document.getElementById('f-date').value : new Date().toISOString().split('T')[0], 
        DESCRIPTION: description, 
        STATUS: 'Logged', 
        invoiced: false 
    };
    try { 
        if (window.globalEventBus) {
            window.globalEventBus.publish({
                type: 'ticket_create_requested',
                payload: {
                    ...rec,
                    company: rec.COMPANY,
                    mainService: rec["MAIN SERVICE"],
                    subService: rec["SUB SERVICE"],
                    duration: rec.DURATION,
                    isUrgent: main === 'S1' && document.getElementById('f-s1-no-appointment')?.checked
                }
            });
            showAlert('Success', 'Record processed via Antigravity Loop!', '✅');
            toggleMainForm('home');
            renderAll();
        } else {
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
                
                // Log the creation
                if (typeof addSystemLog === 'function') {
                    addSystemLog('CREATE RECORD', `Added record for company: ${rec.COMPANY}, Service: ${rec['MAIN SERVICE']}`);
                }
            }
            showAlert('Success', 'Record saved!', '✅');
            toggleMainForm('home');
            renderAll();
        }
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
        if (!n) return;
        try {
            const invoiceNo = n === true ? `INV-${Date.now()}` : n;
            const invoiceDate = new Date().toISOString().split('T')[0];
            const updates = {
                invoiced: true,
                "INV NO": invoiceNo,
                "INV DATE": invoiceDate
            };
            if (window.globalEventBus) {
                window.globalEventBus.publish({
                    type: 'ticket_update_requested',
                    payload: {
                        id: id,
                        updates: updates
                    }
                });
                
                // Optimistic UI updates
                const t = appState.tickets.find(x => x.id === id);
                if (t) {
                    t.invoiced = true;
                    t.invoiceNo = invoiceNo;
                    t.invoiceDate = invoiceDate;
                }
                renderDataTable();
                renderInvoicesTable();
                updateDataStats();
                showAlert('Invoiced', 'Record marked as invoiced with current date.', '✅');
            } else {
                const { error } = await sbClient.from('records').update(updates).eq('id', id);
                if (error) throw error;
                initApp();
                showAlert('Invoiced', 'Record marked as invoiced with current date.', '✅');
            }
        } catch (e) {
            showAlert('Error', e.message, '❌');
        }
    });
}
function filterByCustomer(name) { showTab('dataview'); document.getElementById('dataview-search').value = name; renderDataTable(); }
function renderAll() { 
    renderTabContent(appState.activeTab); 
    const dl = document.getElementById('vtiger-customer-list');
    if (dl && appState.customers) {
        dl.innerHTML = appState.customers.map(c => {
            const label = `${c.COMPANY} (${c['CUSTOMER ID'] || c['ORGANIZATION NUMBER'] || ''}, ${c.POSTCODE || ''})`;
            return `<option value="${label}">`;
        }).join('');
    }
    if (window.lucide) lucide.createIcons();
}

// --- App Initialization & Auth ---

window.updateRecordEdits = async function(id, btn) {
    if(!id) return;
    btn.innerHTML = '<i class="lucide lucide-loader" style="width: 16px; height: 16px; animation: spin 1s linear infinite;"></i> Saving...';
    try {
        const edits = {
            "COMPANY": document.getElementById('edit-company').value,
            "POSTCODE": document.getElementById('edit-postcode').value,
            "MAIN SERVICE": document.getElementById('edit-main').value,
            "SUB SERVICE": document.getElementById('edit-sub').value,
            "START TIME": document.getElementById('edit-start').value,
            "END TIME": document.getElementById('edit-end').value,
            "DURATION": document.getElementById('edit-duration').value,
            "PRICE": document.getElementById('edit-price').value,
            "PAYMENT STATUS": document.getElementById('edit-payment').value,
            "DESCRIPTION": document.getElementById('edit-desc').value,
            "STATUS": document.getElementById('edit-status') ? document.getElementById('edit-status').value : 'Logged'
        };
        if (window.globalEventBus) {
            window.globalEventBus.publish({
                type: 'ticket_update_requested',
                payload: {
                    id: id,
                    updates: edits
                }
            });
            // Update local state optimistically
            const t = appState.tickets.find(x => x.id === id);
            if (t) {
                t.company = edits.COMPANY;
                t.postcode = edits.POSTCODE;
                t.mainService = edits["MAIN SERVICE"];
                t.subService = edits["SUB SERVICE"];
                t.startTime = edits["START TIME"];
                t.endTime = edits["END TIME"];
                t.duration = edits.DURATION;
                t.price = edits.PRICE;
                t.paymentStatus = edits["PAYMENT STATUS"];
                t.description = edits.DESCRIPTION;
                t.status = edits.STATUS;
            }
            closeModal();
            if (typeof renderDataTable === 'function') renderDataTable();
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof updateDataStats === 'function') updateDataStats();
            showToast('Record updated successfully', 'success');
        } else {
            const { error } = await sbClient.from('records').update(edits).eq('id', id);
            if (error) throw error;
            showToast('Record updated successfully', 'success');
            
            if (window.addSystemLog) window.addSystemLog(`UPDATE RECORD`, `Updated record ID: ${id}`);
            
            closeModal();
            await fetchRecords();
            if (typeof renderDataTable === 'function') renderDataTable();
            if (typeof renderCalendar === 'function') renderCalendar();
            if (typeof updateDataStats === 'function') updateDataStats();
        }
    } catch(e) {
        showToast(e.message, 'error');
        btn.innerHTML = '<i data-lucide="save"></i> Save Changes';
        if (window.lucide) lucide.createIcons();
    }
}

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

// renderCalendar definition removed to use gc_calendar.js global function.

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

window.createAppointmentForSlot = function(dateStr, timeStr, companyName = '') {
    const dayModal = document.getElementById('day-view-modal');
    if (dayModal) dayModal.classList.add('hidden');
    
    // Show quick add modal
    const qaModal = document.getElementById('quick-add-modal');
    if (qaModal) {
        qaModal.classList.remove('hidden');
        if(window.initPickers) window.initPickers();
        if(typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    // Populate personnel if not done
    if (typeof populateStaffDropdowns === 'function') populateStaffDropdowns();
    
    // Reset quick add fields
    const searchInput = document.getElementById('qa-customer-search');
    if (searchInput) {
        searchInput.value = companyName || '';
        setTimeout(() => searchInput.focus(), 60);
    }
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
        qaStatus.style.setProperty('background', '#F8FAFC', 'important');
        qaStatus.style.setProperty('color', '#64748B', 'important');
        qaStatus.style.fontWeight = '600';
    }
    
    const serviceCat = document.getElementById('qa-service-category');
    if (serviceCat) {
        serviceCat.value = 'S1';
    }
    
    // Populate times dropdown in qa-time (07:00 to 21:00 with 30-min intervals)
    const qaTimeSelect = document.getElementById('qa-time');
    if (qaTimeSelect) {
        if (qaTimeSelect.options.length < 20) {
            let timesHtml = '';
            for (let h = 7; h <= 21; h++) {
                const hStr = String(h).padStart(2, '0');
                timesHtml += `<option value="${hStr}:00">${hStr}:00</option>`;
                if (h < 21) {
                    timesHtml += `<option value="${hStr}:30">${hStr}:30</option>`;
                }
            }
            qaTimeSelect.innerHTML = timesHtml;
        }
        if (timeStr) {
            let exists = Array.from(qaTimeSelect.options).some(o => o.value === timeStr);
            if (!exists) {
                const opt = document.createElement('option');
                opt.value = timeStr;
                opt.textContent = timeStr;
                qaTimeSelect.appendChild(opt);
            }
            qaTimeSelect.value = timeStr;
        } else {
            qaTimeSelect.value = '09:00';
        }
    }
    
    // Populate Assigned Engineer select options
    const qaStaffSelect = document.getElementById('qa-staff-select');
    if (qaStaffSelect && qaStaffSelect.options.length === 0) {
        const personnel = appState.settings?.personnel || [];
        qaStaffSelect.innerHTML = personnel.map(p => `<option value="${p}">${p}</option>`).join('');
    }
    if (qaStaffSelect && appState.currentUser) qaStaffSelect.value = appState.currentUser;
    
    if (typeof updateQaSubServices === 'function') updateQaSubServices();
    if (typeof updatePriorityUI === 'function') updatePriorityUI('Normal');
    
    if (companyName && typeof window.autoFillQuickAdd === 'function') {
        window.autoFillQuickAdd();
    }
};

window.updateQaSubServices = function() {
    const main = document.getElementById('qa-service-category').value;
    const subSelect = document.getElementById('qa-sub-service');
    if (!subSelect) return;
    
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
    subSelect.innerHTML = opts.map(o => `<option value="${o}">${o}</option>`).join('');
};

window.updatePriorityUI = function(val) {
    const normal = document.getElementById('lbl-priority-normal');
    const urgent = document.getElementById('lbl-priority-urgent');
    const emergency = document.getElementById('lbl-priority-emergency');
    
    [normal, urgent, emergency].forEach(el => {
        if(el) {
            el.style.background = '#fff';
            el.style.color = '#334155';
            el.style.borderColor = '#cbd5e1';
        }
    });
    
    if (val === 'Normal') {
        if (normal) {
            normal.style.background = '#f1f5f9';
            normal.style.color = '#334155';
            normal.style.borderColor = '#94a3b8';
        }
    } else if (val === 'Urgent') {
        if (urgent) {
            urgent.style.background = '#fef3c7';
            urgent.style.color = '#d97706';
            urgent.style.borderColor = '#f59e0b';
        }
    } else if (val === 'Emergency') {
        if (emergency) {
            emergency.style.background = '#fee2e2';
            emergency.style.color = '#b91c1c';
            emergency.style.borderColor = '#ef4444';
        }
    }
};

window.submitQuickAdd = async function() {
    const btn = document.querySelector('#quick-add-modal button.btn-primary');
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
            btn.innerText = 'Save Appointment';
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
        btn.innerText = 'Save Appointment';
        btn.disabled = false;
    }
};

window.autoFillQuickAdd = function() {
    const searchInput = document.getElementById('qa-customer-search');
    if (!searchInput) return;
    const searchVal = (searchInput.value || '').trim();
    if (!searchVal) return;
    const q = searchVal.toLowerCase();
    
    const custSource = (typeof allCustomersCache !== 'undefined' && allCustomersCache.length > 0) ? allCustomersCache : (appState.customers || []);
    const customer = custSource.find(c => {
        const name = (c.organization_name || c.COMPANY || '').toLowerCase();
        const cid = (c.organization_number || c['CUSTOMER ID'] || '').toLowerCase();
        const pc = (c.billing_postal_code || c.POSTCODE || '').toLowerCase();
        return (name && (name === q || q.includes(name) || name.includes(q))) ||
               (cid && (cid === q || q.includes(cid) || cid.includes(q))) ||
               (pc && (pc === q || q.includes(pc) || pc.includes(q)));
    });

    const companyEl = document.getElementById('qa-company-name');
    const companyIdEl = document.getElementById('qa-company-id');
    const postcodeEl = document.getElementById('qa-postcode');
    const addressEl = document.getElementById('qa-address');
    const contactEl = document.getElementById('qa-contact');
    const phoneEl = document.getElementById('qa-phone');
    const statusEl = document.getElementById('qa-status');

    if (customer) {
        companyEl.value = customer.organization_name || customer.COMPANY || '';
        companyIdEl.value = customer.organization_number || customer['CUSTOMER ID'] || '';
        postcodeEl.value = customer.billing_postal_code || customer.POSTCODE || '';
        addressEl.value = customer.billing_address || customer.ADDRESS1 || customer.ADDRESS2 || 'N/A';
        contactEl.value = customer.contact_name || customer.CONTACT_NAME || 'N/A';
        phoneEl.value = customer.phone || customer.PHONE || 'N/A';
        
        const statusVal = customer.service_status || customer['SERVICE STATUS'] || 'Contract';
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
        submitBtn.style.background = '#f59e0b';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};


window.openAppointmentView = function(id) {
    const r = appState.tickets.find(t => t.id == id || t.dbId == id);
    if (!r) return;
    
    // Set Modal Title & Fields editability
    const isTicket = r.isTicket || false;
    const typeEl = document.getElementById('va-modal-type');
    const titleEl = document.getElementById('va-modal-title');
    if (typeEl) {
        typeEl.style.display = isTicket ? 'none' : 'block';
        if (!isTicket) typeEl.innerText = 'APPOINTMENT';
    }
    if (titleEl) titleEl.innerText = isTicket ? 'Ticket Detail' : 'Appointment Detail';
    
    const footEl = document.querySelector('#view-appointment-modal .ticket-foot');
    if (footEl) {
        footEl.style.display = isTicket ? 'none' : 'flex';
    }
    
    const dateInput = document.getElementById('va-date');
    const timeInput = document.getElementById('va-start-time');
    if (dateInput) {
        dateInput.disabled = isTicket;
    }
    if (timeInput) {
        timeInput.disabled = isTicket;
    }

    // Fill fields
    const services = appState.settings?.services || window.LOCAL_SERVICES || [];
    const servObj = services.find(x => x.name === r.mainService);
    document.getElementById('va-service-category').innerText = servObj ? (servObj.full_name || servObj.name) : (r.mainService || 'N/A');
    
    let customer = (appState.customers || []).find(c => 
        (r.companyId && c['DB_ID'] == r.companyId) || 
        (r.companyId && c['DB_ID'] == ('11x' + r.companyId)) || 
        (r.companyId && c['CUSTOMER ID'] == r.companyId) || 
        (r.company && c.COMPANY === r.company)
    );
    
    const companyName = r.company || (customer ? customer.COMPANY : 'N/A');
    const postCodeStr = r.postcode || (customer ? customer.POSTCODE : 'N/A');
    
    document.getElementById('va-company').innerText = companyName;
    document.getElementById('va-postcode').innerText = postCodeStr;
    
    const statusVal = customer ? (customer['SERVICE STATUS'] || 'No Contract') : 'No Contract';
    const statusEl = document.getElementById('va-status');
    statusEl.innerText = statusVal;
    
    if (statusVal.toLowerCase().includes('contract') || statusVal.toLowerCase().includes('var')) {
        statusEl.style.setProperty('background', '#dcfce7', 'important');
        statusEl.style.setProperty('color', '#15803d', 'important');
    } else {
        statusEl.style.setProperty('background', '#fee2e2', 'important');
        statusEl.style.setProperty('color', '#b91c1c', 'important');
    }
    
    // New fields
    document.getElementById('va-address').innerText = r.address || (customer ? (customer.ADDRESS || 'N/A') : 'N/A');
    document.getElementById('va-contact').innerText = r.primaryContact || (customer ? (customer.CONTACT || customer['PRIMARY CONTACT'] || 'N/A') : 'N/A');
    document.getElementById('va-phone').innerText = r.phone || (customer ? (customer.PHONE || customer['PRIMARY PHONE'] || 'N/A') : 'N/A');
    
    const priorityEl = document.getElementById('va-priority');
    if (priorityEl) {
        const pVal = r.priority || 'Normal';
        priorityEl.innerText = pVal;
        if (pVal === 'Normal') {
            priorityEl.style.setProperty('background', '#f1f5f9', 'important');
            priorityEl.style.setProperty('color', '#334155', 'important');
        } else if (pVal === 'Urgent') {
            priorityEl.style.setProperty('background', '#fef3c7', 'important');
            priorityEl.style.setProperty('color', '#d97706', 'important');
        } else if (pVal === 'Emergency') {
            priorityEl.style.setProperty('background', '#fee2e2', 'important');
            priorityEl.style.setProperty('color', '#b91c1c', 'important');
        }
    }
    document.getElementById('va-notes').innerText = r.notes || r.description || 'No Notes';
    
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
        
        if (window.globalEventBus) {
            window.globalEventBus.publish({
                type: 'job_completion_requested',
                payload: { id: id }
            });
            showAlert('Success', 'Job completion request processed via Antigravity Loop!', '✅');
            if (typeof renderWaitingJobs !== 'undefined') renderWaitingJobs();
            if (typeof renderCalendar !== 'undefined') renderCalendar();
            if (typeof updateDataStats !== 'undefined') updateDataStats();
        } else {
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
        }
    } catch(e) {
        console.error(e);
        if (typeof showAlert !== 'undefined') showAlert('Error', e.message, '');
    }
};

window.renderWaitingJobs = function() {
    const container = document.getElementById('waiting-tree-container');
    if (!container) return;

    const tickets = appState.tickets || [];
    
    // Filter waiting jobs (NOT completed and NOT invoiced)
    const waitingJobs = tickets.filter(t => {
        const stat = (t.status || '').toLowerCase();
        const isStatusCompleted = (stat === 'completed' || stat === 'completed' || stat === 'tamamland' || t.invoiced === true);
        return !isStatusCompleted;
    });

    if (waitingJobs.length === 0) {
        container.innerHTML = '<div style="padding:40px; text-align:center; color:#64748b; background:white; border-radius:12px; border:1px solid #e2e8f0;">No pending appointments found.</div>';
        return;
    }

    // Sort by Date and Time (Latest First)
    const sortedJobs = waitingJobs.sort((a, b) => {
        const tA = window.toEpoch ? window.toEpoch((a.invoiceDate || a.timestamp || '') + ' ' + (a.startTime || '')) : 0;
        const tB = window.toEpoch ? window.toEpoch((b.invoiceDate || b.timestamp || '') + ' ' + (b.startTime || '')) : 0;
        const diff = (tB || 0) - (tA || 0);
        if (diff !== 0) return diff;
        return (parseInt(b.id) || 0) - (parseInt(a.id) || 0);
    });

    const categoryNames = {
        'S1': 'MENU UPDATE',
        'S2': 'CREDIT CARD',
        'S3': 'DATA RESET',
        'S4': 'SERVICE',
        'S5': 'OTHER',
        'S6': 'TILL SETUP',
        'S8': 'SOFTWARING',
        'S9': 'HARDWARE'
    };

    let html = `
    <div class="table-wrap" style="background:white; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden;">
        <table style="width:100%; border-collapse:collapse;">
            <thead>
                <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0; text-align:left;">
                    <th style="padding:15px; font-size:11px; text-transform:uppercase; color:#64748b;">Date & Time</th>
                    <th style="padding:15px; font-size:11px; text-transform:uppercase; color:#64748b;">Company</th>
                    <th style="padding:15px; font-size:11px; text-transform:uppercase; color:#64748b;">Service</th>
                    <th style="padding:15px; font-size:11px; text-transform:uppercase; color:#64748b;">Postcode</th>
                    <th style="padding:15px; font-size:11px; text-transform:uppercase; color:#64748b;">Status</th>
                    <th style="padding:15px; font-size:11px; text-transform:uppercase; color:#64748b; text-align:right;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    sortedJobs.forEach(t => {
        const catName = categoryNames[t.mainService] || '';
        const displayService = t.mainService ? `${t.mainService} - ${catName}` : 'N/A';
        const dateStr = t.invoiceDate || 'N/A';
        const timeStr = t.startTime || '00:00';

        html += `
            <tr style="border-bottom:1px solid #f1f5f9; hover:background:#f8fafc;">
                <td style="padding:15px; font-weight:600; color:#0f172a;">
                    <div style="display:flex; flex-direction:column;">
                        <span>${dateStr}</span>
                        <span style="font-size:0.75rem; color:#64748b;">${timeStr}</span>
                    </div>
                </td>
                <td style="padding:15px; font-weight:700; color:#1e293b;">${t.company || 'Unknown'}</td>
                <td style="padding:15px;">
                    <span style="font-size:0.85rem; color:#475569; background:#f1f5f9; padding:4px 10px; border-radius:6px;">${displayService}</span>
                </td>
                <td style="padding:15px; color:#64748b; font-family:monospace;">${t.postcode || 'N/A'}</td>
                <td style="padding:15px;">
                    <span style="font-size:0.75rem; font-weight:800; padding:4px 8px; border-radius:50px; background:${t.paymentStatus === 'Chargeable' ? '#fee2e2; color:#ef4444' : '#dcfce7; color:#10b981'}">
                        ${(t.paymentStatus || 'PENDING').toUpperCase()}
                    </span>
                </td>
                <td style="padding:15px; text-align:right;">
                    <button onclick="openAppointmentView('${t.id}')" class="btn" style="background:var(--primary); color:white; border:none; padding:6px 12px; border-radius:6px; font-size:12px; cursor:pointer;">
                        View Details
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

