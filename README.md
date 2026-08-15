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
- **Fortschritt**: Gewichtsverlauf mit Sieben-Tage-Schnitt, Kraftentwicklung je Übung,
  bewegte Last pro Woche
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
js/version.js            Fassungsnummer, muss zur CACHE_VERSION in sw.js passen
js/energy.js             Grundumsatz, Tagesziele, Gewichtstrend, Kalorienkorrektur
js/claude.js             Anthropic-API + Chat-Brücke: Prompts, Schema, Fehlertexte
js/image.js              Kamera-Foto verkleinern, Thumbnail, Base64
js/ui.js                 DOM-Helfer
js/views/                today · capture · history · favorites · settings
                         training · plan · progress · setup
sw.js                    Service Worker (Offline-Betrieb)
manifest.webmanifest     PWA-Manifest
```

Reine ES-Module, keine Abhängigkeiten, kein Build. Änderungen an den App-Dateien
brauchen eine neue `CACHE_VERSION` in `sw.js`, damit Geräte die neue Fassung laden.

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

## Wie Fähigkeiten funktionieren

Handstand, L-Sit, erster Klimmzug, erster Dip, Pistol Squat, Muscle-Up und Front
Lever stehen zur Wahl — bis zu zwei gleichzeitig. Jede ist eine Leiter aus fünf bis
sieben Vorstufen mit einem Ziel je Stufe, etwa „Hollow Hold, 40 Sekunden, drei Sätze".
Treffen zwei der drei Sätze das Ziel, geht die nächste Stufe auf; freigeschaltet wird
per Knopfdruck, nicht automatisch — die Entscheidung, ob eine Haltung wirklich sauber
war, trifft niemand außer dir.

Geübt wird **vor** dem Krafttraining: Technik braucht einen frischen Kopf und frische
Schultern, danach wäre beides weg. Jede gewählte Fähigkeit kostet rund sechs Minuten,
und diese Zeit wird von der Kraftplanung abgezogen — sonst würde die Einheit still und
heimlich länger, als im Fragebogen angesagt.

## Wie der Plan entsteht

Split nach verfügbaren Tagen: ein bis drei Tage Ganzkörper (ab „fortgeschritten" bei
drei Tagen Push/Pull/Beine), vier Tage Oberkörper/Unterkörper, fünf gemischt, sechs
Push/Pull/Beine doppelt. Die Übungszahl folgt der Zeit pro Einheit, Sätze und RIR der
Erfahrungsstufe.

Aus 76 Übungen wird nach Ausrüstung, vorhandenem Gerät und Beschwerden gefiltert;
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
