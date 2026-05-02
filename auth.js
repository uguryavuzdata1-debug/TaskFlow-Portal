/**
 * Authentication and User Management Module
 */

async function handleLogin() {
  const userInp = document.getElementById('login-username');
  const passInp = document.getElementById('login-password');
  const rememberCheck = document.getElementById('login-remember');
  const btn = document.querySelector('#login-screen button');

  if (!userInp || !passInp) {
    console.error('Login inputs not found');
    return;
  }

  const username = userInp.value.trim();
  const password = passInp.value.trim();
  
  console.log('Attempting login for:', username);

  if (!supabaseClient) {
    showModalAlert('System Error', 'Supabase client could not be initialized. Please check your internet connection and refresh the page.', 'error');
    if (btn) {
       btn.disabled = false;
       btn.textContent = 'Sign In';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Verifying...';
  }

  try {
    // Fetch fresh personnel list from Supabase
    const { data: settings, error } = await supabaseClient
      .from('app_settings')
      .select('data')
      .eq('id', 'personnel')
      .single();

    if (error) throw error;
    personnel = settings.data || DEFAULT_PERSONNEL;

    const found = personnel.find(p => {
      const pName = typeof p === 'string' ? p : p.name;
      const pPass = typeof p === 'string' ? 'admin' : p.password;
      return pName === username && pPass === password;
    });

    if (found) {
      const loggedName = typeof found === 'string' ? found : found.name;
      localStorage.setItem('taskflow_logged_user', loggedName);
      
      if (rememberCheck && rememberCheck.checked) {
        localStorage.setItem('taskflow_remember_me', loggedName);
      } else {
        localStorage.removeItem('taskflow_remember_me');
      }
      
      // Update UI
      const nameSpan = document.getElementById('nav-user-name');
      const avatarDiv = document.getElementById('nav-user-avatar');
      const welcomeH1 = document.getElementById('dashboard-welcome');
      
      if (nameSpan) nameSpan.textContent = loggedName;
      if (avatarDiv) avatarDiv.textContent = loggedName.charAt(0).toUpperCase();
      if (welcomeH1) welcomeH1.textContent = `Welcome, ${loggedName}`;

      const staffSelect = document.getElementById('f-user');
      if (staffSelect) staffSelect.value = loggedName;

      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('main-nav').classList.remove('hidden');
      document.getElementById('main-content').classList.remove('hidden');
      showTab('dashboard');
      
      showToast(`Welcome back, ${loggedName}!`, 'success');
    } else {
      showModalAlert('Login Failed', 'Invalid username or password.', 'error');
    }
  } catch (err) {
    console.error('Login error:', err);
    showModalAlert('System Error', `Authentication error: ${err.message || 'Unknown error'}. Please check your connection.`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  }
}

async function changeMyPassword() {
  const loggedName = localStorage.getItem('taskflow_logged_user');
  if (!loggedName) return;

  try {
    // 1. Fetch latest personnel list
    const { data: settings, error: fetchErr } = await supabaseClient
      .from('app_settings')
      .select('data')
      .eq('id', 'personnel')
      .single();

    if (fetchErr) throw fetchErr;
    let currentPersonnel = settings.data || [];

    const userIdx = currentPersonnel.findIndex(p => (typeof p === 'string' ? p : p.name) === loggedName);
    if (userIdx === -1) {
      showModalAlert('Profile Error', 'User profile not found in database.', 'error');
      return;
    }

    const user = currentPersonnel[userIdx];
    const currentPass = typeof user === 'string' ? 'admin' : user.password;
    
    const oldPassInput = await showModalPrompt('Security Check', 'Confirm your CURRENT password:', '', 'password');
    if (oldPassInput === null) return; // Cancelled
    
    if (oldPassInput !== currentPass) {
      showModalAlert('Security Error', 'Incorrect current password.', 'error');
      return;
    }

    const newPass = await showModalPrompt('New Password', 'Enter your NEW password:', '', 'password');
    if (!newPass) return;

    // 2. Update record
    currentPersonnel[userIdx] = { name: loggedName, password: newPass.trim() };
    
    // 3. Save back to Supabase
    const { error: saveErr } = await supabaseClient
      .from('app_settings')
      .update({ data: currentPersonnel, updated_at: new Date().toISOString() })
      .eq('id', 'personnel');

    if (saveErr) throw saveErr;

    personnel = currentPersonnel; // Update local memory
    showModalAlert('Success', 'Password changed successfully!', 'success');
  } catch (err) {
    console.error('Password change error:', err);
    showModalAlert('Update Failed', 'Failed to update password. Please try again.', 'error');
  }
}

function handleLogout() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('main-nav').classList.add('hidden');
  document.getElementById('main-content').classList.add('hidden');
  localStorage.removeItem('taskflow_logged_user');
  if (typeof isSettingsUnlocked !== 'undefined') isSettingsUnlocked = false;
  showToast('Logged out successfully', 'info');
}

function toggleLoginPassword() {
  const passInp = document.getElementById('login-password');
  const eyeIcon = document.getElementById('eye-icon');
  if (passInp.type === 'password') {
    passInp.type = 'text';
    eyeIcon.setAttribute('data-lucide', 'eye-off');
  } else {
    passInp.type = 'password';
    eyeIcon.setAttribute('data-lucide', 'eye');
  }
  if (window.lucide) window.lucide.createIcons();
}

function forgotPassword() {
  showModalAlert('Password Reset', 'Please contact your system administrator to reset your password.\n\nSupport: admin@ikataskflow.com', 'info');
}
