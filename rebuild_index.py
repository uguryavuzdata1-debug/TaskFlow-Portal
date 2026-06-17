import codecs
import re

html_head = codecs.open('index_head.html', 'r', 'utf-16le').read()
backup_html = codecs.open('backups/backup_20260529_1110/index.html', 'r', 'utf-8').read()

# 1. Fonts and Lucide Icons (We already have lucide, let's add Inter)
inter_font = '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">'
html_head = html_head.replace('</title>', '</title>\n  ' + inter_font)

# 2. Rebuild the Nav
nav_replacement = """
<nav class="nav hidden" id="main-nav">
  <div class="nav-brand" onclick="showTab('dashboard')" style="display: flex; align-items: center; gap: 10px;">
    <img src="ika2.PNG" alt="Logo" style="height: 32px; width: auto;">
  </div>
  <div class="nav-links">
    <button class="nav-link active" onclick="showTab('dashboard')" id="btn-dashboard">
        <i data-lucide="layout-dashboard" class="nav-icon"></i> Dashboard
    </button>
    <button class="nav-link" onclick="showTab('customers')" id="btn-customers">
        <i data-lucide="users" class="nav-icon"></i> Customers
    </button>
    <button class="nav-link" onclick="showTab('dataview')" id="btn-dataview">
        <i data-lucide="briefcase-business" class="nav-icon"></i> Services
    </button>
    <button class="nav-link" onclick="showTab('invoices')" id="btn-invoices">
        <i data-lucide="receipt" class="nav-icon"></i> Invoices
    </button>
    <button class="nav-link" onclick="showTab('calendar')" id="btn-calendar">
        <i data-lucide="calendar" class="nav-icon"></i> Calendar
    </button>
    <button class="nav-link" onclick="showTab('waiting')" id="btn-waiting">
        <i data-lucide="ticket" class="nav-icon"></i> CRM Tickets
    </button>
  </div>
  <div class="user-profile" id="user-display-area" style="display: flex; align-items: center; gap: 15px;">
      <span id="current-user-name" style="font-weight: 600; color: #1e293b;">Admin</span>
      <span style="color: #e2e8f0;">|</span>
      <button id="btn-settings" onclick="showTab('settings')" class="settings-btn" title="Settings">
        <i data-lucide="settings" style="width: 18px; height: 18px;"></i>
      </button>
      <a href="#" onclick="logout()" class="logout-btn">
        <i data-lucide="log-out" style="width: 16px; height: 16px;"></i> Logout
      </a>
  </div>
</nav>
"""
nav_match = re.search(r'<nav.*?</nav>', html_head, flags=re.DOTALL)
if nav_match:
    html_head = html_head.replace(nav_match.group(0), nav_replacement)

# 3. Rebuild Dashboard Hero and KPIs
dashboard_replacement = """
  <section id="section-dashboard" class="section active">
    <div class="dashboard-hero">
        <h1 id="hero-greeting">Good afternoon, John 👋</h1>
        <p>Manage your services, track CRM tickets, and simplify your invoicing workflow.</p>
    </div>
    
    <div class="kpi-grid">
        <div class="kpi-card" onclick="showTab('waiting')">
            <div class="kpi-header">
                <span class="kpi-label">Open Tickets</span>
                <i data-lucide="ticket" class="kpi-icon text-primary"></i>
            </div>
            <div class="kpi-value" id="kpi-tickets">0</div>
        </div>
        <div class="kpi-card" onclick="showTab('customers')">
            <div class="kpi-header">
                <span class="kpi-label">Active Customers</span>
                <i data-lucide="users" class="kpi-icon text-success"></i>
            </div>
            <div class="kpi-value" id="kpi-customers">0</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-header">
                <span class="kpi-label">Monthly Revenue</span>
                <i data-lucide="bar-chart-3" class="kpi-icon text-warning"></i>
            </div>
            <div class="kpi-value" id="kpi-revenue">£0</div>
        </div>
        <div class="kpi-card" onclick="showTab('invoices')">
            <div class="kpi-header">
                <span class="kpi-label">Pending Invoices</span>
                <i data-lucide="receipt" class="kpi-icon text-danger"></i>
            </div>
            <div class="kpi-value" id="kpi-invoices">0</div>
        </div>
    </div>

    <!-- Quick Actions -->
    <h3 style="margin-bottom: 1rem; color: #0F172A; font-weight: 600;">Quick Actions</h3>
    <div class="tiles-grid" style="margin-bottom: 2rem;">
        <div class="tile" onclick="document.getElementById('gc-quick-add-modal').classList.remove('hidden')">
            <div class="tile-icon" style="background: #eff6ff; color: #1d4ed8;"><i data-lucide="plus"></i></div>
            <div class="tile-title">Create Ticket</div>
            <div class="tile-desc">Add a new service request</div>
        </div>
        <div class="tile" onclick="showTab('customers')">
            <div class="tile-icon" style="background: #f0fdf4; color: #10b981;"><i data-lucide="user-plus"></i></div>
            <div class="tile-title">New Customer</div>
            <div class="tile-desc">Register a new client</div>
        </div>
        <div class="tile" onclick="showTab('invoices')">
            <div class="tile-icon" style="background: #fffbeb; color: #f59e0b;"><i data-lucide="file-plus"></i></div>
            <div class="tile-title">Create Invoice</div>
            <div class="tile-desc">Generate a new bill</div>
        </div>
        <div class="tile" onclick="openDatabaseReset()">
            <div class="tile-icon" style="background: #fef2f2; color: #ef4444;"><i data-lucide="database-zap"></i></div>
            <div class="tile-title">Reset Demo</div>
            <div class="tile-desc">Clear test data</div>
        </div>
    </div>
  </section>
"""
dash_match = re.search(r'<section id="section-dashboard".*?</section>', html_head, flags=re.DOTALL)
if dash_match:
    html_head = html_head.replace(dash_match.group(0), dashboard_replacement)

# 4. CRM / Customers Header Redesign
# In index_head.html, Customers is `section-customers`
cust_match = re.search(r'(<section id="section-customers"[^>]*>.*?)(<div class="filter-panel"|<div style="display:flex)', html_head, flags=re.DOTALL)
if cust_match:
    new_cust_header = f"""<section id="section-customers" class="section white-section">
    <div class="crm-header">
        <div>
            <h2>Customers</h2>
            <p>Manage customer accounts and service requests.</p>
        </div>
        <button class="btn btn-primary" onclick="openCustomerModal()"><i data-lucide="plus"></i> New Customer</button>
    </div>
    
    <div class="crm-search-bar">
        <i data-lucide="search" class="search-icon"></i>
        <input type="text" id="customer-search-saas" placeholder="Search customers, invoices or tickets..." oninput="filterCustomersSaaS(this.value)">
    </div>
    
    <!-- Old filter panel removed or hidden -->
    <div class="filter-panel hidden">
"""
    html_head = html_head.replace(cust_match.group(1), new_cust_header)


# 5. Extract Old Calendar & Waiting sections from backup
cal_match = re.search(r'<!-- CALENDAR SECTION -->.*?</section>', backup_html, flags=re.DOTALL)
wait_match = re.search(r'<!-- WAITING JOBS SECTION -->.*?</section>', backup_html, flags=re.DOTALL)

cal_sec = cal_match.group(0) if cal_match else ""
wait_sec = wait_match.group(0) if wait_match else ""

# 6. Apply Google Calendar markup to cal_sec
gc_section = """<!-- CALENDAR SECTION -->
  <section id="section-calendar" class="section">
    <div class="gc-container">
      <div class="gc-sidebar">
        <button class="gc-create-btn" onclick="gcOpenQuickAdd()">
          <i data-lucide="plus" style="width:18px;height:18px;"></i> Create
        </button>
        <div id="gc-mini-calendar"></div>
        <div class="gc-calendars-list">
          <h3 style="color:#0F172A">My calendars</h3>
          <div id="gc-staff-filters">
             <!-- Render checkboxes here -->
          </div>
        </div>
      </div>
      
      <div class="gc-main">
        <div class="gc-header">
          <div class="gc-header-left">
            <button class="gc-btn-today" onclick="gcGoToday()">Today</button>
            <div class="gc-nav-arrows">
              <button onclick="gcPrevWeek()">&lt;</button>
              <button onclick="gcNextWeek()">&gt;</button>
            </div>
            <h2 id="gc-date-range">...</h2>
          </div>
          <div class="gc-header-right">
            <select id="gc-view-select" class="gc-view-select">
              <option value="week">Week</option>
            </select>
          </div>
        </div>
        
        <div class="gc-grid-container">
          <div id="gc-week-view" class="gc-view active">
            <div class="gc-week-header">
              <div class="gc-time-col-spacer">GMT+01</div>
              <div class="gc-days-header" id="gc-days-header">
              </div>
            </div>
            <div class="gc-week-body">
              <div class="gc-time-col" id="gc-time-col">
              </div>
              <div class="gc-day-cols" id="gc-day-cols">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
"""

# Insert Calendar and Waiting before </main>
html_head = html_head.replace('</main>', f"{gc_section}\n{wait_sec}\n</main>")


# 7. Modals
view_match = re.search(r'<!-- View/Edit Appointment Modal -->.*?</div>\s*</div>\s*</div>\s*</div>', backup_html, flags=re.DOTALL)
if not view_match:
    idx_start = backup_html.find('<!-- View/Edit Appointment Modal -->')
    idx_end = backup_html.find('<!-- QUICK ADD MODAL -->')
    view_modal = backup_html[idx_start:idx_end]
else:
    view_modal = view_match.group(0)

day_match = re.search(r'<!-- Day View Modal -->.*?</div>\s*</div>\s*</div>', backup_html, flags=re.DOTALL)
if not day_match:
    idx_start = backup_html.find('<!-- Day View Modal -->')
    idx_end = backup_html.find('<!-- View/Edit Appointment Modal -->')
    day_modal = backup_html[idx_start:idx_end]
else:
    day_modal = day_match.group(0)

gc_modal = """<!-- QUICK ADD MODAL -->
<div id="gc-quick-add-modal" class="modal-overlay hidden" style="z-index: 3005; align-items:flex-start; padding-top:100px;">
  <div class="gc-modal-content">
    <div class="gc-modal-header">
      <input type="text" id="gc-qa-title" class="gc-title-input" placeholder="Add title">
      <button class="close-btn" style="background:transparent; color:#64748B; border:none;" onclick="document.getElementById('gc-quick-add-modal').classList.add('hidden')">&times;</button>
    </div>
    
    <div class="gc-modal-tabs">
        <button class="gc-tab active">Event</button>
        <button class="gc-tab">Task</button>
    </div>
    
    <div class="gc-modal-body">
        <div class="gc-field-row">
            <i data-lucide="clock" class="gc-icon"></i>
            <div style="display:flex; gap:10px; flex:1;">
                <input type="date" id="gc-qa-date" class="gc-input">
                <input type="time" id="gc-qa-time" class="gc-input">
            </div>
        </div>
        <div class="gc-field-row">
            <i data-lucide="tag" class="gc-icon"></i>
            <select id="gc-qa-category" class="gc-input">
                <option value="S1">MENU UPDATE</option>
                <option value="S2">CREDIT CARD</option>
                <option value="S3">DATA RESET</option>
                <option value="S4">SERVICE</option>
                <option value="S5">OTHER</option>
                <option value="S6">TILL SETUP</option>
            </select>
        </div>
        
        <div style="margin-top:20px; text-align:right;">
            <button class="btn btn-primary" onclick="gcSubmitQuickAdd()">Save</button>
        </div>
    </div>
  </div>
</div>
"""

script_idx = html_head.rfind('<script src="app.js"></script>')
if script_idx == -1: script_idx = html_head.rfind('</body>')

html_head = html_head[:script_idx] + f"\n{view_modal}\n{day_modal}\n{gc_modal}\n" + html_head[script_idx:]

# Ensure scripts
gc_script = """<script src="js/gc_calendar.js"></script>
<script>
  if(typeof lucide !== 'undefined') lucide.createIcons();
  
  // Custom global search function mock
  window.filterCustomersSaaS = function(val) {
      if(window.filterCustomers) window.filterCustomers();
  };
</script>
</body>"""
html_head = html_head.replace('</body>', gc_script)

# Remove utf-16le meta just in case
html_head = html_head.replace('charset="UTF-16LE"', 'charset="UTF-8"').replace('charset="utf-16le"', 'charset="UTF-8"')

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html_head)
    
print("index.html successfully rebuilt from scratch!")
