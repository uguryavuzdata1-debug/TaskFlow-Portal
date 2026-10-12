import codecs
import re

css = codecs.open('style.css', 'r', 'utf-8').read()

# 1. Update CSS Variables (Root)
new_root = """:root {
  --bg-main: #F8FAFC;
  --bg-card: #FFFFFF;
  --bg-nav: #FFFFFF;
  --bg-hover: #F1F5F9;
  --border-color: #E2E8F0;
  
  --text-main: #0F172A; 
  --text-muted: #64748B;
  --text-hint: #94A3B8;
  
  --primary: #1D4ED8; 
  --primary-hover: #1E40AF;
  --secondary: #0F172A;
  
  --success-bg: #D1FAE5;
  --success-text: #10B981;
  --error-bg: #FEE2E2;
  --error-text: #EF4444;
  --warning-bg: #FEF3C7;
  --warning-text: #F59E0B;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body { 
  font-family: 'Inter', sans-serif; 
  background: var(--bg-main); 
  color: var(--text-main); 
  line-height: 1.5;
  font-size: 14px;
  min-height: 100vh;
}
"""
# Replace from :root down to body { ... }
root_match = re.search(r':root\s*{.*?body\s*{[^}]*}', css, flags=re.DOTALL)
if root_match:
    css = css.replace(root_match.group(0), new_root)


# 2. Add SaaS Styles for Dashboard and CRM
saas_css = """
/* MODERN SAAS UI STYLES */
.dashboard-hero {
    margin-bottom: 24px;
}
.dashboard-hero h1 {
    font-size: 28px;
    font-weight: 700;
    color: var(--secondary);
    letter-spacing: -0.02em;
    margin-bottom: 8px;
}
.dashboard-hero p {
    color: var(--text-muted);
    font-size: 15px;
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 24px;
    margin-bottom: 32px;
}
.kpi-card {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.06);
    border: 1px solid var(--border-color);
    transition: all 0.2s ease;
    cursor: pointer;
}
.kpi-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.12);
    border-color: var(--primary);
}
.kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}
.kpi-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-muted);
}
.kpi-icon {
    width: 20px;
    height: 20px;
}
.text-primary { color: var(--primary); }
.text-success { color: var(--success-text); }
.text-warning { color: var(--warning-text); }
.text-danger { color: var(--error-text); }

.kpi-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--secondary);
    letter-spacing: -0.02em;
}

/* Update Nav */
.nav {
    background: #FFFFFF !important;
    border-bottom: 1px solid var(--border-color) !important;
    padding: 12px 24px !important;
}
.nav-brand {
    color: var(--secondary) !important;
}
.nav-link {
    color: var(--text-muted) !important;
    font-weight: 500 !important;
    padding: 8px 16px !important;
    border-radius: 8px !important;
}
.nav-link:hover {
    background: var(--bg-hover) !important;
    color: var(--secondary) !important;
}
.nav-link.active {
    background: #EFF6FF !important;
    color: var(--primary) !important;
    font-weight: 600 !important;
}
.nav-icon {
    width: 18px;
    height: 18px;
}
.settings-btn {
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-muted);
    transition: all 0.2s;
}
.settings-btn:hover {
    background: var(--bg-hover);
    color: var(--secondary);
}
.logout-btn {
    color: var(--error-text);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 8px;
    transition: 0.2s;
}
.logout-btn:hover {
    background: var(--error-bg);
}

/* CRM Header */
.crm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}
.crm-header h2 {
    font-size: 24px;
    font-weight: 700;
    color: var(--secondary);
    margin-bottom: 4px;
}
.crm-header p {
    color: var(--text-muted);
}
.crm-search-bar {
    position: relative;
    margin-bottom: 24px;
}
.crm-search-bar .search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    width: 20px;
    height: 20px;
}
.crm-search-bar input {
    width: 100%;
    height: 48px;
    padding-left: 48px !important;
    border-radius: 12px !important;
    border: 1px solid var(--border-color) !important;
    font-size: 15px !important;
    background: #FFFFFF !important;
    color: var(--secondary) !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.crm-search-bar input:focus {
    border-color: var(--primary) !important;
    box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
}

/* Global Cards */
.card, .tile {
    border-radius: 16px !important;
    padding: 24px !important;
    box-shadow: 0 2px 10px rgba(0,0,0,0.06) !important;
    border: 1px solid var(--border-color) !important;
    background: #FFFFFF !important;
    transition: 0.2s !important;
}
.tile:hover {
    transform: translateY(-3px) !important;
    box-shadow: 0 12px 24px rgba(0,0,0,0.12) !important;
    border-color: var(--primary) !important;
}
.btn-primary {
    background: var(--primary) !important;
    color: #FFFFFF !important;
    font-weight: 500 !important;
    border-radius: 8px !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.btn-primary:hover {
    background: var(--primary-hover) !important;
}

/* Light Theme Google Calendar */
#section-calendar {
    background: #FFFFFF !important;
    border-radius: 16px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.06);
    border: 1px solid var(--border-color);
    margin: 24px 0;
    height: calc(100vh - 120px);
}
.gc-container {
    color: var(--secondary) !important;
}
.gc-sidebar {
    border-right: 1px solid var(--border-color) !important;
    background: #F8FAFC;
}
.gc-create-btn {
    background: var(--primary) !important;
    color: #FFFFFF !important;
    box-shadow: 0 2px 4px rgba(29,78,216,0.2) !important;
}
.gc-create-btn:hover {
    background: var(--primary-hover) !important;
}
.gc-calendars-list h3 {
    color: var(--secondary) !important;
    font-weight: 600;
}
.gc-filter-label {
    color: var(--text-muted) !important;
}
.gc-checkbox {
    border-color: var(--text-muted) !important;
    background: #FFF;
}
.gc-btn-today {
    color: var(--secondary) !important;
    border-color: var(--border-color) !important;
}
.gc-nav-arrows button {
    color: var(--text-muted) !important;
}
.gc-nav-arrows button:hover {
    background: var(--bg-hover) !important;
}
.gc-view-select {
    color: var(--secondary) !important;
    border-color: var(--border-color) !important;
}
.gc-week-header {
    background: #FFFFFF !important;
    border-bottom: 1px solid var(--border-color) !important;
}
.gc-time-col-spacer, .gc-day-header {
    color: var(--text-muted) !important;
}
.gc-day-header.today .gc-day-num {
    background: var(--primary) !important;
    color: #FFF !important;
}
.gc-day-header.today .gc-day-name {
    color: var(--primary) !important;
}
.gc-day-cols, .gc-day-col, .gc-grid-cell {
    border-color: var(--border-color) !important;
}
.gc-time-slot span {
    color: var(--text-hint) !important;
}
.gc-mini-nav button {
    color: var(--text-muted) !important;
}
.gc-mini-day:hover {
    background: var(--bg-hover) !important;
}
.gc-mini-day.selected-week {
    background: #EFF6FF !important;
    color: var(--primary) !important;
}
.gc-mini-day.today {
    background: var(--primary) !important;
    color: #FFF !important;
}

/* Calendar Modal (Light Mode) */
.gc-modal-content {
    background: #FFFFFF !important;
    color: var(--secondary) !important;
}
.gc-modal-header {
    background: #F8FAFC !important;
    border-bottom: 1px solid var(--border-color);
}
.gc-title-input {
    color: var(--secondary) !important;
    border-bottom-color: var(--border-color) !important;
}
.gc-title-input:focus {
    border-bottom-color: var(--primary) !important;
}
.gc-tab {
    color: var(--text-muted) !important;
}
.gc-tab.active {
    background: #EFF6FF !important;
    color: var(--primary) !important;
}
.gc-input {
    background: #F8FAFC !important;
    border: 1px solid var(--border-color) !important;
    color: var(--secondary) !important;
}
.gc-input:focus {
    border-color: var(--primary) !important;
}

"""

with codecs.open('style.css', 'a', 'utf-8') as f:
    f.write(saas_css)

print("Updated style.css with Modern SaaS designs!")
