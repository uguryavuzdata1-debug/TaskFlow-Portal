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

def exec_sql(sql, args=None):
    stmt = {'sql': sql}
    if args:
        # format args for Turso
        # Turso expects args as array of {type: 'text'|'integer'|'float'|'null', value: '...'}
        t_args = []
        for a in args:
            if a is None:
                t_args.append({'type': 'null'})
            elif isinstance(a, int):
                t_args.append({'type': 'integer', 'value': str(a)})
            elif isinstance(a, float):
                t_args.append({'type': 'float', 'value': a})
            else:
                t_args.append({'type': 'text', 'value': str(a)})
        stmt['args'] = t_args
        
    req = {'requests': [{'type': 'execute', 'stmt': stmt}]}
    r = requests.post(db_url, headers=headers, json=req)
    res = r.json()
    return res

print("Checking and applying Turso table updates...")

# 1. Add columns to users if missing
for col in ['email TEXT', 'password TEXT', 'avatar_url TEXT', 'created_at DATETIME']:
    col_name = col.split()[0]
    res = exec_sql(f"ALTER TABLE users ADD COLUMN {col}")
    if 'error' in str(res):
        print(f"Col {col_name} might already exist or skipped:", res.get('results', [{}])[0].get('error', {}).get('message', ''))
    else:
        print(f"Added column {col_name} to users")

# 2. Update Ugur Yavuz record
res = exec_sql("UPDATE users SET email = 'ugur@taskflow.com', password = '1234', role = 'Admin' WHERE id = 'U-001'")
print("Updated Ugur Yavuz user")

# 3. Create records / tickets table if not exists
create_records_sql = """
CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    ticket_id TEXT,
    customer_id TEXT,
    customer_name TEXT,
    phone TEXT,
    postcode TEXT,
    address TEXT,
    category TEXT,
    service_type TEXT,
    sub_services TEXT,
    price REAL DEFAULT 0,
    vat REAL DEFAULT 0,
    total_price REAL DEFAULT 0,
    payment_method TEXT,
    status TEXT DEFAULT 'Open',
    assigned_to TEXT,
    notes TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
"""
exec_sql(create_records_sql)
print("Ensured records (tickets) table exists")

# 4. Create app_settings table
create_settings_sql = """
CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY,
    data TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
"""
exec_sql(create_settings_sql)
print("Ensured app_settings table exists")

# 5. Create services table
create_services_sql = """
CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE,
    full_name TEXT,
    base_price REAL DEFAULT 0,
    hourly_price REAL DEFAULT 0
)
"""
exec_sql(create_services_sql)
print("Ensured services table exists")

# 6. Seed services if empty
res = exec_sql("SELECT count(*) as count FROM services")
cnt = 0
try:
    cnt = int(res['results'][0]['response']['result']['rows'][0][0]['value'])
except:
    pass

if cnt == 0:
    services = [
        ('s-1', 'S1', 'MENU UPDATE', 125.0, 25.0),
        ('s-2', 'S2', 'CREDIT CARD', 125.0, 0.0),
        ('s-3', 'S3', 'DATA RESET', 125.0, 0.0),
        ('s-4', 'S4', 'SERVICE', 65.0, 0.0),
        ('s-5', 'S5', 'OTHER', 0.0, 0.0),
        ('s-6', 'S6', 'TILL SETUP', 0.0, 0.0)
    ]
    for s in services:
        exec_sql(f"INSERT OR IGNORE INTO services (id, name, full_name, base_price, hourly_price) VALUES ('{s[0]}', '{s[1]}', '{s[2]}', {s[3]}, {s[4]})")
    print("Seeded services")

# Check users
res = exec_sql("SELECT id, full_name, email, role, password, status FROM users")
print("Current users in Turso:")
try:
    cols = [c['name'] for c in res['results'][0]['response']['result']['cols']]
    rows = res['results'][0]['response']['result']['rows']
    for r in rows:
        row_dict = {cols[i]: r[i]['value'] if 'value' in r[i] else None for i in range(len(cols))}
        print(" ", row_dict)
except Exception as e:
    print("Error parsing users:", e, res)
