import codecs

with codecs.open('index.html', 'r', 'utf8') as f:
    html = f.read()

# I previously added:
# <div id="waiting-view" class="tab-content hidden"
old_div = '<div id="waiting-view" class="tab-content hidden"'
new_div = '<div id="section-waiting" class="section"'

html = html.replace(old_div, new_div)

with codecs.open('index.html', 'w', 'utf8') as f:
    f.write(html)
print("Fixed section ID")
