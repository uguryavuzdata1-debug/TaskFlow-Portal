import re
import codecs

html_head = codecs.open('index_head.html', 'r', 'utf-16le').read()
modals_head = re.findall(r'id=\"([a-zA-Z0-9_-]+modal)\"', html_head)
print("index_head.html modals:", modals_head)

html_curr = codecs.open('index.html', 'r', 'utf-8').read()
modals_curr = re.findall(r'id=\"([a-zA-Z0-9_-]+modal)\"', html_curr)
print("index.html modals:", modals_curr)
