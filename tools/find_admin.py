html = open('index.html', encoding='utf-8').read()
lines = html.split('\n')
start = 0
for i, line in enumerate(lines):
    if '<section id="section-admin"' in line:
        start = i
        break
print(f"Start: {start}")
with open('temp_admin.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines[start:start+100]))
