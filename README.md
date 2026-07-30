# NackenFrei — Produktseite

Landingpage für eine Perkussionsmassagepistole mit verlängerbarem Griff. Kernidee der
Seite: der Griff ist das Produkt, also muss die Seite ihn *zeigen* — die interaktive
Reichweiten-Demo im Hero ist das Argument, nicht die Dekoration.

## Aufbau

Eine einzige Datei: [`index.html`](index.html). Kein Build, keine Abhängigkeiten, kein
CDN. Öffnen genügt.

```
open index.html          # oder: python3 -m http.server
```

| | |
|---|---|
| Größe | ~136 KB, davon ~64 KB eingebettete Schriften |
| Übertragen (gzip) | ~68 KB |
| Externe Requests | keine |

## Sektionen

1. **Hero + Reichweiten-Demo** — Slider für die Griffverlängerung (0–48 cm). Zonen des
   Rückens leuchten auf, sobald sie erreichbar sind; der Prozentwert nennt den Anteil der
   erreichbaren Rückenmuskulatur. Bei 0 cm zeigt die Demo, was eine übliche
   Massagepistole abdeckt: 22 %.
2. **Technik** — Kennzahlen als hochlaufende Zähler, schematischer Aufbau, Wellenform mit
   fünf Intensitätsstufen (Canvas).
3. **Anwendung** — fünf Aufsätze mit Detailpanel, sechs geführte Routinen.
4. **Vergleich, Stimmen, Preis, FAQ**.

## Gestaltung

**Farben.** Grund ist ein blau gebrochenes Graphit (`#0A0D13`), kein reines Schwarz.
Akzent ist Kobalt (`#4C7BFF`). Daneben steht ein einziges semantisches Paar, das
ausschließlich in der Reichweiten-Demo vorkommt: Kupfer (`#E2703A`) für behandelte Zonen,
Kaltgrau für unerreichbare — eine Muskel-Heatmap, keine Zierfarbe.

**Schrift.** Fira Sans Condensed (Display), Fira Sans (Lesetext), Fira Mono (Daten und
Labels). Die Schnitte sind auf die verwendeten Glyphen reduziert und als Data-URI
eingebettet — dadurch ist die Typografie auf jedem Gerät identisch, ohne FOUT und ohne
Abhängigkeit von lokal installierten Schriften. Die `@font-face`-Regeln deklarieren einen
Weight-Range, damit nichts synthetisch fett gerendert wird.

**Themes.** Dunkel ist die Grundlage. Wer sein System auf hell stellt, bekommt das
vollständig ausgestaltete helle Set; der Schalter im Header übersteuert beides und merkt
sich die Wahl. Soll die Seite unabhängig vom System immer dunkel sein, genügt es, den
`@media (prefers-color-scheme: light)`-Block zu entfernen.

**Bewegung.** Eine orchestrierte Einstiegssequenz, danach nur Scroll-Reveals und
Hover-Zustände. Die Reichweiten-Demo fährt beim ersten Sichtbarwerden einmal aus, damit
klar wird, dass sie bedienbar ist. Alles respektiert `prefers-reduced-motion`; die
Wellenform-Animation pausiert, sobald das Canvas außerhalb des Viewports liegt, und
zeichnet mit maximal doppelter Pixeldichte.

## Geprüft

Kein horizontales Scrollen bei 320 / 360 / 390 / 414 / 768 / 1024 / 1440 / 1920 px.
Beide Systemthemes samt Umschalten, `prefers-reduced-motion`, Tastaturfokus, keine
doppelten IDs, keine Konsolenfehler.

## Inhalte

Konzeptseite. Produktdaten, Zitate und Preise sind Demo-Inhalte und beschreiben kein
real erhältliches Gerät.

## Schriftlizenz

Fira Sans, Fira Sans Condensed und Fira Mono — Copyright (c) 2012–2015, The Mozilla
Foundation and Telefonica S.A. Lizenziert unter der SIL Open Font License 1.1,
<https://scripts.sil.org/OFL>. Die eingebetteten Dateien sind Zeichen-Subsets der
Originale.
