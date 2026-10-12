import requests

TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJCaUhJTUxtSUVmR0R1MDdXRWFlUHR3Iiwib3JnX2lkIjoxMDAwMjU1MDg1fQ.oDS_D_DORdo9KWAUqKgcLkEK5XmK4W7a8zy9oukEGg5eR8xHvqFyPfnIcsDXYcAtie7aITyfm734KaPq5uokBQ"
headers = {"Authorization": f"Bearer {TOKEN}"}

# 1. Get Organizations
res = requests.get("https://api.turso.tech/v1/organizations", headers=headers)
if res.status_code == 200:
    orgs = res.json()
    print("Orgs:", orgs)
    # The slug for the org is likely 'uguryavuz' or the first one in the list.
else:
    print("Failed to get orgs:", res.status_code, res.text)
