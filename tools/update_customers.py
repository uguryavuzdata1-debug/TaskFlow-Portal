import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_customers_html = """
  <section id="section-customers" class="section">
    <div class="wrap" style="max-width:1120px; margin:0 auto; padding:2rem 1.5rem 4rem;">
      <div class="eyebrow" style="font-family:'IBM Plex Mono',monospace; font-size:0.72rem; color:var(--steel); margin-bottom:0.5rem; text-transform:uppercase;">TASKFLOW PORTAL / CUSTOMERS</div>
      <h1 style="font-size:clamp(1.5rem,3vw,2rem); margin:0 0 1.5rem; font-weight:700; color:var(--ink); letter-spacing:-0.01em;">Customer Directory</h1>

      <!-- 1. Search Box & Autocomplete -->
      <div style="position:relative; max-width:600px; margin-bottom:2.5rem; z-index:10;">
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <input type="text" id="customer-search" placeholder="Search by organization name or postcode..." style="flex:1; padding:0.8rem 1rem; font-size:1rem; border:1px solid var(--ink); border-radius:2px; background:var(--card); color:var(--ink); box-shadow:inset 0 2px 4px rgba(0,0,0,0.02); font-family:'IBM Plex Sans',sans-serif;">
          <button class="ticket-btn primary" style="padding:0.8rem 1.5rem; font-size:1rem; font-weight:600; background:var(--ink); color:var(--paper); border:1px solid var(--ink); box-shadow:2px 2px 0 rgba(29,36,48,0.2); cursor:pointer; font-family:'IBM Plex Sans',sans-serif; border-radius:2px;">Search</button>
        </div>
        
        <!-- Autocomplete Dropdown (Mockup) -->
        <div class="autocomplete-panel" style="position:absolute; top:100%; left:0; right:95px; background:var(--card); border:1px solid var(--ink); border-top:none; box-shadow:4px 4px 0 rgba(29,36,48,0.12); margin-top:-1px;">
          <div class="ac-row" style="padding:0.7rem 1rem; border-bottom:1px dashed var(--line); display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
            <span style="font-size:0.9rem; color:var(--ink); font-weight:500;">Blue Anchor <span style="background:var(--amber); color:var(--ink); padding:0 2px; border-radius:2px;">Keb</span>ab House</span>
            <span style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">B91 3ER</span>
          </div>
          <div class="ac-row" style="padding:0.7rem 1rem; border-bottom:1px dashed var(--line); display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:rgba(0,0,0,0.02);">
            <span style="font-size:0.9rem; color:var(--ink); font-weight:500;"><span style="background:var(--amber); color:var(--ink); padding:0 2px; border-radius:2px;">Keb</span>abish Original</span>
            <span style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel);">B10 0UU</span>
          </div>
          <div style="padding:0.5rem 1rem; background:var(--paper); font-family:'IBM Plex Mono',monospace; font-size:0.65rem; color:var(--steel); border-top:1px solid var(--ink);">
            ↑↓ to navigate · Enter to select · fills postcode and status automatically
          </div>
        </div>
      </div>

      <!-- 2. Filter Toolbar -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--line); padding-bottom:1rem; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div style="font-family:'IBM Plex Mono',monospace; font-size:0.8rem; color:var(--ink); font-weight:600;">Showing 24 matching businesses</div>
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
          <select style="padding:0.4rem 0.8rem; border:1px solid var(--ink); background:var(--card); color:var(--ink); font-family:'IBM Plex Sans',sans-serif; font-size:0.85rem; border-radius:2px; cursor:pointer;">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Dormant</option>
          </select>
          <select style="padding:0.4rem 0.8rem; border:1px solid var(--ink); background:var(--card); color:var(--ink); font-family:'IBM Plex Sans',sans-serif; font-size:0.85rem; border-radius:2px; cursor:pointer;">
            <option>Sort by Name</option>
            <option>Sort by Postcode</option>
            <option>Recently Serviced</option>
          </select>
        </div>
      </div>

      <!-- 3. Customer Cards Grid -->
      <div id="customers-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:1.5rem;">
        <!-- Card 1 -->
        <div class="cust-card" style="background:var(--card); border:1px solid var(--ink); border-radius:2px; padding:1.2rem; position:relative; box-shadow:4px 4px 0 rgba(29,36,48,0.12); overflow:hidden;">
          <div class="stub" style="position:absolute; top:0; right:0; width:34px; height:34px; border-left:1px dashed var(--line); border-bottom:1px dashed var(--line);"></div>
          <span style="display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:0.65rem; font-weight:600; color:var(--green); border:1px solid currentColor; border-radius:20px; padding:2px 8px; margin-bottom:0.8rem;">ACTIVE</span>
          
          <h3 style="margin:0 0 0.2rem; font-size:1.1rem; font-weight:700; color:var(--ink);">Blue Anchor Kebab House</h3>
          <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel); margin-bottom:1rem;">B91 3ER · ACCT-0089</div>
          
          <div style="font-size:0.8rem; color:var(--ink); margin-bottom:0.4rem; display:flex; justify-content:space-between;">
            <span style="color:var(--steel);">Contact</span> <span>Mehmet Yilmaz</span>
          </div>
          <div style="font-size:0.8rem; color:var(--ink); margin-bottom:0.4rem; display:flex; justify-content:space-between;">
            <span style="color:var(--steel);">Last Service</span> <span style="font-family:'IBM Plex Mono',monospace;">24 Sep 2026</span>
          </div>
          <div style="font-size:0.8rem; color:var(--ink); margin-bottom:1.2rem; display:flex; justify-content:space-between;">
            <span style="color:var(--steel);">Open Balance</span> <span style="font-family:'IBM Plex Mono',monospace; color:var(--clay); font-weight:600;">£680.00</span>
          </div>
          
          <div style="display:flex; gap:0.8rem; border-top:1px dashed var(--line); padding-top:1rem;">
            <a href="#" style="font-size:0.8rem; font-weight:600; color:var(--blue); text-decoration:none;">View Detail</a>
            <a href="#" style="font-size:0.8rem; font-weight:600; color:var(--blue); text-decoration:none;">Add Appt</a>
            <a href="#" style="font-size:0.8rem; font-weight:600; color:var(--blue); text-decoration:none;">Invoice</a>
          </div>
        </div>
        
        <!-- Card 2 -->
        <div class="cust-card" style="background:var(--card); border:1px solid var(--ink); border-radius:2px; padding:1.2rem; position:relative; box-shadow:4px 4px 0 rgba(29,36,48,0.12); overflow:hidden;">
          <div class="stub" style="position:absolute; top:0; right:0; width:34px; height:34px; border-left:1px dashed var(--line); border-bottom:1px dashed var(--line);"></div>
          <span style="display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:0.65rem; font-weight:600; color:var(--steel); border:1px solid currentColor; border-radius:20px; padding:2px 8px; margin-bottom:0.8rem;">DORMANT</span>
          
          <h3 style="margin:0 0 0.2rem; font-size:1.1rem; font-weight:700; color:var(--ink);">Kebabish Original</h3>
          <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel); margin-bottom:1rem;">B10 0UU · ACCT-0124</div>
          
          <div style="font-size:0.8rem; color:var(--ink); margin-bottom:0.4rem; display:flex; justify-content:space-between;">
            <span style="color:var(--steel);">Contact</span> <span>Ali Raza</span>
          </div>
          <div style="font-size:0.8rem; color:var(--ink); margin-bottom:0.4rem; display:flex; justify-content:space-between;">
            <span style="color:var(--steel);">Last Service</span> <span style="font-family:'IBM Plex Mono',monospace;">12 May 2025</span>
          </div>
          <div style="font-size:0.8rem; color:var(--ink); margin-bottom:1.2rem; display:flex; justify-content:space-between;">
            <span style="color:var(--steel);">Open Balance</span> <span style="font-family:'IBM Plex Mono',monospace; color:var(--ink); font-weight:600;">£0.00</span>
          </div>
          
          <div style="display:flex; gap:0.8rem; border-top:1px dashed var(--line); padding-top:1rem;">
            <a href="#" style="font-size:0.8rem; font-weight:600; color:var(--blue); text-decoration:none;">View Detail</a>
            <a href="#" style="font-size:0.8rem; font-weight:600; color:var(--blue); text-decoration:none;">Add Appt</a>
            <a href="#" style="font-size:0.8rem; font-weight:600; color:var(--blue); text-decoration:none;">Invoice</a>
          </div>
        </div>
        
      </div>
    </div>
  </section>
"""

# Replace the existing section-customers
s_idx = html.find('<section id="section-customers"')
if s_idx != -1:
    e_idx = html.find('</section>', s_idx) + 10
    html = html[:s_idx] + new_customers_html + html[e_idx:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
