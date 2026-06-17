window.handleLogin = handleLogin;
window.logout = logout;

async function handleLogin() {
    if (!appState) {
        console.error("AppState not initialized yet.");
        return;
    }
    const user = document.getElementById('login-username').value.trim().toUpperCase();
    const pass = document.getElementById('login-password').value;
    
    if (!user || !pass) { 
        if (typeof showToast === 'function') showToast('Please enter username and password.', 'error'); 
        else alert('Please enter username and password.');
        return; 
    }
    
    // Master bypass for ADMIN (Temporary until Auth is fully linked)
    if (user === 'ADMIN' && (pass === 'admin' || pass === '1234')) {
        console.log("Master bypass triggered");
        appState.currentUser = 'ADMIN';
        appState.currentUserRole = 'Admin';
        appState.currentUserData = { full_name: 'System Admin', role: 'Admin' };
        
        finishLogin();
        return;
    } 

    const auth = appState.settings?.users_auth || {};
    let userData = auth[user] || auth[user.toLowerCase()] || Object.values(auth).find(u => u.email?.toUpperCase() === user || (u.full_name && u.full_name.toUpperCase() === user));

    if (!userData) {
        console.error("User not found in auth list:", user);
        if (typeof showToast === 'function') showToast('User not found.', 'error');
        return;
    }

    if (userData.password !== pass) {
        if (typeof showToast === 'function') showToast('Incorrect password.', 'error');
        return;
    }

    if (userData.active === false) {
        if (typeof showToast === 'function') showToast('Account is deactivated.', 'error');
        return;
    }

    appState.currentUser = userData.username || user;
    appState.currentUserRole = userData.role || 'User';
    appState.currentUserData = userData;
    
    finishLogin();
}

function finishLogin() {
    document.getElementById('login-screen').classList.add('hidden');
    document.body.classList.remove('is-logged-out');
    
    const nav = document.getElementById('main-nav');
    if (nav) nav.classList.remove('hidden');
    const main = document.getElementById('main-content');
    if (main) main.classList.remove('hidden');

    const rememberMe = document.getElementById('login-remember');
    if (rememberMe && rememberMe.checked) {
        localStorage.setItem('taskflow_user', appState.currentUser);
    } else {
        localStorage.removeItem('taskflow_user');
    }
    
    if (document.getElementById('current-user-name')) {
        document.getElementById('current-user-name').innerText = appState.currentUserData?.full_name || appState.currentUser;
    }
    
    // Log the login event
    if (typeof addSystemLog === 'function') {
        addSystemLog('LOGIN', `User ${appState.currentUser} logged into the system.`);
    }

    if (typeof showToast === 'function') showToast(`Welcome back, ${appState.currentUser}!`, 'success');
    
    // Switch to appropriate view based on role
    if (appState.currentUserRole === 'User') {
        if (typeof showTab === 'function') showTab('dataview');
        
        if (document.getElementById('btn-dashboard')) document.getElementById('btn-dashboard').style.display = 'none';
        if (document.getElementById('btn-customers')) document.getElementById('btn-customers').style.display = 'none';
        if (document.getElementById('btn-invoices')) document.getElementById('btn-invoices').style.display = 'none';
    } else {
        if (typeof showTab === 'function') showTab('dashboard');
        
        if (document.getElementById('btn-dashboard')) document.getElementById('btn-dashboard').style.display = 'flex';
        if (document.getElementById('btn-customers')) document.getElementById('btn-customers').style.display = 'flex';
        if (document.getElementById('btn-invoices')) document.getElementById('btn-invoices').style.display = 'flex';
    }

    // Render Lucide icons after nav is visible
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function logout() {
    // Log the logout event
    if (typeof addSystemLog === 'function' && appState.currentUser) {
        addSystemLog('LOGOUT', `User ${appState.currentUser} logged out of the system.`);
    }

    appState.currentUser = null;
    appState.currentUserRole = null;
    appState.currentUserData = null;
    appState.activeTab = 'dashboard';
    
    document.getElementById('login-screen').classList.remove('hidden');
    document.body.classList.add('is-logged-out');
    
    const nav = document.getElementById('main-nav');
    if (nav) nav.classList.add('hidden');
    const main = document.getElementById('main-content');
    if (main) main.classList.add('hidden');
    
    localStorage.removeItem('taskflow_user');
    
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    
    // Clean up modals and UI states
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    
    if (typeof showToast === 'function') showToast('Logged out successfully', 'success');
}
