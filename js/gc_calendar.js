// =============================================
// GOOGLE CALENDAR CLONE — Full Rewrite
// =============================================

let gcCurrentDate = new Date();
let gcViewMode = 'week'; // 'week' | 'month' | 'day'
let gcStaffFilters = [];
let gcAvailableStaff = [];

const GC_COLORS = [
  '#1a73e8', '#0b8043', '#d50000', '#8e24aa',
  '#f09300', '#0097a7', '#e67c73', '#33b679'
];

const GC_SERVICE_COLORS = {
  'S1': '#1a73e8', 'S2': '#0b8043', 'S3': '#d50000',
  'S4': '#8e24aa', 'S5': '#f09300', 'S6': '#0097a7'
};

// ─── Init ──────────────────────────────────
function initGoogleCalendar() {
  extractStaff();
  renderStaffFilters();
  updateGcHeader();
  renderGcMiniCalendar();
  renderCurrentView();
  startCurrentTimeLine();
}

function renderCurrentView() {
  if (gcViewMode === 'week') renderGcWeekView();
  else if (gcViewMode === 'month') renderGcMonthView();
  else if (gcViewMode === 'day') renderGcDayView();
}

// ─── Staff ────────────────────────────────
function extractStaff() {
  const tickets = appState.tickets || [];
  const staffSet = new Set();
  tickets.forEach(t => {
    if (t.user) staffSet.add(t.user);
    if (t.created_by) staffSet.add(t.created_by);
  });
  if (appState.currentUser) staffSet.add(appState.currentUser);
  gcAvailableStaff = Array.from(staffSet);
  // Keep existing filters if already set
  if (gcStaffFilters.length === 0) gcStaffFilters = [...gcAvailableStaff];
}

function renderStaffFilters() {
  const container = document.getElementById('gc-staff-filters');
  if (!container) return;
  // Removed staff filters as requested
  container.innerHTML = ''; 
  const parent = container.closest('.gc-calendars-list');
  if (parent) parent.style.display = 'none';
}

window.toggleGcStaffFilter = function(cb) {
  if (cb.checked) {
    if (!gcStaffFilters.includes(cb.value)) gcStaffFilters.push(cb.value);
  } else {
    gcStaffFilters = gcStaffFilters.filter(s => s !== cb.value);
  }
  renderStaffFilters();
  renderCurrentView();
};

// ─── Header ───────────────────────────────
function updateGcHeader() {
  const h2 = document.getElementById('gc-date-range');
  if (!h2) return;

  const opts = { month: 'long' };
  if (gcViewMode === 'week') {
    const sow = getStartOfWeek(gcCurrentDate);
    const eow = new Date(sow); eow.setDate(eow.getDate() + 6);
    const m1 = sow.toLocaleString('en-GB', opts);
    const m2 = eow.toLocaleString('en-GB', opts);
    const y1 = sow.getFullYear(), y2 = eow.getFullYear();
    h2.textContent = m1 === m2
      ? `${m1} ${y1}`
      : y1 === y2 ? `${m1} – ${m2} ${y1}` : `${m1} ${y1} – ${m2} ${y2}`;
  } else if (gcViewMode === 'month') {
    h2.textContent = `${gcCurrentDate.toLocaleString('en-GB', opts)} ${gcCurrentDate.getFullYear()}`;
  } else {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    h2.textContent = `${days[gcCurrentDate.getDay()]}, ${gcCurrentDate.toLocaleString('en-GB', opts)} ${gcCurrentDate.getDate()}, ${gcCurrentDate.getFullYear()}`;
  }

  // Update view select
  const sel = document.getElementById('gc-view-select');
  if (sel) sel.value = gcViewMode;
}

// ─── Navigation ───────────────────────────
window.gcPrevWeek = function() {
  if (gcViewMode === 'week') gcCurrentDate.setDate(gcCurrentDate.getDate() - 7);
  else if (gcViewMode === 'month') gcCurrentDate.setMonth(gcCurrentDate.getMonth() - 1);
  else gcCurrentDate.setDate(gcCurrentDate.getDate() - 1);
  initGoogleCalendar();
};
window.gcNextWeek = function() {
  if (gcViewMode === 'week') gcCurrentDate.setDate(gcCurrentDate.getDate() + 7);
  else if (gcViewMode === 'month') gcCurrentDate.setMonth(gcCurrentDate.getMonth() + 1);
  else gcCurrentDate.setDate(gcCurrentDate.getDate() + 1);
  initGoogleCalendar();
};
window.gcGoToday = function() {
  gcCurrentDate = new Date();
  initGoogleCalendar();
};
window.gcChangeView = function(mode) {
  gcViewMode = mode;
  updateGcHeader();
  renderGcMiniCalendar();
  renderCurrentView();
};

// ─── Helpers ──────────────────────────────
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getEventColor(evt) {
  if (evt.mainService && GC_SERVICE_COLORS[evt.mainService])
    return GC_SERVICE_COLORS[evt.mainService];
  const staffIdx = gcAvailableStaff.indexOf(evt.user || evt.created_by || '');
  return staffIdx >= 0 ? GC_COLORS[staffIdx % GC_COLORS.length] : '#1a73e8';
}

function isFiltered(evt) {
  const u = evt.user || evt.created_by || '';
  if (gcStaffFilters.length === 0) return true;
  return gcStaffFilters.includes(u);
}

// ─── WEEK VIEW ────────────────────────────
function renderGcWeekView() {
  const container = document.getElementById('gc-grid-container');
  if (!container) return;

  const sow = getStartOfWeek(gcCurrentDate);
  const today = new Date();
  const hours = Array.from({length: 11}, (_, i) => i + 8);

  // Build day columns
  let daysHtml = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(sow);
    d.setDate(d.getDate() + i);
    const isToday = sameDay(d, today);
    const isSunday = d.getDay() === 0;
    const dayName = d.toLocaleString('en-GB', { weekday: 'short' }).toUpperCase();
    const dateNum = d.getDate();
    daysHtml += `<div class="gc-day-header-cell ${isToday ? 'gc-today-col' : ''} ${isSunday ? 'gc-sunday' : ''}">
      <span class="gc-wday">${dayName}</span>
      <span class="gc-wdate ${isToday ? 'gc-today-circle' : ''}">${dateNum}</span>
    </div>`;
  }

  // Build time grid
  let gridHtml = '';
  for (let h = 8; h <= 20; h++) {
    const label = `${h.toString().padStart(2,'0')}:00`;
    gridHtml += `<div class="gc-time-row">
      <div class="gc-time-label"><span>${label}</span></div>`;
    for (let i = 0; i < 7; i++) {
      const d = new Date(sow);
      d.setDate(d.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      const isToday = sameDay(d, today);
      const isSunday = d.getDay() === 0;
      gridHtml += `<div class="gc-cell ${isToday ? 'gc-today-bg' : ''} ${isSunday ? 'gc-sunday-bg' : ''}"
        onclick="gcOpenQuickAdd('${ds}','${h.toString().padStart(2,'0')}:00')"></div>`;
    }
    gridHtml += `</div>`;
  }

  // Build events
  const tickets = appState.tickets || [];
  let eventsHtml = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(sow);
    d.setDate(d.getDate() + i);
    const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);

    const dayEvts = tickets.filter(t => {
      if (!t.timestamp) return false;
      const td = new Date(t.timestamp);
      return td >= dayStart && td <= dayEnd && isFiltered(t);
    });

    // Sort day events by time to process overlaps
    dayEvts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Overlap resolution (Column grouping)
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
        } else {
          dur = parseInt(evt.duration) || 60;
        }
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

      const top = ((h - 8) * 60 + m) * (48 / 60); // 48px per hour, starting from 08:00
      const height = Math.max(dur * (48 / 60), 20);
      
      const baseLeft = (i / 7) * 100;
      const baseWidth = (1 / 7) * 100;
      
      // Calculate split widths if there are overlaps
      const colWidth = baseWidth / numCols;
      const left = baseLeft + (evt._col * colWidth) + 0.2;
      const width = colWidth - 0.5;

      const color = getEventColor(evt);
      const isCompleted = evt.status === 'Completed' || evt.invoiced === true;
      const timeStr = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;

      eventsHtml += `
        <div class="gc-event-pill" style="
          top:${top}px; height:${height}px;
          left:${left}%; width:${width}%;
          background:${color}; opacity:${isCompleted ? 0.6 : 1};
          text-decoration:${isCompleted ? 'line-through' : 'none'};"
          onclick="event.stopPropagation(); openAppointmentView('${evt.id}')"
          title="${evt.company || 'No name'} — ${timeStr}">
          <div class="gc-pill-title">${evt.company || 'No name'}</div>
          <div class="gc-pill-time">${timeStr}${evt.mainService ? ' · ' + evt.mainService : ''}</div>
        </div>`;
    });
  }

  container.innerHTML = `
    <div class="gc-week-view">
      <div class="gc-week-days-header">
        <div class="gc-time-gutter"></div>
        ${daysHtml}
      </div>
      <div class="gc-week-body">
        <div class="gc-week-grid">
          ${gridHtml}
        </div>
        <div class="gc-events-layer" id="gc-events-layer">
          ${eventsHtml}
        </div>
        <div class="gc-now-line hidden" id="gc-now-line"></div>
      </div>
    </div>`;

  updateNowLine();
}

// ─── MONTH VIEW ───────────────────────────
function renderGcMonthView() {
  const container = document.getElementById('gc-grid-container');
  if (!container) return;

  const year = gcCurrentDate.getFullYear();
  const month = gcCurrentDate.getMonth();
  const today = new Date();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const prevDays = new Date(year, month, 0).getDate();

  const tickets = appState.tickets || [];
  const ticketsByDay = {};
  tickets.filter(isFiltered).forEach(t => {
    if (!t.timestamp) return;
    const d = new Date(t.timestamp);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate();
      if (!ticketsByDay[key]) ticketsByDay[key] = [];
      ticketsByDay[key].push(t);
    }
  });

  const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  let html = `<div class="gc-month-view">
    <div class="gc-month-header-row">
      ${weekdays.map((d, index) => `<div class="gc-month-wday ${index === 6 ? 'gc-sunday' : ''}">${d}</div>`).join('')}
    </div>
    <div class="gc-month-grid">`;

  // Prev month days
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevDays - i);
    const isSunday = d.getDay() === 0;
    html += `<div class="gc-month-cell gc-other-month ${isSunday ? 'gc-sunday-cell' : ''}">
      <span class="gc-month-day-number">${prevDays - i}</span>
    </div>`;
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const evts = ticketsByDay[d] || [];
    const pending = evts.filter(t => t.status !== 'Completed' && !t.invoiced);
    const completed = evts.filter(t => t.status === 'Completed' || t.invoiced);
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    let evtHtml = '';
    const maxShow = 3;
    const allEvts = evts.slice(0, maxShow);
    allEvts.forEach(t => {
      const color = getEventColor(t);
      const title = t.company || t.mainService || 'Event';
      evtHtml += `<div class="gc-month-event" style="background:${color};"
        onclick="event.stopPropagation(); openAppointmentView('${t.id}')"
        title="${title}">
        <span>${title}</span>
      </div>`;
    });
    if (evts.length > maxShow) {
      evtHtml += `<div class="gc-month-more" onclick="gcDayClick('${dateStr}')">+${evts.length - maxShow} more</div>`;
    }

    const cellDate = new Date(year, month, d);
    const isSunday = cellDate.getDay() === 0;
    html += `<div class="gc-month-cell ${isToday ? 'today' : ''} ${isSunday ? 'gc-sunday-cell' : ''}"
      ondblclick="event.stopPropagation(); createAppointmentForSlot('${dateStr}','09:00')"
      onclick="gcDayClick('${dateStr}')">
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:2px;">
        <span class="gc-month-day-number ${isToday ? 'gc-today-circle' : ''}">${d}</span>
        <button onclick="event.stopPropagation(); createAppointmentForSlot('${dateStr}','09:00')" title="Book Appointment for ${dateStr}" style="background:transparent; border:none; color:var(--steel, #64748b); font-size:15px; font-weight:700; cursor:pointer; padding:0 4px; border-radius:4px; opacity:0.6; line-height:1;" onmouseover="this.style.opacity='1'; this.style.color='var(--ink, #1e293b)';" onmouseout="this.style.opacity='0.6'; this.style.color='var(--steel, #64748b)';">+</button>
      </div>
      <div class="gc-month-events">${evtHtml}</div>
    </div>`;
  }

  // Next month days
  const totalCells = startOffset + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const isSunday = d.getDay() === 0;
    html += `<div class="gc-month-cell gc-other-month ${isSunday ? 'gc-sunday-cell' : ''}"><span class="gc-month-day-number">${i}</span></div>`;
  }

  html += `</div></div>`;
  container.innerHTML = html;
}

window.gcDayClick = function(dateStr) {
  gcCurrentDate = new Date(dateStr + 'T12:00:00');
  gcViewMode = 'day';
  updateGcHeader();
  renderGcMiniCalendar();
  renderGcDayView();
};

// ─── DAY VIEW ─────────────────────────────
function renderGcDayView() {
  const container = document.getElementById('gc-grid-container');
  if (!container) return;

  const today = new Date();
  const d = gcCurrentDate;
  const isToday = sameDay(d, today);
  const ds = d.toISOString().split('T')[0];
  const dayName = d.toLocaleString('en-GB', { weekday: 'long' });
  const dateNum = d.getDate();

  let gridHtml = '';
  for (let h = 8; h <= 20; h++) {
    const label = `${h.toString().padStart(2,'0')}:00`;
    gridHtml += `<div class="gc-time-row">
      <div class="gc-time-label"><span>${label}</span></div>
      <div class="gc-cell gc-day-cell ${isToday ? 'gc-today-bg' : ''}"
        onclick="gcOpenQuickAdd('${ds}','${h.toString().padStart(2,'0')}:00')"></div>
    </div>`;
  }

  const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
  const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
  const tickets = appState.tickets || [];
  const dayEvts = tickets.filter(t => {
    if (!t.timestamp) return false;
    const td = new Date(t.timestamp);
    return td >= dayStart && td <= dayEnd && isFiltered(t);
  });

  let eventsHtml = '';
  // Sort day events by time to process overlaps
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
    const timeStr = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;

    eventsHtml += `
      <div class="gc-event-pill gc-day-event-pill" style="
        top:${top}px; height:${height}px;
        left:${left}%; width:${width}%;
        background:${color}; opacity:${isCompleted ? 0.6 : 1};"
        onclick="event.stopPropagation(); openAppointmentView('${evt.id}')"
        title="${evt.company || 'No name'} — ${timeStr}">
        <div class="gc-pill-title">${evt.company || 'No name'}</div>
        <div class="gc-pill-time">${timeStr}${evt.mainService ? ' · ' + evt.mainService : ''}</div>
      </div>`;
  });

  container.innerHTML = `
    <div class="gc-week-view">
      <div class="gc-week-days-header gc-day-header-single">
        <div class="gc-time-gutter"></div>
        <div class="gc-day-header-cell ${isToday ? 'gc-today-col' : ''} ${d.getDay() === 0 ? 'gc-sunday' : ''}">
          <span class="gc-wday">${dayName.toUpperCase()}</span>
          <span class="gc-wdate ${isToday ? 'gc-today-circle' : ''}">${dateNum}</span>
        </div>
      </div>
      <div class="gc-week-body gc-day-body">
        <div class="gc-week-grid gc-day-grid">${gridHtml}</div>
        <div class="gc-events-layer gc-day-events-layer">${eventsHtml}</div>
        <div class="gc-now-line hidden" id="gc-now-line"></div>
      </div>
    </div>`;

  updateNowLine();
}

// ─── Mini Calendar ────────────────────────
function renderGcMiniCalendar() {
  const mini = document.getElementById('gc-mini-calendar');
  if (!mini) return;

  const year = gcCurrentDate.getFullYear();
  const month = gcCurrentDate.getMonth();
  const today = new Date();
  const monthName = gcCurrentDate.toLocaleString('en-GB', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const prevDays = new Date(year, month, 0).getDate();

  let sow = null, eow = null;
  if (gcViewMode === 'week') {
    sow = getStartOfWeek(gcCurrentDate);
    eow = new Date(sow); eow.setDate(eow.getDate() + 6);
  }

  let cells = '';
  // Prev
  for (let i = startOffset - 1; i >= 0; i--) {
    cells += `<div class="gc-mini-day gc-mini-other">${prevDays - i}</div>`;
  }
  // Current
  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(year, month, d);
    const isTod = sameDay(cellDate, today);
    const inWeek = sow && cellDate >= sow && cellDate <= eow;
    const isSel = sameDay(cellDate, gcCurrentDate) && gcViewMode === 'day';
    cells += `<div class="gc-mini-day ${isTod ? 'today' : ''} ${inWeek ? 'selected-week' : ''} ${isSel ? 'selected-day' : ''}"
      onclick="gcMiniDayClick(${year},${month},${d})">${d}</div>`;
  }
  // Next
  const total = startOffset + daysInMonth;
  const rem = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= rem; i++) {
    cells += `<div class="gc-mini-day gc-mini-other">${i}</div>`;
  }

  mini.innerHTML = `
    <div class="gc-mini-header">
      <span class="gc-mini-month">${monthName} ${year}</span>
      <div class="gc-mini-nav-btns">
        <button onclick="gcCurrentDate.setMonth(gcCurrentDate.getMonth()-1); initGoogleCalendar();">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button onclick="gcCurrentDate.setMonth(gcCurrentDate.getMonth()+1); initGoogleCalendar();">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
    <div class="gc-mini-days">
      <div class="gc-mini-wday">M</div><div class="gc-mini-wday">T</div>
      <div class="gc-mini-wday">W</div><div class="gc-mini-wday">T</div>
      <div class="gc-mini-wday">F</div><div class="gc-mini-wday">S</div>
      <div class="gc-mini-wday">S</div>
      ${cells}
    </div>`;
}

window.gcMiniDayClick = function(year, month, day) {
  gcCurrentDate = new Date(year, month, day);
  if (gcViewMode === 'month') {
    gcViewMode = 'day';
  }
  initGoogleCalendar();
};

// ─── Now Line ─────────────────────────────
function updateNowLine() {
  const line = document.getElementById('gc-now-line');
  if (!line) return;

  if (gcViewMode === 'month') { line.classList.add('hidden'); return; }

  // Check if today is in view
  const today = new Date();
  if (gcViewMode === 'week') {
    const sow = getStartOfWeek(gcCurrentDate);
    const eow = new Date(sow); eow.setDate(eow.getDate() + 6);
    if (today < sow || today > eow) { line.classList.add('hidden'); return; }

    const dayIdx = (today.getDay() + 6) % 7; // Mon=0
    const gutterW = 52; // px
    const colW = (line.parentElement?.offsetWidth - gutterW) / 7 || 100;
    line.style.left = `${gutterW + dayIdx * colW}px`;
    line.style.width = `${colW}px`;
  } else {
    if (!sameDay(today, gcCurrentDate)) { line.classList.add('hidden'); return; }
    line.style.left = '52px';
    line.style.width = 'calc(100% - 52px)';
  }

  const h = today.getHours();
  const m = today.getMinutes();
  const topOffset = ((h - 8) * 60 + m) * (48 / 60);
  if (topOffset >= 0 && topOffset <= 11 * 48) {
    line.style.top = `${topOffset}px`;
    line.classList.remove('hidden');
  } else {
    line.classList.add('hidden');
  }
}

function startCurrentTimeLine() {
  updateNowLine();
  const body = document.querySelector('.gc-week-body');
  if (body) {
    const now = new Date();
    const h = now.getHours();
    const scrollTo = Math.max(0, (h - 8 - 1) * 48);
    body.scrollTop = scrollTo;
  }
}

// ─── Quick Add ────────────────────────────
window.gcOpenQuickAdd = function(dateStr, timeStr) {
  if (typeof createAppointmentForSlot === 'function') {
    createAppointmentForSlot(dateStr, timeStr);
  } else {
    const modal = document.getElementById('quick-add-modal') || document.getElementById('gc-quick-add-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
    const dInput = document.getElementById('qa-date') || document.getElementById('gc-qa-date');
    const tInput = document.getElementById('qa-time') || document.getElementById('gc-qa-time');
    if (dInput) dInput.value = d.toISOString().split('T')[0];
    if (tInput) tInput.value = timeStr || '09:00';
    const titleEl = document.getElementById('qa-customer-search') || document.getElementById('gc-qa-title');
    if (titleEl) { titleEl.value = ''; titleEl.focus(); }
  }
};

// ─── Override global renderCalendar ───────
window.renderCalendar = function() {
  if (typeof appState !== 'undefined' && appState.activeTab !== 'calendar') return;
  initGoogleCalendar();
};

// Boot
// Removed automatic initGoogleCalendar call to prevent global visibility.
// it will be called by showTab -> renderCalendar.
