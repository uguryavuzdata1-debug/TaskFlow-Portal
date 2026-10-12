import re
import urllib.request
import json

with open('js/config.js', 'r') as f:
    text = f.read()

url = re.search(r'SB_URL\s*=\s*[\'"]([^\'"]+)[\'"]', text).group(1)
key = re.search(r'SB_KEY\s*=\s*[\'"]([^\'"]+)[\'"]', text).group(1)

req = urllib.request.Request(url + '/rest/v1/records?limit=1', headers={'apikey': key, 'Authorization': f'Bearer {key}'})

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        if data:
            print("First record keys:")
            print(json.dumps(data[0], indent=2))
        else:
            print("No records found.")
except Exception as e:
    print('Error:', e)
