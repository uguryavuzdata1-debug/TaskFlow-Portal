import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# CSS to append
css_to_add = """
  /* DASHBOARD SECTION STYLES */
  .dash-wrap{ max-width:1120px; margin:0 auto; padding:2rem 1.5rem 4rem; }
  .dash-wrap .eyebrow{ font-family:'IBM Plex Mono',monospace; font-size:0.72rem; color:var(--steel); margin-bottom:0.5rem;}
  .dash-wrap h1{ font-size:clamp(1.5rem,3vw,2rem); margin:0 0 0.35rem; font-weight:700; letter-spacing:-0.01em; color:var(--ink);}
  .dash-wrap .sub{ color:var(--steel); font-size:0.9rem; margin:0 0 1.5rem; }

  .dash-kpi-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; margin-bottom:1.8rem;}
  .dash-kpi{ background:var(--card); border:1px solid var(--ink); border-radius:2px; padding:1rem 1.1rem;
    box-shadow:4px 4px 0 rgba(29,36,48,0.12); position:relative; overflow:hidden;}
  .dash-kpi .stub{ position:absolute; top:0; right:0; width:34px; height:34px; border-left:1px dashed var(--line); border-bottom:1px dashed var(--line);}
  .dash-kpi .lbl{ font-family:'IBM Plex Mono',monospace; font-size:0.68rem; color:var(--steel); margin-bottom:0.5rem;}
  .dash-kpi .num{ font-family:'IBM Plex Mono',monospace; font-size:2rem; font-weight:600; line-height:1;}
  .dash-kpi .delta{ font-size:0.74rem; margin-top:0.4rem; color:var(--steel);}
  .dash-kpi .delta.up{ color:var(--green); }
  .dash-kpi .delta.down{ color:var(--clay); }
  .dash-kpi.jobs .num{ color:var(--blue); }
  .dash-kpi.overdue .num{ color:var(--clay); }
  .dash-kpi.revenue .num{ color:var(--green); }
  .dash-kpi.pending .num{ color:var(--amber); }

  .board{ display:grid; grid-template-columns:1.3fr 1fr; gap:1.4rem; }
  @media(max-width:820px){ .board{ grid-template-columns:1fr; } }

  .dash-panel{ background:var(--card); border:1px solid var(--ink); border-radius:2px;
    box-shadow:4px 4px 0 rgba(29,36,48,0.12); overflow:hidden;}
  .dash-panel-head{ display:flex; justify-content:space-between; align-items:center; padding:0.8rem 1.1rem;
    border-bottom:1px dashed var(--line);}
  .dash-panel-head h2{ margin:0; font-size:0.95rem; font-weight:600; color:var(--ink);}
  .dash-panel-head a{ font-size:0.74rem; color:var(--blue); text-decoration:none; font-weight:600; cursor:pointer;}

  .dash-job-item{ display:grid; grid-template-columns:52px 1fr auto; gap:0.7rem; align-items:center;
    padding:0.65rem 1.1rem; border-bottom:1px solid var(--line); color:var(--ink);}
  .dash-job-item:last-child{ border-bottom:none; }
  .dash-job-item .hr{ font-family:'IBM Plex Mono',monospace; font-size:0.72rem; color:var(--steel);}
  .dash-job-item .co{ font-weight:600; font-size:0.85rem;}
  .dash-job-item .pc{ font-family:'IBM Plex Mono',monospace; font-size:0.7rem; color:var(--steel);}
  .dash-tag{ font-family:'IBM Plex Mono',monospace; font-size:0.62rem; font-weight:600; border-radius:20px;
    padding:2px 7px; border:1.5px solid currentColor; white-space:nowrap;}
  .dash-tag.confirmed{ color:var(--green);}
  .dash-tag.pending{ color:var(--amber);}

  .feed-item{ padding:0.6rem 1.1rem; border-bottom:1px solid var(--line); font-size:0.8rem; line-height:1.4; color:var(--ink);}
  .feed-item:last-child{ border-bottom:none;}
  .feed-item .ts{ font-family:'IBM Plex Mono',monospace; font-size:0.68rem; color:var(--steel); display:block; margin-bottom:2px;}

"""
if '</style>' in html:
    html = html.replace('</style>', css_to_add + '\n</style>')

# Replace dashboard-home content
new_dashboard = """
    <div id="dashboard-home">
        <div class="dash-wrap">
          <div class="eyebrow">TASKFLOW PORTAL / KONTROL PANELİ</div>
          <h1 id="hero-greeting">Günaydın 👋</h1>
          <p class="sub">Bugün harika bir gün. Randevularınızı ve servislerinizi yönetin.</p>

          <div class="dash-kpi-grid">
            <div class="dash-kpi jobs" onclick="showTab('waiting')" style="cursor:pointer;"><div class="stub"></div><div class="lbl">AÇIK BİLETLER</div><div class="num" id="kpi-tickets">0</div><div class="delta">Randevular</div></div>
            <div class="dash-kpi pending" onclick="showTab('invoices')" style="cursor:pointer;"><div class="stub"></div><div class="lbl">BEKLEYEN FATURALAR</div><div class="num" id="kpi-invoices">0</div><div class="delta">Açık fatura</div></div>
            <div class="dash-kpi overdue"><div class="stub"></div><div class="lbl">AKTİF MÜŞTERİ</div><div class="num" id="kpi-customers">0</div><div class="delta down">Kayıtlı işletme</div></div>
            <div class="dash-kpi revenue" onclick="toggleMainForm('category')" style="cursor:pointer; background:var(--ink);"><div class="stub" style="border-color:var(--steel);"></div><div class="lbl" style="color:var(--steel);">YENİ RANDEVU</div><div class="num" style="color:var(--paper); font-family:'IBM Plex Sans',sans-serif; font-size:1.4rem; padding-top:0.4rem;">Oluştur +</div><div class="delta" style="color:var(--steel);">Yeni bir bilet başlat</div></div>
          </div>

          <div class="board">
            <div class="dash-panel">
              <div class="dash-panel-head"><h2>Bugünün Programı</h2><a onclick="showTab('calendar')">Takvimi Aç →</a></div>
              <div class="dash-job-item"><span class="hr">09:00</span><span><span class="co">Greenway Motors</span><br><span class="pc">SO15 2AX · S3</span></span><span class="dash-tag confirmed">ONAYLI</span></div>
              <div class="dash-job-item"><span class="hr">10:30</span><span><span class="co">Blue Anchor Kebab</span><br><span class="pc">B91 3ER · S6</span></span><span class="dash-tag confirmed">ONAYLI</span></div>
              <div class="dash-job-item"><span class="hr">13:30</span><span><span class="co">Riverside Pharmacy</span><br><span class="pc">CV1 4GH · S4</span></span><span class="dash-tag pending">BEKLİYOR</span></div>
              <div class="dash-job-item"><span class="hr">15:00</span><span><span class="co">The Corner Bistro</span><br><span class="pc">CV2 1LA · S1</span></span><span class="dash-tag confirmed">ONAYLI</span></div>
            </div>

            <div class="dash-panel">
              <div class="dash-panel-head"><h2>Son Etkinlik</h2><a onclick="showTab('settings')">Tümünü Gör →</a></div>
              <div class="feed-item"><span class="ts">09:41 · SYSTEM</span>Randevu oluşturuldu — Blue Anchor Kebab House</div>
              <div class="feed-item"><span class="ts">09:22 · ADMIN</span>Randevu saati güncellendi — #VA-2026-0912</div>
              <div class="feed-item"><span class="ts">08:55 · ADMIN</span>Oturum açıldı</div>
              <div class="feed-item"><span class="ts">Dün 18:02 · ADMIN</span>Randevu iptal edildi — Greenway Motors</div>
            </div>
          </div>
        </div>
    </div>
"""

# We need to find the correct `dashboard-home` div.
# Looking at the file, the real dashboard is around line 560.
match = re.search(r'<div id="dashboard-home">.*?</div>\s*</div>\s*<!-- CATEGORY SELECTION VIEW -->', html, re.DOTALL)
if match:
    html = html.replace(match.group(0), new_dashboard + "\n\n    <!-- CATEGORY SELECTION VIEW -->")
else:
    # try a simpler replace
    start_tag = '<div id="dashboard-home">'
    end_tag = '<!-- CATEGORY SELECTION VIEW -->'
    s_idx = html.rfind(start_tag)
    e_idx = html.find(end_tag, s_idx)
    if s_idx != -1 and e_idx != -1:
        html = html[:s_idx] + new_dashboard + "\n    " + html[e_idx:]
    else:
        print("Could not find dashboard-home blocks")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
