/**
 * Sport eintragen, der nicht im Trainingsplan steht: Laufen, Rad, Yoga.
 *
 * Zwei Wege zur Kalorienzahl. Wer eine Uhr trägt, die den Puls kennt, trägt
 * ihren Wert ein — der schlägt jede Formel. Alle anderen bekommen eine
 * Schätzung aus MET-Wert, Gewicht und Dauer, und sehen sie sich ändern,
 * während sie tippen.
 */

import { el, mount, viewHead, iconButton, field, toast, emptyState, confirmAction } from '../ui.js';
import { localDateKey, formatDateKey, parseNumber } from '../nutrition.js';
import { saveActivity, deleteActivity, getActivitiesByDate } from '../store.js';
import {
  ACTIVITIES, INTENSITIES, activityById, estimateKcal, kcalOf, dayTotals, pace, ANRECHNUNG,
} from '../activities.js';

/** Laufender Entwurf. */
let entwurf = null;

export function begin(dateKey, vorhandene) {
  entwurf = vorhandene
    ? { ...vorhandene }
    : { date: dateKey || localDateKey(), type: 'laufen', minutes: null, km: null, kcal: null, intensity: 'mittel', note: '' };
}

const einsNach = (n) => String(Math.round(n * 10) / 10).replace('.', ',');

/* ---------------- Eingabe ---------------- */

export async function render(container, ctx) {
  if (!entwurf) begin(ctx.state.date);

  const kg = ctx.state.profile?.weight || null;
  const art = activityById(entwurf.type);

  const head = viewHead(entwurf.id ? 'Aktivität ändern' : 'Aktivität eintragen',
    formatDateKey(entwurf.date),
    iconButton('back', 'Zurück', () => { entwurf = null; ctx.go('today'); }));

  /* Sportart */
  const arten = el('div', { class: 'chips' },
    ...ACTIVITIES.map((a) => el('button', {
      class: 'chip', type: 'button',
      'aria-pressed': entwurf.type === a.id ? 'true' : 'false',
      onClick: () => { entwurf.type = a.id; ctx.reload(); },
    }, `${a.icon} ${a.name}`)));

  /* Dauer, Strecke, eigener Wert */
  const schaetzung = el('p', { class: 'hint' });

  const aktualisieren = () => {
    if (!kg) {
      schaetzung.textContent = 'Ohne Körpergewicht im Profil gibt es keine Schätzung.';
      return;
    }
    const wert = estimateKcal(entwurf, kg);
    const eigen = typeof entwurf.kcal === 'number' && entwurf.kcal > 0;
    const p = pace(entwurf);
    schaetzung.textContent = !entwurf.minutes
      ? 'Trag die Dauer ein, dann steht hier die Schätzung.'
      : eigen
        ? `Dein Wert: ${entwurf.kcal} kcal. Die Schätzung läge bei ${wert} kcal.`
        : `Geschätzt ${wert} kcal${p ? ` · ${p}` : ''}. Angerechnet werden `
          + `${Math.round(wert * ANRECHNUNG)} kcal.`;
  };

  const zahlFeld = (schluessel, platzhalter, nachkomma = false) => {
    const input = el('input', {
      class: 'input', type: 'text',
      inputmode: nachkomma ? 'decimal' : 'numeric',
      placeholder: platzhalter,
      value: entwurf[schluessel] != null ? String(entwurf[schluessel]).replace('.', ',') : '',
    });
    input.addEventListener('input', () => {
      const roh = input.value.trim();
      const zahl = roh === '' ? null : parseNumber(roh);
      entwurf[schluessel] = Number.isFinite(zahl) && zahl > 0 ? zahl : null;
      aktualisieren();
    });
    return input;
  };

  const intensitaet = el('div', { class: 'chips' },
    ...Object.entries(INTENSITIES).map(([wert, i]) => el('button', {
      class: 'chip', type: 'button',
      'aria-pressed': entwurf.intensity === wert ? 'true' : 'false',
      onClick: () => { entwurf.intensity = wert; ctx.reload(); },
    }, i.label)));

  const notiz = el('input', {
    class: 'input', type: 'text', placeholder: 'Strecke, Gefühl, Wetter …',
    value: entwurf.note || '',
  });
  notiz.addEventListener('input', () => { entwurf.note = notiz.value; });

  aktualisieren();

  const karte = el('div', { class: 'card stack' },
    field('Sportart', arten),
    el('div', { class: art && art.distanz ? 'grid-2' : '' },
      field('Dauer in Minuten', zahlFeld('minutes', '45')),
      art && art.distanz ? field('Strecke in km', zahlFeld('km', '8', true)) : null),
    field('Intensität', intensitaet,
      (INTENSITIES[entwurf.intensity] || INTENSITIES.mittel).hint),
    schaetzung,
    el('details', { class: 'bridge-details' },
      el('summary', { text: 'Eigenen Kalorienwert eintragen' }),
      el('p', { class: 'small mt-16',
        text: 'Wenn deine Uhr mitgezählt hat: ihr Wert kennt deinen Puls und schlägt '
          + 'jede Formel. Leer lassen, dann rechnet die App.' }),
      zahlFeld('kcal', 'kcal')),
    field('Notiz', notiz));

  const speichern = el('button', {
    class: 'btn btn-primary btn-block btn-lg mt-16', type: 'button',
    onClick: async () => {
      if (!entwurf.minutes) { toast('Trag die Dauer ein.'); return; }
      await saveActivity(entwurf);
      await ctx.refreshActivities();
      entwurf = null;
      ctx.go('today');
      toast('Aktivität gespeichert.');
    },
  }, entwurf.id ? 'Änderung speichern' : 'Eintragen');

  const loeschen = entwurf.id
    ? el('button', {
        class: 'btn btn-danger btn-block mt-16', type: 'button',
        onClick: async () => {
          if (!confirmAction('Diese Aktivität löschen?')) return;
          await deleteActivity(entwurf.id);
          await ctx.refreshActivities();
          entwurf = null;
          ctx.go('today');
          toast('Gelöscht.');
        },
      }, 'Löschen')
    : null;

  mount(container, head, el('div', null, karte, speichern, loeschen));
}

/* ---------------- Karte für die Tagesansicht ---------------- */

export function activitySection(ctx, dateKey, eintraege) {
  const kg = ctx.state.profile?.weight || null;
  const summe = dayTotals(eintraege, kg);

  const knopf = el('button', {
    class: 'btn btn-block', type: 'button',
    onClick: () => { begin(dateKey); ctx.go('activity'); },
  }, eintraege.length ? 'Weitere Aktivität' : 'Aktivität eintragen');

  if (!eintraege.length) {
    return el('div', { class: 'card stack' },
      el('h3', { class: 'card-title', text: 'Sport außer dem Training' }),
      el('p', { class: 'muted small',
        text: 'Laufen, Rad, Schwimmen, Yoga — was nicht im Trainingsplan steht. '
          + 'Der geschätzte Verbrauch hebt das Tagesziel.' }),
      knopf);
  }

  const zeilen = eintraege.map((e) => {
    const art = activityById(e.type);
    const p = pace(e);
    const eigen = typeof e.kcal === 'number' && e.kcal > 0;
    return el('button', {
      class: 'calcrow calcrow-btn', type: 'button',
      onClick: () => { begin(dateKey, e); ctx.go('activity'); },
    },
      el('span', { class: 'aktivicon', text: art ? art.icon : '✨' }),
      el('div', { class: 'grow' },
        el('div', { text: art ? art.name : e.type }),
        el('div', { class: 'muted small',
          text: [`${e.minutes} Min`, e.km ? `${einsNach(e.km)} km` : null, p,
            (INTENSITIES[e.intensity] || {}).label].filter(Boolean).join(' · ') })),
      el('div', { class: 'tabular', text: `${kcalOf(e, kg)} kcal${eigen ? '' : ' ≈'}` }));
  });

  return el('div', null,
    el('div', { class: 'card stack' },
      el('div', { class: 'row-between' },
        el('h3', { class: 'card-title', text: 'Sport außer dem Training' }),
        el('span', { class: 'muted small tabular',
          text: `${summe.minuten} Min · ${summe.kcal} kcal` })),
      el('div', { class: 'card card-flush' }, ...zeilen),
      el('p', { class: 'hint',
        text: `Davon werden ${summe.anrechnung} kcal aufs Tagesziel angerechnet. `
          + 'Nicht der volle Wert: MET-Tabellen schätzen großzügig, und ein Teil der '
          + 'Alltagsbewegung steckt schon im Aktivitätsfaktor deines Profils.' }),
      knopf));
}
