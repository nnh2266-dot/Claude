# Prüflauf

```
NODE_PATH=$(npm root -g) node test/run.js
```

Einzelne Gruppen:

```
node test/run.js logik quelltext plaene      # ohne Browser, wenige Sekunden
NODE_PATH=$(npm root -g) node test/run.js ansichten wege daten
```

## Was geprüft wird

| Gruppe | Braucht Browser | Prüft |
|---|---|---|
| `logik` | nein | Die rechnenden Module: Trinkziel, MET-Werte, Einheiten, RIR, Blockwochen, Leitern, Beckenboden, Krafteinordnung |
| `quelltext` | nein | Fassung gegen Offline-Kennung, Importe, Klassen im Stylesheet, Ansichten im HTML, keine Modellkennungen |
| `plaene` | nein | Jede Kombination aus Ausrüstung, Erfahrung, Tagen, Zeit, Ziel, Geschlecht, Technik und Geräten — Zeitbudget, Bewegungsmuster, Leitersprossen, Wochenvolumen |
| `ansichten` | ja | Jede Ansicht erscheint, zeigt Inhalt und wirft keine Ausnahme |
| `wege` | ja | Erster Start, Fragebogen, Mahlzeit eintragen, Satz eintragen, Übung aussortieren, Einheit abschließen |
| `daten` | ja | Jede Art von Eintrag speichern, Neustart überstehen, Export und Import, Leitersprossen beim Neubau |
| `auswertung` | ja | Überblick, Wochenbericht, Schlafregelmäßigkeit, Richtung je Übung, Belastungsverlauf, Betrieb ohne Netz |
| `dauerlauf` | nein | Sechsundzwanzig Wochen durchgerechnet: steigt die Leiter wirklich, bleibt jemand auf einer zu leichten Sprosse hängen, kommt die Entlastungswoche, warnt die App vor ihrem eigenen Plan, wächst die Einheit aus ihrem Zeitfenster |
| `verlauf` | nein | Die vier Rechnungen ohne neue Eingabe: Streuung der Schlafzeiten über Mitternacht, geschätztes Maximum, Rückgang gegen Tagesform, Belastungsmuster nach einer Entlastungswoche |

## Warum es das gibt

Die Prüfläufe dieser App haben lange Zahlen ausgedruckt, und jemand musste sie
ansehen. Was nur druckt, kann nicht durchfallen — ein Fehler steht dann mitten
im Text und niemand merkt es. Hier muss jede Erwartung ausgesprochen werden,
und was nicht stimmt, zählt am Ende in einer Zahl und in einem Ausgangswert.

Jede Prüfung hier stammt entweder aus einem Fehler, den es einmal gab, oder aus
einer Quelle, die in den Dateien zitiert ist.

## Warum es den Dauerlauf gibt

Die teuersten Fehler dieser App waren nie kaputte Bauteile. Sie waren
Mechanismen, die vollständig und richtig programmiert waren — und im echten
Gebrauch nie losgingen.

Der Vorschlag „Zeit für die nächste Stufe" verlangte, dass alle Sätze am oberen
Rand liegen, bei einem oberen Rand von zwanzig Wiederholungen. Über fünf gerade
Sätze fallen die Wiederholungen aber immer ab. Kein Bauteil war kaputt, keine
Prüfung fiel durch — trotzdem stand jemand ein halbes Jahr an derselben
Sprosse.

Solche Fehler sieht man nur in der Zeit. Deshalb trainiert im `dauerlauf` ein
ausgedachter Mensch sechsundzwanzig Wochen lang, mit Wiederholungen, die über
die Sätze abfallen, und einer Leistung, die sich langsam bessert. Gefragt wird
nicht „geht es?", sondern „bewegt sich etwas?".

Gegengeprüft gegen Fassung 52 meldete er: Liegestütze 22× in Folge zu leicht,
Ausfallschritte 20×. Genau das, was man beim Benutzen als „ich verbessere mich
nicht wirklich" spürt.
