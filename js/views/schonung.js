/**
 * Schonung: ein Gelenk vorübergehend aus dem Plan nehmen.
 *
 * Im Fragebogen gibt es das schon als Dauerzustand — wer chronisch Probleme mit
 * dem Knie hat, bekommt gar nicht erst Kniebeugen eingeplant. Was fehlte, war
 * der viel häufigere Fall: **etwas tut gerade weh und in zwei Wochen wieder
 * nicht.**
 *
 * Deshalb ist eine Schonung ausdrücklich nicht dasselbe wie eine Änderung im
 * Fragebogen:
 *
 * - Sie **baut den Plan nicht neu.** Ein neuer Plan würde die laufende
 *   Blockwoche und alle Variantenleitern mitreißen — für etwas Vorübergehendes
 *   ein zu hoher Preis. Getauscht wird stattdessen beim Anzeigen, wie bei der
 *   Zimmer-Variante.
 * - Sie **fragt nach.** Nach zwei Wochen will die App wissen, ob es noch gilt.
 *   Eine Einschränkung, die man einmal setzt und dann vergisst, macht den Plan
 *   still schlechter.
 * - Sie **nennt den Ausweg.** Übungen herauszunehmen ist die halbe Antwort;
 *   beim Handgelenk fällt sonst ohne Geräte jedes Drücken weg.
 */

import { el, toast } from '../ui.js';
import { setSetting } from '../store.js';
import { localDateKey, formatDateKey } from '../nutrition.js';
import { LIMIT_LABEL, LIMIT_AUSWEG, SCHONUNG_ARZT } from '../training.js';

/** Nach so vielen Tagen fragt die App, ob die Schonung noch gilt. */
export const NACHFRAGE_TAGE = 14;

/** Die reinen Kennungen — das ist, was `isAvailable` braucht. */
export function activeLimits(schonung) {
  return (schonung || []).map((s) => s.id);
}

export function tageSeit(seit, heute = localDateKey()) {
  if (!seit) return 0;
  return Math.max(0, Math.round(
    (new Date(`${heute}T12:00:00`) - new Date(`${seit}T12:00:00`)) / 86400000
  ));
}

/**
 * Karte für die Trainingsansicht.
 *
 * Zugeklappt, solange nichts geschont wird — sonst stünde auf jedem
 * Trainingstag eine Frage nach Schmerzen, die man meistens nicht hat.
 * Ist etwas aktiv, steht es offen da: Man soll sehen, warum der Plan heute
 * anders aussieht.
 */
export function schonungsKarte(ctx, { getauscht = [] } = {}) {
  const aktiv = ctx.settings.schonung || [];
  const heute = localDateKey();

  const speichern = async (neu) => {
    await setSetting('schonung', neu);
    await ctx.refreshSettings();
    ctx.reload();
  };

  const umschalten = async (id) => {
    const drin = aktiv.some((s) => s.id === id);
    const neu = drin
      ? aktiv.filter((s) => s.id !== id)
      : [...aktiv, { id, seit: heute }];
    await speichern(neu);
    toast(drin ? `${LIMIT_LABEL[id]} wieder dabei.` : `${LIMIT_LABEL[id]} wird geschont.`);
  };

  const chips = el('div', { class: 'chips' },
    ...Object.entries(LIMIT_LABEL).map(([id, label]) => el('button', {
      class: 'chip', type: 'button',
      'aria-pressed': aktiv.some((s) => s.id === id) ? 'true' : 'false',
      onClick: () => umschalten(id),
    }, label)));

  if (!aktiv.length) {
    return el('details', { class: 'card klappkarte schonwahl' },
      el('summary', null,
        el('span', { class: 'grow', text: 'Tut etwas weh?' }),
        el('span', { class: 'muted small', text: 'schonen' })),
      el('div', { class: 'stack mt-16' },
        el('p', { class: 'muted small',
          text: 'Ein Gelenk vorübergehend aus dem Plan nehmen. Passende Übungen werden '
            + 'gegen andere getauscht, die Blockwoche und deine Fortschritte bleiben — '
            + 'anders als bei einer Änderung im Fragebogen, die den Plan neu baut.' }),
        chips,
        el('p', { class: 'hint', text: SCHONUNG_ARZT })));
  }

  // Aktiv: offen und mit Begründung, warum der Plan heute anders aussieht.
  const zeilen = aktiv.map((s) => {
    const tage = tageSeit(s.seit, heute);
    const faellig = tage >= NACHFRAGE_TAGE;
    return el('div', { class: 'schonzeile' },
      el('div', { class: 'row-between' },
        el('div', { class: 'grow' },
          el('div', { class: 'schonname', text: LIMIT_LABEL[s.id] || s.id }),
          el('div', { class: 'muted small',
            text: tage === 0 ? 'seit heute'
              : `seit ${tage} ${tage === 1 ? 'Tag' : 'Tagen'} · ${formatDateKey(s.seit)}` })),
        el('button', {
          class: 'btn btn-sm', type: 'button', onClick: () => umschalten(s.id),
        }, 'Beenden')),
      LIMIT_AUSWEG[s.id]
        ? el('p', { class: 'schonausweg', text: LIMIT_AUSWEG[s.id] })
        : null,
      faellig
        ? el('p', { class: 'hint',
            text: `Läuft seit ${tage} Tagen. Wenn es besser ist, beende die Schonung — `
              + 'sonst trainierst du länger eingeschränkt als nötig. Wenn nicht, ist das '
              + 'der Punkt, an dem jemand draufschauen sollte.' })
        : null);
  });

  // Was heute konkret getauscht oder weggefallen ist — sonst steht die
  // Schonung abstrakt da und der Plan sieht grundlos anders aus.
  const wegfall = getauscht.filter((g) => !g.zu);
  const ersetzt = getauscht.filter((g) => g.zu);

  return el('div', { class: 'card stack schonkarte' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: 'Geschont' }),
      el('span', { class: 'pill pill-kcal',
        text: aktiv.map((s) => LIMIT_LABEL[s.id]).join(' · ') })),
    ...zeilen,
    ersetzt.length
      ? el('p', { class: 'muted small',
          text: `Heute getauscht: ${ersetzt.map((g) => `${g.von} → ${g.zu}`).join(', ')}.` })
      : null,
    wegfall.length
      ? el('p', { class: 'hint',
          text: `Ohne Ersatz weggefallen: ${wegfall.map((g) => g.von).join(', ')}. `
            + 'Mit deiner Ausrüstung gibt es dafür nichts Schonendes — der Ausweg oben '
            + 'ist hier die eigentliche Antwort.' })
      : null,
    // Die Auswahl bleibt sichtbar statt hinter einem weiteren Aufklapper: Wer
    // gerade eine Schonung gesetzt hat, setzt oft direkt die zweite — und mit
    // denselben Chips beendet man sie auch wieder.
    el('div', { class: 'suppzeit', text: 'Ändern' }),
    chips);
}
