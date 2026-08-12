# Projektkontext — NackenFrei

Diese Datei wird von jeder Claude-Code-Session automatisch gelesen. Sie ersetzt das,
woran ich mich nicht erinnern kann: Chatverläufe sind zwischen Sessions nicht
verfügbar, Dateien im Repo schon. Bei wichtigen Änderungen hier nachziehen.

Stand: 12. August 2026

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
| Erstbestellung | 100 Stück, Landepreis rund 11,20 € je Gerät |
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

- **`checkliste.md`** — die maßgebliche Liste bis zur ersten Anzeige, Block 0 bis 10
- **`alibaba-leitfaden.md`** — Einkauf, Papiere, Zoll, plus die geprüften Lieferanten
- **`wettbewerb.md`** — deutscher Wettbewerb
- **`instagram-plan.md`** — Begründungen zur Kampagne

## Lieferantenstand

Beide führen exakt die Bauform aus `produktfoto.png`. Xingou ist ausgeschieden.

| | ScPanda (GB-868) | Youmei (H8119-G3) |
|---|---|---|
| Stückpreis bei 100 | 5,21 € | 4,42 € |
| Logo ab | 100 Stück | 500 Stück |
| Eigene Verpackung ab | 300 Stück | 1.000 Stück |
| Volumengewicht/Stück | 1,18 kg | 1,90 kg |
| Landepreis (Schätzung) | ~11,20 € | ~11,80 € |

Der niedrigere Stückpreis bei Youmei wird durch die voluminösere Verpackung wieder
aufgefressen — die Frachtangebote entscheiden, nicht die Stückpreise.

**Offen:** DDP-/Frachtangebote, Stück je Umkarton, Motortyp (ScPanda-Listing sagt
Bürstenmotor, Auskunft sagt < 40 dB — das passt nicht zusammen), Muster an die
deutsche Adresse, Prüfpapiere (CE, EMV, RoHS, UN38.3).

## Offene Widersprüche

- **Verkaufspreis:** Die Landingpage nennt **99,99 €**, die Deckungsbeitragsrechnung
  in `alibaba-leitfaden.md` rechnet mit **79 €**. Eine der beiden Zahlen ist veraltet —
  vor dem Shop-Aufbau klären, sie trägt die gesamte Kampagnenrechnung.
- **Aufsätze:** Seite nennt vier, das Video-Prompt-Dokument fünf. Foto zeigt vier Typen.
- **Laufzeit:** Seite 30–35 Minuten, Hersteller 2–3 Stunden. Rechnerisch sind ~27
  Minuten plausibel. Am Muster messen.
- **Gewicht:** 590 g auf der Seite gegen 856–900 g Bruttoangabe der Hersteller.

## Nächste Schritte

1. Muster von ScPanda und Youmei an die deutsche Adresse bestellen — sie brauchen drei
   Wochen und blockieren alles Weitere
2. Registrierungen anstoßen, die Bearbeitungszeit haben: Stiftung EAR, LUCID, USt-IdNr.,
   EORI
3. Verkaufspreis final entscheiden
4. Shop aufsetzen und Landingpage-Platzhalter ersetzen (Block 3 und 4 der Checkliste)

## Arbeitsweise

- Sprache: Deutsch
- Rechtliches ist recherchierter Stand, kein Rechtsrat — Steuerberatertermin steht offen
- Keine Heil- oder Linderungsversprechen in Texten und Anzeigen, produktbezogen bleiben
