import re
import urllib.request
import json

with open('js/config.js', 'r') as f:
    text = f.read()

url = re.search(r'SB_URL\s*=\s*[\'"]([^\'"]+)[\'"]', text).group(1)
key = re.search(r'SB_KEY\s*=\s*[\'"]([^\'"]+)[\'"]', text).group(1)

headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

def get_data(table):
    req = urllib.request.Request(f"{url}/rest/v1/{table}", headers=headers)
    try:
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {table}: {e}")
        return []

orgs_lower = get_data("organizations")
orgs_upper = get_data("Organizations")
contracts = get_data("contracts")
service_contracts = get_data("service_contracts")

print("=== Lowercase 'organizations' ===")
for o in orgs_lower:
    print(f"ID: {o['id']} | Name: {o['organization_name']} | Number: {o['organization_number']}")

print("\n=== Uppercase 'Organizations' ===")
for o in orgs_upper:
    print(f"ID: {o['id']} | Name: {o['organization_name']} | Number: {o['organization_number']}")

print("\n=== 'contracts' (links) ===")
for c in contracts:
    print(f"ID: {c['id']} | Org ID: {c['organization_id']} | Status: {c['status']}")

print("\n=== 'service_contracts' (links) ===")
for sc in service_contracts:
    print(f"ID: {sc['id']} | Org ID: {sc['organization_id']} | Status: {sc['status']}")
