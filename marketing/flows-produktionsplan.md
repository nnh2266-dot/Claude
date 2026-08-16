# NackenFrei — Produktionsplan für ElevenLabs Flows

Vollständige Herstellung ohne Kamera, ohne Muster, ohne Drehtag. Umsetzung des Skripts
aus `marketing/werbespot-skript.md`.

Stand: 14. August 2026

---

## 0. Die ehrliche Einordnung vorweg

Ohne eigene Aufnahmen fällt genau ein Bild weg: **ein Mensch, der das Gerät am eigenen
Rücken benutzt.** Eine Person, ein konkretes Produkt in korrekter Geometrie und Arme
hinter dem Rücken — das ist der schwerste Fall für Videomodelle, und wer ihn erzwingen
will, verbrennt Credits an einem Gerät, das am Ende anders aussieht als das, was der
Kunde bekommt. Das wäre nicht nur schlechte Werbung, sondern irreführend nach § 5 UWG.

**Die Lösung ist nicht, es trotzdem zu versuchen, sondern es nicht zu brauchen.** Das
Skript führt den Beweis deshalb als **Diagramm**: Rückensilhouette, markierte Zone, der
Bogen als Linie darübergelegt. Das beweist die Geometrie sauberer als jede Filmaufnahme,
ist zu hundert Prozent kontrollierbar — und es ist ohnehin der differenzierendere Look.
Massagepistolen-Anzeigen sehen alle gleich aus: weißes Studio, Zeitlupe, Bassmusik.
Deine sieht aus wie ein Messgerät.

### Die drei Bausteine und ihr Risiko

| Baustein | Beispiel | Risiko | Anteil am Spot |
|---|---|---|---|
| **Produktaufnahmen** aus `produktfoto.png` | Kamerafahrt am Bogen, schwebende Aufsätze, vibrierender Kopf | **niedrig** — Prompts in `werbevideos.md` sind erprobt | ~50 % |
| **Diagramm-Animation** | Silhouette, leuchtende Zonen, Bogenlinie | **sehr niedrig** — abstrakte Formen, keine Anatomie | ~40 % |
| **Menschbild ohne Produkt** | Hand greift über die Schulter (nur H1) | **mittel** — Hände sind der klassische Ausfall | ~10 %, ersetzbar |

Nur der letzte Baustein kann scheitern, er macht drei Sekunden aus, und für ihn gibt es
in H3 einen fertigen Ersatz. **Der Spot ist damit nicht davon abhängig, dass irgendetwas
Schwieriges gelingt.**

> **Nachtrag vom 16. August:** Eine Person *mit* dem Gerät zu generieren ist machbar —
> aber nur zweistufig und mit einer Formbeschreibung in Worten. Wie das geht und woran
> der erste Versuch gescheitert ist, steht in **Abschnitt 12**.

---

## 1. Farben und Format — einmal festlegen, überall verwenden

Aus `index.html` übernommen, damit der Spot aussieht wie die Seite, auf die er führt:

| Rolle | Wert |
|---|---|
| Hintergrund / Graphit | **`#0A0D13`** (RGB 10 13 19) |
| Kupfer, hell | **`#E2703A`** (RGB 226 112 58) |
| Kupfer, dunkel | **`#AB4B1D`** (RGB 171 75 29) |
| Akzentblau | **`#4C7BFF`** (RGB 76 123 255) |

**Format:** 9:16, zusätzlich 4:5 exportieren. Alle Image-Nodes von Anfang an auf 9:16
stellen — nachträgliches Beschneiden kostet Bildinhalt, den du oben und unten brauchst.

---

## 2. Der Flow

Ein Flow für alles. Einmal gebaut, danach werden nur noch Inputs getauscht.

```
[Upload Media]
  produktfoto.png · produkt-freigestellt.png · nackenfrei-logo.svg
        │
        ├─► [Image 1: Hand]        ─► [Video 1: 3 s] ──┐
        ├─► [Image 2: Silhouette]  ─► [Video 2: 3 s] ──┤
        ├─► [Image 3: Bogen]       ─► [Video 3: 4 s] ──┤
        ├─► [Image 4: Bogenlinie]  ─► [Video 4: 2 s] ──┼─► [Composition] ─► [Upscale] ─► Export
        ├─► [Image 5: Aufsätze]    ─► [Video 5: 3 s] ──┤
        └─► [Image 6: Abbinder]    ─► [Video 6: 2 s] ──┤
                                                       │
[TTS: Sprecherin] ─┐                                   │
[Music: Bett]      ├─► [Mix Audio] ────────────────────┘
[SFX: 2 Akzente]   ┘
```

Sechs Bild-Nodes, sechs Video-Nodes, drei Audio-Nodes, ein Mix, eine Composition. Mehr
braucht der Hauptspot nicht.

---

## 3. Sitzung 1 — Ton zuerst (billig, und legt das Tempo fest)

Der Ton entsteht **vor** den Bildern. Grund: Die Länge des Voiceovers bestimmt, wie lang
jeder Clip sein muss. Wer zuerst die Videos baut, generiert am Ende Clips nach, weil die
Stimme nicht passt — und Video ist das Teuerste im ganzen Flow.

### TTS-Node

**Stimme:** ruhige deutsche Frauenstimme, gesetzt, ohne Werbe-Enthusiasmus, gefühltes
Alter 45–55. Modell **Eleven v3 (expressive)**.

Das ist keine Geschmacksfrage. Die Stimme ist eines der stärksten Signale, an denen der
Algorithmus die Zielgruppe ableitet — eine junge, energetische Fitness-Stimme liefert die
Anzeige an junge Fitness-Konten aus, also genau am zahlenden Segment vorbei.

**Text, exakt so einsetzen** (Zeilenumbrüche als Atempausen, keine Regieanweisungen im
Text — Emotion kommt über Satzbau und Interpunktion):

```
Zwischen den Schulterblättern hört der Arm auf.

Der Griff ist fest gebogen. Er führt den Kopf über die Schulter.

Vier Aufsätze für vier Zonen. Neun Stufen.

NackenFrei. Ohne fremde Hilfe.
```

**Nach der Generierung einzeln anhören:** „NackenFrei" als ein Wort und mit Betonung auf
der ersten Silbe · „neun" nicht verschluckt · „Schulterblättern". Sitzt eines davon
nicht, den Satz einzeln neu generieren, nicht den ganzen Text.

**Länge messen und notieren.** Alles Weitere richtet sich danach.

### Music-Node

```
15 seconds, instrumental, no vocals, calm steady pulse, warm low tones,
soft sustained pad, no build-up, no drop, clean ending
```

Kein Bass-Drop, kein Trailer-Sound. Der Kategorie-Standard ist Studio-Techno — davon
wegzugehen ist Teil der Differenzierung.

### SFX-Node — genau zwei

1. `single dry percussive thud, short, low, no reverb` — sitzt bei 6,0 s, wenn der Bogen
   ins Bild kommt
2. `soft mechanical click, very short, clean` — sitzt bei 10,0 s beim Schnitt auf die
   Aufsätze

Mehr Sound wirkt geschäftig. Zwei Akzente sind der Unterschied zwischen KI-Clip und Spot.

---

## 4. Sitzung 2 — Die sechs Keyframes

**Hier wird iteriert, nirgends sonst.** Bilder kosten einen Bruchteil eines Videos. Jede
Korrektur, die hier gemacht wird, spart ein Vielfaches im Video-Node.

Für alle Bild-Nodes: **9:16, höchste verfügbare Auflösung, kein Text im Bild.**

### Bild 1 — die Hand *(der einzige riskante)*

```
Close crop on the upper back and right shoulder of a woman in her fifties,
seen from directly behind. Plain heather-grey cotton t-shirt. Her right arm is
bent up and over her shoulder, reaching down toward the area between the
shoulder blades; the hand is relaxed and clearly stops short of that area.
Head cropped above the frame, no face visible. Softly blurred neutral home
interior behind her. Even soft daylight from the left. Photographic, natural
skin texture, 85 mm, shallow depth of field. Calm and matter-of-fact, not
distressed.
```

**Zwei Regeln für diesen Prompt:**

- **Die Hand klein halten.** Je kleiner und weiter entfernt die Finger im Bild sind, desto
  sicherer die Generierung. Wenn nach vier bis sechs Versuchen keine saubere Hand kommt:
  enger auf die Schulter croppen, sodass die Hand nur noch am Bildrand angeschnitten ist.
- **Keine Schmerzgeste.** Kein Verziehen, kein Reiben, kein Zusammenzucken. Die Aufnahme
  zeigt eine Reichweite, kein Leiden — das ist der Unterschied zwischen einer Anzeige, die
  Meta durchlässt, und einer abgelehnten.

**Abbruchregel:** sechs Versuche. Kommt bis dahin keine brauchbare Hand, wird H1 gestrichen
und H3 (Grafik) übernimmt den Basis-Hook. Der Spot verliert dadurch nichts Strukturelles.

### Bild 2 — die Silhouette mit der Lücke

```
Flat vector-style technical illustration on a seamless near-black background,
RGB 10 13 19. A human upper body seen from behind, rendered only as a clean
copper outline, RGB 226 112 58, two pixels wide. No face, no hair detail, no
clothing. Between the shoulder blades a soft glowing copper zone, warm and
diffuse. A thin arc traced from the right shoulder shows the reach of an arm
and ends clearly short of the glowing zone, leaving a visible gap. Minimal,
precise, like a measuring instrument display. No text, no labels, no numbers.
```

### Bild 3 — der Bogen *(Produktaufnahme)*

Startframe: `produktfoto.png`.

```
Start frame: the provided studio product photo. Continue it exactly - same
product, same proportions, same lighting. Extreme close framing on the round
foam massage head only, the rest of the device falling out of focus behind it.

Background and light: seamless near-black background, RGB 10 13 19, with no
gradient banding. Two soft edge lights rake along the matte black body to
separate it from the background, plus one cool blue rim light, RGB 76 123 255,
grazing the far edge. One crisp chrome specular on the collar. Deep, soft
contact shadow beneath the object only.
```

### Bild 4 — die Bogenlinie über der Silhouette

Dasselbe Bild wie Bild 2, ergänzt:

```
Same illustration style and colours as before. The curved handle of the device
is drawn as a single clean copper line, RGB 226 112 58, arcing up from beside
the hip, over the right shoulder, with its head resting exactly on the glowing
zone between the shoulder blades. The arc is one continuous rigid curve with no
joint, no hinge and no segment breaks. No text, no labels.
```

**`no joint, no hinge, no segment breaks` ist der wichtigste Halbsatz im ganzen
Dokument.** Er ist die bildliche Fassung des Verkaufsarguments.

### Bild 5 — die vier Aufsätze

Startframe: `produkt-freigestellt.png`.

```
Start frame: the provided cut-out product image. Continue it exactly - same
product, same proportions. The four loose attachment heads are arranged in an
evenly spaced vertical column hovering beside the device, each one clearly
distinct in shape: round ball, flat disc, U-shaped fork, pointed bullet.

Background and light: seamless near-black background, RGB 10 13 19, two soft
edge lights, one cool blue rim light RGB 76 123 255 on the far edge, one crisp
chrome specular on the collar.
```

### Bild 6 — der Abbinder

```
Start frame: the provided studio product photo. Continue it exactly. The whole
device stands centred in frame with generous empty margin above and below,
enough clear space in the lower third for a wordmark to be placed later.

Background and light: seamless near-black background, RGB 10 13 19, two soft
edge lights, one cool blue rim light RGB 76 123 255, one crisp chrome specular
on the collar, deep soft contact shadow beneath the device only.
```

### Negativ-Prompt — an jedes Bild und jedes Video

```
people, hands, text, letters, logos, watermark, captions, UI overlays, extra
devices, duplicated attachments, changing shape, telescoping, bending handle,
morphing geometry, zoom-in, crop, cut, scene change
```

Bei **Bild 1** `people` und `hands` streichen, dafür ergänzen:

```
extra fingers, deformed hands, extra arms, distorted anatomy, visible face,
pained expression, product, device, text, watermark
```

`telescoping` und `bending handle` müssen überall drinbleiben. Videomodelle biegen den
Schaft gern, wenn sie Bewegung erzeugen sollen. Der Griff ist fest.

---

## 5. Sitzung 3 — Die Videos

Erst starten, wenn **alle sechs Bilder freigegeben** sind. Jedes Bild als Startframe in
seinen Video-Node. Prompt beschreibt **nur Bewegung**, nie den Inhalt neu — sonst
überschreibt das Modell den Startframe.

| Node | Länge | Bewegungs-Prompt | Modell |
|---|---|---|---|
| **Video 1** Hand | 3 s | `The fingers extend a few millimetres further, strain briefly, then relax. The shoulder lowers slightly. Camera locked, no other movement.` | Standard |
| **Video 2** Silhouette | 3 s | `The glowing zone between the shoulder blades pulses once, softly. The arc draws itself outward from the shoulder and stops. Nothing else moves. Camera locked.` | günstig |
| **Video 3** Bogen | 4 s | `The camera pulls back and tilts down in one slow continuous move, revealing first the chrome collar, then the curved neck, then the full arc of the handle. The curve stays centred throughout. A soft specular highlight travels along the outside of the arc. The head keeps a tight percussive micro-vibration of 2-3 mm with motion blur on the head alone.` | **Premium** |
| **Video 4** Bogenlinie | 2 s | `The copper arc draws itself from the hip up over the shoulder in one continuous stroke and comes to rest on the glowing zone, which brightens as it lands. Nothing else moves.` | günstig |
| **Video 5** Aufsätze | 3 s | `The four attachment heads drift slowly and weightlessly a few centimetres up and back down. The camera makes a slow ten-degree dolly left. The round foam head keeps a tight percussive micro-vibration.` | Standard |
| **Video 6** Abbinder | 2 s | `The device stands completely still. Only the round foam head oscillates with a tight percussive micro-vibration of 2-3 mm. No camera movement. Final frame identical to first frame.` | günstig |

**Nur Video 3 bekommt das Premium-Modell.** Es ist der Hero-Shot, der das Produkt zeigt.
Alles andere ist Bewegung auf Flächen und Linien — dafür reicht das günstigste Modell,
das sauber läuft. Ein Sora-2-Pro-Node kostet dieselben ~12.000 Credits wie eine direkte
Generierung; sechs davon wären Geldverbrennung ohne Gegenwert.

**Reihenfolge:** Video 2, 4, 6 zuerst (günstig, hohe Trefferquote) — das gibt dir nach
zwanzig Minuten einen ersten schnittfähigen Rohbau. Dann 5, dann 1, zuletzt 3.

---

## 6. Sitzung 4 — Zusammenführen

1. **Mix Audio:** Sprecherin, Musik, zwei SFX. Stimme 12–15 dB über dem Bett.
2. **Composition:** die sechs Clips in Reihenfolge, Ton darunter. In der Vorschau prüfen,
   ob die Sätze auf den richtigen Bildern sitzen.
3. **Upscale:** nur auf Video 3 und Video 6 — die beiden Clips, in denen das Produkt
   scharf zu sehen ist. Die Diagramm-Clips brauchen es nicht.
4. **Export** und weiter ins Studio.

### Was im Studio passiert, nicht in Flows

**Alle Texteinblendungen werden im Schnitt gesetzt, nie generiert.** Bildmodelle
schreiben unzuverlässig, und deine Einblendungen sind der Teil, der sound-off die ganze
Arbeit macht. Dort gehören hin:

- die fünf Einblendungen aus dem Skript, Schriftschnitt wie auf der Landingpage
- **Untertitel** über den ganzen Spot — der überwiegende Teil der Wiedergaben startet stumm
- die **Wortmarke** aus `marketing/logo/` bei 13,0 s
- das Overlay **„KI-generiert"** ab Frame 1, oben links, außerhalb der Safe Area
- Export in **9:16 und 4:5**

---

## 7. Die fünf Hooks — was zusätzlich zu generieren ist

Alle fünf ersetzen ausschließlich die Sekunden 0–3. Ab Sekunde 3 läuft in jeder Variante
derselbe Rest. **Sprecherin, Musik, Mix und Composition bleiben stehen** — nur ein Bild-
und ein Video-Node werden neu ausgeführt.

| Hook | Neu zu generieren | Aufwand |
|---|---|---|
| **H1** Die Hand | Bild 1 + Video 1 | schon da |
| **H2** Der Bogen zuerst | Video 3 mit den ersten 3 s als eigenem Clip | **nichts Neues** — Ausschnitt aus Video 3 |
| **H3** Die Grafik | Bild 2 + Video 2, ohne die Bogenlinie | **nichts Neues** — Ausschnitt aus Video 2 |
| **H4** Die Konstruktion | ein Bild-Node: `Extreme close framing on the junction where the straight grip meets the curved neck. Matte black surface, one chrome ring, no seam, no hinge, no screw, no removable joint.` + Video: `slow ten-degree rotation, specular highlight travelling across the chrome ring` | 1 Bild, 1 Video |
| **H5** Die Unabhängigkeit | Bild 4 + Video 4 als Anfang statt als Mitte | **nichts Neues** |

**Drei der fünf Hooks kosten null zusätzliche Credits** — sie sind Schnittvarianten
vorhandener Clips. Nur H4 braucht eine neue Generierung. Damit ist der Fünf-Varianten-Test
aus dem Research-Playbook praktisch umsonst zu haben.

---

## 8. Credit-Disziplin

1. **Assist Mode im Flows Agent an.** Er pausiert vor teuren Generierungen und fragt nach.
2. **Ton vor Bild, Bild vor Video.** Nie in anderer Reihenfolge.
3. **Kein Video-Node startet, bevor sein Startframe freigegeben ist.**
4. **Genau ein Premium-Modell** im ganzen Spot (Video 3).
5. **Partial Re-Run:** Ändert sich der Text, läuft nur der TTS-Node. Ändert sich ein Bild,
   nur dessen Video-Node. Nie der ganze Flow.
6. **Upscale nur auf die zwei Produkt-Clips.**
7. **Abbruchregel für Bild 1:** sechs Versuche, dann H3 als Basis-Hook.

---

## 9. Wenn ein Shot nicht kommt

| Problem | Ersatz |
|---|---|
| Hand in Bild 1 wird nicht sauber | enger croppen, Hand anschneiden; danach H3 als Basis-Hook |
| Modell biegt den Griff in Video 3 | Kamerafahrt verkürzen, Startframe enger; im Zweifel Video 6 (Stillstand) als Hero |
| Aufsätze verdoppeln sich in Video 5 | Bewegung auf „drift a few centimetres" reduzieren, Dolly streichen |
| Silhouette wirkt zu abstrakt | Schultern und Hüfte deutlicher andeuten, aber weiterhin nur Outline |
| Produkt sieht in zwei Clips verschieden aus | beide Clips aus demselben Startframe neu, nie zwei verschiedene Referenzbilder mischen |

---

## 10. Ablauf als Checkliste

**Sitzung 1 — Ton** (~30 Min.)
- [ ] Stimme auswählen, Sprechertext generieren, Aussprache prüfen
- [ ] Länge messen und notieren
- [ ] Musikbett generieren
- [ ] Zwei SFX generieren

**Sitzung 2 — Bilder** (~2 Std., der eigentliche Arbeitsteil)
- [ ] Bild 2 Silhouette — die Grundlage, zuerst
- [ ] Bild 4 Bogenlinie aus Bild 2 ableiten
- [ ] Bild 3 Bogen, Bild 5 Aufsätze, Bild 6 Abbinder aus den Produktfotos
- [ ] Bild 1 Hand — sechs Versuche, dann entscheiden
- [ ] Alle sechs nebeneinander prüfen: gleiche Farbwelt, gleiches Licht?

**Sitzung 3 — Videos** (~1 Std. plus Wartezeit)
- [ ] Video 2, 4, 6 (günstig)
- [ ] Video 5, Video 1
- [ ] Video 3 (Premium, zuletzt)

**Sitzung 4 — Zusammenführen** (~1 Std.)
- [ ] Mix Audio, Pegel prüfen
- [ ] Composition, Sitz der Sätze prüfen
- [ ] Upscale auf Video 3 und 6
- [ ] Export ins Studio

**Sitzung 5 — Schnitt** (~2 Std.)
- [ ] Einblendungen, Untertitel, Wortmarke, KI-Kennzeichnung
- [ ] Fünf Hook-Varianten schneiden
- [ ] 9:16 und 4:5 exportieren (Maße und Exporteinstellungen: Abschnitt 11)

**Danach:** Spot 2 und Spot 3 aus denselben Nodes — Spot 2 braucht nur Bild 5 und die
Silhouette, Spot 3 nur die Silhouette in drei Zuständen. Beide sind fast reine
Schnittarbeit.

---

## 11. Maße und Qualität

### Die Zielformate

| | **Reels / Stories** (Hauptformat) | **Feed 4:5** |
|---|---|---|
| Auflösung | **1080 × 1920 px** | **1080 × 1350 px** |
| Seitenverhältnis | 9:16 | 4:5 |
| Safe Area | zentrale **1080 × 1420 px** | **972 × 1215 px** |
| Bildrate | **30 fps** | 30 fps |
| Container / Codec | **MP4, H.264** | MP4, H.264 |
| Videobitrate | **10–12 Mbit/s** | 10–12 Mbit/s |
| Audio | **AAC, 128 kbit/s oder höher, 48 kHz** | ebd. |
| Lautheit | ~ −14 LUFS integriert | ebd. |
| Dateigröße | unter 250 MB (real: ~20 MB) | ebd. |
| Länge | 15 s | 15 s |

**1080 px Breite ist die Untergrenze, nicht das Ziel.** Alles darunter wird von Meta
hochskaliert und sieht auf modernen Displays weich aus. Alles darüber wird ohnehin auf
1080 heruntergerechnet — das schadet nicht, es schärft sogar. Also: so groß generieren
wie der Node hergibt, am Ende auf 1080 × 1920 exportieren, den größeren Master archivieren.

### Safe Area — was das praktisch heißt

Bei 9:16 liegt über und unter dem Bild die Plattform-Oberfläche: oben der Kopfbereich,
unten Profilname, Bildunterschrift, Ton-Zeile und die Schaltflächen. **Der untere Rand
frisst deutlich mehr als der obere.** Rechne konservativ mit **250 px oben und 420 px
unten** — nichts Wichtiges gehört dorthin.

Betroffen sind konkret:

- die fünf Texteinblendungen → in die mittleren zwei Drittel
- die Untertitel → nicht am unteren Rand, sondern etwa auf 60 % Höhe
- das Overlay **„KI-generiert"** → oben links, aber unterhalb der 250-px-Zone
- die Wortmarke bei 13,0 s → mittig, nicht unten

### Der 4:5-Schnitt ist kein Beschnitt

1080 × 1350 aus 1080 × 1920 bedeutet, dass oben und unten zusammen 570 px wegfallen.
Das funktioniert nur, weil die Bild-Prompts durchgehend **großzügigen Rand über und unter
dem Gerät** verlangen — genau dafür steht der Halbsatz in Bild 6.

**Aber die Texte müssen für 4:5 neu gesetzt werden, nicht mitgeschnitten.** Wer die
9:16-Fassung einfach beschneidet, schneidet die Einblendungen an. Im Studio zwei
Sequenzen anlegen, gleiche Clips, eigene Textebenen.

### Bildrate — der eine Punkt, an dem es schiefgehen kann

Die Prompts in `werbevideos.md` nennen 24 fps. Das ist ein **stilistischer Hinweis an das
Modell, keine technische Einstellung** — welche Bildrate tatsächlich herauskommt, hängt
am Modell.

**Die einzige harte Regel: nicht mischen.** Prüfe nach den ersten Generierungen, was die
Clips wirklich haben, und fahre die gesamte Sequenz auf einer Rate.

- Kommen sie mit **30 fps** → Timeline auf 30, exportieren mit 30. Ideal.
- Kommen sie mit **24 fps** → Timeline auf 24, exportieren mit 24. Meta akzeptiert das
  problemlos.
- **Nicht** 24-fps-Clips auf eine 30-fps-Timeline legen. Bei Video 3, der langsamen
  Kamerafahrt am Bogen, erzeugt das sichtbares Ruckeln — ausgerechnet im Hero-Shot.

### Wo im Flow die Qualität entsteht

| Stufe | Was zu tun ist |
|---|---|
| **Image-Node** | höchste verfügbare Auflösung, 9:16 von Anfang an. Hier entsteht die Schärfe — ein weiches Ausgangsbild wird durch keinen Video-Node besser |
| **Video-Node** | die höchste Auflösung wählen, die das Modell ohne Aufpreis liefert |
| **Upscale-Node** | nur auf Video 3 und Video 6 — die beiden Clips mit scharfem Produkt. Diagramm-Clips brauchen es nicht, das sind Flächen und Linien |
| **Export aus Studio** | 1080 × 1920, H.264, 10–12 Mbit/s, AAC 128 kbit/s |

Bei 15 Sekunden und 12 Mbit/s liegt die Datei bei rund **20 MB** — weit unter jeder
Grenze. An der Bitrate zu sparen gibt es hier keinen Grund; Meta rechnet ohnehin nach,
und je besser das Ausgangsmaterial, desto weniger sichtbar ist diese zweite Kompression.

---

## 12. Menschaufnahmen mit dem Gerät — wenn du es doch generierst

Abschnitt 0 rät davon ab, eine Person mit dem Gerät zu generieren. Das bleibt der
sicherere Weg — aber es ist machbar, wenn man weiß, woran es scheitert. Ein erster
Versuch am 16. August lieferte eine saubere Frau, eine saubere Szene und ein **falsches
Produkt**: eine gewöhnliche pistolenförmige Massagepistole statt des Bogens.

### Warum das Referenzfoto allein nicht reicht

Das Modell hat im Training Millionen pistolenförmiger Massagepistolen gesehen und
praktisch keine mit Schwanenhals. **Gegen diesen Prior verliert ein einzelnes
Referenzbild.** Bei zwei Referenzen kommt hinzu, dass die meisten Modelle genau *eine*
Identität stabil halten — die ging hier an die Frau, das Gerät wurde zur Gattung
gemittelt. Der Satz „achte darauf, dass die Massage Gun genau so aussieht" hilft nicht,
weil er keine Form beschreibt, sondern nur Treue einfordert.

### Die Form in Worten — der eigentliche Hebel

Was das Referenzbild zeigt, muss zusätzlich **sprachlich** dastehen, und zwar über
**Analogien zu Objekten, die das Modell sicher kennt**. Adjektive wie „gebogen" sind zu
schwach.

> **Ein langer gerader mattschwarzer Schaft, in der Hand gehalten wie ein Spazierstock.
> Am oberen Ende biegt er sich in einer einzigen weichen Kurve nach vorn und wieder nach
> unten — wie ein Küchenwasserhahn, wie ein Hirtenstab. Am Ende des Bogens hängt das
> Motorgehäuse nach unten, mit einem Chromring und einem runden schwarzen Schaumkopf,
> der nach unten zeigt.**

Englisch für den Prompt: `like a walking cane` · `gooseneck curve like a kitchen tap` ·
`shepherd's crook` · `the head hangs downward at the far end of the arc`.

### Das zweistufige Verfahren

Ein Video-Node soll das Produkt **nie erfinden**. Er soll nur bewegen, was schon da ist.

**Stufe 1 — Standbild, hier wird iteriert:**

```
A woman in her mid-fifties seen from behind, standing in a bright ordinary
living room. Plain light-grey cotton t-shirt, dark trousers, hair loosely tied
up. No brand logos anywhere on her clothing.

She holds the massage device from the reference image. The device shape is
critical: a small handheld device, about 35 cm long in total, roughly the
length of her forearm. A short straight matte-black shaft, held in one hand
like a hairdryer, which at its upper end bends over in one single smooth
gooseneck curve, like a kitchen tap, so that the motor housing hangs downward
at the far end of the arc, with a polished chrome ring and a round black foam
head pointing down. One continuous rigid piece - no hinge, no joint, no
removable section.

Scale check: the bottom end of the shaft ends around her lower ribs, well above
her waist. It never reaches her hip, her leg or the floor.

Her hand grips the straight lower shaft at about chest height, her elbow low
and close to her body, forearm relaxed. The arc alone reaches up and over her
right shoulder, and the round head rests on the muscle between neck and
shoulder. Her shoulder is relaxed. Her arm is NOT raised above her head, her
torso is NOT twisted.

Soft daylight from a window on the left. Photographic, natural skin texture,
50 mm, shallow depth of field. Calm and everyday. Not a gym, not a studio.
```

Negativ-Prompt für dieses Bild:

```
pistol-shaped massage gun, T-shaped massage gun, straight massage gun, power
drill shape, long pole, staff, broom handle, walking stick, cane, barbell,
telescopic pole, floor-length shaft, oversized device, gym, fitness studio,
sports bra, athletic wear, bare midriff, brand logos, text, watermark, raised
elbow, arm above head, twisted torso, extra fingers, deformed hands, second
device, two devices
```

**Zur Größenangabe:** Modelle haben kein absolutes Maß — „lang" und „kurz" sind für sie
bedeutungslos, solange nichts zum Vergleich dasteht. Deshalb zwei Anker: eine
**Körperproportion** („so lang wie ihr Unterarm") und eine **harte geometrische Grenze**
(„das untere Ende endet an den unteren Rippen"). Die Grenze wirkt stärker als die
Zentimeterangabe, weil das Modell sie im Bild überprüfen kann.

Die 35 cm sind aus den Kartonmaßen des Lieferanten abgeleitet: 37 × 26,5 × 6 cm. Länger
als die Diagonale des Kartons kann das Gerät nicht sein. Am Muster nachmessen und den
Wert hier korrigieren.

⚠️ **Analogien bestimmen die Größe, nicht die Adjektive.** Eine frühere Fassung dieses
Prompts sagte `like a walking cane` — das Modell baute daraufhin einen bodenlangen Stab,
weil ein Spazierstock nun einmal 90 cm hat. `like a hairdryer` liefert die richtige
Größenordnung. Bei jeder Analogie mitdenken, wie groß das Vergleichsobjekt wirklich ist.

**Stufe 2 — erst wenn das Standbild sitzt, daraus das Video:**

```
Motion only. The round head presses gently into the muscle and vibrates with a
tight percussive micro-movement of 2-3 mm, motion blur on the head alone. Her
shoulder lowers slightly as she relaxes. Her hand and the device stay exactly
where they are. Camera locked, no zoom, no cut.
```

Negativ zusätzlich: `changing shape, telescoping, bending handle, straightening
handle, morphing geometry, device transforming`.

### Der sicherste Weg von allen

`produkt-freigestellt.png` ist ein Freisteller. **Die Person ohne Gerät generieren, den
Freisteller im Bildbearbeitungsprogramm an die richtige Stelle setzen, dann
Image-to-Video.** Dann ist die Geometrie zu hundert Prozent korrekt, weil sie nicht
generiert, sondern montiert wurde. Fünf Minuten Arbeit, null Credits, kein Risiko.

### Modellwahl

Für Stufe 1 **kein schnelles Modell.** Die Flash-/Fast-Varianten haben die schwächste
Objekttreue — genau die Eigenschaft, auf die es hier ankommt. Das stärkste verfügbare
Bildmodell nehmen, dafür an anderer Stelle sparen.

### Drei Dinge, die im Testvideo zusätzlich falsch waren

1. **Fitnessstudio, Sport-BH, sportliche Frau.** Das ist exakt das Segment, das
   `wettbewerb.md` als überlaufen benennt. Der Algorithmus liest die Bildsprache und
   liefert die Anzeige an Fitness-Konten aus — vorbei an Frauen 45–70. Wohnzimmer,
   T-Shirt, Alltag.
2. **Sichtbare Fremdlogos** auf Sport-BH und Hose. Markenzeichen Dritter in der eigenen
   Werbung sind ein vermeidbares Risiko. Wegprompten und jeden Frame prüfen.
3. **720 × 1280.** Unter der 1080er-Grenze aus Abschnitt 11. Höher generieren oder
   upscalen.

Und der wichtigste Punkt: Im Testvideo hat die Frau **den Arm über den Kopf gehoben und
verdreht** — also genau die Verrenkung, die das Produkt überflüssig machen soll. Das lag
an der falschen Form: Eine Pistolenform *erzwingt* diese Haltung. **Sitzt der
Schwanenhals, korrigiert sich die Haltung von selbst** — und erst dann zeigt der Spot,
was er behaupten soll.

> ⚠️ **Vorher klären:** Issue #1 führt „Kernversprechen selbst testen — kommt man mit dem
> Bogengriff allein zwischen die eigenen Schulterblätter?" als **offenen** Punkt. Solange
> das nicht am Muster gemessen ist, sollte die Aufnahme den **Trapezmuskel zwischen Hals
> und Schulter** zeigen, den der Bogen sicher erreicht — nicht die Fläche zwischen den
> Schulterblättern. Eine Demonstration einer Reichweite, die das Gerät nicht hat, ist
> irreführend nach § 5 UWG, und sie erzeugt genau die Retouren, die den Deckungsbeitrag
> auffressen.

---

## 13. Was das nicht ersetzt

Eine Sache bleibt trotz allem besser, sobald sie möglich ist: **eine echte Aufnahme, wie
das Gerät an der Stelle ankommt.** Sie ist der einzige Beweis, den niemand nachbauen
kann. Wenn das Muster da ist, sind das zwanzig Minuten mit dem Handy auf einem Stativ —
kein Drehtag, keine Beleuchtung, keine zweite Person.

Der Plan hier ist so gebaut, dass diese Aufnahme später **einen einzigen Clip ersetzt**
(Video 4), ohne dass irgendetwas anderes angefasst werden muss. Bis dahin trägt das
Diagramm den Beweis — und es ist gut genug, um damit zu starten.
