/**
 * Der Wochenplan in voller Länge, dazu die Kalorienziele, die daraus folgen —
 * getrennt nach Trainings- und Ruhetagen, mit der Rechnung dahinter.
 */

import { el, mount, viewHead, iconButton, toast, confirmAction } from '../ui.js';
import { localDateKey } from '../nutrition.js';
import { setPlan, clearTraining, setTrainingProfile } from '../store.js';
import {
  exerciseById, GROUP_LABEL, EQUIPMENT_LABEL, GOAL_LABEL, LEVEL_LABEL,
  blockWeek, forWeek, buildPlan, BLOCK_WEEKS, restSeconds, sessionMinutes, sessionSpanne,
  isTimed, repRange, isUnilateral, ZYKLUS_WAHL, weeklyPlannedSets, VOLUMEN_UNTEN, VOLUMEN_OBEN,
  empfohleneZeit, tageVergleich, verteileTage,
  EXERCISES, REST_TEMPO,
} from '../training.js';
import { ladderFor, rungsInPlan, profileForPlan, leiterRang } from '../ladders.js';
import { energyPlan, energyBreakdown, ACTIVITY_LABEL } from '../energy.js';
import { skillById, currentLevel, levelIndex, MINUTES_PER_SKILL } from '../skills.js';

const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function dayCard(day, week, equipment, tempo, profile, zyklus) {
  const rows = day.exercises.map((prescription) => {
    const exercise = exerciseById(prescription.id);
    if (!exercise) return null;
    const adjusted = forWeek(prescription, week);
    const zeit = isTimed(prescription.id);
    const bereich = repRange(prescription);

    return el('div', { class: 'exrow' },
      el('div', { class: 'grow' },
        el('div', { class: 'exrow-name', text: exercise.name }),
        el('div', { class: 'exrow-tag',
          // „je Seite" gehört sichtbar dazu: Drei Sätze einbeinige Glute
          // Bridge sind sechs Durchgänge, und so lange dauern sie auch.
          text: `${GROUP_LABEL[exercise.group] || exercise.group} · ${exercise.type === 'c' ? 'Grundübung' : 'Isolation'}`
            + (isUnilateral(prescription.id) ? ' · je Seite' : '')
            + ` · ${restSeconds(prescription, tempo)} s Pause`
            + (ladderFor(prescription.id)
                ? ` · Stufe ${ladderFor(prescription.id).index + 1}/${ladderFor(prescription.id).leiter.stufen.length}`
                : '') })),
      el('div', { class: 'exrow-rx tabular' },
        el('strong', { text: `${adjusted.sets} × ${bereich[0]}–${bereich[1]}${zeit ? ' s' : ''}` }),
        // Bei einer Halteübung gibt es keine Wiederholungen im Tank, also
        // auch kein RIR. Dort steht, was sonst der Zähler wäre: Sekunden.
        el('span', { text: zeit ? 'halten' : `RIR ${adjusted.rir}` })));
  }).filter(Boolean);

  const totalSets = day.exercises.reduce((sum, p) => sum + forWeek(p, week).sets, 0);
  const spanne = sessionSpanne(day, profile, tempo, zyklus);
  const technikMinuten = (profile.skills || []).length * MINUTES_PER_SKILL;

  return el('div', { class: 'card card-flush mt-16' },
    el('div', { class: 'dayhead' },
      el('span', { class: 'dayhead-wd', text: day.weekday != null ? WEEKDAY_SHORT[day.weekday] : '–' }),
      el('span', { class: 'dayhead-name grow', text: day.name }),
      // Die Dauer für **diese** Woche, nicht die Grundzahl. Daneben steht die
      // Satzzahl, und die war schon immer für die Woche gerechnet — zwei
      // Zahlen in einer Zeile, von denen eine aus einer anderen Woche kam.
      // Die Dauer der ganzen Einheit, Technikarbeit eingeschlossen. Sie läuft
      // an jedem Trainingstag, stand aber nie in dieser Zahl — wer Handstand
      // und Klimmzug übt, las „23 Min" für eine Einheit von fünfunddreißig.
      el('span', { class: 'muted small tabular',
        text: `${totalSets} Sätze · rund ${sessionMinutes(
          day.exercises.map((x) => ({ ...x, sets: forWeek(x, week).sets })), tempo,
        ) + technikMinuten} Min` })),
    ...rows,
    technikMinuten
      ? el('p', { class: 'hint',
          text: `Davon ${spanne.kraft} Minuten Kraft und ${technikMinuten} Minuten Technik — `
            + 'die Fähigkeiten laufen an jedem Trainingstag und sind hier mitgerechnet.' })
      : null,
    spanne && spanne.laengste > spanne.kuerzeste
      ? el('p', { class: 'hint',
          text: `Über den Block: ${spanne.kuerzeste} Minuten in der Entlastungswoche, `
            + `${spanne.laengste} in der schweren. Der Unterschied ist der Satz mehr oder `
            + 'weniger je Übung.' })
      : null,
    spanne && spanne.ueberzieht
      ? el('p', { class: 'note note-inset' },
          `Länger als dein Zeitfenster: Du hast ${spanne.budget} Minuten angegeben, eine normale `
          + `Woche dauert hier rund ${spanne.normal}. Der Plan kürzt nur bis zu dem Umfang, ohne `
          + 'den ein Trainingstag keiner mehr wäre — beide Zugrichtungen, Hüfte und Knie. '
          + 'Willst du wirklich kürzer, nimm einen Tag mehr in der Woche: Dann verteilt sich '
          + 'dasselbe auf kürzere Einheiten.')
      : null,
    day.gekuerzt
      ? el('p', { class: 'note note-inset' },
          el('strong', { text: 'Für dein Zeitfenster gekürzt. ' }),
          `${day.gekuerzt} ${day.gekuerzt === 1 ? 'Satz ist' : 'Sätze sind'} rausgefallen, damit `
          + `die Einheit in deine ${profile.sessionLength} Minuten passt. Die Übungen bleiben alle `
          + 'stehen — du trainierst also weiter jede Bewegung, nur mit weniger Volumen. Wenn die '
          + 'Volumenkarte oben zu viele Gruppen als „wenig" meldet, bringt ein Trainingstag mehr '
          + 'in der Woche mehr als längere Einheiten.')
      : null,
    day.short
      ? el('p', { class: 'note note-inset' },
          `Kürzer als geplant: mit ${EQUIPMENT_LABEL[equipment]} und deinen Einschränkungen bleiben ` +
          'für diesen Tag nicht mehr passende Übungen übrig. Mach dafür einen Satz mehr pro Übung — ' +
          'oder ergänze die Ausrüstung unter „Angaben ändern".')
      : null);
}

function targetCard(title, macros, tone) {
  return el('div', { class: 'card' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: title }),
      el('span', { class: `pill pill-${tone} tabular`, text: `${macros.kcal} kcal` })),
    el('dl', { class: 'macrolist tabular' },
      el('div', null, el('dt', { text: 'Eiweiß' }), el('dd', { text: `${macros.protein} g` })),
      el('div', null, el('dt', { text: 'Kohlenhydrate' }), el('dd', { text: `${macros.carbs} g` })),
      el('div', null, el('dt', { text: 'Fett' }), el('dd', { text: `${macros.fat} g` }))));
}

export async function render(container, ctx) {
  const { profile, plan } = ctx.state;

  if (!profile || !plan) {
    ctx.go('training');
    return;
  }

  const week = blockWeek(plan, localDateKey());
  const energy = energyPlan(profile, ctx.state.kcalAdjust);
  // Weit oben, weil jeder Neubau weiter unten damit rechnet: Das Pausentempo
  // entscheidet mit, wie viele Übungen in das Zeitfenster passen.
  const tempo = ctx.settings.pausen || 'normal';

  const head = viewHead(plan.splitName,
    `${profile.days}× pro Woche · ${profile.sessionLength} Minuten · ${BLOCK_WEEKS[week].label}`,
    iconButton('back', 'Zurück zum Training', () => ctx.go('training')));

  const zyklus = plan.zyklus === 0 ? 0 : (Number(plan.zyklus) || 4);

  /** Den Rhythmus umstellen, ohne die Übungsauswahl anzufassen. */
  const setzeZyklus = async (wert) => {
    if (wert === zyklus) return;
    await setPlan({ ...plan, zyklus: wert });
    await ctx.refreshTraining();
    ctx.reload();
    toast(wert ? `Entlastungswoche alle ${wert} Wochen.` : 'Keine feste Entlastungswoche mehr.');
  };

  const zyklusWahl = el('div', { class: 'stack-tight' },
    el('div', { class: 'suppzeit', text: 'Entlastungswoche' }),
    el('div', { class: 'row' },
      ...ZYKLUS_WAHL.map((z) => el('button', {
        class: 'chip', type: 'button',
        'aria-pressed': z.wert === zyklus ? 'true' : 'false',
        onClick: () => setzeZyklus(z.wert),
      }, z.label))),
    el('p', { class: 'muted small',
      text: (ZYKLUS_WAHL.find((z) => z.wert === zyklus) || ZYKLUS_WAHL[0]).hint }));

  /**
   * Bei drei Tagen gibt es zwei sinnvolle Aufteilungen, und sie
   * unterscheiden sich in dem, was zählt: Ganzkörper verteilt das Volumen
   * einer Gruppe auf drei Einheiten, Push/Pull/Beine packt alles in eine.
   */
  const aufteilung = profile.days === 3
    ? el('div', { class: 'stack-tight' },
        el('div', { class: 'suppzeit', text: 'Aufteilung' }),
        el('div', { class: 'row' },
          ...[['3', 'Ganzkörper 3×'], ['3ppl', 'Push / Pull / Beine']].map(([k, label]) => el('button', {
            class: 'chip', type: 'button',
            'aria-pressed': String(plan.splitKey) === k ? 'true' : 'false',
            onClick: async () => {
              if (String(plan.splitKey) === k) return;
              const neuesProfil = { ...profile, splitKey: k };
              const next = buildPlan(profileForPlan(neuesProfil), plan.seed || 0, { stufen: rungsInPlan(plan), rang: leiterRang, pausen: tempo });
              next.createdAt = plan.createdAt;
              next.zyklus = plan.zyklus;
              await setTrainingProfile(neuesProfil);
              await setPlan(next);
              await ctx.refreshTraining();
              ctx.reload();
              toast(`Aufteilung: ${label}.`);
            },
          }, label))),
        el('p', { class: 'muted small',
          text: String(plan.splitKey) === '3ppl'
            ? 'Jede Gruppe einmal die Woche, dafür geballt: Auf dem Zugtag stehen 13 bis 16 Sätze '
              + 'für den Rücken. Ab etwa elf Sätzen in einer Einheit trägt ein weiterer kaum noch etwas bei.'
            : 'Jede Gruppe dreimal die Woche, jeweils in kleineren Portionen. Bei gleichem '
              + 'Wochenvolumen ist das die verlässlichere Variante.' }))
    : null;

  /**
   * Der Plan liegt gespeichert. Kommen Übungen dazu, merkt er davon nichts —
   * man macht weiter dieselben sieben, obwohl die App inzwischen mehr kennt.
   * Von allein umzubauen wäre falsch: Ein Plan, der sich unter der Hand
   * ändert, ist kein Plan. Also ein Hinweis mit einem Knopf.
   */
  const stand = Number(plan.uebungsstand) || null;
  const neueUebungen = EXERCISES.length - (stand || 0);

  /**
   * Läuft gerade eine Einheit, die noch nicht abgeschlossen ist?
   *
   * Der Neubau löscht nichts — eingetragene Sätze liegen in der Einheit, nicht
   * im Plan, und zählen weiter im Bericht. Aber die Übungsliste des Tages
   * wechselt komplett, und was man heute schon gemacht hat, steht dann nicht
   * mehr in der Ansicht. Mitten im Training ist das genau das Falsche, deshalb
   * wird hier gefragt statt gemacht.
   */
  const heutigeEinheit = (ctx.state.sessions || []).find((x) => x.date === localDateKey());
  const offeneSaetze = heutigeEinheit && !heutigeEinheit.done
    ? Object.values(heutigeEinheit.entries || {}).reduce((n, v) => n + (v || []).length, 0)
    : 0;

  const neuBauen = async () => {
    if (offeneSaetze && !confirmAction(
      `Du bist mitten im Training: ${offeneSaetze} Sätze sind heute schon eingetragen.\n\n`
      + 'Die bleiben gespeichert und zählen im Bericht — aber die Übungsliste von heute '
      + 'wechselt, und die erledigten Übungen stehen dann nicht mehr in der Ansicht.\n\n'
      + 'Besser nach dem Training. Trotzdem jetzt umbauen?')) return;

    // Derselbe Seed wie bisher und die erreichten Leitersprossen mitgegeben:
    // Hier sollen neue Übungen dazukommen, nicht alles neu gewürfelt werden.
    const next = buildPlan(profileForPlan(profile), plan.seed || 0, { stufen: rungsInPlan(plan), rang: leiterRang, pausen: tempo });
    next.createdAt = plan.createdAt;
    next.zyklus = plan.zyklus;
    await setPlan(next);
    await ctx.refreshTraining();
    ctx.reload();
    toast('Plan mit den neuen Übungen gebaut.');
  };

  const nachschub = (stand === null || neueUebungen > 0)
    ? el('div', { class: 'card stack mt-16' },
        el('div', { class: 'row-between' },
          el('h3', { class: 'card-title', text: 'Neue Übungen verfügbar' }),
          el('span', { class: 'pill pill-kcal tabular',
            text: stand === null ? `${EXERCISES.length} Übungen` : `+${neueUebungen}` })),
        el('p', { class: 'small',
          text: stand === null
            ? `Dein Plan stammt aus einer früheren Fassung. Die App kennt inzwischen `
              + `${EXERCISES.length} Übungen — ob davon welche neu sind, kann der Plan nicht sagen.`
            : `Seit dem Bau deines Plans sind ${neueUebungen} ${neueUebungen === 1 ? 'Übung' : 'Übungen'} `
              + 'dazugekommen. Ein gespeicherter Plan holt sie sich nicht von allein.' }),
        offeneSaetze
          ? el('p', { class: 'note' },
              el('strong', { text: 'Du trainierst gerade. ' }),
              `${offeneSaetze} Sätze stehen heute schon. Der Umbau wechselt die Übungsliste `
              + 'von heute — mach die Einheit lieber zu Ende und bau danach um.')
          : null,
        el('button', {
          class: 'btn btn-block', type: 'button', onClick: neuBauen,
        }, offeneSaetze ? 'Trotzdem jetzt umbauen' : 'Plan mit den neuen Übungen bauen'),
        el('p', { class: 'hint',
          text: 'Aufteilung, Blockwoche und dein Startdatum bleiben. Aussortierte und '
            + 'ausgewachsene Übungen bleiben es auch. Was du von Hand einzeln ausgetauscht '
            + 'hast, wird dabei neu gewürfelt. Eingetragene Sätze bleiben in jedem Fall '
            + 'gespeichert — die liegen in der Einheit, nicht im Plan.' }))
    : null;

  const spanneVon = (tag) => (tag ? sessionSpanne(tag, profile, tempo, plan.zyklus) : null);

  /**
   * Passt der Plan zu den Pausen, die du machst?
   *
   * Über die Hälfte der geschätzten Dauer sind Pausen — das Tempo entscheidet
   * also mit, wie viele Übungen in dasselbe Zeitfenster passen. Die
   * Einstellung allein baut den Plan aber nicht um, und so blieb sie
   * folgenlos: Man stellte „Kurz" ein, die Einheit blieb kurz, und niemand
   * sagte, dass da noch Platz gewesen wäre.
   */
  const passend = buildPlan(profileForPlan(profile), plan.seed || 0,
    { stufen: rungsInPlan(plan), rang: leiterRang, pausen: tempo });

  // Verglichen wird die Dauer, nicht die Zahl der Übungen. Seit ein knappes
  // Zeitfenster auch über die Satzzahl eingehalten wird, können zwei Pläne
  // gleich viele Übungen haben und trotzdem zehn Minuten auseinanderliegen —
  // die Übungszahl allein hätte den Unterschied verschwiegen.
  const jetztSaetze = plan.days.reduce((n, d) => n + d.exercises.reduce((m, x) => m + x.sets, 0), 0);
  const moeglichSaetze = passend.days.reduce((n, d) => n + d.exercises.reduce((m, x) => m + x.sets, 0), 0);
  const differenz = moeglichSaetze - jetztSaetze;
  const jetztDauer = spanneVon(plan.days[0]);
  const luecke = profile.sessionLength - (jetztDauer ? jetztDauer.normal : profile.sessionLength);

  const pausenPassung = differenz !== 0
    ? el('div', { class: 'card stack mt-16' },
        el('div', { class: 'row-between' },
          el('h3', { class: 'card-title', text: 'Passt nicht zu deinen Pausen' }),
          el('span', { class: 'pill pill-kcal tabular',
            text: `${differenz > 0 ? '+' : ''}${differenz} Sätze` })),
        el('p', { class: 'small',
          text: differenz > 0
            ? `Du pausierst ${REST_TEMPO[tempo].label.toLowerCase()} — damit passen in der Woche `
              + `${differenz} Sätze mehr in deine ${profile.sessionLength} Minuten, als jetzt im `
              + 'Plan stehen. Gebaut wurde er mit längeren Pausen, und deshalb bist du früher '
              + `fertig, als du wolltest${luecke >= 3 ? ` — rund ${Math.round(luecke)} Minuten je Einheit bleiben ungenutzt` : ''}.`
            : `Du pausierst ${REST_TEMPO[tempo].label.toLowerCase()} — damit dauert dein Plan `
              + `länger als die ${profile.sessionLength} Minuten, die du angegeben hast. `
              + `${-differenz} Sätze weniger in der Woche würden passen.` }),
        offeneSaetze
          ? el('p', { class: 'note' },
              el('strong', { text: 'Du trainierst gerade. ' }),
              `${offeneSaetze} Sätze stehen heute schon — mach die Einheit lieber zu Ende.`)
          : null,
        el('button', {
          class: 'btn btn-block', type: 'button', onClick: neuBauen,
        }, differenz > 0 ? 'Plan auf deine Zeit auffüllen' : 'Plan auf deine Zeit kürzen'),
        el('p', { class: 'hint',
          text: 'Deine Leitersprossen bleiben stehen, eingetragene Sätze sowieso — die liegen '
            + 'in der Einheit, nicht im Plan. Wenn du lieber die Pausen änderst statt des Plans: '
            + 'Das Tempo steht beim Training unter „Pausen".' }))
    : null;

  /**
   * Was das Zeitfenster hergibt — und was ein anderes hergäbe.
   *
   * „Wie lange soll ich trainieren" ist keine Geschmacksfrage, sobald man
   * sagt, woran man sie misst. Gemessen wird am Wochenvolumen je Muskelgruppe.
   */
  // Mit aufgefüllter Sperrliste, wie jeder andere Planbau auch. Ohne sie
  // bewertet die Empfehlung Pläne mit Sprossen, die längst hinter einem
  // liegen — und die sind beidseitig und damit schneller, also fiele die
  // empfohlene Zeit zu kurz aus.
  const empfehlung = empfohleneZeit(profileForPlan(profile), { rang: leiterRang, pausen: tempo });
  const tage = tageVergleich(profileForPlan(profile), { rang: leiterRang, pausen: tempo });

  const tageEmpfehlung = empfehlung && empfehlung.reichtNicht
    ? el('div', { class: 'card stack mt-16' },
        el('div', { class: 'row-between' },
          el('h3', { class: 'card-title', text: 'Mehr Tage, nicht längere Einheiten' }),
          el('span', { class: 'pill pill-kcal tabular', text: `${profile.days}× pro Woche` })),
        el('p', { class: 'small',
          text: `Mit ${profile.days} Trainingstagen bleiben die meisten Muskelgruppen unter dem `
            + 'empfohlenen Wochenvolumen — und zwar bei jedem Zeitfenster. Selbst mit '
            + `${Math.max(...empfehlung.stufen.map((x) => x.minuten))} Minuten je Einheit wären es nur `
            + `${Math.max(...empfehlung.stufen.map((x) => x.gut))} von ${empfehlung.gruppen}. `
            + 'Längere Einheiten lösen das nicht: Eine Muskelgruppe braucht zehn bis zwanzig Sätze '
            + 'über die Woche verteilt, und was in einer einzelnen Einheit über etwa zehn Sätze '
            + 'hinausgeht, trägt kaum noch etwas bei.' }),
        el('p', { class: 'muted small',
          text: 'Deshalb hier keine Minutenzahl. Der Hebel ist ein Trainingstag mehr — unter '
            + '„Angaben ändern". Wenn das nicht geht, ist der Plan trotzdem sinnvoll; er deckt '
            + 'jede Bewegung ab. Er liegt nur unter dem, was an Volumen möglich wäre.' }))
    : null;

  /**
   * Und wenn eine andere Tagezahl deutlich besser wäre, gehört das gesagt.
   *
   * Bisher gab es dafür nur den Extremfall oben: „zwei Tage reichen nicht".
   * Dazwischen schwieg die App. Wer sechs Tage trainiert und mit fünf bei
   * gleichem Zeitaufwand zwei Muskelgruppen mehr im Zielbereich hätte, sah
   * eine Tabelle — aber keinen Hinweis, dass darin etwas Besseres steht.
   * Tabellen liest man, wenn man eine Frage hat; Hinweise auch, wenn nicht.
   *
   * Dieselbe Schwelle wie bei der Zeit: ab zwei Gruppen Unterschied. Und
   * ohne Knopf — welche Wochentage jemand kann, weiß nur er selbst.
   */
  const jetztTage = tage.find((x) => x.tage === profile.days) || null;
  // Bei Gleichstand gewinnt die Tagezahl, die der jetzigen am nächsten liegt.
  // Vier und fünf Tage kommen bei diesem Profil auf dasselbe Ergebnis; wer
  // sechsmal die Woche trainiert, soll dann fünf vorgeschlagen bekommen und
  // nicht vier. Die kleinere Umstellung ist die, die man auch macht.
  const besteTage = tage.length
    ? [...tage].sort((a, b) => a.daneben - b.daneben
      || Math.abs(a.tage - profile.days) - Math.abs(b.tage - profile.days)
      || a.stunden - b.stunden)[0]
    : null;
  const tageLohnt = Boolean(jetztTage && besteTage && !empfehlung?.reichtNicht
    && jetztTage.daneben - besteTage.daneben >= 2);

  // „Ich kann sechs Tage" heißt nicht „ich muss sechs Tage". Die Wochentage
  // aus dem Fragebogen sind Verfügbarkeit — daraus die passenden auszuwählen
  // kann die App selbst, ohne noch einmal zu fragen.
  const neueTage = besteTage ? verteileTage(profile.weekdays, besteTage.tage) : [];

  const tageBesser = tageLohnt
    ? el('div', { class: 'card stack mt-16' },
        el('div', { class: 'row-between' },
          el('h3', { class: 'card-title', text: 'Eine andere Aufteilung passt besser' }),
          el('span', { class: 'pill pill-kcal tabular',
            text: `${profile.days} → ${besteTage.tage} Tage` })),
        el('p', { class: 'small',
          text: `Mit ${profile.days} Trainingstagen liegen ${jetztTage.gut} von `
            + `${jetztTage.gruppen} Muskelgruppen im empfohlenen Wochenvolumen. Mit `
            + `${besteTage.tage} Tagen à ${besteTage.minuten} Minuten wären es ${besteTage.gut} `
            + `— bei ${besteTage.stunden} statt ${jetztTage.stunden} Stunden die Woche.` }),
        el('p', { class: 'muted small',
          text: 'Es liegt an der Aufteilung, nicht an der Menge: Sechs Tage laufen als '
            + 'Push/Pull/Beine zweimal und treffen Rücken und Arme doppelt, während Schultern, '
            + 'Gesäß und Rumpf nur an ihren Tagen vorkommen. Fünf Tage mischen Push/Pull/Beine '
            + 'mit zwei Ganzkörperhälften und verteilen breiter.' }),
        el('p', { class: 'small' },
          el('strong', { text: 'Deine Tage bleiben deine Tage. ' }),
          `Aus ${profile.weekdays.map((d) => WEEKDAY_SHORT[d]).join(', ')} würden `
          + `${neueTage.map((d) => WEEKDAY_SHORT[d]).join(', ')} — `
          + `${profile.weekdays.filter((d) => !neueTage.includes(d)).map((d) => WEEKDAY_SHORT[d]).join(' und ')} `
          + 'fällt weg. Ausgewählt ist so, dass die Einheiten möglichst gleichmäßig liegen und '
          + 'nicht zu viele am Stück.'),
        offeneSaetze
          ? el('p', { class: 'note' },
              el('strong', { text: 'Du trainierst gerade. ' }),
              `${offeneSaetze} Sätze stehen heute schon — mach die Einheit lieber zu Ende.`)
          : null,
        el('button', {
          class: 'btn btn-block', type: 'button',
          onClick: async () => {
            if (!confirmAction(`Auf ${besteTage.tage} Trainingstage à ${besteTage.minuten} Minuten `
              + `umstellen?\n\nTage: ${neueTage.map((d) => WEEKDAY_SHORT[d]).join(', ')}\n\n`
              + 'Deine Leitersprossen bleiben stehen, eingetragene Sätze auch.')) return;
            const neuesProfil = {
              ...profile,
              days: besteTage.tage,
              weekdays: neueTage,
              sessionLength: besteTage.minuten,
            };
            const next = buildPlan(profileForPlan(neuesProfil), plan.seed || 0,
              { stufen: rungsInPlan(plan), rang: leiterRang, pausen: tempo });
            next.createdAt = plan.createdAt;
            next.zyklus = plan.zyklus;
            await setTrainingProfile(neuesProfil);
            await setPlan(next);
            await ctx.refreshTraining();
            ctx.reload();
            toast(`${besteTage.tage} Tage à ${besteTage.minuten} Minuten — Plan neu gebaut.`);
          },
        }, `Auf ${besteTage.tage} Tage à ${besteTage.minuten} Minuten umstellen`),
        el('p', { class: 'hint',
          text: 'Der freie Tag ist keine ausgefallene Einheit, sondern eine geplante Pause — die '
            + 'App zählt ihn auch nicht als Ausfall. Andere Wochentage wählst du unter '
            + '„Angaben ändern". Die ganze Tabelle steht weiter unten unter „Zeit und Tage im '
            + 'Vergleich".' }))
    : null;

  const zeitEmpfehlung = empfehlung && empfehlung.lohnt
    ? el('div', { class: 'card stack mt-16' },
        el('div', { class: 'row-between' },
          el('h3', { class: 'card-title', text: 'Dein Zeitfenster ist knapp' }),
          el('span', { class: 'pill pill-kcal tabular',
            text: `${profile.sessionLength} → ${empfehlung.minuten} Min` })),
        el('p', { class: 'small',
          text: `Mit ${profile.sessionLength} Minuten je Einheit liegen `
            + `${empfehlung.jetzt.gut} von 10 Muskelgruppen im empfohlenen Wochenvolumen. `
            + `Mit ${empfehlung.minuten} Minuten wären es ${empfehlung.gut} — bei gleich vielen `
            + `Trainingstagen, also ${Math.round(empfehlung.minuten * profile.days / 6) / 10} statt `
            + `${Math.round(profile.sessionLength * profile.days / 6) / 10} Stunden die Woche.` }),
        el('p', { class: 'muted small',
          text: 'Der Bereich stammt aus den Übersichtsarbeiten: etwa zehn bis zwanzig harte Sätze '
            + 'je Muskelgruppe und Woche. Darunter verschenkst du etwas, darüber wird der Zugewinn '
            + 'je Satz so klein, dass er die Erholung selten wert ist. Deshalb endet die Empfehlung '
            + `bei ${empfehlung.minuten} und geht nicht weiter hoch — mehr Zeit brächte hier nichts mehr. `
            + 'Was die Rechnung nicht weiß: wie gut du schläfst und isst. Mehr Training ist nur '
            + 'dann mehr, wenn die Erholung mitkommt.' }),
        offeneSaetze
          ? el('p', { class: 'note' },
              el('strong', { text: 'Du trainierst gerade. ' }),
              `${offeneSaetze} Sätze stehen heute schon — mach die Einheit lieber zu Ende.`)
          : null,
        el('button', {
          class: 'btn btn-primary btn-block', type: 'button',
          onClick: async () => {
            if (!confirmAction(`Zeitfenster auf ${empfehlung.minuten} Minuten je Einheit umstellen `
              + 'und den Plan neu bauen?\n\nDeine Leitersprossen bleiben stehen, eingetragene Sätze '
              + 'auch. Aussortierte Übungen bleiben aussortiert.')) return;
            const neuesProfil = { ...profile, sessionLength: empfehlung.minuten };
            const next = buildPlan(profileForPlan(neuesProfil), plan.seed || 0,
              { stufen: rungsInPlan(plan), rang: leiterRang, pausen: tempo });
            next.createdAt = plan.createdAt;
            next.zyklus = plan.zyklus;
            await setTrainingProfile(neuesProfil);
            await setPlan(next);
            await ctx.refreshTraining();
            ctx.reload();
            toast(`Zeitfenster auf ${empfehlung.minuten} Minuten — Plan neu gebaut.`);
          },
        }, `Auf ${empfehlung.minuten} Minuten umstellen`),
        el('p', { class: 'hint',
          text: 'Willst du lieber bei deiner Zeit bleiben: Dann ist ein Trainingstag mehr der '
            + 'nächstbeste Hebel. Beides zusammen ist selten nötig.' }))
    : null;

  /**
   * Die ganze Tabelle, nicht nur das Urteil.
   *
   * Die Empfehlungskarte verschwindet, sobald man ihr gefolgt ist — und damit
   * auch die Begründung. Wer wissen will, ob fünfundvierzig auch reichen oder
   * ob siebzig noch etwas bringen, stand dann vor einem Knopf, den es nicht
   * mehr gibt. Diese Klappkarte bleibt immer da und zeigt jedes Fenster mit
   * seinem Ergebnis, das eigene markiert.
   */
  const zeitTabelle = empfehlung
    ? el('details', { class: 'card klappkarte mt-16' },
        el('summary', null,
          el('span', { class: 'grow', text: 'Zeit und Tage im Vergleich' }),
          el('span', { class: 'muted small',
            text: `${profile.sessionLength} Min · ${empfehlung.jetzt.gut} von 10 im Ziel` })),
        el('div', { class: 'stack mt-16' },
          el('p', { class: 'muted small',
            text: 'Wie viele Muskelgruppen bei diesem Zeitfenster im empfohlenen Wochenvolumen '
              + `liegen — zehn bis zwanzig harte Sätze je Gruppe, bei deinen ${profile.days} `
              + 'Trainingstagen. „Darüber" heißt: mehr, als sich noch lohnt.' }),
          el('div', { class: 'card-flush' },
            ...empfehlung.stufen.map((x) => {
              const istJetzt = x.minuten === profile.sessionLength;
              const istBeste = x.minuten === empfehlung.minuten;
              return el('div', { class: 'calcrow' },
                el('div', { class: 'grow' },
                  el('div', { text: `${x.minuten} Minuten`
                    + (istJetzt ? ' · deine Einstellung' : '')
                    + (istBeste && !istJetzt ? ' · beste' : '') }),
                  el('div', { class: 'muted small',
                    text: `Einheit rund ${x.dauer} Min`
                      + (x.wenig ? ` · ${x.wenig} Gruppen darunter` : '')
                      + (x.viel ? ` · ${x.viel} darüber` : '') })),
                el('span', {
                  class: `pill ${x.daneben === empfehlung.daneben ? 'pill-ok' : 'pill-kcal'} tabular`,
                  text: `${x.gut}/10`,
                }));
            })),
          el('p', { class: 'hint',
            text: 'Die Zahlen gelten für deine Tage, deine Ausrüstung und deine Fähigkeiten. '
              + 'Änderst du davon etwas, ändert sich die Tabelle mit — auch wenn du eine '
              + 'Leitersprosse höher steigst, denn einarmige und einbeinige Varianten dauern '
              + 'doppelt so lang.' }),
          el('h4', { class: 'card-title mt-16', text: 'Und wie viele Tage?' }),
          el('p', { class: 'muted small',
            text: 'Je Tagezahl mit dem Zeitfenster gerechnet, das dort am besten abschneidet — '
              + 'sonst vergliche man eine gute Aufteilung bei schlechter Zeit mit einer '
              + 'schlechten bei guter. Die Aufteilung macht viel aus: Sechs Tage laufen als '
              + 'Push/Pull/Beine zweimal und treffen Rücken und Arme doppelt, während Schultern, '
              + 'Gesäß und Rumpf nur an ihren Tagen vorkommen.' }),
          el('div', { class: 'card-flush' },
            ...tage.map((x) => el('div', { class: 'calcrow' },
              el('div', { class: 'grow' },
                el('div', { text: `${x.tage} Tage à ${x.minuten} Minuten`
                  + (x.tage === profile.days ? ' · deine Einstellung' : '') }),
                el('div', { class: 'muted small',
                  text: x.reichtNicht
                    ? 'zu wenig Tage — kein Zeitfenster reicht'
                    : `rund ${x.stunden} Stunden die Woche` })),
              el('span', {
                class: `pill ${x.daneben === Math.min(...tage.map((y) => y.daneben)) ? 'pill-ok' : 'pill-kcal'} tabular`,
                text: `${x.gut}/${x.gruppen}`,
              })))),
          el('p', { class: 'muted small',
            text: 'Wie genau das ist: auf etwa eine Gruppe. Zwei Fenster, die sich um eine '
              + 'einzige Gruppe unterscheiden, sind praktisch gleich gut — such dir das aus, '
              + 'das in deinen Tag passt. Deshalb schlägt die App eine Umstellung auch erst ab '
              + 'zwei Gruppen Unterschied vor, statt dich alle paar Wochen um fünf Minuten hin '
              + 'und her zu schicken. Und was hier nicht drinsteht: wie gut du schläfst und '
              + 'isst — mehr Training ist nur dann mehr, wenn die Erholung mitkommt.' })))
    : null;

  const summary = el('div', { class: 'card stack' },
    el('p', { class: 'small' },
      el('strong', { text: zyklus ? `${zyklus}-Wochen-Block. ` : 'Ohne festen Block. ' }),
      zyklus
        ? 'Woche 1 sammelt Werte mit mehr Reserve, die mittleren Wochen bauen auf, die vorletzte ist die schwere, '
          + 'die letzte ist Deload mit weniger Sätzen. '
        : 'Es läuft dauerhaft die Aufbauwoche. Eine Entlastung schlägt die App vor, wenn Schlaf und Einheiten dafür sprechen. '
      , 'RIR heißt: so viele Wiederholungen hättest du am Satzende noch geschafft — je kleiner, desto härter.'),
    aufteilung,
    zyklusWahl,
    el('p', { class: 'muted small',
      text: `${GOAL_LABEL[profile.goal]} · ${LEVEL_LABEL[profile.level]} · ${EQUIPMENT_LABEL[profile.equipment]} · Alltag ${ACTIVITY_LABEL[profile.activity].toLowerCase()}` }),
    el('div', { class: 'row' },
      el('button', {
        class: 'btn grow', type: 'button',
        onClick: async () => {
          // Gleicher Split, gleiche Blockwoche — nur andere Übungen. Die
          // Leitersprossen bleiben trotzdem stehen: „andere Übungen" heißt
          // Abwechslung, nicht Rückstufung.
          const next = buildPlan(profileForPlan(profile), (plan.seed || 0) + 1, { stufen: rungsInPlan(plan), rang: leiterRang, pausen: tempo });
          next.createdAt = plan.createdAt;
          await setPlan(next);
          await ctx.refreshTraining();
          ctx.reload();
          toast('Neue Übungsauswahl.');
        },
      }, 'Andere Übungen'),
      el('button', {
        class: 'btn grow', type: 'button',
        onClick: () => ctx.startSetup(profile),
      }, 'Angaben ändern')));

  /**
   * Wie viele Sätze je Muskelgruppe in einer normalen Woche zusammenkommen.
   *
   * Die Zahl, die in Trainingsplänen am meisten entscheidet und die man am
   * seltensten sieht — weil man sie über sieben Tage und mehrere Übungen
   * zusammenzählen müsste. Hier steht sie einfach da.
   */
  const volumen = weeklyPlannedSets(plan);
  const volumenKarte = el('div', { class: 'card stack mt-16' },
    el('div', { class: 'row-between' },
      el('h3', { class: 'card-title', text: 'Sätze je Woche' }),
      el('span', { class: 'muted small',
        text: `${plan.days.reduce((sum, d) => sum + (d.exercises || [])
          .reduce((n, p2) => n + forWeek(p2, week).sets, 0), 0)} Sätze gesamt` })),

    el('div', { class: 'card-flush' },
      ...volumen.map((v) => el('div', { class: 'calcrow' },
        el('div', { class: 'grow' },
          el('div', { text: GROUP_LABEL[v.gruppe] || v.gruppe }),
          el('div', { class: 'muted small',
            text: v.mit
              ? `${v.direkt} direkt + ${v.mit} als Helfer · an ${v.tage} ${v.tage === 1 ? 'Tag' : 'Tagen'}`
              : `an ${v.tage} ${v.tage === 1 ? 'Tag' : 'Tagen'}` })),
        el('span', { class: `pill supppill supp-${v.stufe === 'gut' ? 'gut' : v.stufe === 'viel' ? 'mittel' : 'duenn'}`,
          text: v.stufe === 'gut' ? 'im Bereich' : v.stufe === 'viel' ? 'darüber' : 'darunter' }),
        el('div', { class: 'tabular', text: String(v.gesamt) })))),

    el('p', { class: 'hint',
      text: `Als Bereich gelten ${VOLUMEN_UNTEN} bis ${VOLUMEN_OBEN} Sätze je Muskelgruppe und Woche. `
        + 'Darunter verschenkt man etwas, darüber wird der Zugewinn je zusätzlichem Satz so klein, '
        + 'dass er die Erholung selten wert ist — beides sind Mittelwerte, die Streuung zwischen '
        + 'Menschen ist groß.' }),
    el('p', { class: 'hint',
      text: 'Gezählt wird wie in den Übersichtsarbeiten: Sätze, bei denen ein Muskel mitarbeitet, '
        + 'ohne das Ziel zu sein, gehen halb ein. Der Trizeps bekommt beim Bankdrücken etwas ab, '
        + 'auch wenn „Brust" darübersteht. „Rücken" ist dabei keine Muskelgruppe, sondern mehrere — '
        + 'die Zahl dort liest sich höher, als sie für den einzelnen Muskel ist.' }));

  const days = plan.days.map((day) => dayCard(day, week, profile.equipment, tempo, profile, plan.zyklus));

  // Fähigkeiten stehen über den Tagen: sie laufen an jedem Trainingstag,
  // nicht an einem bestimmten.
  const skillIds = profile.skills || [];
  const skillSection = skillIds.length
    ? el('div', null,
        el('h2', { class: 'section-title', text: 'Technik an jedem Trainingstag' }),
        el('div', { class: 'card card-flush' },
          ...skillIds.map((id) => {
            const skill = skillById(id);
            if (!skill) return null;
            const index = levelIndex(skill, ctx.state.skillLevels);
            const level = currentLevel(skill, ctx.state.skillLevels);
            const unit = level.measure === 'sec' ? 's' : 'Wdh.';
            return el('div', { class: 'exrow' },
              el('div', { class: 'grow' },
                el('div', { class: 'exrow-name', text: skill.name }),
                el('div', { class: 'exrow-tag',
                  text: `Stufe ${index + 1} von ${skill.levels.length} · ${level.name}` })),
              el('div', { class: 'exrow-rx tabular' },
                el('strong', { text: `${level.sets} × ${level.target} ${unit}` }),
                el('span', { text: 'vor dem Krafttraining' })));
          }).filter(Boolean)),
        el('p', { class: 'note mt-16',
          text: `Zusammen rund ${skillIds.length * MINUTES_PER_SKILL} Minuten je Einheit. `
            + 'Diese Zeit ist vom Krafttraining abgezogen, damit die Einheit so lang bleibt wie angesagt.' }),
        // Was das konkret kostet. Bei dreißig Minuten und drei Fähigkeiten
        // bleiben zwölf Minuten Kraft — das ist eine Entscheidung, keine
        // Nebensache, und sie gehört in Zahlen statt in einen Halbsatz.
        el('p', { class: 'small' },
          el('strong', { text: `Von deinen ${profile.sessionLength} Minuten je Einheit ` }),
          `gehen ${skillIds.length * MINUTES_PER_SKILL} in die Technik. Für Kraft bleiben `
          + `${Math.max(0, profile.sessionLength - skillIds.length * MINUTES_PER_SKILL)}.`
          + (profile.sessionLength - skillIds.length * MINUTES_PER_SKILL < 20
            ? ' Das ist wenig. Wenn die Kraft wichtiger ist als die Technik, nimm eine '
              + 'Fähigkeit heraus oder verlängere das Zeitfenster — Technikarbeit ist '
              + 'Übung, kein Ersatz für Sätze.'
            : '')))
    : null;

  const nutrition = el('div', null,
    el('h2', { class: 'section-title', text: 'Kalorien zum Plan' }),
    el('div', { class: 'targetgrid' },
      targetCard('Trainingstag', energy.training, 'kcal'),
      targetCard('Ruhetag', energy.rest, 'muted')),
    el('p', { class: 'note mt-16' },
      'An Trainingstagen liegen die Kohlenhydrate höher — sie befeuern die Einheit. ' +
      `Über die Woche kommt trotzdem genau die Summe raus, die dein Ziel braucht: ${energy.target} kcal im Schnitt.`));

  const breakdown = el('div', null,
    el('h2', { class: 'section-title', text: 'Wie die Zahlen entstehen' }),
    el('div', { class: 'card card-flush' },
      ...energyBreakdown(profile, ctx.state.kcalAdjust).map(([label, value, note]) =>
        el('div', { class: 'calcrow' },
          el('div', { class: 'grow' },
            el('div', { text: label }),
            el('div', { class: 'muted small', text: note })),
          el('div', { class: 'tabular', text: value })))));

  const gesperrt = profile.blocked || [];
  const sperrliste = gesperrt.length
    ? el('div', null,
        el('h2', { class: 'section-title', text: 'Aussortierte Übungen' }),
        el('div', { class: 'card stack' },
          el('p', { class: 'small muted',
            text: 'Im Training aussortiert — zu schwer, unangenehm oder schlicht ungeliebt. '
              + 'Sie kommen auch bei einem neuen Plan nicht zurück. Zurückholen geht hier '
              + 'jederzeit.' }),
          ...gesperrt.map((id) => {
            const e = exerciseById(id);
            return el('div', { class: 'row-between' },
              el('span', { text: e ? e.name : id }),
              el('button', {
                class: 'btn btn-sm', type: 'button',
                onClick: async () => {
                  await setTrainingProfile({
                    ...profile, blocked: gesperrt.filter((x) => x !== id),
                  });
                  await ctx.refreshTraining();
                  ctx.reload();
                  toast('Wieder freigegeben — beim nächsten Planbau ist sie dabei.');
                },
              }, 'Wieder zulassen'));
          })))
    : null;

  const erledigt = profile.outgrown || [];
  const leiterliste = erledigt.length
    ? el('div', null,
        el('h2', { class: 'section-title', text: 'Ausgewachsene Übungen' }),
        el('div', { class: 'card stack' },
          el('p', { class: 'small muted',
            text: 'Zu leicht geworden — du bist auf der Variantenleiter darüber '
              + 'hinaus. Anders als aussortierte Übungen sind sie nicht ungeeignet, '
              + 'nur erledigt.' }),
          ...erledigt.map((id) => {
            const e = exerciseById(id);
            const stand = ladderFor(id);
            return el('div', { class: 'row-between' },
              el('div', { class: 'grow' },
                el('div', { text: e ? e.name : id }),
                stand
                  ? el('div', { class: 'muted small',
                      text: `${stand.leiter.name} · Stufe ${stand.index + 1} von ${stand.leiter.stufen.length}` })
                  : null),
              el('button', {
                class: 'btn btn-sm', type: 'button',
                onClick: async () => {
                  await setTrainingProfile({
                    ...profile, outgrown: erledigt.filter((x) => x !== id),
                  });
                  await ctx.refreshTraining();
                  ctx.reload();
                  toast('Wieder im Vorrat.');
                },
              }, 'Zurückholen'));
          })))
    : null;

  const reset = el('div', { class: 'mt-24' },
    el('button', {
      class: 'btn btn-danger btn-block', type: 'button',
      onClick: async () => {
        if (!confirmAction('Trainingsplan, Einheiten, Gewichtsverlauf, Beweglichkeitstests und Fortschrittsfotos löschen? Die Mahlzeiten bleiben erhalten.')) return;
        await clearTraining();
        await ctx.refreshTraining();
        ctx.go('training');
        toast('Trainingsdaten gelöscht.');
      },
    }, 'Training zurücksetzen'));

  mount(container, head, summary, tageEmpfehlung, zeitEmpfehlung, tageBesser, nachschub, pausenPassung, zeitTabelle, volumenKarte, skillSection, ...days, leiterliste, sperrliste, nutrition, breakdown, reset);
}
