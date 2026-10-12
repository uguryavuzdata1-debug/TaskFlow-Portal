import codecs
import re

html = codecs.open('index.html', 'r', 'utf-8').read()

# We need to add Reports and Settings to the .nav-links area
# Wait, Settings is already in the user profile area at the bottom.
# But the user explicitly asked for "Settings" in the main list:
# "Dashboard, Customers, Services, CRM Tickets, Invoices, Reports, Settings"

# Find </button> inside <div class="nav-links">
nav_links_match = re.search(r'(<div class="nav-links">.*?</button>\s*)+', html, flags=re.DOTALL)

if nav_links_match:
    new_links = """
    <button class="nav-link" onclick="showTab('reports')" id="btn-reports">
        <i data-lucide="bar-chart-3" class="nav-icon"></i> Reports
    </button>
    <button class="nav-link" onclick="showTab('settings')" id="btn-settings-nav">
        <i data-lucide="settings" class="nav-icon"></i> Settings
    </button>
"""
    # Insert at the end of the nav-links div
    idx = html.find('</div>', nav_links_match.end() - 20)
    if idx != -1:
        html = html[:idx] + new_links + html[idx:]

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)
