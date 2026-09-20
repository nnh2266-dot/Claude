/**
 * Trainingsplanung: Übungsdatenbank, Plangenerator, Satzvorgaben, Progression.
 * Wie nutrition.js bewusst ohne DOM-Zugriff, damit alles einzeln prüfbar bleibt.
 */

import { MINUTES_PER_SKILL } from './skills.js';

/* ---------------- Übungsdatenbank ----------------
   [id, Name, Muskelgruppe, c|i, Umgebung, Einschränkungen, Ausführungshinweis, Einheit]
   Umgebung: g = Studio, d = Kurzhanteln, b = Bänder, w = Körpergewicht
   Einheit:  fehlt = Wiederholungen, 'sek' = Sekunden gehalten
--------------------------------------------------- */

const RAW = [
  // Brust
  ['bp','Bankdrücken Langhantel','brust','c','g','schulter','Schulterblätter zusammen, Ellbogen ~45°.'],
  ['bpdb','Bankdrücken Kurzhantel','brust','c','gd','','Am tiefsten Punkt Dehnung spüren, nicht abfedern.'],
  ['incdb','Schrägbank Kurzhantel','brust','c','gd','','30–35° Neigung, Handgelenke gerade.'],
  ['incbb','Schrägbankdrücken Langhantel','brust','c','g','schulter','Stange zur oberen Brust führen.'],
  ['chpress','Brustpresse Maschine','brust','c','g','','Sitz so, dass die Griffe auf Brusthöhe sind.'],
  ['pushup','Liegestütze','brust','c','gdbw','handgelenk','Körper bleibt eine Linie, Po anspannen.'],
  ['dips','Dips','brust','c','gw','schulter','Leicht vorlehnen für mehr Brust.'],
  ['cfly','Kabel-Fly','brust','i','g','','Leichte Ellbogenbeugung halten, Brust zusammendrücken.'],
  ['dbfly','Kurzhantel-Fly','brust','i','gd','schulter','Kontrolliert öffnen, nur bis Brusthöhe.'],
  ['bfly','Band-Fly','brust','i','b','','Am Endpunkt eine Sekunde halten.'],
  ['bpress','Band-Brustdrücken','brust','c','b','','Band um den Rücken, aus der Brust nach vorn drücken. Am Ende nicht durchdrücken.'],
  ['machfly','Butterfly Maschine','brust','i','g','schulter','Ellbogen auf Brusthöhe, vorn eine Sekunde zusammendrücken.'],
  ['pushele','Liegestütze erhöht','brust','c','w','handgelenk','Hände auf Stuhl oder Tisch — die leichtere Variante.'],
  ['pseudopu','Pseudo-Planche-Liegestütze','brust','c','w','schulter,handgelenk','Hände auf Bauchhöhe, Finger zu den Füßen. Die Schultern über die Hände schieben.'],
  ['archerpu','Archer-Liegestütze','brust','c','w','schulter,handgelenk','Ein Arm beugt, der andere bleibt zur Seite gestreckt. Das Gewicht liegt auf dem beugenden Arm.'],
  ['onearmneg','Einarmige Liegestütze negativ','brust','c','w','schulter,handgelenk','Eine Hand hinter dem Rücken, Füße weit auseinander. Nur langsam ablassen, mit beiden Händen hoch.'],
  ['declpu','Liegestütze Füße erhöht','brust','c','w','schulter,handgelenk','Füße auf Stuhl oder Bett. Je höher die Füße, desto mehr liegt auf Brust und Schultern.'],
  // Rücken, vertikal
  ['pullup','Klimmzüge','ruecken','c','gw','','Brust zur Stange, Schulterblätter zuerst.'],
  ['latpull','Latzug','ruecken','c','g','','Ellbogen nach unten-hinten ziehen.'],
  ['blat','Band-Latzug','ruecken','c','b','','Band über den Türanker, Zug bis zur Brust.'],
  ['negpull','Negativ-Klimmzüge','ruecken','c','gw','','Drei bis fünf Sekunden kontrolliert ablassen.'],
  ['pullover','Überzüge','ruecken','i','gd','schulter','Nur so weit, wie die Rippen unten bleiben.'],
  // Rücken, horizontal
  ['bbrow','Langhantelrudern','ruecken','c','g','ruecken','Rücken flach, Zug zum Bauchnabel.'],
  ['dbrow','Kurzhantelrudern einarmig','ruecken','c','gd','','Hüfte bleibt parallel, kein Rotieren.'],
  ['cabrow','Kabelrudern sitzend','ruecken','c','g','','Brust raus, Ellbogen eng am Körper.'],
  ['tbar','T-Bar Rudern','ruecken','c','g','ruecken','Neutraler Rücken, kein Schwung.'],
  ['brow','Band-Rudern','ruecken','c','b','','Band um die Füße, Ellbogen nach hinten.'],
  ['invrow','Sling- oder Schrägrudern','ruecken','c','gw','','Je flacher der Körper, desto schwerer.'],
  ['tablerow','Rudern unter dem Tisch','ruecken','c','w','','Unter einen stabilen Tisch legen, an der Kante hochziehen. Körper bleibt gerade.'],
  ['towelrow','Handtuch-Rudern am Türrahmen','ruecken','c','w','','Handtuch um den Türgriff, zurücklehnen und zur Tür ziehen. Über die Fußstellung dosieren.'],
  ['superman','Superman am Boden','ruecken','i','w','ruecken','Bauchlage, Arme und Beine anheben, zwei Sekunden halten.'],
  ['towelsit','Handtuch-Rudern im Sitzen','ruecken','c','w','','Langsitz, Handtuch um die Fußsohlen. Ziehen und mit den Beinen dagegenhalten — der Widerstand kommt von dir selbst.'],
  ['pronelat','Latzug in Bauchlage','ruecken','c','w','ruecken','Bauchlage, Arme lang nach vorn. Ellbogen kraftvoll zu den Rippen ziehen, Brust bleibt oben.'],
  ['revsnow','Umgekehrte Schneeengel','ruecken','i','w','','Bauchlage, Handrücken am Boden. Arme flach vom Kopf zur Hüfte streichen und zurück, langsam.'],
  ['rowmach','Rudern Maschine','ruecken','c','g','','Brust ans Polster, Schulterblätter zuerst, dann die Ellbogen.'],
  ['shrug','Nackenheben','ruecken','i','gd','','Gerade nach oben zucken und oben halten. Kein Kreisen.'],
  ['deadhang','Hängen an der Stange','ruecken','i','gw','schulter','Locker hängen, Schultern aktiv nach unten ziehen. Vorbei, wenn der Griff aufgibt.','sek'],
  ['facep','Face Pull','rdelt','i','gb','','Auf Augenhöhe ziehen, Daumen nach hinten.'],
  ['revfly','Reverse Fly','rdelt','i','gd','','Leicht vorgebeugt, Arme fast gestreckt.'],
  ['ytw','Y-T-W am Boden','rdelt','i','w','','Bauchlage, Arme nacheinander in Y-, T- und W-Form anheben. Daumen zeigen nach oben.'],
  ['bpullapart','Band-Auseinanderziehen','rdelt','i','b','','Arme lang auf Brusthöhe, Band auseinanderziehen bis die Schulterblätter zusammenkommen.'],
  ['bwrear','Umgekehrter Flieger in Bauchlage','rdelt','i','w','','Bauchlage, Arme seitlich lang. Langsam anheben, Daumen nach oben, oben eine Sekunde.'],
  // Beine, Vorderseite
  ['squat','Kniebeuge Langhantel','quad','c','g','knie,ruecken','Knie folgen den Fußspitzen, Tiefe nach Beweglichkeit.'],
  ['goblet','Goblet Squat','quad','c','gd','knie','Gewicht vor der Brust, Oberkörper aufrecht.'],
  ['legpress','Beinpresse','quad','c','g','knie','Unterer Rücken bleibt am Polster.'],
  ['bulg','Bulgarian Split Squat','quad','c','gdw','knie','Hinteres Bein nur zum Balancieren nutzen.'],
  ['lunge','Ausfallschritte','quad','c','gdw','knie','Schritt lang genug, Knie über dem Fuß.'],
  ['legext','Beinstrecker','quad','i','g','knie','Oben kurz halten, langsam ablassen.'],
  ['bwsq','Körpergewicht-Kniebeuge','quad','c','w','','Langsam runter, zwei Sekunden halten, explosiv hoch.'],
  ['stepup','Step-Ups','quad','c','gdw','knie','Kraft aus dem oberen Bein, nicht abdrücken.'],
  ['skater','Skater Squat','quad','c','w','knie','Auf einem Bein absenken, das hintere Bein pendelt frei nach hinten. Die Arme balancieren vorn aus.'],
  ['pistol1','Einbeinige Kniebeuge','quad','c','w','knie','Ein Bein gestreckt nach vorn, ganz absenken und aus der Tiefe hoch. Die Ferse bleibt am Boden.'],
  ['hack','Hack Squat','quad','c','g','knie','Füße mittig, ganze Fußsohle belastet.'],
  ['frontsq','Frontkniebeuge','quad','c','g','knie,ruecken','Ellbogen hoch, Oberkörper aufrecht. Verzeiht weniger als die Nackenkniebeuge.'],
  ['cossack','Cossack Squat','quad','c','w','knie','Breiter Stand, auf eine Seite absenken, das andere Bein bleibt gestreckt. Beide Fersen bleiben am Boden.'],
  ['jumpsq','Sprungkniebeuge','quad','c','w','knie','Aus der Kniebeuge explosiv abspringen und leise landen. Qualität vor Menge.'],
  ['wallsit','Wandsitz','quad','i','w','knie','Rücken flach an der Wand, Oberschenkel waagerecht, Hände frei.','sek'],
  // Beine, Rückseite und Hüfte
  ['dl','Kreuzheben','ham','c','g','ruecken','Stange am Körper, Hüfte und Brust steigen gleichzeitig.'],
  ['rdl','Rumänisches Kreuzheben','ham','c','gd','ruecken','Hüfte nach hinten, Rücken flach, Dehnung hinten spüren.'],
  ['legcurl','Beinbeuger','ham','i','g','','Hüfte bleibt unten, kein Hohlkreuz.'],
  ['hipth','Hip Thrust','glute','c','gd','','Rippen unten lassen, oben eine Sekunde zusammendrücken.'],
  ['gbridge','Glute Bridge','glute','c','dw','','Fersen drücken, Po fest anspannen.'],
  ['gbridge1','Einbeinige Glute Bridge','glute','c','dw','','Ein Bein angewinkelt anheben, das Becken bleibt waagerecht — nicht zur Seite kippen.'],
  ['gm','Good Mornings','ham','c','g','ruecken','Leichtes Gewicht, Bewegung aus der Hüfte.'],
  ['nordic','Nordic Curls','ham','i','w','','So weit wie kontrollierbar, dann abfangen.'],
  ['bwgm','Good Morning ohne Gewicht','ham','c','w','ruecken','Hände am Hinterkopf, Hüfte nach hinten schieben, Rücken flach. Die Dehnung gehört hinter den Oberschenkel.'],
  ['bridgecurl','Beckenbrücke mit erhöhten Fersen','ham','c','w','','Fersen auf einem Stuhl, Becken hoch und oben halten. Es zieht hinten, nicht im Rücken.'],
  ['slidecurl','Beinbeuger mit Handtuch','ham','i','w','','Rückenlage, Fersen auf einem Handtuch. Becken oben halten und die Fersen langsam wegschieben.'],
  ['slrdl','Einbeiniges Kreuzheben','ham','c','gdw','ruecken','Standbein leicht gebeugt, das andere pendelt nach hinten. Die Hüfte bleibt waagerecht, nicht aufklappen.'],
  ['kick','Kabel-Kickback','glute','i','g','','Standbein leicht gebeugt, kein Hohlkreuz.'],
  ['bhipth','Band Hip Thrust','glute','c','b','','Band über die Hüfte, oben halten.'],
  ['frogpump','Froschpumpe','glute','i','w','','Rückenlage, Fußsohlen aneinander, Knie nach außen. Kurze kräftige Stöße aus dem Gesäß.'],
  ['bandabd','Band-Abduktion im Stand','glute','i','b','','Band um die Knöchel, Bein seitlich abspreizen. Der Oberkörper bleibt senkrecht.'],
  ['abduct','Abduktionsmaschine','glute','i','g','','Aufrecht sitzen, langsam zurücklassen statt fallen lassen.'],
  // Schultern
  ['ohp','Schulterdrücken Langhantel','schulter','c','g','schulter','Po und Bauch fest, Stange über die Mitte des Kopfes.'],
  ['dbohp','Schulterdrücken Kurzhantel','schulter','c','gd','schulter','Handflächen leicht zueinander drehen.'],
  ['arnold','Arnold Press','schulter','c','gd','schulter','Rotation langsam, kein Schwung.'],
  ['pikepu','Pike Push-Ups','schulter','c','w','schulter','Hüfte hoch, Kopf Richtung Boden.'],
  ['hspuneg','Negative Handstand-Liegestütze','schulter','c','w','schulter,handgelenk','Im Handstand an der Wand langsam ablassen, dann mit den Füßen abstoßen und neu ansetzen.'],
  ['hspu','Handstand-Liegestütze an der Wand','schulter','c','w','schulter,handgelenk','Bauch zur Wand, Ellbogen eng. Kopf setzt kurz auf, dann drücken.'],
  ['pikeele','Pike Push-Ups Füße erhöht','schulter','c','w','schulter,handgelenk','Füße auf einen Stuhl, Hüfte hoch. Der Kopf geht vor die Hände, nicht dazwischen.'],
  ['bohp','Band-Schulterdrücken','schulter','c','b','schulter','Band unter die Füße, aus der Schulter nach oben drücken.'],
  ['wallhs','Handstand an der Wand halten','schulter','i','w','schulter,handgelenk','Bauch zur Wand, Körper lang, Rippen unten. Vorbei, sobald der Rücken durchhängt.','sek'],
  ['latraise','Seitheben Kurzhantel','sdelt','i','gd','','Kleiner Finger führt, nur bis Schulterhöhe.'],
  ['clat','Seitheben Kabel','sdelt','i','g','','Konstante Spannung, langsam ablassen.'],
  ['blat2','Band-Seitheben','sdelt','i','b','','Oben eine Sekunde halten.'],
  ['frontr','Frontheben','sdelt','i','gd','','Kein Schwung aus der Hüfte.'],
  ['bwlat','Seitheben mit Eigenwiderstand','sdelt','i','w','','Die freie Hand drückt von oben auf den hebenden Arm. Langsam heben, noch langsamer senken.'],
  // Bizeps
  ['bbcurl','Langhantel-Curls','bizeps','i','g','handgelenk','Ellbogen bleiben am Körper.'],
  ['dbcurl','Kurzhantel-Curls','bizeps','i','gd','','Ganz strecken, dann sauber beugen.'],
  ['hamcurl','Hammer Curls','bizeps','i','gd','','Neutraler Griff, trainiert auch den Unterarm.'],
  ['ccurl','Kabel-Curls','bizeps','i','g','','Spannung auch unten halten.'],
  ['bcurl','Band-Curls','bizeps','i','b','','Langsam zurücklassen, etwa drei Sekunden.'],
  ['chinup','Chin-Ups','bizeps','c','gw','','Untergriff, Brust zur Stange.'],
  ['towelcurl','Handtuch-Curl','bizeps','i','w','','Handtuch unter einen Fuß, beide Enden greifen und beugen. Das Bein hält dagegen — so schwer, wie du es machst.'],
  ['selfcurl','Curl mit Eigenwiderstand','bizeps','i','w','','Die freie Hand drückt von oben gegen das beugende Handgelenk. Langsam beugen, noch langsamer zurück.'],
  ['invcurl','Rudern im Untergriff unter dem Tisch','bizeps','c','w','','Untergriff an der Tischkante, Ellbogen eng am Körper. Je flacher der Körper, desto schwerer.'],
  // Trizeps
  ['pushdown','Trizepsdrücken Kabel','trizeps','i','g','','Oberarme fixiert, unten kurz halten.'],
  ['cgbp','Enges Bankdrücken','trizeps','c','g','handgelenk,schulter','Griff schulterbreit, Ellbogen eng.'],
  ['ohext','Überkopf-Trizeps','trizeps','i','gd','ellbogen','Dehnung hinten spüren, Ellbogen ruhig.'],
  ['benchdip','Bankdips','trizeps','i','w','schulter,handgelenk','Hüfte nah an der Bank.'],
  ['bpush','Band-Pushdown','trizeps','i','b','','Am Endpunkt den Trizeps fest anspannen.'],
  ['diapu','Diamant-Liegestütze','trizeps','c','w','handgelenk','Hände unter der Brust, Ellbogen eng.'],
  ['bwskull','Strecker am Boden','trizeps','i','w','ellbogen','Im Kniestütz auf die Unterarme absenken, nur aus dem Trizeps zurückdrücken. Der Rumpf bleibt eine Linie.'],
  ['bohext','Band-Überkopf-Trizeps','trizeps','i','b','ellbogen','Band hinter dem Rücken, Oberarme senkrecht. Nur der Ellbogen bewegt sich.'],
  // Waden
  ['calf','Wadenheben stehend','waden','i','gd','','Volle Dehnung unten, oben eine Sekunde.'],
  ['calfm','Wadenheben Maschine','waden','i','g','','Langsames Tempo, keine Wippbewegung.'],
  ['calf1','Wadenheben einbeinig','waden','i','dw','','Auf einer Stufe für mehr Bewegungsumfang.'],
  ['calfbw','Wadenheben beidbeinig','waden','i','w','','Auf einer Stufe, unten voll dehnen, oben eine Sekunde halten.'],
  ['tibia','Zehenheben','waden','i','w','','Rücken an der Wand, Fersen am Boden, Fußspitzen anheben. Der Gegenspieler der Wade, der fast immer fehlt.'],
  // Rumpf
  ['plank','Unterarmstütz','core','i','w','','Po anspannen, Rippen runter. Eine Linie von der Ferse bis zum Kopf.','sek'],
  ['hlr','Hängendes Beinheben','core','i','gw','','Becken einrollen, kein Schwingen.'],
  ['ccrunch','Kabel-Crunch','core','i','g','','Mit den Rippen einrollen, nicht mit der Hüfte.'],
  ['abwheel','Ab Wheel','core','i','gd','ruecken,handgelenk','Nur so weit, wie der Rücken flach bleibt.'],
  ['sideplank','Seitstütz','core','i','w','','Hüfte hoch, Schulter über dem Ellbogen.','sek'],
  ['deadbug','Dead Bug','core','i','w','','Unterer Rücken bleibt am Boden.'],
  ['rtwist','Russian Twist','core','i','dw','ruecken','Die Brustwirbelsäule rotiert, nicht die Lende.'],
  ['hollow','Hohlkörperhalte','core','i','w','','Unterer Rücken bleibt am Boden. Arme und Beine nur so weit ablegen, wie das gelingt.','sek'],
  ['birddog','Bird Dog','core','i','w','','Gegengleich Arm und Bein strecken, das Becken bleibt waagerecht. Oben zwei Sekunden.'],
  ['revcrunch','Umgekehrte Crunches','core','i','w','','Das Becken rollt ein, die Beine machen nur mit. Langsam zurück.'],
  ['mountain','Bergsteiger','core','i','w','handgelenk','Im Stütz die Knie zügig zur Brust ziehen, die Hüfte bleibt tief.'],
  ['palloff','Pallof-Press','core','i','gb','','Seitlich zum Zug stehen, Hände vor der Brust nach vorn drücken. Der Rumpf hält gegen die Drehung.'],
];

export const EXERCISES = RAW.map((r) => ({
  id: r[0], name: r[1], group: r[2], type: r[3], env: r[4],
  avoid: r[5] ? r[5].split(',') : [], cue: r[6],
  // Gehaltene Übungen zählen Sekunden. Vorher stand beim Unterarmstütz ein
  // Wiederholungsfeld und im Hinweis der Satz „Wiederholungen sind hier
  // Sekunden" — das hat die Zahl gerettet, aber nicht die Bedienung: keine
  // Uhr, kein „s" an der Zahl, und in jeder Auswertung tauchte eine Plank
  // mit „45 Wdh." auf.
  einheit: r[7] === 'sek' ? 'sek' : 'wdh',
}));

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function exerciseById(id) {
  return BY_ID.get(id) || null;
}

/** Wird diese Übung in Sekunden gemessen statt in Wiederholungen? */
export function isTimed(id) {
  const e = typeof id === 'string' ? BY_ID.get(id) : id;
  return Boolean(e && e.einheit === 'sek');
}

/**
 * Zielbereich einer Halteübung in Sekunden.
 *
 * Je Übung eigen, weil ein Wandsitz eine andere Größenordnung hat als eine
 * Handstandhaltung. Die Zahlen sind Trainingsbereiche, keine Bestwerte: Wer
 * über dem oberen Rand landet, soll nicht länger halten, sondern die schwerere
 * Variante nehmen — eine Plank über zwei Minuten misst Geduld, nicht Kraft.
 */
export const ZEIT_VORGABE = {
  plank:     [30, 60],
  sideplank: [20, 45],
  hollow:    [15, 40],
  wallsit:   [30, 60],
  deadhang:  [20, 60],
  wallhs:    [20, 60],
};

const ZEIT_STANDARD = [20, 45];

/**
 * Oberer Rand für Übungen ohne Zusatzgewicht.
 *
 * Hier stand einmal 20, mit der Begründung „ohne Hantel läuft der Fortschritt
 * über Wiederholungen, also höhere Zahlen". Der Schluss war falsch. Ohne
 * Hantel läuft der Fortschritt über die **Leiter** — die nächste Sprosse ist
 * der schwerere Reiz, nicht die einundzwanzigste Wiederholung. Bei 20 als
 * Obergrenze kam die Leiter überhaupt nie zum Zug: Wer dreißig Liegestütze
 * konnte, bekam den Vorschlag für die nächste Stufe nie zu sehen.
 *
 * Dazu kommt, dass ausgerechnet die Kombination aus leichter Last und Reserve
 * die schwächste ist, die es gibt. Bei niedriger Last hängt der Reiz stark
 * davon ab, wie nah der Satz ans Versagen geht: 20 % des Maximums bis zum
 * Versagen brachten so viel Muskelwachstum wie 80 % bis zum Versagen, dieselbe
 * leichte Last ohne Versagen aber deutlich weniger (Lasevicius u. a. 2022).
 * Zwanzig Wiederholungen mit zwei im Tank ist genau diese schwache Ecke.
 */
export const LOADLESS_OBEN = 15;

/**
 * Der Zielbereich einer Vorgabe — Wiederholungen oder Sekunden.
 *
 * Bei Halteübungen bewusst aus der Tabelle und nicht aus dem gespeicherten
 * Plan: Pläne, die vor der Umstellung gebaut wurden, tragen dort noch den
 * Wiederholungsbereich von damals. Ihn zu lesen hieße, eine 10-Sekunden-Plank
 * vorzugeben, weil früher „10 Wiederholungen" dastand.
 */
export function repRange(prescription) {
  if (!prescription) return [0, 0];
  if (isTimed(prescription.id)) return ZEIT_VORGABE[prescription.id] || ZEIT_STANDARD;
  // Genauso für den oberen Rand ohne Zusatzgewicht: Pläne, die vor der
  // Umstellung gebaut wurden, tragen dort noch die 20 von früher. Sie stehen zu
  // lassen hieße, weiter bis in den Ausdauerbereich zu schicken, obwohl die
  // Leiter danebensteht — und zwar so lange, bis jemand den Plan neu baut.
  // Deshalb wird hier gedeckelt statt gewandert: kein Eingriff in gespeicherte
  // Daten, und der nächste Trainingstag rechnet schon richtig.
  if (prescription.loadless && prescription.reps) {
    const [unten, oben] = prescription.reps;
    return [Math.min(unten, LOADLESS_OBEN), Math.min(oben, LOADLESS_OBEN)];
  }
  return prescription.reps;
}

/**
 * Zugrichtung der Rückenübungen.
 *
 * „Rücken" war eine Gruppe, und damit waren Klimmzug und Rudern austauschbar.
 * Sie sind es nicht: Senkrechtes Ziehen trifft vor allem den breiten
 * Rückenmuskel und den unteren Kapuzenmuskel, waagerechtes die Rautenmuskeln,
 * den mittleren Kapuzenmuskel und die hintere Schulter. Zwei Übungen derselben
 * Richtung sind ein Reiz zweimal; eine aus jeder Richtung sind zwei Reize.
 *
 * Praktisch fiel das so auf: Wer eine Klimmzugstange hat, bekam sie in einem
 * Dreitageplan nur in vierzehn von fünfundzwanzig Fällen überhaupt zu sehen —
 * die Stange stand herum, während der Plan dreimal ruderte.
 */
export const MUSTER_VERTIKAL = new Set([
  'pullup', 'latpull', 'blat', 'negpull', 'pronelat', 'chinup',
]);

export const MUSTER_HORIZONTAL = new Set([
  'bbrow', 'dbrow', 'cabrow', 'tbar', 'brow', 'invrow', 'tablerow', 'towelrow',
  'towelsit', 'rowmach',
]);

/**
 * Hüftstreckung gegen Kniebeugung an der Beinrückseite.
 *
 * Dieselbe Sache wie bei den Zugrichtungen, nur eine Etage tiefer: „Beine
 * hinten" war eine Gruppe, und damit waren rumänisches Kreuzheben und
 * Beinbeuger austauschbar. Sind sie nicht — das eine streckt die Hüfte, das
 * andere beugt das Knie, und die Beinrückseite kann beides. Ein Plan, der nur
 * Beinbeuger hat, lässt die Hüftstreckung ganz aus, und die ist die Bewegung,
 * die beim Heben aus dem Alltag zählt.
 */
export const MUSTER_HINGE = new Set([
  'dl', 'rdl', 'gm', 'bwgm', 'slrdl', 'hipth', 'gbridge', 'gbridge1', 'bhipth', 'frogpump',
]);

export const MUSTER_KNIE = new Set([
  'legcurl', 'nordic', 'slidecurl', 'bridgecurl',
]);

/**
 * Bewegungsmuster einer Übung, oder null.
 *
 * 'v' senkrechtes Ziehen · 'h' waagerechtes Ziehen
 * 'hinge' Hüftstreckung  · 'knie' Kniebeugung
 *
 * Die Vorlagen geben das Muster als dritten Teil einer Platzangabe mit:
 * `ruecken:c:v` heißt „Rücken, Grundübung, senkrecht".
 */
export function bewegungsmuster(id) {
  if (MUSTER_VERTIKAL.has(id)) return 'v';
  if (MUSTER_HORIZONTAL.has(id)) return 'h';
  if (MUSTER_HINGE.has(id)) return 'hinge';
  if (MUSTER_KNIE.has(id)) return 'knie';
  return null;
}

/** Alter Name, solange noch etwas darauf zeigt. */
export const zugrichtung = bewegungsmuster;

export const GROUP_LABEL = {
  brust: 'Brust', ruecken: 'Rücken', quad: 'Beine vorne', ham: 'Beine hinten',
  glute: 'Gesäß', schulter: 'Schultern', sdelt: 'Seitliche Schulter',
  rdelt: 'Hintere Schulter', bizeps: 'Bizeps', trizeps: 'Trizeps',
  waden: 'Waden', core: 'Rumpf',
};

/**
 * Gruppenbündel, die man an einem Tag als Ganzes weglassen will.
 *
 * Der Fall, für den das gebaut ist: morgen ein Spiel oder Wettkampf. Beine am
 * Vortag sind die eine Sache, die man dann sicher nicht macht — schwere
 * Kniebeugen und Ausfallschritte kosten am nächsten Tag Sprungkraft und
 * Antritt, und zwar messbar. Der Rest der Einheit ist unproblematisch.
 *
 * Bei einem Ganzkörperplan hilft Tauschen dagegen nicht: Beine stehen in jedem
 * der drei Tage. Deshalb braucht es das Weglassen einzelner Gruppen zusätzlich.
 */
export const GRUPPEN_BUENDEL = {
  beine:   { label: 'Beine', gruppen: ['quad', 'ham', 'glute', 'waden'],
             warum: 'Vor einem Spiel oder Wettkampf die wichtigste Auslassung.' },
  druecken:{ label: 'Drücken', gruppen: ['brust', 'schulter', 'trizeps'],
             warum: 'Wenn Schulter oder Ellenbogen zwickt.' },
  ziehen:  { label: 'Ziehen', gruppen: ['ruecken', 'rdelt', 'bizeps'],
             warum: 'Wenn die Stange fehlt oder der Rücken noch müde ist.' },
};

/** Übungen eines Tages ohne die genannten Bündel. */
export function withoutBundles(day, buendel) {
  if (!day || !buendel || !buendel.length) return day;
  const raus = new Set(buendel.flatMap((b) => GRUPPEN_BUENDEL[b]?.gruppen || []));
  if (!raus.size) return day;

  const exercises = (day.exercises || []).filter((rx) => {
    const uebung = exerciseById(rx.id);
    return !uebung || !raus.has(uebung.group);
  });
  return { ...day, exercises };
}

/**
 * Übungen, die ein Gerät brauchen, das nicht jeder zuhause hat.
 * Das ist unabhängig von der Hantelfrage: ein Klimmzug braucht kein Gewicht,
 * aber sehr wohl eine Stange. Bank und Stuhl stehen hier nicht — irgendeine
 * Sitzgelegenheit gibt es überall.
 */
export const GEAR = {
  pullup: 'stange', negpull: 'stange', chinup: 'stange', hlr: 'stange', invrow: 'stange',
  deadhang: 'stange',
  dips: 'barren',
};

export const GEAR_LABEL = {
  stange: 'Klimmzugstange',
  barren: 'Dip-Barren oder zwei stabile Stühle',
};

/**
 * Übungen, die irgendeinen Gegenstand brauchen — auch einen, den man zuhause
 * gar nicht als Ausrüstung wahrnimmt: einen Tisch, unter den man sich legt,
 * einen Türgriff, eine Kante zum Abstützen, eine Erhöhung für den Fuß.
 *
 * Getrennt von GEAR, weil es eine andere Frage beantwortet. GEAR fragt „hast du
 * das angeschafft?", das hier fragt „steht das gerade im Raum?". In einem
 * Hotelzimmer lautet die Antwort auf beides zuverlässig nein, und ein Plan, der
 * einen stabilen Tisch voraussetzt, ist dort kein Plan.
 */
export const NEEDS_OBJECT = new Set([
  'tablerow',   // ein Tisch, der das Körpergewicht trägt
  'towelrow',   // ein Türrahmen mit brauchbarem Griff
  'pushele',    // eine Erhöhung für die Hände
  'benchdip',   // eine Kante hinter dem Rücken
  'bulg',       // eine Erhöhung für den hinteren Fuß
  'stepup',     // eine Stufe in Kniehöhe
  'declpu',     // eine Erhöhung für die Füße
  'pikeele',    // dieselbe Erhöhung, nur höher belastet
  'bridgecurl', // ein Stuhl, auf den die Fersen kommen
  'slidecurl',  // ein Handtuch und ein Boden, auf dem es rutscht
  'invcurl',    // wieder der tragfähige Tisch
  'calfbw',     // eine Stufe, über deren Kante die Ferse sinkt
  // Wandsitz und Handstand an der Wand stehen hier bewusst nicht: Eine Wand
  // hat auch das leerste Hotelzimmer.
]);

/**
 * Kommt diese Übung mit Boden und Wand aus?
 *
 * Drei Bedingungen, und alle drei sind nötig: Sie muss mit dem eigenen Körper
 * gehen (`w`), sie darf kein Gerät brauchen — eine Klimmzugstange steht in
 * keinem Hotelzimmer — und keinen Gegenstand aus NEEDS_OBJECT.
 */
export function floorOnly(exercise) {
  return exercise.env.includes('w')
    && !GEAR[exercise.id]
    && !NEEDS_OBJECT.has(exercise.id);
}

/** Welche Umgebungscodes eine Ausrüstung freischaltet.
 *  Wer ein Studio hat, bekommt keine Band-Übungen vorgeschlagen — dort steht
 *  für dieselbe Bewegung immer das bessere Gerät. */
export const EQUIPMENT_CODES = { studio: 'gdw', home: 'dw', band: 'bw', bw: 'w' };

export const EQUIPMENT_LABEL = {
  studio: 'Fitnessstudio', home: 'Kurzhanteln zuhause',
  band: 'Widerstandsbänder', bw: 'nur Körpergewicht',
};

export const LIMIT_LABEL = {
  knie: 'Knie', schulter: 'Schulter', ruecken: 'Unterer Rücken',
  handgelenk: 'Handgelenk', ellbogen: 'Ellbogen',
};

/**
 * Was man tun kann, wenn eine Gruppe geschont wird.
 *
 * Übungen herauszunehmen ist die halbe Antwort. Die andere Hälfte ist der
 * Umweg, den es fast immer gibt — und den eine App nennen kann, ohne sich als
 * Arzt aufzuspielen. Beim Handgelenk ist er entscheidend: Ohne Geräte fällt
 * sonst jedes Drücken weg, weil die flache Hand am Boden das Gelenk streckt.
 */
export const LIMIT_AUSWEG = {
  handgelenk: 'Nicht das Drücken ist das Problem, sondern die gestreckte Hand am Boden. '
    + 'Auf Fäusten oder auf Liegestützgriffen bleibt das Gelenk gerade — damit geht '
    + 'meist, was flach auf der Hand wehtut. Ziehen, Beine und Rumpf sind ohnehin frei.',
  schulter: 'Über Kopf ist meist das Problem, nicht Drücken an sich. Enger Ellbogen und '
    + 'nur so weit hinunter, wie es ruhig bleibt. Ziehen zum Bauch geht oft, wenn Ziehen '
    + 'von oben wehtut.',
  ruecken: 'Belastung mit rundem Rücken meiden, nicht Belastung überhaupt. Rumpfarbeit im '
    + 'Liegen (Dead Bug, Unterarmstütz) ist in der Regel unproblematisch.',
  knie: 'Der schmerzhafte Bereich ist meist die tiefe Beugung. Kürzerer Weg und langsames '
    + 'Ablassen gehen oft, wo die volle Kniebeuge nicht geht. Hüftstrecken im Liegen ist frei.',
  ellbogen: 'Meist trifft es die gestreckte Endposition und enge Griffe. Neutraler Griff '
    + 'und weniger Bewegungsumfang helfen häufig.',
};

/** Der Satz, der bei jeder Schonung gilt und den keine App ersetzen kann. */
export const SCHONUNG_ARZT = 'Schmerzen, die länger als ein bis zwei Wochen bleiben, nachts '
  + 'wehtun oder mit Taubheit einhergehen, gehören ärztlich abgeklärt. Diese App kann '
  + 'Übungen herausnehmen, mehr nicht — und Trainieren gegen den Schmerz macht es schlimmer.';

/** Ersatzgruppe, wenn eine Muskelgruppe mit der vorhandenen Ausrüstung gar
 *  nicht trainierbar ist — etwa die seitliche Schulter ohne jedes Gerät. */
const FALLBACK_GROUP = {
  sdelt: 'schulter', rdelt: 'ruecken', glute: 'ham', waden: 'quad', ham: 'glute',
  // Ohne Stange und Hanteln bleibt für die Arme nichts Eigenes übrig. Rudern
  // trainiert den Bizeps mit, Drücken den Trizeps — besser als ein leerer Slot.
  bizeps: 'ruecken', trizeps: 'brust',
};

/* ---------------- Splits ---------------- */

const SLOTS = {
  // Waden stehen am Ende der Ganzkörpertage, nicht mittendrin: Sie fallen als
  // Erstes weg, wenn die Zeit knapp ist, und das ist richtig so. Ohne sie
  // bekam ein Dreitageplan aber gar keinen einzigen Wadensatz — über den
  // Überhang kommen sie jetzt reihum dran.
  fbA:   ['brust:c','ruecken:c:v','quad:c','ham:c:hinge','sdelt:i','trizeps:i','bizeps:i','core:i','waden:i'],
  fbB:   ['schulter:c','ruecken:c:h','ham:c:hinge','quad:c','brust:i','bizeps:i','trizeps:i','core:i','waden:i'],
  fbC:   ['brust:c','ruecken:c:v','quad:c','glute:c','sdelt:i','rdelt:i','bizeps:i','core:i','waden:i'],
  push:  ['brust:c','schulter:c','brust:c','sdelt:i','trizeps:i','trizeps:i','core:i'],
  pull:  ['ruecken:c:v','ruecken:c:h','ruecken:c','rdelt:i','bizeps:i','bizeps:i','core:i'],
  legs:  ['quad:c','ham:c:hinge','quad:c','ham:i','glute:c','waden:i','core:i'],
  // Die hintere Schulter stand hier lange nicht drin — und weil der
  // Vier-Tage-Plan aus Oberkörper und Unterkörper besteht, bekam sie damit in
  // der ganzen Woche keinen einzigen Satz. Rudern trifft sie mit, aber wer viel
  // drückt, braucht sie direkt: Die Empfehlung lautet, das Zugvolumen mindestens
  // so hoch zu halten wie das Drückvolumen.
  // Beide Zugrichtungen stehen vorn: Bei kurzen Einheiten fällt das Ende weg,
  // und dabei verschwand bisher das waagerechte Ziehen ganz.
  upper: ['brust:c','ruecken:c:v','ruecken:c:h','schulter:c','rdelt:i','sdelt:i','bizeps:i','trizeps:i'],
  lower: ['quad:c','ham:c:hinge','quad:c','ham:i','glute:c','waden:i','core:i'],
};

const SPLITS = {
  1: { name: 'Ganzkörper', days: [['Ganzkörper','fbA']] },
  2: { name: 'Ganzkörper 2×', days: [['Ganzkörper A','fbA'],['Ganzkörper B','fbB']] },
  3: { name: 'Ganzkörper 3×', days: [['Ganzkörper A','fbA'],['Ganzkörper B','fbB'],['Ganzkörper C','fbC']] },
  '3ppl': { name: 'Push / Pull / Beine', days: [['Push','push'],['Pull','pull'],['Beine','legs']] },
  4: { name: 'Oberkörper / Unterkörper', days: [['Oberkörper A','upper'],['Unterkörper A','lower'],['Oberkörper B','upper'],['Unterkörper B','lower']] },
  5: { name: 'Push / Pull / Beine + OK / UK', days: [['Push','push'],['Pull','pull'],['Beine','legs'],['Oberkörper','upper'],['Unterkörper','lower']] },
  6: { name: 'Push / Pull / Beine 2×', days: [['Push A','push'],['Pull A','pull'],['Beine A','legs'],['Push B','push'],['Pull B','pull'],['Beine B','legs']] },
};

/** Schwerpunkt → zusätzlicher Slot, und an welchen Tagen er sinnvoll ist. */
const FOCUS_SLOT = { brust:'brust:i', ruecken:'ruecken:c', beine:'quad:i', schulter:'sdelt:i', arme:'bizeps:i', po:'glute:c', core:'core:i' };
const FOCUS_DAYS = {
  brust: ['push','fbA','upper'], ruecken: ['pull','fbB','upper'], beine: ['legs','lower','fbA'],
  schulter: ['push','upper','fbB'],
  // Ohne einen Ganzkörpertag lief der Schwerpunkt „Arme" ins Leere: die Liste
  // kannte nur die Tage der Split-Pläne, und wer dreimal Ganzkörper trainiert,
  // bekam denselben Plan wie ohne Schwerpunkt.
  arme: ['pull','push','upper','fbB'],
  po: ['legs','lower','fbC'],
  core: ['fbA','legs','lower'],
};

export const FOCUS_LABEL = {
  brust: 'Brust', ruecken: 'Rücken', schulter: 'Schultern', arme: 'Arme',
  beine: 'Beine', po: 'Gesäß', core: 'Bauch',
};

/* ---------------- Satzvorgaben ---------------- */

/**
 * Auf welcher Sprosse eine Leiter beginnt, wenn nichts anderes bekannt ist.
 * Nur der Einstieg — hoch und runter geht es danach über die Leiterknöpfe.
 */
export const EINSTIEGSSPROSSE = { anfaenger: 0, fortgeschritten: 1, erfahren: 2 };

/**
 * Weniger als zwei Sätze je Übung sind kein Trainingsreiz mehr.
 * Der Boden, unter dem das Zeitfenster nicht mehr durch Kürzen zu halten ist.
 */
export const SAETZE_MINDESTENS = 2;

/**
 * Bis hierher werden Sätze gesenkt, bevor eine Übung weichen muss. Drei Sätze
 * sind ein brauchbarer Reiz; darunter ist eine Übung weniger der bessere Handel.
 */
export const SAETZE_BEQUEM = 3;

/**
 * Wie viele Minuten dem Kraftteil mindestens bleiben, auch wenn die
 * Technikarbeit das Zeitfenster fast ausfüllt. Drei Übungen zu zwei Sätzen
 * sind ungefähr das.
 */
export const KRAFT_MINDESTENS = 12;

const LEVELS = {
  anfaenger:       { compound: 3, isolation: 2, rir: 3 },
  fortgeschritten: { compound: 4, isolation: 3, rir: 2 },
  erfahren:        { compound: 4, isolation: 3, rir: 1 },
};

export const LEVEL_LABEL = {
  anfaenger: 'Anfänger', fortgeschritten: 'Fortgeschritten', erfahren: 'Erfahren',
};

export const GOAL_LABEL = {
  abnehmen: 'Fett verlieren', form: 'Form verbessern', aufbau: 'Muskeln aufbauen',
};

/**
 * Übungen ohne Zusatzgewicht: der Fortschritt läuft über schwerere Varianten
 * statt über die Hantel. Siehe LOADLESS_OBEN — gerade deshalb bleibt der obere
 * Rand niedrig, statt hoch zu sein.
 */
function isLoadless(exercise, profile) {
  return profile.equipment === 'bw' || profile.equipment === 'band' || exercise.env === 'w';
}

function prescribe(exercise, profile, isFirst) {
  const level = LEVELS[profile.level] || LEVELS.fortgeschritten;
  const sets = (exercise.type === 'c' ? level.compound : level.isolation) + (isFirst ? 1 : 0);
  const loadless = isLoadless(exercise, profile);

  let reps;
  if (exercise.einheit === 'sek') reps = ZEIT_VORGABE[exercise.id] || ZEIT_STANDARD;
  else if (exercise.group === 'core') reps = [10, 20];
  else if (loadless) reps = exercise.type === 'c' ? [10, LOADLESS_OBEN] : [12, LOADLESS_OBEN];
  else if (exercise.type === 'c') reps = profile.goal === 'aufbau' ? [5, 8] : [6, 10];
  else reps = [10, 15];

  return {
    id: exercise.id,
    sets,
    reps,
    // Mitgeschrieben, damit ein Bericht die Einheit kennt, ohne die
    // Übungstabelle zu befragen. Gelesen wird sie trotzdem dort — alte Pläne
    // haben das Feld nicht.
    einheit: exercise.einheit,
    rir: level.rir,
    loadless,
    rest: baseRest(exercise, loadless),
  };
}

/* ---------------- Pausen ---------------- */

/**
 * Grundpause einer Übung in Sekunden.
 *
 * Die Pause richtet sich danach, was sie erholen muss. Eine schwere Kniebeuge
 * mit der Langhantel braucht das Kreislaufsystem zurück — zweieinhalb Minuten.
 * Zwanzig Liegestütze bei vier Wiederholungen Reserve brauchen das nicht: dort
 * ist nach anderthalb Minuten alles zurück, was zurückkommt, und der Rest ist
 * Wartezeit. Bei Rumpfübungen noch weniger.
 *
 * Vorher stand hier pauschal 150 beziehungsweise 75 Sekunden, unabhängig von
 * Last und Übung. Bei sieben Übungen ohne Gewicht summierte sich das auf über
 * eine halbe Stunde bloßes Dastehen.
 */
export function baseRest(exercise, loadless) {
  // Eine Halteübung geht bis nah ans Zittern — danach sind 45 Sekunden zu
  // wenig, um den nächsten Satz sauber zu halten.
  if (exercise.einheit === 'sek') return 60;
  if (exercise.group === 'core') return 45;
  if (loadless) return exercise.type === 'c' ? 90 : 60;
  return exercise.type === 'c' ? 150 : 75;
}

/** Wie lang die Pausen insgesamt ausfallen sollen. */
export const REST_TEMPO = {
  kurz:   { faktor: 0.7, label: 'Kurz', hint: 'Dichter dran, mehr Puls. Die letzten Sätze werden zäher.' },
  normal: { faktor: 1,   label: 'Normal', hint: 'Genug Erholung für saubere Sätze, ohne Leerlauf.' },
  lang:   { faktor: 1.3, label: 'Lang', hint: 'Für schwere Sätze nahe am Versagen.' },
};

/**
 * Die tatsächliche Pause: Grundwert mal gewähltem Tempo, auf fünf Sekunden
 * gerundet und nach unten begrenzt.
 *
 * Bewusst hier gerechnet und nicht im Plan gespeichert — sonst müsste der Plan
 * neu gebaut werden, nur weil jemand am Tempo dreht, und bestehende Pläne
 * behielten ihre alten, zu langen Werte.
 */
export function restSeconds(prescription, tempo = 'normal') {
  const exercise = exerciseById(prescription.id);
  const basis = exercise
    ? baseRest(exercise, prescription.loadless)
    : (prescription.rest || 90);
  const faktor = (REST_TEMPO[tempo] || REST_TEMPO.normal).faktor;
  return Math.max(30, Math.round((basis * faktor) / 5) * 5);
}

/**
 * Geschätzte Dauer einer Einheit in Minuten: Arbeitszeit plus Pausen.
 *
 * Ein Satz dauert grob so lange, wie er Wiederholungen hat, mal drei Sekunden,
 * plus etwas Aufbau. Ein gehaltener Satz dauert genau seine Sekunden — dort
 * wäre das Dreifache glatt falsch.
 *
 * **Einseitige Übungen zählen doppelt.** „3 Sätze Bulgarian Split Squat" heißt
 * dreimal links und dreimal rechts, also sechs Sätze Arbeit — und genau so
 * fühlt es sich auch an. Bisher zählte die Schätzung nur die Zahl aus dem Plan
 * mit. Ein Unterkörpertag ohne Geräte hat davon drei bis vier Übungen; aus
 * 19 geplanten Sätzen werden dort 27 tatsächliche, und die Schätzung lag um
 * ein Drittel zu niedrig.
 *
 * Zwischen den Seiten steht eine halbe Pause: Man setzt um, atmet einmal
 * durch, macht weiter — aber nicht die volle Pause wie zwischen zwei Sätzen.
 */
export function sessionMinutes(exercises, tempo = 'normal') {
  let sekunden = 0;
  for (const p of exercises || []) {
    const [unten, oben] = repRange(p);
    const mitte = (unten + oben) / 2;
    const satz = (isTimed(p.id) ? Math.round(mitte) : Math.round(mitte * 3)) + 15;
    const pause = restSeconds(p, tempo);
    const seiten = isUnilateral(p.id) ? 2 : 1;
    sekunden += p.sets * satz * seiten
      + Math.max(0, p.sets - 1) * pause
      + (seiten === 2 ? p.sets * pause * 0.5 : 0);
  }
  return Math.round(sekunden / 60);
}

/**
 * Wie viele Sätze tatsächlich zu machen sind — einseitige doppelt gezählt.
 *
 * Bewusst getrennt von der Volumenrechnung: Fürs Wachstum eines Muskels sind
 * fünf Sätze einbeinige Glute Bridge fünf Sätze, nicht zehn — die andere Seite
 * ist ein anderes Bein. Für die Frage „wie lange stehe ich hier und wie oft
 * muss ich anfangen" sind es aber zehn, und das ist die Zahl, die man beim
 * Üben spürt.
 */
export function tatsaechlicheSaetze(exercises, week = 2) {
  return (exercises || []).reduce(
    (s, p) => s + forWeek(p, week).sets * (isUnilateral(p.id) ? 2 : 1), 0);
}

/**
 * Übungen, die je Seite einzeln gemacht werden.
 *
 * Eine Zahl für beide Seiten verschenkt genau die Information, die zählt: wer
 * links zehn und rechts sieben schafft, hat kein Zehner-Ergebnis, sondern ein
 * Ungleichgewicht. Für Auswertung und Fortschritt zählt deshalb die schwächere
 * Seite, fürs Volumen die Summe.
 */
export const UNILATERAL = new Set([
  'bulg', 'lunge', 'stepup', 'skater', 'pistol1', 'gbridge1',
  'calf1', 'dbrow', 'kick', 'towelcurl', 'selfcurl', 'archerpu', 'onearmneg',
  'slrdl', 'cossack', 'bwlat', 'bandabd', 'sideplank',
]);

export const isUnilateral = (id) => UNILATERAL.has(id);

/**
 * Die Wiederholungen eines Satzes, aufgelöst nach Seiten.
 * Alte Einträge ohne zweite Seite bleiben gültig — dort ist `reps` beides.
 */
export function setSides(satz) {
  if (!satz) return { links: null, rechts: null, schwaechste: null, summe: 0 };
  const links = typeof satz.reps === 'number' ? satz.reps : null;
  const rechts = typeof satz.reps2 === 'number' ? satz.reps2 : null;

  if (links === null && rechts === null) return { links, rechts, schwaechste: null, summe: 0 };
  if (rechts === null) return { links, rechts, schwaechste: links, summe: links * 2 };
  if (links === null) return { links, rechts, schwaechste: rechts, summe: rechts * 2 };
  return { links, rechts, schwaechste: Math.min(links, rechts), summe: links + rechts };
}

/* ---------------- Verfügbarkeit ---------------- */

/**
 * Kommt diese Übung für dieses Profil überhaupt infrage?
 *
 * Bewusst eine einzige Stelle: Plangenerator, Tausch und Variantenleiter haben
 * das vorher jeweils selbst geprüft, und jede Erweiterung — erst die Geräte,
 * dann die Sperrliste, jetzt die ausgewachsenen Übungen — musste an drei
 * Stellen nachgezogen werden.
 */
export function isAvailable(exercise, profile, { ignoriereSperren = false } = {}) {
  if (!exercise) return false;

  const codes = EQUIPMENT_CODES[profile.equipment] || EQUIPMENT_CODES.studio;
  const gear = profile.equipment === 'studio' ? Object.keys(GEAR_LABEL) : (profile.gear || []);
  const limits = profile.limits || [];

  if (![...exercise.env].some((c) => codes.includes(c))) return false;
  if (exercise.avoid.some((a) => limits.includes(a))) return false;
  if (GEAR[exercise.id] && !gear.includes(GEAR[exercise.id])) return false;

  if (ignoriereSperren) return true;
  if ((profile.blocked || []).includes(exercise.id)) return false;
  // Ausgewachsene Übungen kommen nicht zurück in den Plan — anders als
  // gesperrte sind sie nicht ungeeignet, sondern erledigt.
  if ((profile.outgrown || []).includes(exercise.id)) return false;
  return true;
}

/* ---------------- Plangenerator ---------------- */

/**
 * `seed` verschiebt die Übungsauswahl, ohne Split und Struktur zu ändern —
 * dafür gibt es in der Ansicht den Knopf „Andere Übungen wählen".
 *
 * Baut den Wochenplan aus dem Profil.
 *
 * `stufen` ist eine Menge von Übungs-IDs, die bevorzugt wieder genommen werden
 * sollen — die Sprossen, auf denen man gerade steht. Ohne das würfelt jeder
 * Neubau die Sprosse neu, und mühsam erarbeiteter Fortschritt löst sich auf.
 *
 * `rang(id)` liefert die Sprossennummer einer Übung oder null. Damit nimmt der
 * Generator ohne Vorgeschichte die unterste offene Sprosse statt einer
 * beliebigen. Beide Auskünfte kommen von außen, weil das Leiterwissen in
 * ladders.js liegt und diese Datei es nicht importieren darf.
 */
export function buildPlan(profile, seed = 0, { stufen = null, rang = null, pausen = null } = {}) {
  // Ausrüstung, Gerät, Beschwerden, Sperrliste und ausgewachsene Übungen
  // stecken alle in isAvailable.
  const usable = EXERCISES.filter((e) => isAvailable(e, profile));

  let key = profile.days;
  // Drei Tage waren für alle außer Anfänger Push/Pull/Beine. Das heißt: Jede
  // Muskelgruppe kommt genau einmal die Woche dran, und ihr gesamtes Volumen
  // liegt in einer einzigen Einheit — auf dem Zugtag sind das 13 bis 16 Sätze
  // für den Rücken. Die Meta-Analysen sagen dazu zweierlei: Die Häufigkeit
  // selbst ist bei gleichem Volumen nebensächlich, aber innerhalb einer Einheit
  // ist bei etwa elf Sätzen je Gruppe der Punkt erreicht, ab dem ein weiterer
  // Satz nichts Messbares mehr beiträgt. Beides zusammen macht Push/Pull/Beine
  // an drei Tagen zur schlechteren Wahl — das gleiche Volumen auf drei
  // Ganzkörpertage verteilt wirkt mehr.
  //
  // Wer es trotzdem will, stellt es im Plan um; dafür steht splitKey im Profil.
  if (profile.splitKey && SPLITS[profile.splitKey]) key = profile.splitKey;
  const split = SPLITS[key] || SPLITS[3];

  // Die Übungszahl folgt der Zeit pro Einheit. Wie lange eine Übung dauert,
  // hängt vor allem an der Pause: mit der Langhantel sind es zweieinhalb
  // Minuten zwischen den Sätzen, ohne Zusatzgewicht anderthalb. Acht Minuten
  // je Übung galten für alle — das stammt aus der Zeit vor den kürzeren
  // Pausen und ließ eine Einheit ohne Gewichte kürzer ausfallen, als sie sein
  // dürfte. Genau eine Position der Vorlage fiel dadurch immer weg.
  const skillMinutes = (profile.skills || []).length * MINUTES_PER_SKILL;
  // Der Boden lag bei zwanzig Minuten. Damit schob die Technikarbeit die
  // Einheit über das Zeitfenster hinaus, ohne dass jemand etwas davon sah:
  // Bei dreißig Minuten Vorgabe und drei Fähigkeiten blieben zwanzig Minuten
  // Kraft plus achtzehn Minuten Technik — achtunddreißig statt dreißig.
  //
  // Jetzt liegt er bei zwölf. Darunter lohnt sich der Kraftteil nicht mehr:
  // drei Übungen zu zwei Sätzen sind ungefähr das. Reicht auch das nicht,
  // sagt die Planansicht, dass die Technik das Fenster auffrisst — kürzen
  // lässt sich das nicht mehr, entscheiden muss man es.
  const strengthMinutes = Math.max(KRAFT_MINDESTENS, profile.sessionLength - skillMinutes);
  const ohneGewicht = profile.equipment === 'bw' || profile.equipment === 'band';
  const minutenProUebung = ohneGewicht ? 5.5 : 8;
  // Ohne Technik bleibt es bei mindestens vier Übungen. Mit Technik darf es eine
  // weniger sein — die Einheit ist dann trotzdem voll.
  const fewest = skillMinutes > 0 ? 3 : 4;
  const perSession = Math.min(9, Math.max(
    fewest, Math.round((strengthMinutes - 8) / minutenProUebung)
  ));

  const rotation = {};
  const vorlagenZaehler = {};
  /** Welche Bewegungsmuster diese Woche schon vorkommen. */
  const gedeckteMuster = new Set();

  /** Gemeinsame Auswahlregel für Platzangaben und Auffüller. */
  const waehleMitSprosse = (kandidaten, n) => {
    if (rang) {
      const aufLeiter = kandidaten.filter((e) => rang(e.id) !== null);
      if (aufLeiter.length) {
        const einstieg = EINSTIEGSSPROSSE[profile.level] ?? 0;
        const abEinstieg = aufLeiter.filter((e) => rang(e.id) >= einstieg);
        const auswahl = abEinstieg.length ? abEinstieg : aufLeiter;
        return auswahl.reduce((a, e) => (rang(e.id) < rang(a.id) ? e : a));
      }
    }
    return kandidaten[n % kandidaten.length];
  };

  const erstesVorkommen = {};
  const pick = (spec, usedToday) => {
    const [group, type, muster] = spec.split(':');
    // Erst mit Muster, dann ohne. Ohne Stange und ohne Latzug bleibt für
    // senkrechtes Ziehen nur der Latzug in Bauchlage — gibt es auch den nicht,
    // ist eine Ruderübung besser als eine leere Stelle.
    let pool = muster
      ? usable.filter((e) => e.group === group && e.type === type && bewegungsmuster(e.id) === muster)
      : [];
    if (!pool.length) pool = usable.filter((e) => e.group === group && e.type === type);
    if (!pool.length) pool = usable.filter((e) => e.group === group);
    if (!pool.length && FALLBACK_GROUP[group]) pool = usable.filter((e) => e.group === FALLBACK_GROUP[group]);

    const free = pool.filter((e) => !usedToday.has(e.id));
    if (!free.length) return null; // keine Übung zweimal am selben Tag

    // Steht für eine Leiter eine erreichte Sprosse fest, wird genau die
    // genommen — sofern sie überhaupt zur Wahl steht. Sonst würde der Neubau
    // den Fortschritt auf dieser Leiter zurücksetzen.
    if (stufen) {
      // `stufen` ist eine Menge von Übungs-IDs: die Sprossen, auf denen man
      // gerade steht. Welche Sprosse zu welcher Leiter gehört, weiß ladders.js
      // — und das darf training.js nicht importieren, sonst drehen sich die
      // beiden Dateien im Kreis. Deshalb kommen beide Auskünfte von außen.
      const gehalten = free.find((e) => stufen.has(e.id));
      if (gehalten) return gehalten;
    }

    // Ohne Vorgeschichte: die unterste noch offene Sprosse ab dem Einstieg.
    // Eine Leiter geht man Stufe für Stufe hoch — wer die ersten drei Sprossen
    // hinter sich hat, steht als Nächstes auf der vierten und nicht zufällig
    // auf der fünften. Für alles ohne Leiter bleibt es beim Reihum.
    //
    // Der Einstieg richtet sich nach der Erfahrung: Ein Anfänger fängt unten
    // an, wer sich als fortgeschritten einträgt, eine Sprosse höher. Sonst
    // stünden erhöhte Liegestütze im Plan von jemandem, der seit Jahren
    // trainiert — und der tippt sich dann dreimal hoch, bevor es losgeht.
    const n = (rotation[spec] = rotation[spec] || 0) + seed;
    rotation[spec]++;
    return waehleMitSprosse(free, n);
  };

  const days = split.days.map(([name, template], index) => {
    let specs = SLOTS[template].slice();

    for (const focus of profile.focus || []) {
      if ((FOCUS_DAYS[focus] || []).includes(template) && FOCUS_SLOT[focus]) {
        specs.splice(Math.min(3, specs.length), 0, FOCUS_SLOT[focus]);
      }
    }
    // Passt die Vorlage trotzdem nicht in die Zeit, fällt das Ende weg — und
    // ohne Zutun auf jedem Tag dasselbe. Über eine Woche sah eine Gruppe
    // dadurch nie eine Übung. Deshalb rotiert der Überhang mit dem Tag: mal
    // steht die vorletzte Position drin, mal die letzte.
    if (specs.length > perSession) {
      const fest = specs.slice(0, perSession - 1);
      const ueberhang = specs.slice(perSession - 1);
      // Zwei Zähler, weil zwei Fälle danebengehen können.
      //
      // Nur der Tagesindex: Bei Oberkörper/Unterkörper liegen beide
      // Oberkörpertage auf geraden Indizes, 0 und 2. Bei zwei Überhangposten
      // ergibt das zweimal denselben Rest — eine Position der Vorlage kam nie
      // vor.
      //
      // Nur ein Zähler je Vorlage: Bei drei Ganzkörpertagen kommt jede Vorlage
      // genau einmal vor, alle drei stünden bei null, und alle drei ließen
      // dieselbe Position weg. Genau so verschwand der Rumpf aus dem
      // Dreitageplan.
      //
      // Beides zusammen trennt beide Fälle: die Nummer des Vorkommens plus die
      // Stelle, an der die Vorlage zum ersten Mal auftaucht.
      vorlagenZaehler[template] = (vorlagenZaehler[template] || 0) + 1;
      if (erstesVorkommen[template] === undefined) erstesVorkommen[template] = index;
      const n = (vorlagenZaehler[template] - 1) + erstesVorkommen[template] + seed;

      // Vor dem Reihum steht die Vollständigkeit: Ist in dieser Woche noch
      // kein Platz mit diesem Muster besetzt, kommt er zuerst dran.
      //
      // Ohne das verschwand bei kurzen Einheiten die Hüftstreckung. Ein
      // Zweitageplan über dreißig Minuten mit Technik hat drei Kraftübungen je
      // Einheit; das Reihum nahm zweimal die Kniebeuge und nichts von der
      // Beinrückseite. Zweimal dasselbe Muster und eines gar nicht ist keine
      // Abwechslung, sondern eine Lücke.
      const offen = ueberhang.filter((sp) => {
        const m = sp.split(':')[2];
        return m && !gedeckteMuster.has(m);
      });
      specs = [...fest, offen.length ? offen[n % offen.length] : ueberhang[n % ueberhang.length]];
    }

    const usedToday = new Set();
    const exercises = [];

    specs.forEach((spec, i) => {
      const exercise = pick(spec, usedToday);
      if (!exercise) return;
      usedToday.add(exercise.id);
      const m = bewegungsmuster(exercise.id);
      if (m) gedeckteMuster.add(m);
      exercises.push(prescribe(exercise, profile, i === 0));
    });

    // Haben Einschränkungen oder fehlende Geräte Lücken gerissen: erst mit
    // Übungen aus denselben Muskelgruppen auffüllen, dann mit etwas Rumpfarbeit.
    const groups = new Set();
    for (const spec of specs) {
      const group = spec.split(':')[0];   // Richtung interessiert beim Auffüllen nicht
      groups.add(group);
      if (FALLBACK_GROUP[group]) groups.add(FALLBACK_GROUP[group]);
    }

    // Aufgefüllt wird bis zur Länge der Vorlage, nicht bis zum Zeitbudget.
    // Sonst hängt an einem Tag, der ohnehin vollständig ist, noch eine
    // Wiederholung derselben Muskelgruppe hinten dran, nur weil rechnerisch
    // Zeit übrig wäre.
    const ziel = specs.length;

    const topUp = (allowed, max) => {
      let added = 0;
      while (exercises.length < ziel && added < max) {
        const candidates = usable.filter((e) => !usedToday.has(e.id) && allowed.includes(e.group));
        if (!candidates.length) return;
        rotation.__fill = (rotation.__fill || 0) + 1;
        // Auch der Auffüller darf nicht unter die Einstiegssprosse greifen —
        // sonst stand im Plan eines Fortgeschrittenen plötzlich die unterste
        // Stufe, nur weil sie über diesen Weg hineinkam.
        const exercise = waehleMitSprosse(candidates, rotation.__fill + seed);
        usedToday.add(exercise.id);
        exercises.push(prescribe(exercise, profile, false));
        added++;
      }
    };

    topUp([...groups].filter((g) => g !== 'core'), ziel);
    topUp(['core'], 2);

    // Zum Schluss gegen die Uhr rechnen statt gegen eine Faustzahl.
    //
    // Die Übungszahl oben kommt aus „Minuten je Übung" — ein Mittelwert, der
    // nicht weiß, wie viele Sätze eine Übung hat und ob sie je Seite gemacht
    // wird. Bei einem Unterkörpertag ohne Geräte, wo die Hälfte der Übungen
    // einseitig ist, lag eine Einheit mit 45-Minuten-Ziel bei 65 Minuten.
    //
    // Deshalb hier die echte Schätzung, und wenn sie über dem Zeitbudget
    // liegt, fällt hinten eine Übung weg. Die erste bleibt immer stehen: Sie
    // hat einen Satz mehr und ist die Übung, für die man gekommen ist.
    //
    // Das Pausentempo kam bis hierher nie an. Es wird über `setSetting`
    // gespeichert und unter `ctx.settings.pausen` gelesen — gesucht wurde es
    // aber in `profile.pausen`, und dieses Feld gibt es im Trainingsprofil
    // nicht. Der Plan rechnete also immer mit neunzig Sekunden Pause, auch bei
    // eingestelltem „Kurz". Wer kurze Pausen macht, bekam dadurch weniger
    // Übungen, als in sein Zeitfenster passen, und war entsprechend früher
    // fertig. Jetzt wird das Tempo übergeben.
    const tempo = pausen || profile.pausen || 'normal';

    /**
     * Sätze senken, bis es passt — höchstens bis zum übergebenen Boden.
     * Von hinten die Übung mit den meisten Sätzen: Die erste hat einen Satz
     * mehr und ist die, für die man gekommen ist, sie gibt zuletzt ab.
     */
    let abgezogen = 0;
    const saetzeSenken = (boden) => {
      for (let schutz = 0; schutz < 60; schutz += 1) {
        if (sessionMinutes(exercises, tempo) <= strengthMinutes) return;
        let wo = -1;
        for (let i = exercises.length - 1; i >= 0; i -= 1) {
          if (exercises[i].sets <= boden) continue;
          if (wo === -1 || exercises[i].sets > exercises[wo].sets) wo = i;
        }
        if (wo === -1) return;
        exercises[wo] = { ...exercises[wo], sets: exercises[wo].sets - 1 };
        abgezogen += 1;
      }
    };

    /**
     * Die Reihenfolge, in der eine zu lange Einheit kürzer wird.
     *
     * Erst die Sätze bis drei, dann Übungen, dann die Sätze bis zwei.
     *
     * Vorher fielen zuerst die Übungen weg, und das kostete mehr, als es
     * einbrachte: Bei fünfundvierzig Minuten mit zwei Fähigkeiten blieben drei
     * Übungen übrig, und vier von zehn Muskelgruppen lagen im empfohlenen
     * Wochenvolumen. Mit einer Übung mehr und dafür weniger Sätzen sind es
     * acht. Eine Gruppe, die gar nicht vorkommt, holt kein zusätzlicher Satz
     * bei einer anderen wieder herein — Breite schlägt Tiefe, solange jede
     * Übung noch drei Sätze behält.
     *
     * Unter drei Sätzen kehrt sich das um: Dann ist der Reiz je Übung so
     * dünn, dass eine Übung weniger der ehrlichere Handel ist. Deshalb erst
     * danach der Weg auf zwei.
     */
    saetzeSenken(SAETZE_BEQUEM);
    while (exercises.length > fewest
        && sessionMinutes(exercises, tempo) > strengthMinutes) {
      exercises.pop();
    }
    saetzeSenken(SAETZE_MINDESTENS);

    /**
     * Und wenn das nicht reicht, sinkt die Satzzahl.
     *
     * Hier endete die Rechnung bisher. Unter `fewest` — vier Übungen, drei mit
     * Technikarbeit — wird nicht gekürzt, weil darunter die Bewegungen fehlen,
     * die einen Trainingstag ausmachen: beide Zugrichtungen, Hüfte, Knie. Dass
     * die vier Übungen aber je vier bis fünf Sätze haben, stand nie zur
     * Debatte. Ergebnis: Wer dreißig Minuten angab und fortgeschritten war,
     * bekam einen Plan von achtundvierzig bis neunundfünfzig Minuten — das
     * Doppelte des Gewünschten, ohne ein Wort dazu.
     *
     * Sätze zu streichen ist der bessere Verlust. Vier Übungen mit zwei Sätzen
     * decken dieselben Bewegungen ab wie vier mit fünf; es fehlt Volumen, und
     * Volumen lässt sich über einen weiteren Trainingstag zurückholen. Fehlende
     * Bewegungen lassen sich nicht zurückholen.
     *
     * Bei zwei Sätzen ist Schluss. Darunter ist es kein Reiz mehr, sondern
     * Aufwärmen, und dann ist die ehrliche Antwort nicht ein kleinerer Plan,
     * sondern der Hinweis, dass das Zeitfenster nicht reicht.
     */
    return {
      name,
      template,
      weekday: profile.weekdays[index] ?? null,
      short: exercises.length < perSession,
      // Wie viele Sätze das Zeitfenster gekostet hat. Die Planansicht sagt es
      // dazu — eine stillschweigend kleinere Einheit wäre wieder derselbe
      // Fehler in Grün.
      gekuerzt: abgezogen,
      exercises,
    };
  });

  return {
    createdAt: new Date().toISOString().slice(0, 10),
    seed,
    splitKey: String(key),
    splitName: split.name,
    // Wie viele Übungen die App kannte, als dieser Plan gebaut wurde. Ein Plan
    // liegt fest gespeichert — kommen später Übungen dazu, merkt er davon
    // nichts. Mit dieser Zahl kann die Planansicht darauf hinweisen, statt den
    // Nutzer monatelang dieselben sieben Übungen machen zu lassen.
    uebungsstand: EXERCISES.length,
    perSession,
    skillMinutes,
    days,
  };
}

/**
 * Tauscht eine Übung gegen eine andere aus derselben Muskelgruppe.
 *
 * Gebraucht, wenn eine Übung im Training nicht geht — zu schwer, schmerzhaft,
 * Gerät belegt. Die abgelehnte wandert in `profile.blocked` und kommt auch bei
 * späteren Neubauten des Plans nicht wieder.
 *
 * `meide` ist der Filter gegen doppelte Bewegungen: Der Aufrufer sagt, welche
 * Kandidaten eine Bewegung wiederholen, die heute schon dransteht — sonst
 * bekommt man für die abgewählte Nordic Curl die einbeinige Glute Bridge,
 * während die beidbeinige zwei Plätze weiter unten wartet. Gemieden wird nur,
 * solange es überhaupt etwas anderes gibt; im Zweifel ist eine doppelte
 * Bewegung besser als eine leere Stelle. Dass es so kam, steht dann in
 * `dopplung` — der Aufrufer soll es sagen können, statt es zu verstecken.
 *
 * @returns {{plan, ersatz: object|null, dopplung: boolean}}
 */
export function replaceExercise(plan, profile, dayIndex, exerciseIndex, { meide = null } = {}) {
  const day = plan.days[dayIndex];
  const alt = day && day.exercises[exerciseIndex];
  if (!alt) return { plan, ersatz: null, dopplung: false };

  const altExercise = exerciseById(alt.id);
  if (!altExercise) return { plan, ersatz: null, dopplung: false };

  const imTag = new Set(day.exercises.map((e) => e.id));
  const passt = (e) => isAvailable(e, profile) && e.id !== alt.id && !imTag.has(e.id);

  // Erst dieselbe Gruppe und Art, dann nur die Gruppe, dann die Ersatzgruppe.
  let auswahl = EXERCISES.filter((e) => passt(e) && e.group === altExercise.group && e.type === altExercise.type);
  if (!auswahl.length) auswahl = EXERCISES.filter((e) => passt(e) && e.group === altExercise.group);
  if (!auswahl.length && FALLBACK_GROUP[altExercise.group]) {
    auswahl = EXERCISES.filter((e) => passt(e) && e.group === FALLBACK_GROUP[altExercise.group]);
  }
  if (!auswahl.length) return { plan, ersatz: null, dopplung: false };

  const ersatz = (meide && auswahl.find((e) => !meide(e))) || auswahl[0];
  const dopplung = Boolean(meide && meide(ersatz));
  const neueVorgabe = prescribe(ersatz, profile, exerciseIndex === 0);

  const days = plan.days.map((d, i) => (i !== dayIndex ? d : {
    ...d,
    exercises: d.exercises.map((e, j) => (j === exerciseIndex ? neueVorgabe : e)),
  }));

  return { plan: { ...plan, days }, ersatz, dopplung };
}

/**
 * Streicht eine Übung aus einem Trainingstag.
 *
 * Der Ausweg, wenn ein Platz nicht sinnvoll zu besetzen ist — etwa weil die
 * einzige übrige Übung dieselbe Bewegung wäre wie eine, die schon dransteht.
 * Ein Tag mit sechs sinnvollen Übungen ist besser als einer mit sieben, von
 * denen zwei dasselbe sind.
 *
 * Nicht in `blocked` eintragen: Die Übung ist nicht ungeeignet, sie ist an
 * dieser Stelle nur überflüssig.
 */
export function removeExercise(plan, dayIndex, exerciseIndex) {
  const day = plan.days[dayIndex];
  if (!day || !day.exercises || !day.exercises[exerciseIndex]) return plan;
  if (day.exercises.length <= 2) return plan;

  const days = plan.days.map((d, i) => (i !== dayIndex ? d : {
    ...d,
    exercises: d.exercises.filter((e, j) => j !== exerciseIndex),
  }));
  return { ...plan, days };
}

/**
 * Setzt an einer Stelle im Plan eine bestimmte Übung ein.
 *
 * Anders als replaceExercise wird hier nicht gesucht, sondern gesetzt — die
 * Variantenleiter weiß schon, welche Sprosse als nächste kommt.
 */
export function setExercise(plan, profile, dayIndex, exerciseIndex, neueId) {
  const uebung = exerciseById(neueId);
  const tag = plan.days[dayIndex];
  if (!uebung || !tag || !tag.exercises[exerciseIndex]) return plan;

  const vorgabe = prescribe(uebung, profile, exerciseIndex === 0);
  const days = plan.days.map((d, i) => (i !== dayIndex ? d : {
    ...d,
    exercises: d.exercises.map((e, j) => (j === exerciseIndex ? vorgabe : e)),
  }));
  return { ...plan, days };
}

/**
 * Rechnet einen Trainingstag auf das um, was in einem leeren Zimmer geht.
 *
 * Bewusst keine Änderung am gespeicherten Plan und kein Eintrag in `blocked`:
 * die Übung ist nicht zu schwer und nicht ungeeignet, sie passt nur heute
 * nicht in den Raum. Sobald der Schalter aus ist, steht der alte Plan wieder da.
 *
 * @returns {{exercises: object[], getauscht: {von: string, zu: string}[]}}
 */
/**
 * Übungen eines Tages ersetzen, die eine Bedingung nicht erfüllen.
 *
 * Zwei Fälle nutzen dasselbe Verfahren: unterwegs fällt alles weg, was mehr als
 * Boden und Wand braucht, und bei einer Schonung alles, was auf das kranke
 * Gelenk geht. In beiden Fällen soll nicht einfach gestrichen werden — gesucht
 * wird zuerst Ersatz in derselben Gruppe und desselben Typs, dann in derselben
 * Gruppe, dann in der Ersatzgruppe. Erst wenn nichts passt, fällt die Übung weg.
 *
 * @param {function} behalten  (uebung) => boolean — was unverändert bleibt
 * @param {function} taugt     (kandidat) => boolean — was als Ersatz in Frage kommt
 */
function ersetzeIm(day, profile, behalten, taugt, waehlen) {
  if (!day || !day.exercises) return { exercises: [], getauscht: [] };

  // Was ohnehin bleibt, ist belegt — sonst schlägt der Tausch eine Übung vor,
  // die weiter unten im selben Tag schon steht.
  const belegt = new Set(
    day.exercises.filter((v) => {
      const e = exerciseById(v.id);
      return e && behalten(e);
    }).map((v) => v.id)
  );

  const getauscht = [];

  const exercises = day.exercises.map((vorgabe, i) => {
    const uebung = exerciseById(vorgabe.id);
    if (uebung && behalten(uebung)) return vorgabe;

    const passt = (e) => taugt(e) && !belegt.has(e.id);

    const gruppe = uebung ? uebung.group : null;
    let auswahl = gruppe
      ? EXERCISES.filter((e) => passt(e) && e.group === gruppe && e.type === uebung.type)
      : [];
    if (!auswahl.length && gruppe) auswahl = EXERCISES.filter((e) => passt(e) && e.group === gruppe);
    if (!auswahl.length && gruppe && FALLBACK_GROUP[gruppe]) {
      auswahl = EXERCISES.filter((e) => passt(e) && e.group === FALLBACK_GROUP[gruppe]);
    }

    // Nichts Passendes: die Übung fällt weg statt falsch ersetzt zu werden.
    if (!auswahl.length) {
      if (uebung) getauscht.push({ von: uebung.name, zu: null });
      return null;
    }

    // Ohne eigene Regel die erste passende. Die Ansicht reicht eine hinein,
    // die Sprossen derselben Variantenleiter bevorzugt — „Rudern unter dem
    // Tisch" soll zu „Handtuch-Rudern im Sitzen" werden und nicht zu dem, was
    // zufällig obenauf liegt.
    const ersatz = (waehlen && waehlen(auswahl, uebung)) || auswahl[0];
    belegt.add(ersatz.id);
    getauscht.push({ von: uebung ? uebung.name : vorgabe.id, zu: ersatz.name });
    return prescribe(ersatz, profile, i === 0);
  }).filter(Boolean);

  return { exercises, getauscht };
}

/** Unterwegs: nur was mit Boden und Wand geht. */
export function travelDay(day, profile, waehlen = null) {
  return ersetzeIm(day, profile,
    (e) => floorOnly(e),
    (e) => floorOnly(e) && isAvailable(e, profile),
    waehlen);
}

/**
 * Schonung: Übungen, die auf ein gereiztes Gelenk gehen, gegen solche
 * tauschen, die es nicht tun.
 *
 * `profile.limits` muss die Schonung bereits enthalten — dann macht
 * `isAvailable` die eigentliche Arbeit, und dieses Verfahren sucht nur den
 * Ersatz. Anders als eine Änderung im Fragebogen baut das den Plan nicht neu:
 * Eine Schonung ist vorübergehend, und ein neuer Plan würde die laufende
 * Blockwoche und alle Variantenleitern mitreißen.
 */
export function spareDay(day, profile, waehlen = null) {
  return ersetzeIm(day, profile,
    (e) => isAvailable(e, profile),
    (e) => isAvailable(e, profile),
    waehlen);
}

/* ---------------- 4-Wochen-Block ----------------
   Woche 1 sammelt Werte mit mehr Reserve, Woche 3 geht näher ans Limit,
   Woche 4 ist Deload. Danach beginnt der Block von vorn — mit den Gewichten,
   die inzwischen erreicht wurden.
-------------------------------------------------- */

export const BLOCK_WEEKS = {
  1: { label: 'Woche 1 · Einfinden', setDelta: 0,  rirDelta: 1 },
  2: { label: 'Woche 2 · Aufbauen',  setDelta: 0,  rirDelta: 0 },
  3: { label: 'Woche 3 · Schwer',    setDelta: 1,  rirDelta: -1 },
  4: { label: 'Woche 4 · Deload',    setDelta: -1, rirDelta: 2 },
};

/**
 * Wie lang ein Block ist, bevor die Entlastungswoche kommt.
 *
 * Vier Wochen waren fest verdrahtet. Das ist die übliche Empfehlung — Deloads
 * werden meist alle vier bis sechs Wochen angesetzt —, aber die Studienlage
 * dazu ist dünn: In einer Untersuchung pausierte die Hälfte der Teilnehmer in
 * der Mitte eines neunwöchigen Programms eine Woche, und hinterher war beim
 * Muskelzuwachs kein Unterschied zu sehen. Belegt ist der Nutzen also nicht,
 * widerlegt auch nicht.
 *
 * Bei einem festen Viererrhythmus geht ein Viertel aller Trainingswochen für
 * etwas drauf, das vielleicht nichts bringt. Deshalb steht es jetzt zur Wahl,
 * mit vier Wochen als Voreinstellung.
 */
export const ZYKLUS_WAHL = [
  { wert: 4, label: 'Alle 4 Wochen', hint: 'Die übliche Empfehlung. Viel Erholung, dafür ist jede vierte Woche leichter.' },
  { wert: 6, label: 'Alle 6 Wochen', hint: 'Längere Blöcke, seltener entlastet. Liegt ebenfalls im empfohlenen Bereich.' },
  { wert: 0, label: 'Nur bei Bedarf', hint: 'Keine feste Entlastungswoche. Die App meldet sich trotzdem, wenn Schlaf und Einheiten dagegen sprechen.' },
];

export function blockWeek(plan, todayKey) {
  if (!plan) return 1;
  const start = new Date(`${plan.createdAt}T12:00:00`);
  const now = new Date(`${todayKey}T12:00:00`);
  const days = Math.floor((now - start) / 86400000);
  const wochen = Math.floor(Math.max(0, days) / 7);

  const zyklus = plan.zyklus === 0 ? 0 : (Number(plan.zyklus) || 4);
  // Ohne festen Rhythmus laeuft dauerhaft die Aufbauwoche. Die Entlastung
  // kommt dann ueber den Hinweis, der Schlaf und Einheiten auswertet.
  if (!zyklus) return 2;

  const stelle = (wochen % zyklus) + 1;
  if (stelle === zyklus) return 4;      // Deload
  if (stelle === 1) return 1;           // Einfinden
  if (stelle === zyklus - 1) return 3;  // Schwer
  return 2;                             // Aufbauen
}

/**
 * Sätze und RIR einer Übung für die laufende Blockwoche.
 *
 * Der RIR wird nach unten bei 1 abgefangen, nicht bei 0. Vorher landete die
 * Stufe „erfahren" in der schweren Woche bei 0 — also jeder Satz bis zum
 * Muskelversagen, eine Woche lang. Die Meta-Analysen zeigen zwar, dass näher am
 * Versagen etwas mehr Wachstum bringt, aber der Zugewinn unterhalb von zwei
 * Wiederholungen Reserve ist klein, während Ermüdung und Technikverlust
 * deutlich zunehmen. Ein einzelner Satz bis zum Versagen ist in Ordnung; eine
 * ganze Woche davon kostet mehr, als sie bringt.
 *
 * Nach oben bleibt es bei 4. Ab etwa fünf Wiederholungen Reserve fällt der
 * Wachstumsreiz messbar ab — mehr Reserve wäre kein sanfter Einstieg mehr,
 * sondern eine verschenkte Woche.
 */
/**
 * Geplante Sätze je Muskelgruppe in einer Woche, gerechnet für die
 * Aufbauwoche — die Woche, die den Normalfall darstellt.
 *
 * Eingeordnet wird gegen den Bereich, den die Meta-Analysen hergeben. Die
 * Zusammenfassung der Datenlage: Mehr Sätze bringen mehr, aber mit immer
 * kleinerem Zugewinn je Satz; unterhalb von etwa zehn Sätzen die Woche
 * verschenkt man etwas, oberhalb von zwanzig ist der Zuwachs je zusätzlichem
 * Satz so klein, dass er die Erholung selten wert ist. Beides sind Mittelwerte
 * über viele Menschen — die Streuung zwischen einzelnen ist groß, und deshalb
 * steht hier eine Einordnung und keine Note.
 *
 * Wichtig für die Deutung: „Rücken" ist keine Muskelgruppe, sondern mehrere.
 * Zwanzig Rückensätze verteilen sich auf Latissimus, Rhomboiden und Kapuze und
 * sind deshalb weniger, als die Zahl aussieht.
 */
export const VOLUMEN_UNTEN = 10;
export const VOLUMEN_OBEN = 20;

/**
 * Wer bei einer Übung mitarbeitet, ohne die Zielgruppe zu sein.
 *
 * Ohne diese Tabelle zählt ein Plan den Trizeps nur dort, wo „Trizeps"
 * draufsteht — und meldet drei Sätze, während in Wirklichkeit noch achtzehn
 * Sätze Drücken darauf gehen. Die Meta-Analyse, aus der der Zielbereich stammt,
 * macht es genauso: Sätze, bei denen ein Muskel mitarbeitet, ohne das Ziel zu
 * sein, gehen mit dem halben Gewicht in die Rechnung ein.
 *
 * Die Anteile sind grob und sollen es sein. Ob der Trizeps beim Bankdrücken
 * 0,4 oder 0,6 Sätze abbekommt, weiß niemand; dass er deutlich mehr als null
 * abbekommt, weiß jeder.
 */
const MITARBEIT = {
  'brust:c':    { trizeps: 0.5, sdelt: 0.5 },
  'schulter:c': { trizeps: 0.5, sdelt: 0.5 },
  'trizeps:c':  { brust: 0.5, sdelt: 0.25 },
  'ruecken:c':  { bizeps: 0.5, rdelt: 0.5 },
  'bizeps:c':   { ruecken: 0.5 },
  'quad:c':     { glute: 0.5, ham: 0.25 },
  'ham:c':      { glute: 0.5, ruecken: 0.25 },
  'glute:c':    { ham: 0.5 },
};

/**
 * Geplante Sätze je Muskelgruppe in einer Woche, gerechnet für die
 * Aufbauwoche — die Woche, die den Normalfall darstellt.
 *
 * `direkt` sind die Sätze, bei denen die Gruppe das Ziel ist. `gesamt` zählt
 * die Mitarbeit halb dazu, und danach richtet sich die Einordnung.
 */
export function weeklyPlannedSets(plan, week = 2) {
  const je = new Map();
  const hol = (g) => {
    if (!je.has(g)) je.set(g, { gruppe: g, direkt: 0, mit: 0, tage: 0 });
    return je.get(g);
  };

  for (const day of plan?.days || []) {
    const drin = new Set();
    for (const p of day.exercises || []) {
      const e = exerciseById(p.id);
      if (!e) continue;
      const saetze = forWeek(p, week).sets;
      hol(e.group).direkt += saetze;
      drin.add(e.group);
      const mit = MITARBEIT[`${e.group}:${e.type}`];
      if (mit) for (const [g, anteil] of Object.entries(mit)) hol(g).mit += saetze * anteil;
    }
    for (const g of drin) hol(g).tage += 1;
  }

  return [...je.values()]
    .map((x) => {
      const gesamt = Math.round(x.direkt + x.mit);
      return {
        ...x,
        mit: Math.round(x.mit),
        gesamt,
        stufe: gesamt < VOLUMEN_UNTEN ? 'wenig' : gesamt > VOLUMEN_OBEN ? 'viel' : 'gut',
      };
    })
    .sort((a, b) => b.gesamt - a.gesamt);
}

export function forWeek(prescription, week) {
  const mod = BLOCK_WEEKS[week] || BLOCK_WEEKS[1];
  const sets = mod.setDelta === -1
    ? Math.max(2, prescription.sets - Math.ceil(prescription.sets * 0.4))
    : Math.max(2, prescription.sets + mod.setDelta);
  return { sets, rir: Math.min(4, Math.max(1, prescription.rir + mod.rirDelta)) };
}

/**
 * Wie lang eine Einheit über den Block hinweg wirklich wird.
 *
 * `sessionMinutes` rechnet mit den Grundsätzen einer Vorgabe. Die schwere
 * Woche hat aber je Übung einen Satz mehr, die Entlastungswoche vierzig
 * Prozent weniger — die wahre Dauer schwankt also über den Block, und die
 * Grundzahl ist keine davon.
 *
 * Aufgefallen ist das in einem durchgerechneten halben Jahr: Bei einem
 * Zeitfenster von sechzig Minuten stand im Plan „rund 57 Min", während die
 * schwere Woche tatsächlich 73 Minuten dauerte. Danebengestanden hat die
 * Satzzahl — die war für die Woche richtig gerechnet. Zwei Zahlen in einer
 * Zeile, eine davon aus einer anderen Woche.
 *
 * Dass die schwere Woche länger ist, ist kein Fehler, sondern der Sinn der
 * schweren Woche. Sie zu verschweigen ist der Fehler.
 */
export function sessionSpanne(day, profile, tempo = 'normal', zyklus = 4) {
  const uebungen = day?.exercises || [];
  if (!uebungen.length) return null;

  // Technikarbeit läuft an jedem Trainingstag und gehört deshalb in die Dauer.
  // Sie fehlte hier, und damit stand im Plan die Dauer des Kraftteils, während
  // daneben die Fähigkeiten aufgezählt waren, die noch dazukommen. Wer
  // Handstand und Klimmzug übt, las „23 Minuten" für eine Einheit von
  // fünfunddreißig.
  const technik = (profile?.skills || []).length * MINUTES_PER_SKILL;

  // Ohne festen Rhythmus läuft dauerhaft die Aufbauwoche — dann gibt es keine
  // Spanne, sondern eine Dauer.
  const wochen = Number(zyklus) === 0 ? [2] : [1, 2, 3, 4];
  const dauern = wochen.map((w) => sessionMinutes(
    uebungen.map((x) => ({ ...x, sets: forWeek(x, w).sets })), tempo,
  ) + technik);

  const budget = Number(profile?.sessionLength) || 0;
  // Die Aufbauwoche ist der Normalfall und damit die Zahl, an der das
  // Zeitfenster zu messen ist.
  const kraft = sessionMinutes(
    uebungen.map((x) => ({ ...x, sets: forWeek(x, 2).sets })), tempo,
  );
  const normal = kraft + technik;

  return {
    kuerzeste: Math.min(...dauern),
    laengste: Math.max(...dauern),
    normal,
    kraft,
    technik,
    budget,
    /**
     * Gemessen wird die **normale** Woche, nicht die längste.
     *
     * Die schwere Woche hat je Übung einen Satz mehr und ist dadurch immer
     * etwa ein Viertel länger — das ist ihr Zweck, kein gebrochenes
     * Versprechen. Nähme man sie als Maßstab, stünde bei jedem Zeitfenster
     * „überzieht", und der Hinweis wäre nach einer Woche unsichtbar.
     *
     * Gebrochen ist das Versprechen erst, wenn schon der Normalfall nicht
     * hineinpasst. Das passiert, weil der Plan nur bis zu einem Mindestumfang
     * kürzt: Wer dreißig Minuten angibt, bekommt trotzdem die Übungen, ohne
     * die ein Trainingstag keiner wäre — rund achtundvierzig Minuten. Das ist
     * vertretbar, aber es muss dastehen.
     */
    ueberzieht: budget > 0 && normal > budget,
  };
}

/** Zeitfenster, die die Empfehlung durchprobiert. */
export const ZEIT_KANDIDATEN = [30, 40, 45, 50, 55, 60, 70, 80];

/**
 * Welches Zeitfenster zu den eigenen Zielen passt.
 *
 * Die Frage „wie lange soll ich trainieren" hat eine Antwort, die man
 * ausrechnen kann, sobald man sagt, woran man sie misst. Gemessen wird hier
 * am Wochenvolumen je Muskelgruppe: Die Übersichtsarbeiten legen den nutzbaren
 * Bereich auf etwa zehn bis zwanzig harte Sätze je Gruppe und Woche. Darunter
 * verschenkt man etwas, darüber wird der Zugewinn je Satz so klein, dass er
 * die Erholung selten wert ist.
 *
 * Gesucht ist deshalb das Fenster, in dem möglichst viele Gruppen in diesem
 * Bereich liegen und keine darüber. Bei Gleichstand gewinnt das kürzere — Zeit
 * ist der Preis, und ein Fenster, das nichts mehr hinzufügt, ist keine
 * Empfehlung, sondern eine Zumutung.
 *
 * Was die Rechnung **nicht** weiß: wie gut jemand schläft, isst und sich
 * erholt. Fünf Stunden Training in der Woche sind nur dann besser als drei,
 * wenn der Rest mitspielt. Die Zahl ist eine Obergrenze des Sinnvollen, kein
 * Soll.
 */
export function empfohleneZeit(profile, { rang = null, pausen = null } = {}) {
  if (!profile) return null;

  const bewerten = (minuten) => {
    const pr = { ...profile, sessionLength: minuten };
    let plan;
    try { plan = buildPlan(pr, 0, { rang, pausen }); } catch { return null; }
    const vol = weeklyPlannedSets(plan, 2);
    const tag = plan.days[0];
    return {
      minuten,
      gruppen: vol.map((g) => g.gruppe),
      imZiel: vol.filter((g) => g.stufe === 'gut').map((g) => g.gruppe),
      wenig: vol.filter((g) => g.stufe === 'wenig').length,
      viel: vol.filter((g) => g.stufe === 'viel').length,
      dauer: tag ? (sessionSpanne(tag, pr, pausen || 'normal', profile.zyklus) || {}).normal : null,
    };
  };

  const roh = ZEIT_KANDIDATEN.map(bewerten).filter(Boolean);
  if (!roh.length) return null;

  /**
   * Gezählt wird gegen **alle** Muskelgruppen, die überhaupt vorkommen können
   * — nicht gegen die, die in diesem einen Plan zufällig stehen.
   *
   * Hier lag ein Fehler, der die Empfehlung systematisch zu kurz machte. Eine
   * kurze Einheit lässt Gruppen ganz weg; die tauchten in ihrer Wertung dann
   * gar nicht auf und zählten auch nicht als „daneben". Eine Gruppe, die
   * überhaupt nicht trainiert wird, stand damit besser da als eine, die etwas
   * zu wenig abbekommt. Bei sechs Tagen kam so heraus: vierzig Minuten mit
   * sechs von zehn Gruppen schlug sechzig Minuten mit sieben von elf, obwohl
   * bei sechzig eine Gruppe mehr richtig lag.
   *
   * Der gemeinsame Nenner ist die Vereinigung aller Gruppen über alle
   * geprüften Fenster. Fehlt eine, zählt sie als daneben — denn das ist sie.
   */
  const alleGruppen = new Set(roh.flatMap((x) => x.gruppen));
  const stufen = roh.map((x) => ({
    minuten: x.minuten,
    dauer: x.dauer,
    gruppen: alleGruppen.size,
    gut: x.imZiel.length,
    wenig: x.wenig + (alleGruppen.size - x.gruppen.length),
    viel: x.viel,
    // Zu wenig und zu viel sind beides Abweichungen vom Bereich, den die
    // Datenlage hergibt, und werden deshalb gleich gewichtet. Sonst empfiehlt
    // die Rechnung achtzig Minuten, um eine Gruppe mehr in den Bereich zu
    // holen und dafür eine andere darüber hinauszuschieben.
    daneben: alleGruppen.size - x.imZiel.length,
  }));

  // Möglichst wenige Gruppen daneben; bei Gleichstand das kürzere Fenster.
  const beste = [...stufen].sort((a, b) => a.daneben - b.daneben || a.minuten - b.minuten)[0];
  const jetztRoh = bewerten(profile.sessionLength);
  const jetzt = jetztRoh ? {
    minuten: jetztRoh.minuten,
    dauer: jetztRoh.dauer,
    gruppen: alleGruppen.size,
    gut: jetztRoh.imZiel.length,
    wenig: jetztRoh.wenig + Math.max(0, alleGruppen.size - jetztRoh.gruppen.length),
    viel: jetztRoh.viel,
    daneben: alleGruppen.size - jetztRoh.imZiel.length,
  } : null;

  /**
   * Der Fall, in dem keine Zeitangabe die richtige Antwort ist.
   *
   * Bei zwei Trainingstagen liegt keine einzige Muskelgruppe im empfohlenen
   * Wochenvolumen — bei keinem Zeitfenster, auch nicht bei achtzig Minuten.
   * Die Rechnung lieferte trotzdem eine Empfehlung: dreißig Minuten, weil bei
   * Gleichstand das kürzere gewinnt und alle gleich schlecht waren. „Trainier
   * zweimal dreißig Minuten" als Antwort auf „was ist optimal" ist aber kein
   * Rat, sondern eine Zahl ohne Inhalt.
   *
   * Erreicht das beste Fenster nicht einmal die Hälfte der Gruppen, ist die
   * ehrliche Antwort ein Trainingstag mehr — und genau das sagt die Ansicht
   * dann, statt eine Minutenzahl anzubieten.
   */
  const reichtNicht = beste.gut < Math.ceil((beste.gruppen || 10) / 2);

  return {
    ...beste,
    jetzt,
    reichtNicht,
    // Lohnt der Wechsel überhaupt? Eine Gruppe mehr für zwanzig Minuten
    // zusätzlich ist keine Empfehlung wert, sondern eine Zumutung.
    lohnt: !reichtNicht && Boolean(jetzt) && jetzt.daneben - beste.daneben >= 2,
    stufen,
  };
}

/**
 * Aus den möglichen Wochentagen die besten auswählen.
 *
 * „Ich kann sechs Tage" heißt nicht „ich muss sechs Tage". Wer sechs Tage frei
 * hat, kann davon fünf nutzen — und der freie Tag ist dann keine verlorene
 * Einheit, sondern eine gewählte Pause. Das war der fehlende Gedanke: Die
 * Angabe im Fragebogen ist Verfügbarkeit, der Plan macht daraus einen
 * Rhythmus.
 *
 * Ausgewählt wird nach Verteilung. Zwischen zwei Einheiten soll möglichst viel
 * Platz liegen, und die Abstände sollen sich ähneln — vier Tage am Stück und
 * dann drei frei ist schlechter als jeder zweite Tag, auch wenn beides
 * viermal Training ist. Gerechnet wird über die Woche im Kreis: Von Samstag
 * auf Montag sind es zwei Tage, nicht minus fünf.
 *
 * Bei höchstens sieben möglichen Tagen sind das wenige Kombinationen, die
 * alle durchgerechnet werden — kein Näherungsverfahren nötig.
 */
export function verteileTage(verfuegbar, anzahl) {
  const tage = [...new Set(verfuegbar || [])].sort((a, b) => a - b);
  if (anzahl >= tage.length) return tage;
  if (anzahl <= 0) return [];

  const abstaende = (wahl) => {
    const s = [...wahl].sort((a, b) => a - b);
    return s.map((t, i) => {
      const naechster = s[(i + 1) % s.length];
      return i === s.length - 1 ? naechster + 7 - t : naechster - t;
    });
  };

  let beste = null;
  const gewaehlt = [];
  const gehen = (ab) => {
    if (gewaehlt.length === anzahl) {
      const ab2 = abstaende(gewaehlt);
      const kleinster = Math.min(...ab2);
      const mittel = 7 / anzahl;
      const streuung = ab2.reduce((sum, x) => sum + (x - mittel) ** 2, 0);

      // Die längste Folge von Tagen ohne Pause dazwischen. Der Mindestabstand
      // allein reicht als Maßstab nicht: Wer sechs mögliche Tage hat und fünf
      // nutzt, kommt nie über einen Tag Abstand hinaus, und dann sehen „Mo Di
      // Mi Do Sa" und „Mo Di Do Fr Sa" gleich aus — obwohl das eine vier
      // Einheiten am Stück sind und das andere zwei plus drei.
      let laengste = 0;
      let laufend = 0;
      for (let i = 0; i < ab2.length; i += 1) {
        laufend = ab2[i] === 1 ? laufend + 1 : 0;
        laengste = Math.max(laengste, laufend + 1);
      }

      const besser = !beste
        || kleinster > beste.kleinster
        || (kleinster === beste.kleinster && laengste < beste.laengste)
        || (kleinster === beste.kleinster && laengste === beste.laengste && streuung < beste.streuung);
      if (besser) beste = { wahl: [...gewaehlt], kleinster, laengste, streuung };
      return;
    }
    for (let i = ab; i < tage.length; i += 1) {
      gewaehlt.push(tage[i]);
      gehen(i + 1);
      gewaehlt.pop();
    }
  };
  gehen(0);

  return beste ? beste.wahl : tage.slice(0, anzahl);
}

/** Tagezahlen, die der Vergleich durchprobiert. */
export const TAGE_KANDIDATEN = [2, 3, 4, 5, 6];

/**
 * Dasselbe für die Zahl der Trainingstage.
 *
 * Die Frage „wie lange" ist nur die halbe. Wie das Wochenvolumen zustande
 * kommt, hängt mindestens genauso an der Aufteilung: Sechs Tage laufen als
 * Push/Pull/Beine zweimal, und das trifft Rücken und Arme doppelt, während
 * Schultern, Gesäß und Rumpf nur an ihren Tagen vorkommen. Fünf Tage mischen
 * Push/Pull/Beine mit zwei Ganzkörperhälften und verteilen dadurch breiter.
 *
 * Deshalb steht hier beides nebeneinander. Gerechnet wird je Tagezahl mit dem
 * Zeitfenster, das dort am besten abschneidet — sonst vergliche man eine gute
 * Aufteilung bei schlechter Zeit mit einer schlechten bei guter.
 */
export function tageVergleich(profile, { rang = null, pausen = null } = {}) {
  if (!profile) return [];

  return TAGE_KANDIDATEN.map((tage) => {
    const pr = {
      ...profile,
      days: tage,
      // Gleichmäßig über die Woche verteilt, damit der Vergleich nicht an der
      // Wochentagswahl hängt.
      weekdays: [1, 2, 3, 4, 5, 6].slice(0, tage),
    };
    const e = empfohleneZeit(pr, { rang, pausen });
    if (!e) return null;
    return {
      tage,
      minuten: e.minuten,
      dauer: e.dauer,
      gut: e.gut,
      gruppen: e.gruppen,
      daneben: e.daneben,
      reichtNicht: e.reichtNicht,
      // Was es an Zeit kostet, in Stunden je Woche.
      stunden: Math.round((e.dauer || e.minuten) * tage / 6) / 10,
    };
  }).filter(Boolean);
}

/** Gründe, aus denen eine Einheit ausfallen darf. */
export const SKIP_REASONS = {
  reise:   { label: 'Gereist', text: 'unterwegs' },
  schlaf:  { label: 'Zu wenig Schlaf', text: 'übermüdet' },
  krank:   { label: 'Krank', text: 'krank' },
  schmerz: { label: 'Schmerzen', text: 'wegen Schmerzen' },
  zeit:    { label: 'Keine Zeit', text: 'aus Zeitgründen' },
};

/**
 * Ausgefallene Trainingstage der letzten Tage.
 *
 * Ein Tag gilt als ausgefallen, wenn er im Plan stand, vorbei ist und weder
 * abgeschlossen noch anderswo nachgeholt wurde. Bewusst ausgelassene Tage
 * bleiben dabei: „krank" heißt nicht „erledigt", man kann sie trotzdem
 * nachholen wollen.
 */
export function missedDays(plan, sessions, dateKey, tage = 10) {
  if (!plan) return [];

  const offen = [];
  for (let i = 1; i <= tage; i += 1) {
    const tag = shiftKey(dateKey, -i);

    // Tage vor der Planerstellung sind nicht ausgefallen — da gab es keinen
    // Plan, gegen den sie hätten ausfallen können.
    if (plan.createdAt && tag < plan.createdAt) continue;

    const weekday = new Date(`${tag}T12:00:00`).getDay();
    const planTag = dayForWeekday(plan, weekday);
    if (!planTag) continue;

    const session = (sessions || []).find((s) => s.date === tag);

    // Eine Einheit deckt ihren eigenen Plantag nur ab, wenn sie auch dessen
    // Übungen gemacht hat. Wer getauscht oder nachgeholt hat, hat an dem Tag
    // etwas anderes trainiert — der eigene Tag ist dann weiterhin offen.
    const eigenerTag = session
      && !session.holtNach
      && typeof session.swapWeekday !== 'number';
    if (eigenerTag && (session.done || session.movedTo)) continue;

    // Woanders nachgeholt? Dann ist der Tag erledigt, auch ohne Eintrag bei ihm.
    if ((sessions || []).some((s) => s.holtNach === tag && s.done)) continue;

    offen.push({
      date: tag,
      day: planTag,
      weekday,
      session: session || null,
      grund: session && session.skipped ? session.reason || null : null,
    });
  }
  return offen;
}

/** Datumsschlüssel verschieben — hier lokal, damit training.js DOM-frei bleibt. */
function shiftKey(key, delta) {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Spricht die Woche gegen eine schwere Woche?
 *
 * Der Vierwochenblock läuft nach Kalender: Woche 3 ist „Schwer", egal was
 * davor war. Eine Woche mit ausgefallenen Einheiten und kurzen Nächten ist
 * dafür der falsche Moment. Die App weiß das inzwischen — sie soll es sagen
 * dürfen, ohne den Plan hinter dem Rücken umzustellen.
 *
 * Gezählt werden nur harte Fakten der letzten sieben Tage.
 *
 * @returns {{gruende: string[], schwer: boolean}}
 */
export function deloadHinweis({ plan, sessions, sleep, dateKey, kurzeNacht }) {
  const gruende = [];
  if (!plan) return { gruende, schwer: false };

  const woche = blockWeek(plan, dateKey);
  const istSchwereWoche = BLOCK_WEEKS[woche] && BLOCK_WEEKS[woche].setDelta > 0;
  if (!istSchwereWoche) return { gruende, schwer: false };

  const tage = Array.from({ length: 7 }, (_, i) => shiftKey(dateKey, -i - 1));

  const ausgefallen = tage.filter((t) => {
    const wd = new Date(`${t}T12:00:00`).getDay();
    if (!dayForWeekday(plan, wd)) return false;
    if (plan.createdAt && t < plan.createdAt) return false;
    const s = (sessions || []).find((x) => x.date === t);
    return !(s && (s.done || s.movedTo));
  }).length;
  if (ausgefallen >= 2) {
    gruende.push(`${ausgefallen} Einheiten sind in den letzten sieben Tagen ausgefallen`);
  }

  const kurz = tage.filter((t) => {
    const n = (sleep || []).find((x) => x.date === t);
    return n && kurzeNacht(n);
  }).length;
  if (kurz >= 3) gruende.push(`${kurz} Nächte lagen unter sieben Stunden`);

  return { gruende, schwer: true };
}

/** Den Trainingstag zu einem Datum finden, oder null an Ruhetagen. */
export function dayForWeekday(plan, weekday) {
  if (!plan) return null;
  return plan.days.find((d) => d.weekday === weekday) || null;
}

/* ---------------- Progression ---------------- */

/**
 * Doppelte Progression: sitzen alle Sätze am oberen Ende des Wiederholungs-
 * bereichs, steigt beim nächsten Mal das Gewicht und die Wiederholungen gehen
 * zurück ans untere Ende.
 */
export function nextStep(prescription, lastSets, rir = prescription.rir) {
  const exercise = exerciseById(prescription.id);
  const [low, high] = repRange(prescription);
  const zeit = isTimed(prescription.id);

  if (!lastSets || !lastSets.length) {
    if (zeit) {
      return `Halten, bis die Form nachgibt — nicht länger. ${low} Sekunden sind ein guter `
        + 'erster Satz; wo du landest, ist dein Startwert.';
    }
    return prescription.loadless
      ? `Sauber ausführen und bis ${rir} Wiederholungen vor dem Versagen gehen. Das ist dein Startwert.`
      : `Startgewicht finden: der letzte Satz endet mit ${rir} Wiederholungen im Tank.`;
  }

  // Bei gehaltenen Übungen gibt es kein Gewicht und keine zweite Seite. Der
  // Fortschritt sind Sekunden — bis der obere Rand erreicht ist. Danach wäre
  // „noch länger" der falsche Weg: eine sehr lange Plank misst Geduld.
  if (zeit) {
    const gehalten = (lastSets || []).map((x) => Number(x && x.reps) || 0).filter(Boolean);
    if (!gehalten.length) return `Ziel sind ${low} bis ${high} Sekunden je Satz.`;
    const bestes = Math.min(...gehalten);
    if (bestes >= high) {
      return `Alle Sätze über ${high} Sekunden — jetzt nicht länger halten, sondern schwerer `
        + 'machen: einbeinig, einarmig, längerer Hebel oder etwas Zusatzgewicht.';
    }
    return `Zuletzt ${bestes} Sekunden im schwächsten Satz. Heute fünf Sekunden mehr, bis `
      + `${high} stehen.`;
  }

  const done = lastSets.filter((s) => s && s.reps);
  // Bei einseitigen Übungen entscheidet die schwächere Seite. Sonst würde eine
  // starke linke Seite das Gewicht hochtreiben, während die rechte hinterherhinkt
  // — genau das Ungleichgewicht, das die Übung eigentlich beheben soll.
  const einseitig = isUnilateral(prescription.id);
  const zaehlt = (s) => (einseitig ? (setSides(s).schwaechste ?? Number(s.reps)) : Number(s.reps));
  const allAtTop = done.length >= prescription.sets && done.every((s) => zaehlt(s) >= high);

  const hinkt = einseitig
    ? done.find((s) => { const t = setSides(s); return t.links !== null && t.rechts !== null
        && Math.max(t.links, t.rechts) - t.schwaechste >= 2; })
    : null;
  if (hinkt && !allAtTop) {
    const t = setSides(hinkt);
    const schwach = t.links < t.rechts ? 'linke' : 'rechte';
    return `Die ${schwach} Seite bleibt zurück (${t.links}/${t.rechts}). Fang mit ihr an und `
      + `mach auf der starken Seite nur so viele Wiederholungen, wie die schwache geschafft hat.`;
  }

  if (allAtTop && prescription.loadless) {
    return `Alle Sätze auf ${high} — jetzt die schwerere Variante: langsamer, größerer Bewegungsumfang oder einbeinig beziehungsweise einarmig.`;
  }

  const heaviest = Math.max(...done.map((s) => Number(s.weight) || 0));
  if (allAtTop && heaviest > 0) {
    const step = exercise && exercise.type === 'c' ? 2.5 : 1.25;
    const next = Math.round((heaviest + step) * 10) / 10;
    return `Alle Sätze auf ${high} — heute ${String(next).replace('.', ',')} kg und zurück auf ${low} Wiederholungen.`;
  }

  return 'Gewicht halten und pro Satz eine Wiederholung mehr schaffen als beim letzten Mal.';
}

/** Bestes Satzergebnis je Übung über alle aufgezeichneten Einheiten. */
export function personalBests(sessions) {
  const best = new Map();

  for (const session of [...sessions].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    for (const [id, sets] of Object.entries(session.entries || {})) {
      for (const set of sets || []) {
        if (!set || !set.reps) continue;
        const weight = Number(set.weight) || 0;
        // Bei einseitigen Übungen zählt die schwächere Seite: sie begrenzt,
        // was man kann, und ein Mittelwert würde ein Ungleichgewicht verstecken.
        const reps = isUnilateral(id) ? (setSides(set).schwaechste ?? set.reps) : set.reps;
        // Mit Gewicht zählt das geschätzte Einwiederholungsmaximum (Epley),
        // ohne Gewicht die Wiederholungszahl. Beides bleibt getrennt.
        const score = weight > 0 ? weight * (1 + reps / 30) : reps;

        if (!best.has(id)) {
          best.set(id, { id, bodyweight: weight === 0, firstWeight: weight, firstReps: reps, score: null });
        }
        const entry = best.get(id);
        if (entry.score === null || score > entry.score) {
          Object.assign(entry, { score, weight, reps, date: session.date });
        }
      }
    }
  }

  return [...best.values()]
    .map((e) => ({ ...e, name: exerciseById(e.id)?.name || e.id }))
    // Haltearbeit steht am Ende und unter sich. Sonst stehen Sekunden und
    // Wiederholungen in einer Rangfolge, und ein Wandsitz über 55 Sekunden
    // landet über 22 Liegestützen — als wäre er die bessere Leistung.
    .sort((a, b) => Number(isTimed(a.id)) - Number(isTimed(b.id))
      || (b.weight || 0) - (a.weight || 0)
      || b.score - a.score);
}

/**
 * Bewegte Last je Trainingswoche.
 * Körpergewichtssätze werden mit dem halben Körpergewicht angesetzt, sonst
 * bliebe das Diagramm für alle ohne Hanteln leer.
 */
export function weeklyVolume(sessions, bodyweight) {
  const assumed = (bodyweight || 70) * 0.5;
  const buckets = new Map();

  for (const session of sessions) {
    let volume = 0;
    for (const [id, sets] of Object.entries(session.entries || {})) {
      // Gehaltene Übungen bleiben draußen. Volumen ist Gewicht mal
      // Wiederholungen; eine Plank hat weder das eine noch das andere. In
      // `reps` stehen dort Sekunden, und die Rechnung hat sie wie
      // Wiederholungen genommen: Zwei Planks und ein Wandsitz kamen damit auf
      // das Fünffache einer richtigen Liegestützeinheit.
      if (isTimed(id)) continue;
      for (const set of sets || []) {
        if (!set || !set.reps) continue;
        // Fürs Volumen zählen beide Seiten zusammen — die Arbeit wurde ja
        // zweimal gemacht.
        const reps = isUnilateral(id) ? setSides(set).summe : set.reps;
        volume += (Number(set.weight) > 0 ? Number(set.weight) : assumed) * reps;
      }
    }
    if (!volume) continue;

    const date = new Date(`${session.date}T12:00:00`);
    const offset = (date.getDay() + 6) % 7; // Woche beginnt am Montag
    date.setDate(date.getDate() - offset);
    const monday = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    buckets.set(monday, (buckets.get(monday) || 0) + volume);
  }

  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-8)
    .map(([week, volume]) => ({ week, volume: Math.round(volume) }));
}
