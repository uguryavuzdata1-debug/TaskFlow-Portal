import codecs
import re

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

# Fix 1: waitingCount logic in renderCalendar
new_logic1 = """            const waitingCount = list.filter(t => {
                const stat = t.status || '';
                const isStatusCompleted = (stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamland' || t.invoiced === true);
                
                let isFuture = false;
                if (t.timestamp) {
                    const tDate = new Date(t.timestamp);
                    const now = new Date();
                    // Just check if it's strictly in the future
                    if (tDate > now) isFuture = true;
                }
                
                if (isFuture) return true; // always waiting if future
                return !isStatusCompleted;
            }).length;"""

# Replace in ui.js using regex
ui = re.sub(
    r'const waitingCount = list\.filter\(t => \{\s*const stat = t\.status \|\| \'\';\s*return !\(stat === \'Completed\' \|\| stat === \'Tamamland\' \|\| stat === \'Tamamland\' \|\| t\.invoiced === true\);\s*\}\)\.length;',
    new_logic1, 
    ui
)

# Fix 2: isCompleted logic in openDayView
new_logic2 = """let isFuture = false;
                if (t.timestamp) {
                    const tDate = new Date(t.timestamp);
                    if (tDate > new Date()) isFuture = true;
                }
                const isCompleted = !isFuture && (t.status === 'Completed' || t.status === 'Tamamlandı' || t.status === 'Tamamland' || t.invoiced === true);"""

ui = re.sub(
    r'const isCompleted = t\.status === \'Completed\' \|\| t\.status === \'Tamamland\' \|\| t\.invoiced === true;',
    new_logic2,
    ui
)

with codecs.open('js/ui.js', 'w', 'utf8') as f:
    f.write(ui)

print("Fixed logic")
