import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

words = re.findall(r'\b\w+\b', html)
tr_words = set(w for w in words if any(c in w for c in 'ğüşıöçĞÜŞİÖÇ'))

with open('tools/turkish_words.txt', 'w', encoding='utf-8') as f:
    for w in sorted(list(tr_words)):
        f.write(f"{w}\n")
