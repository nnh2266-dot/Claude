# NackenFrei — Der Spot

`marketing/nackenfrei-spot.mp4` · 15,5 s · 1080 × 1920 · 30 fps · mit Ton

Gebaut ohne weitere Generierung, aus vorhandenem Material und den Markenassets.
Stand: 27. August 2026.

---

## Der Schnitt

| Zeit | Einstellung | Herkunft | Einblendung |
|---|---|---|---|
| 0,0–2,0 | Gerade Massagepistole, Ellbogen hoch | Clip `8f69be11` | **„So kommt niemand da hin."** |
| 2,0–4,5 | Diagramm: Reichweite des Arms endet vor der Zone | erzeugt | **„Diese Stelle erreicht keine Hand."** |
| 4,5–7,0 | Diagramm: der Bogen führt über die Schulter auf die Zone | erzeugt | **„Der Bogen geht darüber hinweg."** |
| 7,0–8,5 | Bogengriff, halbnah | Clip `da55be44` | **„Ohne verdrehten Arm."** |
| 8,5–10,5 | Kontakt-Detail, Kamera fährt heran | Clip `bcf71d3d` | **„Punktgenau am Muskel."** |
| 10,5–13,0 | Produkt mit vier Aufsätzen | `produkt-freigestellt.png` | **„Vier Aufsätze. Neun Stufen."** |
| 13,0–15,5 | Abbinder | Wortmarke | **NACKENFREI** · „Ohne fremde Hilfe." |

**Alle Schnitte sind harte Schnitte auf dem Takt** (120 BPM, Schlag alle 0,5 s), keine
Überblendungen. Weiche Blenden ließen die frühere Fassung wie ein Erklärvideo wirken.

Dramaturgie: **Problem gezeigt → Problem erklärt → Lösung erklärt → Lösung gezeigt →
Lösung im Detail → Produkt → Marke.** Die beiden Diagramme stehen in der Mitte, die
Realaufnahmen klammern sie ein, und die Lösungsseite geht von halbnah auf nah — erst die
Haltung, dann der Kontakt.

---

## Warum er so aussieht

**Das Diagramm ist der Beweis, nicht die Aufnahme.** Was die Realaufnahmen nicht zeigen
können — dass der Arm an einer bestimmten Stelle aufhört und der Bogen darüber
hinwegreicht — führt der Spot als Zeichnung. Das ist exakt kontrollierbar, braucht keine
Generierung und sieht aus wie ein Messgerät statt wie eine Massagepistolen-Anzeige.
Genau darin liegt die Differenzierung: Der Kategorie-Standard ist weißes Studio,
Zeitlupe, Bassmusik.

**Alles in der Farbwelt der Landingpage.** Graphit `#0A0D13`, Kupfer `#E2703A`, Akzent
`#4C7BFF` — direkt aus `index.html` übernommen. Wer aus der Anzeige klickt, landet in
derselben Welt; das senkt die Absprungrate.

**Die Realaufnahmen sind gegradet, nicht nur geschnitten.** Sättigung herunter, kühle
Schatten, Vignette, Filmkorn. Das Fitnessstudio verschwindet dadurch weitgehend im
Dunkeln und wird zum neutralen Raum statt zum Sportsignal.

**Die Fremdlogos sind entfernt.** Nicht mit sichtbaren Weichzeichner-Kästen, sondern mit
weich auslaufenden Masken pro Einzelbild (`spot-quellen/delogo.py`) — je drei Stellen pro
Clip: BH-Band, Hosenbund, Armbanduhr. Im Kontakt-Detail fährt die Kamera heran, dort
**wandert die Maske linear mit**, sonst läuft das Logo unter dem Fleck hervor.

**Die echte Wortmarke.** Der Abbinder benutzt `nackenfrei-wortmarke-weiss.png`, nicht
gesetzten Text.

**Typografie in zwei Ebenen:** Aussage oben (weiß, fett), Präzisierung unten (kupfer,
mager), dazwischen eine kurze Kupferlinie. Auf jeder Einstellung gleich — das hält die
sechs sehr unterschiedlichen Bildquellen zusammen.

**Alles innerhalb der Safe Area:** Kopfzeile ab 272 px, Fußzeile bis 1452 px. Der
KI-Hinweis steht ab Bild 1 oben links (Art. 50 EU AI Act).

---

## Das Kontakt-Detail

Clip `bcf71d3d` stand in der ersten Bestandsaufnahme als „Reserve" — zu Unrecht. Er
enthält eine **langsame Heranfahrt**, und in der engeren Endeinstellung sind Hosenbund
und Uhr ohnehin aus dem Bild. Übrig bleibt die beste Aufnahme des gesamten Materials:
Chromring, Kugelkopf am Muskel, Hand korrekt am Schaft, Arm entspannt.

Beschnitt auf 557 × 990 aus der Quelle, dann auf 1080 × 1920 — ein Hochskalieren um das
Doppelte. Als Detail-Einstellung mit Grade und Korn trägt das; als Vollbild-Einstellung
täte es das nicht.

## Der Ton

`spot-quellen/music.py` erzeugt das Bett synthetisch — keine Lizenzfrage, keine
Bibliothek, reproduzierbar:

- **Drone** auf A1 (55 Hz) mit leicht verstimmter Doppelung, langsame Schwellung über 9 s
- **Fläche** aus a-Moll (220 / 261,63 / 329,63 / 440 Hz), jede Stimme mit eigenem LFO
- **Puls** auf jedem Schlag bei 120 BPM, auf der Eins betont — ein kurzer Sinus mit
  Tonhöhenabfall von 74 auf 48 Hz
- **Impuls auf jedem Schnitt**, damit Bild und Ton auf demselben Raster sitzen
- **Anhebung** ab 12,4 s in den Abbinder, dazu ein kurzes Schimmern auf der Wortmarke
- Einfacher Tiefpass darüber, Ein- und Ausblendung, Spitze bei −2 dBFS

Kein Bass-Drop, kein Trailer-Sound. Der Kategorie-Standard ist Studio-Techno; davon
wegzugehen ist Teil der Differenzierung.

## Was noch fehlt

| Fehlt | Aufwand |
|---|---|
| **Sprecherin** | TTS kostet einen Bruchteil eines Video-Nodes |
| **Untertitel** | erst nötig, wenn eine Stimme darunterliegt |
| **4:5-Fassung** (1080 × 1350) | eigene Textebene, kein Beschnitt — die Einblendungen müssen neu gesetzt werden |
| **Preis 79,99 €** | bewusst nicht im Bild; als Variante gegen die jetzige Fassung testbar |

---

## Die Quellen

`marketing/spot-quellen/` enthält die Skripte, mit denen die erzeugten Einstellungen
entstanden sind:

- `design.py` — Farbwelt, Silhouette, Leuchtzone, Pfade, Typografie, KI-Hinweis
- `shot_diag.py` — die beiden Diagramm-Einstellungen
- `shot_prod.py` — Produkt-Einstellung und Abbinder
- `delogo.py` — Entfernen der Fremdlogos aus den Realaufnahmen

Damit ist jede Einstellung reproduzierbar und einzeln änderbar: andere Aussage, andere
Farbe, andere Länge — ohne den Rest anzufassen.
