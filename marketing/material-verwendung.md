# Was aus dem generierten Material wird

Acht Clips, elf Durchläufe. Was davon bleibt und wofür. Stand: 27. August 2026.

---

## Der Befund

Als **Neukunden-Anzeige** trägt das Material nicht — dafür fehlt die eine Aufnahme, die
das Produkt verkauft: ein Mensch, der sichtbar nicht hinkommt, und derselbe Mensch, der
mit dem Bogen hinkommt. Die steht im `drehplan-handy.md` und braucht das Muster.

Als **Einzelbilder** ist es dagegen brauchbar — und zwar nicht als Trostpreis:

> **Statische Bilder machen auf Meta weiterhin rund 60–70 % der Conversions aus.**

Dazu verlangt der eigene Plan, dass das Instagram-Profil **mindestens neun Beiträge und
vier Highlights** hat, bevor die erste Anzeige läuft — sonst springt ab, wer aus der
Anzeige kommt. Genau diese Lücke füllt das Material.

---

## Die sechs fertigen Bilder

Alle 1080 × 1350 (4:5, das Feed-Format), in der Farbwelt der Landingpage gegradet,
Fremdlogos entfernt, KI-Hinweis gesetzt. In `marketing/stills/`.

| Datei | Motiv | Wofür |
|---|---|---|
| `01-kontakt.jpg` | Kopf am Trapezmuskel, Chromring nah | **Ankerbeitrag.** Das beste Bild aus dem gesamten Material |
| `02-ueber-die-schulter.jpg` | Bogen führt über die Schulter | Zeigt die Kernfunktion, halbnah |
| `03-detail.jpg` | Nur Bogen, Chromring, Kugelkopf | **Reines Produktdetail** — hier ist die Haltung nicht erkennbar, also auch nicht angreifbar |
| `04-so-nicht.jpg` | Gerades Gerät, Ellbogen hoch | Die Problemseite. Gehört in einen Vergleichsbeitrag neben 02 |
| `05-bogen.jpg` | Bogen in Anwendung, Alternative zu 02 | Reserve, andere Hook-Variante |
| `06-produkt.jpg` | Gerät mit vier Aufsätzen auf Graphit | **Kein KI-Anteil** — echtes Produktfoto, freigestellt und neu gesetzt |

Erzeugt mit `spot-quellen/stills.py`, jederzeit neu setzbar mit anderem Text.

---

## Wie sie eingesetzt werden

**Karussell „Warum ein Bogen":** `04-so-nicht` → `02-ueber-die-schulter` → `03-detail` →
`06-produkt`. Das ist der Vergleich, den `wettbewerb.md` fordert — fester Bogen gegen
ansteckbaren Verlängerungsgriff — und er funktioniert als Standbildfolge besser als im
Video, weil der Betrachter selbst wischt und sich Zeit lässt.

**Einzelbeiträge:** `01-kontakt` und `06-produkt` tragen das Profil. Beide ohne
Erklärungsbedarf.

**Highlight-Cover:** `03-detail` beschnitten.

**Landingpage:** `06-produkt` und `03-detail` können die Platzhalter im Abschnitt
„Anwendung" ersetzen.

---

## Was das Video noch taugt

`nackenfrei-spot.mp4` ist kein Neukunden-Creative. Als **Retargeting-Asset** bleibt es
sinnvoll: für Leute, die die Seite schon gesehen haben und wissen wollen, wie das Gerät
funktioniert und welcher Aufsatz wohin gehört. Dort zählt Klarheit mehr als Emotion, und
laut `instagram-plan.md` zweifelt genau diese Gruppe an der Anwendbarkeit, nicht am Preis.

---

## Und der eigentliche Nutzen fürs Nächste

Die brauchbaren Frames sind **Referenzbilder für den Dreh.** `01-kontakt` zeigt Ausschnitt,
Lichtrichtung und Kopfhaltung, die funktionieren. Beim Handydreh dieselbe Kadrage
nachstellen — dann entsteht in einer Stunde dasselbe Bild, nur echt und mit dem Gerät,
das der Kunde wirklich bekommt.

Damit war das Material nicht umsonst: Es hat die Bildsprache gefunden, ohne die der Dreh
Versuch und Irrtum geworden wäre.
