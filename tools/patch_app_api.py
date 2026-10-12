import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace adminAddUser
new_adminAddUser = """
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
"""

js = re.sub(r'function adminAddUser\(\)\s*\{[\s\S]*?renderAdminLogs\(\);\s*\}', new_adminAddUser.strip(), js)

# Replace deleteAdminUser
new_deleteAdminUser = """
async function deleteAdminUser(id, name) {
    if(!confirm(`Delete user ${name}?`)) return;
    try {
        await fetch(`http://localhost:3000/api/users/${id}`, { method: 'DELETE' });
        
        await fetch('http://localhost:3000/api/logs', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({user_id: appState.currentUser, action: 'DELETE_USER', details: `Deleted user ${name}`, timestamp: new Date().toISOString()})
        });

        renderAdminUsers();
        renderAdminLogs();
    } catch (e) {
        alert('Error: ' + e.message);
    }
}
"""

js = re.sub(r'function deleteAdminUser\(id, name\)\s*\{[\s\S]*?renderAdminLogs\(\);\s*\}', new_deleteAdminUser.strip(), js)

# Replace renderAdminUsers
new_renderAdminUsers = """
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
"""

js = re.sub(r'function renderAdminUsers\(\)\s*\{[\s\S]*?innerHTML = html;\s*\}', new_renderAdminUsers.strip(), js)

# Replace renderAdminLogs
new_renderAdminLogs = """
async function renderAdminLogs() {
    try {
        const res = await fetch('http://localhost:3000/api/logs');
        const logs = await res.json();
        appState.systemLogs = logs;
        const html = logs.map(l => `
            <div class="ledger-row" style="grid-template-columns:140px 150px 120px 1fr;">
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.8rem;">${new Date(l.timestamp).toLocaleString()}</div>
                <div style="font-weight:600;">${l.user_id}</div>
                <div><span class="badge badge-amber">${l.action}</span></div>
                <div>${l.details}</div>
            </div>
        `).join('');
        const container = document.getElementById('admin-logs-table-body');
        if(container) container.innerHTML = html;
    } catch (e) {
        console.error(e);
    }
}
"""

js = re.sub(r'function renderAdminLogs\(\)\s*\{[\s\S]*?innerHTML = html;\s*\}', new_renderAdminLogs.strip(), js)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)
