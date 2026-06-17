import codecs
import re

html = codecs.open('index.html', 'r', 'utf-8').read()

html = html.replace('</body>', '<datalist id="vtiger-customer-list"></datalist>\n</body>')

with codecs.open('index.html', 'w', 'utf-8') as f:
    f.write(html)
