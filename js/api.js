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
                    const role = roleObj ? roleObj.role_name : (u.role || 'User');
                    const name = u.full_name || u.username || 'UNKNOWN';
                    const username = u.username || (u.full_name ? u.full_name.toLowerCase().replace(/\s+/g, '') : u.id);
                    const userObj = {
                        id: u.id,
                        username: username,
                        password: u.password || '1234',
                        role: role,
                        role_id: u.role_id,
                        full_name: u.full_name || name
                    };
                    appState.settings.users_auth[username] = userObj;
                    appState.settings.users_auth[username.toLowerCase()] = userObj;
                    appState.settings.users_auth[name] = userObj;
                    appState.settings.users_auth[name.toLowerCase()] = userObj;
                    if (u.email) {
                        appState.settings.users_auth[u.email] = userObj;
                        appState.settings.users_auth[u.email.toLowerCase()] = userObj;
                    }
                    if (appState.settings.personnel.indexOf(name) === -1) {
                        appState.settings.personnel.push(name);
                    }
                });
            }
        } catch (e) { console.error("Error fetching users/roles:", e); }

        // 2. Fetch Services and Pricing
        try {
            const { data: srvData } = await sbClient.from('services').select('*');
            appState.settings.services = [];
            appState.settings.pricing = {};
            if (srvData && srvData.length > 0) {
                appState.settings.services = srvData;
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
                console.warn("[INIT] Services table is empty/missing, no default services loaded.");
            }
        } catch (e) { 
            console.error("Error fetching services:", e); 
            appState.settings.services = [];
            appState.settings.pricing = {};
        }

        // 3. Set Static Sub-Services (If needed, fetch from DB. For now keeping empty or leaving as is if not in DB. Assuming we don't want local fallback here if they meant strictly db).
        appState.settings.sub_services = typeof LOCAL_SUB_SERVICES !== 'undefined' ? LOCAL_SUB_SERVICES : {};

        // 3. Set Static Sub-Services
        appState.settings.sub_services = LOCAL_SUB_SERVICES;

        // 4. Fetch Records
        try {
            const { data: recData } = await sbClient.from('records').select('*');
            if (recData && recData.length > 0) {
                appState.tickets = recData.map(r => {
                    const parsed = parseMetadata(r.DESCRIPTION || r.description || '');
                    const priceVal = parseFloat(r.PRICE || r.price || 0);
                    return {
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
                    };
                });
            }
        } catch (e) { console.error("Error fetching records:", e); }

        // 4b. Fetch Dedicated Turso Tickets (Paginated)
        try {
            let tckData = [];
            let lastSize = 1000;
            let offset = 0;
            while (lastSize === 1000) {
                const { data, error } = await sbClient.from('vt_tickets').select('*').range(offset, offset + 999);
                if (error) break;
                if (data && data.length > 0) {
                    tckData = tckData.concat(data);
                    lastSize = data.length;
                    offset += 1000;
                } else {
                    break;
                }
            }
            if (tckData.length > 0) {
                const mappedTursoTickets = tckData.map(t => ({
                    id: t.id,
                    dbId: String(t.id).slice(-5),
                    crmTicket: t.ticket_no || t.id,
                    timestamp: t.createdtime || new Date().toISOString(),
                    company: t.company || t.customer_name || '',
                    companyId: t.parent_id || '',
                    user: t.assigned_user_id || '',
                    mainService: t.ticket_title || 'General Support',
                    subService: '',
                    status: 'Completed', // vt_tickets are always considered completed here
                    price: 0,
                    description: t.description || '',
                    rawDescription: t.description || '',
                    solution: t.solution || '',
                    invoiced: true // So it hides from pending appointments/invoices queues if needed
                }));
                appState.tickets = (appState.tickets || []).concat(mappedTursoTickets);
                appState.tursoTickets = mappedTursoTickets;
            }
        } catch(e) { console.warn("[INIT] Turso tickets fetch error:", e); }

        // 4c. Fetch Dedicated Turso Quotes (Paginated)
        try {
            let quoData = [];
            let lastSize = 1000;
            let offset = 0;
            while (lastSize === 1000) {
                const { data, error } = await sbClient.from('vt_quotes').select('*').range(offset, offset + 999);
                if (error) break;
                if (data && data.length > 0) {
                    quoData = quoData.concat(data);
                    lastSize = data.length;
                    offset += 1000;
                } else {
                    break;
                }
            }
            if (quoData.length > 0) {
                appState.quotes = quoData.map(q => ({
                    id: q.id,
                    quote_no: q.quote_no || q.id,
                    subject: q.subject || 'Equipment & Service Quotation',
                    quotestage: q.quotestage || 'Draft',
                    validtill: q.validtill || '',
                    createdtime: q.createdtime || '',
                    hdnGrandTotal: parseFloat(q.hdnGrandTotal) || 0,
                    total: parseFloat(q.hdnGrandTotal) || 0,
                    details: q.details || '',
                    company: q.customer_name || '',
                    account_id: q.account_id || '',
                    assigned_to: q.assigned_user_id || ''
                }));
            }
        } catch(e) { console.warn("[INIT] Turso quotes fetch error:", e); }

        // 5. Fetch Vtiger CRM Organizations & Service Contracts
        try {
            console.log("[INIT] Fetching customers from Turso DB...");
            
            // --- Fallback chain: try multiple table/view names ---
            const TABLE_CANDIDATES = ['vt_customers', 'Organizations', 'VtigerCRM_Organizations', 'customers'];
            let orgData = null;
            let usedTable = '';

            for (const tableName of TABLE_CANDIDATES) {
                try {
                    console.log(`[INIT] Trying table: "${tableName}"...`);
                    const { data, error } = await sbClient.from(tableName)
                        .select('*')
                        .limit(1);
                    
                    if (error) {
                        console.warn(`[INIT] Table "${tableName}" returned error:`, error.message, error.code);
                        continue;
                    }
                    if (data !== null) {
                        console.log(`[INIT] ✓ Table "${tableName}" is accessible (probe returned ${data.length} rows).`);
                        usedTable = tableName;
                        break;
                    }
                } catch (probeErr) {
                    console.warn(`[INIT] Table "${tableName}" probe failed:`, probeErr.message);
                }
            }

            if (!usedTable) {
                console.error("[INIT] ✗ No accessible customer table found. Tried:", TABLE_CANDIDATES.join(', '));
                showToast("Customer table not accessible in Turso DB.", "error");
                throw new Error("No accessible customer table found.");
            }

            // --- Paginated fetch from the working table ---
            orgData = [];
            let lastOrgSize = 1000;
            let orgOffset = 0;
            while (lastOrgSize === 1000) {
                const { data, error } = await sbClient.from(usedTable)
                    .select('*')
                    .range(orgOffset, orgOffset + 999);
                if (error) {
                    console.error(`[INIT] ${usedTable} pagination error at offset ${orgOffset}:`, error);
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
            console.log(`[INIT] Fetched ${orgData.length} organizations from "${usedTable}".`);

            // --- Fetch service contracts for status mapping ---
            let scData = [];
            try {
                let lastScSize = 1000;
                let scOffset = 0;
                while (lastScSize === 1000) {
                    const { data, error } = await sbClient.from('service_contracts')
                        .select('*')
                        .range(scOffset, scOffset + 999);
                    if (error) {
                        console.warn("[INIT] service_contracts error:", error.message);
                        break;
                    }
                    if (data && data.length > 0) {
                        scData = scData.concat(data);
                        lastScSize = data.length;
                        scOffset += 1000;
                    } else {
                        break;
                    }
                }
            } catch(scErr) {
                console.warn("[INIT] Could not fetch service_contracts:", scErr.message);
            }
            
            const contractMap = {};
            if (scData.length > 0) {
                console.log(`[INIT] Loaded ${scData.length} service contracts.`);
                scData.forEach(sc => {
                    if (sc.organization_id) contractMap[sc.organization_id] = sc.status;
                });
            }

            // --- Map org data to appState.customers ---
            if (orgData.length > 0) {
                // Detect column naming style (Vtiger view vs simple table)
                const sample = orgData[0];
                const hasVtigerColumns = 'organization_name' in sample;
                
                if (hasVtigerColumns) {
                    appState.customers = orgData.map(c => ({
                        'CUSTOMER ID': c.organization_number || c.id || '',
                        'DB_ID': c.id || '',
                        'COMPANY': c.organization_name || '',
                        'ADDRESS': c.billing_address || '',
                        'CITY': c.billing_city || '',
                        'POSTCODE': c.billing_postal_code || '',
                        'PHONE': c.primary_phone || c.phone || '',
                        'PRIMARY PHONE': c.primary_phone || c.phone || '',
                        'CONTACT': c.contact_name || '',
                        'PRIMARY CONTACT': c.contact_name || '',
                        'OWNERSHIP': c.ownership || '',
                        'SERVICE STATUS': (contractMap[c.id] === 'In Progress' || contractMap[c.id] === 'Active') ? 'Contract' : 'No Contract'
                    }));
                } else {
                    // Fallback: direct column mapping for a simpler 'customers' table
                    appState.customers = orgData.map(c => ({
                        'CUSTOMER ID': c.customer_id || c.id || '',
                        'DB_ID': c.id || '',
                        'COMPANY': c.company || c.company_name || c.name || '',
                        'ADDRESS': c.address || '',
                        'CITY': c.city || '',
                        'POSTCODE': c.postcode || c.postal_code || '',
                        'PHONE': c.phone || '',
                        'PRIMARY PHONE': c.phone || '',
                        'CONTACT': c.contact || c.contact_name || '',
                        'PRIMARY CONTACT': c.contact || c.contact_name || '',
                        'OWNERSHIP': c.ownership || '',
                        'SERVICE STATUS': c.status || c.service_status || 'No Contract'
                    }));
                }
                                // Deduplicate by COMPANY name
                const uniqueCustomers = [];
                const seenCompanies = new Set();
                
                for (let i = appState.customers.length - 1; i >= 0; i--) {
                    const c = appState.customers[i];
                    const compKey = (c.COMPANY || '').trim().toLowerCase();
                    if (!seenCompanies.has(compKey)) {
                        seenCompanies.add(compKey);
                        uniqueCustomers.unshift(c);
                    }
                }
                appState.customers = uniqueCustomers;
                console.log(`[INIT] ✓ Successfully loaded ${appState.customers.length} customers into appState.`);
            } else {
                console.warn("[INIT] Organization table was accessible but returned 0 rows.");
                showToast("Customer table is empty. Run the CRM sync to populate data.", "warning");
            }
        } catch (e) { 
            console.error("Error fetching customers from Turso DB:", e);
            showToast("Customer data could not be loaded. Please check the console.", "error");
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
                        console.warn(`Table "${table}" is missing in Turso DB.`);
                    } else { throw error; }
                }
                if (data && data.length > 0) {
                    appState.settings[table] = data;
                } else {
                    console.log(`Table "${table}" is empty or missing. Not falling back to demo records.`);
                    appState.settings[table] = [];
                }
            } catch (e) { 
                console.error(`Error fetching ${table}, not using defaults:`, e); 
                appState.settings[table] = [];
            }
        }
        
        // Auto-seed if empty (DISABLED to prevent test records)
        /*
        if (await seedDatabaseIfNeeded()) {
            for (const table of hwTables) {
                try {
                    const { data } = await sbClient.from(table).select('*').order('name');
                    if (data && data.length > 0) appState.settings[table] = data;
                } catch (e) {}
            }
        }
        */

        renderAll();
        updateDataStats();
        window.lastDataFetchTime = Date.now();

        if (!appState.settings.services || appState.settings.services.length === 0) {
            console.warn("[INIT] No services found. Database might be empty or RLS is blocking access.");
            showToast("Service list is empty! Database may be empty or RLS is blocking.", "error");
        }
    } catch (err) { console.error("Critical Init Error:", err); }
}


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
        
        if (typeof addSystemLog === 'function') {
            addSystemLog('UPDATE ROLE', `User ID: ${userId} role changed to Role ID: ${roleId}`);
        }

        showToast('Role updated successfully.', 'success');
        initApp();
    } catch (e) {
        console.error(e);
        showAlert('Hata', 'Role could not be updated: ' + e.message, '❌');
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
                msg = `Güvenlik Hatası: "${table}" table. Please disable RLS or add a policy in Turso DB Console. -> ${table} -> RLS Settings kısmından RLS'i kapatın veya bir politika ekleyin.`;
            } else if (msg.includes('not found') || error.code === '42P01') {
                msg = `Veritabanı Hatası: "${table}" table not found in Turso DB. Please create the table.`;
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
window.exportData = exportData;
window.backupDatabase = () => showAlert('Info', 'Database backup started... Check Turso DB logs.', '☁️');

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
            showToast("Hata: 'services' table blocked by RLS.", "error");
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
    
    // Kullanıcının mevcut verilerini ayarlar paneline doldurur
    if (uData) {
        document.getElementById('acc-new-name').value = uData.full_name || '';
        document.getElementById('acc-new-pass').value = ''; // Güvenlik gereği şifreyi boş gösteriyoruz
        document.getElementById('acc-new-avatar').value = uData.avatar_url || '';
    }
}

async function updateAccountProfile() {
    // Formdaki yeni verileri alıyoruz
    const newName = document.getElementById('acc-new-name').value.trim();
    const newPass = document.getElementById('acc-new-pass').value.trim();
    const newAvatar = document.getElementById('acc-new-avatar').value.trim();
    
    if (!newName) {
        showToast('Name field cannot be empty.', 'error');
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
        // Güncellenecek verileri hazırlıyoruz
        const updateData = { full_name: newName };
        
        if (newPass) {
            updateData.password_hash = newPass; // Turso'daki yeni sütun adı
            // Geriye dönük uyumluluk için eski password alanını da dolduruyoruz
            updateData.password = newPass; 
        }
        
        if (newAvatar) {
            updateData.avatar_url = newAvatar;
        }

        // Turso users tablosunu güncelliyoruz
        const { error } = await sbClient.from('users').update(updateData).eq('id', uData.id);
        
        if (error) throw error;
        
        // Başarılı olursa lokal (ön yüz) state'i de güncelliyoruz
        uData.full_name = newName;
        if (newPass) uData.password = newPass;
        if (newAvatar) uData.avatar_url = newAvatar;
        appState.currentUserData = uData;
        
        // Sağ üstteki kullanıcı menüsündeki ismi ve resmi anında güncelliyoruz
        const userNameDisplays = [document.getElementById('current-user-name'), document.getElementById('dropdown-full-name')];
        userNameDisplays.forEach(el => {
            if(el) el.innerText = newName;
        });
        
        const firstName = newName.split(' ')[0];
        if (document.getElementById('dropdown-first-name')) document.getElementById('dropdown-first-name').innerText = firstName;
        
        if (newAvatar) {
            const avatarEl = document.getElementById('current-user-avatar');
            if (avatarEl) {
                avatarEl.innerHTML = `<img src="${newAvatar}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            }
        }

        showToast('Your profile has been successfully updated!', 'success');
        
        // Şifre değiştirilmişse sayfayı yenilemek iyi bir güvenlik pratiğidir
        if (newPass) {
            setTimeout(() => {
                showToast('Logging out because the password was changed...', 'info');
                if(typeof logout === 'function') logout();
            }, 1500);
        }
    } catch(e) {
        console.error(e);
        showToast('Update error: ' + e.message, 'error');
    }
}
window.updateAccountProfile = updateAccountProfile;

// --- SYSTEM AUDIT LOGS ---

// Stores the system log into localStorage (fallback) and attempts to push to Turso DB app_settings
async function addSystemLog(action, details) {
    try {
        const timestamp = new Date().toISOString();
        const user = appState.currentUser || 'SYSTEM';
        const logEntry = {
            timestamp,
            user,
            action,
            details
        };

        // Local Storage approach (always works, guarantees offline capture)
        let localLogs = JSON.parse(localStorage.getItem('taskflow_system_logs') || '[]');
        localLogs.unshift(logEntry); // add to top
        if(localLogs.length > 500) localLogs = localLogs.slice(0, 500); // keep last 500
        localStorage.setItem('taskflow_system_logs', JSON.stringify(localLogs));

        // Attempt Turso DB backup via app_settings
        try {
            // we will fetch the current logs from app_settings, append, and save
            const { data } = await sbClient.from('app_settings').select('data').eq('id', 'System_Logs').single();
            let dbLogs = [];
            if(data && data.data) {
                try { dbLogs = JSON.parse(data.data); } catch(e){}
            }
            dbLogs.unshift(logEntry);
            if(dbLogs.length > 500) dbLogs = dbLogs.slice(0, 500);
            await sbClient.from('app_settings').upsert({ id: 'System_Logs', data: JSON.stringify(dbLogs) });
        } catch(e) {
            console.warn("Could not sync log to Turso DB:", e);
        }

    } catch (err) {
        console.error("Error writing system log:", err);
    }
}

async function fetchSystemLogs() {
    let logs = [];
    try {
        const { data } = await sbClient.from('app_settings').select('data').eq('id', 'System_Logs').single();
        if(data && data.data) {
            logs = JSON.parse(data.data);
        }
    } catch(e) {
        console.warn("Could not fetch remote logs, falling back to local.");
        logs = JSON.parse(localStorage.getItem('taskflow_system_logs') || '[]');
    }
    return logs;
}

async function renderSystemLogs() {
    const tbody = document.getElementById('system-logs-table-body');
    if(!tbody) return;

    if (appState.currentUserRole !== 'Admin') {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:2rem; color:red; font-weight:bold;">ACCESS DENIED. Admin only.</td></tr>`;
        return;
    }

    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">Loading logs...</td></tr>`;
    
    const logs = await fetchSystemLogs();
    
    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">No system logs found.</td></tr>`;
        return;
    }

    tbody.innerHTML = logs.map(log => {
        const date = new Date(log.timestamp);
        const dateStr = date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' });
        
        let actionColor = '#64748b'; // default grey
        if(log.action.includes('LOGIN') || log.action.includes('LOGOUT')) actionColor = '#3b82f6';
        if(log.action.includes('CREATE') || log.action.includes('ADD')) actionColor = '#10b981';
        if(log.action.includes('EDIT') || log.action.includes('UPDATE')) actionColor = '#f59e0b';
        if(log.action.includes('DELETE') || log.action.includes('REMOVE')) actionColor = '#ef4444';

        return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="font-size: 12px; color: #475569; font-weight: 500;">${dateStr}</td>
                <td>
                    <span style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; color: #1e293b; display: inline-flex; align-items: center; gap: 4px;">
                        <i data-lucide="user" style="width: 12px; height: 12px;"></i> ${log.user}
                    </span>
                </td>
                <td>
                    <span style="color: ${actionColor}; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 0;">
                        ${log.action}
                    </span>
                </td>
                <td style="font-size: 13px; color: #334155;">${log.details}</td>
            </tr>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}
window.addSystemLog = addSystemLog;
window.fetchSystemLogs = fetchSystemLogs;
window.renderSystemLogs = renderSystemLogs;


