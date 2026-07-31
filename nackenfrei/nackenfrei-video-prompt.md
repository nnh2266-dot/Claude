# ElevenLabs-Prompt — NackenFrei Produktvideo

Erzeugt mit **ElevenLabs Image & Video** im Modus **Image-to-Video**.
Startframe ist `produktfoto.png`, das Originalfoto mit weißem Hintergrund.

---

## Womit anfangen

**Wenn sich das Gerät im Hero drehen lassen soll, ist Konzept C das
Wichtigste — der Rest kann warten.** Nur der Orbit liefert die Ansichten aus
allen Winkeln, ohne die eine Drehung nicht möglich ist. Die Bedienung dafür
steckt bereits in der Seite und wartet auf das Material.

Ein Video als laufendes Bild im Hero ist dagegen heikel: es trägt immer einen
rechteckigen Rahmen mit sich, und unsichtbar wird der nur bei exakt passender
Hintergrundfarbe. Die Seite hat aber einen Umschalter zwischen `#0A0D13` und
`#F1F3F7` — eine Fassung passt, die andere sitzt als Kasten in der Seite.
Blendmodi helfen nicht: `multiply` schluckt Weiß, `screen` schluckt Schwarz,
und das Gerät ist selbst schwarz.

| Verwendung | Konzept | Was zu tun ist |
|---|---|---|
| **Drehbares Produkt im Hero** | **C** | **Auf Weiß rendern, dann `werkzeug/orbit-zu-kachel.js`** |
| Eigener Abschnitt weiter unten, gerahmt | A oder B | Eine Fassung genügt, Hintergrund frei wählbar |
| Freischwebendes Video | A oder B | Zwei Fassungen, dunkel und hell, per `matchMedia` umschalten — oder auf Grün rendern und als WebM mit VP9-Alphakanal keyen |
| Social Ads | A oder B | 9:16 statt 16:9, sonst identisch |

---

## Setup

| Feld | Wert |
|---|---|
| Modus | Image-to-Video, Startframe = `produktfoto.png` |
| Modell | Sora 2 Pro — bei Formdrift Kling 2.5 gegenprüfen |
| Format | 16:9 landscape, 1080p |
| Länge | 8 s |
| Audio | aus |

Der Startframe ist der wichtigste Hebel: Gehäuseform, Chromring, Griffprofil
und alle fünf Aufsätze bleiben dadurch exakt wie auf dem Foto. Bei
Image-to-Video beschreibt der Prompt deshalb **nur Bewegung, Licht und
Kamera** — das Aussehen steckt schon im Bild, und es noch einmal zu
beschreiben lädt das Modell nur ein, es neu zu erfinden.

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

## Konzept C — „Orbit" (für die echte Umdrehung im Hero)

Das ist der Weg, wenn sich das Gerät im Hero **wirklich** um sich selbst
drehen soll statt als Ebene im Raum zu schwenken. Aus einem einzelnen Foto
geht das nicht — Seiten- und Rückansicht existieren nirgends. Ein
gleichmäßiger Umlauf liefert sie.

```
Start frame: the provided studio product photo. Continue it exactly — same
product, same proportions, same lighting. One continuous shot, no cuts.

The camera orbits a full 360 degrees around the device at a constant angular
speed, staying at the same height and the same distance throughout. The
device itself does not move, does not vibrate and does not change shape. The
lighting stays fixed relative to the camera, so the product is lit
identically from every angle. The final frame is identical to the first.

Cinematography: 50mm, f/5.6 with the whole device sharp, 24 fps, locked
height, no easing at the start or the end — perfectly even rotation.
Framing: 16:9 landscape, product centered, generous margin, nothing cropped
at any point of the orbit.
```

**Gleichmäßigkeit ist hier wichtiger als Dramatik.** Die Frames werden später
auf den Scrollweg abgebildet; jede Beschleunigung im Video wird zu einem
Ruckler beim Scrollen. Deshalb ausdrücklich kein Ease-in oder -out.

**Auf Weiß rendern lassen**, nicht auf dem dunklen Seitenhintergrund — dann
lässt sich jedes einzelne Frame mit demselben Flood-Fill freistellen, der
schon das Standbild freigestellt hat, und die Bildfolge sitzt in beiden
Themes. Also den hellen Hintergrundabsatz anhängen.

### Was am Orbit zwingend ist

Die Bilder werden später auf die Ziehstrecke abgebildet. Deshalb zählt hier
Gleichmäßigkeit mehr als Wirkung:

- **Konstante Winkelgeschwindigkeit, ausdrücklich ohne Ease-in und Ease-out.**
  Jede Beschleunigung im Video wird beim Ziehen zu einem Ruckeln.
- **Konstante Höhe und konstanter Abstand** der Kamera. Wandert sie, wächst
  und schrumpft das Gerät beim Drehen.
- **Beleuchtung fest zur Kamera**, nicht zum Objekt. Sonst flackert das
  Gerät zwischen den Einzelbildern.
- **Letztes Bild gleich erstem**, sonst springt es bei jeder Umdrehung.
- **Auf Weiß rendern** — nur so greift der erprobte Flood Fill beim
  Freistellen.

### Vom Video zur Bildfolge

Dafür liegt ein fertiges Werkzeug bereit. Sobald das Video da ist, genügt:

```bash
node werkzeug/orbit-zu-kachel.js nackenfrei-orbit.mp4
```

Es springt in Chromium auf 24 gleichmäßig verteilte Zeitpunkte, stellt jedes
Bild mit demselben Flood Fill frei, der schon `produkt-freigestellt.png`
erzeugt hat, fügt die 24 Bilder zu einer WebP-Kachel im 6×4-Raster und setzt
sie als Data-URI in `index.html` ein. Kein ffmpeg nötig.

**Die Bedienung dafür steckt bereits in der Seite** und schaltet sich in dem
Moment ein, in dem die Kachel gesetzt ist: Ziehen mit Maus und Finger,
Nachlauf mit Reibung, Pfeiltasten, und der Hinweis „Ziehen zum Drehen"
erscheint erst dann. Ohne Kachel bleibt das Standbild stehen und die Seite
sieht aus wie jetzt.

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

## Hintergrund — einen der drei Absätze anhängen

**Dunkel**, passend zum Standard-Theme `--ground:#0A0D13`:

```
Background and light: seamless near-black background, RGB 10 13 19, with no
gradient banding. Two soft edge lights rake along the matte black body to
separate it from the background, plus one cool blue rim light, RGB 76 123
255, grazing the far edge. One crisp chrome specular on the collar. Deep,
soft contact shadow beneath the objects only.
```

**Hell**, passend zum Light-Theme `#F1F3F7`:

```
Background and light: seamless very light grey background, RGB 241 243 247,
with no gradient banding, soft large-softbox key from the upper left, deep
neutral matte black body, one crisp chrome specular on the collar, soft
contact shadow directly beneath the objects only.
```

**Grün**, wenn daraus ein echter Freisteller mit Alphakanal werden soll:

```
Background and light: flat saturated chroma key green, RGB 0 177 64, evenly
lit with no gradient and no green spill on the product. Neutral studio
lighting on the device itself, one crisp chrome specular on the collar, no
contact shadow on the background.
```

Der Kontaktschatten muss bei Grün ausdrücklich weg — sonst keyt er sich als
grauer Fleck mit heraus, genau das Problem, das beim Freistellen des Fotos
zu lösen war.

---

## Negative Prompt (immer setzen)

```
people, hands, text, letters, logos, watermark, captions, UI overlays, extra
or missing attachment heads, change of product shape or proportion, color
shift, background props, lens flare, morphing, warping, studio reflections,
camera cuts
```

Der Claim gehört bewusst **nicht** ins Video: Videomodelle rendern Schrift
unzuverlässig, und die Headline steht auf der Seite ohnehin als HTML neben
dem Gerät.

**Beim Orbit zusätzlich anhängen**, weil beides die Bildfolge unbrauchbar
macht — ein wanderndes Gerät lässt sich nicht sauber drehen:

```
zoom, dolly in, dolly out, change of camera height, change of camera
distance, easing, acceleration, deceleration
```

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
2. Zwei Fassungen erzeugen — `.mp4` (H.264) und `.webm` (VP9, deutlich
   kleiner). Bei der Grün-Variante stattdessen WebM mit Alphakanal
   (`-c:v libvpx-vp9 -pix_fmt yuva420p`) nach dem Keying.
3. Neben `index.html` legen.
4. Einbinden, immer stumm und in Schleife:

```html
<video autoplay muted loop playsinline preload="metadata"
       poster="nackenfrei-hero-poster.jpg">
  <source src="nackenfrei-video.webm" type="video/webm">
  <source src="nackenfrei-video.mp4" type="video/mp4">
</video>
```

Als Poster das erste Frame des Videos exportieren, damit der Übergang vom
Standbild zum Video nahtlos ist.

---

## Wenn etwas schiefgeht

| Fehlbild | Korrektur |
|---|---|
| Aufsätze vermehren sich oder verschwinden | `exactly four loose attachment heads, no more, no fewer` ergänzen |
| Griff verbiegt sich statt auszufahren | Konzept B nehmen, oder `the handle stays perfectly straight and rigid at all times` ergänzen |
| Hintergrund wird grau oder fleckig | Hintergrundabsatz ans **Ende** stellen und `perfectly even background, no gradient banding` wiederholen |
| Loop springt sichtbar | Letzten Beat verschärfen: `the final frame is identical to the first frame` — sonst die letzten 4–6 Frames per Crossfade überblenden |
| Gerät morpht in der Mitte | Kürzere Länge wählen (4–5 s) und die Kamerafahrt auf 10° reduzieren |
| Bild wirkt zu unruhig | Mikrovibration streichen, nur die Kamerafahrt behalten |

---

## Die Dateien im Ordner

| Datei | Rolle |
|---|---|
| `index.html` | Die Seite. **Läuft allein** — das Hero-Bild steckt als WebP-Data-URI drin, genau wie die Schriften |
| `produktfoto.png` | Original, weißer Hintergrund. **Startframe für ElevenLabs** |
| `produkt-freigestellt.png` | Freigestellt mit Alphakanal. Quelle des eingebetteten Bildes, wird zum Anzeigen nicht gebraucht |
| `nackenfrei-hero-poster.jpg` | 16:9-Standbild, als Poster für ein späteres Video |
