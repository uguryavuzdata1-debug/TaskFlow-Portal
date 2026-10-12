import json

log_file = r'C:\Users\Administrator\.gemini\antigravity-ide\brain\5c1b8cc6-499b-4bd9-aeb2-3bcd460c724c\.system_generated\logs\transcript.jsonl'

with open(log_file, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('source') == 'SYSTEM' and data.get('type') == 'TOOL_RESPONSE':
                output = data.get('content', '')
                if '@@ -1134,7 +1134,130 @@' in output:
                    # Found it!
                    blocks = output.split('\n')
                    deleted = [l[1:] for l in blocks if l.startswith('-') and not l.startswith('---')]
                    with open(r'h:\UGUR AI\Unfinished Work\TO DO\deleted_code.js', 'w', encoding='utf-8') as out:
                        out.write('\n'.join(deleted))
                    print("Found!")
                    break
        except:
            pass
