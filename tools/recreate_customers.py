import requests
import json

TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA0MTMwMDcsImlkIjoiMDFhMGRjZWUtMDIwMS03ZWU3LTliMTMtODk0N2IzYjhjM2ZjIiwia2lkIjoiUGlXX2U0VkRpd1lqdmRHSTg3cGxydE4tY1RhZWdGbG5UeE5fbUlIT0VGYyIsInJpZCI6IjU2OWJhMWM0LTFmZTQtNDQ5Yi04NzM0LTAxOWQ5ZTYyZTQ3NyJ9.ABiOIIp6m7eAvpVfObbk4sT56NkuH5uWuLwyGsrTJdbyq-f8JchXdW0M_JGr72Wpfxf6QCrbIl-N_YVe7DSZBg"
HOSTNAME = "taskflow-uguryavuz.aws-eu-west-1.turso.io"

libsql_headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}
libsql_url = f"https://{HOSTNAME}/v2/pipeline"

stmts = [
    {"type": "execute", "stmt": {"sql": "DROP TABLE IF EXISTS customers;"}},
    {"type": "execute", "stmt": {"sql": '''
        CREATE TABLE customers (
            id TEXT PRIMARY KEY, 
            organization_name TEXT NOT NULL,
            organization_number TEXT,
            created_time DATETIME,
            assigned_to TEXT,
            modified_time DATETIME,
            billing_address TEXT,
            billing_city TEXT,
            billing_postal_code TEXT,
            ownership TEXT,
            primary_email TEXT,
            primary_phone TEXT,
            description TEXT,
            updates TEXT,
            quotes TEXT,
            tickets TEXT,
            contract_start_date DATE,
            contract_due_date DATE,
            contract_status TEXT
        );
    '''}},
    {"type": "execute", "stmt": {"sql": "INSERT INTO customers (id, organization_name, organization_number, billing_postal_code, contract_status) VALUES ('C-001', 'Riverside Pharmacy', 'ORG-1001', 'SW1A 1AA', 'ACTIVE');"}}
]

req_body = {
    "requests": stmts
}

res_sql = requests.post(libsql_url, headers=libsql_headers, json=req_body)
if res_sql.status_code == 200:
    print("Customers table re-created with full Vtiger schema successfully!")
else:
    print("Failed:", res_sql.status_code, res_sql.text)
