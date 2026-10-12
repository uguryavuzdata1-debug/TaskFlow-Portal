import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

roles_html = """
          <h2 style="font-size:1.2rem; font-weight:700; color:var(--ink); margin:0 0 1rem;">Role-Based Access Settings</h2>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1.5rem; margin-bottom:2rem;">
              
              <!-- ADMIN -->
              <div style="background:var(--card); border:1px solid var(--ink); padding:1.5rem; position:relative; box-shadow:4px 4px 0 rgba(29,36,48,0.12);">
                  <span class="stamp delete" style="position:absolute; top:1.5rem; right:1.5rem; font-family:'IBM Plex Mono',monospace;">ADMIN</span>
                  <div style="font-weight:700; color:var(--ink); font-size:1.1rem; margin-bottom:0.2rem;">Administrator</div>
                  <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel); margin-bottom:1.5rem;">2 USERS IN ROLE</div>
                  
                  <div style="border-top:1px dashed var(--line); padding-top:1rem;">
                      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem; color:var(--ink);">
                          <span>Appointments</span>
                          <span style="color:var(--green);"><i data-lucide="check" style="width:16px;height:16px;"></i></span>
                      </div>
                      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem; color:var(--ink);">
                          <span>Customers</span>
                          <span style="color:var(--green);"><i data-lucide="check" style="width:16px;height:16px;"></i></span>
                      </div>
                      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem; color:var(--ink);">
                          <span>Invoices</span>
                          <span style="color:var(--green);"><i data-lucide="check" style="width:16px;height:16px;"></i></span>
                      </div>
                      <div style="display:flex; justify-content:space-between; font-size:0.9rem; color:var(--ink);">
                          <span>Settings</span>
                          <span style="color:var(--green);"><i data-lucide="check" style="width:16px;height:16px;"></i></span>
                      </div>
                  </div>
              </div>
              
              <!-- USER (TECHNICIAN) -->
              <div style="background:var(--card); border:1px solid var(--ink); padding:1.5rem; position:relative; box-shadow:4px 4px 0 rgba(29,36,48,0.12);">
                  <span class="stamp auth" style="position:absolute; top:1.5rem; right:1.5rem; font-family:'IBM Plex Mono',monospace; background:var(--blue); color:var(--card);">USER</span>
                  <div style="font-weight:700; color:var(--ink); font-size:1.1rem; margin-bottom:0.2rem;">Field Technician</div>
                  <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel); margin-bottom:1.5rem;">12 USERS IN ROLE</div>
                  
                  <div style="border-top:1px dashed var(--line); padding-top:1rem;">
                      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem; color:var(--ink);">
                          <span>Appointments</span>
                          <span style="color:var(--green);"><i data-lucide="check" style="width:16px;height:16px;"></i></span>
                      </div>
                      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem; color:var(--ink);">
                          <span>Customers</span>
                          <span style="color:var(--steel);"><i data-lucide="minus" style="width:16px;height:16px;"></i></span>
                      </div>
                      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem; color:var(--ink);">
                          <span>Invoices</span>
                          <span style="color:var(--steel);"><i data-lucide="minus" style="width:16px;height:16px;"></i></span>
                      </div>
                      <div style="display:flex; justify-content:space-between; font-size:0.9rem; color:var(--ink);">
                          <span>Settings</span>
                          <span style="color:var(--steel);"><i data-lucide="minus" style="width:16px;height:16px;"></i></span>
                      </div>
                  </div>
              </div>

              <!-- ACCOUNTING -->
              <div style="background:var(--card); border:1px solid var(--ink); padding:1.5rem; position:relative; box-shadow:4px 4px 0 rgba(29,36,48,0.12);">
                  <span class="stamp create" style="position:absolute; top:1.5rem; right:1.5rem; font-family:'IBM Plex Mono',monospace; background:var(--green); color:var(--card);">FINANCE</span>
                  <div style="font-weight:700; color:var(--ink); font-size:1.1rem; margin-bottom:0.2rem;">Accounting</div>
                  <div style="font-family:'IBM Plex Mono',monospace; font-size:0.75rem; color:var(--steel); margin-bottom:1.5rem;">3 USERS IN ROLE</div>
                  
                  <div style="border-top:1px dashed var(--line); padding-top:1rem;">
                      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem; color:var(--ink);">
                          <span>Appointments</span>
                          <span style="color:var(--steel);"><i data-lucide="minus" style="width:16px;height:16px;"></i></span>
                      </div>
                      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem; color:var(--ink);">
                          <span>Customers</span>
                          <span style="color:var(--green);"><i data-lucide="check" style="width:16px;height:16px;"></i></span>
                      </div>
                      <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem; color:var(--ink);">
                          <span>Invoices</span>
                          <span style="color:var(--green);"><i data-lucide="check" style="width:16px;height:16px;"></i></span>
                      </div>
                      <div style="display:flex; justify-content:space-between; font-size:0.9rem; color:var(--ink);">
                          <span>Settings</span>
                          <span style="color:var(--steel);"><i data-lucide="minus" style="width:16px;height:16px;"></i></span>
                      </div>
                  </div>
              </div>

          </div>
"""

html = html.replace('<!-- ROLES NOT FOUND -->', roles_html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
