import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update section-dataview (Services)
dataview_html = """
  <section id="section-dataview" class="section">
    <div class="wrap invoice-wrap">
      <div class="eyebrow" style="font-family:'IBM Plex Mono',monospace; font-size:0.72rem; color:var(--steel); margin-bottom:0.5rem; text-transform:uppercase;">TASKFLOW PORTAL / SERVICES</div>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem); margin:0 0 1.5rem; font-weight:700; color:var(--ink); letter-spacing:-0.01em;">Service Database</h1>
      
      <div class="toolbar" style="display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1.5rem; border-bottom:1px dashed var(--line); padding-bottom:1rem;">
        <input type="text" id="dataview-search" placeholder="Search by Company, ID, or description..." oninput="renderDataTable()" style="padding:0.6rem 1rem; border:1px solid var(--ink); background:var(--card); font-family:'IBM Plex Sans',sans-serif; flex:1; min-width:250px; border-radius:2px;">
        <select id="dataview-category-filter" onchange="showDataSubTab(this.value)" style="padding:0.6rem 1rem; border:1px solid var(--ink); background:var(--card); font-family:'IBM Plex Sans',sans-serif; border-radius:2px;">
          <option value="all">ALL DEPARTMENTS</option>
          <option value="S1">MENU UPDATE</option>
          <option value="S2">CREDIT CARD</option>
          <option value="S4">SERVICE</option>
          <option value="S6">PROGRAMMING / TILL</option>
        </select>
        <select id="dataview-payment-filter" onchange="renderDataTable()" style="padding:0.6rem 1rem; border:1px solid var(--ink); background:var(--card); font-family:'IBM Plex Sans',sans-serif; border-radius:2px;">
          <option value="all">ALL STATUSES</option>
          <option value="Chargeable">Chargeable</option>
          <option value="Contract">Contract</option>
          <option value="Free">Free</option>
        </select>
      </div>

      <div class="ledger" style="margin-bottom:2rem;">
        <div class="ledger-head" style="grid-template-columns:100px 1.5fr 1fr 100px 100px 80px;">
            <div>DATE</div><div>COMPANY</div><div>SERVICE INFO</div><div>STATUS</div><div>AMOUNT</div><div></div>
        </div>

        <!-- MOCK ROWS - WILL BE REPLACED BY JS LATER -->
        <div id="data-table-body-mock">
          <div class="ledger-row" style="grid-template-columns:100px 1.5fr 1fr 100px 100px 80px; align-items:center;">
            <div class="inv-no">24 Sep 2026</div><div><div style="font-weight:600;">Blue Anchor Kebab</div><div style="font-family:'IBM Plex Mono',monospace; font-size:0.7rem; color:var(--steel);">#TKT-9912</div></div>
            <div style="font-size:0.85rem;">Till programming & Menu update</div>
            <span class="ledger-tag auth" style="background:var(--steel); color:var(--paper);">CONTRACT</span>
            <div class="amt" style="font-weight:600; font-family:'IBM Plex Mono',monospace;">£0.00</div><a class="view-link">View</a>
          </div>
          <div class="ledger-row" style="grid-template-columns:100px 1.5fr 1fr 100px 100px 80px; align-items:center;">
            <div class="inv-no">23 Sep 2026</div><div><div style="font-weight:600;">Riverside Pharmacy</div><div style="font-family:'IBM Plex Mono',monospace; font-size:0.7rem; color:var(--steel);">#TKT-9911</div></div>
            <div style="font-size:0.85rem;">Hardware repair S4</div>
            <span class="ledger-tag create" style="background:var(--green); color:var(--paper);">CHARGEABLE</span>
            <div class="amt" style="font-weight:600; font-family:'IBM Plex Mono',monospace;">£150.00</div><a class="view-link">View</a>
          </div>
        </div>
        
        <!-- HIDDEN ACTUAL TBODY FOR JS TO RENDER INTO -->
        <div id="data-table-body" style="display:none;"></div>
      </div>
    </div>
  </section>
"""

s_idx = html.find('<section id="section-dataview"')
if s_idx != -1:
    e_idx = html.find('</section>', s_idx) + 10
    html = html[:s_idx] + dataview_html + html[e_idx:]


# 2. Update section-waiting (Appointments List)
waiting_html = """
  <section id="section-waiting" class="section">
    <div class="wrap invoice-wrap">
      <div class="eyebrow" style="font-family:'IBM Plex Mono',monospace; font-size:0.72rem; color:var(--steel); margin-bottom:0.5rem; text-transform:uppercase;">TASKFLOW PORTAL / APPOINTMENTS</div>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem); margin:0 0 1.5rem; font-weight:700; color:var(--ink); letter-spacing:-0.01em;">Appointments List</h1>
      
      <div class="toolbar" style="display:flex; justify-content:flex-end; margin-bottom:1.5rem; border-bottom:1px dashed var(--line); padding-bottom:1rem;">
        <button class="ticket-btn primary" onclick="toggleMainForm('category')" style="background:var(--ink); color:var(--paper); border:1px solid var(--ink); box-shadow:2px 2px 0 rgba(29,36,48,0.2);">+ Schedule New</button>
      </div>

      <div class="ledger" style="margin-bottom:2rem;">
        <div class="ledger-head" style="grid-template-columns:120px 1.5fr 1fr 120px 80px;">
            <div>TIME</div><div>CUSTOMER</div><div>TECHNICIAN</div><div>STATUS</div><div></div>
        </div>
        
        <!-- MOCK ROWS -->
        <div id="waiting-tree-container-mock">
          <div class="ledger-row" style="grid-template-columns:120px 1.5fr 1fr 120px 80px; align-items:center;">
            <div class="inv-no">Today 09:00</div><div><div style="font-weight:600;">Greenway Motors</div><div style="font-family:'IBM Plex Mono',monospace; font-size:0.7rem; color:var(--steel);">SO15 2AX</div></div>
            <div style="font-size:0.85rem;">David Whitfield</div>
            <span class="ledger-tag create" style="background:var(--green); color:var(--paper);">CONFIRMED</span><a class="view-link">View</a>
          </div>
          <div class="ledger-row" style="grid-template-columns:120px 1.5fr 1fr 120px 80px; align-items:center;">
            <div class="inv-no">Today 13:30</div><div><div style="font-weight:600;">Riverside Pharmacy</div><div style="font-family:'IBM Plex Mono',monospace; font-size:0.7rem; color:var(--steel);">CV1 4GH</div></div>
            <div style="font-size:0.85rem;">Unassigned</div>
            <span class="ledger-tag auth" style="background:var(--amber); color:var(--ink);">PENDING</span><a class="view-link">View</a>
          </div>
        </div>
        
        <div id="waiting-tree-container" style="display:none;"></div>
      </div>
    </div>
  </section>
"""

s_idx = html.find('<section id="section-waiting"')
if s_idx != -1:
    e_idx = html.find('</section>', s_idx) + 10
    html = html[:s_idx] + waiting_html + html[e_idx:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
