import re
import urllib.request
import json

with open('js/config.js', 'r') as f:
    text = f.read()

url = re.search(r'SB_URL\s*=\s*[\'"]([^\'"]+)[\'"]', text).group(1)
key = re.search(r'SB_KEY\s*=\s*[\'"]([^\'"]+)[\'"]', text).group(1)

req = urllib.request.Request(url + '/rest/v1/', headers={'apikey': key, 'Authorization': f'Bearer {key}'})

try:
    with urllib.request.urlopen(req) as response:
        schema = json.loads(response.read().decode('utf-8'))
        print("Available tables in Supabase:")
        for path in schema.get('paths', {}).keys():
            if path != '/' and not path.startswith('/rpc/'):
                print(path)
except Exception as e:
    print('Error:', e)
