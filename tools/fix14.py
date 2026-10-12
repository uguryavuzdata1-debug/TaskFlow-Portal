import codecs
import re

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

# We need to replace the ticket rendering loop inside renderCalendar.
# The old loop looks like:
# const tickets = appState.tickets || [];
# tickets.forEach(t => { ... });

old_logic_pattern = re.compile(r'const tickets = appState\.tickets \|\| \[\];\s*tickets\.forEach\(t => \{.*?(?:if \(window\.lucide\) window\.lucide\.createIcons\(\);)?\s*\}\s*window\.renderCalendar = renderCalendar;', re.DOTALL)

new_logic = """const tickets = appState.tickets || [];
    
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
window.renderCalendar = renderCalendar;"""

if old_logic_pattern.search(ui):
    ui = old_logic_pattern.sub(new_logic, ui)
    with codecs.open('js/ui.js', 'w', 'utf8') as f:
        f.write(ui)
    print("Updated renderCalendar logic to group by day")
else:
    print("Could not find the target renderCalendar loop")

