import codecs

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

old_code = "onclick=\"completeJob('${t.id}')\" style=\"background:#f59e0b; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 1px 2px rgba(0,0,0,0.1);\" title=\"Click to Complete\""
new_code = "onclick=\"openAppointmentView('${t.id}')\" style=\"background:#f59e0b; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 1px 2px rgba(0,0,0,0.1);\" title=\"View Details\""

if old_code in ui:
    ui = ui.replace(old_code, new_code)
    with codecs.open('js/ui.js', 'w', 'utf8') as f:
        f.write(ui)
    print("Fixed waiting button onclick!")
else:
    print("Could not find old_code")
