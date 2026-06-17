import re
import urllib.request
import json

with open('js/config.js', 'r') as f:
    text = f.read()

url = re.search(r'SB_URL\s*=\s*[\'"]([^\'"]+)[\'"]', text).group(1)
key = re.search(r'SB_KEY\s*=\s*[\'"]([^\'"]+)[\'"]', text).group(1)

req = urllib.request.Request(url + '/rest/v1/records?order=TIMESTAMP.desc', headers={'apikey': key, 'Authorization': f'Bearer {key}'})

try:
    with urllib.request.urlopen(req) as response:
        print('Select works!')
except urllib.error.HTTPError as e:
    print('Select error:', e.read().decode('utf-8'))
