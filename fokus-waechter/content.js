// Läuft auf YouTube/Instagram: meldet jede Sekunde aktiver Nutzung und zeigt die Restzeit an.
(() => {
  const siteId = FW.siteForHost(location.hostname);
  if (!siteId) return;

  const WARN_AT = [300, 60]; // Hinweise bei 5 und 1 Minute Restzeit
  const warned = new Set();
  let badge = null;
  let collapsed = false;
  let stopped = false;
  let hideStyle = null;

  function applyHideCss(enabled) {
    if (enabled && !hideStyle) {
      hideStyle = document.createElement('style');
      hideStyle.textContent = FW.SITES[siteId].hideCss || '';
    }
    if (enabled && hideStyle && !hideStyle.isConnected && document.documentElement) {
      document.documentElement.appendChild(hideStyle);
    }
    if (!enabled && hideStyle) hideStyle.remove();
  }

  async function send(msg) {
    try {
      return await chrome.runtime.sendMessage(msg);
    } catch {
      // Erweiterung wurde neu geladen – dieses Script ist verwaist.
      stopped = true;
      return null;
    }
  }

  function isActive() {
    return document.visibilityState === 'visible' && document.hasFocus();
  }

  function createBadge() {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;';
    const root = host.attachShadow({ mode: 'closed' });
    root.innerHTML = `
      <style>
        .pill {
          font: 600 13px/1 system-ui, -apple-system, "Segoe UI", sans-serif;
          font-variant-numeric: tabular-nums;
          display: flex; align-items: center; gap: 8px;
          padding: 9px 12px; border-radius: 999px; cursor: pointer;
          background: rgba(20, 22, 28, .88); color: #f3f4f6;
          box-shadow: 0 4px 16px rgba(0,0,0,.25);
          backdrop-filter: blur(6px); user-select: none;
          transition: background .3s;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; }
        .pill.low .dot { background: #fbbf24; }
        .pill.crit { background: rgba(185, 28, 28, .92); }
        .pill.crit .dot { background: #fff; }
        .pill.paused .dot { background: #9ca3af; }
        .label { opacity: .75; font-weight: 500; }
        .pill.collapsed .label, .pill.collapsed .time { display: none; }
        .toast {
          position: absolute; right: 0; bottom: 48px; width: 260px;
          font: 500 14px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif;
          padding: 12px 14px; border-radius: 12px;
          background: #fff7ed; color: #7c2d12; border: 1px solid #fdba74;
          box-shadow: 0 6px 24px rgba(0,0,0,.2);
        }
        .toast[hidden] { display: none; }
      </style>
      <div class="toast" hidden></div>
      <div class="pill" title="Fokus-Wächter – klicken zum Ein-/Ausklappen">
        <span class="dot"></span><span class="label"></span><span class="time"></span>
      </div>`;
    const pill = root.querySelector('.pill');
    pill.addEventListener('click', () => {
      collapsed = !collapsed;
      pill.classList.toggle('collapsed', collapsed);
    });
    return {
      host,
      pill,
      label: root.querySelector('.label'),
      time: root.querySelector('.time'),
      toast: root.querySelector('.toast'),
    };
  }

  function showToast(text) {
    if (!badge) return;
    badge.toast.textContent = text;
    badge.toast.hidden = false;
    setTimeout(() => { badge.toast.hidden = true; }, 8000);
  }

  function render(status, active) {
    if (!status.showBadge) {
      if (badge) badge.host.remove();
      badge = null;
      return;
    }
    if (!badge) badge = createBadge();
    if (!badge.host.isConnected && document.documentElement) {
      document.documentElement.appendChild(badge.host);
    }
    badge.pill.classList.toggle('paused', !active);
    if (status.unlimited) {
      badge.label.textContent = `${status.name} · heute`;
      badge.time.textContent = FW.formatClock(status.usedSeconds);
      badge.pill.classList.remove('low', 'crit');
      return;
    }
    const left = status.remainingSeconds;
    badge.label.textContent = active ? `${status.name} · übrig` : `${status.name} · pausiert`;
    badge.time.textContent = FW.formatClock(left);
    badge.pill.classList.toggle('low', left <= 300 && left > 60);
    badge.pill.classList.toggle('crit', left <= 60);

    for (const t of WARN_AT) {
      if (left <= t && left > 0 && !warned.has(t) && status.limitSeconds > t) {
        warned.add(t);
        showToast(t >= 60 && t % 60 === 0
          ? `Noch ${t / 60} Minute${t === 60 ? '' : 'n'} auf ${status.name}. Zeit, langsam zum Ende zu kommen.`
          : `Gleich ist deine Zeit auf ${status.name} vorbei.`);
      }
    }
  }

  async function loop() {
    if (stopped) return;
    const active = isActive();
    const status = await send({ type: active ? 'tick' : 'status', site: siteId, url: location.href });
    if (!status || status.error || status.blocked) return;
    applyHideCss(status.blockShorts);
    render(status, active);
  }

  loop();
  const timer = setInterval(() => {
    if (stopped) clearInterval(timer);
    else loop();
  }, 1000);
})();
