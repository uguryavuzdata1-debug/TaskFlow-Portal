import codecs
import re

html = codecs.open('index.html', 'r', 'utf-8').read()

# 1. Wrap nav and main in layout-wrapper
# We want to find where <nav class="nav hidden" id="main-nav"> starts
nav_idx = html.find('<nav class="nav hidden" id="main-nav">')
if nav_idx != -1:
    # Change nav class to sidebar
    html = html[:nav_idx] + '<div class="layout-wrapper">\n' + html[nav_idx:]
    html = html.replace('<nav class="nav hidden" id="main-nav">', '<nav class="sidebar hidden" id="main-nav">')
    
    # We must close the layout-wrapper at the end of <main>
    main_end_idx = html.find('</main>')
    if main_end_idx != -1:
        html = html[:main_end_idx+7] + '\n</div>\n' + html[main_end_idx+7:]

# 2. Update Customer Table Headers
table_header_old = """<thead>
            <tr>
              <th style="padding: 15px; text-align: left;">CUSTOMER ID</th>
              <th style="padding: 15px; text-align: left;">COMPANY</th>"""

table_header_new = """<thead>
            <tr>
              <th style="padding: 15px; text-align: left;">Customer</th>
              <th style="padding: 15px; text-align: left;">Status</th>
              <th style="padding: 15px; text-align: left;">Tickets</th>
              <th style="padding: 15px; text-align: left;">Last Activity</th>"""

# Let's use regex to replace the old headers. We know the current structure.
# Find the table in section-customers
cust_match = re.search(r'(<table id="customers-table".*?<thead>\s*<tr>\s*)(.*?)(</tr>\s*</thead>)', html, flags=re.DOTALL)
if cust_match:
    new_th = """<th>Customer</th>
              <th>Status</th>
              <th>Tickets</th>
              <th>Last Activity</th>
              <th>Actions</th>"""
    html = html[:cust_match.start(2)] + new_th + html[cust_match.end(2):]

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)
    
print("Updated index.html layout and table headers.")
