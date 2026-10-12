import json
import re

log_file = r'C:\Users\Administrator\.gemini\antigravity-ide\brain\5c1b8cc6-499b-4bd9-aeb2-3bcd460c724c\.system_generated\logs\transcript.jsonl'
output_file = r'h:\UGUR AI\Unfinished Work\TO DO\extracted_calendar.html'

found_calendar = False

try:
    with open(log_file, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                if data.get('source') == 'SYSTEM' and data.get('type') == 'TOOL_RESPONSE':
                    output = data.get('content', '')
                    if 'section-calendar' in output:
                        # Try to extract just the section-calendar HTML if possible, or just dump the block
                        with open(output_file, 'a', encoding='utf-8') as out:
                            out.write(output + '\n\n---\n\n')
                        found_calendar = True
            except:
                pass
except Exception as e:
    print("Error:", e)

if found_calendar:
    print("Found calendar section! Saved to extracted_calendar.html")
else:
    print("Not found in the transcript.")
