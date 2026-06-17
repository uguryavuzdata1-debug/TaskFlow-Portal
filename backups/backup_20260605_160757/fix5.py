import re

new_func = """
window.loadIntoDashboard = function(id) {
    const r = appState.tickets.find(t => t.id == id || t.dbId == id);
    if (!r) return;
    
    // Close modal if open
    const modal = document.getElementById('day-view-modal');
    if (modal) modal.classList.add('hidden');
    
    // Switch to dashboard tab
    appState.activeTab = 'dashboard';
    if(typeof renderTabs === 'function') renderTabs();
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('dashboard-view').classList.add('active');
    
    appState.editingRecordId = r.id;
    
    // Populate fields
    if(document.getElementById('f-db-id')) document.getElementById('f-db-id').value = r.dbId || '';
    if(document.getElementById('f-crm-ticket')) document.getElementById('f-crm-ticket').value = r.crmTicket || '';
    if(document.getElementById('f-invoice-no')) document.getElementById('f-invoice-no').value = r.invoiceNo || '';
    if(document.getElementById('f-company')) document.getElementById('f-company').value = r.company || '';
    if(document.getElementById('f-company-id')) document.getElementById('f-company-id').value = r.companyId || '';
    if(document.getElementById('f-postcode')) document.getElementById('f-postcode').value = r.postcode || '';
    
    const dObj = new Date(r.timestamp);
    const dateStr = dObj.getFullYear() + '-' + String(dObj.getMonth() + 1).padStart(2, '0') + '-' + String(dObj.getDate()).padStart(2, '0');
    if(document.getElementById('f-date')) document.getElementById('f-date').value = r.invoiceDate || dateStr;
    
    if(document.getElementById('f-main-service')) document.getElementById('f-main-service').value = r.mainService || '';
    if(typeof updateSubServices === 'function') updateSubServices('f-main-service', 'f-sub-service');
    if(document.getElementById('f-sub-service')) document.getElementById('f-sub-service').value = r.subService || '';
    
    if(document.getElementById('f-start-time')) document.getElementById('f-start-time').value = r.startTime || '';
    if(document.getElementById('f-end-time')) document.getElementById('f-end-time').value = r.endTime || '';
    if(document.getElementById('f-duration')) document.getElementById('f-duration').value = r.duration || '';
    if(document.getElementById('f-price')) document.getElementById('f-price').value = r.price || 0;
    if(document.getElementById('f-payment-status')) document.getElementById('f-payment-status').value = r.paymentStatus || 'Chargeable';
    if(document.getElementById('f-description')) document.getElementById('f-description').value = r.description || '';
    if(document.getElementById('f-status')) document.getElementById('f-status').value = r.status || 'Logged';
    
    // Change submit button text
    const submitBtn = document.querySelector('#master-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i data-lucide="save" style="width: 18px; height: 18px; margin-right: 8px;"></i> Update Record';
        submitBtn.style.background = '#f59e0b';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
"""

with open('js/ui.js', 'r', encoding='utf8') as f:
    text = f.read()

text = text.replace("onclick=\"document.getElementById('day-view-modal').classList.add('hidden'); editInvoice('${t.id}');\"", "onclick=\"loadIntoDashboard('${t.id}');\"")
text = text.replace("onclick=\"event.stopPropagation(); editInvoice('${t.id}')\"", "onclick=\"event.stopPropagation(); loadIntoDashboard('${t.id}')\"")

with open('js/ui.js', 'w', encoding='utf8') as f:
    f.write(text + "\n" + new_func)

print('Updated ui.js with loadIntoDashboard')
