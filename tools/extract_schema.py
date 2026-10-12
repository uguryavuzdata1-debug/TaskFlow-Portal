import re

target_tables = [
    'vtiger_crmentity', 
    'vtiger_account', 
    'vtiger_accountbillads', 
    'vtiger_accountscf',
    'vtiger_contactdetails',
    'vtiger_servicecontracts'
]

current_table = None
extracted = []

with open('vtigercrm.sql', 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        # Match CREATE TABLE `tablename`
        match = re.match(r'^CREATE TABLE `([^`]+)`', line)
        if match:
            table_name = match.group(1)
            if table_name in target_tables:
                current_table = table_name
                extracted.append(f"\n--- {table_name} ---")
                extracted.append(line.strip())
            else:
                current_table = None
        elif current_table:
            # We are inside a target table definition
            extracted.append(line.strip())
            # Stop if we hit the end of the CREATE TABLE statement
            if line.strip().endswith(';'):
                current_table = None

with open('vtiger_schema_summary.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(extracted))

print("Extraction complete. See vtiger_schema_summary.txt")
