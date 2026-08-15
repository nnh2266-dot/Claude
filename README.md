# Formkurve

Trainingsplan-Generator mit gekoppelter Kalorienrechnung. Die App stellt sieben
Fragen, baut daraus einen Split, und rechnet Kalorien und Makros passend dazu —
an Trainingstagen mehr, an Ruhetagen weniger. Danach korrigiert sie beides
anhand des tatsächlichen Gewichtsverlaufs.

Eine einzelne HTML-Datei, keine Abhängigkeiten, keine Server. Alle Daten bleiben
im `localStorage` des Browsers.

## Aufbau

| Datei | Zweck |
| --- | --- |
| `src/app.html` | Quelle — hier wird entwickelt |
| `build.py` | bettet die Schriften als data:-URI ein |
| `index.html` | gebaute Fassung, direkt im Browser lauffähig |
| `assets/fonts/` | Big Shoulders, Instrument Sans, Geist Mono (OFL, Lizenzen liegen bei) |

```sh
python3 build.py     # schreibt index.html neu
```

`index.html` ist eingecheckt, damit die Datei ohne Build-Schritt geöffnet oder
veröffentlicht werden kann. Nach jeder Änderung an `src/app.html` neu bauen.

## Was die App rechnet

**Grundumsatz** über Mifflin-St Jeor, oder Katch-McArdle, sobald ein Körperfett­
anteil angegeben ist. Mal Aktivitätsfaktor (1,20–1,65) ergibt den Verbrauch ohne
Training. Dazu kommen rund 0,075 kcal pro kg und Trainingsminute je Einheit.

**Zielkalorien** je nach Ziel: −18 % (Fett verlieren), −5 % (Form verbessern),
+12 % (Muskeln aufbauen), nach unten begrenzt auf das 1,1-fache des Grundumsatzes.

**Kalorienzyklus** verschiebt Kalorien von Ruhe- auf Trainingstage, ohne die
Wochensumme zu verändern. Die Verschiebung ist so gedeckelt, dass ein Ruhetag nie
unter 85 % des Tagesziels fällt — sonst müssten bei sechs Trainingstagen die
wenigen Ruhetage die gesamte Umverteilung tragen.

**Makros**: Eiweiß 1,8–2,2 g/kg je nach Ziel (bei über 25 % Körperfett auf die
fettärmere Bezugsmasse gerechnet), Fett mindestens 0,8 g/kg oder 20 % der
Kalorien, der Rest Kohlenhydrate.

**Nachsteuerung**: Aus dem 7-Tage-Schnitt des Gewichts gegen die Vorwoche ergibt
sich die tatsächliche Veränderung in % Körpergewicht pro Woche. Weicht sie um
mehr als 0,22 Prozentpunkte vom Ziel ab, schlägt die App eine Korrektur vor
(1 kg ≈ 7700 kcal, gedeckelt auf ±300 kcal pro Tag).

## Was die App plant

Split nach verfügbaren Tagen: 1–3 Ganzkörper (ab „fortgeschritten" bei 3 Tagen
Push/Pull/Beine), 4 Oberkörper/Unterkörper, 5 gemischt, 6 Push/Pull/Beine doppelt.
Die Übungszahl folgt der Zeit pro Einheit, Sätze und RIR der Erfahrungsstufe.

Aus 72 Übungen wird nach Ausrüstung (Studio, Kurzhanteln, Bänder, Körpergewicht)
und Einschränkungen (Knie, Schulter, unterer Rücken, Handgelenk, Ellbogen)
gefiltert. Gesperrte Übungen werden gar nicht erst eingeplant. Bleibt eine
Muskelgruppe ohne Option, greift eine Ersatzgruppe; bleibt ein Tag trotzdem
kurz, sagt der Plan das offen.

Übungen ohne Zusatzgewicht bekommen höhere Wiederholungszahlen (10–20 statt
5–8), weil der Fortschritt dort über Wiederholungen und schwerere Varianten
läuft statt über die Hantel.

Der Plan läuft in 4-Wochen-Blöcken: Woche 1 mit einer Wiederholung mehr Reserve,
Woche 3 schwerer, Woche 4 Deload mit 40 % weniger Sätzen.

Fortschritt pro Übung nach doppelter Progression: alle Sätze am oberen Ende des
Wiederholungsbereichs → nächstes Mal +2,5 kg (Grundübung) bzw. +1,25 kg
(Isolation) und zurück ans untere Ende.

## Daten aus einem anderen Kalorienzähler übernehmen

Unter *Profil → Daten* lässt sich JSON einfügen. Erkannt werden das eigene
Backup-Format sowie fremde Exporte in diesen Formen:

```json
{ "food":    { "2026-08-15": [{ "name": "Frühstück", "kcal": 520, "protein": 30 }] } }
{ "entries": [{ "date": "2026-08-15", "name": "Snack", "calories": 210 }] }
{ "weights": [{ "date": "2026-08-01", "kg": 64.8 }] }
```

Bei den Feldnamen werden auch deutsche Varianten gelesen (`kalorien`, `eiweiss`,
`kohlenhydrate`, `fett`, `datum`, `gewicht`). Importe werden dazugemischt,
vorhandene Einträge bleiben erhalten.

## Einordnung

Die Formeln sind Schätzungen; der echte Bedarf kann 10–15 % abweichen. Deshalb
korrigiert die App nach dem gemessenen Gewichtsverlauf und nicht nach der Formel.
Kein Ersatz für ärztliche oder physiotherapeutische Beratung.
