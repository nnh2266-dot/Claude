// Sperrseite: erscheint bei erreichtem Tageslimit oder bei Shorts/Reels.
const IDEAS = [
  'Ein Glas Wasser trinken und kurz aus dem Fenster schauen',
  'Fünf Minuten an die frische Luft gehen',
  'Die eine Aufgabe erledigen, die du gerade vor dir herschiebst',
  'Jemandem schreiben, mit dem du lange nicht gesprochen hast',
  'Zehn Seiten in einem Buch lesen',
  'Ein paar Dehnübungen oder zehn Kniebeugen machen',
  'Den Schreibtisch oder eine Ecke im Zimmer aufräumen',
  'Drei Dinge aufschreiben, die heute gut gelaufen sind',
  'Ein Lied bewusst anhören – ohne nebenbei zu scrollen',
];

const params = new URLSearchParams(location.search);
const siteId = FW.SITES[params.get('site')] ? params.get('site') : 'youtube';
const site = FW.SITES[siteId];
const reason = params.get('reason') === 'shorts' ? 'shorts' : 'limit';

// Nur zu Adressen der gesperrten Seite zurückkehren.
function safeReturnUrl() {
  try {
    const url = new URL(params.get('return'));
    if (/^https?:$/.test(url.protocol) && FW.siteForHost(url.hostname) === siteId) return url.href;
  } catch {}
  return site.home;
}

const $ = (id) => document.getElementById(id);

function pickIdeas(n) {
  const pool = [...IDEAS];
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}

function startExtendCountdown(status) {
  const btn = $('extend');
  btn.hidden = false;
  btn.disabled = true;
  let left = status.extensionWaitSeconds;
  const label = () => `Noch ${status.extensionMinutes} Min (warte ${left} s)`;
  btn.textContent = label();
  $('note').textContent = 'Atme kurz durch. Brauchst du das jetzt wirklich?';

  const timer = setInterval(() => {
    // Die Wartezeit läuft nur, solange du die Seite auch ansiehst.
    if (document.visibilityState !== 'visible') return;
    left -= 1;
    if (left > 0) {
      btn.textContent = label();
      return;
    }
    clearInterval(timer);
    btn.disabled = false;
    btn.textContent = `Noch ${status.extensionMinutes} Minuten`;
    const rest = status.extensionsLeft - 1;
    $('note').textContent = rest > 0
      ? `Danach hast du heute noch ${rest} Verlängerung${rest === 1 ? '' : 'en'}.`
      : 'Das ist deine letzte Verlängerung für heute.';
  }, 1000);

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    const res = await chrome.runtime.sendMessage({ type: 'extend', site: siteId });
    if (res && res.ok) location.replace(safeReturnUrl());
    else $('note').textContent = (res && res.error) || 'Verlängerung nicht möglich.';
  });
}

async function init() {
  const all = await chrome.runtime.sendMessage({ type: 'allStatus' });
  const status = all.find((s) => s.site === siteId);

  $('used').textContent = FW.formatMinutes(status.usedSeconds);
  $('limit').textContent = status.unlimited ? 'kein Limit' : FW.formatMinutes(status.limitSeconds);
  $('ideas').replaceChildren(...pickIdeas(3).map((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    return li;
  }));

  if (reason === 'shorts') {
    document.title = `${site.shortsName} gesperrt – Fokus-Wächter`;
    $('title').textContent = `${site.shortsName} sind gesperrt`;
    $('lead').textContent = `Endloses Wischen durch ${site.shortsName} frisst am meisten Zeit. `
      + 'Wenn du etwas Bestimmtes suchst, geh direkt dorthin.';
    if (status.unlimited || status.remainingSeconds > 0) {
      $('back').hidden = false;
      $('back').textContent = `Zur ${site.name}-Startseite`;
      $('back').addEventListener('click', () => location.replace(site.home));
    }
    return;
  }

  if (status.unlimited || status.remainingSeconds > 0) {
    // Limit wurde inzwischen erhöht oder verlängert.
    location.replace(safeReturnUrl());
    return;
  }

  document.title = `${site.name} für heute vorbei – Fokus-Wächter`;
  $('lead').textContent = status.limitSeconds === 0
    ? `${site.name} ist bei dir komplett gesperrt.`
    : `Dein Tageslimit für ${site.name} ist aufgebraucht. Morgen geht es wieder.`;

  if (status.extensionsLeft > 0 && status.limitSeconds > 0) startExtendCountdown(status);
  else if (status.limitSeconds > 0) $('note').textContent = 'Für heute sind keine Verlängerungen mehr übrig.';
}

$('close').addEventListener('click', async () => {
  const tab = await chrome.tabs.getCurrent();
  if (tab) chrome.tabs.remove(tab.id);
  else window.close();
});

init();
