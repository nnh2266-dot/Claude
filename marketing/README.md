# NackenFrei — Projektübersicht

Einstiegspunkt für alles, was zu diesem Vorhaben entschieden, recherchiert und gebaut
wurde. Die Einzelheiten stehen in den verlinkten Dateien; hier steht, was gilt.

Zuletzt zusammengefasst: 5. September 2026.

---

## 1. Was das Vorhaben ist

Verkauf einer **Perkussionsmassagepistole mit fest gebogenem Griff** über einen eigenen
Shop in Deutschland, beworben über Meta-Anzeigen. Das Verkaufsargument: Der Bogen führt
den Massagekopf über die Schulter an die Stelle zwischen den Schulterblättern, die
weder von oben noch von unten mit der Hand erreichbar ist.

---

## 2. Die Firma

| | |
|---|---|
| Rechtsform | Deutsches Einzelunternehmen, Gewerbe angemeldet |
| Umsatzsteuer | **Kleinunternehmer nach § 19 UStG** — keine MwSt. auf Rechnungen, kein Vorsteuerabzug |
| Folge daraus | Auf der Seite darf **nicht** „inkl. MwSt." stehen, sondern der § 19-Hinweis |
| Grenze | 25.000 € Vorjahresumsatz = **250 Geräte**, danach Regelbesteuerung |
| Sitz des Inhabers | zeitweise Thailand, Rückkehr nach Deutschland Anfang September 2026 |

**Wichtige Konsequenz:** Meta und Shopify rechnen im Reverse-Charge ab. Die deutschen
19 % schuldet das Unternehmen selbst nach § 13b UStG und kann sie als Kleinunternehmer
**nicht abziehen**. Werbung kostet real 19 % mehr, als Meta anzeigt.

---

## 3. Das Produkt

**Modell GB-868**, Hersteller Shenzhen ScPanda Technology Co., Limited.

| Angabe | Wert | Stand |
|---|---|---|
| Kraftstufen | 9 | von drei Listings bestätigt |
| Schlagzahl | 2.000–3.200 / min | vom Lieferanten bestätigt |
| Akku | 1200 mAh | bestätigt |
| Ladung | USB, 5 V – 1 A | bestätigt |
| Ladezeit | 2–3 h | Lieferantenangabe |
| Leistung | **8,4 W** | Lieferant hat die 20 W seines Listings als Fehler zurückgezogen |
| Aufsätze | 4 — Kugel, Flach, U-Form, Spitz | bestätigt |
| Material | ABS-Gehäuse, Silikonaufsätze | bestätigt |
| Motor | **Bürstenmotor**, 36–45 dB | bestätigt, Messbedingungen unbekannt |
| Gewicht | 856 g brutto mit Verpackung | Gerät allein noch ungewogen |
| Farbkarton | 37 × 26,5 × 6 cm | bestätigt |
| Umkarton | 63 × 38 × 54,5 cm, 20 Stück, 18 kg | bestätigt |

**Noch ungeprüft und am Muster zu messen:** Gewicht ohne Zubehör (Seite sagt 590 g),
Laufzeit auf Stufe 1 und 9, echte Lautstärke, tatsächliche Leistung vom Typenschild.

---

## 4. Lieferanten

Ausführlich in [`lieferanten-status.md`](lieferanten-status.md) und
[`alibaba-leitfaden.md`](alibaba-leitfaden.md).

| | ScPanda GB-868 | Youmei H8119-G3 | Xingou XO-8817 |
|---|---|---|---|
| Preis 50–100 Stk | 5,66 $ | 5,95 / 4,80 $ | 6,13 $ |
| Jahre auf Alibaba | 7 | 4 | 3 |
| Bewertungen | 962 (4,5) | 1.292 (4,7) | 41 (4,6) |
| Logo ab | **100 Stück**, Klischee 45 $ | 500 Stück | — |
| Verpackung bedruckt ab | 200 Stück (148,5 $) | 1.000 Stück | — |
| Status | **gewählt** | antwortet nicht mehr | ausgeschieden |

**Warnsignale bei ScPanda, die bestehen bleiben:**

1. Er hat die Musterbestellung auf **Polen** deklariert, weil Alibaba Lieferungen nach
   Deutschland ohne EPR-Nummern sperrt. Sein Reflex bei einer Compliance-Sperre ist,
   sie zu umgehen.
2. Auf die Frage nach den Produktunterlagen antwortete er: *„DDP means we handle all
   the declarations and you won't have to provide any documentation."* Das heißt: Die
   Ware wird **nicht auf die eigene EORI-Nummer angemeldet.**
3. **UN38.3 und MSDS fehlen weiterhin.** Ohne sie nimmt keine Fluggesellschaft die
   Lithiumakkus an. CE hat er bestätigt, ohne die Datei zu schicken.

**Bedingung für die Sammelbestellung:** Dokumente als Dateien, und Anmeldung auf die
eigene EORI-Nummer mit Zollanmeldung — sonst DAP und selbst verzollen. Wenn er das
nicht liefert, gibt es dieselbe Bauform bei anderen Herstellern; die Bauform ist nicht
knapp, die Papiere sind das Auswahlkriterium.

---

## 5. Preis und Rechnung

Vollständig in [`rechnung.md`](rechnung.md).

**Verkaufspreis: 79 €.** Nicht 99,99 €, weil dieselbe Bauform in Deutschland zwischen
45 und 75 € liegt und RENPHO im Angebot bei 39,99 € steht. Bei 99,99 € steht das Gerät
neben dem Beurer MG 180 für 117 €, einer bekannten Marke mit Testnote 1,7.

**Bestellmenge: 60 Stück**, drei Kartons.

```
Einnahme (ohne USt.)                          79,00 €
./. Einstandspreis (Ware, Fracht, EUSt, Logo) 16,36 €
./. Versand an den Kunden                      5,30 €
./. Zahlungsgebühr                             2,17 €
./. Retouren
= Deckungsbeitrag                        rund 54,00 €
```

| | |
|---|---|
| Fixkosten Testphase | rund 768 € |
| Kapitaleinsatz 60 Stück | rund 982 € |
| Werbebudget | 700 € (real 833 € mit Reverse Charge) |
| **Break-even-CPA** | rund **45 €** |
| **Nötige Kaufrate der Seite** | **über 2,3 %** |

**Kernaussage:** Die erste Bestellung ist kein Geschäft, sondern der Kauf einer Zahl —
des CPA. Mit abverkauftem Restbestand endet die Testphase bei plus/minus null, weil die
Ware bei 16,36 € Einstand ihren Wert behält. Wer den Restbestand liegen lässt, verliert
1.100 bis 1.700 €.

Erst die Nachbestellung über 500 Stück ist ein Geschäft: bei CPA 35 € rund **+7.300 €**
im Jahr.

---

## 6. Was rechtlich zwingend ist

Ausführlich in [`checkliste.md`](checkliste.md), Block 1.

**Wer die Ware nach Deutschland einführt und verkauft, ist im Rechtssinn Hersteller.**
Das ist der Inhaber, nicht die Fabrik und nicht die Plattform. Das gilt auch bei
Dropshipping mit Direktversand aus China — deshalb ist die Spocket-Variante keine
Abkürzung.

| Register | Warum | Aufwand |
|---|---|---|
| **LUCID / VerpackG** | Verpackung | kostenlos, am selben Tag |
| **Systembeteiligung** | duales System | 30–60 € im Jahr |
| **Stiftung EAR / ElektroG** | Elektrogerät | **der Engpass**, Wochen, braucht insolvenzsichere Garantie |
| **Batterieregister** | Lithiumakku | über die EAR |
| **EORI-Nummer** | gewerbliche Einfuhr | kostenlos beim Zoll |
| **USt-IdNr.** | Reverse Charge bei Meta | kostenlos beim BZSt |

Dazu Rechtstexte (Impressum, Datenschutz, Widerruf, AGB) und die GPSR-Angabe von Name
und Anschrift auf Produkt oder Verpackung. ScPanda klebt Adressaufkleber bei 60 und
100 Stück kostenlos auf.

**Kostenrahmen erstes Jahr: 400 bis 800 €.** Ohne diese Registrierungen kann nicht
bestellt, nicht eingeführt und nicht verkauft werden.

---

## 7. Wettbewerb

Ausführlich in [`wettbewerb.md`](wettbewerb.md).

```
  40 €  ──  RENPHO Reach im Angebot
  46 €  ──  RENPHO regulär · No-Name unteres Ende
  75 €  ──  No-Name oberes Ende
 117 €  ──  Beurer MG 180
 300 €  ──  Theragun
```

**Der gebogene Griff ist kein Alleinstellungsmerkmal mehr** — mindestens sechs
No-Name-Listings auf Amazon.de und zwei Marken haben ihn.

**Das einzige verbliebene Differenzierungsargument: fest gebauter Bogen statt
ansteckbarem Verlängerungsgriff.** RENPHO Reach hat einen abnehmbaren Griff. Der
Lautstärkevorteil existiert nicht — RENPHO wirbt mit bürstenlosem Motor unter 45 dB,
das eigene Gerät hat Bürsten und liegt bei bis zu 45 dB.

---

## 8. Die Webseite

`index.html` im Wurzelverzeichnis. Eine Datei, keine externen Abhängigkeiten,
eingebettete Schriften, hell und dunkel, ohne JavaScript bedienbar.

**Abschnitte:** Bühne · Reichweite · Aufsätze und Zonen · Technik · Vergleich ·
Bestellen · Fragen

**Was geändert wurde:**

- Preis auf 79 €, Newsletter-Rabatt auf 71,10 €
- „Inkl. MwSt." ersetzt durch den § 19-Hinweis
- Rückgabe von selbst gesetzten 30 auf die gesetzlichen 14 Tage
- Schweiz aus den Versandländern entfernt — Kunden dort zahlen Einfuhrabgaben an der Tür
- **Reichweiten-Abschnitt** neu: zeigt die Lücke am eigenen Rücken, CSS-Umschalter
- **Vergleichsabschnitt** neu: fest gebaut gegen angesteckt
- 20-Watt-Angabe entfernt, ersetzt durch 2.000–3.200 Schläge pro Minute
- Ladezeit auf 2–3 h

**Noch offen: zehn Platzhalter**, die alle den Shop brauchen —
`SHOPIFY_PRODUKT_URL_EINTRAGEN` (2×), `SHOPIFY_SHOPDOMAIN_EINTRAGEN`,
`SHOPIFY_IMPRESSUM_URL`, `SHOPIFY_DATENSCHUTZ_URL` (2×), `SHOPIFY_WIDERRUF_URL`,
`LIEFERZEIT_EINTRAGEN` (3×).

Dazu ein **auskommentierter Bewertungsabschnitt**, der erst aktiviert wird, wenn echte
Rückmeldungen vorliegen. Erfundene Bewertungen sind wettbewerbswidrig und bei Meta ein
Sperrgrund.

**Offene Gestaltungsfrage:** „Reichweite" und „Aufsätze und Zonen" zeigen dieselbe
Torso-Silhouette zweimal. Vorschlag war, beide zu einem Abschnitt zusammenzulegen —
eine Figur, zwei Steuerungen. Noch nicht entschieden.

---

## 9. Marke

`logo/` — Wortmarke „NACKENFREI" in Fira Sans Condensed, Versalien, 6 % Laufweite,
Schrift in Pfade ausgelegt.

| Datei | Zweck |
|---|---|
| `nackenfrei-wortmarke.pdf` | **Druckdatei für den Lieferanten** |
| `nackenfrei-wortmarke.png` | Rückfallebene, 4000 px, transparent |
| `nackenfrei-logo.svg` | Volle Lockup mit Bildmarke |
| `nackenfrei-marke.svg` | Nur Bildmarke |

Auf dem schwarzen Gehäuse wird **in Weiß** gedruckt. Klischeekosten 45 $, zwei Monate
wiederverwendbar.

**Ehrliche Einschätzung:** Die Wortmarke ist zweckmäßig, nicht herausragend. Die
Bildmarke zeigt eine Gerade, während das Produkt eine Kurve verkauft — deshalb für den
Gehäusedruck **nur der Schriftzug**. Ein richtiges Logo lohnt, wenn die ersten hundert
verkauft sind.

---

## 10. Werbung

Kampagnenplan in [`instagram-plan.md`](instagram-plan.md), Creatives in
[`werbevideos.md`](werbevideos.md).

**Nicht „Instagram", sondern Meta.** Die kaufkräftigere Zielgruppe ab 55 sitzt auf
Facebook. Anzeigen laufen über beide Plattformen.

**Vier Anzeigenkonzepte**, drei davon aus dem Produktfoto generierbar:

1. „Der Bogen" — Kamera zieht vom Massagekopf zurück (Hauptanzeige)
2. „Vier Aufsätze" — schweben auf (Retargeting)
3. „Neun Stufen" — nur der Kopf vibriert, steigend
4. „Die Stelle" — Mensch am eigenen Rücken, braucht Handyaufnahme

**Regel, die über allem steht:** über das Produkt sprechen, nie über die Person.
Anzeigen, die dem Betrachter ein Leiden unterstellen, werden von Meta abgelehnt.

**Kampagnenrahmen:** eine Kampagne, breite Zielgruppe DE 30–65, 25 €/Tag, 4–6
Creatives, Auswertung nur montags. Kein Interessen-Micro-Targeting.

**Meta-Kundenzufriedenheitswert im Blick behalten** — unter 2,0 werden Anzeigen
eingeschränkt, unter 1,0 wird das Konto gesperrt. Der wahrscheinlichste Weg, dieses
Geschäft zu verlieren.

---

## 11. Stand und nächste Schritte

**Muster bestellt** — 2 Stück, rund 69 €, DDP per Luft, deklariert nach Polen,
geliefert nach Deutschland mit Sendungsverfolgung.

**Der nächste Meilenstein ist der Mustertest.** Er ist der letzte günstige Ausstieg,
bevor Geld für Registrierungen oder Ware fließt.

Beim Auspacken zu prüfen:

- [ ] Typenschild fotografieren — Watt, mAh, Spannung
- [ ] Gerät ohne Zubehör wiegen (Seite behauptet 590 g)
- [ ] Lautstärke mit App messen, 50 cm Abstand, Stufe 1 und Stufe 9
- [ ] Laufzeit auf Stufe 1 stoppen, Ladezeit stoppen
- [ ] Neun Stufen durchzählen, vier Aufsätze prüfen
- [ ] **Kommt man damit allein zwischen die eigenen Schulterblätter?**
- [ ] Verpackung fotografieren, auf beiliegende Rechnung prüfen

Danach in dieser Reihenfolge: LUCID · Stiftung EAR (dauert am längsten, sofort starten)
· Batterieregister · EORI · USt-IdNr. · Rechtstexte · Shopify mit den zehn Platzhaltern
· Pixel und Conversions-API · Testkauf · Instagram-Profil · dann die 60 Stück · dann
Anzeigen.

---

## 12. Was unterwegs korrigiert wurde

Damit dieselben Irrtümer nicht zweimal passieren.

- **Der Vorwurf, ScPanda biete über Listenpreis an, war falsch.** 5,66 $ entsprechen
  4,96 € — Alibaba zeigt Europreise nur umgerechnet an.
- **Der Gewichtskonflikt löste sich auf.** 856 g und 900 g sind Bruttogewichte mit
  Verpackung; die 590 g der Seite sind plausibel.
- **Die Ladeangabe der Seite stimmt.** 7,4 V ist die Akkuspannung, 5 V der USB-Eingang.
- **ScPanda war nicht wegen der Frachtdichte im Vorteil.** Beide Hersteller verwenden
  denselben Umkarton.
- **Konzept A im alten Video-Prompt-Dokument ist unbrauchbar** — es animiert einen
  ausfahrbaren Teleskopgriff, den dieses Produkt nicht hat.
- **„Rund ein Fünftel des Rückens" war eine erfundene Zahl** und wurde von der Seite
  entfernt.
- **Der Spocket-Weg spart keine Registrierungen**, weil aus China direkt versendet wird
  und der Verkäufer damit Einführer bleibt.
- **100 Stück waren die falsche Empfehlung.** Ein 700-€-Test verkauft nur 15 bis 25
  Geräte; eine größere Bestellung verbessert die Stückkosten, verkauft aber nichts mehr.
