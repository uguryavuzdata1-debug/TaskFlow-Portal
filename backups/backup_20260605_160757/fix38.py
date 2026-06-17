import codecs

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

old_code = """    if(document.getElementById('f-main-service')) document.getElementById('f-main-service').value = r.mainService || '';
    if(typeof updateSubServices === 'function') updateSubServices('f-main-service', 'f-sub-service');
    if(document.getElementById('f-sub-service')) document.getElementById('f-sub-service').value = r.subService || '';"""

new_code = """    if(document.getElementById('f-service-type')) {
        document.getElementById('f-service-type').value = r.mainService || '';
        if(typeof updateDynamicFields === 'function') updateDynamicFields();
    }
    if(typeof updateSubServices === 'function') updateSubServices('f-service-type', 'f-sub-service');
    if(document.getElementById('f-sub-service')) document.getElementById('f-sub-service').value = r.subService || '';"""

if old_code in ui:
    ui = ui.replace(old_code, new_code)
    with codecs.open('js/ui.js', 'w', 'utf8') as f:
        f.write(ui)
    print("Fixed service category population!")
else:
    print("Could not find old code.")
