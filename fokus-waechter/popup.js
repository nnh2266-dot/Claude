function siteRow(s) {
  const el = document.createElement('div');
  el.className = 'site';
  const ratio = s.limitSeconds ? Math.min(1, s.usedSeconds / s.limitSeconds) : 1;
  const barClass = s.remainingSeconds === 0 ? 'over' : s.remainingSeconds <= 300 ? 'low' : '';
  const right = s.limitSeconds === 0
    ? 'gesperrt'
    : `${FW.formatMinutes(s.usedSeconds)} / ${FW.formatMinutes(s.limitSeconds)}`;
  const sub = s.limitSeconds === 0
    ? 'Komplett gesperrt'
    : s.remainingSeconds > 0
      ? `Noch ${FW.formatClock(s.remainingSeconds)} übrig`
      : 'Für heute aufgebraucht';
  el.innerHTML = `
    <div class="row"><strong></strong><span class="muted num"></span></div>
    <div class="bar ${barClass}"><span style="width:${(ratio * 100).toFixed(1)}%"></span></div>
    <div class="sub muted num"></div>`;
  el.querySelector('strong').textContent = s.name;
  el.querySelector('.row span').textContent = right;
  el.querySelector('.sub').textContent = sub;
  return el;
}

async function render() {
  const all = await chrome.runtime.sendMessage({ type: 'allStatus' });
  document.getElementById('sites').replaceChildren(...all.map(siteRow));
}

document.getElementById('options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

render();
setInterval(render, 1000);
