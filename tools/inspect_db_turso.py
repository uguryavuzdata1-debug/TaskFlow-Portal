import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv('TURSO_DATABASE_URL', '')
if db_url.startswith('libsql://'):
    http_url = 'https://' + db_url[9:] + '/v2/pipeline'
else:
    http_url = db_url + '/v2/pipeline'

token = os.getenv('TURSO_AUTH_TOKEN', '')

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

body = {
    "requests": [
        {"type": "execute", "stmt": {"sql": "SELECT name, sql FROM sqlite_master WHERE type='table'"}}
    ]
}

res = requests.post(http_url, headers=headers, json=body)
print("Status:", res.status_code)
data = res.json()
if 'results' in data and len(data['results']) > 0:
    rows = data['results'][0]['response']['result']['rows']
    for r in rows:
        tname = r[0]['value']
        tsql = r[1]['value']
        print(f"=== TABLE: {tname} ===")
        print(tsql)
        
        # count rows
        cnt_res = requests.post(http_url, headers=headers, json={
            "requests": [{"type": "execute", "stmt": {"sql": f"SELECT COUNT(*) FROM {tname}"}}]
        })
        cnt_data = cnt_res.json()
        count = cnt_data['results'][0]['response']['result']['rows'][0][0]['value']
        print(f"Row count: {count}")
        print()
else:
    print("Response:", data)
