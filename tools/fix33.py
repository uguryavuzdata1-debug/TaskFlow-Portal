import codecs
import re

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

pattern = re.compile(r'(<input[^>]+type=["\'](?:date|time)["\'][^>]*?)(/?>)', flags=re.IGNORECASE)

def replacer(match):
    tag = match.group(1)
    end = match.group(2)
    if 'showPicker()' not in tag:
        tag += ' onclick="try{this.showPicker()}catch(e){}" style="cursor:pointer;" '
    return tag + end

new_ui = pattern.sub(replacer, ui)

with codecs.open('js/ui.js', 'w', 'utf8') as f:
    f.write(new_ui)
    print("Added showPicker() to all date and time inputs in js/ui.js.")
