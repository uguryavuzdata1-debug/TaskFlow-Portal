import re

with open('app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace renderSystemLogs function
new_func = """function renderSystemLogs() {
    const container = document.getElementById('logs-container');
    if (!container) return;
    
    if (systemActivityLog.length === 0) {
        container.innerHTML = `
            <div style="padding: 2rem; background: var(--card); border-radius: 2px; border: 1px dashed var(--line); text-align: center; color: var(--steel); font-family: 'IBM Plex Mono', monospace;">
                No Activity Logged Yet
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    let html = `
        <div class="toolbar">
            <input type="text" placeholder="Kullanıcı veya işlem ara...">
            <select><option>Tüm işlemler</option><option>Oluşturma</option><option>Güncelleme</option><option>Silme</option><option>Giriş/Çıkış</option></select>
            <select><option>Son 24 saat</option><option>Son 7 gün</option><option>Son 30 gün</option></select>
            <div class="spacer" style="flex:1;"></div>
            <button class="ticket-btn">CSV İndir</button>
            <button class="ticket-btn primary" onclick="renderSystemLogs()">Yenile</button>
        </div>
        <div class="ledger">
            <div class="ledger-head"><div>ZAMAN</div><div>KULLANICI</div><div>İŞLEM</div><div>DETAY</div></div>
    `;
    
    systemActivityLog.slice().reverse().forEach(log => {
        const dt = new Date(log.timestamp);
        const timeStr = dt.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        
        let tagClass = "update";
        if (log.action.includes("CREATE")) tagClass = "create";
        else if (log.action.includes("DELETE")) tagClass = "delete";
        else if (log.action.includes("LOGIN") || log.action.includes("AUTH")) tagClass = "auth";

        html += `
            <div class="ledger-row">
                <div class="ledger-ts">${timeStr}</div>
                <div class="ledger-user">${log.user}</div>
                <span class="ledger-tag ${tagClass}">${log.action}</span>
                <div class="ledger-detail">${log.description}</div>
            </div>
        `;
    });
    
    html += `
            <div class="ledger-foot">
                <span>Son ${systemActivityLog.length} kayıt gösteriliyor</span>
                <button class="ticket-btn">Daha fazla yükle</button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}
"""

start_idx = js.find('function renderSystemLogs() {')
if start_idx != -1:
    # find the end of the function by counting braces
    end_idx = start_idx
    brace_count = 0
    started = False
    while end_idx < len(js):
        if js[end_idx] == '{':
            brace_count += 1
            started = True
        elif js[end_idx] == '}':
            brace_count -= 1
        
        end_idx += 1
        if started and brace_count == 0:
            break
            
    js = js[:start_idx] + new_func + js[end_idx:]

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(js)

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

css_to_add = """
  /* LOG PANEL STYLES */
  .toolbar{
    display:flex; flex-wrap:wrap; gap:0.6rem; align-items:center;
    background:var(--card); border:1px solid var(--ink); border-radius:2px;
    padding:0.7rem 0.9rem; margin-bottom:1.1rem; box-shadow:3px 3px 0 rgba(29,36,48,0.10);
  }
  .toolbar input, .toolbar select{
    font-family:'IBM Plex Mono',monospace; font-size:0.78rem; color:var(--ink);
    background:#fff; border:1px solid var(--line); border-radius:3px; padding:0.4rem 0.55rem;
  }
  .toolbar input[type="text"]{ flex:1; min-width:160px; }
  
  .ledger{
    background:var(--card); border:1px solid var(--ink); border-radius:2px;
    box-shadow:4px 4px 0 rgba(29,36,48,0.12); overflow:hidden;
  }
  .ledger-head{
    display:grid; grid-template-columns:120px 100px 140px 1fr;
    padding:0.6rem 1rem; border-bottom:1px dashed var(--line);
    font-family:'IBM Plex Mono',monospace; font-size:0.68rem; color:var(--steel);
  }
  .ledger-row{
    display:grid; grid-template-columns:120px 100px 140px 1fr;
    padding:0.65rem 1rem; border-bottom:1px solid var(--line); align-items:start; gap:0.4rem;
  }
  .ledger-row:last-child{ border-bottom:none; }
  .ledger-row:nth-child(even){ background:rgba(0,0,0,0.015); }
  .ledger-ts{ font-family:'IBM Plex Mono',monospace; font-size:0.74rem; color:var(--steel); }
  .ledger-user{ font-size:0.8rem; font-weight:600; }
  .ledger-tag{
    font-family:'IBM Plex Mono',monospace; font-size:0.65rem; font-weight:600;
    border-radius:20px; padding:2px 8px; border:1.5px solid currentColor;
    justify-self:start; white-space:nowrap;
  }
  .ledger-tag.create{ color:var(--green); }
  .ledger-tag.update{ color:var(--blue); }
  .ledger-tag.delete{ color:var(--clay); }
  .ledger-tag.auth{ color:var(--amber); }
  .ledger-detail{ font-size:0.8rem; color:var(--ink); line-height:1.4; }
  .ledger-detail .obj{ font-family:'IBM Plex Mono',monospace; font-size:0.72rem; color:var(--steel); }

  .ledger-foot{
    display:flex; justify-content:space-between; align-items:center;
    padding:0.7rem 1rem; font-family:'IBM Plex Mono',monospace; font-size:0.7rem; color:var(--steel);
  }

  @media (max-width:640px){
    .ledger-head{ display:none; }
    .ledger-row{ grid-template-columns:1fr; gap:0.25rem; padding:0.75rem 1rem;}
    .ledger-row .ledger-ts{ order:1; }
    .ledger-row .ledger-user{ order:2; }
    .ledger-row .ledger-tag{ order:3; margin-top:2px;}
    .ledger-row .ledger-detail{ order:4; margin-top:4px;}
  }

  @media (prefers-color-scheme: dark){
    .toolbar input, .toolbar select{ background:#1A1F29; color:var(--ink); border-color:var(--line);}
    .ledger-row:nth-child(even){ background:rgba(255,255,255,0.02); }
  }
"""

if '</style>' in html:
    html = html.replace('</style>', css_to_add + '\n</style>')
    
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
