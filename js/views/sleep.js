/**
 * Schlaf eintragen: abends das Zubettgehen, morgens das Aufwachen und das
 * Licht draußen.
 *
 * Die Karte auf der Tagesansicht richtet sich nach der Uhrzeit. Morgens fragt
 * sie nach dem Aufwachen, abends nach dem Zubettgehen — wer um sieben Uhr früh
 * einen Knopf „Schlafen gehen" sieht, muss erst nachdenken, was er hier soll.
 */

import { el, mount, viewHead, iconButton, field, toast, confirmAction } from '../ui.js';
import {
  localDateKey, formatDateKey, shiftDateKey, parseNumber, weekdayShort,
} from '../nutrition.js';
import { saveSleep, getSleep, deleteSleep } from '../store.js';
import {
  formatDauer, duration, rateDuration, lightTiming, lightStreak,
  nightKeyForBedtime, isComplete, nightLabel, ABEND_AB,
  LICHT_FENSTER, LICHT_MINUTEN, SOLL_MIN,
} from '../sleep.js';

/** Welche Nacht gerade bearbeitet wird. */
let nacht = null;

export function begin(dateKey) {
  nacht = dateKey || localDateKey();
}

/** Aktuelle Uhrzeit als „HH:MM". */
const jetzt = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/* ---------------- Ansicht ---------------- */

export async function render(container, ctx) {
  if (!nacht) begin(ctx.state.date);

  const eintrag = (await getSleep(nacht)) || { date: nacht };
  const abend = shiftDateKey(nacht, -1);
  const heute = localDateKey();
  const name = nightLabel(nacht, heute, shiftDateKey);

  // Der Kopf nennt die Nacht beim Namen, nicht nur ihr Datum. „Nacht auf den
  // 4." zwingt zum Nachrechnen, „Letzte Nacht" nicht.
  const head = viewHead('Schlaf',
    name
      ? `${name} · ${weekdayShort(abend)} auf ${weekdayShort(nacht)}`
      : `Nacht auf ${formatDateKey(nacht)}`,
    iconButton('back', 'Zurück', () => { nacht = null; ctx.go('today'); }));

  /**
   * Umschalter zwischen der vergangenen und der kommenden Nacht.
   *
   * Ohne ihn hing die Zuordnung an der Uhrzeit, zu der man die Ansicht geöffnet
   * hat — und wer nachmittags nachtrug, landete in der falschen Nacht, ohne es
   * zu merken. Jetzt steht die Wahl da und lässt sich mit einem Tippen ändern.
   */
  const wechsel = el('div', { class: 'nachtwahl' },
    ...[[heute, 'Letzte Nacht'], [shiftDateKey(heute, 1), 'Kommende Nacht']]
      .map(([key, beschriftung]) => el('button', {
        class: `btn nachtknopf${nacht === key ? ' aktiv' : ''}`, type: 'button',
        'aria-pressed': nacht === key ? 'true' : 'false',
        onClick: () => { nacht = key; ctx.reload(); },
      },
        el('span', { class: 'nachtname', text: beschriftung }),
        // Die Spanne statt des Datums: Der Schlüssel einer Nacht ist der Tag
        // des Aufwachens, und „Letzte Nacht — Heute" liest sich, als wäre die
        // kommende gemeint.
        el('span', { class: 'nachtdatum',
          text: `${weekdayShort(shiftDateKey(key, -1))} → ${weekdayShort(key)}` }))));

  const zeitFeld = (schluessel, wert) => {
    const input = el('input', { class: 'input', type: 'time', value: wert || '' });
    input.addEventListener('change', async () => {
      await saveSleep({ date: nacht, [schluessel]: input.value || null });
      await ctx.refreshSleep();
      ctx.reload();
    });
    return el('div', { class: 'row' },
      input,
      el('button', {
        class: 'btn btn-sm', type: 'button',
        onClick: async () => {
          await saveSleep({ date: nacht, [schluessel]: jetzt() });
          await ctx.refreshSleep();
          ctx.reload();
        },
      }, 'Jetzt'));
  };

  /* Licht */
  const licht = eintrag.licht || {};
  const lichtZeit = el('input', { class: 'input', type: 'time', value: licht.zeit || '' });
  const lichtMin = el('input', {
    class: 'input', type: 'text', inputmode: 'numeric', placeholder: '15',
    value: licht.minuten != null ? String(licht.minuten) : '',
  });

  const lichtSpeichern = async () => {
    const zeit = lichtZeit.value || null;
    const min = lichtMin.value.trim() === '' ? null : Math.round(parseNumber(lichtMin.value));
    await saveSleep({
      date: nacht,
      licht: zeit ? { zeit, minuten: Number.isFinite(min) && min > 0 ? min : 0 } : null,
    });
    await ctx.refreshSleep();
    ctx.reload();
  };
  lichtZeit.addEventListener('change', lichtSpeichern);
  lichtMin.addEventListener('change', lichtSpeichern);

  const timing = lightTiming(eintrag);
  const dauer = duration(eintrag);
  const bewertung = rateDuration(dauer);

  const schlafKarte = el('div', { class: 'card stack' },
    el('h3', { class: 'card-title', text: 'Zeiten' }),
    // „Ins Bett am Gestern" wäre ungrammatisch — die relativen Wörter
    // vertragen kein „am" davor.
    field(abend === heute ? 'Ins Bett heute Abend'
      : abend === shiftDateKey(heute, -1) ? 'Ins Bett gestern Abend'
      : `Ins Bett am ${formatDateKey(abend)}`,
      zeitFeld('zuBett', eintrag.zuBett)),
    field('Aufgewacht', zeitFeld('aufgewacht', eintrag.aufgewacht)),
    dauer
      ? el('p', { class: `hint ${bewertung.art === 'gut' ? '' : ''}`,
          text: `${formatDauer(dauer)} im Bett — ${bewertung.text}. `
            + 'Gerechnet wird die Zeit zwischen den beiden Angaben, nicht der '
            + 'tatsächliche Schlaf; wer lange wach liegt, steht hier besser da, als er geschlafen hat.' })
      : el('p', { class: 'hint', text: 'Sobald beide Zeiten stehen, rechnet die App die Dauer.' }));

  const lichtKarte = el('div', { class: 'card stack mt-16' },
    el('h3', { class: 'card-title', text: 'Draußen am Morgen' }),
    el('p', { class: 'muted small',
      text: 'Die innere Uhr stellt sich am Tageslicht, und zwar an dem in der ersten '
        + 'Stunde nach dem Aufwachen. Draußen sind es selbst bei Wolken einige tausend '
        + 'Lux, am Fenster drinnen ein Bruchteil davon — deshalb zählt hier nur echtes Draußensein.' }),
    el('div', { class: 'grid-2' },
      field('Uhrzeit', lichtZeit),
      field('Minuten', lichtMin)),
    timing
      ? el('p', { class: 'hint',
          text: `${timing.minutenNachAufwachen} Minuten nach dem Aufwachen`
            + (timing.imFenster ? ' — innerhalb der ersten Stunde.' : `, also nach dem Fenster von ${LICHT_FENSTER} Minuten.`)
            + (timing.langGenug ? '' : ` Unter ${LICHT_MINUTEN} Minuten bringt wenig.`) })
      : el('p', { class: 'hint',
          text: `Faustregel: ${LICHT_MINUTEN} Minuten bei Sonne, bei trübem Wetter eher zwanzig bis dreißig.` }));

  const notiz = el('input', {
    class: 'input', type: 'text', placeholder: 'Wach gelegen, Kaffee spät, laut …',
    value: eintrag.note || '',
  });
  notiz.addEventListener('change', async () => {
    await saveSleep({ date: nacht, note: notiz.value });
    await ctx.refreshSleep();
  });

  const blaettern = el('div', { class: 'row mt-16' },
    el('button', {
      class: 'btn grow', type: 'button',
      onClick: () => { nacht = shiftDateKey(nacht, -1); ctx.reload(); },
    }, 'Nacht davor'),
    nacht < localDateKey()
      ? el('button', {
          class: 'btn grow', type: 'button',
          onClick: () => { nacht = shiftDateKey(nacht, 1); ctx.reload(); },
        }, 'Nacht danach')
      : null);

  const loeschen = (eintrag.zuBett || eintrag.aufgewacht || eintrag.licht)
    ? el('button', {
        class: 'btn btn-danger btn-block mt-16', type: 'button',
        onClick: async () => {
          if (!confirmAction('Diesen Eintrag löschen?')) return;
          await deleteSleep(nacht);
          await ctx.refreshSleep();
          ctx.reload();
          toast('Gelöscht.');
        },
      }, 'Eintrag löschen')
    : null;

  mount(container, head, el('div', null,
    // Nur wenn eine der beiden Nächte gemeint sein kann — beim Blättern in
    // ältere Nächte wäre der Umschalter irreführend.
    (nacht === heute || nacht === shiftDateKey(heute, 1))
      ? el('div', { class: 'mb-12' }, wechsel)
      : null,
    schlafKarte,
    lichtKarte,
    el('div', { class: 'card stack mt-16' }, field('Notiz', notiz)),
    blaettern,
    loeschen));
}

/* ---------------- Karte für die Tagesansicht ---------------- */

/**
 * Der erklärende Satz unter der Überschrift — je nachdem, was noch fehlt.
 * Ein Text, der nach dem Eintragen unverändert dasteht, liest sich wie ein
 * Vorwurf für etwas, das man gerade erledigt hat.
 */
function hinweisText(letzteNacht, kommende, morgens, abends) {
  if (kommende && kommende.zuBett && abends) {
    return `Für die kommende Nacht ist ${kommende.zuBett} notiert. Morgen früh kommt das `
      + 'Aufwachen dazu.';
  }
  if (letzteNacht && isComplete(letzteNacht)) return null;

  if (letzteNacht && letzteNacht.aufgewacht && !letzteNacht.zuBett) {
    return 'Von letzter Nacht fehlt noch, wann du ins Bett bist — nachtragen, dann steht '
      + 'die Dauer.';
  }
  if (letzteNacht && letzteNacht.zuBett && !letzteNacht.aufgewacht) {
    return 'Zubettgehen steht. Trag noch ein, wann du aufgewacht bist.';
  }
  if (morgens) {
    return 'Trag ein, wann du aufgewacht bist — und geh in der ersten Stunde nach draußen, '
      + 'das stellt die innere Uhr.';
  }
  return abends
    ? 'Abends das Zubettgehen, morgens das Aufwachen. Aus beidem wird die Dauer.'
    : 'Für die vergangene Nacht ist noch nichts eingetragen. Das Zubettgehen für heute '
      + `Nacht kannst du ab ${ABEND_AB} Uhr notieren.`;
}

/**
 * Was die Karte anbietet, hängt von der Uhrzeit ab — aber sie sagt immer
 * dazu, **welche Nacht** gemeint ist.
 *
 * Vorher wechselte sie um zwölf Uhr stillschweigend von der vergangenen auf
 * die kommende Nacht. Wer nachmittags nachtragen wollte, was er in der Nacht
 * davor gemacht hat, trug es damit für die Nacht danach ein — und sah dem Knopf
 * nicht an, dass er etwas anderes tat als gemeint.
 */
export function sleepSection(ctx, dateKey, eintraege) {
  const heute = localDateKey();
  const stunde = new Date().getHours();
  const morgens = stunde < 12;
  const abends = stunde >= ABEND_AB;

  // Die kommende Nacht ist erst abends das Thema. Tagsüber geht es um die
  // vergangene — das ist die, über die man tagsüber überhaupt etwas weiß.
  const kommendeKey = shiftDateKey(dateKey, 1);
  const kommende = (eintraege || []).find((e) => e.date === kommendeKey) || { date: kommendeKey };
  const letzteNacht = (eintraege || []).find((e) => e.date === dateKey) || null;

  const oeffnen = (key) => { begin(key); ctx.go('sleep'); };

  const schnell = async (schluessel, key) => {
    await saveSleep({ date: key, [schluessel]: jetzt() });
    await ctx.refreshSleep();
    ctx.reload();
    toast(schluessel === 'zuBett' ? 'Gute Nacht.' : 'Guten Morgen.');
  };

  const zeilen = [];

  // Immer mit Namen: „Letzte Nacht 23:10 → 06:40". Ohne den weiß niemand, auf
  // welche Nacht sich die Zahl bezieht.
  if (letzteNacht && isComplete(letzteNacht)) {
    const dauer = duration(letzteNacht);
    const b = rateDuration(dauer);
    zeilen.push(el('div', { class: 'row-between' },
      el('span', { class: 'small' },
        el('strong', { text: 'Letzte Nacht ' }),
        `${letzteNacht.zuBett} → ${letzteNacht.aufgewacht}`),
      el('span', {
        class: `pill ${b.art === 'gut' ? 'pill-ok' : 'pill-kcal'} tabular`,
        text: formatDauer(dauer),
      })));
  }

  if (abends && kommende.zuBett) {
    zeilen.push(el('div', { class: 'row-between' },
      el('span', { class: 'small' },
        el('strong', { text: 'Kommende Nacht ' }),
        `ab ${kommende.zuBett}`),
      el('span', { class: 'pill pill-ok', text: 'notiert' })));
  }

  const knoepfe = el('div', { class: 'row' });

  // Morgens fehlt meist das Aufwachen.
  if (morgens && dateKey === heute && !(letzteNacht && letzteNacht.aufgewacht)) {
    knoepfe.append(el('button', {
      class: 'btn btn-primary grow', type: 'button',
      onClick: () => schnell('aufgewacht', dateKey),
    }, 'Gerade aufgewacht'));
  }

  // „Schlafen gehen" erst am Abend. Zwischen Mittag und sieben ist die aktuelle
  // Uhrzeit keine Zubettgeh-Zeit, und der Knopf würde Unsinn eintragen.
  if (abends && dateKey === heute && !kommende.zuBett) {
    knoepfe.append(el('button', {
      class: 'btn btn-primary grow', type: 'button',
      onClick: () => schnell('zuBett', nightKeyForBedtime(jetzt(), heute, shiftDateKey)),
    }, 'Schlafen gehen'));
  }

  // Fehlt an der vergangenen Nacht etwas, führt ein eigener Knopf genau dorthin
  // — nicht in die kommende. Das war der Fehler.
  const letzteUnvollstaendig = dateKey === heute && !(letzteNacht && isComplete(letzteNacht));
  const nachtragen = letzteUnvollstaendig && !morgens;
  if (nachtragen) {
    knoepfe.append(el('button', {
      class: 'btn grow', type: 'button',
      onClick: () => oeffnen(dateKey),
    }, 'Letzte Nacht nachtragen'));
  }

  // Draußen gewesen: nicht an zwölf Uhr gebunden, sondern daran, dass das
  // Aufwachen steht und das Licht fehlt. Wer um halb eins aufsteht, geht auch
  // um halb eins raus.
  const lichtOffen = dateKey === heute
    && Boolean(letzteNacht && letzteNacht.aufgewacht)
    && !(letzteNacht && letzteNacht.licht?.zeit);
  if (lichtOffen) {
    knoepfe.append(el('button', {
      class: 'btn grow', type: 'button',
      onClick: async () => {
        const bisher = (letzteNacht && letzteNacht.licht) || {};
        await saveSleep({ date: dateKey, licht: { zeit: jetzt(), minuten: bisher.minuten || LICHT_MINUTEN } });
        await ctx.refreshSleep();
        ctx.reload();
        toast(`Draußen notiert — ${LICHT_MINUTEN} Minuten eingetragen, änderbar im Detail.`);
      },
    }, 'Bin draußen'));
  }

  // „Details" nur, wenn es schon etwas zu sehen gibt — sonst führt der Knopf
  // in ein leeres Formular und die Beschriftung verspricht zu viel.
  const etwasDa = Boolean(letzteNacht && (letzteNacht.zuBett || letzteNacht.aufgewacht || letzteNacht.licht))
    || Boolean(kommende.zuBett);

  // Wohin „Details" führt: auf die kommende Nacht nur am Abend und nur, wenn an
  // der vergangenen nichts mehr fehlt. Im Zweifel gewinnt die vergangene —
  // über sie weiß man etwas, über die kommende noch nicht.
  const detailKey = (abends && dateKey === heute && !letzteUnvollstaendig)
    ? kommendeKey
    : dateKey;

  // Der allgemeine Knopf entfällt, wenn „Letzte Nacht nachtragen" schon dorthin
  // führt — zwei Knöpfe zum selben Ziel sind kein Angebot, sondern Rauschen.
  if (!(nachtragen && detailKey === dateKey)) {
    knoepfe.append(el('button', {
      class: knoepfe.children.length ? 'btn' : 'btn btn-block', type: 'button',
      onClick: () => oeffnen(detailKey),
    }, etwasDa ? 'Details' : 'Zeiten eintragen'));
  }

  const licht = letzteNacht && letzteNacht.licht?.zeit ? lightTiming(letzteNacht) : null;

  // Die Serie ist die Zahl, die eine Gewohnheit trägt — sichtbarer als jedes
  // einzelne Häkchen.
  const serie = lightStreak(eintraege, dateKey, shiftDateKey);

  return el('div', { class: 'card stack' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: 'Schlaf' }),
      letzteNacht && letzteNacht.licht?.zeit
        ? el('span', {
            class: `pill ${licht && licht.imFenster && licht.langGenug ? 'pill-ok' : ''}`,
            text: `Draußen ${letzteNacht.licht.zeit}`,
          })
        : null),
    serie >= 2
      ? el('p', { class: 'hint',
          text: `${serie} Tage in Folge morgens draußen.` })
      : null,
    ...zeilen,
    hinweisText(letzteNacht, kommende, morgens, abends)
      ? el('p', { class: 'muted small',
          text: hinweisText(letzteNacht, kommende, morgens, abends) })
      : null,
    letzteNacht && isComplete(letzteNacht) && duration(letzteNacht) < SOLL_MIN
      ? el('p', { class: 'hint',
          text: 'Unter sieben Stunden. Ein einzelner Tag ist kein Problem — mehrere '
            + 'hintereinander merkst du an der Kraft und am Hunger.' })
      : null,
    knoepfe);
}
