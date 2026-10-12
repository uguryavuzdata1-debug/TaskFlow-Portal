import codecs

with codecs.open('app.js', 'r', 'utf8') as f:
    app = f.read()

old_str = """    let filtered = tickets;

    if (activeDataTab === 'today') {"""

new_str = """    let filtered = tickets.filter(t => {
        const stat = t.status || '';
        const isStatusCompleted = (stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamland' || t.invoiced === true);
        
        let isFuture = false;
        if (t.timestamp) {
            const tDate = new Date(t.timestamp);
            if (tDate > new Date()) isFuture = true;
        }
        
        return !isFuture && isStatusCompleted;
    });

    if (activeDataTab === 'today') {"""

if old_str in app:
    app = app.replace(old_str, new_str)
    with codecs.open('app.js', 'w', 'utf8') as f:
        f.write(app)
    print("Updated renderDataTable in app.js")
else:
    print("Could not find the target string in app.js")
