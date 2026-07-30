# ElevenLabs-Prompt — NackenFrei Hero-Video

Für die Karte in der Section `#geraet`, die sich beim Scrollen aufrichtet.
Erzeugt mit **ElevenLabs Image & Video** im Modus **Image-to-Video**.

## Setup

| Feld | Wert |
|---|---|
| Modus | Image-to-Video, Startframe = das Produktfoto |
| Modell | Sora 2 Pro — bei Formdrift Kling 2.5 gegenprüfen |
| Format | 16:9 landscape, 1080p |
| Länge | 8 s |
| Audio | aus (das Video läuft `muted` als Endlosschleife) |

Der Startframe ist der wichtigste Hebel: Gehäuseform, Chromring, Griffprofil
und alle fünf Aufsätze bleiben dadurch exakt wie auf dem Foto. Bei
Image-to-Video beschreibt der Prompt deshalb **nur Bewegung, Licht und
Kamera** — das Aussehen steckt schon im Bild und noch einmal beschrieben zu
werden lädt das Modell nur dazu ein, es neu zu erfinden.

Prompts auf Englisch eingeben, darauf reagieren die Modelle am präzisesten.

---

## Konzept A — „Reichweite" (empfohlen)

Erzählt das Verkaufsargument der Seite: der Griff fährt von 26 auf 48 cm aus,
der Kopf rastet durch seine fünf Winkel.

```
Start frame: the provided studio product photo. Continue it exactly — same
product, same proportions, same background, same lighting. One continuous
shot, no cuts.

0.0–3.0s: The long slim handle extends telescopically, growing smoothly to
about one and a half times its starting length while the head stays fixed in
frame. The motion is mechanical and even, like a camera monopod being drawn
out.

3.0–5.5s: The angled head pivots in five distinct detents, pausing briefly at
each angle with a small settle at every stop. The camera makes a slow
10-degree dolly-left orbit; a soft specular highlight travels down the matte
black body and flares briefly across the chrome collar.

5.5–8.0s: The handle retracts to its original length, the head returns to its
opening angle, and the camera settles back to the exact starting framing, so
the final frame matches the first frame for a seamless loop.

Cinematography: locked tripod feel, 50mm, f/4 with the whole device sharp,
24 fps, clean commercial product look.
Movement: smooth ease-in-out throughout, no snapping, no handheld shake.
Framing: 16:9 landscape, product centered, generous margin, nothing cropped.
```

**Risiko:** Auf dem Foto ist keine Teleskopfuge sichtbar. Modelle biegen den
Schaft dann gern, statt ihn auszufahren. Wenn nach zwei, drei Versuchen die
Silhouette kippt: Konzept B nehmen.

---

## Konzept B — „Aufsätze" (sicher)

Keine Formveränderung am Gerät, nur Kamera und schwebende Teile — deutlich
robuster.

```
Start frame: the provided studio product photo. Continue it exactly — same
product, same proportions, same background, same lighting. One continuous
shot, no cuts.

0.0–2.5s: The four loose attachment heads resting along the bottom of the
frame lift off and float upward in a slow, weightless arc, settling into an
evenly spaced row that hovers beside the device.

2.5–5.0s: The camera makes a slow 15-degree dolly-left orbit while the device
turns a few degrees on its vertical axis. A soft specular highlight travels
down the matte black body and flares briefly across the chrome collar. The
round foam head oscillates with a tight percussive micro-vibration, 2–3 mm of
travel, motion blur on the head only.

5.0–8.0s: The camera returns to the exact starting framing, the attachments
drift back into their original positions, and all motion eases to rest so the
final frame matches the first frame for a seamless loop.

Cinematography: locked tripod feel, 50mm, f/4 with the whole device sharp,
24 fps, clean commercial product look.
Movement: smooth ease-in-out throughout, no snapping, no handheld shake.
Framing: 16:9 landscape, product centered, generous margin, nothing cropped.
```

---

## Hintergrund — beide Fassungen rendern

Die Seite startet dunkel (`--ground:#0A0D13`) und hat einen Theme-Schalter.
Ein reinweißes Video würde im Standard-Theme als leuchtender Block in der
Karte sitzen. Deshalb den gewählten Prompt zweimal laufen lassen und den
folgenden Absatz jeweils anhängen:

**Dunkel — Primärversion, passend zum Default-Theme:**

```
Background and light: seamless near-black background, RGB 10 13 19, with no
gradient banding. Two soft edge lights rake along the matte black body to
separate it from the background, plus one cool blue rim light, RGB 76 123
255, grazing the far edge. One crisp chrome specular on the collar. Deep,
soft contact shadow beneath the objects only.
```

**Hell — für das Light-Theme:**

```
Background and light: seamless pure white background with no gradient
banding, soft large-softbox key from the upper left, deep neutral matte
black body, one crisp chrome specular on the collar, soft contact shadow
directly beneath the objects only.
```

Beide Dateien ablegen und in `index.html` per `matchMedia` bzw.
`data-theme` umschalten — oder schlicht nur die dunkle Fassung nutzen, die
in beiden Themes vertretbar aussitzt.

---

## Negative Prompt (immer setzen)

```
people, hands, text, letters, logos, watermark, captions, UI overlays, extra
or missing attachment heads, change of product shape or proportion, color
shift, background props, lens flare, morphing, warping, studio reflections,
camera cuts
```

Der Claim gehört bewusst **nicht** ins Video: Videomodelle rendern Schrift
unzuverlässig, und die Überschrift steht auf der Seite ohnehin als HTML über
der Karte.

---

## Kurzfassung, falls das Modell fragmentiert

Zu viele gleichzeitige Anweisungen sind ein bekannter Failure-Mode — das
Ergebnis wird dann unruhig oder ignoriert Beats. Dann auf das Nötigste
zurück:

```
Start frame: the provided product photo. Slow 15-degree dolly-left orbit, the
device turning a few degrees on its axis, a specular highlight sliding down
the matte black body. The round head vibrates with a tight 2 mm percussive
micro-motion. Camera returns to the exact opening framing so the last frame
matches the first. Soft studio light, no cuts.
```

---

## Export und Einbau

1. 1080p exportieren.
2. Zwei Fassungen erzeugen — `nackenfrei-hero.mp4` (H.264) und
   `nackenfrei-hero.webm` (VP9, deutlich kleiner).
3. Beide neben `index.html` legen.
4. In `index.html` in der Section `#geraet` die beiden auskommentierten
   `<source>`-Zeilen einkommentieren. Das `poster` bleibt stehen — es füllt
   die Karte, bis genug Video gepuffert ist.

Das Poster ist aktuell das Produktfoto (`nackenfrei-hero-poster.png`). Sobald
das Video steht, besser dessen erstes Frame als JPG exportieren und als
Poster setzen, damit der Übergang vom Standbild zum Video nahtlos ist.

---

## Wenn etwas schiefgeht

| Fehlbild | Korrektur |
|---|---|
| Aufsätze vermehren sich oder verschwinden | `exactly four loose attachment heads, no more, no fewer` in den Prompt, Anzahl auch im Negative Prompt lassen |
| Griff verbiegt sich statt auszufahren | Konzept B nehmen, oder `the handle stays perfectly straight and rigid at all times` ergänzen |
| Hintergrund wird grau oder fleckig | Hintergrundabsatz ans **Ende** des Prompts stellen und `no gradient banding, perfectly even background` wiederholen |
| Loop springt sichtbar | Letzten Beat verschärfen: `the final frame is identical to the first frame` — sonst die letzten 4–6 Frames im Schnitt per Crossfade überblenden |
| Gerät morpht in der Mitte | Kürzere Länge wählen (4–5 s) und die Kamerafahrt auf 10° reduzieren |
| Bild wirkt zu unruhig | Mikrovibration streichen, nur Kamerafahrt behalten |
