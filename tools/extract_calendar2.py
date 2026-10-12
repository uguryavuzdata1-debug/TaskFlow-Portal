import os
import glob
import re

transcripts = glob.glob(r'C:\Users\Administrator\.gemini\antigravity-ide\brain\*\.system_generated\logs\transcript.jsonl')

calendar_html = None
calendar_regex = re.compile(r'<!-- CALENDAR SECTION -->\s*<section id="section-calendar" class="section">.*?</section>', re.DOTALL)

for t in transcripts:
    try:
        with open(t, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            match = calendar_regex.search(content)
            if match:
                calendar_html = match.group(0)
                print(f"Found in {t}")
                break
    except:
        pass

if calendar_html:
    with open(r'h:\UGUR AI\Unfinished Work\TO DO\calendar_recovered.html', 'w', encoding='utf-8') as f:
        f.write(calendar_html)
    print("Recovered calendar HTML!")
else:
    print("Could not extract full calendar HTML.")
