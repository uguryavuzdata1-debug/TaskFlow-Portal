import codecs

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

old_code = "const updates = { status: 'Completed' };"
new_code = "const updates = { STATUS: 'Completed' };"

if old_code in ui:
    ui = ui.replace(old_code, new_code)
    with codecs.open('js/ui.js', 'w', 'utf8') as f:
        f.write(ui)
    print("Fixed STATUS case in completeJob")
else:
    print("Could not find old_code")
