import requests
import json
import time

TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJCaUhJTUxtSUVmR0R1MDdXRWFlUHR3Iiwib3JnX2lkIjoxMDAwMjU1MDg1fQ.oDS_D_DORdo9KWAUqKgcLkEK5XmK4W7a8zy9oukEGg5eR8xHvqFyPfnIcsDXYcAtie7aITyfm734KaPq5uokBQ"
ORG = "uguryavuz"
DB_NAME = "taskflow"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Fetch existing databases to find taskflow
res = requests.get(f"https://api.turso.tech/v1/organizations/{ORG}/databases", headers=headers)
dbs = res.json().get("databases", [])
taskflow_db = next((db for db in dbs if db["Name"] == DB_NAME), None)

if not taskflow_db:
    print(f"Could not find DB {DB_NAME}")
    exit(1)

hostname = taskflow_db["Hostname"]
print("Using existing DB:", hostname)

# Create a token for this DB
print("Creating DB token...")
res_token = requests.post(
    f"https://api.turso.tech/v1/organizations/{ORG}/databases/{DB_NAME}/auth/tokens",
    headers=headers,
    json={"expiration": "never"}
)
db_token = res_token.json()["jwt"]

print("\nConnection Details:")
print(f"URL: libsql://{hostname}")
print(f"TOKEN: {db_token[:20]}...\n")

# Execute SQL via LibSQL HTTP API
print("Creating tables...")
libsql_headers = {
    "Authorization": f"Bearer {db_token}",
    "Content-Type": "application/json"
}
libsql_url = f"https://{hostname}/v2/pipeline"

stmts = [
    {"type": "execute", "stmt": {"sql": "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, full_name TEXT, role TEXT, status TEXT, password_hash TEXT);"}},
    {"type": "execute", "stmt": {"sql": "CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, company_name TEXT, address TEXT, postcode TEXT, phone TEXT, status TEXT);"}},
    {"type": "execute", "stmt": {"sql": "CREATE TABLE IF NOT EXISTS appointments (id TEXT PRIMARY KEY, customer_id TEXT, date TEXT, time TEXT, status TEXT, service_type TEXT, created_at DATETIME);"}},
    {"type": "execute", "stmt": {"sql": "CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, appointment_id TEXT, customer_id TEXT, issue_date TEXT, due_date TEXT, total REAL, status TEXT);"}},
    {"type": "execute", "stmt": {"sql": "CREATE TABLE IF NOT EXISTS system_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, action TEXT, details TEXT, timestamp DATETIME);"}},
    # Insert some seed data
    {"type": "execute", "stmt": {"sql": "INSERT OR IGNORE INTO users (id, full_name, role, status) VALUES ('U-001', 'Ugur Yavuz', 'Administrator', 'ACTIVE');"}},
    {"type": "execute", "stmt": {"sql": "INSERT OR IGNORE INTO customers (id, company_name, postcode, status) VALUES ('C-001', 'Riverside Pharmacy', 'SW1A 1AA', 'ACTIVE');"}},
]

req_body = {
    "requests": stmts
}

res_sql = requests.post(libsql_url, headers=libsql_headers, json=req_body)
if res_sql.status_code == 200:
    print("Tables created successfully!")
else:
    print("Failed to create tables:", res_sql.status_code, res_sql.text)

with open('.env', 'w') as f:
    f.write(f"TURSO_DATABASE_URL=libsql://{hostname}\n")
    f.write(f"TURSO_AUTH_TOKEN={db_token}\n")
print("Saved to .env")
