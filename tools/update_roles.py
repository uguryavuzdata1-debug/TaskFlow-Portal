import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Role-Based Access Settings HTML
roles_html = """
    <!-- ROLE BASED ACCESS SETTINGS -->
    <style>
    .roles-wrap { max-width:700px; margin: 3rem auto 2rem; }
    .roles-eyebrow { font-family:'IBM Plex Mono',monospace; font-size:0.72rem; color:var(--steel); margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.02em;}
    .roles-title { font-size:1.4rem; font-weight:700; color:var(--ink); margin:0 0 1.5rem; letter-spacing:-0.01em;}

    .role-cards { display:flex; gap:1.2rem; margin-bottom:2rem; flex-wrap:wrap; }
    .rcard { flex:1; min-width:200px; background:var(--card); border:1px solid var(--ink); border-radius:2px; box-shadow:4px 4px 0 rgba(29,36,48,0.12); padding:1.2rem; position:relative; overflow:hidden;}
    .rcard .stamp { position:absolute; top:14px; right:-20px; font-family:'IBM Plex Mono',monospace; font-size:0.65rem; font-weight:600; border:1.5px solid currentColor; padding:2px 18px; transform:rotate(30deg); letter-spacing:0.5px;}
    .rcard.admin .stamp { color:var(--clay); }
    .rcard.user .stamp { color:var(--blue); }
    .rcard.acc .stamp { color:var(--green); }
    .rcard .rname { font-size:1.05rem; font-weight:600; color:var(--ink); margin:0 0 0.3rem;}
    .rcard .rcount { font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);}

    .matrix-wrap { overflow-x:auto; margin-bottom:2rem; border-bottom:1px solid var(--ink); padding-bottom:1px; }
    .matrix { width:100%; min-width:550px; border-collapse:collapse; text-align:left; }
    .matrix th { font-family:'IBM Plex Mono',monospace; font-size:0.7rem; color:var(--steel); padding:0.8rem 1rem; border-bottom:1px dashed var(--line); font-weight:500;}
    .matrix td { padding:0.8rem 1rem; border-bottom:1px dashed var(--line); color:var(--ink); font-size:0.85rem;}
    .matrix .group-row td { font-family:'IBM Plex Mono',monospace; font-size:0.65rem; color:var(--steel); padding:1.2rem 1rem 0.4rem; border-bottom:none; font-weight:600;}
    .matrix tr:last-child td { border-bottom:1px solid var(--ink); }

    .chk { display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; font-size: 14px;}
    .chk.yes { background:var(--green); color:var(--paper); border:1px solid var(--ink); border-radius:2px;}
    .chk.no { border:1.5px dashed var(--steel); color:transparent; border-radius:2px;}
    .chk.na { color:var(--steel); font-weight:700;}

    .roles-foot { display:flex; justify-content:flex-end; gap:0.8rem;}
    .r-btn { font-family:'IBM Plex Sans',sans-serif; font-size:0.85rem; font-weight:600; padding:0.6rem 1.2rem; cursor:pointer; border-radius:2px; transition:all 0.15s;}
    .r-btn.ghost { background:transparent; border:1px solid var(--ink); color:var(--ink);}
    .r-btn.primary { background:var(--ink); border:1px solid var(--ink); color:var(--paper); box-shadow:2px 2px 0 rgba(29,36,48,0.2);}
    .r-btn:active { transform:translate(2px,2px); box-shadow:none; }
    </style>

    <div class="roles-wrap">
      <div class="roles-eyebrow">SYSTEM SETTINGS</div>
      <h2 class="roles-title">Role-Based Access</h2>

      <div class="role-cards">
        <div class="rcard admin">
          <div class="stamp">FULL ACCESS</div>
          <h3 class="rname">Administrator</h3>
          <div class="rcount">2 Users</div>
        </div>
        <div class="rcard user">
          <div class="stamp">STANDARD</div>
          <h3 class="rname">Field Technician</h3>
          <div class="rcount">14 Users</div>
        </div>
        <div class="rcard acc">
          <div class="stamp">FINANCIAL</div>
          <h3 class="rname">Accounting</h3>
          <div class="rcount">3 Users</div>
        </div>
      </div>

      <div class="matrix-wrap">
        <table class="matrix">
          <thead>
            <tr>
              <th style="width:40%;">MODULE / ACTION</th>
              <th style="width:20%; text-align:center;">ADMIN</th>
              <th style="width:20%; text-align:center;">TECHNICIAN</th>
              <th style="width:20%; text-align:center;">ACCOUNTING</th>
            </tr>
          </thead>
          <tbody>
            <tr class="group-row"><td colspan="4">APPOINTMENTS</td></tr>
            <tr><td>View Schedule</td><td style="text-align:center;"><div class="chk yes">✓</div></td><td style="text-align:center;"><div class="chk yes">✓</div></td><td style="text-align:center;"><div class="chk no"></div></td></tr>
            <tr><td>Create / Edit</td><td style="text-align:center;"><div class="chk yes">✓</div></td><td style="text-align:center;"><div class="chk yes">✓</div></td><td style="text-align:center;"><div class="chk no"></div></td></tr>
            <tr><td>Delete</td><td style="text-align:center;"><div class="chk yes">✓</div></td><td style="text-align:center;"><div class="chk no"></div></td><td style="text-align:center;"><div class="chk no"></div></td></tr>
            
            <tr class="group-row"><td colspan="4">CUSTOMERS</td></tr>
            <tr><td>View Directory</td><td style="text-align:center;"><div class="chk yes">✓</div></td><td style="text-align:center;"><div class="chk yes">✓</div></td><td style="text-align:center;"><div class="chk yes">✓</div></td></tr>
            <tr><td>Create / Edit</td><td style="text-align:center;"><div class="chk yes">✓</div></td><td style="text-align:center;"><div class="chk no"></div></td><td style="text-align:center;"><div class="chk yes">✓</div></td></tr>
            
            <tr class="group-row"><td colspan="4">INVOICES</td></tr>
            <tr><td>View Ledger</td><td style="text-align:center;"><div class="chk yes">✓</div></td><td style="text-align:center;"><div class="chk no"></div></td><td style="text-align:center;"><div class="chk yes">✓</div></td></tr>
            <tr><td>Issue / Edit</td><td style="text-align:center;"><div class="chk yes">✓</div></td><td style="text-align:center;"><div class="chk no"></div></td><td style="text-align:center;"><div class="chk yes">✓</div></td></tr>
            <tr><td>Mark as Paid</td><td style="text-align:center;"><div class="chk yes">✓</div></td><td style="text-align:center;"><div class="chk no"></div></td><td style="text-align:center;"><div class="chk yes">✓</div></td></tr>

            <tr class="group-row"><td colspan="4">SETTINGS</td></tr>
            <tr><td>System Config</td><td style="text-align:center;"><div class="chk yes">✓</div></td><td style="text-align:center;"><div class="chk no"></div></td><td style="text-align:center;"><div class="chk no"></div></td></tr>
            <tr><td>Manage Users</td><td style="text-align:center;"><div class="chk yes">✓</div></td><td style="text-align:center;"><div class="chk na">—</div></td><td style="text-align:center;"><div class="chk na">—</div></td></tr>
          </tbody>
        </table>
      </div>

      <div class="roles-foot">
        <button class="r-btn ghost">Discard Changes</button>
        <button class="r-btn primary">Save Permissions</button>
      </div>
    </div>
"""

# Find the end of section-settings.
# It starts at <section id="section-settings" class="section">
start_idx = html.find('<section id="section-settings" class="section">')
if start_idx != -1:
    end_idx = html.find('</section>', start_idx)
    if end_idx != -1:
        # Insert roles_html right before </section>
        html = html[:end_idx] + roles_html + '\n  ' + html[end_idx:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
