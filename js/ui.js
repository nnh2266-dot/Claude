/**
 * Kleine DOM-Helfer. Bewusst minimal statt einer Framework-Abhängigkeit,
 * damit die App ohne Build-Schritt auskommt.
 */

/**
 * el('div', { class: 'card' }, 'Text', el('b', null, 'fett'))
 * Attribute: 'class', 'text', 'html', beliebige Attribute, on* für Events,
 * style als Objekt.
 */
export function el(tag, props, ...children) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;

    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }

  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }

  return node;
}

/** SVG-Elemente brauchen den Namespace. */
export function svg(tag, props, ...children) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      node.setAttribute(key, value);
    }
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Leert einen Container und füllt ihn neu. */
export function mount(container, ...children) {
  container.replaceChildren(...children.flat(Infinity).filter(Boolean));
}

/** Kurze Rückmeldung am unteren Bildschirmrand. */
export function toast(message, kind = '') {
  const host = document.getElementById('toasts');
  if (!host) return;
  const node = el('div', { class: `toast${kind ? ' ' + kind : ''}`, text: message });
  host.append(node);
  setTimeout(() => {
    node.style.transition = 'opacity .25s';
    node.style.opacity = '0';
    setTimeout(() => node.remove(), 260);
  }, kind === 'err' ? 4200 : 2400);
}

/** Bestätigung für alles, was Daten löscht. */
export function confirmAction(message) {
  return window.confirm(message);
}

/** Kopfzeile einer Ansicht. */
export function viewHead(title, subtitle, ...actions) {
  return el(
    'header',
    { class: 'view-head' },
    el('h1', null, title, subtitle ? el('span', { class: 'sub', text: subtitle }) : null),
    ...actions
  );
}

const ICONS = {
  back:    'M15 5l-7 7 7 7',
  prev:    'M14.5 5.5 8 12l6.5 6.5',
  next:    'M9.5 5.5 16 12l-6.5 6.5',
  plus:    'M12 5.5v13M5.5 12h13',
  trash:   'M5 7h14M10 7V5.5h4V7M6.5 7l.8 12h9.4l.8-12',
  close:   'M6 6l12 12M18 6L6 18',
  star:    'm12 5.6 1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z',
  refresh: 'M19 12a7 7 0 1 1-2.1-5M19 4.5V10h-5.5',
};

/** Runder Icon-Button mit einem der Pfade aus ICONS. */
export function iconButton(icon, label, onClick, extraProps = {}) {
  return el(
    'button',
    {
      class: 'icon-btn',
      type: 'button',
      'aria-label': label,
      title: label,
      onClick,
      ...extraProps,
    },
    svg(
      'svg',
      { viewBox: '0 0 24 24', 'aria-hidden': 'true' },
      svg('path', {
        d: ICONS[icon] || icon,
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.9',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      })
    )
  );
}

/** Leerzustand mit Titel und Erklärtext. */
export function emptyState(title, description) {
  return el('div', { class: 'empty' }, el('strong', { text: title }), description);
}

/** Beschriftetes Eingabefeld. */
export function field(label, input, hint) {
  return el(
    'div',
    { class: 'field' },
    el('label', { text: label, for: input.id || null }),
    input,
    hint ? el('p', { class: 'hint', text: hint }) : null
  );
}
