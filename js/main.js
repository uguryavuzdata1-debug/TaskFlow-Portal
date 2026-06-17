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
window.printInvoice = printInvoice;
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
    
    // Always init app first to get users/settings
    await initApp();

    const savedUser = localStorage.getItem('taskflow_user');
    if (savedUser) {
        document.getElementById('login-remember').checked = true;
        appState.currentUser = savedUser;
        document.getElementById('current-user-name').innerText = appState.currentUser;
        
        const auth = appState.settings.users_auth || {};
        const userData = auth[appState.currentUser] || (appState.currentUser === 'ADMIN' ? { role: 'Admin' } : { role: 'User' });
        appState.currentUserRole = userData.role || (appState.currentUser === 'ADMIN' ? 'Admin' : 'User');

        document.body.classList.remove('is-logged-out'); 
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-nav').classList.remove('hidden'); 
        document.getElementById('main-content').classList.remove('hidden');
        
        // Re-apply role-based UI restrictions
        document.querySelectorAll('.sidebar-link').forEach(btn => {
            if (btn.id.startsWith('set-btn-') && btn.id !== 'set-btn-account') {
                btn.style.display = (appState.currentUserRole === 'Admin') ? 'flex' : 'none';
            }
        });
    }
});

