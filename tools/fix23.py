import codecs

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

old_tabcontent = """function renderTabContent(tabId) {
    if (tabId === 'dataview') renderDataTable();
    if (tabId === 'customers') renderCustomersTable();
    if (tabId === 'invoices') renderInvoicesTable();
    if (tabId === 'calendar') renderCalendar();
}"""

new_tabcontent = """function renderTabContent(tabId) {
    if (tabId === 'dataview') renderDataTable();
    if (tabId === 'customers') renderCustomersTable();
    if (tabId === 'invoices') renderInvoicesTable();
    if (tabId === 'calendar') renderCalendar();
    if (tabId === 'waiting' && typeof renderWaitingJobs !== 'undefined') renderWaitingJobs();
}"""

# Since spacing might be different, let's just do a simpler replace or regex
import re
pattern = re.compile(r"function renderTabContent\(tabId\) \{.*?(?=\})\}", re.DOTALL)

# Let's see what pattern actually matches
match = pattern.search(ui)
if match:
    # If waiting is not there
    if "tabId === 'waiting'" not in match.group(0):
        new_block = match.group(0)[:-1] + "    if (tabId === 'waiting' && typeof window.renderWaitingJobs !== 'undefined') window.renderWaitingJobs();\n}"
        ui = ui.replace(match.group(0), new_block)
        with codecs.open('js/ui.js', 'w', 'utf8') as f:
            f.write(ui)
        print("Updated renderTabContent")
    else:
        print("Already updated")
else:
    print("Could not find renderTabContent")
