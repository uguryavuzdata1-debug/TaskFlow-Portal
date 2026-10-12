import codecs
import re

with codecs.open('index.html', 'r', 'utf8') as f:
    ui = f.read()

# Replace all occurrences of onclick="...showPicker()..." with onfocus="...showPicker()..." and onclick="...showPicker()..."
def fix_pickers(match):
    tag = match.group(0)
    # Remove any existing onclick="...showPicker()..."
    tag = re.sub(r'onclick=["\'][^"\']*showPicker[^"\']*["\']', '', tag)
    tag = re.sub(r'onfocus=["\'][^"\']*showPicker[^"\']*["\']', '', tag)
    # Remove duplicate style="cursor:pointer;"
    tag = tag.replace('style="cursor:pointer;"', '')
    
    # Insert new handlers
    tag = tag[:-1] + ' onclick="try{this.showPicker()}catch(e){}" onfocus="try{this.showPicker()}catch(e){}" style="cursor:pointer;" >'
    return tag

pattern = re.compile(r'<input[^>]+type=["\'](?:date|time)["\'][^>]*>', flags=re.IGNORECASE)
new_ui = pattern.sub(fix_pickers, ui)

with codecs.open('index.html', 'w', 'utf8') as f:
    f.write(new_ui)
    
with codecs.open('js/ui.js', 'r', 'utf8') as f:
    js_ui = f.read()

new_js = pattern.sub(fix_pickers, js_ui)

with codecs.open('js/ui.js', 'w', 'utf8') as f:
    f.write(new_js)

print("Updated inputs in index.html and js/ui.js")
