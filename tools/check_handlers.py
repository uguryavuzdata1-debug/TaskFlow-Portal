import os
import re

html_path = r"index.html"
js_dir = r"."

# 1. Parse HTML for all inline event handlers (onclick, onchange, oninput, onsubmit)
with open(html_path, "r", encoding="utf-8") as f:
    html_content = f.read()

# Pattern to match onclick="functionName(...)" or onchange="..."
event_patterns = [
    r'on\w+="\s*(\w+)\s*\(',     # e.g. onclick="funcName(params)"
    r'on\w+="\s*event\.preventDefault\(\);\s*(\w+)\s*\(' # e.g. onsubmit="event.preventDefault(); funcName()"
]

used_functions = set()
for pattern in event_patterns:
    matches = re.findall(pattern, html_content)
    for m in matches:
        used_functions.add(m)

ignored_words = {"alert", "confirm", "console", "event", "this", "document", "localStorage", "sessionStorage", "autoFillQuickAdd", "gcSubmitQuickAdd"}
used_functions = {f for f in used_functions if f not in ignored_words}

# 2. Parse JS files for function definitions
defined_functions = set()
js_files = []
for root, dirs, files in os.walk(js_dir):
    if "backup" in root.lower() or ".git" in root.lower() or "node_modules" in root.lower():
        continue
    for file in files:
        if file.endswith(".js"):
            js_files.append(os.path.join(root, file))

def_patterns = [
    r'function\s+(\w+)\s*\(',                    # function name()
    r'(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\((?:[^)]*)\)\s*=>', # const name = () =>
    r'window\.(\w+)\s*=',                         # window.name =
]

js_def_map = {}

for js_file in js_files:
    with open(js_file, "r", encoding="utf-8") as f:
        content = f.read()
    for pattern in def_patterns:
        matches = re.findall(pattern, content)
        for m in matches:
            defined_functions.add(m)
            if m not in js_def_map:
                js_def_map[m] = []
            js_def_map[m].append(os.path.relpath(js_file, js_dir))

# 3. Find missing functions
missing = []
for f in used_functions:
    if f not in defined_functions:
        missing.append(f)

print("\n--- MISSING FUNCTIONS ---")
for m in sorted(missing):
    print(f"- {m}")

print("\n--- DUPLICATE FUNCTIONS ---")
for func, files in js_def_map.items():
    if len(files) > 1 and func in used_functions:
        print(f"- {func} defined in: {files}")
