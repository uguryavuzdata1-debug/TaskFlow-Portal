import re

# Strict Hex Palette
hex_palette = {
    'ink': '#1D2430',
    'paper': '#F3EFE4',
    'card': '#FBF9F3',
    'steel': '#66707C',
    'amber': '#D98E3F',
    'line': '#DBD3BF',
    'green': '#4F7A5C',
    'blue': '#4C5FA6',
    'clay': '#B5563A'
}

def map_remaining_to_hex(hex_code):
    hx = hex_code.lower()
    
    # Simple mapping
    if hx in ['#fff', '#ffffff', '#f8fafc', '#f1f5f9', '#f0f9ff', '#f5f3ff', '#eff6ff', '#f0fdf4', '#ecfdf5', '#e2e8f0', '#e5e7eb', '#f3f4f6']:
        return hex_palette['card']
    if hx in ['#333', '#000', '#111827', '#1e293b', '#0f172a', '#334155', '#161a22', '#1e2430', '#1a1f29', '#1f2937']:
        return hex_palette['ink']
    if hx in ['#666', '#4b5563', '#6b7280', '#64748b', '#cbd5e1', '#8b94a0', '#94a3b8', '#475569', '#9ca3af']:
        return hex_palette['steel']
    if hx in ['#15803d', '#059669', '#10b981', '#166534', '#34d399', '#6ee7b7']:
        return hex_palette['green']
    if hx in ['#92400e', '#f59e0b', '#a16207', '#d97706', '#f97316']:
        return hex_palette['amber']
    if hx in ['#1b4376', '#0369a1', '#2563eb', '#6366f1', '#3b82f6', '#93c5fd', '#1e3a8a']:
        return hex_palette['blue']
    if hx in ['#ef4444', '#f87171', '#dc2626', '#b91c1c', '#991b1b']:
        return hex_palette['clay']
        
    return hex_code

with open('app.js', 'r', encoding='utf-8') as f:
    html = f.read()

html = re.sub(r'#[0-9a-fA-F]{3,6}\b', lambda m: map_remaining_to_hex(m.group(0)), html)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(html)
