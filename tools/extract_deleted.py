with open(r'h:\UGUR AI\Unfinished Work\TO DO\diffs.txt', 'r', encoding='utf-8') as f:
    diffs = f.read()

import re
# Find the diff block for ui.js where it deleted a massive chunk
blocks = diffs.split('====================')
for block in blocks:
    if '-// Note: The \'users\' table might need a \'password\' column if not using Auth.' in block and 'window.updateRecordEdits' in block:
        # This is the massive replacement diff
        lines = block.split('\n')
        deleted_lines = []
        for line in lines:
            if line.startswith('-'):
                deleted_lines.append(line[1:]) # Remove the '-'
        with open(r'h:\UGUR AI\Unfinished Work\TO DO\deleted_code.js', 'w', encoding='utf-8') as out:
            out.write('\n'.join(deleted_lines))
        print("Found and extracted deleted code.")
        break
