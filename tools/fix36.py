import codecs
import re

with codecs.open('index.html', 'r', 'utf8') as f:
    html = f.read()

# Add Flatpickr CDN if not exists
if 'flatpickr' not in html:
    head_injection = """
  <!-- Flatpickr for consistent Date & Time dropdowns -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
"""
    html = html.replace('</head>', head_injection + '</head>')
    
    # Also initialize flatpickr at the end of body
    body_injection = """
  <script>
    document.addEventListener("DOMContentLoaded", function() {
        // Initialize flatpickr on all date and time inputs
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
    });
  </script>
</body>
"""
    html = html.replace('</body>', body_injection)

with codecs.open('index.html', 'w', 'utf8') as f:
    f.write(html)
    
print("Flatpickr successfully injected into index.html!")
