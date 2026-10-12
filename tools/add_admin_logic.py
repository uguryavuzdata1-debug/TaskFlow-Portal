import os

js_code = """
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

function renderAdminUsers() {
    const container = document.getElementById('admin-users-list');
    if (!container) return; // if element doesn't exist yet, we will create it in HTML later
    
    let html = '';
    adminUsers.forEach(u => {
        let tagClass = 'create';
        let tagColor = 'var(--green)';
        if(u.status !== 'ACTIVE') {
            tagClass = 'auth';
            tagColor = 'var(--amber)';
        }
        
        html += `
        <div class="ledger-row" style="grid-template-columns:1fr 1fr 150px 100px; align-items:center; padding:1rem;">
            <div style="font-weight:600;">${u.name}</div>
            <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">${u.role}</div>
            <span class="ledger-tag ${tagClass}" style="background:${tagColor}; color:var(--paper);">${u.status}</span>
            <a href="#" class="view-link" onclick="deleteAdminUser(${u.id})">Delete</a>
        </div>
        `;
    });
    container.innerHTML = html;
}

function adminAddUser() {
    const name = document.getElementById('admin-new-user-name').value;
    const role = document.getElementById('admin-new-user-role').value;
    const pwd = document.getElementById('admin-new-user-pass').value;
    
    if(!name) {
        showToast('Please enter a name', 'warning');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        name: name,
        role: role,
        status: 'ACTIVE'
    };
    
    adminUsers.push(newUser);
    systemLogs.unshift({
        time: new Date().toLocaleString(),
        user: 'Administrator',
        action: 'CREATE',
        details: `Created new user: ${name} (${role})`
    });
    
    document.getElementById('admin-new-user-name').value = '';
    renderAdminUsers();
    renderAdminLogs();
    showToast('Personnel added successfully', 'success');
}

function deleteAdminUser(id) {
    const user = adminUsers.find(u => u.id === id);
    if(user) {
        adminUsers = adminUsers.filter(u => u.id !== id);
        systemLogs.unshift({
            time: new Date().toLocaleString(),
            user: 'Administrator',
            action: 'DELETE',
            details: `Deleted user: ${user.name}`
        });
        renderAdminUsers();
        renderAdminLogs();
        showToast('User deleted', 'warning');
    }
}

function renderAdminLogs() {
    const container = document.getElementById('admin-logs-table-body');
    if(!container) return;
    
    let html = '';
    systemLogs.forEach(log => {
        let tagClass = 'auth';
        let tagColor = 'var(--amber)';
        let fontColor = 'var(--ink)';
        
        if (log.action === 'CREATE') { tagClass = 'create'; tagColor = 'var(--green)'; fontColor = 'var(--paper)'; }
        if (log.action === 'DELETE') { tagClass = 'delete'; tagColor = 'var(--clay)'; fontColor = 'var(--paper)'; }
        
        html += `
        <div class="ledger-row" style="grid-template-columns:140px 150px 120px 1fr; align-items:center; padding:1rem;">
            <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">${log.time}</div>
            <div style="font-weight:600;">${log.user}</div>
            <span class="ledger-tag ${tagClass}" style="background:${tagColor}; color:${fontColor};">${log.action}</span>
            <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--ink);">${log.details}</div>
        </div>
        `;
    });
    container.innerHTML = html;
}

// Render initially
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        renderAdminUsers();
        renderAdminLogs();
    }, 1000);
});

window.adminAddUser = adminAddUser;
window.deleteAdminUser = deleteAdminUser;
"""

with open('app.js', 'a', encoding='utf-8') as f:
    f.write(js_code)

# We need to update index.html to have the container IDs for these renders
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# For users list
users_old = """<div class="ledger-row" style="grid-template-columns:1fr 1fr 150px 100px; align-items:center; padding:1rem;">
                <div style="font-weight:600;">Ugur Yavuz</div>
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">Administrator</div>
                <span class="ledger-tag create" style="background:var(--green); color:var(--paper);">ACTIVE</span>
                <a class="view-link">Edit</a>
            </div>"""
html = html.replace(users_old, '<div id="admin-users-list"></div>')

# For logs list
logs_old = """<div class="ledger-row" style="grid-template-columns:140px 150px 120px 1fr; align-items:center; padding:1rem;">
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">2026-09-26 09:12</div>
                <div style="font-weight:600;">Ugur Yavuz</div>
                <span class="ledger-tag auth" style="background:var(--amber); color:var(--ink);">LOGIN</span>
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--ink);">Auth success via #VA-2026-0912</div>
              </div>
              <div class="ledger-row" style="grid-template-columns:140px 150px 120px 1fr; align-items:center; padding:1rem;">
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">2026-09-26 09:15</div>
                <div style="font-weight:600;">John Doe</div>
                <span class="ledger-tag create" style="background:var(--green); color:var(--paper);">CREATE</span>
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--ink);">New invoice #INV-4402 added</div>
              </div>
              <div class="ledger-row" style="grid-template-columns:140px 150px 120px 1fr; align-items:center; padding:1rem;">
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">2026-09-26 09:18</div>
                <div style="font-weight:600;">Ugur Yavuz</div>
                <span class="ledger-tag delete" style="background:var(--clay); color:var(--paper);">DELETE</span>
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--ink);">Removed legacy customer #ACCT-0012</div>
              </div>"""

html = html.replace(logs_old, '') # We already have id="admin-logs-table-body" above it from earlier edits!

# And another copy of logs_old exists in PANE 3.
logs_old_2 = """<div class="ledger-row" style="grid-template-columns:140px 150px 120px 1fr; align-items:center; padding:1rem;">
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">2026-09-26 09:12</div>
                <div style="font-weight:600;">Ugur Yavuz</div>
                <span class="ledger-tag auth" style="background:var(--amber); color:var(--ink);">LOGIN</span>
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--ink);">Auth success via #VA-2026-0912</div>
            </div>"""
html = html.replace(logs_old_2, '<div id="admin-logs-table-body-2"></div>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
