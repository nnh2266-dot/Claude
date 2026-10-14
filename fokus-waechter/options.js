const LOOSEN_WAIT_SECONDS = 20;
const SITE_COLORS = { youtube: '#d9534f', instagram: '#8e5cc4' };
const $ = (id) => document.getElementById(id);

let current;

function buildLimitFields() {
  const wrap = $('limits');
  for (const [id, site] of Object.entries(FW.SITES)) {
    const field = document.createElement('div');
    field.className = 'field';
    field.innerHTML = `<label for="limit-${id}"></label>
      <input type="number" id="limit-${id}" min="0" max="1440" required>`;
    field.querySelector('label').textContent = `${site.name} (Minuten pro Tag)`;
    wrap.appendChild(field);
  }
}

function fillForm(s) {
  for (const id of Object.keys(FW.SITES)) $(`limit-${id}`).value = s.limits[id];
  $('blockShorts').checked = s.blockShorts;
  $('extensionMinutes').value = s.extensionMinutes;
  $('extensionsPerDay').value = s.extensionsPerDay;
  $('extensionWaitSeconds').value = s.extensionWaitSeconds;
  $('showBadge').checked = s.showBadge;
}

function readForm() {
  const limits = {};
  for (const id of Object.keys(FW.SITES)) limits[id] = Math.max(0, parseInt($(`limit-${id}`).value, 10) || 0);
  return {
    limits,
    blockShorts: $('blockShorts').checked,
    extensionMinutes: Math.max(1, parseInt($('extensionMinutes').value, 10) || 1),
    extensionsPerDay: Math.max(0, parseInt($('extensionsPerDay').value, 10) || 0),
    extensionWaitSeconds: Math.max(0, parseInt($('extensionWaitSeconds').value, 10) || 0),
    showBadge: $('showBadge').checked,
  };
}

// Lockert die neue Einstellung irgendeine Regel?
function isLoosening(oldS, newS) {
  return Object.keys(FW.SITES).some((id) => newS.limits[id] > oldS.limits[id])
    || (oldS.blockShorts && !newS.blockShorts)
    || newS.extensionMinutes > oldS.extensionMinutes
    || newS.extensionsPerDay > oldS.extensionsPerDay
    || newS.extensionWaitSeconds < oldS.extensionWaitSeconds;
}

async function save(next) {
  await chrome.storage.local.set({ settings: next });
  current = next;
  $('confirm').hidden = true;
  $('saveBtn').disabled = false;
  $('status').textContent = 'Gespeichert.';
  setTimeout(() => { $('status').textContent = ''; }, 2500);
}

let confirmTimer = null;
function askConfirm(next) {
  const btn = $('confirmBtn');
  $('confirm').hidden = false;
  $('saveBtn').disabled = true;
  btn.disabled = true;
  let left = LOOSEN_WAIT_SECONDS;
  btn.textContent = `Trotzdem speichern (${left} s)`;
  clearInterval(confirmTimer);
  confirmTimer = setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    left -= 1;
    if (left > 0) {
      btn.textContent = `Trotzdem speichern (${left} s)`;
    } else {
      clearInterval(confirmTimer);
      btn.disabled = false;
      btn.textContent = 'Trotzdem speichern';
    }
  }, 1000);
  btn.onclick = () => save(next);
}

$('cancelBtn').addEventListener('click', () => {
  clearInterval(confirmTimer);
  $('confirm').hidden = true;
  $('saveBtn').disabled = false;
  fillForm(current);
});

$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const next = readForm();
  if (isLoosening(current, next)) askConfirm(next);
  else save(next);
});

async function renderChart() {
  const usage = await FW.getUsage();
  const ids = Object.keys(FW.SITES);
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = FW.dayKey(d);
    const per = Object.fromEntries(ids.map((id) => [id, FW.dayEntry(usage, id, key).seconds]));
    days.push({ d, per, total: ids.reduce((a, id) => a + per[id], 0) });
  }
  const max = Math.max(60 * 30, ...days.map((x) => x.total));

  $('chart').replaceChildren(...days.map(({ d, per, total }, i) => {
    const col = document.createElement('div');
    col.className = 'col';
    const totalEl = document.createElement('span');
    totalEl.className = 'total num';
    totalEl.textContent = total >= 60 ? FW.formatMinutes(total) : '';
    const stack = document.createElement('div');
    stack.className = 'stack';
    stack.style.height = `${Math.max(2, (total / max) * 100)}%`;
    for (const id of ids) {
      if (!per[id]) continue;
      const seg = document.createElement('span');
      seg.style.height = `${(per[id] / total) * 100}%`;
      seg.style.background = SITE_COLORS[id];
      seg.title = `${FW.SITES[id].name}: ${FW.formatMinutes(per[id])}`;
      stack.appendChild(seg);
    }
    const label = document.createElement('small');
    label.textContent = i === 6 ? 'Heute' : d.toLocaleDateString('de-DE', { weekday: 'short' });
    col.append(totalEl, stack, label);
    return col;
  }));

  $('legend').replaceChildren(...ids.map((id) => {
    const span = document.createElement('span');
    span.innerHTML = `<i style="background:${SITE_COLORS[id]}"></i>`;
    span.append(FW.SITES[id].name);
    return span;
  }));

  const week = days.reduce((a, x) => a + x.total, 0);
  $('summary').textContent = `Diese Woche insgesamt: ${FW.formatMinutes(week)} · im Schnitt ${FW.formatMinutes(week / 7)} pro Tag`;
}

(async () => {
  buildLimitFields();
  current = await FW.getSettings();
  fillForm(current);
  renderChart();
  setInterval(renderChart, 30000);
})();
