import codecs
import re

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

pattern = r"if\s*\(\s*document\.getElementById\('f-main-service'\)\s*\)\s*document\.getElementById\('f-main-service'\)\.value\s*=\s*r\.mainService\s*\|\|\s*'';\s*if\s*\(\s*typeof\s*updateSubServices\s*===\s*'function'\s*\)\s*updateSubServices\('f-main-service',\s*'f-sub-service'\);"

replacement = """if(document.getElementById('f-service-type')) {
        document.getElementById('f-service-type').value = r.mainService || '';
        if(typeof updateDynamicFields === 'function') updateDynamicFields();
    }
    if(typeof updateSubServices === 'function') updateSubServices('f-service-type', 'f-sub-service');"""

new_ui = re.sub(pattern, replacement, ui)

if ui != new_ui:
    with codecs.open('js/ui.js', 'w', 'utf8') as f:
        f.write(new_ui)
    print("Fixed service category population!")
else:
    print("Regex did not match.")
