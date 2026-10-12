import re
import urllib.request
import json

with open('js/config.js', 'r') as f:
    text = f.read()

url = re.search(r'SB_URL\s*=\s*[\'"]([^\'"]+)[\'"]', text).group(1)
key = re.search(r'SB_KEY\s*=\s*[\'"]([^\'"]+)[\'"]', text).group(1)

data = json.dumps({
    'COMPANY': 'Örnek Randevu',
    'INV NO': 'SRV-8001',
    'START TIME': '14:00',
    'END TIME': '14:30',
    'MAIN SERVICE': 'S1',
    'STATUS': 'Logged',
    'INV DATE': '2026-06-08',
    'USER': 'Admin',
    'DESCRIPTION': 'Ayin 8 i icin test randevu.'
}).encode('utf-8')

req = urllib.request.Request(url + '/rest/v1/records', data=data, headers={'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'application/json', 'Prefer': 'return=representation'})

try:
    with urllib.request.urlopen(req) as response:
        print('Inserted:', response.read().decode('utf-8'))
except Exception as e:
    print('Failed:', e.read().decode('utf-8'))
