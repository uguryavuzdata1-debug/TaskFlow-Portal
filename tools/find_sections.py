import re
import codecs
html = codecs.open('index.html', 'r', 'utf-8').read()
sections = re.findall(r'id=\"(section-[^\"]+)\"', html)
print(sections)
