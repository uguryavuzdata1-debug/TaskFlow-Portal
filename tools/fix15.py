import codecs

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

# Fix 1: Monthly Calendar waitingCount logic
old_logic1 = """            const waitingCount = list.filter(t => {
                const stat = t.status || '';
                return !(stat === 'Completed' || stat === 'Tamamland' || stat === 'Tamamland' || t.invoiced === true);
            }).length;"""

# Wait, in the string I printed it said "stat === 'Tamamland' || stat === 'Tamamland'"
# Let's just use string replace carefully or regex.
import re
new_logic1 = """            const waitingCount = list.filter(t => {
                const stat = t.status || '';
                const isStatusCompleted = (stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamland' || t.invoiced === true);
                
                let isFuture = false;
                if (t.timestamp) {
                    const tDate = new Date(t.timestamp);
                    const now = new Date();
                    // Just check if it's strictly in the future (tomorrow or beyond, or later today)
                    if (tDate > now) isFuture = true;
                }
                
                if (isFuture) return true; // always waiting if future
                return !isStatusCompleted;
            }).length;"""

# We'll use a regex for old_logic1 because the string had a typo 'Tamamland' twice
ui = re.sub(r'const waitingCount = list\.filter\(t => \{\s*const stat = t\.status \|\| \'\';\s*return !\(stat === \'Completed\' \|\| stat === \'Tamamland\' \|\| stat === \'Tamamland\' \|\| t\.invoiced === true\);\s*\}\)\.length;', new_logic1, ui)


# Fix 2: Day View Hourly Logic
old_logic2 = "const isCompleted = t.status === 'Completed' || t.status === 'Tamamland' || t.invoiced === true;"
new_logic2 = """let isFuture = false;
                if (t.timestamp) {
                    const tDate = new Date(t.timestamp);
                    if (tDate > new Date()) isFuture = true;
                }
                const isCompleted = !isFuture && (t.status === 'Completed' || t.status === 'Tamamlandı' || t.status === 'Tamamland' || t.invoiced === true);"""

ui = ui.replace(old_logic2, new_logic2)


with codecs.open('js/ui.js', 'w', 'utf8') as f:
    f.write(ui)

print("Updated completion logic for future appointments")
