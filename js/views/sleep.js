/**
 * Schlaf eintragen: abends das Zubettgehen, morgens das Aufwachen und das
 * Licht draußen.
 *
 * Die Karte auf der Tagesansicht richtet sich nach der Uhrzeit. Morgens fragt
 * sie nach dem Aufwachen, abends nach dem Zubettgehen — wer um sieben Uhr früh
 * einen Knopf „Schlafen gehen" sieht, muss erst nachdenken, was er hier soll.
 */

import { el, mount, viewHead, iconButton, field, toast, confirmAction } from '../ui.js';
import { localDateKey, formatDateKey, shiftDateKey, parseNumber } from '../nutrition.js';
import { saveSleep, getSleep, deleteSleep } from '../store.js';
import {
  toMinutes, toClock, formatDauer, duration, rateDuration, lightTiming,
  nightKeyForBedtime, isComplete, LICHT_FENSTER, LICHT_MINUTEN, SOLL_MIN,
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

  const head = viewHead('Schlaf',
    `Nacht auf ${formatDateKey(nacht)}`,
    iconButton('back', 'Zurück', () => { nacht = null; ctx.go('today'); }));

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
    field(`Ins Bett am ${formatDateKey(abend)}`, zeitFeld('zuBett', eintrag.zuBett)),
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
function hinweisText(letzteNacht, kommende, morgens) {
  if (letzteNacht && isComplete(letzteNacht)) return null;

  if (letzteNacht && letzteNacht.aufgewacht && !letzteNacht.zuBett) {
    return 'Wann du ins Bett bist, fehlt noch — im Detail nachtragen, dann steht die Dauer.';
  }
  if (letzteNacht && letzteNacht.zuBett && !letzteNacht.aufgewacht && morgens) {
    return 'Zubettgehen steht. Trag noch ein, wann du aufgewacht bist.';
  }
  if (!morgens && kommende && kommende.zuBett) {
    return `Für heute Nacht ist ${kommende.zuBett} eingetragen. Morgen früh kommt das Aufwachen dazu.`;
  }
  return morgens
    ? 'Trag ein, wann du aufgewacht bist — und geh in der ersten Stunde nach draußen, '
      + 'das stellt die innere Uhr.'
    : 'Abends das Zubettgehen, morgens das Aufwachen. Aus beidem wird die Dauer.';
}

/**
 * Was die Karte anbietet, hängt von der Uhrzeit ab: vor dem Mittag geht es um
 * die vergangene Nacht, danach um die kommende.
 */
export function sleepSection(ctx, dateKey, eintraege) {
  const heute = localDateKey();
  const stunde = new Date().getHours();
  const morgens = stunde < 12;

  const nachtKey = dateKey === heute && !morgens ? shiftDateKey(heute, 1) : dateKey;
  const eintrag = (eintraege || []).find((e) => e.date === nachtKey) || { date: nachtKey };
  const letzteNacht = (eintraege || []).find((e) => e.date === dateKey) || null;

  const oeffnen = (key) => { begin(key); ctx.go('sleep'); };

  const schnell = async (schluessel, key) => {
    await saveSleep({ date: key, [schluessel]: jetzt() });
    await ctx.refreshSleep();
    ctx.reload();
    toast(schluessel === 'zuBett' ? 'Gute Nacht.' : 'Guten Morgen.');
  };

  const zeilen = [];

  if (letzteNacht && isComplete(letzteNacht)) {
    const dauer = duration(letzteNacht);
    const b = rateDuration(dauer);
    zeilen.push(el('div', { class: 'row-between' },
      el('span', { class: 'small', text: `${letzteNacht.zuBett} → ${letzteNacht.aufgewacht}` }),
      el('span', {
        class: `pill ${b.art === 'gut' ? 'pill-ok' : 'pill-kcal'} tabular`,
        text: formatDauer(dauer),
      })));
  }

  const knoepfe = el('div', { class: 'row' });

  // Morgens fehlt meist das Aufwachen, abends das Zubettgehen.
  if (morgens && dateKey === heute && !eintrag.aufgewacht) {
    knoepfe.append(el('button', {
      class: 'btn btn-primary grow', type: 'button',
      onClick: () => schnell('aufgewacht', dateKey),
    }, 'Gerade aufgewacht'));
  }
  if (!morgens && dateKey === heute && !eintrag.zuBett) {
    knoepfe.append(el('button', {
      class: 'btn btn-primary grow', type: 'button',
      onClick: () => schnell('zuBett', nightKeyForBedtime(jetzt(), heute, shiftDateKey)),
    }, 'Schlafen gehen'));
  }

  const lichtOffen = dateKey === heute && morgens && !(letzteNacht && letzteNacht.licht?.zeit);
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
    || Boolean(eintrag.zuBett);

  knoepfe.append(el('button', {
    class: knoepfe.children.length ? 'btn' : 'btn btn-block', type: 'button',
    onClick: () => oeffnen(morgens || dateKey !== heute ? dateKey : nachtKey),
  }, etwasDa ? 'Details' : 'Zeiten eintragen'));

  const licht = letzteNacht && letzteNacht.licht?.zeit ? lightTiming(letzteNacht) : null;

  return el('div', { class: 'card stack' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: 'Schlaf' }),
      letzteNacht && letzteNacht.licht?.zeit
        ? el('span', {
            class: `pill ${licht && licht.imFenster && licht.langGenug ? 'pill-ok' : ''}`,
            text: `Draußen ${letzteNacht.licht.zeit}`,
          })
        : null),
    ...zeilen,
    hinweisText(letzteNacht, eintrag, morgens)
      ? el('p', { class: 'muted small', text: hinweisText(letzteNacht, eintrag, morgens) })
      : null,
    letzteNacht && isComplete(letzteNacht) && duration(letzteNacht) < SOLL_MIN
      ? el('p', { class: 'hint',
          text: 'Unter sieben Stunden. Ein einzelner Tag ist kein Problem — mehrere '
            + 'hintereinander merkst du an der Kraft und am Hunger.' })
      : null,
    knoepfe);
}
