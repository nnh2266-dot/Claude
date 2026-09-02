/**
 * Nahrungsergänzung: Karte zum Abhaken und Einrichtungsansicht.
 *
 * Die Karte zeigt nur, was ansteht — nicht den ganzen Katalog. Wer vier Mittel
 * nimmt, will vier Häkchen sehen, nicht neun Vorschläge.
 *
 * In der Einrichtung steht zu jedem Mittel, wofür es belegt ist und wie gut.
 * Das ist Absicht und kostet Platz: Wer sich für Magnesium entscheidet, soll
 * dabei lesen, dass der Beleg dünn ist. Eine App, die alles gleich aussehen
 * lässt, verkauft mit.
 */

import { el, mount, viewHead, toast, emptyState } from '../ui.js';
import { setSupplementTaken, setSupplementList } from '../store.js';
import { shiftDateKey } from '../nutrition.js';
import {
  SUPPLEMENTS, ZEITEN, BELEG_LABEL, resolve, byTime, dayStatus, streak, supplementById,
} from '../supplements.js';

/* ---------------- Karte auf der Tagesansicht ---------------- */

export function supplementSection(ctx, dateKey) {
  const liste = resolve(ctx.state.suppListe || []);

  if (!liste.length) {
    // Kein Dauerhinweis: Wer nichts nimmt, soll die Karte auch nicht sehen.
    // Sie taucht nur einmal als Angebot auf und verschwindet nach dem Ablehnen.
    if (localStorage.getItem('supps-nein') === '1') return null;
    return el('div', { class: 'card stack' },
      el('h3', { class: 'card-title', text: 'Nimmst du etwas?' }),
      el('p', { class: 'small',
        text: 'Kreatin, Vitamin D, Eiweißpulver — wenn du regelmäßig etwas nimmst, kannst du '
          + 'es hier abhaken. Zu jedem Mittel steht dabei, wie gut es belegt ist, und die App '
          + 'weiß dann auch, warum die Waage nach Kreatin plötzlich anders aussieht.' }),
      el('div', { class: 'row' },
        el('button', { class: 'btn btn-primary grow', type: 'button',
          onClick: () => ctx.go('supps') }, 'Einrichten'),
        el('button', { class: 'btn', type: 'button',
          onClick: () => {
            try { localStorage.setItem('supps-nein', '1'); } catch { /* egal */ }
            ctx.reload();
            toast('Ausgeblendet. In den Einstellungen bleibt es erreichbar.');
          } }, 'Nehme nichts')));
  }

  const eintrag = (ctx.state.supps || []).find((s) => s.date === dateKey);
  const stand = dayStatus(liste, eintrag);
  const serie = streak(liste, ctx.state.supps || [], dateKey, shiftDateKey);

  const umschalten = async (id, an) => {
    await setSupplementTaken(dateKey, id, an);
    await ctx.refreshDaily();
    ctx.reload();
  };

  const gruppen = byTime(liste).map((g) => el('div', { class: 'suppgruppe' },
    el('div', { class: 'suppzeit', text: g.label }),
    ...g.mittel.map((s) => {
      const an = Boolean(eintrag?.taken?.[s.id]);
      return el('button', {
        class: `suppzeile${an ? ' an' : ''}`, type: 'button',
        'aria-pressed': an ? 'true' : 'false',
        onClick: () => umschalten(s.id, !an),
      },
        el('span', { class: 'supphaken', 'aria-hidden': 'true', text: an ? '✓' : '' }),
        el('span', { class: 'grow' },
          el('span', { class: 'suppname', text: s.name }),
          s.menge ? el('span', { class: 'suppmenge', text: s.menge }) : null));
    })));

  return el('div', { class: 'card stack' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: 'Nahrungsergänzung' }),
      el('span', { class: `pill ${stand.vollstaendig ? 'pill-ok' : 'pill-kcal'} tabular`,
        text: `${stand.genommen}/${stand.gesamt}` })),
    serie >= 3
      ? el('p', { class: 'hint', text: `${serie} Tage in Folge vollständig.` })
      : null,
    ...gruppen,
    el('button', { class: 'btn btn-ghost btn-sm', type: 'button',
      onClick: () => ctx.go('supps') }, 'Liste ändern'));
}

/* ---------------- Einrichtung ---------------- */

const belegPill = (beleg) => el('span', {
  class: `pill supppill supp-${beleg}`,
  text: BELEG_LABEL[beleg] || beleg,
});

export async function render(container, ctx) {
  const gewaehlt = [...(ctx.state.suppListe || [])];
  const istDrin = (id) => gewaehlt.some((g) => g.id === id);

  const speichern = async (neu) => {
    await setSupplementList(neu);
    await ctx.refreshDaily();
    ctx.reload();
  };

  const head = viewHead(
    'Nahrungsergänzung',
    gewaehlt.length ? `${gewaehlt.length} eingerichtet` : 'noch nichts ausgewählt'
  );

  const body = [];

  body.push(el('div', { class: 'card stack' },
    el('p', { class: 'small' },
      el('strong', { text: 'Was hier nicht passiert: dosieren. ' }),
      'Zu jedem Mittel steht die in der Literatur übliche Größenordnung und wie gut die '
      + 'Wirkung belegt ist. Ob du es brauchst und wie viel, hängt an Blutwerten, deiner '
      + 'Ernährung und Vorerkrankungen — das weiß diese App nicht und soll es auch nicht '
      + 'raten.'),
    el('p', { class: 'muted small',
      text: 'Drei der Mittel greifen in andere Zahlen der App ein: Kreatin verschiebt das '
        + 'Gewicht, Koffein den Schlaf, Eiweißpulver das Eiweißziel. Wenn du sie hier '
        + 'einträgst, weiß die App das und rechnet nicht dagegen.' })));

  /* Ausgewählte zuerst, mit Zeitpunkt */
  if (gewaehlt.length) {
    body.push(el('h2', { class: 'section-title', text: 'Deine Liste' }));
    body.push(el('div', { class: 'card card-flush' },
      ...resolve(gewaehlt).map((s) => el('div', { class: 'calcrow' },
        el('div', { class: 'grow' },
          el('div', { text: s.name }),
          el('div', { class: 'muted small', text: s.menge || 'ohne Mengenangabe' })),
        el('select', {
          class: 'input suppwahl',
          'aria-label': `Zeitpunkt für ${s.name}`,
          onChange: (e) => speichern(gewaehlt.map((g) =>
            (g.id === s.id ? { ...g, zeit: e.target.value } : g))),
        }, ...Object.entries(ZEITEN).map(([id, z]) => el('option', {
          value: id, selected: s.zeit === id ? '' : null,
        }, z.label))),
        el('button', {
          class: 'btn btn-ghost btn-sm', type: 'button',
          onClick: () => speichern(gewaehlt.filter((g) => g.id !== s.id)),
        }, 'Raus')))));
  }

  /* Katalog */
  body.push(el('h2', { class: 'section-title', text: 'Zur Auswahl' }));

  const offen = SUPPLEMENTS.filter((s) => !istDrin(s.id));
  if (!offen.length) {
    body.push(el('div', { class: 'card' },
      emptyState('Alles ausgewählt', 'Mehr kennt die App nicht. Eigene Mittel kannst du '
        + 'unten hinzufügen.')));
  } else {
    body.push(el('div', { class: 'stack' }, ...offen.map((s) => el('div', { class: 'card stack suppkarte' },
      el('div', { class: 'row-between' },
        el('h3', { class: 'card-title', text: s.name }),
        belegPill(s.beleg)),
      el('p', { class: 'small', text: s.wofuer }),
      el('p', { class: 'muted small', text: s.hinweis }),
      el('div', { class: 'row-between' },
        el('span', { class: 'muted small tabular', text: `Üblich: ${s.menge}` }),
        el('button', {
          class: 'btn btn-sm', type: 'button',
          onClick: () => speichern([...gewaehlt, { id: s.id, zeit: s.zeit }]),
        }, 'Zur Liste'))))));
  }

  /* Eigenes */
  const nameFeld = el('input', { class: 'input', type: 'text', placeholder: 'Name' });
  const mengeFeld = el('input', { class: 'input', type: 'text', placeholder: 'Menge, z. B. 1 Kapsel' });

  body.push(el('h2', { class: 'section-title', text: 'Eigenes Mittel' }));
  body.push(el('div', { class: 'card stack' },
    el('p', { class: 'muted small',
      text: 'Was hier nicht steht, kannst du selbst eintragen. Zur Wirkung sagt die App '
        + 'dann nichts — sie kennt es ja nicht.' }),
    el('div', { class: 'grid-2' }, nameFeld, mengeFeld),
    el('button', { class: 'btn btn-block', type: 'button',
      onClick: () => {
        const name = nameFeld.value.trim();
        if (!name) { toast('Ohne Namen geht es nicht.', 'err'); return; }
        // Eigene Kennung, damit sie nie mit einem Katalogeintrag kollidiert.
        const id = `eigen-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        if (istDrin(id) || supplementById(id)) { toast('Steht schon auf der Liste.'); return; }
        speichern([...gewaehlt, { id, name, menge: mengeFeld.value.trim(), zeit: 'egal' }]);
        toast(`${name} hinzugefügt.`);
      } }, 'Hinzufügen')));

  body.push(el('div', { class: 'mt-24' },
    el('button', { class: 'btn btn-block', type: 'button',
      onClick: () => ctx.go('today') }, 'Zurück')));

  mount(container, head, el('div', null, ...body));
}
