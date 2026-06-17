import re
import urllib.request

with open('js/config.js', 'r') as f:
    text = f.read()

url = re.search(r'SB_URL\s*=\s*[\'"]([^\'"]+)[\'"]', text).group(1)
key = re.search(r'SB_KEY\s*=\s*[\'"]([^\'"]+)[\'"]', text).group(1)

req = urllib.request.Request(url + '/rest/v1/records?limit=0', headers={'apikey': key, 'Authorization': f'Bearer {key}', 'Accept': 'application/vnd.pgrst.object+json'})
req.get_method = lambda: 'OPTIONS'
with urllib.request.urlopen(req) as response:
    print(response.read().decode('utf-8'))
