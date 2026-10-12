import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add nav link
nav_link = """    <button class="nav-link" onclick="showTab('admin')" id="btn-admin">
        <i data-lucide="shield" class="nav-icon"></i> Admin Panel
    </button>
</div>"""
html = html.replace('</div>\n  <div class="user-profile-dropdown-wrapper">', nav_link + '\n  <div class="user-profile-dropdown-wrapper">')

# 2. Extract Role-Based Access from section-settings
start_idx = html.find('<!-- ROLE BASED ACCESS SETTINGS -->')
end_idx = html.find('</div>\n  </section>\n\n\n<section id="section-settings"', start_idx)
if end_idx == -1:
    end_idx = html.find('</section>', start_idx)

if start_idx != -1 and end_idx != -1:
    roles_html = html[start_idx:end_idx].strip()
    html = html[:start_idx] + html[end_idx:]
else:
    roles_html = "<!-- ROLES NOT FOUND -->"

# 3. Create section-admin
admin_html = f"""
  <!-- ADMIN PANEL SECTION -->
  <section id="section-admin" class="section">
    <div class="wrap" style="max-width:1120px; margin:0 auto; padding:2rem 1.5rem 4rem;">
      <div class="eyebrow" style="font-family:'IBM Plex Mono',monospace; font-size:0.72rem; color:var(--steel); margin-bottom:0.5rem; text-transform:uppercase;">TASKFLOW PORTAL / SYSTEM</div>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem); margin:0 0 2.5rem; font-weight:700; color:var(--ink); letter-spacing:-0.01em;">Admin Panel</h1>
      
      <!-- USER CREATION TICKET -->
      <div style="background:var(--card); border:1px solid var(--ink); border-radius:2px; padding:1.5rem; margin-bottom:3rem; box-shadow:4px 4px 0 rgba(29,36,48,0.12); position:relative;">
        <div class="stub" style="position:absolute; top:0; left:0; width:34px; height:100%; border-right:1px dashed var(--line);"></div>
        <div style="margin-left: 2.5rem;">
            <h2 style="font-size:1.2rem; font-weight:700; color:var(--ink); margin:0 0 1rem;">Create New Personnel</h2>
            <div style="display:flex; gap:1.5rem; flex-wrap:wrap; align-items:flex-end;">
                <div style="flex:1; min-width:200px;">
                    <label style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel); display:block; margin-bottom:0.3rem;">FULL NAME</label>
                    <input type="text" id="admin-new-user-name" placeholder="E.g. Jane Doe" style="width:100%; padding:0.8rem; border:1px solid var(--ink); background:var(--paper); font-family:'IBM Plex Sans',sans-serif; border-radius:2px;">
                </div>
                <div style="width:180px;">
                    <label style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel); display:block; margin-bottom:0.3rem;">ROLE / CLEARANCE</label>
                    <select id="admin-new-user-role" style="width:100%; padding:0.8rem; border:1px solid var(--ink); background:var(--paper); font-family:'IBM Plex Sans',sans-serif; border-radius:2px;">
                        <option value="User">Field Technician</option>
                        <option value="Accounting">Financial</option>
                        <option value="Admin">Administrator</option>
                    </select>
                </div>
                <div style="width:180px;">
                    <label style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel); display:block; margin-bottom:0.3rem;">TEMPORARY PASSWORD</label>
                    <input type="text" id="admin-new-user-pass" value="1234" style="width:100%; padding:0.8rem; border:1px solid var(--ink); background:var(--paper); font-family:'IBM Plex Mono',monospace; border-radius:2px;">
                </div>
                <button class="ticket-btn primary" onclick="adminAddUser()" style="padding:0.8rem 1.5rem; font-size:0.9rem; font-weight:600; background:var(--ink); color:var(--paper); border:1px solid var(--ink); box-shadow:2px 2px 0 rgba(29,36,48,0.2); cursor:pointer; border-radius:2px;">Authorize & Add</button>
            </div>
        </div>
      </div>

      <!-- ROLE BASED ACCESS -->
      {roles_html}

      <!-- SYSTEM ACTIVITY LOGS -->
      <div style="margin-top: 3rem;">
          <h2 class="roles-title">System Activity Log</h2>
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--line); padding-bottom:1rem; margin-bottom:1rem;">
            <div style="display:flex; gap:1rem;">
                <input type="text" placeholder="Search logs..." style="padding:0.5rem; border:1px solid var(--ink); background:var(--card); font-family:'IBM Plex Sans',sans-serif;">
                <select style="padding:0.5rem; border:1px solid var(--ink); background:var(--card); font-family:'IBM Plex Sans',sans-serif;">
                    <option>All Actions</option>
                    <option>Logins</option>
                    <option>Updates</option>
                </select>
            </div>
            <button class="ticket-btn ghost" style="padding:0.5rem 1rem; border:1px solid var(--ink); background:transparent; font-weight:600; font-size:0.85rem; border-radius:2px; cursor:pointer;"><i data-lucide="download" style="width:14px;height:14px;vertical-align:middle;"></i> Export Ledger</button>
          </div>
          
          <div class="ledger">
            <div class="ledger-head" style="grid-template-columns:140px 150px 120px 1fr;">
                <div>TIMESTAMP</div><div>USER</div><div>ACTION</div><div>DETAILS</div>
            </div>
            
            <div id="admin-logs-table-body">
              <!-- Mock row -->
              <div class="ledger-row" style="grid-template-columns:140px 150px 120px 1fr; align-items:center; padding:1rem;">
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">2026-09-26 09:12</div>
                <div style="font-weight:600;">Ugur Yavuz</div>
                <span class="ledger-tag auth" style="background:var(--amber); color:var(--ink);">LOGIN</span>
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--ink);">Auth success via #VA-2026-0912</div>
              </div>
              <div class="ledger-row" style="grid-template-columns:140px 150px 120px 1fr; align-items:center; padding:1rem;">
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">2026-09-26 09:15</div>
                <div style="font-weight:600;">John Doe</div>
                <span class="ledger-tag create" style="background:var(--green); color:var(--paper);">CREATE</span>
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--ink);">New invoice #INV-4402 added</div>
              </div>
              <div class="ledger-row" style="grid-template-columns:140px 150px 120px 1fr; align-items:center; padding:1rem;">
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">2026-09-26 09:18</div>
                <div style="font-weight:600;">Ugur Yavuz</div>
                <span class="ledger-tag delete" style="background:var(--clay); color:var(--paper);">DELETE</span>
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--ink);">Removed legacy customer #ACCT-0012</div>
              </div>
            </div>
          </div>
      </div>
      
    </div>
  </section>
"""

# Insert section-admin after section-dashboard
insert_idx = html.find('</section>\n\n  <!-- MY PREFERENCES SECTION -->')
if insert_idx == -1:
    insert_idx = html.find('</section>\n\n  <!-- CUSTOMERS SECTION -->')

if insert_idx != -1:
    # We want to insert after the closing </section>
    insert_idx += 10
    html = html[:insert_idx] + "\n" + admin_html + html[insert_idx:]
else:
    # Just append it to main content if we can't find dashboard
    main_idx = html.find('</main>')
    if main_idx != -1:
        html = html[:main_idx] + admin_html + html[main_idx:]


with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
