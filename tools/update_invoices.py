import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add the new section-invoices before </main> or at a good spot
# Let's find `<section id="section-settings"` and insert right before it.
start_idx = html.find('<section id="section-settings"')
if start_idx == -1:
    print("Could not find section-settings")
    exit(1)

invoice_html = """
  <!-- INVOICES SECTION -->
  <section id="section-invoices" class="section">
    <div class="wrap invoice-wrap">
      <div class="eyebrow">TASKFLOW PORTAL / FATURALAR</div>
      <h1>Fatura Takibi</h1>
      <p class="sub">Oluşturulan tüm faturaların durumu, vade tarihleri ve tahsilat takibi.</p>

      <div class="kpis">
        <div class="kpi warn"><div class="num">£2,340</div><div class="lbl">Vadesi Geçmiş</div></div>
        <div class="kpi"><div class="num">£4,120</div><div class="lbl">Bekleyen Toplam</div></div>
        <div class="kpi ok"><div class="num">£11,860</div><div class="lbl">Bu Ay Tahsil Edilen</div></div>
        <div class="kpi"><div class="num">18</div><div class="lbl">Açık Fatura</div></div>
      </div>

      <div class="toolbar">
        <input type="text" placeholder="Fatura no veya müşteri ara...">
        <select><option>Tüm durumlar</option><option>Ödendi</option><option>Bekliyor</option><option>Vadesi Geçmiş</option></select>
        <select><option>Bu ay</option><option>Son 3 ay</option><option>Tüm zamanlar</option></select>
        <div class="spacer"></div>
        <button class="ticket-btn">CSV İndir</button>
        <button class="ticket-btn primary">+ Yeni Fatura</button>
      </div>

      <div class="ledger" style="margin-bottom:2rem;">
        <div class="ledger-head" style="grid-template-columns:100px 1.3fr 90px 90px 100px 110px 70px;">
            <div>FATURA NO</div><div>MÜŞTERİ</div><div>KESİM</div><div>VADE</div><div>TUTAR</div><div>DURUM</div><div></div>
        </div>

        <div class="ledger-row" style="grid-template-columns:100px 1.3fr 90px 90px 100px 110px 70px; align-items:center;">
          <div class="inv-no">#INV-1042</div><div>Riverside Pharmacy</div><div>12 Eyl</div><div>26 Eyl</div>
          <div class="amt" style="font-weight:600; font-family:'IBM Plex Mono',monospace;">£340.00</div><span class="ledger-tag create">ÖDENDİ</span><a class="view-link">Görüntüle</a>
        </div>
        <div class="ledger-row" style="grid-template-columns:100px 1.3fr 90px 90px 100px 110px 70px; align-items:center;">
          <div class="inv-no">#INV-1041</div><div>Blue Anchor Kebab House</div><div>10 Eyl</div><div>24 Eyl</div>
          <div class="amt" style="font-weight:600; font-family:'IBM Plex Mono',monospace;">£680.00</div><span class="ledger-tag auth">BEKLİYOR</span><a class="view-link">Görüntüle</a>
        </div>
        <div class="ledger-row" style="grid-template-columns:100px 1.3fr 90px 90px 100px 110px 70px; align-items:center;">
          <div class="inv-no">#INV-1039</div><div>Greenway Motors</div><div>02 Eyl</div><div>16 Eyl</div>
          <div class="amt" style="font-weight:600; font-family:'IBM Plex Mono',monospace;">£1,150.00</div><span class="ledger-tag delete">VADESİ GEÇTİ</span><a class="view-link">Görüntüle</a>
        </div>
        <div class="ledger-row" style="grid-template-columns:100px 1.3fr 90px 90px 100px 110px 70px; align-items:center;">
          <div class="inv-no">#INV-1035</div><div>Coventry Wholesale Ltd</div><div>28 Ağu</div><div>11 Eyl</div>
          <div class="amt" style="font-weight:600; font-family:'IBM Plex Mono',monospace;">£1,190.00</div><span class="ledger-tag delete">VADESİ GEÇTİ</span><a class="view-link">Görüntüle</a>
        </div>
        <div class="ledger-row" style="grid-template-columns:100px 1.3fr 90px 90px 100px 110px 70px; align-items:center;">
          <div class="inv-no">#INV-1030</div><div>The Corner Bistro</div><div>20 Ağu</div><div>03 Eyl</div>
          <div class="amt" style="font-weight:600; font-family:'IBM Plex Mono',monospace;">£420.00</div><span class="ledger-tag create">ÖDENDİ</span><a class="view-link">Görüntüle</a>
        </div>
      </div>

      <div class="section-label" style="font-family:'IBM Plex Mono',monospace; font-size:0.72rem; color:var(--steel); margin:0 0 0.6rem;">FATURA DETAYI — ÖRNEK GÖRÜNÜM</div>
      <div class="ticket" style="max-width:560px; margin: 0;">
        <div class="perf"></div>
        <div class="t-head" style="display:flex; justify-content:space-between; align-items:flex-start; padding:1rem 1.1rem 0.8rem; border-bottom:1px dashed var(--line);">
          <div><div class="job-no" style="font-family:'IBM Plex Mono',monospace; font-size:0.7rem; color:var(--steel);">#INV-1039</div><h2 style="margin:0.15rem 0 0; font-size:1.05rem; font-weight:600; color:var(--ink);">Greenway Motors</h2></div>
          <span class="stamp delete">6 GÜN GECİKMİŞ</span>
        </div>
        <div class="t-body" style="padding:1rem 1.1rem;">
          <table class="inv-lines" style="width:100%; border-collapse:collapse; font-size:0.82rem; margin-bottom:0.9rem;">
            <thead><tr>
              <th style="text-align:left; font-family:'IBM Plex Mono',monospace; font-size:0.66rem; color:var(--steel); font-weight:500; padding-bottom:0.4rem; border-bottom:1px solid var(--line);">Kalem</th>
              <th class="num" style="text-align:right; font-family:'IBM Plex Mono',monospace; font-size:0.66rem; color:var(--steel); font-weight:500; padding-bottom:0.4rem; border-bottom:1px solid var(--line);">Adet</th>
              <th class="num" style="text-align:right; font-family:'IBM Plex Mono',monospace; font-size:0.66rem; color:var(--steel); font-weight:500; padding-bottom:0.4rem; border-bottom:1px solid var(--line);">Birim</th>
              <th class="num" style="text-align:right; font-family:'IBM Plex Mono',monospace; font-size:0.66rem; color:var(--steel); font-weight:500; padding-bottom:0.4rem; border-bottom:1px solid var(--line);">Tutar</th>
            </tr></thead>
            <tbody>
              <tr>
                <td style="padding:0.4rem 0; border-bottom:1px dashed var(--line); color:var(--ink);">Till Kurulumu — S6</td>
                <td class="num" style="text-align:right; font-family:'IBM Plex Mono',monospace; padding:0.4rem 0; border-bottom:1px dashed var(--line); color:var(--ink);">1</td>
                <td class="num" style="text-align:right; font-family:'IBM Plex Mono',monospace; padding:0.4rem 0; border-bottom:1px dashed var(--line); color:var(--ink);">£850.00</td>
                <td class="num" style="text-align:right; font-family:'IBM Plex Mono',monospace; padding:0.4rem 0; border-bottom:1px dashed var(--line); color:var(--ink);">£850.00</td>
              </tr>
              <tr>
                <td style="padding:0.4rem 0; border-bottom:1px dashed var(--line); color:var(--ink);">Yerinde Servis Ücreti</td>
                <td class="num" style="text-align:right; font-family:'IBM Plex Mono',monospace; padding:0.4rem 0; border-bottom:1px dashed var(--line); color:var(--ink);">2 sa</td>
                <td class="num" style="text-align:right; font-family:'IBM Plex Mono',monospace; padding:0.4rem 0; border-bottom:1px dashed var(--line); color:var(--ink);">£75.00</td>
                <td class="num" style="text-align:right; font-family:'IBM Plex Mono',monospace; padding:0.4rem 0; border-bottom:1px dashed var(--line); color:var(--ink);">£150.00</td>
              </tr>
              <tr>
                <td style="padding:0.4rem 0; border-bottom:1px dashed var(--line); color:var(--ink);">Yol Masrafı</td>
                <td class="num" style="text-align:right; font-family:'IBM Plex Mono',monospace; padding:0.4rem 0; border-bottom:1px dashed var(--line); color:var(--ink);">1</td>
                <td class="num" style="text-align:right; font-family:'IBM Plex Mono',monospace; padding:0.4rem 0; border-bottom:1px dashed var(--line); color:var(--ink);">£150.00</td>
                <td class="num" style="text-align:right; font-family:'IBM Plex Mono',monospace; padding:0.4rem 0; border-bottom:1px dashed var(--line); color:var(--ink);">£150.00</td>
              </tr>
            </tbody>
          </table>
          <div class="totals" style="display:flex; justify-content:flex-end; color:var(--ink);">
            <table style="border-collapse: collapse;">
              <tr><td style="padding:0.15rem 0 0.15rem 1.2rem; font-family:'IBM Plex Mono',monospace; font-size:0.82rem; text-align:right;">Ara Toplam</td><td style="padding:0.15rem 0 0.15rem 1.2rem; font-family:'IBM Plex Mono',monospace; font-size:0.82rem; text-align:right;">£1,150.00</td></tr>
              <tr><td style="padding:0.15rem 0 0.15rem 1.2rem; font-family:'IBM Plex Mono',monospace; font-size:0.82rem; text-align:right;">KDV (%0 — muaf)</td><td style="padding:0.15rem 0 0.15rem 1.2rem; font-family:'IBM Plex Mono',monospace; font-size:0.82rem; text-align:right;">£0.00</td></tr>
              <tr class="grand"><td style="font-weight:700; font-size:0.95rem; border-top:1px solid var(--ink); padding-top:0.4rem; padding-left:1.2rem; font-family:'IBM Plex Mono',monospace; text-align:right;">Toplam</td><td style="font-weight:700; font-size:0.95rem; border-top:1px solid var(--ink); padding-top:0.4rem; padding-left:1.2rem; font-family:'IBM Plex Mono',monospace; text-align:right;">£1,150.00</td></tr>
            </table>
          </div>
        </div>
        <div class="t-foot" style="display:flex; gap:0.5rem; flex-wrap:wrap; padding:0.9rem 1.1rem 1.1rem; justify-content:flex-end;">
          <button class="ticket-btn ghost">PDF İndir</button>
          <button class="ticket-btn ghost">Hatırlatma Gönder</button>
          <button class="ticket-btn primary">Ödendi Olarak İşaretle</button>
        </div>
      </div>
    </div>
  </section>
"""

# Insert invoice section
html = html[:start_idx] + invoice_html + "\n\n" + html[start_idx:]

css_to_add = """
  /* INVOICES SECTION STYLES */
  .invoice-wrap{ max-width:1040px; margin:0 auto; padding:2rem 1.5rem 4rem; }
  .invoice-wrap .eyebrow{ font-family:'IBM Plex Mono',monospace; font-size:0.72rem; color:var(--steel); margin-bottom:0.5rem;}
  .invoice-wrap h1{ font-size:clamp(1.5rem,3vw,2rem); margin:0 0 0.35rem; font-weight:700; letter-spacing:-0.01em; color:var(--ink);}
  .invoice-wrap .sub{ color:var(--steel); font-size:0.9rem; margin:0 0 1.4rem; max-width:62ch; line-height:1.5;}

  .kpis{ display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:0.9rem; margin-bottom:1.3rem;}
  .kpi{ background:var(--card); border:1px solid var(--ink); border-radius:2px; padding:0.85rem 1rem; box-shadow:3px 3px 0 rgba(29,36,48,0.10);}
  .kpi .num{ font-family:'IBM Plex Mono',monospace; font-size:1.4rem; font-weight:600; color:var(--ink); }
  .kpi .lbl{ font-size:0.72rem; color:var(--steel); margin-top:2px;}
  .kpi.warn .num{ color:var(--clay); }
  .kpi.ok .num{ color:var(--green); }

  .view-link{ font-size:0.74rem; font-weight:600; color:var(--blue); text-decoration:none; cursor:pointer;}
"""

if '</style>' in html:
    html = html.replace('</style>', css_to_add + '\n</style>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
