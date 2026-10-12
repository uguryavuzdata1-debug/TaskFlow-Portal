const fs = require('fs');
let c = fs.readFileSync('h:/UGUR AI/Unfinished Work/TO DO/js/gc_calendar.js', 'utf8');

// We need to match the specific dayEvts.forEach in renderGcDayView
// The regex below specifically looks for it after "let eventsHtml = '';"
const p = /(let eventsHtml = '';\s*)dayEvts\.forEach\(evt => \{[\s\S]*?\}\);/;

const r = `$1// Sort day events by time to process overlaps
  dayEvts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const columns = [];
  dayEvts.forEach(evt => {
    const eDate = new Date(evt.timestamp);
    const h = eDate.getHours();
    const m = eDate.getMinutes();
    let dur = 60;
    if (evt.duration) {
      if (typeof evt.duration === 'string' && evt.duration.includes(':')) {
        const [ph, pm] = evt.duration.split(':');
        dur = parseInt(ph) * 60 + parseInt(pm);
      } else dur = parseInt(evt.duration) || 60;
    }
    evt._startMin = h * 60 + m;
    evt._endMin = evt._startMin + dur;

    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      let lastEvt = columns[c][columns[c].length - 1];
      if (lastEvt._endMin <= evt._startMin) {
        columns[c].push(evt);
        evt._col = c;
        placed = true;
        break;
      }
    }
    if (!placed) {
      evt._col = columns.length;
      columns.push([evt]);
    }
  });

  const numCols = Math.max(1, columns.length);

  dayEvts.forEach(evt => {
    const eDate = new Date(evt.timestamp);
    const h = eDate.getHours();
    const m = eDate.getMinutes();
    const dur = evt._endMin - evt._startMin;
    
    const top = ((h - 8) * 60 + m) * (48 / 60);
    const height = Math.max(dur * (48 / 60), 20);
    
    const colWidth = 100 / numCols;
    const left = evt._col * colWidth;
    const width = colWidth - 0.5;

    const color = getEventColor(evt);
    const isCompleted = evt.status === 'Completed' || evt.invoiced === true;
    const timeStr = \`\${h.toString().padStart(2,'0')}:\${m.toString().padStart(2,'0')}\`;

    eventsHtml += \`
      <div class="gc-event-pill gc-day-event-pill" style="
        top:\${top}px; height:\${height}px;
        left:\${left}%; width:\${width}%;
        background:\${color}; opacity:\${isCompleted ? 0.6 : 1};"
        onclick="event.stopPropagation(); openAppointmentView('\${evt.id}')"
        title="\${evt.company || 'No name'} — \${timeStr}">
        <div class="gc-pill-title">\${evt.company || 'No name'}</div>
        <div class="gc-pill-time">\${timeStr}\${evt.mainService ? ' · ' + evt.mainService : ''}</div>
      </div>\`;
  });`;

c = c.replace(p, r);
fs.writeFileSync('h:/UGUR AI/Unfinished Work/TO DO/js/gc_calendar.js', c);
