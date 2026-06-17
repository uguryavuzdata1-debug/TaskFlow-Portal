import codecs
import re

with codecs.open('index.html', 'r', 'utf8') as f:
    html = f.read()

# Make it a global function
func_injection = """
  <script>
    window.initPickers = function() {
        if (typeof flatpickr !== 'undefined') {
            flatpickr('input[type="date"]', {
                dateFormat: "Y-m-d",
                disableMobile: true
            });
            flatpickr('input[type="time"]', {
                enableTime: true,
                noCalendar: true,
                dateFormat: "H:i",
                time_24hr: true,
                disableMobile: true
            });
        }
    };
    document.addEventListener("DOMContentLoaded", window.initPickers);
  </script>
</body>
"""

html = re.sub(r'<script>\s*document\.addEventListener\("DOMContentLoaded", function\(\) \{\s*flatpickr[^\<]+</script>\s*</body>', func_injection, html)

with codecs.open('index.html', 'w', 'utf8') as f:
    f.write(html)
    
with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

# Call window.initPickers() at the end of openInvoiceModal, createAppointmentForSlot, and renderDataTable
ui = ui.replace("document.getElementById('invoice-modal').classList.remove('hidden');", "document.getElementById('invoice-modal').classList.remove('hidden'); if(window.initPickers) window.initPickers();")
ui = ui.replace("document.getElementById('quick-add-modal').classList.remove('hidden');", "document.getElementById('quick-add-modal').classList.remove('hidden'); if(window.initPickers) window.initPickers();")

with codecs.open('js/ui.js', 'w', 'utf8') as f:
    f.write(ui)

print("Updated initPickers")
