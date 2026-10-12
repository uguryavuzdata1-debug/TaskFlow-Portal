import re

# Color palette mapped to variables
palette = {
    '#1D2430': 'var(--ink)',
    '#F3EFE4': 'var(--paper)',
    '#FBF9F3': 'var(--card)',
    '#66707C': 'var(--steel)',
    '#D98E3F': 'var(--amber)',
    '#DBD3BF': 'var(--line)',
    '#4F7A5C': 'var(--green)',
    '#4C5FA6': 'var(--blue)',
    '#B5563A': 'var(--clay)'
}

# Also map some generic gray/black/white to our palette
color_mapping = {
    # Darks -> Ink
    '#333': 'var(--ink)',
    '#000': 'var(--ink)',
    '#111827': 'var(--ink)',
    '#1e293b': 'var(--ink)',
    '#0f172a': 'var(--ink)',
    '#334155': 'var(--ink)',
    '#161A22': 'var(--ink)',
    '#1E2430': 'var(--ink)',
    '#1A1F29': 'var(--ink)',
    
    # Grays -> Steel
    '#666': 'var(--steel)',
    '#4b5563': 'var(--steel)',
    '#6b7280': 'var(--steel)',
    '#64748b': 'var(--steel)',
    '#cbd5e1': 'var(--steel)',
    '#8B94A0': 'var(--steel)',
    '#94a3b8': 'var(--steel)',
    '#475569': 'var(--steel)',

    # Whites / Lights -> Paper or Card
    '#fff': 'var(--card)',
    '#ffffff': 'var(--card)',
    '#f8fafc': 'var(--card)',
    '#f1f5f9': 'var(--paper)',
    '#EFEAE0': 'var(--paper)',
    '#F1EEE4': 'var(--paper)',
    '#e2e8f0': 'var(--paper)',
    
    # Greens -> Green
    '#15803d': 'var(--green)',
    '#059669': 'var(--green)',
    '#10b981': 'var(--green)',
    
    # Reds/Oranges -> Clay or Amber
    '#92400e': 'var(--clay)',
    '#f59e0b': 'var(--amber)',
    '#a16207': 'var(--amber)',

    # Blues -> Blue
    '#1b4376': 'var(--blue)',
    '#0369a1': 'var(--blue)',
    '#2563eb': 'var(--blue)',
    '#6366f1': 'var(--blue)',
    '#6366F1': 'var(--blue)',
}

# Add exact matches just in case case differs
for k, v in palette.items():
    color_mapping[k.lower()] = v
    color_mapping[k.upper()] = v

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace any color property:   color: #333;  fill="#333" background-color: #333;
def replace_color(match):
    hex_code = match.group(0)
    # Check if we have a mapping
    lookup = hex_code.lower()
    if lookup in color_mapping:
        return color_mapping[lookup]
    # If not mapped, we return the original so we don't break SVGs
    return hex_code

# We want to replace inside style attributes and CSS blocks
# This regex finds hex colors with 3 or 6 characters
html = re.sub(r'#[0-9a-fA-F]{3,6}\b', replace_color, html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
