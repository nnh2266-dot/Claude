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

## Warum es das gibt

Die Prüfläufe dieser App haben lange Zahlen ausgedruckt, und jemand musste sie
ansehen. Was nur druckt, kann nicht durchfallen — ein Fehler steht dann mitten
im Text und niemand merkt es. Hier muss jede Erwartung ausgesprochen werden,
und was nicht stimmt, zählt am Ende in einer Zahl und in einem Ausgangswert.

Jede Prüfung hier stammt entweder aus einem Fehler, den es einmal gab, oder aus
einer Quelle, die in den Dateien zitiert ist.
