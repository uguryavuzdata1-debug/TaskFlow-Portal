import re
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# find all divs with class="modal" or class="modal-wrap"
modals = re.findall(r'<div[^>]*id="([^"]*)"[^>]*class="[^"]*modal[^"]*"', html)
print("Modals found:", modals)
