import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv('TURSO_DATABASE_URL', '').replace('libsql://', 'https://') + '/v2/pipeline'
token = os.getenv('TURSO_AUTH_TOKEN', '')

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

def exec_sql(sql):
    req = {'requests': [{'type': 'execute', 'stmt': {'sql': sql}}]}
    r = requests.post(db_url, headers=headers, json=req)
    return r.json()

# 1. Add username column
res = exec_sql("ALTER TABLE users ADD COLUMN username TEXT")
print("Add username column result:", res.get('results', [{}])[0].get('type'))

# 2. Update existing users
exec_sql("UPDATE users SET username = 'ugur', email = NULL WHERE id = 'U-001'")
exec_sql("UPDATE users SET username = 'ahmet', email = NULL WHERE full_name LIKE '%Ahmet%'")
exec_sql("DELETE FROM users WHERE id = 'U-1790606700488'")

# 3. Query updated users
res = exec_sql("SELECT id, full_name, username, role, status FROM users")
rows = res['results'][0]['response']['result']['rows']
for r in rows:
    print([c.get('value') for c in r])
