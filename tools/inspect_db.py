import re
import urllib.request
import json

# Read Supabase URL and Key from js/config.js
with open('js/config.js', 'r') as f:
    text = f.read()

url_match = re.search(r'SB_URL\s*=\s*[\'"]([^\'"]+)[\'"]', text)
key_match = re.search(r'SB_KEY\s*=\s*[\'"]([^\'"]+)[\'"]', text)

if not url_match or not key_match:
    print("Could not find SB_URL or SB_KEY in js/config.js")
    exit(1)

url = url_match.group(1)
key = key_match.group(1)

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}'
}

def query_endpoint(endpoint):
    req = urllib.request.Request(f"{url}/rest/v1/{endpoint}", headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error querying {endpoint}: {e}")
        return None

print("=== Supabase Connection Info ===")
print("URL:", url)
print("\n=== Fetching organizations (lowercase o) ===")
orgs = query_endpoint("organizations?limit=3")
if orgs:
    print(f"Loaded {len(orgs)} organizations.")
    print("Columns:", list(orgs[0].keys()))
    print("Sample:", json.dumps(orgs[0], indent=2))
else:
    print("No records or query failed.")

print("\n=== Fetching Organizations (uppercase O) ===")
orgs_cap = query_endpoint("Organizations?limit=3")
if orgs_cap:
    print(f"Loaded {len(orgs_cap)} Organizations.")
    print("Columns:", list(orgs_cap[0].keys()))
    print("Sample:", json.dumps(orgs_cap[0], indent=2))
else:
    print("No records or query failed.")

print("\n=== Fetching Contracts ===")
contracts = query_endpoint("contracts?limit=5")
if contracts:
    print(f"Loaded {len(contracts)} contracts.")
    print("Contract Columns:")
    print(list(contracts[0].keys()))
    print("\nFirst Contract Sample Record:")
    print(json.dumps(contracts[0], indent=2))
else:
    print("No contracts found or query failed.")

# Count all organizations and check for missing columns
all_orgs = query_endpoint("organizations")
if all_orgs:
    print(f"\nTotal organizations: {len(all_orgs)}")
    null_name = sum(1 for o in all_orgs if not o.get('organization_name'))
    null_postcode = sum(1 for o in all_orgs if not o.get('billing_postal_code'))
    null_org_num = sum(1 for o in all_orgs if not o.get('organization_number'))
    
    print("\n=== Customer Data Health Check ===")
    print(f"Organizations with empty/null name: {null_name}")
    print(f"Organizations with empty/null postcode: {null_postcode}")
    print(f"Organizations with empty/null organization_number (CRM ID): {null_org_num}")
    
    # Check for empty contact info
    null_contact = sum(1 for o in all_orgs if not o.get('contact_name'))
    null_phone = sum(1 for o in all_orgs if not o.get('phone'))
    print(f"Organizations with no contact name field populated: {null_contact}")
    print(f"Organizations with no phone field populated: {null_phone}")
else:
    print("Could not fetch full list of organizations.")
