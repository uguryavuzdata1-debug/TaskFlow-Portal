import codecs

css_hack = """
/* FORCE NATIVE PICKER TO OPEN ON CLICK */
input[type="time"]::-webkit-calendar-picker-indicator,
input[type="date"]::-webkit-calendar-picker-indicator {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    background: transparent;
}
input[type="time"], input[type="date"] {
    position: relative;
}
"""

with codecs.open('style.css', 'a', 'utf8') as f:
    f.write(css_hack)

print("Added CSS hack to style.css")
