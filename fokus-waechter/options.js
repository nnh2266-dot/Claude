const SITE_COLORS = { youtube: '#d9534f', instagram: '#8e5cc4' };
const $ = (id) => document.getElementById(id);

let current;
let unlockedUntil = 0;

// ---------- Sperre & Test ----------

let testTimer = null;
let waited = 0;

function showLockView(name) {
  for (const v of ['lockedView', 'waitView', 'typeView', 'unlockedView']) $(v).hidden = v !== name;
  $('lock').classList.toggle('unlocked', name === 'unlockedView');
}

function isUnlocked() {
  return Date.now() < unlockedUntil;
}

function stopTest() {
  clearInterval(testTimer);
  testTimer = null;
  waited = 0;
}

function startTest() {
  stopTest();
  showLockView('waitView');
  const total = FW.UNLOCK_WAIT_SECONDS;
  const update = (active) => {
    $('clock').textContent = FW.formatClock(total - waited);
    $('clock').classList.toggle('paused', !active);
    $('waitBar').style.width = `${(waited / total) * 100}%`;
    $('waitNote').textContent = active
      ? 'Bleib auf dieser Seite. Willst du das wirklich ändern – oder nur gerade scrollen?'
      : 'Pausiert – die Zeit läuft nur, solange diese Seite im Vordergrund ist.';
  };
  update(true);
  testTimer = setInterval(() => {
    const active = document.visibilityState === 'visible' && document.hasFocus();
    if (active) waited += 1;
    update(active);
    if (waited >= total) {
      stopTest();
      showLockView('typeView');
      $('typed').value = '';
      $('typeError').textContent = '';
      $('typed').focus();
    }
  }, 1000);
}

function normalize(text) {
  return text.trim().replace(/\s+/g, ' ');
}

async function checkSentence() {
  if (normalize($('typed').value) !== FW.UNLOCK_SENTENCE) {
    $('typeError').textContent = 'Stimmt noch nicht genau. Achte auf jedes Zeichen.';
    return;
  }
  unlockedUntil = Date.now() + FW.UNLOCK_WINDOW_SECONDS * 1000;
  await chrome.storage.local.set({ unlockedUntil });
  renderLock();
}

function renderLock() {
  const unlocked = isUnlocked();
  $('fields').disabled = !unlocked;
  if (unlocked) {
    showLockView('unlockedView');
    $('unlockLeft').textContent = FW.formatClock((unlockedUntil - Date.now()) / 1000);
  } else if (!$('unlockedView').hidden) {
    // Zeitfenster abgelaufen: ungespeicherte Änderungen verwerfen.
    fillForm(current);
    showLockView('lockedView');
  }
}

$('sentence').textContent = FW.UNLOCK_SENTENCE;
$('startTest').addEventListener('click', startTest);
$('cancelTest').addEventListener('click', () => { stopTest(); showLockView('lockedView'); });
$('cancelType').addEventListener('click', () => showLockView('lockedView'));
$('checkSentence').addEventListener('click', checkSentence);
for (const ev of ['paste', 'drop']) {
  $('typed').addEventListener(ev, (e) => {
    e.preventDefault();
    $('typeError').textContent = 'Einfügen geht hier nicht – bitte selbst tippen.';
  });
}
// Ein Satz, der auf einmal hereinkommt (z. B. per Autovervollständigung), zählt nicht.
$('typed').addEventListener('beforeinput', (e) => {
  if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop' || (e.data && e.data.length > 3)) {
    e.preventDefault();
  }
});

// ---------- Formular ----------

function buildLimitFields() {
  const wrap = $('limits');
  for (const [id, site] of Object.entries(FW.SITES)) {
    const field = document.createElement('div');
    field.className = 'field';
    field.innerHTML = `<label for="limit-${id}"></label>
      <input type="number" id="limit-${id}" min="0" max="1440" placeholder="kein Limit">`;
    field.querySelector('label').textContent = `${site.name} (Minuten pro Tag)`;
    wrap.appendChild(field);
  }
}

function fillForm(s) {
  for (const id of Object.keys(FW.SITES)) $(`limit-${id}`).value = s.limits[id] == null ? '' : s.limits[id];
  $('blockShorts').checked = s.blockShorts;
  $('extensionMinutes').value = s.extensionMinutes;
  $('extensionsPerDay').value = s.extensionsPerDay;
  $('extensionWaitSeconds').value = s.extensionWaitSeconds;
  $('showBadge').checked = s.showBadge;
}

function readForm() {
  const limits = {};
  for (const id of Object.keys(FW.SITES)) {
    const raw = $(`limit-${id}`).value.trim();
    limits[id] = raw === '' ? null : Math.max(0, parseInt(raw, 10) || 0);
  }
  return {
    limits,
    blockShorts: $('blockShorts').checked,
    extensionMinutes: Math.max(1, parseInt($('extensionMinutes').value, 10) || 1),
    extensionsPerDay: Math.max(0, parseInt($('extensionsPerDay').value, 10) || 0),
    extensionWaitSeconds: Math.max(0, parseInt($('extensionWaitSeconds').value, 10) || 0),
    showBadge: $('showBadge').checked,
  };
}

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!isUnlocked()) return;
  current = readForm();
  unlockedUntil = 0;
  await chrome.storage.local.set({ settings: current, unlockedUntil });
  fillForm(current);
  renderLock();
  $('status').textContent = 'Gespeichert und wieder gesperrt.';
  setTimeout(() => { $('status').textContent = ''; }, 4000);
});

// ---------- Statistik ----------

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
  ({ unlockedUntil = 0 } = await chrome.storage.local.get('unlockedUntil'));
  fillForm(current);
  if (isUnlocked()) showLockView('unlockedView');
  renderLock();
  setInterval(renderLock, 1000);
  renderChart();
  setInterval(renderChart, 30000);
})();
