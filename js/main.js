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
window.printInvoiceLegacy = printInvoice;
window.printInvoice = function(id) {
    if (window.globalEventBus) {
        window.globalEventBus.publish({
            type: 'invoice_generation_requested',
            payload: { id: id }
        });
    } else {
        window.printInvoiceLegacy(id);
    }
};
window.closeModal = closeModal;
window.markAsInvoiced = markAsInvoiced;
window.showAlert = showAlert;
window.closeAlert = closeAlert;
window.filterByCustomer = filterByCustomer;
window.exportToCSV = exportToCSV;
window.updateEditSubServices = updateEditSubServices;
window.updateAccount = updateAccount;
window.updateDataStats = updateDataStats;
// Dark theme is now permanent via style.css
window.addPersonnel = addPersonnel;
window.renderPersonnelManagement = renderPersonnelManagement;
window.resetUserPassword = resetUserPassword;
window.deleteUser = deleteUser;
window.updateDataStats = updateDataStats;
window.filterCustomers = filterCustomers;
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
window.editOS = editOS;
window.editCCLocal = editCCLocal;




document.addEventListener('DOMContentLoaded', async () => { 
    if (window.lucide) lucide.createIcons();
    
    const token = localStorage.getItem('taskflow_token') || sessionStorage.getItem('taskflow_token');
    if (token) {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.user) {
                    const savedUser = localStorage.getItem('taskflow_user');
                    if (savedUser && document.getElementById('login-remember')) {
                        document.getElementById('login-remember').checked = true;
                    }

                    appState.currentUser = data.user.full_name || data.user.username;
                    appState.currentUserRole = data.user.role || 'User';
                    appState.currentUserData = data.user;

                    if (document.getElementById('current-user-name')) {
                        document.getElementById('current-user-name').innerText = appState.currentUser;
                    }

                    document.body.classList.remove('is-logged-out'); 
                    document.getElementById('login-screen').classList.add('hidden');
                    document.getElementById('main-nav').classList.remove('hidden'); 
                    document.getElementById('main-content').classList.remove('hidden');

                    // Authenticated, now load application data
                    await initApp();

                    // Re-apply role-based UI restrictions
                    document.querySelectorAll('.sidebar-link').forEach(btn => {
                        if (btn.id.startsWith('set-btn-') && btn.id !== 'set-btn-account') {
                            btn.style.display = (appState.currentUserRole === 'Admin') ? 'flex' : 'none';
                        }
                    });

                    if (typeof showTab === 'function') showTab(appState.activeTab || 'dashboard');
                    if (typeof updateDashboardKPIs === 'function') updateDashboardKPIs();
                    if (typeof renderDashboardSchedule === 'function') renderDashboardSchedule();
                    if (typeof renderDashboardActivity === 'function') renderDashboardActivity();
                    return;
                }
            }
        } catch (err) {
            console.warn('[Session] Token verification error:', err);
        }
    }

    // Not authenticated - show login screen
    localStorage.removeItem('taskflow_token');
    sessionStorage.removeItem('taskflow_token');
    document.body.classList.add('is-logged-out');
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) loginScreen.classList.remove('hidden');
    const nav = document.getElementById('main-nav');
    if (nav) nav.classList.add('hidden');
    const main = document.getElementById('main-content');
    if (main) main.classList.add('hidden');
});

