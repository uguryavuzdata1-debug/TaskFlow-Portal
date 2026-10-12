import codecs
import re

with codecs.open('index.html', 'r', 'utf8') as f:
    html = f.read()

new_waiting_section = """
  <!-- WAITING JOBS SECTION -->
  <section id="section-waiting" class="section">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <h2 style="font-size: 1.5rem; font-weight: 700; color: #1e293b; letter-spacing: -0.02em;">Waiting Jobs (Tree View)</h2>
    </div>
    <div id="waiting-tree-container" style="display:flex; flex-direction:column; gap:15px; overflow-y:auto; padding-right:10px;"></div>
  </section>
"""

if 'id="section-waiting"' not in html:
    # Match the calendar section comment and opening tag
    pattern = re.compile(r'<!-- CALENDAR SECTION -->\s*<section id="section-calendar" class="section">')
    
    html = pattern.sub(new_waiting_section + r'\n  <!-- CALENDAR SECTION -->\n  <section id="section-calendar" class="section">', html)
    
    with codecs.open('index.html', 'w', 'utf8') as f:
        f.write(html)
    print("Inserted successfully with regex!")
else:
    print("Already inserted.")
