import codecs
import re

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

# I will insert toggleMainForm('form') right after showTab('dashboard');
old_code = "showTab(\"dashboard\");\n    \n    appState.editingRecordId = r.id;"
new_code = "showTab(\"dashboard\");\n    if (typeof toggleMainForm === 'function') toggleMainForm('form');\n    \n    appState.editingRecordId = r.id;"

if old_code in ui:
    ui = ui.replace(old_code, new_code)
    with codecs.open('js/ui.js', 'w', 'utf8') as f:
        f.write(ui)
    print("Added toggleMainForm('form') to loadIntoDashboard!")
else:
    # try regex
    pattern = r'(showTab\(\s*["\']dashboard["\']\s*\);)'
    replacement = r"\1\n    if (typeof toggleMainForm === 'function') toggleMainForm('form');"
    new_ui = re.sub(pattern, replacement, ui)
    if new_ui != ui:
        with codecs.open('js/ui.js', 'w', 'utf8') as f:
            f.write(new_ui)
        print("Added toggleMainForm('form') using regex!")
    else:
        print("Could not inject toggleMainForm")
