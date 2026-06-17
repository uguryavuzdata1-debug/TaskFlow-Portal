import urllib.request
import re
import json

with open('js/config.js', 'r') as f:
    text = f.read()

url = re.search(r"supabaseUrl\s*=\s*['\"]([^'\"]+)['\"]", text).group(1)
key = re.search(r"supabaseAnonKey\s*=\s*['\"]([^'\"]+)['\"]", text).group(1)

req = urllib.request.Request(f'{url}/rest/v1/records?select=*&limit=1', headers={
    'apikey': key,
    'Authorization': f'Bearer {key}'
})

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        if data:
            print(list(data[0].keys()))
        else:
            print('No records')
except Exception as e:
    print('Error:', e)
