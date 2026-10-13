window.handleLogin = handleLogin;
window.logout = logout;
window.toggleUserProfileDropdown = toggleUserProfileDropdown;
window.togglePrefPanel = togglePrefPanel;
window.savePrefAvatar = savePrefAvatar;
window.savePrefName = savePrefName;
window.savePrefPassword = savePrefPassword;
window.savePrefEmail = savePrefEmail;

// ============================================================
// KULLANICI PROFİL DROPDOWN MENÜSÜ
// Sağ üst köşedeki "System Admin" ismine tıklanınca açılır/kapanır
// ============================================================
function toggleUserProfileDropdown() {
    const dropdown = document.getElementById('user-profile-dropdown');
    if (!dropdown) return;

    // Dropdown kapalıysa aç, açıksa kapat
    const isHidden = dropdown.classList.contains('hidden');

    if (isHidden) {
        dropdown.classList.remove('hidden');
        // Dışarı tıklanınca otomatik kapanması için bir kez dinleyici ekle
        setTimeout(() => {
            document.addEventListener('click', closeDropdownOnOutsideClick, { once: true });
        }, 10);
    } else {
        dropdown.classList.add('hidden');
    }
}

// Dropdown dışına tıklanınca menüyü kapat
function closeDropdownOnOutsideClick(e) {
    const wrapper = document.querySelector('.user-profile-dropdown-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        const dropdown = document.getElementById('user-profile-dropdown');
        if (dropdown) dropdown.classList.add('hidden');
    }
}

// ============================================================
// MY PREFERENCES SAYFASI - PANEL TOGGLE
// Her butona basılınca ilgili formu açar, diğerlerini kapatır
// ============================================================
function togglePrefPanel(panelName) {
    // Tüm panel ID'leri
    const panels = ['avatar', 'name', 'password', 'email'];

    panels.forEach(p => {
        const el = document.getElementById('pref-panel-' + p);
        if (!el) return;
        if (p === panelName) {
            // Tıklanan paneli aç/kapat (toggle)
            el.classList.toggle('hidden');
        } else {
            // Diğerlerini her zaman kapat
            el.classList.add('hidden');
        }
    });

    // İsim formuna mevcut ismi otomatik doldur
    if (panelName === 'name') {
        const inp = document.getElementById('pref-new-name');
        if (inp && appState?.currentUserData?.full_name) {
            inp.value = appState.currentUserData.full_name;
        }
    }

    // E-posta formuna mevcut e-postayı doldur
    if (panelName === 'email') {
        const inp = document.getElementById('pref-new-email');
        if (inp && appState?.currentUserData?.email) {
            inp.value = appState.currentUserData.email;
        }
    }

    // Lucide ikonlarını yenile (form açıldığında görünmesi için)
    if (window.lucide) lucide.createIcons();
}

// ============================================================
// MY PREFERENCES SAYFASI - SAYFA DOLDURMA
// Sayfaya girildiğinde kullanıcı bilgilerini tabloya yazar
// ============================================================
function renderPreferencesPage() {
    let u = appState?.currentUserData;
    if (!u || !u.full_name) {
        const auth = appState?.settings?.users_auth || {};
        const curr = appState?.currentUser;
        if (curr && auth[curr]) u = auth[curr];
        else if (curr && auth[curr.toLowerCase()]) u = auth[curr.toLowerCase()];
        else {
            u = Object.values(auth).find(x => x && (x.username === curr || x.full_name === curr || x.id === curr || (curr === 'ADMIN' && x.role === 'Admin'))) || {};
        }
        if (u && u.full_name) appState.currentUserData = u;
    }
    u = u || {};
    const fullName = u.full_name || appState?.currentUser || '—';
    const firstName = fullName.split(' ')[0];
    const role = u.role || appState?.currentUserRole || '—';
    const email = u.email || '—';
    const isAdmin = (role === 'Admin' || appState?.currentUserRole === 'Admin') ? 'Yes' : 'No';

    // Üst başlık alanı
    const dispName = document.getElementById('settings-display-fullname');
    if (dispName) dispName.innerText = fullName;
    const dispRole = document.getElementById('settings-display-role');
    if (dispRole) dispRole.innerText = role;

    // Bilgi tablosu satırları
    const fields = {
        'settings-username': fullName,
        'settings-firstname': firstName,
        'settings-email': email,
        'settings-role': role,
        'settings-admin': isAdmin,
        'settings-status': 'Active'
    };
    Object.entries(fields).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    });

    // Avatar baş harfini güncelle
    const letter = document.getElementById('pref-avatar-letter');
    if (letter) letter.innerText = (appState?.currentUser || 'A').charAt(0).toUpperCase();

    // Eğer avatar URL varsa resmi göster
    if (u.avatar_url) {
        const img = document.getElementById('pref-avatar-img');
        const ltr = document.getElementById('pref-avatar-letter');
        if (img) { img.src = u.avatar_url; img.style.display = 'block'; }
        if (ltr) ltr.style.display = 'none';
    }
}
window.renderPreferencesPage = renderPreferencesPage;

// ============================================================
// MY PREFERENCES - AVATAR KAYDET
// Girilen URL'yi Turso DB'ye kaydeder, sayfada anında gösterir
// ============================================================
async function savePrefAvatar() {
    const url = document.getElementById('pref-avatar-url')?.value?.trim();
    if (!url) { showToast('Lütfen bir resim linki girin.', 'error'); return; }

    const u = appState?.currentUserData;
    if (!u?.id) { showToast('Kullanıcı verisi bulunamadı.', 'error'); return; }

    try {
        // Turso users tablosuna avatar_url yaz
        const { error } = await sbClient.from('users').update({ avatar_url: url }).eq('id', u.id);
        if (error) throw error;

        // Lokal state'i güncelle
        appState.currentUserData.avatar_url = url;

        // Sayfadaki avatar kutusunu anında güncelle
        const img  = document.getElementById('pref-avatar-img');
        const ltr  = document.getElementById('pref-avatar-letter');
        if (img) { img.src = url; img.style.display = 'block'; }
        if (ltr) ltr.style.display = 'none';

        // Sağ üstteki navbar avatar'ını da güncelle
        const navAvatar = document.getElementById('current-user-avatar');
        if (navAvatar) navAvatar.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;

        showToast('Avatar güncellendi! 🎉', 'success');
        togglePrefPanel('avatar'); // Formu kapat
    } catch(e) {
        console.error(e);
        showToast('Avatar kaydedilemedi: ' + e.message, 'error');
    }
}

// ============================================================
// MY PREFERENCES - İSİM KAYDET
// Yeni tam adı Turso DB'ye kaydeder, arayüzü anında günceller
// ============================================================
async function savePrefName() {
    const newName = document.getElementById('pref-new-name')?.value?.trim();
    if (!newName) { showToast('İsim boş olamaz.', 'error'); return; }

    let u = appState?.currentUserData;
    let userId = u?.id;
    if (!userId) {
        const auth = appState?.settings?.users_auth || {};
        const match = Object.values(auth).find(x => x.username === appState.currentUser || x.full_name === appState.currentUser || (x.email && x.email === appState.currentUser));
        if (match && match.id) {
            userId = match.id;
            appState.currentUserData = match;
        }
    }
    if (!userId) userId = 'U-001';

    try {
        if (window.turso && typeof window.turso.execute === 'function') {
            await window.turso.execute('UPDATE users SET full_name = ? WHERE id = ?', [newName, userId]);
        } else {
            await sbClient.from('users').update({ full_name: newName }).eq('id', userId);
        }

        // Lokal state güncelle
        if (!appState.currentUserData) appState.currentUserData = {};
        appState.currentUserData.full_name = newName;
        appState.currentUserData.first_name = newName.split(' ')[0];
        appState.currentUser = newName;

        if (appState.settings && appState.settings.users_auth) {
            appState.settings.users_auth[newName] = appState.currentUserData;
            appState.settings.users_auth[newName.toLowerCase()] = appState.currentUserData;
        }
        if (appState.settings && Array.isArray(appState.settings.personnel)) {
            var oldIdx = appState.settings.personnel.indexOf(appState.currentUser);
            if (oldIdx !== -1) appState.settings.personnel[oldIdx] = newName;
            else if (appState.settings.personnel.indexOf(newName) === -1) appState.settings.personnel.push(newName);
        }

        // Sayfadaki tüm isim alanlarını anında güncelle
        ['settings-display-fullname', 'settings-username', 'current-user-name', 'dropdown-full-name'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = newName;
        });
        const firstName = newName.split(' ')[0];
        ['settings-firstname', 'dropdown-first-name'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = firstName;
        });

        // Hero karşılama yazısını güncelle
        const hg = document.getElementById('hero-greeting');
        if (hg) {
            const hour = new Date().getHours();
            let greeting = hour < 12 ? 'Good morning' : (hour < 18 ? 'Good afternoon' : 'Good evening');
            hg.innerText = `${greeting}, ${firstName} 👋`;
        }

        showToast('İsim başarıyla güncellendi! ✅', 'success');
        togglePrefPanel('name'); // Formu kapat
        if (typeof renderPreferencesPage === 'function') renderPreferencesPage();
    } catch(e) {
        console.error(e);
        showToast('İsim kaydedilemedi: ' + e.message, 'error');
    }
}

// ============================================================
// MY PREFERENCES - E-POSTA KAYDET
// ============================================================
async function savePrefEmail() {
    const newEmail = document.getElementById('pref-new-email')?.value?.trim();
    if (!newEmail) { showToast('Lütfen bir e-posta adresi girin.', 'error'); return; }

    let u = appState?.currentUserData;
    let userId = u?.id;
    if (!userId) {
        const auth = appState?.settings?.users_auth || {};
        const match = Object.values(auth).find(x => x.username === appState.currentUser || x.full_name === appState.currentUser);
        if (match && match.id) userId = match.id;
    }
    if (!userId) userId = 'U-001';

    try {
        if (window.turso && typeof window.turso.execute === 'function') {
            await window.turso.execute('UPDATE users SET email = ? WHERE id = ?', [newEmail, userId]);
        } else {
            await sbClient.from('users').update({ email: newEmail }).eq('id', userId);
        }

        if (appState.currentUserData) appState.currentUserData.email = newEmail;

        const emailEl = document.getElementById('settings-email');
        if (emailEl) emailEl.innerText = newEmail;

        showToast('E-posta başarıyla güncellendi! ✅', 'success');
        togglePrefPanel('email');
    } catch(e) {
        console.error(e);
        showToast('E-posta kaydedilemedi: ' + e.message, 'error');
    }
}

// ============================================================
// MY PREFERENCES - ŞİFRE KAYDET
// Default şifre 1234'tür. Kullanıcı istediği zaman şifresini değiştirebilir.
// ============================================================
async function savePrefPassword() {
    const newPass     = document.getElementById('pref-new-pass')?.value;
    const confirmPass = document.getElementById('pref-confirm-pass')?.value;

    if (!newPass || !confirmPass) { showToast('Lütfen her iki alanı da doldurun.', 'error'); return; }
    if (newPass !== confirmPass)  { showToast('Şifreler eşleşmiyor!', 'error'); return; }
    if (newPass.length < 4)       { showToast('Şifre en az 4 karakter olmalı.', 'error'); return; }

    let u = appState?.currentUserData;
    let userId = u?.id;
    if (!userId) {
        const auth = appState?.settings?.users_auth || {};
        const match = Object.values(auth).find(x => x.username === appState.currentUser || x.full_name === appState.currentUser);
        if (match && match.id) {
            userId = match.id;
            appState.currentUserData = match;
        }
    }
    if (!userId) userId = 'U-001';

    try {
        if (window.turso && typeof window.turso.execute === 'function') {
            await window.turso.execute('UPDATE users SET password = ?, password_hash = ? WHERE id = ?', [newPass, newPass, userId]);
        } else {
            await sbClient.from('users')
                .update({ password: newPass, password_hash: newPass })
                .eq('id', userId);
        }

        // Lokal state güncelle
        if (appState.currentUserData) appState.currentUserData.password = newPass;
        if (appState.settings && appState.settings.users_auth) {
            Object.values(appState.settings.users_auth).forEach(function(u) {
                if (u && (u.id === userId || u.username === appState.currentUser || u.full_name === appState.currentUser)) {
                    u.password = newPass;
                }
            });
        }

        // Form alanlarını temizle
        document.getElementById('pref-new-pass').value = '';
        document.getElementById('pref-confirm-pass').value = '';
        togglePrefPanel('password');

        showToast('Şifreniz başarıyla değiştirildi! ✅', 'success');
    } catch(e) {
        console.error(e);
        showToast('Şifre kaydedilemedi: ' + e.message, 'error');
    }
}


async function handleLogin() {
    if (!appState) {
        console.error("AppState not initialized yet.");
        return;
    }
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value;
    
    if (!user || !pass) { 
        if (typeof showToast === 'function') showToast('Please enter username and password.', 'error'); 
        else alert('Please enter username and password.');
        return; 
    }

    const userUpper = user.toUpperCase();

    // Publish login event to the bus
    if (window.globalEventBus) {
        window.globalEventBus.publish({
            type: 'login_requested',
            payload: { username: user }
        });
    }
    
    // Master bypass for ADMIN
    if (userUpper === 'ADMIN' && (pass === 'admin' || pass === '1234')) {
        console.log("Master bypass triggered");
        appState.currentUser = 'ADMIN';
        appState.currentUserRole = 'Admin';
        appState.currentUserData = { id: 'U-001', username: 'admin', full_name: 'System Admin', role: 'Admin' };
        
        finishLogin();
        return;
    } 

    const auth = appState.settings?.users_auth || {};
    let userData = auth[user] || auth[user.toLowerCase()] || auth[userUpper] || Object.values(auth).find(u => 
        (u.username && u.username.toUpperCase() === userUpper) ||
        (u.full_name && u.full_name.toUpperCase() === userUpper) ||
        (u.email && u.email.toUpperCase() === userUpper)
    );

    // If not found in memory, query Turso DB directly
    if (!userData && window.turso && typeof window.turso.getUsers === 'function') {
        try {
            const dbUsers = await window.turso.getUsers();
            if (dbUsers && dbUsers.length > 0) {
                const match = dbUsers.find(u => 
                    (u.username && u.username.toUpperCase() === userUpper) ||
                    (u.full_name && u.full_name.toUpperCase() === userUpper) ||
                    (u.email && u.email.toUpperCase() === userUpper)
                );
                if (match) {
                    userData = {
                        id: match.id,
                        username: match.username || (match.full_name ? match.full_name.toLowerCase().replace(/\s+/g, '') : match.id),
                        full_name: match.full_name,
                        role: match.role || 'User',
                        password: match.password || '1234',
                        status: match.status || 'ACTIVE'
                    };
                    if (!appState.settings.users_auth) appState.settings.users_auth = {};
                    appState.settings.users_auth[userData.username] = userData;
                    appState.settings.users_auth[userData.username.toLowerCase()] = userData;
                    if (userData.full_name) {
                        appState.settings.users_auth[userData.full_name] = userData;
                    }
                }
            }
        } catch (err) {
            console.warn('[handleLogin] Turso fallback query error:', err);
        }
    }

    if (!userData) {
        console.error("User not found in auth list:", user);
        if (typeof showToast === 'function') showToast('User not found.', 'error');
        return;
    }

    const expectedPass = userData.password || '1234';
    if (expectedPass !== pass) {
        if (typeof showToast === 'function') showToast('Incorrect password.', 'error');
        return;
    }

    if (userData.active === false || userData.status === 'INACTIVE') {
        if (typeof showToast === 'function') showToast('Account is deactivated.', 'error');
        return;
    }

    appState.currentUser = userData.full_name || userData.username || user;
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
    
    // Update dashboard hero greeting
    const hg = document.getElementById('hero-greeting');
    if (hg) {
        const hour = new Date().getHours();
        let greeting = 'Good evening';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        
        let displayName = appState.currentUserData?.first_name || (appState.currentUserData?.full_name ? appState.currentUserData.full_name.split(' ')[0] : appState.currentUser);
        if (appState.currentUser.toUpperCase().includes('ADMIN') || (appState.currentUserRole && appState.currentUserRole.toUpperCase().includes('ADMIN'))) {
            displayName = 'Admin';
        }
        
        hg.innerText = `${greeting}, ${displayName} 👋`;
    }
    
    // Setup Profile Dropdown Fields
    const fn = document.getElementById('dropdown-full-name');
    if (fn) fn.innerText = appState.currentUserData?.full_name || appState.currentUser;
    const firstName = document.getElementById('dropdown-first-name');
    const actualFirstName = appState.currentUserData?.first_name || (appState.currentUserData?.full_name ? appState.currentUserData.full_name.split(' ')[0] : appState.currentUser);
    if (firstName) firstName.innerText = actualFirstName;
    const role = document.getElementById('dropdown-role');
    if (role) role.innerText = appState.currentUserRole || 'User';
    const avatar = document.getElementById('current-user-avatar');
    if (avatar) avatar.innerText = appState.currentUser.charAt(0).toUpperCase();
    
    // Log the login event
    if (window.globalEventBus) {
        window.globalEventBus.publish({
            type: 'login_successful',
            payload: { username: appState.currentUser, role: appState.currentUserRole }
        });
    } else if (typeof addSystemLog === 'function') {
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
        if (typeof updateDashboardKPIs === 'function') updateDashboardKPIs();
        if (typeof renderDashboardSchedule === 'function') renderDashboardSchedule();
        if (typeof renderDashboardActivity === 'function') renderDashboardActivity();
        
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
