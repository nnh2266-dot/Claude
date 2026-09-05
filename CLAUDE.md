# Projektkontext — NackenFrei

Diese Datei wird von jeder Claude-Code-Session automatisch gelesen. Sie ersetzt das,
woran ich mich nicht erinnern kann: Chatverläufe sind zwischen Sessions nicht
verfügbar, Dateien im Repo schon. Bei wichtigen Änderungen hier nachziehen.

Stand: 5. September 2026

---

## Worum es geht

**NackenFrei** — Massagepistole mit festem Bogengriff, mit der man ohne fremde Hilfe
zwischen die eigenen Schulterblätter kommt. Vier Aufsätze, neun Kraftstufen, 20 Watt,
1200-mAh-Akku, ABS und Silikon, mattschwarz.

Verkauf über einen **eigenen Shopify-Shop** an Endkunden in **Deutschland und
Österreich** (Schweiz bewusst ausgeschlossen), beworben über **Meta/Instagram**.
Kein Vertrieb über Händler — „Händler" meint in diesem Projekt die **Lieferanten
auf Alibaba**.

## Rahmen

| | |
|---|---|
| Firma | Deutsches Einzelunternehmen, Gewerbe angemeldet |
| Steuer | Kleinunternehmer nach § 19 UStG — keine MwSt., kein Vorsteuerabzug |
| Standort | Aufenthalt in Thailand; Rückkehr nach Deutschland steht aus |
| Erstbestellung | 50 Stück, Landepreis rund 12,90 € je Gerät (ScPanda) |
| Werbebudget | 25 €/Tag, Entscheidung nach ~700 € über vier Wochen |

In `marketing/checkliste.md` markiert **(dort)** Aufgaben, die aus Thailand erledigt
werden können, **(DE)** solche, die die Rückkehr brauchen.

## Wo was liegt

| Branch | Inhalt |
|---|---|
| `claude/haendler-checkliste-p1wt9z` | **Dieser Branch** — Kontext und `marketing/` |
| `claude/website-instagram-werbung-l2dx07` | Ursprung von `marketing/` |
| `claude/side-landing-checklist-criteria-8rejna` | `index.html` — die aktuelle Landingpage, plus `og.jpg`, `nackenfrei.pdf` |
| `claude/container-scroll-animation-3f0qs8` | `produktfoto.png`, Video-Prompt-Dokument |
| `claude/massage-gun-website-e8aqp7` | Ältere Fassung der Produktseite |
| `claude/install-frontend-design-skill-cs25u0` | Die fünf Design-Skills unter `.claude/skills/` |

**Die abhakbare Fassung der Checkliste ist GitHub-Issue #1**
(`nnh2266-dot/Claude`). Dort setzt er die Haken, dort steht der aktuelle Stand.
Bei „Stand?" im Chat: Issue #1 lesen und offene Punkte zusammenfassen. Ändert sich
der Plan, Issue **und** `marketing/checkliste.md` nachziehen.

Die Dokumente in `marketing/`:

- **`checkliste.md`** — die maßgebliche Liste bis zur ersten Anzeige, Block 0 bis 12
- **`kosten.md`** — was der Start kostet, Deckungsbeitrag, Break-even bei 50 Stück
- **`prognose.md`** — Trichterrechnung, Erfolgswahrscheinlichkeit, drei Startwege im Vergleich
- **`registrierungen.md`** — EAR, BattDG, LUCID, EORI: Reihenfolge, Dauer, Kosten
- **`musterpruefung.md`** — Befunde am echten Gerät, Drucksensorik, was noch zu messen ist
- **`lieferanten-nachrichten.md`** — fertige Anfragen an ScPanda und Youmei zum Kopieren
- **`alibaba-leitfaden.md`** — Einkauf, Papiere, Zoll, plus die geprüften Lieferanten
- **`wettbewerb.md`** — deutscher Wettbewerb
- **`instagram-plan.md`** — Begründungen zur Kampagne

## Lieferantenstand

Beide führen exakt die Bauform aus `produktfoto.png`. Xingou ist ausgeschieden.

| | ScPanda (GB-868) | Youmei (H8119-G3) |
|---|---|---|
| **Stückpreis bei 50** | **5,21 €** | 5,47 € |
| Stückpreis bei 100 | 5,21 € | 4,42 € |
| Logo ab | 100 Stück | 500 Stück |
| Eigene Verpackung ab | 300 Stück | 1.000 Stück |
| Volumengewicht/Stück | 1,18 kg | 1,90 kg |
| **Landepreis bei 50 (Schätzung)** | **~12,90 €** | ~15,60 € |

**Bei der beschlossenen Menge von 50 Stück ist ScPanda auf beiden Achsen vorn.**
Youmeis Preisvorteil entsteht erst ab 100 Stück; bei 50 liegt Youmei darüber, und
ScPandas dichtere Verpackung senkt zusätzlich die Fracht. Die echten DDP-Angebote
stehen weiterhin aus und können das noch bewegen.

**Offen:** DDP-/Frachtangebote, Stück je Umkarton, Motortyp (ScPanda-Listing sagt
Bürstenmotor, Auskunft sagt < 40 dB — das passt nicht zusammen), Muster an die
deutsche Adresse, Prüfpapiere (CE, EMV, RoHS, UN38.3).

## Offene Widersprüche

- ~~Verkaufspreis 99,99 € gegen 79 €~~ — **entschieden am 12. August 2026:** regulär
  **99,99 €**, Aktionspreis **79,99 €** (−20 %) ab Kampagnenstart. Beide Zahlen waren
  richtig, es sind zwei verschiedene Preise. Deckungsbeitrag ~71 € regulär, ~54 € in
  der Aktion; maximaler CPA 45 €, Break-even-ROAS 1,77. **Bedingung:** Der Shop muss
  mindestens 30 Tage regulär bei 99,99 € gelaufen sein, bevor die Aktion ausgezeichnet
  wird (§ 11 PAngV, EuGH C-330/23). Eine selbst gesetzte UVP ist keine Option.
- **Aufsätze:** Seite nennt vier, das Video-Prompt-Dokument fünf. Foto zeigt vier Typen.
- **Laufzeit:** Seite 30–35 Minuten, Hersteller 2–3 Stunden. Rechnerisch ~27 Minuten
  frei laufend — **unter Andruck wegen der Drucksensorik eher 18–21 Minuten.** Die
  Seitenangabe ist damit vermutlich zu hoch. Unter Andruck messen, siehe
  `musterpruefung.md`.
- **Gewicht:** 590 g auf der Seite gegen 856–900 g Bruttoangabe der Hersteller.

## Stand der Musterprüfung (5. September 2026)

Muster nach rund drei Wochen angekommen. **Gemessener Befund: Das Gerät hat eine
Drucksensorik** — unter Andruck steigt die Schlagfrequenz hörbar und geht über
Stufe 9 hinaus, während die Stufenanzeige stehen bleibt. Kein Defekt, sondern eine
undokumentierte Funktion. Folgen und offene Messungen in `musterpruefung.md`.

**Die Sammelbestellung ist offen**, bis das zweite Muster verglichen und die
Wärmeprüfung gemacht ist.

## Nächste Schritte

1. **Stiftung EAR anstoßen** — 6–8 Wochen, teils über drei Monate, und ohne WEEE-Nummer
   darf nicht verkauft und nicht angeboten werden. Das ist die längste Leitung im
   Projekt, nicht das Muster
2. Muster von ScPanda und Youmei an die deutsche Adresse bestellen — drei Wochen
3. Übrige Registrierungen: Batterie (BattDG), LUCID, USt-IdNr., EORI — alle kostenlos
   oder fast
4. Nach Musterprüfung: 50 Stück bestellen, voraussichtlich bei ScPanda
5. Shop aufsetzen und Landingpage-Platzhalter ersetzen (Block 4 und 5 der Checkliste)

**Beschlossene Konfiguration:** 50 Stück Erstbestellung, volles Werbebudget 700 €
(real 833 € mit § 13b). Gesamteinsatz rund **2.500 €**. Break-even bei **36 der 50
Geräte**. Einzelheiten in `kosten.md`.

## Arbeitsweise

- Sprache: Deutsch
- Rechtliches ist recherchierter Stand, kein Rechtsrat — Steuerberatertermin steht offen
- Keine Heil- oder Linderungsversprechen in Texten und Anzeigen, produktbezogen bleiben
