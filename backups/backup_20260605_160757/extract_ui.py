import json

log_file = r'C:\Users\Administrator\.gemini\antigravity-ide\brain\5c1b8cc6-499b-4bd9-aeb2-3bcd460c724c\.system_generated\logs\transcript.jsonl'
output_file = r'h:\UGUR AI\Unfinished Work\TO DO\extracted_ui.txt'

lines_found = []

with open(log_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            # Look at tool responses
            if data.get('source') == 'SYSTEM' and data.get('type') == 'TOOL_RESPONSE':
                output = data.get('content', '')
                if 'ui.js' in output:
                    lines_found.append(output)
        except:
            pass

with open(output_file, 'w', encoding='utf-8') as out:
    for l in lines_found:
        out.write(l + '\n\n--------------------\n\n')
