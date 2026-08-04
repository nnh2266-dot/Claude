# Beckenboden

Eine schlichte App für Beckenboden-/Kegel-Training: erst ein Eingangstest, danach ein
Programm, das mit jeder Stufe schwerer wird. Jeden Tag genau **6 Minuten**.

Es gibt sie zweimal:

| | Wo | Was |
|---|---|---|
| **Web-App** | `index.html`, live unter [nnh2266-dot.github.io/Claude](https://nnh2266-dot.github.io/Claude/) | eine einzige Datei, kein Build, sofort nutzbar |
| **Echte App** | `app/` | React Native mit Expo, für Play Store und App Store |

Beide teilen dieselbe Trainingslogik. In der App ist sie als eigenes Modul
(`app/src/training.ts`) mit automatischen Tests hinterlegt.

Alle Daten bleiben auf dem Gerät. Es wird nichts hochgeladen, es gibt keine Konten,
keine Werbung und kein Abo.

## Benutzen

**Im Netz:** https://nnh2266-dot.github.io/Claude/

**Am iPhone/iPad:** Adresse in *Safari* öffnen → **Teilen-Symbol** → **Zum Home-Bildschirm**.
Danach startet sie im Vollbild mit eigenem Symbol und funktioniert auch ohne Netz.
Unter Android geht dasselbe in Chrome über *Menü → App installieren*.

**Lokal:** Datei `index.html` im Browser öffnen — funktioniert ebenfalls, nur ohne
Offline-Zwischenspeicher (dafür braucht der Service Worker `https`).

> Die Trainingsdaten liegen im Browser des jeweiligen Geräts und wandern nicht mit.
> Handy und Tablet zählen also getrennt.

## Ablauf

**Eingangstest** (einmalig, jederzeit unter „Test wiederholen" erneut möglich)

1. Kurze Technik-Einweisung.
2. Drei Versuche „so lange halten wie möglich" — der beste Wert zählt.
3. Zehn Sekunden Schnellkraft: kurz anspannen, sofort loslassen, dabei mitzählen.

Aus beiden Werten ergibt sich die Startstufe.

**Tägliche Einheit** — immer exakt 6:00, drei Übungen nacheinander.

| Übung | Ab | Was du tust |
|---|---|---|
| Schnellspanner | Start | kurz anspannen, sofort lösen |
| Halten | Start | mittellang halten |
| Langes Halten | Start | lange halten |
| Aufzug | Stufe 3 | in 3 Stufen anspannen, oben halten, in 3 Stufen lösen |
| Langsames Lösen | Stufe 5 | zügig anspannen, dann ganz langsam lösen |
| Pulsieren | Stufe 7 | auf halber Kraft halten und dabei pulsieren |

Schnellspanner wärmt immer auf, dazu kommen zwei weitere Übungen, die von Tag zu
Tag durchrotieren. Erreichst du die passende Stufe, wird eine neue Übung
freigeschaltet und erklärt.

Jede Übung wird vorher angekündigt — mit Name, was zu tun ist und wie viele
Wiederholungen kommen. Diese Ankündigung *ist* zugleich die Pause davor, es kommt
also nie beides hintereinander. Auch die letzte Wiederholung eines Satzes geht
direkt in die Satzpause über: nie folgen zwei Ruhephasen aufeinander.

Der Kreis wächst beim Anspannen und schrumpft beim Loslassen, der Ring zählt die
laufende Phase herunter. Signale sind rein visuell; Ton und Vibration lassen sich in
den Einstellungen dazuschalten.

## Wie es schwerer wird

Nach jeder Einheit gibst du an, wie sie sich angefühlt hat: *zu leicht* zählt 2 Punkte,
*genau richtig* 1, *zu schwer* 0,5. Bei 4 Punkten geht es eine Stufe hoch. Dreimal
hintereinander *zu schwer* senkt die Stufe wieder.

Mit steigender Stufe wird **kürzer pausiert, dichter gearbeitet und näher am
Maximum gehalten** — die Gesamtdauer bleibt bei 6 Minuten. Die Stufe lässt sich in
den Einstellungen auch direkt korrigieren.

**Alle Haltezeiten sind ein Anteil deines gemessenen Maximums und können es nie
überschreiten.** Halten liegt bei 35–65 % davon, Langes Halten bei 65–100 %. Damit
die Zeiten mitwachsen können, schlägt die App nach jeder 10. Einheit einen kurzen
Nachtest vor — nur der Haltetest, gut eine Minute. Danach steht da, wie sich dein
Maximum verändert hat.

## Hinweise zur Ausführung

- Anspannen wie beim Anhalten des Urinstrahls, nach innen und oben ziehen.
- Bauch, Po und Oberschenkel bleiben locker.
- Normal weiteratmen, nie die Luft anhalten.
- Nicht beim Wasserlassen üben — das dient nur dem Erspüren.
- Bei Schmerzen oder anhaltenden Beschwerden ärztlich abklären lassen.

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | die komplette Web-App |
| `manifest.json` | Homescreen-Installation |
| `sw.js` | Offline-Betrieb |
| `datenschutz.html` | Datenschutzerklärung für den Store |
| `app/` | die native App (Expo) |
| `store/` | Store-Texte, Screenshots und die Anleitung zum Veröffentlichen |

## Die native App

```bash
cd app
npm install
npm test          # Trainingslogik über alle Stufen prüfen
npx expo start    # auf dem eigenen Handy mit Expo Go öffnen
```

Was sie zusätzlich kann: **tägliche Erinnerung**, **Vibration** bei jedem Wechsel,
**Datensicherung** zum Export und Import, sowie **Deutsch und Englisch**.

Zum Veröffentlichen siehe [`store/veroeffentlichen.md`](store/veroeffentlichen.md).
