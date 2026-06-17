import codecs
import re

with codecs.open('index.html', 'r', 'utf8') as f:
    ui = f.read()

# Using regex to find all type="date" and type="time" inputs that DO NOT have showPicker() and add it
pattern = re.compile(r'(<input[^>]+type=["\'](?:date|time)["\'][^>]*?)(/?>)', flags=re.IGNORECASE)

def replacer(match):
    tag = match.group(1)
    end = match.group(2)
    if 'showPicker()' not in tag:
        tag += ' onclick="try{this.showPicker()}catch(e){}" style="cursor:pointer;" '
    return tag + end

new_ui = pattern.sub(replacer, ui)

with codecs.open('index.html', 'w', 'utf8') as f:
    f.write(new_ui)
    print("Added showPicker() to all date and time inputs.")
