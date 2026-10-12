import codecs
import re

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

# Fix waitingJobs filter in renderWaitingJobs
old_waiting_filter = """    const waitingJobs = tickets.filter(t => {
        const stat = t.status || '';
        const isStatusCompleted = (stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamland' || t.invoiced === true);
        
        let isFuture = false;
        if (t.timestamp) {
            const tDate = new Date(t.timestamp);
            if (tDate > new Date()) isFuture = true;
        }
        
        if (isFuture) return true;
        return !isStatusCompleted;
    });"""

new_waiting_filter = """    const waitingJobs = tickets.filter(t => {
        const stat = t.status || '';
        const isStatusCompleted = (stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamland' || t.invoiced === true);
        return !isStatusCompleted; // Only show if NOT completed
    });"""

if old_waiting_filter in ui:
    ui = ui.replace(old_waiting_filter, new_waiting_filter)
    print("Fixed waitingJobs filter")
else:
    print("Could not find old_waiting_filter, trying regex")
    # try regex just in case spaces are slightly off
    pattern = re.compile(r"const waitingJobs = tickets\.filter.*?return !isStatusCompleted;\s*\}\);", re.DOTALL)
    if pattern.search(ui):
        ui = pattern.sub(new_waiting_filter, ui)
        print("Fixed waitingJobs filter with regex")


# Fix Data View Filter
# In my fix18, I tried replacing "let filtered = tickets;\n\n    if (activeDataTab === 'today') {"
# but activeDataTab isn't the variable used, it is appState.currentDataTab
# Let's search for "let filtered = appState.tickets;"
old_data_filter = """    let filtered = appState.tickets;
    
    // --- Data Scoping: Users only see their own tickets ---"""

new_data_filter = """    // Data View should ONLY show COMPLETED jobs!
    let filtered = appState.tickets.filter(t => {
        const stat = t.status || '';
        return (stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamland' || t.invoiced === true);
    });
    
    // --- Data Scoping: Users only see their own tickets ---"""

if "let filtered = appState.tickets;" in ui:
    ui = ui.replace(old_data_filter, new_data_filter)
    print("Fixed Data View filter")
else:
    print("Could not find Data View filter")

with codecs.open('js/ui.js', 'w', 'utf8') as f:
    f.write(ui)
