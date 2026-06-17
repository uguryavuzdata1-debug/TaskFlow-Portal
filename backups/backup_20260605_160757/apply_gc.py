import codecs
import re

# 1. Update index.html
with codecs.open('index.html', 'r', 'utf8') as f:
    html = f.read()

gc_section = """<!-- CALENDAR SECTION -->
  <section id="section-calendar" class="section">
    <div class="gc-container">
      <div class="gc-sidebar">
        <button class="gc-create-btn" onclick="gcOpenQuickAdd()">
          <i data-lucide="plus" style="width:18px;height:18px;"></i> Create
        </button>
        <div id="gc-mini-calendar"></div>
        <div class="gc-calendars-list">
          <h3>My calendars</h3>
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
                <!-- Render Mon 6, Tue 7 etc -->
              </div>
            </div>
            <div class="gc-week-body">
              <div class="gc-time-col" id="gc-time-col">
                <!-- 08:00, 09:00, etc -->
              </div>
              <div class="gc-day-cols" id="gc-day-cols">
                 <!-- 7 columns for days -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- WAITING JOBS SECTION -->"""

# Replace Calendar section
html = re.sub(r'<!-- CALENDAR SECTION -->.*?<!-- WAITING JOBS SECTION -->', gc_section, html, flags=re.DOTALL)

gc_modal = """<!-- QUICK ADD MODAL -->
<div id="gc-quick-add-modal" class="modal-overlay hidden" style="z-index: 3005; align-items:flex-start; padding-top:100px;">
  <div class="gc-modal-content">
    <div class="gc-modal-header">
      <input type="text" id="gc-qa-title" class="gc-title-input" placeholder="Add title">
      <button class="close-btn" style="background:transparent; color:#9aa0a6; border:none;" onclick="document.getElementById('gc-quick-add-modal').classList.add('hidden')">&times;</button>
    </div>
    
    <div class="gc-modal-tabs">
        <button class="gc-tab active">Event</button>
        <button class="gc-tab">Task</button>
        <button class="gc-tab">Appointment schedule</button>
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
            <button class="gc-btn-save" onclick="gcSubmitQuickAdd()">Save</button>
        </div>
    </div>
  </div>
</div>

<script src="js/gc_calendar.js"></script>
<script>
  // Initial Lucide icons render
  if(typeof lucide !== 'undefined') lucide.createIcons();
</script>
</body>"""

html = re.sub(r'<!-- QUICK ADD MODAL -->.*</body>', gc_modal, html, flags=re.DOTALL)

with codecs.open('index.html', 'w', 'utf8') as f:
    f.write(html)
print("Updated index.html")

# 2. Add CSS to style.css
gc_css = """
/* GOOGLE CALENDAR REDESIGN */
#section-calendar {
    background: #202124 !important;
    padding: 0;
    margin: 0;
    border-radius: 0;
    height: calc(100vh - 80px);
    overflow: hidden;
}

.gc-container {
    display: flex;
    height: 100%;
    color: #e8eaed;
    font-family: 'Roboto', 'Plus Jakarta Sans', sans-serif;
}

.gc-sidebar {
    width: 256px;
    padding: 16px 8px 16px 24px;
    border-right: 1px solid #3c4043;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
}

.gc-create-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff;
    color: #3c4043;
    border: none;
    border-radius: 24px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15);
    width: max-content;
}

.gc-create-btn:hover {
    box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15);
}

.gc-calendars-list h3 {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 12px;
    color: #e8eaed;
}

.gc-filter-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #e8eaed;
    margin-bottom: 8px;
    cursor: pointer;
}

.gc-filter-label input {
    display: none;
}

.gc-checkbox {
    width: 16px;
    height: 16px;
    border: 2px solid;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #202124;
}

.gc-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.gc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
}

.gc-header-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.gc-btn-today {
    background: transparent;
    color: #e8eaed;
    border: 1px solid #5f6368;
    border-radius: 4px;
    padding: 6px 16px;
    font-size: 14px;
    cursor: pointer;
}

.gc-nav-arrows {
    display: flex;
    gap: 4px;
}

.gc-nav-arrows button {
    background: transparent;
    color: #e8eaed;
    border: none;
    font-size: 20px;
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.gc-nav-arrows button:hover {
    background: rgba(255,255,255,0.04);
}

#gc-date-range {
    font-size: 22px;
    font-weight: 400;
    margin-left: 8px;
}

.gc-view-select {
    background: transparent;
    color: #e8eaed;
    border: 1px solid #5f6368;
    border-radius: 4px;
    padding: 6px 12px;
}

.gc-grid-container {
    flex: 1;
    overflow-y: auto;
    position: relative;
}

.gc-week-header {
    display: flex;
    border-bottom: 1px solid #3c4043;
    padding-bottom: 8px;
    position: sticky;
    top: 0;
    background: #202124;
    z-index: 10;
}

.gc-time-col-spacer {
    width: 60px;
    font-size: 10px;
    color: #9aa0a6;
    text-align: right;
    padding-right: 8px;
    align-self: flex-end;
}

.gc-days-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    flex: 1;
}

.gc-day-header {
    text-align: center;
    color: #9aa0a6;
}

.gc-day-name {
    font-size: 11px;
    font-weight: 500;
    margin-bottom: 4px;
}

.gc-day-num {
    font-size: 24px;
    width: 46px;
    height: 46px;
    line-height: 46px;
    margin: 0 auto;
    border-radius: 50%;
}

.gc-day-header.today .gc-day-name {
    color: #8ab4f8;
}

.gc-day-header.today .gc-day-num {
    background: #8ab4f8;
    color: #202124;
}

.gc-week-body {
    display: flex;
    position: relative;
    height: 660px; /* 11 hours * 60px */
}

.gc-time-col {
    width: 60px;
    display: flex;
    flex-direction: column;
}

.gc-time-slot {
    height: 60px;
    position: relative;
}

.gc-time-slot span {
    position: absolute;
    top: -8px;
    right: 8px;
    font-size: 10px;
    color: #9aa0a6;
}

.gc-day-cols {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    flex: 1;
    border-left: 1px solid #3c4043;
}

.gc-day-col {
    border-right: 1px solid #3c4043;
    position: relative;
}

.gc-grid-cell {
    height: 60px;
    border-bottom: 1px solid #3c4043;
}

.gc-event-pill {
    position: absolute;
    left: 2px;
    right: 6px;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    color: #202124;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    z-index: 5;
    border: 1px solid rgba(255,255,255,0.2);
}

.gc-event-pill:hover {
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    z-index: 6;
}

.gc-event-title {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.gc-event-time {
    font-size: 10px;
    opacity: 0.8;
}

/* Mini Calendar */
.gc-mini-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 12px;
}

.gc-mini-nav button {
    background: transparent;
    color: #e8eaed;
    border: none;
    cursor: pointer;
}

.gc-mini-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    text-align: center;
    font-size: 12px;
}

.gc-mini-days div {
    width: 24px;
    height: 24px;
    line-height: 24px;
    border-radius: 50%;
    margin: auto;
    cursor: pointer;
}

.gc-mini-day:hover {
    background: rgba(255,255,255,0.04);
}

.gc-mini-day.selected-week {
    background: rgba(138, 180, 248, 0.2);
    color: #8ab4f8;
}

.gc-mini-day.today {
    background: #8ab4f8;
    color: #202124;
}

/* GC Modal */
.gc-modal-content {
    background: #303134;
    border-radius: 8px;
    width: 450px;
    color: #e8eaed;
    box-shadow: 0 24px 38px 3px rgba(0,0,0,0.14);
}

.gc-modal-header {
    background: #3c4043;
    padding: 16px 24px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.gc-title-input {
    background: transparent !important;
    border: none !important;
    border-bottom: 2px solid #8ab4f8 !important;
    border-radius: 0 !important;
    color: #e8eaed !important;
    font-size: 22px !important;
    padding: 4px 0 !important;
    width: 80% !important;
}

.gc-modal-tabs {
    display: flex;
    padding: 0 24px;
    gap: 16px;
    margin-top: 16px;
}

.gc-tab {
    background: transparent;
    color: #9aa0a6;
    border: none;
    font-size: 14px;
    padding: 6px 12px;
    cursor: pointer;
    border-radius: 4px;
}

.gc-tab.active {
    background: #1a73e8;
    color: #fff;
}

.gc-modal-body {
    padding: 24px;
}

.gc-field-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
}

.gc-icon {
    width: 20px;
    height: 20px;
    color: #9aa0a6;
}

.gc-input {
    background: #202124 !important;
    border: none !important;
    color: #e8eaed !important;
    padding: 8px 12px !important;
    border-radius: 4px !important;
    font-size: 14px !important;
    flex: 1;
}

.gc-btn-save {
    background: #8ab4f8;
    color: #202124;
    border: none;
    padding: 8px 24px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
}
"""

with codecs.open('style.css', 'a', 'utf8') as f:
    f.write(gc_css)
print("Appended GC CSS to style.css")
