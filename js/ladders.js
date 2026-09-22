/**
 * Variantenleitern für Übungen ohne Zusatzgewicht.
 *
 * Mit Hanteln ist die nächste Stufe einfach mehr Gewicht — das erledigt die
 * doppelte Progression. Ohne Gewicht gibt es diesen Weg nicht: irgendwann sind
 * sechzig Liegestütze kein Krafttraining mehr, sondern Ausdauer. Dann muss die
 * Übung schwerer werden, nicht länger.
 *
 * Jede Leiter beschreibt eine Bewegung von leicht nach schwer. Sprossen, die
 * mit der vorhandenen Ausrüstung nicht gehen, werden beim Auf- und Absteigen
 * übersprungen statt vorgeschlagen und dann abgelehnt.
 *
 * Wie training.js ohne DOM-Zugriff.
 */

import { exerciseById, isAvailable, isUnilateral, setSides, repRange } from './training.js';

export const LADDERS = [
  {
    id: 'druecken-waagerecht',
    name: 'Drücken waagerecht',
    stufen: ['pushele', 'pushup', 'pseudopu', 'archerpu', 'onearmneg'],
  },
  {
    id: 'druecken-senkrecht',
    name: 'Drücken über Kopf',
    stufen: ['pikepu', 'pikeele', 'hspuneg', 'hspu'],
  },
  {
    id: 'ziehen-waagerecht',
    name: 'Ziehen waagerecht',
    stufen: ['towelsit', 'towelrow', 'tablerow', 'invrow'],
  },
  {
    id: 'ziehen-senkrecht',
    name: 'Ziehen über Kopf',
    // Der Latzug in Bauchlage stand lange als unterste Sprosse beim
    // waagerechten Ziehen. Falsch einsortiert: Die Arme kommen von über dem
    // Kopf zu den Rippen, das ist die Bewegung des Klimmzugs, nur im Liegen.
    //
    // Auf die senkrechte Leiter gehört er trotzdem nicht. Sie setzt eine
    // Stange voraus, und als unterste Sprosse hätte er jedem Anfänger mit
    // Stange den Bodenlatzug statt der negativen Klimmzüge gegeben — die
    // Stange hinge weiter an der Wand. Er steht deshalb ganz ohne Leiter da:
    // die senkrechte Zugübung für alle, die keine Stange haben.
    stufen: ['negpull', 'chinup', 'pullup'],
  },
  {
    id: 'kniebeuge',
    name: 'Kniebeuge',
    stufen: ['bwsq', 'lunge', 'stepup', 'bulg', 'skater', 'pistol1'],
  },
  {
    id: 'hueftstreckung',
    name: 'Hüftstreckung',
    stufen: ['gbridge', 'gbridge1'],
  },
  {
    id: 'hueftbeuge',
    name: 'Hüfte beugen',
    // Die Bewegung des Kreuzhebens ohne Gewicht: Hüfte nach hinten, Rücken
    // flach. Schwerer wird sie durch ein Bein, nicht durch mehr Wiederholungen.
    stufen: ['bwgm', 'slrdl'],
  },
  {
    id: 'beinbeuger',
    name: 'Knie beugen',
    // Die Lücke, die vorher am größten war: Ohne Geräte stand für die
    // Rückseite der Beine nur die Nordic Curl da — und die ist für die meisten
    // am Anfang schlicht unmöglich. Jetzt führen zwei Sprossen dorthin.
    stufen: ['bridgecurl', 'slidecurl', 'nordic'],
  },
  {
    id: 'trizeps',
    name: 'Trizeps strecken',
    stufen: ['bwskull', 'benchdip', 'diapu'],
  },
  {
    id: 'bizeps',
    name: 'Ellbogen beugen',
    // Der Eigenwiderstand ist die unterste Sprosse: er geht überall, lässt sich
    // aber nicht messen. Darüber das Handtuch, und ganz oben das Rudern im
    // Untergriff — dort hängt endlich ein echtes Gewicht dran, nämlich der
    // eigene Körper, und die Wiederholungen bedeuten etwas.
    //
    // Hier stand der Klimmzug im Untergriff. Der ist eine Rückenübung, und
    // eine Leiter, die mitten drin die Muskelgruppe wechselt, schiebt beim
    // Aufsteigen eine Rückenübung auf den Bizepsplatz. Dieselbe Verwechslung
    // zerriss auch die senkrechte Zugleiter.
    stufen: ['selfcurl', 'towelcurl', 'invcurl'],
  },
];

const LEITER_VON = new Map();
for (const leiter of LADDERS) {
  leiter.stufen.forEach((id, index) => LEITER_VON.set(id, { leiter, index }));
}

/**
 * Leiter und Position einer Übung.
 * @returns {{leiter: object, index: number}|null}
 */
export function ladderFor(exerciseId) {
  return LEITER_VON.get(exerciseId) || null;
}

/** Steht diese Übung überhaupt auf einer Leiter? */
export function hasLadder(exerciseId) {
  return LEITER_VON.has(exerciseId);
}

/**
 * Übungen eines Tages, die auf derselben Leiter stehen.
 *
 * Zwei Sprossen derselben Leiter an einem Tag sind fast immer ein Versehen:
 * Es ist dieselbe Bewegung, einmal schwerer und einmal leichter. Wenn die
 * schwerere geht, ist die leichtere kein Satz mehr, sondern Aufwärmen.
 *
 * Ganz vermeiden lässt es sich nicht. Ohne Ausrüstung stehen zum Beispiel
 * alle sechs Kniebeuge-Varianten auf einer Leiter — ein Beintag mit zwei
 * Kniebeugeplätzen kann dann gar nichts anderes hinstellen. Deshalb gibt
 * diese Funktion nur Auskunft und entscheidet nichts.
 *
 * @param {string[]} ids  Übungs-IDs eines Tages, in der Reihenfolge des Plans
 * @returns {{leiter: object, stufen: {id: string, index: number, platz: number}[]}[]}
 */
export function sameLadderGroups(ids) {
  const nach = new Map();
  (ids || []).forEach((id, platz) => {
    const stand = ladderFor(id);
    if (!stand) return;
    if (!nach.has(stand.leiter.id)) nach.set(stand.leiter.id, { leiter: stand.leiter, stufen: [] });
    nach.get(stand.leiter.id).stufen.push({ id, index: stand.index, platz });
  });
  return [...nach.values()].filter((g) => g.stufen.length > 1);
}

/**
 * Stünde diese Übung auf einer Leiter, die heute schon besetzt ist?
 * Als Prüffunktion für den Tausch gedacht — der soll eine Doppelung meiden,
 * solange es überhaupt etwas anderes gibt.
 */
export function wiederholtBewegung(kandidat, idsImTag) {
  const stand = ladderFor(kandidat && kandidat.id);
  if (!stand) return false;
  return (idsImTag || []).some((id) => {
    const andere = ladderFor(id);
    return andere && andere.leiter.id === stand.leiter.id && id !== kandidat.id;
  });
}

/**
 * Ergänzt die Liste der ausgewachsenen Übungen um alles, was darunter liegt.
 *
 * `outgrown` merkte sich nur die Sprosse, die man gerade verlassen hat. Wer von
 * den Liegestützen über die Pseudo-Planche zu den Archer-Liegestützen gestiegen
 * war, hatte dort `pushup` und `pseudopu` stehen — aber nicht `pushele`, die
 * unterste Sprosse, weil er die nie gemacht hatte. Beim nächsten Planbau war
 * `pushele` damit ein gültiger Kandidat, und der Plan stellte jemanden mit
 * Archer-Liegestützen an die erhöhten Liegestütze.
 *
 * Wer eine Sprosse hinter sich gelassen hat, hat alles darunter auch hinter
 * sich. Das steht hier, weil es Leiterwissen ist und in training.js nicht
 * hingehört.
 */
export function outgrownMitUnterbau(outgrown) {
  const raus = new Set(outgrown || []);
  for (const leiter of LADDERS) {
    let hoechste = -1;
    leiter.stufen.forEach((id, i) => { if (raus.has(id)) hoechste = i; });
    if (hoechste < 0) continue;
    for (let i = 0; i < hoechste; i += 1) raus.add(leiter.stufen[i]);
  }
  return [...raus];
}

/**
 * Sprossennummer einer Übung, oder null. Für buildPlan gedacht: Das
 * Leiterwissen liegt hier, training.js soll es nicht importieren müssen.
 */
export function leiterRang(id) {
  const s = LEITER_VON.get(id);
  return s ? s.index : null;
}

/** Profil mit aufgefüllter Sperrliste — so gehört es in buildPlan. */
export function profileForPlan(profile) {
  if (!profile) return profile;
  return { ...profile, outgrown: outgrownMitUnterbau(profile.outgrown) };
}

/**
 * Welche Sprosse je Leiter in einem Plan steht.
 *
 * Gebraucht beim Neubauen. Ein Plan wird neu gewürfelt, wenn Übungen
 * dazukommen oder man „Andere Übungen" drückt — und dabei ging die
 * Leiterposition verloren: Wer sich von den Liegestützen über die
 * Pseudo-Planche zu den Archer-Liegestützen hochgearbeitet hatte, konnte
 * hinterher wieder bei „Liegestütze erhöht" stehen, der untersten Sprosse.
 * Oder zwei Stufen höher, ohne sie verdient zu haben. Genau das fühlt sich
 * an wie „vor und zurück und keine Verbesserung" — und es ist auch keine.
 *
 * @returns {Set<string>} Übungs-IDs der erreichten Sprossen, eine je Leiter
 */
export function rungsInPlan(plan) {
  const hoechste = new Map();
  for (const day of plan?.days || []) {
    for (const p of day.exercises || []) {
      const s = ladderFor(p.id);
      if (!s) continue;
      // Steht dieselbe Leiter mehrfach im Plan, zählt die höchste Sprosse:
      // Die hat man erreicht, die niedrigere ist Beiwerk.
      const bisher = hoechste.get(s.leiter.id);
      if (!bisher || s.index > bisher.index) hoechste.set(s.leiter.id, { id: p.id, index: s.index });
    }
  }
  return new Set([...hoechste.values()].map((x) => x.id));
}

/**
 * Nächste machbare Sprosse in eine Richtung.
 *
 * @param {string} exerciseId
 * @param {object} profile
 * @param {number} richtung  +1 schwerer, -1 leichter
 * @returns {{exercise: object, index: number, leiter: object, uebersprungen: string[]}|null}
 */
export function neighbourRung(exerciseId, profile, richtung) {
  const stand = ladderFor(exerciseId);
  if (!stand) return null;

  const uebersprungen = [];

  for (let i = stand.index + richtung; i >= 0 && i < stand.leiter.stufen.length; i += richtung) {
    const kandidat = exerciseById(stand.leiter.stufen[i]);
    if (!kandidat) continue;

    // Die eigene Sperrliste zählt, die Liste der ausgewachsenen Übungen nicht:
    // beim Aufsteigen will man ja genau dorthin, und beim Absteigen ist eine
    // erledigte Stufe die richtige Antwort auf „das war zu viel".
    const passt = richtung > 0
      ? isAvailable(kandidat, profile)
      : isAvailable(kandidat, { ...profile, outgrown: [] });

    if (passt) {
      return { exercise: kandidat, index: i, leiter: stand.leiter, uebersprungen };
    }
    uebersprungen.push(kandidat.name);
  }

  return null;
}

export const harderRung = (id, profile) => neighbourRung(id, profile, +1);
export const easierRung = (id, profile) => neighbourRung(id, profile, -1);

/**
 * Aus einer Liste von Kandidaten den nehmen, der auf derselben Leiter am
 * nächsten liegt. Für den Unterwegs-Betrieb: wer den Tisch nicht hat, soll
 * eine Sprosse daneben bekommen und nicht irgendetwas aus derselben Gruppe.
 */
export function pickNearestRung(kandidaten, uebung) {
  if (!kandidaten || !kandidaten.length) return null;
  const stand = ladderFor(uebung && uebung.id);
  if (!stand) return kandidaten[0];

  return [...kandidaten]
    .map((k) => {
      const s = ladderFor(k.id);
      const gleicheLeiter = s && s.leiter.id === stand.leiter.id;
      return {
        k,
        abstand: gleicheLeiter ? Math.abs(s.index - stand.index) : 99,
        // Bei gleichem Abstand die leichtere Sprosse: der Tausch passiert,
        // weil etwas fehlt, nicht weil es zu leicht geworden wäre.
        richtung: gleicheLeiter && s.index > stand.index ? 1 : 0,
      };
    })
    .sort((a, b) => a.abstand - b.abstand || a.richtung - b.richtung)[0].k;
}

/** Mindestens so viele aufgezeichnete Sätze, damit eine Einheit zählt. */
const MIN_SAETZE = 2;

/**
 * Wie oft zuletzt in Folge alle Sätze am oberen Ende des Bereichs lagen.
 *
 * Gezählt wird über die Einheiten, in denen die Übung überhaupt vorkam — eine
 * Woche Pause unterbricht die Serie also nicht.
 *
 * Verlangt wird nicht die heutige Satzzahl, sondern dass mindestens zwei Sätze
 * aufgezeichnet sind. Sonst risse die Serie jedes Mal, wenn die Blockwoche
 * wechselt: die Deload-Woche hat weniger Sätze als die Woche davor, und die
 * alte Einheit sähe rückwirkend unvollständig aus.
 *
 * Welcher Satz zählt, hängt davon ab, ob es eine Hantel gibt — und das war der
 * Fehler, den diese Funktion lange hatte.
 *
 * Mit Zusatzgewicht gilt die klassische doppelte Progression: **alle** Sätze
 * müssen oben ankommen, dann steigt das Gewicht. Das ist erreichbar, weil man
 * das Gewicht so wählen kann, dass es aufgeht.
 *
 * Ohne Zusatzgewicht geht das nicht. Die Übung wiegt, was sie wiegt, und über
 * vier bis fünf gerade Sätze fallen die Wiederholungen unvermeidlich ab.
 * „Alle Sätze oben" war damit praktisch unerfüllbar: Wer dreißig Liegestütze
 * konnte, schrieb 28/24/21/19/18 auf und bekam den Vorschlag für die nächste
 * Stufe trotzdem nie — die Bedingung ging nur auf, wenn man sich künstlich
 * bremste, also genau dann, wenn es zu leicht war. Deshalb zählt hier der
 * **beste** Satz: Wenn der über dem Zielbereich liegt, ist die Variante zu
 * leicht, ganz gleich wie müde die letzten Sätze waren.
 */
export function topOutStreak(sessions, prescription, bisDatum) {
  const [, obere] = repRange(prescription);

  const relevante = [...(sessions || [])]
    .filter((s) => s.date <= bisDatum && (s.entries || {})[prescription.id])
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  let serie = 0;
  for (const session of relevante) {
    const saetze = (session.entries[prescription.id] || []).filter((s) => s && s.reps);
    // Einseitig zählt die schwächere Seite: erst wenn beide oben sind, ist die
    // Übung zu leicht.
    const wert = (satz) => (isUnilateral(prescription.id)
      ? (setSides(satz).schwaechste ?? satz.reps)
      : satz.reps);
    const werte = saetze.map((x) => Number(wert(x)) || 0);
    const massgeblich = prescription.loadless
      ? Math.max(...werte, 0)
      : Math.min(...werte, Infinity);
    const obenAn = saetze.length >= MIN_SAETZE && massgeblich >= obere;
    if (!obenAn) break;
    serie += 1;
  }
  return serie;
}

/** Ab wann die App von sich aus die nächste Stufe vorschlägt. */
export const STREAK_FOR_NEXT = 2;

/**
 * Wie oft zuletzt in Folge nicht einmal der untere Rand erreicht wurde.
 *
 * Das Gegenstück zu topOutStreak, und es hat lange gefehlt. „Zu leicht"
 * erkannte die App von selbst und bot die nächste Sprosse an; „zu schwer"
 * musste man selbst merken und selbst eingreifen. Dabei ist es dieselbe
 * Information, nur andersherum — und die Folgen sind größer: Wer eine Stufe zu
 * hoch steht, macht schlechte Wiederholungen, wird nicht stärker und hört im
 * Zweifel ganz auf.
 *
 * Gezählt wird am **besten** Satz. Wenn nicht einmal der den unteren Rand des
 * Bereichs erreicht, ist die Variante zu schwer — die müden Sätze danach
 * machen es nicht besser. Bei einseitigen Übungen zählt die schwächere Seite,
 * denn die begrenzt.
 *
 * Ausdrücklich nicht gemeldet wird bei Sätzen mit Zusatzgewicht: Da ist die
 * Antwort weniger Gewicht, nicht eine leichtere Variante. Die Leiter ist für
 * Übungen ohne Hantel gedacht, und ein Klimmzug mit Gürtel gehört nicht dazu.
 */
export function bottomOutStreak(sessions, prescription, bisDatum) {
  const [untere] = repRange(prescription);

  const relevante = [...(sessions || [])]
    .filter((s) => s.date <= bisDatum && (s.entries || {})[prescription.id])
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  let serie = 0;
  for (const session of relevante) {
    const saetze = (session.entries[prescription.id] || []).filter((s) => s && s.reps);
    if (saetze.length < MIN_SAETZE) break;
    // Mit Zusatzgewicht ist die Leiter nicht das Mittel der Wahl.
    if (saetze.some((s) => Number(s.weight) > 0)) break;

    const wert = (satz) => (isUnilateral(prescription.id)
      ? (setSides(satz).schwaechste ?? satz.reps)
      : satz.reps);
    const bester = Math.max(...saetze.map((s) => Number(wert(s)) || 0));
    if (bester >= untere) break;
    serie += 1;
  }
  return serie;
}
