import codecs

try:
    html = codecs.open(r'h:\UGUR AI\Unfinished Work\TO DO\index.html', 'r', 'utf-8').read()
    idx = html.find('section-calendar')
    print("In index.html:", idx)
except Exception as e:
    print("Error with index.html:", e)

try:
    html_head = codecs.open(r'h:\UGUR AI\Unfinished Work\TO DO\index_head.html', 'r', 'utf-16le').read()
    idx = html_head.find('section-calendar')
    print("In index_head.html:", idx)
    if idx != -1:
        start_idx = html_head.rfind('<section', 0, idx)
        end_idx = html_head.find('</section>', start_idx) + 10
        print(html_head[start_idx:start_idx+100])
        print("Calendar section is", end_idx - start_idx, "bytes long")
except Exception as e:
    print("Error with index_head.html:", e)

