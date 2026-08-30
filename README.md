# Nährwerte

Essen abfotografieren, Trainingsplan bekommen, beides zusammen im Blick behalten.

Eine Web-App fürs Handy (PWA) ohne Server, ohne Account, ohne Build-Schritt.
Alle Mahlzeiten, Fotos und Trainingsdaten bleiben auf deinem Gerät.

**Die beiden Hälften hängen zusammen:** Aus dem Fragebogen entsteht der Trainingsplan
*und* das Kalorienziel. An Trainingstagen darf mehr gegessen werden als an Ruhetagen,
über die Woche kommt genau die Summe raus, die dein Ziel braucht. Und weil jede Formel
nur eine Schätzung ist, korrigiert die App das Ziel nach dem, was die Waage tatsächlich
anzeigt.

## Was die App kann

### Ernährung

- **Foto → Nährwerte**: Mahlzeit fotografieren, Claude zerlegt sie in Komponenten und
  schätzt Menge, Kalorien, Eiweiß, Kohlenhydrate und Fett
- **Hinweis zum Foto**: unter dem Bild lässt sich dazuschreiben, was man ihm nicht
  ansieht — „in Olivenöl gebraten", „große Portion", „Nudeln sind Vollkorn". Ein Tipp
  auf *Mit Hinweis neu schätzen*, und die Schätzung läuft mit dieser Zusatzinfo
- **Text → Nährwerte**: statt zu fotografieren einfach beschreiben — „zwei Scheiben
  Vollkornbrot mit Butter und Gouda, dazu ein Apfel". Genannte Mengen werden
  übernommen, fehlende als übliche Portion angenommen und im Hinweis genannt.
  Braucht keine Kamera und kostet weniger als ein Bild
- **Zwei Wege dorthin**: automatisch über einen eigenen API-Key, oder kostenlos über
  die Claude-App (siehe *Ohne API-Key ausprobieren*)
- **Alles korrigierbar**: jede Zahl ist editierbar, ein Portionsregler skaliert die
  ganze Mahlzeit auf einmal (25–250 %)
- **Tagesübersicht**: Kalorienring gegen dein Tagesziel, Makrobalken, Mahlzeiten nach
  Frühstück / Mittag / Abend / Snack gruppiert
- **Verlauf**: Balkendiagramm der letzten 7 oder 30 Tage, Durchschnittswerte, Tage im Ziel
- **Favoriten**: häufige Mahlzeiten mit einem Tipp erneut eintragen — ohne Foto, ohne Kosten
- **Ohne Internet nutzbar**: alles außer der Foto-Analyse funktioniert offline
- **Von Hand eintragen**: die App ist auch ganz ohne API-Key voll benutzbar

### Training

- **Acht Fragen, ein Plan**: Basisdaten, Ziel, Erfahrung, Zeit, Ausrüstung, Alltag
  und Beschwerden, Schwerpunkte, Fähigkeiten — daraus entstehen Split, Übungen und
  Kalorienziele
- **Fähigkeiten lernen**: Handstand, L-Sit, erster Klimmzug, erster Dip, Pistol Squat,
  Muscle-Up, Front Lever — jeweils als Leiter aus Vorstufen, die sich freischalten,
  sobald eine Stufe sauber gehalten wird
- **Einheit mitschreiben**: Gewicht und Wiederholungen je Satz, mit den Werten vom
  letzten Mal als Vorgabe und einem konkreten nächsten Schritt je Übung
- **Vier-Wochen-Block**: Woche 1 mit mehr Reserve, Woche 3 schwer, Woche 4 Deload
- **Aufwärmen**: eine kurze Liste, die sich aus dem Tag ergibt — Kreislauf, dann
  Mobilisation für genau die Gelenke, die gleich arbeiten, dazu ein Aufwärmsatz an
  der ersten Übung. Etwa vier bis fünf Minuten
- **Unterwegs**: ein Schalter rechnet den Tag auf ein leeres Hotelzimmer um — nur
  Übungen, die mit Boden und Wand auskommen, ohne Tisch, Türrahmen oder Erhöhung.
  Der gespeicherte Plan bleibt unverändert
- **Pausenuhr**: läuft von selbst los, sobald ein Satz abgehakt ist. Die Länge richtet
  sich nach Last und Übung, und ein Regler stellt sie kurz, normal oder lang — mit der
  Dauer der ganzen Einheit als sichtbarer Folge
- **Tagesbericht und Wochenbericht**: jeden Tag die dringendsten Befunde, sonntags die
  ganze Woche — Training, Ernährung, Gewicht, Fähigkeiten. Konkret und ohne Schönreden
- **Fortschrittsfotos**: alle paar Wochen eine Aufnahme, zwei davon nebeneinander im
  Vergleich. Bleiben auf dem Gerät und gehen an keine API
- **Beweglichkeitstest**: fünf Prüfungen ohne Hilfsmittel, Schritt für Schritt
  angeleitet, alle paar Wochen zu wiederholen. Gemessen wird in Stufen, nicht in
  Zentimetern. Am Ende steht eine Auswertung von 0 bis 100 gegen gängige Richtwerte,
  mit der schwächsten Prüfung und ungleichen Seiten als Befund
- **Fortschritt**: Gewichtsverlauf mit Sieben-Tage-Schnitt, dann Kraftentwicklung je
  Übung und bewegte Last pro Woche — die Kraftwerte stehen oben, weil sie sich nach
  jeder Einheit ändern, Fotos und Beweglichkeit nur alle paar Wochen
- **Krafteinordnung**: je Muskelgruppe ein Wert von 0 bis 100, gemessen an Richtwerten,
  die auf das eigene Körpergewicht bezogen sind, dazu die Verhältnisse Drücken/Ziehen
  und Oberkörper/Beine
- **Variantenleitern**: wird eine Übung ohne Gewicht zu leicht, führt die App zur
  nächsten Stufe — von allein nach zwei Einheiten am oberen Ende, oder auf Knopfdruck
- **Sport außer dem Training**: Laufen, Rad, Yoga und anderes eintragen; der
  geschätzte Verbrauch hebt das Tagesziel
- **Apple Health**: keine laufende Verbindung möglich, aber die Export-Datei lässt sich
  einlesen — Workouts und Körpergewicht
- **Fotos ohne Verbindung**: ein Foto lässt sich aufheben und später auswerten. Bis
  dahin zählt es nirgends mit
- **Ausfallen lassen und nachholen**: eine Einheit mit Grund auslassen, an einem
  Ruhetag nachholen — der Bericht unterscheidet beides von „einfach nicht gemacht"
- **Kalorien nachsteuern**: weicht die gemessene Gewichtsveränderung vom Ziel ab,
  schlägt die App eine Korrektur vor — auf Knopfdruck übernommen

## Ohne API-Key ausprobieren

Du musst nichts aufladen, um die App zu testen.

**Alles außer der Foto-Analyse läuft sofort**: Mahlzeiten von Hand eintragen,
Kalorienring, Makrobalken, Verlauf, Favoriten. Dafür reicht Schritt 2 und 3 der
Einrichtung unten.

**Die Foto-Analyse kannst du über dein bestehendes Claude-Abo testen.** Nach dem
Fotografieren erscheint im Editor der Abschnitt *Über die Claude-App analysieren*
mit drei Schritten:

1. **Anweisung kopieren** — die App legt den fertigen Prompt in die Zwischenablage
2. **Foto teilen oder speichern** — auf dem Handy öffnet sich der Teilen-Dialog, am
   Rechner wird das Foto heruntergeladen
3. In der Claude-App beides einfügen, abschicken, die Antwort **komplett kopieren**
   und zurück ins Feld einfügen → *Werte übernehmen*

Die Werte landen im selben Editor wie beim API-Weg und lassen sich genauso
korrigieren. Kostet kein Guthaben, dafür pro Mahlzeit etwas Kopierarbeit — gut
geeignet, um die Schätzqualität zu beurteilen, bevor du dich entscheidest. Der Weg
bleibt auch später verfügbar, etwa wenn das Guthaben mal leer ist.

**Der Wechsel zwischen den Apps ist abgesichert.** Handys werfen Web-Apps beim
Wegwechseln gern aus dem Speicher, besonders iPhones. Die angefangene Mahlzeit wird
deshalb samt Foto gesichert und beim Zurückkommen wiederhergestellt — du landest
wieder genau im Editor, auch wenn die App zwischendurch komplett neu gestartet ist.
Nach dem Speichern oder Verwerfen ist der Entwurf weg, und liegengebliebene
Entwürfe werden nach zwölf Stunden verworfen.

## Einrichten

### 1. API-Key holen (optional)

Die Foto-Analyse läuft über die Anthropic-API mit **deinem eigenen Schlüssel**.

1. Konto anlegen auf [console.anthropic.com](https://console.anthropic.com)
2. Unter **Settings → API keys** einen neuen Key erstellen (beginnt mit `sk-ant-`)
3. Unter **Billing** Guthaben aufladen — **Minimum 5 $**

**Was das kostet:** Der Key selbst ist kostenlos, es gibt kein Abo und keine
Grundgebühr. Du zahlst nur, was du verbrauchst:

| Modell | pro Foto | 5 $ Guthaben reichen für |
|---|---|---|
| **Haiku 4.5** (Voreinstellung) | ca. 0,4 Cent | ~1.250 Fotos |
| Sonnet 5 | ca. 1,2 Cent | ~420 Fotos |
| Opus 5 | ca. 2 Cent | ~250 Fotos |

Bei drei Mahlzeiten am Tag reichen 5 $ mit Haiku gut über ein Jahr. Ist das Guthaben
leer, hört die Analyse einfach auf — es wird nichts automatisch abgebucht.

> Dein Claude-Abo auf claude.ai und der API-Key sind zwei getrennte Dinge.
> Das Abo gibt keinen API-Zugang.

### 2. App veröffentlichen (GitHub Pages)

Die App braucht HTTPS — sonst erlaubt der Browser keinen Kamerazugriff.
GitHub Pages liefert das kostenlos:

1. Im Repository `Claude` auf **Settings → Pages**
2. Unter *Source* **Deploy from a branch** wählen
3. Als Branch `claude/training-app-workout-plan-0e8m1p` wählen, Ordner `/ (root)`
4. Speichern und ein paar Minuten warten

Danach ist die App erreichbar unter
**https://nnh2266-dot.github.io/Claude/**

> **Nur ein Branch pro Repository.** GitHub Pages bedient pro Repository genau einen
> Branch. Solange oben dieser Branch eingestellt ist, liegt hier die Nährwerte-App.
> Soll später eine andere App unter derselben Adresse laufen, muss der Branch
> umgestellt oder alles in einen gemeinsamen Branch zusammengeführt werden.

Die App funktioniert in einem Unterordner genauso wie auf einer Domain-Wurzel: alle
Pfade sind relativ, und der Service Worker beansprucht nur seinen eigenen Unterordner.

### 3. Beim ersten Start: Fragebogen

Ohne Trainingsplan ist die App ein reiner Kalorienzähler mit von Hand gesetzten
Zielen. Unter *Training → Fragebogen starten* entstehen aus acht Fragen der Plan
und die Kalorienziele dazu — ab dann rechnet der Ring auf der Startseite gegen das
Ziel des jeweiligen Tages statt gegen einen festen Wert.

### 4. Aufs Handy legen

Die URL im Handy-Browser öffnen, dann:

- **iPhone (Safari)**: Teilen-Symbol → *Zum Home-Bildschirm*
- **Android (Chrome)**: Menü ⋮ → *App installieren* bzw. *Zum Startbildschirm zufügen*

Sie verhält sich danach wie eine normale App: eigenes Icon, kein Browser-Rahmen,
startet auch ohne Netz.

### 5. Key eintragen (falls du einen hast)

In der App unten rechts auf **Mehr** → API-Key einfügen → **Key speichern** →
**Verbindung testen**. Der Test kostet Bruchteile eines Cents und sagt dir sofort,
ob Key und Guthaben funktionieren.

Ohne Key nutzt du stattdessen den Weg über die Claude-App, siehe oben.

## Datenschutz und Sicherheit

- **Mahlzeiten, Fotos, Trainingsdaten und Gewichte bleiben auf dem Gerät**
  (IndexedDB). Es gibt keinen Server und keine Übertragung an Dritte.
- **Nur das jeweils analysierte Foto** wird an `api.anthropic.com` geschickt.
- **Der API-Key liegt unverschlüsselt** in der Browser-Datenbank dieses Geräts. Das
  ist bei diesem Muster ("bring your own key") normal, heißt aber: wer Zugriff auf
  dein entsperrtes Handy hat, kann ihn auslesen.
  **Empfehlung:** einen eigenen Key nur für diese App anlegen — dann lässt er sich im
  Anthropic-Konto einzeln widerrufen, ohne andere Dinge zu stören.
- Beim Löschen der Browserdaten für diese Seite ist auch alles andere weg.
  Unter *Mehr → Daten exportieren* gibt es eine Sicherungsdatei mit Mahlzeiten,
  Favoriten, Trainingsplan, Einheiten und Gewichten (ohne Fotos, ohne Key).

## Lokal ausprobieren

```bash
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen. `localhost` gilt als sicherer Kontext, deshalb
funktionieren dort Kamera und Service Worker auch ohne HTTPS.

## Aufbau

```
index.html               App-Shell
css/app.css              Design-Tokens, Light/Dark, Komponenten
js/app.js                Routing, gemeinsamer Zustand, Bootstrap
js/store.js              IndexedDB: Mahlzeiten, Favoriten, Einheiten, Gewichte, Einstellungen
js/nutrition.js          Summen, Datumslogik, Portionsskalierung
js/training.js           Übungsdatenbank, Plangenerator, Satzvorgaben, Progression
js/skills.js             Fähigkeiten: Stufenleitern, Ziele, Freischaltregeln
js/warmup.js             Aufwärmen, zusammengestellt aus den Gruppen des Tages
js/mobility.js           Beweglichkeitstest: Prüfungen, Stufen, Punkte, Vergleich
js/report.js             Tages- und Wochenbericht: Befunde aus den eigenen Daten
js/strength.js           Krafteinordnung: Richtwerte je Übung, Gruppen, Verhältnisse
js/ladders.js            Variantenleitern für Übungen ohne Zusatzgewicht
js/activities.js         Sport außer dem Training: MET-Werte, Schätzung, Anrechnung
js/health.js             Apple-Health-Export einlesen (Workouts, Körpergewicht)
js/version.js            Fassungsnummer, muss zur CACHE_VERSION in sw.js passen
js/energy.js             Grundumsatz, Tagesziele, Gewichtstrend, Kalorienkorrektur
js/claude.js             Anthropic-API + Chat-Brücke: Prompts (Foto und Text), Schema
js/image.js              Kamera-Foto verkleinern, Thumbnail, Base64
js/ui.js                 DOM-Helfer
js/views/                today · capture · history · favorites · settings
                         training · plan · progress · setup · mobility
                         report · photos · strength · activity
sw.js                    Service Worker (Offline-Betrieb)
manifest.webmanifest     PWA-Manifest
```

Reine ES-Module, keine Abhängigkeiten, kein Build. Änderungen an den App-Dateien
brauchen eine neue `CACHE_VERSION` in `sw.js` **und** eine neue `APP_VERSION` in
`js/version.js` — beide gehören zusammen, die eine wirft den Offline-Speicher weg,
die andere macht in der App sichtbar, welcher Stand läuft.

**Zur Aktualisierung:** Der Service Worker holt statische Dateien erst aus dem Netz
und nutzt den Cache nur als Rückfalllösung. Andersherum wäre es schneller, hätte aber
zur Folge, dass eine neue Fassung erst beim übernächsten Start erscheint — auf einem
Handy, das die App tagelang im Hintergrund hält, kann das ewig dauern. Zusätzlich
prüft die App beim Start und bei jeder Rückkehr in den Vordergrund auf eine neue
Fassung und lädt einmal neu, sobald ein neuer Service Worker übernimmt. Bleibt ein
Gerät trotzdem hängen, gibt es unter *Mehr → Fassung* den Knopf
*Offline-Speicher leeren und neu laden*.

`training.js`, `skills.js` und `energy.js` fassen kein DOM an — die Rechnerei ist damit einzeln
prüfbar, so wie `nutrition.js` es schon vorher war.

## Wie die Zahlen entstehen

**Grundumsatz** nach Mifflin-St Jeor, oder nach Katch-McArdle sobald ein Körperfett­
anteil eingetragen ist. Mal Aktivitätsfaktor (1,20 bis 1,65) ergibt den Verbrauch ohne
Training; je Einheit kommen rund 0,075 kcal pro Kilo und Trainingsminute dazu.

**Zielkalorien** je nach Ziel: −18 % beim Fettabbau, −5 % beim Formverbessern, +12 %
beim Aufbau — nach unten begrenzt auf das 1,1-fache des Grundumsatzes.

**Kalorienzyklus** verschiebt Kalorien von Ruhe- auf Trainingstage, ohne die
Wochensumme zu ändern. Gedeckelt bei 15 % des Tagesziels, sonst müssten bei sechs
Trainingstagen die wenigen Ruhetage die ganze Umverteilung tragen.

**Makros**: Eiweiß 1,8 bis 2,2 g/kg je nach Ziel (über 25 % Körperfett auf eine
fettärmere Bezugsmasse gerechnet), Fett mindestens 0,8 g/kg oder 20 % der Kalorien,
der Rest Kohlenhydrate — an Trainingstagen entsprechend mehr.

**Nachsteuerung**: Aus dem Sieben-Tage-Schnitt des Gewichts gegen die Vorwoche ergibt
sich die tatsächliche Veränderung in Prozent Körpergewicht pro Woche. Weicht sie um
mehr als 0,22 Prozentpunkte vom Ziel ab, schlägt die App eine Korrektur vor
(1 kg ≈ 7700 kcal, gedeckelt auf ±300 kcal pro Tag).

## Der Beweglichkeitstest

Fünf Prüfungen: Vorbeugen im Sitzen, Knie zur Wand, Hand über die Schulter,
Schmetterling, tiefe Hocke halten. Gebraucht wird nichts außer einer Wand und etwas
Boden.

**Gemessen wird in Stufen, nicht in Zentimetern.** Ein Maßband hat man selten dabei,
und an sich selbst angelegt verrutscht es ohnehin. Stattdessen hat jede Prüfung sechs
Stufen, beschrieben mit Anhaltspunkten, die immer da sind: die eigenen Finger quer als
Lineal, die Knöchel, die Zehen, die tastbare Spitze des Schulterblatts. Man schaut
nach, wie weit man kommt, und tippt die Beschreibung an, die passt. Für den Fall
dazwischen gibt es *Hat gerade so gereicht* — das zählt als halbe Stufe, damit auch
langsamer Fortschritt sichtbar wird.

Die Stufen sind aufsteigend sortiert, von unbeweglich zu beweglich. Damit ist überall
mehr besser und der Vergleich braucht keine Sonderfälle. Die tiefe Hocke zählt in
Sekunden und bringt ihre eigene Stoppuhr mit; der Bildschirm bleibt dabei an.

Der Test läuft **Schritt für Schritt, eine Prüfung pro Bildschirm**. Zu jeder steht
offen sichtbar, wie sie aufgebaut wird — nummeriert, in der Reihenfolge, in der man es
tut — und was nicht zählt, also die üblichen Selbstbetrügereien: Wippen, gebeugte
Knie, mit der zweiten Hand nachhelfen. Ohne das misst man beim zweiten Mal anders als
beim ersten, und der Vergleich wäre wertlos.

Drei Prüfungen laufen je Seite. Der Chip darüber schaltet um und zeigt den Stand
beider Seiten; nach der ersten Wahl springt er von allein auf die andere Seite.

Im Fortschritt steht danach je Prüfung die Stufe samt Beschreibung und die Veränderung
zur Messung davor. Sind die Seiten ungleich, entfällt die Beschreibung: der Mittelwert
von Stufe 4 und Stufe 2 ist Stufe 3, und auf der steht keine der beiden Seiten.

### Die Auswertung

Nach dem Speichern kommt zuerst eine Auswertung, nicht der Fortschritt: zehn Minuten
Messen sollen mit einer Zahl enden, die man nicht suchen muss.

Jede Stufe hat einen Punktwert von 0 bis 100 (`norm` je Prüfung, `zeitNorm` für die
Hocke, dazwischen linear interpoliert, damit auch halbe Stufen zählen). Die
Stützpunkte sind an gängigen Richtwerten ausgerichtet, nicht an einer Rangliste: die
Zehen erreichen, das Knie eine Handbreit vor der Wand, die Fingerspitzen an der
unteren Schulterblattspitze — das gilt jeweils als unauffällig bis gut, und dort liegt
die Grenze zu „gut" (70 Punkte).

Der Gesamtwert ist der Mittelwert der Prüfungen, **die auch gemessen wurden**. Wer
zwei überspringt, bekommt keine schlechtere Zahl, sondern eine aus drei Prüfungen —
deshalb steht immer dabei, aus wie vielen sie gerechnet ist.

| Punkte | Einordnung |
| --- | --- |
| 85–100 | Sehr gut |
| 70–84 | Gut |
| 55–69 | Brauchbar |
| 35–54 | Eingeschränkt |
| 0–34 | Deutlich eingeschränkt |

Dazu kommen zwei Dinge, die ein Mittelwert verschluckt: die **schwächste Prüfung** als
größter Hebel, und **ungleiche Seiten** ab einer Stufe Unterschied — zwei Seiten, die
weit auseinanderliegen, ergeben im Mittel einen unauffälligen Wert. Liegt eine frühere
Messung vor, steht neben jeder Zahl die Veränderung in Punkten.

Im Fortschritt steht die Punktzahl als Karte; ein Tipp darauf öffnet die ganze
Auswertung erneut.

Empfohlener Abstand: 28 Tage. Öfter zu messen zeigt vor allem Tagesform.

Messungen aus der ersten Fassung des Tests lagen in Zentimetern vor und sind mit den
Stufen nicht vergleichbar. Sie bleiben gespeichert, tauchen aber nicht mehr auf —
`hasResults()` erkennt sie an den alten Kennungen und lässt sie liegen.

## Krafteinordnung je Muskelgruppe

Zwei Fragen: Wie stark ist eine Gruppe gemessen am eigenen Körpergewicht, und wie
stehen die Gruppen zueinander?

**Der Bezug aufs Körpergewicht ist der Kern.** 80 kg Bankdrücken heißt bei 60 kg
Körpergewicht etwas anderes als bei 100 kg. `STANDARDS` in `strength.js` hält deshalb
je Übung fünf Stützpunkte für 0, 25, 50, 75 und 100 Punkte, in zwei Bauarten:

- `art: 'last'` — geschätztes Einwiederholungsmaximum geteilt durchs Körpergewicht.
  Bankdrücken etwa 0,5 / 0,75 / 1,0 / 1,25 / 1,5. Bei Kurzhanteln gilt die Zahl je Hantel.
- `art: 'wdh'` — Wiederholungen eines sauberen Satzes ohne Zusatzgewicht. Liegestütze
  5 / 15 / 25 / 40 / 60. Hier steckt der Körpergewichtsbezug schon in der Übung.

Dazwischen wird linear interpoliert. Die Niveaus heißen Anfang, Geübt,
Fortgeschritten, Stark und Sehr stark. Für Frauen werden die `last`-Richtwerte
skaliert (Oberkörper 0,65, Beine 0,80) — ohne das stünde bei gleicher Leistung eine
schlechtere Einordnung, und die wäre schlicht falsch.

Maßgeblich für eine Gruppe ist die **bestbewertete Übung**, nicht der Durchschnitt: wer
schwer Bankdrücken kann, hat eine starke Brust, auch wenn daneben ein halbherziger Satz
Fliegende steht.

**Verhältnisse** vergleichen Drücken (Brust, Schultern) mit Ziehen (Rücken, hintere
Schulter) und Oberkörper mit Beinen; ab zwölf Punkten Unterschied gilt das als schief.
Die Arme bleiben bewusst draußen — ein starker Curl würde sonst die ganze Seite
„Ziehen" hochziehen, obwohl der Rücken schwach ist. Fehlt eine Seite ganz, kommt kein
Befund: ein Ungleichgewicht zwischen einer gemessenen und einer nie trainierten Seite
wäre keine Erkenntnis, sondern eine Datenlücke.

Dazu kommt die **Satzverteilung der letzten vier Wochen** und, welche Gruppen im Plan
stehen, aber keinen einzigen Satz gesehen haben.

Am Ende steht, was die Zahlen wert sind, und das gehört dazu: die Richtwerte sind grobe
Erfahrungswerte und schwanken mit Hebeln, Alter und Trainingsjahren um zehn bis zwanzig
Punkte; nur ein Teil der Übungen hat überhaupt einen; die Epley-Schätzung wird bei zwölf
Wiederholungen gedeckelt, weil sie darüber deutlich überschätzt; und gerechnet wird mit
dem besten Satz überhaupt, nicht dem der laufenden Woche. Wo kein Richtwert existiert —
etwa beim Handtuch-Rudern im Sitzen, wo der Widerstand aus den eigenen Beinen kommt —
steht ausdrücklich keine Zahl statt einer erfundenen.

## Sport außer dem Training

Laufen, Rad, Schwimmen, Yoga — was nicht im Trainingsplan steht, kommt in den Store
`activities`; mehrere je Tag sind möglich, wer morgens läuft und abends zum Yoga geht
trägt beides ein.

Der Verbrauch wird über **MET-Werte** geschätzt: `MET × 3,5 × kg / 200` Kalorien pro
Minute, wobei die Intensität den MET-Wert mit 0,75 / 1,0 / 1,25 verschiebt. Wer eine Uhr
trägt, die den Puls kennt, trägt deren Wert ein — der schlägt jede Formel und hat
Vorrang.

**Aufs Tagesziel kommen nur 70 Prozent davon** (`ANRECHNUNG`). Zwei Gründe: MET-Tabellen
schätzen großzügig, weil sie von gleichmäßigem Tempo im Labor ausgehen, und im
Aktivitätsfaktor des Profils steckt bereits Alltagsbewegung — ein Teil des Spaziergangs
ist dort schon eingerechnet. Wer den vollen Wert dazuisst, wundert sich am Monatsende
über die Waage. Die Zusatzkalorien tragen die Kohlenhydrate: Eiweiß und Fett folgen dem
Körpergewicht, nicht dem Tagesverbrauch, und würden durch einen Lauf nicht wichtiger.

## Apple Health

**Eine laufende Verbindung gibt es nicht, und zwar grundsätzlich.** HealthKit hat keine
Web-Schnittstelle; nur native iOS-Apps mit eigener Berechtigung kommen an die Daten.
Diese App läuft im Browser und kann Health weder lesen noch schreiben — daran ändert
kein Umweg etwas. Das steht so auch in den Einstellungen, gleich als erster Satz: wer
„Apple Health" liest, erwartet einen Schalter, und das früh zu sagen ist ehrlicher, als
es hinter einer Anleitung zu verstecken.

Was geht, ist der **Export**. Health legt auf Wunsch eine Datei mit allem an; `health.js`
liest daraus Workouts und Körpergewicht. Die Datei ist oft mehrere hundert Megabyte
groß, weil jeder Schrittzähler-Eintrag seit Jahren darin steht — deshalb wird sie in
Stücken von 4 MB gelesen und mit einem Ausdruck durchsucht, statt als XML-Baum geladen
zu werden; Letzteres bringt jeden Browser um. Ein Überlappungsrest von 64 KB fängt
Datensätze ab, die an einer Stückgrenze zerrissen werden.

Beide Formate werden erkannt: ältere Exporte schreiben Strecke und Kalorien als
Attribute des `<Workout>`, neuere als verschachtelte `<WorkoutStatistics>`.

**Krafteinheiten aus Health werden übersprungen** — die führt diese App selbst, mit
Sätzen und Gewichten, und ein zweiter Eintrag daneben würde die Kalorien doppelt zählen.
Die Kennung eines importierten Workouts leitet sich aus Startzeit und Art ab, ein
zweiter Import überschreibt deshalb, statt zu verdoppeln.

## Wenn etwas dazwischenkommt

### Fotos ohne Verbindung

Ohne Netz fragt die App gar nicht erst an — der Fehlschlag dauerte sonst bis zum
Zeitablauf, und die Meldung danach erklärt nichts. Stattdessen steht im Editor
**Für später aufheben**: das Bild wandert in den Store `pending` und wartet dort.

Bewusst **kein Platzhalter in den Mahlzeiten**. Ein Eintrag mit null Kalorien würde in
Tagessumme, Zielen und Bericht mitzählen und die Zahlen still verfälschen. Bis zur
Auswertung ist die Mahlzeit schlicht noch nicht erfasst — das ist die Wahrheit, und der
Bericht darf sie ruhig sagen.

Auf der Tagesansicht steht dann eine Karte mit den wartenden Bildern. Ausgewertet wird
eines nach dem anderen über den normalen Editor, damit dieselben Korrekturen gelten wie
bei einem frischen Foto — Portionsregler, Zutaten, Hinweis nachtragen — statt dass ein
Stapel ungeprüft in den Tag rutscht. Kommt die Verbindung zurück, sagt die App einmal
Bescheid; auswerten soll, wer gerade Zeit dafür hat.

### Ausfallen lassen

Besser eine Einheit bewusst auslassen als eine halbe absolvieren. Nach zu wenig Schlaf
ist die Kraft ohnehin weg und das Risiko steigt. Im Training steht deshalb
*Heute geht nichts?* mit fünf Gründen: gereist, zu wenig Schlaf, krank, Schmerzen,
keine Zeit.

Der Grund ist kein Schmuck. Ohne ihn steht im Wochenbericht nur „ausgefallen", und das
liest sich gleich, ob man verreist war oder es vergessen hat. Mit ihm trennt der Bericht
**„Bewusst ausgelassen: Mittwoch (übermüdet)"** als Tatsache von **„Ausgefallen ohne
Eintrag: Freitag"** als Befund, und das Fazit rechnet bewusst ausgelassene Einheiten
nicht als Fehlbetrag.

### Nachholen

An einem Ruhetag listet die App offene Einheiten der letzten zehn Tage — höchstens drei
zur Auswahl, denn nachgeholt wird eine, und eine lange Liste liest sich wie eine
Mahnung. Tage vor der Planerstellung zählen nicht mit: da gab es keinen Plan, gegen den
sie hätten ausfallen können.

Dieselbe Liste steht auch an Trainingstagen, dort ohne den Nachholknopf: **der Grund
lässt sich für jeden vergangenen Tag nachtragen.** Wer erst am nächsten Morgen dazu
kommt, den Ausfall einzutragen, käme sonst gar nicht an den richtigen Tag heran und
bucht ihn auf den heutigen.

*Heute nachholen* setzt `session.holtNach` auf den ausgefallenen Tag; die Trainingsansicht
zeigt dann dessen Plan statt des heutigen, und in der Kopfzeile steht, woher er kommt.
Der ausgefallene Tag bekommt umgekehrt ein `movedTo` und verschwindet aus der Liste.
Nur an Ruhetagen — zwei Einheiten an einem Tag sind keine Rettung, sondern der nächste
Ausfall.

## Die Berichte

Ehrlich heißt konkret. „Bleib dran!" ist keine Rückmeldung, „drei von vier Einheiten,
die vom Donnerstag fehlt" ist eine. `report.js` erzeugt deshalb keinen Fließtext aus
Bausteinen, sondern eine Liste von Befunden mit je einer Bewertung: **gut**,
**schlecht** oder schlicht eine **Tatsache**. Alles wird lokal gerechnet — der Bericht
läuft offline, kostet nichts und sagt zu denselben Zahlen jeden Tag dasselbe.

Der **Tagesbericht** steht als Karte oben auf der Tagesansicht, mit den zwei
dringendsten Zeilen zuerst; Schlechtes steht vor Gutem, dafür ist er da. Er prüft die
Einheit des Tages, die Kalorien, das Eiweiß und ob gewogen wurde.

Der **Wochenbericht** läuft von Montag bis Sonntag und deckt Training (Einheiten,
Ausfälle, bewegte Last gegen die Vorwoche), einzelne Übungen (bester Satz gegen den
besten Satz der Vorwoche), Ernährung, Gewicht samt Korrekturvorschlag sowie
Fähigkeiten und Beweglichkeit ab. Am Ende steht ein Fazit-Satz.

**Mitten in der Woche urteilt er anteilig.** Am Dienstag ist eine Einheit vom Freitag
nicht versäumt, der laufende Tag ist keine Erfassungslücke, und die Vier-Werte-Regel
fürs Wiegen gilt anteilig zu den vergangenen Tagen. Ohne das stünde am Dienstagmorgen
eine Liste von Vorwürfen, die keine sind.

Was die App **nicht** weiß, sagt sie auch: eine Woche ohne eingetragene Gewichte ist
ein Befund, kein Loch zum Überspielen. Und wo ein Durchschnitt nur die erfassten Tage
abdeckt, steht das dabei — sonst sieht die Woche besser aus, als sie war. Genauso beim
Volumenvergleich: hat die Woche mehr oder weniger Einheiten als die Vorwoche, sagt der
Bericht das dazu, weil der Prozentwert sonst wie Fortschritt aussieht.

## Fortschrittsfotos

Die Waage misst eine Zahl, das Foto misst, was die Zahl nicht zeigt — bei
gleichbleibendem Gewicht kann sich die Form deutlich ändern. Ein Bild je Tag, ein
zweites am selben Tag ersetzt das erste; sonst sammeln sich zehn Aufnahmen einer Pose
und der Vergleich wird zur Suche.

Die Ansicht zeigt zuerst zwei Aufnahmen nebeneinander — ältestes gegen neuestes, per
Tipp auf eine Kachel änderbar, wobei die ältere immer links landet. Beim ersten Öffnen
steht dort stattdessen, worauf es ankommt: gleiche Stelle, gleiches Licht, gleicher
Abstand, gleiche Haltung, morgens vor dem Frühstück. Ohne das vergleicht man Posen.

Die Bilder liegen im Store `photos`, getrennt von den Mahlzeiten, und **verlassen das
Gerät nicht** — anders als die Essensfotos werden sie ausdrücklich nicht an die API
geschickt. Im Export sind sie deshalb auch nicht enthalten.

## Wie Fähigkeiten funktionieren

Handstand, L-Sit, erster Klimmzug, erster Dip, Pistol Squat, Muscle-Up und Front
Lever stehen zur Wahl — bis zu zwei gleichzeitig. Jede ist eine Leiter aus fünf bis
sieben Vorstufen mit einem Ziel je Stufe, etwa „Hollow Hold, 40 Sekunden, drei Sätze".
Beim Anlegen wird gefragt, auf welcher Stufe man schon steht — wer den Wandhandstand
zwanzig Sekunden hält, fängt nicht bei „Hollow Hold" an. Im Training verschieben
*Zu leicht* und *Zu schwer* die Stufe jederzeit.

Treffen zwei der drei Sätze das Ziel, geht die nächste Stufe auf; freigeschaltet wird
per Knopfdruck, nicht automatisch — die Entscheidung, ob eine Haltung wirklich sauber
war, trifft niemand außer dir.

**Haltezeiten misst die App selbst.** Bei jeder Stufe, die in Sekunden zählt, steht
über den Satzfeldern eine Stoppuhr: einmal tippen zum Starten, beim Runterkommen
wieder — der Wert landet direkt im nächsten leeren Satz. Ist die Zielzeit erreicht,
vibriert das Gerät und gibt zwei Töne aus; kopfüber sieht man den Bildschirm nicht.
Solange gemessen wird, bleibt der Bildschirm an. Bei Stufen, die Wiederholungen
zählen, erscheint keine Uhr.

Geübt wird **vor** dem Krafttraining: Technik braucht einen frischen Kopf und frische
Schultern, danach wäre beides weg. Jede gewählte Fähigkeit kostet rund sechs Minuten,
und diese Zeit wird von der Kraftplanung abgezogen — sonst würde die Einheit still und
heimlich länger, als im Fragebogen angesagt.

## Wie der Plan entsteht

Split nach verfügbaren Tagen: ein bis drei Tage Ganzkörper (ab „fortgeschritten" bei
drei Tagen Push/Pull/Beine), vier Tage Oberkörper/Unterkörper, fünf gemischt, sechs
Push/Pull/Beine doppelt. Die Übungszahl folgt der Zeit pro Einheit, Sätze und RIR der
Erfahrungsstufe.

Aus 87 Übungen wird nach Ausrüstung, vorhandenem Gerät und Beschwerden gefiltert;
gesperrte Übungen werden gar nicht erst eingeplant.

**Gerät ist dabei etwas anderes als Gewicht.** Ein Klimmzug braucht keine Hantel, aber
sehr wohl eine Stange — deshalb fragt der Fragebogen getrennt nach Klimmzugstange und
Dip-Barren. Ohne Kreuz dort erscheinen Klimmzüge, Dips und hängendes Beinheben gar
nicht im Plan, und für den Rücken stehen stattdessen Rudern unter dem Tisch und
Handtuch-Rudern am Türrahmen bereit. Fähigkeiten, die eine Stange verlangen, werden
bei der Auswahl gar nicht erst angeboten. Bleibt eine Muskelgruppe ohne Option, greift eine
Ersatzgruppe. Bleibt ein Tag trotzdem kurz — etwa nur Körpergewicht plus
Schulterbeschwerden —, sagt der Plan das offen, statt die Liste aufzufüllen.

Übungen ohne Zusatzgewicht bekommen höhere Wiederholungszahlen (10–20 statt 5–8),
weil der Fortschritt dort über Wiederholungen und schwerere Varianten läuft.

### Die Pausen

Die Pause richtet sich danach, was sie erholen muss. Eine schwere Kniebeuge mit der
Langhantel braucht das Kreislaufsystem zurück — zweieinhalb Minuten. Zwanzig
Liegestütze bei vier Wiederholungen Reserve brauchen das nicht; dort ist nach
anderthalb Minuten zurück, was zurückkommt, und der Rest ist Wartezeit.

| | Grundübung | Isolation |
| --- | --- | --- |
| mit Gewicht | 150 s | 75 s |
| ohne Zusatzgewicht | 90 s | 60 s |
| Rumpf | 45 s | 45 s |

Darüber liegt ein Regler mit den Faktoren 0,7 / 1,0 / 1,3, mindestens aber 30 Sekunden.
Daneben steht die **geschätzte Dauer der ganzen Einheit** — eine Pause von zweieinhalb
Minuten klingt nach nichts, aber vierzehn davon sind eine halbe Stunde Dastehen, und
erst die Gesamtzahl macht die Entscheidung entscheidbar.

`restSeconds()` rechnet das bei der Anzeige, nicht beim Bauen des Plans. Sonst müsste
der Plan neu gebaut werden, nur weil jemand am Regler dreht, und bestehende Pläne
behielten ihre alten Werte.

### Unterwegs

Ein Plan, der einen stabilen Tisch voraussetzt, ist im Hotelzimmer kein Plan. Oben im
Training steht deshalb ein Schalter, der den Tag auf das umrechnet, was in einem leeren
Zimmer geht: **nur Übungen, die mit Boden und Wand auskommen.**

Dafür gibt es neben `GEAR` eine zweite Liste, `NEEDS_OBJECT`. Die beiden beantworten
verschiedene Fragen — `GEAR` fragt „hast du das angeschafft?", `NEEDS_OBJECT` fragt
„steht das gerade im Raum?". Darunter fällt, was man zuhause gar nicht als Ausrüstung
wahrnimmt: ein Tisch, unter den man sich legt, ein Türgriff, eine Kante hinter dem
Rücken, eine Erhöhung für den hinteren Fuß. `floorOnly()` verlangt alle drei
Bedingungen — mit Körpergewicht machbar, kein Gerät, kein Gegenstand.

`travelDay()` ersetzt jede übrige Übung durch eine aus derselben Gruppe und Art, sonst
aus der Gruppe, sonst aus der Ersatzgruppe. Findet sich nichts, fällt die Übung weg,
statt falsch ersetzt zu werden. Damit dafür genug da ist, kennt die App vier
Rückenübungen, die wirklich nichts brauchen: Handtuch-Rudern im Sitzen (der Widerstand
kommt aus den eigenen Beinen), Latzug in Bauchlage, Umgekehrte Schneeengel und
Superman.

Der **gespeicherte Plan bleibt dabei unangetastet**, und nichts wandert in `blocked`:
die Übung ist nicht ungeeignet, sie passt nur nicht in den Raum. Ein Ausschalter steht
sichtbar in derselben Karte, zusammen mit der Liste dessen, was getauscht wurde — ein
Modus, der den Plan still umschreibt, wird sonst vergessen. Fähigkeiten, die eine
Stange oder einen Barren verlangen, blendet der Schalter ebenfalls aus.

*Zu schwer* wirkt unterwegs auf die Sperrliste statt auf den Plan, weil die gezeigte
Übung im gespeicherten Plan gar nicht vorkommt. Gibt der Vorrat nichts mehr her, sagt
die App das, statt die Übung ersatzlos zu streichen.

**Passt eine Übung nicht, fliegt sie raus.** Unter jeder Übung steht im Training
*Zu schwer — andere Übung*: die App tauscht sofort gegen eine andere aus derselben
Muskelgruppe und merkt sich die abgelehnte, damit sie auch bei einem neuen Plan nicht
zurückkommt. Im Plan stehen die aussortierten Übungen mit einem Knopf zum
Wiederzulassen.

### Variantenleitern

Mit Hanteln ist die nächste Stufe einfach mehr Gewicht — das erledigt die doppelte
Progression. Ohne Gewicht gibt es diesen Weg nicht: irgendwann sind sechzig
Liegestütze kein Krafttraining mehr, sondern Ausdauer. Dann muss die Übung schwerer
werden, nicht länger.

`ladders.js` beschreibt dafür sieben Bewegungen von leicht nach schwer:

| Leiter | Sprossen |
| --- | --- |
| Drücken waagerecht | erhöht → Liegestütze → Pseudo-Planche → Archer → einarmig negativ |
| Drücken über Kopf | Pike Push-Ups → negative Handstand-Liegestütze → Handstand-Liegestütze |
| Ziehen waagerecht | Latzug in Bauchlage → Handtuch im Sitzen → am Türrahmen → unter dem Tisch → Schrägrudern |
| Ziehen über Kopf | negative Klimmzüge → Chin-Ups → Klimmzüge |
| Kniebeuge | Körpergewicht → Ausfallschritt → Step-Up → bulgarisch → Skater → einbeinig |
| Hüftstreckung | Glute Bridge → einbeinig |
| Trizeps strecken | Bankdips → Diamant-Liegestütze |

Unter jeder Übung steht, auf welcher Sprosse sie liegt und welche als nächste kommt.
Daneben dem vorhandenen *Zu schwer* gibt es **Zu leicht — härtere Stufe**; der Knopf
erscheint nur, wenn es mit der vorhandenen Ausrüstung überhaupt eine höhere Sprosse
gibt. Nicht machbare Sprossen werden beim Auf- und Absteigen übersprungen statt
vorgeschlagen und dann abgelehnt.

**Von allein meldet sich die App nach zwei Einheiten in Folge am oberen Ende des
Wiederholungsbereichs** (`topOutStreak`, Schwelle `STREAK_FOR_NEXT`). Nach einer
einzelnen guten Einheit umzustellen wäre verfrüht — ein guter Tag ist noch keine neue
Stufe. Gezählt wird über die Einheiten, in denen die Übung vorkam, eine Woche Pause
unterbricht also nicht; und verlangt wird nicht die heutige Satzzahl, sondern dass alle
aufgezeichneten Sätze oben lagen und es mindestens zwei waren. Sonst risse die Serie
bei jedem Wechsel der Blockwoche, weil die Deload-Woche weniger Sätze hat.

Die verlassene Übung landet in `profile.outgrown`, **nicht** in `blocked`. Der
Unterschied zählt: die Sperrliste heißt im Plan „aussortiert", und „zu leicht geworden"
ist das Gegenteil davon. Beide Listen halten Übungen aus neuen Plänen heraus, beide
stehen im Plan mit einem Knopf zum Zurückholen — aber unter eigener Überschrift.

Im Unterwegs-Betrieb nutzt auch der Ersatz die Leitern: fehlt der Tisch, kommt die
nächstgelegene Sprosse derselben Bewegung statt irgendetwas aus derselben Gruppe, bei
gleichem Abstand die leichtere.

Fortschritt je Übung nach doppelter Progression: sitzen alle Sätze am oberen Ende des
Wiederholungsbereichs, steigt das Gewicht um 2,5 kg (Grundübung) oder 1,25 kg
(Isolation) und die Wiederholungen gehen zurück ans untere Ende.

## Technische Anmerkungen

- Die App ruft die Anthropic-API direkt aus dem Browser auf. Das erlaubt Anthropic
  mit dem Header `anthropic-dangerous-direct-browser-access: true` ausdrücklich für
  genau diesen Fall — deshalb braucht es keinen Proxy-Server.
- Die Antwort wird über **Structured Outputs** (`output_config.format`) erzwungen,
  ist also garantiert gültiges JSON nach festem Schema. Kein Parsen aus Fließtext.
- Im Chat gibt es diese Garantie nicht, deshalb verlangt der Prompt dort reines JSON
  und das Einlesen toleriert Code-Blöcke sowie erklärenden Text drumherum.
- Fotos werden vor dem Senden auf 1024 px lange Kante verkleinert. Das halbiert
  ungefähr die Bildkosten, ohne die Erkennung von Essen spürbar zu verschlechtern.
- Der Tag richtet sich nach dem **lokalen** Kalendertag, nicht nach UTC — sonst
  würden späte Mahlzeiten auf dem falschen Tag landen.
- Schlägt die Analyse fehl (kein Netz, Guthaben leer, Key ungültig), bleibt das Foto
  erhalten und die Mahlzeit lässt sich von Hand eintragen. Es geht nie etwas verloren.
