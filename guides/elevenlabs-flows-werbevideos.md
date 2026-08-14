# Gute Werbevideos mit ElevenLabs Flows erstellen

Praxis-Anleitung: vom Produktfoto zum fertigen 15–30-Sekunden-Spot auf einer einzigen Canvas.

> Stand: August 2026. ElevenLabs entwickelt Flows schnell weiter – Modellnamen, Credit-Preise und
> UI-Details bitte vor dem Produktivstart in der offiziellen Doku gegenprüfen:
> <https://elevenlabs.io/docs/eleven-creative/products/flows>

---

## 1. Was Flows ist (und was nicht)

Flows ist die **node-basierte Kreativ-Canvas in ElevenCreative**. Statt eines linearen Timeline-Editors
verbindest du Knoten (Nodes) zu einer Pipeline:

- **Generative Nodes**: Bild, Video, Text to Speech, Musik, Soundeffekte
- **Utility Nodes**: Upload Media, Lipsync, Mix Audio, Composition (Vorschau/Layering), Upscale

In einer Canvas hängen über 50 Bild- und Videomodelle (u. a. Veo, Sora, Kling, Wan, Flux, Seedance)
am kompletten ElevenLabs-Audio-Stack (TTS inkl. Eleven v3 Expressive, Voice Cloning, Lipsync,
Sound Effects, Eleven Music).

**Wichtig für die Erwartungshaltung:** Flows ist die *Generierungs*-Pipeline, kein Schnittprogramm.
Feinschnitt, Untertitel und Endmastering machst du danach im Studio (oder deinem NLE).
Flows ist stark, wenn du **dieselbe Struktur oft mit neuen Inputs** fahren willst – genau das ist
Werbung: ein Spot, zehn Varianten, drei Sprachen.

---

## 2. Vor der Canvas: das Briefing (10 Minuten, spart 80 % der Credits)

Ohne Skript wird jeder KI-Spot beliebig. Lege vorab schriftlich fest:

| Feld | Beispiel |
|---|---|
| Produkt & Kern-Nutzen | Thermobecher, hält 12 h heiß |
| Zielgruppe | Pendler:innen, 25–45 |
| Plattform & Format | Instagram Reels, 9:16, 20 s |
| Ziel-Metrik | Klicks auf Landingpage |
| Tonalität | freundlich-direkt, kein Hype |
| CTA | „Jetzt bei uns im Shop – Link in Bio" |

### Skript-Formel für 20 Sekunden

```
0–3 s   HOOK      Problem oder überraschendes Bild. Ohne Ton verständlich.
3–8 s   PROBLEM   Ein Satz. Ein Schmerzpunkt, nicht drei.
8–15 s  LÖSUNG    Produkt in Aktion + ein konkreter Beweis (Zahl, Demo).
15–20 s CTA       Marke + genau eine Handlungsaufforderung.
```

Faustregel Sprechtempo: **ca. 2,5 Wörter pro Sekunde** → 20 s ≈ 45–50 Wörter. Schreib das Skript
lieber zu kurz; TTS wird sonst gehetzt.

---

## 3. Die Canvas bedienen (Grundlagen)

- **Node hinzufügen**: Rechtsklick auf die Canvas oder Toolbar unten.
- **Verbinden**: vom **Output-Port** eines Nodes auf den **Input-Port** des nächsten ziehen.
  Beispiel: Bild-Node → Video-Node (als Startframe).
- **Nicht-destruktiv iterieren**: Du kannst einzelne Nodes erneut ausführen. Willst du nur ein anderes
  Voiceover, führst du **nur den TTS-Node** neu aus – das teure Video bleibt stehen. Das ist der
  wichtigste Credit-Spar-Hebel überhaupt.

---

## 4. Der Referenz-Flow für einen Produktspot

Baue von links nach rechts. Reihenfolge ist bewusst „billig zuerst, teuer zuletzt".

```
[Upload Media: Produktfotos]
            │
            ▼
   [Image Node: Szene/Keyframe]  ──► [Video Node: Bewegung]  ──┐
                                                               │
[TTS Node: Voiceover] ──► [Lipsync (nur bei Sprecher:in)] ─────┤
                                                               ├──► [Mix Audio] ──► [Composition] ──► [Upscale] ──► Export
[Music Node: Bett]    ─────────────────────────────────────────┤
[SFX Node: Akzente]   ─────────────────────────────────────────┘
```

### Schritt 1 – Produkt einbringen (Upload Media)

Lade 2–4 echte Produktfotos hoch: freigestellt, seitlich, in Benutzung. **Grundregel:**
*Referenzfotos definieren das Produkt, Prompts definieren Szene und Bewegung.* Wenn du das Produkt
per Prompt beschreibst statt per Referenz, erfindet das Modell Details – Etiketten, Logos, Proportionen
driften zwischen den Varianten.

### Schritt 2 – Image Node: Keyframes statt Video-Prompts

Erzeuge pro Shot **ein Standbild**. Setze Modell, **Seitenverhältnis** (9:16 Reels/TikTok, 1:1 Feed,
16:9 YouTube) und Auflösung.

Prompt-Muster:

```
[Shot-Größe] von [Produkt aus Referenz] auf [Untergrund],
[Lichtsetzung], [Stimmung/Farbwelt], [Kamera/Objektiv],
Platz oben rechts für Text-Overlay, keine Schrift im Bild
```

Beispiel:

```
Nahaufnahme des Thermobechers aus der Referenz auf einer nassen Bahnsteigkante,
kaltes Morgenlicht von hinten, aufsteigender Dampf, gedeckte Blau- und Grautöne,
50 mm, flache Schärfentiefe, Platz oben rechts für Text-Overlay, keine Schrift im Bild
```

Iteriere hier so lange, bis das Bild sitzt. Bilder sind um ein Vielfaches günstiger als Videos –
jede Korrektur, die du hier machst, sparst du zehnfach im Video-Node.

**Kein Text im Bild generieren.** KI-Modelle schreiben unzuverlässig; Claims und Preise gehören als
Overlay in den Schnitt, schon wegen Rechtssicherheit und Lokalisierung.

### Schritt 3 – Video Node: Bewegung

Verbinde das freigegebene Bild als **Startframe** mit dem Video-Node. Prompte jetzt **nur Bewegung**,
nicht den Inhalt neu:

```
langsamer Push-in auf den Becher, Dampf steigt gleichmäßig auf,
Hintergrund leicht unscharf in Bewegung, Kamera ruhig, kein Schnitt
```

Regeln, die sich in der Praxis bewähren:

- **Eine Bewegung pro Clip.** „Push-in *und* Schwenk *und* Handgriff" wird Matsch.
- **Clips kurz halten** (ca. 4–8 s) und mehrere Video-Nodes für mehrere Shots nutzen. Lange Einzelclips
  driften und kosten mehr, wenn sie misslingen.
- **Modellwahl nach Bedarf**: Premium-Modelle (z. B. Sora-2-Pro-Klasse) für den Hero-Shot, günstigere
  für B-Roll. Ein Sora-2-Pro-Video-Node kostet dieselben ~12.000 Credits wie eine direkte
  Sora-2-Pro-Generierung – Flows hat keinen Aufpreis, aber eben auch keinen Rabatt.

### Schritt 4 – Text to Speech: die Stimme

TTS-Node mit deinem Skript. Verfügbar sind alle ElevenLabs-Stimmmodelle inklusive **Eleven v3
(expressive)**; ein **Professional Voice Clone** lässt sich direkt im Flow verwenden – das ist der
Weg zu einer konsistenten Markenstimme über alle Spots und Sprachen.

- Emotion steuerst du über Satzbau und Interpunktion, nicht über Regieanweisungen im Text.
- Prüfe Zahlen, Preise, Produktnamen und Anglizismen einzeln – das sind die typischen Aussprachefehler.
- Für Mehrsprachigkeit: gleiche Stimme, übersetztes Skript, TTS-Node neu ausführen. Video bleibt stehen.

### Schritt 5 – Lipsync (nur bei sprechenden Personen)

Wenn ein Avatar/Testimonial spricht: TTS-Node mit Video-Node verketten – Flows erzeugt über
OmniHuman/Veed-LipSync-Technik den lippensynchronen Talking Head. Für reine Produktspots mit
Off-Stimme brauchst du diesen Node **nicht** (spart Credits und Fehlerquellen).

### Schritt 6 – Musik & Soundeffekte

- **Music Node**: instrumentales Bett, das der Stimme Platz lässt. Prompt-Muster:
  `20 s, instrumental, ruhiger Puls, warme Synths, kein Gesang, sanfter Aufbau ab Sekunde 12, sauberer Abschluss`
- **SFX Node**: 2–3 gezielte Akzente (Dampfzischen, Klick, Whoosh am Schnitt). Sound Design ist der
  Unterschied zwischen „KI-Clip" und „Spot".

### Schritt 7 – Mix Audio & Composition

Sprache, Musik und SFX in den **Mix Audio**-Node, dann in **Composition** mit dem Video layern und
in der Vorschau prüfen. Richtwert für die Pegel: **Stimme deutlich vorn, Musik klar darunter**
(grob 12–15 dB leiser), SFX nur als Spitzen.

### Schritt 8 – Upscale & Export

**Upscale**-Node für den finalen Hero-Cut, dann Export – für Feinschnitt, Untertitel und Endkarte
weiter ins **Studio**. Untertitel sind Pflicht: Der überwiegende Teil der Social-Wiedergaben startet stumm.

---

## 5. Abkürzung: der Flows Agent

Statt jeden Node manuell zu setzen, öffnest du das Chat-Seitenpanel und beschreibst dein Vorhaben.
Der Agent wählt Modelle, erstellt und verbindet Nodes und startet Generierungen. Er stellt vorab
Rückfragen (Länge, Tonalität, Struktur), um Credits nicht zu verbrennen.

**Aktiviere den „Assist Mode"** – dann pausiert der Agent vor teuren Generierungen und fragt nach
Bestätigung. Bei Video-Nodes ist das bares Geld.

Prompt-Vorlage für den Agent:

```
Baue einen Flow für einen 20-Sekunden-Instagram-Reels-Spot, 9:16.
Produkt: <Produkt>, Kernnutzen: <Nutzen>. Zielgruppe: <ZG>.
Struktur: 3 Shots (Hook / Produkt in Aktion / CTA-Shot), je 6-7 s.
Ich lade 3 Produktfotos als Referenz hoch - das Produkt muss exakt den Fotos entsprechen.
Voiceover: deutsche Off-Stimme, freundlich-direkt, Skript:
"<dein Skript>"
Dazu ein instrumentales Musikbett ohne Gesang und 2 dezente SFX.
Alles in einen Mix-Audio- und Composition-Node zusammenführen.
Frag mich vor jeder Videogenerierung um Bestätigung.
```

Der Agent ist in allen Plänen enthalten; die Chat-Nutzung wird tokenbasiert abgerechnet,
die Generierungen zu den normalen Sätzen des jeweiligen Modells.

---

## 6. Aus einem Spot zehn machen (der eigentliche Hebel)

Der Flow ist gespeicherte Struktur – **du baust ihn einmal und tauschst danach nur Inputs**:

| Was du tauschst | Was du bekommst |
|---|---|
| Skript im TTS-Node | neue Botschaft, gleiches Bildmaterial |
| Sprache im TTS-Node | Lokalisierung mit identischer Markenstimme |
| Referenzfotos im Upload-Node | derselbe Spot für ein anderes Produkt |
| Hook-Shot (Image + Video) | A/B-Test der ersten 3 Sekunden |
| Seitenverhältnis im Image-Node | 9:16 / 1:1 / 16:9 für alle Plattformen |

**Empfohlenes Test-Vorgehen:** einen Flow duplizieren, nur den Hook variieren (3–5 Versionen),
alles danach identisch lassen. So misst du wirklich den Hook – die Variable, die bei Social Ads
den größten Teil der Performance erklärt.

---

## 7. Credits nicht verbrennen – Checkliste

1. Skript **vor** der ersten Generierung fertigstellen.
2. Bilder perfektionieren, bevor irgendein Video-Node läuft.
3. **Partial Re-Run** nutzen: nur den geänderten Node neu ausführen, nie den ganzen Flow.
4. Erst mit **günstigem Videomodell** in niedriger Auflösung testen, dann den finalen Shot mit dem
   Premium-Modell rendern.
5. **Assist Mode** im Agent an.
6. Upscale nur auf die Clips, die es in den finalen Schnitt schaffen.
7. Voiceover in einem Rutsch für alle Sprachen erzeugen, wenn das Video steht.

---

## 8. Qualitäts-Check vor dem Launch

- [ ] Ohne Ton verständlich? (Untertitel, Text-Overlays, klares Produktbild)
- [ ] Hook in den ersten 3 Sekunden – ohne Logo-Intro davor
- [ ] Produkt sieht in **jedem** Shot identisch aus (Etikett, Farbe, Form)
- [ ] Keine generierte Schrift im Bild
- [ ] Hände, Gesichter, Spiegelungen in Zeitlupe geprüft (klassische KI-Artefakte)
- [ ] Stimme verständlich über der Musik, Zahlen/Namen korrekt ausgesprochen
- [ ] Genau **ein** CTA, sichtbar und hörbar
- [ ] Korrektes Seitenverhältnis und sichere Ränder pro Plattform
- [ ] Claims faktisch belegbar (Werberecht, UWG)
- [ ] KI-Kennzeichnung gemäß Plattform-Richtlinien und EU-AI-Act-Transparenzpflichten gesetzt
- [ ] Kommerzielle Nutzungsrechte durch deinen ElevenLabs-Plan gedeckt (kostenlose Pläne meist nicht)

---

## 9. Typische Fehler

| Fehler | Folge | Fix |
|---|---|---|
| Produkt nur per Prompt beschrieben | Etikett/Form driftet pro Clip | Referenzfotos in Upload Media |
| Video-Prompt beschreibt Inhalt neu | Startframe wird überschrieben | im Video-Node nur Bewegung prompten |
| Mehrere Bewegungen in einem Clip | Morphing, Artefakte | eine Bewegung pro Node, mehr Shots |
| Skript zu lang für die Laufzeit | gehetzte Stimme | ~2,5 Wörter/Sekunde rechnen |
| Direkt mit Premium-Videomodell iteriert | Credits weg | erst Bilder, dann günstig testen |
| Musik zu laut | Botschaft geht unter | Stimme 12–15 dB über dem Bett |
| Kein Untertitel | Reichweite verpufft bei stummer Wiedergabe | im Studio ergänzen |

---

## Quellen

- [ElevenCreative Flows overview – ElevenLabs Docs](https://elevenlabs.io/docs/eleven-creative/products/flows)
- [Introducing Flows, the AI creative canvas – ElevenLabs Blog](https://elevenlabs.io/blog/introducing-flows-in-elevencreative)
- [Introducing Flows Agent in ElevenCreative – ElevenLabs Blog](https://elevenlabs.io/blog/introducing-flows-agent)
- [ElevenLabs Flows – Produktseite](https://elevenlabs.io/flows)
- [Build an Automated Ad Generator With ElevenLabs Flows – The Rundown](https://app.therundown.ai/guides/build-an-automated-ad-generator-with-this-new-tool-eleven-labs-flows)
- [How ElevenLabs Flows Speeds Up AI Ad Creation – GoTranscript](https://gotranscript.com/public/how-elevenlabs-flows-speeds-up-ai-ad-creation)
- [ElevenLabs Flows: Build an Entire Content Pipeline on One Canvas – Feisworld](https://www.feisworld.com/blog/elevenlabs-flows)
