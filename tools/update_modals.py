import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Append CSS to the end of <style> or inside <head> if no style exists
css_to_add = """
  /* TICKET MODAL STYLES */
  :root {
    --ink:#1D2430; --paper:#F3EFE4; --steel:#66707C; --amber:#D98E3F;
    --line:#DBD3BF; --green:#4F7A5C; --clay:#B5563A; --card:#FBF9F3;
  }
  .ticket{
    background:var(--card); border:1px solid var(--ink); border-radius:2px;
    box-shadow:4px 4px 0 rgba(29,36,48,0.12);
    position:relative; overflow:hidden;
    margin: auto;
    width: 100%;
    max-width: 550px;
    font-family:'IBM Plex Sans',sans-serif;
  }
  .ticket-head{
    display:flex; justify-content:space-between; align-items:flex-start;
    padding:1rem 1.1rem 0.8rem; border-bottom:1px dashed var(--line);
  }
  .ticket-head .job-no{ font-family:'IBM Plex Mono',monospace; font-size:0.7rem; color:var(--steel);}
  .ticket-head h2{ margin:0.15rem 0 0; font-size:1.05rem; font-weight:600; color:var(--ink);}
  .stamp{
    font-family:'IBM Plex Mono',monospace; font-size:0.65rem; font-weight:600;
    border:1.5px solid currentColor; padding:2px 8px; border-radius:20px;
    transform:rotate(-3deg); white-space:nowrap;
  }
  .stamp.pending{ color:var(--amber); }
  .stamp.confirmed{ color:var(--green); }
  .stamp.new{ color:var(--clay); }

  .ticket-body{ padding:1rem 1.1rem;}

  .field-row{ display:grid; grid-template-columns:1fr 1fr; gap:0.7rem; margin-bottom:0.7rem;}
  .ticket-field{ display:flex; flex-direction:column; gap:3px;}
  .ticket-field.full{ grid-column:1/-1;}
  .ticket-field label{
    font-size:0.68rem; color:var(--steel); font-weight:500;
  }
  .ticket-field .val, .ticket-field input, .ticket-field select, .ticket-field textarea {
    font-family:'IBM Plex Mono',monospace; font-size:0.82rem; color:var(--ink);
    background:#fff; border:1px solid var(--line); border-radius:3px;
    padding:0.4rem 0.5rem; width:100%; box-sizing: border-box;
  }
  .ticket-field .val{ background:#F1EEE4; border-style:dashed; min-height: 2.2rem; display:flex; align-items:center;}
  .ticket-field input:read-only{ background:#F1EEE4; color:var(--steel); border-style:dashed;}
  .ticket-field select{ font-family:'IBM Plex Sans',sans-serif; }

  .meta-line{
    display:flex; gap:1.2rem; font-size:0.72rem; color:var(--steel);
    padding-top:0.6rem; border-top:1px solid var(--line); margin-top:0.3rem;
  }
  .meta-line b{ color:var(--ink); font-weight:600;}

  .ticket-foot{
    display:flex; gap:0.5rem; flex-wrap:wrap; padding:0.9rem 1.1rem 1.1rem; justify-content: flex-end;
  }
  .ticket-btn{
    font-family:'IBM Plex Sans',sans-serif; font-size:0.78rem; font-weight:600;
    padding:0.5rem 0.85rem; border-radius:3px; border:1.5px solid var(--ink);
    background:transparent; color:var(--ink); cursor:pointer;
  }
  .ticket-btn.primary{ background:var(--ink); color:var(--paper); }
  .ticket-btn.danger{ border-color:var(--clay); color:var(--clay); }
  .ticket-btn.ghost{ border-color:var(--line); color:var(--steel); }

  .day-list{ padding:0.4rem 1.1rem 1rem; display:flex; flex-direction:column;}
  .hour-slot{
    display:grid; grid-template-columns:52px 1fr; gap:0.7rem;
    padding:0.55rem 0; border-bottom:1px solid var(--line);
  }
  .hour-slot:last-child{ border-bottom:none;}
  .hour-slot .hr{ font-family:'IBM Plex Mono',monospace; font-size:0.72rem; color:var(--steel); padding-top:2px;}
  .job-chip{
    display:flex; justify-content:space-between; align-items:center;
    background:#F1EEE4; border-left:3px solid var(--amber); border-radius:2px;
    padding:0.4rem 0.6rem; font-size:0.78rem; color: var(--ink);
  }
  .job-chip.empty{ border-left-color:var(--line); color:var(--steel); font-style:italic; background:transparent;}
  .job-chip .co{ font-weight:600;}
  .job-chip .pc{ font-family:'IBM Plex Mono',monospace; font-size:0.7rem; color:var(--steel);}
  .add-slot{
    font-family:'IBM Plex Mono',monospace; font-size:0.72rem; color:var(--steel);
    border:1px dashed var(--line); border-radius:2px; padding:0.35rem 0.6rem;
    text-align:center; cursor:pointer;
  }

  .perf{
    position:absolute; top:0; bottom:0; width:14px; left:0;
    background-image:radial-gradient(circle at 7px 0, transparent 6px, var(--card) 6px);
    background-size:14px 18px; background-repeat:repeat-y;
  }
  .ticket{ padding-left:14px; }

  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --paper:#161A22; --card:#1E2430; --ink:#EFEAE0; --line:#333B48; --steel:#8B94A0;
    }
    .ticket-field .val, .ticket-field input:read-only{ background:#242B38; }
    .ticket-field input, .ticket-field select, .ticket-field textarea { background:#1A1F29; color:var(--ink); border-color:var(--line);}
    .job-chip{ background:#242B38;}
    .ticket-btn.primary{ color:var(--paper);}
    .ticket-head h2{ color:var(--ink); }
  }
"""

if '</style>' in html:
    html = html.replace('</style>', css_to_add + '\n</style>')
else:
    html = html.replace('</head>', '<style>\n' + css_to_add + '\n</style>\n</head>')

# Ensure font is added
if 'IBM+Plex' not in html:
    html = html.replace('</head>', '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">\n</head>')


new_modals = """
<!-- GC QUICK ADD MODAL -->
<div id="gc-quick-add-modal" class="modal-overlay hidden" style="z-index: 3005; align-items:center; justify-content:center;">
  <div class="ticket">
    <div class="perf"></div>
    <div class="ticket-head">
      <div>
        <div class="job-no">QUICK ADD</div>
        <h2>Hızlı Randevu Ekle</h2>
      </div>
      <button class="close-btn" style="background:transparent; color:var(--steel); border:none; font-size:1.5rem; cursor:pointer;" onclick="document.getElementById('gc-quick-add-modal').classList.add('hidden')">&times;</button>
    </div>
    <div class="ticket-body">
      <div class="field-row">
        <div class="ticket-field"><label>Tarih</label><input type="date" id="gc-qa-date"></div>
        <div class="ticket-field"><label>Saat</label><select id="gc-qa-time" class="ticket-input"></select></div>
        <div class="ticket-field full"><label>Firma / Müşteri</label><input type="text" id="gc-qa-title" placeholder="Add title"></div>
        <div class="ticket-field full">
          <label>Servis Kategorisi</label>
          <select id="gc-qa-category">
                <option value="S1">MENU UPDATE</option>
                <option value="S2">CREDIT CARD</option>
                <option value="S3">DATA RESET</option>
                <option value="S4">SERVICE</option>
                <option value="S5">OTHER</option>
                <option value="S6">TILL SETUP</option>
          </select>
        </div>
      </div>
    </div>
    <div class="ticket-foot">
      <button class="ticket-btn ghost" onclick="document.getElementById('gc-quick-add-modal').classList.add('hidden')">Vazgeç</button>
      <button class="ticket-btn primary" onclick="gcSubmitQuickAdd()">Kaydet</button>
    </div>
  </div>
</div>

<!-- VIEW APPOINTMENT MODAL -->
<div id="view-appointment-modal" class="modal-overlay hidden" style="z-index: 3002; align-items:center; justify-content:center;">
  <div class="ticket">
    <div class="perf"></div>
    <div class="ticket-head">
      <div>
        <div class="job-no">APPOINTMENT</div>
        <h2>Randevu Detayı</h2>
      </div>
      <button class="close-btn" style="background:transparent; color:var(--steel); border:none; font-size:1.5rem; cursor:pointer;" onclick="document.getElementById('view-appointment-modal').classList.add('hidden')">&times;</button>
    </div>
    <div class="ticket-body" style="max-height: 60vh; overflow-y: auto;">
      <div class="field-row">
        <div class="ticket-field full"><label>Firma</label><div class="val" id="va-company"></div></div>
        <div class="ticket-field"><label>Posta Kodu</label><div class="val" id="va-postcode"></div></div>
        <div class="ticket-field"><label>Durum</label><div class="val" id="va-status"></div></div>
        <div class="ticket-field full"><label>Servis</label><div class="val" id="va-service-category"></div></div>
        <div class="ticket-field full"><label>Full Address</label><div class="val" id="va-address"></div></div>
        <div class="ticket-field"><label>Primary Contact</label><div class="val" id="va-contact"></div></div>
        <div class="ticket-field"><label>Phone Number</label><div class="val" id="va-phone"></div></div>
        <div class="ticket-field full"><label>Priority</label><div class="val" id="va-priority"></div></div>
        <div class="ticket-field full"><label>Notes</label><div class="val" id="va-notes"></div></div>
        <div class="ticket-field"><label>Tarih</label><input type="date" id="va-date"></div>
        <div class="ticket-field"><label>Başlangıç Saati</label><input type="time" id="va-start-time"></div>
      </div>
      <div class="meta-line">
        <span>Oluşturan: <b id="va-created-by"></b></span>
        <span>Tarih: <b id="va-created-at"></b></span>
      </div>
    </div>
    <div class="ticket-foot">
      <button id="va-delete-btn" class="ticket-btn danger">Sil</button>
      <button id="va-hold-btn" class="ticket-btn ghost">İptal</button>
      <button id="va-goticket-btn" class="ticket-btn" style="border-color:#6366F1; color:#6366F1;">Panele Yükle</button>
      <button id="va-save-btn" class="ticket-btn primary">Tarih/Saat Değiştir</button>
    </div>
  </div>
</div>

<!-- DAY VIEW MODAL -->
<div id="day-view-modal" class="modal-overlay hidden" style="z-index: 3001; align-items:center; justify-content:center;">
  <div class="ticket" style="max-height: 90vh; display: flex; flex-direction: column;">
    <div class="perf"></div>
    <div class="ticket-head" style="position: sticky; top: 0; background: var(--card); z-index: 10;">
      <div>
        <div class="job-no">DAY VIEW</div>
        <h2 id="day-view-title">Günlük Görünüm</h2>
      </div>
      <button class="close-btn" style="background:transparent; color:var(--steel); border:none; font-size:1.5rem; cursor:pointer;" onclick="document.getElementById('day-view-modal').classList.add('hidden')">&times;</button>
    </div>
    <div class="day-list" id="day-view-hourly-list" style="overflow-y: auto; flex: 1;">
      <!-- JavaScript will populate this -->
    </div>
  </div>
</div>
"""

# Replace the existing modals
# Regex to find the modals section and replace it
import re

start_tag = '<!-- GC QUICK ADD MODAL -->'
end_tag = '<!-- DAY VIEW MODAL -->'

start_idx = html.find(start_tag)
if start_idx != -1:
    end_idx = html.find('</div>', html.find(end_tag))
    # need to find the matching closing div for day-view-modal
    day_view_idx = html.find(end_tag)
    rest = html[day_view_idx:]
    # count divs
    div_count = 0
    i = 0
    while i < len(rest):
        if rest[i:i+4] == '<div':
            div_count += 1
        elif rest[i:i+6] == '</div>':
            div_count -= 1
            if div_count == 0:
                end_idx = day_view_idx + i + 6
                break
        i += 1
        
    html = html[:start_idx] + new_modals + html[end_idx:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Modals updated successfully!")
