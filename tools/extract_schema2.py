import re

extracted = []
current_table = None

with open('vtigercrm.sql', 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        # Match case-insensitive CREATE TABLE
        match = re.search(r'CREATE TABLE (?:IF NOT EXISTS )?[`"\']?([a-zA-Z0-9_]+)[`"\']?', line, re.IGNORECASE)
        if match:
            table_name = match.group(1).lower()
            if 'account' in table_name or 'crmentity' in table_name or 'contact' in table_name:
                current_table = table_name
                extracted.append(f"\n--- {table_name} ---")
                extracted.append(line.strip())
            else:
                current_table = None
        elif current_table:
            extracted.append(line.strip())
            if line.strip().endswith(';'):
                current_table = None

with open('vtiger_schema_summary2.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(extracted))

print("Extraction complete.")
