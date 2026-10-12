import re

# We will just map EVERYTHING to the closest aesthetic color.
# We'll use CSS vars since they exist on the root and work in JS too if they are assigned to inline styles,
# but wait! If they are assigned to Canvas / Chart.js, CSS variables like `var(--ink)` won't work!
# Chart.js needs exact hex colors unless we use a plugin to read CSS variables.
# Let's check if the colors are inside inline HTML strings or Chart.js configs.

html = open('app.js', encoding='utf-8').read()
html_lines = html.split('\n')

# Find a few lines to see what they are used for
for i, line in enumerate(html_lines):
    if re.search(r'#[0-9a-fA-F]{3,6}\b', line):
        print(f"Line {i+1}: {line.strip()[:100]}")
