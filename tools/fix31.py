import codecs
import re

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

# Update the filter in renderInvoicesTable
old_filter_invoice = "let filtered = appState.tickets.filter(t => t.paymentStatus === 'Chargeable');"
new_filter_invoice = """let filtered = appState.tickets.filter(t => {
        const stat = t.status || '';
        return t.paymentStatus === 'Chargeable' && (stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamland' || t.invoiced === true);
    });"""

if old_filter_invoice in ui:
    ui = ui.replace(old_filter_invoice, new_filter_invoice)
    with codecs.open('js/ui.js', 'w', 'utf8') as f:
        f.write(ui)
    print("Replaced Invoice Filter")
else:
    print("Could not find invoice filter")
