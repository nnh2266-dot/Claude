// Gemeinsame Konstanten und Helfer für Hintergrund, Content-Script und Seiten.
const FW = (() => {
  const SITES = {
    youtube: {
      name: 'YouTube',
      hosts: ['youtube.com'],
      home: 'https://www.youtube.com/',
      shorts: [/^\/shorts(\/|$)/],
      shortsName: 'Shorts',
    },
    instagram: {
      name: 'Instagram',
      hosts: ['instagram.com'],
      home: 'https://www.instagram.com/',
      shorts: [/^\/reels?(\/|$)/],
      shortsName: 'Reels',
    },
  };

  const DEFAULT_SETTINGS = {
    limits: { youtube: 30, instagram: 15 }, // Minuten pro Tag, 0 = komplett gesperrt
    blockShorts: true,
    extensionMinutes: 5,
    extensionsPerDay: 1,
    extensionWaitSeconds: 30,
    showBadge: true,
  };

  const HISTORY_DAYS = 30;

  function siteForHost(hostname) {
    for (const [id, site] of Object.entries(SITES)) {
      if (site.hosts.some((h) => hostname === h || hostname.endsWith('.' + h))) return id;
    }
    return null;
  }

  function isShortsUrl(siteId, url) {
    try {
      const path = new URL(url).pathname;
      return SITES[siteId].shorts.some((re) => re.test(path));
    } catch {
      return false;
    }
  }

  function dayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  async function getSettings() {
    const { settings } = await chrome.storage.local.get('settings');
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      limits: { ...DEFAULT_SETTINGS.limits, ...(settings && settings.limits) },
    };
  }

  async function getUsage() {
    const { usage } = await chrome.storage.local.get('usage');
    return usage || {};
  }

  function emptyDay() {
    return { seconds: 0, bonusSeconds: 0, extensions: 0 };
  }

  function dayEntry(usage, siteId, key = dayKey()) {
    return { ...emptyDay(), ...(usage[key] && usage[key][siteId]) };
  }

  // Berechnet den heutigen Stand einer Seite.
  function computeStatus(settings, usage, siteId) {
    const day = dayEntry(usage, siteId);
    const limitSeconds = settings.limits[siteId] * 60 + day.bonusSeconds;
    return {
      site: siteId,
      name: SITES[siteId].name,
      usedSeconds: Math.floor(day.seconds),
      limitSeconds,
      remainingSeconds: Math.max(0, Math.floor(limitSeconds - day.seconds)),
      extensionsLeft: Math.max(0, settings.extensionsPerDay - day.extensions),
      extensionMinutes: settings.extensionMinutes,
      extensionWaitSeconds: settings.extensionWaitSeconds,
      blockShorts: settings.blockShorts,
      showBadge: settings.showBadge,
    };
  }

  function formatClock(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const mm = h ? String(m).padStart(2, '0') : String(m);
    return (h ? h + ':' : '') + mm + ':' + String(sec).padStart(2, '0');
  }

  function formatMinutes(totalSeconds) {
    const min = Math.round(totalSeconds / 60);
    if (min < 60) return `${min} Min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h} Std ${m} Min` : `${h} Std`;
  }

  return {
    SITES,
    DEFAULT_SETTINGS,
    HISTORY_DAYS,
    siteForHost,
    isShortsUrl,
    dayKey,
    getSettings,
    getUsage,
    emptyDay,
    dayEntry,
    computeStatus,
    formatClock,
    formatMinutes,
  };
})();
