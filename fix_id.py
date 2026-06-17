import codecs

app = codecs.open('app.js', 'r', 'utf-8').read()
app = app.replace("document.getElementById('customer-search').value", "document.getElementById('customer-search-saas').value")

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(app)
    
print("Fixed customer search ID in app.js")
