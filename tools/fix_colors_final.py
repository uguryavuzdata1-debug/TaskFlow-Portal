import re

def map_remaining(hex_code):
    hx = hex_code.lower()
    
    # If it's very light (most components > 200/0xc8), it's a paper/card background
    # Let's just map manually since there are only ~19 left.
    mapping = {
        '#c4b5fd': 'var(--line)', 
        '#ddd6fe': 'var(--line)', 
        '#ecfdf5': 'var(--paper)', 
        '#f0fdf4': 'var(--paper)', 
        '#333b48': 'var(--ink)', 
        '#f1eee4': 'var(--paper)', 
        '#1e2430': 'var(--ink)', 
        '#f5f3ff': 'var(--paper)', 
        '#bae6fd': 'var(--line)', 
        '#eff6ff': 'var(--paper)', 
        '#efeae0': 'var(--paper)', 
        '#fef9c3': 'var(--amber)', 
        '#fde047': 'var(--amber)', 
        '#bbf7d0': 'var(--green)', 
        '#8b94a0': 'var(--steel)', 
        '#f0f9ff': 'var(--paper)', 
        '#161a22': 'var(--ink)', 
        '#1a1f29': 'var(--ink)', 
        '#242b38': 'var(--ink)'
    }
    
    return mapping.get(hx, hex_code)

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Protect root variables definition
root_match = re.search(r':root\s*\{[^}]*\}', html)
if root_match:
    root_block = root_match.group(0)
    html = html.replace(root_block, '___ROOT_BLOCK___')

html = re.sub(r'#[0-9a-fA-F]{3,6}\b', lambda m: map_remaining(m.group(0)), html)

# Restore root variables
if root_match:
    html = html.replace('___ROOT_BLOCK___', root_block)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
