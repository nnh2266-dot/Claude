# Werbevideos — Prompts, Sprechertexte und Anzeigentexte

Für ElevenLabs Image & Video im Modus **Image-to-Video**, Startframe
`produktfoto.png`. Format **9:16**, Länge 6–8 s, Ton aus bei der Generierung — die
Stimme kommt getrennt aus ElevenLabs und wird im Schnitt daruntergelegt.

---

## Vorbemerkung: ein Konzept aus dem alten Dokument ist unbrauchbar

`nackenfrei-video-prompt.md` enthält als Konzept A eine **ausfahrbare
Teleskopstange**. Das Gerät hat aber einen **fest gebogenen Griff** — der Prompt würde
das Modell auffordern, eine Mechanik zu erfinden, die es nicht gibt. Das Ergebnis wäre
ein Gerät, das der Kunde so nie bekommt.

Konzept B aus dem alten Dokument (schwebende Aufsätze) bleibt gültig und ist unten
als **Anzeige 2** auf 9:16 gebracht.

---

## Anzeige 1 — „Der Bogen" (Hauptanzeige)

Die Kamera beginnt eng am Massagekopf und zieht zurück, bis der ganze Bogen im Bild
steht. Kein Formwandel, nur Kamera — das ist der robusteste Fall für das Modell, und
es zeigt genau das eine Merkmal, das dein Produkt verkauft.

```
Start frame: the provided studio product photo. Continue it exactly - same
product, same proportions, same lighting. One continuous shot, no cuts.

0.0-2.0s: Extreme close framing on the round foam massage head only. The head
oscillates with a tight percussive micro-vibration, 2-3 mm of travel, motion
blur on the head alone. Everything else is still.

2.0-5.0s: The camera pulls back and tilts down in one slow continuous move,
revealing first the chrome collar, then the curved neck, then the full arc of
the handle down to its base. The curve stays the centre of the frame
throughout. A soft specular highlight travels along the outside of the arc as
the camera moves.

5.0-7.0s: The camera settles. The whole device stands in frame with generous
margin above and below. The head continues its micro-vibration. Final frame
holds steady.

Cinematography: locked tripod feel, 50 mm, f/4 with the whole device sharp,
24 fps, clean commercial product look.
Movement: smooth ease-in-out throughout, no snapping, no handheld shake.
Framing: 9:16 vertical, device centred, nothing cropped at any point.
```

**Sprechertext** (ElevenLabs, ruhige deutsche Stimme, ~7 s):

> Der Griff ist fest gebogen. Er führt den Kopf über die Schulter — dorthin, wo die
> Hand nicht mehr hinkommt.

**Bildtext** (für stummes Abspielen, das Wichtigste):

| Zeit | Einblendung |
|---|---|
| 0,5 s | **Die Stelle zwischen den Schulterblättern.** |
| 2,5 s | **Da kommt keine Hand hin.** |
| 5,0 s | **Dieser Bogen schon.** |

---

## Anzeige 2 — „Vier Aufsätze" (Retargeting)

Übernommen aus dem alten Konzept B, auf 9:16 gebracht. Für Leute, die die Seite schon
besucht haben — die zweifeln meist an der Anwendbarkeit, nicht am Preis.

```
Start frame: the provided studio product photo. Continue it exactly - same
product, same proportions, same lighting. One continuous shot, no cuts.

0.0-2.5s: The four loose attachment heads lift off and float upward in a slow,
weightless arc, settling into an evenly spaced vertical column that hovers
beside the device.

2.5-5.0s: The camera makes a slow 10-degree dolly-left move while the device
turns a few degrees on its vertical axis. A soft specular highlight travels
down the matte black body and flares briefly across the chrome collar. The
round foam head oscillates with a tight percussive micro-vibration, 2-3 mm of
travel, motion blur on the head only.

5.0-8.0s: The camera returns to the exact starting framing, the attachments
drift back into their original positions, and all motion eases to rest so the
final frame matches the first frame for a seamless loop.

Cinematography: locked tripod feel, 50 mm, f/4 with the whole device sharp,
24 fps, clean commercial product look.
Movement: smooth ease-in-out throughout, no snapping, no handheld shake.
Framing: 9:16 vertical, device centred, nothing cropped at any point.
```

**Sprechertext:**

> Vier Aufsätze, jeder für seine Zone. Die U-Form läuft links und rechts an der
> Wirbelsäule vorbei, ohne sie zu berühren.

**Bildtext:**

| Zeit | Einblendung |
|---|---|
| 1,0 s | **Kugel · Flach · U-Form · Spitz** |
| 3,5 s | **Die U-Form läuft an der Wirbelsäule vorbei** |
| 6,5 s | **Nicht darauf.** |

---

## Anzeige 3 — „Neun Stufen"

Nur Mikrobewegung am Kopf, sonst Stillstand. Technisch der sicherste Prompt von allen.

```
Start frame: the provided studio product photo. Continue it exactly - same
product, same proportions, same lighting. One continuous shot, no cuts.

0.0-6.0s: The device stands completely still. Only the round foam head
oscillates, starting as a barely visible flutter of about 1 mm and building
steadily over the six seconds to a hard percussive travel of about 4 mm, with
increasing motion blur on the head alone. The body, handle and background stay
absolutely locked. Light does not change.

6.0-7.0s: The oscillation stops abruptly. The device holds still. Final frame
is identical to the first frame.

Cinematography: locked tripod, 50 mm, f/4, 24 fps, clean commercial product
look. No camera movement at any point.
Framing: 9:16 vertical, device centred, nothing cropped.
```

**Sprechertext:**

> Neun Kraftstufen. Stufe eins zum Aufwärmen, Stufe neun für die tiefen Muskelgruppen.

**Bildtext:** ein hochzählender Zähler `1 … 9` am unteren Bildrand, synchron zur
steigenden Bewegung. Der wird im Schnitt gesetzt, nicht generiert.

---

## Anzeige 4 — „Die Stelle" (erst nach der Rückkehr)

Das stärkste Konzept und das einzige, das sich nicht generieren lässt: ein Mensch,
der mit einer geraden Massagepistole zwischen die eigenen Schulterblätter will und
scheitert, daneben derselbe Griff mit dem Bogen.

Arme hinter dem Rücken plus ein konkretes Gerät in korrekter Geometrie ist der
schwerste Fall für Videomodelle. **Mit dem Handy aufnehmen, sobald das Muster da
ist** — eine Stunde, kein Produktionstag.

---

## Hintergrund — einen Absatz an jeden Prompt anhängen

**Dunkel**, passend zum Standard-Theme:

```
Background and light: seamless near-black background, RGB 10 13 19, with no
gradient banding. Two soft edge lights rake along the matte black body to
separate it from the background, plus one cool blue rim light, RGB 76 123 255,
grazing the far edge. One crisp chrome specular on the collar. Deep, soft
contact shadow beneath the objects only.
```

**Grün**, wenn ein Freisteller mit Alphakanal entstehen soll:

```
Background and light: flat saturated chroma key green, RGB 0 177 64, evenly lit
with no gradient and no green spill on the product. Neutral studio lighting on
the device itself, one crisp chrome specular on the collar, no contact shadow
on the background.
```

---

## Negativ-Prompt — immer setzen

```
people, hands, text, letters, logos, watermark, captions, UI overlays, extra
devices, duplicated attachments, changing shape, telescoping, bending handle,
morphing geometry, zoom-in, crop, cut, scene change
```

`telescoping` und `bending handle` sind neu und wichtig: Modelle biegen den Schaft
gern, wenn sie Bewegung erzeugen sollen. Dein Griff ist fest.

---

## Anzeigentexte für Meta

**Regel, die über allem steht: über das Produkt sprechen, nie über die Person.**
Anzeigen, die dem Betrachter ein Leiden unterstellen, werden abgelehnt. Kein „Leidest
du unter …", keine Heil- oder Linderungsversprechen.

### Zu Anzeige 1

> **Primärtext:** Die Muskeln, die am meisten verspannen, liegen dort, wo die Hand
> nicht mehr hinkommt. Der Griff ist fest gebogen und führt den Kopf über die
> Schulter und an der Wirbelsäule entlang.
>
> **Überschrift:** Der Bogen, der über die Schulter reicht
>
> **Beschreibung:** Neun Kraftstufen, vier Aufsätze
>
> **Button:** Mehr erfahren

### Zu Anzeige 2

> **Primärtext:** Vier Aufsätze, jeder für seine Zone. Der U-förmige Kopf läuft links
> und rechts an der Wirbelsäule vorbei, ohne sie zu berühren — für Nacken und oberen
> Rücken. Für die Fläche darunter der Kugelkopf.
>
> **Überschrift:** Welcher Aufsatz wohin gehört
>
> **Button:** Jetzt ansehen

### Zu Anzeige 3

> **Primärtext:** Neun Kraftstufen von 2.000 bis 3.200 Schlägen pro Minute. Stufe eins
> zum Aufwärmen und für empfindliche Stellen, Stufe neun für die tiefen Muskelgruppen.
>
> **Überschrift:** Neun Stufen, 590 Gramm, USB
>
> **Button:** Mehr erfahren

---

## Reihenfolge und Varianten

Je Anzeige **3 bis 4 Varianten der ersten drei Sekunden**, Rest identisch. Der Anfang
entscheidet über die Hook-Rate, alles danach über die Klickrate. Wer den ganzen Spot
neu baut, testet zu viele Dinge gleichzeitig.

Vor dem Start prüfen: Alle technischen Angaben in den Texten — 590 Gramm, neun Stufen,
2.000 bis 3.200 RPM — stehen unter Vorbehalt bis zur Messung am Muster.
