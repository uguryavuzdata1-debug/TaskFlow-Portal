// ============================================================
// ADMIN PANEL - TAB SWITCHING
// ============================================================
function showAdminPane(pane, btn) {
    document.querySelectorAll('.admin-pane').forEach(function(p) { p.style.display = 'none'; });
    document.querySelectorAll('.admin-tab-btn').forEach(function(b) {
        b.style.borderBottomColor = 'transparent';
        b.style.color = 'var(--steel)';
    });
    var target = document.getElementById('admin-pane-' + pane);
    if (target) target.style.display = 'block';
    if (btn) {
        btn.style.borderBottomColor = 'var(--ink)';
        btn.style.color = 'var(--ink)';
    }
    if (pane === 'users') renderAdminUsersList();
    if (pane === 'roles') {
        if (typeof renderAdminRolesList === 'function') renderAdminRolesList();
    }
    if (pane === 'logs') {
        if (typeof renderAdminLogs === 'function') renderAdminLogs();
        else if (typeof renderSystemLogs === 'function') renderSystemLogs();
    }
    if (pane === 'performance' && typeof renderAdminPerformance === 'function') renderAdminPerformance();
    if (window.lucide) lucide.createIcons();
}
window.showAdminPane = showAdminPane;


// ============================================================
// RENDER ACTIVE PERSONNEL DIRECTORY
// ============================================================
function renderAdminUsersList() {
    var container = document.getElementById('admin-users-list');
    if (!container) return;
    var auth = (appState && appState.settings && appState.settings.users_auth) ? appState.settings.users_auth : {};
    var userMap = {};
    Object.values(auth).forEach(function(u) {
        if (u && (u.id || u.email)) {
            var key = u.id || u.email;
            userMap[key] = u;
        }
    });
    var users = Object.values(userMap);
    if (users.length === 0) {
        // Try async fetch from Turso if available
        if (window.turso && typeof window.turso.getUsers === 'function') {
            window.turso.getUsers().then(function(dbUsers) {
                if (dbUsers && dbUsers.length > 0) {
                    if (!appState.settings.users_auth) appState.settings.users_auth = {};
                    dbUsers.forEach(function(u) {
                        var uname = u.username || (u.full_name ? u.full_name.toLowerCase().replace(/\s+/g, '') : u.id);
                        var userObj = {
                            id: u.id,
                            username: uname,
                            role: u.role || 'User',
                            full_name: u.full_name,
                            password: u.password || '1234'
                        };
                        appState.settings.users_auth[uname] = userObj;
                        if (u.full_name) appState.settings.users_auth[u.full_name] = userObj;
                    });
                    renderAdminUsersList();
                }
            });
        }
        container.innerHTML = '<div style="padding:2rem 1rem; text-align:center; font-family:IBM Plex Mono,monospace; font-size:0.8rem; color:var(--steel);">No personnel records found. Add a user above.</div>';
        return;
    }
    var roleColors = {
        'Admin':      { color: '#b91c1c', label: 'ADMIN' },
        'Accounting': { color: '#047857', label: 'FINANCE' },
        'User':       { color: '#1d4ed8', label: 'TECHNICIAN' }
    };
    container.innerHTML = users.map(function(u) {
        var name  = u.full_name || u.username || '-';
        var username = u.username || (u.id ? u.id : '');
        var role  = u.role || 'User';
        var badge = roleColors[role] || { color: 'var(--steel)', label: role.toUpperCase() };
        var uid   = (u.id || '').toString().replace(/'/g, '');
        var safeKey = (u.username || u.full_name || u.id || '').replace(/'/g, '');
        return '<div class="ledger-row" style="grid-template-columns:1fr 1fr 150px 100px; align-items:center;">'
            + '<div><div style="font-weight:600;color:var(--ink);font-size:0.9rem;">' + name + '</div>'
            + '<div style="font-family:IBM Plex Mono,monospace;font-size:0.72rem;color:var(--steel);">' + (username ? ('@' + username) : '') + '</div></div>'
            + '<div style="font-size:0.85rem;color:var(--ink);">' + role + '</div>'
            + '<div><span style="font-family:IBM Plex Mono,monospace;font-size:0.65rem;font-weight:600;border-radius:20px;padding:2px 10px;border:1.5px solid ' + badge.color + ';color:' + badge.color + ';">' + badge.label + '</span></div>'
            + '<div style="text-align:right;"><button onclick="adminRemoveUser(\'' + uid + '\',\'' + safeKey + '\')" style="font-family:IBM Plex Mono,monospace;font-size:0.7rem;color:#b91c1c;background:transparent;border:1px solid #b91c1c;padding:3px 10px;border-radius:2px;cursor:pointer;">Remove</button></div>'
            + '</div>';
    }).join('');

    var adminCount   = users.filter(function(u) { return u.role === 'Admin'; }).length;
    var userCount    = users.filter(function(u) { return u.role === 'User'; }).length;
    var financeCount = users.filter(function(u) { return u.role === 'Accounting'; }).length;
    var elAdmin   = document.getElementById('roles-admin-count');
    var elUser    = document.getElementById('roles-user-count');
    var elFinance = document.getElementById('roles-finance-count');
    if (elAdmin)   elAdmin.textContent   = adminCount   + ' USER' + (adminCount   !== 1 ? 'S' : '') + ' IN ROLE';
    if (elUser)    elUser.textContent    = userCount    + ' USER' + (userCount    !== 1 ? 'S' : '') + ' IN ROLE';
    if (elFinance) elFinance.textContent = financeCount + ' USER' + (financeCount !== 1 ? 'S' : '') + ' IN ROLE';

    if (window.lucide) lucide.createIcons();
}
window.renderAdminUsersList = renderAdminUsersList;

// ============================================================
// AUTHORIZE & ADD - New User
// ============================================================
async function adminAddUser() {
    var nameInput  = document.getElementById('admin-new-user-name');
    var roleSelect = document.getElementById('admin-new-user-role');
    var passInput  = document.getElementById('admin-new-user-pass');

    if (!nameInput || !roleSelect || !passInput) {
        if (typeof showToast === 'function') showToast('Form fields not found.', 'error');
        return;
    }

    var name     = nameInput.value.trim();
    var roleName = roleSelect.value;
    var pass     = passInput.value.trim() || '1234';

    if (!name) {
        if (typeof showToast === 'function') showToast('Please enter a full name.', 'error');
        nameInput.focus();
        return;
    }

    var username = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');

    var btn = document.querySelector('[onclick="adminAddUser()"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Adding...'; }

    try {
        var userId = 'U-' + Date.now();
        if (window.turso && typeof window.turso.addUser === 'function') {
            await window.turso.addUser({
                id: userId,
                full_name: name,
                username: username,
                role: roleName,
                status: 'ACTIVE',
                password: pass
            });
        }

        // Update local state
        if (!appState.settings.users_auth) appState.settings.users_auth = {};
        var newUserObj = {
            id:        userId,
            username:  username,
            full_name: name,
            role:      roleName,
            password:  pass,
            status:    'ACTIVE'
        };
        appState.settings.users_auth[username] = newUserObj;
        appState.settings.users_auth[name] = newUserObj;

        if (!appState.settings.personnel) appState.settings.personnel = [];
        if (appState.settings.personnel.indexOf(name) === -1) {
            appState.settings.personnel.push(name);
        }

        nameInput.value = '';
        passInput.value = '1234';

        if (typeof showToast === 'function') showToast(name + ' başarıyla eklendi!', 'success');
        if (typeof showAlert === 'function') showAlert('Personnel Added', name + ' has been added as ' + roleName + '.', '✅');

        renderAdminUsersList();

    } catch (e) {
        console.error('[adminAddUser] Error:', e);
        var msg = (e && e.message) ? e.message : 'Unknown error.';
        if (typeof showToast === 'function') showToast(msg, 'error');
        if (typeof showAlert === 'function') showAlert('Error', msg, '');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Authorize & Add'; }
    }
}
window.adminAddUser = adminAddUser;

// ============================================================
// REMOVE USER
// ============================================================
async function adminRemoveUser(userId, nameOrUsername) {
    if (!confirm('Remove user "' + nameOrUsername + '" from Turso DB?')) return;
    try {
        if (userId && window.turso && typeof window.turso.removeUser === 'function') {
            await window.turso.removeUser(userId);
        }
        if (appState.settings.users_auth) {
            delete appState.settings.users_auth[nameOrUsername];
        }
        if (appState.settings.personnel) {
            appState.settings.personnel = appState.settings.personnel.filter(function(p) { return p !== nameOrUsername; });
        }
        if (typeof showToast === 'function') showToast('User "' + nameOrUsername + '" removed.', 'success');
        renderAdminUsersList();
    } catch(e) {
        if (typeof showToast === 'function') showToast('Could not remove: ' + e.message, 'error');
    }
}
window.adminRemoveUser = adminRemoveUser;

// ============================================================
// ROLE SETTINGS & ACCESS - RENDER PERSONNEL ROLES LIST
// ============================================================
async function renderAdminRolesList() {
    var tbody = document.getElementById('admin-roles-user-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--steel); font-family:IBM Plex Mono,monospace;">Fetching personnel from Turso DB...</td></tr>';

    var users = [];
    try {
        if (window.turso && typeof window.turso.getUsers === 'function') {
            users = await window.turso.getUsers();
        }
    } catch (e) {
        console.warn('[renderAdminRolesList] Turso error:', e);
    }

    // Fallback to appState.settings.users_auth if DB returned empty
    if (!users || users.length === 0) {
        var auth = (appState && appState.settings && appState.settings.users_auth) ? appState.settings.users_auth : {};
        var userMap = {};
        Object.values(auth).forEach(function(u) {
            if (u && (u.id || u.username || u.full_name)) {
                var k = u.id || u.username;
                userMap[k] = u;
            }
        });
        users = Object.values(userMap);
    }

    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--steel); font-family:IBM Plex Mono,monospace;">No personnel found. Add personnel in the Personnel tab.</td></tr>';
        return;
    }

    // Update counts
    var adminCount   = users.filter(function(u) { return (u.role || '').toLowerCase() === 'admin'; }).length;
    var userCount    = users.filter(function(u) { return (u.role || '').toLowerCase() === 'user'; }).length;
    var financeCount = users.filter(function(u) { return (u.role || '').toLowerCase() === 'accounting'; }).length;
    var elAdmin   = document.getElementById('roles-admin-count');
    var elUser    = document.getElementById('roles-user-count');
    var elFinance = document.getElementById('roles-finance-count');
    if (elAdmin)   elAdmin.textContent   = adminCount   + ' USER' + (adminCount   !== 1 ? 'S' : '') + ' IN ROLE';
    if (elUser)    elUser.textContent    = userCount    + ' USER' + (userCount    !== 1 ? 'S' : '') + ' IN ROLE';
    if (elFinance) elFinance.textContent = financeCount + ' USER' + (financeCount !== 1 ? 'S' : '') + ' IN ROLE';

    var roleBadges = {
        'Admin':      { color: '#b91c1c', bg: 'rgba(185,28,28,0.08)', label: 'ADMINISTRATOR' },
        'Accounting': { color: '#047857', bg: 'rgba(4,120,87,0.08)',  label: 'ACCOUNTING & FINANCE' },
        'User':       { color: '#1d4ed8', bg: 'rgba(29,78,216,0.08)', label: 'FIELD TECHNICIAN' }
    };

    tbody.innerHTML = users.map(function(u) {
        var uid      = String(u.id || '').replace(/'/g, '');
        var fullName = u.full_name || u.username || 'Personnel';
        var username = u.username || (u.id ? u.id : '');
        var role     = u.role || 'User';
        var badge    = roleBadges[role] || { color: 'var(--steel)', bg: 'rgba(100,116,139,0.08)', label: role.toUpperCase() };

        return '<tr style="border-bottom:1px solid var(--paper);">'
            + '<td style="padding:1rem;">'
            +   '<div style="font-weight:600; color:var(--ink); font-size:0.9rem;">' + fullName + '</div>'
            +   '<div style="font-family:IBM Plex Mono,monospace; font-size:0.72rem; color:var(--steel); margin-top:2px;">' + (username ? ('@' + username) : '') + '</div>'
            + '</td>'
            + '<td style="padding:1rem;">'
            +   '<span style="font-family:IBM Plex Mono,monospace; font-size:0.7rem; font-weight:700; padding:4px 10px; border-radius:3px; border:1px solid ' + badge.color + '; color:' + badge.color + '; background:' + badge.bg + ';">' + badge.label + '</span>'
            + '</td>'
            + '<td style="padding:1rem;">'
            +   '<select id="role-select-' + uid + '" style="padding:6px 10px; border:1px solid var(--ink); border-radius:2px; font-family:IBM Plex Sans,sans-serif; font-size:0.85rem; background:var(--card); color:var(--ink); cursor:pointer;">'
            +     '<option value="Admin"' + (role === 'Admin' ? ' selected' : '') + '>Administrator (Full Access)</option>'
            +     '<option value="Accounting"' + (role === 'Accounting' ? ' selected' : '') + '>Accounting & Finance (Billing & Ledger)</option>'
            +     '<option value="User"' + (role === 'User' ? ' selected' : '') + '>Field Technician (Field Operations)</option>'
            +   '</select>'
            + '</td>'
            + '<td style="padding:1rem; text-align:right;">'
            +   '<button id="role-btn-' + uid + '" onclick="adminChangeUserRole(\'' + uid + '\', \'' + fullName.replace(/'/g, "\\'") + '\')" class="ticket-btn primary" style="padding:6px 14px; font-size:0.78rem; font-weight:600; cursor:pointer;">Update Role</button>'
            + '</td>'
            + '</tr>';
    }).join('');

    if (typeof adminLoadRoleSettings === 'function') {
        adminLoadRoleSettings();
    }

    if (window.lucide) lucide.createIcons();
}
window.renderAdminRolesList = renderAdminRolesList;

// ============================================================
// ADMIN CHANGE USER ROLE
// ============================================================
async function adminChangeUserRole(userId, userName) {
    var selectEl = document.getElementById('role-select-' + userId);
    var btnEl    = document.getElementById('role-btn-' + userId);
    if (!selectEl) return;

    var newRole = selectEl.value;
    if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Saving...'; }

    try {
        if (window.turso && typeof window.turso.updateUserRole === 'function') {
            await window.turso.updateUserRole(userId, newRole);
        } else if (window.turso && typeof window.turso.execute === 'function') {
            await window.turso.execute('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);
        } else if (window.sbClient) {
            await sbClient.from('users').update({ role: newRole }).eq('id', userId);
        }

        // Update local state
        if (appState && appState.settings && appState.settings.users_auth) {
            Object.values(appState.settings.users_auth).forEach(function(u) {
                if (u && (u.id === userId || u.username === userName || u.full_name === userName)) {
                    u.role = newRole;
                }
            });
        }

        // If updated user is currently logged-in user, update active role
        if (appState && appState.currentUserData && appState.currentUserData.id === userId) {
            appState.currentUserRole = newRole;
            appState.currentUserData.role = newRole;
            var dispRole = document.getElementById('settings-display-role');
            if (dispRole) dispRole.innerText = newRole;
            var dropRole = document.getElementById('dropdown-role');
            if (dropRole) dropRole.innerText = newRole;
        }

        if (typeof showToast === 'function') {
            showToast(userName + ' rolü "' + newRole + '" olarak güncellendi! ✅', 'success');
        }

        if (typeof addSystemLog === 'function') {
            addSystemLog('UPDATE', 'User role updated: ' + userName + ' -> ' + newRole);
        }

        // Refresh views
        renderAdminRolesList();
        if (typeof renderAdminUsersList === 'function') renderAdminUsersList();

    } catch (e) {
        console.error('[adminChangeUserRole] Error:', e);
        var msg = (e && e.message) ? e.message : 'Could not update role.';
        if (typeof showToast === 'function') showToast(msg, 'error');
    } finally {
        if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Update Role'; }
    }
}
window.adminChangeUserRole = adminChangeUserRole;

// ============================================================
// ADMIN SAVE / LOAD ROLE PERMISSIONS SETTINGS
// ============================================================
async function adminSaveRoleSettings() {
    var btn = document.getElementById('btn-save-role-settings');
    if (btn) { btn.disabled = true; btn.innerHTML = 'Saving...'; }

    var perms = {
        acc_calendar:   document.getElementById('perm-acc-calendar') ? document.getElementById('perm-acc-calendar').checked : true,
        user_calendar:  document.getElementById('perm-user-calendar') ? document.getElementById('perm-user-calendar').checked : true,
        acc_customers:  document.getElementById('perm-acc-customers') ? document.getElementById('perm-acc-customers').checked : true,
        user_customers: document.getElementById('perm-user-customers') ? document.getElementById('perm-user-customers').checked : true,
        acc_invoices:   document.getElementById('perm-acc-invoices') ? document.getElementById('perm-acc-invoices').checked : true,
        user_invoices:  document.getElementById('perm-user-invoices') ? document.getElementById('perm-user-invoices').checked : false,
        acc_pricing:    document.getElementById('perm-acc-pricing') ? document.getElementById('perm-acc-pricing').checked : true,
        user_pricing:   document.getElementById('perm-user-pricing') ? document.getElementById('perm-user-pricing').checked : false,
        updated_at:     new Date().toISOString()
    };

    try {
        var jsonStr = JSON.stringify(perms);
        if (window.turso && typeof window.turso.execute === 'function') {
            await window.turso.execute(
                'INSERT INTO app_settings (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=CURRENT_TIMESTAMP',
                ['role_permissions', jsonStr]
            );
        }

        if (window.appState) {
            if (!window.appState.settings) window.appState.settings = {};
            window.appState.settings.role_permissions = perms;
        }

        if (typeof showToast === 'function') showToast('Role permissions saved successfully! ✅', 'success');
        if (typeof addSystemLog === 'function') addSystemLog('UPDATE', 'Admin updated module role permissions.');
    } catch(e) {
        console.error('[adminSaveRoleSettings] Error:', e);
        if (typeof showToast === 'function') showToast('Could not save role permissions: ' + e.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="shield-check" style="width:14px; height:14px; vertical-align:middle; margin-right:4px;"></i> Save Role Settings';
            if (window.lucide) lucide.createIcons();
        }
    }
}
window.adminSaveRoleSettings = adminSaveRoleSettings;

async function adminLoadRoleSettings() {
    try {
        var rows = [];
        if (window.turso && typeof window.turso.execute === 'function') {
            rows = await window.turso.execute('SELECT data FROM app_settings WHERE id = ?', ['role_permissions']);
        }
        if (rows && rows.length > 0 && rows[0].data) {
            var data = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;
            if (document.getElementById('perm-acc-calendar') && data.acc_calendar !== undefined)
                document.getElementById('perm-acc-calendar').checked = Boolean(data.acc_calendar);
            if (document.getElementById('perm-user-calendar') && data.user_calendar !== undefined)
                document.getElementById('perm-user-calendar').checked = Boolean(data.user_calendar);
            if (document.getElementById('perm-acc-customers') && data.acc_customers !== undefined)
                document.getElementById('perm-acc-customers').checked = Boolean(data.acc_customers);
            if (document.getElementById('perm-user-customers') && data.user_customers !== undefined)
                document.getElementById('perm-user-customers').checked = Boolean(data.user_customers);
            if (document.getElementById('perm-acc-invoices') && data.acc_invoices !== undefined)
                document.getElementById('perm-acc-invoices').checked = Boolean(data.acc_invoices);
            if (document.getElementById('perm-user-invoices') && data.user_invoices !== undefined)
                document.getElementById('perm-user-invoices').checked = Boolean(data.user_invoices);
            if (document.getElementById('perm-acc-pricing') && data.acc_pricing !== undefined)
                document.getElementById('perm-acc-pricing').checked = Boolean(data.acc_pricing);
            if (document.getElementById('perm-user-pricing') && data.user_pricing !== undefined)
                document.getElementById('perm-user-pricing').checked = Boolean(data.user_pricing);
        }
    } catch(e) {
        console.warn('[adminLoadRoleSettings] Failed to load role permissions:', e);
    }
}
window.adminLoadRoleSettings = adminLoadRoleSettings;

// Activate first tab on load
document.addEventListener('DOMContentLoaded', function() {
    var firstTab = document.querySelector('.admin-tab-btn');
    if (firstTab) {
        firstTab.style.borderBottomColor = 'var(--ink)';
        firstTab.style.color = 'var(--ink)';
    }
});

// ============================================================
// SYSTEM LOGS PANE - render into admin-logs-table-body
// ============================================================
function renderAdminLogs() {
    var container = document.getElementById('admin-logs-table-body');
    if (!container) return;

    // Try to get logs from appState or localStorage
    var logs = [];
    if (window.appSystemLogs && Array.isArray(window.appSystemLogs)) {
        logs = window.appSystemLogs;
    }

    if (logs.length === 0) {
        // Generate recent login entry as a starter log
        var now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        var user = (appState && appState.currentUser) ? appState.currentUser : 'ADMIN';
        logs = [
            { ts: now, user: user, action: 'LOGIN', detail: 'User logged into TaskFlow Portal' },
            { ts: now, user: 'SYSTEM', action: 'INIT', detail: 'Application initialized, data loaded from Turso DB' }
        ];
    }

    container.innerHTML = logs.map(function(log) {
        var tagClass = log.action === 'LOGIN' ? 'auth'
                     : log.action === 'CREATE' ? 'create'
                     : log.action === 'UPDATE' ? 'update'
                     : log.action === 'DELETE' ? 'delete' : 'auth';
        return '<div class="ledger-row" style="grid-template-columns:140px 150px 120px 1fr; align-items:start;">'
            + '<div class="ledger-ts">' + (log.ts || '—') + '</div>'
            + '<div class="ledger-user">' + (log.user || '—') + '</div>'
            + '<div><span class="ledger-tag ' + tagClass + '">' + (log.action || '—') + '</span></div>'
            + '<div class="ledger-detail">' + (log.detail || '—') + '</div>'
            + '</div>';
    }).join('');
}
window.renderAdminLogs = renderAdminLogs;

// ============================================================
// PERFORMANCE PANE - render metrics
// ============================================================
function renderAdminPerformance() {
    // API response time test
    var start = Date.now();
    var apiEl = document.getElementById('perf-api-time');
    var dbEl  = document.getElementById('perf-db-load');
    var sessEl = document.getElementById('perf-sessions');
    var chartEl = document.getElementById('perf-chart-area');

    if (apiEl) apiEl.textContent = 'Testing...';
    if (dbEl)  dbEl.textContent  = '—';
    if (sessEl) sessEl.textContent = '1';

    // Ping Turso DB to measure response
    var pingStart = Date.now();
    sbClient.from('users').select('id').limit(1)
        .then(function() {
            var ms = Date.now() - pingStart;
            if (apiEl) apiEl.textContent = ms + 'ms';
            if (apiEl) apiEl.style.color = ms < 200 ? 'var(--green)' : ms < 500 ? 'var(--amber)' : 'var(--clay)';

            // DB load estimate
            var ticketCount = (appState && appState.tickets) ? appState.tickets.length : 0;
            var custCount = (appState && appState.customers) ? appState.customers.length : 0;
            if (dbEl) {
                dbEl.textContent = (ticketCount + custCount) + ' rows';
                dbEl.style.color = 'var(--blue)';
            }
        })
        .catch(function() {
            if (apiEl) { apiEl.textContent = 'Offline'; apiEl.style.color = 'var(--clay)'; }
        });

    // Chart area: simple stat summary
    if (chartEl) {
        var tickets = (appState && appState.tickets) ? appState.tickets.length : 0;
        var customers = (appState && appState.customers) ? appState.customers.length : 0;
        var users = (appState && appState.settings && appState.settings.users_auth) ? Object.keys(appState.settings.users_auth).length : 0;
        chartEl.innerHTML = '<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem; text-align:center;">'
            + '<div><div style="font-family:IBM Plex Mono,monospace;font-size:0.7rem;color:var(--steel);margin-bottom:0.5rem;">TOTAL TICKETS</div><div style="font-size:2.5rem;font-weight:700;color:var(--blue);">' + tickets + '</div></div>'
            + '<div><div style="font-family:IBM Plex Mono,monospace;font-size:0.7rem;color:var(--steel);margin-bottom:0.5rem;">TOTAL CUSTOMERS</div><div style="font-size:2.5rem;font-weight:700;color:var(--green);">' + customers + '</div></div>'
            + '<div><div style="font-family:IBM Plex Mono,monospace;font-size:0.7rem;color:var(--steel);margin-bottom:0.5rem;">ACTIVE USERS</div><div style="font-size:2.5rem;font-weight:700;color:var(--ink);">' + users + '</div></div>'
            + '</div>';
    }
}
window.renderAdminPerformance = renderAdminPerformance;

// Hook into global addSystemLog to capture logs
window.appSystemLogs = window.appSystemLogs || [];
var _origAddSystemLog = window.addSystemLog;
window.addSystemLog = function(action, description) {
    var ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
    var user = (appState && appState.currentUser) ? appState.currentUser : 'SYSTEM';
    window.appSystemLogs.unshift({ ts: ts, user: user, action: action.toUpperCase(), detail: description });
    if (window.appSystemLogs.length > 100) window.appSystemLogs.pop();
    if (typeof _origAddSystemLog === 'function') _origAddSystemLog(action, description);
};
