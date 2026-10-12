import codecs
import re

with codecs.open('js/ui.js', 'r', 'utf8') as f:
    ui = f.read()

# In renderDataTable
ui = re.sub(
    r"return\s*\(\s*stat\s*===\s*'Completed'\s*\|\|\s*stat\s*===\s*'Tamamland'\s*\|\|\s*stat\s*===\s*'Tamamland'\s*\|\|\s*t\.invoiced\s*===\s*true\s*\);",
    "return (stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamlandi');",
    ui
)

# In renderCalendar
ui = re.sub(
    r"return\s*!\(\s*stat\s*===\s*'Completed'\s*\|\|\s*stat\s*===\s*'Tamamland'\s*\|\|\s*stat\s*===\s*'Tamamland'\s*\|\|\s*t\.invoiced\s*===\s*true\s*\);",
    "return !(stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamlandi');",
    ui
)

# In renderWaitingJobs (just in case there is another occurrence)
# Actually, the regex above matches the one in renderCalendar which is identical to the one in renderWaitingJobs, except renderCalendar has it for `waitingCount`. Wait, let's see.

# Let's replace any occurrence of the filter logic
old_cond1 = "return (stat === 'Completed' || stat === 'Tamamland' || stat === 'Tamamland' || t.invoiced === true);"
old_cond2 = "return !(stat === 'Completed' || stat === 'Tamamland' || stat === 'Tamamland' || t.invoiced === true);"

new_cond1 = "return (stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamlandi');"
new_cond2 = "return !(stat === 'Completed' || stat === 'Tamamlandı' || stat === 'Tamamlandi');"

ui = ui.replace(old_cond1, new_cond1)
ui = ui.replace(old_cond2, new_cond2)

with codecs.open('js/ui.js', 'w', 'utf8') as f:
    f.write(ui)

print("Updated completed conditions!")
