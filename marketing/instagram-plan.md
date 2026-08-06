# NackenFrei Solo — Instagram-Kanal und Meta-Werbung

Bewertung, Ideen und Umsetzungsplan. Stand: 6. August 2026.
Grundlage: `index.html` aus Branch `claude/side-landing-checklist-criteria-8rejna`
(Produktseite, 99,99 €, Shopify, Versand DE/AT/CH).

---

## 1. Bewertung: Ist das sinnvoll?

**Ja — mit zwei Korrekturen an der Fragestellung.**

### Warum das Produkt für Meta-Werbung ungewöhnlich gut geeignet ist

Der Bogengriff ist ein **sichtbares** Argument. Das ist selten. Die meisten
Produkte in dieser Preisklasse müssen erklärt werden; NackenFrei muss nur gezeigt
werden: eine Person versucht, mit einer geraden Massagepistole zwischen die
eigenen Schulterblätter zu kommen — scheitert — greift zum Bogengriff — kommt hin.
Das versteht man in vier Sekunden, ohne Ton, ohne Text. Genau das ist die Währung
auf Reels und im Feed.

Dazu kommt: Der Nutzen ist emotional aufgeladen und unabhängig vom Preis. „Ich muss
niemanden mehr fragen" ist ein stärkeres Verkaufsargument als jede Wattzahl.

### Korrektur 1: Nicht „Instagram", sondern Meta

Die Hauptzielgruppe für dieses Produkt sind zwei Gruppen:

- **35–55, Schreibtischarbeit** — Trapez- und Nackenverspannung, kauft aus Routineleid.
- **55+** — kommt körperlich schlicht nicht mehr hinten hin. Das ist die Gruppe mit
  dem stärksten Leidensdruck und der höchsten Zahlungsbereitschaft.

Die zweite Gruppe ist auf Instagram unterrepräsentiert und auf Facebook zu Hause.
Kampagnen werden deshalb über den Meta-Werbeanzeigenmanager mit **beiden Plattformen**
als Platzierung gefahren. Der Instagram-Kanal bleibt trotzdem nötig — er ist die
Visitenkarte, die geklickt wird, bevor gekauft wird —, aber „Instagram-Werbung" als
alleiniger Kanal würde die kaufkräftigere Hälfte ausschließen.

### Korrektur 2: Die Reihenfolge stimmt noch nicht

Werbung schalten kann man erst, wenn die Seite verkaufsfähig ist. Aktuell ist sie das
nicht. Konkret gefunden im HTML:

| Fund | Bedeutung |
|---|---|
| `SHOPIFY_PRODUKT_URL_EINTRAGEN` (2×) | „In den Warenkorb" führt ins Leere |
| `SHOPIFY_SHOPDOMAIN_EINTRAGEN` | Newsletter-Formular sendet nirgendwohin |
| `SHOPIFY_IMPRESSUM_URL`, `SHOPIFY_DATENSCHUTZ_URL`, `SHOPIFY_WIDERRUF_URL` | Pflichtangaben fehlen |
| `LIEFERZEIT_EINTRAGEN` (2×) | Lieferzeit unbenannt |
| kein `fbq`, kein Consent-Banner | Kein Meta-Pixel, keine Einwilligungsabfrage |

Ohne Pixel misst Meta keine Käufe. Ohne gemessene Käufe kann der Algorithmus nicht
auf Käufer optimieren — man zahlt dann für Klicks von Leuten, die nie kaufen. Das
ist der teuerste Fehler beim Start, und er ist unsichtbar, weil die Kampagne
„läuft".

Ohne Impressum, Widerrufsbelehrung und Datenschutzerklärung ist Werbung in
Deutschland zusätzlich abmahnfähig, und Meta lehnt Anzeigen ab, deren Zielseite
Pflichtangaben vermissen lässt.

### Der ehrliche Wirtschaftlichkeits-Check

Massagepistolen sind eine überlaufene Kategorie. Der Bogengriff rettet das
Produkt — aber nur, wenn jede Anzeige mit der **Reichweite** öffnet und nie mit dem
Wort „Massagepistole". Sobald eine Anzeige wie eine generische Massagepistolen-Anzeige
aussieht, wird sie wie eine behandelt: weggescrollt.

Rechenrahmen (Zahlen sind Annahmen — Einkaufspreis und Versandkosten musst du
einsetzen):

```
Verkaufspreis brutto                99,99 €
./. MwSt. 19 %                      15,97 €
= netto                             84,02 €
./. Wareneinsatz + Versand + Retouren   ? €   ← einsetzen
= Deckungsbeitrag                       ? €
```

Liegt der Deckungsbeitrag bei rund 50 €, darf die Kundengewinnung **unter 50 €**
kosten, um überhaupt schwarze Null zu sein — Break-even-ROAS also etwa 2,0. Realistisch
für ein Erklärprodukt in DE: CPM 9–15 €, Klickrate 1–2 %, Kaufrate der Seite 1,5–3 %.
Daraus ergibt sich ein CPA von grob 40–90 €. Es ist also **möglich, aber knapp** — und
es steht und fällt zu ungefähr 80 % mit dem Creative, nicht mit Zielgruppen-Einstellungen.

Deshalb: kein großes Startbudget, sondern ein sauber gemessener Test über vier Wochen
und danach eine Entscheidung anhand echter Zahlen.

### Was zusätzlich Ärger machen kann: Meta-Werberichtlinien

Das Produkt ist ein Wellnessprodukt, kein Medizinprodukt — das steht so auch im FAQ,
gut. Zwei Fallen bleiben:

1. **Persönliche Eigenschaften.** Anzeigen dürfen nicht unterstellen, dass die
   betrachtende Person ein Leiden hat. „Leidest du unter Nackenschmerzen?" wird
   abgelehnt. „Der Griff, der über die Schulter reicht" nicht. Merksatz: **über das
   Produkt sprechen, nie über die Person.**
2. **Gesundheitsversprechen.** Keine Heilungs-, Linderungs- oder Vorher-Nachher-Aussagen.
   Beschreiben, was das Gerät *tut* (Perkussion, Reichweite, neun Stufen), nicht, was es
   *bewirkt*.

### Fazit

Sinnvoll: ja. Aber nicht als „Kanal anlegen und Werbung schalten", sondern in der
Reihenfolge **Shop fertigstellen → Messung und Recht → Creatives produzieren →
organischer Grundstock → bezahlter Test → skalieren oder abbrechen**. Wer bei Schritt
fünf anfängt, verbrennt das Budget in der ersten Woche.

---

## 2. Ideen

Neun Konzepte, sortiert nach erwartetem Beitrag. Die ersten drei sind die
Anzeigen-Kandidaten, der Rest trägt den Kanal und das Retargeting.

### A — „Die Stelle" (Haupt-Anzeige)
Split-Screen, dieselbe Person, dieselbe Stelle zwischen den Schulterblättern: links
die gerade Massagepistole, verrenkter Arm, kommt nicht hin. Rechts der Bogengriff,
entspannte Schulter, trifft. Vier Sekunden, kein Ton nötig, Text nur als Einblendung.

*Warum:* Es ist kein Werbeversprechen, sondern eine Demonstration. Das ist der einzige
Anzeigentyp, gegen den Werbemüdigkeit nicht hilft.

### B — Die Reichweiten-Grafik als Animation
Die Rückensilhouette der Landingpage als Video: Zonen leuchten nacheinander auf, während
der Kopf entlangfährt. Kupfer auf Graphit, die Farbwelt der Seite.

*Warum:* Sieht nach niemandem sonst aus. Massagepistolen-Anzeigen sehen alle gleich aus
— weißes Studio, Zeitlupe, Bassmusik. Diese hier sieht aus wie ein Messgerät. Zusätzlich
zahlt die Wiedererkennung auf die Landingpage ein: Wer klickt, findet dieselbe Grafik
interaktiv wieder, und das senkt die Absprungrate.

### C — Der Vier-Aufsätze-Erklärer
Karussell oder Reel, je Aufsatz eine Zone: Kugel für die Fläche, Flach fürs Gesäß,
U-Form links und rechts an der Wirbelsäule vorbei, Spitz punktweise.

*Warum:* Das ist das Retargeting-Asset. Wer die Seite besucht hat und nicht gekauft hat,
zweifelt meist an der Anwendbarkeit, nicht am Preis. Diese Anzeige beantwortet genau das.

### D — „Wo du nicht arbeiten darfst"
Der Sicherheits-FAQ als eigene Serie: nicht auf Knochen und Gelenken, zwei Finger Abstand
zur Wirbelsäule, nicht vorn am Hals, maximal fünfzehn Sekunden auf einem Punkt.

*Warum:* Der stärkste Vertrauensbaustein, den ihr habt, und er ist schon geschrieben.
Ein Anbieter, der Grenzen benennt, unterscheidet sich sofort von der Dropshipping-Konkurrenz,
die nur Versprechen kennt. Solche Beiträge werden außerdem gespeichert und geteilt — beides
zählt für die Reichweite mehr als Likes.

### E — Die Drei-Minuten-Feierabendroutine
Loop-Reel: Schreibtisch, Laptop zu, drei Minuten, drei Zonen, fertig. Wiederholbar als
Format (Routine für Autofahrer, nach dem Sport, morgens).

*Warum:* Verankert das Gerät in einem Anlass. Produkte ohne Anlass werden nicht gekauft,
sondern verglichen.

### F — Umfrage-Story: „Wo kommst du noch selbst hin?"
Rückengrafik als Story mit Umfrage-Sticker über mehreren Zonen.

*Warum:* Kostet zehn Minuten Produktion, liefert Interaktion und nebenbei echte Aussagen,
die als Anzeigentext weiterverwendbar sind.

### G — Testimonials, ab Woche 4
Kein Studio-Testimonial, sondern eine Aussage: „Ich musste immer meinen Mann fragen."
Unabhängigkeit ist der emotionale Kern, nicht Entspannung.

*Warum:* Bei 99,99 € ist Sozialbeweis der Hebel mit dem größten Effekt auf die Kaufrate.
Deshalb ab der ersten Bestellung systematisch Rückmeldungen einsammeln.

### H — „Wann du keine Massagepistole brauchst"
Bewusst gegen das eigene Produkt argumentieren: bei akuten Verletzungen, bei Bandscheibenvorfall,
wenn der Schmerz vom Gelenk kommt.

*Warum:* Hohe Verweildauer, hohe Glaubwürdigkeit, praktisch kein Risiko — die Einschränkungen
stehen ohnehin im FAQ.

### I — Kommentar-zu-DM-Automatisierung
Reel mit Aufruf „Kommentiere REICHWEITE" → automatische Direktnachricht mit dem
Newsletter-Rabattcode (10 % auf die erste Bestellung, den es auf der Seite bereits gibt).
Technisch über ManyChat oder ein vergleichbares Werkzeug.

*Warum:* Verwandelt Reichweite in E-Mail-Adressen, und E-Mail ist der einzige Kanal, den
ihr besitzt. **Nur mit Doppel-Opt-In und Datenschutzhinweis in der DM** — die Seite macht
das mit ihrer Bestätigungsmail bereits richtig, das muss hier genauso laufen.

---

## 3. Plan

### Phase 0 — Verkaufsfähig werden (vor allem anderen)

Ohne diese Phase kein Werbe-Euro. Reihenfolge egal, Vollständigkeit nicht.

- [ ] Shopify-Shop aufsetzen, Produkt anlegen, Preis 99,99 €, Versand DE/AT/CH kostenfrei
- [ ] Alle sechs Platzhalter in `index.html` ersetzen: Produkt-URL (2×), Shop-Domain,
      Impressum, Datenschutz, Widerruf, Lieferzeit (2×)
- [ ] Impressum, Datenschutzerklärung, Widerrufsbelehrung und AGB erstellen —
      rechtlich prüfen lassen, nicht aus einem Generator übernehmen und hoffen
- [ ] Consent-Banner einbauen; Pixel darf erst **nach** Einwilligung feuern
- [ ] Meta Business Suite: Unternehmenskonto, Werbekonto, Zahlungsmethode
- [ ] Meta-Pixel **und** Conversions-API einbinden (Ereignisse: `ViewContent`,
      `AddToCart`, `InitiateCheckout`, `Purchase`)
- [ ] Domain `nackenfrei-shop.de` in Meta verifizieren, Ereignisse priorisieren
- [ ] Testkauf durchführen — mit echter Karte, bis zur Bestätigungsmail
- [ ] Im Ereignis-Manager prüfen: Kommt der Testkauf als `Purchase` an?

**Abnahme:** Ein fremder Mensch kann auf dem Handy bestellen, und der Kauf taucht
im Meta-Ereignis-Manager auf. Erst dann weiter.

### Phase 1 — Kanal und Creatives (Woche 1–2)

- [ ] Instagram-Profi-Konto anlegen, mit der Facebook-Seite und dem Business-Konto verbinden
- [ ] Profil: Name „NackenFrei", Bio mit dem einen Satz, der alles trägt
      („Perkussion für den Teil des Rückens, an den die Hand nicht kommt"), Link zum Shop
- [ ] Highlights anlegen: Aufsätze · Anwendung · Sicherheit · Versand & Rückgabe
- [ ] **Ein Drehtag** für alles: Konzepte A, B, C, D, E — je 3–4 Varianten der ersten drei
      Sekunden, gleicher Inhalt danach. Der Anfang entscheidet, sonst nichts.
- [ ] 12–15 Beiträge vorproduzieren, davon 6 als Anzeigen-Rohmaterial in 9:16 und 4:5
- [ ] Ab jetzt 3–4 Beiträge pro Woche veröffentlichen

**Abnahme:** Das Profil sieht bewohnt aus. Wer von einer Anzeige kommt, findet mindestens
neun Beiträge und vier Highlights.

### Phase 2 — Bezahlter Test (Woche 3–6)

- [ ] **Eine** Kampagne, Ziel Verkäufe, Advantage+ Shopping oder eine breite Zielgruppe
      DE, 30–65 Jahre, alle Geschlechter — **kein** Interessen-Micro-Targeting
- [ ] Platzierungen automatisch (Instagram **und** Facebook, Reels, Feed, Stories)
- [ ] Budget 25 €/Tag, entspricht rund 700 € über vier Wochen
- [ ] 4–6 Creatives gleichzeitig, Konzepte A und B vorne
- [ ] Ab Tag 10 zusätzlich Retargeting auf Seitenbesucher der letzten 30 Tage mit
      Konzept C und G, 8 €/Tag
- [ ] **Nicht täglich eingreifen.** Auswertung montags, sonst nichts anfassen — jede
      Änderung setzt die Lernphase zurück

Zu beobachtende Zahlen, mit Zielwerten:

| Kennzahl | Ziel | Was es bedeutet, wenn sie reißt |
|---|---|---|
| Hook-Rate (3-Sek.-Views ÷ Impressionen) | > 25 % | Die ersten drei Sekunden funktionieren nicht — neue Anfänge, gleicher Rest |
| Ausgehende Klickrate | > 1,0 % | Das Versprechen ist zu schwach oder zu unklar |
| Kaufrate der Seite | > 1,5 % | Anzeige und Seite versprechen Verschiedenes |
| Kosten pro Kauf | < Deckungsbeitrag | Darüber zahlt jeder Verkauf drauf |
| ROAS | > 2,0 | Unter Break-even |

### Phase 3 — Entscheiden (Ende Woche 6)

Drei mögliche Ausgänge, vorab festgelegt, damit die Entscheidung nicht am Bauchgefühl hängt:

- **ROAS über 2,0 →** Budget in 20-%-Schritten alle 3–4 Tage erhöhen, Gewinner-Creative
  in fünf Varianten weiterbauen, AT und CH dazunehmen.
- **ROAS 1,2–2,0 →** nicht skalieren, sondern reparieren. Erst die schwächste Kennzahl
  aus der Tabelle angehen — meist die Hook-Rate, danach die Kaufrate der Seite.
- **ROAS unter 1,2 nach 700 € →** Meta-Werbung für dieses Produkt aussetzen. Dann ist
  entweder der Deckungsbeitrag zu dünn oder die Nachfrage zu klein. Stattdessen: Google
  Shopping und Suchanzeigen auf „Massagepistole für den Rücken selbst" — dort greift man
  bestehende Nachfrage ab, statt sie zu erzeugen, und das ist bei einem Produkt mit
  klarem Suchbegriff oft billiger.

### Aufwand und Kosten (Schätzung)

| Posten | Einmalig | Laufend |
|---|---|---|
| Shop, Recht, Tracking (Phase 0) | 1–2 Wochen Arbeit + Anwaltskosten | — |
| Creative-Produktion | 1 Drehtag | ~4 Std./Woche |
| Kanalpflege | — | ~3 Std./Woche |
| Werbebudget Test | — | ~700 € über 4 Wochen |
| Retargeting | — | ~150 € über 3 Wochen |

---

## 4. Offen

**„Der ellenlange Flow"** aus der Aufgabenstellung ist nicht zugeordnet. Je nach
Bedeutung ändert sich ein Teil des Plans:

- **Ein langer Funnel** (Anzeige → Seite → Rabattcode → E-Mail-Strecke → Kauf): Dann
  gehört zwischen Phase 2 und 3 eine E-Mail-Automatisierung mit fünf bis sieben Mails.
  Der Newsletter-Rabatt auf der Seite ist der vorhandene Einstieg dafür. Bei 99,99 €
  ist das grundsätzlich sinnvoll, aber es lohnt erst, wenn die Anzeigen überhaupt
  Adressen liefern.
- **Ein Automatisierungswerkzeug** (ManyChat, n8n, Flowise): Betrifft Idee I. Dann wird
  die Kommentar-zu-DM-Automatisierung vorgezogen und in Phase 1 eingerichtet.
- **Die lange, schrittweise Arbeitsweise**, mit der die Produktseite entstanden ist:
  Dann ist dieser Plan der erste Schritt, und wir arbeiten ihn Phase für Phase gemeinsam ab.

Ebenfalls offen und für die Rechnung entscheidend: **Einkaufspreis, Versandkosten und
erwartete Retourenquote.** Ohne diese drei Zahlen ist der Deckungsbeitrag geraten — und
damit auch jede Aussage darüber, ob eine Kampagne funktioniert oder nur beschäftigt aussieht.
