# Beckenboden

Eine schlichte App für Beckenboden-/Kegel-Training: erst ein Eingangstest, danach ein
Programm, das mit jeder Stufe schwerer wird. Jeden Tag genau **6 Minuten**.

Alles steckt in einer einzigen `index.html` — kein Build, kein Server, keine Konten.
Alle Daten bleiben im Browser des Geräts (`localStorage`). Es wird nichts hochgeladen.

## Benutzen

Datei `index.html` im Browser öffnen — fertig.

Am Handy lohnt sich der Homescreen: Seite öffnen → Teilen/Menü → **Zum Home-Bildschirm**.
Danach startet sie wie eine normale App im Vollbild und funktioniert auch offline.

## Ablauf

**Eingangstest** (einmalig, jederzeit unter „Test wiederholen" erneut möglich)

1. Kurze Technik-Einweisung.
2. Drei Versuche „so lange halten wie möglich" — der beste Wert zählt.
3. Zehn Sekunden Schnellkraft: kurz anspannen, sofort loslassen, dabei mitzählen.

Aus beiden Werten ergibt sich die Startstufe.

**Tägliche Einheit** — immer exakt 6:00, in drei Blöcken:

| Block | Was |
|---|---|
| Schnellkraft | kurze Kontraktionen im Sekundentakt |
| Kraft | mittlere Haltephasen mit Pause |
| Ausdauer | lange Haltephasen mit Pause |

Der Kreis wächst beim Anspannen und schrumpft beim Loslassen, der Ring zählt die
laufende Phase herunter. Signale sind rein visuell; Ton und Vibration lassen sich in
den Einstellungen dazuschalten.

## Wie es schwerer wird

Nach jeder Einheit gibst du an, wie sie sich angefühlt hat: *zu leicht* zählt 2 Punkte,
*genau richtig* 1, *zu schwer* 0,5. Bei 4 Punkten geht es eine Stufe hoch. Dreimal
hintereinander *zu schwer* senkt die Stufe wieder.

Mit steigender Stufe wird **länger gehalten, kürzer pausiert und dichter gearbeitet** —
die Gesamtdauer bleibt bei 6 Minuten, der Anteil unter Spannung wächst von rund
einem Drittel auf über die Hälfte. Die Stufe lässt sich in den Einstellungen auch
direkt korrigieren.

## Hinweise zur Ausführung

- Anspannen wie beim Anhalten des Urinstrahls, nach innen und oben ziehen.
- Bauch, Po und Oberschenkel bleiben locker.
- Normal weiteratmen, nie die Luft anhalten.
- Nicht beim Wasserlassen üben — das dient nur dem Erspüren.
- Bei Schmerzen oder anhaltenden Beschwerden ärztlich abklären lassen.

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | die komplette App |
| `manifest.json` | Homescreen-Installation |
| `sw.js` | Offline-Betrieb |
