# NackenFrei — Der Spot

`marketing/nackenfrei-spot.mp4` · 17,8 s · 1080 × 1920 · 30 fps · stumm

Gebaut ohne weitere Generierung, aus vorhandenem Material und den Markenassets.
Stand: 27. August 2026.

---

## Der Schnitt

| Zeit | Einstellung | Herkunft | Einblendung |
|---|---|---|---|
| 0,0–2,7 | Gerade Massagepistole, Ellbogen hoch | Clip `8f69be11`, entlogot und gegradet | **„So kommt niemand da hin."** · „Gerader Griff." |
| 2,7–5,3 | Diagramm: Reichweite des Arms endet vor der Zone | erzeugt | **„Diese Stelle erreicht keine Hand."** · „So weit kommt der Arm." |
| 5,3–8,0 | Diagramm: der Bogen führt über die Schulter auf die Zone | erzeugt | **„Der Bogen geht darüber hinweg."** · „Fester Bogen. Nichts zum Anstecken." |
| 8,0–10,1 | Bogengriff in Anwendung, halbnah | Clip `da55be44`, entlogot und gegradet | **„Ohne verdrehten Arm."** · „Ellbogen bleibt unten." |
| 10,1–12,0 | Kontakt-Detail, Kamera fährt heran | Clip `bcf71d3d`, entlogot mit mitlaufender Maske | **„Punktgenau am Muskel."** · „Kugelkopf für die Fläche." |
| 12,0–14,8 | Produkt mit vier Aufsätzen, langsamer Push | `produkt-freigestellt.png` | **„Vier Aufsätze. Neun Stufen."** · „Ein Bogen. Kein Ansteckgriff." |
| 14,8–17,8 | Abbinder | Wortmarke aus `marketing/logo/` | **NACKENFREI** · „Ohne fremde Hilfe." · „14 Tage Rückgabe · Versand frei" |

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

## Was noch fehlt

| Fehlt | Aufwand |
|---|---|
| **Ton** — Musikbett und zwei Akzente | Der Spot ist sound-off gebaut und funktioniert stumm. Musik aus freier Bibliothek |
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
