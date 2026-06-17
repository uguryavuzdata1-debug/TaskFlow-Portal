import codecs
import re

css = codecs.open('style.css', 'r', 'utf-8').read()

# 1. Strip the old :root, wildcard, and body
css = re.sub(r':root\s*{.*?}', '', css, flags=re.DOTALL)
css = re.sub(r'\*,\s*\*\s*::before,\s*\*\s*::after\s*{.*?}', '', css, flags=re.DOTALL)
css = re.sub(r'body\s*{[^}]*}', '', css, flags=re.DOTALL)

# Also strip any old .dark-theme-bg or .nav rules to avoid conflicts
css = re.sub(r'\.dark-theme-bg\s*{[^}]*}', '', css, flags=re.DOTALL)
css = re.sub(r'\.nav\s*{[^}]*}', '', css, flags=re.DOTALL)
css = re.sub(r'\.nav-links\s*{[^}]*}', '', css, flags=re.DOTALL)
css = re.sub(r'\.nav-link\s*{[^}]*}', '', css, flags=re.DOTALL)

# 2. Prepend the new Base + SaaS UI design system
new_base = """@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  --bg-main: #F8FAFC;
  --bg-card: #FFFFFF;
  --bg-sidebar: #FFFFFF;
  --bg-hover: #F1F5F9;
  --border-color: #E2E8F0;
  
  --text-main: #0F172A; 
  --text-muted: #64748B;
  --text-hint: #94A3B8;
  
  --primary: #2563EB; 
  --primary-hover: #1D4ED8;
  --primary-light: #DBEAFE;
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
  margin: 0;
  overflow: hidden; /* we manage scroll inside main */
}

/* Force Form Inputs */
input, select, textarea, option {
  color: var(--text-main) !important;
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  font-family: 'Inter', sans-serif;
}
input::placeholder, textarea::placeholder {
  color: var(--text-hint) !important;
}

/* LAYOUT: Sidebar + Main Content */
.layout-wrapper {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* SIDEBAR */
.sidebar {
  width: 250px;
  min-width: 250px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  z-index: 100;
}
.sidebar.hidden {
  display: none !important;
}
.nav-brand {
  margin-bottom: 32px;
  padding: 0 12px;
  cursor: pointer;
}
.nav-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  font-weight: 500;
  padding: 10px 12px;
  border-radius: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
}
.nav-link:hover {
  background: var(--bg-hover);
  color: var(--secondary);
}
.nav-link.active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}
.nav-icon {
  width: 18px;
  height: 18px;
}
.user-profile-sidebar {
  margin-top: auto;
  border-top: 1px solid var(--border-color);
  padding-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* MAIN CONTENT AREA */
#app-container {
  flex: 1;
  overflow-y: auto;
  background: var(--bg-main);
  position: relative;
}
#app-container.hidden {
  display: none !important;
}
.section {
  padding: 32px 48px;
  max-width: 1400px;
  margin: 0 auto;
}

/* DASHBOARD HERO */
.dashboard-hero {
  margin-bottom: 32px;
}
.dashboard-hero h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--secondary);
  letter-spacing: -0.02em;
  margin-bottom: 8px;
}
.dashboard-hero p {
  color: var(--text-muted);
  font-size: 16px;
}

/* TILES (QUICK ACTIONS) */
.tiles-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 32px;
}
.tile {
  width: 220px;
  height: 140px;
  background: var(--bg-card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}
.tile:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.12);
  border-color: var(--primary);
}
.tile-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  /* Uniform icon colors as requested */
  background: #EFF6FF !important;
  color: #2563EB !important;
}
.tile-title {
  font-weight: 600;
  color: var(--secondary);
  font-size: 15px;
  margin-bottom: 4px;
}
.tile-desc {
  display: none; /* Hide description to fit 140px nicely */
}

/* Customer Table Re-design */
table {
  width: 100%;
  border-collapse: collapse;
}
th {
  background: var(--bg-card) !important;
  color: var(--text-muted) !important;
  font-weight: 600 !important;
  font-size: 12px !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 16px !important;
  border-bottom: 1px solid var(--border-color) !important;
  text-align: left;
}
td {
  padding: 16px !important;
  border-bottom: 1px solid var(--border-color) !important;
  color: var(--secondary) !important;
  font-size: 14px;
  background: var(--bg-card) !important;
}
tr:hover td {
  background: var(--bg-hover) !important;
}

/* Badges / Status */
.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}
.status-active { background: var(--success-bg); color: var(--success-text); }
.status-pending { background: var(--warning-bg); color: var(--warning-text); }
.status-inactive { background: var(--border-color); color: var(--text-muted); }
"""

css = new_base + "\n" + css

with codecs.open('style.css', 'w', 'utf-8') as f:
    f.write(css)

print("Rewrote style.css with Left Sidebar, Light Theme, and new Tile/Table designs.")
