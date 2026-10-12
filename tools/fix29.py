import codecs

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

old_html = """                    <div style="font-size:0.85rem; color:#64748b; display:flex; gap:10px;">
                        <span><i data-lucide="tag" style="width:12px;height:12px;"></i> ${displayService}</span>
                        <span><i data-lucide="list-ordered" style="width:12px;height:12px;"></i> Sıra: ${index + 1}</span>
                    </div>"""

new_html = """                    <div style="font-size:0.85rem; color:#64748b; display:flex; flex-wrap:wrap; gap:12px;">
                        <span><i data-lucide="tag" style="width:12px;height:12px;"></i> ${displayService}</span>
                        <span><i data-lucide="list-ordered" style="width:12px;height:12px;"></i> Sıra: ${index + 1}</span>
                        <span><i data-lucide="map-pin" style="width:12px;height:12px;"></i> ${t.postcode || 'No Postcode'}</span>
                        <span style="color:${t.paymentStatus === 'Chargeable' ? '#ef4444' : '#10b981'}; font-weight:600;"><i data-lucide="info" style="width:12px;height:12px;"></i> ${t.paymentStatus || 'No Status'}</span>
                    </div>"""

if old_html in ui:
    ui = ui.replace(old_html, new_html)
    with codecs.open('js/ui.js', 'w', 'utf8') as f:
        f.write(ui)
    print("Replaced successfully!")
else:
    print("Could not find old_html to replace")
