import codecs

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

old_loop = """        const dayJobs = groupedByDate[dateStr].sort((a,b) => (a.startTime || '').localeCompare(b.startTime || ''));
        
        dayJobs.forEach(t => {
            html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #f1f5f9; hover:background:#f8fafc;">
                <div style="display:flex; flex-direction:column; gap:4px; cursor:pointer;" onclick="openAppointmentView('${t.id}')">
                    <div style="font-weight:600; color:#0f172a;">${t.startTime || '00:00'} - ${t.company || 'Unknown Company'}</div>
                    <div style="font-size:0.85rem; color:#64748b; display:flex; gap:10px;">
                        <span><i data-lucide="tag" style="width:12px;height:12px;"></i> ${t.mainService || 'N/A'}</span>
                        <span><i data-lucide="ticket" style="width:12px;height:12px;"></i> Ticket: ${t.crmTicket || 'N/A'}</span>
                    </div>
                </div>"""

new_loop = """        const categoryNames = {
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
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #f1f5f9; hover:background:#f8fafc;">
                <div style="display:flex; flex-direction:column; gap:4px; cursor:pointer;" onclick="openAppointmentView('${t.id}')">
                    <div style="font-weight:600; color:#0f172a;">${t.startTime || '00:00'} - ${t.company || 'Unknown Company'}</div>
                    <div style="font-size:0.85rem; color:#64748b; display:flex; gap:10px;">
                        <span><i data-lucide="tag" style="width:12px;height:12px;"></i> ${displayService}</span>
                        <span><i data-lucide="list-ordered" style="width:12px;height:12px;"></i> Sıra: ${index + 1}</span>
                    </div>
                </div>"""

if "Ticket:" in old_loop:
    # safe replace
    if old_loop in ui:
        ui = ui.replace(old_loop, new_loop)
        with codecs.open('js/ui.js', 'w', 'utf8') as f:
            f.write(ui)
        print("Updated loop with sequence number and full service name")
    else:
        print("Could not find old loop block exactly")
