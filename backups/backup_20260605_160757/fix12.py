import codecs

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

# Fix 1: local timestamp update
old_logic_ts = """            r.invoiceDate = newDate;
            r.startTime = newTime;
            r.timestamp = updates.timestamp;"""

new_logic_ts = """            r.invoiceDate = newDate;
            r.startTime = newTime;
            r.timestamp = new Date(newDate + 'T' + (newTime || '00:00') + ':00').toISOString();"""

if old_logic_ts in ui:
    ui = ui.replace(old_logic_ts, new_logic_ts)
else:
    # Let's use regex in case of slight whitespace difference
    import re
    ui = re.sub(r'r\.invoiceDate\s*=\s*newDate;\s*r\.startTime\s*=\s*newTime;\s*r\.timestamp\s*=\s*updates\.timestamp;', new_logic_ts, ui)

# Fix 2: Calendar render
old_render_block = """dayCell.innerHTML += `
                    <div class="calendar-event ${statusClass}" onclick="event.stopPropagation(); openAppointmentView('${t.id}')" title="${compName} - ${t.mainService}">
                        <span style="overflow: hidden; text-overflow: ellipsis;">${timeStr} ${compName}</span>
                        <span>${isCompleted ? '<i data-lucide="check-circle" style="width:10px;height:10px"></i>' : '<i data-lucide="clock" style="width:10px;height:10px"></i>'}</span>
                    </div>
                `;"""

new_render_block = """dayCell.innerHTML += `
                    <div class="calendar-event ${statusClass}" onclick="event.stopPropagation(); openAppointmentView('${t.id}')" title="${compName} - ${t.mainService}" style="display:flex; flex-direction:column;">
                        <div style="display:flex; justify-content:space-between; width:100%;">
                            <span style="overflow: hidden; text-overflow: ellipsis; white-space:nowrap; font-weight:700;">${timeStr} ${compName}</span>
                            <span>${isCompleted ? '<i data-lucide="check-circle" style="width:10px;height:10px"></i>' : '<i data-lucide="clock" style="width:10px;height:10px"></i>'}</span>
                        </div>
                        <div style="font-size: 0.70rem; opacity: 0.9; margin-top:2px; font-weight:500;">${t.mainService}</div>
                    </div>
                `;"""

if old_render_block in ui:
    ui = ui.replace(old_render_block, new_render_block)
else:
    # Regex for safety
    pattern = re.compile(r'dayCell\.innerHTML\s*\+=\s*`\s*<div class="calendar-event \$\{statusClass\}" onclick="event\.stopPropagation\(\); openAppointmentView\(\'\$\{t\.id\}\'\)" title="\$\{compName\} - \$\{t\.mainService\}">\s*<span style="overflow: hidden; text-overflow: ellipsis;">\$\{timeStr\} \$\{compName\}</span>\s*<span>\$\{isCompleted \? \'<i data-lucide="check-circle" style="width:10px;height:10px"></i>\' : \'<i data-lucide="clock" style="width:10px;height:10px"></i>\'\}</span>\s*</div>\s*`;')
    ui = pattern.sub(new_render_block, ui)


with codecs.open('js/ui.js', 'w', 'utf8') as f:
    f.write(ui)

print("Fixed local timestamp update and calendar event rendering")
