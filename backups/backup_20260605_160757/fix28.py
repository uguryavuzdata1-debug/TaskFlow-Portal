import codecs
import re

with codecs.open('index.html', 'r', 'utf8') as f:
    html = f.read()

new_qa_visible = """<div style="display:flex; gap:10px;">
        <div class="field" style="flex:1;">
          <label>Date</label>
          <input type="date" id="qa-date" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;" required>
        </div>
        <div class="field" style="flex:1;">
          <label>Start Time</label>
          <input type="time" id="qa-time" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;" required>
        </div>
      </div>"""

# Find hidden inputs
pattern = re.compile(r'<input type="hidden" id="qa-date">\s*<input type="hidden" id="qa-time">')

if pattern.search(html):
    html = pattern.sub(new_qa_visible, html)
    with codecs.open('index.html', 'w', 'utf8') as f:
        f.write(html)
    print("Replaced successfully with regex!")
else:
    print("Not found or already replaced.")
