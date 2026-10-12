import codecs
import re

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
    ui = re.sub(r'r\.invoiceDate\s*=\s*newDate;\s*r\.startTime\s*=\s*newTime;\s*r\.timestamp\s*=\s*updates\.timestamp;', new_logic_ts, ui)

# Fix 2: Calendar render with strikethrough
new_render_block = """dayCell.innerHTML += `
                    <div class="calendar-event ${statusClass}" onclick="event.stopPropagation(); openAppointmentView('${t.id}')" title="${compName} - ${t.mainService}" style="display:flex; flex-direction:column; ${isCompleted ? 'text-decoration: line-through; opacity: 0.7;' : ''}">
                        <div style="display:flex; justify-content:space-between; width:100%;">
                            <span style="overflow: hidden; text-overflow: ellipsis; white-space:nowrap; font-weight:700;">${timeStr} ${compName}</span>
                            <span>${isCompleted ? '<i data-lucide="check-circle" style="width:10px;height:10px"></i>' : '<i data-lucide="clock" style="width:10px;height:10px"></i>'}</span>
                        </div>
                        <div style="font-size: 0.70rem; opacity: 0.9; margin-top:2px; font-weight:500;">${t.mainService}</div>
                    </div>
                `;"""

pattern = re.compile(r'dayCell\.innerHTML\s*\+=\s*`\s*<div class="calendar-event \$\{statusClass\}" onclick="event\.stopPropagation\(\); openAppointmentView\(\'\$\{t\.id\}\'\)" title="\$\{compName\} - \$\{t\.mainService\}">\s*<span style="overflow: hidden; text-overflow: ellipsis;">\$\{timeStr\} \$\{compName\}</span>\s*<span>\$\{isCompleted \? \'<i data-lucide="check-circle" style="width:10px;height:10px"></i>\' : \'<i data-lucide="clock" style="width:10px;height:10px"></i>\'\}</span>\s*</div>\s*`;')
ui = pattern.sub(new_render_block, ui)


# Also we should update day view hourly slots to include strikethrough
# The hour slots are rendered in openDayView
# We'll just replace the hour slot render to also have strikethrough.
old_hour_render = """<div class="calendar-event ${statusClass}" style="margin-bottom:5px; padding:8px 12px; cursor:pointer;" onclick="openAppointmentView('${t.id}');" title="${t.company} - ${t.mainService}">
                        <div style="font-weight:600; font-size:0.95rem;">${t.startTime} - ${t.company}</div>
                        <div style="font-size:0.85rem; opacity:0.9;">${t.mainService} | Ticket: ${t.crmTicket}</div>
                    </div>"""

new_hour_render = """<div class="calendar-event ${statusClass}" style="margin-bottom:5px; padding:8px 12px; cursor:pointer; ${isCompleted ? 'text-decoration: line-through; opacity: 0.7;' : ''}" onclick="openAppointmentView('${t.id}');" title="${t.company} - ${t.mainService}">
                        <div style="font-weight:600; font-size:0.95rem;">${t.startTime} - ${t.company}</div>
                        <div style="font-size:0.85rem; opacity:0.9;">${t.mainService} | Ticket: ${t.crmTicket}</div>
                    </div>"""

if old_hour_render in ui:
    ui = ui.replace(old_hour_render, new_hour_render)
else:
    pattern_hour = re.compile(r'<div class="calendar-event \$\{statusClass\}" style="margin-bottom:5px; padding:8px 12px; cursor:pointer;" onclick="openAppointmentView\(\'\$\{t\.id\}\'\);" title="\$\{t\.company\} - \$\{t\.mainService\}">\s*<div style="font-weight:600; font-size:0.95rem;">\$\{t\.startTime\} - \$\{t\.company\}</div>\s*<div style="font-size:0.85rem; opacity:0.9;">\$\{t\.mainService\} \| Ticket: \$\{t\.crmTicket\}</div>\s*</div>')
    ui = pattern_hour.sub(new_hour_render, ui)


with codecs.open('js/ui.js', 'w', 'utf8') as f:
    f.write(ui)

print("Fixed")
