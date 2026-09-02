/**
 * Der Tagesüberblick — die Stelle, an der die Teile miteinander reden.
 *
 * Bis hierher wusste jeder Bereich nur von sich: Der Schlaf kannte den Schlaf,
 * das Training das Training, die Kalorien die Kalorien. Wer die Verbindung
 * sehen wollte, musste sie selbst ziehen. Genau die Verbindungen sind aber das,
 * was eine App wie diese überhaupt rechtfertigt — sonst wären es fünf
 * Notizzettel in einer Hülle.
 *
 * Drei Regeln halten das Ding brauchbar:
 *
 * 1. **Höchstens drei Hinweise.** Eine Liste, die alles sagt, sagt nichts. Was
 *    nicht unter die ersten drei kommt, war heute nicht wichtig genug.
 * 2. **Jeder Hinweis nennt etwas Konkretes.** „Achte auf dein Eiweiß" ist keine
 *    Information. „Noch 48 g — das ist ein Becher Magerquark" ist eine.
 * 3. **Es gibt einen guten Zustand.** Wenn alles im Rahmen liegt, steht das da.
 *    Ein Ratgeber, der ausschließlich mahnt, wird weggeklickt und hat dann
 *    recht behalten, ohne je genutzt zu haben.
 *
 * Die Prioritäten sind bewusst gesetzt: Erst was die Zahlen der App selbst
 * verfälscht (Kreatin verschiebt das Gewicht, fehlende Wiegetage machen die
 * Kalorienkorrektur blind), dann was heute noch zu ändern ist, dann der Rest.
 * Eine falsche Zahl richtet mehr Schaden an als ein vergessener Hinweis.
 *
 * Wie training.js ohne DOM-Zugriff.
 */

import { duration as schlafDauer, isComplete as nachtVoll, SOLL_MIN } from './sleep.js';
import { dayTotals } from './activities.js';
import { dailyGoal as wasserZiel, formatMl } from './water.js';
import { resolve as suppsAufloesen, dayStatus as suppStand, daysOn } from './supplements.js';
import { dayPicture } from './mealscore.js';

/** Wie lange nach Beginn einer Kreatin-Einnahme die Wassereinlagerung fällt. */
export const KREATIN_TAGE = 28;

const hinweis = (art, prio, text, aktion = null) => ({ art, prio, text, aktion });

/**
 * Alle Hinweise für einen Tag, nach Dringlichkeit sortiert.
 *
 * @param {object} d
 *   dateKey, jetzt (Date), profile, plan, goals (Tagesziele inkl. Sport),
 *   meals, activities, sportGestern, sleep (alle Nächte), weights, sessions,
 *   water (alle Tage), supps (alle Tage), suppListe (eingerichtete Auswahl),
 *   trainingHeute (Tagesobjekt aus dem Plan oder null), sessionHeute,
 *   pending (wartende Fotos)
 * @returns {{hinweise: Array, alleGut: boolean, geprueft: number}}
 */
export function dailyCoach(d) {
  const alle = [];
  const jetzt = d.jetzt || new Date();
  const stunde = jetzt.getHours();
  const abends = stunde >= 18;
  const spaet = stunde >= 21;

  const kg = d.profile?.weight || null;
  const shift = d.shift;

  /* ---------- Was die eigenen Zahlen verfälscht ---------- */

  // Kreatin lagert Wasser im Muskel ein: in den ersten Wochen typischerweise
  // ein bis zwei Kilo. Die Kalorienkorrektur liest das als Zunahme und würde
  // gegensteuern — das ist der teuerste Fehler, den diese App machen kann.
  const suppListe = suppsAufloesen(d.suppListe || []);
  if (suppListe.some((s) => s.id === 'kreatin') && shift) {
    const tage = daysOn('kreatin', d.supps || [], d.dateKey, shift);
    if (tage > 0 && tage <= KREATIN_TAGE) {
      alle.push(hinweis('warnung', 100,
        `Kreatin seit ${tage} ${tage === 1 ? 'Tag' : 'Tagen'}. In den ersten Wochen lagert `
        + 'der Muskel dadurch ein bis zwei Kilo Wasser ein. Wenn die Waage jetzt steigt, '
        + 'ist das kein Fett — lass die Kalorien, wie sie sind.'));
    }
  }

  // Ohne Wiegetage läuft die Kalorienkorrektur blind.
  const gewichte = [...(d.weights || [])].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!gewichte.length && d.profile) {
    alle.push(hinweis('warnung', 94,
      'Noch kein Gewicht eingetragen. Die Kalorienziele stehen bis dahin auf der Schätzung '
      + 'aus dem Fragebogen — ob sie stimmen, sieht die App erst an der Waage.',
      { text: 'Gewicht eintragen', ziel: 'training' }));
  } else if (gewichte.length) {
    const letzte = gewichte[gewichte.length - 1].date;
    const tage = Math.round(
      (new Date(`${d.dateKey}T12:00:00`) - new Date(`${letzte}T12:00:00`)) / 86400000
    );
    if (tage >= 3) {
      alle.push(hinweis('warnung', 92,
        `Seit ${tage} Tagen kein Gewicht eingetragen. Die App steuert die Kalorien über den `
        + 'Sieben-Tage-Schnitt — ohne Werte kann sie das nicht.',
        { text: 'Gewicht eintragen', ziel: 'training' }));
    }
  }

  // Wartende Fotos zählen nirgends mit, solange sie liegen.
  if ((d.pending || []).length) {
    const n = d.pending.length;
    alle.push(hinweis('warnung', 90,
      `${n} ${n === 1 ? 'Foto wartet' : 'Fotos warten'} auf die Auswertung. Bis dahin `
      + `${n === 1 ? 'fehlt es' : 'fehlen sie'} in jeder Zahl von heute.`));
  }

  /* ---------- Was heute noch zu ändern ist ---------- */

  const summe = (d.meals || []).reduce((s, m) => ({
    kcal: s.kcal + (m.totals?.kcal || 0),
    protein: s.protein + (m.totals?.protein || 0),
  }), { kcal: 0, protein: 0 });

  const ziele = d.goals || null;
  const restKcal = ziele ? ziele.kcal - summe.kcal : null;
  const restProtein = ziele ? ziele.protein - summe.protein : null;

  // Eiweiß ist das einzige Makro, dessen Verfehlen wirklich etwas kostet —
  // daran hängt der Muskelerhalt im Defizit.
  if (ziele && restProtein > 25 && abends) {
    const becher = Math.max(1, Math.round(restProtein / 30));
    alle.push(hinweis('offen', 80,
      `Noch ${Math.round(restProtein)} g Eiweiß bis zum Tagesziel. Das sind etwa `
      + `${becher} ${becher === 1 ? 'Becher' : 'Becher'} Magerquark oder ein Shake `
      + `${becher > 1 ? 'und ein Joghurt' : ''}`.trim() + '.',
      { text: 'Vorschläge ansehen', ziel: 'suggest' }));
  }

  // Deutlich unter dem Kalorienziel und der Tag ist fast vorbei: das ist kein
  // Erfolg, sondern der Weg in den Heißhunger von morgen.
  if (ziele && spaet && restKcal > ziele.kcal * 0.3) {
    alle.push(hinweis('offen', 78,
      `Heute erst ${Math.round(summe.kcal)} von ${ziele.kcal} kcal. Ein so großes Loch holt `
      + 'sich der Körper meistens am nächsten Tag zurück — iss lieber noch etwas.'));
  }

  /* ---------- Wasser ---------- */

  const sportHeute = dayTotals(d.activities || [], kg);
  const trainingMinuten = d.trainingHeute ? (d.profile?.sessionLength || 0) : 0;
  const wZiel = wasserZiel(kg, sportHeute.minuten + trainingMinuten);
  const heuteWasser = (d.water || []).find((w) => w.date === d.dateKey);
  const getrunken = heuteWasser?.ml || 0;

  if (wZiel) {
    const fehlt = wZiel - getrunken;
    if (sportHeute.minuten >= 45 && fehlt > 500) {
      alle.push(hinweis('offen', 76,
        `${sportHeute.minuten} Minuten Sport heben den Richtwert auf ${formatMl(wZiel)}. `
        + `Bisher ${formatMl(getrunken)} — es fehlen noch ${formatMl(fehlt)}.`,
        { text: 'Trinken eintragen', ziel: 'water' }));
    } else if (abends && getrunken > 0 && fehlt > wZiel * 0.45) {
      alle.push(hinweis('offen', 52,
        `Beim Trinken fehlen noch ${formatMl(fehlt)} auf den Richtwert.`,
        { text: 'Trinken eintragen', ziel: 'water' }));
    }
  }

  /* ---------- Schlaf, Koffein, Training ---------- */

  const letzteNacht = (d.sleep || []).find((s) => s.date === d.dateKey);
  const dauer = letzteNacht && nachtVoll(letzteNacht) ? schlafDauer(letzteNacht) : null;
  const kurzeNacht = dauer !== null && dauer < SOLL_MIN - 60;

  if (kurzeNacht && d.trainingHeute && !d.sessionHeute?.completedAt) {
    alle.push(hinweis('achtung', 84,
      `Nur ${Math.floor(dauer / 60)} h ${dauer % 60} min geschlafen. Mach die Einheit ruhig, `
      + 'aber geh eine Wiederholung früher raus als sonst — bei zu wenig Schlaf sinkt die '
      + 'Kraft und die Technik zuerst.'));
  }

  // Koffein und kurze Nächte: der Zusammenhang, den man selbst am schwersten
  // sieht, weil das Einschlafen trotzdem klappt.
  if (suppListe.some((s) => s.id === 'koffein') && kurzeNacht) {
    alle.push(hinweis('achtung', 70,
      'Koffein steht auf deiner Liste und die Nacht war kurz. Nach fünf bis sechs Stunden '
      + 'ist noch die Hälfte im Blut — wer nachmittags nimmt, verliert Tiefschlaf, auch '
      + 'wenn das Einschlafen klappt.'));
  }

  // Harter Sport gestern vor einem Trainingstag.
  const gestern = shift ? shift(d.dateKey, -1) : null;
  if (gestern && d.trainingHeute) {
    const sportGestern = dayTotals(
      (d.sportGestern || []).filter((a) => a.date === gestern), kg
    );
    if (sportGestern.minuten >= 60) {
      alle.push(hinweis('achtung', 66,
        `Gestern ${sportGestern.minuten} Minuten Sport. Wenn die Beine heute schwer sind, `
        + 'ist das die Erklärung — dann lieber sauber und etwas leichter.'));
    }
  }

  // Trainingstag, aber abends noch nichts eingetragen.
  if (d.trainingHeute && abends && !d.sessionHeute?.entries) {
    alle.push(hinweis('offen', 74,
      `Heute steht ${d.trainingHeute.name} an und es ist noch nichts eingetragen.`,
      { text: 'Zum Training', ziel: 'training' }));
  }

  /* ---------- Nahrungsergänzung ---------- */

  if (suppListe.length) {
    const heuteSupps = (d.supps || []).find((s) => s.date === d.dateKey);
    const stand = suppStand(suppListe, heuteSupps);
    if (stand.offen.length && abends) {
      const namen = stand.offen.slice(0, 3).map((s) => s.name).join(', ');
      alle.push(hinweis('offen', 50,
        `Noch offen: ${namen}${stand.offen.length > 3 ? ' und weitere' : ''}.`,
        { text: 'Abhaken', ziel: 'supps' }));
    }
  }

  /* ---------- Verteilung des Eiweißes ---------- */

  const bild = dayPicture(d.meals || [], ziele);
  if (bild && bild.einseitig && abends) {
    alle.push(hinweis('achtung', 46,
      'Mehr als die Hälfte deines Eiweißes steckt heute in einer einzigen Mahlzeit. '
      + 'Verteilt auf drei Portionen nutzt der Muskel es besser als in einem Schwung.'));
  }

  /* ---------- Entlastungswoche ---------- */

  if (d.deload) {
    alle.push(hinweis('info', 40,
      'Entlastungswoche: weniger Sätze und mehr Reserve sind hier so gewollt. Die Zahlen '
      + 'gehen zurück, damit sie danach weitergehen.'));
  }

  /* ---------- Was gut läuft ---------- */

  const gut = [];
  if (ziele && summe.protein >= ziele.protein * 0.95) {
    gut.push(`Eiweiß steht bei ${Math.round(summe.protein)} g`);
  }
  if (wZiel && getrunken >= wZiel * 0.9) gut.push(`${formatMl(getrunken)} getrunken`);
  if (dauer !== null && dauer >= SOLL_MIN) {
    gut.push(`${Math.floor(dauer / 60)} h ${dauer % 60} min geschlafen`);
  }
  if (sportHeute.minuten > 0) gut.push(`${sportHeute.minuten} Minuten Sport`);
  if (d.sessionHeute?.completedAt) gut.push('Einheit erledigt');

  alle.sort((a, b) => b.prio - a.prio);
  const hinweise = alle.slice(0, 3);

  return {
    hinweise,
    lob: gut,
    // „Alles gut" heißt: nichts Dringendes offen und mindestens zwei Dinge stehen.
    alleGut: !hinweise.some((h) => h.art === 'warnung' || h.art === 'offen') && gut.length >= 2,
    weitere: Math.max(0, alle.length - hinweise.length),
  };
}
