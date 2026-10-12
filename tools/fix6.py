with open('js/ui.js', 'r', encoding='utf8') as f:
    text = f.read()

old_code = """    appState.activeTab = 'dashboard';
    if(typeof renderTabs === 'function') renderTabs();
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('dashboard-view').classList.add('active');"""

new_code = """    showTab("dashboard");"""

if old_code in text:
    text = text.replace(old_code, new_code)
    with open('js/ui.js', 'w', encoding='utf8') as f:
        f.write(text)
    print("Fixed tab switching")
else:
    print("Old code not found")
