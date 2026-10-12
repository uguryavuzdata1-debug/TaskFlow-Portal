import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. First, let's find section-admin bounds
start_idx = html.find('<!-- ADMIN PANEL SECTION -->')
if start_idx == -1:
    start_idx = html.find('<section id="section-admin"')
    
end_idx = html.find('</section>', start_idx)
if start_idx != -1 and end_idx != -1:
    end_idx += 10
    
    # We will replace the entire section-admin with the tabbed version
    
    # Role-Based Access string is somewhere in there or in html. Let's find it.
    roles_start = html.find('<!-- ROLE BASED ACCESS SETTINGS -->')
    roles_end = html.find('</div>\n      \n      <!-- SYSTEM ACTIVITY LOGS -->')
    if roles_start == -1:
        roles_start = html.find('<style>\n    .roles-wrap')
    if roles_start != -1:
        # Just grab the block
        match = re.search(r'(<style>.*?</div>\n    </div>)', html[roles_start:roles_start+4000], re.DOTALL)
        if match:
            roles_html = match.group(1)
        else:
            roles_html = "<!-- ROLES NOT FOUND -->"
    else:
        roles_html = "<!-- ROLES NOT FOUND -->"
        
    admin_tabbed_html = f"""
  <!-- ADMIN PANEL SECTION -->
  <section id="section-admin" class="section">
    <div class="wrap" style="max-width:1120px; margin:0 auto; padding:2rem 1.5rem 4rem;">
      <div class="eyebrow" style="font-family:'IBM Plex Mono',monospace; font-size:0.72rem; color:var(--steel); margin-bottom:0.5rem; text-transform:uppercase;">TASKFLOW PORTAL / SYSTEM</div>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem); margin:0 0 1.5rem; font-weight:700; color:var(--ink); letter-spacing:-0.01em;">Admin Panel</h1>
      
      <!-- ADMIN TABS -->
      <div style="display:flex; gap:1.5rem; border-bottom:1px solid var(--ink); margin-bottom:2rem; overflow-x:auto;">
        <button class="admin-tab-btn active" onclick="showAdminPane('users')" style="background:transparent; border:none; border-bottom:3px solid var(--ink); padding:0.8rem 1rem; font-family:'IBM Plex Sans',sans-serif; font-weight:600; font-size:1rem; color:var(--ink); cursor:pointer;">Personnel</button>
        <button class="admin-tab-btn" onclick="showAdminPane('roles')" style="background:transparent; border:none; border-bottom:3px solid transparent; padding:0.8rem 1rem; font-family:'IBM Plex Sans',sans-serif; font-weight:600; font-size:1rem; color:var(--steel); cursor:pointer;">Roles & Access</button>
        <button class="admin-tab-btn" onclick="showAdminPane('logs')" style="background:transparent; border:none; border-bottom:3px solid transparent; padding:0.8rem 1rem; font-family:'IBM Plex Sans',sans-serif; font-weight:600; font-size:1rem; color:var(--steel); cursor:pointer;">System Logs</button>
        <button class="admin-tab-btn" onclick="showAdminPane('performance')" style="background:transparent; border:none; border-bottom:3px solid transparent; padding:0.8rem 1rem; font-family:'IBM Plex Sans',sans-serif; font-weight:600; font-size:1rem; color:var(--steel); cursor:pointer;">Performance</button>
      </div>

      <!-- PANE 1: USERS -->
      <div id="admin-pane-users" class="admin-pane">
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
          
          <h2 style="font-size:1.2rem; font-weight:700; color:var(--ink); margin:0 0 1rem;">Active Personnel Directory</h2>
          <div class="ledger">
            <div class="ledger-head" style="grid-template-columns:1fr 1fr 150px 100px;">
                <div>NAME</div><div>ROLE</div><div>STATUS</div><div></div>
            </div>
            <div class="ledger-row" style="grid-template-columns:1fr 1fr 150px 100px; align-items:center; padding:1rem;">
                <div style="font-weight:600;">Ugur Yavuz</div>
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">Administrator</div>
                <span class="ledger-tag create" style="background:var(--green); color:var(--paper);">ACTIVE</span>
                <a class="view-link">Edit</a>
            </div>
          </div>
      </div>

      <!-- PANE 2: ROLES & ACCESS -->
      <div id="admin-pane-roles" class="admin-pane" style="display:none;">
          {roles_html}
      </div>

      <!-- PANE 3: LOGS -->
      <div id="admin-pane-logs" class="admin-pane" style="display:none;">
          <h2 style="font-size:1.2rem; font-weight:700; color:var(--ink); margin:0 0 1rem;">System Activity Ledger</h2>
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
            <div class="ledger-row" style="grid-template-columns:140px 150px 120px 1fr; align-items:center; padding:1rem;">
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">2026-09-26 09:12</div>
                <div style="font-weight:600;">Ugur Yavuz</div>
                <span class="ledger-tag auth" style="background:var(--amber); color:var(--ink);">LOGIN</span>
                <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--ink);">Auth success via #VA-2026-0912</div>
            </div>
          </div>
      </div>

      <!-- PANE 4: PERFORMANCE -->
      <div id="admin-pane-performance" class="admin-pane" style="display:none;">
          <h2 style="font-size:1.2rem; font-weight:700; color:var(--ink); margin:0 0 1rem;">System Performance Metrics</h2>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1.5rem; margin-bottom:2rem;">
              <div style="background:var(--card); border:1px solid var(--ink); padding:1.5rem; box-shadow:4px 4px 0 rgba(29,36,48,0.12);">
                  <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel); margin-bottom:0.5rem;">API RESPONSE TIME</div>
                  <div style="font-size:2rem; font-weight:700; color:var(--green);">124ms</div>
              </div>
              <div style="background:var(--card); border:1px solid var(--ink); padding:1.5rem; box-shadow:4px 4px 0 rgba(29,36,48,0.12);">
                  <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel); margin-bottom:0.5rem;">DATABASE LOAD</div>
                  <div style="font-size:2rem; font-weight:700; color:var(--blue);">12%</div>
              </div>
              <div style="background:var(--card); border:1px solid var(--ink); padding:1.5rem; box-shadow:4px 4px 0 rgba(29,36,48,0.12);">
                  <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel); margin-bottom:0.5rem;">ACTIVE SESSIONS</div>
                  <div style="font-size:2rem; font-weight:700; color:var(--ink);">4</div>
              </div>
          </div>
          <div style="background:var(--paper); border:1px dashed var(--line); padding:2rem; text-align:center; color:var(--steel); font-family:'IBM Plex Mono',monospace;">
             [Chart Visualization Area]
          </div>
      </div>
      
    </div>
  </section>
"""
    
    html = html[:start_idx] + admin_tabbed_html + html[end_idx:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
