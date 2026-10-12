import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Update Dashboard KPIs
kpis_replacements = [
    # KPI 1
    (r'<div class="kpi-value">12</div>', r'<div class="kpi-value" id="dash-kpi-pending">12</div>'),
    (r'<div class="kpi-label">PENDING</div>', r'<div class="kpi-label">PENDING</div>'),
    
    # KPI 2
    (r'<div class="kpi-value" style="color:var\(--green\);">8</div>', r'<div class="kpi-value" id="dash-kpi-completed" style="color:var(--green);">8</div>'),
    (r'<div class="kpi-label">CONFIRMED</div>', r'<div class="kpi-label">CONFIRMED</div>'),
    
    # KPI 3
    (r'<div class="kpi-value" style="color:var\(--clay\);">3</div>', r'<div class="kpi-value" id="dash-kpi-overdue" style="color:var(--clay);">3</div>'),
    
    # KPI 4
    (r'<div class="kpi-value" style="color:var\(--ink\);">£1,450</div>', r'<div class="kpi-value" id="dash-kpi-revenue" style="color:var(--ink);">£1,450</div>')
]

for old, new in kpis_replacements:
    html = re.sub(old, new, html)

# Update Dashboard Schedule List
schedule_old = r'<div style="font-weight:700; color:var\(--ink\); margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">.*?<div class="dash-schedule-row"'
html = re.sub(r'(<div style="font-weight:700; color:var\(--ink\); margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">\s*<div>Today\'s Schedule</div>\s*<a href="#" class="view-link" onclick="showTab\(\'calendar\'\)">Open Calendar &rarr;</a>\s*</div>)', r'\1\n<div id="dashboard-schedule-list">', html)

# Close the div at the end of the schedule (find the nearest </div></div> right before Recent Activity)
html = html.replace('<!-- RECENT ACTIVITY -->', '</div>\n<!-- RECENT ACTIVITY -->')

# Update Recent Activity List
activity_old = r'(<div style="font-weight:700; color:var\(--ink\); margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">\s*<div>Recent Activity</div>\s*<a href="#" class="view-link">View All &rarr;</a>\s*</div>)'
html = re.sub(activity_old, r'\1\n<div id="dashboard-activity-list">', html)

# Close it at the end of section-dashboard
html = html.replace('</section>\n\n  <!-- CALENDAR SECTION -->', '</div>\n</section>\n\n  <!-- CALENDAR SECTION -->')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
