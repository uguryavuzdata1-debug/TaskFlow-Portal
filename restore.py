import sys

content = """function resetForm() {
    const form = document.getElementById('master-form'); if (form) form.reset();
    const nextId = appState.tickets.length + 1001; 
    document.getElementById('f-db-id').value = `REC-${nextId}`; 
    document.getElementById('f-invoice-no').value = `SRV-${nextId}`;
    document.getElementById('f-timestamp').value = new Date().toLocaleString(); 
    document.getElementById('f-invoice-date').value = new Date().toISOString().split('T')[0];
    
    // Set End Time to current local time in HH:MM format
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('f-end-time').value = `${hh}:${mm}`;
    
    if (document.getElementById('f-date')) {
        document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
    }
    
    const statusEl = document.getElementById('f-status');
    statusEl.value = ''; 
    statusEl.style.setProperty('background', '#f8fafc', 'important');
    statusEl.style.setProperty('color', '#111827', 'important');
    statusEl.style.fontWeight = '500';
    
    const paymentEl = document.getElementById('f-payment-status');
    paymentEl.value = 'Chargeable';
    paymentEl.style.setProperty('background', '#f8fafc', 'important');
    paymentEl.style.setProperty('color', '#111827', 'important');
    paymentEl.style.fontWeight = '500';

    
    // Auto-fill logged in user and disable


    document.getElementById('f-user').innerHTML = `<option value="${appState.currentUser}">${appState.currentUser}</option>`;
    document.getElementById('f-user').disabled = true;
    
    // Enable category field (it might be locked by selectCategory)
    document.getElementById('f-service-type').disabled = false;
    
    updateDynamicFields();
}

document.getElementById('master-form').addEventListener('submit', async (e) => {
    e.preventDefault(); const btn = e.target.querySelector('button[type="submit"]'); btn.innerText = 'Saving...'; btn.disabled = true;
    let description = document.getElementById('f-desc').value;
    const main = document.getElementById('f-service-type').value;
    
    // Collect dynamic fields if S1
    if (main === 'S1') {
        const urgent = document.getElementById('f-s1-no-appointment')?.checked ? 'Yes' : 'No';
        if (urgent === 'Yes') {
            description = `[URGENT / NO APPOINTMENT: Yes] (+£25.00 Service Fee)\\n\\n${description}`;
        }
    }
    // Collect dynamic fields if S2
    else if (main === 'S2') {
        const ika = document.getElementById('f-ika-app').value;
        const local = document.getElementById('f-local-settings')?.value || '';
        const sector = document.getElementById('f-s2-sector')?.value || '';
        const setupNum = document.getElementById('f-setup-number')?.value || '';
        const company = document.getElementById('f-card-company')?.value || '';
        description = `[IKA APP: ${ika}] [SETTINGS: ${local}] [SECTOR: ${sector}] [SETUP #: ${setupNum}] [CARD CO: ${company}]\\n\\n${description}`;
    } 
    // Collect dynamic fields if S6
    else if (main === 'S6') {
        const quote = document.getElementById('f-s6-quote').value;
        const type = document.getElementById('f-s6-type').value;
        const model = document.getElementById('f-s6-model').value;
        const cpu = document.getElementById('f-s6-cpu').value;
        const os = document.getElementById('f-s6-os').value;
        const appV = document.getElementById('f-s6-app-ver').value;
        const sector = document.getElementById('f-s6-sector').value;
        const opt = document.getElementById('f-s6-option').value;
        const pTill = document.getElementById('f-s6-prog-till').value;
        const pImg = document.getElementById('f-s6-prog-img').value;
        const pMenu = document.getElementById('f-s6-prog-menu').value;

        description = `--- TECHNICAL SPECIFICATIONS (TILL SETUP) ---\\n` +
                     `Quote: ${quote} | Type: ${type} | Model: ${model}\\n` +
                     `CPU: ${cpu} | OS: ${os} | App Ver: ${appV}\\n` +
                     `Sector: ${sector} | Service: ${opt}\\n` +
                     `Programmers -> Till: ${pTill}, Image: ${pImg}, Menu: ${pMenu}\\n` +
                     `-------------------------------------------\\n\\n${description}`;
    }

    const dateVal = document.getElementById('f-date') ? document.getElementById('f-date').value : new Date().toISOString().split('T')[0];
    const timeVal = document.getElementById('f-start-time').value || '00:00';
    let combinedDate;
    try {
        combinedDate = new Date(`${dateVal}T${timeVal}`).toISOString();
    } catch(e) {
        combinedDate = new Date().toISOString();
    }

    const rec = { 
        "CRM TICKET": document.getElementById('f-crm-ticket').value, 
        "INV NO": document.getElementById('f-invoice-no').value, 
        COMPANY: document.getElementById('f-company').value, 
        POSTCODE: document.getElementById('f-postcode').value, 
        USER: appState.currentUser,
        "MAIN SERVICE": main, 
        "SUB SERVICE": document.getElementById('f-sub-service').value, 
        "START TIME": document.getElementById('f-start-time').value, 
        "END TIME": document.getElementById('f-end-time').value, 
        DURATION: parseInt(document.getElementById('f-duration').value) || 0, 
        TIMESTAMP: combinedDate,
        PRICE: parseFloat(document.getElementById('f-price').value) || 0, 
        "PAYMENT STATUS": document.getElementById('f-payment-status').value, 
        DESCRIPTION: description, 
        STATUS: 'Logged', 
        invoiced: false 
    };"""

with open('js/ui.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
for i, l in enumerate(lines):
    if "PRICE: parseFloat(document.getElementById('f-price').value)" in l:
        start_idx = i
        break

end_idx = -1
if start_idx != -1:
    for i in range(start_idx, len(lines)):
        if "invoiced: false" in lines[i]:
            end_idx = i + 1
            break

if start_idx != -1 and end_idx != -1:
    new_lines = lines[:start_idx] + [content + '\n'] + lines[end_idx + 1:]
    with open('js/ui.js', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Successfully replaced the block in js/ui.js")
else:
    print(f"Could not find the block boundaries. start_idx={start_idx}, end_idx={end_idx}")
