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
    if (pane === 'status' && typeof renderAdminSystemStatus === 'function') renderAdminSystemStatus();
    if (window.lucide) lucide.createIcons();
}
window.showAdminPane = showAdminPane;


// ============================================================
// HELPER: USER ORIGIN BADGE (TASKFLOW vs VTIGER CRM)
// ============================================================
function getUserOrigin(u) {
    if (!u) return { type: 'taskflow', badgeHtml: '<span class="badge-user-origin badge-user-taskflow"><i data-lucide="zap" style="width:11px;height:11px;"></i> TASKFLOW</span>' };
    var id = String(u.id || '');
    var name = (u.full_name || u.username || '').toLowerCase();
    var vtNames = ['ismail administrator', 'ugur yavuz', 'ahmet baltaci', 'ibrahim ahmet', 'alpay burc', 'ugur isikcevahir', 'osman akgul', 'support user'];
    if (id.startsWith('19x') || vtNames.indexOf(name) !== -1 || (u.source && u.source.toLowerCase() === 'vtiger')) {
        return {
            type: 'vtiger',
            label: 'VTIGER CRM',
            icon: 'refresh-cw',
            badgeHtml: '<span class="badge-user-origin badge-user-vtiger"><i data-lucide="refresh-cw" style="width:11px;height:11px;"></i> VTIGER CRM</span>'
        };
    }
    return {
        type: 'taskflow',
        label: 'TASKFLOW',
        icon: 'zap',
        badgeHtml: '<span class="badge-user-origin badge-user-taskflow"><i data-lucide="zap" style="width:11px;height:11px;"></i> TASKFLOW</span>'
    };
}
window.getUserOrigin = getUserOrigin;

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
        var origin = getUserOrigin(u);
        var uid   = (u.id || '').toString().replace(/'/g, '');
        var safeKey = (u.username || u.full_name || u.id || '').replace(/'/g, '');
        return '<div class="ledger-row" style="grid-template-columns:1fr 1fr 150px 100px; align-items:center;">'
            + '<div>'
            +   '<div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">'
            +     '<span style="font-weight:600;color:var(--ink);font-size:0.9rem;">' + name + '</span>'
            +     origin.badgeHtml
            +   '</div>'
            +   '<div style="font-family:IBM Plex Mono,monospace;font-size:0.72rem;color:var(--steel);margin-top:2px;">' + (username ? ('@' + username) : '') + '</div>'
            + '</div>'
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
        var origin   = getUserOrigin(u);

        return '<tr style="border-bottom:1px solid var(--paper);">'
            + '<td style="padding:1rem;">'
            +   '<div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">'
            +     '<span style="font-weight:600; color:var(--ink); font-size:0.9rem;">' + fullName + '</span>'
            +     origin.badgeHtml
            +   '</div>'
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
// ROLE SETTINGS & ACCESS - SUB-SECTION TAB SWITCHER
// ============================================================
function showRoleSubSection(tabName, btn) {
    document.querySelectorAll('.role-sub-pane').forEach(function(pane) {
        pane.style.display = 'none';
    });
    document.querySelectorAll('.role-sub-btn').forEach(function(b) {
        b.style.borderColor = 'var(--line, #cbd5e1)';
        b.style.background = 'var(--card, #ffffff)';
        b.style.color = 'var(--steel, #64748b)';
        b.classList.remove('active');
    });
    var target = document.getElementById('role-sub-' + tabName);
    if (target) {
        target.style.display = 'block';
    }
    if (btn) {
        btn.style.borderColor = 'var(--ink, #1d2430)';
        btn.style.background = 'var(--ink, #1d2430)';
        btn.style.color = 'var(--card, #ffffff)';
        btn.classList.add('active');
    }
    if (tabName === 'assignment' || tabName === 'overview') {
        if (typeof renderAdminRolesList === 'function') renderAdminRolesList();
    }
    if (window.lucide) lucide.createIcons();
}
window.showRoleSubSection = showRoleSubSection;

function adminFilterPersonnelRoles(query) {
    var q = (query || '').toLowerCase().trim();
    var rows = document.querySelectorAll('#admin-roles-user-table-body tr');
    rows.forEach(function(row) {
        var text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
}
window.adminFilterPersonnelRoles = adminFilterPersonnelRoles;

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
        var origin = getUserOrigin({ username: log.user, full_name: log.user });
        return '<div class="ledger-row" style="grid-template-columns:140px 170px 110px 1fr; align-items:center;">'
            + '<div class="ledger-ts">' + (log.ts || '—') + '</div>'
            + '<div class="ledger-user" style="display:flex; align-items:center; gap:0.4rem;"><span>' + (log.user || '—') + '</span>' + (log.user !== 'SYSTEM' ? origin.badgeHtml : '') + '</div>'
            + '<div><span class="ledger-tag ' + tagClass + '">' + (log.action || '—') + '</span></div>'
            + '<div class="ledger-detail">' + (log.detail || '—') + '</div>'
            + '</div>';
    }).join('');

    if (window.lucide) lucide.createIcons();
}
window.renderAdminLogs = renderAdminLogs;

// ============================================================
// PERFORMANCE SUB-SECTION SWITCHER
// ============================================================
function showPerfSubSection(tabName, btn) {
    document.querySelectorAll('.perf-sub-pane').forEach(function(p) { p.style.display = 'none'; });
    document.querySelectorAll('.perf-sub-btn').forEach(function(b) {
        b.style.borderColor = 'var(--line, #cbd5e1)';
        b.style.background = 'var(--card, #ffffff)';
        b.style.color = 'var(--steel, #64748b)';
        b.classList.remove('active');
    });
    var target = document.getElementById('perf-sub-' + tabName);
    if (target) target.style.display = 'block';
    if (btn) {
        btn.style.borderColor = 'var(--ink, #1d2430)';
        btn.style.background = 'var(--ink, #1d2430)';
        btn.style.color = 'var(--card, #ffffff)';
        btn.classList.add('active');
    }
    if (tabName === 'tickets') {
        renderTicketPerformanceMetrics();
    }
    if (window.lucide) lucide.createIcons();
}
window.showPerfSubSection = showPerfSubSection;

// ============================================================
// TICKET PERFORMANCE METRICS (Today, Week, Month, All-Time)
// ============================================================
function renderTicketPerformanceMetrics() {
    var tickets = (window.appState && Array.isArray(window.appState.tickets) && window.appState.tickets.length > 0)
        ? window.appState.tickets
        : ((window.appState && Array.isArray(window.appState.tursoTickets)) ? window.appState.tursoTickets : []);

    // Direct fetch fallback if tickets is 0
    if (tickets.length === 0 && window.tursoExecute) {
        window.tursoExecute("SELECT id, ticket_no, ticket_title, parent_id, ticketstatus, createdtime FROM vt_tickets ORDER BY createdtime DESC")
            .then(function(dbTickets) {
                if (dbTickets && dbTickets.length > 0) {
                    var mapped = dbTickets.map(function(t) {
                        var realStatus = t.ticketstatus || 'Open';
                        var isClosed = realStatus.toLowerCase() === 'closed';
                        return {
                            id: String(t.id),
                            dbId: String(t.id).slice(-5),
                            crmTicket: t.ticket_no || ('TT' + t.id),
                            ticket_no: t.ticket_no || ('TT' + t.id),
                            timestamp: t.createdtime || new Date().toISOString(),
                            createdtime: t.createdtime || '',
                            company: 'Customer',
                            companyId: t.parent_id,
                            status: realStatus,
                            price: 0,
                            invoiced: isClosed,
                            paymentStatus: isClosed ? 'Completed' : 'Pending'
                        };
                    });
                    if (window.appState) {
                        window.appState.tickets = mapped;
                        window.appState.tursoTickets = mapped;
                    }
                    renderTicketPerformanceMetrics();
                }
            }).catch(function(err) {
                console.warn('[renderTicketPerformanceMetrics] fetch fallback error:', err);
            });
    }

    var now = new Date();
    var todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    var currentYearMonth = now.toISOString().slice(0, 7); // YYYY-MM
    var oneWeekAgoMs = now.getTime() - (7 * 24 * 60 * 60 * 1000);

    function isClosed(status) {
        if (!status) return false;
        var s = String(status).toLowerCase().trim();
        return s === 'closed' || s === 'tamamlandı' || s === 'completed' || s === 'resolved';
    }

    function parseTicketDate(t) {
        var dStr = t.createdtime || t.created_time || t.created_at || t.timestamp || t.date || '';
        if (!dStr) return null;
        var normalized = dStr.includes(' ') && !dStr.includes('T') ? dStr.replace(' ', 'T') : dStr;
        var d = new Date(normalized);
        return isNaN(d.getTime()) ? null : d;
    }

    var stats = {
        today: { open: 0, closed: 0 },
        week:  { open: 0, closed: 0 },
        month: { open: 0, closed: 0 },
        all:   { open: 0, closed: 0 }
    };

    var statusCounts = {};

    tickets.forEach(function(t) {
        var closed = isClosed(t.status);
        var sName = t.status || 'Open';
        statusCounts[sName] = (statusCounts[sName] || 0) + 1;

        // All time
        stats.all.open++;
        if (closed) stats.all.closed++;

        var d = parseTicketDate(t);
        if (d) {
            var dIso = d.toISOString();
            var dDateStr = dIso.slice(0, 10);
            var dMonthStr = dIso.slice(0, 7);

            // Today
            if (dDateStr === todayStr) {
                stats.today.open++;
                if (closed) stats.today.closed++;
            }

            // This week (last 7 days)
            if (d.getTime() >= oneWeekAgoMs) {
                stats.week.open++;
                if (closed) stats.week.closed++;
            }

            // This month
            if (dMonthStr === currentYearMonth) {
                stats.month.open++;
                if (closed) stats.month.closed++;
            }
        }
    });

    function calcRate(open, closed) {
        if (open === 0) return '0%';
        return Math.round((closed / open) * 100) + '%';
    }

    // Populate DOM cards
    var elTodayOpen   = document.getElementById('perf-ticket-today-open');
    var elTodayClosed = document.getElementById('perf-ticket-today-closed');
    var elTodayRate   = document.getElementById('perf-ticket-today-rate');
    if (elTodayOpen)   elTodayOpen.textContent   = stats.today.open;
    if (elTodayClosed) elTodayClosed.textContent = stats.today.closed;
    if (elTodayRate)   elTodayRate.textContent   = calcRate(stats.today.open, stats.today.closed);

    var elWeekOpen   = document.getElementById('perf-ticket-week-open');
    var elWeekClosed = document.getElementById('perf-ticket-week-closed');
    var elWeekRate   = document.getElementById('perf-ticket-week-rate');
    if (elWeekOpen)   elWeekOpen.textContent   = stats.week.open;
    if (elWeekClosed) elWeekClosed.textContent = stats.week.closed;
    if (elWeekRate)   elWeekRate.textContent   = calcRate(stats.week.open, stats.week.closed);

    var elMonthOpen   = document.getElementById('perf-ticket-month-open');
    var elMonthClosed = document.getElementById('perf-ticket-month-closed');
    var elMonthRate   = document.getElementById('perf-ticket-month-rate');
    if (elMonthOpen)   elMonthOpen.textContent   = stats.month.open;
    if (elMonthClosed) elMonthClosed.textContent = stats.month.closed;
    if (elMonthRate)   elMonthRate.textContent   = calcRate(stats.month.open, stats.month.closed);

    var elAllOpen   = document.getElementById('perf-ticket-all-open');
    var elAllClosed = document.getElementById('perf-ticket-all-closed');
    var elAllRate   = document.getElementById('perf-ticket-all-rate');
    if (elAllOpen)   elAllOpen.textContent   = stats.all.open;
    if (elAllClosed) elAllClosed.textContent = stats.all.closed;
    if (elAllRate)   elAllRate.textContent   = calcRate(stats.all.open, stats.all.closed);

    // Render Status Breakdown List
    var breakdownEl = document.getElementById('perf-ticket-status-breakdown');
    if (breakdownEl) {
        var totalTickets = tickets.length || 1;
        var keys = Object.keys(statusCounts);
        if (keys.length === 0) {
            breakdownEl.innerHTML = '<div style="font-size:0.8rem; color:var(--steel); text-align:center; padding:1rem;">No status data available.</div>';
        } else {
            breakdownEl.innerHTML = keys.map(function(status) {
                var count = statusCounts[status];
                var pct = Math.round((count / totalTickets) * 100);
                var isDone = isClosed(status);
                var barColor = isDone ? 'var(--green, #10b981)' : 'var(--blue, #2563eb)';
                return '<div style="margin-bottom:0.75rem;">'
                    + '<div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">'
                    +   '<span style="font-weight:600; color:var(--ink);">' + status + '</span>'
                    +   '<span style="font-family:IBM Plex Mono,monospace; color:var(--steel);">' + count + ' (' + pct + '%)</span>'
                    + '</div>'
                    + '<div style="height:6px; background:var(--paper, #f1f5f9); border-radius:3px; overflow:hidden;">'
                    +   '<div style="width:' + pct + '%; height:100%; background:' + barColor + '; border-radius:3px; transition:width 0.4s ease;"></div>'
                    + '</div>'
                    + '</div>';
            }).join('');
        }
    }
}
window.renderTicketPerformanceMetrics = renderTicketPerformanceMetrics;

// ============================================================
// PERFORMANCE PANE - SYSTEM & TICKET METRICS
// ============================================================
function renderAdminPerformance() {
    var apiEl = document.getElementById('perf-api-time');
    var dbEl  = document.getElementById('perf-db-load');
    var sessEl = document.getElementById('perf-sessions');
    var chartEl = document.getElementById('perf-chart-area');

    if (apiEl) apiEl.textContent = 'Testing...';
    if (dbEl)  dbEl.textContent  = '—';
    if (sessEl) sessEl.textContent = '1';

    // Ping Turso DB to measure response
    var pingStart = Date.now();
    if (window.sbClient && typeof window.sbClient.from === 'function') {
        window.sbClient.from('users').select('id').limit(1)
            .then(function() {
                var ms = Date.now() - pingStart;
                if (apiEl) apiEl.textContent = ms + 'ms';
                if (apiEl) apiEl.style.color = ms < 200 ? 'var(--green)' : ms < 500 ? 'var(--amber)' : 'var(--clay)';

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
    }

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

    // Also compute tickets metrics
    renderTicketPerformanceMetrics();

    if (window.lucide) lucide.createIcons();
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

// ============================================================
// SYSTEM OPERATIONS & ACTIVITY OVERVIEW
// Mirrors daily/weekly/monthly/yearly operational reports
// ============================================================
window.currentStatusPeriod = 'daily';

function setSystemStatusPeriod(period, btn) {
    window.currentStatusPeriod = period;
    document.querySelectorAll('.status-period-btn').forEach(function(b) {
        b.style.background = 'transparent';
        b.style.color = 'var(--steel)';
        b.classList.remove('active');
    });
    if (btn) {
        btn.style.background = 'var(--ink)';
        btn.style.color = 'var(--card)';
        btn.classList.add('active');
    }

    var titles = {
        daily: 'TaskFlow Operations Report – Today',
        weekly: 'TaskFlow Operations Report – This Week (Last 7 Days)',
        monthly: 'TaskFlow Operations Report – This Month',
        yearly: 'TaskFlow Operations Report – Yearly & All-Time'
    };
    var titleEl = document.getElementById('status-current-period-title');
    if (titleEl) titleEl.textContent = titles[period] || 'TaskFlow Operations Report';

    renderAdminSystemStatus(period);
}
window.setSystemStatusPeriod = setSystemStatusPeriod;

function matchesStatusPeriod(dStr, period) {
    if (!dStr) return period === 'yearly';

    // Direct date string comparison (handles YYYY-MM-DD cleanly)
    var datePart = String(dStr).trim().slice(0, 10);
    var now = new Date();
    var todayUTC = now.toISOString().slice(0, 10);
    var todayLocal = now.toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

    if (period === 'daily') {
        return datePart === todayUTC || datePart === todayLocal;
    }

    var cleanDStr = String(dStr).includes('T') ? dStr : String(dStr).replace(' ', 'T');
    var d = new Date(cleanDStr);
    if (isNaN(d.getTime())) return period === 'yearly';

    if (period === 'weekly') {
        var oneWeekAgoMs = now.getTime() - (7 * 24 * 60 * 60 * 1000);
        return d.getTime() >= oneWeekAgoMs;
    } else if (period === 'monthly') {
        var currentMonth = todayLocal.slice(0, 7);
        var currentMonthUTC = todayUTC.slice(0, 7);
        var dMonth = datePart.slice(0, 7);
        return dMonth === currentMonth || dMonth === currentMonthUTC;
    } else if (period === 'yearly') {
        return true;
    }
    return true;
}

function renderAdminSystemStatus(period) {
    period = period || window.currentStatusPeriod || 'daily';

    var tickets = (window.appState && Array.isArray(window.appState.tickets)) ? window.appState.tickets : [];
    var customers = (window.appState && Array.isArray(window.appState.customers)) ? window.appState.customers : [];
    var records = (window.appState && Array.isArray(window.appState.records)) ? window.appState.records : [];
    var appointments = (window.appState && Array.isArray(window.appState.appointments)) ? window.appState.appointments : [];
    var quotes = (window.appState && Array.isArray(window.appState.quotes)) ? window.appState.quotes : [];

    // Filter by period
    var filteredTickets = tickets.filter(function(t) {
        var dStr = t.created_time || t.createdtime || t.created_at || t.modifiedtime || t.timestamp || t.date;
        return matchesStatusPeriod(dStr, period);
    });

    var filteredRecords = records.filter(function(r) {
        var dStr = r.created_at || r.updated_at || r.date;
        return matchesStatusPeriod(dStr, period);
    });

    var filteredCustomers = customers.filter(function(c) {
        var dStr = c.created_time || c.createdtime || c.created_at;
        return matchesStatusPeriod(dStr, period);
    });

    var filteredAppointments = appointments.filter(function(a) {
        var dStr = a.date_start || a.createdtime || a.created_at;
        return matchesStatusPeriod(dStr, period);
    });

    var filteredQuotes = quotes.filter(function(q) {
        var dStr = q.createdtime || q.modifiedtime || q.created_at;
        return matchesStatusPeriod(dStr, period);
    });

    // Update 4 Summary Stat Cards
    var elCountTickets = document.getElementById('status-count-tickets');
    var elCountServices = document.getElementById('status-count-services');
    var elCountCustomers = document.getElementById('status-count-customers');
    var elCountQuotesAppts = document.getElementById('status-count-quotes-appts');

    if (elCountTickets) elCountTickets.textContent = filteredTickets.length;
    if (elCountServices) elCountServices.textContent = filteredRecords.length;
    if (elCountCustomers) elCountCustomers.textContent = filteredCustomers.length;
    if (elCountQuotesAppts) elCountQuotesAppts.textContent = (filteredQuotes.length + filteredAppointments.length);

    var periodLabels = {
        daily: 'Today',
        weekly: 'This week',
        monthly: 'This month',
        yearly: 'Yearly / All-Time'
    };
    var pLabel = periodLabels[period] || 'In selected period';
    var elDescTickets = document.getElementById('status-desc-tickets');
    var elDescServices = document.getElementById('status-desc-services');
    var elDescCustomers = document.getElementById('status-desc-customers');
    var elDescQuotesAppts = document.getElementById('status-desc-quotes-appts');
    if (elDescTickets) elDescTickets.textContent = pLabel + ' ticket volume';
    if (elDescServices) elDescServices.textContent = pLabel + ' billable jobs';
    if (elDescCustomers) elDescCustomers.textContent = pLabel + ' accounts';
    if (elDescQuotesAppts) elDescQuotesAppts.textContent = filteredQuotes.length + ' quotes, ' + filteredAppointments.length + ' appts';

    // 1. Status Breakdown
    var statusCounts = {};
    var techCounts = {};

    filteredTickets.forEach(function(t) {
        var st = (t.ticketstatus || t.status || 'Open').trim();
        statusCounts[st] = (statusCounts[st] || 0) + 1;

        var tech = (t.user || t.assigned_user_id || t.assigned_to || 'Unassigned').trim();
        techCounts[tech] = (techCounts[tech] || 0) + 1;
    });

    var statusContainer = document.getElementById('status-breakdown-container');
    if (statusContainer) {
        var totalT = filteredTickets.length || 1;
        var stKeys = Object.keys(statusCounts);
        if (stKeys.length === 0) {
            statusContainer.innerHTML = '<div style="font-size:0.8rem; color:var(--steel); text-align:center; padding:1.5rem;">No tickets recorded for this period.</div>';
        } else {
            statusContainer.innerHTML = stKeys.map(function(st) {
                var c = statusCounts[st];
                var pct = Math.round((c / totalT) * 100);
                var isDone = st.toLowerCase().includes('closed') || st.toLowerCase().includes('completed') || st.toLowerCase().includes('tamamlandı');
                var isProg = st.toLowerCase().includes('progress');
                var color = isDone ? '#16a34a' : isProg ? '#2563eb' : '#d97706';
                var bg = isDone ? 'rgba(22,163,74,0.1)' : isProg ? 'rgba(37,99,235,0.1)' : 'rgba(217,119,6,0.1)';
                var icon = isDone ? '✅' : isProg ? '⏳' : '📌';

                return '<div style="margin-bottom:0.85rem;">'
                    + '<div style="display:flex; justify-content:space-between; align-items:center; font-size:0.82rem; margin-bottom:4px;">'
                    +   '<span style="font-weight:600; color:var(--ink); display:flex; align-items:center; gap:5px;">'
                    +     '<span>' + icon + '</span> <span>' + st + '</span>'
                    +   '</span>'
                    +   '<span style="font-family:IBM Plex Mono,monospace; font-weight:700; color:' + color + '; background:' + bg + '; padding:2px 8px; border-radius:12px; font-size:0.75rem;">' + c + ' (' + pct + '%)</span>'
                    + '</div>'
                    + '<div style="height:6px; background:var(--paper, #f1f5f9); border-radius:3px; overflow:hidden;">'
                    +   '<div style="width:' + pct + '%; height:100%; background:' + color + '; border-radius:3px;"></div>'
                    + '</div>'
                    + '</div>';
            }).join('');
        }
    }

    // 2. Staff Workload Breakdown
    var techContainer = document.getElementById('status-technicians-container');
    if (techContainer) {
        var techKeys = Object.keys(techCounts).sort(function(a, b) { return techCounts[b] - techCounts[a]; });
        if (techKeys.length === 0) {
            techContainer.innerHTML = '<div style="font-size:0.8rem; color:var(--steel); text-align:center; padding:1.5rem;">No technician dispatches in this timeframe.</div>';
        } else {
            techContainer.innerHTML = techKeys.map(function(tech) {
                var c = techCounts[tech];
                var origin = getUserOrigin({ username: tech, full_name: tech });
                return '<div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.8rem; background:var(--paper); border:1px solid var(--line); border-radius:4px; margin-bottom:6px;">'
                    + '<div style="display:flex; align-items:center; gap:8px;">'
                    +   '<i data-lucide="user" style="width:14px; height:14px; color:var(--steel);"></i>'
                    +   '<span style="font-weight:600; font-size:0.85rem; color:var(--ink);">' + tech + '</span>'
                    +   origin.badgeHtml
                    + '</div>'
                    + '<div style="font-family:IBM Plex Mono,monospace; font-weight:700; font-size:0.82rem; color:var(--ink);">' + c + ' ticket' + (c > 1 ? 's' : '') + '</div>'
                    + '</div>';
            }).join('');
        }
    }

    // 3. Ticket Feed
    var feedContainer = document.getElementById('status-tickets-feed');
    var feedCountEl = document.getElementById('status-feed-count');
    if (feedContainer) {
        var displayTickets = filteredTickets.slice(0, 20); // Top 20 recent
        if (feedCountEl) feedCountEl.textContent = 'Showing ' + displayTickets.length + ' of ' + filteredTickets.length + ' tickets';

        if (displayTickets.length === 0) {
            feedContainer.innerHTML = '<div style="padding:2rem 1rem; text-align:center; font-family:IBM Plex Mono,monospace; font-size:0.8rem; color:var(--steel); border:1px dashed var(--line); border-radius:4px;">No tickets found for ' + pLabel.toLowerCase() + '.</div>';
        } else {
            feedContainer.innerHTML = displayTickets.map(function(t, idx) {
                var num = idx + 1;
                var tNo = t.ticket_no || t.id || ('TT-' + num);
                var title = t.ticket_title || t.title || 'Untitled Ticket';
                var cust = t.organization_name || t.company || t.customer_name || 'Customer Account';
                var tech = t.assigned_user_id || t.assigned_to || 'Unassigned';
                var st = t.ticketstatus || t.status || 'Open';
                var isDone = st.toLowerCase().includes('closed') || st.toLowerCase().includes('completed') || st.toLowerCase().includes('tamamlandı');
                var stIcon = isDone ? '✅' : '⏳';
                var stColor = isDone ? 'var(--green)' : 'var(--blue)';

                return '<div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 1rem; background:var(--card); border:1px solid var(--line); border-left:3px solid ' + stColor + '; border-radius:2px; flex-wrap:wrap; gap:0.5rem;">'
                    + '<div>'
                    +   '<div style="display:flex; align-items:center; gap:8px;">'
                    +     '<span style="font-family:IBM Plex Mono,monospace; font-weight:700; font-size:0.8rem; color:var(--blue);">' + tNo + '</span>'
                    +     '<span style="font-weight:600; font-size:0.88rem; color:var(--ink);">' + title + '</span>'
                    +   '</div>'
                    +   '<div style="font-size:0.75rem; color:var(--steel); margin-top:3px; display:flex; align-items:center; gap:12px; flex-wrap:wrap;">'
                    +     '<span>🏢 ' + cust + '</span>'
                    +     '<span>👤 ' + tech + '</span>'
                    +   '</div>'
                    + '</div>'
                    + '<div style="display:flex; align-items:center; gap:8px;">'
                    +   '<span style="font-family:IBM Plex Mono,monospace; font-size:0.72rem; font-weight:700; padding:2px 8px; border-radius:12px; border:1px solid ' + stColor + '; color:' + stColor + ';">' + stIcon + ' ' + st + '</span>'
                    + '</div>'
                    + '</div>';
            }).join('');
        }
    }

    // Update Last Sync Timestamp
    var lastSyncEl = document.getElementById('status-last-sync-time');
    if (lastSyncEl) {
        var nowStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        lastSyncEl.textContent = 'Last Sync: ' + nowStr + ' (Turso libSQL & Vtiger CRM)';
    }

    if (window.lucide) lucide.createIcons();
}
window.renderAdminSystemStatus = renderAdminSystemStatus;

// Trigger Manual Sync & Refresh View
async function triggerManualSync() {
    if (typeof showToast === 'function') showToast('Synchronizing with Turso DB & CRM...', 'info');
    try {
        if (typeof window.fetchAppData === 'function') {
            await window.fetchAppData();
        } else if (typeof fetchAppData === 'function') {
            await fetchAppData();
        }
        if (typeof window.updateSyncStatusBadge === 'function') {
            await window.updateSyncStatusBadge();
        }
        renderAdminSystemStatus(window.currentStatusPeriod);
        if (typeof showToast === 'function') showToast('System status refreshed with latest data! ✅', 'success');
        if (typeof addSystemLog === 'function') addSystemLog('UPDATE', 'Admin manually triggered System Status & CRM sync.');
    } catch(e) {
        console.warn('Manual sync error:', e);
        renderAdminSystemStatus(window.currentStatusPeriod);
        if (typeof showToast === 'function') showToast('Sync completed with local cached state.', 'warning');
    }
}
window.triggerManualSync = triggerManualSync;

// Automatically refresh System Status on sync events
window.addEventListener('taskflow:sync-complete', function() {
    if (typeof renderAdminSystemStatus === 'function') {
        renderAdminSystemStatus(window.currentStatusPeriod);
    }
});
