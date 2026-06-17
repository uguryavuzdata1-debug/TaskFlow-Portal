import codecs

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

old_logic = """            const updates = {
                "INV DATE": newDate,
                "START TIME": newTime,
                "TIMESTAMP": new Date(newDate + 'T' + (newTime || '00:00') + ':00').toISOString()
            };"""

new_logic = """            const updates = {
                "INV DATE": newDate,
                "START TIME": newTime
            };"""

if old_logic in ui:
    ui = ui.replace(old_logic, new_logic)
    with codecs.open('js/ui.js', 'w', 'utf8') as f:
        f.write(ui)
    print("Removed TIMESTAMP from update")
else:
    print("Old logic not found")
