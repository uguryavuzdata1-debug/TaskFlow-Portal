import codecs

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    content = f.read()

idx = content.find('window.openDayView = function(year, month, day) {')
if idx != -1:
    content = content[:idx]

new_code = """window.openDayView = function(year, month, day) {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('day-view-title').innerText = `${day} ${monthNames[month]} ${year}`;
    
    // Convert to YYYY-MM-DD
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    
    // Find tickets for this date
    const dayTickets = (appState.tickets || []).filter(t => {
        if (!t.timestamp) return false;
        const dObj = new Date(t.timestamp);
        return dObj.getFullYear() === year && dObj.getMonth() === month && dObj.getDate() === day;
    });

    let html = '';
    
    // Hours 09:00 to 18:00
    for(let h = 9; h <= 18; h++) {
        const timeStr = `${String(h).padStart(2,'0')}:00`;
        const nextTimeStr = `${String(h+1).padStart(2,'0')}:00`;
        
        // Find tickets starting within this hour
        const hourTickets = dayTickets.filter(t => {
            if(!t.startTime) return false;
            const tHour = parseInt(t.startTime.split(':')[0]);
            return tHour === h;
        });
        
        html += `<div style="display:flex; border-bottom:1px solid #e2e8f0; min-height:60px;">`;
        html += `  <div style="width:80px; padding:15px; border-right:1px solid #e2e8f0; font-weight:bold; color:#64748b; font-size:0.9rem;">${timeStr}</div>`;
        html += `  <div style="flex:1; padding:10px; position:relative;" class="hourly-slot-content">`;
        
        if (hourTickets.length > 0) {
            hourTickets.forEach(t => {
                const isCompleted = t.status === 'Completed' || t.status === 'Tamamlandı' || t.invoiced === true;
                const statusClass = isCompleted ? 'completed' : 'pending';
                html += `
                    <div class="calendar-event ${statusClass}" style="margin-bottom:5px; padding:8px 12px; cursor:pointer;" onclick="editRecord('${t.dbId}')" title="${t.company} - ${t.mainService}">
                        <div style="font-weight:600; font-size:0.95rem;">${t.startTime} - ${t.company}</div>
                        <div style="font-size:0.85rem; opacity:0.9;">${t.mainService} | Ticket: ${t.crmTicket}</div>
                    </div>
                `;
            });
            // Still allow adding if they want multiple in same hour
            html += `<button onclick="createAppointmentForSlot('${dateStr}', '${timeStr}')" style="background:transparent; color:#3b82f6; border:1px dashed #cbd5e1; border-radius:4px; padding:4px 8px; font-size:0.8rem; cursor:pointer; width:100%; text-align:center; margin-top:5px;">+ Add Another</button>`;
        } else {
            html += `<button onclick="createAppointmentForSlot('${dateStr}', '${timeStr}')" style="background:transparent; color:#94a3b8; border:1px dashed #e2e8f0; border-radius:4px; width:100%; height:100%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;" onmouseover="this.style.color='#3b82f6'; this.style.borderColor='#93c5fd';" onmouseout="this.style.color='#94a3b8'; this.style.borderColor='#e2e8f0';">+ Add Appointment</button>`;
        }
        
        html += `  </div>`;
        html += `</div>`;
    }
    
    document.getElementById('day-view-hourly-list').innerHTML = html;
    document.getElementById('day-view-modal').classList.remove('hidden');
};

window.createAppointmentForSlot = function(dateStr, timeStr) {
    document.getElementById('day-view-modal').classList.add('hidden');
    
    // Show quick add modal
    document.getElementById('quick-add-modal').classList.remove('hidden');
    
    // Reset quick add fields
    document.getElementById('qa-date').value = dateStr;
    document.getElementById('qa-time').value = timeStr;
    document.getElementById('qa-company').value = '';
    document.getElementById('qa-postcode').value = '';
    const qaStatus = document.getElementById('qa-status');
    qaStatus.value = 'Checking...';
    qaStatus.style.setProperty('background', '#f8fafc', 'important');
    qaStatus.style.setProperty('color', '#111827', 'important');
    qaStatus.style.fontWeight = '500';
    document.getElementById('qa-service-category').value = 'S1';
};

window.submitQuickAdd = async function() {
    const btn = document.querySelector('#quick-add-modal button.btn-primary');
    btn.innerText = 'Creating...';
    btn.disabled = true;

    try {
        const dateStr = document.getElementById('qa-date').value;
        const timeStr = document.getElementById('qa-time').value;
        const company = document.getElementById('qa-company').value;
        const postcode = document.getElementById('qa-postcode').value;
        const status = document.getElementById('qa-status').value || 'Logged';
        const service = document.getElementById('qa-service-category').value;
        
        let combinedDate;
        try {
            combinedDate = new Date(`${dateStr}T${timeStr}`).toISOString();
        } catch(e) {
            combinedDate = new Date().toISOString();
        }
        
        const nextId = appState.tickets.length + 1001; 
        
        // Calculate an end time (+30 mins)
        let tHour = parseInt(timeStr.split(':')[0]) || 0;
        let tMin = (parseInt(timeStr.split(':')[1]) || 0) + 30;
        if(tMin >= 60) { tHour++; tMin -= 60; }
        const endStr = `${String(tHour).padStart(2,'0')}:${String(tMin).padStart(2,'0')}`;
        
        const rec = { 
            "CRM TICKET": "", 
            "INV NO": `SRV-${nextId}`, 
            COMPANY: company, 
            POSTCODE: postcode, 
            USER: appState.currentUser,
            "MAIN SERVICE": service, 
            "SUB SERVICE": "", 
            "START TIME": timeStr, 
            "END TIME": endStr, 
            DURATION: 30, 
            TIMESTAMP: combinedDate,
            PRICE: 0, 
            "PAYMENT STATUS": "Chargeable", 
            DESCRIPTION: "Quick Added via Calendar", 
            STATUS: status, 
            invoiced: false 
        };
        
        const { data, error } = await sbClient.from('records').insert([rec]).select();
        if (error) throw error;
        
        if (data && data.length > 0) {
            const r = data[0];
            appState.tickets.unshift({
                id: r.id, 
                dbId: (r.ID || r.db_id || r.id || 'N/A').toString().split('-')[0].substring(0, 5).toUpperCase(), 
                crmTicket: r['CRM TICKET'] || r.crm_ticket || 'N/A', 
                timestamp: r.TIMESTAMP || r.timestamp || new Date().toISOString(),
                company: r.COMPANY || r.company_name, 
                companyId: r.COMPANY_ID || r.company_id, 
                postcode: r.POSTCODE || r.postcode,
                user: r.USER || r.staff_user, 
                mainService: r['MAIN SERVICE'] || r.service_type, 
                subService: r['SUB SERVICE'] || r.sub_service,
                startTime: r['START TIME'] || r.start_time, 
                endTime: r['END TIME'] || r.end_time, 
                duration: r.DURATION || r.duration,
                price: r.PRICE || r.price, 
                paymentStatus: r['PAYMENT STATUS'] || r.payment_status, 
                description: r.DESCRIPTION || r.description,
                status: r.STATUS || r.status, 
                invoiced: r.invoiced, 
                invoiceDate: r['INV DATE'] || r.invoice_date, 
                invoiceNo: r['INV NO'] || r.invoice_no
            });
            updateDataStats();
            if (typeof addSystemLog === 'function') {
                addSystemLog('CREATE RECORD', `Quick added record for company: ${company}`);
            }
        }
        
        document.getElementById('quick-add-modal').classList.add('hidden');
        showAlert('Success', 'Appointment created!', '✅');
        renderCalendar(); // refresh calendar
        
    } catch(e) {
        showAlert('Error', e.message, '❌');
    } finally {
        btn.innerText = 'Create Appointment';
        btn.disabled = false;
    }
};
"""

with codecs.open('js/ui.js', 'w', 'utf8') as f:
    f.write(content + new_code)
print("Fix applied successfully.")
