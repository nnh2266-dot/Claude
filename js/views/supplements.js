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
import { setSupplementTaken, setSupplementList, getMealsInRange } from '../store.js';
import { localDateKey, shiftDateKey } from '../nutrition.js';
import { summarise as schlafSchnitt, SOLL_MIN } from '../sleep.js';
import {
  SUPPLEMENTS, ZEITEN, BELEG_LABEL, resolve, byTime, dayStatus, streak, supplementById,
  sortForDiet, hasDietNote, empfehlung, TOPF_LABEL,
} from '../supplements.js';
import { KOSTFORMEN } from '../suggest.js';

/* ---------------- Karte auf der Tagesansicht ---------------- */

export function supplementSection(ctx, dateKey) {
  const kost = ctx.state.profile?.ernaehrung || 'misch';
  const liste = resolve(ctx.state.suppListe || [], kost);

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

/* ---------------- Empfehlung ---------------- */

/**
 * Eiweißschnitt der letzten sieben Tage.
 *
 * Er entscheidet, ob Eiweißpulver empfohlen wird oder ausdrücklich nicht — und
 * das ist der Punkt, an dem eine Empfehlung aus eigenen Daten kommt statt aus
 * einer Tabelle. Gerechnet wird nur über Tage, an denen überhaupt etwas
 * eingetragen ist; ein leerer Tag ist kein Tag mit null Gramm Eiweiß.
 */
async function proteinSchnittLetzteTage(ctx) {
  const heute = localDateKey();
  const mahlzeiten = await getMealsInRange(shiftDateKey(heute, -7), heute);
  if (!mahlzeiten.length) return null;

  const jeTag = new Map();
  for (const m of mahlzeiten) {
    jeTag.set(m.date, (jeTag.get(m.date) || 0) + (m.totals?.protein || 0));
  }
  if (jeTag.size < 3) return null;
  return [...jeTag.values()].reduce((a, b) => a + b, 0) / jeTag.size;
}

/** Liegt der Schlafschnitt unter der Empfehlung? Steuert den Koffein-Rat. */
function kurzeNaechte(ctx) {
  const z = schlafSchnitt(ctx.state.sleep || []);
  return Boolean(z.naechte >= 3 && z.schnitt !== null && z.schnitt < SOLL_MIN);
}

function empfehlungsBlock(rat, gewaehlt, speichern, ctx) {
  const drin = (id) => gewaehlt.some((g) => g.id === id);
  const bloecke = [];

  for (const topf of ['klar', 'pruefen', 'spar']) {
    const teil = rat.filter((r) => r.topf === topf);
    if (!teil.length) continue;

    bloecke.push(el('div', { class: `ratblock rat-${topf}` },
      el('div', { class: 'ratkopf' },
        el('h3', { class: 'card-title', text: TOPF_LABEL[topf].titel }),
        el('span', { class: 'muted small tabular', text: `${teil.length}` })),
      ...teil.map((r) => el('div', { class: 'ratzeile' },
        el('div', { class: 'grow' },
          el('div', { class: 'row-between' },
            el('span', { class: 'ratname', text: r.name }),
            el('span', { class: `pill supppill supp-${r.beleg}`, text: BELEG_LABEL[r.beleg] })),
          el('p', { class: 'ratgrund', text: r.grund }),
          topf !== 'spar'
            ? el('p', { class: 'muted small tabular', text: `Üblich: ${r.menge}` })
            : null),
        // „Spar dir das" bekommt keinen Knopf. Wer es trotzdem will, findet es
        // unten im Katalog — aber nicht mit einem Tippen aus der Absage heraus.
        topf !== 'spar' && !drin(r.id)
          ? el('button', {
              class: 'btn btn-sm', type: 'button',
              onClick: () => speichern([...gewaehlt,
                { id: r.id, zeit: supplementById(r.id)?.zeit || 'egal' }]),
            }, 'Aufnehmen')
          : drin(r.id)
            ? el('span', { class: 'pill pill-ok', text: 'auf der Liste' })
            : null))));
  }

  return el('div', { class: 'card stack' },
    el('p', { class: 'small' },
      'Gerechnet aus dem, was in der App steht: Ernährungsform, Trainingstage, dein '
      + 'Eiweißschnitt der letzten Woche und die Jahreszeit. ',
      el('strong', { text: 'Was an einem Blutwert hängt, steht unter „Kommt darauf an" — '
        + 'da rät die App bewusst nicht.' })),
    ...bloecke);
}

/* ---------------- Einrichtung ---------------- */

const belegPill = (beleg) => el('span', {
  class: `pill supppill supp-${beleg}`,
  text: BELEG_LABEL[beleg] || beleg,
});

export async function render(container, ctx) {
  const gewaehlt = [...(ctx.state.suppListe || [])];
  const istDrin = (id) => gewaehlt.some((g) => g.id === id);
  const kost = ctx.state.profile?.ernaehrung || 'misch';

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
        + 'einträgst, weiß die App das und rechnet nicht dagegen.' }),
    kost !== 'misch'
      ? el('p', { class: 'hint' },
          el('strong', { text: `${KOSTFORMEN[kost].label}: ` }),
          'Bei vier Einträgen ändert das etwas Wesentliches — sie stehen oben und tragen '
          + 'einen eigenen Absatz. Umstellen geht unter „Mehr → Ernährungsform".')
      : null));

  /* Ausgewählte zuerst, mit Zeitpunkt */
  if (gewaehlt.length) {
    body.push(el('h2', { class: 'section-title', text: 'Deine Liste' }));
    body.push(el('div', { class: 'card card-flush' },
      ...resolve(gewaehlt, kost).map((s) => el('div', { class: 'calcrow' },
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

  /* Empfehlung */
  const rat = empfehlung({
    profile: ctx.state.profile,
    proteinZiel: ctx.state.profile ? ctx.goalsFor(localDateKey()).protein : 0,
    proteinSchnitt: await proteinSchnittLetzteTage(ctx),
    monat: new Date().getMonth(),
    schlaeftKurz: kurzeNaechte(ctx),
  });

  body.push(el('h2', { class: 'section-title', text: 'Für dich' }));
  body.push(empfehlungsBlock(rat, gewaehlt, speichern, ctx));

  /* Katalog — Nachschlagewerk, kein Hauptinhalt. Wer die Empfehlung oben
     gelesen hat, braucht ihn nicht; wer nachlesen will, klappt ihn auf. */
  const offen = sortForDiet(SUPPLEMENTS.filter((s) => !istDrin(s.id)), kost);
  if (!offen.length) {
    body.push(el('h2', { class: 'section-title', text: 'Alle im Einzelnen' }));
    body.push(el('div', { class: 'card' },
      emptyState('Alles ausgewählt', 'Mehr kennt die App nicht. Eigene Mittel kannst du '
        + 'unten hinzufügen.')));
  } else {
    const katalog = el('details', { class: 'card klappkarte katalog' },
      el('summary', null,
        el('span', { text: 'Alle im Einzelnen' }),
        el('span', { class: 'muted small tabular', text: `${offen.length} Mittel` })));
    katalog.append(el('div', { class: 'stack mt-16' }, ...offen.map((s) => el('div', {
      class: `card stack suppkarte${hasDietNote(s, kost) ? ' fuerkost' : ''}`,
    },
      el('div', { class: 'row-between' },
        el('h3', { class: 'card-title', text: s.name }),
        belegPill(s.beleg)),
      el('p', { class: 'small', text: s.wofuer }),
      // Der kostabhängige Absatz steht vor dem allgemeinen Hinweis: Bei
      // vegetarischer Kost ist er bei Kreatin und B12 die eigentliche Aussage.
      hasDietNote(s, kost)
        ? el('p', { class: 'kosthinweis', text: s.kost[kost] })
        : null,
      el('p', { class: 'muted small', text: s.hinweis }),
      el('div', { class: 'row-between' },
        el('span', { class: 'muted small tabular', text: `Üblich: ${s.menge}` }),
        el('button', {
          class: 'btn btn-sm', type: 'button',
          onClick: () => speichern([...gewaehlt, { id: s.id, zeit: s.zeit }]),
        }, 'Zur Liste'))))));
    body.push(katalog);
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
