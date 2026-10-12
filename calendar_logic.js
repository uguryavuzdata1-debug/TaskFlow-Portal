// --- DESCRIPTION METADATA SERIALIZER ---
function parseMetadata(desc) {
    if (!desc) return { metadata: {}, details: '' };
    const match = desc.match(/^\[METADATA: ({.*?})\]\n([\s\S]*)$/);
    if (match) {
        try {
            return {
                metadata: JSON.parse(match[1]),
                details: match[2]
            };
        } catch(e) {}
    }
    return {
        metadata: {},
        details: desc
    };
}
function serializeMetadata(metadata, details) {
    return `[METADATA: ${JSON.stringify(metadata)}]\n${details}`;
}

// --- CALENDAR LOGIC ---
let currentCalMonth = new Date().getMonth();
let currentCalYear = new Date().getFullYear();

window.prevMonth = function() {
    currentCalMonth--;
    if (currentCalMonth < 0) {
        currentCalMonth = 11;
        currentCalYear--;
    }
    if (typeof renderCalendar === 'function') renderCalendar();
}

window.nextMonth = function() {
    currentCalMonth++;
    if (currentCalMonth > 11) {
        currentCalMonth = 0;
        currentCalYear++;
    }
    if (typeof renderCalendar === 'function') renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if(!grid) return;
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthDisplay = document.getElementById('calendar-month-display');
    if (monthDisplay) monthDisplay.innerText = `${monthNames[currentCalMonth]} ${currentCalYear}`;
    
    const firstDay = new Date(currentCalYear, currentCalMonth, 1);
    const lastDay = new Date(currentCalYear, currentCalMonth + 1, 0);
    
    let startingDay = firstDay.getDay(); 
    if (startingDay === 0) startingDay = 7; 
    
    const prevMonthDays = new Date(currentCalYear, currentCalMonth, 0).getDate();
    
    let html = '';
    
    for (let i = 1; i < startingDay; i++) {
        const d = prevMonthDays - startingDay + i + 1;
        html += `<div class="calendar-day other-month"><span class="calendar-date">${d}</span></div>`;
    }
    
    const today = new Date();
    for (let d = 1; d <= lastDay.getDate(); d++) {
        const isToday = d === today.getDate() && currentCalMonth === today.getMonth() && currentCalYear === today.getFullYear();
        html += `<div class="calendar-day ${isToday ? 'today' : ''}" onclick="openDayView(${currentCalYear}, ${currentCalMonth}, ${d})" style="cursor:pointer;">
                   <span class="calendar-date">${d}</span>
                   <div id="cal-day-${currentCalYear}-${currentCalMonth}-${d}" style="display:flex; flex-direction:column; gap:2px; margin-top:5px; height: calc(100% - 30px); overflow-y: auto;"></div>
                 </div>`;
    }
    
    const totalCells = startingDay - 1 + lastDay.getDate();
    const remaining = totalCells > 35 ? 42 - totalCells : 35 - totalCells;
    for(let i = 1; i <= remaining; i++) {
        html += `<div class="calendar-day other-month"><span class="calendar-date">${i}</span></div>`;
    }
    
    grid.innerHTML = html;
    
    const tickets = appState.tickets || [];
    
    const ticketsByDay = {};
    tickets.forEach(t => {
        if (!t.timestamp) return;
        const dObj = new Date(t.timestamp);
        if (dObj.getMonth() === currentCalMonth && dObj.getFullYear() === currentCalYear) {
            const day = dObj.getDate();
            if (!ticketsByDay[day]) ticketsByDay[day] = [];
            ticketsByDay[day].push(t);
        }
    });

    Object.keys(ticketsByDay).forEach(day => {
        const dayCell = document.getElementById(`cal-day-${currentCalYear}-${currentCalMonth}-${day}`);
        if (dayCell) {
            const list = ticketsByDay[day];
            const waitingCount = list.filter(t => {
                const stat = t.status || '';
                return !(stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamland' || t.invoiced === true);
            }).length;
            const completedCount = list.length - waitingCount;
            
            let htmlInner = '';
            if (waitingCount > 0) {
                htmlInner += `<div style="background-color:#f59e0b; color:white; border-radius:6px; padding:6px 0; text-align:center; font-weight:700; font-size:12px; margin-bottom:5px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">Waiting ${waitingCount} Job${waitingCount > 1 ? 's' : ''}</div>`;
            }
            if (completedCount > 0) {
                htmlInner += `<div style="background-color:#10b981; color:white; border-radius:6px; padding:6px 0; text-align:center; font-weight:700; font-size:12px; margin-bottom:5px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">Completed ${completedCount} Job${completedCount > 1 ? 's' : ''}</div>`;
            }
            
            // Set content
            dayCell.innerHTML = htmlInner;
        }
    });

    if (window.lucide) window.lucide.createIcons();
}
window.renderCalendar = renderCalendar;

window.openDayView = function(year, month, day) {
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
            hourTickets.sort((a,b) => (a.startTime || "").localeCompare(b.startTime || ""));
            hourTickets.forEach(t => {
                const isCompleted = t.status === 'Completed' || t.status === 'Tamamlandı' || t.invoiced === true;
                const statusClass = isCompleted ? 'completed' : 'pending';
                html += `
                    <div class="calendar-event ${statusClass}" style="margin-bottom:5px; padding:8px 12px; cursor:pointer; ${isCompleted ? 'text-decoration: line-through; opacity: 0.7;' : ''}" onclick="openAppointmentView('${t.id}');" title="${t.company} - ${t.mainService}">
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

window.createAppointmentForSlot = function(dateStr, timeStr, companyName = '') {
    document.getElementById('day-view-modal').classList.add('hidden');
    
    // Show quick add modal
    document.getElementById('quick-add-modal').classList.remove('hidden'); if(window.initPickers) window.initPickers();
    
    // Reset quick add fields
    document.getElementById('qa-customer-search').value = companyName || '';
    document.getElementById('qa-date').value = dateStr || '';
    document.getElementById('qa-company-name').value = '';
    document.getElementById('qa-company-id').value = '';
    document.getElementById('qa-postcode').value = '';
    document.getElementById('qa-address').value = '';
    document.getElementById('qa-contact').value = '';
    document.getElementById('qa-phone').value = '';
    document.getElementById('qa-notes').value = '';
    
    const qaStatus = document.getElementById('qa-status');
    if (qaStatus) {
        qaStatus.value = 'Checking...';
        qaStatus.style.setProperty('background', '#f8fafc', 'important');
        qaStatus.style.setProperty('color', '#111827', 'important');
        qaStatus.style.fontWeight = '500';
    }
    
    const serviceCat = document.getElementById('qa-service-category');
    if (serviceCat) {
        serviceCat.value = 'S1';
    }
    
    // Populate times dropdown in qa-time if it's empty
    const qaTimeSelect = document.getElementById('qa-time');
    if (qaTimeSelect && qaTimeSelect.options.length === 0) {
        let timesHtml = '';
        for (let h = 9; h <= 18; h++) {
            const tStr = `${String(h).padStart(2,'0')}:00`;
            timesHtml += `<option value="${tStr}">${tStr}</option>`;
        }
        qaTimeSelect.innerHTML = timesHtml;
    }
    if (timeStr) qaTimeSelect.value = timeStr;
    
    // Populate Assigned Engineer select options
    const qaStaffSelect = document.getElementById('qa-staff-select');
    if (qaStaffSelect && qaStaffSelect.options.length === 0) {
        const personnel = appState.settings.personnel || [];
        qaStaffSelect.innerHTML = personnel.map(p => `<option value="${p}">${p}</option>`).join('');
    }
    if (qaStaffSelect && appState.currentUser) qaStaffSelect.value = appState.currentUser;
    
    if (typeof updateQaSubServices === 'function') updateQaSubServices();
    if (typeof updatePriorityUI === 'function') updatePriorityUI('Normal');
    
    if (companyName) {
        window.autoFillQuickAdd();
    }
};

window.updateQaSubServices = function() {
    const main = document.getElementById('qa-service-category').value;
    const subSelect = document.getElementById('qa-sub-service');
    if (!subSelect) return;
    
    const subServices = appState.settings?.sub_services || 
                        (typeof defaultSeeds !== 'undefined' ? defaultSeeds.sub_services : null) || 
                        (typeof LOCAL_SUB_SERVICES !== 'undefined' ? LOCAL_SUB_SERVICES : null);
    let opts = [];
    if (subServices) {
        if (Array.isArray(subServices)) {
            opts = subServices.filter(s => s.service_name === main).map(s => s.name);
        } else if (typeof subServices === 'object') {
            opts = subServices[main] || [];
        }
    }
    subSelect.innerHTML = opts.map(o => `<option value="${o}">${o}</option>`).join('');
};

window.updatePriorityUI = function(val) {
    const normal = document.getElementById('lbl-priority-normal');
    const urgent = document.getElementById('lbl-priority-urgent');
    const emergency = document.getElementById('lbl-priority-emergency');
    
    [normal, urgent, emergency].forEach(el => {
        if(el) {
            el.style.background = '#fff';
            el.style.color = '#334155';
            el.style.borderColor = '#cbd5e1';
        }
    });
    
    if (val === 'Normal') {
        if (normal) {
            normal.style.background = '#f1f5f9';
            normal.style.color = '#334155';
            normal.style.borderColor = '#94a3b8';
        }
    } else if (val === 'Urgent') {
        if (urgent) {
            urgent.style.background = '#fef3c7';
            urgent.style.color = '#d97706';
            urgent.style.borderColor = '#f59e0b';
        }
    } else if (val === 'Emergency') {
        if (emergency) {
            emergency.style.background = '#fee2e2';
            emergency.style.color = '#b91c1c';
            emergency.style.borderColor = '#ef4444';
        }
    }
};

window.submitQuickAdd = async function() {
    const btn = document.querySelector('#quick-add-modal button.btn-primary');
    btn.innerText = 'Creating...';
    btn.disabled = true;

    try {
        const dateStr = document.getElementById('qa-date').value;
        const timeStr = document.getElementById('qa-time').value;
        const company = document.getElementById('qa-company-name').value;
        const companyId = document.getElementById('qa-company-id').value;
        const postcode = document.getElementById('qa-postcode').value;
        const statusVal = document.getElementById('qa-status').value || 'Logged';
        const service = document.getElementById('qa-service-category').value;
        const subService = document.getElementById('qa-sub-service')?.value || '';
        const durationVal = parseInt(document.getElementById('qa-duration').value) || 30;
        const engineerVal = document.getElementById('qa-staff-select').value;
        const notesVal = document.getElementById('qa-notes').value || '';
        
        const priorityEl = document.querySelector('input[name="qa-priority"]:checked');
        const priorityVal = priorityEl ? priorityEl.value : 'Normal';
        
        if (!company) {
            showAlert('Required', 'Please select a valid customer first.', '⚠️');
            btn.innerText = 'Save Appointment';
            btn.disabled = false;
            return;
        }

        // Calculate end time
        let [tHour, tMin] = timeStr.split(':').map(Number);
        tMin = (tMin || 0) + durationVal;
        while (tMin >= 60) {
            tHour = (tHour + 1) % 24;
            tMin -= 60;
        }
        const endStr = `${String(tHour).padStart(2,'0')}:${String(tMin).padStart(2,'0')}`;

        const metadata = {
            address: document.getElementById('qa-address').value || '',
            primaryContact: document.getElementById('qa-contact').value || '',
            phone: document.getElementById('qa-phone').value || '',
            contractStatus: statusVal,
            priority: priorityVal,
            notes: notesVal
        };
        const finalDescription = serializeMetadata(metadata, notesVal);
        const nextId = appState.tickets.length + 1001; 
        
        const rec = { 
            "CRM TICKET": "", 
            "INV NO": `SRV-${nextId}`, 
            COMPANY: company, 
            COMPANY_ID: companyId,
            POSTCODE: postcode, 
            USER: engineerVal,
            "MAIN SERVICE": service, 
            "SUB SERVICE": subService, 
            "START TIME": timeStr, 
            "END TIME": endStr, 
            DURATION: durationVal, 
            PRICE: 0, 
            "PAYMENT STATUS": (statusVal.toLowerCase().includes('contract') ? "Contract" : "Chargeable"),
            "INV DATE": dateStr, 
            DESCRIPTION: finalDescription, 
            STATUS: 'Logged', 
            invoiced: false 
        };
        
        if (window.globalEventBus) {
            window.globalEventBus.publish({
                type: 'appointment_quick_add_requested',
                payload: {
                    ...rec,
                    company: rec.COMPANY,
                    mainService: rec["MAIN SERVICE"],
                    subService: rec["SUB SERVICE"],
                    duration: rec.DURATION
                }
            });
            document.getElementById('quick-add-modal').classList.add('hidden');
            showAlert('Success', 'Appointment processed via Antigravity Loop!', '✅');
            renderCalendar(); 
        } else {
            const { data, error } = await sbClient.from('records').insert([rec]).select();
            if (error) throw error;
            
            if (data && data.length > 0) {
                const r = data[0];
                const parsed = parseMetadata(r.DESCRIPTION || r.description || '');
                appState.tickets.unshift({
                    id: r.id, 
                    dbId: (r.ID || r.db_id || r.id || 'N/A').toString().split('-')[0].substring(0, 5).toUpperCase(), 
                    crmTicket: r['CRM TICKET'] || r.crm_ticket || 'N/A', 
                    timestamp: r.TIMESTAMP || r.timestamp || r['INV DATE'] || r.created_at || new Date().toISOString(),
                    company: r.COMPANY || r.company_name, 
                    companyId: r.COMPANY_ID || r.company_id, 
                    postcode: r.POSTCODE || r.postcode,
                    user: r.USER || r.staff_user, 
                    mainService: r['MAIN SERVICE'] || r.service_type, 
                    subService: r['SUB SERVICE'] || r.sub_service || '',
                    startTime: r['START TIME'] || r.start_time, 
                    endTime: r['END TIME'] || r.end_time, 
                    duration: r.DURATION || r.duration,
                    price: r.PRICE || r.price, 
                    paymentStatus: r['PAYMENT STATUS'] || r.payment_status, 
                    description: parsed.details, 
                    rawDescription: r.DESCRIPTION || r.description || '',
                    status: r.STATUS || r.status, 
                    invoiced: r.invoiced, 
                    invoiceDate: r['INV DATE'] || r.invoice_date, 
                    invoiceNo: r['INV NO'] || r.invoice_no,
                    vat: parsed.metadata.vat !== undefined ? parsed.metadata.vat : 0,
                    invoiceNotes: parsed.metadata.invoiceNotes || '',
                    address: parsed.metadata.address || '',
                    phone: parsed.metadata.phone || '',
                    primaryContact: parsed.metadata.primaryContact || '',
                    priority: parsed.metadata.priority || 'Normal'
                });
                updateDataStats();
                if (typeof addSystemLog === 'function') {
                    addSystemLog('CREATE RECORD', `Quick added record for company: ${company}`);
                }
            }
            
            document.getElementById('quick-add-modal').classList.add('hidden');
            showAlert('Success', 'Appointment created!', '✅');
            renderCalendar(); 
        }
    } catch(e) {
        showAlert('Error', e.message, '❌');
    } finally {
        btn.innerText = 'Save Appointment';
        btn.disabled = false;
    }
};

window.autoFillQuickAdd = function() {
    const searchInput = document.getElementById('qa-customer-search');
    if (!searchInput) return;
    const searchVal = searchInput.value;
    if (!searchVal) return;
    
    const customer = (appState.customers || []).find(c => {
        const name = (c.COMPANY || '').toLowerCase();
        const cid = (c['CUSTOMER ID'] || '').toLowerCase();
        const pc = (c.POSTCODE || '').toLowerCase();
        return name === searchVal.toLowerCase() || 
               cid === searchVal.toLowerCase() || 
               pc === searchVal.toLowerCase() ||
               searchVal.toLowerCase().includes(name) ||
               searchVal.toLowerCase().includes(cid);
    });

    const companyEl = document.getElementById('qa-company-name');
    const companyIdEl = document.getElementById('qa-company-id');
    const postcodeEl = document.getElementById('qa-postcode');
    const addressEl = document.getElementById('qa-address');
    const contactEl = document.getElementById('qa-contact');
    const phoneEl = document.getElementById('qa-phone');
    const statusEl = document.getElementById('qa-status');

    if (customer) {
        companyEl.value = customer.COMPANY || '';
        companyIdEl.value = customer['CUSTOMER ID'] || '';
        postcodeEl.value = customer.POSTCODE || '';
        addressEl.value = customer.ADDRESS1 || customer.ADDRESS2 || 'N/A';
        contactEl.value = customer.CONTACT_NAME || 'N/A';
        phoneEl.value = customer.PHONE || 'N/A';
        
        const statusVal = customer['SERVICE STATUS'] || 'No Contract';
        statusEl.value = statusVal;
        
        const isContract = statusVal.toLowerCase().includes('contract') || statusVal.toLowerCase().includes('var');
        if (isContract) {
            statusEl.style.setProperty('background', '#dcfce7', 'important');
            statusEl.style.setProperty('color', '#15803d', 'important');
            statusEl.style.fontWeight = '800';
        } else {
            statusEl.style.setProperty('background', '#fee2e2', 'important');
            statusEl.style.setProperty('color', '#b91c1c', 'important');
            statusEl.style.fontWeight = '800';
        }
    } else {
        companyEl.value = '';
        companyIdEl.value = '';
        postcodeEl.value = '';
        addressEl.value = '';
        contactEl.value = '';
        phoneEl.value = '';
        statusEl.value = '';
        statusEl.style.background = '#f8fafc';
        statusEl.style.color = '#111827';
        statusEl.style.fontWeight = '500';
    }
};


window.loadIntoDashboard = function(id) {
    const r = appState.tickets.find(t => t.id == id || t.dbId == id);
    if (!r) return;
    
    // Close modal if open
    const modal = document.getElementById('day-view-modal');
    if (modal) modal.classList.add('hidden');
    
    // Switch to dashboard tab
    showTab("dashboard");
    if (typeof toggleMainForm === 'function') toggleMainForm('form');
    
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
    
    if(document.getElementById('f-service-type')) {
        document.getElementById('f-service-type').value = r.mainService || '';
        if(typeof updateDynamicFields === 'function') updateDynamicFields();
    }
    if(typeof updateSubServices === 'function') updateSubServices('f-service-type', 'f-sub-service');
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


window.openAppointmentView = function(id) {
    const r = appState.tickets.find(t => t.id == id || t.dbId == id);
    if (!r) return;
    
    // Fill fields
    const services = appState.settings?.services || window.LOCAL_SERVICES || [];
    const servObj = services.find(x => x.name === r.mainService);
    document.getElementById('va-service-category').innerText = servObj ? (servObj.full_name || servObj.name) : (r.mainService || 'N/A');
    document.getElementById('va-company').innerText = r.company || 'N/A';
    document.getElementById('va-postcode').innerText = r.postcode || 'N/A';
    
    const customer = (appState.customers || []).find(c => (c.COMPANY || '') === r.company);
    const statusVal = customer ? (customer['SERVICE STATUS'] || 'No Contract') : 'No Contract';
    const statusEl = document.getElementById('va-status');
    statusEl.innerText = statusVal;
    
    if (statusVal.toLowerCase().includes('contract') || statusVal.toLowerCase().includes('var')) {
        statusEl.style.setProperty('background', '#dcfce7', 'important');
        statusEl.style.setProperty('color', '#15803d', 'important');
    } else {
        statusEl.style.setProperty('background', '#fee2e2', 'important');
        statusEl.style.setProperty('color', '#b91c1c', 'important');
    }
    
    // New fields
    document.getElementById('va-address').innerText = r.address || (customer ? (customer.ADDRESS1 || customer.ADDRESS2 || 'N/A') : 'N/A');
    document.getElementById('va-contact').innerText = r.primaryContact || (customer ? (customer.CONTACT_NAME || 'N/A') : 'N/A');
    document.getElementById('va-phone').innerText = r.phone || (customer ? (customer.PHONE || 'N/A') : 'N/A');
    
    const priorityEl = document.getElementById('va-priority');
    if (priorityEl) {
        const pVal = r.priority || 'Normal';
        priorityEl.innerText = pVal;
        if (pVal === 'Normal') {
            priorityEl.style.setProperty('background', '#f1f5f9', 'important');
            priorityEl.style.setProperty('color', '#334155', 'important');
        } else if (pVal === 'Urgent') {
            priorityEl.style.setProperty('background', '#fef3c7', 'important');
            priorityEl.style.setProperty('color', '#d97706', 'important');
        } else if (pVal === 'Emergency') {
            priorityEl.style.setProperty('background', '#fee2e2', 'important');
            priorityEl.style.setProperty('color', '#b91c1c', 'important');
        }
    }
    document.getElementById('va-notes').innerText = r.notes || r.description || 'No Notes';
    
    const dObj = new Date(r.timestamp);
    const dateStr = dObj.getFullYear() + '-' + String(dObj.getMonth() + 1).padStart(2, '0') + '-' + String(dObj.getDate()).padStart(2, '0');
    document.getElementById('va-date').value = r.invoiceDate || dateStr;
    document.getElementById('va-start-time').value = r.startTime || '';
    
    document.getElementById('va-created-at').innerText = new Date(r.timestamp).toLocaleString('tr-TR');
    document.getElementById('va-created-by').innerText = r.user || 'N/A';
    

    const goTicketBtn = document.getElementById('va-goticket-btn');
    if (goTicketBtn) {
        goTicketBtn.onclick = function() {
            document.getElementById('view-appointment-modal').classList.add('hidden');
            loadIntoDashboard(id);
        };
    }

    const holdBtn = document.getElementById('va-hold-btn');
    if (holdBtn) {
        holdBtn.onclick = function() {
            document.getElementById('view-appointment-modal').classList.add('hidden');
        };
    }

    const deleteBtn = document.getElementById('va-delete-btn');
    if (deleteBtn) {
        deleteBtn.onclick = async function() {
            if (!confirm('Are you sure you want to delete this appointment?')) return;
            try {
                deleteBtn.innerHTML = 'Deleting...';
                deleteBtn.disabled = true;
                const { error } = await sbClient.from('records').delete().eq('id', id);
                if (error) throw error;
                
                appState.tickets = appState.tickets.filter(t => t.id !== id);
                
                document.getElementById('view-appointment-modal').classList.add('hidden');
                if (typeof showAlert !== 'undefined') showAlert('Success', 'Appointment deleted.', '✅');
                if (typeof renderCalendar !== 'undefined') renderCalendar();
                if (typeof renderDataTable !== 'undefined') renderDataTable();
                if (typeof updateDataStats !== 'undefined') updateDataStats();
            } catch(e) {
                console.error(e);
                if (typeof showAlert !== 'undefined') showAlert('Error', e.message, '❌');
            } finally {
                deleteBtn.innerHTML = 'Delete';
                deleteBtn.disabled = false;
            }
        };
    }

    
    
    const saveBtn = document.getElementById('va-save-btn');
    saveBtn.onclick = async function() {
        try {
            saveBtn.innerHTML = 'Saving...';
            saveBtn.disabled = true;
            
            const newDate = document.getElementById('va-date').value;
            const newTime = document.getElementById('va-start-time').value;
            
            const updates = {
                "INV DATE": newDate,
                "START TIME": newTime
            };
            
            const { error } = await sbClient.from('records').update(updates).eq('id', id);
            if (error) throw error;
            
            // update local state
            r.invoiceDate = newDate;
            r.startTime = newTime;
            r.timestamp = new Date(newDate + 'T' + (newTime || '00:00') + ':00').toISOString();
            
            document.getElementById('view-appointment-modal').classList.add('hidden');
            if (typeof showAlert !== 'undefined') showAlert('Success', 'Appointment updated successfully!', '✅');
            if (typeof renderCalendar !== 'undefined') renderCalendar();
            if (typeof renderDataTable !== 'undefined') renderDataTable();
            
        } catch(e) {
            console.error(e);
            if (typeof showAlert !== 'undefined') showAlert('Error', e.message, '❌');
        } finally {
            saveBtn.innerHTML = 'Change Date Time';
            saveBtn.disabled = false;
        }
    };

    document.getElementById('view-appointment-modal').classList.remove('hidden');
};


window.completeJob = async function(id) {
    try {
        if (typeof showAlert !== 'undefined') showAlert('Info', 'Completing job...', '');
        
        if (window.globalEventBus) {
            window.globalEventBus.publish({
                type: 'job_completion_requested',
                payload: { id }
            });
            
            // update local state optimistically
            const t = appState.tickets.find(x => x.id === id);
            if (t) {
                t.status = 'Completed';
            }
            
            if (typeof showAlert !== 'undefined') showAlert('Success', 'Job completed and moved to Data View!', '');
            if (typeof renderWaitingJobs !== 'undefined') renderWaitingJobs();
            if (typeof renderCalendar !== 'undefined') renderCalendar();
            if (typeof updateDataStats !== 'undefined') updateDataStats();
        } else {
            const updates = { STATUS: 'Completed' };
            const { error } = await sbClient.from('records').update(updates).eq('id', id);
            if (error) throw error;
            
            // update local state
            const t = appState.tickets.find(x => x.id === id);
            if (t) {
                t.status = 'Completed';
            }
            
            if (typeof showAlert !== 'undefined') showAlert('Success', 'Job completed and moved to Data View!', '');
            if (typeof renderWaitingJobs !== 'undefined') renderWaitingJobs();
            if (typeof renderCalendar !== 'undefined') renderCalendar();
            if (typeof updateDataStats !== 'undefined') updateDataStats();
        }
    } catch(e) {
        console.error(e);
        if (typeof showAlert !== 'undefined') showAlert('Error', e.message, '');
    }
};

window.renderWaitingJobs = function() {
    const container = document.getElementById('waiting-tree-container');
    if (!container) return;

    const tickets = appState.tickets || [];
    
    // Filter waiting jobs
    const waitingJobs = tickets.filter(t => {
        const stat = t.status || '';
        const isStatusCompleted = (stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamland' || t.invoiced === true);
        return !isStatusCompleted; // Only show if NOT completed
    });

    if (waitingJobs.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#64748b;">No waiting jobs found.</div>';
        return;
    }

    // Group by Date
    const groupedByDate = {};
    waitingJobs.forEach(t => {
        const dateStr = t.invoiceDate || 'No Date';
        if (!groupedByDate[dateStr]) groupedByDate[dateStr] = [];
        groupedByDate[dateStr].push(t);
    });

    // Sort dates
    const sortedDates = Object.keys(groupedByDate).sort();

    let html = '';
    sortedDates.forEach(dateStr => {
        html += `
        <div style="background:white; border-radius:8px; border:1px solid #e2e8f0; overflow:hidden;">
            <div style="background:#f1f5f9; padding:12px 20px; font-weight:700; color:#334155; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; gap:10px;">
                <i data-lucide="calendar-days" style="width:18px;height:18px;"></i> ${dateStr}
                <span style="background:#f59e0b; color:white; font-size:0.75rem; padding:2px 8px; border-radius:12px; margin-left:auto;">${groupedByDate[dateStr].length} Jobs</span>
            </div>
            <div style="padding:10px;">
        `;
        
        const categoryNames = {
            'S1': 'MENU UPDATE',
            'S2': 'CREDIT CARD',
            'S3': 'DATA RESET',
            'S4': 'SERVICE',
            'S5': 'OTHER',
            'S6': 'TILL SETUP'
        };

        const dayJobs = groupedByDate[dateStr].sort((a,b) => (a.startTime || '').localeCompare(b.startTime || ''));
        
        dayJobs.forEach((t, index) => {
            const catName = categoryNames[t.mainService] || '';
            const displayService = t.mainService ? `${t.mainService} - ${catName}` : 'N/A';
            
            html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #f1f5f9; hover:background:#f8fafc; gap:15px;">
                <div style="display:flex; flex-wrap:wrap; align-items:center; gap:15px; cursor:pointer; flex:1;" onclick="openAppointmentView('${t.id}')">
                    <span style="font-weight:700; color:#334155; min-width:40px;">#${index + 1}</span>
                    <span style="font-weight:600; color:#0f172a; min-width:180px;">${t.startTime || '00:00'} - ${t.company || 'Unknown Company'}</span>
                    <span style="font-size:0.85rem; color:#64748b; display:flex; align-items:center; gap:4px;"><i data-lucide="tag" style="width:12px;height:12px;"></i> ${displayService}</span>
                    <span style="font-size:0.85rem; color:#64748b; display:flex; align-items:center; gap:4px;"><i data-lucide="map-pin" style="width:12px;height:12px;"></i> ${t.postcode || 'N/A'}</span>
                    <span style="font-size:0.85rem; color:${t.paymentStatus === 'Chargeable' ? '#ef4444' : '#10b981'}; font-weight:600; display:flex; align-items:center; gap:4px;"><i data-lucide="info" style="width:12px;height:12px;"></i> ${t.paymentStatus || 'N/A'}</span>
                </div>
                <div>
                    <button onclick="openAppointmentView('${t.id}')" style="background:#f59e0b; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 1px 2px rgba(0,0,0,0.1);" title="View Details">
                        <i data-lucide="clock" style="width:14px;height:14px;"></i> Waiting
                    </button>
                </div>
            </div>
            `;
        });
        
        html += `
            </div>
        </div>
        `;
    });

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
};

