// Zählt die aktive Zeit pro Seite und leitet bei erreichtem Limit auf die Sperrseite um.
importScripts('shared.js');

const MAX_TICK_SECONDS = 3; // Lücken (z. B. schlafender Service Worker) nicht voll anrechnen
const lastTick = {}; // siteId -> Zeitstempel in ms

// Alle Lese-/Schreibzugriffe nacheinander ausführen, damit sich Ticks nicht überschreiben.
let queue = Promise.resolve();
function serialized(fn) {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

function blockedUrl(siteId, reason, returnUrl) {
  const params = new URLSearchParams({ site: siteId, reason });
  if (returnUrl) params.set('return', returnUrl);
  return chrome.runtime.getURL('blocked.html?' + params);
}

function pruneHistory(usage) {
  const keys = Object.keys(usage).sort();
  while (keys.length > FW.HISTORY_DAYS) delete usage[keys.shift()];
}

async function addTime(siteId) {
  const now = Date.now();
  const prev = lastTick[siteId];
  // Mehrere Tabs derselben Seite zählen nicht doppelt.
  if (prev && now - prev < 900) return;
  const delta = prev ? Math.min((now - prev) / 1000, MAX_TICK_SECONDS) : 1;
  lastTick[siteId] = now;

  const usage = await FW.getUsage();
  const key = FW.dayKey();
  usage[key] = usage[key] || {};
  const day = FW.dayEntry(usage, siteId, key);
  day.seconds += delta;
  usage[key][siteId] = day;
  pruneHistory(usage);
  await chrome.storage.local.set({ usage });
}

async function check(msg, sender, counting) {
  const siteId = msg.site;
  if (!FW.SITES[siteId]) return null;
  if (counting) await addTime(siteId);
  else delete lastTick[siteId];

  const settings = await FW.getSettings();
  const status = FW.computeStatus(settings, await FW.getUsage(), siteId);
  const tabId = sender.tab && sender.tab.id;

  let reason = null;
  if (settings.blockShorts && FW.isShortsUrl(siteId, msg.url)) reason = 'shorts';
  else if (!status.unlimited && status.remainingSeconds <= 0) reason = 'limit';

  if (reason && tabId != null) {
    delete lastTick[siteId];
    await chrome.tabs.update(tabId, { url: blockedUrl(siteId, reason, msg.url) });
  }
  return { ...status, blocked: reason };
}

async function extend(siteId) {
  const settings = await FW.getSettings();
  const usage = await FW.getUsage();
  const key = FW.dayKey();
  const day = FW.dayEntry(usage, siteId, key);
  if (settings.limits[siteId] == null) return { ok: false, error: 'Für diese Seite gibt es kein Limit.' };
  if (day.extensions >= settings.extensionsPerDay) {
    return { ok: false, error: 'Für heute sind keine Verlängerungen mehr übrig.' };
  }
  day.extensions += 1;
  // Bonus ab dem aktuellen Verbrauch rechnen, damit es wirklich X Minuten ab jetzt sind.
  const base = settings.limits[siteId] * 60 + day.bonusSeconds;
  day.bonusSeconds += Math.max(0, day.seconds - base) + settings.extensionMinutes * 60;
  usage[key] = usage[key] || {};
  usage[key][siteId] = day;
  await chrome.storage.local.set({ usage });
  return { ok: true };
}

async function allStatus() {
  const settings = await FW.getSettings();
  const usage = await FW.getUsage();
  return Object.keys(FW.SITES).map((id) => FW.computeStatus(settings, usage, id));
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  let job;
  switch (msg && msg.type) {
    case 'tick':
      job = serialized(() => check(msg, sender, true));
      break;
    case 'status':
      job = serialized(() => check(msg, sender, false));
      break;
    case 'extend':
      job = serialized(() => extend(msg.site));
      break;
    case 'allStatus':
      job = serialized(allStatus);
      break;
    default:
      return false;
  }
  job.then(sendResponse, (err) => sendResponse({ error: String(err) }));
  return true;
});

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    // Beim ersten Einrichten sind die Einstellungen eine Weile ohne Test änderbar.
    await chrome.storage.local.set({
      settings: FW.DEFAULT_SETTINGS,
      unlockedUntil: Date.now() + FW.FIRST_SETUP_SECONDS * 1000,
    });
    chrome.runtime.openOptionsPage();
  }
});
